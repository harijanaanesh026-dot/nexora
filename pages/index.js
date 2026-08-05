import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, limit } from "firebase/firestore";
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
  body: {background:"#050A18", color:"#CBD5E1", fontFamily:"'Inter', sans-serif", margin:0, paddingBottom:80},
  header: {display:"flex", justifyContent:"space-between", padding:"15px 20px", borderBottom:"1px solid #1E293B", position:"sticky", top:0, background:"#050A18", zIndex:10},
  logo: {fontSize:22, fontWeight:"800", color:"#38BDF8"},
  bottomNav: {display:"flex", justifyContent:"space-around", padding:"12px 0", borderTop:"1px solid #1E293B", position:"fixed", bottom:0, width:"100%", background:"#050A18", fontSize:22},
  focusCard: {background:"linear-gradient(135deg,#0F172A,#1E293B)", border:"1px solid #38BDF8", margin:15, padding:20, borderRadius:16},
  post: {background:"#0F172A", border:"1px solid #1E293B", margin:"15px", borderRadius:16, padding:0},
  postHeader: {display:"flex", alignItems:"center", gap:12, padding:15},
  postImg: {width:"100%"},
  actions: {display:"flex", gap:20, padding:"12px 15px", fontSize:22},
  input: {background:"#1E293B", border:"1px solid #334155", color:"white", width:"100%", padding:12, borderRadius:12},
  btnPrimary: {background:"#38BDF8", border:"none", color:"#050A18", padding:"10px 20px", borderRadius:12, fontWeight:"700", width:"100%", marginTop:10},
  btnDanger: {background:"#F87171", border:"none", color:"white", padding:"10px 20px", borderRadius:12, fontWeight:"700", width:"100%", marginTop:10},
  tag: {background:"#1E293B", padding:"4px 10px", borderRadius:20, fontSize:12, marginRight:5, display:"inline-block"}
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u) {
        const userRef = doc(db, "users", u.uid);
        if(!(await getDoc(userRef)).exists())
          setDoc(userRef, {name: u.displayName, photo: u.photoURL, bio: "", skills: "", goals: "Launch MVP", streak: 0, lastPost: "", revenue: 0});
        onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
      }
    });
  }, []);

  if (!user) return (
    <div style={{...styles.body, textAlign:"center", paddingTop:100}}>
      <h1 style={styles.logo}>ConnectAI</h1>
      <p>Connect. Build. Ship. Not Scroll.</p>
      <button style={styles.btnPrimary} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Login with Google</button>
    </div>
  )

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={styles.logo}>ConnectAI</h2>
        <span>🔥{users.find(x=>x.id===user.uid)?.streak || 0}</span>
      </div>

      {tab === "home" && <Feed user={user} users={users} db={db} storage={storage}/>}
      {tab === "cofounder" && <CofounderSwipe user={user} users={users} db={db}/>}
      {tab === "add" && <CreatePost user={user} db={db} storage={storage} setTab={setTab}/>}
      {tab === "aipitch" && <AIPitchGenerator user={user} db={db}/>}
      {tab === "demoday" && <DemoDay users={users}/>}
      {tab === "investor" && <AIInvestorRoom user={user}/>}
      {tab === "profile" && <ProfilePage user={user} db={db}/>}

      <div style={styles.bottomNav}>
        <span onClick={()=>setTab("home")}>🎯</span>
        <span onClick={()=>setTab("cofounder")}>🚀</span>
        <span onClick={()=>setTab("add")}>🚢</span>
        <span onClick={()=>setTab("demoday")}>🏆</span>
        <span onClick={()=>setTab("investor")}>💼</span>
        <span onClick={()=>setTab("profile")}>📈</span>
      </div>
    </div>
  )
}

// ===== FEATURE 1: FEED + 10 POST LIMIT =====
function Feed({user, users, db}) {
  const [posts, setPosts] = useState([]);
  const [scrollCount, setScrollCount] = useState(0);

  useEffect(()=>{
    onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc"), limit(10)), snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))))
  },[]);

  if(scrollCount >= 10) return (
    <div style={styles.focusCard}>
      <h2>⏰ Focus Time Over</h2>
      <p>You've consumed 10 builds. Now it's time to CREATE.</p>
      <button style={styles.btnPrimary} onClick={()=>alert("Go build something and post it!")}>What did you build today?</button>
    </div>
  )

  return(
    <div>
      <div style={styles.focusCard}>
        <h3>Your Goal 🎯: {users.find(x=>x.id===user.uid)?.goals}</h3>
        <progress value="30" max="100" style={{width:"100%"}}></progress>
      </div>
      {posts.map(p=><div key={p.id} onClick={()=>setScrollCount(scrollCount+1)}><Post post={p} user={user} db={db}/></div>)}
    </div>
  )
}

function Post({post,user,db}) {
  const [liked, setLiked] = useState(post.likes?.includes(user.uid));
  const like = async () => {
    const ref = doc(db,"posts",post.id);
    liked? updateDoc(ref,{likes:arrayRemove(user.uid)}) : updateDoc(ref,{likes:arrayUnion(user.uid)});
    setLiked(!liked);
  }
  return(
    <div style={styles.post}>
      <div style={styles.postHeader}><img src={post.photo} style={{width:32,height:32,borderRadius:"50%"}}/><b>{post.name}</b></div>
      {post.image && <img src={post.image} style={styles.postImg}/>}
      <div style={styles.actions}><span onClick={like}>{liked?"🔥":"🤍"}</span></div>
      <p style={{padding:"0 15px"}}><b>{post.likes?.length} builders</b> supported</p>
      <p style={{padding:"0 15px"}}><b>{post.name}</b> shipped: {post.built}</p>
    </div>
  )
}

// ===== FEATURE 1: BUILD STREAK IN CREATEPOST =====
function CreatePost({user,db,storage,setTab}) {
  const [built, setBuilt] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const post = async()=>{
    if(!built) return alert("You must write what you built today");
    setUploading(true);
    let img=""; if(file){const r=ref(storage,`builds/${Date.now()}`); await uploadBytes(r,file); img=await getDownloadURL(r);}
    await addDoc(collection(db,"posts"),{
      uid:user.uid, name:user.displayName, photo:user.photoURL,
      built, image:img, likes:[], createdAt:serverTimestamp()
    });

    // STREAK LOGIC
    const userRef = doc(db,"users",user.uid);
    const snap = await getDoc(userRef);
    const today = new Date().toDateString();
    const data = snap.data();
    if(data.lastPost !== today){
      await updateDoc(userRef, {streak: (data.streak||0)+1, lastPost: today})
    }
    
    setUploading(false); setTab("home");
  }

  return(
    <div style={{padding:20}}>
      <h2>🚢 Ship Log</h2>
      <textarea style={{...styles.input,height:120}} placeholder="What did you build today?" value={built} onChange={e=>setBuilt(e.target.value)}/>
      <input type="file" onChange={e=>setFile(e.target.files[0])} style={{margin:"10px 0"}}/>
      <button style={styles.btnPrimary} onClick={post}>{uploading?"Shipping...":"Ship It 🚀"}</button>
    </div>
  )
}

// ===== FEATURE 2: AI DEMO DAY =====
function DemoDay({users}) {
  // SATURDAY CHECK
  const isSaturday = new Date().getDay() === 6;
  const topBuilders = users.sort((a,b)=>(b.streak||0)-(a.streak||0)).slice(0,3);

  return(
    <div style={{padding:20}}>
      <h2>🏆 Weekly Demo Day</h2>
      {isSaturday ? <p style={{color:"#38BDF8"}}>AI is judging live now!</p> : <p>Next Demo Day: Saturday</p>}
      
      <h3>Top 3 Builders This Week</h3>
      {topBuilders.map((u,i)=><div key={u.id} style={styles.focusCard}>
        <h3>#{i+1} {u.name}</h3>
        <p>🔥 {u.streak} Day Streak</p>
        <p>Goal: {u.goals}</p>
      </div>)}
      
      <div style={styles.focusCard}>
        <b>Prize:</b> $1000 + Investor Intros for #1
      </div>
    </div>
  )
}

// ===== FEATURE 3: AI INVESTOR ROOM =====
function AIInvestorRoom({user}) {
  const [pitch, setPitch] = useState("");
  const [feedback, setFeedback] = useState([]);

  const getFeedback = () => {
    setFeedback([
      {name: "Sequoia AI", text: `Market for "${pitch}" is too small. 10x it.`, emoji: "😠"},
      {name: "Angel AI", text: `Love the vision! Can you build MVP in 2 weeks?`, emoji: "😍"},
      {name: "YC AI", text: `Who are your first 10 users? Get them first.`, emoji: "🤔"}
    ]);
  }

  return(
    <div style={{padding:20}}>
      <h2>💼 AI Investor Room</h2>
      <p>Pitch your idea. Get roasted by 3 AI investors.</p>
      <input style={styles.input} placeholder="My startup is..." value={pitch} onChange={e=>setPitch(e.target.value)}/>
      <button style={styles.btnPrimary} onClick={getFeedback}>Get Feedback</button>
      
      {feedback.map((f,i)=><div key={i} style={styles.focusCard}>
        <h4>{f.emoji} {f.name}</h4>
        <p>{f.text}</p>
      </div>)}
    </div>
  )
}

// ===== OTHER PAGES =====
function CofounderSwipe({user, users, db}) {
  const [index, setIndex] = useState(0);
  const matches = users.filter(u=>u.id!==user.uid && u.goals);
  const person = matches[index];
  if(!person) return <p style={{textAlign:"center",marginTop:100}}>No more founders</p>
  return(
    <div style={{textAlign:"center", padding:20}}>
      <h2>🚀 AI Voice Match</h2>
      <div style={styles.focusCard}>
        <img src={person.photo} style={{width:100,height:100,borderRadius:"50%"}}/>
        <h3>{person.name}</h3>
        <p><b>AI Match:</b> 94%</p>
        <p>{person.goals}</p>
      </div>
      <button style={styles.btnPrimary} onClick={()=>setIndex(index+1)}>Next Founder</button>
    </div>
  )
}

function AIPitchGenerator({user, db}) {
  const [idea, setIdea] = useState("");
  const [deck, setDeck] = useState([]);
  const generateDeck = () => {
    setDeck([`Problem: ${idea}`, `Solution: AI for ${idea}`, `Market: $10B`, `Team: ConnectAI`, `Ask: $500K`]);
  }
  return(
    <div style={{padding:20}}>
      <h2>📊 AI Pitch Deck</h2>
      <input style={styles.input} placeholder="Your idea" value={idea} onChange={e=>setIdea(e.target.value)}/>
      <button style={styles.btnPrimary} onClick={generateDeck}>Generate</button>
      {deck.map((d,i)=><div key={i} style={styles.focusCard}><b>Slide {i+1}</b><p>{d}</p></div>)}
    </div>
  )
}

function ProfilePage({user, db}) {
  const [profile, setProfile] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setProfile(d.data())) },[]);
  const save=()=>setDoc(doc(db,"users",user.uid),profile,{merge:true});
  return (
    <div style={{padding:20}}>
      <h2>📈 Your Progress</h2>
      <div style={styles.focusCard}>
        <h3>🔥 Build Streak: {profile.streak || 0} days</h3>
      </div>
      <img src={profile.photo} style={{width:80,height:80,borderRadius:"50%"}}/>
      <h3>{profile.name}</h3>
      <input style={styles.input} placeholder="Skills" value={profile.skills||""} onChange={e=>setProfile({...profile,skills:e.target.value})}/>
      <input style={styles.input} placeholder="Weekly Goal" value={profile.goals||""} onChange={e=>setProfile({...profile,goals:e.target.value})}/>
      <input style={styles.input} placeholder="MRR Revenue $" type="number" value={profile.revenue||""} onChange={e=>setProfile({...profile,revenue:Number(e.target.value)})}/>
      <button style={styles.btnPrimary} onClick={save}>Save</button>
      <button style={styles.btnDanger} onClick={()=>signOut(auth)}>Logout</button>
    </div>
  )
  }
