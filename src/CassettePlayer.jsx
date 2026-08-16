import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, signInAnonymousUser, generateUserName } from './firebase';
import { LOCAL_TRACKS } from './jiosaavnService';
import './CassettePlayer.css';

export default function CassettePlayer({ tracks, setTracks, currentTrackIndex, setCurrentTrackIndex, djSession, setDjSession, isCallSpeaking, duckRatio = 0.4, onOpenSearch }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const isYtApiReadyRef = useRef(false);
  const hasSeekedZeroRef = useRef(false);

  const currentTrack = tracks[currentTrackIndex] || tracks[0] || {};

  // Load YouTube iFrame API script on mount
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isYtApiReadyRef.current = true;
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      isYtApiReadyRef.current = true;
    };
  }, []);

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
      isPlaying: newIsPlaying !== undefined ? newIsPlaying : isPlaying,
      lastUpdated: Date.now()
    }, { merge: true }).catch(err => console.error('Error updating master session:', err));
  }, [djSession, currentTrackIndex, isPlaying, tracks, currentTrack]);

  // Master sends track state updates to Firestore whenever track or room changes
  useEffect(() => {
    if (djSession && djSession.isMaster && currentTrack && currentTrack.title) {
      updateMasterSession(currentTrackIndex, isPlaying);
    }
  }, [djSession?.isMaster, currentTrackIndex, djSession?.id]);

  // Listener Sync Effect (Slave mode)
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
          if (foundIdx !== currentTrackIndex) {
            setCurrentTrackIndex(foundIdx);
          }
        } else if (setTracks) {
          setTracks(prev => {
            const updated = [...prev, masterTrack];
            setCurrentTrackIndex(updated.length - 1);
            return updated;
          });
        }
      }

      if (masterIsPlaying) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    });

    return () => unsubscribe();
  }, [djSession?.id, djSession?.isMaster, tracks, currentTrackIndex, setCurrentTrackIndex, setTracks]);

  const handleNext = useCallback(() => {
    if (!tracks || tracks.length <= 1) return;
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    if (djSession && djSession.isMaster) {
      updateMasterSession(nextIndex, true);
    }
  }, [tracks, currentTrackIndex, setCurrentTrackIndex, djSession, updateMasterSession]);

  const handlePrev = useCallback(() => {
    if (!tracks || tracks.length <= 1) return;
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevIndex);
    if (djSession && djSession.isMaster) {
      updateMasterSession(prevIndex, true);
    }
  }, [tracks, currentTrackIndex, setCurrentTrackIndex, djSession, updateMasterSession]);

  const playMedia = () => {
    if (currentTrack.ytId && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      try {
        if (audioRef.current) audioRef.current.pause();
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(100);
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } catch (_) {}
    } else if (audioRef.current) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try { ytPlayerRef.current.pauseVideo(); } catch (_) {}
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const pauseMedia = () => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (_) {}
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      try { ytPlayerRef.current.pauseVideo(); } catch (_) {}
    }
    setIsPlaying(false);
  };

  // Handle Track & Playback State Changes (Auto-play YouTube & HTML5)
  useEffect(() => {
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(currentTrack.duration || 240);
    hasSeekedZeroRef.current = false;

    // Stop HTML5 audio
    if (audioRef.current) {
      audioRef.current.pause();
      try { audioRef.current.currentTime = 0; } catch (_) {}
    }

    // Handle YouTube track
    if (currentTrack.ytId) {
      const videoId = currentTrack.ytId;

      const initOrLoadYt = () => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById({ videoId: videoId, startSeconds: 0 });
          try { ytPlayerRef.current.seekTo(0, true); } catch (_) {}
          try { ytPlayerRef.current.unMute(); } catch (_) {}
          try { ytPlayerRef.current.setVolume(100); } catch (_) {}
          try { ytPlayerRef.current.playVideo(); } catch (_) {}
          setIsPlaying(true);
          setIsLoading(false);
        } else if (window.YT && window.YT.Player && ytContainerRef.current) {
          ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
            height: '200',
            width: '200',
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              rel: 0,
              modestbranding: 1,
              start: 0
            },
            events: {
              onReady: (evt) => {
                try { evt.target.unMute(); } catch (_) {}
                try { evt.target.setVolume(100); } catch (_) {}
                try { evt.target.seekTo(0, true); } catch (_) {}
                evt.target.playVideo();
                setIsPlaying(true);
                setIsLoading(false);
              },
              onStateChange: (evt) => {
                try { evt.target.unMute(); } catch (_) {}
                try { evt.target.setVolume(100); } catch (_) {}
                if (evt.data === window.YT.PlayerState.CUED) {
                  evt.target.playVideo();
                } else if (evt.data === window.YT.PlayerState.PLAYING) {
                  if (!hasSeekedZeroRef.current) {
                    hasSeekedZeroRef.current = true;
                    try { evt.target.seekTo(0, true); } catch (_) {}
                  }
                  setIsPlaying(true);
                  setIsLoading(false);
                } else if (evt.data === window.YT.PlayerState.ENDED) {
                  handleNext();
                } else if (evt.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                }
              },
              onError: () => {
                setIsLoading(false);
                handleNext();
              }
            }
          });
        }
      };

      if (window.YT && window.YT.Player) {
        initOrLoadYt();
      } else {
        const timer = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(timer);
            initOrLoadYt();
          }
        }, 200);
        return () => clearInterval(timer);
      }
    } else if (currentTrack.src && audioRef.current) {
      // Handle local .mp3 track
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try { ytPlayerRef.current.pauseVideo(); } catch (_) {}
      }
      audioRef.current.src = currentTrack.src;
      audioRef.current.load();
      try { audioRef.current.currentTime = 0; } catch (_) {}

      const playPromise = audioRef.current.play();
      if (playPromise) {
        playPromise.then(() => {
          try { audioRef.current.currentTime = 0; } catch (_) {}
          setIsPlaying(true);
          setIsLoading(false);
        }).catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
      }
    } else {
      setIsLoading(false);
    }
  }, [currentTrackIndex, currentTrack.src, currentTrack.ytId]);

  // Audio events for HTML5 audio
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      try { audioRef.current.currentTime = 0; } catch (_) {}
      setDuration(audioRef.current.duration || currentTrack.duration || 240);
    }
    setIsLoading(false);
  };

  const handleAudioError = () => {
    setIsLoading(false);
    handleNext();
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
      {/* Hidden YouTube Container */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '200px', height: '200px', opacity: 0.01, pointerEvents: 'none' }}>
        <div ref={ytContainerRef} id="yt-player-container" />
      </div>

      {/* Hidden HTML5 audio element */}
      <audio
        ref={audioRef}
        preload="auto"
        onLoadStart={() => setIsLoading(true)}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPause={() => setIsLoading(false)}
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
