import { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDocs, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Home, MessageCircle, Users, User, Edit, Save, X, Camera, Send, Heart, LogOut } from 'lucide-react';
import AgoraRTC, { useRTCClient, useMicrophoneAndCameraTracks, useJoin, useLocalMicrophoneTrack, useLocalCameraTrack, usePublish, useRemoteUsers, useScreenCapture } from 'agora-rtc-react';

// ========== FIREBASE CONFIG - NEE KEYS ==========
const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058",
  measurementId: "G-11Y8XF8MBC"
};

const app = getApps().length? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ========== AGORA CONFIG ==========
const appId = "d87fed45cfe943caa09bcd88116d9974"; // ikkada nee full Agora App ID pettu

export default function NexoraApp() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [tab, setTab] = useState('feed');
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [postText, setPostText] = useState('');
  const [inGroupCall, setInGroupCall] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // AUTH CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if(currentUser){
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
        if(snap.empty){
          await setDoc(userRef, {
            uid: currentUser.uid,
            name: currentUser.displayName || "User",
            photo: currentUser.photoURL || "",
            coverPhoto: "",
            isVerified: false,
            username: "",
            bio: "",
            followers: [],
            following: [],
            xp: 0,
            createdAt: serverTimestamp()
          });
        }
        onSnapshot(userRef, (d) => setProfile(d.data()));
      } else { setUser(null); }
    });
    return unsub;
  }, []);

  // GET POSTS + USERS
  useEffect(() => {
    if(!user) return;
    onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => setPosts(snap.docs.map(d => ({id:d.id,...d.data()}))));
    onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d => d.data())));
  }, [user]);

  // FUNCTIONS
  const login = async () => { await signInWithEmailAndPassword(auth, email, password); }
  const googleLogin = async () => { await signInWithPopup(auth, new GoogleAuthProvider()); }
  const logout = () => signOut(auth);

  const createPost = async () => {
    if(!postText.trim()) return;
    await addDoc(collection(db, "posts"), {
      text: postText,
      authorId: user.uid,
      authorName: profile.name,
      authorPhoto: profile.photo,
      likes: [],
      createdAt: serverTimestamp()
    });
    setPostText('');
  }

  const toggleLike = async (postId:string, likes:string[]) => {
    const postRef = doc(db, "posts", postId);
    if(likes.includes(user.uid)) await updateDoc(postRef, {likes: arrayRemove(user.uid)});
    else await updateDoc(postRef, {likes: arrayUnion(user.uid)});
  }

  const handlePhotoUpload = async (e: any) => {
    const file = e.target.files[0]; if(!file) return;
    const snap = await uploadBytes(ref(storage, `profilePhotos/${user.uid}`), file);
    const url = await getDownloadURL(snap.ref);
    await updateDoc(doc(db, "users", user.uid), { photo: url });
  }

  const saveProfile = async () => {
    await updateDoc(doc(db, "users", user.uid), editData);
    setIsEditing(false);
  }

  // AGORA GROUP VIDEO CALL COMPONENT
  function GroupVideoCall({ channelName, onLeave }: any) {
    const client = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }));
    const { isLoading, localMicrophoneTrack, localCameraTrack } = useMicrophoneAndCameraTracks();
    const { join } = useJoin({ appid: appId, channel: channelName, token: null }, true);
    const { isMuted: isMicMuted, toggle: toggleMic } = useLocalMicrophoneTrack(localMicrophoneTrack);
    const { isMuted: isCamMuted, toggle: toggleCam } = useLocalCameraTrack(localCameraTrack);
    const { screenTrack, isScreenSharing, startScreenShare, stopScreenShare } = useScreenCapture();
    const remoteUsers = useRemoteUsers();
    usePublish(isScreenSharing? [screenTrack] : [localCameraTrack, localMicrophoneTrack]);
    useEffect(() => { if (!isLoading) join(); }, [isLoading]);

    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="grid grid-cols-2 gap-2 p-2 h-[80vh]">
          <video ref={node => { if (node) { if(isScreenSharing && screenTrack) screenTrack.play(node); else if(localCameraTrack) localCameraTrack.play(node); }}} autoPlay muted className="w-full h-full object-cover rounded"/>
          {remoteUsers.map((user) => <video key={user.uid} ref={node => {if(node) user.videoTrack?.play(node);}} autoPlay className="w-full h-full object-cover rounded" />)}
        </div>
        <div className="flex justify-center gap-3 p-4">
          <button onClick={toggleMic} className="p-3 bg-gray-700 rounded-full">{isMicMuted? '🔇' : '🎤'}</button>
          <button onClick={toggleCam} className="p-3 bg-gray-700 rounded-full">{isCamMuted? '📷❌' : '📷'}</button>
          <button onClick={async () => isScreenSharing? stopScreenShare() : startScreenShare()} className="p-3 bg-blue-600 rounded-full">🖥️</button>
          <button onClick={() => { client.leave(); onLeave(); }} className="p-3 bg-red-600 rounded-full">📞</button>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if(!user) return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-gray-900 p-8 rounded-2xl w-80">
        <h1 className="text-2xl font-bold mb-4 text-center">NEXORA Login</h1>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="bg-black p-2 rounded w-full mb-2"/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="bg-black p-2 rounded w-full mb-4"/>
        <button onClick={login} className="w-full bg-purple-600 p-2 rounded mb-2">Login</button>
        <button onClick={googleLogin} className="w-full bg-red-600 p-2 rounded">Google Login</button>
      </div>
    </div>
  );

  // MAIN APP
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="p-4 border-b border-gray-800 sticky top-0 bg-black"><h1 className="font-bold text-xl">NEXORA</h1></header>

      {tab==='feed' && <div className="p-4">
        <div className="bg-gray-900 p-3 rounded-2xl mb-4">
          <textarea value={postText} onChange={e=>setPostText(e.target.value)} placeholder="What's on your mind?" className="w-full bg-black p-3 rounded"/>
          <button onClick={createPost} className="bg-purple-600 px-4 py-2 rounded mt-2">Post</button>
        </div>
        {posts.map(p => (
          <div key={p.id} className="bg-gray-900/50 p-4 mt-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2"><img src={p.authorPhoto} className="w-8 h-8 rounded-full"/><p className="font-bold">{p.authorName}</p></div>
            <p>{p.text}</p>
            <button onClick={() => toggleLike(p.id, p.likes)} className="flex items-center gap-1 mt-2 text-red-500"><Heart size={18}/> {p.likes.length}</button>
          </div>
        ))}
      </div>}

      {tab==='rooms' && <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Group Video Room</h2>
        <button onClick={() => setInGroupCall(true)} className="bg-green-600 p-3 rounded w-full">Join Video Room</button>
        {inGroupCall && <GroupVideoCall channelName="General" onLeave={() => setInGroupCall(false)} />}
      </div>}

      {tab==='profile' && <div className="p-4">
        <div className="relative mb-4">
          <img src={profile.photo || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full"/>
          <label className="absolute bottom-0 left-12 bg-purple-600 p-1 rounded-full cursor-pointer"><Camera size={16}/><input type="file" onChange={handlePhotoUpload} className="hidden"/></label>
        </div>
        <p className="text-2xl font-bold">{profile.name}</p>
        {isEditing?
          <div><input value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} className="bg-gray-800 p-2 rounded w-full"/><button onClick={saveProfile} className="mt-2 bg-green-600 p-2 rounded"><Save/></button></div>
          : <button onClick={() => {setEditData(profile); setIsEditing(true);}} className="mt-2 bg-gray-700 p-2 rounded"><Edit/></button>
        }
        <button onClick={logout} className="w-full bg-red-600 py-3 rounded-xl font-bold mt-4 flex items-center justify-center gap-2"><LogOut/> Logout</button>
      </div>}

      <nav className="fixed bottom-0 w-full flex justify-around bg-black p-3 border-t border-gray-800">
        <button onClick={()=>setTab('feed')}><Home/></button>
        <button onClick={()=>setTab('rooms')}><Users/></button>
        <button onClick={()=>setTab('profile')}><User/></button>
      </nav>
    </div>
  );
  }
