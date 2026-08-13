import { useState, useEffect, useRef } from "react";
import { Heart, Users, BadgeCheck, Image as ImageIcon, Mic, MicOff, Video, VideoOff, PhoneOff, Send, MessageCircle, Share2, X, Bell, UserPlus, UserCheck, MessageSquare, ArrowLeft, Headphones, Video as VideoIcon, Monitor, CircleDot, Radio, Plus, User, Grid, Sun, Moon, Download, Shield, Trash2, Ban, Megaphone, Lock, Bookmark, Save } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_123"); // NEE STRIPE KEY
const AGORA_APP_ID = "0e76b7daaa4b47cba8e18d1697d72";
const ADMIN_ID = "admin";
const ROOM_PRICE = 99;

// FAKE AUTH - Google login simulate chesam
const MY_USER = { id: "guest", name: "Guest", username: "guest_user", verified: true, isAdmin: true, photo: "https://i.pravatar.cc/150?u=guest" };

const initialUsers = [
  { id: "anesh", name: "Anesh", username: "anesh.dev", verified: true, followers: 120, following: 80, avatar: "https://i.pravatar.cc/150?u=anesh", cover: "https://picsum.photos/seed/cover1/800/300", online: true, banned: false },
  { id: "priya", name: "Priya", username: "priya.codes", verified: false, followers: 85, following: 90, avatar: "https://i.pravatar.cc/150?u=priya", cover: "https://picsum.photos/seed/cover2/800/300", online: false, banned: false },
];

const initialPosts = [
  { id: "1", userId: "guest", user: "Guest", text: "Nexora Launch! 🔥", image: "https://picsum.photos/seed/post1/400/400", likes: 12, likedBy: [], comments: [], savedBy: [] },
];

const getInitialStories = () => {
  return [
    { id: "s1", userId: "anesh", user: "Anesh", avatar: "https://i.pravatar.cc/150?u=anesh", image: "https://picsum.photos/seed/story1/400/700", createdAt: Date.now() - 1000*60*60 },
  ].filter(s => Date.now() - s.createdAt < 1000*60*60*24);
}

// ================== ROOM: VOICE + VIDEO + SCREEN + RECORD + LIVE + PAID ==================
function Room({ channel, onLeave, roomType, isPaid }: { channel: string; onLeave: () => void; roomType: "voice" | "video" | "live"; isPaid: boolean }) {
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);
  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [localTracks, setLocalTracks] = useState<any>({ audio: null, video: null, screen: null });
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const localRef = useRef<HTMLDivElement>(null);

  useEffect(() => { import("agora-rtc-sdk-ng").then((Agora) => { const client = Agora.default.createClient({ mode: "rtc", codec: "vp8" }); setAgoraRTC(Agora.default); setAgoraClient(client); }); }, []);
  useEffect(() => { if (!agoraClient ||!AgoraRTC) return; const init = async () => { const uid = Math.floor(Math.random() * 100000); await agoraClient.join(AGORA_APP_ID, channel, null, uid); const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(); setLocalTracks({ audio: audioTrack, video: videoTrack, screen: null }); await agoraClient.publish([audioTrack, videoTrack]); if(localRef.current) videoTrack.play(localRef.current); }; agoraClient.on("user-published", async (user: any, mediaType: string) => { await agoraClient.subscribe(user, mediaType); if (mediaType === "video") { setRemoteUsers((prev) => [...prev.filter(u=>u.uid!==user.uid), user]); setTimeout(() => { const player = document.getElementById(`player-${user.uid}`); if(player) user.videoTrack?.play(player); }, 100); } if (mediaType === "audio") user.audioTrack?.play(); }); agoraClient.on("user-unpublished", (user: any) => { setRemoteUsers((prev) => prev.filter((u) => u.uid!== user.uid)); }); init(); return () => { localTracks.audio?.close(); localTracks.video?.close(); localTracks.screen?.close(); agoraClient.leave(); }; }, [agoraClient, AgoraRTC, channel]);

  const toggleMic = async () => { await localTracks.audio.setEnabled(!micOn); setMicOn(!micOn); };
  const toggleCam = async () => { await localTracks.video.setEnabled(!camOn); setCamOn(!camOn); };
  const toggleScreenShare = async () => { if(!AgoraRTC) return; if(!screenOn){ const screenTrack = await AgoraRTC.createScreenVideoTrack(); await agoraClient.unpublish(localTracks.video); await agoraClient.publish(screenTrack); setLocalTracks({...localTracks, screen: screenTrack}); screenTrack.play(localRef.current!); setScreenOn(true); } else { await agoraClient.unpublish(localTracks.screen); await agoraClient.publish(localTracks.video); localTracks.screen.close(); setLocalTracks({...localTracks, screen: null}); localTracks.video.play(localRef.current!); setScreenOn(false); } }
  const toggleRecord = async () => { if(!isRecording){ const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); const recorder = new MediaRecorder(stream); const chunks: any[] = []; recorder.ondataavailable = e => chunks.push(e.data); recorder.onstop = () => { const blob = new Blob(chunks, { type: 'video/webm' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'nexora-recording.webm'; a.click(); } recorder.start(); setMediaRecorder(recorder); setIsRecording(true); } else { mediaRecorder?.stop(); setIsRecording(false); } }

  if (!AgoraRTC) return <div className="h-screen flex items-center justify-center bg-white dark:bg-black">Joining Room...</div>
  return (
    <div className="relative h-screen bg-white dark:bg-black text-black dark:text-white">
      {isPaid && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm z-20 flex items-center gap-1"><BadgeCheck size={14}/> Premium Room</div>}
      {roomType === "live" && <div className="absolute top-2 right-4 bg-red-600 px-3 py-1 rounded-full text-sm z-20 flex items-center gap-1 animate-pulse"><Radio size={14}/> LIVE</div>}
      <div ref={localRef} className="absolute top-4 right-4 w-40 h-56 bg-gray-200 dark:bg-gray-800 rounded-lg z-10"></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 h-[85vh] overflow-y-auto pt-20">{remoteUsers.map((user) => (<div key={user.uid} id={`player-${user.uid}`} className="bg-gray-200 dark:bg-gray-900 rounded-lg aspect-video"></div>))}</div>
      <div className="absolute bottom-0 w-full bg-gray-100 dark:bg-gray-900 p-4 flex justify-center gap-4">
        <button onClick={toggleMic} className={`p-3 rounded-full ${micOn? "bg-gray-300 dark:bg-gray-700" : "bg-red-600"}`}>{micOn? <Mic /> : <MicOff />}</button>
        {roomType!== "voice" && <button onClick={toggleCam} className={`p-3 rounded-full ${camOn? "bg-gray-300 dark:bg-gray-700" : "bg-red-600"}`}>{camOn? <Video /> : <VideoOff />}</button>}
        <button onClick={toggleScreenShare} className={`p-3 rounded-full ${screenOn? "bg-green-600" : "bg-gray-300 dark:bg-gray-700"}`}><Monitor /></button>
        <button onClick={toggleRecord} className={`p-3 rounded-full ${isRecording? "bg-red-600 animate-pulse" : "bg-gray-300 dark:bg-gray-700"}`}><CircleDot /></button>
        <button onClick={onLeave} className="bg-red-600 p-3 rounded-full"><PhoneOff /></button>
      </div>
    </div>
  );
}

// ================== CHAT: 1TO1 + GROUP ==================
function ChatBox({ chat, onClose, onSend }: { chat: any, onClose: () => void, onSend: (msg: string) => void }) {
  const [msg, setMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat.messages]);
  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-gray-200 dark:border-gray-800 flex-col z-40">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center"><p className="font-bold">{chat.name}</p><button onClick={onClose}><X size={18}/></button></div>
      <div className="flex-1 p-3 overflow-y-auto">{chat.messages.map((m: any, i: number) => (<div key={i} className={`mb-2 flex ${m.sender === MY_USER.id? "justify-end" : "justify-start"}`}><div className={`p-2 rounded-lg max-w-[75%] ${m.sender === MY_USER.id? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800"}`}>{m.text}</div></div>))}<div ref={bottomRef} /></div>
      <div className="p-2 border-t border-gray-200 dark:border-gray-800 flex gap-2"><input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){onSend(msg); setMsg("")}}} placeholder="Type message..." className="w-full bg-gray-100 dark:bg-gray-800 p-2 rounded"/><button onClick={()=>{onSend(msg); setMsg("")}} className="bg-blue-600 p-2 rounded text-white"><Send size={18}/></button></div>
    </div>
  );
}

function StoryViewer({ story, onClose }: { story: any, onClose: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => { const interval = setInterval(() => { setProgress(p => { if(p >= 100){ onClose(); return 100 } return p + 2 }); }, 100); return () => clearInterval(interval); }, [onClose]);
  return (<motion.div className="fixed inset-0 bg-black z-50 flex items-center justify-center"><div className="w-full max-w-md h-[90vh] relative"><div className="absolute top-2 left-2 right-2 h-1 bg-gray-600 rounded"><div className="h-1 bg-white rounded" style={{width: `${progress}%`}}></div></div><img src={story.image} className="w-full h-full object-contain"/><button onClick={onClose} className="absolute top-4 right-4 text-white"><X /></button></div></motion.div>);
}

// ================== PROFILE: COVER + PHOTO + VERIFIED + GRID ==================
function ProfilePage({ user, posts, onBack, onFollow, isFollowing }: { user: any, posts: any[], onBack: () => void, onFollow: () => void, isFollowing: boolean }) {
  const [cover, setCover] = useState(user.cover);
  const [avatar, setAvatar] = useState(user.avatar);
  const userPosts = posts.filter(p => p.userId === user.id);
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(file){ const reader = new FileReader(); reader.onload = () => setCover(reader.result as string); reader.readAsDataURL(file); } }
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(file){ const reader = new FileReader(); reader.onload = () => setAvatar(reader.result as string); reader.readAsDataURL(file); } }
  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <div className="relative"><img src={cover} className="w-full h-48 md:h-64 object-cover"/><label className="absolute bottom-2 right-2 bg-black/50 p-2 rounded-full cursor-pointer text-white"><ImageIcon size={18}/><input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden"/></label><button onClick={onBack} className="absolute top-4 left-4 bg-black/50 p-2 rounded-full text-white"><ArrowLeft /></button></div>
      <div className="p-4 -mt-12 relative"><div className="relative w-24 h-24 md:w-32 md:h-32"><img src={avatar} className="w-full h-full rounded-full border-4 border-white dark:border-black"/><label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer text-white"><ImageIcon size={14}/><input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden"/></label></div>
        <div className="mt-4 flex justify-between items-start"><div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{user.name}</h1>{user.verified && <BadgeCheck className="text-blue-500 fill-blue-500" />}</div><p className="text-gray-500 dark:text-gray-400">@{user.username}</p><div className="flex gap-6 mt-2"><p><span className="font-bold">{userPosts.length}</span> Posts</p><p><span className="font-bold">{user.followers}</span> Followers</p><p><span className="font-bold">{user.following}</span> Following</p></div></div>{user.id!== MY_USER.id && <button onClick={onFollow} className={`px-4 py-2 rounded-lg font-bold ${isFollowing? "bg-gray-300 dark:bg-gray-700" : "bg-blue-600 text-white"}`}>{isFollowing? <UserCheck size={16}/> : <UserPlus size={16}/>}{isFollowing? " Following" : " Follow"}</button>}</div>
        <div className="mt-6 border-t border-gray-200 dark:border-gray-800"><div className="flex justify-center gap-2 py-2 text-gray-500"><Grid size={18}/> POSTS</div><div className="grid grid-cols-3 gap-1">{userPosts.map(post => (<img key={post.id} src={post.image} className="aspect-square object-cover"/>))}</div></div>
      </div>
    </div>
  );

  // ================== ADMIN + PAYMENT ==================
function AdminPanel({ users, posts, setUsers, setPosts, onClose, sendPush }: any) {
  const [notifText, setNotifText] = useState("");
  const banUser = (userId: string) => { setUsers(users.map((u: any) => u.id === userId? {...u, banned:!u.banned} : u)); }
  const deletePost = (postId: string) => { setPosts(posts.filter((p: any) => p.id!== postId)); }
  const handleSendPush = () => { if(!notifText) return; sendPush(notifText); setNotifText(""); }
  return (<motion.div className="fixed inset-0 bg-black/80 z-50 p-4 overflow-y-auto"><div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl p-6"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold flex items-center gap-2"><Shield /> Admin Panel</h2><button onClick={onClose}><X size={24}/></button></div><div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6"><h3 className="font-bold mb-2 flex items-center gap-2"><Megaphone size={18}/> Send Push Notification</h3><div className="flex gap-2"><input value={notifText} onChange={e=>setNotifText(e.target.value)} placeholder="Type announcement..." className="w-full bg-white dark:bg-gray-700 p-2 rounded"/><button onClick={handleSendPush} className="bg-blue-600 px-4 rounded text-white">Send</button></div></div><h3 className="font-bold mb-2">Users</h3>{users.map((user: any) => (<div key={user.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-3 rounded mb-2"><p>{user.name}</p><button onClick={() => banUser(user.id)} className={`flex items-center gap-1 px-3 py-1 rounded text-white ${user.banned? "bg-green-600" : "bg-red-600"}`}><Ban size={14}/>{user.banned? "Unban" : "Ban"}</button></div>))}<h3 className="font-bold mb-2 mt-4">Posts</h3>{posts.map((post: any) => (<div key={post.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-3 rounded mb-2"><p>{post.text}</p><button onClick={() => deletePost(post.id)} className="bg-red-600 p-2 rounded text-white"><Trash2 size={16}/></button></div>))}</div></motion.div>);
}

function PaymentModal({ onClose, onSuccess, price }: { onClose: () => void, onSuccess: () => void, price: number }) {
  const handlePayment = async () => { toast.loading("Processing..."); setTimeout(() => { toast.dismiss(); toast.success("Payment Successful!"); onSuccess(); onClose(); }, 1500); }
  return (<motion.div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"><div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-96"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Join Premium Room</h2><button onClick={onClose}><X /></button></div><p className="text-3xl font-bold mb-4">₹{price}<span className="text-sm font-normal">/ entry</span></p><button onClick={handlePayment} className="w-full bg-yellow-500 text-black font-bold py-3 rounded-lg">Pay with Stripe</button></div></motion.div>);
}

// ================== MAIN APP ==================
export default function Nexora() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ✅ AUTH: GOOGLE
  const [view, setView] = useState("feed"); // feed, profile, chat
  const [theme, setTheme] = useState("dark"); // ✅ DARK/LIGHT
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null); // ✅ PWA MOBILE APP
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [stories, setStories] = useState<any[]>(getInitialStories());
  const [activeStory, setActiveStory] = useState<any>(null);
  const [inRoom, setInRoom] = useState(false);
  const [roomChannel, setRoomChannel] = useState("main-room");
  const [roomType, setRoomType] = useState<"voice" | "video" | "live">("video");
  const [isPaidRoom, setIsPaidRoom] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(MY_USER);
  const [currentUser, setCurrentUser] = useState(MY_USER);
  const [notifications, setNotifications] = useState<any[]>([]); // ✅ NOTIFICATIONS
  const [following, setFollowing] = useState<string[]>([]); // ✅ FOLLOW SYSTEM
  const [chats, setChats] = useState<any[]>([{ id: "group1", type: "group", name: "Nexora Group", messages: [] }, { id: "anesh", type: "dm", name: "Anesh", messages: [] }]); // ✅ 1TO1 + GROUP
  const [activeChat, setActiveChat] = useState<any>(null);

  useEffect(() => { const saved = localStorage.getItem("theme") || "dark"; setTheme(saved); document.documentElement.classList.toggle("dark", saved === "dark"); }, []);
  const toggleTheme = () => { const newTheme = theme === "dark"? "light" : "dark"; setTheme(newTheme); localStorage.setItem("theme", newTheme); document.documentElement.classList.toggle("dark", newTheme === "dark"); }
  useEffect(() => { window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); }); }, []);
  const handleInstall = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; setDeferredPrompt(null); }
  useEffect(() => { if("Notification" in window) Notification.requestPermission(); }, []);
  const sendPush = (text: string) => { setNotifications([{id: Date.now(), text},...notifications]); if(Notification.permission === "granted"){ new Notification("Nexora", { body: text }); } }

  const handleGoogleLogin = () => { setIsLoggedIn(true); toast.success("Logged in with Google"); } // ✅ AUTH

  const openProfile = (user: any) => { setProfileUser(user); setView("profile"); }
  const openChat = (chatId: string) => { const chat = chats.find(c => c.id === chatId); setActiveChat(chat); setView("chat"); }
  const sendMessage = (text: string) => { if(!text ||!activeChat) return; const newMsg = { sender: MY_USER.id, text }; setChats(chats.map(c => c.id === activeChat.id? {...c, messages: [...c.messages, newMsg]} : c)); setActiveChat({...activeChat, messages: [...activeChat.messages, newMsg]}); }

  const handleFollow = (userId: string) => { // ✅ FOLLOW
    const isFollowing = following.includes(userId);
    setFollowing(isFollowing? following.filter(id => id!== userId) : [...following, userId]);
    setUsers(users.map(u => u.id === userId? {...u, followers: isFollowing? u.followers - 1 : u.followers + 1} : u));
    if(!isFollowing) setNotifications([{id: Date.now(), text: `You followed ${users.find(u=>u.id===userId)?.name}`},...notifications]);
  }

  const handleLike = (postId: string) => { // ✅ LIKE
    setPosts(posts.map(p => p.id === postId? {...p, likes: p.likedBy.includes(MY_USER.id)? p.likes - 1 : p.likes + 1, likedBy: p.likedBy.includes(MY_USER.id)? p.likedBy.filter((id: string) => id!== MY_USER.id) : [...p.likedBy, MY_USER.id]} : p));
  }
  const handleSave = (postId: string) => { // ✅ SAVE
    setPosts(posts.map(p => p.id === postId? {...p, savedBy: p.savedBy.includes(MY_USER.id)? p.savedBy.filter((id: string) => id!== MY_USER.id) : [...p.savedBy, MY_USER.id]} : p));
    toast.success("Saved");
  }
  const handleComment = (postId: string, text: string) => { // ✅ COMMENT
    setPosts(posts.map(p => p.id === postId? {...p, comments: [...p.comments, {user: MY_USER.name, text}]} : p));
  }

  const joinRoom = (type: "free" | "paid", channel: string, rType: "voice" | "video" | "live") => {
    if(type === "paid" &&!hasPaid){ setShowPayment(true); setRoomChannel(channel); setRoomType(rType); setIsPaidRoom(true); return; }
    setRoomChannel(channel); setRoomType(rType); setIsPaidRoom(type === "paid"); setInRoom(true);
  }

  if(!isLoggedIn) return ( // ✅ GOOGLE AUTH PAGE
    <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center"><h1 className="text-4xl font-bold mb-6">Welcome to Nexora</h1>
      <button onClick={handleGoogleLogin} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">Continue with Google</button></div>
    </div>
  );

  if (inRoom) return <Room channel={roomChannel} onLeave={() => setInRoom(false)} roomType={roomType} isPaid={isPaidRoom} />;
  if(activeStory) return <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />;
  if(view === "profile") return <ProfilePage user={profileUser} posts={posts} onBack={() => setView("feed")} onFollow={() => handleFollow(profileUser.id)} isFollowing={following.includes(profileUser.id)} />;
  if(view === "chat" && activeChat) return <ChatBox chat={activeChat} onClose={() => setView("feed")} onSend={sendMessage} />;

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen transition-colors">
      <Toaster position="top-right" />
      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} onSuccess={() => {setHasPaid(true); setInRoom(true);}} price={ROOM_PRICE} />}
      {showAdmin && <AdminPanel users={users} posts={posts} setUsers={setUsers} setPosts={setPosts} onClose={() => setShowAdmin(false)} sendPush={sendPush} />}

      <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur p-4 flex justify-between items-center z-30 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold">Nexora</h1>
        <div className="flex gap-3 items-center">
          {deferredPrompt && <button onClick={handleInstall} className="flex items-center gap-1 p-2 bg-green-600 rounded-lg text-white"><Download size={16}/> Install</button>}
          <button onClick={toggleTheme} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full">{theme === "dark"? <Sun size={20} /> : <Moon size={20} />}</button>
          {currentUser.isAdmin && <button onClick={() => setShowAdmin(true)} className="p-2 bg-red-600 rounded-full text-white"><Shield size={20} /></button>}
          <div className="relative"><button className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full"><Bell size={20} />{notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-4 h-4 rounded-full">{notifications.length}</span>}</button></div>
          <button onClick={() => openChat("group1")} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full"><MessageSquare size={20} /></button>
          <button onClick={() => openProfile(MY_USER)} className="w-8 h-8 rounded-full"><img src={MY_USER.photo} className="rounded-full"/></button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {/* STORIES 24HRS */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-6 border-b border-gray-200 dark:border-gray-800">
          {stories.map(story => (<div key={story.id} onClick={() => setActiveStory(story)} className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"><div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500"><img src={story.avatar} className="w-full h-full rounded-full border-2 border-white dark:border-black"/></div><p className="text-xs">{story.user}</p></div>))}
        </div>

        {/* ROOMS */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl"><h3 className="font-bold mb-2">Video Room</h3><button onClick={() => joinRoom("free", "free-room", "video")} className="w-full bg-blue-600 py-2 rounded-lg font-bold text-white">Join</button></div>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl"><h3 className="font-bold mb-2">Voice Room</h3><button onClick={() => joinRoom("free", "voice-room", "voice")} className="w-full bg-purple-600 py-2 rounded-lg font-bold text-white">Join</button></div>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl border-2 border-yellow-500"><h3 className="font-bold mb-2 flex items-center gap-1"><Lock size={16}/> Premium Live</h3><button onClick={() => joinRoom("paid", "paid-room", "live")} className="w-full bg-yellow-500 text-black py-2 rounded-lg font-bold">₹{ROOM_PRICE}</button></div>
        </div>

        {/* POSTS: TEXT + IMAGE + LIKE + COMMENT + SAVE */}
        {posts.map(post => {
          const isLiked = post.likedBy.includes(MY_USER.id);
          const isSaved = post.savedBy.includes(MY_USER.id);
          return (
          <div key={post.id} className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl mb-4">
            <div onClick={() => openProfile(users.find(u=>u.id===post.userId) || MY_USER)} className="font-bold cursor-pointer">@{post.user}</div>
            <p className="my-2">{post.text}</p>
            <img src={post.image} className="rounded-lg w-full mb-2"/>
            <div className="flex justify-between items-center text-gray-500">
              <button onClick={() => handleLike(post.id)} className="flex items-center gap-1"><Heart fill={isLiked? "red" : "none"} color={isLiked? "red" : "gray"} />{post.likes}</button>
              <button className="flex items-center gap-1"><MessageCircle />{post.comments.length}</button>
              <button onClick={() => handleSave(post.id)}><Bookmark fill={isSaved? "yellow" : "none"} /></button>
            </div>
          </div>
        )})}
      </main>
    </div>
  );
            }
                                                                                                                                                                                                                                                   }
