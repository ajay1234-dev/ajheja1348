# Firebase Storage Setup Guide

## Issue: Profile Pictures Not Saving

If you're experiencing issues with profile picture uploads, it's likely because Firebase Storage is not enabled in your Firebase project.

## Solution: Enable Firebase Storage

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **medanalysis-471e2**

### Step 2: Enable Firebase Storage

1. In the left sidebar, click on **Storage** under "Build"
2. Click **Get Started**
3. Review the security rules (see below)
4. Click **Done**

### Step 3: Configure Storage Security Rules

Replace the default rules with these production-ready rules:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures - authenticated users can upload/update their own
    match /profile-pictures/{userId}_{timestamp}.{extension} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // Medical reports - authenticated users can upload their own
    match /uploads/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 4: Verify Storage Bucket

Your storage bucket should be: `medanalysis-471e2.appspot.com`

This is already configured in your code:

```typescript
admin.initializeApp({
  credential: credential,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`, // ✅ Configured
});
```

### Step 5: Test the Setup

After enabling Storage:

1. **Restart your development server**:

   ```bash
   npm run dev
   ```

2. **Check the console logs**:
   You should see:

   ```
   ✅ Firebase Storage is accessible and ready
   ```

3. **Upload a profile picture**:

   - Go to Profile page
   - Click "Upload Picture"
   - Select an image (JPG, PNG, WEBP)
   - Click "Save Picture"

4. **Verify in Firebase Console**:
   - Go to Storage in Firebase Console
   - You should see a folder `profile-pictures/`
   - Your uploaded image should be there

## Troubleshooting

### Error: "Firebase Storage is not configured"

**Cause**: Storage hasn't been initialized in Firebase Console

**Solution**: Follow Step 2 above to enable Storage

### Error: "Permission denied"

**Cause**: Storage security rules are too restrictive

**Solution**: Update security rules as shown in Step 3

### Error: "Bucket does not exist"

**Cause**: Storage bucket name mismatch

**Solution**:

1. Check your bucket name in Firebase Console
2. Update `.env` if needed:
   ```
   FIREBASE_PROJECT_ID=medanalysis-471e2
   ```

### Profile Picture Not Showing in Doctor Dashboard

**Cause**: The `profilePictureUrl` field might not be included in API responses

**Solution**: Already fixed! The following endpoints now include `profilePictureUrl`:

- ✅ `/api/doctor/patients` - Patient list
- ✅ `/api/doctor/patient/:id/reports` - Patient details
- ✅ `/api/doctor/shared-reports` - Shared reports

## Testing Checklist

- [ ] Firebase Storage enabled in Console
- [ ] Security rules configured
- [ ] Server restarted
- [ ] Console shows "✅ Firebase Storage is accessible and ready"
- [ ] Profile picture upload successful
- [ ] Picture visible in Firebase Storage console
- [ ] Picture URL saved in Firestore user document
- [ ] Picture displays in Profile page
- [ ] Picture displays in Doctor Dashboard patient list
- [ ] Picture displays in Doctor Dashboard patient details modal

## Support

If you continue to have issues:

1. **Check server logs** for detailed error messages
2. **Check Firebase Console** → Storage → Files to see if images are uploaded
3. **Check Firestore** → patients/doctors collection to see if `profilePictureUrl` is saved
4. **Check browser console** for any network errors

## Alternative: Using Firebase Storage Emulator (Development Only)

For local development without setting up cloud storage:

1. Install Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Initialize emulators:

   ```bash
   firebase init emulators
   ```

3. Select Storage emulator

4. Update `.env`:

   ```
   FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
   ```

5. Run emulator:
   ```bash
   firebase emulators:start
   ```

**Note**: This is for development only. Production should use cloud storage.
