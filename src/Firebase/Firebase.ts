// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.API_KEY,
  authDomain: "apexoai-1.firebaseapp.com",
  projectId: "apexoai-1",
  storageBucket: import.meta.env.STORAGE_BUCKET,
  messagingSenderId: import.meta.env.SENDERID,
  appId: import.meta.env.APP_ID,
  measurementId: "G-YJH9P1RWM0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db};