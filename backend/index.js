import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import uploadRoutes from './routes/upload.js';
import musicRoutes from './routes/music.js';
import roomRoutes from './routes/rooms.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS
const clientOrigin = process.env.CLIENT_ORIGIN || '*';
app.use(cors({
  origin: clientOrigin,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/saavn-api', musicRoutes);

// Root Status
app.get('/', (req, res) => {
  res.json({
    name: 'Music Player API Server',
    status: 'running',
    health: '/api/rooms/health'
  });
});

app.listen(PORT, () => {
  console.log(`🎵 Music Player Express Backend running on port ${PORT}`);
});
