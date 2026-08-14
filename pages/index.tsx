import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, LogIn, Sun, Moon, Image as ImageIcon, LogOut } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { auth, db, storage, googleProvider } from "../lib/firebaseConfig";
import { signInWithPopup, onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState("dark");
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);
  const toggleTheme = () => {
    const newTheme = theme === "dark"? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setPosts(snap.docs.map((d) => ({ id: d.id,...d.data() }))))
  }, []);

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  const handlePost = async () => {
    if (!newPost.trim() &&!image) return toast("Post or Image add cheyi");
    setLoading(true);
    let imageUrl = "";
    if (image) {
      const storageRef = ref(storage, `posts/${user?.uid}/${Date.now()}`);
      const snap = await uploadBytes(storageRef, image);
      imageUrl = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, "posts"), {
      text: newPost, imageUrl, userId: user?.uid, userName: user?.displayName,
      userPhoto: user?.photoURL, likes: [], comments: [], createdAt: serverTimestamp()
    });
    setNewPost(""); setImage(null); setLoading(false); toast("Posted! 🚀");
  };

  const handleLike = async (postId: string, likes: string[]) => {
    if (!user) return toast("Login cheyi");
    await updateDoc(doc(db, "posts", postId), { 
      likes: likes.includes(user.uid)? arrayRemove(user.uid) : arrayUnion(user.uid) 
    });
  };

  const handleComment = async (postId: string) => {
    if (!comment.trim() ||!user) return;
    await updateDoc(doc(db, "posts", postId), { 
      comments: arrayUnion({ user: user.displayName, text: comment, time: new Date().toLocaleTimeString() }) 
    });
    setComment("");
  };

  return (
    <div className={`min-h-screen ${theme === "dark"? "bg-black text-white" : "bg-gray-100 text-black"}`}>
      <Toaster position="bottom-center" />
      <header className={`sticky top-0 z-50 p-4 border-b ${theme === "dark"? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-200"} backdrop-blur-md`}>
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-500">NEXORA</h1>
          <div className="flex gap-4 items-center">
            <button onClick={toggleTheme}>{theme === "dark"? <Sun size={20} /> : <Moon size={20} />}</button>
            {user? (
              <div className="flex items-center gap-2">
                <img src={user.photoURL || ""} className="w-8 h-8 rounded-full" />
                <button onClick={handleLogout}><LogOut size={18} /></button>
              </div>
            ) : (
              <button onClick={handleLogin} className="flex items-center gap-2 bg-blue-500 px-4 py-2 rounded-lg"><LogIn size={18} /> Login</button>
            )}
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto p-4">
        {user && (
          <div className={`border rounded-xl p-4 mb-6 ${theme === "dark"? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <div className="flex gap-3">
              <img src={user.photoURL || ""} className="w-10 h-10 rounded-full" />
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="What's on your mind?" className="w-full bg-transparent outline-none resize-none" rows={2} />
            </div>
            <div className="flex justify-between items-center mt-4">
              <label className="flex items-center gap-2 cursor-pointer text-blue-500">
                <ImageIcon size={20} /> Image
                <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files![0] || null)} />
              </label>
              <button onClick={handlePost} disabled={loading} className="bg-blue-500 px-6 py-2 rounded-lg font-semibold disabled:opacity-50">
                {loading? "Posting..." : "Post"}
              </button>
            </div>
            {image && <p className="text-sm mt-2 text-green-500">1 Image Selected ✓</p>}
          </div>
        )}
        {posts.map((post) => (
          <div key={post.id} className={`border rounded-xl p-4 mb-6 ${theme === "dark"? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-3 mb-3">
              <img src={post.userPhoto} className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-semibold">{post.userName}</p>
                <p className="text-xs opacity-70">{post.createdAt?.toDate().toLocaleString() || "Just now"}</p>
              </div>
            </div>
            <p className="mb-3">{post.text}</p>
            {post.imageUrl && <img src={post.imageUrl} className="rounded-lg w-full mb-3" />}
            <div className="flex gap-6 border-t border-b py-2 mb-3">
              <button onClick={() => handleLike(post.id, post.likes)} className="flex items-center gap-2">
                <Heart fill={post.likes.includes(user?.uid)? "red" : "none"} color={post.likes.includes(user?.uid)? "red" : "currentColor"} />
                {post.likes.length}
              </button>
              <button className="flex items-center gap-2"><MessageCircle /> {post.comments.length}</button>
            </div>
            <div className="space-y-2">
              {post.comments.map((c: any, i: number) => (
                <div key={i} className="text-sm"><b>{c.user}</b>: {c.text}</div>
              ))}
            </div>
            {user && (
              <div className="flex gap-2 mt-3">
                <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-transparent border-b outline-none" />
                <button onClick={() => handleComment(post.id)}><Send size={18} /></button>
              </div>
            )}
          </div>
        ))}
        {!user && <p className="text-center mt-10">Login to see posts and post something 🔥</p>}
      </div>
    </div>
  );
                }
