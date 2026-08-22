import express from 'express';
import multer from 'multer';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '../config/aws.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB max

/**
 * POST /api/upload/presigned-url
 * Generates an AWS S3 Presigned PUT URL for direct browser uploads.
 */
router.post('/presigned-url', async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    if (!s3Client || !BUCKET_NAME) {
      return res.status(503).json({ 
        error: 'S3_NOT_CONFIGURED', 
        message: 'AWS S3 credentials are not set on server. Use fallback pipeline.' 
      });
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `music-uploads/${Date.now()}_${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    
    // Instead of a direct S3 URL which might fail if bucket is private,
    // return a relative stream URL that the backend will proxy.
    const publicStreamUrl = `/api/upload/stream/${objectKey}`;

    return res.json({
      success: true,
      uploadUrl,
      publicStreamUrl,
      key: objectKey
    });
  } catch (err) {
    console.error('Presigned URL error:', err);
    return res.status(500).json({ error: 'Failed to generate presigned URL', details: err.message });
  }
});

/**
 * GET /api/upload/stream/:folder/:file
 * Streams a file from S3 bypassing bucket public policies.
 */
router.get('/stream/:folder/:file', async (req, res) => {
  try {
    if (!s3Client || !BUCKET_NAME) {
      return res.status(404).send('S3 not configured');
    }
    
    const key = `${req.params.folder}/${req.params.file}`;
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    if (req.headers.range) {
      params.Range = req.headers.range;
    }

    const command = new GetObjectCommand(params);
    const s3Item = await s3Client.send(command);

    res.status(s3Item.ContentRange ? 206 : 200);
    res.setHeader('Content-Type', s3Item.ContentType || 'audio/mpeg');
    if (s3Item.ContentLength) {
      res.setHeader('Content-Length', s3Item.ContentLength);
    }
    if (s3Item.ContentRange) {
      res.setHeader('Content-Range', s3Item.ContentRange);
    }
    res.setHeader('Accept-Ranges', 'bytes');

    s3Item.Body.pipe(res);
  } catch (err) {
    console.error('Stream error:', err);
    if (!res.headersSent) {
      res.status(500).send('Stream error');
    }
  }
});

/**
 * POST /api/upload/fallback
 * Multipart upload fallback forwarding to Tmpfiles CDN
 */
router.post('/fallback', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);

    const tmpRes = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });

    if (tmpRes.ok) {
      const json = await tmpRes.json();
      if (json?.data?.url) {
        const streamUrl = json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        return res.json({ success: true, url: streamUrl, provider: 'tmpfiles' });
      }
    }

    return res.status(500).json({ error: 'Cloud fallback upload failed' });
  } catch (err) {
    console.error('Fallback upload error:', err);
    return res.status(500).json({ error: 'Upload proxy error', details: err.message });
  }
});

export default router;
