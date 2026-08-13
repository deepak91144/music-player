import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { db, auth, generateUserName } from './firebase';
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

  const sendReaction = async (targetUser, emoji) => {
    if (!auth.currentUser) return;
    try {
      if (emoji === '🎧') {
        await addDoc(collection(db, 'invites'), {
          fromUserId: auth.currentUser.uid,
          fromUserName: generateUserName(auth.currentUser.uid),
          toUserId: targetUser.userId,
          toUserName: targetUser.displayName,
          songTitle: targetUser.songTitle,
          status: 'pending',
          timestamp: Date.now()
        });
      } else {
        await addDoc(collection(db, 'reactions'), {
          fromUserId: auth.currentUser.uid,
          fromUserName: generateUserName(auth.currentUser.uid),
          toUserId: targetUser.userId,
          emoji: emoji,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error("Failed to send reaction", err);
    }
  };

  if (activeUsers.length === 0) return null;

  return (
    <div className={`live-feed ${isOpen ? 'open' : 'closed'}`}>
      <div className="live-feed-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="live-indicator"></span>
        <h3>Active Listeners</h3>
        <span className="toggle-icon">{isOpen ? '▼' : '▲'}</span>
      </div>
      
      <div className="live-feed-list">
        {activeUsers.map((user) => (
          <div key={user.userId} className="live-user-card group">
            <div className="user-avatar" style={{backgroundImage: `url(${user.cover})`}}></div>
            <div className="user-info">
              <span className="user-name">{user.displayName} {auth.currentUser?.uid === user.userId && '(You)'}</span>
              <span className="user-song">listening to <strong>{user.songTitle}</strong></span>
            </div>
            
            {auth.currentUser?.uid !== user.userId && (
              <div className="reaction-menu">
                <button onClick={() => sendReaction(user, '🔥')}>🔥</button>
                <button onClick={() => sendReaction(user, '❤️')}>❤️</button>
                <button onClick={() => sendReaction(user, '🎵')}>🎵</button>
                <button onClick={() => sendReaction(user, '👏')}>👏</button>
                <button onClick={() => sendReaction(user, '🎧')} title="Listen Together">🎧</button>
              </div>
            )}

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
