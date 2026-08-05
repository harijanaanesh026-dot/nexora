import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const styles = {
  body: {background:"#0a0a0a", color:"white", fontFamily:"Arial", margin:0, padding:0, minHeight:"100vh"},
  nav: {display:"flex", justifyContent:"space-around", padding:12, borderBottom:"1px solid #333", position:"sticky", top:0, background:"#0a0a0a"},
  btn: {background:"#22c55e", color:"white", border:"none", padding:"10px 20px", borderRadius:8, cursor:"pointer"},
  btn2: {background:"#3b82f6", color:"white", border:"none", padding:"5px 10px", borderRadius:5, cursor:"pointer", fontSize:12},
  card: {background:"#1a1a1a", padding:15, margin:15, borderRadius:10},
  input: {width:"95%", padding:10, margin:"5px 0", background:"#333", border:"none", color:"white", borderRadius:5},
  flex: {display:"flex", alignItems:"center", gap:10}
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u) {
        const docSnap = await getDoc(doc(db, "users", u.uid));
        if(!docSnap.exists()) setDoc(doc(db, "users", u.uid), {name: u.displayName, photo: u.photoURL, bio: "", skills: "", goals: "", following: []});
        onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
      }
    });
  }, []);

  if (!user) return (
    <div style={{...styles.body, textAlign:"center", paddingTop:100}}>
      <h1 style={{fontSize:40}}>ConnectAI</h1>
      <p>AI-Powered Social Platform</p>
      <button style={styles.btn} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Continue with Google</button>
    </div>
  )

  return (
    <div style={styles.body}>
      <div style={styles.nav}>
        {["home","profile","ai","chat","communities","notify"].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:"none", border:"none", color:tab===t?"#22c55e":"white", textTransform:"capitalize"}}>{t}</button>)}
        <button onClick={()=>signOut(auth)} style={{background:"none", border:"none", color:"red"}}>Logout</button>
      </div>

      {tab === "home" && <HomeFeed user={user} users={users} db={db} storage={storage}/>}
      {tab === "profile" && <ProfilePage user={user} db={db}/>}
      {tab === "ai" && <AIMatch user={user} users={users}/>}
      {tab === "chat" && <ChatPage user={user} users={users} db={db}/>}
      {tab === "communities" && <CommunitiesPage user={user} db={db}/>}
      {tab === "notify" && <NotifyPage user={user} db={db}/>}
    </div>
  )
}

// ===== PROFILE =====
function ProfilePage({user, db}) {
  const [profile, setProfile] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setProfile(d.data())) },[]);
  const save = async () => { await setDoc(doc(db,"users",user.uid), profile, {merge:true}); alert("Saved!") }
  return (
    <div style={styles.card}>
      <h2>Your Profile</h2>
      <img src={profile.photo} style={{width:80, height:80, borderRadius:"50%"}}/>
      <input style={styles.input} placeholder="Bio" value={profile.bio||""} onChange={e=>setProfile({...profile,bio:e.target.value})}/>
      <input style={styles.input} placeholder="Skills: React, AI" value={profile.skills||""} onChange={e=>setProfile({...profile,skills:e.target.value})}/>
      <input style={styles.input} placeholder="Goals" value={profile.goals||""} onChange={e=>setProfile({...profile,goals:e.target.value})}/>
      <button style={styles.btn} onClick={save}>Save</button>
    </div>
  )
}

// ===== HOME FEED =====
function HomeFeed({user, users, db, storage}) {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState(""); const [file, setFile] = useState(null);

  useEffect(()=>{
    const q = query(collection(db,"posts"), orderBy("createdAt","desc"));
    onSnapshot(q, snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  const post = async()=>{
    let img=""; if(file){const r=ref(storage,`posts/${Date.now()}`); await uploadBytes(r,file); img=await getDownloadURL(r);}
    await addDoc(collection(db,"posts"),{uid:user.uid, name:user.displayName, photo:user.photoURL, text, image:img, likes:[], comments:[], createdAt:serverTimestamp()});
    setText(""); setFile(null);
  }

  const like = async (id, likes) => {
    const ref = doc(db,"posts",id);
    likes.includes(user.uid)? updateDoc(ref,{likes:arrayRemove(user.uid)}) : updateDoc(ref,{likes:arrayUnion(user.uid)});
  }

  return (
    <div>
      <div style={styles.card}>
        <textarea style={styles.input} placeholder="What's on your mind?" value={text} onChange={e=>setText(e.target.value)}/>
        <input type="file" onChange={e=>setFile(e.target.files[0])} style={{margin:"10px 0"}}/>
        <button style={styles.btn} onClick={post}>Post</button>
      </div>
      {posts.map(p=>(
        <div key={p.id} style={styles.card}>
          <div style={styles.flex}><img src={p.photo} style={{width:40,height:40,borderRadius:"50%"}}/><b>{p.name}</b><FollowBtn current={user} target={p.uid} db={db}/></div>
          <p>{p.text}</p>
          {p.image && <img src={p.image} style={{width:"100%", borderRadius:8, marginTop:10}}/>}
          <button onClick={()=>like(p.id,p.likes)} style={{background:"none",border:"none",color:"white"}}>❤️ {p.likes?.length}</button>
          <CommentBox postId={p.id} comments={p.comments} user={user} db={db}/>
        </div>
      ))}
    </div>
  )
}

function CommentBox({postId,comments,user,db}){
  const [c,setC]=useState("");
  const send=async()=>{
    if(!c) return;
    await updateDoc(doc(db,"posts",postId), {comments: arrayUnion({uid:user.uid, name:user.displayName, text:c, time:Date.now()})});
    setC("");
  }
  return(
    <div style={{marginTop:10}}>
      {comments?.map((com,i)=><p key={i} style={{fontSize:14}}><b>{com.name}:</b> {com.text}</p>)}
      <div style={styles.flex}><input style={styles.input} value={c} onChange={e=>setC(e.target.value)}/><button style={styles.btn2} onClick={send}>Send</button></div>
    </div>
  )
}

function FollowBtn({current,target,db}){
  const [following,setFollowing]=useState(false);
  useEffect(()=>{getDoc(doc(db,"users",current.uid)).then(d=>setFollowing(d.data()?.following?.includes(target)) )},[]);
  const toggle=async()=>{
    const ref=doc(db,"users",current.uid);
    following? updateDoc(ref,{following:arrayRemove(target)}):updateDoc(ref,{following:arrayUnion(target)});
    setFollowing(!following);
  }
  return current.uid!==target && <button style={styles.btn2} onClick={toggle}>{following?"Following":"Follow"}</button>
}
// ===== AI PEOPLE MATCH =====
function AIMatch({user,users}){
  const me = users.find(u=>u.id===user.uid);
  const mySkill = me?.skills?.split(",")[0]?.toLowerCase();
  const matches = users.filter(u=>u.id!==user.uid && u.skills?.toLowerCase().includes(mySkill));
  return(
    <div style={styles.card}>
      <h2>AI People Match</h2>
      {matches.length===0?<p>No matches yet. Add skills in Profile.</p>:
      matches.map(u=>(
        <div key={u.id} style={{...styles.flex, margin:"10px 0"}}>
          <img src={u.photo} style={{width:40,height:40,borderRadius:"50%"}}/>
          <div><p style={{margin:0}}><b>{u.name}</b></p><p style={{margin:0,fontSize:12,color:"gray"}}>{u.skills}</p></div>
        </div>
      ))}
    </div>
  )
}

// ===== CHAT =====
function ChatPage({user,users,db}){
  const [to,setTo]=useState(null); const [msgs,setMsgs]=useState([]); const [msg,setMsg]=useState("");
  useEffect(()=>{
    if(!to) return;
    const chatId = [user.uid,to].sort().join("_");
    const q = query(collection(db,"chats",chatId,"messages"), orderBy("time"));
    onSnapshot(q,snap=>setMsgs(snap.docs.map(d=>d.data())));
  },[to]);
  const send=async()=>{
    const chatId = [user.uid,to].sort().join("_");
    await addDoc(collection(db,"chats",chatId,"messages"),{from:user.uid, text:msg, time:serverTimestamp()});
    setMsg("");
  }
  return(
    <div style={{display:"flex", height:"80vh"}}>
      <div style={{width:"30%", borderRight:"1px solid #333"}}>
        {users.filter(u=>u.id!==user.uid).map(u=><div key={u.id} onClick={()=>setTo(u.id)} style={{padding:10, cursor:"pointer"}}>{u.name}</div>)}
      </div>
      <div style={{flex:1, padding:10, display:"flex", flexDirection:"column"}}>
        {msgs.map((m,i)=><p key={i} style={{textAlign:m.from===user.uid?"right":"left"}}>{m.text}</p>)}
        <div style={{...styles.flex, marginTop:"auto"}}><input style={styles.input} value={msg} onChange={e=>setMsg(e.target.value)}/><button style={styles.btn} onClick={send}>Send</button></div>
      </div>
    </div>
  )
}

// ===== COMMUNITIES =====
function CommunitiesPage({user,db}){
  const [coms,setComs]=useState([]); const [name,setName]=useState("");
  useEffect(()=>{onSnapshot(collection(db,"communities"),snap=>setComs(snap.docs.map(d=>({id:d.id,...d.data()}))))},[]);
  const create=()=>addDoc(collection(db,"communities"),{name,members:[user.uid]});
  const join=(id)=>updateDoc(doc(db,"communities",id),{members:arrayUnion(user.uid)});
  return(
    <div style={styles.card}>
      <h2>Communities</h2>
      <div style={styles.flex}><input style={styles.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Community Name"/><button style={styles.btn} onClick={create}>Create</button></div>
      {coms.map(c=><div key={c.id} style={{...styles.flex, margin:"10px 0"}}>{c.name} <button style={styles.btn2} onClick={()=>join(c.id)}>{c.members?.includes(user.uid)?"Joined":"Join"}</button></div>)}
    </div>
  )
}

// ===== NOTIFICATIONS =====
function NotifyPage({user,db}){
  const [notifs,setNotifs]=useState([]);
  useEffect(()=>{
    const q = query(collection(db,"notifications"), where("to", "==", user.uid), orderBy("time","desc"));
    onSnapshot(q,snap=>setNotifs(snap.docs.map(d=>d.data())));
  },[]);
  return(
    <div style={styles.card}>
      <h2>Notifications</h2>
      {notifs.length===0?<p>No notifications</p>:
      notifs.map((n,i)=><p key={i}>{n.text}</p>)}
    </div>
  )
        }
