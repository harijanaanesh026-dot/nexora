import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyATP9R0Qy-C2zuHHuzZcX06Dy0sQ4",
  authDomain: "nexora-7seoz.firebaseapp.com",
  projectId: "nexora-7seoz",
  storageBucket: "nexora-7seoz.appspot.com",
  messagingSenderId: "775122117177",
  appId: "1:775122117177:web:d867c80b1080b1ce058",
  measurementId: "G-11YEXFBWC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
