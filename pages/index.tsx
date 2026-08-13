import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Heart, LogOut, Users, BadgeCheck, Image as ImageIcon, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyATgYb90gVCrAzhuz2a3k10kdy8bqB4",
  authDomain: "nexoraai-75aez.firebaseapp.com",
  projectId: "nexoraai-75aez",
  storageBucket: "nexoraai-75aez.appspot.com",
  messagingSenderId: "713122171177",
  appId: "1:713122171177:wb:8b6a73598b10b0c8ed85P",
};

const app = getApps().length === 0? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// AGORA CONFIG - NEE AGORA APP ID AKKADA PETTU
const AGORA_APP_ID = "0e76b7daaa4b47cba8e18d1697d72";

// VIDEOROOM COMPONENT
function VideoRoom({ channel, onLeave, isPaid }: { channel: string; onLeave: () => void; isPaid: boolean }) {
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);
  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [localTracks, setLocalTracks] = useState<any>({ audio: null, video: null });
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const localRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("agora-rtc-sdk-ng").then((Agora) => {
      const client = Agora.default.createClient({ mode: "rtc", codec: "vp8" });
      setAgoraRTC(Agora.default);
      setAgoraClient(client);
    });
  }, []);

  useEffect(() => {
    if (!agoraClient ||!AgoraRTC) return;

    const init = async () => {
      await agoraClient.join(AGORA_APP_ID, channel, null, null);
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks({ audio: audioTrack, video: videoTrack });
      await agoraClient.publish([audioTrack, videoTrack]);
      if(localRef.current) videoTrack.play(localRef.current);
    };

    agoraClient.on("user-published", async (user: any, mediaType: string) => {
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

    agoraClient.on("user-unpublished", (user: any) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid!== user.uid));
    });

    init();
    return () => {
      localTracks.audio?.close();
      localTracks.video?.close();
      agoraClient.leave();
    };
  }, [agoraClient, AgoraRTC, channel]);

  const toggleMic = async () => { await localTracks.audio.setEnabled(!micOn); setMicOn(!micOn); };
  const toggleCam = async () => { await localTracks.video.setEnabled(!camOn); setCamOn(!camOn); };

  if (!AgoraRTC) return <div className="h-screen flex items-center justify-center bg-black">Loading Video...</div>

  return (
    <div className="relative h-screen bg-black text-white">
      {isPaid && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm z-20">Premium Room</div>}
      <div ref={localRef} className="absolute top-4 right-4 w-40 h-56 bg-gray-800 rounded-lg z-10"></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 h-[85vh] overflow-y-auto pt-24">
        {remoteUsers.map((user) => (<div key={user.uid} id={`player-${user.uid}`} className="bg-gray-900 rounded-lg aspect-video"></div>))}
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
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const [roomChannel, setRoomChannel] = useState("main-room");
  const [isPaidRoom, setIsPaidRoom] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if(!user) return;
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => { setPosts(snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }))); });
    return () => unsubscribe();
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Login Successful!");
    } catch {
      toast.error("Login Failed");
    }
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
    await addDoc(collection(db, "posts"), { text: newPost, image: imageUrl, userId: user.uid, userEmail: user.email, likes: [], createdAt: serverTimestamp() });
    setNewPost(""); setPostImage(null); setUploading(false); toast.success("Posted!");
  };

  const handleLike = async (postId: string, likes: string[]) => {
    const postRef = doc(db, "posts", postId);
    if (likes.includes(user.uid)) { await updateDoc(postRef, { likes: arrayRemove(user.uid) }); }
    else { await updateDoc(postRef, { likes: arrayUnion(user.uid) }); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>;

  // LOGIN CHEYAKAPOTHE EE SCREEN MATRAM CHUPINCHU
  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-black text-white p-4">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-full max-w-sm p-6 bg-gray-900 rounded-xl text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to Nexora</h1>
        <p className="text-gray-400 mb-6">Continue with Google to join</p>
        <button onClick={handleGoogleLogin} className="w-full bg-white text-black p-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-200">
          <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 2.053 29.268 0 24 0 10.745 0 10.745 0 24s10.745 24 24 24 24-10.745 24-24c0-1.658-.188-3.27-.533-4.917z"/></svg>
          Sign in with Google
        </button>
      </motion.div>
    </div>
  );

  if (inRoom) return <VideoRoom channel={roomChannel} onLeave={() => setInRoom(false)} isPaid={isPaidRoom} />;

  return (
    <div className="bg-black text-white min-h-screen">
      <Toaster position="top-right" />
      <header className="sticky top-0 bg-gray-900/80 backdrop-blur p-4 flex justify-between items-center z-20 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Nexora</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => {setRoomChannel("free-room"); setIsPaidRoom(false); setInRoom(true)}} className="p-2 bg-gray-800 rounded-full"><Users /></button>
          <button onClick={() => {setRoomChannel("paid-room"); setIsPaidRoom(true); setInRoom(true)}} className="p-2 bg-yellow-600 rounded-full"><BadgeCheck /></button>
          <button onClick={() => signOut(auth)} className="p-2 bg-gray-800 rounded-full"><LogOut /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-gray-900 p-4 rounded-xl mb-6 border-gray-800">
          <textarea value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="What's on your mind?" className="w-full bg-gray-800 p-3 rounded mb-2 border-gray-700"/>
          <div className="flex justify-between items-center">
            <label className="cursor-pointer p-2"><ImageIcon /></label>
            <input type="file" onChange={e=>setPostImage(e.target.files?.[0] || null)} className="hidden"/>
            <button onClick={handlePost} disabled={uploading} className="bg-blue-600 px-5 py-2 rounded-lg font-bold disabled:bg-gray-600">{uploading? "Posting..." : "Post"}</button>
          </div>
        </div>

        {posts.map(post => (
          <motion.div key={post.id} initial={{opacity:0}} animate={{opacity:1}} className="bg-gray-900 p-4 rounded-xl mb-4 border-gray-800">
            <p className="font-bold">{post.userEmail}</p>
            <p className="my-2">{post.text}</p>
            {post.image && <img src={post.image} className="rounded-lg mb-2 w-full"/>}
            <div className="flex gap-4 text-gray-400">
              <button onClick={()=>handleLike(post.id, post.likes || [])} className="flex items-center gap-1 hover:text-red-500">
                <Heart className={post.likes?.includes(user.uid)? "fill-red-500 text-red-500" : ""}/> {post.likes?.length || 0}
              </button>
            </div>
          </motion.div>
        ))}
      </main>
    </div>
  );
  }
