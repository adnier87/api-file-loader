import { S3Client } from '@aws-sdk/client-s3';
import 'dotenv/config';

// Configure AWS SDK
const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
})

export default s3;