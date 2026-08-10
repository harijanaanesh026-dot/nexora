import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Nuv ichina config
const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058",
  measurementId: "G-11Y8XF8MBC"
};

// Initialize Firebase
const app =!getApps().length? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [scrollTax, setScrollTax] = useState(0);

  // User login status check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // SCROLL TAX LOGIC
  useEffect(() => {
    if (!user) return; // Login aithe matrame count

    const handleScroll = async () => {
      const newTax = scrollTax + 1;
      setScrollTax(newTax);

      // Firestore lo save chey
      try {
        await addDoc(collection(db, "scrolls"), {
          userId: user.uid,
          tax: newTax,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error("Error adding scroll: ", e);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, scrollTax]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setScrollTax(0);
  };

  return (
    <main className="bg-black text-white min-h-screen flex flex-col items-center justify-center p-4">
      {!user? (
        <button 
          onClick={handleLogin}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-2xl transition duration-300"
        >
          QUITTR 2.0 - Login with Google
        </button>
      ) : (
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.displayName}</h1>
          <p className="text-xl mb-4">Your Scroll Tax: <span className="text-red-500 font-bold">{scrollTax}</span></p>
          <p className="text-gray-400 mb-8">Keep scrolling to increase tax... ↓</p>
          <button 
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
          <div className="h-[200vh]"></div> {/* Scroll cheyadaniki space */}
        </div>
      )}
    </main>
  );
}
