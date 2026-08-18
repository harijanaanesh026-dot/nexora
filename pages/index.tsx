import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Sun, Moon, Plus, MapPin, TrendingUp } from 'lucide-react';

// NUVVU ICHINA FIREBASE KEYS DIRECT GA IKKADA
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [screen, setScreen] = useState(2);
  const [yaks, setYaks] = useState<any[]>([]);
  const [newYak, setNewYak] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [dark, setDark] = useState(true);
  const [yakarma, setYakarma] = useState(0);

  useEffect(() => {
    const isDark = localStorage.getItem('dark') === 'true';
    setDark(isDark);
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setYakarma(Math.floor(Math.random() * 500));
        getLocation();
        setScreen(3);
      } else { setScreen(2) }
    });
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
        () => setLocation({lat: 15.6327, lng: 77.2768}) // Adoni default
      );
    } else {
      setLocation({lat: 15.6327, lng: 77.2768}) // Adoni default
    }
  };

  useEffect(() => {
    if (!location) return;
    const q = query(collection(db, 'yaks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({id: d.id,...d.data()}));
      const filtered = data.filter(y => {
        if (!y.lat ||!y.lng) return true;
        const dist = getDistance(location.lat, location.lng, y.lat, y.lng);
        return dist <= 10; // 10KM RADIUS ADONI
      });
      setYaks(filtered);
    });
    return () => unsub();
  }, [location]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const postYak = async () => {
    if (!newYak.trim() ||!user ||!location) return;
    await addDoc(collection(db, 'yaks'), {
      text: newYak,
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      likes: 0,
      lat: location.lat,
      lng: location.lng,
    });
    setNewYak('');
    setScreen(3);
  };

  const likeYak = async (id: string) => {
    await updateDoc(doc(db, 'yaks', id), { likes: increment(1) });
  };

  const bg = dark? 'bg-[#0A0A0A]' : 'bg-[#F9F9F9]';
  const cardBg = dark? 'bg-[#1A1A1A]' : 'bg-white';
  const text = dark? 'text-white' : 'text-black';

  if (screen === 2) return (
    <div className={`min-h-screen ${bg} flex flex-col items-center justify-center p-4`}>
      <h1 className="text-6xl font-bold text-yik mb-2">yik yak</h1>
      <p className={`${text} mb-8`}>Adoni 10km radius lo matrame</p>
      <button
        onClick={() => signInWithPopup(auth, provider)}
        className="bg-yik text-black px-8 py-3 rounded-full font-bold text-lg"
      >
        Google tho Continue cheyandi
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      <div className={`sticky top-0 ${cardBg} p-4 flex justify-between items-center border-b border-gray-700`}>
        <h1 className="text-2xl font-bold text-yik">yik yak</h1>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><TrendingUp size={16}/> {yakarma}</span>
          <button onClick={() => {setDark(!dark); localStorage.setItem('dark', String(!dark))}}>{dark? <Sun/> : <Moon/>}</button>
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
      </div>

      <div className="p-4 pb-24">
        {yaks.length === 0? <p className="text-center mt-10">Adoni lo yak's levu. nuvve first post chey!</p> :
          yaks.map(y => (
            <div key={y.id} className={`${cardBg} p-4 rounded-2xl mb-3`}>
              <div className="flex items-center gap-2 mb-2">
                <img src={y.photoURL} className="w-8 h-8 rounded-full"/>
                <span className="font-bold">{y.displayName}</span>
              </div>
              <p className="text-lg mb-2">{y.text}</p>
              <div className="flex justify-between text-sm opacity-70">
                <button onClick={() => likeYak(y.id)}>↑ {y.likes}</button>
                <span className="flex items-center gap-1"><MapPin size={14}/> 10km lopala</span>
              </div>
            </div>
          ))
        }
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setScreen(4)}
          className="bg-yik text-black w-16 h-16 rounded-full flex items-center justify-center"
        >
          <Plus size={32}/>
        </button>
      </div>

      {screen === 4 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className={`${cardBg} p-4 rounded-2xl w-full max-w-md`}>
            <textarea
              value={newYak}
              onChange={(e) => setNewYak(e.target.value)}
              placeholder="em jaruguthundhi Adoni lo?"
              className={`w-full h-32 p-2 rounded ${dark? 'bg-[#2A2A2A]' : 'bg-gray-100'} ${text}`}
              maxLength={200}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={postYak} className="bg-yik text-black px-4 py-2 rounded-full font-bold">Post chey</button>
              <button onClick={() => setScreen(3)} className="px-4 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                                          }
