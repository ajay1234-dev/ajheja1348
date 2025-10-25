# 🚀 AWS S3 Setup Guide for MediMindAI Profile Pictures

## Complete Step-by-Step Guide to Set Up AWS S3

This guide will walk you through setting up AWS S3 for storing profile pictures in your MediMindAI application.

---

## 📋 Prerequisites

- AWS Account (free tier available)
- Access to your project's `.env` file
- Terminal/Command Prompt access

---

## Step 1: Create AWS Account (if you don't have one)

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click **"Create an AWS Account"**
3. Follow the registration process
4. You'll get 12 months of free tier access including:
   - 5 GB S3 storage
   - 20,000 GET requests
   - 2,000 PUT requests per month

---

## Step 2: Create an S3 Bucket

### 2.1 Access AWS S3 Console

1. Log into [AWS Console](https://console.aws.amazon.com)
2. In the search bar at the top, type **"S3"**
3. Click on **"S3"** service

### 2.2 Create New Bucket

1. Click the **"Create bucket"** button (orange button on the right)

2. **Bucket Configuration:**

   **General Configuration:**

   - **Bucket name**: Choose a globally unique name

     - Example: `medimindai-profile-pictures`
     - Example: `your-name-medical-app-pics`
     - Must be lowercase, no spaces, only letters, numbers, and hyphens
     - **Write down this name** - you'll need it later!

   - **AWS Region**: Choose closest to your users
     - US East (N. Virginia): `us-east-1` ← **Recommended for USA**
     - EU (Ireland): `eu-west-1` ← Recommended for Europe
     - Asia Pacific (Singapore): `ap-southeast-1` ← Recommended for Asia
     - **Write down the region code** (e.g., `us-east-1`)

   **Object Ownership:**

   - Select **"ACLs enabled"**
   - Choose **"Bucket owner preferred"**

   **Block Public Access settings:**

   - ⚠️ **UNCHECK** the box that says "Block all public access"
   - ⚠️ Check the acknowledgment box that appears
   - This allows profile pictures to be publicly viewable (required!)

   **Bucket Versioning:**

   - Leave as **"Disable"** (optional, can enable later if needed)

   **Tags:**

   - Skip (optional)

   **Default encryption:**

   - Leave as **"Server-side encryption with Amazon S3 managed keys (SSE-S3)"**

   **Bucket Key:**

   - Leave as **"Enable"**

3. Click **"Create bucket"** at the bottom

---

## Step 3: Configure Bucket Permissions

### 3.1 Set Bucket Policy (Allow Public Read Access)

1. Click on your newly created bucket name
2. Go to the **"Permissions"** tab
3. Scroll down to **"Bucket policy"** section
4. Click **"Edit"** button

5. **Copy and paste this policy** (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/profile-pictures/*"
    }
  ]
}
```

**Example (if your bucket is named `medimindai-profile-pictures`):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::medimindai-profile-pictures/profile-pictures/*"
    }
  ]
}
```

6. Click **"Save changes"**

### 3.2 Configure CORS (Allow Web Uploads)

1. Still in the **"Permissions"** tab
2. Scroll to **"Cross-origin resource sharing (CORS)"**
3. Click **"Edit"**

4. **Copy and paste this CORS configuration:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"]
  }
]
```

5. Click **"Save changes"**

---

## Step 4: Create IAM User (For Programmatic Access)

### 4.1 Access IAM Console

1. In AWS Console search bar, type **"IAM"**
2. Click on **"IAM"** service
3. In the left sidebar, click **"Users"**

### 4.2 Create New User

1. Click **"Create user"** button (top right, blue button)

2. **Step 1: Specify user details**

   - **User name**: `medimindai-s3-uploader` (or your preferred name)
   - Click **"Next"**

3. **Step 2: Set permissions**

   - Select **"Attach policies directly"**
   - In the search box, type: `AmazonS3FullAccess`
   - Check the box next to **"AmazonS3FullAccess"**
     - ⚠️ For production, use custom policy (see Security section below)
   - Click **"Next"**

4. **Step 3: Review and create**
   - Review the details
   - Click **"Create user"**

### 4.3 Create Access Keys

1. Click on the user you just created (`medimindai-s3-uploader`)
2. Click on the **"Security credentials"** tab
3. Scroll down to **"Access keys"** section
4. Click **"Create access key"** button

5. **Select use case:**

   - Choose **"Application running outside AWS"**
   - Click **"Next"**

6. **Set description tag (optional):**

   - Description: `MediMindAI Profile Picture Uploads`
   - Click **"Create access key"**

7. **⚠️ CRITICAL - COPY YOUR CREDENTIALS NOW!**

   - You'll see two values:
     - **Access key**: `AKIA...` (starts with AKIA)
     - **Secret access key**: `wJalr...` (long random string)
   - **Click "Download .csv file"** to save them securely
   - ⚠️ You can NEVER see the secret key again after closing this page!

8. Click **"Done"**

---

## Step 5: Configure Your Application

### 5.1 Install AWS SDK Package

Open your terminal in the project directory and run:

```bash
npm install @aws-sdk/client-s3
```

### 5.2 Update Environment Variables

1. Open your `.env` file in the project root
2. Add these lines (replace with your actual values):

```env
# AWS S3 Configuration for Profile Pictures
AWS_ACCESS_KEY_ID=AKIA...your-access-key-here
AWS_SECRET_ACCESS_KEY=wJalr...your-secret-key-here
AWS_S3_BUCKET_NAME=medimindai-profile-pictures
AWS_REGION=us-east-1
```

**Example with real values (DO NOT USE THESE - they're fake):**

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=medimindai-profile-pictures
AWS_REGION=us-east-1
```

3. Save the `.env` file

### 5.3 Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

You should see in the console:

```
✅ AWS S3 client initialized successfully
   Bucket: medimindai-profile-pictures
   Region: us-east-1
```

---

## Step 6: Test Profile Picture Upload

### 6.1 Test in Your Application

1. Start your application: `npm run dev`
2. Log in as a patient or doctor
3. Go to the **Profile** page
4. Click **"Upload Picture"** or the camera icon
5. Select an image file (JPG, PNG, or WEBP under 5MB)
6. Click **"Save Picture"**

### 6.2 Verify Success

If successful, you should see:

- ✅ "Profile picture uploaded successfully"
- The image URL will be: `https://your-bucket-name.s3.region.amazonaws.com/profile-pictures/userId_timestamp.jpg`
- The picture will appear in:
  - Profile page
  - Dashboard welcome section
  - Sidebar navigation
  - Doctor dashboard (for doctors)

### 6.3 Verify in AWS Console

1. Go back to AWS S3 Console
2. Click on your bucket
3. You should see a folder called `profile-pictures/`
4. Click on it - you'll see the uploaded images

---

## 🔒 Security Best Practices

### Production IAM Policy (Recommended)

Instead of `AmazonS3FullAccess`, create a custom policy:

1. In IAM, go to **Policies** → **Create policy**
2. Click **JSON** tab
3. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME",
      "Condition": {
        "StringLike": {
          "s3:prefix": "profile-pictures/*"
        }
      }
    },
    {
      "Sid": "UploadAndDeleteProfilePictures",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/profile-pictures/*"
    }
  ]
}
```

4. Click **Next**
5. Name it: `MediMindAI-S3-ProfilePictures-Policy`
6. Click **Create policy**
7. Attach this policy to your IAM user instead of `AmazonS3FullAccess`

---

## 💰 Cost Estimation

### AWS Free Tier (First 12 Months):

- ✅ 5 GB storage
- ✅ 20,000 GET requests/month
- ✅ 2,000 PUT requests/month
- ✅ **FREE for most small applications!**

### After Free Tier:

- **Storage**: $0.023 per GB/month
- **PUT/COPY/POST requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests

### Example for 1,000 active users:

- Storage: 100 MB (0.1 GB) = **$0.002/month**
- Monthly uploads: 1,000 = **$0.005**
- Monthly views: 10,000 = **$0.004**
- **Total: ~$0.011/month (1 cent!)**

---

## 🔧 Troubleshooting

### Error: "AWS S3 is not configured"

**Cause**: Environment variables not set
**Solution**:

1. Check `.env` file exists in project root
2. Verify all 4 AWS variables are set:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_BUCKET_NAME`
   - `AWS_REGION`
3. Restart dev server

### Error: "Access Denied"

**Cause**: IAM permissions or bucket policy issue
**Solution**:

1. Verify bucket policy allows public read
2. Check IAM user has S3 permissions
3. Verify bucket name matches in `.env`

### Error: "Bucket not found"

**Cause**: Bucket name or region mismatch
**Solution**:

1. Double-check bucket name in AWS Console
2. Verify region code is correct (e.g., `us-east-1`)
3. Check for typos in `.env` file

### Images not displaying

**Cause**: Bucket policy doesn't allow public read
**Solution**:

1. Go to bucket → Permissions → Bucket policy
2. Verify the policy allows `s3:GetObject` for `profile-pictures/*`
3. Ensure "Block public access" is disabled

### Error: "The bucket does not allow ACLs"

**Cause**: Object Ownership not configured correctly
**Solution**:

1. Go to bucket → Permissions → Object Ownership
2. Click **Edit**
3. Select **"ACLs enabled"**
4. Choose **"Bucket owner preferred"**
5. Click **Save changes**

---

## 📝 What to Share With Me

After completing the setup, please provide these values (you can just copy-paste them):

```
✅ S3 Setup Complete!

Bucket Name: _____________________
Region: _____________________
Access Key ID: AKIA_____________________
Secret Access Key: (keep this private, just confirm you have it)

Console Output:
- [ ] Shows "✅ AWS S3 client initialized successfully"
- [ ] Shows bucket name and region in console
```

---

## 🎯 Next Steps After Setup

1. ✅ Test profile picture upload
2. ✅ Verify images appear in dashboard
3. ✅ Test delete functionality
4. ✅ Check AWS billing dashboard (should be $0 with free tier)
5. ✅ Set up CloudWatch alerts (optional)
6. ✅ Configure lifecycle rules for old files (optional)

---

## 📞 Support

If you encounter any issues:

1. Check the console logs for detailed error messages
2. Verify all steps were followed correctly
3. Double-check AWS credentials in `.env`
4. Ensure bucket permissions are set correctly

**AWS Documentation:**

- [S3 Getting Started](https://docs.aws.amazon.com/AmazonS3/latest/userguide/GetStartedWithS3.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)

---

## ✅ Quick Checklist

- [ ] AWS account created
- [ ] S3 bucket created with unique name
- [ ] Bucket policy configured for public read
- [ ] CORS configured
- [ ] IAM user created
- [ ] Access keys generated and saved
- [ ] `.env` file updated with all 4 AWS variables
- [ ] AWS SDK installed (`npm install @aws-sdk/client-s3`)
- [ ] Server restarted
- [ ] Test upload successful
- [ ] Images visible in application

---

🎉 Once all steps are complete, your profile pictures will be stored in AWS S3 with excellent performance and reliability!
