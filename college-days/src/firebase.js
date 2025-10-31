import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDSDsAvZ5efAs7qob-g0EevjHIil_EALCw",
  authDomain: "college-days-c7719.firebaseapp.com",
  projectId: "college-days-c7719",
  storageBucket: "college-days-c7719.firebasestorage.app",
  messagingSenderId: "574464965829",
  appId: "1:574464965829:web:ecf111260ba54e6e24c4ac",
  measurementId: "G-9EDNHHJBHK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);