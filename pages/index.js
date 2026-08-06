"use client"
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, serverTimestamp, increment, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const styles = {
  body: {background:"radial-gradient(ellipse at top, #0A0F2E 0%, #050A18 100%)", color:"#E2E8F0", fontFamily:"'Inter', sans-serif", margin:0, paddingBottom:80, minHeight:"100vh"},
  header: {display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #1E293B", position:"sticky", top:0, background:"rgba(5,10,24,0.8)", backdropFilter:"blur(10px)", zIndex:10},
  logo: {fontSize:24, fontWeight:"800", background: "linear-gradient(90deg, #38BDF8, #A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"},
  bottomNav: {display:"flex", justifyContent:"space-around", padding:"12px 0", borderTop:"1px solid #1E293B", position:"fixed", bottom:0, width:"100%", background:"rgba(5,10,24,0.9)", backdropFilter:"blur(10px)", fontSize:24},
  card: {background:"rgba(15,23,42,0.7)", backdropFilter:"blur(10px)", border:"1px solid #1E293B", margin:"16px", borderRadius:16, overflow:"hidden"},
  btnPrimary: {background:"linear-gradient(90deg, #38BDF8, #A855F7)", border:"none", color:"white", padding:"12px 20px", borderRadius:12, fontWeight:"700", cursor:"pointer"},
  btnGhost: {background:"#1E293B", border:"1px solid #334155", color:"white", padding:"10px 16px", borderRadius:12, cursor:"pointer"},
  input: {background:"#1E293B", border:"1px solid #334155", color:"white", width:"100%", padding:12, borderRadius:12, fontSize:14, boxSizing:"border-box"},
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("feed");
  const [notif, setNotif] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u) {
        const userRef = doc(db, "users", u.uid);
        if(!(await getDoc(userRef)).exists())
          setDoc(userRef, {name: u.displayName, photo: u.photoURL, bio: "", country: "India", xp: 0, streak: 0, friends: []});

        // NOTIFICATIONS LISTENER
        onSnapshot(query(collection(db,"notifications"), where("to", "==", u.uid), orderBy("createdAt","desc")), snap=>{
          setNotif(snap.docs.map(d=>({id:d.id,...d.data()})))
        })
      }
    });
  }, []);

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={styles.logo}>NEXORA 🌍</h2>
        <div style={{display:"flex", gap:16}}>
          <span onClick={()=>setTab("notif")}>🔔 {notif.filter(n=>!n.read).length}</span>
          <span onClick={()=>setTab("profile")}>👤</span>
        </div>
      </div>

      {!user && <AuthWall/>}

      {user && <>
        {tab === "feed" && <GlobalFeed user={user}/>}
        {tab === "create" && <CreatePost user={user}/>}
        {tab === "friends" && <FriendsPage user={user} setTab={setTab}/>}
        {tab === "chat" && <ChatPage user={user}/>}
        {tab === "notif" && <NotifPage notif={notif}/>}
        {tab === "profile" && <ProfilePage user={user}/>}
      </>}

      {user && <div style={styles.bottomNav}>
        <span onClick={()=>setTab("feed")}>🌍</span>
        <span onClick={()=>setTab("friends")}>👥</span>
        <span onClick={()=>setTab("create")}>➕</span>
        <span onClick={()=>setTab("notif")}>🔔</span>
      </div>}
    </div>
  )
}

function AuthWall() {
  return(
    <div style={{textAlign:"center", padding:60}}>
      <h2 style={styles.logo}>NEXORA GLOBAL</h2>
      <button style={styles.btnPrimary} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Continue with Google</button>
    </div>
  )
}

// ===== 1. 🌍 GLOBAL FEED WITH IMAGE =====
function GlobalFeed({user}) {
  const [posts, setPosts] = useState([]);
  useEffect(()=>{ onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc")), snap=>{ setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))) }) },[]);

  const likePost = async (postId, postUserId) => {
    await updateDoc(doc(db, "posts", postId), {likes: arrayUnion(user.uid)});
    if(postUserId!== user.uid) {
      addDoc(collection(db,"notifications"), {to: postUserId, from: user.displayName, type: "like", text: `${user.displayName} liked your post`, read: false, createdAt: serverTimestamp()})
    }
  }

  return(<div>
    <div style={{padding:"16px"}}><h3>Global Builder Feed</h3></div>
    {posts.map(p=>(
      <div key={p.id} style={styles.card}>
        <div style={{display:"flex", alignItems:"center", gap:10, padding:14}}>
          <img src={p.photo} style={{width:40,height:40,borderRadius:"50%", border:"2px solid #38BDF8"}}/>
          <div><b>{p.name}</b><p style={{fontSize:12}}>📍 {p.country}</p></div>
        </div>
        <p style={{padding:"0 16px"}}>{p.built}</p>
        {p.imageUrl && <img src={p.imageUrl} style={{width:"100%", maxHeight:400, objectFit:"cover"}}/>}
        <div style={{display:"flex", gap:20, padding:"10px 16px"}}>
          <span onClick={()=>likePost(p.id, p.uid)}>🔥 {p.likes?.length}</span>
        </div>
      </div>
    ))}
  </div>)
}

// ===== 2. 👥 FRIENDS + DM BUTTON =====
function FriendsPage({user, setTab}) {
  const [users, setUsers] = useState([]);
  const [chatWith, setChatWith] = useState(null);
  useEffect(()=>{ onSnapshot(collection(db,"users"), snap=>{ setUsers(snap.docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.id!==user.uid)) }) },[]);

  const openChat = (friend) => {
    setChatWith(friend);
    setTab("chat");
  }

  return(<div style={{padding:16}}>
    <h3>Find Friends</h3>
    {users.map(u=>(
      <div key={u.id} style={{...styles.card, display:"flex", justifyContent:"space-between", alignItems:"center", padding:12}}>
        <div style={{display:"flex", gap:10}}>
          <img src={u.photo} style={{width:40,height:40,borderRadius:"50%"}}/>
          <div><b>{u.name}</b><p style={{fontSize:12}}>📍 {u.country}</p></div>
        </div>
        <button style={styles.btnGhost} onClick={()=>openChat(u)}>💬 DM</button>
      </div>
    ))}
  </div>)
}

// ===== 3. 💬 DM CHAT =====
function ChatPage({user}) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const friend = {id: "temp_friend_id", name: "Friend"}; // Real ga FriendsPage nundi friend.id pass cheyali

  useEffect(()=>{
    const chatId = [user.uid, friend.id].sort().join("_");
    onSnapshot(query(collection(db,"chats", chatId, "messages"), orderBy("createdAt")), snap=>{
      setMsgs(snap.docs.map(d=>d.data()))
    })
  },[]);

  const sendMsg = async() => {
    if(!text) return;
    const chatId = [user.uid, friend.id].sort().join("_");
    await addDoc(collection(db,"chats", chatId, "messages"), {
      from: user.uid, text, createdAt: serverTimestamp()
    });
    addDoc(collection(db,"notifications"), {to: friend.id, from: user.displayName, type: "dm", text: `New message from ${user.displayName}`, read: false, createdAt: serverTimestamp()})
    setText("");
  }

  return(<div style={{padding:16}}>
    <h3>Chat with {friend.name}</h3>
    <div style={{height:"60vh", overflowY:"auto", background:"#0F172A", padding:16, borderRadius:12}}>
      {msgs.map((m,i)=><p key={i} style={{textAlign: m.from===user.uid?"right":"left"}}><b>{m.from===user.uid?"You":"Friend"}:</b> {m.text}</p>)}
    </div>
    <div style={{display:"flex", gap:8, marginTop:10}}>
      <input style={styles.input} value={text} onChange={e=>setText(e.target.value)} placeholder="Type message..."/>
      <button style={styles.btnPrimary} onClick={sendMsg}>Send</button>
    </div>
  </div>)
}

// ===== 4. ➕ CREATE POST WITH IMAGE UPLOAD =====
function CreatePost({user}) {
  const [built, setBuilt] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const post = async()=>{
    if(!built) return alert("Write something");
    setUploading(true);
    let imageUrl = "";

    if(file) {
      const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
      const snap = await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(snap.ref);
    }

    await addDoc(collection(db,"posts"),{
      uid:user.uid, name:user.displayName, photo:user.photoURL, country: "India",
      built, imageUrl, likes:[], createdAt:serverTimestamp()
    });
    updateDoc(doc(db,"users",user.uid), {streak: increment(1), xp: increment(100)});
    setBuilt(""); setFile(null); setUploading(false); alert("Posted! +100 XP");
  }

  return(<div style={{padding:20}}><h2>Share to World 🌍</h2>
    <textarea style={{...styles.input,height:100}} placeholder="What did you build today?" value={built} onChange={e=>setBuilt(e.target.value)}/>
    <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])} style={{margin:"10px 0"}}/>
    <button style={styles.btnPrimary} onClick={post} disabled={uploading}>{uploading? "Uploading..." : "Post Globally 🚀"}</button>
  </div>)
}

// ===== 5. 🔔 NOTIFICATIONS =====
function NotifPage({notif}) {
  return(<div style={{padding:16}}>
    <h3>Notifications</h3>
    {notif.map(n=>(
      <div key={n.id} style={{...styles.card, padding:12, background: n.read? "#1E293B" : "rgba(56,189,248,0.2)"}}>
        <p><b>{n.from}</b>: {n.text}</p>
      </div>
    ))}
  </div>)
}

// ===== 6. 👤 PROFILE =====
function ProfilePage({user}) {
  const [p, setP] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setP(d.data())) },[]);
  return (<div style={{padding:20, textAlign:"center"}}>
    <img src={p.photo} style={{width:100,height:100,borderRadius:"50%", border:"3px solid #38BDF8"}}/>
    <h2>{p.name}</h2>
    <p>XP: {p.xp} | Streak: {p.streak} 🔥</p>
    <button style={{...styles.btnPrimary, background:"#F87171", marginTop:20}} onClick={()=>signOut(auth)}>Logout</button>
  </div>)
  }
