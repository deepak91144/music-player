import React from 'react';
import LiveChat from './LiveChat';
import './RoomPage.css';

export default function RoomPage({ djSession, setDjSession, children }) {
  const roleText = djSession.isMaster ? "DJ" : "Listener";
  const partnerText = djSession.isMaster ? `Broadcasting to ${djSession.partnerName}` : `Listening to ${djSession.partnerName}`;

  return (
    <div className="room-page-container">
      {/* Ambient background effects */}
      <div className="ambient-bg-1"></div>
      <div className="ambient-bg-2"></div>
      
      <div className="room-header">
        <div className="room-title">
          <span className="live-badge">LIVE</span>
          <h2>Private Room</h2>
        </div>
        <div className="room-status">
          <span className="role-badge">{roleText}</span>
          <span className="partner-text">{partnerText}</span>
          <button className="leave-room-btn" onClick={() => setDjSession(null)}>Leave Room</button>
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
