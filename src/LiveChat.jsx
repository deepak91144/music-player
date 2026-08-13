import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth, generateUserName } from './firebase';
import './LiveChat.css';

export default function LiveChat({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    
    const q = query(
      collection(db, 'chats'),
      where('roomId', '==', roomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort messages locally to avoid requiring a Firestore composite index
      msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      
      setMessages(msgs);
    }, (err) => {
      console.error("LiveChat listener error:", err);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'chats'), {
        roomId,
        senderId: auth.currentUser.uid,
        senderName: generateUserName(auth.currentUser.uid),
        text: newMessage,
        timestamp: Date.now() // Use Date.now() for simple local sorting
      });
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="live-chat-container">
      <div className="chat-header">
        <h3>Live Chat</h3>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => {
          const isMe = auth.currentUser?.uid === msg.senderId;
          return (
            <div key={msg.id} className={`chat-message ${isMe ? 'message-mine' : 'message-theirs'}`}>
              <div className="message-header-info">
                {!isMe && <span className="message-sender">{msg.senderName}</span>}
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-bubble">{msg.text}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Say something..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn">Send</button>
      </form>
    </div>
  );
}
