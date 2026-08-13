import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, LogIn, Sun, Moon, Image as ImageIcon, LogOut } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ===== FIREBASE DIRECT IKKADA =====
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
const googleProvider = new GoogleAuthProvider();
// ===== FIREBASE END =====

export default function NexoraLite() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [newPostText, setNewPostText] = useState("");
  const [newPostFile, setNewPostFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { 
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => { 
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc")); 
    const unsub = onSnapshot(q, snap => setPosts(snap.docs.map(d => ({id:d.id,...d.data()})))); 
    return () => unsub();
  }, []);

  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);

  const login = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch(e) { toast.error("Login failed") }
  }
  const logout = async () => await signOut(auth);

  const createPost = async () => {
    if(!newPostText ||!newPostFile) return toast.error("Text + Image kavali");
    if(!user) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `posts/${Date.now()}_${newPostFile.name}`);
      const snap = await uploadBytes(storageRef, newPostFile);
      const url = await getDownloadURL(snap.ref);
      await addDoc(collection(db, "posts"), {
        text: newPostText, image: url, userId: user.uid, userName: user.displayName, userPhoto: user.photoURL,
        likes: [], createdAt: serverTimestamp()
      });
      setNewPostText(""); setNewPostFile(null); toast.success("Posted!");
    } catch(e) { toast.error("Upload failed") }
    setUploading(false);
  }

  const likePost = async (postId: string, likes: string[]) => {
    if(!user) return;
    const postRef = doc(db, "posts", postId);
    const isLiked = likes?.includes(user.uid);
    await updateDoc(postRef, { likes: isLiked? arrayRemove(user.uid) : arrayUnion(user.uid) });
  }

  if(loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>

  if(!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
      <Toaster />
      <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Nexora</h1>
      <p className="mb-8 text-gray-400">Simple Social Media</p>
      <button onClick={login} className="bg-white text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition">
        <LogIn /> Continue with Google
      </button>
    </div>
  )

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <Toaster />
      <header className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur p-4 flex justify-between items-center border-b dark:border-gray-800 z-10">
        <h1 className="text-2xl font-bold">Nexora</h1>
        <div className="flex gap-3 items-center">
          <button onClick={() => setTheme(theme==="dark"?"light":"dark")} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
            {theme==="dark"?<Sun size={20}/>:<Moon size={20}/>}
          </button>
          <img src={user.photoURL!} className="w-9 h-9 rounded-full"/>
          <button onClick={logout} className="p-2"><LogOut size={18}/></button>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-20">
        {/* STORIES */}
        <div className="flex gap-4 overflow-x-auto p-4 border-b dark:border-gray-800">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-pink-500">
                <img src={`https://i.pravatar.cc/150?u=story${i}`} className="w-full h-full rounded-full border-2 border-white dark:border-black"/>
              </div>
              <p className="text-xs">User {i}</p>
            </div>
          ))}
        </div>

        {/* CREATE POST */}
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex gap-3 mb-3">
            <img src={user.photoURL!} className="w-10 h-10 rounded-full"/>
            <input value={newPostText} onChange={e=>setNewPostText(e.target.value)} placeholder="What's on your mind?" className="w-full bg-gray-100 dark:bg-gray-900 p-3 rounded-lg outline-none"/>
          </div>
          <label className="flex items-center gap-2 mb-3 cursor-pointer text-blue-500"><ImageIcon size={18}/> <span>Add Photo</span><input type="file" accept="image/*" onChange={e=>setNewPostFile(e.target.files?.[0] || null)} className="hidden"/></label>
          {newPostFile && <p className="text-sm mb-2 text-gray-500">{newPostFile.name}</p>}
          <button onClick={createPost} disabled={uploading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold disabled:bg-gray-500">{uploading? "Posting..." : "Post"}</button>
        </div>

        {/* FEED */}
        {posts.length === 0 && <p className="text-center p-10 text-gray-500">No posts yet. Be the first!</p>}
        {posts.map(post => (
          <div key={post.id} className="border-b dark:border-gray-800">
            <div className="p-3 flex items-center gap-2">
              <img src={post.userPhoto} className="w-10 h-10 rounded-full"/>
              <p className="font-bold">{post.userName}</p>
            </div>
            <img src={post.image} className="w-full"/>
            <div className="p-3">
              <div className="flex gap-4 mb-2">
                <button onClick={() => likePost(post.id, post.likes)} className="flex items-center gap-1">
                  <Heart fill={post.likes?.includes(user.uid)?"red":"none"} color={post.likes?.includes(user.uid)?"red":"currentColor"}/> {post.likes?.length || 0}
                </button>
                <button><MessageCircle /></button>
                <button><Send /></button>
              </div>
              <p><span className="font-bold">{post.userName}</span> {post.text}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
            }
