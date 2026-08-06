import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, serverTimestamp, increment } from "firebase/firestore";

// ===== FIREBASE CONFIG =====
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

// ===== GEMINI FREE API KEY =====
const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_KEY; //.env.local lo pettu

// ===== NEXORA PREMIUM THEME =====
const styles = {
  body: {background:"radial-gradient(ellipse at top, #0A0F2E 0%, #050A18 100%)", color:"#E2E8F0", fontFamily:"'Inter', sans-serif", margin:0, paddingBottom:80, minHeight:"100vh"},
  header: {display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #1E293B", position:"sticky", top:0, background:"rgba(5,10,24,0.8)", backdropFilter:"blur(10px)", zIndex:10},
  logo: {fontSize:24, fontWeight:"800", background: "linear-gradient(90deg, #38BDF8, #A855F7, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", cursor:"pointer"},
  bottomNav: {display:"flex", justifyContent:"space-around", padding:"12px 0", borderTop:"1px solid #1E293B", position:"fixed", bottom:0, width:"100%", background:"rgba(5,10,24,0.9)", backdropFilter:"blur(10px)", fontSize:22},
  card: {background:"rgba(15,23,42,0.7)", backdropFilter:"blur(10px)", border:"1px solid #1E293B", margin:"16px", borderRadius:16, overflow:"hidden"},
  btnPrimary: {background:"linear-gradient(90deg, #38BDF8, #A855F7)", border:"none", color:"white", padding:"12px 20px", borderRadius:12, fontWeight:"700", cursor:"pointer"},
  btnGhost: {background:"#1E293B", border:"1px solid #334155", color:"white", padding:"10px 16px", borderRadius:12, cursor:"pointer"},
  input: {background:"#1E293B", border:"1px solid #334155", color:"white", width:"100%", padding:12, borderRadius:12, fontSize:14, boxSizing:"border-box"},
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("ai");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if(u) {
        const userRef = doc(db, "users", u.uid);
        if(!(await getDoc(userRef)).exists())
          setDoc(userRef, {
            name: u.displayName, photo: u.photoURL, bio: "",
            streak: 0, xp: 0, goals: "", memory: {}
          });
      }
    });
  }, []);

  if (loading) return <div style={styles.body}><h1 style={styles.logo}>NEXORA AI</h1></div>

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={styles.logo} onClick={()=>setTab("ai")}>NEXORA AI</h2>
        <span onClick={()=>setTab("profile")}>👤</span>
      </div>

      {!user && <AuthWall/>}

      {user && <>
        {tab === "ai" && <AIAssistant user={user}/>}
        {tab === "home" && <HomeFeed user={user}/>}
        {tab === "create" && <CreatePost user={user}/>}
        {tab === "profile" && <ProfilePage user={user}/>}
      </>}

      {user && <div style={styles.bottomNav}>
        <span onClick={()=>setTab("home")}>🏠</span>
        <span onClick={()=>setTab("create")}>➕</span>
        <span onClick={()=>setTab("ai")}>🤖</span>
        <span onClick={()=>setTab("profile")}>👤</span>
      </div>}
    </div>
  )
}

function AuthWall() {
  return(
    <div style={{textAlign:"center", padding:40}}>
      <h2 style={styles.logo}>NEXORA AI</h2>
      <p>Your Life Operating System with AI Twin 🚀</p>
      <button style={styles.btnPrimary} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Continue with Google</button>
    </div>
  )
}

// ===== 1. 🤖 NEXORA AI TWIN - FULL VERSION =====
function AIAssistant({user}) {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [maleVoice, setMaleVoice] = useState(null);
  const [memory, setMemory] = useState({});
  const wakeRef = useRef(null);

  useEffect(() => {
    // LOAD MEMORY + DAILY CHECKIN
    getDoc(doc(db,"users",user.uid)).then(d=>{
      const data = d.data();
      setMemory(data.memory || {});
      const lastCheck = data.memory?.lastCheckIn;
      const today = new Date().toDateString();

      if(lastCheck!== today && data.memory?.name){
        const morningText = `Good Morning ${data.memory.name}! What's the #1 goal for today?`;
        setChat([{role:"ai", text: morningText}]);
        speak(morningText);
        updateDoc(doc(db,"users",user.uid), {"memory.lastCheckIn": today});
      } else {
        setChat([{role:"ai", text: data.memory?.name? `Welcome back ${data.memory.name}! Say Hey NEX` : "Hey boss, I am NEX. Say 'My name is ___'"}])
      }
    });

    // LOAD VOICES
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const man = voices.find(v => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Daniel")) || voices[0];
      setMaleVoice(man);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // ALWAYS LISTENING WAKE WORD
    if('webkitSpeechRecognition' in window){
      const wake = new window.webkitSpeechRecognition();
      wake.continuous = true;
      wake.lang = "en-IN";
      wake.onresult = (e) => {
        const transcript = e.results[e.results.length-1][0].transcript.toLowerCase();
        if(transcript.includes("hey nex")){
          startListening();
        }
      }
      wake.start();
      wakeRef.current = wake;
    }
    return () => wakeRef.current?.stop();
  }, []);

  const speak = (text) => {
    if('speechSynthesis' in window && maleVoice) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.voice = maleVoice;
      utter.rate = 1.05; utter.pitch = 0.9; utter.volume = 1;
      window.speechSynthesis.speak(utter);
    }
  }

  const saveMemory = async (newData) => {
    const updated = {...memory,...newData};
    setMemory(updated);
    await updateDoc(doc(db,"users",user.uid), {memory: updated});
  }

  // EMOTION DETECTION
  const detectEmotion = (text) => {
    text = text.toLowerCase();
    if(text.includes("tired") || text.includes("lazy")) return "motivation";
    if(text.includes("stuck") || text.includes("confused")) return "clarity";
    if(text.includes("won") || text.includes("shipped")) return "celebrate";
    return "normal";
  }

  const askGemini = async (question, emotion) => {
    if(!GEMINI_KEY) return "Boss,.env.local lo GEMINI_KEY add chey";

    let tone = "Be helpful and direct";
    if(emotion === "motivation") tone = "Be brutally motivating, like a coach";
    if(emotion === "clarity") tone = "Break it down into 3 simple steps";
    if(emotion === "celebrate") tone = "Be hype and celebrate with them";

    const context = `You are NEX, AI Twin for NexoraAI. Name=${memory.name||'boss'}, Goal=${memory.goal||'build startups'}. Tone: ${tone}. Keep it under 3 sentences.`;
    const prompt = `${context} User asked: ${question}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({contents: [{parts: [{text: prompt}]}]})
    });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }

  const askNEX = async (question) => {
    if(!question) return;
    setChat(prev => [...prev, {role:"user", text:question}]);
    const emotion = detectEmotion(question);

    // MEMORY COMMANDS
    if(question.toLowerCase().includes("my name is")){
      const name = question.split("is")[1].trim();
      await saveMemory({name});
      const reply = `Got it ${name}. I won't forget.`;
      setChat(prev => [...prev, {role:"ai", text:reply}]); speak(reply); return;
    }
    if(question.toLowerCase().includes("my goal is")){
      const goal = question.split("is")[1].trim();
      await saveMemory({goal});
      const reply = `Locked in. ${goal}. I'll hold you accountable.`;
      setChat(prev => [...prev, {role:"ai", text:reply}]); speak(reply); return;
    }

    const reply = await askGemini(question, emotion);
    setChat(prev => [...prev, {role:"ai", text:reply}]);
    speak(reply);
    updateDoc(doc(db,"users",user.uid), {xp: increment(5)});
  }

  const startListening = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      askNEX(transcript.replace(/hey nex/i, "").trim());
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }

  return(<div style={{padding:20}}>
    <div style={{textAlign:"center", padding:20, background:"linear-gradient(135deg, rgba(56,189,248,0.2), rgba(168,85,247,0.2))", borderRadius:16}}>
      <div style={{width:80,height:80,borderRadius:"50%",margin:"0 auto", background:"linear-gradient(45deg,#38BDF8,#A855F7)", boxShadow:"0 0 30px #38BDF8", animation: isListening? "pulse 1s infinite" : "none"}}></div>
      <h3>NEX</h3>
      <p style={{fontSize:12}}>👤 {memory.name||'Set Name'} | 🎯 {memory.goal||'Set Goal'}</p>
      <p>{isListening? "Listening..." : "Say Hey NEX anytime"}</p>
    </div>

    <div style={{height:"40vh", overflowY:"auto", background:"#0F172A", padding:16, borderRadius:12, margin:"16px 0"}}>
      {chat.map((c,i)=><p key={i}><b>{c.role==="user"?"You":"NEX"}:</b> {c.text}</p>)}
    </div>

    <div style={{display:"flex", gap:8}}>
      <button style={{...styles.btnPrimary, background: isListening? "#EF4444" : "linear-gradient(90deg, #38BDF8, #A855F7)"}} onClick={startListening}>
        {isListening? "🔴" : "🎤"}
      </button>
      <input style={styles.input} value={input} onChange={e=>setInput(e.target.value)} placeholder="Type or say Hey NEX..."/>
      <button style={styles.btnPrimary} onClick={()=>askNEX(input)}>Send</button>
    </div>

    <h3>Quick Setup</h3>
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
      <button style={styles.btnGhost} onClick={()=>askNEX("My name is Aaneesh")}>Set Name</button>
      <button style={styles.btnGhost} onClick={()=>askNEX("My goal is $10k MRR SaaS")}>Set Goal</button>
      <button style={styles.btnGhost} onClick={()=>askNEX("Daily Plan")}>Daily Plan</button>
      <button style={styles.btnGhost} onClick={()=>askNEX("Motivation")}>Motivation</button>
    </div>
  </div>)
}

// ===== 2. 🏠 HOME FEED =====
function HomeFeed({user}) {
  const [posts, setPosts] = useState([]);
  useEffect(()=>{ onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc")), snap=>setPosts(snap.docs.map(d=>({id:d.id,...d.data()})))) },[]);

  return(<div>
    <div style={{padding:"16px"}}><h3>Builder Feed</h3></div>
    {posts.map(p=>(
      <div key={p.id} style={styles.card}>
        <div style={{display:"flex", alignItems:"center", gap:10, padding:14}}>
          <img src={p.photo} style={{width:32,height:32,borderRadius:"50%", border:"2px solid #38BDF8"}}/>
          <b>{p.name}</b>
        </div>
        <p style={{padding:"0 16px"}}>{p.built}</p>
        <div style={{display:"flex", gap:16, padding:"10px 16px", fontSize:24}}>
          <span>🔥 {p.likes?.length}</span><span>💬</span>
        </div>
      </div>
    ))}
  </div>)
}

// ===== 3. ➕ CREATE POST =====
function CreatePost({user}) {
  const [built, setBuilt] = useState("");
  const post = async()=>{
    if(!built) return alert("Write what you built");
    await addDoc(collection(db,"posts"),{
      uid:user.uid, name:user.displayName, photo:user.photoURL,
      built, likes:[], createdAt:serverTimestamp()
    });
    updateDoc(doc(db,"users",user.uid), {streak: increment(1), xp: increment(100)});
    setBuilt(""); alert("Shipped! +100 XP");
  }
  return(<div style={{padding:20}}><h2>🚢 Ship Log</h2>
    <textarea style={{...styles.input,height:100}} placeholder="What did you build today?" value={built} onChange={e=>setBuilt(e.target.value)}/>
    <button style={styles.btnPrimary} onClick={post}>Ship It 🚀</button>
  </div>)
}

// ===== 4. 👤 PROFILE =====
function ProfilePage({user}) {
  const [p, setP] = useState({});
  useEffect(()=>{ getDoc(doc(db,"users",user.uid)).then(d=>setP(d.data())) },[]);
  return (<div style={{padding:20}}>
    <img src={p.photo} style={{width:80,height:80,borderRadius:"50%", border:"3px solid #38BDF8"}}/>
    <h2>{p.name}</h2>
    <p>XP: {p.xp} | Streak: {p.streak}</p>
    <p>Memory: {JSON.stringify(p.memory)}</p>
    <button style={{...styles.btnPrimary, background:"#F87171"}} onClick={()=>signOut(auth)}>Logout</button>
  </div>)
    }
