import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import LiveChat from './LiveChat';
import { db, auth, generateUserName } from './firebase';
import './RoomPage.css';

const THEMES = [
  { id: 'romantic', name: '💖 Romantic', icon: '💖' },
  { id: 'cozy', name: '☕ Cozy', icon: '☕' },
  { id: 'lazy', name: '🛋️ Lazy', icon: '🛋️' },
  { id: 'sleepy', name: '🌙 Sleepy', icon: '🌙' },
];

const ListeningDuo = ({ djName, listenerName }) => {
  return (
    <div className="listening-duo">
      {/* DJ Character */}
      <div className="duo-character dj-side">
        <div className="character-avatar-box">
          <div className="headphones-graphic">🎧</div>
          <div className="character-face dj-face"></div>
        </div>
        <span className="duo-role-badge">🎧 DJ</span>
        <span className="duo-username">{djName}</span>
      </div>

      {/* Connection heart animation */}
      <div className="duo-connection-heart">
        <span className="heart-pulse">💖</span>
        <span className="wave-ring wave1"></span>
        <span className="wave-ring wave2"></span>
      </div>

      {/* Listener Character */}
      <div className="duo-character listener-side">
        <div className="character-avatar-box">
          <div className="headphones-graphic">🎧</div>
          <div className="character-face listener-face"></div>
        </div>
        <span className="duo-role-badge listener-badge">✨ Listener</span>
        <span className="duo-username">{listenerName}</span>
      </div>
    </div>
  );
};

export default function RoomPage({ djSession, setDjSession, children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('room_bg_theme') || 'romantic';
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [duckState, setDuckState] = useState({ isDucked: false, duckRatio: 1.0 });

  const prevCallStatusRef = useRef('idle');

  const handleCallStatusChange = useCallback((status) => {
    // Only auto-open sidebar when call transitions into 'incoming' or 'calling'
    if (status !== prevCallStatusRef.current) {
      if (status === 'incoming' || status === 'calling') {
        setIsChatOpen(true);
      }
      prevCallStatusRef.current = status;
    }
  }, []);

  const myName = auth.currentUser ? generateUserName(auth.currentUser.uid) : "You";
  const partnerName = djSession.partnerName || "Partner";

  const djName = djSession.isMaster ? `${myName} (You)` : partnerName;
  const listenerName = djSession.isMaster ? partnerName : `${myName} (You)`;

  // Real-time synchronization of background theme
  useEffect(() => {
    if (!djSession?.roomId) return;

    const themeDocRef = doc(db, 'room_themes', djSession.roomId);
    
    const unsubscribe = onSnapshot(themeDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.theme) {
          setCurrentTheme(data.theme);
          localStorage.setItem('room_bg_theme', data.theme);
        }
      }
    });

    return () => unsubscribe();
  }, [djSession?.roomId]);

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('room_bg_theme', themeId);

    if (djSession?.roomId) {
      setDoc(doc(db, 'room_themes', djSession.roomId), {
        theme: themeId,
        updatedBy: auth.currentUser?.uid || 'user',
        timestamp: Date.now()
      }, { merge: true }).catch(err => console.warn("Theme sync error:", err));
    }
  };

  return (
    <div className={`room-page-container theme-${currentTheme}`}>
      {/* Ambient background glow layers */}
      <div className="theme-ambient-glow"></div>
      <div className="theme-ambient-particles"></div>

      {/* Header */}
      <div className="room-header">
        <div className="room-header-title">
          <span className="room-title-badge">🎵 Listening Session</span>
        </div>

        <button className="leave-room-btn" onClick={() => setDjSession(null)}>
          Leave Session
        </button>
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

        {/* Chat Section / Sidebar (90% width on mobile) */}
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

      {/* Floating Theme Button & Popup Menu (Hidden when sidebar is open) */}
      {!isChatOpen && (
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
      )}

      {/* Floating Chat Icon Button (Only visible when sidebar is closed) */}
      {!isChatOpen && (
        <button 
          className="floating-chat-btn" 
          onClick={() => {
            setIsChatOpen(true);
            setIsThemeMenuOpen(false);
          }}
          title="Open Live Chat"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="floating-chat-label">Chat</span>
        </button>
      )}
    </div>
  );
}
