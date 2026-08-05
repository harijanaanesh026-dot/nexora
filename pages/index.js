import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, limit, deleteDoc, where } from "firebase/firestore";

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

const styles = {
  body: {background:"#050A18", color:"#CBD5E1", fontFamily:"'Inter', sans-serif", margin:0, paddingBottom:80},
  header: {display:"flex", justifyContent:"space-between", padding:"15px 20px", borderBottom:"1px solid #1E293B", position:"sticky", top:0, background:"#050A18", zIndex:10},
  logo: {fontSize:22, fontWeight:"800", color:"#38BDF8"},
  bottomNav: {display:"flex", justifyContent:"space-around", padding:"12px 0", borderTop:"1px solid #1E293B", position:"fixed", bottom:0, width:"100%", background:"#050A18", fontSize:22},
  focusCard: {background:"linear-gradient(135deg,#0F172A,#1E293B)", border:"1px solid #38BDF8", margin:15, padding:20, borderRadius:16},
  post: {background:"#0F172A", border:"1px solid #1E293B", margin:"15px", borderRadius:16, padding:0},
  postHeader: {display:"flex", alignItems:"center", gap:12, padding:15},
  actions: {display:"flex", gap:20, padding:"12px 15px", fontSize:22},
  input: {background:"#1E293B", border:"1px solid #334155", color:"white", width:"100%", padding:12, borderRadius:12},
  btnPrimary: {background:"#38BDF8", border:"none", color:"#050A18", padding:"10px 20px", borderRadius:12, fontWeight:"700", width:"100%", marginTop:10},
  btnDanger: {background:"#F87171", border:"none", color:"white", padding:"10px 20px", borderRadius:12, fontWeight:"700", width:"100%", marginTop:10},
  btnSecondary: {background:"#334155", border:"none", color:"white", padding:"10px 20px", borderRadius:12, fontWeight:"700", width:"100%", marginTop:10},
  loginWall: {textAlign:"center", padding:40},
  menu: {background:"#1E293B", padding:10, margin:"0 15px 10px", borderRadius:8},
  chatBox: {background:"#0F172A", border:"1px solid #1E293B", borderRadius:16, height:"70vh", display:"flex", flexDirection:"column"}
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatWith, setChatWith] = useState(null); // NEW: DM state

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
        <h2 style={styles.logo} onClick={()=>{setTab("home"); setChatWith(null)}} style={{cursor:"pointer"}}>NexoraAI</h2>
        {user? <span>🔥{users.find(x=>x.id===user.uid)?.streak || 0}</span> : <button onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())} style={{background:"none",border:"1px solid #38BDF8",color:"#38BDF8",padding:"5px 10px",borderRadius:8}}>Login</button>}
      </div>

      {/* NEW: IF CHATTING, SHOW DM SCREEN */}
      {chatWith ? 
        <DMChat user={user} otherUser={chatWith} db={db} onBack={()=>setChatWith(null)}/>
      :
        <>
          {tab === "home" && <Feed user={user} users={users} db={db} setChatWith={setChatWith}/>}
          {tab === "cofounder" && <AuthWall user={user}><CofounderSwipe user={user} users={users} db={db} setChatWith={setChatWith}/></AuthWall>}
          {tab === "add" && <AuthWall user={user}><CreatePost user={user} db={db} setTab={setTab} users={users}/></AuthWall>}
          {tab === "aipitch" && <AuthWall user={user}><AIPitchGenerator user={user} db={db} users={users}/></AuthWall>}
          {tab === "demoday" && <DemoDay users={users}/>}
          {tab === "investor" && <AuthWall user={user}><AIInvestorRoom user={user} users={users}/></AuthWall>}
          {tab === "profile" && <AuthWall user={user}><ProfilePage user={user} db={db} users={users} setChatWith={setChatWith}/></AuthWall>}
          {tab === "team" && <AuthWall user={user}><TeamShipLog user={user} db={db}/></AuthWall>}

          <div style={styles.bottomNav}>
            <span onClick={()=>{setTab("home"); setChatWith(null)}}>🎯</span>
            <span onClick={()=>{setTab("cofounder"); setChatWith(null)}}>🚀</span>
            <span onClick={()=>{setTab("add"); setChatWith(null)}}>🚢</span>
            <span onClick={()=>{setTab("team"); setChatWith(null)}}>👥</span>
            <span onClick={()=>{setTab("demoday"); setChatWith(null)}}>🏆</span>
            <span onClick={()=>{setTab("profile"); setChatWith(null)}}>📈</span>
          </div>
        </>
      }
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

// ===== POST WITH COMMENTS + DM BUTTON =====
function Post({post,user,db,setChatWith}) {
  const [liked, setLiked] = useState(post.likes?.includes(user?.uid));
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.built);
  const [showMenu, setShowMenu] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const postRef = doc(db,"posts",post.id);
  const isOwner = user?.uid === post.uid;

  useEffect(()=>{
    const q = query(collection(db,"posts",post.id,"comments"), orderBy("createdAt","asc"))
    onSnapshot(q, snap=>setComments(snap.docs.map(d=>({id:d.id,...d.data()}))))
  },[post.id]);

  const like = async () => {
    if(!user) return signInWithPopup(auth, new GoogleAuthProvider());
    liked? updateDoc(postRef,{likes:arrayRemove(user.uid)}) : updateDoc(postRef,{likes:arrayUnion(user.uid)});
    setLiked(!liked);
  }

  const addComment = async () => {
    if(!user) return signInWithPopup(auth, new GoogleAuthProvider());
    if(!newComment.trim()) return;
    await addDoc(collection(db,"posts",post.id,"comments"),{
      uid: user.uid, name: user.displayName, photo: user.photoURL, comment: newComment, createdAt: serverTimestamp()
    });
    setNewComment("");
  }

  const deletePost = async () => {
    if(!confirm("Delete this build log permanently?")) return;
    await deleteDoc(postRef);
  }

  const editPost = async () => {
    if(!editText.trim()) return;
    await updateDoc(postRef, {built: editText, edited: true});
    setIsEditing(false);
  }

  if(post.archived &&!isOwner) return null;

  return(
    <div style={styles.post}>
      <div style={styles.postHeader}>
        <img src={post.photo} style={{width:32,height:32,borderRadius:"50%"}}/>
        <div>
          <b>{post.name}</b> {post.team && <span style={{fontSize:12,color:"#38BDF8"}}>with {post.team}</span>}
          {post.edited && <span style={{fontSize:10, color:"#94A3B8"}}> • edited</span>}
        </div>
        {/* NEW: DM BUTTON */}
        {!isOwner && user && <button onClick={()=>setChatWith({id: post.uid, name: post.name, photo: post.photo})} style={{marginLeft:"auto", background:"#38BDF8", border:"none", color:"#050A18", padding:"5px 10px", borderRadius:8, fontSize:12}}>Message</button>}
        {isOwner && <span onClick={()=>setShowMenu(!showMenu)} style={{marginLeft:"auto", cursor:"pointer", fontSize:20}}>⋯</span>}
      </div>

      {showMenu && isOwner && <div style={styles.menu}>
        <p onClick={()=>{setIsEditing(true); setShowMenu(false)}} style={{cursor:"pointer", margin:5}}>✏️ Edit</p>
        <p onClick={deletePost} style={{cursor:"pointer", margin:5, color:"#F87171"}}>🗑️ Delete</p>
      </div>}

      {isEditing? (
        <div style={{padding:15}}>
          <textarea style={{...styles.input,height:100}} value={editText} onChange={e=>setEditText(e.target.value)}/>
          <button style={styles.btnPrimary} onClick={editPost}>Save</button>
          <button style={styles.btnSecondary} onClick={()=>setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <p style={{padding:"15px"}}><b>{post.name}</b> shipped: {post.built}</p>
      )}

      <div style={styles.actions}><span onClick={like}>{liked?"🔥":"🤍"}</span></div>
      <p style={{padding:"0 15px"}}><b>{post.likes?.length} builders</b> supported</p>

      {/* COMMENTS */}
      <div style={{padding:"12px 15px 15px", borderTop:"1px solid #1E293B"}}>
        {comments.map(c=>(
          <div key={c.id} style={{display:"flex", gap:8, marginTop:8}}>
            <img src={c.photo} style={{width:24,height:24,borderRadius:"50%"}}/>
            <p style={{fontSize:14, margin:0}}><b>{c.name}</b> {c.comment}</p>
          </div>
        ))}
        {user && <div style={{display:"flex", gap:8, marginTop:12}}>
          <img src={user.photoURL} style={{width:24,height:24,borderRadius:"50%"}}/>
          <input style={{...styles.input, fontSize:14, flex:1, padding:"8px 12px"}} placeholder="Add a comment..." value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=> e.key === 'Enter' && addComment()}/>
          <button style={{background:"#38BDF8", border:"none", color:"#050A18", padding:"8px 14px", borderRadius:8, fontWeight:700}} onClick={addComment}>Post</button>
        </div>}
      </div>
    </div>
  )
}

// ===== NEW: DM CHAT COMPONENT =====
function DMChat({user, otherUser, db, onBack}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const chatId = user.uid < otherUser.id? `${user.uid}_${otherUser.id}` : `${otherUser.id}_${user.uid}`;

  useEffect(()=>{
    const q = query(collection(db,"chats",chatId,"messages"), orderBy("createdAt","asc"));
    onSnapshot(q, snap=>setMessages(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[chatId]);

  const sendMsg = async () => {
    if(!text.trim()) return;
    await addDoc(collection(db,"chats",chatId,"messages"),{
      from: user.uid, to: otherUser.id, text, createdAt: serverTimestamp()
    });
    setText("");
  }

  return(
    <div style={{padding:15}}>
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:15}}>
        <span onClick={onBack} style={{fontSize:24, cursor:"pointer"}}>←</span>
        <img src={otherUser.photo} style={{width:32,height:32,borderRadius:"50%"}}/>
        <h3>{otherUser.name}</h3>
      </div>

      <div style={styles.chatBox}>
        <div style={{flex:1, overflowY:"auto", padding:15}}>
          {messages.map(m=>(
            <div key={m.id} style={{display:"flex", justifyContent: m.from === user.uid? "flex-end" : "flex-start", marginBottom:10}}>
              <p style={{background: m.from === user.uid? "#38BDF8" : "#1E293B", color: m.from === user.uid? "#050A18" : "white", padding:"8px 12px", borderRadius:12, maxWidth:"70%"}}>
                {m.text}
              </p>
            </div>
          ))}
        </div>
        <div style={{display:"flex", gap:8, padding:15, borderTop:"1px solid #1E293B"}}>
          <input style={styles.input} placeholder="Type message..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=> e.key === 'Enter' && sendMsg()}/>
          <button style={styles.btnPrimary} onClick={sendMsg}>Send</button>
        </div>
      </div>
    </div>
  )
}

// ===== FEED =====
function Feed({user, users, db, setChatWith}) {
  const [posts, setPosts] = useState([]);
  const [scrollCount, setScrollCount] = useState(0);
  const myData = users.find(x=>x.id===user?.uid);

  useEffect(()=>{
    onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc"), limit(10)), snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))))
  },[]);

  if(user && myData?.buddy){
    const buddy = users.find(u=>u.id === myData.buddy);
    const today = new Date().toDateString();
    if(buddy?.lastPost!== today){
      return <div style={styles.focusCard}><h2>⚠️ Your Buddy Slacked</h2><p><b>{buddy?.name}</b> didn't ship today. Make them build!</p></div>
    }
  }

  if(scrollCount >= 10 &&!user) return (
    <div style={styles.focusCard}><h2>⏰ Free Preview Over</h2><button style={styles.btnPrimary} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Login with Google</button></div>
  )

  return(
    <div>
      {user &&!myData?.buddy && <div style={styles.focusCard}>
        <h3>Pick a Build Buddy 👥</h3>
        <select style={styles.input} onChange={e=>updateDoc(doc(db,"users",user.uid),{buddy:e.target.value})}>
          <option>Select Buddy</option>
          {users.filter(u=>u.id!==user.uid).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>}
      {posts.map(p=><div key={p.id} onClick={()=>user && setScrollCount(scrollCount+1)}><Post post={p} user={user} db={db} setChatWith={setChatWith}/></div>)}
    </div>
  )
}

// ===== PROFILE WITH MESSAGE BUTTON =====
function ProfilePage({user, db, users, setChatWith}) {
  const [profile, setProfile] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setProfile(d.data())) },[]);
  const save=()=>setDoc(doc(db,"users",user.uid),profile,{merge:true});

  return (
    <div style={{padding:20}}>
      <h2>📈 Your Progress</h2>
      <div style={styles.focusCard}><h3>🔥 Build Streak: {profile.streak || 0} days</h3></div>
      <div style={styles.focusCard}><h3>👥 Buddy: {users.find(u=>u.id===profile.buddy)?.name || "None"}</h3></div>
      <img src={profile.photo} style={{width:80,height:80,borderRadius:"50%"}}/>
      <h3>{profile.name}</h3>
      <input style={styles.input} placeholder="Skills" value={profile.skills||""} onChange={e=>setProfile({...profile,skills:e.target.value})}/>
      <button style={styles.btnPrimary} onClick={save}>Save</button>
      <button style={styles.btnDanger} onClick={()=>signOut(auth)}>Logout</button>
    </div>
  )
}

// ===== REST OF YOUR COMPONENTS - SAME =====
function TeamShipLog({user, db}) {
  const [built, setBuilt] = useState(""); const [team, setTeam] = useState("");
  const postTeam = async()=>{
    if(!built ||!team) return alert("Write what you built + Tag team");
    await addDoc(collection(db,"posts"),{uid:user.uid, name:user.displayName, photo:user.photoURL, built, team, type:"team", likes:[], createdAt:serverTimestamp()});
    alert("Team Log Posted! 🚀");
  }
  return(<div style={{padding:20}}><h2>👥 Team Ship Log</h2><textarea style={{...styles.input,height:100}} placeholder="What did we build today?" value={built} onChange={e=>setBuilt(e.target.value)}/><input style={styles.input} placeholder="Tag team: @Rahul, @Priya" value={team} onChange={e=>setTeam(e.target.value)}/><button style={styles.btnPrimary} onClick={postTeam}>Ship as Team 🚢</button></div>)
}

function AIPitchGenerator({user, db, users}) {
  const [idea, setIdea] = useState(""); const [deck, setDeck] = useState([]); const myData = users.find(x=>x.id===user?.uid);
  const generateDeck = () => {
    if((myData?.invites || 0) < 3) return alert(`Invite ${3 - (myData?.invites || 0)} more friends to unlock AI`);
    setDeck([`Problem: ${idea}`, `Solution: AI for ${idea}`, `Market: $10B`, `Team: ConnectAI`, `Ask: $500K`]);
  }
  const inviteLink = `https://connectai.vercel.app/?ref=${user.uid}`;
  return(<div style={{padding:20}}><h2>📊 AI Pitch Deck</h2><div style={styles.focusCard}><p><b>AI Unlocks:</b> {myData?.invites || 0}/3 invites</p><input style={styles.input} value={inviteLink} readOnly/><button style={styles.btnPrimary} onClick={()=>navigator.clipboard.writeText(inviteLink)}>Copy Invite Link</button></div><input style={styles.input} placeholder="Your idea" value={idea} onChange={e=>setIdea(e.target.value)}/><button style={styles.btnPrimary} onClick={generateDeck}>Generate Deck ✨</button>{deck.map((d,i)=><div key={i} style={styles.focusCard}><b>Slide {i+1}</b><p>{d}</p></div>)}</div>)
}

function CreatePost({user,db,setTab, users}) {
  const [built, setBuilt] = useState("");
  const post = async()=>{
    if(!built) return alert("You must write what you built today");
    await addDoc(collection(db,"posts"),{uid:user.uid, name:user.displayName, photo:user.photoURL, built, likes:[], createdAt:serverTimestamp()});
    const userRef = doc(db,"users",user.uid); const snap = await getDoc(userRef); const today = new Date().toDateString(); const data = snap.data();
    if(data.lastPost!== today){ await updateDoc(userRef, {streak: (data.streak||0)+1, lastPost: today}) }
    setTab("home");
  }
  return(<div style={{padding:20}}><h2>🚢 Ship Log</h2><textarea style={{...styles.input,height:120}} placeholder="What did you build today?" value={built} onChange={e=>setBuilt(e.target.value)}/><button style={styles.btnPrimary} onClick={post}>Ship It 🚀</button></div>)
}

function DemoDay({users}) {
  const topBuilders = users.sort((a,b)=>(b.streak||0)-(a.streak||0)).slice(0,3);
  return(<div style={{padding:20}}><h2>🏆 Weekly Demo Day</h2>{topBuilders.map((u,i)=><div key={u.id} style={styles.focusCard}><h3>#{i+1} {u.name}</h3><p>🔥 {u.streak} Day Streak</p></div>)}</div>)
}

function AIInvestorRoom({user, users}) {
  const [pitch, setPitch] = useState(""); const [feedback, setFeedback] = useState([]); const myData = users.find(x=>x.id===user?.uid);
  const getFeedback = () => {
    if((myData?.invites || 0) < 3) return alert("Invite 3 friends first to unlock AI Investors");
    setFeedback([{name: "Sequoia AI", text: `Market for "${pitch}" is too small. 10x it.`, emoji: "😠"},{name: "Angel AI", text: `Love the vision! Can you build MVP in 2 weeks?`, emoji: "😍"}]);
  }
  return(<div style={{padding:20}}><h2>💼 AI Investor Room</h2><p>Invites: {myData?.invites || 0}/3 to unlock</p><input style={styles.input} placeholder="My startup is..." value={pitch} onChange={e=>setPitch(e.target.value)}/><button style={styles.btnPrimary} onClick={getFeedback}>Get Feedback</button>{feedback.map((f,i)=><div key={i} style={styles.focusCard}><h4>{f.emoji} {f.name}</h4><p>{f.text}</p></div>)}</div>)
}

function CofounderSwipe({user, users, db, setChatWith}) {
  const [index, setIndex] = useState(0); const matches = users.filter(u=>u.id!==user.uid && u.goals); const person = matches[index];
  if(!person) return <p style={{textAlign:"center",marginTop:100}}>No more founders</p>
  return(<div style={{textAlign:"center", padding:20}}><h2>🚀 AI Voice Match</h2><div style={styles.focusCard}><img src={person.photo} style={{width:100,height:100,borderRadius:"50%"}}/><h3>{person.name}</h3><p>{person.goals}</p><button style={styles.btnSecondary} onClick={()=>setChatWith(person)}>💬 Message</button></div><button style={styles.btnPrimary} onClick={()=>setIndex(index+1)}>Next Founder</button></div>)
          }
