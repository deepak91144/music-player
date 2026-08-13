import { useState } from 'react';
import CassettePlayer from './CassettePlayer';
import LiveFeed from './LiveFeed';
import './App.css';

// Import background image
import usBg from './assets/images/us.png';

// Audio files are now served from the public/audio folder for instant streaming
const AUDIO_FILES = [
  "Agar Tum Saath Ho Tamasha 320 Kbps.mp3",
  "Ajab Si Om Shanti Om 320 Kbps.mp3",
  "Bol Do Na Zara Azhar 320 Kbps.mp3",
  "Dil Ibaadat Tum Mile Original Motion Picturetrack 320 Kbps.mp3",
  "Haan Tu Hain Jannat 320 Kbps.mp3",
  "Hey Shona Ta Ra Rum Pum 320 Kbps.mp3",
  "I Am In Love Once Upon A Time In Mumbaai 320 Kbps.mp3",
  "Jab Tak M.s. Dhoni The Untold Story 320 Kbps.mp3",
  "Kaise Hua Kabir Singh 320 Kbps.mp3",
  "Kaun Tujhe M.s. Dhoni The Untold Story 320 Kbps.mp3",
  "Labon Ko Bhool Bhulaiyaa 320 Kbps.mp3",
  "Mujhe De De Har Gham Tera Haunted 320 Kbps.mp3",
  "Pehla Pyaar (PenduJatt.Com.Se).mp3",
  "Soniye Heartless 320 Kbps.mp3",
  "Tu Hi Haqeeqat Tum Mile Original Motion Picturetrack 320 Kbps.mp3",
  "Tu Hi Meri Shab Hai Gangster 320 Kbps.mp3",
  "Tum Hi Ho Aashiqui 2 320 Kbps.mp3",
  "Tum Se Hi Jab We Met 320 Kbps (1).mp3",
  "Yun Hi Re David 320 Kbps.mp3",
  "Zara Sa Jannat 320 Kbps.mp3"
];

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
  AUDIO_FILES.map((filename, index) => {
    // Clean up the title (remove " 320 Kbps" and other tags)
    const cleanTitle = filename
      .replace(/\s*320 Kbps.*/i, '')
      .replace(/\s*Original Motion Picturetrack/i, '')
      .replace(/\(PenduJatt\.Com\.Se\)/i, '')
      .replace('.mp3', '')
      .trim();
    
    return {
      id: index + 1,
      title: cleanTitle,
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      genre: 'Bollywood',
      cover: covers[index % covers.length],
      src: `/audio/${filename}`,
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

      <LiveFeed />

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
