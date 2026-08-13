import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, signInAnonymousUser, generateUserName } from './firebase';
import './CassettePlayer.css';

export default function CassettePlayer({ tracks, currentTrackIndex, setCurrentTrackIndex, djSession, setDjSession }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const animationRef = useRef(null);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Sign in anonymously on mount
  useEffect(() => {
    signInAnonymousUser().then(u => setUser(u));
  }, []);

  // Sync playing state to Firestore (Only if NOT in DJ mode)
  useEffect(() => {
    if (!user || djSession) return;
    
    const userRef = doc(db, 'now_playing', user.uid);
    
    if (isPlaying) {
      setDoc(userRef, {
        userId: user.uid,
        displayName: generateUserName(user.uid),
        songTitle: currentTrack.title,
        artist: currentTrack.artist,
        cover: currentTrack.cover,
        timestamp: Date.now(),
        playbackTime: audioRef.current?.currentTime || 0,
        isPlaying: true
      }).catch(err => console.warn("Firestore error:", err));
    } else {
      // We can also just update it to isPlaying: false, but deleting is fine too.
      // Let's actually update it so the slave knows it paused.
      setDoc(userRef, {
        userId: user.uid,
        displayName: generateUserName(user.uid),
        songTitle: currentTrack.title,
        artist: currentTrack.artist,
        cover: currentTrack.cover,
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
    if (!djSession) return;
    
    const unsubscribe = onSnapshot(doc(db, 'now_playing', djSession.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Match Track
        const trackIndex = tracks.findIndex(t => t.title === data.songTitle);
        if (trackIndex !== -1 && trackIndex !== currentTrackIndex) {
           setCurrentTrackIndex(trackIndex);
        }
        
        const audio = audioRef.current;
        if (audio) {
          // Snap directly to the reported playback time if we're out of sync by > 2s
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
    if (!user || djSession || !isPlaying) return;
    
    const interval = setInterval(() => {
      setDoc(doc(db, 'now_playing', user.uid), {
        userId: user.uid,
        displayName: generateUserName(user.uid),
        songTitle: currentTrack.title,
        artist: currentTrack.artist,
        cover: currentTrack.cover,
        timestamp: Date.now(),
        playbackTime: audioRef.current?.currentTime || 0,
        isPlaying: true
      }, { merge: true }).catch(() => {});
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user, djSession, isPlaying, currentTrack]);

  // Create / update audio element on track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Pause current playback before switching
    audio.pause();
    
    audio.src = currentTrack.src;
    audio.load();

    setCurrentTime(0);
    setDuration(0);

    // If we were already playing, auto-play the new track
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, currentTrack.src]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Update progress via requestAnimationFrame for smooth UI
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
    setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    handleNext();
  };

  const handleAudioError = () => {
    setIsLoading(false);
    console.error('Audio failed to load:', currentTrack.src);
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

  const handlePrev = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else {
      const prevIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
      setCurrentTrackIndex(prevIndex);
    }
  }, [currentTrackIndex, tracks.length, setCurrentTrackIndex]);

  const handleNext = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
  }, [currentTrackIndex, tracks.length, setCurrentTrackIndex]);

  // Seek via progress bar click
  const handleSeek = (e) => {
    if (djSession) return; // Disabled in slave mode
    const bar = progressRef.current;
    if (!bar || !audioRef.current) return;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = pct * (audioRef.current.duration || 0);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    
    // Force sync to firebase on seek
    if (user && isPlaying && !djSession) {
      setDoc(doc(db, 'now_playing', user.uid), {
        userId: user.uid,
        displayName: generateUserName(user.uid),
        songTitle: currentTrack.title,
        artist: currentTrack.artist,
        cover: currentTrack.cover,
        timestamp: Date.now(),
        playbackTime: seekTime,
        isPlaying: true
      }).catch(()=>{});
    }
  };

  // Volume toggle
  const toggleMute = () => setIsMuted(prev => !prev);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const d = duration || 0;
  const progressPct = d > 0 ? (currentTime / d) * 100 : 0;

  // Reel speed slows as tape "runs out"
  const reelSpeed = d > 0 ? Math.max(0.8, 2.5 - (progressPct / 100) * 1.5) : 2;

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

      {djSession && (
        <div className="dj-mode-banner">
          🎧 Listening live with <strong>{djSession.name}</strong>
          <button onClick={() => setDjSession(null)} className="leave-dj-btn">Leave</button>
        </div>
      )}

      <div className={`modern-player ${isPlaying ? 'is-playing' : ''} ${djSession ? 'slave-mode' : ''}`}>
        {/* Track Info */}
        <div className="player-info">
          <div className="player-title">{isLoading ? 'Loading...' : currentTrack.title}</div>
        </div>

        {/* Progress Bar (Clickable only if not slaved) */}
        <div 
          className={`progress-container ${djSession ? 'disabled' : ''}`}
          ref={progressRef} 
          onClick={handleSeek}
        >
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
          </div>
          <div className="progress-time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(d)}</span>
          </div>
        </div>

        {/* Controls */}
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
        </div>
      </div>
    </div>
  );
}
