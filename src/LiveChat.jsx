import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
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
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'chats'), {
        roomId,
        senderId: auth.currentUser.uid,
        senderName: generateUserName(auth.currentUser.uid),
        text: newMessage,
        timestamp: serverTimestamp() // We can use serverTimestamp here
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
              {!isMe && <div className="message-sender">{msg.senderName}</div>}
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
