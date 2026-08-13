import { useState, useEffect, useRef } from "react";
import { Heart, BadgeCheck, Image as ImageIcon, Mic, MicOff, Video, VideoOff, PhoneOff, Send, MessageCircle, X, Bell, UserPlus, UserCheck, MessageSquare, ArrowLeft, Monitor, CircleDot, Radio, Grid, Sun, Moon, Download, Shield, Trash2, Ban, Megaphone, Lock, Bookmark, LogIn } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { auth, db, storage, googleProvider, serverTimestamp } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, increment, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
const ROOM_PRICE = 99;

// ================== REAL ROOM ==================
function Room({ channel, onLeave, roomType, isPaid }: { channel: string; onLeave: () => void; roomType: "voice" | "video" | "live"; isPaid: boolean }) {
  const [AgoraRTC, setAgoraRTC] = useState<any>(null); const [agoraClient, setAgoraClient] = useState<any>(null);
  const [localTracks, setLocalTracks] = useState<any>({ audio: null, video: null, screen: null }); const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [micOn, setMicOn] = useState(true); const [camOn, setCamOn] = useState(true); const [screenOn, setScreenOn] = useState(false); const [isRecording, setIsRecording] = useState(false); const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const localRef = useRef<HTMLDivElement>(null); const uid = Math.floor(Math.random() * 100000);

  useEffect(() => { import("agora-rtc-sdk-ng").then((Agora) => { const client = Agora.default.createClient({ mode: "rtc", codec: "vp8" }); setAgoraRTC(Agora.default); setAgoraClient(client); }); }, []);
  useEffect(() => {
    if (!agoraClient ||!AgoraRTC) return;
    const init = async () => {
      const res = await fetch(`/api/agora-token?channelName=${channel}&uid=${uid}`); const { token } = await res.json();
      await agoraClient.join(AGORA_APP_ID, channel, token, uid);
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks({ audio: audioTrack, video: videoTrack, screen: null });
      await agoraClient.publish([audioTrack, videoTrack]);
      if(localRef.current) videoTrack.play(localRef.current);
    };
    agoraClient.on("user-published", async (user: any, mediaType: string) => { await agoraClient.subscribe(user, mediaType); if (mediaType === "video") { setRemoteUsers((prev) => [...prev.filter(u=>u.uid!==user.uid), user]); setTimeout(() => { document.getElementById(`player-${user.uid}`) && user.videoTrack?.play(`player-${user.uid}`); }, 100); } if (mediaType === "audio") user.audioTrack?.play(); });
    agoraClient.on("user-unpublished", (user: any) => { setRemoteUsers((prev) => prev.filter((u) => u.uid!== user.uid)); });
    init();
    return () => { localTracks.audio?.close(); localTracks.video?.close(); localTracks.screen?.close(); agoraClient.leave(); };
  }, [agoraClient, AgoraRTC, channel, uid]);

  const toggleMic = async () => { await localTracks.audio.setEnabled(!micOn); setMicOn(!micOn); };
  const toggleCam = async () => { await localTracks.video.setEnabled(!camOn); setCamOn(!camOn); };
  const toggleScreenShare = async () => { if(!AgoraRTC) return; if(!screenOn){ const screenTrack = await AgoraRTC.createScreenVideoTrack(); await agoraClient.unpublish(localTracks.video); await agoraClient.publish(screenTrack); setLocalTracks({...localTracks, screen: screenTrack}); screenTrack.play(localRef.current!); setScreenOn(true); } else { await agoraClient.unpublish(localTracks.screen); await agoraClient.publish(localTracks.video); localTracks.screen.close(); setLocalTracks({...localTracks, screen: null}); localTracks.video.play(localRef.current!); setScreenOn(false); } }
  const toggleRecord = async () => { if(!isRecording){ const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); const recorder = new MediaRecorder(stream); const chunks: any[] = []; recorder.ondataavailable = e => chunks.push(e.data); recorder.onstop = () => { const blob = new Blob(chunks, { type: 'video/webm' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'nexora-recording.webm'; a.click(); } recorder.start(); setMediaRecorder(recorder); setIsRecording(true); } else { mediaRecorder?.stop(); setIsRecording(false); } }

  if (!AgoraRTC) return <div className="h-screen flex items-center justify-center">Joining Room...</div>
  return (<div className="relative h-screen bg-black text-white">{isPaid && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm z-20"><BadgeCheck size={14}/> Premium</div>}{roomType === "live" && <div className="absolute top-2 right-4 bg-red-600 px-3 py-1 rounded-full text-sm z-20 flex items-center gap-1 animate-pulse"><Radio size={14}/> LIVE</div>}<div ref={localRef} className="absolute top-4 right-4 w-40 h-56 bg-gray-800 rounded-lg z-10"></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 h-[85vh] overflow-y-auto pt-20">{remoteUsers.map((user) => (<div key={user.uid} id={`player-${user.uid}`} className="bg-gray-900 rounded-lg aspect-video"></div>))}</div><div className="absolute bottom-0 w-full bg-gray-900 p-4 flex justify-center gap-4"><button onClick={toggleMic} className={`p-3 rounded-full ${micOn? "bg-gray-700" : "bg-red-600"}`}>{micOn? <Mic /> : <MicOff />}</button>{roomType!== "voice" && <button onClick={toggleCam} className={`p-3 rounded-full ${camOn? "bg-gray-700" : "bg-red-600"}`}>{camOn? <Video /> : <VideoOff />}</button>}<button onClick={toggleScreenShare} className={`p-3 rounded-full ${screenOn? "bg-green-600" : "bg-gray-700"}`}><Monitor /></button><button onClick={toggleRecord} className={`p-3 rounded-full ${isRecording? "bg-red-600 animate-pulse" : "bg-gray-700"}`}><CircleDot /></button><button onClick={onLeave} className="bg-red-600 p-3 rounded-full"><PhoneOff /></button></div></div>);
}

// ================== REAL CHAT ==================
function ChatBox({ chat, currentUser, onClose }: { chat: any, currentUser: User, onClose: () => void }) {
  const [msg, setMsg] = useState(""); const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => { const q = query(collection(db, "chats", chat.id, "messages"), orderBy("createdAt")); const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map(d => d.data()))); return () => unsub(); }, [chat.id]);
  const sendMessage = async () => { if(!msg) return; await addDoc(collection(db, "chats", chat.id, "messages"), { text: msg, sender: currentUser.uid, createdAt: serverTimestamp() }); setMsg(""); }
  return (<div className="fixed bottom-4 right-4 w-80 h-96 bg-gray-900 rounded-xl shadow-2xl flex flex-col z-40"><div className="p-3 border-b border-gray-800 flex justify-between items-center"><p className="font-bold">{chat.name}</p><button onClick={onClose}><X size={18}/></button></div><div className="flex-1 p-3 overflow-y-auto">{messages.map((m: any, i: number) => (<div key={i} className={`mb-2 flex ${m.sender === currentUser.uid? "justify-end" : "justify-start"}`}><div className={`p-2 rounded-lg max-w-[75%] ${m.sender === currentUser.uid? "bg-blue-600 text-white" : "bg-gray-800"}`}>{m.text}</div></div>))}</div><div className="p-2 border-t border-gray-800 flex gap-2"><input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMessage()}} placeholder="Type message..." className="w-full bg-gray-800 p-2 rounded"/><button onClick={sendMessage} className="bg-blue-600 p-2 rounded text-white"><Send size={18}/></button></div></div>);
}

// ================== REAL MAIN APP ==================
export default function Nexora() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState("feed"); const [theme, setTheme] = useState("dark"); const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]); const [users, setUsers] = useState<any[]>([]); const [stories, setStories] = useState<any[]>([]);
  const [activeStory, setActiveStory] = useState<any>(null); const [inRoom, setInRoom] = useState(false); const [roomChannel, setRoomChannel] = useState("main-room"); const [roomType, setRoomType] = useState<"voice" | "video" | "live">("video"); const [isPaidRoom, setIsPaidRoom] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false); const [profileUser, setProfileUser] = useState<any>(null); const [activeChat, setActiveChat] = useState<any>(null);

  useEffect(() => { onAuthStateChanged(auth, (user) => { setCurrentUser(user); if(user){ const userRef = doc(db, "users", user.uid); updateDoc(userRef, {name: user.displayName, photo: user.photoURL}, {merge: true}); } }); }, []);
  useEffect(() => { const q = query(collection(db, "posts"), orderBy("createdAt", "desc")); onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({id: d.id,...d.data()})))); }, []);
  useEffect(() => { const q = query(collection(db, "users")); onSnapshot(q, (snap) => setUsers(snap.docs.map(d => ({id: d.id,...d.data()})))); }, []);
  useEffect(() => { const q = query(collection(db, "stories"), where("createdAt", ">", Date.now() - 86400000)); onSnapshot(q, (snap) => setStories(snap.docs.map(d => ({id: d.id,...d.data()})))); }, []);

  const handleGoogleLogin = async () => { await signInWithPopup(auth, googleProvider); }
  const handleLogout = async () => { await signOut(auth); }

  const handlePost = async (text: string, file: File) => {
    const storageRef = ref(storage, `posts/${Date.now()}-${file.name}`);
    const snap = await uploadBytes(storageRef, file); const url = await getDownloadURL(snap.ref);
    await addDoc(collection(db, "posts"), { text, image: url, userId: currentUser!.uid, likes: [], createdAt: serverTimestamp() });
  }
  const handleLike = async (postId: string) => { const postRef = doc(db, "posts", postId); const isLiked = posts.find(p=>p.id===postId).likes.includes(currentUser!.uid); await updateDoc(postRef, { likes: isLiked? arrayRemove(currentUser!.uid) : arrayUnion(currentUser!.uid) }); }
  const handleFollow = async (userId: string) => { /* Firestore lo followers array update chey */ }
  const handlePayment = async () => { const res = await fetch('/api/create-checkout', {method: 'POST'}); const {url} = await res.json(); window.location.href = url; }
  const joinRoom = (type: "free" | "paid", channel: string, rType: "voice" | "video" | "live") => { if(type === "paid"){ handlePayment(); return; } setRoomChannel(channel); setRoomType(rType); setIsPaidRoom(type === "paid"); setInRoom(true); }

  if(!currentUser) return (<div className="h-screen flex items-center justify-center bg-black"><button onClick={handleGoogleLogin} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"><LogIn /> Login with Google</button></div>);
  if (inRoom) return <Room channel={roomChannel} onLeave={() => setInRoom(false)} roomType={roomType} isPaid={isPaidRoom} />;
  if(activeStory) return <div>Story Viewer</div>; // Story code same
  if(view === "profile") return <div>Profile Page</div>; // Profile code same
  if(view === "chat" && activeChat) return <ChatBox chat={activeChat} currentUser={currentUser} onClose={() => setView("feed")} />;

  return (<div className="bg-black text-white min-h-screen"><Toaster /><header className="sticky top-0 bg-gray-900/80 backdrop-blur p-4 flex justify-between items-center z-30 border-b border-gray-800"><h1 className="text-2xl font-bold">Nexora</h1><button onClick={handleLogout}>Logout</button></header><main className="max-w-6xl mx-auto p-4">{posts.map(post => (<div key={post.id} className="bg-gray-900 p-4 rounded-xl mb-4"><p>{post.text}</p><img src={post.image} className="rounded-lg w-full mb-2"/><button onClick={() => handleLike(post.id)}><Heart />{post.likes.length}</button></div>))}</main></div>);
                                   }
