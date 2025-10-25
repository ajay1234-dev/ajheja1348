import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;
let s3Available = false;

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

// Initialize S3 client
try {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey && BUCKET_NAME) {
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    s3Available = true;
    console.log("✅ AWS S3 client initialized successfully");
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   Region: ${AWS_REGION}`);
  } else {
    console.warn("⚠️  AWS S3 credentials not configured");
    console.warn("   Required environment variables:");
    console.warn("   - AWS_ACCESS_KEY_ID");
    console.warn("   - AWS_SECRET_ACCESS_KEY");
    console.warn("   - AWS_S3_BUCKET_NAME");
    console.warn("   - AWS_REGION (optional, defaults to us-east-1)");
  }
} catch (error) {
  console.error("❌ AWS S3 initialization error:", error);
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (!s3Client || !s3Available) {
    throw new Error(
      "AWS S3 is not configured. Please set up environment variables."
    );
  }

  try {
    const key = `profile-pictures/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Note: ACL removed - bucket policy handles public access
    });

    await s3Client.send(command);

    // Generate public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    console.log("✅ File uploaded to S3:", publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error("❌ S3 upload error:", error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(fileUrl: string): Promise<boolean> {
  if (!s3Client || !s3Available) {
    console.warn("AWS S3 is not configured, skipping delete");
    return false;
  }

  try {
    // Extract the key from the URL
    const urlParts = fileUrl.split(".amazonaws.com/");
    if (urlParts.length < 2) {
      throw new Error("Invalid S3 URL format");
    }
    const key = urlParts[1];

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log("✅ File deleted from S3:", key);
    return true;
  } catch (error: any) {
    console.error("❌ S3 delete error:", error);
    return false;
  }
}

/**
 * Check if a file exists in S3
 */
export async function checkS3FileExists(fileUrl: string): Promise<boolean> {
  if (!s3Client || !s3Available) {
    return false;
  }

  try {
    const urlParts = fileUrl.split(".amazonaws.com/");
    if (urlParts.length < 2) {
      return false;
    }
    const key = urlParts[1];

    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

export { s3Client, s3Available, BUCKET_NAME, AWS_REGION };
