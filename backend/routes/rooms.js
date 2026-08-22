import express from 'express';

const router = express.Router();

/**
 * Health check endpoint for uptime monitoring & diagnostics
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'music-player-backend',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

export default router;
