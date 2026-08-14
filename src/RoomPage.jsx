import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, deleteDoc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import LiveChat from './LiveChat';
import { db, auth, generateUserName } from './firebase';
import './RoomPage.css';

const THEMES = [
  { id: 'romantic', name: '💖 Romantic', icon: '💖' },
  { id: 'cozy', name: '☕ Cozy', icon: '☕' },
  { id: 'lazy', name: '🛋️ Lazy', icon: '🛋️' },
  { id: 'sleepy', name: '🌙 Sleepy', icon: '🌙' },
];

const RTC_CONFIG = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]
};

const ListeningDuo = ({ djName, listenerName }) => {
  return (
    <div className="listening-duo">
      {/* DJ Character */}
      <div className="duo-character dj-side">
        <div className="character-avatar-box">
          <div className="headphones-graphic">🎧</div>
          <div className="avatar-face dj-face">
            <span className="face-expression">(•‿•)</span>
          </div>
          <span className="duo-badge dj-badge">DJ</span>
        </div>
        <span className="duo-username">{djName}</span>
      </div>

      {/* Musical Connection Soundwaves */}
      <div className="duo-audio-bridge">
        <span className="music-note n1">🎵</span>
        <div className="connecting-equalizer">
          <span className="eq-bar b1"></span>
          <span className="eq-bar b2"></span>
          <span className="eq-bar b3"></span>
          <span className="eq-bar b4"></span>
        </div>
        <span className="music-note n2">🎶</span>
      </div>

      {/* Listener Character */}
      <div className="duo-character listener-side">
        <div className="character-avatar-box">
          <div className="headphones-graphic">🎧</div>
          <div className="avatar-face listener-face">
            <span className="face-expression">(◠‿◠)</span>
          </div>
          <span className="duo-badge listener-badge">LISTENER</span>
        </div>
        <span className="duo-username">{listenerName}</span>
      </div>
    </div>
  );
};

export default function RoomPage({ djSession, setDjSession, children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('room_bg_theme') || 'romantic';
  });

  // WebRTC Call States: 'idle' | 'calling' | 'incoming' | 'connected'
  const [callStatus, setCallStatus] = useState('idle');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const myName = auth.currentUser ? generateUserName(auth.currentUser.uid) : "You";
  const partnerName = djSession.partnerName || "Partner";

  const djName = djSession.isMaster ? `${myName} (You)` : partnerName;
  const listenerName = djSession.isMaster ? partnerName : `${myName} (You)`;

  // Real-time synchronization of background theme
  useEffect(() => {
    if (!djSession?.roomId) return;

    const themeDocRef = doc(db, 'room_themes', djSession.roomId);
    
    const unsubscribe = onSnapshot(themeDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.theme) {
          setCurrentTheme(data.theme);
          localStorage.setItem('room_bg_theme', data.theme);
        }
      }
    });

    return () => unsubscribe();
  }, [djSession?.roomId]);

  // WebRTC Signaling Listener for incoming calls & call state updates
  useEffect(() => {
    if (!djSession?.roomId || !auth.currentUser) return;

    const callDocRef = doc(db, 'room_calls', djSession.roomId);

    const unsubscribe = onSnapshot(callDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        if (callStatus !== 'idle') {
          cleanupCall();
        }
        return;
      }

      const data = snapshot.data();

      // Incoming call offer from partner
      if (data.offer && data.callerId !== auth.currentUser.uid && callStatus === 'idle') {
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
  }, [djSession?.roomId, callStatus]);

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

  // Start WebRTC Call (Caller)
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

      const callDocRef = doc(db, 'room_calls', djSession.roomId);
      const callerCandidatesCol = collection(db, 'room_calls', djSession.roomId, 'callerCandidates');
      const calleeCandidatesCol = collection(db, 'room_calls', djSession.roomId, 'calleeCandidates');

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

      await setDoc(callDocRef, {
        offer,
        callerId: auth.currentUser.uid,
        callerName: myName,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Failed to start live voice call:', err);
      alert('Microphone access is required for live voice call.');
      cleanupCall();
    }
  };

  // Answer WebRTC Call (Callee)
  const answerCall = async () => {
    try {
      if (!incomingCallData) return;

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

      const callDocRef = doc(db, 'room_calls', djSession.roomId);
      const callerCandidatesCol = collection(db, 'room_calls', djSession.roomId, 'callerCandidates');
      const calleeCandidatesCol = collection(db, 'room_calls', djSession.roomId, 'calleeCandidates');

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

      // Set Remote Description from Caller Offer
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));

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
    if (djSession?.roomId) {
      deleteDoc(doc(db, 'room_calls', djSession.roomId)).catch(() => {});
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

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('room_bg_theme', themeId);

    if (djSession?.roomId) {
      setDoc(doc(db, 'room_themes', djSession.roomId), {
        theme: themeId,
        updatedBy: auth.currentUser?.uid || 'user',
        timestamp: Date.now()
      }, { merge: true }).catch(err => console.warn("Theme sync error:", err));
    }
  };

  return (
    <div className={`room-page-container theme-${currentTheme}`}>
      {/* Hidden audio element for receiving remote peer voice call */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Ambient background glow layers */}
      <div className="theme-ambient-glow"></div>
      <div className="theme-ambient-particles"></div>

      {/* Header */}
      <div className="room-header">
        <div className="theme-selector-container">
          <span className="theme-label">Theme:</span>
          <div className="theme-pills">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={`theme-pill-btn ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => handleThemeChange(theme.id)}
                title={`Switch to ${theme.name} background theme`}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Call Controls in Header */}
        <div className="header-call-actions">
          {callStatus === 'idle' && (
            <button className="call-start-btn" onClick={startCall} title="Start Live Voice Call">
              📞 Live Voice Call
            </button>
          )}

          {callStatus === 'calling' && (
            <button className="call-status-btn calling" onClick={endCall} title="Cancel Call">
              <span className="pulse-call-dot"></span> Calling Partner... (Cancel)
            </button>
          )}

          {callStatus === 'incoming' && (
            <div className="incoming-call-banner">
              <span className="incoming-text">📞 Incoming Call...</span>
              <button className="call-answer-btn" onClick={answerCall}>
                🟢 Answer
              </button>
              <button className="call-decline-btn" onClick={endCall}>
                🔴 Decline
              </button>
            </div>
          )}

          {callStatus === 'connected' && (
            <div className="active-call-bar">
              <span className="active-call-label">🎙️ Voice Call Active</span>
              <button className={`call-mute-btn ${isMicMuted ? 'muted' : ''}`} onClick={toggleMuteMic}>
                {isMicMuted ? '🔇 Unmute' : '🎙️ Mute'}
              </button>
              <button className="call-end-btn" onClick={endCall} title="End Call">
                🔴 End Call
              </button>
            </div>
          )}

          <button className="leave-room-btn" onClick={() => setDjSession(null)}>
            Leave Session
          </button>
        </div>
      </div>

      <div className="room-content">
        <div className="room-player-section">
          <ListeningDuo djName={djName} listenerName={listenerName} />
          {children}
        </div>
        <div className="room-chat-section">
          <LiveChat roomId={djSession.roomId} />
        </div>
      </div>
    </div>
  );
}
