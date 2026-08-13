import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from './firebase';
import './LiveFeed.css';

export default function LiveFeed() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'now_playing'), 
      orderBy('timestamp', 'desc'), 
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = [];
      snapshot.forEach((doc) => {
        users.push(doc.data());
      });
      setActiveUsers(users);
    }, (error) => {
      console.warn("LiveFeed error:", error);
    });

    return () => unsubscribe();
  }, []);

  if (activeUsers.length === 0) return null;

  return (
    <div className={`live-feed ${isOpen ? 'open' : 'closed'}`}>
      <div className="live-feed-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="live-indicator"></span>
        <h3>Live Feed</h3>
        <span className="toggle-icon">{isOpen ? '▼' : '▲'}</span>
      </div>
      
      <div className="live-feed-list">
        {activeUsers.map((user) => (
          <div key={user.userId} className="live-user-card">
            <div className="user-avatar" style={{backgroundImage: `url(${user.cover})`}}></div>
            <div className="user-info">
              <span className="user-name">{user.displayName} {auth.currentUser?.uid === user.userId && '(You)'}</span>
              <span className="user-song">listening to <strong>{user.songTitle}</strong></span>
            </div>
            <div className="equalizer">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
