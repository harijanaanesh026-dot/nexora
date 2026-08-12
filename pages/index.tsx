import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc, where, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Heart, MessageCircle, Share, Bookmark, LogOut, User, Users, Bell, Image as ImageIcon, Send, Mic, MicOff, Video as VideoIcon, PhoneOff, Monitor, Plus, BadgeCheck, Lock, Shield, Trash, Ban } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import AgoraRTC, { AgoraRTCProvider, useJoin, useLocalCameraTrack, useLocalMicrophoneTrack, useRemoteUsers, usePublish, useLocalScreenTrack } from "agora-rtc-react";
import { formatDistanceToNow } from "date-fns";

// ---------------- FIREBASE + AGORA CONFIG ----------------
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
const messaging = getMessaging(app);
const googleProvider = new GoogleAuthProvider();
const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
const AGORA_APP_ID = "d87fed45cfe943caa09bcd88116d9974";
const VAPID_KEY = "PASTE_YOUR_VAPID_KEY_HERE";
// --------------------------------------------------

function VideoRoom({ channel, onLeave, isPaid }: {channel: string, onLeave: () => void, isPaid: boolean}) {
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { localCameraTrack } = useLocalCameraTrack();
  const { localScreenTrack } = useLocalScreenTrack(false, { encoderConfig: "1080p_1" });
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const tracks = [localMicrophoneTrack];
  if(camOn && localCameraTrack) tracks.push(localCameraTrack);
  if(screenOn && localScreenTrack) tracks.push(localScreenTrack);
  usePublish(tracks);
  useJoin({ appid: AGORA_APP_ID, channel: channel, token: null }, true);
  const remoteUsers = useRemoteUsers();
  const toggleScreen = async () => { if(screenOn){ localScreenTrack?.close(); setScreenOn(false); } else { await localScreenTrack?.setEnabled(true); setScreenOn(true); } }
  return (
    <div className="relative h-screen bg-black text-white">
      {isPaid && <div className="absolute top-4 right-4 bg-yellow-500 px-3 py-1 rounded-full flex items-center gap-1"><Lock size={14}/> Paid Room</div>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 h-[85vh] overflow-y-auto">
        <div className="bg-gray-800 rounded-lg relative flex items-center justify-center">{screenOn? "Sharing Screen" : camOn? "Your Camera" : "Camera Off"}<p className="absolute bottom-2 left-2">You</p></div>
        {remoteUsers.map(u => (<div key={u.uid} className="bg-gray-800 rounded-lg relative flex items-center justify-center">User {u.uid}<p className="absolute bottom-2 left-2">User {u.uid}</p></div>))}
      </div>
      <div className="absolute bottom-0 w-full bg-gray-900 p-4 flex justify-center gap-4">
        <button onClick={() => {localMicrophoneTrack?.setEnabled(!micOn); setMicOn(!micOn);}} className="bg-gray-700 p-3 rounded-full">{micOn? <Mic /> : <MicOff />}</button>
        <button onClick={() => {localCameraTrack?.setEnabled(!camOn); setCamOn(!camOn);}} className="bg-gray-700 p-3 rounded-full"><VideoIcon /></button>
        <button onClick={toggleScreen} className={`p-3 rounded-full ${screenOn? "bg-blue-600" : "bg-gray-700"}`}><Monitor /></button>
        <button onClick={onLeave} className="bg-red-600 p-3 rounded-full"><PhoneOff /></button>
      </div>
    </div>
  )
}

export default function Nexora() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [page, setPage] = useState("feed");
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [chatUser, setChatUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inRoom, setInRoom] = useState(false);
  const [roomName, setRoomName] = useState("nexora-room");
  const [stories, setStories] = useState<any[]>([]);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [viewingStory, setViewingStory] = useState<any>(null);
  const [profileTab, setProfileTab] = useState("posts");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bio, setBio] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [paidRooms, setPaidRooms] = useState<string[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const myPosts = posts.filter(p => p.uid === user?.uid);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u); setLoading(false);
      if(u){
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);
        if(!userSnap.exists()){
          await setDoc(userRef, { uid: u.uid, name: u.displayName || "User", email: u.email, photo: u.photoURL || "", cover: "", bio: "", followers: [], following: [], verified: false, isAdmin: false, paidRooms: [], fcmToken: "", createdAt: Date.now() });
        } else { setUserData(userSnap.data()); setBio(userSnap.data().bio || ""); setPaidRooms(userSnap.data().paidRooms || []); }
        Notification.requestPermission().then(p => { if(p==="granted") getToken(messaging, {vapidKey: VAPID_KEY}).then(t => updateDoc(doc(db, "users", u.uid), {fcmToken: t})).catch(()=>{}) })
      }
    });
  }, []);

  useEffect(() => { onMessage(messaging, (payload) => { toast(payload.notification?.title + ": " + payload.notification?.body); }); }, []);

  useEffect(() => {
    if(!user) return;
    onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snap) => setPosts(snap.docs.map(d => ({id: d.id,...d.data()}))));
    onSnapshot(collection(db, "users"), (snap) => setUsers(snap.docs.map(d => ({id: d.id,...d.data()}))));
    onSnapshot(query(collection(db, "notifications"), where("to", "==", user.uid), orderBy("createdAt", "desc")), (snap) => setNotifications(snap.docs.map(d => ({id: d.id,...d.data()}))));
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    onSnapshot(query(collection(db, "stories"), where("createdAt", ">", twentyFourHoursAgo), orderBy("createdAt", "desc")), (snap) => setStories(snap.docs.map(d => ({id: d.id,...d.data()}))));
  }, [user]);

  useEffect(() => {
    if(!chatUser ||!user) return;
    const chatId = [user.uid, chatUser.uid].sort().join("_");
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => { setMessages(snap.docs.map(d => ({id: d.id,...d.data()}))); messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); });
    return () => unsub();
  }, [chatUser, user]);

  const googleLogin = async () => { await signInWithPopup(auth, googleProvider); }
  const emailAuth = async () => { try{ if(isLogin){ await signInWithEmailAndPassword(auth, email, password); } else { await createUserWithEmailAndPassword(auth, email, password); } } catch(err: any){ toast.error(err.message); } }
  const logout = () => signOut(auth);

  const createPost = async () => {
    if(!newPost &&!postImage) return; setUploading(true); let imageUrl = "";
    if(postImage){ const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`); const snap = await uploadBytes(storageRef, postImage); imageUrl = await getDownloadURL(snap.ref); }
    await addDoc(collection(db, "posts"), { text: newPost, image: imageUrl, uid: user.uid, author: user.displayName, photo: user.photoURL, likes: [], comments: [], saves: [], createdAt: Date.now() });
    setNewPost(""); setPostImage(null); setUploading(false);
  }

  const likePost = async (postId: string, likes: string[]) => {
    if(!user) return; const ref = doc(db, "posts", postId);
    if(likes.includes(user.uid)) { await updateDoc(ref, { likes: arrayRemove(user.uid) }); }
    else { await updateDoc(ref, { likes: arrayUnion(user.uid) }); }
  }

  const followUser = async (targetId: string) => {
    if(!user) return; const myRef = doc(db, "users", user.uid); const targetRef = doc(db, "users", targetId); const isFollowing = userData?.following?.includes(targetId);
    if(isFollowing){ await updateDoc(myRef, { following: arrayRemove(targetId) }); await updateDoc(targetRef, { followers: arrayRemove(user.uid) }); }
    else { await updateDoc(myRef, { following: arrayUnion(targetId) }); await updateDoc(targetRef, { followers: arrayUnion(user.uid) }); await addDoc(collection(db, "notifications"), { to: targetId, from: user.uid, type: "follow", text: `${user.displayName} started following you`, read: false, createdAt: Date.now() }); }
  }

  const sendMessage = async () => {
    if(!newMsg ||!chatUser ||!user) return; const chatId = [user.uid, chatUser.uid].sort().join("_");
    await addDoc(collection(db, "chats", chatId, "messages"), { text: newMsg, from: user.uid, to: chatUser.uid, createdAt: Date.now() }); setNewMsg("");
  }

  const createStory = async () => {
    if(!storyFile) return;
    const storageRef = ref(storage, `stories/${user.uid}/${Date.now()}`);
    const snap = await uploadBytes(storageRef, storyFile);
    const url = await getDownloadURL(snap.ref);
    await addDoc(collection(db, "stories"), { url, uid: user.uid, author: user.displayName, photo: user.photoURL, createdAt: Date.now() });
    setStoryFile(null); toast.success("Story Added!");
    }
}
  const updateUserProfile = async () => {
    if(!user) return;
    let coverURL = userData.cover;
    if(coverFile){ const storageRef = ref(storage, `covers/${user.uid}/${Date.now()}`); const snap = await uploadBytes(storageRef, coverFile); coverURL = await getDownloadURL(snap.ref); }
    await updateDoc(doc(db, "users", user.uid), { bio, cover: coverURL });
    setUserData({...userData, bio, cover: coverURL}); setEditingProfile(false);
  }

  const handlePayment = async (room: string) => {
    setSelectedRoom(room); setShowPayment(true);
    setTimeout(async () => { await updateDoc(doc(db, "users", user.uid), { paidRooms: arrayUnion(room) }); setPaidRooms([...paidRooms, room]); setShowPayment(false); setInRoom(true); setRoomName(room); }, 2000);
  }
  const joinRoom = (room: string, isPaid: boolean) => { if(isPaid &&!paidRooms.includes(room)){ handlePayment(room); } else { setRoomName(room); setInRoom(true); } }
  const deletePost = async (postId: string) => { await deleteDoc(doc(db, "posts", postId)); }
  const banUser = async (uid: string) => { await updateDoc(doc(db, "users", uid), { banned: true }); }
  const verifyUser = async (uid: string) => { await updateDoc(doc(db, "users", uid), { verified: true }); }

  if(inRoom) return (
    <AgoraRTCProvider client={agoraClient}>
      <VideoRoom channel={roomName} isPaid={selectedRoom!== ""} onLeave={() => { agoraClient.leave(); setInRoom(false); setSelectedRoom(""); }} />
    </AgoraRTCProvider>
  )

  if(loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  if(!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <Toaster /><div className="bg-white p-8 rounded-xl w-full max-w-md">
        <h1 className="text-4xl font-bold mb-2 text-center text-purple-600">Nexora</h1>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-3 rounded mb-3"/>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-3 rounded mb-3"/>
        <button onClick={emailAuth} className="w-full bg-purple-600 text-white px-6 py-3 rounded font-bold mb-3">{isLogin? "Login" : "Sign Up"}</button>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full text-sm text-purple-600 mb-3">{isLogin? "Sign Up" : "Login"}</button>
        <button onClick={googleLogin} className="w-full bg-red-500 text-white px-6 py-3 rounded font-bold">Continue with Google</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      {showPayment && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg"><h3 className="text-xl font-bold mb-2">Join {selectedRoom}</h3><p>$1.00</p><button onClick={() => setShowPayment(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button></div></div>}

      <header className="bg-white shadow sticky top-0 z-10 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-600">Nexora</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setPage("feed")}>Feed</button>
          <button onClick={() => setPage("discover")}><Users/></button>
          <button onClick={() => setPage("chat")}><MessageCircle/></button>
          <button onClick={() => setPage("rooms")}><VideoIcon/></button>
          {userData?.isAdmin && <button onClick={() => setPage("admin")} className="text-red-600"><Shield/></button>}
          <button onClick={() => setPage("profile")}><User/></button>
          <button onClick={() => setPage("notifications")} className="relative"><Bell/>{notifications.filter(n =>!n.read).length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full">{notifications.filter(n =>!n.read).length}</span>}</button>
          <img src={user.photoURL} className="w-8 h-8 rounded-full"/>
          <button onClick={logout}><LogOut/></button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {page === "feed" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-4 rounded-lg shadow mb-4 flex gap-3 overflow-x-auto">
              <label className="flex-shrink-0 w-20 h-28 border-2 border-dashed rounded-lg flex-col items-center justify-center cursor-pointer"><Plus size={24}/><input type="file" accept="image/*,video/*" onChange={e => {setStoryFile(e.target.files?.[0] || null); createStory();}} className="hidden"/></label>
              {stories.map(s => (<div key={s.id} onClick={() => setViewingStory(s)} className="flex-shrink-0 w-20 h-28 rounded-lg relative cursor-pointer"><img src={s.url} className="w-full h-full object-cover rounded-lg"/><img src={s.photo} className="w-6 h-6 rounded-full absolute -top-2 -left-2 border-2 border-purple-600"/></div>))}
            </div>
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <div className="flex gap-3 mb-3"><img src={user.photoURL} className="w-10 h-10 rounded-full"/><input value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="What's your goal today?" className="flex-1 border p-2 rounded"/></div>
              {postImage && <img src={URL.createObjectURL(postImage)} className="w-full h-64 object-cover rounded mb-2"/>}
              <div className="flex justify-between"><label className="flex items-center gap-2 cursor-pointer"><ImageIcon/><input type="file" accept="image/*" onChange={e => setPostImage(e.target.files?.[0] || null)} className="hidden"/></label><button onClick={createPost} disabled={uploading} className="bg-purple-600 text-white px-6 py-2 rounded">{uploading? "Posting..." : "Post"}</button></div>
            </div>
            {posts.map(p => (<div key={p.id} className="bg-white p-4 rounded-lg shadow mb-4"><div className="flex items-center gap-3 mb-3"><img src={p.photo} className="w-10 h-10 rounded-full"/><b>{p.author}</b></div><p className="mb-3">{p.text}</p>{p.image && <img src={p.image} className="w-full rounded-lg mb-3"/>}<div className="flex gap-6 border-t pt-3"><button onClick={() => likePost(p.id, p.likes)} className="flex items-center gap-1"><Heart size={18} fill={p.likes.includes(user.uid)? "red" : "none"}/> {p.likes.length}</button><button className="flex items-center gap-1"><MessageCircle size={18}/></button><button className="flex items-center gap-1"><Share size={18}/></button><button className="flex items-center gap-1"><Bookmark size={18}/></button></div></div>))}
          </div>
        )}

        {page === "discover" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Discover People</h2>
            {users.filter(u => u.uid!== user.uid).map(u => (<div key={u.uid} className="bg-white p-4 rounded-lg shadow mb-3 flex justify-between items-center"><div className="flex items-center gap-3"><img src={u.photo} className="w-10 h-10 rounded-full"/><div><b>{u.name}</b>{u.verified && <BadgeCheck size={14} className="inline text-blue-500" fill="blue"/>}</div></div><button onClick={() => followUser(u.uid)} className="bg-purple-600 text-white px-4 py-2 rounded">{userData?.following?.includes(u.uid)? "Following" : "Follow"}</button></div>))}
          </div>
        )}

        {page === "chat" && (
          <div className="bg-white rounded-lg shadow h-[75vh] flex">
            <div className="w-1/3 border-r p-4 overflow-y-auto">{users.filter(u => u.uid!== user.uid).map(u => (<div key={u.uid} onClick={() => setChatUser(u)} className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"><img src={u.photo} className="w-8 h-8 rounded-full"/>{u.name}</div>))}</div>
            <div className="flex-1 flex flex-col">{chatUser? <><div className="p-4 border-b font-bold">{chatUser.name}</div><div className="flex-1 p-4 overflow-y-auto">{messages.map(m => <div key={m.id} className={`mb-2 ${m.from === user.uid? "text-right" : "text-left"}`}><span className="bg-gray-200 px-3 py-1 rounded-lg inline-block">{m.text}</span></div>)}<div ref={messagesEndRef} /></div><div className="p-4 flex gap-2"><input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type message" className="flex-1 border p-2 rounded"/><button onClick={sendMessage}><Send/></button></div></> : <div className="flex-1 flex items-center justify-center">Select a chat</div>}</div>
          </div>
        )}

        {page === "rooms" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">🎯 Goal Rooms</h2>
            {["Startup", "Coding", "AI"].map(room => (<div key={room} className="bg-white p-4 rounded-lg shadow mb-3 flex justify-between items-center"><div><b>{room} Room</b><p className="text-sm">Free</p></div><button onClick={() => joinRoom(room, false)} className="bg-green-600 text-white px-6 py-2 rounded">Join</button></div>))}
            {["1-on-1 Mentorship", "VC Connect"].map(room => (<div key={room} className="bg-white p-4 rounded-lg shadow mb-3 flex justify-between items-center border-2 border-yellow-400"><div><b className="flex items-center gap-2"><Lock size={16}/> {room}</b><p className="text-sm">$1.00</p></div><button onClick={() => joinRoom(room, true)} className="bg-yellow-500 text-black px-6 py-2 rounded">{paidRooms.includes(room)? "Join" : "Pay & Join"}</button></div>))}
          </div>
        )}

        {page === "profile" && userData && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-purple-500 to-blue-500 relative">{userData.cover && <img src={userData.cover} className="w-full h-full object-cover"/>}{editingProfile && <label className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded cursor-pointer"><input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="hidden"/> Change Cover</label>}</div>
            <div className="p-4">
              <div className="flex items-end -mt-16 mb-4"><img src={user.photoURL} className="w-32 h-32 rounded-full border-4 border-white"/><div className="ml-4 flex-1"><div className="flex items-center gap-2"><h2 className="text-2xl font-bold">{user.displayName}</h2>{userData.verified && <BadgeCheck className="text-blue-500" fill="blue"/>}</div><p className="text-gray-600">@{user.email?.split('@')[0]}</p></div><button onClick={() => setEditingProfile(!editingProfile)} className="bg-gray-200 px-4 py-2 rounded">{editingProfile? "Cancel" : "Edit Profile"}</button></div>
              {editingProfile? (<div className="mb-4"><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Write your bio..." className="w-full border p-2 rounded mb-2"/><button onClick={updateUserProfile} className="bg-purple-600 text-white px-4 py-2 rounded">Save</button></div>) : <p className="mb-4">{userData.bio || "No bio yet"}</p>}
              <div className="flex gap-6 mb-4"><div><b>{myPosts.length}</b> Posts</div><div><b>{userData.followers?.length || 0}</b> Followers</div><div><b>{userData.following?.length || 0}</b> Following</div></div>
              <div className="grid grid-cols-3 gap-2 mt-4">{myPosts.map(p => (<div key={p.id} className="aspect-square">{p.image? <img src={p.image} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-200 p-2">{p.text}</div>}</div>))}</div>
            </div>
          </div>
        )}

        {page === "admin" && userData?.isAdmin && (
          <div>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2"><Shield/> Admin Panel</h2>
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <h3 className="font-bold mb-3">Manage Users</h3>
              {users.map(u => (<div key={u.uid} className="flex justify-between items-center border-b py-2"><div className="flex items-center gap-2"><img src={u.photo} className="w-8 h-8 rounded-full"/><span>{u.name}</span>{u.verified && <BadgeCheck size={16} className="text-blue-500" fill="blue"/>}{u.banned && <Ban size={16} className="text-red-500"/>}</div><div className="flex gap-2">{!u.verified && <button onClick={() => verifyUser(u.uid)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">Verify</button>}{!u.banned && <button onClick={() => banUser(u.uid)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Ban</button>}</div></div>))}
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-3">Manage Posts</h3>
              {posts.slice(0,10).map(p => (<div key={p.id} className="flex justify-between items-center border-b py-2"><div><b>{p.author}</b>: {p.text.slice(0,50)}...</div><button onClick={() => deletePost(p.id)} className="bg-red-500 text-white px-2 py-1 rounded"><Trash size={14}/></button></div>))}
            </div>
          </div>
        )}

        {page === "notifications" && (<div className="max-w-2xl mx-auto"><h2 className="text-2xl font-bold mb-4">Notifications</h2>{notifications.map(n => <div key={n.id} className="bg-white p-3 rounded-lg shadow mb-2">{n.text}</div>)}</div>)}
      </div>

      {viewingStory && (<div onClick={() => setViewingStory(null)} className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"><img src={viewingStory.url} className="max-h-[90vh] max-w-[90vw]"/><div className="absolute top-4 left-4 flex items-center gap-2 text-white"><img src={viewingStory.photo} className="w-10 h-10 rounded-full"/><div><b>{viewingStory.author}</b><p className="text-xs">{formatDistanceToNow(viewingStory.createdAt)} ago</p></div></div></div>)}
    </div>
  )
}
