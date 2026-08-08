"use client";
import { useState, useEffect } from "react";

// ============ FIREBASE ============
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// ====================================

const PULI = "P";
const MEKA = "M";
const EMPTY = null;

export default function App() {
  const [screen, setScreen] = useState("Home");
  const [lang, setLang] = useState("te");
  const [user, setUser] = useState(null);

  useEffect(() => { 
    onAuthStateChanged(auth, (u) => { 
      if(!u) signInAnonymously(auth); 
      else setUser(u); 
    }); 
  }, []);

  const texts = {
    te: { 
      home:"4 పులి 18 మేకల ఆట", play:"ఆడు", rules:"నియమాలు", leaderboard:"లీడర్‌బోర్డ్", settings:"సెట్టింగ్స్",
      puliTurn:"పులి వంతు 🐯", mekaTurn:"మేకల వంతు 🐐", puliWins:"పులులు గెలిచాయి! 🐯", mekaWins:"మేకలు గెలిచాయి! 🐐", restart:"మళ్ళీ ఆడు" 
    },
    en: { 
      home:"4 Tiger 18 Goats", play:"Play", rules:"Rules", leaderboard:"Leaderboard", settings:"Settings",
      puliTurn:"Tiger Turn 🐯", mekaTurn:"Goat Turn 🐐", puliWins:"Tigers Win! 🐯", mekaWins:"Goats Win! 🐐", restart:"Play Again"
    }
  }
  const t = texts[lang];

  return (
    <div style={{minHeight:"100vh", background:"#E8D5B7", padding:16, fontFamily:"sans-serif"}}>
      <div style={{maxWidth:420, margin:"0 auto"}}>
        <Header screen={screen} setScreen={setScreen} t={t} lang={lang} setLang={setLang}/>
        {screen==="Home" && <HomeScreen setScreen={setScreen} t={t}/>}
        {screen==="Play" && <GameScreen t={t}/>}
        {screen==="Rules" && <RulesScreen t={t}/>}
        {screen==="Leaderboard" && <LeaderboardScreen t={t}/>}
        {screen==="Settings" && <SettingsScreen lang={lang} setLang={setLang} t={t}/>}
      </div>
    </div>
  )
}

function Header({screen,setScreen,t,lang,setLang}){
  const btnStyle = (active) => ({
    padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer",
    background: active? "#FFD700" : "#A0522D", color: active? "black" : "white", fontSize:12
  })
  return (
    <div style={{background:"#8B4513", color:"white", padding:12, borderRadius:12, marginBottom:16}}>
      <h1 style={{textAlign:"center", fontSize:20, fontWeight:"bold", margin:0}}>🐯 {t.home} 🐐</h1>
      <div style={{display:"flex", gap:6, justifyContent:"center", marginTop:8, flexWrap:"wrap"}}>
        {["Home","Play","Rules","Leaderboard","Settings"].map(tab=>
          <button key={tab} onClick={()=>setScreen(tab)} style={btnStyle(screen===tab)}>{tab}</button>
        )}
      </div>
    </div>
  )
}

function HomeScreen({setScreen,t}){
  const bigBtn = {width:"100%", padding:14, borderRadius:12, border:"none", fontSize:16, fontWeight:"bold", marginBottom:10, cursor:"pointer"}
  return (
    <div style={{background:"white", padding:24, borderRadius:12, textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
      <div style={{fontSize:48, marginBottom:16}}>🐯🐯🐯 vs 🐐x18</div>
      <button onClick={()=>setScreen("Play")} style={{...bigBtn, background:"#22C55E", color:"white"}}>🎮 {t.play}</button>
      <button onClick={()=>setScreen("Rules")} style={{...bigBtn, background:"#3B82F6", color:"white"}}>📖 {t.rules}</button>
      <button onClick={()=>setScreen("Leaderboard")} style={{...bigBtn, background:"#A855F7", color:"white"}}>🏆 {t.leaderboard}</button>
    </div>
  )
}

/* ============ MAIN GAME ============ */
function GameScreen({t}){
  const [board,setBoard] = useState(initializeBoard());
  const [turn,setTurn] = useState("MEKA"); // Goats start
  const [mekasPlaced,setMekasPlaced] = useState(0);
  const [selected,setSelected] = useState(null);
  const [winner,setWinner] = useState(null);
  const [captured,setCaptured] = useState(0);

  const handleClick = (r,c) => {
    if(winner) return;
    let newBoard = board.map(row=>[...row]);

    // PHASE 1: Placing 18 Goats
    if(mekasPlaced < 18 && turn==="MEKA" && newBoard[r][c]===EMPTY){
      newBoard[r][c]=MEKA;
      setMekasPlaced(mekasPlaced+1);
      if(mekasPlaced+1 >= 18) setTurn("PULI");
      else setTurn("PULI"); // alternating
    }
    // PHASE 2: Moving pieces
    else if(mekasPlaced >= 18){
      if(selected){
        if(newBoard[r][c]===EMPTY){
          newBoard[r][c]=newBoard[selected[0]][selected[1]];
          newBoard[selected[0]][selected[1]]=EMPTY;
          setSelected(null);
          setTurn(turn==="PULI"?"MEKA":"PULI");
        }else setSelected(null);
      }else if(newBoard[r][c]=== (turn==="PULI"?PULI:MEKA)){
        setSelected([r,c]);
      }
    }
    setBoard(newBoard);
    checkWin(newBoard);
  }

  const checkWin = (b) => {
    // Simple win: 5 goats captured
    if(captured >= 5) setWinner("PULI");
  }

  const restart = () => {
    setBoard(initializeBoard()); 
    setTurn("MEKA"); 
    setMekasPlaced(0); 
    setWinner(null); 
    setCaptured(0); 
    setSelected(null);
  }

  const cellStyle = (isSelected) => ({
    width:60, height:60, borderRadius:"50%", display:"flex", alignItems:"center", 
    justifyContent:"center", fontSize:28, background:"#F5DEB3", 
    border: isSelected? "3px solid yellow" : "2px solid #8B4513", cursor:"pointer"
  })

  return (
    <div style={{background:"white", padding:16, borderRadius:12, boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:12, fontWeight:"bold"}}>
        <span>{turn==="PULI"?t.puliTurn:t.mekaTurn}</span>
        <span>Placed: {mekasPlaced}/18</span>
        <span>Captured: {captured}/5</span>
      </div>

      {/* BOARD */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:6, background:"#8B4513", padding:10, borderRadius:8}}>
        {board.map((row,i)=>row.map((cell,j)=>
          <div key={`${i}-${j}`} onClick={()=>handleClick(i,j)}
            style={cellStyle(selected && selected[0]===i && selected[1]===j)}>
            {cell===PULI&&"🐯"}{cell===MEKA&&"🐐"}
          </div>
        ))}
      </div>
      <button onClick={restart} style={{width:"100%", marginTop:12, background:"red", color:"white", padding:10, borderRadius:8, border:"none", fontWeight:"bold"}}>Restart</button>
      {winner && <div style={{marginTop:12, padding:12, background:"#FEF3C7", borderRadius:8, textAlign:"center", fontWeight:"bold", fontSize:18}}>{winner==="PULI"?t.puliWins:t.mekaWins}</div>}
    </div>
  )
}

function initializeBoard(){
  const b = Array(5).fill(null).map(()=>Array(5).fill(EMPTY));
  b[0][0]=PULI; b[0][4]=PULI; b[4][0]=PULI; b[4][4]=PULI; // 4 corners
  return b;
}

function RulesScreen({t}){
  return (
    <div style={{background:"white", padding:16, borderRadius:12, boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
      <h2 style={{fontWeight:"bold", fontSize:18, marginBottom:12}}>📖 Rules</h2>
      <ul style={{paddingLeft:20, lineHeight:1.8}}>
        <li>4 Tigers start at 4 corners 🐯</li>
        <li>18 Goats place cheyali okati okati 🐐</li>
        <li>Tarvatha Goats kuda move cheyavachu</li>
        <li>Tiger adjacent piece ni jump cheste goat capture</li>
        <li>5 Goats captured = Tigers Win</li>
        <li>4 Tigers ni block cheste Goats Win</li>
      </ul>
    </div>
  )
}

function LeaderboardScreen({t}){
  const [scores,setScores]=useState([]);
  useEffect(()=>{
    const q = query(collection(db,"scores"),orderBy("createdAt","desc"),limit(10));
    onSnapshot(q, snap=>setScores(snap.docs.map(d=>d.data())))
  },[]);
  return (
    <div style={{background:"white", padding:16, borderRadius:12, boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
      <h2 style={{fontWeight:"bold", fontSize:18, marginBottom:12}}>🏆 {t.leaderboard}</h2>
      {scores.length===0 && <p>No games yet</p>}
      {scores.map((s,i)=><div key={i} style={{padding:8, borderBottom:"1px solid #eee"}}>{s.winner}</div>)}
    </div>
  )
}

function SettingsScreen({lang,setLang,t}){
  return (
    <div style={{background:"white", padding:16, borderRadius:12, boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
      <h2 style={{fontWeight:"bold", fontSize:18, marginBottom:12}}>⚙️ {t.settings}</h2>
      <p>Language / భాష:</p>
      <button onClick={()=>setLang("te")} style={{marginRight:8, padding:8, borderRadius:8, border:"none", background:lang==="te"?"#3B82F6":"#E5E7EB"}}>తెలుగు</button>
      <button onClick={()=>setLang("en")} style={{padding:8, borderRadius:8, border:"none", background:lang==="en"?"#3B82F6":"#E5E7EB"}}>English</button>
    </div>
  )
                                                   }
