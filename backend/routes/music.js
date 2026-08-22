import express from 'express';

const router = express.Router();

/**
 * Saavn API Proxy Route
 * Proxies requests to JioSaavn API to avoid CORS & User-Agent restrictions
 */
router.use(async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/saavn/, '');
    const queryString = new URLSearchParams(req.query).toString();
    const targetUrl = `https://www.jiosaavn.com/${targetPath}${queryString ? '?' + queryString : ''}`;

    const saavnRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.jiosaavn.com/'
      }
    });

    const data = await saavnRes.text();
    res.setHeader('Content-Type', saavnRes.headers.get('content-type') || 'application/json');
    res.status(saavnRes.status).send(data);
  } catch (err) {
    console.error('Saavn proxy error:', err);
    res.status(500).json({ error: 'Proxy request failed', details: err.message });
  }
});

export default router;
