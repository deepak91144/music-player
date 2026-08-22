import express from 'express';
import multer from 'multer';
import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '../config/aws.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB max

const region = process.env.AWS_REGION || 'ap-south-1';

/**
 * GET /api/upload/s3-songs
 * Lists all valid audio files currently in the S3 bucket with direct global S3 URLs.
 */
router.get('/s3-songs', async (req, res) => {
  try {
    if (!s3Client || !BUCKET_NAME) {
      return res.status(503).json({ error: 'S3 not configured' });
    }

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME
    });

    const response = await s3Client.send(command);
    const contents = response.Contents || [];

    const songs = contents
      .filter(item => item.Key && (
        item.Key.endsWith('.mp3') || 
        item.Key.endsWith('.m4a') || 
        item.Key.endsWith('.wav') || 
        item.Key.endsWith('.flac') || 
        item.Key.endsWith('.aac') ||
        item.Key.startsWith('music-uploads/')
      ))
      .map(item => {
        const rawName = item.Key.split('/').pop().replace(/^\d+_/, '').replace(/\.[^/.]+$/, "");
        const formattedTitle = rawName.replace(/_/g, ' ');
        const directS3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${item.Key}`;
        return {
          title: formattedTitle || 'Uploaded S3 Track',
          artist: 'Cloud Library',
          album: 'AWS S3',
          cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop',
          src: directS3Url,
          key: item.Key,
          size: item.Size,
          createdAt: item.LastModified ? new Date(item.LastModified).getTime() : Date.now()
        };
      });

    return res.json({ success: true, count: songs.length, songs });
  } catch (err) {
    console.error('List S3 objects error:', err);
    return res.status(500).json({ error: 'Failed to list S3 objects', details: err.message });
  }
});

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
    const publicStreamUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${objectKey}`;

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
 * GET /api/upload/stream/:key
 * Streams a file from S3 bypassing bucket public policies.
 */
router.get(/^\/stream\/(.+)$/, async (req, res) => {
  try {
    if (!s3Client || !BUCKET_NAME) {
      return res.status(404).send('S3 not configured');
    }
    
    // Extract full S3 object key from regex match
    const key = req.params[0];
    if (!key) {
      return res.status(400).send('File key required');
    }

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
    console.warn('Stream notice for key:', req.params[0], err.message);
    if (!res.headersSent) {
      res.status(404).send('Audio file not found in S3');
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
