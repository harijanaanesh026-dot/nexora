import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, limit, deleteDoc, where, increment } from "firebase/firestore";

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

// ===== NEXORA DARK PREMIUM THEME =====
const styles = {
  body: {background:"linear-gradient(180deg,#050A18 0%, #0A0F1E 100%)", color:"#E2E8F0", fontFamily:"'Inter', sans-serif", margin:0, paddingBottom:70},
  header: {display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #1E293B", position:"sticky", top:0, background:"rgba(5,10,24,0.8)", backdropFilter:"blur(10px)", zIndex:10},
  logo: {fontSize:26, fontWeight:"800", background: "linear-gradient(90deg, #38BDF8, #A855F7, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"},
  bottomNav: {display:"flex", justifyContent:"space-around", padding:"12px 0", borderTop:"1px solid #1E293B", position:"fixed", bottom:0, width:"100%", background:"rgba(5,10,24,0.9)", backdropFilter:"blur(10px)", fontSize:24},
  storiesBar: {display:"flex", gap:12, padding:"12px 16px", overflowX:"auto", borderBottom:"1px solid #1E293B"},
  story: {display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:64},
  storyRing: {width:64, height:64, borderRadius:"50%", padding:2, background:"linear-gradient(45deg, #F59E0B, #EC4899, #8B5CF6)"},
  post: {background:"#0F172A", border:"1px solid #1E293B", margin:"16px", borderRadius:16, overflow:"hidden"},
  badge: {background:"linear-gradient(90deg, #F59E0B, #EC4899)", padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700},
  streak: {background:"linear-gradient(90deg, #F97316, #EF4444)", padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700},
  btnPrimary: {background:"linear-gradient(90deg, #38BDF8, #A855F7)", border:"none", color:"white", padding:"10px 20px", borderRadius:12, fontWeight:"700", width:"100%"},
  input: {background:"#1E293B", border:"1px solid #334155", color:"white", width:"100%", padding:10, borderRadius:12, fontSize:14},
  notification: {position:"fixed", top:70, right:16, background:"#1E293B", padding:12, borderRadius:12, border:"1px solid #38BDF8", zIndex:99}
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatWith, setChatWith] = useState(null);
  const [storyViewer, setStoryViewer] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if(u) {
        const userRef = doc(db, "users", u.uid);
        if(!(await getDoc(userRef)).exists())
          setDoc(userRef, {name: u.displayName, photo: u.photoURL, bio: "", skills: "", goals: "Launch MVP", streak: 0, lastPost: "", revenue: 0, buddy: "", invites: 0, badges: [], followers: [], following: []});

        onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
        onSnapshot(query(collection(db,"stories"), where("expiresAt", ">", new Date())), snap => setStories(snap.docs.map(d=>({id:d.id,...d.data()}))));
        // NEW: Notifications
        onSnapshot(query(collection(db,"notifications"), where("to", "==", u.uid), orderBy("createdAt","desc"), limit(5)),
          snap => setNotifications(snap.docs.map(d=>({id:d.id,...d.data()}))));
      }
    });
  }, []);

  if (loading) return <div style={styles.body}><h1 style={styles.logo}>NexoraAI</h1></div>

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={styles.logo} onClick={()=>{setTab("home"); setChatWith(null)}}>NexoraAI</h2>
        <div style={{display:"flex", gap:16, alignItems:"center"}}>
          <span style={{position:"relative"}}>🔔{notifications.length>0 && <span style={{position:"absolute", top:-5, right:-5, background:"red", borderRadius:"50%", width:8, height:8}}></span>}</span>
          {user && <span onClick={()=>setTab("add")} style={{cursor:"pointer"}}>➕</span>}
        </div>
      </div>

      {storyViewer && <StoryViewer story={storyViewer} onClose={()=>setStoryViewer(null)} user={user} db={db}/>}
      {chatWith? <DMChat user={user} otherUser={chatWith} db={db} onBack={()=>setChatWith(null)}/>
      :
        <>
          {tab === "home" && <Feed user={user} users={users} db={db} setChatWith={setChatWith} stories={stories} setStoryViewer={setStoryViewer}/>}
          {tab === "leaderboard" && <Leaderboard users={users}/>}
          {tab === "cofounder" && <AuthWall user={user}><CofounderSwipe user={user} users={users} db={db} setChatWith={setChatWith}/></AuthWall>}
          {tab === "add" && <AuthWall user={user}><CreatePost user={user} db={db} setTab={setTab} users={users}/></AuthWall>}
          {tab === "profile" && <AuthWall user={user}><ProfilePage user={user} db={db} users={users} setChatWith={setChatWith}/></AuthWall>}
          {tab === "badges" && <AuthWall user={user}><BadgesPage user={user} users={users}/></AuthWall>}

          <div style={styles.bottomNav}>
            <span onClick={()=>{setTab("home"); setChatWith(null)}}>🏠</span>
            <span onClick={()=>{setTab("leaderboard"); setChatWith(null)}}>🏆</span>
            <span onClick={()=>{setTab("cofounder"); setChatWith(null)}}>🚀</span>
            <span onClick={()=>{setTab("badges"); setChatWith(null)}}>🏅</span>
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

// ===== FEATURE 1: STORIES =====
function Feed({user, users, db, setChatWith, stories, setStoryViewer}) {
  const [posts, setPosts] = useState([]);
  const myStory = stories.find(s=>s.uid === user?.uid);

  useEffect(()=>{
    onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc"), limit(20)), snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))))
  },[]);

  const addStory = async () => {
    const text = prompt("What did you build today?");
    if(!text) return;
    await addDoc(collection(db,"stories"),{
      uid: user.uid, name: user.displayName, photo: user.photoURL, text,
      expiresAt: new Date(Date.now() + 24*60*60*1000)
    });
  }

  return(
    <div>
      <div style={styles.storiesBar}>
        <div style={styles.story} onClick={addStory}>
          <div style={{width:64,height:64,borderRadius:"50%",border:"2px dashed #334155", display:"flex",alignItems:"center",justifyContent:"center", fontSize:30}}>+</div>
          <span style={{fontSize:12}}>Your Story</span>
        </div>
        {stories.filter(s=>s.uid!== user?.uid).map(s=>(
          <div key={s.id} style={styles.story} onClick={()=>setStoryViewer(s)}>
            <div style={styles.storyRing}><img src={s.photo} style={{width:"100%",height:"100%",borderRadius:"50%",border:"2px solid #050A18"}}/></div>
            <span style={{fontSize:12}}>{s.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
      {posts.map(p=><Post key={p.id} post={p} user={user} db={db} setChatWith={setChatWith} users={users}/>)}
    </div>
  )
}

// ===== FEATURE 2: BADGES + STREAK =====
function checkBadges(userData, db) {
  const newBadges = [];
  if(userData.streak >= 7 &&!userData.badges?.includes("7day")) newBadges.push("7day");
  if(userData.streak >= 30 &&!userData.badges?.includes("30day")) newBadges.push("30day");
  if(userData.revenue >= 1000 &&!userData.badges?.includes("1k")) newBadges.push("1k");
  if(newBadges.length > 0) updateDoc(doc(db,"users",userData.id), {badges: arrayUnion(...newBadges)});
}

// ===== FEATURE 3: LEADERBOARD =====
function Leaderboard({users}) {
  const top = users.sort((a,b)=>(b.streak||0)-(a.streak||0)).slice(0,10);
  return(<div style={{padding:20}}><h2>🏆 Top Builders This Week</h2>
    {top.map((u,i)=><div key={u.id} style={styles.post}><div style={{padding:16, display:"flex", alignItems:"center", gap:12}}>
      <h2>#{i+1}</h2><img src={u.photo} style={{width:40,height:40,borderRadius:"50%"}}/>
      <div><b>{u.name}</b><p style={{margin:0}}><span style={styles.streak}>🔥 {u.streak} days</span></p></div>
    </div></div>)}
  </div>)
}

// ===== FEATURE 4: NOTIFICATIONS =====
async function sendNotification(db, to, text) {
  await addDoc(collection(db,"notifications"),{to, text, read:false, createdAt:serverTimestamp()})
}

// ===== FEATURE 5: POST WITH LIKE + COMMENT + SHARE =====
function Post({post,user,db,setChatWith, users}) {
  const [liked, setLiked] = useState(post.likes?.includes(user?.uid));
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(()=>{
    onSnapshot(query(collection(db,"posts",post.id,"comments"), orderBy("createdAt","asc")), snap=>setComments(snap.docs.map(d=>({id:d.id,...d.data()}))))
  },[post.id]);

  const like = async () => {
    if(!user) return signInWithPopup(auth, new GoogleAuthProvider());
    if(!liked) sendNotification(db, post.uid, `${user.displayName} liked your build`);
    liked? updateDoc(doc(db,"posts",post.id),{likes:arrayRemove(user.uid)}) : updateDoc(doc(db,"posts",post.id),{likes:arrayUnion(user.uid)});
    setLiked(!liked);
  }

  return(
    <div style={styles.post}>
      <div style={{display:"flex", alignItems:"center", gap:10, padding:14}}>
        <img src={post.photo} style={{width:32,height:32,borderRadius:"50%", border:"2px solid #38BDF8"}}/>
        <b>{post.name}</b>
        {user?.uid!== post.uid && <button onClick={()=>setChatWith({id: post.uid, name: post.name, photo: post.photo})} style={{marginLeft:"auto", background:"none", border:"1px solid #38BDF8", color:"#38BDF8", padding:"5px 10px", borderRadius:8}}>Message</button>}
      </div>
      <p style={{padding:"0 16px"}}><b>{post.name}</b> {post.built}</p>
      <div style={{display:"flex", gap:16, padding:"10px 16px", fontSize:24}}>
        <span onClick={like}>{liked?"🔥":"🤍"}</span><span>💬</span><span>📤</span>
      </div>
      <p style={{padding:"0 16px", fontWeight:600}}>{post.likes?.length} builders supported</p>
      <div style={{padding:"0 16px 16px"}}>
        {comments.map(c=><p key={c.id} style={{fontSize:14, margin:"4px 0"}}><b>{c.name}</b> {c.comment}</p>)}
        {user && <div style={{display:"flex", gap:8}}>
          <input style={styles.input} placeholder="Add comment..." value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=> e.key === 'Enter' && addComment()}/>
          <button style={{background:"linear-gradient(90deg, #38BDF8, #A855F7)", border:"none", color:"white", padding:"8px 14px", borderRadius:8}} onClick={async()=>{
            await addDoc(collection(db,"posts",post.id,"comments"),{uid: user.uid, name: user.displayName, photo: user.photoURL, comment: newComment, createdAt: serverTimestamp()});
            sendNotification(db, post.uid, `${user.displayName} commented`);
            setNewComment("");
          }}>Post</button>
        </div>}
      </div>
    </div>
  )
}

// ===== FEATURE 6: DM CHAT =====
function DMChat({user, otherUser, db, onBack}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const chatId = user.uid < otherUser.id? `${user.uid}_${otherUser.id}` : `${otherUser.id}_${user.uid}`;
  useEffect(()=>{ onSnapshot(query(collection(db,"chats",chatId,"messages"), orderBy("createdAt","asc")), snap=>setMessages(snap.docs.map(d=>({id:d.id,...d.data()})))); },[chatId]);
  const sendMsg = async () => {
    if(!text.trim()) return;
    await addDoc(collection(db,"chats",chatId,"messages"),{from: user.uid, to: otherUser.id, text, createdAt: serverTimestamp()});
    sendNotification(db, otherUser.id, `${user.displayName} sent you a message`);
    setText("");
  }
  return(<div><div style={{display:"flex", alignItems:"center", gap:10, padding:16}}><span onClick={onBack} style={{fontSize:24}}>←</span><b>{otherUser.name}</b></div>
    <div style={{height:"70vh", overflowY:"auto", padding:16}}>{messages.map(m=><div key={m.id} style={{display:"flex", justifyContent: m.from === user.uid? "flex-end" : "flex-start"}}><p style={{background: m.from === user.uid? "linear-gradient(90deg, #38BDF8, #A855F7)" : "#1E293B", padding:"10px 14px", borderRadius:18}}>{m.text}</p></div>)}</div>
    <div style={{display:"flex", gap:8, padding:16}}><input style={styles.input} value={text} onChange={e=>setText(e.target.value)}/><button style={styles.btnPrimary} onClick={sendMsg}>Send</button></div>
  </div>)
}

// ===== FEATURE 7: BADGES PAGE =====
function BadgesPage({user, users}) {
  const u = users.find(x=>x.id===user.uid);
  const allBadges = [
    {id:"7day", name:"7 Day Streak", icon:"🔥", desc:"Build for 7 days straight"},
    {id:"30day", name:"30 Day Warrior", icon:"👑", desc:"Build for 30 days"},
    {id:"1k", name:"$1K Earner", icon:"💰", desc:"Make your first $1000"}
  ];
  return(<div style={{padding:20}}><h2>🏅 Your Badges</h2>{allBadges.map(b=>
    <div key={b.id} style={{...styles.post, opacity: u?.badges?.includes(b.id)? 1 : 0.3}}>
      <div style={{padding:16}}><h3>{b.icon} {b.name}</h3><p>{b.desc}</p></div>
    </div>
  )}</div>)
}

// ===== FEATURE 8: PROFILE + STREAK SAVE =====
function CreatePost({user,db,setTab, users}) {
  const [built, setBuilt] = useState("");
  const post = async()=>{
    if(!built) return alert("Write what you built");
    await addDoc(collection(db,"posts"),{uid:user.uid, name:user.displayName, photo:user.photoURL, built, likes:[], createdAt:serverTimestamp()});
    const userRef = doc(db,"users",user.uid); const snap = await getDoc(userRef); const today = new Date().toDateString(); const data = snap.data();
    if(data.lastPost!== today){
      await updateDoc(userRef, {streak: increment(1), lastPost: today});
      checkBadges({...data, id:user.uid, streak:(data.streak||0)+1}, db);
    }
    setTab("home");
  }
  return(<div style={{padding:20}}><h2>🚢 Ship Log</h2><textarea style={{...styles.input,height:120}} placeholder="What did you build today?" value={built} onChange={e=>setBuilt(e.target.value)}/><button style={styles.btnPrimary} onClick={post}>Ship It 🚀</button></div>)
}

function ProfilePage({user, db, users}) {
  const [profile, setProfile] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setProfile(d.data())) },[]);
  return (<div style={{padding:20}}>
    <img src={profile.photo} style={{width:80,height:80,borderRadius:"50%", border:"3px solid #38BDF8"}}/>
    <h2>{profile.name}</h2>
    <p><span style={styles.streak}>🔥 {profile.streak || 0} Day Streak</span></p>
    <div style={{display:"flex", gap:10}}>{profile.badges?.map(b=><span key={b} style={styles.badge}>{b}</span>)}</div>
    <button style={{...styles.btnPrimary, background:"#F87171", marginTop:10}} onClick={()=>signOut(auth)}>Logout</button>
  </div>)
}

function StoryViewer({story, onClose}) {
  const [progress, setProgress] = useState(0);
  useEffect(()=>{ const i=setInterval(()=>setProgress(p=>p+2), 100); const t=setTimeout(onClose, 5000); return ()=>{clearInterval(i); clearTimeout(t)} },[]);
  return(<div style={{position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"black", zIndex:100}}><div style={{height:3, background:"#334155", margin:10}}><div style={{height:"100%", width:`${progress}%`, background:"white"}}></div></div>
    <div style={{display:"flex", alignItems:"center", gap:10, padding:16}}><img src={story.photo} style={{width:32,height:32,borderRadius:"50%"}}/><b>{story.name}</b><span onClick={onClose} style={{marginLeft:"auto", fontSize:24}}>×</span></div>
    <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}><h2 style={{fontSize:28, textAlign:"center"}}>{story.text}</h2></div>
  </div>)
}

function CofounderSwipe({user, users, db, setChatWith}) {
  const [index, setIndex] = useState(0); const matches = users.filter(u=>u.id!==user.uid && u.goals); const person = matches[index];
  if(!person) return <p style={{textAlign:"center",marginTop:100}}>No more founders</p>
  return(<div style={{textAlign:"center", padding:20}}><div style={styles.post}><img src={person.photo} style={{width:100,height:100,borderRadius:"50%", marginTop:20}}/><div style={{padding:16}}><h3>{person.name}</h3><p>{person.goals}</p><button style={styles.btnPrimary} onClick={()=>setChatWith(person)}>💬 Message</button></div></div><button style={{...styles.btnPrimary, background:"#334155"}} onClick={()=>setIndex(index+1)}>Next</button></div>)
      }
