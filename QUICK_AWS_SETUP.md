# 🚀 Quick AWS S3 Setup - 15 Minutes

Follow these steps to set up AWS S3 for your profile pictures:

---

## Step 1: Create AWS Account (5 mins)

1. Go to **https://aws.amazon.com**
2. Click **"Create an AWS Account"**
3. Complete registration (you'll get 12 months free tier)

---

## Step 2: Create S3 Bucket (3 mins)

1. Log into **https://console.aws.amazon.com**
2. Search for **"S3"** in top search bar
3. Click **"Create bucket"** (orange button)

### Bucket Settings:

- **Bucket name**: `medimindai-yourname-pics` (must be globally unique)
- **Region**: `us-east-1` (US East Virginia) ← Choose closest to you
- **Object Ownership**: Select "ACLs enabled"
- **Block Public Access**: ⚠️ **UNCHECK** "Block all public access"
  - Check the acknowledgment box
- Leave other settings as default
- Click **"Create bucket"**

**📝 WRITE DOWN:**

- ✏️ Your bucket name: ******\_\_\_\_******
- 🌍 Your region: ******\_\_\_\_******

---

## Step 3: Configure Bucket Policy (2 mins)

1. Click on your bucket name
2. Go to **"Permissions"** tab
3. Scroll to **"Bucket policy"** → Click **"Edit"**
4. Paste this (replace `YOUR-BUCKET-NAME`):

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

5. Click **"Save changes"**

---

## Step 4: Configure CORS (1 min)

1. Still in **"Permissions"** tab
2. Scroll to **"Cross-origin resource sharing (CORS)"** → Click **"Edit"**
3. Paste this:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

4. Click **"Save changes"**

---

## Step 5: Create IAM User & Access Keys (4 mins)

### Create User:

1. Search for **"IAM"** in top search bar
2. Click **"Users"** in left sidebar
3. Click **"Create user"**
4. **User name**: `medimindai-uploader`
5. Click **"Next"**

### Set Permissions:

6. Select **"Attach policies directly"**
7. Search and check: **"AmazonS3FullAccess"**
8. Click **"Next"** → **"Create user"**

### Get Access Keys:

9. Click on your new user (`medimindai-uploader`)
10. Go to **"Security credentials"** tab
11. Scroll to **"Access keys"** → Click **"Create access key"**
12. Select **"Application running outside AWS"**
13. Click **"Next"** → **"Create access key"**

### ⚠️ CRITICAL - COPY NOW:

14. **Download .csv file** (you can NEVER see secret key again!)
15. Copy these values:

**📝 WRITE DOWN:**

- ✏️ Access Key ID (starts with AKIA): ******\_\_\_\_******
- 🔐 Secret Access Key (long string): ******\_\_\_\_******

---

## Step 6: Provide Credentials to Me

Once you have all 4 values, provide them in this format:

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_S3_BUCKET_NAME=medimindai-yourname-pics
AWS_REGION=us-east-1
```

I'll then:

1. ✅ Add them to your `.env` file
2. ✅ Install the AWS SDK package
3. ✅ Test the connection
4. ✅ Verify profile picture uploads work

---

## 📊 Cost Estimate

**AWS Free Tier (First 12 months):**

- ✅ 5 GB storage (enough for ~5,000 profile pictures)
- ✅ 20,000 GET requests/month
- ✅ 2,000 PUT requests/month

**After Free Tier:**

- ~$0.01/month for 1,000 users
- Essentially free for small-medium applications!

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the detailed guide: `AWS_S3_SETUP_GUIDE.md` (458 lines of detailed instructions)
2. Common issues are covered in the troubleshooting section
3. Ask me any questions!

---

## ✅ Ready?

Once you complete these steps, just paste your 4 credentials and I'll configure everything instantly! 🚀
