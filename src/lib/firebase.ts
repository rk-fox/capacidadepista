// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXnmQXFMv-N1CUKs71b0NH66KsOegKhAY",
  authDomain: "sistema-de-coletas-2d0be.firebaseapp.com",
  projectId: "sistema-de-coletas-2d0be",
  storageBucket: "sistema-de-coletas-2d0be.firebasestorage.app",
  messagingSenderId: "815543669354",
  appId: "1:815543669354:web:854f0ad2fe43226324b013",
  measurementId: "G-20WYQCQ8GG"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary App instance for creating users without logging out the current admin user
export const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
export const secondaryAuth = getAuth(secondaryApp);