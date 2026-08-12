import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, where, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { Home, MessageCircle, Users, User, Bell, Github, Instagram, Twitter, Edit, Save, X, Camera, Send, Heart, Bookmark } from 'lucide-react';
import AgoraRTC, { useRTCClient, useMicrophoneAndCameraTracks, useJoin, useLocalMicrophoneTrack, useLocalCameraTrack, usePublish, useRemoteUsers, useScreenCapture } from 'agora-rtc-react';

const appId = "d87fed45cfe943caa09bcd88116d9974"; // Agora nunchi teesko

export default function NexoraApp() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [tab, setTab] = useState('feed');
  const [theme, setTheme] = useState('dark');
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [viewProfile, setViewProfile] = useState<any>(null);

  // Auth
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  // Post
  const [postText, setPostText] = useState(''); const [postImage, setPostImage] = useState('');
  // Chat
  const [activeChat, setActiveChat] = useState<string | null>(null); const [chatMessages, setChatMessages] = useState<any[]>([]); const [chatText, setChatText] = useState('');
  // Calls
  const [inGroupCall, setInGroupCall] = useState(false); const [callChannel, setCallChannel] = useState("");
  // Profile Edit
  const [isEditing, setIsEditing] = useState(false); const [editData, setEditData] = useState<any>({}); const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // Admin
  const [requests, setRequests] = useState<any[]>([]);

  const themeClass = theme === 'dark'? 'bg-black text-white' : 'bg-white text-black';

  // AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if(currentUser){
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
        if(snap.empty){
          await setDoc(userRef, {uid: currentUser.uid, name: currentUser.displayName, photo: currentUser.photoURL, coverPhoto: "", isVerified: false, username: "", bio: "", country: "India", skills: [], followers: [], following: [], xp: 0, createdAt: serverTimestamp()});
        }
        const unsubProfile = onSnapshot(userRef, (d) => setProfile(d.data()));
      } else { setUser(null); }
    });
    return unsub;
  }, []);

  // DATA
  useEffect(() => {
    if(!user) return;
    onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => setPosts(snap.docs.map(d => ({id:d.id,...d.data()}))));
    onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d => d.data())));
    if(user.email === "youradminemail@gmail.com") onSnapshot(collection(db, "verificationRequests"), snap => setRequests(snap.docs.map(d => ({id:d.id,...d.data()}))));
  }, [user]);
    // FUNCTIONS
  const login = async () => { await signInWithEmailAndPassword(auth, email, password); }
  const googleLogin = async () => { await signInWithPopup(auth, new GoogleAuthProvider()); }
  const logout = () => signOut(auth);

  const createPost = async () => {
    if(!postText.trim()) return;
    await addDoc(collection(db, "posts"), {text: postText, image: postImage, authorId: user.uid, authorName: profile.name, authorPhoto: profile.photo, likes: [], comments: [], createdAt: serverTimestamp()});
    setPostText(''); setPostImage('');
  }

  const toggleLike = async (postId:string, likes:string[]) => {
    const postRef = doc(db, "posts", postId);
    if(likes.includes(user.uid)) await updateDoc(postRef, {likes: arrayRemove(user.uid)});
    else await updateDoc(postRef, {likes: arrayUnion(user.uid)});
  }

  const toggleFollow = async (targetId:string) => {
    const myRef = doc(db, "users", user.uid);
    if(profile.following?.includes(targetId)) await updateDoc(myRef, {following: arrayRemove(targetId)});
    else await updateDoc(myRef, {following: arrayUnion(targetId)});
  }

  const startChat = (targetId:string) => { setActiveChat(targetId); setTab('chat'); }
  useEffect(() => {
    if(!activeChat) return;
    const chatId = [user.uid, activeChat].sort().join("_");
    onSnapshot(query(collection(db, "chats", chatId, "messages"), orderBy("createdAt")), snap => setChatMessages(snap.docs.map(d => d.data())));
  }, [activeChat]);
  const sendMessage = async () => {
    const chatId = [user.uid, activeChat].sort().join("_");
    await addDoc(collection(db, "chats", chatId, "messages"), {text: chatText, sender: user.uid, createdAt: serverTimestamp()});
    setChatText('');
  }

  const handlePhotoUpload = async (e: any) => {
    const file = e.target.files[0]; if(!file) return; setUploadingPhoto(true);
    const snap = await uploadBytes(ref(storage, `profilePhotos/${user.uid}`), file);
    const url = await getDownloadURL(snap.ref);
    await updateDoc(doc(db, "users", user.uid), { photo: url }); setUploadingPhoto(false);
  }
  const handleCoverUpload = async (e: any) => {
    const file = e.target.files[0]; if(!file) return;
    const snap = await uploadBytes(ref(storage, `coverPhotos/${user.uid}`), file);
    const url = await getDownloadURL(snap.ref);
    await updateDoc(doc(db, "users", user.uid), { coverPhoto: url });
  }
  const saveProfile = async () => {
    await updateDoc(doc(db, "users", user.uid), editData);
    setIsEditing(false);
  }
  const requestVerification = async () => {
    await addDoc(collection(db, "verificationRequests"), {uid: user.uid, name: profile.name, username: profile.username, status: "pending"});
    alert("Request Sent!");
    }
    // COMPONENTS
  function GroupVideoCall({ channelName, onLeave }: any) {
    const client = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }));
    const { isLoading, localMicrophoneTrack, localCameraTrack } = useMicrophoneAndCameraTracks(true, true);
    const { join } = useJoin({ appid: appId, channel: channelName, token: null }, true);
    const { isMuted: isMicMuted, toggle: toggleMic } = useLocalMicrophoneTrack(localMicrophoneTrack);
    const { isMuted: isCamMuted, toggle: toggleCam } = useLocalCameraTrack(localCameraTrack);
    const { screenTrack, isScreenSharing, startScreenShare, stopScreenShare } = useScreenCapture();
    const remoteUsers = useRemoteUsers();
    usePublish(isScreenSharing? [screenTrack, localMicrophoneTrack] : [localCameraTrack, localMicrophoneTrack]);
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

  function StoriesBar() {
    const [stories, setStories] = useState<any[]>([]);
    useEffect(() => { onSnapshot(query(collection(db, "stories"), where("expiresAt", ">", new Date())), snap => setStories(snap.docs.map(d => ({id:d.id,...d.data()})))); }, []);
    return <div className="flex gap-3 overflow-x-auto p-4"><label className="w-16 h-20 bg-gray-800 rounded-xl flex items-center justify-center cursor-pointer">+<input type="file" className="hidden" /></label>{stories.map(s => <img key={s.id} src={s.image} className="w-16 h-20 rounded-xl"/>)}</div>
  }
    // MAIN UI
  if(!user) return <div className={`min-h-screen flex items-center justify-center ${themeClass}`}><div className="bg-gray-900 p-8 rounded-2xl"><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="bg-black p-2 rounded w-full mb-2"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="bg-black p-2 rounded w-full mb-4"/><button onClick={login} className="w-full bg-purple-600 p-2 rounded">Login</button><button onClick={googleLogin} className="w-full bg-red-600 p-2 rounded mt-2">Google</button></div></div>;

  return (
    <div className={`min-h-screen ${themeClass}`}>
      <header className="p-4 border-b border-gray-800 flex justify-between"><h1 className="font-bold text-xl">NEXORA</h1><button onClick={() => setTheme(theme==='dark'? 'light' : 'dark')}>{theme==='dark'? '☀️' : '🌙'}</button></header>

      {tab==='feed' && <div><StoriesBar/><div className="p-4"><textarea value={postText} onChange={e=>setPostText(e.target.value)} placeholder="What's on your mind?" className="w-full bg-gray-900 p-3 rounded"/><button onClick={createPost} className="bg-purple-600 px-4 py-2 rounded mt-2">Post</button></div>{posts.map(p => <div key={p.id} className="bg-gray-900/50 p-4 m-4 rounded-2xl"><p>{p.text}</p>{p.image && <img src={p.image} className="rounded mt-2"/>}<button onClick={() => toggleLike(p.id, p.likes)}><Heart/> {p.likes.length}</button></div>)}</div>}

      {tab==='chat' && <div>{users.map(u => <div key={u.uid} onClick={() => startChat(u.uid)}>{u.name}</div>)}{activeChat && <div>{chatMessages.map(m => <p>{m.text}</p>)}<input value={chatText} onChange={e=>setChatText(e.target.value)}/><button onClick={sendMessage}><Send/></button></div>}</div>}

      {tab==='rooms' && <div className="p-4"><button onClick={() => {setCallChannel("General"); setInGroupCall(true);}} className="bg-green-600 p-3 rounded">Join Video Room</button>{inGroupCall && <GroupVideoCall channelName={callChannel} onLeave={() => setInGroupCall(false)} />}</div>}

      {tab==='profile' && <div className="p-4">
        <img src={profile.coverPhoto} className="h-32 w-full object-cover rounded-t-2xl"/>{isEditing && <input type="file" onChange={handleCoverUpload}/>}
        <img src={profile.photo} className="w-20 h-20 rounded-full -mt-10 border-4 border-black"/>{isEditing && <input type="file" onChange={handlePhotoUpload}/>}
        <p>{profile.name} {profile.isVerified && '✅'}</p>
        {isEditing? <div><input value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})}/><button onClick={saveProfile}>Save</button></div> : <button onClick={() => {setEditData(profile); setIsEditing(true);}}><Edit/></button>}
        {!profile.isVerified && <button onClick={requestVerification}>Request Verify</button>}
        <div className="grid grid-cols-3 gap-1">{posts.filter(p => p.authorId === user.uid).map(p => <img key={p.id} src={p.image} />)}</div>
      </div>}

      {tab==='admin' && user.email === "youradminemail@gmail.com" && <div>{requests.map(r => <div>{r.name}<button onClick={async () => {await updateDoc(doc(db, "users", r.uid), {isVerified: true}); await deleteDoc(doc(db, "verificationRequests", r.id));}}>Approve</button></div>)}</div>}

      <nav className="fixed bottom-0 w-full flex justify-around bg-black p-3 border-t border-gray-800">
        <button onClick={()=>setTab('feed')}><Home/></button>
        <button onClick={()=>setTab('chat')}><MessageCircle/></button>
        <button onClick={()=>setTab('rooms')}><Users/></button>
        <button onClick={()=>setTab('profile')}><User/></button>
        {user.email === "youradminemail@gmail.com" && <button onClick={()=>setTab('admin')}>A</button>}
      </nav>

      <footer className="p-6 mt-20 text-center text-gray-500"><div className="flex justify-center gap-4"><Github/><Instagram/><Twitter/></div><p>© 2026 NEXORA</p></footer>
    </div>
  );
}
