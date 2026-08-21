import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Sun, Moon, Plus, Flame, Clock, Trophy, Bell, MessageCircle, MapPin, Flag, X } from 'lucide-react';

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

type Comment = { id: string; text: string; createdAt: any; }
type Yak = { id: string; text: string; likes: number; dislikes: number; lat: number; lng: number; createdAt: any; imageUrl?: string; reports: number; comments: number; }

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [screen, setScreen] = useState(2);
  const [yaks, setYaks] = useState<Yak[]>([]);
  const [newYak, setNewYak] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [dark, setDark] = useState(false);
  const [yakarma, setYakarma] = useState(40);
  const [feed, setFeed] = useState('hot');
  const [image, setImage] = useState<File | null>(null);
  const [selectedYak, setSelectedYak] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [blocked, setBlocked] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('dark') === 'true';
    setDark(saved);
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setYakarma(Math.floor(Math.random()*500));
        getLocation();
        setScreen(3);
      } else { setScreen(2) }
    });
  }, []);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
      () => setLocation({lat: 15.6327, lng: 77.2768})
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
        return dist <= 8;
      });
      data = data.filter(y => y.dislikes < 5 && y.reports < 5);
      if(feed === 'hot') data.sort((a,b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
      if(feed === 'new') data.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds);
      if(feed === 'top') data.sort((a,b) => b.likes - a.likes);
      if(feed === 'rising') data = data.filter(y => y.likes > 5).slice(0,10);
      setYaks(data);
    });
    return () => unsub();
  }, [location, feed]);

  // COMMENTS FETCH
  useEffect(() => {
    if(!selectedYak) return;
    const q = query(collection(db, `yaks/${selectedYak}/comments`), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => { return { id: d.id,...d.data() } as Comment }));
    });
    return () => unsub();
  }, [selectedYak]);

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
      text: newYak, createdAt: serverTimestamp(), likes: 0, dislikes: 0, reports: 0, comments: 0,
      lat: location.lat, lng: location.lng, imageUrl
    });
    setNewYak(''); setImage(null); setScreen(3);
  };

  const vote = async (id: string, type: 'likes' | 'dislikes') => {
    await updateDoc(doc(db, 'yaks', id), { [type]: increment(1) });
    setYakarma(prev => type === 'likes'? prev + 1 : prev - 1);
  };

  const report = async (id: string) => {
    await updateDoc(doc(db, 'yaks', id), { reports: increment(1) });
    alert('Reported. Thank you');
  }

  const postComment = async () => {
    if(!newComment.trim() ||!selectedYak) return;
    await addDoc(collection(db, `yaks/${selectedYak}/comments`), {
      text: newComment, createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, 'yaks', selectedYak), { comments: increment(1) });
    setNewComment('');
  }

  const bg = dark? '#0A0A0A' : '#F9F9F9';
  const cardBg = dark? '#1A1A1A' : '#FFFFFF';
  const text = dark? 'text-white' : 'text-black';
  const subtext = dark? 'text-gray-400' : 'text-gray-500';

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
      {/* HEADER */}
      <div className={`sticky top-0 ${cardBg} p-3 border-b ${dark? 'border-gray-800' : 'border-gray-200'} z-10`}>
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold text-[#FDCB00]">Yik Yak</h1>
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1 text-sm ${subtext}`}><Trophy size={18}/> {yakarma}</span>
            <Bell size={20} className={subtext}/>
            <button onClick={() => {setDark(!dark); localStorage.setItem('dark', String(!dark))}}>
              {dark? <Sun size={20}/> : <Moon size={20} className={subtext}/>}
            </button>
          </div>
        </div>
        {/* 4 TABS */}
        <div className="flex gap-2 overflow-x-auto">
          {['hot','new','top','rising'].map(f => (
            <button key={f} onClick={() => setFeed(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1 whitespace-nowrap
              ${feed===f? 'bg-[#FDCB00] text-black' : subtext}`}
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
          <p className={`text-center mt-20 text-lg ${subtext}`}>
            No Yaks nearby. Be the first to post!
          </p>
        )}
        {yaks.map(y => (
          <div key={y.id} className={`${cardBg} p-3 rounded-2xl mb-3 shadow-sm`}>
            {y.imageUrl && <img src={y.imageUrl} className="rounded-xl mb-2 w-full"/>}
            <p className="text-lg mb-3">{y.text}</p>
            <div className={`flex justify-between items-center text-sm ${subtext}`}>
              <div className="flex gap-5">
                <button onClick={() => vote(y.id, 'likes')} className="flex items-center gap-1">⬆️ {y.likes}</button>
                <button onClick={() => vote(y.id, 'dislikes')} className="flex items-center gap-1">⬇️ {y.dislikes}</button>
                <button onClick={() => setSelectedYak(y.id)} className="flex items-center gap-1"><MessageCircle size={16}/> {y.comments}</button>
              </div>
              <button onClick={() => report(y.id)}><Flag size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* + BUTTON */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <button onClick={() => setScreen(4)} className="bg-[#FDCB00] text-black w-16 h-16 rounded-full flex items-center justify-center shadow-2xl">
          <Plus size={32} strokeWidth={3}/>
        </button>
      </div>

      {/* POST MODAL */}
      {screen === 4 && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-20">
          <div className={`${cardBg} p-4 rounded-t-3xl w-full`}>
            <input type="file" accept="image/*" onChange={(e)=>setImage(e.target.files?.[0] || null)} className="mb-3 text-sm"/>
            <textarea value={newYak} onChange={(e) => setNewYak(e.target.value)} placeholder="What's happening?" className={`w-full h-32 p-3 rounded-xl ${dark? 'bg-[#2A2A2A]' : 'bg-gray-100'} ${text}`} maxLength={200}/>
            <div className="flex gap-2 mt-3">
              <button onClick={postYak} className="bg-[#FDCB00] text-black px-6 py-3 rounded-full font-bold w-full">Yak</button>
              <button onClick={() => setScreen(3)} className={`px-6 py-3 ${subtext}`}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL */}
      {selectedYak && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-20">
          <div className={`${cardBg} p-4 rounded-t-3xl w-full h-[70vh] flex-col`}>
            <div className="flex justify-between mb-2">
              <h3 className="font-bold">Comments</h3>
              <button onClick={() => setSelectedYak(null)}><X/></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {comments.map(c => <p key={c.id} className={`p-2 rounded ${dark? 'bg-[#2A2A2A]' : 'bg-gray-100'} mb-2`}>{c.text}</p>)}
            </div>
            <div className="flex gap-2">
              <input value={newComment} onChange={(e)=>setNewComment(e.target.value)} placeholder="Add a comment" className={`flex-1 p-2 rounded ${dark? 'bg-[#2A2A2A]' : 'bg-gray-100'}`}/>
              <button onClick={postComment} className="bg-[#FDCB00] text-black px-4 rounded-full">Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                                   }
