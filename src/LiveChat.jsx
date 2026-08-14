import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, generateUserName } from './firebase';
import './LiveChat.css';

export default function LiveChat({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Subscribe to room chat messages
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
      
      // Sort messages locally by timestamp
      msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      
      setMessages(msgs);
    }, (err) => {
      console.error("LiveChat listener error:", err);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Subscribe to real-time typing indicators in the room
  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, 'typing_status'),
      where('roomId', '==', roomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typers = [];
      const now = Date.now();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          data.userId !== auth.currentUser?.uid &&
          data.isTyping &&
          now - (data.lastUpdated || 0) < 6000
        ) {
          typers.push(data.userName || 'Someone');
        }
      });
      setTypingUsers(typers);
    }, (err) => {
      console.warn("Typing listener warning:", err);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Clear current user's typing status from Firestore
  const stopTyping = () => {
    if (!auth.currentUser || !roomId) return;
    const docRef = doc(db, 'typing_status', `${roomId}_${auth.currentUser.uid}`);
    deleteDoc(docRef).catch(() => {});
  };

  // Send typing heartbeat to Firestore on input change
  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);

    if (!auth.currentUser || !roomId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (val.trim().length > 0) {
      const docRef = doc(db, 'typing_status', `${roomId}_${auth.currentUser.uid}`);
      setDoc(docRef, {
        roomId,
        userId: auth.currentUser.uid,
        userName: generateUserName(auth.currentUser.uid),
        isTyping: true,
        lastUpdated: Date.now()
      }, { merge: true }).catch(() => {});

      // Auto clear typing status after 2.5s of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2500);
    } else {
      stopTyping();
    }
  };

  // Compress and convert selected photo to base64 data URL
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with 0.7 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setSelectedImage(compressedBase64);
        setIsCompressing(false);
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !auth.currentUser || isCompressing) return;

    const textToSend = newMessage.trim();
    const imageToSend = selectedImage;

    // Reset input fields & stop typing indicator immediately
    setNewMessage('');
    setSelectedImage(null);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stopTyping();

    try {
      await addDoc(collection(db, 'chats'), {
        roomId,
        senderId: auth.currentUser.uid,
        senderName: generateUserName(auth.currentUser.uid),
        text: textToSend,
        image: imageToSend || null,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="live-chat-container">
      {/* Lightbox for full screen photo view */}
      {lightboxImage && (
        <div className="chat-lightbox" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Full view" className="lightbox-img" />
            <button className="lightbox-close" onClick={() => setLightboxImage(null)}>&times;</button>
          </div>
        </div>
      )}

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
              <div className="message-bubble">
                {msg.image && (
                  <div className="chat-photo-wrapper" onClick={() => setLightboxImage(msg.image)}>
                    <img src={msg.image} alt="Chat photo" className="chat-photo-img" />
                  </div>
                )}
                {msg.text && <div className="chat-text">{msg.text}</div>}
              </div>
            </div>
          );
        })}

        {/* Real-time Animated Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator-wrapper">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : typingUsers.length === 2
                ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                : 'Several people are typing...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected photo attachment preview before sending */}
      {selectedImage && (
        <div className="chat-image-preview">
          <img src={selectedImage} alt="Preview" />
          <button className="remove-preview-btn" onClick={() => setSelectedImage(null)} title="Remove photo">
            &times;
          </button>
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSend}>
        {/* Hidden File Input for photos */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />

        {/* Photo Upload Button */}
        <button
          type="button"
          className="chat-photo-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Send Photo"
          disabled={isCompressing}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder={isCompressing ? 'Processing photo...' : 'Say something or send a photo...'}
          className="chat-input"
          disabled={isCompressing}
        />

        <button type="submit" className="chat-send-btn" disabled={isCompressing || (!newMessage.trim() && !selectedImage)}>
          Send
        </button>
      </form>
    </div>
  );
}
