import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, increment, where, arrayUnion } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Flag, Flame, Bell, User, Shield, Trash, Search } from "lucide-react";

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

export default function CampusYak() {
  const [user, setUser] = useState<any>(null);
  const [college, setCollege] = useState("SVUCE Tirupati");
  const [tab, setTab] = useState("feed");
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const login = async () => {
    const res = await signInWithPopup(auth, provider);
    setUser(res.user);
  }

  useEffect(() => {
    const q = query(collection(db, "posts"), where("college", "==", college), orderBy("score", "desc"));
    return onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({ id: d.id,...d.data() }))));
  }, [college]);

  const handleVote = async (postId: string, type: "up" | "down") => {
    await updateDoc(doc(db, "posts", postId), { score: increment(type === "up"? 1 : -1) });
  }

  if(!user) return <LoginScreen onLogin={login} />;

  const filteredPosts = posts.filter(p => p.text?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-20 bg-black text-white min-h-screen">
      <div className="sticky top-0 bg-black p-2 z-10">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔎 Search #hashtag or keyword" className="w-full bg-gray-900 p-2 rounded-full"/>
      </div>

      {tab === "feed" && <Feed posts={filteredPosts} onVote={handleVote} />}
      {tab === "post" && <CreatePost user={user} college={college} />}
      {tab === "trending" && <Feed posts={filteredPosts.sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,10)} onVote={handleVote} title="🔥 Trending" />}
      {tab === "admin" && <Admin posts={posts} />}
      {tab === "profile" && <Profile user={user} posts={posts} />}

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  )
}

function Feed({posts, onVote, title="🏠 Home Feed"}: any) {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      {posts.filter((p:any)=>!p.deleted).map((p: any) => <PostCard key={p.id} post={p} onVote={onVote} />)}
    </div>
  )
}

function PostCard({post, onVote}: any) {
  const [open, setOpen] = useState(false);
  if(post.score <= -5) return null; // YIK YAK RULE

  return (
    <div className="border border-gray-800 rounded-xl p-4">
      <div className="flex gap-3">
        <div className="flex flex-col items-center w-10">
          <button onClick={() => onVote(post.id, "up")}><ArrowBigUp /></button>
          <span className={`font-bold ${post.score > 0? "text-green-400" : post.score < 0? "text-red-400" : ""}`}>{post.score || 0}</span>
          <button onClick={() => onVote(post.id, "down")}><ArrowBigDown /></button>
        </div>
        <div className="flex-1">
          <span className="bg-purple-600 text-xs px-2 py-1 rounded-full">{post.category}</span>
          {post.image && <img src={post.image} className="w-full rounded mt-2"/>}

          {post.type === "poll"? <Poll post={post} /> : <p className="mt-2">{post.text}</p>}

          <div className="flex gap-4 mt-3 opacity-70 text-sm">
            <span>Yakker #{post.anonId}</span>
            <button onClick={() => setOpen(!open)}><MessageCircle size={16} className="inline"/> {post.comments?.length || 0}</button>
            <button><Flag size={16} className="inline"/></button>
          </div>
          {open && <Comments postId={post.id} comments={post.comments || []} />}
        </div>
      </div>
    </div>
  )
}

function Poll({post}: any) {
  const [voted, setVoted] = useState(false);
  const vote = async (i: number) => {
    await updateDoc(doc(db, "posts", post.id), { [`pollVotes.${i}`]: increment(1) });
    setVoted(true);
  }
  const total = post.pollVotes?.reduce((a:number,b:number)=>a+b,0) || 0;
  return (
    <div className="mt-2">
      <p className="font-bold">{post.text}</p>
      {post.pollOptions.map((opt: string, i: number) => (
        <button key={i} onClick={() =>!voted && vote(i)} className="w-full bg-gray-800 p-2 rounded mt-2 text-left">
          {opt} <span className="float-right">{total > 0? Math.round((post.pollVotes?.[i]||0)/total*100) : 0}%</span>
        </button>
      ))}
    </div>
  )
}

function Comments({postId, comments}: any) {
  const [text, setText] = useState("");
  const add = async () => {
    await updateDoc(doc(db, "posts", postId), {
      comments: arrayUnion({ text, anonId: Math.floor(Math.random() * 9000 + 1000), time: Date.now() })
    });
    setText("");
  }
  return (
    <div className="mt-3 border-t border-gray-800 pt-3 space-y-2">
      {comments.map((c: any, i: number) => <p key={i} className="text-sm"><b>Yakker #{c.anonId}</b>: {c.text}</p>)}
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Reply..." className="flex-1 bg-gray-900 p-2 rounded"/>
        <button onClick={add} className="bg-purple-600 px-3 rounded">Reply</button>
      </div>
    </div>
  )
}

function CreatePost({user, college}: any) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Confession");
  const [type, setType] = useState("text");
  const [options, setOptions] = useState(["", ""]);
  const [file, setFile] = useState<any>(null);

  const post = async () => {
    let imageUrl = "";
    if(file) {
      const storageRef = ref(storage, `posts/${Date.now()}`);
      const snap = await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, "posts"), {
      text, category, college, type, image: imageUrl, score: 0, anonId: Math.floor(Math.random() * 9000 + 1000),
      pollOptions: type === "poll"? options : [], pollVotes: type === "poll"? [0,0] : [],
      comments: [], deleted: false, createdAt: serverTimestamp()
    });
    setText(""); setFile(null);
    alert("Posted!");
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">➕ Create Yak</h1>
      <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-900 p-2 rounded mb-2">
        <option value="text">Text</option><option value="poll">Poll</option>
      </select>
      <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-900 p-2 rounded mb-2">
        <option>Confession</option><option>Question</option><option>Meme</option><option>Lost & Found</option>
      </select>

      {type === "poll" && options.map((opt, i) => (
        <input key={i} value={opt} onChange={e => {const o=[...options]; o[i]=e.target.value; setOptions(o)}}
        placeholder={`Option ${i+1}`} className="w-full bg-gray-900 p-2 rounded mb-2"/>
      ))}

      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's on your campus mind?" className="w-full h-32 bg-gray-900 p-3 rounded"/>
      <input type="file" onChange={e => setFile(e.target.files?.[0])} className="mt-2"/>
      <button onClick={post} className="bg-purple-600 w-full px-6 py-3 rounded-full mt-2 font-bold">Post Anonymously</button>
    </div>
  )
}

function Admin({posts}: any) {
  const del = async (id: string) => await updateDoc(doc(db, "posts", id), { deleted: true });
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">👮 Admin Panel</h1>
      {posts.map((p: any) => (
        <div key={p.id} className="border border-red-800 p-3 rounded mb-2 flex justify-between">
          <div><p>{p.text}</p><p className="text-xs opacity-50">Score: {p.score} | Yakker #{p.anonId}</p></div>
          <button onClick={() => del(p.id)}><Trash className="text-red-500"/></button>
        </div>
      ))}
    </div>
  )
}

function Profile({user, posts}: any) {
  const karma = posts.reduce((a,p)=>a+(p.score||0),0);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">👤 Yakker #{Math.floor(Math.random() * 9000 + 1000)}</h1>
      <p className="mt-2">🏆 Karma: {karma}</p>
      <p>📝 Your Yaks: {posts.length}</p>
    </div>
  )
}

function BottomNav({tab, setTab}: any) {
  const tabs = [
    {id: "feed", icon: "🏠"}, {id: "post", icon: "➕"}, {id: "trending", icon: "🔥"},
    {id: "admin", icon: "👮"}, {id: "profile", icon: "👤"}
  ];
  return (
    <div className="fixed bottom-0 w-full flex justify-around bg-gray-950 p-3 border-t border-gray-800">
      {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`text-2xl ${tab === t.id? "" : "opacity-50"}`}>{t.icon}</button>)}
    </div>
  )
}

function LoginScreen({onLogin}: any) {
  return <div className="h-screen flex flex-col items-center justify-center"><h1 className="text-4xl font-bold">CampusYak</h1><p>100% Anonymous. 100% Your College.</p><button onClick={onLogin} className="bg-white text-black px-6 py-3 rounded-full mt-4">Login with Google</button></div>
                                                           }
