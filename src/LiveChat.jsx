import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, generateUserName } from './firebase';
import './LiveChat.css';

const RTC_CONFIG = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]
};

// Mini Voice Note Player (Only Play/Pause button + progress indicator)
function VoiceNotePlayer({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(err => console.error(err));
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="voice-note-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
      />
      <button type="button" className="voice-play-pause-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      <div className="voice-note-meta">
        <span className="voice-label">🎙️ Voice Note</span>
        <div className="voice-progress-bar">
          <div className="voice-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
}

export default function LiveChat({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  // Voice note recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // WebRTC Live Call States: 'idle' | 'calling' | 'incoming' | 'connected'
  const [callStatus, setCallStatus] = useState('idle');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);

  const callStatusRef = useRef('idle');
  callStatusRef.current = callStatus;

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const myName = auth.currentUser ? generateUserName(auth.currentUser.uid) : "You";

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

  // WebRTC Signaling Listener - Always active when roomId is available
  useEffect(() => {
    if (!roomId) return;

    const callDocRef = doc(db, 'room_calls', roomId);

    const unsubscribe = onSnapshot(callDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        if (callStatusRef.current !== 'idle') {
          cleanupCall();
        }
        return;
      }

      const data = snapshot.data();
      const currentUserId = auth.currentUser?.uid;

      // Incoming call offer from partner
      if (data.offer && data.callerId !== currentUserId && callStatusRef.current === 'idle') {
        setIncomingCallData(data);
        setCallStatus('incoming');
      }

      // Partner answered our offer
      if (data.answer && pcRef.current && pcRef.current.signalingState !== 'stable') {
        const rtcAnswer = new RTCSessionDescription(data.answer);
        pcRef.current.setRemoteDescription(rtcAnswer).catch(err => console.warn('SetRemoteDescription error:', err));
        setCallStatus('connected');
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers, isRecording, callStatus]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Clean up WebRTC peer connection & media streams
  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    setCallStatus('idle');
    setIsMicMuted(false);
    setIncomingCallData(null);
  };

  // Start WebRTC Live Call inside LiveChat
  const startCall = async () => {
    try {
      setCallStatus('calling');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      // Add local audio track
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle remote audio stream
      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          setCallStatus('connected');
        }
      };

      const callDocRef = doc(db, 'room_calls', roomId);
      const callerCandidatesCol = collection(db, 'room_calls', roomId, 'callerCandidates');
      const calleeCandidatesCol = collection(db, 'room_calls', roomId, 'calleeCandidates');

      // Send ICE candidates to Firestore
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(callerCandidatesCol, event.candidate.toJSON()).catch(() => {});
        }
      };

      // Listen for callee's ICE candidates
      onSnapshot(calleeCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).catch(() => {});
          }
        });
      });

      // Create Offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type
      };

      const currentUid = auth.currentUser ? auth.currentUser.uid : `user_${Date.now()}`;

      await setDoc(callDocRef, {
        offer,
        callerId: currentUid,
        callerName: myName,
        timestamp: Date.now()
      });

      // Post notification message in live chat
      addDoc(collection(db, 'chats'), {
        roomId,
        senderId: currentUid,
        senderName: myName,
        text: '📞 Started a live voice call!',
        isCallNotice: true,
        timestamp: Date.now()
      }).catch(() => {});

    } catch (err) {
      console.error('Failed to start live voice call:', err);
      alert('Microphone access is required for live voice call.');
      cleanupCall();
    }
  };

  // Answer WebRTC Live Call
  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      // Add local audio track
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle remote audio stream
      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          setCallStatus('connected');
        }
      };

      const callDocRef = doc(db, 'room_calls', roomId);
      const callerCandidatesCol = collection(db, 'room_calls', roomId, 'callerCandidates');
      const calleeCandidatesCol = collection(db, 'room_calls', roomId, 'calleeCandidates');

      // Send callee ICE candidates to Firestore
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(calleeCandidatesCol, event.candidate.toJSON()).catch(() => {});
        }
      };

      // Listen for caller's ICE candidates
      onSnapshot(callerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).catch(() => {});
          }
        });
      });

      // Fetch latest call doc if incomingCallData is missing
      if (incomingCallData?.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
      }

      // Create Answer
      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp
      };

      await setDoc(callDocRef, { answer }, { merge: true });
      setCallStatus('connected');
    } catch (err) {
      console.error('Failed to answer call:', err);
      cleanupCall();
    }
  };

  // End / Reject Call
  const endCall = async () => {
    if (roomId) {
      deleteDoc(doc(db, 'room_calls', roomId)).catch(() => {});
    }
    cleanupCall();
  };

  // Toggle Mute Microphone
  const toggleMuteMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
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

  // Start Voice Note Recording with live mic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedAudio(reader.result);
          setAudioFileName(`Voice note (${formatDuration(recordingTime)})`);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone access is required to record voice notes');
    }
  };

  // Stop Voice Note Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Cancel Voice Note Recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
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
    if ((!newMessage.trim() && !selectedImage && !selectedAudio) || !auth.currentUser || isCompressing) return;

    const textToSend = newMessage.trim();
    const imageToSend = selectedImage;
    const audioToSend = selectedAudio;

    // Reset input fields & stop typing indicator immediately
    setNewMessage('');
    setSelectedImage(null);
    setSelectedAudio(null);
    setAudioFileName('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stopTyping();

    try {
      await addDoc(collection(db, 'chats'), {
        roomId,
        senderId: auth.currentUser.uid,
        senderName: generateUserName(auth.currentUser.uid),
        text: textToSend,
        image: imageToSend || null,
        audio: audioToSend || null,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="live-chat-container">
      {/* Hidden audio element for receiving remote peer voice call */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Lightbox for full screen photo view */}
      {lightboxImage && (
        <div className="chat-lightbox" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Full view" className="lightbox-img" />
            <button className="lightbox-close" onClick={() => setLightboxImage(null)}>&times;</button>
          </div>
        </div>
      )}

      {/* Live Chat Header with Live Call Action Button */}
      <div className="chat-header">
        <h3>Live Chat</h3>

        <div className="chat-call-actions">
          {callStatus === 'idle' && (
            <button type="button" className="chat-call-btn" onClick={startCall} title="Start Live Voice Call">
              📞 Live Call
            </button>
          )}

          {callStatus === 'calling' && (
            <button type="button" className="chat-call-btn calling" onClick={endCall} title="Cancel Calling">
              <span className="pulse-call-dot"></span> Calling... (Cancel)
            </button>
          )}

          {callStatus === 'incoming' && (
            <div className="chat-incoming-call">
              <span className="incoming-label">📞 Incoming Call</span>
              <button type="button" className="chat-answer-btn" onClick={answerCall} title="Answer Call">
                🟢 Answer
              </button>
              <button type="button" className="chat-decline-btn" onClick={endCall} title="Decline Call">
                🔴 Decline
              </button>
            </div>
          )}

          {callStatus === 'connected' && (
            <div className="chat-active-call">
              <span className="active-dot"></span>
              <button type="button" className={`chat-mute-btn ${isMicMuted ? 'muted' : ''}`} onClick={toggleMuteMic}>
                {isMicMuted ? '🔇 Unmute' : '🎙️ Mute'}
              </button>
              <button type="button" className="chat-end-call-btn" onClick={endCall} title="End Call">
                🔴 End
              </button>
            </div>
          )}
        </div>
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
                {msg.audio && (
                  <VoiceNotePlayer audioUrl={msg.audio} />
                )}
                {msg.isCallNotice ? (
                  <div className="chat-call-notice-card">
                    <span className="notice-icon">📞</span>
                    <span className="notice-title">{msg.text}</span>
                    {!isMe && callStatus === 'idle' && (
                      <button type="button" className="notice-join-btn" onClick={answerCall}>
                        📞 Join Voice Call
                      </button>
                    )}
                  </div>
                ) : (
                  msg.text && <div className="chat-text">{msg.text}</div>
                )}
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
        <div className="chat-attachment-preview">
          <img src={selectedImage} alt="Preview" className="preview-thumb" />
          <span>Photo attached</span>
          <button className="remove-preview-btn" onClick={() => setSelectedImage(null)} title="Remove photo">
            &times;
          </button>
        </div>
      )}

      {/* Selected voice note attachment preview before sending */}
      {selectedAudio && (
        <div className="chat-attachment-preview audio-preview">
          <span className="preview-icon">🎙️</span>
          <span className="preview-filename">{audioFileName || 'Voice note ready'}</span>
          <button className="remove-preview-btn" onClick={() => { setSelectedAudio(null); setAudioFileName(''); }} title="Remove voice note">
            &times;
          </button>
        </div>
      )}

      {/* Active Recording Bar Overlay */}
      {isRecording ? (
        <div className="chat-recording-bar">
          <div className="recording-indicator">
            <span className="recording-rec-dot"></span>
            <span>Recording voice note... <strong>{formatDuration(recordingTime)}</strong></span>
          </div>
          <div className="recording-actions">
            <button type="button" className="rec-cancel-btn" onClick={cancelRecording} title="Cancel Recording">
              Cancel
            </button>
            <button type="button" className="rec-stop-btn" onClick={stopRecording} title="Done Recording">
              ✓ Done
            </button>
          </div>
        </div>
      ) : (
        <form className="chat-input-form" onSubmit={handleSend}>
          {/* Hidden File Input for Photos */}
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
            className="chat-action-icon-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Send Photo"
            disabled={isCompressing}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </button>

          {/* Live Mic Voice Note Record Button Only */}
          <button
            type="button"
            className="chat-action-icon-btn mic-btn"
            onClick={startRecording}
            title="Record Voice Note"
            disabled={isCompressing}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder={isCompressing ? 'Processing photo...' : 'Say something, record voice note, or photo...'}
            className="chat-input"
            disabled={isCompressing}
          />

          <button type="submit" className="chat-send-btn" disabled={isCompressing || (!newMessage.trim() && !selectedImage && !selectedAudio)}>
            Send
          </button>
        </form>
      )}
    </div>
  );
}
