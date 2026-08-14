import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Send, LogIn, Sun, Moon, Image as ImageIcon, LogOut, Target, Users, Flame, Bell, MessageSquare, Search, Plus, Trash2, Edit, Save, X } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, where, getDocs, deleteDoc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ===== FIREBASE CONFIG - NUVVU ICHINA KEYS =====
// ⚠️ IMMEDIATELY REGENERATE KEYS IN FIREBASE CONSOLE ⚠️
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
  const [tab, setTab] = useState("feed"); // feed, discover, messages, profile
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

// ===== NAVBAR WITH NOTIFICATIONS =====
function Navbar({user, theme, toggleTheme, setTab, tab}: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("to", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id,...d.data() }))
      setNotifications(data)
    });
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

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setPosts(snap.docs.map((d) => ({ id: d.id,...d.data() }))))
  }, []);

  const handlePost = async () => {
    if (!newPost.trim() &&!image) return toast("Post or Image add cheyi");
    let imageUrl = "";
    if (image) {
      const storageRef = ref(storage, `posts/${user?.uid}/${Date.now()}`);
      const snap = await uploadBytes(storageRef, image);
      imageUrl = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, "posts"), {
      text: newPost, imageUrl, userId: user?.uid, userName: user?.displayName,
      userPhoto: user?.photoURL, likes: [], type: isGoalUpdate? "goal_update" : "post",
      createdAt: serverTimestamp()
    });
    setNewPost(""); setImage(null); setIsGoalUpdate(false); toast("Posted! 🚀");
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
            <button onClick={handlePost} className="bg-blue-500 px-6 py-2 rounded-lg font-semibold">Post</button>
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
      ) : (
        <p className="mb-3">{post.text}</p>
      )}

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

// ===== DISCOVER TAB =====
function DiscoverTab({user, theme, setTab}: any) {
  const [users, setUsers] = useState<any[]>([]);
  const roles = ["Developer", "Designer", "Marketer", "Co-founder", "React"];
  const searchRole = async (role: string) => {
    const q = query(collection(db, "users"), where("skills", "array-contains", role));
    const snap = await getDocs(q);
    setUsers(snap.docs.map(d => ({ id: d.id,...d.data() })));
  };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><Users /> Discover People</h1>
      <div className="flex gap-2 mb-6 flex-wrap">{roles.map(role => (<button key={role} onClick={() => searchRole(role)} className="px-4 py-2 rounded-full border">{role}</button>))}</div>
      <div className="space-y-4">{users.map(u => (<UserCard key={u.id} u={u} user={user} theme={theme} setTab={setTab} />))}</div>
    </div>
  );
}

function UserCard({u, user, theme, setTab}: any) {
  const [isFollowing, setIsFollowing] = useState(false);
  useEffect(() => { if(user) getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid), where("followingId", "==", u.uid))).then(s => setIsFollowing(!s.empty)) },[user,u]);
  const toggleFollow = async () => {
    if(!user) return;
    if(isFollowing) { const snap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid), where("followingId", "==", u.uid))); snap.forEach(d => deleteDoc(d.ref)); }
    else { await addDoc(collection(db, "follows"), {followerId: user.uid, followingId: u.uid, createdAt: serverTimestamp()}); createNotification(u.uid, "follow", user); }
    setIsFollowing(!isFollowing);
  };
  const startChat = async () => {
    const members = [user.uid, u.uid].sort();
    const snap = await getDocs(query(collection(db, "chats"), where("members", "==", members)));
    let chatId = snap.empty? (await addDoc(collection(db, "chats"), {members, lastMessage: "", updatedAt: serverTimestamp()})).id : snap.docs[0].id;
    setTab("messages");
  };
  return (
    <div className={`border rounded-xl p-4 flex justify-between items-center ${theme === "dark"? "border-gray-800" : "border-gray-200"}`}>
      <div className="flex items-center gap-3"><img src={u.photoURL} className="w-12 h-12 rounded-full" /><div><p className="font-bold">{u.name}</p><p className="text-sm opacity-70">{u.bio}</p></div></div>
      <div className="flex gap-2">{user?.uid!== u.uid && <><button onClick={toggleFollow} className={`px-4 py-2 rounded-lg ${isFollowing? "bg-gray-600" : "bg-blue-500"}`}>{isFollowing? "Following" : "Follow"}</button><button onClick={startChat} className="bg-green-500 px-4 py-2 rounded-lg"><MessageCircle size={16}/></button></>}</div>
    </div>
  );
}

// ===== MESSAGES TAB =====
function MessagesTab({user, theme}: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  useEffect(() => { if (!user) return; const q = query(collection(db, "chats"), where("members", "array-contains", user.uid), orderBy("updatedAt", "desc")); return onSnapshot(q, (snap) => setChats(snap.docs.map(d => ({ id: d.id,...d.data() })))) }, [user]);
  return (
    <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
      <div className={`md:col-span-1 border rounded-xl p-2 overflow-y-auto ${theme === "dark"? "border-gray-800" : "border-gray-200"}`}>
        {chats.map(c => <div key={c.id} onClick={() => setActiveChat(c)} className={`p-3 rounded cursor-pointer ${activeChat?.id === c.id? "bg-blue-500" : ""}`}>Chat {c.id.slice(0,5)}</div>)}
      </div>
      <div className={`md:col-span-2 border rounded-xl p-3 flex-col ${theme === "dark"? "border-gray-800" : "border-gray-200"}`}>{activeChat? <ChatRoom chat={activeChat} user={user} /> : <p className="m-auto opacity-70">Select a chat</p>}</div>
    </div>
  );
}

function ChatRoom({chat, user}: any) {
  const [messages, setMessages] = useState<any[]>([]); const [text, setText] = useState("");
  useEffect(() => { const q = query(collection(db, "messages"), where("chatId", "==", chat.id), orderBy("createdAt", "asc")); return onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({ id: d.id,...d.data() })))) }, [chat]);
  const sendMessage = async () => { if (!text.trim()) return; await addDoc(collection(db, "messages"), {chatId: chat.id, senderId: user.uid, text, createdAt: serverTimestamp()}); await updateDoc(doc(db, "chats", chat.id), {lastMessage: text, updatedAt: serverTimestamp()}); setText(""); };
  return (<><div className="flex-1 overflow-y-auto space-y-2">{messages.map(m => (<div key={m.id} className={`flex ${m.senderId === user?.uid? "justify-end" : "justify-start"}`}><div className={`p-2 rounded-lg ${m.senderId === user?.uid? "bg-blue-500" : "bg-gray-800"}`}>{m.text}</div></div>))}</div><div className="flex gap-2 mt-2"><input value={text} onChange={e => setText(e.target.value)} onKeyPress={e => e.key === "Enter" && sendMessage()} placeholder="Type..." className="flex-1 bg-gray-900 p-2 rounded" /><button onClick={sendMessage}><Send /></button></div></>);
}

// ===== PROFILE TAB =====
function ProfileTab({user, theme}: any) {
  const [profile, setProfile] = useState<any>(null); const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(""); const [bio, setBio] = useState(""); const [skills, setSkills] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState(""); const [newGoalDate, setNewGoalDate] = useState("");

  useEffect(() => { if(!user) return; getDoc(doc(db, "users", user.uid)).then(s => { if(s.exists()){ setProfile(s.data()); setName(s.data().name); setBio(s.data().bio); setSkills(s.data().skills?.join(", ")); }})},[user]);

  const handleSave = async () => { await updateDoc(doc(db, "users", user.uid), {name, bio, skills: skills.split(",").map(s => s.trim())}); setIsEditing(false); toast("Profile Updated!"); };
  const handleAddGoal = async () => { const newGoal = { id: Date.now().toString(), title: newGoalTitle, targetDate: newGoalDate, progress: 0 }; await updateDoc(doc(db, "users", user.uid), {goals: arrayUnion(newGoal)}); setNewGoalTitle(""); setNewGoalDate(""); };
  const handleUpdateProgress = async (goalId: string, progress: number) => { const updatedGoals = profile.goals.map((g:any) => g.id === goalId? {...g, progress} : g); await updateDoc(doc(db, "users", user.uid), { goals: updatedGoals }); };

  if(!profile) return <p>Loading...</p>;
  return (
    <div className={`border rounded-xl p-6 ${theme === "dark"? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
      <div className="flex justify-between"><img src={profile.photoURL} className="w-24 h-24 rounded-full" />{!isEditing? <button onClick={() => setIsEditing(true)}><Edit /></button> : <button onClick={handleSave}><Save /></button>}</div>
      {isEditing? (<div className="space-y-3 mt-4"><input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 p-2 rounded" /><textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-gray-800 p-2 rounded" /><input value={skills} onChange={e => setSkills(e.target.value)} className="w-full bg-gray-800 p-2 rounded" placeholder="Skills comma separated" /></div>) : (<><h1 className="text-2xl font-bold mt-2">{profile.name}</h1><p className="opacity-70">{profile.bio}</p><div className="flex gap-2 flex-wrap mt-2">{profile.skills?.map((s:string) => <span key={s} className="text-sm bg-gray-800 px-3 py-1 rounded-full">{s}</span>)}</div></>)}

      <div className="border-t border-gray-800 pt-4 mt-4">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Target /> My Goals</h3>
        <div className="flex gap-2 mb-4"><input value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} placeholder="New Goal" className="flex-1 bg-gray-800 p-2 rounded" /><input type="date" value={newGoalDate} onChange={e => setNewGoalDate(e.target.value)} className="bg-gray-800 p-2 rounded" /><button onClick={handleAddGoal} className="bg-blue-500 p-2 rounded"><Plus /></button></div>
        {profile.goals?.map((g:any) => (<div key={g.id} className="mb-3"><p className="font-semibold">{g.title}</p><div className="w-full bg-gray-700 rounded-full h-2 mt-1"><div className="bg-blue-500 h-2 rounded-full" style={{width: `${g.progress}%`}}></div></div><input type="range" min="0" max="100" value={g.progress} onChange={e => handleUpdateProgress(g.id, Number(e.target.value))} className="w-full mt-1" /></div>))}
        <div className="flex items-center gap-2 mt-4 text-orange-500"><Flame /> <span>{profile.streak || 0} Day Streak</span></div>
      </div>
    </div>
  );
}

// ===== NOTIFICATION HELPER =====
const createNotification = async (toUserId: string, type: string, fromUser: any, postId?: string) => {
  if (!toUserId || toUserId === fromUser.uid) return;
  await addDoc(collection(db, "notifications"), {
    to: toUserId, type, from: { uid: fromUser.uid, name: fromUser.displayName, photo: fromUser.photoURL },
    postId: postId || null, read: false, createdAt: serverTimestamp()
  });
};
