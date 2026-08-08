"use client";
import { useState, useEffect, useRef } from "react";

// ============ FIREBASE DIRECT IMPORTS ============
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ============ 1. NEE FIREBASE CONFIG IKKADA PASTE CHEY ============
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058",
  measurementId: "G-11Y8XF8MBC"
};
// =================================================================

// Firebase Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

/* ============ STYLES ============ */
const styles = {
  page: {padding:20, maxWidth:900, margin:"0 auto", fontFamily:"sans-serif", background:"#f9fafb", minHeight:"100vh"},
  btnPrimary: {background:"#4F46E5", color:"white", padding:"10px 16px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600},
  btnSecondary: {background:"#f3f4f6", padding:"10px 16px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600},
  btnVoice: {background:"#4F46E5", color:"white", padding:"10px 14px", borderRadius:8, border:"none", fontSize:18, cursor:"pointer"},
  input: {padding:10, borderRadius:8, border:"1px solid #ddd", width:"100%", fontSize:14},
  card: {background:"white", padding:16, borderRadius:12, boxShadow:"0 2px 4px rgba(0,0,0,0.1)", margin:"10px 0"},
  replyPreview: {background:"#E0E7FF", padding:8, borderRadius:8, borderLeft:"3px solid #4F46E5", marginBottom:8, display:"flex", justifyContent:"space-between", fontSize:12},
  replyCard: {background:"#f3f4f6", padding:6, borderRadius:6, borderLeft:"2px solid #4F46E5", marginBottom:4, fontSize:12},
  replyBtn: {position:"absolute", top:5, right:5, background:"none", border:"none", fontSize:12, cursor:"pointer", opacity:0.6},
  reactionBtn: {padding:"2px 6px", borderRadius:12, border:"1px solid #ddd", fontSize:12, cursor:"pointer", background:"white"},
  fileBtn: {background:"#f3f4f6", padding:"10px 12px", borderRadius:8, border:"none", fontSize:16, cursor:"pointer"},
  deleteBtn: {position:"absolute", top:-5, right:-5, background:"red", color:"white", border:"none", borderRadius:"50%", width:20, height:20, fontSize:10, cursor:"pointer"}
}

const TABS = ["Dashboard","Goals","Chat","Focus Room","Video Call","Profile"];
const emojis = ["❤️", "👍", "😂", "🔥", "👏", "🙏"];
const selectedChat = "coding-room";

/* ============ MAIN APP ============ */
export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("Dashboard");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  if(!user) return <LoginScreen />;

  return <div style={styles.page}>
    <Header user={user} tab={tab} setTab={setTab} />
    <TabContent tab={tab} user={user} />
  </div>
}

function Header({user, tab, setTab}) {
  return <div>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
      <h2>NEXORA 🚀</h2>
      <button onClick={()=>signOut(auth)} style={styles.btnSecondary}>Logout</button>
    </div>
    <div style={{display:"flex", gap:8, margin:"10px 0", flexWrap:"wrap"}}>
      {TABS.map(t => <button key={t} onClick={()=>setTab(t)} style={tab===t? styles.btnPrimary : styles.btnSecondary}>{t}</button>)}
    </div>
  </div>
}

function LoginScreen() {
  return <div style={{textAlign:"center", padding:50, marginTop:100}}>
    <h1 style={{fontSize:40}}>NEXORA 🚀</h1>
    <p style={{marginBottom:20}}>Goal Rooms + Chat + Focus Timer + Video Call</p>
    <button onClick={()=>signInWithPopup(auth, googleProvider)} style={styles.btnPrimary}>Login with Google</button>
  </div>
}

function TabContent({tab, user}) {
  switch(tab) {
    case "Dashboard": return <DashboardTab user={user} />;
    case "Goals": return <GoalsTab user={user} />;
    case "Chat": return <ChatTab user={user} />;
    case "Focus Room": return <FocusRoomTab user={user} />;
    case "Video Call": return <VideoCallTab user={user} />;
    case "Profile": return <ProfileTab user={user} />;
    default: return null;
  }
}

/* ============ 1. DASHBOARD ============ */
function DashboardTab({user}) {
  return <div style={styles.card}>
    <h3>Welcome {user.displayName}! 👋</h3>
    <p>Goal Rooms, Chat, Focus Timer, Video Call anni ikkade unnai.</p>
  </div>
}

/* ============ 2. GOALS ============ */
function GoalsTab({user}) {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  useEffect(() => {
    const q = query(collection(db, "goals"), orderBy("createdAt"));
    const unsub = onSnapshot(q, snap => setGoals(snap.docs.map(d=>({id:d.id,...d.data()}))));
    return unsub;
  }, []);
  const addGoal = async () => {
    if(!newGoal) return;
    await addDoc(collection(db,"goals"),{text:newGoal, completed:false, userId:user.uid, createdAt:serverTimestamp()});
    setNewGoal("");
  }
  return <div>
    <div style={{display:"flex", gap:8, marginBottom:10}}>
      <input value={newGoal} onChange={e=>setNewGoal(e.target.value)} placeholder="Add Goal" style={styles.input} />
      <button onClick={addGoal} style={styles.btnPrimary}>Add</button>
    </div>
    {goals.map(g=><div key={g.id} style={styles.card}>{g.text}</div>)}
  </div>
}

/* ============ 3. CHAT - FULL FEATURES ============ */
function ChatTab({user}) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "chats", selectedChat, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, snap => setMessages(snap.docs.map(d=>({id:d.id,...d.data()}))));
    return unsub;
  }, []);

  const filteredMessages = messages.filter(m => (m.text || "").toLowerCase().includes(searchQuery.toLowerCase()));

  const sendMessage = async (voiceUrl=null, duration=null, fileUrl=null, fileName=null) => {
    if(!newMsg &&!voiceUrl &&!fileUrl) return;
    await addDoc(collection(db, "chats", selectedChat, "messages"), {
      sender:user.uid, senderName:user.displayName,
      text:newMsg, voiceUrl, duration, fileUrl, fileName,
      type: voiceUrl? "voice" : fileUrl? "file" : "text",
      replyTo, reactions:{}, createdAt:serverTimestamp()
    });
    setNewMsg(""); setReplyTo(null);
  }

  const startRecording = async () => {
    setIsRecording(true); setRecordingTime(0);
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    const chunks=[];
    recorder.ondataavailable = e=>chunks.push(e.data);
    recorder.onstop = async ()=>{
      const blob = new Blob(chunks,{type:'audio/webm'});
      const voiceRef = ref(storage,`voices/${selectedChat}/${Date.now()}.webm`);
      const snap = await uploadBytes(voiceRef,blob);
      const url = await getDownloadURL(snap.ref);
      await sendMessage(url, formatTime(recordingTime));
      stream.getTracks().forEach(t=>t.stop());
    };
    recorder.start();
    timerRef.current = setInterval(()=>setRecordingTime(p=>p+1),1000);
  };
  const stopRecording = ()=>{mediaRecorderRef.current?.stop(); setIsRecording(false); clearInterval(timerRef.current);};

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    const fileRef = ref(storage,`files/${selectedChat}/${Date.now()}_${file.name}`);
    const snap = await uploadBytes(fileRef,file);
    const url = await getDownloadURL(snap.ref);
    await sendMessage(null,null,url,file.name);
  }

  const addReaction = async (msgId, emoji) => {
    const msgRef = doc(db,"chats",selectedChat,"messages",msgId);
    const msg = messages.find(m=>m.id===msgId);
    const reactions = msg.reactions||{};
    if(reactions[emoji]?.includes(user.uid)) reactions[emoji]=reactions[emoji].filter(u=>u!==user.uid);
    else reactions[emoji]=[...(reactions[emoji]||[]),user.uid];
    await updateDoc(msgRef,{reactions});
  }

  const deleteMessage = async (msgId) => {
    if(confirm("Delete this message?")) await deleteDoc(doc(db,"chats",selectedChat,"messages",msgId));
  }

  const formatTime = (sec)=>`${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`;

  return <div>
    <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="🔍 Search in chat" style={{...styles.input, marginBottom:8}} />
    {replyTo && <div style={styles.replyPreview}><b>Replying to {replyTo.senderName}</b><button onClick={()=>setReplyTo(null)}>✕</button></div>}

    <div style={{height:350, overflow:"auto", border:"1px solid #eee", padding:10, borderRadius:8, background:"white"}}>
      {filteredMessages.map(m=>(
        <div key={m.id} style={{margin:"12px 0", position:"relative"}}>
          <b style={{fontSize:10}}>{m.senderName}</b>
          {m.sender===user.uid && <button onClick={()=>deleteMessage(m.id)} style={styles.deleteBtn}>🗑️</button>}
          {m.replyTo && <div style={styles.replyCard}><b>{m.replyTo.senderName}</b><p>{m.replyTo.text}</p></div>}
          <div style={{background:m.sender===user.uid?"#4F46E5":"white",color:m.sender===user.uid?"white":"black",padding:10,borderRadius:12,display:"inline-block",maxWidth:"80%", position:"relative"}} onDoubleClick={()=>setReplyTo({id:m.id,senderName:m.senderName,text:m.text||"🎙️ Voice"})}>
            {m.type==="text" && m.text}
            {m.type==="voice" && <div><audio controls src={m.voiceUrl} /><span style={{fontSize:12, marginLeft:8}}>{m.duration}</span></div>}
            {m.type==="file" && <a href={m.fileUrl} target="_blank" style={{color:m.sender===user.uid?"white":"blue"}}>📎 {m.fileName}</a>}
            <button onClick={()=>setReplyTo({id:m.id,senderName:m.senderName,text:m.text||"🎙️ Voice"})} style={styles.replyBtn}>↩️</button>
          </div>
          <div style={{display:"flex",gap:4,marginTop:4, flexWrap:"wrap"}}>
            {emojis.map(e=>m.reactions?.[e]?.length>0 && <button key={e} onClick={()=>addReaction(m.id,e)} style={styles.reactionBtn}>{e} {m.reactions[e].length}</button>)}
          </div>
        </div>
      ))}
    </div>

    <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{display:"none"}} />
      <button onClick={()=>fileInputRef.current.click()} style={styles.fileBtn}>📎</button>
      <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder={isRecording?`Recording ${formatTime(recordingTime)}`:"Type message..."} style={{...styles.input,flex:1}} />
      <button onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording} style={{...styles.btnVoice,background:isRecording?"red":"#4F46E5"}}>{isRecording?"⏹️":"🎙️"}</button>
      <button onClick={()=>sendMessage()} style={styles.btnPrimary}>Send</button>
    </div>
  </div>
}

/* ============ 4. FOCUS ROOM ============ */
function FocusRoomTab({user}) {
  const [minutes,setMinutes]=useState(25);
  const [seconds,setSeconds]=useState(0);
  const [isActive,setIsActive]=useState(false);
  const [streak,setStreak]=useState(0);
  useEffect(()=>{const s=localStorage.getItem("nexora_streak"); if(s)setStreak(parseInt(s))},[]);
  useEffect(()=>{
    let i;
    if(isActive && (minutes>0||seconds>0)){
      i=setInterval(()=>{seconds===0? (setMinutes(m=>m-1),setSeconds(59)) : setSeconds(s=>s-1)},1000);
    } else if(minutes===0 && seconds===0 && isActive){
      const ns=streak+1; setStreak(ns); localStorage.setItem("nexora_streak",ns); alert("🎉 Session Done! Streak: "+ns); setIsActive(false); setMinutes(25); setSeconds(0);
    }
    return ()=>clearInterval(i);
  },[isActive,minutes,seconds]);
  return <div style={styles.card}>
    <h3>🎯 Focus Room - 25min Sprint</h3>
    <div style={{textAlign:"center"}}><h1 style={{fontSize:48}}>{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}</h1>
    <button onClick={()=>setIsActive(!isActive)} style={styles.btnPrimary}>{isActive?"⏸️ Pause":"▶️ Start"}</button></div>
    <p style={{textAlign:"center", marginTop:10}}>🔥 Streak: {streak} days</p>
  </div>
}

/* ============ 5. VIDEO CALL ============ */
function VideoCallTab({user}) {
  const [inCall,setInCall]=useState(false);
  const localRef=useRef(null); const remoteRef=useRef(null); const pc=useRef(null);
  const startCall=async()=>{
    setInCall(true);
    pc.current=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});
    const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    localRef.current.srcObject=stream;
    stream.getTracks().forEach(t=>pc.current.addTrack(t,stream));
    pc.current.ontrack=e=>remoteRef.current.srcObject=e.streams[0];
    const offer=await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    alert("Offer created. Share with friend for full connection");
  };
  const endCall=()=>{setInCall(false); pc.current?.close(); localRef.current.srcObject=null;}
  return <div style={styles.card}>
    <h3>📹 Video Call</h3>
    {!inCall?<button onClick={startCall} style={styles.btnPrimary}>Start Call</button>:
    <div><div style={{display:"flex",gap:10}}><video ref={localRef} autoPlay muted style={{width:"48%",background:"black",borderRadius:8}} /><video ref={remoteRef} autoPlay style={{width:"48%",background:"black",borderRadius:8}} /></div>
    <button onClick={endCall} style={{...styles.btnPrimary,background:"red",marginTop:10}}>End Call</button></div>}
  </div>
}

/* ============ 6. PROFILE ============ */
function ProfileTab({user}) {
  return <div style={styles.card}>
    <img src={user.photoURL} style={{borderRadius:"50%",width:80}} />
    <h3>{user.displayName}</h3>
    <p>{user.email}</p>
  </div>
                  }
