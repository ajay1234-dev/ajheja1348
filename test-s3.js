// Simple test script to verify S3 connectivity
import dotenv from "dotenv";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

dotenv.config();

async function testS3() {
  console.log("Testing S3 connectivity...");

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || "us-east-1";

  console.log("Environment variables:");
  console.log("  AWS_ACCESS_KEY_ID:", accessKeyId ? "SET" : "NOT SET");
  console.log("  AWS_SECRET_ACCESS_KEY:", secretAccessKey ? "SET" : "NOT SET");
  console.log("  AWS_S3_BUCKET_NAME:", bucketName || "NOT SET");
  console.log("  AWS_REGION:", region);

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    console.log("❌ Missing required environment variables");
    return;
  }

  try {
    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log("📤 Testing S3 connection...");
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    console.log("✅ S3 connection successful");
    console.log("📦 Available buckets:");
    response.Buckets.forEach((bucket) => {
      console.log(`  - ${bucket.Name}`);
    });

    // Check if our bucket exists
    const bucketExists = response.Buckets.some(
      (bucket) => bucket.Name === bucketName
    );
    if (bucketExists) {
      console.log(`✅ Bucket ${bucketName} found`);
    } else {
      console.log(`⚠️  Bucket ${bucketName} not found in bucket list`);
    }
  } catch (error) {
    console.error("❌ S3 connection failed:", error.message);
    console.error("Error details:", error);
  }
}

testS3();
