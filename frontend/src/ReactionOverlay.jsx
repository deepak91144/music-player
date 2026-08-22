import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, generateUserName } from './firebase';
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
        // Query only by toUserId to avoid requiring a composite index in Firestore
        const qInvites = query(
          collection(db, 'invites'),
          where('toUserId', '==', user.uid)
        );

        const unsubscribeInvites = onSnapshot(qInvites, (snapshot) => {
          const newInvites = [];
          const oneMinuteAgo = Date.now() - 60000;
          
          snapshot.forEach((docSnap) => {
             const data = docSnap.data();
             // Filter by status and timestamp locally
             if (data.status === 'pending' && data.timestamp >= oneMinuteAgo) {
               newInvites.push({ id: docSnap.id, ...data });
             }
          });
          setInvites(newInvites);
        }, (error) => {
          console.error("Invites listener error:", error);
        });
        
        return () => unsubscribeInvites();
      }
    });
    
    return () => unsubscribeAuth();
  }, []);

  // Listen for outgoing accepted invites (for User A requesting to join User B)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const qOutgoing = query(
          collection(db, 'invites'),
          where('fromUserId', '==', user.uid)
        );

        const unsubscribeOutgoing = onSnapshot(qOutgoing, (snapshot) => {
          const oneMinuteAgo = Date.now() - 60000;
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // If our request was accepted recently, we become the slave to the target
            if (data.status === 'accepted' && data.timestamp >= oneMinuteAgo) {
              if (setDjSession) {
                setDjSession({ 
                  roomId: data.toUserId,
                  id: data.toUserId, 
                  name: data.toUserName || 'DJ',
                  partnerName: data.toUserName || 'DJ',
                  isMaster: false
                });
              }
              // Delete the invite so we don't trigger it again on reload
              deleteDoc(doc(db, 'invites', docSnap.id)).catch(()=>{});
            } else if (data.status === 'declined' && data.timestamp >= oneMinuteAgo) {
              // Sender receives notification that their request was rejected
              const declineToast = {
                id: docSnap.id,
                emoji: '❌',
                fromUserName: data.toUserName || 'User',
                isDeclinedToast: true
              };
              setToasts(prev => [...prev, declineToast]);
              setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== docSnap.id));
              }, 4500);

              // Delete the invite so it doesn't trigger again
              deleteDoc(doc(db, 'invites', docSnap.id)).catch(()=>{});
            }
          });
        });
        
        return () => unsubscribeOutgoing();
      }
    });
    return () => unsubscribeAuth();
  }, [setDjSession]);

  const handleAcceptInvite = (invite) => {
    // User B accepts it. User B becomes the Master of the new room.
    if (setDjSession && auth.currentUser) {
      setDjSession({
        roomId: auth.currentUser.uid,
        id: auth.currentUser.uid,
        name: generateUserName(auth.currentUser.uid),
        partnerName: invite.fromUserName,
        isMaster: true
      });
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
              <strong>{invite.fromUserName}</strong> wants to listen with you!
            </span>
            <div className="invite-actions">
              <button onClick={() => handleAcceptInvite(invite)} className="btn-accept">Accept</button>
              <button onClick={() => handleDeclineInvite(invite)} className="btn-decline">Decline</button>
            </div>
          </div>
        ))}

        {/* Regular Reaction Toasts & Rejection Toasts */}
        {toasts.map(toast => (
          <div key={`toast-${toast.id}`} className="reaction-toast">
            <span className="toast-emoji">{toast.emoji}</span>
            <span className="toast-text">
              {toast.isDeclinedToast ? (
                <span><strong>{toast.fromUserName}</strong> declined your listen request.</span>
              ) : (
                <span><strong>{toast.fromUserName}</strong> sent you a reaction!</span>
              )}
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
