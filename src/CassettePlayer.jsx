import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, signInAnonymousUser, generateUserName } from './firebase';
import { LOCAL_TRACKS } from './jiosaavnService';
import './CassettePlayer.css';

export default function CassettePlayer({ tracks, currentTrackIndex, setCurrentTrackIndex, djSession, setDjSession, isCallSpeaking, duckRatio = 0.4, onOpenSearch }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const volumeRampRef = useRef(null);
  const wasAutoPausedByCallRef = useRef(false);

  const currentTrack = tracks[currentTrackIndex] || tracks[0] || {};

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

  // Sync playing state to Firestore
  useEffect(() => {
    if (!user || (djSession && !djSession.isMaster) || !currentTrack.title) return;
    
    const userRef = doc(db, 'now_playing', user.uid);
    
    if (isPlaying) {
      setDoc(userRef, {
        userId: user.uid,
        displayName: generateUserName(user.uid),
        songTitle: currentTrack.title,
        artist: currentTrack.artist || 'Artist',
        cover: currentTrack.cover || '',
        timestamp: Date.now(),
        playbackTime: audioRef.current?.currentTime || 0,
        isPlaying: true
      }).catch(err => console.warn("Firestore error:", err));
    } else {
      setDoc(userRef, {
        userId: user.uid,
        displayName: generateUserName(user.uid),
        songTitle: currentTrack.title,
        artist: currentTrack.artist || 'Artist',
        cover: currentTrack.cover || '',
        timestamp: Date.now(),
        playbackTime: audioRef.current?.currentTime || 0,
        isPlaying: false
      }).catch(() => {});
    }

    return () => {
      deleteDoc(userRef).catch(() => {});
    };
  }, [isPlaying, currentTrack, user, djSession]);

  // Slave Mode: Listen to DJ's state
  useEffect(() => {
    if (!djSession || djSession.isMaster) return;
    
    const unsubscribe = onSnapshot(doc(db, 'now_playing', djSession.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Match Track
        const trackIndex = tracks.findIndex(t => t.title === data.songTitle);
        if (trackIndex !== -1 && trackIndex !== currentTrackIndex) {
           if (audioRef.current) {
             audioRef.current.pause();
             try { audioRef.current.currentTime = 0; } catch (_) {}
           }
           setCurrentTrackIndex(trackIndex);
           return;
        }
        
        const audio = audioRef.current;
        if (audio) {
          if (Math.abs(audio.currentTime - data.playbackTime) > 2.0) {
             audio.currentTime = data.playbackTime;
          }

          if (data.isPlaying && audio.paused) {
            audio.play().then(() => setIsPlaying(true)).catch(()=>{});
          } else if (!data.isPlaying && !audio.paused) {
            audio.pause();
            setIsPlaying(false);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [djSession, currentTrackIndex, tracks, setCurrentTrackIndex]);

  // Master Heartbeat: Sync perfectly every 5 seconds
  useEffect(() => {
    if (!user || !isPlaying || !currentTrack.title) return;
    if (djSession && !djSession.isMaster) return;
    
    const interval = setInterval(() => {
      setDoc(doc(db, 'now_playing', user.uid), {
        userId: user.uid,
        displayName: generateUserName(user.uid),
        songTitle: currentTrack.title,
        artist: currentTrack.artist || 'Artist',
        cover: currentTrack.cover || '',
        timestamp: Date.now(),
        playbackTime: audioRef.current?.currentTime || 0,
        isPlaying: true
      }, { merge: true }).catch(() => {});
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user, djSession, isPlaying, currentTrack]);

  // Create / update audio element on track change & auto-play from beginning (0:00)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack.src) return;

    audio.pause();
    setCurrentTime(0);
    setDuration(0);
    
    audio.src = currentTrack.src;
    audio.load();

    const resetTimeToZero = () => {
      try {
        audio.currentTime = 0;
      } catch (_) {}
    };

    audio.addEventListener('loadedmetadata', resetTimeToZero, { once: true });
    audio.addEventListener('canplay', resetTimeToZero, { once: true });
    audio.addEventListener('play', resetTimeToZero, { once: true });
    audio.addEventListener('playing', resetTimeToZero, { once: true });

    // Always auto-play from 0:00 when a new track is loaded
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.then(() => {
        try {
          audio.currentTime = 0;
        } catch (_) {}
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Auto-play required user interaction or failed:', err);
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener('loadedmetadata', resetTimeToZero);
      audio.removeEventListener('canplay', resetTimeToZero);
      audio.removeEventListener('play', resetTimeToZero);
      audio.removeEventListener('playing', resetTimeToZero);
    };
  }, [currentTrackIndex, currentTrack.src]);

  // Auto pause music during live call speech & auto resume after 5s silence; duck 50% for voice notes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isCallSpeaking) {
      if (duckRatio === 0.4) {
        // Live call speech / ringing: AUTO PAUSE music on both ends
        if (isPlaying || !audio.paused) {
          wasAutoPausedByCallRef.current = true;
          audio.pause();
          setIsPlaying(false);
        }
      }
    } else {
      // 5 seconds of voice inactivity completed -> AUTO RESUME music
      if (wasAutoPausedByCallRef.current) {
        wasAutoPausedByCallRef.current = false;
        audio.play().then(() => setIsPlaying(true)).catch(err => console.warn('Auto-resume playback prevented:', err));
      }
    }

    const baseVol = isMuted ? 0 : volume;
    // Lower volume to 50% for voice note recording/listening
    const targetVol = (isCallSpeaking && duckRatio === 0.5) ? baseVol * 0.5 : baseVol;

    if (volumeRampRef.current) {
      clearInterval(volumeRampRef.current);
    }

    // Smoothly interpolate current volume to target volume
    volumeRampRef.current = setInterval(() => {
      if (!audioRef.current) return;
      const currentVol = audioRef.current.volume;
      const diff = targetVol - currentVol;

      if (Math.abs(diff) < 0.008) {
        audioRef.current.volume = targetVol;
        clearInterval(volumeRampRef.current);
        volumeRampRef.current = null;
      } else {
        const step = diff > 0 ? 0.035 : 0.07;
        audioRef.current.volume = Math.max(0, Math.min(1, currentVol + diff * step));
      }
    }, 20);

    return () => {
      if (volumeRampRef.current) {
        clearInterval(volumeRampRef.current);
        volumeRampRef.current = null;
      }
    };
  }, [isCallSpeaking, duckRatio, isPlaying, volume, isMuted]);

  // Update progress via requestAnimationFrame
  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      setCurrentTime(audio.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, updateProgress]);

  // Audio event handlers
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
      } catch (_) {}
      setDuration(audioRef.current.duration || 0);
    }
    setCurrentTime(0);
  };

  const handleEnded = () => {
    handleNext();
  };

  const handleAudioError = () => {
    setIsLoading(false);
    console.error('Audio failed to load:', currentTrack.src);
    
    // Fallback to matching local track or next track if stream fails to play
    const songTitleLower = (currentTrack.title || '').toLowerCase();
    const fallback = LOCAL_TRACKS.find(t => songTitleLower.includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(songTitleLower)) || LOCAL_TRACKS[0];
    
    if (fallback && audioRef.current && currentTrack.src !== fallback.src) {
      console.warn(`Stream load failed. Falling back to local track for ${currentTrack.title}`);
      audioRef.current.src = fallback.src;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => handleNext());
    } else {
      handleNext();
    }
  };

  // Controls
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Playback failed:', err);
        setIsPlaying(false);
      }
    }
  };

  const playedIndicesRef = useRef([]);

  // Get a random next track index that avoids repeating recent tracks
  const getRandomNextIndex = useCallback(() => {
    if (!tracks || tracks.length <= 1) return 0;
    
    const available = [];
    for (let i = 0; i < tracks.length; i++) {
      if (i !== currentTrackIndex && !playedIndicesRef.current.includes(i)) {
        available.push(i);
      }
    }
    
    if (available.length === 0) {
      playedIndicesRef.current = [currentTrackIndex];
      for (let i = 0; i < tracks.length; i++) {
        if (i !== currentTrackIndex) available.push(i);
      }
    }

    const randomIndex = available[Math.floor(Math.random() * available.length)];
    playedIndicesRef.current.push(randomIndex);
    if (playedIndicesRef.current.length > Math.min(tracks.length - 1, 15)) {
      playedIndicesRef.current.shift();
    }
    return randomIndex;
  }, [tracks, currentTrackIndex]);

  const handlePrev = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      try { audioRef.current.currentTime = 0; } catch (_) {}
    }
    if (currentTime > 3) {
      setCurrentTime(0);
      if (user && isPlaying && (!djSession || djSession.isMaster)) {
        setDoc(doc(db, 'now_playing', user.uid), {
          userId: user.uid,
          displayName: generateUserName(user.uid),
          songTitle: currentTrack.title,
          artist: currentTrack.artist || 'Artist',
          cover: currentTrack.cover || '',
          timestamp: Date.now(),
          playbackTime: 0,
          isPlaying: true
        }, { merge: true }).catch(()=>{});
      }
    } else {
      const prevIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
      setCurrentTrackIndex(prevIndex);
    }
  }, [currentTrackIndex, tracks ? tracks.length : 0, setCurrentTrackIndex, user, isPlaying, djSession, currentTrack, currentTime]);

  const handleNext = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      try { audioRef.current.currentTime = 0; } catch (_) {}
    }
    const nextIndex = getRandomNextIndex();
    setCurrentTrackIndex(nextIndex);
  }, [getRandomNextIndex, setCurrentTrackIndex]);

  return (
    <div className="modern-player-wrapper">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="auto"
        onLoadStart={() => setIsLoading(true)}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPause={() => setIsLoading(false)}
        onEnded={handleEnded}
        onError={handleAudioError}
      />
      
      <div className={`modern-player ${isPlaying ? 'is-playing' : ''} ${(djSession && !djSession.isMaster) ? 'slave-mode' : ''}`}>
        {/* Song Name Above */}
        <div className="player-info">
          <div className="player-title">{isLoading ? 'Loading...' : (currentTrack.title || 'Music Track')}</div>
        </div>

        {/* Playback Controls Below (No timestamp) */}
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
          {onOpenSearch && (
            <button className="player-btn search-player-btn" onClick={onOpenSearch} title="Search Online Songs">
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
