import { useState, useEffect } from 'react';
import CassettePlayer from './CassettePlayer';
import LiveFeed from './LiveFeed';
import ReactionOverlay from './ReactionOverlay';
import RoomPage from './RoomPage';
import JioSaavnExplorer from './JioSaavnExplorer';
import JioSaavnLyrics from './JioSaavnLyrics';
import { searchSongs } from './jiosaavnService';
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

  // Fetch initial tracks from multiple diverse API categories on mount
  useEffect(() => {
    let isMounted = true;
    const queries = ['KK Romantic Songs', 'KK Best Love Songs', 'KK Hits Hindi Romance', 'KK Romantic Duets', 'KK Soulful Love Songs'];
    
    Promise.all(queries.map(q => searchSongs(q, 1, 15).catch(() => [])))
      .then(resultsArray => {
        if (!isMounted) return;
        const allSongs = resultsArray.flat();
        
        // Deduplicate songs by clean title
        const uniqueMap = new Map();
        allSongs.forEach(song => {
          if (song && song.title && !uniqueMap.has(song.title.toLowerCase())) {
            uniqueMap.set(song.title.toLowerCase(), song);
          }
        });

        const uniqueSongs = shuffleArray(Array.from(uniqueMap.values()));
        if (uniqueSongs.length > 0) {
          setTracks(uniqueSongs);
        }
      })
      .catch(err => {
        console.error('Failed to load initial API songs:', err);
      });

    return () => { isMounted = false; };
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

          {/* Transparent Action Controls (Positioned directly above cassette player) */}
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
              <span>Search Songs</span>
            </button>

            {currentTrack.hasLyrics && (
              <button
                className="floating-lyrics-btn"
                onClick={() => setIsLyricsOpen(true)}
                title="View Song Lyrics"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
                <span>Lyrics</span>
              </button>
            )}
          </div>

          {renderPlayer()}
        </div>
      )}
    </>
  );
}
