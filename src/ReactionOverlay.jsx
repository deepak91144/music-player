import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import './ReactionOverlay.css';

export default function ReactionOverlay({ setDjSession }) {
  const [reactions, setReactions] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    // Only listen for new reactions from now onwards
    const startTime = Date.now();
    
    const q = query(
      collection(db, 'reactions'),
      where('timestamp', '>=', startTime),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const id = change.doc.id;
          
          const newReaction = { id, ...data, randomX: Math.random() * 80 + 10 }; // 10% to 90% across screen
          
          setReactions(prev => [...prev, newReaction]);
          
          // Remove from screen after animation (4s)
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
          }, 4000);

          // Check if targeted at me
          if (auth.currentUser && data.toUserId === auth.currentUser.uid) {
            setToasts(prev => [...prev, newReaction]);
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== id));
            }, 4000);
          }
        }
      });
    }, (error) => {
      console.warn("ReactionOverlay error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Listen for incoming invites
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const qInvites = query(
          collection(db, 'invites'),
          where('toUserId', '==', user.uid),
          where('status', '==', 'pending'),
          where('timestamp', '>=', Date.now() - 60000) // only invites from the last minute
        );

        const unsubscribeInvites = onSnapshot(qInvites, (snapshot) => {
          const newInvites = [];
          snapshot.forEach((docSnap) => {
             newInvites.push({ id: docSnap.id, ...docSnap.data() });
          });
          setInvites(newInvites);
        });
        
        return () => unsubscribeInvites();
      }
    });
    
    return () => unsubscribeAuth();
  }, []);

  const handleAcceptInvite = (invite) => {
    if (setDjSession) {
      setDjSession({ id: invite.fromUserId, name: invite.fromUserName });
    }
    updateDoc(doc(db, 'invites', invite.id), { status: 'accepted' }).catch(()=>{});
  };

  const handleDeclineInvite = (invite) => {
    updateDoc(doc(db, 'invites', invite.id), { status: 'declined' }).catch(()=>{});
  };

  return (
    <div className="reaction-overlay-container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {/* Invites */}
        {invites.map(invite => (
          <div key={`invite-${invite.id}`} className="reaction-toast invite-toast">
            <span className="toast-emoji">🎧</span>
            <span className="toast-text">
              <strong>{invite.fromUserName}</strong> invited you to listen to <strong>{invite.songTitle}</strong> together!
            </span>
            <div className="invite-actions">
              <button onClick={() => handleAcceptInvite(invite)} className="btn-accept">Accept</button>
              <button onClick={() => handleDeclineInvite(invite)} className="btn-decline">Decline</button>
            </div>
          </div>
        ))}

        {/* Regular Reaction Toasts */}
        {toasts.map(toast => (
          <div key={`toast-${toast.id}`} className="reaction-toast">
            <span className="toast-emoji">{toast.emoji}</span>
            <span className="toast-text">
              <strong>{toast.fromUserName}</strong> sent you a reaction!
            </span>
          </div>
        ))}
      </div>

      {/* Floating Bubbles */}
      <div className="floating-bubbles-container">
        {reactions.map(reaction => (
          <div 
            key={`bubble-${reaction.id}`} 
            className="floating-bubble"
            style={{ left: `${reaction.randomX}%` }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
