import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, signInAnonymousUser, generateUserName } from './firebase';
import './CassettePlayer.css';

export default function CassettePlayer({ tracks, setTracks, currentTrackIndex, setCurrentTrackIndex, djSession, setDjSession, isCallSpeaking, duckRatio = 0.4, onOpenSearch, onOpenUpload }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  const audioRef = useRef(null);
  const hasSyncedRoomRef = useRef(false);

  const currentTrack = tracks[currentTrackIndex] || tracks[0] || {};

  // Reset room sync flag whenever room session changes
  useEffect(() => {
    hasSyncedRoomRef.current = false;
  }, [djSession?.id]);


  // Sign in anonymously on mount
  useEffect(() => {
    signInAnonymousUser().then(u => setUser(u));
  }, []);

  // Delete now_playing record on tab close / unload
  useEffect(() => {
    if (!user) return;
    const handleUnload = () => {
      deleteDoc(doc(db, 'now_playing', user.uid)).catch(() => {});
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user]);

  // Sync playing state & periodic heartbeat to Firestore for Active Listeners
  useEffect(() => {
    if (!user || (djSession && !djSession.isMaster) || !currentTrack.title || !isPlaying) {
      if (user && !isPlaying) {
        deleteDoc(doc(db, 'now_playing', user.uid)).catch(() => {});
      }
      return;
    }

    const updatePresence = () => {
      const userRef = doc(db, 'now_playing', user.uid);
      setDoc(userRef, {
        userId: user.uid,
        displayName: generateUserName(user.uid),
        songTitle: currentTrack.title,
        artist: currentTrack.artist || 'Artist',
        cover: currentTrack.cover || '/album_midnight.png',
        timestamp: Date.now(),
        updatedAt: Date.now(),
        isPlaying: true
      }).catch(err => console.error('Error syncing now_playing:', err));
    };

    updatePresence();
    const interval = setInterval(updatePresence, 5000);

    return () => {
      clearInterval(interval);
      if (user) {
        deleteDoc(doc(db, 'now_playing', user.uid)).catch(() => {});
      }
    };
  }, [user, isPlaying, currentTrack, djSession]);

  const updateMasterSession = useCallback((newIndex, newIsPlaying) => {
    if (!djSession || !djSession.isMaster) return;
    const idx = newIndex !== undefined ? newIndex : currentTrackIndex;
    const targetTrack = tracks[idx] || currentTrack;

    const sessionRef = doc(db, 'dj_sessions', djSession.id);
    setDoc(sessionRef, {
      currentTrackIndex: idx,
      currentTrack: targetTrack,
      isPlaying: newIsPlaying !== undefined ? newIsPlaying : true,
      lastUpdated: Date.now()
    }, { merge: true }).catch(err => console.error('Error updating master session:', err));
  }, [djSession, currentTrackIndex, isPlaying, tracks, currentTrack]);

  // Master sends track state updates to Firestore whenever track or room changes
  useEffect(() => {
    if (djSession && djSession.isMaster && currentTrack && currentTrack.title) {
      updateMasterSession(currentTrackIndex, true);
    }
  }, [djSession?.isMaster, currentTrackIndex, djSession?.id]);

  const playMedia = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [currentTrack]);

  const forcePlayTrack = useCallback((track) => {
    if (!track) return;
    if (track.src && audioRef.current) {
      audioRef.current.src = track.src;
      audioRef.current.load();
      try { audioRef.current.currentTime = 0; } catch (_) {}
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, []);

  // Listener Sync Effect (Slave mode) - Guarantees initial room track plays
  useEffect(() => {
    if (!djSession || djSession.isMaster) return;

    const sessionRef = doc(db, 'dj_sessions', djSession.id);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      const masterTrack = data.currentTrack;
      const masterIsPlaying = data.isPlaying !== false;

      if (masterTrack) {
        const foundIdx = tracks.findIndex(t => 
          (t.id && masterTrack.id && t.id === masterTrack.id) || 
          (t.title && masterTrack.title && t.title === masterTrack.title) ||
          (t.ytId && masterTrack.ytId && t.ytId === masterTrack.ytId)
        );

        if (foundIdx !== -1) {
          if (foundIdx !== currentTrackIndex || !hasSyncedRoomRef.current) {
            hasSyncedRoomRef.current = true;
            setCurrentTrackIndex(foundIdx);
          }
        } else if (setTracks) {
          hasSyncedRoomRef.current = true;
          setTracks(prev => {
            const updated = [...prev, masterTrack];
            setCurrentTrackIndex(updated.length - 1);
            return updated;
          });
        }

        if (masterIsPlaying) {
          setIsPlaying(true);
          forcePlayTrack(masterTrack);
        } else {
          setIsPlaying(false);
          pauseMedia();
        }
      }
    });

    return () => unsubscribe();
  }, [djSession?.id, djSession?.isMaster, tracks, currentTrackIndex, setCurrentTrackIndex, setTracks, forcePlayTrack]);

  const handleNext = useCallback(() => {
    if (!tracks || tracks.length === 0) return;
    if (tracks.length === 1) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }
    setCurrentTrackIndex(prev => {
      const nextIndex = (prev + 1) % tracks.length;
      if (djSession && djSession.isMaster) {
        updateMasterSession(nextIndex, true);
      }
      return nextIndex;
    });
  }, [tracks, djSession, updateMasterSession]);

  const handlePrev = useCallback(() => {
    if (!tracks || tracks.length === 0) return;
    if (tracks.length === 1) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }
    setCurrentTrackIndex(prev => {
      const prevIndex = (prev - 1 + tracks.length) % tracks.length;
      if (djSession && djSession.isMaster) {
        updateMasterSession(prevIndex, true);
      }
      return prevIndex;
    });
  }, [tracks, djSession, updateMasterSession]);

  const pauseMedia = () => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (_) {}
    }
    setIsPlaying(false);
  };

  // Handle Track & Playback State Changes (HTML5)
  useEffect(() => {
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(currentTrack.duration || 240);

    // Stop HTML5 audio
    if (audioRef.current) {
      audioRef.current.pause();
      try { audioRef.current.currentTime = 0; } catch (_) {}
    }

    if (currentTrack.src && audioRef.current) {
      // Handle local .mp3 or S3 track
      audioRef.current.src = currentTrack.src;
      try { audioRef.current.currentTime = 0; } catch (_) {}

      const playPromise = audioRef.current.play();
      if (playPromise) {
        playPromise.catch((e) => {
          console.warn("Auto-play blocked or failed:", e);
          setIsPlaying(false);
          setIsLoading(false);
        });
      }
    } else {
      setIsLoading(false);
    }
  }, [currentTrackIndex, currentTrack.src]);

  // Audio events for HTML5 audio
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || currentTrack.duration || 240);
    }
    setIsLoading(false);
  };

  const handleAudioError = (e) => {
    console.error("Audio playback error:", e);
    setIsLoading(false);
    // Don't auto-skip aggressively, as it causes infinite loops if all tracks fail.
    // Let the user manually click next, or just pause it.
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseMedia();
      if (djSession && djSession.isMaster) {
        updateMasterSession(currentTrackIndex, false);
      }
    } else {
      playMedia();
      if (djSession && djSession.isMaster) {
        updateMasterSession(currentTrackIndex, true);
      }
    }
  };

  return (
    <div className="modern-player-wrapper">

      {/* Hidden HTML5 audio element */}
      <audio
        ref={audioRef}
        preload="auto"
        onLoadStart={() => setIsLoading(true)}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => { setIsPlaying(true); setIsLoading(false); }}
        onWaiting={() => setIsLoading(true)}
        onPause={() => { setIsPlaying(false); setIsLoading(false); }}
        onEnded={handleNext}
        onError={handleAudioError}
      />
      
      <div className={`modern-player ${isPlaying ? 'is-playing' : ''} ${(djSession && !djSession.isMaster) ? 'slave-mode' : ''}`}>
        {/* Song Name Above */}
        <div className="player-info">
          <div className="player-title">{isLoading ? 'Loading...' : (currentTrack.title || 'Music Track')}</div>
        </div>

        {/* Playback Controls Below */}
        <div className="player-controls">
          <button className="player-btn" onClick={handlePrev} title="Previous">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button
            className={`player-btn play-pause-btn ${isLoading ? 'loading' : ''}`}
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="spinner" />
            ) : isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button className="player-btn" onClick={handleNext} title="Next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
          {onOpenUpload && (
            <button className="player-btn search-player-btn" onClick={onOpenUpload} title="Upload New Track">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </button>
          )}
          {onOpenSearch && (
            <button className="player-btn search-player-btn" onClick={onOpenSearch} title="Search Library">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
