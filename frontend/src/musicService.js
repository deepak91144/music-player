import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Add uploaded song to Firestore
 */
export async function addSongToFirestore(songData) {
  try {
    const docRef = await addDoc(collection(db, 'songs'), {
      ...songData,
      createdAt: Date.now()
    });
    return { id: docRef.id, ...songData };
  } catch (err) {
    console.warn('Firestore song write notice:', err);
    return { id: `local_${Date.now()}`, ...songData };
  }
}

/**
 * Fetch all user uploaded songs from Firestore
 */
export async function getSongsFromFirestore() {
  try {
    const snapshot = await getDocs(collection(db, 'songs'));
    if (!snapshot.empty) {
      const dbSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      dbSongs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return dbSongs;
    }
  } catch (err) {
    console.warn('Firestore songs read notice:', err);
  }
  return [];
}
