import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, limit, where } from "firebase/firestore";
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
  loginWall: {textAlign:"center", padding:40}
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if(u) {
        const userRef = doc(db, "users", u.uid);
        if(!(await getDoc(userRef)).exists())
          setDoc(userRef, {name: u.displayName, photo: u.photoURL, bio: "", skills: "", goals: "Launch MVP", streak: 0, lastPost: "", revenue: 0, buddy: "", invites: 0, team: []});
        onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
      }
    });
  }, []);

  if (loading) return <div style={styles.body}><h1 style={styles.logo}>NexoraAI</h1></div>

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={styles.logo}>NexoraAI</h2>
        {user? <span>🔥{users.find(x=>x.id===user.uid)?.streak || 0}</span> : <button onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())} style={{background:"none",border:"1px solid #38BDF8",color:"#38BDF8",padding:"5px 10px",borderRadius:8}}>Login</button>}
      </div>

      {tab === "home" && <Feed user={user} users={users} db={db} storage={storage}/>}
      {tab === "cofounder" && <AuthWall user={user}><CofounderSwipe user={user} users={users} db={db}/></AuthWall>}
      {tab === "add" && <AuthWall user={user}><CreatePost user={user} db={db} storage={storage} setTab={setTab} users={users}/></AuthWall>}
      {tab === "aipitch" && <AuthWall user={user}><AIPitchGenerator user={user} db={db} users={users}/></AuthWall>}
      {tab === "demoday" && <DemoDay users={users}/>}
      {tab === "investor" && <AuthWall user={user}><AIInvestorRoom user={user} users={users}/></AuthWall>}
      {tab === "profile" && <AuthWall user={user}><ProfilePage user={user} db={db} users={users}/></AuthWall>}
      {tab === "team" && <AuthWall user={user}><TeamShipLog user={user} db={db}/></AuthWall>}

      <div style={styles.bottomNav}>
        <span onClick={()=>setTab("home")}>🎯</span>
        <span onClick={()=>setTab("cofounder")}>🚀</span>
        <span onClick={()=>setTab("add")}>🚢</span>
        <span onClick={()=>setTab("team")}>👥</span>
        <span onClick={()=>setTab("demoday")}>🏆</span>
        <span onClick={()=>setTab("profile")}>📈</span>
      </div>
    </div>
  )
}

function AuthWall({user, children}) {
  if(!user) return(
    <div style={styles.loginWall}>
      <h2>🔒 Join to Build</h2>
      <button style={styles.btnPrimary} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Continue with Google</button>
    </div>
  )
  return children
}

// ===== FEATURE 1: BUILD BUDDY SYSTEM =====
function Feed({user, users, db}) {
  const [posts, setPosts] = useState([]);
  const [scrollCount, setScrollCount] = useState(0);
  const myData = users.find(x=>x.id===user?.uid);

  useEffect(()=>{
    onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc"), limit(10)), snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))))
  },[]);

  // BUDDY CHECK: BUDDY POST CHEYAKPOTHE WARNING
  if(user && myData?.buddy){
    const buddy = users.find(u=>u.id === myData.buddy);
    const today = new Date().toDateString();
    if(buddy?.lastPost!== today){
      return(
        <div style={styles.focusCard}>
          <h2>⚠️ Your Buddy Slacked</h2>
          <p><b>{buddy?.name}</b> didn't ship today. If they miss 1 more day, your streak also resets!</p>
          <p>DM them and make them build 💪</p>
        </div>
      )
    }
  }

  if(scrollCount >= 10 &&!user) return (
    <div style={styles.focusCard}>
      <h2>⏰ Free Preview Over</h2>
      <button style={styles.btnPrimary} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Login with Google</button>
    </div>
  )

  return(
    <div>
      {user &&!myData?.buddy && <div style={styles.focusCard}>
        <h3>Pick a Build Buddy 👥</h3>
        <p>Choose 1 friend. Both must ship daily or streak resets</p>
        <select style={styles.input} onChange={e=>updateDoc(doc(db,"users",user.uid),{buddy:e.target.value})}>
          <option>Select Buddy</option>
          {users.filter(u=>u.id!==user.uid).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>}
      {posts.map(p=><div key={p.id} onClick={()=>user && setScrollCount(scrollCount+1)}><Post post={p} user={user} db={db}/></div>)}
    </div>
  )
}

function Post({post,user,db}) {
  const [liked, setLiked] = useState(post.likes?.includes(user?.uid));
  const like = async () => {
    if(!user) return signInWithPopup(auth, new GoogleAuthProvider());
    const ref = doc(db,"posts",post.id);
    liked? updateDoc(ref,{likes:arrayRemove(user.uid)}) : updateDoc(ref,{likes:arrayUnion(user.uid)});
    setLiked(!liked);
  }
  return(
    <div style={styles.post}>
      <div style={styles.postHeader}><img src={post.photo} style={{width:32,height:32,borderRadius:"50%"}}/><b>{post.name}</b> {post.team && <span style={{fontSize:12,color:"#38BDF8"}}>with {post.team}</span>}</div>
      {post.image && <img src={post.image} style={styles.postImg}/>}
      <div style={styles.actions}><span onClick={like}>{liked?"❤️":"🤍"}</span></div>
      <p style={{padding:"0 15px"}}><b>{post.likes?.length} builders</b> supported</p>
      <p style={{padding:"0 15px"}}><b>{post.name}</b> shipped: {post.built}</p>
    </div>
  )
}

// ===== FEATURE 2: TEAM SHIP LOG =====
function TeamShipLog({user, db}) {
  const [built, setBuilt] = useState("");
  const [team, setTeam] = useState("");
  const postTeam = async()=>{
    if(!built ||!team) return alert("Write what you built + Tag team");
    await addDoc(collection(db,"posts"),{
      uid:user.uid, name:user.displayName, photo:user.photoURL,
      built, team, type:"team", likes:[], createdAt:serverTimestamp()
    });
    alert("Team Log Posted! 🚀");
  }
  return(
    <div style={{padding:20}}>
      <h2>👥 Team Ship Log</h2>
      <p>Build with 2-3 people and post together</p>
      <textarea style={{...styles.input,height:100}} placeholder="What did we build today?" value={built} onChange={e=>setBuilt(e.target.value)}/>
      <input style={styles.input} placeholder="Tag team: @Rahul, @Priya" value={team} onChange={e=>setTeam(e.target.value)}/>
      <button style={styles.btnPrimary} onClick={postTeam}>Ship as Team 🚢</button>
    </div>
  )
}

// ===== FEATURE 3: INVITE TO UNLOCK AI =====
function AIPitchGenerator({user, db, users}) {
  const [idea, setIdea] = useState("");
  const [deck, setDeck] = useState([]);
  const myData = users.find(x=>x.id===user?.uid);
  const invitesNeeded = 3;

  const generateDeck = () => {
    if((myData?.invites || 0) < invitesNeeded) return alert(`Invite ${invitesNeeded - (myData?.invites || 0)} more friends to unlock AI`);
    setDeck([`Problem: ${idea}`, `Solution: AI for ${idea}`, `Market: $10B`, `Team: ConnectAI`, `Ask: $500K`]);
  }

  const inviteLink = `https://connectai.vercel.app/?ref=${user.uid}`;

  return(
    <div style={{padding:20}}>
      <h2>📊 AI Pitch Deck</h2>
      <div style={styles.focusCard}>
        <p><b>AI Unlocks:</b> {myData?.invites || 0}/{invitesNeeded} invites</p>
        <input style={styles.input} value={inviteLink} readOnly/>
        <button style={styles.btnPrimary} onClick={()=>navigator.clipboard.writeText(inviteLink)}>Copy Invite Link</button>
      </div>
      <input style={styles.input} placeholder="Your idea" value={idea} onChange={e=>setIdea(e.target.value)}/>
      <button style={styles.btnPrimary} onClick={generateDeck}>Generate Deck ✨</button>
      {deck.map((d,i)=><div key={i} style={styles.focusCard}><b>Slide {i+1}</b><p>{d}</p></div>)}
    </div>
  )
}

// ===== OTHER PAGES =====
function CreatePost({user,db,storage,setTab, users}) {
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
    const userRef = doc(db,"users",user.uid);
    const snap = await getDoc(userRef);
    const today = new Date().toDateString();
    const data = snap.data();
    if(data.lastPost!== today){
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

function DemoDay({users}) {
  const isSaturday = new Date().getDay() === 6;
  const topBuilders = users.sort((a,b)=>(b.streak||0)-(a.streak||0)).slice(0,3);
  return(
    <div style={{padding:20}}>
      <h2>🏆 Weekly Demo Day</h2>
      {topBuilders.map((u,i)=><div key={u.id} style={styles.focusCard}><h3>#{i+1} {u.name}</h3><p>🔥 {u.streak} Day Streak</p></div>)}
    </div>
  )
}

function AIInvestorRoom({user, users}) {
  const [pitch, setPitch] = useState("");
  const [feedback, setFeedback] = useState([]);
  const myData = users.find(x=>x.id===user?.uid);
  const getFeedback = () => {
    if((myData?.invites || 0) < 3) return alert("Invite 3 friends first to unlock AI Investors");
    setFeedback([
      {name: "Sequoia AI", text: `Market for "${pitch}" is too small. 10x it.`, emoji: "😠"},
      {name: "Angel AI", text: `Love the vision! Can you build MVP in 2 weeks?`, emoji: "😍"}
    ]);
  }
  return(
    <div style={{padding:20}}>
      <h2>💼 AI Investor Room</h2>
      <p>Invites: {myData?.invites || 0}/3 to unlock</p>
      <input style={styles.input} placeholder="My startup is..." value={pitch} onChange={e=>setPitch(e.target.value)}/>
      <button style={styles.btnPrimary} onClick={getFeedback}>Get Feedback</button>
      {feedback.map((f,i)=><div key={i} style={styles.focusCard}><h4>{f.emoji} {f.name}</h4><p>{f.text}</p></div>)}
    </div>
  )
}

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
        <p>{person.goals}</p>
      </div>
      <button style={styles.btnPrimary} onClick={()=>setIndex(index+1)}>Next Founder</button>
    </div>
  )
}

function ProfilePage({user, db, users}) {
  const [profile, setProfile] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setProfile(d.data())) },[]);
  const save=()=>setDoc(doc(db,"users",user.uid),profile,{merge:true});
  return (
    <div style={{padding:20}}>
      <h2>📈 Your Progress</h2>
      <div style={styles.focusCard}><h3>🔥 Build Streak: {profile.streak || 0} days</h3></div>
      <div style={styles.focusCard}><h3>👥 Buddy: {users.find(u=>u.id===profile.buddy)?.name || "None"}</h3></div>
      <div style={styles.focusCard}><h3>🎁 Invites: {profile.invites || 0}/3</h3></div>
      <img src={profile.photo} style={{width:80,height:80,borderRadius:"50%"}}/>
      <h3>{profile.name}</h3>
      <input style={styles.input} placeholder="Skills" value={profile.skills||""} onChange={e=>setProfile({...profile,skills:e.target.value})}/>
      <button style={styles.btnPrimary} onClick={save}>Save</button>
      <button style={styles.btnDanger} onClick={()=>signOut(auth)}>Logout</button>
    </div>
  )
}
