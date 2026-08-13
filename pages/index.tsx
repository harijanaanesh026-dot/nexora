import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Heart, MessageCircle, Share, Bookmark, LogOut, User, Users, Bell, Image as ImageIcon, Send, Mic, MicOff, Video, VideoOff, PhoneOff, Home, PlusSquare, BadgeCheck } from "lucide-react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { formatDistanceToNow } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyATgYb90gVCrAzhuz2a3k10kdy8bqB4",
  authDomain: "nexoraai-75aez.firebaseapp.com",
  projectId: "nexoraai-75aez",
  storageBucket: "nexoraai-75aez.appspot.com",
  messagingSenderId: "713122171177",
  appId: "1:713122171177:wb:8b6a73598b10b0b0c8ed85P",
};

const app = getApps().length === 0? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// AGORA CONFIG
const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
const AGORA_APP_ID = "0e76b7daaa4b47cba8e18d1697d72"; // NEE AGORA ID AKKADA PETTU

// VIDEOROOM COMPONENT
function VideoRoom({ channel, onLeave, isPaid }: { channel: string; onLeave: () => void; isPaid: boolean }) {
  const [localTracks, setLocalTracks] = useState<any>({ audio: null, video: null });
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const localRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      await agoraClient.join(AGORA_APP_ID, channel, null, null);
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks({ audio: audioTrack, video: videoTrack });
      await agoraClient.publish([audioTrack, videoTrack]);
      if(localRef.current) videoTrack.play(localRef.current);
    };

    agoraClient.on("user-published", async (user, mediaType) => {
      await agoraClient.subscribe(user, mediaType);
      if (mediaType === "video") {
        setRemoteUsers((prev) => [...prev, user]);
        setTimeout(() => {
          const player = document.getElementById(`player-${user.uid}`);
          if(player) user.videoTrack?.play(player);
        }, 100);
      }
      if (mediaType === "audio") user.audioTrack?.play();
    });
    
    agoraClient.on("user-unpublished", (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid!== user.uid));
    });

    init();
    return () => {
      localTracks.audio?.close();
      localTracks.video?.close();
      agoraClient.leave();
    };
  }, [channel]);

  const toggleMic = async () => {
    await localTracks.audio.setEnabled(!micOn);
    setMicOn(!micOn);
  };
  const toggleCam = async () => {
    await localTracks.video.setEnabled(!camOn);
    setCamOn(!camOn);
  };

  return (
    <div className="relative h-screen bg-black text-white">
      {isPaid && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm">Premium Room</div>}
      <div ref={localRef} className="absolute top-4 right-4 w-40 h-56 bg-gray-800 rounded-lg z-10"></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 h-[85vh] overflow-y-auto pt-24">
        {remoteUsers.map((user) => (
          <div key={user.uid} id={`player-${user.uid}`} className="bg-gray-900 rounded-lg aspect-video"></div>
        ))}
      </div>
      <div className="absolute bottom-0 w-full bg-gray-900 p-4 flex justify-center gap-4">
        <button onClick={toggleMic} className="bg-gray-700 p-3 rounded-full">{micOn? <Mic /> : <MicOff />}</button>
        <button onClick={toggleCam} className="bg-gray-700 p-3 rounded-full">{camOn? <Video /> : <VideoOff />}</button>
        <button onClick={onLeave} className="bg-red-600 p-3 rounded-full"><PhoneOff /></button>
      </div>
    </div>
  );
}

export default function Nexora() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [page, setPage] = useState("feed");
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const [roomChannel, setRoomChannel] = useState("main-room");
  const [isPaidRoom, setIsPaidRoom] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if(!user) return;
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id,...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login Successful!");
    } catch { toast.error("Login Failed"); }
  };

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Account Created!");
    } catch { toast.error("Signup Failed"); }
  };

  const handlePost = async () => {
    if (!newPost &&!postImage) return;
    setUploading(true);
    let imageUrl = "";
    if (postImage) {
      const storageRef = ref(storage, `posts/${Date.now()}-${postImage.name}`);
      const snap = await uploadBytes(storageRef, postImage);
      imageUrl = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, "posts"), {
      text: newPost, image: imageUrl, userId: user.uid,
      userEmail: user.email, likes: [], createdAt: serverTimestamp()
    });
    setNewPost(""); setPostImage(null); setUploading(false);
    toast.success("Posted!");
  };

  const handleLike = async (postId: string, likes: string[]) => {
    const postRef = doc(db, "posts", postId);
    if (likes.includes(user.uid)) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  
  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-80 p-6 bg-gray-900 rounded-xl">
        <h1 className="text-3xl font-bold text-center mb-6">Nexora</h1>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 mb-3 bg-gray-800 rounded"/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-2 mb-4 bg-gray-800 rounded"/>
        <button onClick={handleLogin} className="w-full bg-blue-600 p-2 rounded mb-2">Login</button>
        <button onClick={handleSignUp} className="w-full bg-gray-700 p-2 rounded">Sign Up</button>
      </motion.div>
    </div>
  );

  if (inRoom) return <VideoRoom channel={roomChannel} onLeave={() => setInRoom(false)} isPaid={isPaidRoom} />;

  return (
    <div className="bg-black text-white min-h-screen">
      <Toaster />
      <header className="sticky top-0 bg-gray-900 p-4 flex justify-between items-center z-20">
        <h1 className="text-2xl font-bold">Nexora</h1>
        <div className="flex gap-4">
          <button onClick={() => {setRoomChannel("free-room"); setIsPaidRoom(false); setInRoom(true)}}><Users /></button>
          <button onClick={() => {setRoomChannel("paid-room"); setIsPaidRoom(true); setInRoom(true)}}><BadgeCheck /></button>
          <button onClick={() => signOut(auth)}><LogOut /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-gray-900 p-4 rounded-xl mb-6">
          <textarea value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="What's on your mind?" className="w-full bg-gray-800 p-2 rounded mb-2"/>
          <input type="file" onChange={e=>setPostImage(e.target.files?.[0] || null)} className="mb-2"/>
          <button onClick={handlePost} disabled={uploading} className="bg-blue-600 px-4 py-2 rounded">{uploading? "Posting..." : "Post"}</button>
        </div>

        {posts.map(post => (
          <div key={post.id} className="bg-gray-900 p-4 rounded-xl mb-4">
            <p className="font-bold">{post.userEmail}</p>
            <p className="my-2">{post.text}</p>
            {post.image && <img src={post.image} className="rounded-lg mb-2"/>}
            <div className="flex gap-4">
              <button onClick={()=>handleLike(post.id, post.likes)} className="flex items-center gap-1">
                <Heart className={post.likes?.includes(user.uid)? "fill-red-500 text-red-500" : ""}/> {post.likes?.length || 0}
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
    }
