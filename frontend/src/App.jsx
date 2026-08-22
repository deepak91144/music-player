import { useState, useEffect, useRef } from 'react';
import CassettePlayer from './CassettePlayer';
import LiveFeed from './LiveFeed';
import ReactionOverlay from './ReactionOverlay';
import RoomPage from './RoomPage';
import MusicExplorer from './MusicExplorer';
import SearchModal from './SearchModal';
import { LOCAL_TRACKS } from './constants';
import { getSongsFromFirestore, cleanAndSyncWithS3 } from './musicService';
import './App.css';

// Import background image
import usBg from './assets/images/us.png';

const BG_IMAGES = [usBg];

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

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

  const handleSyncWithS3 = async () => {
    showToast('🔄 Cleaning DB & syncing with S3...');
    const s3Songs = await cleanAndSyncWithS3();
    if (s3Songs && s3Songs.length > 0) {
      setTracks(shuffleArray(s3Songs));
      setCurrentTrackIndex(0);
      showToast(`✅ Synced and randomized ${s3Songs.length} songs from S3!`);
    } else {
      setTracks(shuffleArray(LOCAL_TRACKS));
      showToast('ℹ️ No S3 songs found. Loaded default library.');
    }
  };

  useEffect(() => {
    const loadTracks = async () => {
      let dbSongs = await getSongsFromFirestore();
      if (!dbSongs || dbSongs.length === 0) {
        dbSongs = await cleanAndSyncWithS3();
      }
      if (dbSongs && dbSongs.length > 0) {
        setTracks(shuffleArray(dbSongs));
      } else {
        setTracks(shuffleArray(LOCAL_TRACKS));
      }
    };
    loadTracks();
  }, []);

  useEffect(() => {
    if (djSession) {
      localStorage.setItem('musicPlayer_djSession', JSON.stringify(djSession));
    } else {
      localStorage.removeItem('musicPlayer_djSession');
    }
  }, [djSession]);

  const showToast = (msg, duration = 3500) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, duration);
  };

  // Play a song directly from online search & trigger auto-play in cassette player
  const handlePlayTrack = (song, shouldToast = true) => {
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
    if (shouldToast) {
      showToast(`▶ Now Playing: ${song.title}`);
    }
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
      setTracks={setTracks}
      currentTrackIndex={currentTrackIndex}
      setCurrentTrackIndex={setCurrentTrackIndex}
      djSession={djSession}
      setDjSession={setDjSession}
      onOpenSearch={() => setIsSearchOpen(true)}
      onOpenUpload={() => setIsUploadOpen(true)}
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

      {/* Cloud Upload Modal */}
      <MusicExplorer
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSyncS3={handleSyncWithS3}
        showToast={showToast}
        onPlayTrack={(song) => {
          handlePlayTrack(song, false);
          setIsUploadOpen(false);
        }}
        onAddToQueue={(song) => {
          handleAddToQueue(song);
          setIsUploadOpen(false);
        }}
        currentTrack={currentTrack}
      />

      {/* Library Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tracks={tracks}
        currentTrackIndex={currentTrackIndex}
        onPlayTrack={(index) => {
          setCurrentTrackIndex(index);
          setIsSearchOpen(false);
        }}
      />



      {djSession ? (
        <RoomPage 
          djSession={djSession} 
          setDjSession={setDjSession} 
          currentTrack={currentTrack}
          onOpenSearch={() => setIsSearchOpen(true)}
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

          {renderPlayer()}
        </div>
      )}
    </>
  );
}
