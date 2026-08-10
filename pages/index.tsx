import { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058",
  measurementId: "G-11Y8XF8MBC"
};

const app =!getApps().length? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [points, setPoints] = useState(0);
  const [treeStage, setTreeStage] = useState(0);
  const [instaTime, setInstaTime] = useState(0);
  const [youtubeTime, setYoutubeTime] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const INSTA_LIMIT = 30 * 60; // 30 mins in seconds
  const YT_LIMIT = 45 * 60; // 45 mins

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if(currentUser){
        // Load data from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()){
          setPoints(docSnap.data().points || 0);
          setTreeStage(docSnap.data().treeStage || 0);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // OFFLINE TIMER = POINTS + TREE
  useEffect(() => {
    if(!user || focusMode) return;
    
    intervalRef.current = setInterval(async () => {
      setPoints(prev => prev + 10); // 1 sec = 10 points
      setTreeStage(prev => Math.min(prev + 0.1, 100)); // Tree grows
      
      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), {
        points: points + 10,
        treeStage: treeStage + 0.1,
        lastUpdated: serverTimestamp()
      }, {merge: true});

    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [user, focusMode, points, treeStage]);

  // SIMULATED APP TIMERS
  useEffect(() => {
    if(!user) return;
    const appTimer = setInterval(() => {
      setInstaTime(prev => prev + 1);
      setYoutubeTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(appTimer);
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  if(!user){
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center">
        <button onClick={handleLogin} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-2xl">
          QUITTR 2.0 - Login
        </button>
      </main>
    )
  }

  return (
    <main className="bg-black text-white min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">QUITTR 2.0</h1>
        <p className="text-center text-gray-400 mb-8">Welcome {user.displayName}</p>
        
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 p-4 rounded-lg text-center">
            <p className="text-gray-400">Points</p>
            <p className="text-2xl font-bold text-green-400">{Math.floor(points)}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg text-center">
            <p className="text-gray-400">Tree Growth</p>
            <p className="text-2xl font-bold text-green-400">{Math.floor(treeStage)}%</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg text-center">
            <p className="text-gray-400">Instagram</p>
            <p className={`text-2xl font-bold ${instaTime > INSTA_LIMIT? 'text-red-500' : 'text-white'}`}>{formatTime(instaTime)} / 30m</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg text-center">
            <p className="text-gray-400">YouTube</p>
            <p className={`text-2xl font-bold ${youtubeTime > YT_LIMIT? 'text-red-500' : 'text-white'}`}>{formatTime(youtubeTime)} / 45m</p>
          </div>
        </div>

        {/* NEXT LEVEL TWIST */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">🔥 Next-Level Twist</h2>
          {instaTime > INSTA_LIMIT && <p className="text-red-500">🚫 Instagram limit reached! 30 min ayipoyindi.</p>}
          {youtubeTime > YT_LIMIT && <p className="text-red-500">🚫 YouTube limit reached! 45 min ayipoyindi.</p>}
          <button 
            onClick={() => setFocusMode(!focusMode)}
            className={`mt-4 w-full py-3 rounded-lg font-bold ${focusMode? 'bg-green-600' : 'bg-blue-600'}`}
          >
            {focusMode? 'Focus Mode ON' : 'Start Focus Mode'}
          </button>
          {focusMode && <p className="text-green-400 mt-2">All social apps locked. Tree is growing fast 🌳</p>}
        </div>

        <button onClick={() => signOut(auth)} className="bg-gray-600 px-4 py-2 rounded">Logout</button>
      </div>
    </main>
  );
                                                }
