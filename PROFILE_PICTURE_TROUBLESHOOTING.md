# Profile Picture Upload Troubleshooting Guide

## Error: "Unexpected token '<', "<!DOCTYPE"... is not valid JSON"

This error means the server is returning an HTML error page instead of JSON. Here are the steps to fix it:

### Step 1: Restart the Development Server

The code has been updated, so you need to restart:

1. **Stop the current server**:

   - Go to the terminal where `npm run dev` is running
   - Press `Ctrl+C` to stop

2. **Start the server again**:

   ```bash
   npm run dev
   ```

3. **Wait for the success message**:
   ```
   ✅ Firebase Admin initialized
   ✅ Firestore is accessible and ready
   serving on port 5000
   ```

### Step 2: Check Server Logs

When you try to upload a profile picture, watch the server terminal for these messages:

**Success (Base64 storage)**:

```
📸 Profile picture upload started
✅ File received: { originalname, mimetype, size }
✅ User found: your@email.com
⚠️ Firebase Storage not available, using base64 storage
✅ Base64 data URL created (length: 50000 chars)
✅ User profile updated with new picture URL
POST /api/profile/picture 200 in 150ms
```

**Success (Firebase Storage)**:

```
📸 Profile picture upload started
✅ File received: { originalname, mimetype, size }
✅ User found: your@email.com
✅ Firebase Storage is available, attempting upload...
📤 Uploading file to Firebase Storage: userId_timestamp.jpg
✅ Bucket name: medanalysis-471e2.appspot.com
✅ File uploaded to Firebase Storage
✅ File made public
✅ Firebase Storage URL generated: https://storage.googleapis.com/...
✅ User profile updated with new picture URL
POST /api/profile/picture 200 in 2500ms
```

**Error**:

```
❌ Multer error: Invalid file type
POST /api/profile/picture 400 in 5ms
```

### Step 3: Clear Browser Cache

Sometimes the browser caches the old error response:

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Refresh the page (F5)
5. Try uploading again

### Step 4: Check File Requirements

Make sure your image meets these requirements:

- ✅ **File type**: JPG, PNG, WEBP only
- ✅ **File size**: Under 5MB
- ✅ **File format**: Valid image file (not corrupted)

### Step 5: Test with Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Try uploading a profile picture
4. Look for the `/api/profile/picture` request
5. Click on it and check:
   - **Status Code**: Should be 200 (success) or 400/500 (error)
   - **Response**: Should be JSON, not HTML
   - **Request Headers**: Should include `Content-Type: multipart/form-data`

### Step 6: Manual API Test

You can test the endpoint directly with curl:

```bash
# Get your session cookie from browser DevTools
curl -X POST http://localhost:5000/api/profile/picture \
  -H "Cookie: sessionId=YOUR_SESSION_ID" \
  -F "profilePicture=@/path/to/your/image.jpg"
```

Expected response:

```json
{
  "message": "Profile picture uploaded successfully",
  "profilePictureUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Common Issues and Solutions

#### Issue 1: Server Not Restarted

**Symptom**: Still getting HTML error page after code changes

**Solution**:

- Stop server (Ctrl+C)
- Start server (`npm run dev`)
- Wait for "serving on port 5000"

#### Issue 2: Session Expired

**Symptom**: "Authentication required" error

**Solution**:

- Log out
- Log in again
- Try uploading again

#### Issue 3: File Too Large

**Symptom**: "File upload failed" or network timeout

**Solution**:

- Resize image to under 5MB
- Use a compressed format (JPG instead of PNG)
- Try a different image

#### Issue 4: Invalid File Type

**Symptom**: "Invalid file type" error

**Solution**:

- Only use JPG, PNG, or WEBP images
- Check file extension is correct
- Re-save image in correct format

#### Issue 5: Firestore Not Initialized

**Symptom**: "Failed to update profile" error in console

**Solution**:

- Check Firebase configuration in `.env`
- Verify `firebase-service-account.json` exists
- Check Firestore is enabled in Firebase Console

### What's Been Fixed

1. ✅ **Automatic fallback to base64 storage** - Works without Firebase Storage
2. ✅ **Comprehensive error logging** - See exactly what's failing
3. ✅ **Better error handling** - Always returns JSON, never HTML
4. ✅ **Multer error catching** - File validation errors handled properly
5. ✅ **Content-type checking on client** - Graceful handling of non-JSON responses

### Expected Behavior After Fix

1. **Upload Button** → Opens file picker
2. **Select Image** → Preview appears immediately
3. **Click "Save Picture"** → Shows loading state
4. **Success** → "Profile Picture Updated" toast appears
5. **Profile Page** → Picture displays
6. **Doctor Dashboard** → Picture visible in patient list (if assigned to doctor)

### Still Having Issues?

If you're still seeing the error after:

- ✅ Restarting the server
- ✅ Clearing browser cache
- ✅ Using a valid image file
- ✅ Checking server logs

Then please:

1. Copy the **exact error message** from browser console
2. Copy the **server logs** from terminal
3. Check if `/api/profile/picture` appears in Network tab
4. Note the **Status Code** of the request

This information will help diagnose the specific issue.
