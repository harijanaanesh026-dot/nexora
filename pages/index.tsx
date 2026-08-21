import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; // deleteObject add chesa
import { Sun, Moon, Plus, Flame, Clock, Trophy, Bell, MessageCircle, Flag, X, MapPin, ChevronDown, Trash2, Edit3 } from 'lucide-react'; // 2 icons add

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

type Comment = { id: string; text: string; uid: string; createdAt: any; }
type Yak = { id: string; text: string; uid: string; likes: number; dislikes: number; lat: number; lng: number; createdAt: any; imageUrl?: string; imagePath?: string; reports: number; comments: number; }

const HERDS = [
  { name: 'My Herd', lat: 15.6327, lng: 77.2768 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
]

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [screen, setScreen] = useState(2);
  const [yaks, setYaks] = useState<Yak[]>([]);
  const [newYak, setNewYak] = useState('');
  const [location, setLocation] = useState<any>(HERDS[0]);
  const [dark, setDark] = useState(false);
  const [yakarma, setYakarma] = useState(309);
  const [feed, setFeed] = useState('hot');
  const [image, setImage] = useState<File | null>(null);
  const [selectedYak, setSelectedYak] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showPeek, setShowPeek] = useState(false);
  const [editingYak, setEditingYak] = useState<Yak | null>(null); // NEW

  useEffect(() => {
    const saved = localStorage.getItem('dark') === 'true';
    setDark(saved);
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); setScreen(3); } else { setScreen(2) }
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'yaks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      let data: Yak[] = snap.docs.map(d => { return { id: d.id,...d.data() } as Yak });
      data = data.filter((y: Yak) => getDistance(location.lat, location.lng, y.lat, y.lng) <= 8);
      data = data.filter(y => y.dislikes < 5 && y.reports < 5);
      if(feed === 'hot') data.sort((a,b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
      if(feed === 'new') data.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds);
      if(feed === 'top') data.sort((a,b) => b.likes - a.likes);
      if(feed === 'rising') data = data.filter(y => (y.likes - y.dislikes) >= 1).slice(0,10);
      setYaks(data);
    });
    return () => unsub();
  }, [location, feed]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const timeAgo = (timestamp: any) => {
    if(!timestamp) return 'now';
    const seconds = Math.floor((new Date().getTime() - timestamp.toDate().getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  }

  const postYak = async () => {
    if (!newYak.trim() &&!image) return;
    let imageUrl = ''; let imagePath = '';
    if(image) {
      imagePath = `yaks/${Date.now()}`;
      const storageRef = ref(storage, imagePath);
      const snap = await uploadBytes(storageRef, image);
      imageUrl = await getDownloadURL(snap.ref);
    }

    if(editingYak){ // EDIT MODE
      await updateDoc(doc(db, 'yaks', editingYak.id), { text: newYak });
      setEditingYak(null);
    } else { // NEW POST
      await addDoc(collection(db, 'yaks'), {
        text: newYak, uid: user.uid, createdAt: serverTimestamp(), likes: 0, dislikes: 0, reports: 0, comments: 0,
        lat: location.lat, lng: location.lng, imageUrl, imagePath
      });
    }
    setNewYak(''); setImage(null); setScreen(3);
  };

  const deleteYak = async (y: Yak) => {
    if(confirm('Delete this Yak?')){
      if(y.imagePath){ // photo unte storage nunchi kuda delete
        await deleteObject(ref(storage, y.imagePath));
      }
      await deleteDoc(doc(db, 'yaks', y.id)); // permanent delete
    }
  }

  const startEdit = (y: Yak) => {
    setEditingYak(y);
    setNewYak(y.text);
    setScreen(4);
  }

  const vote = async (id: string, type: 'likes' | 'dislikes') => {
    await updateDoc(doc(db, 'yaks', id), { [type]: increment(1) });
  };

  const report = async (id: string) => {
    await updateDoc(doc(db, 'yaks', id), { reports: increment(1) });
  }

  const bg = dark? '#000' : '#F5F5F5';
  const cardBg = dark? '#121212' : '#FFFFFF';
  const textColor = dark? '#FFFFFF' : '#000';
  const subtext = dark? '#B3B3B3' : '#6B7280';

  if (screen === 2) return (
    <div style={{backgroundColor: bg, color: textColor}} className="min-h-screen flex-col items-center justify-center p-4">
      <h1 style={{color: '#FDCB00'}} className="text-6xl font-extrabold mb-2">Yik Yak</h1>
      <p style={{color: subtext}} className="mb-8">Connect with your herd</p>
      <button onClick={() => signInWithPopup(auth, provider)} style={{backgroundColor: '#FDCB00', color: '#000'}} className="px-8 py-3 rounded-full font-bold text-lg">
        Continue with Google
      </button>
    </div>
  );

  return (
    <div style={{backgroundColor: bg, color: textColor}} className="min-h-screen">
      <div style={{backgroundColor: cardBg, borderColor: dark? '#2A2A2A' : '#E5E7EB'}} className="sticky top-0 p-3 border-b z-10">
        <div className="flex justify-between items-center mb-3">
          <button onClick={() => setShowPeek(true)} style={{color: subtext}} className="flex items-center gap-1 text-sm font-semibold">
            <MapPin size={14}/> {location.name} <ChevronDown size={14}/>
          </button>
          <div className="flex items-center gap-4">
            <span style={{color: subtext}} className="flex items-center gap-1 text-sm"><Trophy size={18}/> {yakarma}</span>
            <Bell size={20} style={{color: subtext}}/>
            <button onClick={() => {setDark(!dark); localStorage.setItem('dark', String(!dark))}}>
              {dark? <Sun size={20} color={textColor}/> : <Moon size={20} color={subtext}/>}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {['hot','new','top','rising'].map(f => (
            <button key={f} onClick={() => setFeed(f)}
              style={{ backgroundColor: feed===f? '#FDCB00' : 'transparent', color: feed===f? '#000' : subtext }}
              className="px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1"
            >
              {f==='hot' && <Flame size={14}/>}
              {f==='new' && <Clock size={14}/>}
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 pb-24">
        {yaks.map(y => (
          <div key={y.id} style={{backgroundColor: cardBg}} className="p-4 rounded-2xl mb-3 shadow-lg">
            {y.imageUrl && <img src={y.imageUrl} className="rounded-xl mb-3 w-full"/>}
            <p style={{color: textColor}} className="text-base mb-2 leading-6 font-medium">{y.text}</p>
            <p style={{color: subtext}} className="text-xs mb-3">{timeAgo(y.createdAt)}</p>
            <div style={{color: subtext}} className="flex justify-between items-center text-sm">
              <div className="flex gap-6">
                <button onClick={() => vote(y.id, 'likes')} className="flex items-center gap-1 font-bold">⬆️ {y.likes}</button>
                <button onClick={() => vote(y.id, 'dislikes')} className="flex items-center gap-1 font-bold">⬇️ {y.dislikes}</button>
                <button onClick={() => setSelectedYak(y.id)} className="flex items-center gap-1"><MessageCircle size={16}/> {y.comments}</button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => report(y.id)} style={{opacity: 0.5}}><Flag size={16}/></button>
                {/* OWNER AYITHE MATRAM EDIT + DELETE */}
                {user?.uid === y.uid && (
                  <>
                    <button onClick={() => startEdit(y)}><Edit3 size={16}/></button>
                    <button onClick={() => deleteYak(y)}><Trash2 size={16} color="red"/></button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <button onClick={() => {setScreen(4); setEditingYak(null); setNewYak('')}} style={{backgroundColor: '#FDCB00'}} className="text-black w-16 h-16 rounded-full flex items-center justify-center shadow-2xl">
          <Plus size={32} strokeWidth={3} color="#000"/>
        </button>
      </div>

      {/* POST/EDIT MODAL */}
      {screen === 4 && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-20">
          <div style={{backgroundColor: cardBg}} className="p-4 rounded-t-3xl w-full">
            <h3 style={{color: textColor}} className="font-bold text-lg mb-2">{editingYak? 'Edit Yak' : 'New Yak'}</h3>
            {!editingYak && <input type="file" accept="image/*" onChange={(e)=>setImage(e.target.files?.[0] || null)} style={{color: subtext}} className="mb-3 text-sm"/>}
            <textarea value={newYak} onChange={(e) => setNewYak(e.target.value)} placeholder="What's happening?" style={{color: textColor, backgroundColor: dark? '#2A2A2A' : '#F3F4F6'}} className="w-full h-32 p-3 rounded-xl" maxLength={200}/>
            <div className="flex gap-2 mt-3">
              <button onClick={postYak} style={{backgroundColor: '#FDCB00', color: '#000'}} className="px-6 py-3 rounded-full font-bold w-full">{editingYak? 'Update' : 'Yak'}</button>
              <button onClick={() => setScreen(3)} style={{color: subtext}} className="px-6 py-3">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                             }
