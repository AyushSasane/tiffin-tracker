import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA31ZWCeCKyeMreqvL8Rk-STTKDalDOCrc",
  authDomain: "tiffin-track.firebaseapp.com",
  projectId: "tiffin-track",
  storageBucket: "tiffin-track.firebasestorage.app",
  messagingSenderId: "265696675551",
  appId: "1:265696675551:web:04e84ecda9688515ac0b6a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
