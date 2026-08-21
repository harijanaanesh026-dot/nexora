import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Sun, Moon, Plus, MapPin, Flame, Clock, Trophy, Bell } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058",
  measurementId: "G-11Y8XF8MBC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

type Yak = { id: string; text: string; likes: number; dislikes: number; lat: number; lng: number; createdAt: any; imageUrl?: string; reports: number; }

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [screen, setScreen] = useState(2);
  const [yaks, setYaks] = useState<Yak[]>([]);
  const [newYak, setNewYak] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [dark, setDark] = useState(true);
  const [yakarma, setYakarma] = useState(0);
  const [feed, setFeed] = useState('hot');
  const [image, setImage] = useState<File | null>(null);

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
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
      () => setLocation({lat: 40.7128, lng: -74.0060}) // USA Default: New York
    );
  };

  useEffect(() => {
    if (!location) return;
    const q = query(collection(db, 'yaks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      let data: Yak[] = snap.docs.map(d => { return { id: d.id,...d.data() } as Yak });
      
      // 5 MILE = 8KM RADIUS USA RULE
      data = data.filter((y: Yak) => {
        if (!y.lat ||!y.lng) return true;
        const dist = getDistance(location.lat, location.lng, y.lat, y.lng);
        return dist <= 8; // USA 5 MILES
      });
      
      // AUTO HIDE - 5 DOWNVOTES OR 5 REPORTS
      data = data.filter(y => y.dislikes < 5 && y.reports < 5);

      if(feed === 'hot') data.sort((a,b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
      if(feed === 'top') data.sort((a,b) => b.likes - a.likes);
      setYaks(data);
    });
    return () => unsub();
  }, [location, feed]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const postYak = async () => {
    if (!newYak.trim() ||!location) return;
    let imageUrl = '';
    if(image) {
      const storageRef = ref(storage, `yaks/${Date.now()}`);
      const snap = await uploadBytes(storageRef, image);
      imageUrl = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, 'yaks'), {
      text: newYak, createdAt: serverTimestamp(), likes: 0, dislikes: 0, reports: 0,
      lat: location.lat, lng: location.lng, imageUrl
    });
    setNewYak(''); setImage(null); setScreen(3);
  };

  const vote = async (id: string, type: 'likes' | 'dislikes') => {
    await updateDoc(doc(db, 'yaks', id), { [type]: increment(1) });
  };
  
  const report = async (id: string) => {
    await updateDoc(doc(db, 'yaks', id), { reports: increment(1) });
  }

  const bg = dark? 'bg-[#0A0A0A]' : 'bg-[#F9F9F9]';
  const cardBg = dark? 'bg-[#1A1A1A]' : 'bg-white';
  const text = dark? 'text-white' : 'text-black';

  if (screen === 2) return (
    <div className={`min-h-screen ${bg} flex-col items-center justify-center p-4`}>
      <h1 className="text-6xl font-bold text-yik mb-2">Yik Yak</h1>
      <p className={`${text} mb-8`}>What's happening around you</p>
      <button onClick={() => signInWithPopup(auth, provider)} className="bg-yik text-black px-8 py-3 rounded-full font-bold text-lg">
        Continue with Google
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      <div className={`sticky top-0 ${cardBg} p-3 border-b border-gray-700`}>
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-yik">Yik Yak</h1>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm"><Trophy size={16}/> {yakarma}</span>
            <Bell size={20}/>
            <button onClick={() => {setDark(!dark); localStorage.setItem('dark', String(!dark))}}>{dark? <Sun size={20}/> : <Moon size={20}/>}</button>
          </div>
        </div>
        <div className="flex gap-2">
          {['hot','new','top','rising'].map(f => (
            <button key={f} onClick={() => setFeed(f)} className={`px-3 py-1 rounded-full text-sm ${feed===f? 'bg-yik text-black' : cardBg}`}>
              {f==='hot'? <Flame size={14} className="inline"/> : f==='new'? <Clock size={14} className="inline"/> : ''} {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 pb-24">
        {yaks.map(y => (
          <div key={y.id} className={`${cardBg} p-3 rounded-2xl mb-3`}>
            {y.imageUrl && <img src={y.imageUrl} className="rounded-xl mb-2 w-full"/>}
            <p className="text-lg mb-2">{y.text}</p>
            <div className="flex justify-between items-center text-sm">
              <div className="flex gap-4">
                <button onClick={() => vote(y.id, 'likes')}>⬆️ {y.likes}</button>
                <button onClick={() => vote(y.id, 'dislikes')}>⬇️ {y.dislikes}</button>
                <button onClick={() => vote(y.id, 'likes')}>💬</button>
              </div>
              <button onClick={() => report(y.id)} className="opacity-50">🚩</button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <button onClick={() => setScreen(4)} className="bg-yik text-black w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
          <Plus size={32}/>
        </button>
      </div>

      {screen === 4 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className={`${cardBg} p-4 rounded-2xl w-full max-w-md`}>
            <input type="file" onChange={(e)=>setImage(e.target.files?.[0] || null)} className="mb-2"/>
            <textarea value={newYak} onChange={(e) => setNewYak(e.target.value)} placeholder="What's on your mind?" className={`w-full h-32 p-2 rounded ${dark? 'bg-[#2A2A2A]' : 'bg-gray-100'}`} maxLength={200}/>
            <div className="flex gap-2 mt-2">
              <button onClick={postYak} className="bg-yik text-black px-4 py-2 rounded-full font-bold">Yak</button>
              <button onClick={() => setScreen(3)} className="px-4 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
