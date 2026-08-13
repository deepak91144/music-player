import React from 'react';
import LiveChat from './LiveChat';
import './RoomPage.css';

const FloatingParticles = () => {
  return (
    <div className="particles-container">
      {Array.from({ length: 15 }).map((_, i) => {
        const style = {
          left: `${Math.random() * 100}%`,
          animationDuration: `${10 + Math.random() * 20}s`,
          animationDelay: `${Math.random() * 5}s`,
          opacity: 0.1 + Math.random() * 0.3,
          transform: `scale(${0.5 + Math.random()})`
        };
        return <div key={i} className="particle-heart" style={style}>❤</div>;
      })}
    </div>
  );
};

export default function RoomPage({ djSession, setDjSession, children }) {
  const roleText = djSession.isMaster ? "DJ" : "Listener";
  const partnerText = djSession.isMaster ? `Broadcasting to ${djSession.partnerName}` : `Listening to ${djSession.partnerName}`;

  return (
    <div className="room-page-container">
      {/* Romantic background effects */}
      <div className="romantic-gradient"></div>
      <FloatingParticles />
      <div className="ambient-bg-1"></div>
      <div className="ambient-bg-2"></div>
      
      <div className="room-header">
        <div className="room-title">
          <span className="live-badge">❤ LIVE</span>
          <h2>Our Room</h2>
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
