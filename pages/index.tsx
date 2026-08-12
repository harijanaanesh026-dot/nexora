import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc, where, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Heart, MessageCircle, Share, Bookmark, LogOut, User, Users, Bell, Image as ImageIcon, Send, Mic, MicOff, Video as VideoIcon, PhoneOff, Monitor, Circle, Plus, CheckBadge, Lock, Shield, Trash, Ban } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import AgoraRTC, { AgoraRTCProvider, useJoin, useLocalCameraTrack, useLocalMicrophoneTrack, useRemoteUsers, usePublish, useLocalScreenTrack } from "agora-rtc-react";
import { formatDistanceToNow } from "date-fns";
import { loadStripe } from "@stripe/stripe-js";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// ---------------- FIREBASE CONFIG ----------------
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
const STRIPE_KEY = "pk_test_demo";
const VAPID_KEY = "PASTE_YOUR_VAPID_KEY_HERE";
// --------------------------------------------------

export default function Nexora() {
  const [user][setUser] = useState<any>(null);
  const [loading][setLoading] = useState(true);
  const [email][setEmail] = useState("");
  const [password][setPassword] = useState("");
  const [isLogin][setIsLogin] = useState(true);
  const [page][setPage] = useState("feed");
  const [posts][setPosts] = useState<any[]>([]);
  const [newPost][setNewPost] = useState("");
  const [postImage][setPostImage] = useState<File | null>(null);
  const [uploading][setUploading] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u); setLoading(false);
      if(u){
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);
        if(!userSnap.exists()){
          await setDoc(userRef, {
            uid: u.uid, name: u.displayName || "User", email: u.email,
            photo: u.photoURL || "", cover: "", bio: "", followers: [], following: [], verified: false, isAdmin: false, paidRooms: [], fcmToken: "", createdAt: Date.now()
          });
        }
      }
    });
    onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snap) => setPosts(snap.docs.map(d => ({id: d.id,...d.data()}))));
  }, []);

  const googleLogin = async () => { await signInWithPopup(auth, googleProvider); }
  const emailAuth = async () => { try{ if(isLogin){ await signInWithEmailAndPassword(auth, email, password); } else { await createUserWithEmailAndPassword(auth, email, password); } } catch(err: any){ toast.error(err.message); } }
  const logout = () => signOut(auth);

  const createPost = async () => {
    if(!newPost &&!postImage) return; setUploading(true); let imageUrl = "";
    if(postImage){ const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`); const snap = await uploadBytes(storageRef, postImage); imageUrl = await getDownloadURL(snap.ref); }
    await addDoc(collection(db, "posts"), { text: newPost, image: imageUrl, uid: user.uid, author: user.displayName, photo: user.photoURL, likes: [], comments: [], saves: [], createdAt: Date.now() });
    setNewPost(""); setPostImage(null); setUploading(false);
  }

  const likePost = async (postId: string, likes: string[], postUid: string) => {
    if(!user) return; const ref = doc(db, "posts", postId);
    if(likes.includes(user.uid)) { await updateDoc(ref, { likes: arrayRemove(user.uid) }); }
    else { await updateDoc(ref, { likes: arrayUnion(user.uid) }); }
  }

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
    const [users][setUsers] = useState<any[]>([]);
  const [notifications][setNotifications] = useState<any[]>([]);
  const [userData][setUserData] = useState<any>(null);

  useEffect(() => {
    if(!user) return;
    onSnapshot(collection(db, "users"), (snap) => setUsers(snap.docs.map(d => ({id: d.id,...d.data()}))));
    onSnapshot(query(collection(db, "notifications"), where("to", "==", user.uid), orderBy("createdAt", "desc")), (snap) => setNotifications(snap.docs.map(d => ({id: d.id,...d.data()}))));
    getDoc(doc(db, "users", user.uid)).then(snap => { if(snap.exists()) setUserData(snap.data()) });
  }, [user]);

  const followUser = async (targetId: string) => {
    if(!user) return; const myRef = doc(db, "users", user.uid); const targetRef = doc(db, "users", targetId); const isFollowing = userData?.following?.includes(targetId);
    if(isFollowing){ await updateDoc(myRef, { following: arrayRemove(targetId) }); await updateDoc(targetRef, { followers: arrayRemove(user.uid) }); }
    else { await updateDoc(myRef, { following: arrayUnion(targetId) }); await updateDoc(targetRef, { followers: arrayUnion(user.uid) }); await addDoc(collection(db, "notifications"), { to: targetId, from: user.uid, type: "follow", text: `${user.displayName} started following you`, read: false, createdAt: Date.now() }); }
  }
  <header className="bg-white shadow sticky top-0 z-10 p-4 flex justify-between items-center">
  <h1 className="text-2xl font-bold text-purple-600">Nexora</h1>
  <div className="flex gap-4 items-center">
    <button onClick={() => setPage("feed")}>Feed</button>
    <button onClick={() => setPage("discover")}><Users/></button>
    <button onClick={() => setPage("notifications")} className="relative"><Bell/>{notifications.filter(n =>!n.read).length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full">{notifications.filter(n =>!n.read).length}</span>}</button>
    <img src={user.photoURL} className="w-8 h-8 rounded-full"/>
    <button onClick={logout}><LogOut/></button>
  </div>
</header>
  const [chatUser][setChatUser] = useState<any>(null);
  const [messages][setMessages] = useState<any[]>([]);
  const [newMsg][setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(!chatUser ||!user) return;
    const chatId = [user.uid, chatUser.uid].sort().join("_");
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({id: d.id,...d.data()})));
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => unsub();
  }, [chatUser][user]);

  const sendMessage = async () => {
    if(!newMsg ||!chatUser ||!user) return; const chatId = [user.uid, chatUser.uid].sort().join("_");
    await addDoc(collection(db, "chats", chatId, "messages"), { text: newMsg, from: user.uid, to: chatUser.uid, createdAt: Date.now() }); setNewMsg("");
  }
  const [inRoom][setInRoom] = useState(false);
  const [roomName][setRoomName] = useState("nexora-room");

  function VideoRoom({ channel, onLeave }: {channel: string, onLeave: () => void}) {
    const { localMicrophoneTrack } = useLocalMicrophoneTrack();
    const { localCameraTrack } = useLocalCameraTrack();
    const { localScreenTrack } = useLocalScreenTrack(false, { encoderConfig: "1080p_1" });
    const [micOn][setMicOn] = useState(true);
    const [camOn][setCamOn] = useState(true);
    const [screenOn][setScreenOn] = useState(false);
    const tracks = [localMicrophoneTrack];
    if(camOn && localCameraTrack) tracks.push(localCameraTrack);
    if(screenOn && localScreenTrack) tracks.push(localScreenTrack);
    usePublish(tracks);
    useJoin({ appid: AGORA_APP_ID, channel: channel, token: null }, true);
    const remoteUsers = useRemoteUsers();
    const toggleScreen = async () => {
      if(screenOn){ localScreenTrack?.close(); setScreenOn(false); } else { await localScreenTrack?.setEnabled(true); setScreenOn(true); }
    }
    return (
      <div className="relative h-screen bg-black text-white">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 h-[85vh] overflow-y-auto">
          <div className="bg-gray-800 rounded-lg">{screenOn? "Screen" : camOn? "Camera" : "Off"}</div>
          {remoteUsers.map(user => (<div key={user.uid} className="bg-gray-800 rounded-lg">User {user.uid}</div>))}
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

  if(inRoom) return (
    <AgoraRTCProvider client={agoraClient}>
      <VideoRoom channel={roomName} onLeave={() => { agoraClient.leave(); setInRoom(false); }} />
    </AgoraRTCProvider>
  )
  const [stories][setStories] = useState<any[]>([]);
  const [storyFile][setStoryFile] = useState<File | null>(null);
  const [viewingStory][setViewingStory] = useState<any>(null);
  const [profileTab][setProfileTab] = useState("posts");
  const [coverFile][setCoverFile] = useState<File | null>(null);
  const [bio][setBio] = useState("");
  const [editingProfile][setEditingProfile] = useState(false);

  useEffect(() => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    onSnapshot(query(collection(db, "stories"), where("createdAt", ">", twentyFourHoursAgo), orderBy("createdAt", "desc")), (snap) => setStories(snap.docs.map(d => ({id: d.id,...d.data()}))));
  }, []);

  const createStory = async () => {
    if(!storyFile) return;
    const storageRef = ref(storage, `stories/${user.uid}/${Date.now()}`);
    const snap = await uploadBytes(storageRef, storyFile);
    const url = await getDownloadURL(snap.ref);
    await addDoc(collection(db, "stories"), { url, uid: user.uid, author: user.displayName, photo: user.photoURL, createdAt: Date.now() });
    setStoryFile(null); toast.success("Story Added!");
  }

  const updateUserProfile = async () => {
    if(!user) return;
    let coverURL = userData.cover;
    if(coverFile){
      const storageRef = ref(storage, `covers/${user.uid}/${Date.now()}`);
      const snap = await uploadBytes(storageRef, coverFile);
      coverURL = await getDownloadURL(snap.ref);
    }
    await updateDoc(doc(db, "users", user.uid), { bio, cover: coverURL });
    setUserData({...userData, bio, cover: coverURL});
    setEditingProfile(false);
  }
  const myPosts = posts.filter(p => p.uid === user?.uid);
  const [paidRooms][setPaidRooms] = useState<string[]>([]);
  const [showPayment][setShowPayment] = useState(false);
  const [selectedRoom][setSelectedRoom] = useState("");

  useEffect(() => {
    if(user){ Notification.requestPermission().then(p => { if(p==="granted") getToken(messaging, {vapidKey: VAPID_KEY}).then(t => updateDoc(doc(db, "users", user.uid), {fcmToken: t})) }) }
    onMessage(messaging, (payload) => { toast(payload.notification?.title + ": " + payload.notification?.body); });
  }, [user]);

  const handlePayment = async (room: string) => {
    setSelectedRoom(room); setShowPayment(true);
    setTimeout(async () => {
      await updateDoc(doc(db, "users", user.uid), { paidRooms: arrayUnion(room) });
      setPaidRooms([...paidRooms, room]);
      setShowPayment(false); setInRoom(true); setRoomName(room);
    }, 2000);
  }
  const joinRoom = (room: string, isPaid: boolean) => {
    if(isPaid &&!paidRooms.includes(room)){ handlePayment(room); } else { setRoomName(room); setInRoom(true); }
  }

  const deletePost = async (postId: string) => { await deleteDoc(doc(db, "posts", postId)); }
  const banUser = async (uid: string) => { await updateDoc(doc(db, "users", uid), { banned: true }); }
  const verifyUser = async (uid: string) => { await updateDoc(doc(db, "users", uid), { verified: true }); }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      {showPayment && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg"><h3>Join {selectedRoom}</h3><p>$1.00</p><button onClick={() => setShowPayment(false)}>Cancel</button></div></div>}

      <header>{/* Header from Part 2 */}</header>

      <div className="max-w-6xl mx-auto p-4">
        {page === "feed" && <div>/* Feed + Stories + Posts UI */</div>}
        {page === "discover" && <div>/* Users list + Follow button */</div>}
        {page === "chat" && <div>/* Chat UI */</div>}
        {page === "rooms" && <div>/* Free + Paid Rooms with joinRoom() */</div>}
        {page === "profile" && <div>/* Profile with Cover, Bio, Posts Grid */</div>}
        {page === "admin" && userData?.isAdmin && <div>/* Admin: Users + Posts Manage */</div>}
      </div>

      {viewingStory && <div onClick={() => setViewingStory(null)} className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"><img src={viewingStory.url} className="max-h-[90vh]"/></div>}
    </div>
  )
                 }
