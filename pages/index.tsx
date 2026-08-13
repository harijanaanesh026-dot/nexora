import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, LogIn, Sun, Moon, Image as ImageIcon, LogOut, Bookmark, Bell } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { auth, db, storage, googleProvider } from "../lib/firebaseConfig";
import { signInWithPopup, onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, getDoc, setDoc, arrayUnion, arrayRemove, serverTimestamp, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [theme, setTheme] = useState("dark");
  const [posts, setPosts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [comment, setComment] = useState("");

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
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, { uid: u.uid, name: u.displayName, photoURL: u.photoURL, followers: [], following: [], saved: [], createdAt: serverTimestamp() });
        } else { setUserData(snap.data()); }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({ id: d.id,...d.data() }))));
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("to", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setNotifications(snap.docs.map(d => ({ id: d.id,...d.data() }))));
  }, [user]);

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  const handlePost = async () => {
    if (!newPost.trim() &&!image) return;
    let imageUrl = "";
    if (image) {
      const storageRef = ref(storage, `posts/${user?.uid}/${Date.now()}`);
      imageUrl = await getDownloadURL(await uploadBytes(storageRef, image));
    }
    await addDoc(collection(db, "posts"), { text: newPost, imageUrl, userId: user?.uid, userName: user?.displayName, userPhoto: user?.photoURL, likes: [], comments: [], createdAt: serverTimestamp() });
    setNewPost(""); setImage(null);
  };

  const handleLike = async (postId: string, likes: string[]) => {
    if (!user) return;
    await updateDoc(doc(db, "posts", postId), { likes: likes.includes(user.uid)? arrayRemove(user.uid) : arrayUnion(user.uid) });
  };
  
  const handleComment = async (postId: string) => {
    if (!comment.trim() ||!user) return;
    await updateDoc(doc(db, "posts", postId), { comments: arrayUnion({ user: user.displayName, text: comment, createdAt: new Date() }) });
    setComment("");
  };

  const handleSave = async (postId: string) => {
    if (!user) return;
    const isSaved = userData?.saved?.includes(postId);
    await updateDoc(doc(db, "users", user.uid), { saved: isSaved? arrayRemove(postId) : arrayUnion(postId) });
    toast(isSaved? "Removed from Saved" : "Saved!");
  };

  const handleFollow = async (targetUid: string) => {
    if (!user) return;
    const isFollowing = userData?.following?.includes(targetUid);
    await updateDoc(doc(db, "users", user.uid), { following: isFollowing? arrayRemove(targetUid) : arrayUnion(targetUid) });
    await updateDoc(doc(db, "users", targetUid), { followers: isFollowing? arrayRemove(user.uid) : arrayUnion(user.uid) });
    if (!isFollowing) await addDoc(collection(db, "notifications"), { to: targetUid, from: user.uid, type: "follow", read: false, createdAt: serverTimestamp() });
  };

  return (
    <div className={`min-h-screen ${theme === "dark"? "bg-black text-white" : "bg-gray-100"}`}>
      <Toaster />
      <header className="sticky top-0 p-4 border-b flex justify-between">
        <h1 className="text-2xl font-bold text-blue-500">NEXORA</h1>
        <div className="flex gap-4">
          <Bell />
          <button onClick={toggleTheme}><Sun /></button>
          {user? <button onClick={handleLogout}><LogOut /></button> : <button onClick={handleLogin}><LogIn /></button>}
        </div>
      </header>
      <div className="max-w-2xl mx-auto p-4">
        {user && <div className="p-4 border rounded-xl mb-6">
          <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="What's on your mind?" className="w-full bg-transparent"/>
          <input type="file" onChange={e => setImage(e.target.files?.[0] || null)} />
          <button onClick={handlePost} className="mt-2 px-4 py-2 bg-blue-500 rounded-lg">Post</button>
        </div>}
        {posts.map(post => (
          <div key={post.id} className="p-4 border rounded-xl mb-4">
            <div className="flex justify-between">
              <div className="flex gap-2"><img src={post.userPhoto} className="w-10 h-10 rounded-full"/><p>{post.userName}</p></div>
              {user && post.userId!== user.uid && <button onClick={() => handleFollow(post.userId)}>{userData?.following?.includes(post.userId)? "Following" : "Follow"}</button>}
            </div>
            <p>{post.text}</p>
            {post.imageUrl && <img src={post.imageUrl} className="rounded-lg mt-2"/>}
            <div className="flex gap-4 mt-3">
              <button onClick={() => handleLike(post.id, post.likes)}><Heart fill={post.likes?.includes(user?.uid)? "red" : "none"} /> {post.likes?.length}</button>
              <button><MessageCircle /></button>
              <button onClick={() => handleSave(post.id)}><Bookmark fill={userData?.saved?.includes(post.id)? "yellow" : "none"} /></button>
            </div>
            <div className="mt-2">
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add comment" />
              <button onClick={() => handleComment(post.id)}><Send /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
        }
