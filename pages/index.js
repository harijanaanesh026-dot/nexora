import { useState, useEffect } from "react";
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
  appId: "1:173122711177:web:68e373598d110d80c1e058",
  measurementId: "G-11Y8XF8MBC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u) {
        const q = query(collection(db, "users"));
        onSnapshot(q, (snap) => setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))));
      }
    });
  }, []);

  const googleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  if (!user) {
    return (
      <div className="min-h-screen flex-col items-center justify-center bg-black text-white p-4 text-center">
        <h1 className="text-5xl font-bold mb-2">ConnectAI</h1>
        <button onClick={googleLogin} className="bg-blue-600 px-8 py-3 rounded-lg text-xl">Continue with Google</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto grid grid-cols-4">
        {/* Left Sidebar */}
        <div className="col-span-1 p-4 border-r border-gray-800 h-screen sticky top-0">
          <h1 className="text-2xl font-bold text-green-500 mb-6">ConnectAI</h1>
          <button onClick={()=>setTab("home")} className="block w-full text-left p-2 hover:bg-gray-800 rounded">Home</button>
          <button onClick={()=>setTab("profile")} className="block w-full text-left p-2 hover:bg-gray-800 rounded">Profile</button>
          <button onClick={()=>setTab("ai")} className="block w-full text-left p-2 hover:bg-gray-800 rounded">AI Match</button>
          <button onClick={()=>setTab("chat")} className="block w-full text-left p-2 hover:bg-gray-800 rounded">Chat</button>
          <button onClick={()=>setTab("communities")} className="block w-full text-left p-2 hover:bg-gray-800 rounded">Communities</button>
          <button onClick={logout} className="block w-full text-left p-2 text-red-500">Logout</button>
        </div>

        {/* Main Content */}
        <div className="col-span-3">
          {tab === "home" && <HomeFeed user={user} db={db} storage={storage} users={users}/>}
          {tab === "profile" && <ProfilePage user={user} db={db} storage={storage}/>}
          {tab === "ai" && <AIMatch user={user} users={users} db={db}/>}
          {tab === "chat" && <ChatPage user={user} users={users} db={db}/>}
          {tab === "communities" && <CommunitiesPage user={user} db={db}/>}
        </div>
      </div>
    </div>
  )
}

// ===== PROFILE =====
function ProfilePage({user, db, storage}) {
  const [profile, setProfile] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setProfile(d.data())) },[]);
  const save = async (e) => {
    e.preventDefault();
    await setDoc(doc(db,"users",user.uid), profile, {merge:true});
    alert("Saved!");
  }
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
      <input placeholder="Bio" value={profile.bio||""} onChange={e=>setProfile({...profile,bio:e.target.value})} className="w-full p-2 mb-2 bg-gray-800 rounded"/>
      <input placeholder="Skills" value={profile.skills||""} onChange={e=>setProfile({...profile,skills:e.target.value})} className="w-full p-2 mb-2 bg-gray-800 rounded"/>
      <input placeholder="Goals" value={profile.goals||""} onChange={e=>setProfile({...profile,goals:e.target.value})} className="w-full p-2 mb-2 bg-gray-800 rounded"/>
      <button onClick={save} className="bg-green-600 px-4 py-2 rounded">Save</button>
    </div>
  )
}

// ===== HOME FEED =====
function HomeFeed({user, db, storage, users}) {
  const [posts, setPosts] = useState([]);
  useEffect(()=>{
    const q = query(collection(db,"posts"), orderBy("createdAt","desc"));
    onSnapshot(q, snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  const like = async (id, likes) => {
    const ref = doc(db,"posts",id);
    likes.includes(user.uid)? updateDoc(ref,{likes:arrayRemove(user.uid)}) : updateDoc(ref,{likes:arrayUnion(user.uid)});
  }
  const comment = async (id, text) => {
    if(!text) return;
    await updateDoc(doc(db,"posts",id), {comments: arrayUnion({uid:user.uid, text, time:Date.now()})});
  }

  return (
    <div className="p-4">
      <CreatePost user={user} db={db} storage={storage}/>
      {posts.map(p=>(
        <div key={p.id} className="bg-gray-900 p-4 rounded-lg mb-4">
          <div className="flex items-center mb-2">
            <img src={users.find(u=>u.id===p.uid)?.photo} className="w-10 h-10 rounded-full mr-2"/>
            <b>{users.find(u=>u.id===p.uid)?.name}</b>
            <FollowBtn current={user} target={p.uid} db={db}/>
          </div>
          <p>{p.text}</p>
          {p.image && <img src={p.image} className="rounded mt-2"/>}
          <button onClick={()=>like(p.id,p.likes)} className="mt-2">❤️ {p.likes?.length}</button>
          <CommentBox postId={p.id} comments={p.comments} onComment={comment}/>
        </div>
      ))}
    </div>
  )
}

function CreatePost({user,db,storage}){
  const [text,setText]=useState(""); const [file,setFile]=useState(null);
  const post=async()=>{
    let img=""; if(file){const r=ref(storage,`posts/${Date.now()}`); await uploadBytes(r,file); img=await getDownloadURL(r);}
    await addDoc(collection(db,"posts"),{uid:user.uid,text,image:img,likes:[],comments:[],createdAt:serverTimestamp()});
    setText(""); setFile(null);
  }
  return(
    <div className="bg-gray-900 p-3 rounded-lg mb-4">
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What's on your mind?" className="w-full bg-gray-800 p-2 rounded mb-2"/>
      <input type="file" onChange={e=>setFile(e.target.files[0])} className="mb-2"/>
      <button onClick={post} className="bg-green-600 px-4 py-2 rounded">Post</button>
    </div>
  )
}

function CommentBox({postId,comments,onComment}){
  const [c,setC]=useState("");
  return(
    <div className="mt-2">
      {comments?.map((com,i)=><p key={i} className="text-sm text-gray-400">{com.text}</p>)}
      <div className="flex">
        <input value={c} onChange={e=>setC(e.target.value)} className="bg-gray-800 p-1 rounded flex-1"/>
        <button onClick={()=>{onComment(postId,c); setC("");}} className="ml-2 bg-gray-700 px-2 rounded">Send</button>
      </div>
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
  return current.uid!==target && <button onClick={toggle} className="ml-auto text-sm bg-blue-600 px-2 rounded">{following?"Following":"Follow"}</button>
}

// ===== AI PEOPLE MATCH =====
function AIMatch({user,users}){
  const myProfile = users.find(u=>u.id===user.uid);
  const matches = users.filter(u=>u.id!==user.uid && u.skills?.includes(myProfile?.skills?.split(",")[0]));
  return(
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">AI People Match</h2>
      {matches.map(u=>(
        <div key={u.id} className="bg-gray-900 p-3 rounded mb-2 flex items-center">
          <img src={u.photo} className="w-10 h-10 rounded-full mr-2"/>
          <div><p className="font-bold">{u.name}</p><p className="text-sm text-gray-400">{u.skills}</p></div>
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
    await addDoc(collection(db,"chats",chatId,"messages"),{from:user.uid,text:msg,time:serverTimestamp()});
    setMsg("");
  }
  return(
    <div className="p-4 grid-cols-3 h-[80vh]">
      <div className="border-r border-gray-800">
        {users.filter(u=>u.id!==user.uid).map(u=><div key={u.id} onClick={()=>setTo(u.id)} className="p-2 hover:bg-gray-800 cursor-pointer">{u.name}</div>)}
      </div>
      <div className="col-span-2 p-2 flex-col">
        {msgs.map((m,i)=><p key={i} className={m.from===user.uid?"text-right":""}>{m.text}</p>)}
        <div className="flex mt-auto"><input value={msg} onChange={e=>setMsg(e.target.value)} className="bg-gray-800 flex-1 p-2 rounded"/><button onClick={send} className="ml-2 bg-green-600 px-3 rounded">Send</button></div>
      </div>
    </div>
  )
}

// ===== COMMUNITIES =====
function CommunitiesPage({user,db}){
  const [coms,setComs]=useState([]); const [name,setName]=useState("");
  useEffect(()=>{onSnapshot(collection(db,"communities"),snap=>setComs(snap.docs.map(d=>({id:d.id,...d.data()}))))},[]);
  const create=()=>addDoc(collection(db,"communities"),{name,members:[user.uid]});
  return(
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Communities</h2>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Community Name" className="bg-gray-800 p-2 rounded mr-2"/>
      <button onClick={create} className="bg-green-600 px-3 rounded">Create</button>
      {coms.map(c=><div key={c.id} className="bg-gray-900 p-3 rounded mt-2">{c.name}</div>)}
    </div>
  )
  }
