import { useState, useEffect, useRef, useCallback } from 'react';
import './CassettePlayer.css';

export default function CassettePlayer({ tracks, currentTrackIndex, setCurrentTrackIndex }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const animationRef = useRef(null);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Create / update audio element on track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Pause current playback before switching
    audio.pause();
    setIsLoading(true);
    audio.src = currentTrack.src;
    audio.load();

    setCurrentTime(0);
    setDuration(0);

    // If we were already playing, auto-play the new track
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => setIsPlaying(false));
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
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
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
    const bar = progressRef.current;
    if (!bar || !audioRef.current) return;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = pct * (audioRef.current.duration || 0);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
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
    <div className="cassette-container" id="cassette-player">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleAudioError}
      />


      {/* Cassette Tape Visual */}
      <div className="cassette-body">
        {/* Screws */}
        <div className="cassette-screw top-left" />
        <div className="cassette-screw top-right" />
        <div className="cassette-screw bottom-left" />
        <div className="cassette-screw bottom-right" />
        <div className="cassette-screw center-bottom" />

        {/* Label */}
        <div className="cassette-label">
          <div className="cassette-label-lines">
            <div className="cassette-label-line" />
            <div className="cassette-label-line" />
            <div className="cassette-label-line" />
            <div className="cassette-label-line" />
          </div>
          <div className="cassette-label-text">
            <div className={`cassette-label-title ${isPlaying ? 'scrolling' : ''}`}>
              {isLoading ? 'Loading...' : currentTrack.title}
            </div>
            <div className="cassette-label-artist">{currentTrack.artist}</div>
          </div>
        </div>

        {/* Tape Window with Reels */}
        <div className="cassette-window">
          <div
            className={`cassette-reel ${isPlaying ? 'spinning' : ''}`}
            style={isPlaying ? { animationDuration: `${reelSpeed}s` } : {}}
          >
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-inner">
              <div className="cassette-reel-hub" />
            </div>
          </div>

          <div className="cassette-tape">
            <div className={`cassette-tape-line ${isPlaying ? 'playing' : ''}`} />
          </div>

          <div
            className={`cassette-reel ${isPlaying ? 'spinning' : ''}`}
            style={isPlaying ? { animationDuration: `${Math.max(0.6, reelSpeed - 0.5)}s` } : {}}
          >
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-spoke" />
            <div className="cassette-reel-inner">
              <div className="cassette-reel-hub" />
            </div>
          </div>
        </div>

        <div className="cassette-side-indicator">SIDE A • 90</div>
      </div>

      {/* 3 Main Controls: Prev / Play-Pause / Next */}
      <div className="cassette-controls">
        <button className="ctrl-btn" onClick={handlePrev} title="Previous" id="btn-prev">
          ⏮
        </button>
        <button
          className={`ctrl-btn ctrl-play ${isLoading ? 'loading' : ''}`}
          onClick={togglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          id="btn-play-pause"
          disabled={isLoading}
        >
          {isLoading ? '⏳' : isPlaying ? '⏸' : '▶'}
        </button>
        <button className="ctrl-btn" onClick={handleNext} title="Next" id="btn-next">
          ⏭
        </button>
      </div>
    </div>
  );
}
