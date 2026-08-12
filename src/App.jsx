import { useState } from 'react';
import CassettePlayer from './CassettePlayer';
import './App.css';

// Import background image
import usBg from './assets/images/us.png';

// Dynamically import all mp3 files from the audio folder
const audioModules = import.meta.glob('./assets/audio/*.mp3', { eager: true, import: 'default' });
const covers = ['/album_midnight.png', '/album_neon.png', '/album_aurora.png', '/album_ocean.png'];

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const TRACKS = shuffleArray(
  Object.entries(audioModules).map(([path, src], index) => {
    // Extract filename without extension
    const filename = path.split('/').pop().replace('.mp3', '');
    
    // Clean up the title (remove " 320 Kbps" and other tags)
    const cleanTitle = filename.replace(/\s*320 Kbps.*/i, '').replace(/\s*Original Motion Picturetrack/i, '').trim();
    
    return {
      id: index + 1,
      title: cleanTitle,
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      genre: 'Bollywood',
      cover: covers[index % covers.length],
      src: src,
    };
  })
);

const BG_IMAGES = [
  usBg,
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
