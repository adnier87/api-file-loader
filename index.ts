import serverless from 'serverless-http';
import multer from 'multer';
import multerS3 from 'multer-s3';
import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';

import s3 from './config/s3-client.config';

const app = express();

// Initialize multer middleware with multer-s3 storage engine
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: (process.env.AWS_S3_BUCKET_NAME as string),
    acl: 'private',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req: Request, file, cb) {
      crypto.pseudoRandomBytes(16, function (err, raw) {
        if (err) return cb(err);
        cb(null, raw.toString('hex') + Date.now().toString() + '_' + file.originalname);
      });
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
}).single('file');

app.post('/upload', (req: Request, res: Response) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(500).json({
        error: err.message,
      });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(500).json({
        error: 'An error occurred while uploading the file.',
      });
    }

    // Everything went fine, file is successfully uploaded
    res.status(200).json({
      message: 'File uploaded successfully',
    });
  });
});

// Ensure the server can handle multiple concurrent requests efficiently
const server = serverless(app);
module.exports.handler = (event: any, context: any) => {
  // Prevent Lambda from waiting for the event loop to be empty before returning
  context.callbackWaitsForEmptyEventLoop = false;
  return server(event, context);
};
