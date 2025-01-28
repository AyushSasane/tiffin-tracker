import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCoyKyWnBVVdB1Pmt2sHiRg6S05w62MFk4",
  authDomain: "tiffin-tracker-7d64c.firebaseapp.com",
  projectId: "tiffin-tracker-7d64c",
  storageBucket: "tiffin-tracker-7d64c.firebasestorage.app",
  messagingSenderId: "669022377843",
  appId: "1:669022377843:web:515fd3c1ce15257b399706"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
