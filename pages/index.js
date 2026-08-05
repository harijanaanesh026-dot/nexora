import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
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

// FIX: MESSAGING NI BROWSER LO MATRAM RAN CHEYYADANIKI
let messaging = null;
if (typeof window!== 'undefined') {
  import("firebase/messaging").then(({ getMessaging, getToken }) => {
    messaging = getMessaging(app);
  });
}

const styles = {
  body: {background:"#000", color:"white", fontFamily:"-apple-system,BlinkMacSystemFont", margin:0, paddingBottom:70},
  header: {display:"flex", justifyContent:"space-between", padding:"10px 15px", borderBottom:"1px solid #262626", position:"sticky", top:0, background:"#000", zIndex:10},
  bottomNav: {display:"flex", justifyContent:"space-around", padding:"10px 0", borderTop:"1px solid #262626", position:"fixed", bottom:0, width:"100%", background:"#000", fontSize:24},
  story: {display:"flex", gap:15, padding:10, overflowX:"scroll", borderBottom:"1px solid #262626"},
  storyCircle: {width:66, height:66, borderRadius:"50%", padding:2, background:"linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"},
  post: {borderBottom:"1px solid #262626", marginBottom:20},
  postHeader: {display:"flex", alignItems:"center", gap:10, padding:10},
  postImg: {width:"100%", maxHeight:500, objectFit:"cover"},
  actions: {display:"flex", gap:15, padding:10, fontSize:24},
  input: {background:"transparent", border:"none", color:"white", width:"80%"},
  btn: {background:"none", border:"none", color:"#0095f6", fontWeight:"bold"},
  card: {background:"#1a1a1a", padding:15, margin:15, borderRadius:15}
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u) {
        if(!(await getDoc(doc(db, "users", u.uid))).exists())
          setDoc(doc(db, "users", u.uid), {name: u.displayName, photo: u.photoURL, bio: "", skills: "", goals: "", following: []});
        onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
        
        // NOTIFICATION TOKEN - BROWSER LO MATRAM
        if(typeof window!== 'undefined' && messaging) {
          import("firebase/messaging").then(({ getToken }) => {
            Notification.requestPermission().then(p=>{ 
              if(p==="granted") getToken(messaging).then(t=>setDoc(doc(db,"users",u.uid),{fcmToken:t},{merge:true})) 
            })
          })
        }
      }
    });
  }, []);

  if (!user) return (
    <div style={{...styles.body, textAlign:"center", paddingTop:100}}>
      <h1 style={{fontFamily:"cursive", fontSize:50}}>ConnectAI</h1>
      <button style={{background:"#0095f6",border:"none",padding:"8px 30px",borderRadius:8,color:"white"}} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Log in with Google</button>
    </div>
  )

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={{fontFamily:"cursive", margin:0}}>ConnectAI</h2>
        <span onClick={()=>setTab("chat")}>✉️</span>
      </div>

      {tab === "home" && <Feed user={user} users={users} db={db} storage={storage}/>}
      {tab === "search" && <AIMatch user={user} users={users}/>}
      {tab === "add" && <CreatePost user={user} db={db} storage={storage} setTab={setTab}/>}
      {tab === "reels" && <ReelsPage user={user} db={db}/>}
      {tab === "reelAdd" && <CreateReel user={user} db={db} storage={storage} setTab={setTab}/>}
      {tab === "cofounder" && <CofounderSwipe user={user} users={users} db={db}/>}
      {tab === "profile" && <ProfilePage user={user} db={db}/>}
      {tab === "chat" && <ChatPage user={user} users={users} db={db} setTab={setTab}/>}

      <div style={styles.bottomNav}>
        <span onClick={()=>setTab("home")}>🏠</span>
        <span onClick={()=>setTab("search")}>🔍</span>
        <span onClick={()=>setTab("add")}>🖼️</span>
        <span onClick={()=>setTab("reelAdd")}>🎬</span>
        <span onClick={()=>setTab("cofounder")}>🤝</span>
        <span onClick={()=>setTab("profile")}>👤</span>
      </div>
    </div>
  )
}

// ===== FEED + STORIES =====
function Feed({user, users, db, storage}) {
  const [posts, setPosts] = useState([]);
  useEffect(()=>{ onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc")), snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()})))) },[]);
  return(
    <div>
      <div style={styles.story}>
        <div style={{textAlign:"center"}}><div style={styles.storyCircle}><img src={user.photoURL} style={{width:62,height:62,borderRadius:"50%",border:"2px solid black"}}/></div><p style={{fontSize:12}}>Your Story</p></div>
        {users.slice(0,8).map(u=>(<div key={u.id} style={{textAlign:"center"}}><div style={styles.storyCircle}><img src={u.photo} style={{width:62,height:62,borderRadius:"50%",border:"2px solid black"}}/></div><p style={{fontSize:12}}>{u.name?.split(" ")[0]}</p></div>))}
      </div>
      {posts.map(p=><Post key={p.id} post={p} user={user} db={db}/>)}
    </div>
  )
}

function Post({post,user,db}) {
  const [liked, setLiked] = useState(post.likes?.includes(user.uid));
  const [comment, setComment] = useState("");
  const like = async () => {
    const ref = doc(db,"posts",post.id);
    liked? updateDoc(ref,{likes:arrayRemove(user.uid)}) : updateDoc(ref,{likes:arrayUnion(user.uid)});
    if(post.uid!==user.uid) addDoc(collection(db,"notifications"),{to:post.uid, text:`${user.displayName} liked your post`});
    setLiked(!liked);
  }
  const sendComment = async () => { if(!comment) return; await updateDoc(doc(db,"posts",post.id), {comments: arrayUnion({uid:user.uid, name:user.displayName, text:comment})}); setComment(""); }
  return(
    <div style={styles.post}>
      <div style={styles.postHeader}><img src={post.photo} style={{width:32,height:32,borderRadius:"50%"}}/><b>{post.name}</b></div>
      {post.image && <img src={post.image} style={styles.postImg}/>}
      <div style={styles.actions}><span onClick={like}>{liked?"❤️":"🤍"}</span><span>💬</span><span>📤</span></div>
      <p style={{padding:"0 10px"}}><b>{post.likes?.length} likes</b></p>
      <p style={{padding:"0 10px"}}><b>{post.name}</b> {post.text}</p>
      {post.comments?.map((c,i)=><p key={i} style={{padding:"0 10px", fontSize:14}}><b>{c.name}</b> {c.text}</p>)}
      <div style={{display:"flex", padding:10}}><img src={user.photoURL} style={{width:24,height:24,borderRadius:"50%"}}/><input style={styles.input} placeholder="Add a comment..." value={comment} onChange={e=>setComment(e.target.value)}/><button style={styles.btn} onClick={sendComment}>Post</button></div>
    </div>
  )
}

// ===== CREATE POST =====
function CreatePost({user,db,storage,setTab}) {
  const [text, setText] = useState(""); const [file, setFile] = useState(null);
  const post = async()=>{ let img=""; if(file){const r=ref(storage,`posts/${Date.now()}`); await uploadBytes(r,file); img=await getDownloadURL(r);} await addDoc(collection(db,"posts"),{uid:user.uid, name:user.displayName, photo:user.photoURL, text, image:img, likes:[], comments:[], createdAt:serverTimestamp()}); setTab("home"); }
  return(<div style={{padding:20}}><h2>Create Post</h2><input type="file" onChange={e=>setFile(e.target.files[0])}/><textarea style={{...styles.input,width:"100%",height:100,background:"#262626",borderRadius:8,padding:10,marginTop:10}} placeholder="Caption..." value={text} onChange={e=>setText(e.target.value)}/><button style={{...styles.btn,background:"#0095f6",color:"white",padding:"8px 20px",borderRadius:8,marginTop:10}} onClick={post}>Share</button></div>)
}

// ===== REELS =====
function ReelsPage({user, db}) {
  const [reels, setReels] = useState([]);
  useEffect(()=>{ onSnapshot(collection(db,"reels"), snap=>setReels(snap.docs.map(d=>({id:d.id,...d.data()})))) },[]);
  return(<div style={{height:"100vh", overflowY:"scroll", scrollSnapType:"y mandatory"}}>{reels.map(r=>(<div key={r.id} style={{height:"100vh", scrollSnapAlign:"start", position:"relative"}}><video src={r.video} style={{width:"100%", height:"100%", objectFit:"cover"}} autoPlay loop muted/><div style={{position:"absolute", bottom:80, left:10}}><div style={{display:"flex",gap:10}}><img src={r.photo} style={{width:30,height:30,borderRadius:"50%"}}/><b>{r.name}</b></div><p>{r.caption}</p></div></div>))}</div>)
}
function CreateReel({user,db,storage,setTab}) {
  const [caption, setCaption] = useState(""); const [video, setVideo] = useState(null); const [uploading, setUploading] = useState(false);
  const postReel = async()=>{ if(!video) return alert("Select video"); setUploading(true); const r = ref(storage,`reels/${Date.now()}.mp4`); await uploadBytes(r, video); const videoURL = await getDownloadURL(r); await addDoc(collection(db,"reels"),{uid:user.uid, name:user.displayName, photo:user.photoURL, caption, video:videoURL, likes:[], createdAt:serverTimestamp()}); setUploading(false); setTab("reels"); }
  return(<div style={{padding:20, textAlign:"center"}}><h2>Create Reel 🎬</h2><input type="file" accept="video/*" onChange={e=>setVideo(e.target.files[0])}/>{video && <video src={URL.createObjectURL(video)} style={{width:"100%", maxHeight:300}} controls/>}<textarea style={{...styles.input,width:"100%",height:80,background:"#262626",borderRadius:8,padding:10,marginTop:10}} placeholder="Caption" value={caption} onChange={e=>setCaption(e.target.value)}/><button style={{...styles.btn,background:"#0095f6",color:"white",padding:"12px 30px",borderRadius:8,marginTop:10}} onClick={postReel}>{uploading?"Uploading...":"Share Reel"}</button></div>)
}

// ===== CO-FOUNDER SWIPE =====
function CofounderSwipe({user, users, db}) {
  const [index, setIndex] = useState(0);
  const matches = users.filter(u=>u.id!==user.uid && u.goals);
  const swipe = async(direction, targetId)=>{ if(direction==="right") addDoc(collection(db,"matches"), {user1:user.uid, user2:targetId}); setIndex(index+1); }
  if(index >= matches.length) return <p style={{textAlign:"center",marginTop:100}}>No more founders</p>
  const person = matches[index];
  return(<div style={{textAlign:"center", padding:20}}><h2>Find Your Co-founder</h2><div style={{...styles.card, height:400}}><img src={person.photo} style={{width:200,height:200,borderRadius:20}}/><h3>{person.name}</h3><p><b>Goal:</b> {person.goals}</p><p><b>Skills:</b> {person.skills}</p></div><div style={{display:"flex", justifyContent:"space-around", marginTop:20}}><button onClick={()=>swipe("left",person.id)} style={{fontSize:40,background:"red",border:"none",borderRadius:"50%",width:60,height:60}}>❌</button><button onClick={()=>swipe("right",person.id)} style={{fontSize:40,background:"green",border:"none",borderRadius:"50%",width:60,height:60}}>✅</button></div></div>)
}

// ===== PROFILE + CHAT + AI =====
function ProfilePage({user, db}) { const [profile, setProfile] = useState({}); useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setProfile(d.data())) },[]); const save=()=>setDoc(doc(db,"users",user.uid),profile,{merge:true}); return (<div style={{padding:20}}><div style={{display:"flex", gap:20}}><img src={profile.photo} style={{width:80,height:80,borderRadius:"50%"}}/><div><h2>{profile.name}</h2><input style={styles.input} placeholder="Bio" value={profile.bio||""} onChange={e=>setProfile({...profile,bio:e.target.value})}/><input style={styles.input} placeholder="Skills" value={profile.skills||""} onChange={e=>setProfile({...profile,skills:e.target.value})}/><input style={styles.input} placeholder="Goals" value={profile.goals||""} onChange={e=>setProfile({...profile,goals:e.target.value})}/><button onClick={save}>Save</button></div></div><button style={styles.btn} onClick={()=>signOut(auth)}>Logout</button></div>) }
function ChatPage({user,users,db,setTab}){ return(<div style={{padding:20}}><h2>Messages</h2>{users.filter(u=>u.id!==user.uid).map(u=><p key={u.id}>{u.name}</p>)}</div>) }
function AIMatch({user,users}){ return(<div style={{padding:20}}><h2>AI Suggested for You</h2>{users.map(u=><p key={u.id}>{u.name}</p>)}</div>) }
