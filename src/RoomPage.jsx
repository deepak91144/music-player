import React from 'react';
import LiveChat from './LiveChat';
import './RoomPage.css';

export default function RoomPage({ djSession, setDjSession, currentTrack, children }) {
  const roleText = djSession.isMaster ? "MASTER DJ" : "LISTENER";
  const partnerText = djSession.isMaster 
    ? `Broadcasting to ${djSession.partnerName}` 
    : `Listening live with ${djSession.partnerName}`;

  const coverSrc = currentTrack?.cover || '/album_midnight.png';

  return (
    <div className="room-page-container">
      {/* Dynamic Album Art Ambient Backdrop */}
      <div className="dynamic-album-backdrop" style={{ backgroundImage: `url(${coverSrc})` }} />
      <div className="room-overlay-gradient" />

      {/* Subtle Ambient Orbs */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* Luxury Glass Header */}
      <div className="room-header">
        <div className="room-title-block">
          <div className="live-status-pill">
            <span className="pulse-dot" />
            <span className="live-text">SYNCED SESSION</span>
          </div>
          <h2 className="room-heading">Private Studio</h2>
        </div>

        <div className="room-status-block">
          <span className={`role-badge ${djSession.isMaster ? 'master' : 'listener'}`}>{roleText}</span>
          <span className="partner-info">{partnerText}</span>
          <button className="leave-room-btn" onClick={() => setDjSession(null)}>
            <span>Leave Session</span>
          </button>
        </div>
      </div>

      <div className="room-content">
        <div className="room-player-section">
          {children}
        </div>
        <div className="room-chat-section">
          <LiveChat roomId={djSession.roomId} />
        </div>
      </div>
    </div>
  );
}
