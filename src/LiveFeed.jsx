import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { db, auth, generateUserName } from './firebase';
import './LiveFeed.css';

export default function LiveFeed() {
  const [rawUsers, setRawUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

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
      setRawUsers(users);
    }, (error) => {
      console.warn("LiveFeed error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Filter stale users dynamically & sort them STABLY (prevents list from jumping around on heartbeats)
  useEffect(() => {
    const filterUsers = () => {
      const now = Date.now();
      const currentUid = auth.currentUser?.uid;

      const freshUsers = rawUsers.filter(u => {
        const isFresh = u.timestamp && (now - u.timestamp < 15000);
        return isFresh && u.isPlaying !== false;
      });

      // Stable sort: Current user first, then alphabetically by name
      freshUsers.sort((a, b) => {
        if (a.userId === currentUid) return -1;
        if (b.userId === currentUid) return 1;
        return (a.displayName || '').localeCompare(b.displayName || '');
      });

      setActiveUsers(freshUsers);
    };

    filterUsers();
    const interval = setInterval(filterUsers, 2000);
    return () => clearInterval(interval);
  }, [rawUsers]);

  const sendReaction = async (e, targetUser, emoji) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
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
        setToastMessage(`🎧 Request sent to ${targetUser.displayName}!`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        await addDoc(collection(db, 'reactions'), {
          fromUserId: auth.currentUser.uid,
          fromUserName: generateUserName(auth.currentUser.uid),
          toUserId: targetUser.userId,
          emoji: emoji,
          timestamp: Date.now()
        });
        setToastMessage(`Sent ${emoji} to ${targetUser.displayName}`);
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (err) {
      console.error("Failed to send reaction", err);
    }
  };

  if (activeUsers.length === 0) return null;

  return (
    <>
      {toastMessage && (
        <div className="request-sent-toast">
          {toastMessage}
        </div>
      )}

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
              <div className="reaction-menu" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={(e) => sendReaction(e, user, '🔥')} title="Send Fire Reaction">🔥</button>
                <button type="button" onClick={(e) => sendReaction(e, user, '❤️')} title="Send Heart Reaction">❤️</button>
                <button type="button" onClick={(e) => sendReaction(e, user, '🎧')} title="Listen Together">🎧</button>
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
    </>
  );
}
