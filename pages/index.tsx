import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Heart, MessageCircle, Share, Bookmark, LogOut, User, Users, Search, Video, Send, Mic, MicOff, Video as VideoIcon, PhoneOff } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// ---------------- FIREBASE DIRECTLY IN THIS FILE ----------------
const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058",
  measurementId: "G-11Y8XF8MBC"
};

const app = getApps().length === 0? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
// ------------------------------------------------------------------

export default function Nexora() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState("feed");
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [chatUser, setChatUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [inVideo, setInVideo] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // AUTH STATE CHECK
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if(u) createUserDoc(u);
    });
  }, []);

  // CREATE USER DOC IF NEW
  const createUserDoc = async (u: any) => {
    // simple user save logic
  }

  // GET POSTS FROM FIREBASE
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setPosts(snap.docs.map(d => ({id: d.id,...d.data()})))
    );
    return () => unsub();
  }, []);

  // GET USERS FROM FIREBASE
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) =>
      setUsers(snap.docs.map(d => ({id: d.id,...d.data()})))
    );
    return () => unsub();
  }, []);

  const googleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
    toast.success("Logged in!");
  }

  const logout = async () => {
    await signOut(auth);
  }

  const createPost = async () => {
    if(!newPost ||!user) return;
    await addDoc(collection(db, "posts"), {
      text: newPost,
      uid: user.uid,
      author: user.displayName,
      photo: user.photoURL,
      likes: [],
      comments: [],
      createdAt: Date.now()
    });
    setNewPost("");
    toast.success("Posted!");
  }

  const likePost = async (postId: string, likes: string[]) => {
    if(!user) return;
    const ref = doc(db, "posts", postId);
    if(likes.includes(user.uid)) {
      await updateDoc(ref, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(ref, { likes: arrayUnion(user.uid) });
    }
  }

  // VIDEO ROOM PAGE
  if(inVideo) return (
    <div className="relative h-screen bg-black text-white">
      <Toaster />
      <div className="grid grid-cols-2 gap-4 p-4 h-[90vh]">
        <div className="bg-gray-800 rounded-lg flex items-center justify-center">Your Video - Coming Soon</div>
        <div className="bg-gray-800 rounded-lg flex items-center justify-center">Friend Video</div>
      </div>
      <div className="absolute bottom-0 w-full bg-gray-900 p-4 flex justify-center gap-4">
        <button onClick={() => setMicOn(!micOn)} className="bg-gray-700 p-3 rounded-full">{micOn? <Mic /> : <MicOff />}</button>
        <button onClick={() => setCamOn(!camOn)} className="bg-gray-700 p-3 rounded-full">{camOn? <VideoIcon /> : <VideoIcon />}</button>
        <button onClick={() => setInVideo(false)} className="bg-red-600 p-3 rounded-full"><PhoneOff /></button>
      </div>
    </div>
  )

  // LOGIN PAGE
  if(!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <Toaster />
      <div className="bg-white p-8 rounded-xl w-96 text-center shadow-2xl">
        <h1 className="text-4xl font-bold mb-2 text-purple-600">Nexora</h1>
        <p className="mb-6 text-gray-600">Connect. Build. Grow.</p>
        <button onClick={googleLogin} className="w-full bg-red-500 text-white px-6 py-3 rounded font-bold">
          Continue with Google
        </button>
      </div>
    </div>
  )

  // MAIN APP
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      {/* HEADER */}
      <header className="bg-white shadow sticky top-0 z-10 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-600">Nexora</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setPage("discover")}><Users/></button>
          <button onClick={() => setPage("rooms")}><Video/></button>
          <button onClick={() => setPage("profile")}><User/></button>
          <img src={user.photoURL} className="w-8 h-8 rounded-full"/>
          <button onClick={logout}><LogOut/></button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">

        {/* FEED PAGE */}
        {page === "feed" && (
          <>
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <div className="flex gap-3">
                <img src={user.photoURL} className="w-10 h-10 rounded-full"/>
                <input value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="What's your goal today?" className="flex-1 border p-2 rounded"/>
              </div>
              <button onClick={createPost} className="bg-purple-600 text-white px-6 py-2 rounded mt-3 float-right">Post</button>
              <div className="clear-both"></div>
            </div>

            {posts.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-lg shadow mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src={p.photo} className="w-10 h-10 rounded-full"/>
                  <div>
                    <b>{p.author}</b>
                    <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <p className="mb-3">{p.text}</p>
                <div className="flex gap-6 border-t pt-3 text-gray-600">
                  <button onClick={() => likePost(p.id, p.likes)} className="flex items-center gap-1 hover:text-red-500">
                    <Heart size={18} fill={p.likes.includes(user.uid)? "red" : "none"}/> {p.likes.length}
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-500"><MessageCircle size={18}/> Comment</button>
                  <button className="flex items-center gap-1 hover:text-green-500"><Share size={18}/> Share</button>
                  <button className="flex items-center gap-1 hover:text-yellow-500"><Bookmark size={18}/> Save</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* DISCOVER PAGE */}
        {page === "discover" && (
          <>
            <h2 className="text-2xl font-bold mb-4">Discover People</h2>
            {users.filter((u:any) => u.uid!== user.uid).map((u:any) => (
              <div key={u.uid} className="bg-white p-4 rounded-lg shadow mb-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={u.photo} className="w-12 h-12 rounded-full"/>
                  <div>
                    <b>{u.name}</b>
                    <p className="text-sm text-gray-600">{u.bio}</p>
                  </div>
                </div>
                <button className="bg-purple-600 text-white px-4 py-1 rounded">Follow</button>
              </div>
            ))}
          </>
        )}

        {/* ROOMS PAGE */}
        {page === "rooms" && (
          <>
            <h2 className="text-2xl font-bold mb-4">🎯 Goal Rooms</h2>
            {["Startup", "Coding", "AI", "Fitness", "English"].map(room => (
              <div key={room} className="bg-white p-4 rounded-lg shadow mb-3 flex justify-between items-center">
                <div>
                  <b className="text-lg">{room} Room</b>
                  <p className="text-sm text-gray-600">Find co-founders & teammates</p>
                </div>
                <button onClick={() => setInVideo(true)} className="bg-green-600 text-white px-6 py-2 rounded font-bold">Join Room</button>
              </div>
            ))}
          </>
        )}

        {/* PROFILE PAGE */}
        {page === "profile" && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex gap-6">
              <img src={user.photoURL} className="w-24 h-24 rounded-full"/>
              <div>
                <h2 className="text-2xl font-bold">{user.displayName}</h2>
                <p className="text-gray-600">{user.email}</p>
                <button className="bg-gray-200 px-4 py-1 rounded mt-2">Edit Profile</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
                            }
