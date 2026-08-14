import React from 'react';
import LiveChat from './LiveChat';
import { auth, generateUserName } from './firebase';
import './RoomPage.css';

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
  const myName = auth.currentUser ? generateUserName(auth.currentUser.uid) : "You";
  const partnerName = djSession.partnerName || "Partner";

  const djName = djSession.isMaster ? `${myName} (You)` : partnerName;
  const listenerName = djSession.isMaster ? partnerName : `${myName} (You)`;

  return (
    <div className="room-page-container">
      {/* Header - Only Leave Session button */}
      <div className="room-header">
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
