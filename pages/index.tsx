"use client";
import React, { useState, useEffect, useMemo } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut,
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, getDocs, query, where, orderBy,
  onSnapshot, doc, updateDoc, increment, serverTimestamp, getDoc
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Target, Users, Bell, MessageSquare, Search, Image as ImageIcon,
  Heart, MessageCircle, Bookmark, Plus, X, Edit, Save, Link, Github,
  Award, Flame, TrendingUp, LogOut
} from "lucide-react";
import { Toaster, toast } from "sonner";

// NEE REAL FIREBASE CONFIG
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
const storage = getStorage(app);

function Navbar({user, setTab, tab, searchQuery, setSearchQuery}: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("to", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setNotifications(snap.docs.map(d => ({ id: d.id,...d.data() }))))
  }, [user]);

  const unreadCount = notifications.filter(n =>!n.read).length;
  const handleRead = async (id: string) => await updateDoc(doc(db, "notifications", id), { read: true });

  return (
    <>
      <header className="sticky top-0 z-50 p-4 border-b bg-black/80 border-gray-800 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 onClick={() => setTab("feed")} className="text-2xl font-bold text-blue-500 cursor-pointer">NEXORA</h1>
          <div className="flex gap-3 items-center">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search skills..." className="hidden md:block w-40 bg-gray-800 px-3 py-2 rounded-lg text-sm" />
            {user && (
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2">
                  <Bell size={22} />
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 border rounded-lg shadow-lg bg-gray-900 border-gray-800 max-h-96 overflow-y-auto">
                    <p className="p-3 font-bold border-b border-gray-800">Notifications</p>
                    {notifications.length === 0 && <p className="p-3 text-sm opacity-70">No notifications</p>}
                    {notifications.map(n => (
                      <div key={n.id} onClick={() => handleRead(n.id)} className={`p-3 border-b text-sm cursor-pointer hover:bg-gray-800 ${!n.read? "bg-blue-900/20" : ""}`}>
                        <b>{n.from?.name}</b> {n.type} your {n.postId? "post" : "profile"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-black border-gray-800">
        <div className="max-w-4xl mx-auto flex justify-around items-center h-16">
          <button onClick={() => setTab("feed")} className={`${tab === "feed"? "text-white" : "text-gray-500"}`}><Target size={26} /></button>
          <button onClick={() => setTab("discover")} className={`${tab === "discover"? "text-white" : "text-gray-500"}`}><Users size={26} /></button>
          <button onClick={() => setShowPostModal(true)} className="bg-blue-500 p-2 rounded-lg hover:bg-blue-600"><Plus size={28} /></button>
          <button onClick={() => setTab("messages")} className={`${tab === "messages"? "text-white" : "text-gray-500"}`}><MessageSquare size={26} /></button>
          <button onClick={() => setTab("profile")} className="relative">
            {user?.photoURL? <img src={user.photoURL} className={`w-7 h-7 rounded-full border-2 ${tab === "profile"? "border-white" : "border-transparent"}`} /> : <Users size={26} className="text-gray-500" />}
          </button>
        </div>
      </nav>
      {showPostModal && <PostModal user={user} onClose={() => setShowPostModal(false)} />}
    </>
  );
}

function PostModal({user, onClose}: any) {
  const [text, setText] = useState(""); const [image, setImage] = useState<File | null>(null); const [loading, setLoading] = useState(false);
  const handlePost = async () => {
    if (!user) return toast("Login cheyi"); if (!text.trim() &&!image) return toast("Post or Image add cheyi"); setLoading(true);
    try {
      let imageUrl = ""; if (image) { const storageRef = ref(storage, `posts/images/${user.uid}/${Date.now()}-${image.name}`); const snap = await uploadBytes(storageRef, image); imageUrl = await getDownloadURL(snap.ref); }
      await addDoc(collection(db, "posts"), { text, imageUrl, userId: user.uid, userName: user.displayName, userPhoto: user.photoURL, likes: [], type: "post", hashtags: text.match(/#\w+/g) || [], createdAt: serverTimestamp() });
      await updateDoc(doc(db, "users", user.uid), { growthScore: increment(5) }); toast("Posted! +5 Growth 🚀"); onClose();
    } catch (error: any) { toast("Post Failed: " + error.message); } setLoading(false);
  };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Create Post</h2><button onClick={onClose}><X /></button></div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your goal progress... #AI #Startup" className="w-full bg-gray-800 p-3 rounded mb-3" rows={4} />
        {image && <img src={URL.createObjectURL(image)} className="rounded-lg max-h-60 w-full object-cover mb-3" />}
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 cursor-pointer text-blue-500"><ImageIcon /> Image<input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files![0] || null)} /></label>
          <button onClick={handlePost} disabled={loading} className="bg-blue-500 px-6 py-2 rounded-lg font-semibold">{loading? "Posting..." : "Post"}</button>
        </div>
      </div>
    </div>
  );
        }

function FeedTab({user, searchQuery}: any) {
  const [posts, setPosts] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => { setPosts(snapshot.docs.map(d => ({ id: d.id,...d.data() }))); setLoading(false); });
    return () => unsub();
  }, []);
  const filteredPosts = useMemo(() => posts.filter(p => p.text?.toLowerCase().includes(searchQuery.toLowerCase())), [posts, searchQuery]);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["Your story",...Array(5).fill(0).map((_,i) => `User ${i+1}`)].map(name => (
          <div key={name} className="text-center flex-shrink-0"><div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-pink-500"><div className="w-full h-full rounded-full bg-gray-800 p-0.5"><img src={`https://i.pravatar.cc/150?u=${name}`} className="w-full h-full rounded-full" /></div></div><p className="text-xs mt-1">{name.split(" ")[0]}</p></div>
        ))}
      </div>
      {loading? <p>Loading...</p> : filteredPosts.map(post => <PostCard key={post.id} post={post} user={user} />)}
    </div>
  );
}

function PostCard({post, user}: any) {
  const [liked, setLiked] = useState(post.likes?.includes(user?.uid));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const handleLike = async () => {
    if(!user) return; const newLiked =!liked; setLiked(newLiked); setLikesCount(likesCount + (newLiked? 1 : -1));
    await updateDoc(doc(db, "posts", post.id), { likes: newLiked? [...post.likes, user.uid] : post.likes.filter((id:string) => id!== user.uid) });
    if(newLiked && post.userId!== user.uid) await addDoc(collection(db, "notifications"), { to: post.userId, from: {name: user.displayName}, type: "liked", postId: post.id, read: false, createdAt: serverTimestamp() });
  };
  return (
    <div className="border rounded-xl bg-gray-900 border-gray-800">
      <div className="flex items-center gap-3 p-3"><img src={post.userPhoto} className="w-8 h-8 rounded-full" /><div><p className="font-semibold">{post.userName}</p></div></div>
      {post.imageUrl && <img src={post.imageUrl} className="w-full max-h-[500px] object-cover" />}
      <div className="p-3 space-y-2">
        <div className="flex justify-between"><div className="flex gap-4"><button onClick={handleLike}><Heart size={24} fill={liked? "red" : "none"} color={liked? "red" : "currentColor"} /></button><button onClick={() => setShowComments(!showComments)}><MessageCircle size={24} /></button></div><Bookmark size={24} /></div>
        <p className="font-semibold">{likesCount} likes</p><p><b>{post.userName}</b> {post.text}</p>
        {showComments && <p className="text-sm opacity-70">Comments feature coming soon</p>}
      </div>
    </div>
  );
}

function DiscoverTab({user}: any) {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { getDocs(collection(db, "users")).then(snap => setUsers(snap.docs.map(d => ({id: d.id,...d.data()})))) },[]);
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Trending Skills</h1>
      <div className="flex gap-2 flex-wrap mb-6">{["#AI", "#NextJS", "#Startup", "#BuildInPublic"].map(tag => <span key={tag} className="bg-gray-800 px-3 py-1 rounded-full">{tag}</span>)}</div>
      <h1 className="text-xl font-bold mb-4">Suggested People</h1>
      <div className="space-y-3">{users.filter(u => u.id!== user?.uid).slice(0,5).map(u => <UserCard key={u.id} user={u} currentUser={user} />)}</div>
    </div>
  );
}

function UserCard({user, currentUser}: any) {
  const [following, setFollowing] = useState(false);
  const handleFollow = async () => {
    setFollowing(!following); await addDoc(collection(db, "follows"), { followerId: currentUser.uid, followingId: user.id });
    await addDoc(collection(db, "notifications"), { to: user.id, from: {name: currentUser.displayName}, type: "followed", read: false, createdAt: serverTimestamp() });
  };
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-900 border-gray-800">
      <div className="flex items-center gap-3"><img src={user.photoURL} className="w-10 h-10 rounded-full" /><div><p className="font-semibold">{user.name}</p><p className="text-sm opacity-70">{user.growthScore} Growth Score</p></div></div>
      <button onClick={handleFollow} className={`px-4 py-1 rounded-full text-sm font-semibold ${following? "bg-gray-700" : "bg-blue-500"}`}>{following? "Following" : "Follow"}</button>
    </div>
  );
                                                                                             }

function MessagesTab({user}: any) {
  const [convos, setConvos] = useState<any[]>([]);
  useEffect(() => {
    if(!user) return; const q = query(collection(db, "messages"), where("participants", "array-contains", user.uid), orderBy("lastMessageAt", "desc"));
    return onSnapshot(q, (snap) => setConvos(snap.docs.map(d => ({id: d.id,...d.data()}))));
  }, [user]);
  return (
    <div className="border rounded-xl bg-gray-900 border-gray-800 h-[70vh]">
      <h1 className="p-4 text-xl font-bold border-b border-gray-800">Messages</h1>
      <div>{convos.length === 0 && <p className="p-4 opacity-70">No messages yet</p>}</div>
    </div>
  );
}

export default function NexoraApp() {
  const [user, setUser] = useState<any>(null); const [tab, setTab] = useState("feed"); const [searchQuery, setSearchQuery] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }); return () => unsub(); }, []);
  const handleLogin = async () => { const provider = new GoogleAuthProvider(); await signInWithPopup(auth, provider); };
  if(loading) return <div className="flex h-screen items-center justify-center">Loading NEXORA...</div>;
  return (
    <div className="min-h-screen bg-black text-white font-sans flex-col">
      <Toaster position="top-center" />
      <Navbar user={user} setTab={setTab} tab={tab} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="max-w-4xl mx-auto p-4 flex-1 w-full pb-20">
        {!user? (
          <div className="text-center mt-20"><h1 className="text-4xl font-bold text-blue-500">NEXORA</h1><p className="opacity-70 mt-2 mb-6">Share Goals. Build Skills. Grow Together.</p><button onClick={handleLogin} className="bg-blue-500 px-6 py-3 rounded-lg font-semibold">Login with Google</button></div>
        ) : (
          <>
            {tab === "feed" && <FeedTab user={user} searchQuery={searchQuery} />}
            {tab === "discover" && <DiscoverTab user={user} />}
            {tab === "messages" && <MessagesTab user={user} />}
            {tab === "profile" && <ProfileTab user={user} />}
          </>
        )}
      </div>
    </div>
  );
}

function ProfileTab({user}: any) {
  const [profile, setProfile] = useState<any>(null); const [isEditing, setIsEditing] = useState(false); const [name, setName] = useState(""); const [bio, setBio] = useState(""); const [skills, setSkills] = useState(""); const [futureGoal, setFutureGoal] = useState(""); const [projects, setProjects] = useState<any[]>([]); const [newProject, setNewProject] = useState({title: "", link: "", id: 0}); const [followers, setFollowers] = useState(0); const [following, setFollowing] = useState(0); const [myPosts, setMyPosts] = useState<any[]>([]); const [loading, setLoading] = useState(false); const [activeTab, setActiveTab] = useState("about");
  const fetchProfile = async () => {
    if(!user) return; setLoading(true); const userDoc = await getDoc(doc(db, "users", user.uid));
    if(userDoc.exists()){ const data = userDoc.data(); setProfile(data); setName(data.name || ""); setBio(data.bio || ""); setSkills(data.skills?.join(", ") || ""); setFutureGoal(data.futureGoal || ""); setProjects(data.projects || []); }
    const followersSnap = await getDocs(query(collection(db, "follows"), where("followingId", "==", user.uid))); setFollowers(followersSnap.size);
    const followingSnap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid))); setFollowing(followingSnap.size);
    const postsSnap = await getDocs(query(collection(db, "posts"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))); setMyPosts(postsSnap.docs.map(d => ({ id: d.id,...d.data() })));
    setLoading(false);
  }
  useEffect(() => { fetchProfile() },[user]);
  const handleSave = async () => {
    setLoading(true); await updateDoc(doc(db, "users", user.uid), { name, bio, futureGoal, skills: skills.split(",").map(s => s.trim()).filter(s => s!== ""), projects });
    setIsEditing(false); toast("Profile Updated! ✅"); await fetchProfile();
  };
  const handleAddProject = () => { if(!newProject.title) return; setProjects([...projects, {...newProject, id: Date.now()}]); setNewProject({title: "", link: "", id: 0}); };
  const handleRemoveProject = (id: number) => { setProjects(projects.filter(p => p.id!== id)); };
  const handleLogout = async () => { if(!confirm("Logout?")) return; await signOut(auth); toast("Logged out 👋"); };
  if(loading) return <p className="text-center">Loading...</p>; if(!profile) return <p className="text-center opacity-70">Profile not found</p>;
  return (
    <div className="space-y-6">
      <div className="border rounded-xl p-6 bg-gray-900 border-gray-800">
        <div className="flex justify-between items-start"><div><img src={profile.photoURL} className="w-24 h-24 rounded-full" /><h1 className="text-2xl font-bold mt-2">{profile.name}</h1><p className="opacity-70">@{profile.username}</p></div>{!isEditing? <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-gray-800 rounded"><Edit /></button> : <button onClick={handleSave} disabled={loading} className="p-2 bg-green-500 hover:bg-green-600 rounded"><Save /></button>}</div>
        <div className="flex gap-4 my-4"><div><b>{followers}</b> Followers</div><div><b>{following}</b> Following</div><div className="flex items-center gap-1 text-yellow-500"><Award size={16} /><b>{profile.growthScore || 0} Growth Score</b></div></div>
        <div className="flex gap-2 border-b border-gray-800 mb-4"><button onClick={() => setActiveTab("about")} className={`px-4 py-2 ${activeTab === "about"? "border-b-2 border-blue-500" : ""}`}>About</button><button onClick={() => setActiveTab("posts")} className={`px-4 py-2 ${activeTab === "posts"? "border-b-2 border-blue-500" : ""}`}>My Posts</button></div>
        {activeTab === "about" && (<>
          {isEditing? (<div className="space-y-3 mt-4"><input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 p-2 rounded" placeholder="Name" /><input value={futureGoal} onChange={e => setFutureGoal(e.target.value)} className="w-full bg-gray-800 p-2 rounded" placeholder="Future Goal: AI Founder" /><textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-gray-800 p-2 rounded" placeholder="Bio" rows={3} /><input value={skills} onChange={e => setSkills(e.target.value)} className="w-full bg-gray-800 p-2 rounded" placeholder="Skills: Coding, Design, AI" /></div>) : (<>{profile.futureGoal && <p className="text-blue-500 font-semibold">Future Goal: {profile.futureGoal}</p>}{profile.bio && <p className="opacity-70 mt-2">{profile.bio}</p>}<div className="flex gap-2 flex-wrap mt-2">{profile.skills?.map((s:string) => s && <span key={s} className="text-sm bg-blue-500/20 px-3 py-1 rounded-full">{s}</span>)}</div></>)}
          <div className="border-t border-gray-800 pt-4 mt-4"><h3 className="font-bold mb-3 flex items-center gap-2"><Link /> Project Showcase</h3>{isEditing && (<div className="flex gap-2 mb-3"><input value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="Project Name" className="flex-1 bg-gray-800 p-2 rounded" /><input value={newProject.link} onChange={e => setNewProject({...newProject, link: e.target.value})} placeholder="https://github.com/..." className="flex-1 bg-gray-800 p-2 rounded" /><button onClick={handleAddProject} className="bg-blue-500 p-2 rounded"><Plus /></button></div>)}{projects.map(p => (<div key={p.id} className="flex justify-between items-center bg-gray-800 p-2 rounded mb-2"><a href={p.link} target="_blank" className="flex items-center gap-2 hover:underline"><Github size={14} /> {p.title}</a>{isEditing && <button onClick={() => handleRemoveProject(p.id)}><X size={14} /></button></div>))}</div>
          <div className="border-t border-gray-800 pt-4 mt-4"><h3 className="font-bold mb-3 flex items-center gap-2"><Target /> My Goals</h3><div className="flex items-center gap-2 text-orange-500"><Flame /> <span>{profile.streak || 0} Day Streak</span></div></div>
        </>)}
        {activeTab === "posts" && (<div className="space-y-4">{myPosts.length === 0 && <p className="opacity-70">No posts yet</p>}{myPosts.map(post => <PostCard key={post.id} post={post} user={user} />)}</div>)}
      </div>
      <div className="border rounded-xl p-6 bg-gray-900 border-gray-800">
        <div className="text-center mb-4"><h2 className="text-xl font-bold text-blue-500 mb-2">NEXORA</h2><p className="text-sm opacity-70 mb-3">Share Goals. Build Skills. Grow Together.</p><p className="text-xs opacity-50">© 2026 NEXORA. Built by <span className="font-bold text-blue-500">Anesh Production</span> 🇮🇳</p></div>
        <div className="border-t border-gray-800 pt-4"><button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 w-full px-6 py-3 rounded-lg font-semibold"><LogOut size={18} /> Logout</button></div>
      </div>
    </div>
  );
        }
