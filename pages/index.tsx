import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, increment, where, arrayUnion } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Flag, Flame, Bell, User, Trash, Shield } from "lucide-react";

// ========== FIREBASE CONFIG ==========
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
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
// =====================================

const ADMIN_EMAILS = ["your_email@gmail.com"]; // Nee gmail id pettu
const COLLEGES = ["BITS Adoni", "Arts & Science Adoni", "SRET Tirupati", "Junior College Mantralayam"];

export default function CampusYakMVP() {
  const [screen, setScreen] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [college, setCollege] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [quickPost, setQuickPost] = useState("");
  const [anonId] = useState(Math.floor(Math.random() * 9000 + 1000));
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const login = async () => {
    const res = await signInWithPopup(auth, provider);
    setUser(res.user);
    setScreen(3);
  }

  useEffect(() => {
    if(screen >= 4 && college) {
      const q = query(collection(db, "posts"), where("college", "==", college), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({ id: d.id,...d.data() })))));
    }
  }, [screen, college]);

  useEffect(() => {
    if(user) {
      const q = query(collection(db, "notifications"), where("to", "==", user.uid), orderBy("time", "desc"));
      return onSnapshot(q, (snap) => setNotifications(snap.docs.map(d => ({id: d.id,...d.data()}))));
    }
  }, [user]);

  const createPost = async (text: string, category: string = "🎓 Campus", file: any = null) => {
    if(!text.trim() &&!file) return;
    let imageUrl = "";
    if(file) {
      const storageRef = ref(storage, `posts/${Date.now()}`);
      const snap = await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, "posts"), {
      text, category, college, image: imageUrl, score: 0, anonId, owner: user.uid,
      comments: [], reports: 0, deleted: false, createdAt: serverTimestamp()
    });
    setQuickPost("");
  }

  const handleVote = async (postId: string, type: "up" | "down", owner: string) => {
    await updateDoc(doc(db, "posts", postId), { score: increment(type === "up"? 1 : -1) });
    await addDoc(collection(db, "notifications"), {
      to: owner, text: `Your post got ${type}voted!`, time: serverTimestamp(), read: false
    });
  }

  const handleComment = async (postId: string, comment: string, owner: string) => {
    await updateDoc(doc(db, "posts", postId), {
      comments: arrayUnion({ text: comment, anonId: Math.floor(Math.random() * 9000 + 1000) })
    });
    await addDoc(collection(db, "notifications"), {
      to: owner, text: `New comment on your post`, time: serverTimestamp(), read: false
    });
  }

  const handleReport = async (postId: string) => {
    await updateDoc(doc(db, "posts", postId), { reports: increment(1) });
    alert("Reported");
  }

  const handleDelete = async (postId: string) => {
    await updateDoc(doc(db, "posts", postId), { deleted: true });
  }

  const markRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  }

  // SCREEN 1: SPLASH
  if(screen === 1) return <Splash onNext={()=>setScreen(2)} />
  // SCREEN 2: LOGIN
  if(screen === 2) return <Login onLogin={login} />
  // SCREEN 3: COLLEGE
  if(screen === 3) return <SelectCollege colleges={COLLEGES} onSelect={(c)=>{setCollege(c); setScreen(4)}} />

  return (
    <div className="pb-20 bg-black text-white min-h-screen">
      {screen === 4 && <HomeFeed posts={posts} onVote={handleVote} onComment={handleComment} onReport={handleReport} onQuickPost={createPost} quickPost={quickPost} setQuickPost={setQuickPost} user={user} />}
      {screen === 5 && <CreatePostScreen onPost={createPost} />}
      {screen === 6 && <NotificationsScreen notifications={notifications} onRead={markRead} />}
      {screen === 7 && <ProfileScreen posts={posts.filter(p=>p.owner===user.uid)} anonId={anonId} />}
      {screen === 8 && <TrendingScreen posts={posts} onVote={handleVote} onReport={handleReport} onComment={handleComment} user={user} />}
      {screen === 9 && isAdmin && <AdminScreen posts={posts} onDelete={handleDelete} />}
      <BottomNav screen={screen} setScreen={setScreen} isAdmin={isAdmin} notifCount={notifications.filter(n=>!n.read).length} />
    </div>
  )
}

// FIXED: MISSING COMPONENTS ADDED
function Splash({onNext}: any) {
  return (
    <div className="h-screen bg-black text-white flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-bold text-purple-500">CampusYak</h1>
      <p className="mt-2 text-gray-400">Your Campus. Your Voice.</p>
      <button onClick={onNext} className="mt-8 bg-purple-600 px-8 py-3 rounded-full font-bold text-lg">Get Started</button>
    </div>
  )
}

function Login({onLogin}: any) {
  return (
    <div className="h-screen bg-black text-white flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold">Login</h1>
      <button onClick={onLogin} className="mt-4 bg-white text-black px-6 py-3 rounded-full font-bold">Continue with Google</button>
    </div>
  )
}

function SelectCollege({colleges, onSelect}: any) {
  return (
    <div className="h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold">Select Your College</h1>
      <div className="mt-4 space-y-2">
        {colleges.map((c:string) => <button key={c} onClick={()=>onSelect(c)} className="w-full p-3 rounded bg-gray-900 text-left hover:bg-purple-900">{c}</button>)}
      </div>
    </div>
  )
}

// REST OF COMPONENTS...
function HomeFeed({posts, onVote, onComment, onReport, onQuickPost, quickPost, setQuickPost, user}: any) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">🏠 Home Feed</h1>
      <div className="bg-gray-900 p-3 rounded-xl my-4">
        <input value={quickPost} onChange={e=>setQuickPost(e.target.value)} placeholder="What's happening in your campus today?" className="w-full bg-transparent outline-none"/>
        <button onClick={()=>onQuickPost(quickPost)} className="mt-2 bg-purple-600 px-4 py-2 rounded-full font-bold">Post</button>
      </div>
      {posts.filter((p:any)=>!p.deleted).map((p: any) => (
        <PostCard key={p.id} post={p} onVote={onVote} onComment={onComment} onReport={onReport} user={user} />
      ))}
    </div>
  )
}

function PostCard({post, onVote, onComment, onReport, user}: any) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  return (
    <div className="border border-gray-800 rounded-xl p-4 mb-4">
      <span className="bg-purple-600 text-xs px-2 py-1 rounded-full">{post.category}</span>
      <p className="mt-2">{post.text}</p>
      {post.image && <img src={post.image} className="w-full rounded mt-2"/>}
      <div className="flex gap-4 mt-3 opacity-70 text-sm">
        <span>Student #{post.anonId}</span>
        <button onClick={() => onVote(post.id, "up", post.owner)}><ArrowBigUp className="inline"/> {post.score || 0}</button>
        <button onClick={() => onVote(post.id, "down", post.owner)}><ArrowBigDown className="inline"/></button>
        <button onClick={() => setOpen(!open)}><MessageCircle size={16} className="inline"/> {post.comments?.length || 0}</button>
        <button onClick={() => onReport(post.id)}><Flag size={16} className="inline"/></button>
      </div>
      {open && (
        <div className="mt-3 border-t border-gray-800 pt-3">
          {post.comments?.map((c: any, i: number) => <p key={i} className="text-sm"><b>Student #{c.anonId}</b>: {c.text}</p>)}
          <div className="flex gap-2 mt-2">
            <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add comment..." className="flex-1 bg-gray-900 p-2 rounded"/>
            <button onClick={()=>{onComment(post.id, comment, post.owner); setComment("")}} className="bg-purple-600 px-3 rounded">Post</button>
          </div>
        </div>
      )}
    </div>
  )
}

function CreatePostScreen({onPost}: any) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("🎓 Campus");
  const [file, setFile] = useState<any>(null);
  const categories = ["🎓 Campus", "❓ Question", "😂 Meme", "❤️ Confession", "🔍 Lost & Found"];
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">➕ Create Post</h1>
      <div className="flex gap-2 overflow-x-auto my-3">
        {categories.map(c => <button key={c} onClick={()=>setCategory(c)} className={`px-3 py-1 rounded-full ${category===c? "bg-purple-600" : "bg-gray-800"}`}>{c}</button>)}
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write your yak..." className="w-full h-40 bg-gray-900 p-3 rounded"/>
      <input type="file" onChange={e=>setFile(e.target.files?.[0])} className="mt-2"/>
      <button onClick={()=>onPost(text, category, file)} className="bg-purple-600 w-full py-3 rounded-full mt-2 font-bold">Post</button>
    </div>
  )
}

function NotificationsScreen({notifications, onRead}: any) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">🔔 Notifications</h1>
      {notifications.map((n:any) => (
        <div key={n.id} onClick={()=>onRead(n.id)} className={`border-b border-gray-800 p-3 ${n.read? "opacity-50" : "bg-purple-900/20"}`}>{n.text}</div>
      ))}
    </div>
  )
}

function ProfileScreen({posts, anonId}: any) {
  const karma = posts.reduce((a,p)=>a+(p.score||0),0);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">👤 Profile</h1>
      <p className="mt-2 text-lg">Anonymous ID: <b>Student #{anonId}</b></p>
      <p>🏆 Karma: {karma}</p>
      <h2 className="mt-4 font-bold">My Posts</h2>
      {posts.map((p:any) => <div key={p.id} className="bg-gray-900 p-2 rounded mt-2">{p.text}</div>)}
    </div>
  )
}

function TrendingScreen({posts, onVote, onReport, onComment, user}: any) {
  const trending = [...posts].filter(p=>!p.deleted).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,10);
  return <HomeFeed posts={trending} onVote={onVote} onComment={onComment} onReport={onReport} user={user} />
}

function AdminScreen({posts, onDelete}: any) {
  const reported = posts.filter((p:any)=>p.reports > 0 &&!p.deleted);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">👮 Admin Panel <Shield className="inline text-green-400"/></h1>
      {reported.map((p: any) => (
        <div key={p.id} className="border border-red-800 p-3 rounded mb-2">
          <p>{p.text}</p>
          {p.image && <img src={p.image} className="w-20 rounded mt-1"/>}
          <p className="text-xs">Reports: {p.reports}</p>
          <button onClick={()=>onDelete(p.id)} className="bg-red-600 px-3 py-1 rounded mt-2"><Trash size={16} className="inline"/> Delete</button>
        </div>
      ))}
    </div>
  )
}

function BottomNav({screen, setScreen, isAdmin, notifCount}: any) {
  const tabs = [
    {id: 4, icon: "🏠"}, {id: 5, icon: "➕"}, {id: 8, icon: "🔥"},
    {id: 6, icon: "🔔"}, {id: 7, icon: "👤"}
  ];
  if(isAdmin) tabs.push({id: 9, icon: "👮"});
  return (
    <div className="fixed bottom-0 w-full flex justify-around bg-gray-950 p-3 border-t border-gray-800">
      {tabs.map(t => <button key={t.id} onClick={() => setScreen(t.id)} className={`text-2xl relative ${screen === t.id? "" : "opacity-50"}`}>
        {t.icon}
        {t.id === 6 && notifCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4">{notifCount}</span>}
      </button>)}
    </div>
  )
                        }
