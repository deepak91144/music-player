import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
export const BUCKET_NAME = process.env.AWS_S3_BUCKET;

let s3Client = null;

if (accessKeyId && secretAccessKey && region && BUCKET_NAME) {
  try {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    console.log(`✅ AWS S3 Client initialized for bucket: ${BUCKET_NAME} (${region})`);
  } catch (err) {
    console.warn('⚠️ AWS S3 Client initialization error:', err.message);
  }
} else {
  console.log('ℹ️ AWS S3 credentials not fully configured. Multi-cloud fallback pipeline active.');
}

export { s3Client };
