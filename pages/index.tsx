import { useState, useEffect } from "react";
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { getStorage } from "firebase/storage";
import { initializeApp, getApps } from "firebase/app";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

// ---------------- FIREBASE CONFIG ----------------
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
const app = getApps().length === 0? initializeApp(firebaseConfig) : getApps()[0];
const storage = getStorage(app);

// ---------------- AGORA CONFIG ----------------
const appId = process.env.d87fed45cfe943caa09bcd88116d9974 || "";
const client: IAgoraRTCClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

export default function HomePage() {
  const [page, setPage] = useState<"landing" | "auth" | "dashboard" | "video">("landing");
  const [channelName, setChannelName] = useState("test");
  const [joined, setJoined] = useState(false);
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const handleJoin = async () => {
    if (!appId) return alert("Agora App ID missing in Vercel Env");
    setPage("video");
    const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    setLocalTracks([micTrack, camTrack]);
    await client.join(appId, channelName, null, null);
    await client.publish([micTrack, camTrack]);
    setJoined(true);
  };

  const handleLeave = async () => {
    localTracks?.forEach(track => track.close());
    await client.leave();
    setJoined(false);
    setRemoteUsers([]);
    setPage("dashboard");
  };

  useEffect(() => {
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        setRemoteUsers((prev) => [...prev.filter(u => u.uid!== user.uid), user]);
      }
    });
    client.on("user-left", (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid!== user.uid));
    });
  }, []);

  useEffect(() => {
    if (localTracks?.[1]) {
      localTracks[1].play("local-player");
    }
  }, [localTracks]);

  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.videoTrack) {
        user.videoTrack.play(`remote-${user.uid}`);
      }
    });
  }, [remoteUsers]);

  const toggleMic = () => { localTracks?.[0].setEnabled(!micOn); setMicOn(!micOn); };
  const toggleCam = () => { localTracks?.[1].setEnabled(!camOn); setCamOn(!camOn); };

  if (page === "landing") return (<div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 text-white flex-col items-center justify-center p-8"><h1 className="text-5xl font-bold mb-4">Nexora</h1><button onClick={() => setPage("auth")} className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold">Get Started</button></div>);
  if (page === "auth") return (<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="bg-white p-8 rounded-lg shadow-md w-96"><h2 className="text-2xl font-bold mb-4">Login</h2><button onClick={() => setPage("dashboard")} className="w-full bg-purple-600 text-white py-2 rounded">Continue</button></div></div>);
  if (page === "dashboard") return (<div className="min-h-screen bg-gray-50"><header className="bg-white shadow p-4"><h1 className="text-2xl font-bold text-purple-600">Nexora</h1></header><main className="p-8"><h2 className="text-3xl font-bold mb-6">Dashboard</h2><div className="bg-white p-6 rounded-lg shadow"><input value={channelName} onChange={(e) => setChannelName(e.target.value)} className="border p-2 rounded w-full mb-4" placeholder="Enter Room Name"/><button onClick={handleJoin} className="bg-green-600 text-white px-6 py-2 rounded font-bold">Join Video Room</button></div></main></div>);
  if (page === "video") return (
    <div className="relative h-screen bg-black">
      <div className="grid grid-cols-2 gap-4 p-4 h-[90vh]">
        <div className="bg-gray-800 rounded-lg"><div id="local-player" className="h-full w-full"></div><p className="text-white text-center">You</p></div>
        {remoteUsers.map((user) => (<div key={user.uid} className="bg-gray-800 rounded-lg"><div id={`remote-${user.uid}`} className="h-full w-full"></div><p className="text-white text-center">User {user.uid}</p></div>))}
      </div>
      <div className="absolute bottom-0 w-full bg-gray-900 p-4 flex justify-center gap-4">
        <button onClick={toggleMic} className="bg-gray-700 p-3 rounded-full text-white">{micOn? <Mic /> : <MicOff />}</button>
        <button onClick={toggleCam} className="bg-gray-700 p-3 rounded-full text-white">{camOn? <Video /> : <VideoOff />}</button>
        <button onClick={handleLeave} className="bg-red-600 p-3 rounded-full text-white"><PhoneOff /></button>
      </div>
    </div>
  );
  return null;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
