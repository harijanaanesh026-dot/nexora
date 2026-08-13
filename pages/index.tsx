import { useState, useEffect, useRef } from "react";
import { Heart, Users, BadgeCheck, Image as ImageIcon, Mic, MicOff, Video, VideoOff, PhoneOff, Send } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

// AGORA CONFIG - NEE AGORA APP ID AKKADA PETTU
const AGORA_APP_ID = "0e76b7daaa4b47cba8e18d1697d72";

// DUMMY POSTS DATA
const initialPosts = [
  { id: "1", user: "Anesh", text: "Nexora launch chesam guys! 🔥", image: "https://picsum.photos/seed/1/600/400", likes: 12 },
  { id: "2", user: "Priya", text: "First post in Nexora", image: "", likes: 5 },
  { id: "3", user: "Rahul", text: "Video rooms super unnayi", image: "https://picsum.photos/seed/2/600/400", likes: 28 },
];

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
      const uid = Math.floor(Math.random() * 100000); // Random user ID
      await agoraClient.join(AGORA_APP_ID, channel, null, uid);
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
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [newPost, setNewPost] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [roomChannel, setRoomChannel] = useState("main-room");
  const [isPaidRoom, setIsPaidRoom] = useState(false);

  const handlePost = () => {
    if (!newPost) return;
    const post = { id: Date.now().toString(), user: "Guest", text: newPost, image: "", likes: 0 };
    setPosts([post,...posts]);
    setNewPost("");
    toast.success("Posted!");
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(p => p.id === postId? {...p, likes: p.likes + 1} : p));
  };

  if (inRoom) return <VideoRoom channel={roomChannel} onLeave={() => setInRoom(false)} isPaid={isPaidRoom} />;

  return (
    <div className="bg-black text-white min-h-screen">
      <Toaster position="top-right" />
      <header className="sticky top-0 bg-gray-900/80 backdrop-blur p-4 flex justify-between items-center z-20 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Nexora</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => {setRoomChannel("free-room"); setIsPaidRoom(false); setInRoom(true)}} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
            <Users size={18} /> Free Room
          </button>
          <button onClick={() => {setRoomChannel("paid-room"); setIsPaidRoom(true); setInRoom(true)}} className="flex items-center gap-2 p-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-500">
            <BadgeCheck size={18} /> Premium
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-gray-900 p-4 rounded-xl mb-6 border-gray-800">
          <textarea value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="What's on your mind, Guest?" className="w-full bg-gray-800 p-3 rounded mb-2 border border-gray-700"/>
          <button onClick={handlePost} className="bg-blue-600 px-5 py-2 rounded-lg font-bold flex items-center gap-2">
            <Send size={16}/> Post
          </button>
        </div>

        {posts.map(post => (
          <motion.div key={post.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-gray-900 p-4 rounded-xl mb-4 border border-gray-800">
            <p className="font-bold">@{post.user}</p>
            <p className="my-2">{post.text}</p>
            {post.image && <img src={post.image} className="rounded-lg mb-2 w-full"/>}
            <div className="flex gap-4 text-gray-400">
              <button onClick={()=>handleLike(post.id)} className="flex items-center gap-1 hover:text-red-500">
                <Heart size={18}/> {post.likes}
              </button>
            </div>
          </motion.div>
        ))}
      </main>
    </div>
  );
}
