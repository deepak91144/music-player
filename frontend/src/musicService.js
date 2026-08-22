import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Add uploaded song to Firestore
 */
export async function addSongToFirestore(songData) {
  try {
    const docRef = await addDoc(collection(db, 'songs'), {
      ...songData,
      createdAt: songData.createdAt || Date.now()
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
      const dbSongs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        // Filter out expired blob: URLs or tracks without valid audio src
        .filter(song => song.src && !song.src.startsWith('blob:'));
      
      dbSongs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return dbSongs;
    }
  } catch (err) {
    console.warn('Firestore songs read notice:', err);
  }
  return [];
}

/**
 * Delete all songs from Firestore and reload fresh real songs from S3 bucket
 */
export async function cleanAndSyncWithS3() {
  try {
    // 1. Delete all existing Firestore songs
    const snapshot = await getDocs(collection(db, 'songs'));
    if (!snapshot.empty) {
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'songs', d.id)));
      await Promise.all(deletePromises);
      console.log(`🧹 Cleaned ${snapshot.docs.length} old songs from Firestore.`);
    }

    // 2. Fetch fresh real songs from S3 bucket via Express Backend
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
    const res = await fetch(`${API_BASE_URL}/api/upload/s3-songs`);
    if (res.ok) {
      const data = await res.json();
      if (data.songs && data.songs.length > 0) {
        console.log(`📥 Syncing ${data.songs.length} real S3 tracks into Firestore...`);
        const synced = [];
        for (const s3Song of data.songs) {
          const added = await addSongToFirestore(s3Song);
          synced.push(added);
        }
        return synced;
      }
    }
  } catch (err) {
    console.error('Error syncing S3 songs with Firestore:', err);
  }
  return [];
}
