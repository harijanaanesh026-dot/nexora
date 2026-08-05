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
  sidebar: {display:"none"} // mobile
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

  if (loading) return <div style={styles.body}><h1 style={styles.logo}>ConnectAI</h1></div>

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={styles.logo}>ConnectAI</h2>
        {user? <span>🔥{users.find(x=>x.id===user.uid)?.streak || 0}</span> : <button onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())} style={{background:"none",border:"1px solid #38BDF8",color:"#38BDF8",padding:"5px 10px",borderRadius:8}}>Login</button>}
      </div>

      <div style={{display:"flex"}}>
        <div style={{flex:1}}>
          {tab === "home" && <Feed user={user} users={users} db={db}/>}
          {tab === "cofounder" && <AuthWall user={user}><CofounderSwipe user={user} users={users} db={db}/></AuthWall>}
          {tab === "add" && <AuthWall user={user}><CreatePost user={user} db={db} setTab={setTab} users={users}/></AuthWall>}
          {tab === "aipitch" && <AuthWall user={user}><AIPitchGenerator user={user} db={db} users={users}/></AuthWall>}
          {tab === "demoday" && <DemoDay users={users}/>}
          {tab === "investor" && <AuthWall user={user}><AIInvestorRoom user={user} users={users}/></AuthWall>}
          {tab === "profile" && <AuthWall user={user}><ProfilePage user={user} db={db} users={users}/></AuthWall>}
          {tab === "team" && <AuthWall user={user}><TeamShipLog user={user} db={db}/></AuthWall>}
        </div>

        {/* NEW: SIDEBAR FOR LEADERBOARD + HEATMAP */}
        {user && <div style={{width:300, padding:15}}>
          <Leaderboard users={users}/>
          <Heatmap user={user} db={db}/>
        </div>}
      </div>

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

// ===== POST WITH COMMENTS =====
function Post({post,user,db}) {
  const [liked, setLiked] = useState(post.likes?.includes(user?.uid));
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.built);
  const [showMenu, setShowMenu] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const postRef = doc(db,"posts",post.id);
  const isOwner = user?.uid === post.uid;

  // NEW: Load comments
  useEffect(()=>{
    onSnapshot(query(collection(db,"posts",post.id,"comments"), orderBy("createdAt","asc")),
      snap=>setComments(snap.docs.map(d=>({id:d.id,...d.data()}))))
  },[post.id]);

  const like = async () => {
    if(!user) return signInWithPopup(auth, new GoogleAuthProvider());
    liked? updateDoc(postRef,{likes:arrayRemove(user.uid)}) : updateDoc(postRef,{likes:arrayUnion(user.uid)});
    setLiked(!liked);
  }

  const addComment = async () => {
    if(!user) return signInWithPopup(auth, new GoogleAuthProvider());
    if(!newComment) return;
    await addDoc(collection(db,"posts",post.id,"comments"),{
      uid: user.uid, name: user.displayName, comment: newComment, createdAt: serverTimestamp()
    });
    setNewComment("");
  }

  const deletePost = async () => {
    if(!confirm("Delete this build log permanently?")) return;
    await deleteDoc(postRef);
  }

  const editPost = async () => {
    if(!editText) return;
    await updateDoc(postRef, {built: editText, edited: true});
    setIsEditing(false);
  }

  const reportPost = async () => {
    await addDoc(collection(db,"reports"), {postId: post.id, reportedBy: user.uid, reason: "Spam/Inappropriate", createdAt: serverTimestamp()});
    alert("🚩 Reported. Our team will review this.");
    setShowMenu(false);
  }

  const archivePost = async () => {
    await updateDoc(postRef, {archived: true});
    alert("📦 Post archived. Only you can see it in profile.");
    setShowMenu(false);
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
        {isOwner?
          <span onClick={()=>setShowMenu(!showMenu)} style={{marginLeft:"auto", cursor:"pointer", fontSize:20}}>⋯</span>
          : <span onClick={reportPost} style={{marginLeft:"auto", cursor:"pointer"}}>🚩</span>
        }
      </div>

      {showMenu && isOwner && <div style={styles.menu}>
        <p onClick={()=>{setIsEditing(true); setShowMenu(false)}} style={{cursor:"pointer", margin:5}}>✏️ Edit</p>
        <p onClick={archivePost} style={{cursor:"pointer", margin:5}}>📦 Archive</p>
        <p onClick={deletePost} style={{cursor:"pointer", margin:5, color:"#F87171"}}>🗑️ Delete</p>
      </div>}

      {isEditing? (
        <div style={{padding:15}}>
          <textarea style={{...styles.input,height:100}} value={editText} onChange={e=>setEditText(e.target.value)}/>
          <button style={styles.btnPrimary} onClick={editPost}>Save Changes</button>
          <button style={styles.btnSecondary} onClick={()=>setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <p style={{padding:"15px"}}><b>{post.name}</b> shipped: {post.built}</p>
      )}

      <div style={styles.actions}><span onClick={like}>{liked?"🔥":"🤍"}</span></div>
      <p style={{padding:"0 15px"}}><b>{post.likes?.length} builders</b> supported</p>

      {/* NEW: COMMENTS SECTION */}
      <div style={{padding:"0 15px 15px", borderTop:"1px solid #1E293B", marginTop:10}}>
        {comments.map(c=><p key={c.id} style={{fontSize:14, marginTop:8}}><b>{c.name}</b>: {c.comment}</p>)}
        {user && <div style={{display:"flex", gap:8, marginTop:10}}>
          <input style={{...styles.input, fontSize:14}} placeholder="Add comment..." value={newComment} onChange={e=>setNewComment(e.target.value)}/>
          <button style={{background:"#38BDF8", border:"none", color:"#050A18", padding:"8px 12px", borderRadius:8}} onClick={addComment}>Post</button>
        </div>}
      </div>
    </div>
  )
}

// ===== NEW: LEADERBOARD =====
function Leaderboard({users}) {
  const top = [...users].sort((a,b)=>(b.streak||0)-(a.streak||0)).slice(0,10);
  return(
    <div style={styles.focusCard}>
      <h3>🏆 Top Builders</h3>
      {top.map((u,i)=><div key={u.id} style={{display:"flex", justifyContent:"space-between", padding:"8px 0"}}>
        <span>{i+1}. {u.name}</span>
        <span style={{color:"#F97316"}}>🔥 {u.streak||0}</span>
      </div>)}
    </div>
  )
}

// ===== NEW: HEATMAP =====
function Heatmap({user, db}) {
  const [dates, setDates] = useState([]);
  useEffect(()=>{
    onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc"), limit(100)), snap=>{
      const myPosts = snap.docs.filter(d=>d.data().uid===user.uid);
      setDates(myPosts.map(d=>d.data().createdAt?.toDate().toDateString()));
    })
  },[user]);

  const squares = Array.from({length: 90});
  return(
    <div style={styles.focusCard}>
      <h3>📅 Ship Activity</h3>
      <div style={{display:"grid", gridTemplateColumns:"repeat(15,1fr)", gap:4}}>
        {squares.map((_,i)=>{
          const date = new Date(); date.setDate(date.getDate()-i);
          const shipped = dates.includes(date.toDateString());
          return <div key={i} title={date.toDateString()} style={{width:12, height:12, borderRadius:2, background:shipped?"#22C55E":"#334155"}}></div>
        })}
      </div>
    </div>
  )
                         }

function Feed({user, users, db}) {
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
      {posts.map(p=><div key={p.id} onClick={()=>user && setScrollCount(scrollCount+1)}><Post post={p} user={user} db={db}/></div>)}
    </div>
  )
            }
