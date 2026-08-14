import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Send, LogIn, Sun, Moon, Image as ImageIcon, LogOut, Target, Users, Flame, Bell, MessageSquare, Search, Plus, Trash2, Edit, Save, X } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, where, getDocs, deleteDoc, setDoc, getDoc } from "firebase/firestore"; // getDoc ADD chesanu
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ===== FIREBASE CONFIG =====
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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// ===== MAIN APP =====
export default function NexoraApp() {
  const [tab, setTab] = useState("feed");
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await setDoc(doc(db, "users", u.uid), {
          uid: u.uid, name: u.displayName, bio: "", photoURL: u.photoURL,
          skills: [], goals: [], streak: 0, createdAt: serverTimestamp()
        }, { merge: true });
      }
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark"? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className={`min-h-screen ${theme === "dark"? "bg-black text-white" : "bg-gray-100 text-black"}`}>
      <Toaster position="bottom-center" />
      <Navbar user={user} theme={theme} toggleTheme={toggleTheme} setTab={setTab} tab={tab} />
      <div className="max-w-4xl mx-auto p-4">
        {tab === "feed" && <FeedTab user={user} theme={theme} />}
        {tab === "discover" && <DiscoverTab user={user} theme={theme} setTab={setTab} />}
        {tab === "messages" && <MessagesTab user={user} theme={theme} />}
        {tab === "profile" && <ProfileTab user={user} theme={theme} />}
      </div>
    </div>
  );
}

// ===== NAVBAR =====
function Navbar({user, theme, toggleTheme, setTab, tab}: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("to", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setNotifications(snap.docs.map(d => ({ id: d.id,...d.data() }))));
  }, [user]);

  const unreadCount = notifications.filter(n =>!n.read).length;
  const handleRead = async (id: string) => await updateDoc(doc(db, "notifications", id), { read: true });

  return (
    <header className={`sticky top-0 z-50 p-4 border-b ${theme === "dark"? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-200"} backdrop-blur-md`}>
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-500">NEXORA</h1>
        <div className="flex gap-2 md:gap-4 items-center">
          {["feed","discover","messages","profile"].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`p-2 rounded ${tab === t? "bg-blue-500" : ""}`}>
              {t === "feed" && <Target size={20}/>}
              {t === "discover" && <Users size={20}/>}
              {t === "messages" && <MessageSquare size={20}/>}
              {t === "profile" && (user?.photoURL? <img src={user.photoURL} className="w-6 h-6 rounded-full" /> : <Users size={20}/>)}
            </button>
          ))}
          <button onClick={toggleTheme}>{theme === "dark"? <Sun size={20} /> : <Moon size={20} />}</button>
          {user && (
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2">
                <Bell />
                {unreadCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-xs rounded-full w-4 h-4">{unreadCount}</span>}
              </button>
              {showNotifs && (
                <div className={`absolute right-0 mt-2 w-72 border rounded-lg shadow-lg ${theme === "dark"? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
                  {notifications.slice(0,5).map(n => (
                    <div key={n.id} onClick={() => handleRead(n.id)} className={`p-2 border-b text-sm ${!n.read? "bg-blue-900/20" : ""}`}>
                      <b>{n.from?.name}</b> {n.type} your {n.postId? "post" : "profile"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {user? <button onClick={() => signOut(auth)}><LogOut size={18} /></button> : <button onClick={() => signInWithPopup(auth, googleProvider)}><LogIn size={18} /></button>}
        </div>
      </div>
    </header>
  );
}

// ===== FEED TAB =====
function FeedTab({user, theme}: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isGoalUpdate, setIsGoalUpdate] = useState(false);
  const [loading, setLoading] = useState(false); // LOADING ADD CHESANU

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setPosts(snap.docs.map((d) => ({ id: d.id,...d.data() }))))
  }, []);

  const handlePost = async () => {
    if (!user) return toast("First Login cheyi boss");
    if (!newPost.trim() &&!image) return toast("Post or Image add cheyi");

    setLoading(true); // LOADING START
    try {
      let imageUrl = "";
      if (image) {
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
        const snap = await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(snap.ref);
      }
      await addDoc(collection(db, "posts"), {
        text: newPost, imageUrl, userId: user.uid, userName: user.displayName,
        userPhoto: user.photoURL, likes: [], type: isGoalUpdate? "goal_update" : "post",
        createdAt: serverTimestamp()
      });
      setNewPost(""); setImage(null); setIsGoalUpdate(false); toast("Posted! 🚀");
    } catch (error) {
      console.log(error);
      toast("Post Failed. Rules check cheyi");
    }
    setLoading(false); // LOADING END
  };

  return (
    <div>
      {user && (
        <div className={`border rounded-xl p-4 mb-6 ${theme === "dark"? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <div className="flex gap-3">
            <img src={user.photoURL || ""} className="w-10 h-10 rounded-full" />
            <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="What's your goal progress?" className="w-full bg-transparent outline-none resize-none" rows={2} />
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-blue-500">
                <ImageIcon size={18} /> <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files![0] || null)} />
              </label>
              <button onClick={() => setIsGoalUpdate(!isGoalUpdate)} className={`flex items-center gap-2 ${isGoalUpdate? "text-green-500" : "opacity-70"}`}><Target size={18} /> Goal</button>
            </div>
            <button onClick={handlePost} disabled={loading} className="bg-blue-500 px-6 py-2 rounded-lg font-semibold disabled:opacity-50">
              {loading? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      )}
      {posts.map((post) => <PostCard key={post.id} post={post} user={user} theme={theme} />)}
    </div>
  );
}

// ===== POSTCARD WITH EDIT + DELETE =====
function PostCard({post, user, theme}: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);

  const isOwner = user?.uid === post.userId;

  useEffect(() => {
    const q = query(collection(db, "comments"), where("postId", "==", post.id), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => setComments(snap.docs.map((d) => ({ id: d.id,...d.data() }))));
  }, [post.id]);

  const handleLike = async () => {
    if (!user) return toast("Login cheyi");
    await updateDoc(doc(db, "posts", post.id), {
      likes: post.likes.includes(user.uid)? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
    if (!post.likes.includes(user.uid)) createNotification(post.userId, "like", user, post.id);
  };

  const handleComment = async () => {
    if (!commentText.trim() ||!user) return;
    await addDoc(collection(db, "comments"), {
      postId: post.id, userId: user.uid, userName: user.displayName, userPhoto: user.photoURL, text: commentText, createdAt: serverTimestamp()
    });
    createNotification(post.userId, "comment", user, post.id);
    setCommentText("");
  };

  const handleDelete = async () => {
    if(!confirm("Delete this post?")) return;
    await deleteDoc(doc(db, "posts", post.id));
    toast("Post Deleted 🗑️");
  };

  const handleEdit = async () => {
    if(!editText.trim()) return;
    await updateDoc(doc(db, "posts", post.id), { text: editText });
    setIsEditing(false);
    toast("Post Updated ✏️");
  };

  return (
    <div className={`border rounded-xl p-4 mb-6 ${theme === "dark"? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={post.userPhoto} className="w-10 h-10 rounded-full" />
          <div><p className="font-semibold">{post.userName}</p>{post.type === "goal_update" && <p className="text-xs text-green-500"><Target size={12}/> Goal Progress</p>}</div>
        </div>
        {isOwner &&!isEditing && (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-gray-800 rounded"><Edit size={16}/></button>
            <button onClick={handleDelete} className="p-2 hover:bg-red-800 rounded"><Trash2 size={16}/></button>
          </div>
        )}
      </div>
      {isEditing? (
        <div className="mb-3">
          <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-gray-800 p-2 rounded mb-2" rows={3} />
          <div className="flex gap-2">
            <button onClick={handleEdit} className="bg-green-500 px-4 py-1 rounded flex items-center gap-1"><Save size={14}/> Save</button>
            <button onClick={() => setIsEditing(false)} className="bg-gray-600 px-4 py-1 rounded flex items-center gap-1"><X size={14}/> Cancel</button>
          </div>
        </div>
      ) : (<p className="mb-3">{post.text}</p>)}
      {post.imageUrl && <img src={post.imageUrl} className="rounded-lg w-full mb-3" />}
      <div className="flex gap-6 border-t border-b py-2">
        <button onClick={handleLike} className="flex items-center gap-2"><Heart fill={post.likes.includes(user?.uid)? "red" : "none"} color={post.likes.includes(user?.uid)? "red" : "currentColor"} />{post.likes.length}</button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2"><MessageCircle /> {comments.length}</button>
      </div>
      {showComments && (
        <div className="mt-3 space-y-2">
          {comments.map((c) => (<div key={c.id} className="flex gap-2"><img src={c.userPhoto} className="w-8 h-8 rounded-full" /><div className={`p-2 rounded-lg ${theme === "dark"? "bg-gray-800" : "bg-gray-100"}`}><p className="font-semibold text-sm">{c.userName}</p><p className="text-sm">{c.text}</p></div></div>))}
          {user && (<div className="flex gap-2 mt-3"><input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-transparent border-b outline-none" /><button onClick={handleComment}><Send size={18} /></button></div>)}
        </div>
      )}
    </div>
  );
    }
