import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, doc, getDoc, setDoc, updateDoc, where, getDocs, serverTimestamp, increment, deleteDoc, limit, arrayUnion } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Home, Search, Bell, User, Plus, Flame, Star, Award, Edit, Save, MessageCircle, Heart, Share2, BookOpen, Rocket, Users, LogOut } from "lucide-react";
import { toast, Toaster } from "sonner";

// ===== FIREBASE CONFIG =====
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// ===== HELPERS =====
export const updateStreak = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if(!userSnap.exists()) return;
  const data = userSnap.data() as any;
  const today = new Date().toDateString();
  const lastActive = data.lastActive?.toDate().toDateString();
  if(lastActive!== today) {
    const newStreak = lastActive === new Date(Date.now() - 86400000).toDateString()? (data.streak || 0) + 1 : 1;
    await updateDoc(userRef, { streak: newStreak, lastActive: serverTimestamp(), growthScore: increment(3) });
    checkAchievements(uid, {...data, streak: newStreak});
  }
}
export const checkAchievements = async (uid: string, data: any) => {
  let newBadges = data.achievements || [];
  if(!newBadges.includes("First Post") && data.postsCount > 0) newBadges.push("First Post");
  if(!newBadges.includes("100 Followers") && data.followersCount >= 100) newBadges.push("100 Followers");
  if(!newBadges.includes("7-Day Streak") && data.streak >= 7) newBadges.push("7-Day Streak");
  if(!newBadges.includes("Top Contributor") && data.growthScore >= 500) newBadges.push("Top Contributor");
  if(newBadges.length > (data.achievements || []).length) {
    await updateDoc(doc(db, "users", uid), { achievements: newBadges });
    toast(`🏆 New Badge: ${newBadges[newBadges.length-1]}`);
  }
}

// ===== MAIN APP =====
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState("feed");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if(currentUser) {
        updateStreak(currentUser.uid);
        const q = query(collection(db, "notifications"), where("toUserId", "==", currentUser.uid), orderBy("createdAt", "desc"), limit(20));
        onSnapshot(q, (snap) => { setNotifications(snap.docs.map(d => ({ id: d.id,...d.data() as any }))) });
      }
    });
    return () => unsubAuth();
  }, []);

  const handleLogin = async () => { await signInWithPopup(auth, new GoogleAuthProvider()) };
  const handleLogout = async () => { await signOut(auth); setUser(null) };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <Toaster position="top-right" />
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-500">NEXORA</h1>
          <div className="relative">
            {user && <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-gray-800 rounded-full"><Bell /></button>}
            {user && notifications.filter(n =>!n.read).length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">{notifications.filter(n =>!n.read).length}</span>}
          </div>
        </div>
      </header>

      {/* BOTTOM NAV - 4 ICONS ONLY: Feed, Search, Messages, Profile */}
      {user && <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 flex justify-around">
          <button onClick={() => setTab("feed")} className={`py-3 ${tab === "feed"? "text-blue-500" : "text-gray-400"}`}><Home size={24} /></button>
          <button onClick={() => setTab("search")} className={`py-3 ${tab === "search"? "text-blue-500" : "text-gray-400"}`}><Search size={24} /></button>
          <button onClick={() => setTab("messages")} className={`py-3 ${tab === "messages"? "text-blue-500" : "text-gray-400"}`}><MessageCircle size={24} /></button>
          <button onClick={() => setTab("profile")} className={`py-3 ${tab === "profile"? "text-blue-500" : "text-gray-400"}`}><User size={24} /></button>
        </div>
      </nav>}

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!user && <div className="text-center py-20"><h2 className="text-4xl font-bold">Welcome to NEXORA</h2><p className="opacity-70 mt-2">Build. Learn. Grow Together.</p><button onClick={handleLogin} className="mt-6 bg-blue-500 px-6 py-3 rounded-lg">Login with Google</button></div>}
        {user && tab === "feed" && <FeedTab user={user} />}
        {user && tab === "search" && <SearchTab user={user} />} {/* Discover -> Search ga marcham */}
        {user && tab === "messages" && <MessagesTab user={user} />}
        {user && tab === "profile" && <ProfileTab user={user} onLogout={handleLogout} />}
      </main>
    </div>
  );
}

// ===== FEED TAB =====
function FeedTab({user}: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [feedType, setFeedType] = useState<"growth" | "personalized" | "latest" | "trending">("growth");
  const [following, setFollowing] = useState<string[]>([]);
  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);

  useEffect(() => {
    const q = query(collection(db, "follows"), where("followerId", "==", user.uid));
    return onSnapshot(q, (snap) => setFollowing(snap.docs.map(d => d.data().followingId)));
  }, [user]);

  useEffect(() => {
    let q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snap) => {
      let allPosts: any[] = snap.docs.map((d) => ({ id: d.id,...d.data() as any }));
      if(feedType === "personalized" && following.length > 0) allPosts = allPosts.filter(p => [...following, user?.uid].includes(p.userId));
      if(feedType === "trending") allPosts = allPosts.sort((a, b) => (b.likes?.length || 0) + (b.shares || 0)*2 - (a.likes?.length || 0) - (a.shares || 0)*2).slice(0, 20);
      if(feedType === "growth") allPosts = allPosts.filter(p => p.text?.includes("#Learning") || p.text?.includes("#Startup") || p.text?.includes("#Skills") || p.text?.includes("#Achievement"));
      setPosts(allPosts);
    })
  }, [following, user, feedType]);

  const handleCreatePost = async () => {
    if(!newPost.trim() &&!postImage) return;
    let imageUrl = "";
    if(postImage) {
      const storageRef = ref(storage, `posts/${Date.now()}-${postImage.name}`);
      const snap = await uploadBytes(storageRef, postImage);
      imageUrl = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, "posts"), { userId: user.uid, userName: user.displayName, userPhoto: user.photoURL, text: newPost, image: imageUrl, likes: [], comments: [], shares: 0, createdAt: serverTimestamp() });
    await updateDoc(doc(db, "users", user.uid), { postsCount: increment(1), growthScore: increment(10) });
    setNewPost(""); setPostImage(null); toast("Posted!");
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 bg-gray-900 p-1 rounded-lg overflow-x-auto">
        <button onClick={() => setFeedType("growth")} className={`px-4 py-2 rounded ${feedType === "growth"? "bg-green-500 font-bold" : "opacity-70"}`}>📈 Growth</button>
        <button onClick={() => setFeedType("personalized")} className={`px-4 py-2 rounded ${feedType === "personalized"? "bg-blue-500 font-bold" : "opacity-70"}`}>Personalized</button>
        <button onClick={() => setFeedType("latest")} className={`px-4 py-2 rounded ${feedType === "latest"? "bg-blue-500 font-bold" : "opacity-70"}`}>Latest</button>
        <button onClick={() => setFeedType("trending")} className={`px-4 py-2 rounded ${feedType === "trending"? "bg-blue-500 font-bold" : "opacity-70"}`}>Trending 🔥</button>
      </div>
      <div className="border rounded-xl p-4 mb-6 bg-gray-900 border-gray-800">
        <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share your #Learning #Achievement..." className="w-full bg-gray-800 p-3 rounded-lg outline-none" rows={3} />
        <div className="flex justify-between mt-3">
          <input type="file" onChange={e => setPostImage(e.target.files?.[0] || null)} accept="image/*" />
          <button onClick={handleCreatePost} className="bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2"><Plus /> Post</button>
        </div>
      </div>
      {posts.map(post => <PostCard key={post.id} post={post} user={user} />)}
    </div>
  );
}
function PostCard({post, user}: any) {
  const [likes, setLikes] = useState(post.likes || []);
  const [commentText, setCommentText] = useState("");
  const handleLike = async () => {
    const isLiked = likes.includes(user.uid);
    const newLikes = isLiked? likes.filter((id: string) => id!== user.uid) : [...likes, user.uid];
    setLikes(newLikes);
    await updateDoc(doc(db, "posts", post.id), { likes: newLikes });
  };
  const handleComment = async () => {
    if(!commentText.trim()) return;
    const newComment = { userId: user.uid, userName: user.displayName, text: commentText, createdAt: new Date() };
    await updateDoc(doc(db, "posts", post.id), { comments: arrayUnion(newComment) });
    setCommentText("");
  };
  return (
    <div className="border rounded-xl p-4 mb-4 bg-gray-900 border-gray-800">
      <div className="flex items-center gap-3"><img src={post.userPhoto} className="w-10 h-10 rounded-full" /><p className="font-bold">{post.userName}</p></div>
      <p className="mt-3 whitespace-pre-wrap">{post.text}</p>
      {post.image && <img src={post.image} className="mt-3 rounded-lg w-full" />}
      <div className="flex gap-4 mt-3 border-t border-gray-800 pt-3">
        <button onClick={handleLike} className="flex items-center gap-1"><Heart className={likes.includes(user.uid)? "fill-red-500 text-red-500" : ""} /> {likes.length}</button>
        <button className="flex items-center gap-1"><Share2 /> {post.shares || 0}</button>
      </div>
      <div className="mt-3 space-y-2">
        {post.comments?.map((c: any, i: number) => <div key={i} className="bg-gray-800 p-2 rounded"><b>{c.userName}:</b> {c.text}</div>)}
        <div className="flex gap-2">
          <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add comment..." className="flex-1 bg-gray-800 p-2 rounded" />
          <button onClick={handleComment} className="bg-blue-500 px-3 rounded">Send</button>
        </div>
      </div>
    </div>
  )
}

// ===== SEARCH TAB - FRIENDS PROFILE KOSAM =====
function SearchTab({user}: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      let allUsers = snapshot.docs.map((doc) => ({ id: doc.id,...doc.data() as any })).filter(u => u.uid!== user?.uid);
      if(search) allUsers = allUsers.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.skills?.join(" ").toLowerCase().includes(search.toLowerCase()) || u.goal?.toLowerCase().includes(search.toLowerCase()));
      setUsers(allUsers);
    };
    fetchUsers();
  }, [user, search]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🔍 Search Friends</h1>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Name, Skill, Goal..." className="w-full bg-gray-900 p-3 rounded-lg mb-4 border border-gray-800" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{users.map((u) => <UserCard key={u.id} u={u} user={user} />)}</div>
    </div>
  );
}
function UserCard({u, user}: any) {
  const [isFollowing, setIsFollowing] = useState(false); const [myProfile, setMyProfile] = useState<any>(null);
  useEffect(() => { getDoc(doc(db, "users", user.uid)).then(d => setMyProfile(d.data())); const q = query(collection(db, "follows"), where("followerId", "==", user.uid), where("followingId", "==", u.uid)); onSnapshot(q, snap => setIsFollowing(!snap.empty)) }, [user, u.uid]);
  const isGoalMatch = myProfile?.goal && u.goal && myProfile.goal === u.goal;
  const toggleFollow = async () => { const followRef = doc(db, "follows", `${user.uid}_${u.uid}`); if(isFollowing) {await deleteDoc(followRef)} else {await setDoc(followRef, { followerId: user.uid, followingId: u.uid, createdAt: serverTimestamp() })} setIsFollowing(!isFollowing); };
  const handleDM = async () => { const roomId = [user.uid, u.uid].sort().join("_"); await setDoc(doc(db, "dm_rooms", roomId), { participants: [user.uid, u.uid], lastMessage: "", updatedAt: serverTimestamp() }, {merge: true}); toast(`Chat with ${u.name}`); };
  return <div className="border p-4 rounded-lg bg-gray-900 border-gray-800"><div className="flex items-center gap-3"><img src={u.photoURL} className="w-12 h-12 rounded-full" /><div className="flex-1"><p className="font-bold">{u.name}</p><p className="text-xs opacity-70">⭐ {u.futureScore || 0}</p>{u.goal && <p className="text-xs text-blue-400">🎯 {u.goal}</p>}{isGoalMatch && <span className="text-xs bg-green-500/20 text-green-400 px-2 rounded-full">🤝 Goal Match</span>}</div><div className="flex gap-2"><button onClick={toggleFollow} className={`px-4 py-2 rounded-lg ${isFollowing? "bg-gray-700" : "bg-blue-500"}`}>{isFollowing? "Following" : "Follow"}</button>{isGoalMatch && <button onClick={handleDM} className="px-4 py-2 rounded-lg bg-green-500">DM</button>}</div></div></div>
}

// ===== PROFILE TAB - CUSTOM FIELDS + LOGOUT KINDHA =====
function ProfileTab({user, onLogout}: any) {
  const [profile, setProfile] = useState<any>(null); const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(""); const [username, setUsername] = useState(""); const [bio, setBio] = useState(""); const [goal, setGoal] = useState(""); const [learning, setLearning] = useState(""); const [skills, setSkills] = useState(""); const [projects, setProjects] = useState<any[]>([]); const [newProject, setNewProject] = useState({title: "", link: "", type: ""});

  useEffect(() => { getDoc(doc(db, "users", user.uid)).then(d => { if(d.exists()) { const data = d.data() as any; setProfile(data); setName(data.name); setUsername(data.username); setBio(data.bio); setGoal(data.goal); setLearning(data.learning); setSkills(data.skills?.join(", ")); setProjects(data.projects || [])} }) }, [user]);

  const handleSave = async () => { const futureScore = (profile.growthScore || 0) + (projects.length * 10) + (profile.streak || 0) * 5; await setDoc(doc(db, "users", user.uid), { name, username, bio, goal, learning, skills: skills.split(",").map(s => s.trim()).filter(s => s), projects, futureScore, photoURL: user.photoURL }, { merge: true }); setIsEditing(false); toast("Profile Saved!") };

  return (
    <div className="border rounded-xl p-6 bg-gray-900">
      <div className="flex justify-between items-start">
        <div>
          <img src={profile?.photoURL} className="w-24 h-24 rounded-full" />
          <h1 className="text-2xl font-bold mt-2">{profile?.name}</h1>
          <p className="opacity-70">@{profile?.username}</p>
        </div>
        <button onClick={() => isEditing? handleSave() : setIsEditing(true)} className="p-2 bg-blue-500 rounded">{isEditing? <Save /> : <Edit />}</button>
      </div>
      <div className="flex gap-4 my-4 flex-wrap">
        <div className="flex items-center gap-1 text-yellow-500"><Award size={16} /><b>{profile?.growthScore || 0}</b></div>
        <div className="flex items-center gap-1 text-purple-500"><Star size={16} /><b>{profile?.futureScore || 0}</b></div>
        <div className="flex items-center gap-1 text-orange-500"><Flame size={16} /><b>{profile?.streak || 0}</b></div>
        <div className="flex items-center gap-1"><Users size={16} /><b>{profile?.followersCount || 0}</b></div>
      </div>
      {profile?.achievements?.length > 0 && <div className="mb-4"><h3 className="font-bold mb-2">🏆 Achievements</h3><div className="flex gap-2 flex-wrap">{profile.achievements.map((b: string) => <span key={b} className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">{b}</span>)}</div></div>}

      {isEditing? (
        <div className="space-y-3 mt-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" className="w-full bg-gray-800 p-2 rounded" />
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full bg-gray-800 p-2 rounded" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" className="w-full bg-gray-800 p-2 rounded" />
          <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Your Future Goal - Example: AI Founder" className="w-full bg-gray-800 p-2 rounded" />
          <input value={learning} onChange={e => setLearning(e.target.value)} placeholder="What are you learning? - Example: React, AI" className="w-full bg-gray-800 p-2 rounded" />
          <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Skills - Example: Coding, Design" className="w-full bg-gray-800 p-2 rounded" />
          <div><h3 className="font-bold mb-2">🚀 Projects</h3><div className="flex gap-2 mb-2"><input value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="Project Name" className="flex-1 bg-gray-800 p-2 rounded" /><input value={newProject.type} onChange={e => setNewProject({...newProject, type: e.target.value})} placeholder="Type" className="w-32 bg-gray-800 p-2 rounded" /><input value={newProject.link} onChange={e => setNewProject({...newProject, link: e.target.value})} placeholder="Link" className="flex-1 bg-gray-800 p-2 rounded" /><button onClick={() => {setProjects([...projects, {...newProject, id: Date.now()}]); setNewProject({title: "", link: "", type: ""})}} className="bg-blue-500 px-3 rounded"><Plus /></button></div></div>
        </div>
      ) : (
        <>
          {profile?.bio && <p className="mt-4">{profile.bio}</p>}
          {profile?.goal && <p className="text-blue-400 font-semibold mt-2">🎯 {profile.goal}</p>}
          {profile?.learning && <p className="text-cyan-400 font-semibold flex items-center gap-1 mt-2"><BookOpen size={14}/> {profile.learning}</p>}
          <div className="flex gap-2 flex-wrap mt-3">{profile?.skills?.map((s: string) => <span key={s} className="bg-blue-500/20 px-3 py-1 rounded-full text-sm">🏷️ {s}</span>)}</div>
          <div className="border-t border-gray-800 pt-4 mt-4"><h3 className="font-bold mb-3 flex items-center gap-2"><Rocket /> Projects</h3>{projects.map(p => <a key={p.id} href={p.link} target="_blank" className="block hover:underline">{p.type} {p.title}</a>)}</div>
        </>
      )}
      <button onClick={onLogout} className="w-full mt-6 bg-red-500/20 text-red-400 border border-red-500 px-4 py-3 rounded-lg flex items-center justify-center gap-2"><LogOut /> Logout</button>
    </div>
  );
}

// ===== MESSAGES TAB =====
function MessagesTab({user}: any) {
  const [rooms, setRooms] = useState<any[]>([]); const [activeRoom, setActiveRoom] = useState<any>(null); const [messages, setMessages] = useState<any[]>([]); const [newMessage, setNewMessage] = useState("");
  useEffect(() => { const q = query(collection(db, "dm_rooms"), where("participants", "array-contains", user.uid), orderBy("updatedAt", "desc")); return onSnapshot(q, (snap) => setRooms(snap.docs.map(d => ({ id: d.id,...d.data() as any })))) }, [user]);
  useEffect(() => { if(!activeRoom) return; const q = query(collection(db, "dm_messages"), where("roomId", "==", activeRoom.id), orderBy("createdAt", "asc")); return onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({ id: d.id,...d.data() as any })))) }, [activeRoom]);
  const sendMessage = async () => { if(!newMessage.trim()) return; await addDoc(collection(db, "dm_messages"), { roomId: activeRoom.id, senderId: user.uid, text: newMessage, createdAt: serverTimestamp() }); await updateDoc(doc(db, "dm_rooms", activeRoom.id), { lastMessage: newMessage, updatedAt: serverTimestamp() }); setNewMessage("") };
  return <div className="flex h-[70vh] border rounded-xl bg-gray-900"><div className="w-1/3 border-r overflow-y-auto"><h2 className="p-4 font-bold">Messages</h2>{rooms.map(room => <div key={room.id} onClick={() => setActiveRoom(room)} className="p-4 cursor-pointer hover:bg-gray-800">{room.lastMessage || "New Chat"}</div>)}</div><div className="flex-1 flex-col"><div className="flex-1 p-4 overflow-y-auto">{messages.map(m => <div key={m.id} className={`mb-2 ${m.senderId === user.uid? "text-right" : ""}`}><span className={`inline-block p-2 rounded ${m.senderId === user.uid? "bg-blue-500" : "bg-gray-800"}`}>{m.text}</span></div>)}</div><div className="p-4 flex gap-2"><input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} className="flex-1 bg-gray-800 p-2 rounded" /><button onClick={sendMessage} className="bg-blue-500 px-4 rounded">Send</button></div></div></div>
}
