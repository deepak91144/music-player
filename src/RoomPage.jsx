import React, { useState, useEffect } from 'react';
import LiveChat from './LiveChat';
import './RoomPage.css';

function ListeningDuo({ djName, listenerName }) {
  return (
    <div className="listening-duo">
      <div className="duo-character">
        <div className="character-avatar-box">
          <span className="headphones-graphic">🎧</span>
          <div className="avatar-face dj-face">
            <span className="face-expression">(◕‿◕)</span>
          </div>
          <span className="duo-badge dj-badge">DJ</span>
        </div>
        <span className="duo-username">{djName}</span>
      </div>

      <div className="duo-audio-bridge">
        <span className="music-note">🎵</span>
        <div className="connecting-equalizer">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className="music-note n2">🎶</span>
      </div>

      <div className="duo-character">
        <div className="character-avatar-box">
          <span className="headphones-graphic">🎧</span>
          <div className="avatar-face listener-face">
            <span className="face-expression">(⁠─⁠‿⁠─⁠)</span>
          </div>
          <span className="duo-badge listener-badge">LISTENER</span>
        </div>
        <span className="duo-username">{listenerName}</span>
      </div>
    </div>
  );
}

const THEMES = [
  { id: 'default', name: '✨ Midnight Purple', class: '' },
  { id: 'neon-cyberpunk', name: '⚡ Neon Cyberpunk', class: 'theme-neon-cyberpunk' },
  { id: 'sunset-lofi', name: '🌅 Sunset Lofi', class: 'theme-sunset-lofi' },
  { id: 'retro-synthwave', name: '📼 Retro Synthwave', class: 'theme-retro-synthwave' },
  { id: 'deep-space', name: '🌌 Deep Space', class: 'theme-deep-space' }
];

export default function RoomPage({ djSession, setDjSession, children, onOpenSearch }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('room_theme') || 'default';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [callNotice, setCallNotice] = useState(null);
  const [duckState, setDuckState] = useState({ isDucked: false, duckRatio: 0.4 });

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('room_theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('room_theme', themeId);
  };

  const handleCallStatusChange = (status) => {
    if (status.isCalling) {
      setCallNotice(`📞 Call in progress with ${status.callerName}`);
    } else if (status.isRinging) {
      setCallNotice(`🔔 ${status.callerName} is calling you...`);
    } else {
      setCallNotice(null);
    }
  };

  const djName = djSession.isMaster 
    ? (djSession.name || 'You (DJ)') 
    : (djSession.partnerName || djSession.name || 'DJ');
    
  const listenerName = djSession.isMaster 
    ? (djSession.partnerName || 'Listener') 
    : 'You (Listener)';

  const activeThemeClass = THEMES.find(t => t.id === currentTheme)?.class || '';

  return (
    <div className={`room-container ${activeThemeClass}`}>
      {/* Call Notice Banner */}
      {callNotice && (
        <div className="room-call-banner">
          <span>{callNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="room-header">
        <div className="room-header-title">
          <span className="room-title-badge">🎵 Listening Session</span>
        </div>

        <div className="room-header-actions">
          {onOpenSearch && (
            <button className="room-search-btn" onClick={onOpenSearch} title="Search Online Songs">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search Songs</span>
            </button>
          )}
          <button className="leave-room-btn" onClick={() => setDjSession(null)}>
            Leave Session
          </button>
        </div>
      </div>

      <div className="room-content">
        <div className="room-player-section">
          <ListeningDuo djName={djName} listenerName={listenerName} />
          {React.isValidElement(children) 
            ? React.cloneElement(children, { 
                isCallSpeaking: duckState.isDucked, 
                duckRatio: duckState.duckRatio 
              }) 
            : children}
        </div>

        {/* Chat Backdrop for Mobile Sidebar */}
        {isChatOpen && (
          <div 
            className="room-chat-backdrop" 
            onClick={() => setIsChatOpen(false)}
          />
        )}

        {/* Chat Section / Sidebar */}
        <div className={`room-chat-section ${isChatOpen ? 'mobile-open' : ''}`}>
          <div className="mobile-chat-header">
            <span className="mobile-chat-title">💬 Live Room Chat</span>
            <button 
              className="mobile-chat-close-btn" 
              onClick={() => setIsChatOpen(false)}
              aria-label="Close Chat"
              title="Close Chat"
            >
              ✕
            </button>
          </div>
          <LiveChat 
            roomId={djSession.roomId} 
            onSpeakingChange={(isDucked, ratio = 0.4) => setDuckState({ isDucked, duckRatio: ratio })} 
            onCallStatusChange={handleCallStatusChange}
          />
        </div>
      </div>

      {/* Floating Action Controls */}
      {!isChatOpen && (
        <div className="room-bottom-actions">
          {/* Floating Theme Button & Popup Menu */}
          <div className="floating-theme-wrapper">
            {isThemeMenuOpen && (
              <div className="floating-theme-menu">
                <div className="floating-theme-header">
                  <span>🎨 Choose Theme</span>
                  <button 
                    type="button" 
                    className="theme-menu-close-btn" 
                    onClick={() => setIsThemeMenuOpen(false)}
                    title="Close Theme Menu"
                  >
                    ✕
                  </button>
                </div>
                <div className="floating-theme-options">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      className={`theme-option-btn ${currentTheme === theme.id ? 'active' : ''}`}
                      onClick={() => {
                        handleThemeChange(theme.id);
                        setIsThemeMenuOpen(false);
                      }}
                      title={`Switch to ${theme.name}`}
                    >
                      <span className="theme-option-name">{theme.name}</span>
                      {currentTheme === theme.id && <span className="theme-check-icon">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              className={`floating-theme-btn ${isThemeMenuOpen ? 'active' : ''}`}
              onClick={() => setIsThemeMenuOpen(prev => !prev)}
              title="Choose Room Theme"
            >
              <span className="floating-theme-icon">🎨</span>
              <span className="floating-theme-label">Themes</span>
            </button>
          </div>

          {/* Mobile-only Search Button (Between Themes & Chat) */}
          {onOpenSearch && (
            <button 
              className="floating-search-btn-room" 
              onClick={onOpenSearch} 
              title="Search Online Songs"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search</span>
            </button>
          )}

          {/* Floating Chat Icon Button */}
          <button 
            className="floating-chat-btn" 
            onClick={() => {
              setIsChatOpen(true);
              setIsThemeMenuOpen(false);
            }}
            title="Open Live Chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="floating-chat-label">Chat</span>
          </button>
        </div>
      )}
    </div>
  );
}
