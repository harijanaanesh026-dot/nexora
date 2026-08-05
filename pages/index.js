import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, limit, deleteDoc } from "firebase/firestore";

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

// ===== INSTAGRAM STYLE THEME =====
const styles = {
  body: {background:"#FA", color:"#262626", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", margin:0, paddingBottom:60},
  header: {display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #DBDBDB", position:"sticky", top:0, background:"white", zIndex:10},
  logo: {fontSize:28, fontWeight:"700", fontFamily:"'Billabong', cursive", background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"},
  bottomNav: {display:"flex", justifyContent:"space-around", padding:"10px 0", borderTop:"1px solid #DBDBDB", position:"fixed", bottom:0, width:"100%", background:"white", fontSize:24},
  post: {background:"white", border:"1px solid #DBDBDB", margin:"16px auto", borderRadius:3, maxWidth:470},
  postHeader: {display:"flex", alignItems:"center", gap:10, padding:14},
  actions: {display:"flex", gap:16, padding:"6px 16px", fontSize:24},
  input: {background:"#FAFAFA", border:"1px solid #DBDBDB", color:"#262626", width:"100%", padding:9, borderRadius:8, fontSize:14},
  btnPrimary: {background:"#0095F6", border:"none", color:"white", padding:"7px 16px", borderRadius:8, fontWeight:"600", width:"100%", fontSize:14},
  btnSecondary: {background:"white", border:"1px solid #DB", color:"#262626", padding:"7px 16px", borderRadius:8, fontWeight:"600", width:"100%", fontSize:14},
  loginWall: {textAlign:"center", padding:40},
  menu: {background:"white", padding:8, margin:"0 16px 8px", borderRadius:8, border:"1px solid #DBDBDB", boxShadow:"0 2px 8px rgba(0,0,0,0.1)"},
  chatBox: {background:"white", border:"1px solid #DBDBDB", borderRadius:8, height:"75vh", display:"flex", flexDirection:"column", maxWidth:470, margin:"0 auto"}
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
          setDoc(userRef, {name: u.displayName, photo: u.photoURL, bio: "", skills: "", goals: "Launch MVP", streak: 0, lastPost: "", revenue: 0, buddy: "", invites: 0, team: []});
        onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
      }
    });
  }, []);

  if (loading) return <div style={styles.body}><h1 style={styles.logo}>ConnectAI</h1></div>

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={styles.logo} onClick={()=>{setTab("home"); setChatWith(null)}} style={{cursor:"pointer", margin:0}}>ConnectAI</h2>
        <div style={{display:"flex", gap:20, fontSize:24}}>
          {user? <span onClick={()=>setTab("add")} style={{cursor:"pointer"}}>➕</span> : null}
          {user? <span>❤️</span> : null}
        </div>
      </div>

      {chatWith?
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
            <span onClick={()=>{setTab("home"); setChatWith(null)}}>🏠</span>
            <span onClick={()=>{setTab("cofounder"); setChatWith(null)}}>🔍</span>
            <span onClick={()=>{setTab("team"); setChatWith(null)}}>🎬</span>
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
      <p>Sign up to see build logs from builders.</p>
      <button style={styles.btnPrimary} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Log In with Google</button>
    </div>
  )
  return children
                                         }
// ===== INSTAGRAM STYLE POST =====
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
    if(!confirm("Delete this build log?")) return;
    await deleteDoc(postRef);
  }

  return(
    <div style={styles.post}>
      <div style={styles.postHeader}>
        <img src={post.photo} style={{width:32,height:32,borderRadius:"50%", border:"2px solid #E1306C"}}/>
        <div style={{flex:1}}>
          <b>{post.name}</b>
          {post.team && <p style={{fontSize:12, margin:0, color:"#8E8E8E"}}>with {post.team}</p>}
        </div>
        {!isOwner && user && <button onClick={()=>setChatWith({id: post.uid, name: post.name, photo: post.photo})} style={{background:"none", border:"none", color:"#0095F6", fontWeight:600, cursor:"pointer"}}>Message</button>}
        {isOwner && <span onClick={()=>setShowMenu(!showMenu)} style={{cursor:"pointer", fontSize:20}}>⋯</span>}
      </div>

      {showMenu && isOwner && <div style={styles.menu}>
        <p onClick={()=>{setIsEditing(true); setShowMenu(false)}} style={{cursor:"pointer", margin:5}}>Edit</p>
        <p onClick={deletePost} style={{cursor:"pointer", margin:5, color:"red"}}>Delete</p>
      </div>}

      {isEditing? (
        <div style={{padding:16}}>
          <textarea style={{...styles.input,height:100}} value={editText} onChange={e=>setEditText(e.target.value)}/>
          <button style={styles.btnPrimary} onClick={async()=>{await updateDoc(postRef, {built: editText}); setIsEditing(false)}}>Done</button>
        </div>
      ) : (
        <p style={{padding:"0 16px 12px"}}><b>{post.name}</b> {post.built}</p>
      )}

      <div style={styles.actions}>
        <span onClick={like}>{liked?"❤️":"🤍"}</span>
        <span>💬</span>
        <span>📤</span>
      </div>
      <p style={{padding:"0 16px", fontWeight:600, fontSize:14}}>{post.likes?.length} likes</p>

      {/* COMMENTS */}
      <div style={{padding:"0 16px 16px"}}>
        {comments.slice(0,3).map(c=>(
          <p key={c.id} style={{fontSize:14, margin:"4px 0"}}><b>{c.name}</b> {c.comment}</p>
        ))}
        {user && <div style={{display:"flex", gap:8, marginTop:8}}>
          <input style={{...styles.input, border:"none", background:"transparent"}} placeholder="Add a comment..." value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=> e.key === 'Enter' && addComment()}/>
          <button style={{background:"none", border:"none", color:"#0095F6", fontWeight:600}} onClick={addComment}>Post</button>
        </div>}
      </div>
    </div>
  )
}

// ===== INSTAGRAM STYLE DM =====
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
    <div style={{padding:0}}>
      <div style={{display:"flex", alignItems:"center", gap:10, padding:14, borderBottom:"1px solid #DBDBDB"}}>
        <span onClick={onBack} style={{fontSize:24, cursor:"pointer"}}>←</span>
        <img src={otherUser.photo} style={{width:32,height:32,borderRadius:"50%"}}/>
        <b>{otherUser.name}</b>
      </div>

      <div style={styles.chatBox}>
        <div style={{flex:1, overflowY:"auto", padding:16}}>
          {messages.map(m=>(
            <div key={m.id} style={{display:"flex", justifyContent: m.from === user.uid? "flex-end" : "flex-start", marginBottom:12}}>
              <p style={{background: m.from === user.uid? "#0095F6" : "#EFEFEF", color: m.from === user.uid? "white" : "#262626", padding:"8px 12px", borderRadius:18, maxWidth:"70%"}}>
                {m.text}
              </p>
            </div>
          ))}
        </div>
        <div style={{display:"flex", gap:8, padding:12, borderTop:"1px solid #DBDBDB"}}>
          <input style={styles.input} placeholder="Message..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=> e.key === 'Enter' && sendMsg()}/>
          <button style={{background:"none", border:"none", color:"#0095F6", fontWeight:600}} onClick={sendMsg}>Send</button>
        </div>
      </div>
    </div>
  )
}

// ===== FEED =====
function Feed({user, users, db, setChatWith}) {
  const [posts, setPosts] = useState([]);
  useEffect(()=>{
    onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc"), limit(10)), snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))))
  },[]);

  return(
    <div style={{paddingBottom:20}}>
      {posts.map(p=><Post key={p.id} post={p} user={user} db={db} setChatWith={setChatWith}/>)}
    </div>
  )
}

// ===== REST - SAME LOGIC, INSTAGRAM COLORS =====
function CreatePost({user,db,setTab}) {
  const [built, setBuilt] = useState("");
  const post = async()=>{
    if(!built) return alert("Write what you built today");
    await addDoc(collection(db,"posts"),{uid:user.uid, name:user.displayName, photo:user.photoURL, built, likes:[], createdAt:serverTimestamp()});
    const userRef = doc(db,"users",user.uid); const snap = await getDoc(userRef); const today = new Date().toDateString(); const data = snap.data();
    if(data.lastPost!== today){ await updateDoc(userRef, {streak: (data.streak||0)+1, lastPost: today}) }
    setTab("home");
  }
  return(<div style={{padding:20, maxWidth:470, margin:"0 auto"}}><h2>Create New Post</h2><textarea style={{...styles.input,height:120}} placeholder="What did you build today?" value={built} onChange={e=>setBuilt(e.target.value)}/><button style={styles.btnPrimary} onClick={post}>Share</button></div>)
}

function ProfilePage({user, db, users}) {
  const [profile, setProfile] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setProfile(d.data())) },[]);
  const save=()=>setDoc(doc(db,"users",user.uid),profile,{merge:true});
  return (<div style={{padding:20, maxWidth:470, margin:"0 auto"}}><img src={profile.photo} style={{width:80,height:80,borderRadius:"50%"}}/><h2>{profile.name}</h2><p>🔥 {profile.streak || 0} day streak</p><input style={styles.input} placeholder="Bio" value={profile.bio||""} onChange={e=>setProfile({...profile,bio:e.target.value})}/><button style={styles.btnPrimary} onClick={save}>Save</button><button style={styles.btnSecondary} onClick={()=>signOut(auth)}>Logout</button></div>)
}

function CofounderSwipe({user, users, db, setChatWith}) {
  const [index, setIndex] = useState(0); const matches = users.filter(u=>u.id!==user.uid && u.goals); const person = matches[index];
  if(!person) return <p style={{textAlign:"center",marginTop:100}}>No more founders</p>
  return(<div style={{textAlign:"center", padding:20}}><div style={styles.post}><img src={person.photo} style={{width:"100%"}}/><div style={{padding:16}}><h3>{person.name}</h3><p>{person.goals}</p><button style={styles.btnPrimary} onClick={()=>setChatWith(person)}>Message</button></div></div><button style={styles.btnSecondary} onClick={()=>setIndex(index+1)}>Next</button></div>)
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
    alert("Posted! 🚀");
  }
  return(<div style={{padding:20, maxWidth:470, margin:"0 auto"}}><h2>Team Ship Log</h2><textarea style={{...styles.input,height:100}} placeholder="What did we build?" value={built} onChange={e=>setBuilt(e.target.value)}/><input style={styles.input} placeholder="Tag team" value={team} onChange={e=>setTeam(e.target.value)}/><button style={styles.btnPrimary} onClick={postTeam}>Share</button></div>)
}

function AIPitchGenerator({user, db, users}) {
  const [idea, setIdea] = useState(""); const [deck, setDeck] = useState([]); const myData = users.find(x=>x.id===user?.uid);
  const generateDeck = () => {
    if((myData?.invites || 0) < 3) return alert(`Invite ${3 - (myData?.invites || 0)} more friends`);
    setDeck([`Problem: ${idea}`, `Solution: AI for ${idea}`, `Market: $10B`, `Team: ConnectAI`, `Ask: $500K`]);
  }
  return(<div style={{padding:20, maxWidth:470, margin:"0 auto"}}><h2>AI Pitch Deck</h2><input style={styles.input} placeholder="Your idea" value={idea} onChange={e=>setIdea(e.target.value)}/><button style={styles.btnPrimary} onClick={generateDeck}>Generate</button>{deck.map((d,i)=><div key={i} style={styles.post}><div style={{padding:16}}><b>Slide {i+1}</b><p>{d}</p></div></div>)}</div>)
}

function AIInvestorRoom({user, users}) {
  const [pitch, setPitch] = useState(""); const [feedback, setFeedback] = useState([]); const myData = users.find(x=>x.id===user?.uid);
  const getFeedback = () => {
    if((myData?.invites || 0) < 3) return alert("Invite 3 friends first");
    setFeedback([{name: "Sequoia AI", text: `Market for "${pitch}" is too small.`},{name: "Angel AI", text: `Love the vision! Can you build MVP in 2 weeks?`}]);
  }
  return(<div style={{padding:20, maxWidth:470, margin:"0 auto"}}><h2>AI Investor Room</h2><input style={styles.input} placeholder="My startup is..." value={pitch} onChange={e=>setPitch(e.target.value)}/><button style={styles.btnPrimary} onClick={getFeedback}>Get Feedback</button>{feedback.map((f,i)=><div key={i} style={styles.post}><div style={{padding:16}}><h4>{f.name}</h4><p>{f.text}</p></div></div>)}</div>)
                                     }
