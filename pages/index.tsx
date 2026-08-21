import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Sun, Moon, Plus, Flame, Clock, Trophy, Bell } from 'lucide-react';

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
  const [yakarma, setYakarma] = useState(40); // screenshot lo 40 undi
  const [feed, setFeed] = useState('hot');
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        getLocation();
        setScreen(3);
      } else { setScreen(2) }
    });
  }, []);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
      () => setLocation({lat: 15.6327, lng: 77.2768}) // Adoni default
    );
  };

  useEffect(() => {
    if (!location) return;
    const q = query(collection(db, 'yaks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      let data: Yak[] = snap.docs.map(d => { return { id: d.id,...d.data() } as Yak });
      data = data.filter((y: Yak) => {
        if (!y.lat ||!y.lng) return true;
        const dist = getDistance(location.lat, location.lng, y.lat, y.lng);
        return dist <= 8; // 5 MILES
      });
      data = data.filter(y => y.dislikes < 5 && y.reports < 5);
      if(feed === 'hot') data.sort((a,b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
      if(feed === 'top') data.sort((a,b) => b.likes - a.likes);
      if(feed === 'rising') data.sort((a,b) => b.likes - a.likes).slice(0,10);
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

  const bg = '#0A0A0A';
  const cardBg = '#1A1A1A';
  const text = 'text-white';

  if (screen === 2) return (
    <div className={`min-h-screen ${bg} flex flex-col items-center justify-center p-4 ${text}`}>
      <h1 className="text-6xl font-bold text-[#FDCB00] mb-2">Yik Yak</h1>
      <button onClick={() => signInWithPopup(auth, provider)} className="bg-[#FDCB00] text-black px-8 py-3 rounded-full font-bold text-lg">
        Continue with Google
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      {/* HEADER - EXACT SCREENSHOT LAGA */}
      <div className={`sticky top-0 ${cardBg} p-3 border-b border-gray-800`}>
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold text-[#FDCB00]">Yik Yak</h1>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm"><Trophy size={18}/> {yakarma}</span>
            <Bell size={20}/>
            <button onClick={() => setDark(!dark)}><Sun size={20}/></button>
          </div>
        </div>
        {/* TABS - YELLOW PILLS */}
        <div className="flex gap-2">
          {['hot','new','top','rising'].map(f => (
            <button key={f} onClick={() => setFeed(f)} 
              className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1
              ${feed===f? 'bg-[#FDCB00] text-black' : 'text-gray-400'}`}
            >
              {f==='hot' && <Flame size={14}/>} 
              {f==='new' && <Clock size={14}/>}
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* FEED */}
      <div className="p-3 pb-24">
        {yaks.length === 0 && (
          <p className="text-center mt-10 text-gray-500">No Yaks nearby. Be the first to post!</p>
        )}
        {yaks.map(y => (
          <div key={y.id} className={`${cardBg} p-3 rounded-2xl mb-3`}>
            {y.imageUrl && <img src={y.imageUrl} className="rounded-xl mb-2 w-full"/>}
            <p className="text-lg mb-3">{y.text}</p>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div className="flex gap-5">
                <button onClick={() => vote(y.id, 'likes')} className="flex items-center gap-1">⬆️ {y.likes}</button>
                <button onClick={() => vote(y.id, 'dislikes')} className="flex items-center gap-1">⬇️ {y.dislikes}</button>
                <button>💬 0</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM + BUTTON - EXACT SCREENSHOT LAGA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <button onClick={() => setScreen(4)} className="bg-[#FDCB00] text-black w-16 h-16 rounded-full flex items-center justify-center shadow-2xl">
          <Plus size={32} strokeWidth={3}/>
        </button>
      </div>

      {/* POST MODAL */}
      {screen === 4 && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center">
          <div className={`${cardBg} p-4 rounded-t-3xl w-full`}>
            <input type="file" onChange={(e)=>setImage(e.target.files?.[0] || null)} className="mb-3 text-sm"/>
            <textarea value={newYak} onChange={(e) => setNewYak(e.target.value)} placeholder="What's happening?" className={`w-full h-32 p-3 rounded-xl bg-[#2A2A2A] ${text}`} maxLength={200}/>
            <div className="flex gap-2 mt-3">
              <button onClick={postYak} className="bg-[#FDCB00] text-black px-6 py-3 rounded-full font-bold w-full">Yak</button>
              <button onClick={() => setScreen(3)} className="px-6 py-3">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
