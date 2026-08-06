import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, increment } from "firebase/firestore";

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

// ===== GEMINI FREE API KEY - IKADA PASTE CHEY =====
const GEMINI_KEY = "NEXT_PUBLIC_GEMINI_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // https://aistudio.google.com/app/apikey nundi theesko

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
  const [tab, setTab] = useState("ai"); // default AI tab
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
            streak: 0, xp: 0, goals: ""
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

// ===== 1. 🤖 NEXORA AI TWIN - VOICE + TEXT FREE =====
function AIAssistant({user}) {
  const [chat, setChat] = useState([
    {role:"ai", text:"Hey boss, I am NEX. Say 'Hey NEX' to start"}
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [maleVoice, setMaleVoice] = useState(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const man = voices.find(v => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Daniel")) || voices[0];
      setMaleVoice(man);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speak = (text) => {
    if('speechSynthesis' in window && maleVoice) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.voice = maleVoice;
      utter.rate = 1.05; utter.pitch = 0.9;
      window.speechSynthesis.speak(utter);
    }
  }

  const askGemini = async (question) => {
    const prompt = `You are NEX, the AI Twin for NexoraAI. You are a brutally honest, helpful male co-founder. Keep replies under 3 sentences. User asked: ${question}`;
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
    const reply = await askGemini(question);
    setChat(prev => [...prev, {role:"ai", text:reply}]);
    speak(reply);
    updateDoc(doc(db,"users",user.uid), {xp: increment(5)}); // XP for chatting
  }

  const startListening = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      if(transcript.toLowerCase().includes("hey nex")) {
        askNEX(transcript.replace(/hey nex/i, "").trim());
      } else {
        askNEX(transcript);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }

  return(<div style={{padding:20}}>
    <div style={{textAlign:"center", padding:20, background:"linear-gradient(135deg, rgba(56,189,248,0.2), rgba(168,85,247,0.2))", borderRadius:16}}>
      <div style={{width:80,height:80,borderRadius:"50%",margin:"0 auto", background:"linear-gradient(45deg,#38BDF8,#A855F7)", boxShadow:"0 0 30px #38BDF8"}}></div>
      <h3>NEX</h3>
      <p>{isListening? "Listening..." : "Say Hey NEX"}</p>
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

    <h3>Quick Commands</h3>
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
      {["Daily Plan","Validate My Idea","Write LinkedIn Post","Motivation"].map(a=>
        <button key={a} style={styles.btnGhost} onClick={()=>askNEX(a)}>{a}</button>
      )}
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
    <button style={{...styles.btnPrimary, background:"#F87171"}} onClick={()=>signOut(auth)}>Logout</button>
  </div>)
}
