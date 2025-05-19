// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.API_KEY,
  authDomain: "apexo-ai.firebaseapp.com",
  projectId: "apexo-ai",
  storageBucket: "apexo-ai.firebasestorage.app",
  messagingSenderId: "852713527633",
  appId: import.meta.env.APP_ID,
  measurementId: "G-D6QLVNHCVE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db};