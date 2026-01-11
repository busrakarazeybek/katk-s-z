import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Moderate Expert Posts
 * Triggers when a new expert post is created
 * Checks for inappropriate content and spam
 */
export const moderateExpertPost = functions.firestore
  .document('expertPosts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    const postId = context.params.postId;

    console.log(`Moderating expert post: ${postId}`);

    try {
      const moderationResult = await moderateContent({
        title: post.title || '',
        content: post.content || '',
        authorId: post.authorId,
      });

      // Update post with moderation result
      await snap.ref.update({
        moderation: {
          checked: true,
          checkedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: moderationResult.status,
          score: moderationResult.score,
          flags: moderationResult.flags,
        },
        approved: moderationResult.status === 'approved',
      });

      // If flagged, notify admins
      if (moderationResult.status === 'flagged') {
        await notifyAdmins('content_flagged', {
          type: 'expert_post',
          postId,
          authorId: post.authorId,
          authorName: post.authorName,
          title: post.title,
          flags: moderationResult.flags,
          reason: moderationResult.reason,
        });
      }

      // If rejected, notify author
      if (moderationResult.status === 'rejected') {
        await notifyUser(post.authorId, {
          type: 'post_rejected',
          postId,
          reason: moderationResult.reason,
        });
      }

      console.log(`Post ${postId} moderation complete: ${moderationResult.status}`);

      return { success: true, status: moderationResult.status };
    } catch (error) {
      console.error('Error moderating post:', error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Moderate Comments
 * Triggers when a comment is added to expert posts or places
 */
export const moderateComment = functions.firestore
  .document('{collection}/{documentId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const { collection, documentId, commentId } = context.params;

    console.log(`Moderating comment ${commentId} on ${collection}/${documentId}`);

    try {
      const moderationResult = await moderateContent({
        content: comment.text || '',
        authorId: comment.userId,
      });

      // Update comment with moderation result
      await snap.ref.update({
        moderation: {
          checked: true,
          checkedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: moderationResult.status,
          score: moderationResult.score,
        },
        approved: moderationResult.status === 'approved',
      });

      // If flagged or rejected, hide the comment
      if (moderationResult.status !== 'approved') {
        await snap.ref.update({
          hidden: true,
        });

        // Notify admins if flagged
        if (moderationResult.status === 'flagged') {
          await notifyAdmins('comment_flagged', {
            commentId,
            documentId,
            collection,
            userId: comment.userId,
            userName: comment.userName,
            flags: moderationResult.flags,
            reason: moderationResult.reason,
          });
        }
      }

      console.log(`Comment ${commentId} moderation complete: ${moderationResult.status}`);

      return { success: true, status: moderationResult.status };
    } catch (error) {
      console.error('Error moderating comment:', error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Report Content
 * HTTP callable function for users to report inappropriate content
 */
export const reportContent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to report content'
    );
  }

  const { contentType, contentId, reason, description } = data;

  if (!contentType || !contentId || !reason) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Content type, ID, and reason are required'
    );
  }

  try {
    // Create a report document
    const reportRef = await db.collection('reports').add({
      reportedBy: context.auth.uid,
      contentType, // 'expert_post', 'comment', 'place', etc.
      contentId,
      reason, // 'spam', 'harassment', 'inappropriate', 'misinformation'
      description: description || '',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify admins
    await notifyAdmins('content_reported', {
      reportId: reportRef.id,
      reportedBy: context.auth.uid,
      contentType,
      contentId,
      reason,
      description,
    });

    console.log(`Content reported: ${contentType}/${contentId}`);

    return { success: true, reportId: reportRef.id };
  } catch (error) {
    console.error('Error reporting content:', error);
    throw new functions.https.HttpsError('internal', 'Failed to report content');
  }
});

/**
 * Moderate Place Submissions
 * Triggers when a new place is added
 */
export const moderatePlace = functions.firestore
  .document('places/{placeId}')
  .onCreate(async (snap, context) => {
    const place = snap.data();
    const placeId = context.params.placeId;

    console.log(`Moderating place: ${placeId}`);

    try {
      // Check for suspicious patterns
      const flags: string[] = [];
      let status: 'approved' | 'flagged' = 'approved';

      // Check for excessive places from same user
      const userPlacesSnapshot = await db
        .collection('places')
        .where('addedBy', '==', place.addedBy)
        .get();

      if (userPlacesSnapshot.size > 20) {
        flags.push('excessive_submissions');
        status = 'flagged';
      }

      // Check for duplicate locations
      const nearbyPlaces = await db
        .collection('places')
        .where('location.latitude', '>=', place.location.latitude - 0.001)
        .where('location.latitude', '<=', place.location.latitude + 0.001)
        .get();

      const duplicates = nearbyPlaces.docs.filter((doc) => {
        const data = doc.data();
        const latDiff = Math.abs(data.location.latitude - place.location.latitude);
        const lngDiff = Math.abs(data.location.longitude - place.location.longitude);
        return latDiff < 0.0001 && lngDiff < 0.0001 && doc.id !== placeId;
      });

      if (duplicates.length > 0) {
        flags.push('potential_duplicate');
        status = 'flagged';
      }

      // Update place with moderation result
      await snap.ref.update({
        moderation: {
          checked: true,
          checkedAt: admin.firestore.FieldValue.serverTimestamp(),
          status,
          flags,
        },
        approved: status === 'approved',
      });

      // Notify admins if flagged
      if (status === 'flagged') {
        await notifyAdmins('place_flagged', {
          placeId,
          placeName: place.name,
          addedBy: place.addedBy,
          flags,
        });
      }

      console.log(`Place ${placeId} moderation complete: ${status}`);

      return { success: true, status };
    } catch (error) {
      console.error('Error moderating place:', error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Main content moderation logic
 */
interface ModerationInput {
  title?: string;
  content: string;
  authorId: string;
}

interface ModerationResult {
  status: 'approved' | 'flagged' | 'rejected';
  score: number;
  flags: string[];
  reason?: string;
}

async function moderateContent(input: ModerationInput): Promise<ModerationResult> {
  const flags: string[] = [];
  let score = 0;

  // Combine text for analysis
  const text = `${input.title || ''} ${input.content}`.toLowerCase();

  // Check for profanity (Turkish and English)
  const profanityList = [
    'amk',
    'mk',
    'aq',
    'orospu',
    'piç',
    'siktir',
    'göt',
    'fuck',
    'shit',
    'damn',
    'bitch',
  ];

  for (const word of profanityList) {
    if (text.includes(word)) {
      flags.push('profanity');
      score += 50;
      break;
    }
  }

  // Check for spam patterns
  const spamPatterns = [
    /(\w+)\1{3,}/g, // Repeated characters (e.g., "aaaaa")
    /https?:\/\//g, // URLs
    /\d{10,}/g, // Long numbers (phone numbers)
    /(satın al|buy now|click here|tıkla)/gi, // Spam keywords
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      flags.push('spam_pattern');
      score += 30;
      break;
    }
  }

  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 20) {
    flags.push('excessive_caps');
    score += 20;
  }

  // Check for medical misinformation keywords
  const misinformationKeywords = [
    'kanser tedavisi',
    'kesin çözüm',
    'garantili iyileşme',
    'mucize',
    'miracle cure',
    'guaranteed',
  ];

  for (const keyword of misinformationKeywords) {
    if (text.includes(keyword)) {
      flags.push('potential_misinformation');
      score += 40;
      break;
    }
  }

  // Check user history for pattern abuse
  const userContentSnapshot = await db
    .collection('expertPosts')
    .where('authorId', '==', input.authorId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  if (userContentSnapshot.size > 5) {
    const recentPosts = userContentSnapshot.docs.map((doc) => doc.data());
    const similarContent = recentPosts.filter(
      (post) => post.content && post.content.substring(0, 100) === input.content.substring(0, 100)
    );

    if (similarContent.length > 2) {
      flags.push('repetitive_content');
      score += 30;
    }
  }

  // Determine final status
  let status: 'approved' | 'flagged' | 'rejected' = 'approved';
  let reason = '';

  if (score >= 70) {
    status = 'rejected';
    reason = 'İçerik otomatik moderasyon kurallarını ihlal ediyor.';
  } else if (score >= 40) {
    status = 'flagged';
    reason = 'İçerik manuel inceleme için işaretlendi.';
  }

  return {
    status,
    score,
    flags,
    reason: reason || undefined,
  };
}

/**
 * Notify admins of flagged content
 */
async function notifyAdmins(type: string, data: any) {
  try {
    const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();

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
    console.log(`Sent ${notifications.length} admin notifications for ${type}`);
  } catch (error) {
    console.error('Error sending admin notifications:', error);
  }
}

/**
 * Notify user about content status
 */
async function notifyUser(userId: string, data: any) {
  try {
    await db.collection('notifications').add({
      userId,
      type: data.type,
      data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Sent notification to user ${userId}`);
  } catch (error) {
    console.error('Error sending user notification:', error);
  }
}
