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
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const isYtApiReadyRef = useRef(false);
  const hasSeekedZeroRef = useRef(false);
  const animationRef = useRef(null);
  const volumeRampRef = useRef(null);

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
        updatedAt: Date.now()
      }).catch(err => console.error('Error syncing now_playing:', err));
    } else {
      deleteDoc(userRef).catch(err => console.error('Error deleting now_playing:', err));
    }
  }, [user, isPlaying, currentTrack, djSession]);

  // Master/Slave synchronization for listening sessions
  useEffect(() => {
    if (!djSession) return;

    const sessionRef = doc(db, 'dj_sessions', djSession.id);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      if (!djSession.isMaster) {
        if (data.currentTrackIndex !== undefined && data.currentTrackIndex !== currentTrackIndex) {
          setCurrentTrackIndex(data.currentTrackIndex);
        }
        if (data.isPlaying !== undefined && data.isPlaying !== isPlaying) {
          if (data.isPlaying) {
            playMedia();
          } else {
            pauseMedia();
          }
        }
      }
    });

    return () => unsubscribe();
  }, [djSession, currentTrackIndex, isPlaying, setCurrentTrackIndex]);

  const updateMasterSession = useCallback((newIndex, newIsPlaying) => {
    if (!djSession || !djSession.isMaster) return;
    const sessionRef = doc(db, 'dj_sessions', djSession.id);
    setDoc(sessionRef, {
      currentTrackIndex: newIndex !== undefined ? newIndex : currentTrackIndex,
      isPlaying: newIsPlaying !== undefined ? newIsPlaying : isPlaying,
      lastUpdated: Date.now()
    }, { merge: true }).catch(err => console.error('Error updating master session:', err));
  }, [djSession, currentTrackIndex, isPlaying]);

  const getRandomNextIndex = useCallback(() => {
    if (!tracks || tracks.length <= 1) return 0;
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } while (nextIndex === currentTrackIndex);
    return nextIndex;
  }, [tracks, currentTrackIndex]);

  const handleNext = useCallback(() => {
    pauseMedia();
    const nextIndex = getRandomNextIndex();
    setCurrentTrackIndex(nextIndex);
    if (djSession && djSession.isMaster) {
      updateMasterSession(nextIndex, true);
    }
  }, [getRandomNextIndex, setCurrentTrackIndex, djSession, updateMasterSession]);

  const handlePrev = useCallback(() => {
    pauseMedia();
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

  // Handle Track Changes (Zero out timestamp)
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

    // Handle YouTube track (Enforce startSeconds: 0)
    if (currentTrack.ytId) {
      const videoId = currentTrack.ytId;

      const initOrLoadYt = () => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById({ videoId: videoId, startSeconds: 0 });
          try { ytPlayerRef.current.seekTo(0, true); } catch (_) {}
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          setIsLoading(false);
        } else if (window.YT && window.YT.Player && ytContainerRef.current) {
          ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
            height: '1',
            width: '1',
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
                try { evt.target.seekTo(0, true); } catch (_) {}
                evt.target.playVideo();
                setIsPlaying(true);
                setIsLoading(false);
              },
              onStateChange: (evt) => {
                if (evt.data === window.YT.PlayerState.PLAYING) {
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
      <div style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}>
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
