# Katkısız Firebase Cloud Functions

Firebase Cloud Functions for the Katkısız mobile application. These functions handle backend logic for OCR analysis, expert verification, content moderation, and push notifications.

## Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud Vision API credentials
- Firebase project setup

## Installation

```bash
cd firebase/functions
npm install
```

## Functions Overview

### 1. OCR Analysis (`ocr.ts`)

**analyzeProductImage** (Storage Trigger)
- Automatically triggered when an image is uploaded to Firebase Storage
- Performs OCR using Google Cloud Vision API
- Extracts ingredients and analyzes E-numbers
- Saves analysis to Firestore

**analyzeImageHTTP** (HTTP Callable)
- Client-callable function for immediate analysis
- Takes image URL as input
- Returns full analysis with traffic light status (🟢🟡🔴)

**Usage:**
```typescript
const analyzeImage = httpsCallable(functions, 'analyzeImageHTTP');
const result = await analyzeImage({ imageUrl: 'gs://...' });
// Returns: { success, fullText, ingredients, additives, status, recommendations }
```

### 2. Expert Verification (`expert.ts`)

**onExpertApplicationCreated** (Firestore Trigger)
- Triggered when new expert application is submitted
- Verifies academic article URL
- Sends notifications to admins

**approveExpertApplication** (HTTP Callable)
- Admin-only function to approve applications
- Updates user role to 'expert'
- Sets custom auth claims
- Sends approval email

**rejectExpertApplication** (HTTP Callable)
- Admin-only function to reject applications
- Sends rejection email with reason

**Usage:**
```typescript
const approve = httpsCallable(functions, 'approveExpertApplication');
await approve({ applicationId: 'abc123' });
```

### 3. Content Moderation (`moderation.ts`)

**moderateExpertPost** (Firestore Trigger)
- Auto-moderates new expert posts
- Checks for profanity, spam, misinformation
- Flags suspicious content for admin review

**moderateComment** (Firestore Trigger)
- Auto-moderates comments on posts and places
- Hides inappropriate comments automatically

**moderatePlace** (Firestore Trigger)
- Checks for duplicate locations
- Flags excessive submissions from same user

**reportContent** (HTTP Callable)
- Allows users to report inappropriate content
- Creates report for admin review

**Usage:**
```typescript
const report = httpsCallable(functions, 'reportContent');
await report({
  contentType: 'expert_post',
  contentId: 'post123',
  reason: 'spam',
  description: 'This is spam content'
});
```

### 4. Push Notifications (`notifications.ts`)

**sendPushNotification** (Firestore Trigger)
- Triggered when notification document is created
- Sends FCM push notification to user's devices
- Handles invalid token cleanup

**registerFCMToken** (HTTP Callable)
- Registers device FCM token for user
- Allows multiple devices per user

**unregisterFCMToken** (HTTP Callable)
- Removes FCM token when user logs out

**notifyNewExpertPost** (Firestore Trigger)
- Notifies interested users of new expert posts

**notifyCommentReply** (Firestore Trigger)
- Notifies post author of new comments

**notifyApplicationStatus** (Firestore Trigger)
- Notifies applicant when status changes

**notifyNearbyAlternative** (HTTP Callable)
- Notifies user of nearby additive-free alternatives

**Usage:**
```typescript
// Register token
const register = httpsCallable(functions, 'registerFCMToken');
await register({ token: fcmToken });

// Notify alternatives
const notify = httpsCallable(functions, 'notifyNearbyAlternative');
await notify({
  productName: 'Coca Cola',
  latitude: 41.0082,
  longitude: 28.9784
});
```

## Environment Setup

### Google Cloud Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Vision API
3. Create service account
4. Download credentials JSON
5. Set environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

Or for Firebase Functions:
```bash
firebase functions:config:set google.credentials="$(cat credentials.json)"
```

### Firebase Configuration

Set Firebase admin credentials:
```bash
firebase functions:config:set firebase.project_id="your-project-id"
```

## Development

### Local Testing

```bash
# Start Firebase emulators
firebase emulators:start --only functions,firestore,storage

# Or with specific functions
firebase emulators:start --only functions
```

### Build

```bash
npm run build
```

### Deploy

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:analyzeImageHTTP

# Deploy multiple functions
firebase deploy --only functions:analyzeImageHTTP,functions:approveExpertApplication
```

### Logs

```bash
# View all logs
firebase functions:log

# View specific function logs
firebase functions:log --only analyzeImageHTTP

# Stream logs in real-time
firebase functions:log --follow
```

## Security Rules

### Firestore Rules

Required security rules for functions to work:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Expert applications - only authenticated users can create
    match /expertApplications/{applicationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.token.admin == true;
    }

    // Expert posts - only experts can create
    match /expertPosts/{postId} {
      allow read: if true;
      allow create: if request.auth != null &&
                      request.auth.token.role == 'expert';
      allow update: if request.auth.uid == resource.data.authorId;
    }

    // Places - authenticated users can add
    match /places/{placeId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.addedBy;
    }

    // Notifications - users can only read their own
    match /notifications/{notificationId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow update: if request.auth.uid == resource.data.userId;
    }

    // Reports - authenticated users can create
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read: if request.auth.token.admin == true;
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Product images
    match /products/{userId}/{imageId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Expert post images
    match /expertPosts/{postId}/{imageId} {
      allow read: if true;
      allow write: if request.auth != null &&
                     request.auth.token.role == 'expert';
    }
  }
}
```

## Function Dependencies

```
analyzeProductImage (Storage) → analyzeAdditives → Firestore (analyses collection)
                                                  ↓
                                            sendPushNotification

onExpertApplicationCreated → verifyAcademicArticle → notifyAdmins
                                                    ↓
                                              sendPushNotification

approveExpertApplication → Auth (setCustomUserClaims)
                         → Firestore (users collection)
                         → sendEmail
                         ↓
                   notifyApplicationStatus
                         ↓
                   sendPushNotification

moderateExpertPost → moderateContent → notifyAdmins (if flagged)
                                     ↓
                               notifyUser (if rejected)

notifyNewExpertPost → sendPushNotification (for interested users)
```

## Data Flow

### Scan Product Flow
1. User takes photo → Upload to Storage
2. `analyzeProductImage` triggered automatically
3. OCR extracts text → Analyzes E-numbers
4. Result saved to Firestore
5. If RED status → Client calls `notifyNearbyAlternative`
6. `sendPushNotification` sends alert to user

### Expert Application Flow
1. User submits application → Firestore
2. `onExpertApplicationCreated` triggered
3. Article URL verified
4. Admin reviews → Calls `approveExpertApplication`
5. User role updated + custom claims set
6. `notifyApplicationStatus` triggered
7. Email + push notification sent

### Content Moderation Flow
1. User creates post → Firestore
2. `moderateExpertPost` triggered immediately
3. Content analyzed for violations
4. If flagged → `notifyAdmins` called
5. If approved → `notifyNewExpertPost` triggered
6. Interested users receive push notifications

## Cost Estimation

### Google Cloud Vision API
- First 1,000 requests/month: **Free**
- Additional requests: **$1.50 per 1,000**
- Estimated: 10K scans/month = **~$13.50/month**

### Firebase Functions
- First 2M invocations/month: **Free**
- First 400K GB-seconds/month: **Free**
- Estimated cost: **$5-20/month** (depends on usage)

### Firebase Cloud Messaging (FCM)
- **Free** for all notification volumes

**Total Estimated Cost: $20-35/month** (for ~10K active users)

## Troubleshooting

### "Permission denied" errors
- Check Firestore security rules
- Verify custom claims are set correctly
- Ensure user is authenticated

### OCR not detecting text
- Check image quality (min 300x300px)
- Ensure good lighting in photo
- Verify Vision API is enabled
- Check API quota limits

### Push notifications not received
- Verify FCM token is registered
- Check user notification preferences
- Ensure app has notification permissions
- Check FCM console for delivery status

### Function timeout
- Default timeout: 60 seconds
- Increase if needed:
```typescript
export const myFunction = functions
  .runWith({ timeoutSeconds: 300 })
  .https.onCall(async (data) => { ... });
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Start emulators
firebase emulators:start

# Run integration tests
npm run test:integration
```

### Manual Testing

Use Firebase Console or Postman to test callable functions:

```bash
# Get function URL
firebase functions:list

# Call function
curl -X POST https://your-region-your-project.cloudfunctions.net/analyzeImageHTTP \
  -H "Content-Type: application/json" \
  -d '{"data": {"imageUrl": "gs://..."}}'
```

## Monitoring

### Firebase Console
- View function logs
- Check invocation counts
- Monitor errors and performance

### Cloud Monitoring
- Set up alerts for errors
- Track latency and success rates
- Monitor API quota usage

## Support

For issues or questions:
1. Check Firebase Functions logs: `firebase functions:log`
2. Review error traces in Firebase Console
3. Check Google Cloud Vision API quota
4. Verify Firestore/Storage security rules

## License

MIT
