import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC40KmWDdetycyTenUXfdy0zAQd7HlvwuM",
  authDomain: "music-player-9d4b1.firebaseapp.com",
  projectId: "music-player-9d4b1",
  storageBucket: "music-player-9d4b1.firebasestorage.app",
  messagingSenderId: "394201280320",
  appId: "1:394201280320:web:de0791e93da4c6729914a5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanAndReload() {
  console.log("🔍 Fetching all songs from Firestore...");
  const snapshot = await getDocs(collection(db, "songs"));
  console.log(`Found ${snapshot.docs.length} documents in 'songs' collection.`);

  console.log("🗑️ Deleting all existing documents...");
  for (const d of snapshot.docs) {
    console.log(`  Deleting: ${d.id} - ${d.data().title || 'Untitled'} (${d.data().src})`);
    await deleteDoc(doc(db, "songs", d.id));
  }
  console.log("✅ All old/dead documents deleted from Firestore!");

  console.log("📥 Fetching real S3 songs from backend...");
  const res = await fetch("http://localhost:10000/api/upload/s3-songs");
  if (!res.ok) {
    throw new Error(`Failed to fetch S3 songs: ${res.statusText}`);
  }

  const { songs } = await res.json();
  console.log(`Found ${songs.length} real audio files in S3.`);

  console.log("💾 Inserting valid S3 tracks into Firestore...");
  for (const song of songs) {
    const docRef = await addDoc(collection(db, "songs"), {
      ...song,
      createdAt: song.createdAt || Date.now()
    });
    console.log(`  ➕ Added: ${song.title} -> Firestore ID: ${docRef.id}`);
  }

  console.log("🎉 Database successfully cleaned and synchronized with AWS S3!");
  process.exit(0);
}

cleanAndReload().catch(err => {
  console.error("❌ Error during cleanup:", err);
  process.exit(1);
});
