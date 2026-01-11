import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Send Push Notification when user receives a notification
 * Triggers when a new notification document is created
 */
export const sendPushNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const notificationId = context.params.notificationId;

    console.log(`Processing notification ${notificationId} for user ${notification.userId}`);

    try {
      // Get user's FCM tokens
      const userDoc = await db.collection('users').doc(notification.userId).get();

      if (!userDoc.exists) {
        console.log('User not found');
        return null;
      }

      const userData = userDoc.data()!;
      const fcmTokens = userData.fcmTokens || [];

      if (fcmTokens.length === 0) {
        console.log('No FCM tokens found for user');
        return null;
      }

      // Check user notification preferences
      if (userData.preferences?.notifications === false) {
        console.log('User has disabled notifications');
        return null;
      }

      // Build notification payload based on type
      const payload = buildNotificationPayload(notification);

      if (!payload) {
        console.log('Could not build notification payload');
        return null;
      }

      // Send to all user's devices
      const messages = fcmTokens.map((token: string) => ({
        token,
        notification: payload.notification,
        data: payload.data,
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      }));

      const response = await admin.messaging().sendEach(messages);

      console.log(
        `Sent ${response.successCount} notifications, ${response.failureCount} failed`
      );

      // Remove invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          (resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered')
        ) {
          invalidTokens.push(fcmTokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await userDoc.ref.update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
        });
        console.log(`Removed ${invalidTokens.length} invalid tokens`);
      }

      return { success: true, sent: response.successCount };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Register FCM Token
 * HTTP callable function to register a device token
 */
export const registerFCMToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { token } = data;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Token is required');
  }

  try {
    const userRef = db.collection('users').doc(context.auth.uid);

    // Add token to user's tokens array (if not already present)
    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
      lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Registered FCM token for user ${context.auth.uid}`);

    return { success: true };
  } catch (error) {
    console.error('Error registering FCM token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to register token');
  }
});

/**
 * Unregister FCM Token
 * HTTP callable function to remove a device token
 */
export const unregisterFCMToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { token } = data;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Token is required');
  }

  try {
    const userRef = db.collection('users').doc(context.auth.uid);

    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
    });

    console.log(`Unregistered FCM token for user ${context.auth.uid}`);

    return { success: true };
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to unregister token');
  }
});

/**
 * Notify on New Expert Post
 * Triggers when a new expert post is created and approved
 */
export const notifyNewExpertPost = functions.firestore
  .document('expertPosts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    const postId = context.params.postId;

    // Wait a moment for moderation to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Re-fetch to get moderation status
    const updatedSnap = await snap.ref.get();
    const updatedPost = updatedSnap.data()!;

    // Only notify if post is approved
    if (!updatedPost.approved) {
      console.log('Post not approved, skipping notification');
      return null;
    }

    try {
      // Get users who follow this expert or are interested in this category
      const interestedUsersSnapshot = await db
        .collection('users')
        .where('preferences.notifications', '==', true)
        .where('interests', 'array-contains', post.category)
        .limit(100)
        .get();

      const notifications: Promise<any>[] = [];

      interestedUsersSnapshot.forEach((doc) => {
        // Don't notify the author
        if (doc.id !== post.authorId) {
          const notification = db.collection('notifications').add({
            userId: doc.id,
            type: 'new_expert_post',
            data: {
              postId,
              authorName: post.authorName,
              title: post.title,
              category: post.category,
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          notifications.push(notification);
        }
      });

      await Promise.all(notifications);
      console.log(`Created ${notifications.length} notifications for new expert post`);

      return { success: true, notificationCount: notifications.length };
    } catch (error) {
      console.error('Error notifying new expert post:', error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Notify on Comment Reply
 * Triggers when someone comments on a post or place
 */
export const notifyCommentReply = functions.firestore
  .document('{collection}/{documentId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const { collection, documentId } = context.params;

    try {
      // Get the parent document to find the author
      const parentDoc = await db.collection(collection).doc(documentId).get();

      if (!parentDoc.exists) {
        console.log('Parent document not found');
        return null;
      }

      const parentData = parentDoc.data()!;
      const authorId = parentData.authorId || parentData.addedBy;

      // Don't notify if user is commenting on their own post
      if (authorId === comment.userId) {
        return null;
      }

      // Create notification for the author
      await db.collection('notifications').add({
        userId: authorId,
        type: 'comment_reply',
        data: {
          collection,
          documentId,
          commentId: snap.id,
          commenterName: comment.userName,
          commentText: comment.text.substring(0, 100),
          documentTitle: parentData.title || parentData.name,
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Notified user ${authorId} of new comment`);

      return { success: true };
    } catch (error) {
      console.error('Error notifying comment reply:', error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Notify Expert Application Status
 * Triggers when expert application status changes
 */
export const notifyApplicationStatus = functions.firestore
  .document('expertApplications/{applicationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const applicationId = context.params.applicationId;

    // Check if status changed
    if (before.status === after.status) {
      return null;
    }

    try {
      let notificationType = '';
      let notificationData: any = {
        applicationId,
      };

      if (after.status === 'approved') {
        notificationType = 'application_approved';
        notificationData.message = 'Uzman başvurunuz onaylandı! 🎉';
      } else if (after.status === 'rejected') {
        notificationType = 'application_rejected';
        notificationData.message = 'Uzman başvurunuz reddedildi.';
        notificationData.reason = after.rejectionReason;
      }

      if (notificationType) {
        await db.collection('notifications').add({
          userId: after.userId,
          type: notificationType,
          data: notificationData,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Notified user ${after.userId} of application status: ${after.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error notifying application status:', error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Notify Nearby Alternative Found
 * HTTP callable function triggered when red result is found
 */
export const notifyNearbyAlternative = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    return { success: true, notificationSent: false }; // Anonymous users don't get notifications
  }

  const { productName, latitude, longitude } = data;

  if (!latitude || !longitude) {
    throw new functions.https.HttpsError('invalid-argument', 'Location is required');
  }

  try {
    // Find nearby places with green status
    const nearbyPlaces = await db
      .collection('places')
      .where('status', '==', 'green')
      .where('location.latitude', '>=', latitude - 0.01)
      .where('location.latitude', '<=', latitude + 0.01)
      .get();

    if (nearbyPlaces.empty) {
      return { success: true, notificationSent: false };
    }

    // Filter by longitude and distance
    const places = nearbyPlaces.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((place: any) => {
        const lngDiff = Math.abs(place.location.longitude - longitude);
        return lngDiff < 0.01;
      })
      .slice(0, 3);

    if (places.length === 0) {
      return { success: true, notificationSent: false };
    }

    // Create notification
    await db.collection('notifications').add({
      userId: context.auth.uid,
      type: 'nearby_alternative',
      data: {
        productName,
        places: places.map((p: any) => ({
          id: p.id,
          name: p.name,
          distance: calculateDistance(latitude, longitude, p.location.latitude, p.location.longitude),
        })),
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Notified user ${context.auth.uid} of ${places.length} nearby alternatives`);

    return { success: true, notificationSent: true, placesCount: places.length };
  } catch (error) {
    console.error('Error notifying nearby alternative:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

/**
 * Build notification payload based on type
 */
function buildNotificationPayload(notification: any): {
  notification: { title: string; body: string };
  data: Record<string, string>;
} | null {
  let title = '';
  let body = '';
  const data: Record<string, string> = {
    type: notification.type,
    notificationId: notification.id || '',
  };

  switch (notification.type) {
    case 'new_expert_post':
      title = 'Yeni Uzman Yazısı';
      body = `${notification.data.authorName}: ${notification.data.title}`;
      data.postId = notification.data.postId;
      break;

    case 'comment_reply':
      title = 'Yeni Yorum';
      body = `${notification.data.commenterName} yazınıza yorum yaptı`;
      data.documentId = notification.data.documentId;
      break;

    case 'application_approved':
      title = 'Başvuru Onaylandı! 🎉';
      body = notification.data.message;
      break;

    case 'application_rejected':
      title = 'Başvuru Durumu';
      body = notification.data.message;
      break;

    case 'nearby_alternative':
      title = 'Yakınınızda Katkısız Alternatif!';
      body = `${notification.data.places.length} yakın mekan bulundu`;
      data.placesCount = String(notification.data.places.length);
      break;

    case 'content_flagged':
      title = 'İçerik Moderasyonu';
      body = 'Gönderiniz inceleme için işaretlendi';
      break;

    case 'post_rejected':
      title = 'Gönderi Reddedildi';
      body = notification.data.reason || 'Gönderiniz yayınlanamadı';
      break;

    case 'new_expert_application':
      title = 'Yeni Uzman Başvurusu';
      body = `${notification.data.applicantName} uzman olmak için başvurdu`;
      data.applicationId = notification.data.applicationId;
      break;

    default:
      console.log(`Unknown notification type: ${notification.type}`);
      return null;
  }

  return {
    notification: { title, body },
    data,
  };
}

/**
 * Calculate distance between two coordinates (in km)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
