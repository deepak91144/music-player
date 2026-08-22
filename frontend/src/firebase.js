import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC40KmWDdetycyTenUXfdy0zAQd7HlvwuM",
  authDomain: "music-player-9d4b1.firebaseapp.com",
  projectId: "music-player-9d4b1",
  storageBucket: "music-player-9d4b1.firebasestorage.app",
  messagingSenderId: "394201280320",
  appId: "1:394201280320:web:de0791e93da4c6729914a5"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper to sign in anonymously
export const signInAnonymousUser = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Anonymous sign-in failed:", error);
    return null;
  }
};

// Fun name generator based on uid
const ADJECTIVES = ['Chill', 'Vibing', 'Groovy', 'Silent', 'Loud', 'Mystic', 'Neon', 'Cosmic'];
const NOUNS = ['Panda', 'Tiger', 'Ninja', 'Ghost', 'Rider', 'Dragon', 'Wolf', 'Eagle'];

export const generateUserName = (uid) => {
  if (!uid) return 'Anonymous Listener';
  
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const adj = ADJECTIVES[Math.abs(hash) % ADJECTIVES.length];
  const noun = NOUNS[Math.abs(hash >> 2) % NOUNS.length];
  const num = Math.abs(hash % 1000);
  
  return `${adj} ${noun} ${num}`;
};
