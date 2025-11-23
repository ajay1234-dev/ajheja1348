// Test script to verify S3 folder creation
import dotenv from "dotenv";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

dotenv.config();

async function testFolderCreation() {
  console.log("Testing S3 folder creation...");

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || "us-east-1";

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

    // Test creating a folder structure
    const testKey = "documents/test-patient/test-report-sample.txt";
    const testContent = "This is a test file to verify folder creation";

    console.log("📤 Uploading test file to verify folder structure...");
    console.log("   Key:", testKey);

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: "text/plain",
    });

    await s3Client.send(putCommand);
    console.log("✅ Test file uploaded successfully");

    // List objects in the bucket to verify folder structure
    console.log("🔍 Listing objects in bucket to verify folder structure...");
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "documents/",
    });

    const listResponse = await s3Client.send(listCommand);
    console.log("✅ List operation successful");
    console.log("📁 Objects in documents folder:");

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      listResponse.Contents.forEach((obj) => {
        console.log(`  - ${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      console.log("  No objects found in documents folder");
    }

    // Also list the specific patient folder
    const patientFolderPrefix = "documents/test-patient/";
    console.log(`🔍 Listing objects in ${patientFolderPrefix} folder...`);
    const patientListCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: patientFolderPrefix,
    });

    const patientListResponse = await s3Client.send(patientListCommand);
    console.log("✅ Patient folder list operation successful");
    console.log(`📁 Objects in ${patientFolderPrefix} folder:`);

    if (
      patientListResponse.Contents &&
      patientListResponse.Contents.length > 0
    ) {
      patientListResponse.Contents.forEach((obj) => {
        console.log(`  - ${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      console.log(`  No objects found in ${patientFolderPrefix} folder`);
    }
  } catch (error) {
    console.error("❌ S3 folder creation test failed:", error.message);
    console.error("Error details:", error);
  }
}

testFolderCreation();
