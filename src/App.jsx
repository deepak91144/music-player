import { useState } from 'react';
import CassettePlayer from './CassettePlayer';
import './App.css';

// Import audio files – Vite will handle these as static assets
import dilIbaadatSrc from './assets/audio/Dil Ibaadat Tum Mile Original Motion Picturetrack 320 Kbps.mp3';
import labonKoSrc from './assets/audio/Labon Ko Bhool Bhulaiyaa 320 Kbps.mp3';
import tuHiHaqeeqatSrc from './assets/audio/Tu Hi Haqeeqat Tum Mile Original Motion Picturetrack 320 Kbps.mp3';
import tuHiMeriSrc from './assets/audio/Tu Hi Meri Shab Hai Gangster 320 Kbps.mp3';

const TRACKS = [
  {
    id: 1,
    title: 'Dil Ibaadat',
    artist: 'KK',
    album: 'Tum Mile',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: dilIbaadatSrc,
  },
  {
    id: 2,
    title: 'Labon Ko',
    artist: 'KK',
    album: 'Bhool Bhulaiyaa',
    genre: 'Bollywood',
    cover: '/album_neon.png',
    src: labonKoSrc,
  },
  {
    id: 3,
    title: 'Tu Hi Haqeeqat',
    artist: 'Javed Ali',
    album: 'Tum Mile',
    genre: 'Bollywood',
    cover: '/album_aurora.png',
    src: tuHiHaqeeqatSrc,
  },
  {
    id: 4,
    title: 'Tu Hi Meri Shab Hai',
    artist: 'KK',
    album: 'Gangster',
    genre: 'Bollywood',
    cover: '/album_ocean.png',
    src: tuHiMeriSrc,
  },
];

const BG_IMAGES = [
  '/couple_intimate.png',
  '/couple_sunset.png',
  '/couple_cozy.png',
];

export default function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  return (
    <div className="app">
      {/* Background Slideshow */}
      <div className="bg-slideshow">
        {BG_IMAGES.map((src, i) => (
          <div className="bg-slide" key={i}>
            <img src={src} alt="" />
          </div>
        ))}
        <div className="bg-overlay" />
      </div>

      {/* Love Quote Overlay Banner */}
      <div className="love-quote-container">
        <p className="love-quote">
          I will look for you in every lifetime until we finally stay
        </p>
      </div>

      {/* Cassette Player */}
      <CassettePlayer
        tracks={TRACKS}
        currentTrackIndex={currentTrackIndex}
        setCurrentTrackIndex={setCurrentTrackIndex}
      />
    </div>
  );
}
