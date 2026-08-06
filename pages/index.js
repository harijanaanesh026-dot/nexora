import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, limit, where, increment } from "firebase/firestore";

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

// ===== NEXORA PREMIUM THEME =====
const styles = {
  body: {background:"linear-gradient(180deg,#050A18 0%, #0A0F1E 100%)", color:"#E2E8F0", fontFamily:"'Inter', sans-serif", margin:0, paddingBottom:80},
  header: {display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #1E293B", position:"sticky", top:0, background:"rgba(5,10,24,0.8)", backdropFilter:"blur(10px)", zIndex:10},
  logo: {fontSize:24, fontWeight:"800", background: "linear-gradient(90deg, #38BDF8, #A855F7, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"},
  bottomNav: {display:"flex", justifyContent:"space-around", padding:"12px 0", borderTop:"1px solid #1E293B", position:"fixed", bottom:0, width:"100%", background:"rgba(5,10,24,0.9)", backdropFilter:"blur(10px)", fontSize:22},
  card: {background:"#0F172A", border:"1px solid #1E293B", margin:"16px", borderRadius:16, overflow:"hidden"},
  btnPrimary: {background:"linear-gradient(90deg, #38BDF8, #A855F7)", border:"none", color:"white", padding:"12px 20px", borderRadius:12, fontWeight:"700", width:"100%", cursor:"pointer"},
  btnGhost: {background:"#1E293B", border:"1px solid #334155", color:"white", padding:"10px 16px", borderRadius:12, cursor:"pointer"},
  input: {background:"#1E293B", border:"1px solid #334155", color:"white", width:"100%", padding:12, borderRadius:12, fontSize:14, boxSizing:"border-box"},
  badge: {background:"linear-gradient(90deg, #F59E0B, #EC4899)", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700},
  streak: {background:"linear-gradient(90deg, #F97316, #EF4444)", padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700},
  score: {background:"linear-gradient(90deg, #22C55E, #16A34A)", padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700},
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatWith, setChatWith] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if(u) {
        const userRef = doc(db, "users", u.uid);
        if(!(await getDoc(userRef)).exists())
          setDoc(userRef, {
            name: u.displayName, photo: u.photoURL, bio: "", skills: "",
            goals: "", streak: 0, xp: 0, level: 1, revenue: 0,
            skillScore: 100, badges: [], followers: [], following: []
          });
        onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
      }
    });
  }, []);

  if (loading) return <div style={styles.body}><h1 style={styles.logo}>NexoraAI</h1></div>

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={styles.logo} onClick={()=>{setTab("home"); setChatWith(null)}}>NexoraAI</h2>
        <span>➕</span>
      </div>

      {chatWith? <DMChat user={user} otherUser={chatWith} db={db} onBack={()=>setChatWith(null)}/>
      :
        <>
          {tab === "home" && <HomeFeed user={user} users={users} db={db} setChatWith={setChatWith}/>}
          {tab === "discover" && <Discover user={user} users={users} setChatWith={setChatWith}/>}
          {tab === "create" && <AuthWall user={user}><CreatePost user={user} db={db} setTab={setTab}/></AuthWall>}
          {tab === "ai" && <AuthWall user={user}><AIAssistant user={user}/></AuthWall>}
          {tab === "profile" && <AuthWall user={user}><ProfilePage user={user} db={db} users={users} setChatWith={setChatWith}/></AuthWall>}
          {tab === "goals" && <AuthWall user={user}><GoalsPage user={user} db={db}/></AuthWall>}
          {tab === "startup" && <AuthWall user={user}><StartupHub user={user} db={db}/></AuthWall>}

          <div style={styles.bottomNav}>
            <span onClick={()=>{setTab("home"); setChatWith(null)}}>🏠</span>
            <span onClick={()=>{setTab("discover"); setChatWith(null)}}>🔍</span>
            <span onClick={()=>{setTab("create"); setChatWith(null)}}>➕</span>
            <span onClick={()=>{setTab("ai"); setChatWith(null)}}>🤖</span>
            <span onClick={()=>{setTab("profile"); setChatWith(null)}}>👤</span>
          </div>
        </>
      }
    </div>
  )
}

function AuthWall({user, children}) {
  if(!user) return(
    <div style={{textAlign:"center", padding:40}}>
      <h2 style={styles.logo}>NexoraAI</h2>
      <p>A social network where people don't just scroll—<br/>they build their future. 🚀</p>
      <button style={styles.btnPrimary} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Continue with Google</button>
    </div>
  )
  return children
    }
// ===== 1. 🏠 HOME - AI PERSONALIZED FEED =====
function HomeFeed({user, users, db, setChatWith}) {
  const [posts, setPosts] = useState([]);
  useEffect(()=>{ onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc"), limit(20)), snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()})))) },[]);
  return(
    <div>
      <div style={{padding:"16px"}}><h3>Trending: #AIFounder #BuildInPublic</h3></div>
      {posts.map(p=><Post key={p.id} post={p} user={user} db={db} setChatWith={setChatWith}/>)}
    </div>
  )
}

function Post({post,user,db,setChatWith}) {
  const [liked, setLiked] = useState(post.likes?.includes(user?.uid));
  const like = async () => {
    if(!user) return signInWithPopup(auth, new GoogleAuthProvider());
    liked? updateDoc(doc(db,"posts",post.id),{likes:arrayRemove(user.uid)}) : updateDoc(doc(db,"posts",post.id),{likes:arrayUnion(user.uid)});
    setLiked(!liked);
  }
  return(
    <div style={styles.card}>
      <div style={{display:"flex", alignItems:"center", gap:10, padding:14}}>
        <img src={post.photo} style={{width:32,height:32,borderRadius:"50%", border:"2px solid #38BDF8"}}/>
        <b>{post.name}</b>
        {user?.uid!== post.uid && <button onClick={()=>setChatWith({id: post.uid, name: post.name, photo: post.photo})} style={styles.btnGhost}>Message</button>}
      </div>
      <p style={{padding:"0 16px"}}>{post.built}</p>
      {post.revenue>0 && <p style={{padding:"0 16px", color:"#22C55E"}}>💰 ${post.revenue} revenue</p>}
      <div style={{display:"flex", gap:16, padding:"10px 16px", fontSize:24}}>
        <span onClick={like}>{liked?"🔥":"🤍"}</span><span>💬</span>
      </div>
      <p style={{padding:"0 16px 16px"}}>{post.likes?.length} builders supported</p>
    </div>
  )
}

// ===== 2. 🔍 DISCOVER =====
function Discover({user, users, setChatWith}) {
  return(<div style={{padding:20}}>
    <h2>Discover</h2>
    <input style={styles.input} placeholder="Search people, startups, projects..."/>
    <h3>Top Builders</h3>
    {users.slice(0,5).map(u=><div key={u.id} style={{display:"flex",alignItems:"center",gap:10,margin:"10px 0"}} onClick={()=>setChatWith(u)}>
      <img src={u.photo} style={{width:40,height:40,borderRadius:"50%"}}/><b>{u.name}</b>
      <span style={styles.score}>Score: {u.skillScore}</span>
    </div>)}
  </div>)
}

// ===== 3. 🤖 AI ASSISTANT =====
function AIAssistant({user}) {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const askAI = () => {
    if(!input) return;
    setChat([...chat, {role:"user", text:input}, {role:"ai", text:`Nexora AI: For "${input}", first validate with 10 users. Then build MVP in 7 days. Want me to draft a plan?`}]);
    setInput("");
  }
  return(<div style={{padding:20}}>
    <h2>🤖 AI Co-founder</h2>
    <div style={{height:"50vh", overflowY:"auto", background:"#0F172A", padding:16, borderRadius:12}}>
      {chat.map((c,i)=><p key={i}><b>{c.role==="user"?"You":"Nexora AI"}:</b> {c.text}</p>)}
    </div>
    <div style={{display:"flex", gap:8, marginTop:10}}>
      <input style={styles.input} value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask: Write my pitch deck"/>
      <button style={styles.btnPrimary} onClick={askAI}>Send</button>
    </div>
    <h3>Quick Actions</h3>
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
      {["Write LinkedIn Post","Create Business Plan","Validate Idea","Build Resume"].map(a=><button key={a} style={styles.btnGhost} onClick={()=>setInput(a)}>{a}</button>)}
    </div>
  </div>)
}

// ===== 4. 🎯 GOALS + XP + STREAK =====
function GoalsPage({user, db}) {
  const [goal, setGoal] = useState("");
  const addGoal = async () => {
    if(!goal) return;
    await addDoc(collection(db,"goals"),{uid:user.uid, goal, completed:false, createdAt:serverTimestamp()});
    updateDoc(doc(db,"users",user.uid), {xp: increment(50)});
    setGoal("");
  }
  return(<div style={{padding:20}}>
    <h2>🎯 Goals & Progress</h2>
    <p><span style={styles.streak}>🔥 Streak: 0</span> <span style={styles.score}>XP: 0 | Level: 1</span></p>
    <input style={styles.input} value={goal} onChange={e=>setGoal(e.target.value)} placeholder="My goal: Launch MVP"/>
    <button style={styles.btnPrimary} onClick={addGoal}>Add Goal +50 XP</button>
    <h3>Challenges</h3>
    <div style={styles.card}><div style={{padding:16}}><b>7 Day Build Challenge</b><p>Post for 7 days straight</p></div></div>
  </div>)
}

// ===== 5. 🚀 STARTUP HUB =====
function StartupHub({user, db}) {
  const [idea, setIdea] = useState("");
  const postIdea = async () => {
    if(!idea) return;
    await addDoc(collection(db,"ideas"),{uid:user.uid, idea, createdAt:serverTimestamp()});
    alert("Idea posted to marketplace!");
  }
  return(<div style={{padding:20}}>
    <h2>🚀 Startup Hub</h2>
    <h3>Post Your Idea</h3>
    <textarea style={{...styles.input, height:80}} value={idea} onChange={e=>setIdea(e.target.value)} placeholder="My startup idea..."/>
    <button style={styles.btnPrimary} onClick={postIdea}>Post Idea</button>
    <h3>Co-founder Matching</h3>
    <div style={styles.card}><div style={{padding:16}}><b>Looking for:</b> React Dev + Designer<br/><button style={styles.btnPrimary}>Find Co-founder</button></div></div>
  </div>)
}

// ===== 6. 👤 PROFILE =====
function CreatePost({user,db,setTab}) {
  const [built, setBuilt] = useState(""); const [rev, setRev] = useState("");
  const post = async()=>{
    if(!built) return alert("Write what you built");
    await addDoc(collection(db,"posts"),{uid:user.uid, name:user.displayName, photo:user.photoURL, built, revenue: rev? Number(rev) : 0, likes:[], createdAt:serverTimestamp()});
    updateDoc(doc(db,"users",user.uid), {streak: increment(1), xp: increment(100)});
    setTab("home");
  }
  return(<div style={{padding:20}}><h2>🚢 Ship Log</h2><textarea style={{...styles.input,height:100}} placeholder="What did you build today?" value={built} onChange={e=>setBuilt(e.target.value)}/><input style={styles.input} type="number" placeholder="Revenue $ (optional)" value={rev} onChange={e=>setRev(e.target.value)}/><button style={styles.btnPrimary} onClick={post}>Ship It 🚀 +100 XP</button></div>)
}

function ProfilePage({user, db}) {
  const [p, setP] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setP(d.data())) },[]);
  const updateRevenue = async () => {
    const amount = prompt("Enter revenue $");
    if(amount) updateDoc(doc(db,"users",user.uid), {revenue: Number(amount)});
  }
  return (<div style={{padding:20}}>
    <img src={p.photo} style={{width:80,height:80,borderRadius:"50%", border:"3px solid #38BDF8"}}/>
    <h2>{p.name}</h2>
    <p>{p.bio || "Builder in Public"}</p>
    <div style={{display:"flex", gap:10}}><span style={styles.streak}>🔥 {p.streak} Day</span><span style={styles.score}>Score: {p.skillScore}</span><span style={{background:"#22C55E",padding:"4px 10px",borderRadius:20}}>💰 ${p.revenue}</span></div>
    <button style={styles.btnPrimary} onClick={updateRevenue}>Update Revenue</button>
    <button style={{...styles.btnPrimary, background:"#F87171", marginTop:10}} onClick={()=>signOut(auth)}>Logout</button>
  </div>)
}

// ===== 7. 💬 DM CHAT =====
function DMChat({user, otherUser, db, onBack}) {
  const [messages, setMessages] = useState([]); const [text, setText] = useState("");
  const chatId = user.uid < otherUser.id? `${user.uid}_${otherUser.id}` : `${otherUser.id}_${user.uid}`;
  useEffect(()=>{ onSnapshot(query(collection(db,"chats",chatId,"messages"), orderBy("createdAt","asc")), snap=>setMessages(snap.docs.map(d=>({id:d.id,...d.data()})))); },[chatId]);
  const sendMsg = async () => { if(!text.trim()) return; await addDoc(collection(db,"chats",chatId,"messages"),{from: user.uid, to: otherUser.id, text, createdAt: serverTimestamp()}); setText(""); }
  return(<div><div style={{display:"flex", alignItems:"center", gap:10, padding:16}}><span onClick={onBack} style={{fontSize:24}}>←</span><b>{otherUser.name}</b></div><div style={{height:"70vh", overflowY:"auto", padding:16}}>{messages.map(m=><div key={m.id} style={{display:"flex", justifyContent: m.from === user.uid? "flex-end" : "flex-start"}}><p style={{background: m.from === user.uid? "linear-gradient(90deg, #38BDF8, #A855F7)" : "#1E293B", padding:"10px 14px", borderRadius:18}}>{m.text}</p></div>)}</div><div style={{display:"flex", gap:8, padding:16}}><input style={styles.input} value={text} onChange={e=>setText(e.target.value)}/><button style={styles.btnPrimary} onClick={sendMsg}>Send</button></div></div>)
  }
