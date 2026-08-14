import React, { useState, useEffect } from 'react';
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
          <div className="avatar-face dj-face">
            <span className="face-expression">(•‿•)</span>
          </div>
          <span className="duo-badge dj-badge">DJ</span>
        </div>
        <span className="duo-username">{djName}</span>
      </div>

      {/* Musical Connection Soundwaves */}
      <div className="duo-audio-bridge">
        <span className="music-note n1">🎵</span>
        <div className="connecting-equalizer">
          <span className="eq-bar b1"></span>
          <span className="eq-bar b2"></span>
          <span className="eq-bar b3"></span>
          <span className="eq-bar b4"></span>
        </div>
        <span className="music-note n2">🎶</span>
      </div>

      {/* Listener Character */}
      <div className="duo-character listener-side">
        <div className="character-avatar-box">
          <div className="headphones-graphic">🎧</div>
          <div className="avatar-face listener-face">
            <span className="face-expression">(◠‿◠)</span>
          </div>
          <span className="duo-badge listener-badge">LISTENER</span>
        </div>
        <span className="duo-username">{listenerName}</span>
      </div>
    </div>
  );
};

export default function RoomPage({ djSession, setDjSession, children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('room_bg_theme') || 'romantic';
  });

  const myName = auth.currentUser ? generateUserName(auth.currentUser.uid) : "You";
  const partnerName = djSession.partnerName || "Partner";

  const djName = djSession.isMaster ? `${myName} (You)` : partnerName;
  const listenerName = djSession.isMaster ? partnerName : `${myName} (You)`;

  // Real-time synchronization of background theme across users in room
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

      {/* Header - Theme Selector on Left, Leave Session on Right */}
      <div className="room-header">
        <div className="theme-selector-container">
          <span className="theme-label">Theme:</span>
          <div className="theme-pills">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={`theme-pill-btn ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => handleThemeChange(theme.id)}
                title={`Switch to ${theme.name} background theme`}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>

        <button className="leave-room-btn" onClick={() => setDjSession(null)}>
          Leave Session
        </button>
      </div>

      <div className="room-content">
        <div className="room-player-section">
          <ListeningDuo djName={djName} listenerName={listenerName} />
          {children}
        </div>
        <div className="room-chat-section">
          <LiveChat roomId={djSession.roomId} />
        </div>
      </div>
    </div>
  );
}
