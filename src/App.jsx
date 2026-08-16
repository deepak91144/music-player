import { useState, useEffect } from 'react';
import CassettePlayer from './CassettePlayer';
import LiveFeed from './LiveFeed';
import ReactionOverlay from './ReactionOverlay';
import RoomPage from './RoomPage';
import JioSaavnExplorer from './JioSaavnExplorer';
import JioSaavnLyrics from './JioSaavnLyrics';
import { searchSongs, LOCAL_TRACKS } from './jiosaavnService';
import './App.css';

// Import background image
import usBg from './assets/images/us.png';

const BG_IMAGES = [usBg];

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize djSession from localStorage
  const [djSession, setDjSession] = useState(() => {
    try {
      const saved = localStorage.getItem('musicPlayer_djSession');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Helper to shuffle array
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Initialize tracks with local audio files on mount
  useEffect(() => {
    // Start with local audio tracks (KK and Hindi hits)
    const shuffled = shuffleArray(LOCAL_TRACKS);
    setTracks(shuffled);
  }, []);

  useEffect(() => {
    if (djSession) {
      localStorage.setItem('musicPlayer_djSession', JSON.stringify(djSession));
    } else {
      localStorage.removeItem('musicPlayer_djSession');
    }
  }, [djSession]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Play a song directly from online search & trigger auto-play in cassette player
  const handlePlayTrack = (song) => {
    let index = tracks.findIndex(t => t.id === song.id || t.title === song.title);
    if (index !== -1) {
      if (index === currentTrackIndex) {
        // Re-trigger track change if same song selected
        setCurrentTrackIndex(-1);
        setTimeout(() => setCurrentTrackIndex(index), 20);
      } else {
        setCurrentTrackIndex(index);
      }
    } else {
      setTracks(prev => {
        const updated = [...prev, song];
        setCurrentTrackIndex(updated.length - 1);
        return updated;
      });
    }
    setIsSearchOpen(false);
    showToast(`▶ Now Playing: ${song.title}`);
  };

  // Add song to playlist queue
  const handleAddToQueue = (song) => {
    const exists = tracks.some(t => t.id === song.id);
    if (!exists) {
      setTracks(prev => [...prev, song]);
    }
    showToast(`➕ Added "${song.title}" to Queue!`);
  };

  const currentTrack = tracks[currentTrackIndex] || tracks[0] || {};

  const renderPlayer = () => (
    <CassettePlayer
      tracks={tracks}
      currentTrackIndex={currentTrackIndex}
      setCurrentTrackIndex={setCurrentTrackIndex}
      djSession={djSession}
      setDjSession={setDjSession}
    />
  );

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="app-toast">
          {toastMessage}
        </div>
      )}

      {/* Online Music Explorer Modal */}
      <JioSaavnExplorer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onPlayTrack={handlePlayTrack}
        onAddToQueue={handleAddToQueue}
        currentTrack={currentTrack}
      />

      {/* Lyrics Modal */}
      <JioSaavnLyrics
        song={currentTrack}
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
      />

      {djSession ? (
        <RoomPage 
          djSession={djSession} 
          setDjSession={setDjSession} 
          currentTrack={currentTrack}
        >
          {renderPlayer()}
        </RoomPage>
      ) : (
        <div className="app">
          <div className="bg-slideshow">
            {BG_IMAGES.map((src, i) => (
              <div className="bg-slide" key={i}>
                <img src={src} alt="" />
              </div>
            ))}
            <div className="bg-overlay" />
          </div>

          <LiveFeed />
          <ReactionOverlay setDjSession={setDjSession} />

          <div className="love-quote-container">
            <p className="love-quote">
              I will look for you in every lifetime until we finally stay
            </p>
          </div>

          <div className="player-top-actions">
            <button 
              className="floating-search-btn"
              onClick={() => setIsSearchOpen(true)}
              title="Search Songs"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search Online Songs</span>
            </button>
          </div>

          {renderPlayer()}
        </div>
      )}
    </>
  );
}
