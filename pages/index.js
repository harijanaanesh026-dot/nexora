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

// ===== DARK NEON THEME =====
const styles = {
  body: {background:"linear-gradient(180deg,#050A18 0%, #0A0F1E 100%)", color:"#E2E8F0", fontFamily:"'Inter', sans-serif", margin:0, paddingBottom:70},
  header: {display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #1E293B", position:"sticky", top:0, background:"rgba(5,10,24,0.8)", backdropFilter:"blur(10px)", zIndex:10},
  logo: {fontSize:26, fontWeight:"800", background: "linear-gradient(90deg, #38BDF8, #A855F7, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"},
  bottomNav: {display:"flex", justifyContent:"space-around", padding:"12px 0", borderTop:"1px solid #1E293B", position:"fixed", bottom:0, width:"100%", background:"rgba(5,10,24,0.9)", backdropFilter:"blur(10px)", fontSize:24},
  storiesBar: {display:"flex", gap:12, padding:"12px 16px", overflowX:"auto", borderBottom:"1px solid #1E293B"},
  story: {display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:64},
  storyRing: {width:64, height:64, borderRadius:"50%", padding:2, background:"linear-gradient(45deg, #F59E0B, #EC4899, #8B5CF6)"},
  storyRingSeen: {width:64, height:64, borderRadius:"50%", padding:2, background:"#334155"},
  storyImg: {width:"100%", height:"100%", borderRadius:"50%", border:"2px solid #050A18"},
  post: {background:"#0F172A", border:"1px solid #1E293B", margin:"16px", borderRadius:16},
  postHeader: {display:"flex", alignItems:"center", gap:10, padding:14},
  actions: {display:"flex", gap:16, padding:"10px 16px", fontSize:24},
  input: {background:"#1E293B", border:"1px solid #334155", color:"white", width:"100%", padding:10, borderRadius:12, fontSize:14},
  btnPrimary: {background:"linear-gradient(90deg, #38BDF8, #A855F7)", border:"none", color:"white", padding:"10px 20px", borderRadius:12, fontWeight:"700", width:"100%"},
  loginWall: {textAlign:"center", padding:40},
  chatBox: {background:"#0F172A", border:"1px solid #1E293B", borderRadius:16, height:"75vh", display:"flex", flexDirection:"column", margin:"0 16px"}
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
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
          setDoc(userRef, {name: u.displayName, photo: u.photoURL, bio: "", skills: "", goals: "Launch MVP", streak: 0, lastPost: "", revenue: 0, buddy: "", invites: 0, team: []});
        onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
        // Load stories
        onSnapshot(query(collection(db,"stories"), where("expiresAt", ">", new Date()), orderBy("expiresAt","desc")),
          snap => setStories(snap.docs.map(d=>({id:d.id,...d.data()}))))
      }
    });
  }, []);

  if (loading) return <div style={styles.body}><h1 style={styles.logo}>NexoraAI</h1></div>

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={styles.logo} onClick={()=>{setTab("home"); setChatWith(null)}} style={{cursor:"pointer", margin:0}}>NexoraAI</h2>
        <div style={{display:"flex", gap:20, fontSize:24}}>
          {user && <span onClick={()=>setTab("add")} style={{cursor:"pointer"}}>➕</span>}
        </div>
      </div>

      {storyViewer && <StoryViewer story={storyViewer} onClose={()=>setStoryViewer(null)} user={user} db={db}/>}

      {chatWith?
        <DMChat user={user} otherUser={chatWith} db={db} onBack={()=>setChatWith(null)}/>
      :
        <>
          {tab === "home" && <Feed user={user} users={users} db={db} setChatWith={setChatWith} stories={stories} setStoryViewer={setStoryViewer}/>}
          {tab === "cofounder" && <AuthWall user={user}><CofounderSwipe user={user} users={users} db={db} setChatWith={setChatWith}/></AuthWall>}
          {tab === "add" && <AuthWall user={user}><CreatePost user={user} db={db} setTab={setTab} users={users}/></AuthWall>}
          {tab === "profile" && <AuthWall user={user}><ProfilePage user={user} db={db} users={users} setChatWith={setChatWith}/></AuthWall>}
          {tab === "team" && <AuthWall user={user}><TeamShipLog user={user} db={db}/></AuthWall>}
          {tab === "demoday" && <DemoDay users={users}/>}

          <div style={styles.bottomNav}>
            <span onClick={()=>{setTab("home"); setChatWith(null)}}>🏠</span>
            <span onClick={()=>{setTab("cofounder"); setChatWith(null)}}>🔍</span>
            <span onClick={()=>{setTab("team"); setChatWith(null)}}>👥</span>
            <span onClick={()=>{setTab("demoday"); setChatWith(null)}}>🏆</span>
            <span onClick={()=>{setTab("profile"); setChatWith(null)}}>👤</span>
          </div>
        </>
      }
    </div>
  )
}

function AuthWall({user, children}) {
  if(!user) return(
    <div style={styles.loginWall}>
      <h2 style={styles.logo}>ConnectAI</h2>
      <p>Join builders. Ship daily.</p>
      <button style={styles.btnPrimary} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Continue with Google</button>
    </div>
  )
  return children
    }

// ===== STORIES BAR + STORY VIEWER =====
function Feed({user, users, db, setChatWith, stories, setStoryViewer}) {
  const [posts, setPosts] = useState([]);
  const myStory = stories.find(s=>s.uid === user?.uid);
  const otherStories = stories.filter(s=>s.uid!== user?.uid);

  useEffect(()=>{
    onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc"), limit(10)), snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))))
  },[]);

  const addStory = async () => {
    if(!user) return;
    const text = prompt("What did you build today?");
    if(!text) return;
    await addDoc(collection(db,"stories"),{
      uid: user.uid, name: user.displayName, photo: user.photoURL,
      text, createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24*60*60*1000) // 24 hours
    });
  }

  return(
    <div>
      {/* STORIES BAR */}
      <div style={styles.storiesBar}>
        <div style={styles.story} onClick={addStory}>
          <div style={myStory? styles.storyRing : {width:64,height:64,borderRadius:"50%",border:"2px dashed #334155", display:"flex",alignItems:"center",justifyContent:"center", fontSize:30}}>+</div>
          <span style={{fontSize:12}}>Your Story</span>
        </div>
        {otherStories.map(s=>(
          <div key={s.id} style={styles.story} onClick={()=>setStoryViewer(s)}>
            <div style={styles.storyRing}>
              <img src={s.photo} style={styles.storyImg}/>
            </div>
            <span style={{fontSize:12}}>{s.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>

      {/* POSTS */}
      {posts.map(p=><Post key={p.id} post={p} user={user} db={db} setChatWith={setChatWith}/>)}
    </div>
  )
}

// Full screen story viewer
function StoryViewer({story, onClose, user, db}) {
  const [progress, setProgress] = useState(0);
  useEffect(()=>{
    const interval = setInterval(()=>setProgress(p=>p+2), 100);
    const timeout = setTimeout(onClose, 5000);
    return ()=>{clearInterval(interval); clearTimeout(timeout)}
  },[]);

  return(
    <div style={{position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"black", zIndex:100, display:"flex", flexDirection:"column"}}>
      <div style={{height:3, background:"#334155", margin:10, borderRadius:2}}>
        <div style={{height:"100%", width:`${progress}%`, background:"white", borderRadius:2}}></div>
      </div>
      <div style={{display:"flex", alignItems:"center", gap:10, padding:16}}>
        <img src={story.photo} style={{width:32,height:32,borderRadius:"50%"}}/>
        <b>{story.name}</b>
        <span onClick={onClose} style={{marginLeft:"auto", fontSize:24}}>×</span>
      </div>
      <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
        <h2 style={{fontSize:28, textAlign:"center"}}>{story.text}</h2>
      </div>
      {user && <div style={{padding:16}}>
        <button style={styles.btnPrimary} onClick={()=>{onClose(); alert("DM feature here")}}>Reply</button>
      </div>}
    </div>
  )
}

// ===== DARK THEME POST =====
function Post({post,user,db,setChatWith}) {
  const [liked, setLiked] = useState(post.likes?.includes(user?.uid));
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const postRef = doc(db,"posts",post.id);

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

  return(
    <div style={styles.post}>
      <div style={styles.postHeader}>
        <img src={post.photo} style={{width:32,height:32,borderRadius:"50%", border:"2px solid #38BDF8"}}/>
        <div style={{flex:1}}><b>{post.name}</b></div>
        {!user?.uid === post.uid && user && <button onClick={()=>setChatWith({id: post.uid, name: post.name, photo: post.photo})} style={{background:"none", border:"1px solid #38BDF8", color:"#38BDF8", padding:"5px 10px", borderRadius:8}}>Message</button>}
      </div>

      <p style={{padding:"0 16px 12px"}}><b>{post.name}</b> {post.built}</p>

      <div style={styles.actions}>
        <span onClick={like}>{liked?"🔥":"🤍"}</span>
        <span>💬</span>
      </div>
      <p style={{padding:"0 16px", fontWeight:600}}>{post.likes?.length} builders</p>

      <div style={{padding:"0 16px 16px"}}>
        {comments.map(c=>(
          <p key={c.id} style={{fontSize:14, margin:"4px 0"}}><b>{c.name}</b> {c.comment}</p>
        ))}
        {user && <div style={{display:"flex", gap:8, marginTop:8}}>
          <input style={styles.input} placeholder="Add comment..." value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=> e.key === 'Enter' && addComment()}/>
          <button style={{background:"linear-gradient(90deg, #38BDF8, #A855F7)", border:"none", color:"white", padding:"8px 14px", borderRadius:8}} onClick={addComment}>Post</button>
        </div>}
      </div>
    </div>
  )
}

// ===== DM CHAT =====
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
    <div>
      <div style={{display:"flex", alignItems:"center", gap:10, padding:16, borderBottom:"1px solid #1E293B"}}>
        <span onClick={onBack} style={{fontSize:24, cursor:"pointer"}}>←</span>
        <img src={otherUser.photo} style={{width:32,height:32,borderRadius:"50%"}}/>
        <b>{otherUser.name}</b>
      </div>
      <div style={styles.chatBox}>
        <div style={{flex:1, overflowY:"auto", padding:16}}>
          {messages.map(m=>(
            <div key={m.id} style={{display:"flex", justifyContent: m.from === user.uid? "flex-end" : "flex-start", marginBottom:12}}>
              <p style={{background: m.from === user.uid? "linear-gradient(90deg, #38BDF8, #A855F7)" : "#1E293B", color: "white", padding:"10px 14px", borderRadius:18, maxWidth:"70%"}}>
                {m.text}
              </p>
            </div>
          ))}
        </div>
        <div style={{display:"flex", gap:8, padding:16, borderTop:"1px solid #1E293B"}}>
          <input style={styles.input} placeholder="Message..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=> e.key === 'Enter' && sendMsg()}/>
          <button style={styles.btnPrimary} onClick={sendMsg}>Send</button>
        </div>
      </div>
    </div>
  )
}

// ===== OTHER COMPONENTS =====
function CreatePost({user,db,setTab}) {
  const [built, setBuilt] = useState("");
  const post = async()=>{
    if(!built) return alert("Write what you built");
    await addDoc(collection(db,"posts"),{uid:user.uid, name:user.displayName, photo:user.photoURL, built, likes:[], createdAt:serverTimestamp()});
    const userRef = doc(db,"users",user.uid); const snap = await getDoc(userRef); const today = new Date().toDateString(); const data = snap.data();
    if(data.lastPost!== today){ await updateDoc(userRef, {streak: (data.streak||0)+1, lastPost: today}) }
    setTab("home");
  }
  return(<div style={{padding:20}}><h2>🚢 Ship Log</h2><textarea style={{...styles.input,height:120}} placeholder="What did you build today?" value={built} onChange={e=>setBuilt(e.target.value)}/><button style={styles.btnPrimary} onClick={post}>Ship It 🚀</button></div>)
}

function ProfilePage({user, db, users}) {
  const [profile, setProfile] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setProfile(d.data())) },[]);
  const save=()=>setDoc(doc(db,"users",user.uid),profile,{merge:true});
  return (<div style={{padding:20}}><img src={profile.photo} style={{width:80,height:80,borderRadius:"50%", border:"3px solid #38BDF8"}}/><h2>{profile.name}</h2><p>🔥 {profile.streak || 0} day streak</p><input style={styles.input} placeholder="Bio" value={profile.bio||""} onChange={e=>setProfile({...profile,bio:e.target.value})}/><button style={styles.btnPrimary} onClick={save}>Save</button><button style={{...styles.btnPrimary, background:"#F87171", marginTop:10}} onClick={()=>signOut(auth)}>Logout</button></div>)
}

function CofounderSwipe({user, users, db, setChatWith}) {
  const [index, setIndex] = useState(0); const matches = users.filter(u=>u.id!==user.uid && u.goals); const person = matches[index];
  if(!person) return <p style={{textAlign:"center",marginTop:100}}>No more founders</p>
  return(<div style={{textAlign:"center", padding:20}}><div style={styles.post}><img src={person.photo} style={{width:100,height:100,borderRadius:"50%", marginTop:20}}/><div style={{padding:16}}><h3>{person.name}</h3><p>{person.goals}</p><button style={styles.btnPrimary} onClick={()=>setChatWith(person)}>💬 Message</button></div></div><button style={{...styles.btnPrimary, background:"#334155"}} onClick={()=>setIndex(index+1)}>Next</button></div>)
}

function DemoDay({users}) {
  const topBuilders = users.sort((a,b)=>(b.streak||0)-(a.streak||0)).slice(0,3);
  return(<div style={{padding:20}}><h2>🏆 Top Builders</h2>{topBuilders.map((u,i)=><div key={u.id} style={styles.post}><div style={{padding:16}}><h3>#{i+1} {u.name}</h3><p>🔥 {u.streak} Day Streak</p></div></div>)}</div>)
}

function TeamShipLog({user, db}) {
  const [built, setBuilt] = useState(""); const [team, setTeam] = useState("");
  const postTeam = async()=>{
    if(!built ||!team) return alert("Write what you built + Tag team");
    await addDoc(collection(db,"posts"),{uid:user.uid, name:user.displayName, photo:user.photoURL, built, team, type:"team", likes:[], createdAt:serverTimestamp()});
    alert("Team Log Posted! 🚀");
  }
  return(<div style={{padding:20}}><h2>👥 Team Ship Log</h2><textarea style={{...styles.input,height:100}} placeholder="What did we build?" value={built} onChange={e=>setBuilt(e.target.value)}/><input style={styles.input} placeholder="Tag team" value={team} onChange={e=>setTeam(e.target.value)}/><button style={styles.btnPrimary} onClick={postTeam}>Ship as Team 🚢</button></div>)
}
