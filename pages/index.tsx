import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, increment, where, arrayUnion } from "firebase/firestore";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Flag, Plus, Flame, Bell, User } from "lucide-react";

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
const provider = new GoogleAuthProvider();
// =====================================

const COLLEGES = ["SVUCE Tirupati", "JNTU Hyderabad", "IIT Madras", "VIT Vellore", "NIT Warangal", "BITS Pilani"];

export default function CampusYakMVP() {
  const [screen, setScreen] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [college, setCollege] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [quickPost, setQuickPost] = useState(""); // Powerful idea
  const [anonId] = useState(Math.floor(Math.random() * 9000 + 1000)); // Student #2481

  // Login
  const login = async () => {
    const res = await signInWithPopup(auth, provider);
    setUser(res.user);
    setScreen(3);
  }

  // Load posts when college selected
  useEffect(() => {
    if(screen >= 4 && college) {
      const q = query(collection(db, "posts"), where("college", "==", college), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({ id: d.id,...d.data() }))));
    }
  }, [screen, college]);

  const createPost = async (text: string, category: string = "🎓 Campus") => {
    if(!text.trim()) return;
    await addDoc(collection(db, "posts"), {
      text, category, college, score: 0, anonId, owner: user.uid,
      comments: [], createdAt: serverTimestamp()
    });
    setQuickPost("");
    if(screen === 1 || screen === 4) alert("Posted!");
  }

  const handleVote = async (postId: string, type: "up" | "down") => {
    await updateDoc(doc(db, "posts", postId), { score: increment(type === "up"? 1 : -1) });
  }

  // SCREEN 1: SPLASH
  if(screen === 1) return (
    <div className="h-screen bg-black text-white flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-bold text-purple-500">CampusYak</h1>
      <p className="mt-2 text-gray-400">Your Campus. Your Voice.</p>
      <button onClick={()=>setScreen(2)} className="mt-8 bg-purple-600 px-8 py-3 rounded-full font-bold text-lg">Get Started</button>
    </div>
  )

  // SCREEN 2: GOOGLE LOGIN
  if(screen === 2) return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold">Login</h1>
      <button onClick={login} className="mt-4 bg-white text-black px-6 py-3 rounded-full font-bold">Continue with Google</button>
    </div>
  )

  // SCREEN 3: SELECT COLLEGE
  if(screen === 3) return (
    <div className="h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold">Select Your College</h1>
      <div className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto">
        {COLLEGES.map(c => <button key={c} onClick={()=>{setCollege(c); setScreen(4)}} className="w-full p-3 rounded bg-gray-900 text-left hover:bg-purple-900">{c}</button>)}
      </div>
    </div>
  )

  // MAIN APP WITH BOTTOM NAV
  return (
    <div className="pb-20 bg-black text-white min-h-screen">
      {screen === 4 && <HomeFeed posts={posts} onVote={handleVote} onQuickPost={createPost} quickPost={quickPost} setQuickPost={setQuickPost} />}
      {screen === 5 && <CreatePostScreen onPost={createPost} />}
      {screen === 6 && <NotificationsScreen />}
      {screen === 7 && <ProfileScreen posts={posts.filter(p=>p.owner===user.uid)} anonId={anonId} />}
      {screen === 8 && <TrendingScreen posts={posts} onVote={handleVote} />}

      <BottomNav screen={screen} setScreen={setScreen} />
    </div>
  )
}

// SCREEN 4: HOME FEED
function HomeFeed({posts, onVote, onQuickPost, quickPost, setQuickPost}: any) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">🏠 Home Feed</h1>

      {/* POWERFUL IDEA: QUICK POST BOX */}
      <div className="bg-gray-900 p-3 rounded-xl my-4">
        <input value={quickPost} onChange={e=>setQuickPost(e.target.value)} placeholder="What's happening in your campus today?" className="w-full bg-transparent outline-none"/>
        <button onClick={()=>onQuickPost(quickPost)} className="mt-2 bg-purple-600 px-4 py-2 rounded-full font-bold">Post</button>
      </div>

      {posts.map((p: any) => (
        <div key={p.id} className="border border-gray-800 rounded-xl p-4 mb-4">
          <span className="bg-purple-600 text-xs px-2 py-1 rounded-full">{p.category}</span>
          <p className="mt-2">{p.text}</p>
          <div className="flex gap-4 mt-3 opacity-70 text-sm">
            <button onClick={() => onVote(p.id, "up")}><ArrowBigUp className="inline"/> {p.score || 0}</button>
            <button onClick={() => onVote(p.id, "down")}><ArrowBigDown className="inline"/></button>
            <button><MessageCircle size={16} className="inline"/> {p.comments?.length || 0}</button>
            <button><Flag size={16} className="inline"/></button>
          </div>
        </div>
      ))}
    </div>
  )
}

// SCREEN 5: CREATE POST
function CreatePostScreen({onPost}: any) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("🎓 Campus");
  const [type, setType] = useState("text");
  const categories = ["🎓 Campus", "❓ Question", "😂 Meme", "❤️ Confession", "🔍 Lost & Found"];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">➕ Create Post</h1>
      <div className="flex gap-2 my-3">
        <button onClick={()=>setType("text")} className={`px-3 py-1 rounded-full ${type==="text"? "bg-purple-600" : "bg-gray-800"}`}>Text</button>
        <button onClick={()=>setType("poll")} className={`px-3 py-1 rounded-full ${type==="poll"? "bg-purple-600" : "bg-gray-800"}`}>Poll</button>
      </div>
      <div className="flex gap-2 overflow-x-auto my-3">
        {categories.map(c => <button key={c} onClick={()=>setCategory(c)} className={`px-3 py-1 rounded-full ${category===c? "bg-purple-600" : "bg-gray-800"}`}>{c}</button>)}
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={type==="poll"? "Ask a question..." : "Write your yak..."} className="w-full h-40 bg-gray-900 p-3 rounded"/>
      <button onClick={()=>onPost(text, category)} className="bg-purple-600 w-full py-3 rounded-full mt-2 font-bold">Post Anonymously</button>
    </div>
  )
}

// SCREEN 6: NOTIFICATIONS
function NotificationsScreen() {
  const notifs = ["Yakker #1234 replied to your post", "Your post got 10 upvotes", "Someone mentioned you"];
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">🔔 Notifications</h1>
      {notifs.map((n,i) => <div key={i} className="border-b border-gray-800 p-3">{n}</div>)}
    </div>
  )
}

// SCREEN 7: PROFILE
function ProfileScreen({posts, anonId}: any) {
  const karma = posts.reduce((a,p)=>a+(p.score||0),0);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">👤 Profile</h1>
      <p className="mt-2 text-lg">Anonymous ID: <b>Student #{anonId}</b></p>
      <p>🏆 Karma: {karma}</p>
      <h2 className="mt-4 font-bold">My Posts</h2>
      {posts.length === 0 && <p className="opacity-50">No posts yet</p>}
      {posts.map((p:any) => <div key={p.id} className="bg-gray-900 p-2 rounded mt-2">{p.text}</div>)}
    </div>
  )
}

// SCREEN 8: TRENDING
function TrendingScreen({posts, onVote}: any) {
  const trending = [...posts].sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,10);
  return <HomeFeed posts={trending} onVote={onVote} />
}

// BOTTOM NAV
function BottomNav({screen, setScreen}: any) {
  const tabs = [
    {id: 4, icon: "🏠"}, {id: 5, icon: "➕"}, {id: 8, icon: "🔥"},
    {id: 6, icon: "🔔"}, {id: 7, icon: "👤"}
  ];
  return (
    <div className="fixed bottom-0 w-full flex justify-around bg-gray-950 p-3 border-t border-gray-800">
      {tabs.map(t => <button key={t.id} onClick={() => setScreen(t.id)} className={`text-2xl ${screen === t.id? "" : "opacity-50"}`}>{t.icon}</button>)}
    </div>
  )
                         }
