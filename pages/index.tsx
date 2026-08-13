import { useState, useEffect, useMemo } from "react";
import { Heart, MessageCircle, Send, LogIn, Sun, Moon, Image as ImageIcon, LogOut, Search, Target, UserPlus, UserCheck, Grid } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ===== FIREBASE =====
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, setDoc, getDoc, limit } from "firebase/firestore";
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
// ===== END FIREBASE =====

export default function NexoraMVP() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [page, setPage] = useState<"home"|"profile">("home");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [theme, setTheme] = useState("dark");
  const [search, setSearch] = useState("");
  const [newPostText, setNewPostText] = useState("");
  const [newPostFile, setNewPostFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [commentText, setCommentText] = useState<{[key:string]:string}>({});
  const [goal, setGoal] = useState("");

  useEffect(() => { onAuthStateChanged(auth, setUser); }, []);
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
    onSnapshot(q, snap => setPosts(snap.docs.map(d => ({id:d.id,...d.data()}))));
  }, []);
  useEffect(() => { onSnapshot(collection(db, "users"), snap => setAllUsers(snap.docs.map(d => ({id:d.id,...d.data()})))); }, []);
  useEffect(() => {
    if(user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then(d => setGoal(d.data()?.goal || ""));
      setDoc(userRef, {name: user.displayName, photo: user.photoURL, followers: [], following: []}, {merge: true});
    }
  }, [user]);
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);

  const login = async () => await signInWithPopup(auth, googleProvider);
  const logout = async () => { await signOut(auth); setPage("home"); };

  const createPost = async () => {
    if(!newPostText ||!user) return toast.error("Text kavali");
    setUploading(true);
    let url = "";
    if(newPostFile){
      const storageRef = ref(storage, `posts/${Date.now()}_${newPostFile.name}`);
      const snap = await uploadBytes(storageRef, newPostFile);
      url = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, "posts"), {
      text: newPostText, image: url, userId: user.uid, userName: user.displayName, userPhoto: user.photoURL,
      likes: [], comments: [], createdAt: serverTimestamp()
    });
    setNewPostText(""); setNewPostFile(null); setUploading(false); toast.success("Posted!");
  }

  const likePost = async (postId: string, likes: string[]) => {
    if(!user) return;
    await updateDoc(doc(db, "posts", postId), { likes: likes?.includes(user.uid)? arrayRemove(user.uid) : arrayUnion(user.uid) });
  }

  const addComment = async (postId: string) => {
    if(!user ||!commentText[postId]) return;
    const newComment = {text: commentText[postId], user: user.displayName, photo: user.photoURL, uid: user.uid};
    await updateDoc(doc(db, "posts", postId), { comments: arrayUnion(newComment) });
    setCommentText({...commentText, [postId]: ""});
  }

  const toggleFollow = async (targetId: string) => {
    if(!user) return;
    const myRef = doc(db, "users", user.uid);
    const myData = allUsers.find(u => u.id === user.uid);
    await updateDoc(myRef, { following: myData?.following?.includes(targetId)? arrayRemove(targetId) : arrayUnion(targetId) });
  }

  const updateGoal = async () => {
    if(!user) return;
    await setDoc(doc(db, "users", user.uid), {goal}, {merge: true});
    toast.success("Goal Updated!");
  }

  const filteredPosts = useMemo(() => posts.filter(p => p.text.toLowerCase().includes(search.toLowerCase())), [posts, search]);
  const profileUser = useMemo(() => allUsers.find(u => u.id === profileId), [allUsers, profileId]);
  const profilePosts = useMemo(() => posts.filter(p => p.userId === profileId), [posts, profileId]);

  if(!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
      <Toaster />
      <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Nexora</h1>
      <p className="mb-8 text-gray-400">Share your Goal</p>
      <button onClick={login} className="bg-white text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-105"><LogIn /> Continue with Google</button>
    </div>
  )

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <Toaster />
      <header className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur p-4 flex justify-between items-center border-b dark:border-gray-800 z-10">
        <h1 onClick={()=>{setPage("home"); setProfileId(null)}} className="text-2xl font-bold cursor-pointer">Nexora</h1>
        <div className="flex gap-3 items-center">
          {page === "home" && <div className="relative hidden md:block">
            <Search className="absolute left-2 top-2.5 text-gray-500" size={16}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts" className="bg-gray-100 dark:bg-gray-900 pl-8 pr-2 py-2 rounded-lg text-sm"/>
          </div>}
          <button onClick={() => setTheme(theme==="dark"?"light":"dark")} className="p-2"><Sun size={20}/></button>
          <img onClick={()=>{setPage("profile"); setProfileId(user.uid)}} src={user.photoURL!} className="w-9 h-9 rounded-full cursor-pointer"/>
          <button onClick={logout} className="p-2"><LogOut size={18}/></button>
        </div>
      </header>

      {page === "home"? (
        <main className="max-w-2xl mx-auto p-4">
          {/* CREATE POST */}
          <div className="p-4 border dark:border-gray-800 rounded-lg mb-4">
            <div className="flex gap-3 mb-3"><img src={user.photoURL!} className="w-10 h-10 rounded-full"/>
            <input value={newPostText} onChange={e=>setNewPostText(e.target.value)} placeholder="What's your goal today?" className="w-full bg-gray-100 dark:bg-gray-900 p-3 rounded-lg outline-none"/></div>
            <label className="flex items-center gap-2 mb-3 cursor-pointer text-blue-500"><ImageIcon size={18}/> <span>Add Image</span><input type="file" accept="image/*" onChange={e=>setNewPostFile(e.target.files?.[0] || null)} className="hidden"/></label>
            <button onClick={createPost} disabled={uploading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">{uploading? "Posting..." : "Post"}</button>
          </div>

          {/* FEED - INFINITE SCROLL SIMULATION */}
          {filteredPosts.map(post => (
            <div key={post.id} className="border dark:border-gray-800 rounded-lg mb-4">
              <div className="p-3 flex items-center gap-2 cursor-pointer" onClick={()=>{setPage("profile"); setProfileId(post.userId)}}>
                <img src={post.userPhoto} className="w-10 h-10 rounded-full"/><p className="font-bold">{post.userName}</p>
              </div>
              {post.image && <img src={post.image} className="w-full"/>}
              <div className="p-3">
                <div className="flex gap-4 mb-2">
                  <button onClick={() => likePost(post.id, post.likes)} className="flex items-center gap-1"><Heart fill={post.likes?.includes(user.uid)?"red":"none"} color={post.likes?.includes(user.uid)?"red":"currentColor"}/> {post.likes?.length || 0}</button>
                  <button><MessageCircle /></button>
                </div>
                <p><span className="font-bold">{post.userName}</span> {post.text}</p>
                {/* COMMENTS */}
                <div className="mt-3 space-y-2">
                  {post.comments?.map((c:any,i:number)=>(<p key={i} className="text-sm"><span className="font-bold">{c.user}</span> {c.text}</p>))}
                  <div className="flex gap-2 mt-2">
                    <input value={commentText[post.id] || ""} onChange={e=>setCommentText({...commentText, [post.id]: e.target.value})} placeholder="Add a comment" className="w-full bg-gray-100 dark:bg-gray-900 p-2 rounded text-sm"/>
                    <button onClick={()=>addComment(post.id)}><Send size={18}/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </main>
      ) : (
        /* PROFILE PAGE */
        <main className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-6 mb-6">
            <img src={profileUser?.photo} className="w-24 h-24 rounded-full"/>
            <div>
              <h2 className="text-2xl font-bold">{profileUser?.name}</h2>
              <div className="flex gap-4 my-2">
                <p><span className="font-bold">{profileUser?.followers?.length || 0}</span> Followers</p>
                <p><span className="font-bold">{profileUser?.following?.length || 0}</span> Following</p>
              </div>
              {profileId!== user.uid && (
                <button onClick={()=>toggleFollow(profileId!)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-1">
                  {allUsers.find(u=>u.id===user.uid)?.following?.includes(profileId!)? <UserCheck size={16}/> : <UserPlus size={16}/>}
                  {allUsers.find(u=>u.id===user.uid)?.following?.includes(profileId!)? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>

          {/* UNIQUE GOAL FEATURE */}
          <div className="p-4 border-2 border-dashed border-purple-500 rounded-lg mb-6 bg-purple-500/10">
            <h3 className="font-bold flex items-center gap-2 mb-2"><Target size={18} color="purple"/> Current Goal</h3>
            {profileId === user.uid? (
              <div className="flex gap-2">
                <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="e.g. Build a Startup" className="w-full bg-gray-100 dark:bg-gray-900 p-2 rounded"/>
                <button onClick={updateGoal} className="bg-purple-600 text-white px-4 rounded">Save</button>
              </div>
            ) : (
              <p className="text-lg">{profileUser?.goal || "No goal set yet"}</p>
            )}
          </div>

          {/* POSTS GRID */}
          <h3 className="font-bold mb-3 flex items-center gap-2"><Grid size={18}/> Posts</h3>
          <div className="grid grid-cols-3 gap-1">
            {profilePosts.map(p => p.image && <img key={p.id} src={p.image} className="aspect-square object-cover"/>)}
          </div>
        </main>
      )}
    </div>
  )
       }
