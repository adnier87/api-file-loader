import serverless from 'serverless-http';
import express, { Request, Response } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import 'dotenv/config';

import s3Client from './config/s3-client.config';

const app = express();

app.get('/presigned-url', async (req: Request, res: Response) => {
  const { key } = req.query;

  if (!key && typeof key !== 'string') {
    return res.status(400).json({ message: 'A valid \'key\' query parameter is required.' });
  }

  try {console.log(process, process.env.AWS_S3_BUCKET_NAME)
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key as string,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
    return res.status(200).json({ presignedUrl });
  } catch (error) {
    console.error('Error creating presigned URL', error);
    return res.status(500).json({ message: 'Error creating presigned URL', error });
  }
});

// Ensure the server can handle multiple concurrent requests efficiently
const server = serverless(app);
module.exports.handler = (event: any, context: any) => {
  // Prevent Lambda from waiting for the event loop to be empty before returning
  context.callbackWaitsForEmptyEventLoop = false;
  return server(event, context);
};
