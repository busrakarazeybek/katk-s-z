import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

/**
 * Expert Application Verification
 * Triggers when a new expert application is submitted
 * Verifies article URL and sends notification to admins
 */
export const onExpertApplicationCreated = functions.firestore
  .document('expertApplications/{applicationId}')
  .onCreate(async (snap, context) => {
    const application = snap.data();
    const applicationId = context.params.applicationId;

    console.log(`New expert application: ${applicationId}`);

    try {
      // Verify article URL
      const verification = await verifyAcademicArticle(application.articleUrl);

      // Update application with verification result
      await snap.ref.update({
        verification: {
          valid: verification.valid,
          checkedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: verification.source,
          error: verification.error,
        },
        autoVerified: verification.valid,
      });

      // Send notification to admins
      await notifyAdmins('new_expert_application', {
        applicationId,
        applicantName: application.fullName,
        applicantEmail: application.email,
        specialization: application.specialization,
        institution: application.institution,
        articleUrl: application.articleUrl,
        autoVerified: verification.valid,
      });

      console.log(`Application ${applicationId} processed. Valid: ${verification.valid}`);

      return { success: true, verified: verification.valid };
    } catch (error) {
      console.error('Error processing expert application:', error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Approve Expert Application
 * HTTP callable function for admin to approve applications
 */
export const approveExpertApplication = functions.https.onCall(async (data, context) => {
  // Check if user is admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can approve expert applications'
    );
  }

  const { applicationId } = data;

  if (!applicationId) {
    throw new functions.https.HttpsError('invalid-argument', 'Application ID is required');
  }

  try {
    const applicationRef = db.collection('expertApplications').doc(applicationId);
    const applicationSnap = await applicationRef.get();

    if (!applicationSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Application not found');
    }

    const application = applicationSnap.data()!;

    // Update application status
    await applicationRef.update({
      status: 'approved',
      approvedBy: context.auth.uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user role to expert
    const userRef = db.collection('users').doc(application.userId);
    await userRef.update({
      role: 'expert',
      expertProfile: {
        verified: true,
        articleUrl: application.articleUrl,
        specialization: application.specialization,
        institution: application.institution,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    // Set custom claims for authentication
    await admin.auth().setCustomUserClaims(application.userId, {
      role: 'expert',
    });

    // Send email notification to applicant
    await sendEmail(application.email, {
      subject: 'Uzman Başvurunuz Onaylandı!',
      body: `
        Merhaba ${application.fullName},

        Katkısız uygulaması için yaptığınız uzman başvurunuz onaylandı!

        Artık uzman olarak içerik paylaşabilir ve kullanıcılara bilimsel
        bilgiler sunabilirsiniz.

        Uygulamaya giriş yaparak uzman paneline erişebilirsiniz.

        Teşekkürler,
        Katkısız Ekibi
      `,
    });

    console.log(`Expert application ${applicationId} approved`);

    return { success: true, message: 'Application approved successfully' };
  } catch (error) {
    console.error('Error approving application:', error);
    throw new functions.https.HttpsError('internal', 'Failed to approve application');
  }
});

/**
 * Reject Expert Application
 */
export const rejectExpertApplication = functions.https.onCall(async (data, context) => {
  // Check if user is admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can reject expert applications'
    );
  }

  const { applicationId, reason } = data;

  if (!applicationId) {
    throw new functions.https.HttpsError('invalid-argument', 'Application ID is required');
  }

  try {
    const applicationRef = db.collection('expertApplications').doc(applicationId);
    const applicationSnap = await applicationRef.get();

    if (!applicationSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Application not found');
    }

    const application = applicationSnap.data()!;

    // Update application status
    await applicationRef.update({
      status: 'rejected',
      rejectedBy: context.auth.uid,
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason || 'Not specified',
    });

    // Send email notification to applicant
    await sendEmail(application.email, {
      subject: 'Uzman Başvurunuz Hakkında',
      body: `
        Merhaba ${application.fullName},

        Üzgünüz, Katkısız uygulaması için yaptığınız uzman başvurunuz
        şu an için onaylanamamıştır.

        ${reason ? `Sebep: ${reason}` : ''}

        Eksik veya hatalı bilgiler varsa düzelttikten sonra tekrar
        başvurabilirsiniz.

        Teşekkürler,
        Katkısız Ekibi
      `,
    });

    console.log(`Expert application ${applicationId} rejected`);

    return { success: true, message: 'Application rejected' };
  } catch (error) {
    console.error('Error rejecting application:', error);
    throw new functions.https.HttpsError('internal', 'Failed to reject application');
  }
});

/**
 * Verify Academic Article URL
 */
async function verifyAcademicArticle(articleUrl: string): Promise<{
  valid: boolean;
  source?: string;
  error?: string;
}> {
  try {
    const supportedDomains = [
      'pubmed.ncbi.nlm.nih.gov',
      'scholar.google',
      'researchgate.net',
      'sciencedirect.com',
      'nature.com',
      'ncbi.nlm.nih.gov/pmc',
      'doi.org',
      'springer.com',
      'wiley.com',
      'elsevier.com',
    ];

    const urlObj = new URL(articleUrl);
    const hostname = urlObj.hostname;

    // Check if domain is supported
    const isSupported = supportedDomains.some((domain) =>
      hostname.includes(domain)
    );

    if (!isSupported) {
      return {
        valid: false,
        error: 'Desteklenmeyen kaynak. Lütfen bilimsel bir veritabanından URL girin.',
      };
    }

    // Try to fetch the URL to verify it exists
    try {
      const response = await axios.head(articleUrl, {
        timeout: 10000,
        maxRedirects: 5,
      });

      if (response.status === 200) {
        return {
          valid: true,
          source: hostname,
        };
      }
    } catch (fetchError) {
      console.warn('Could not fetch article URL:', fetchError);
      // Still mark as valid if domain is supported
      return {
        valid: true,
        source: hostname,
      };
    }

    return {
      valid: true,
      source: hostname,
    };
  } catch (error) {
    console.error('Error verifying article:', error);
    return {
      valid: false,
      error: 'Geçersiz URL formatı',
    };
  }
}

/**
 * Send notification to admins
 */
async function notifyAdmins(type: string, data: any) {
  try {
    // Get all admin users
    const adminsSnapshot = await db
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    const notifications: Promise<any>[] = [];

    adminsSnapshot.forEach((doc) => {
      const notification = db.collection('notifications').add({
        userId: doc.id,
        type,
        data,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      notifications.push(notification);
    });

    await Promise.all(notifications);
    console.log(`Sent ${notifications.length} admin notifications`);
  } catch (error) {
    console.error('Error sending admin notifications:', error);
  }
}

/**
 * Send email (placeholder - integrate with SendGrid, Mailgun, etc.)
 */
async function sendEmail(to: string, content: { subject: string; body: string }) {
  // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
  console.log(`[EMAIL] To: ${to}`);
  console.log(`[EMAIL] Subject: ${content.subject}`);
  console.log(`[EMAIL] Body: ${content.body}`);

  // For now, just log to console
  // In production, use a service like SendGrid:
  // await sgMail.send({ to, from: 'noreply@katkisiz.app', subject, html: body });
}
