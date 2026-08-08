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

// 23 points unna Bagh Chal board
const POINTS = [
  [50,10], [150,10], [250,10], // top row 3
  [10,70], [90,70], [170,70], [250,70], // 2nd row 4
  [50,130], [130,130], [210,130], // 3rd row 3
  [10,190], [90,190], [170,190], [250,190], // 4th row 4
  [50,250], [150,250], [250,250] // bottom row 3
];

// Lines to draw
const LINES = [
  [0,1],[1,2], [3,4],[4,5],[5,6], [7,8],[8,9], [10,11],[11,12],[12,13], [14,15],[15,16],
  [0,4],[4,8],[8,12],[12,16], [2,5],[5,9],[9,13],[13,16],
  [1,5],[5,11],[11,15], [3,7],[7,14], [6,9],[9,15]
];

export default function App() {
  const [screen, setScreen] = useState("Home");
  const [lang, setLang] = useState("te");
  const [user, setUser] = useState(null);

  useEffect(() => { 
    onAuthStateChanged(auth, (u) => { if(!u) signInAnonymously(auth); else setUser(u); }); 
  }, []);

  const texts = {
    te: { home:"పులి మేక ఆట", play:"ఆడు", rules:"నియమాలు", puliTurn:"పులి వంతు 🐯", mekaTurn:"మేకల వంతు 🐐", puliWins:"పులులు గెలిచాయి! 🐯", mekaWins:"మేకలు గెలిచాయి! 🐐" },
    en: { home:"Puli Meka Game", play:"Play", rules:"Rules", puliTurn:"Tiger Turn 🐯", mekaTurn:"Goat Turn 🐐", puliWins:"Tigers Win! 🐯", mekaWins:"Goats Win! 🐐" }
  }
  const t = texts[lang];

  return (
    <div style={{minHeight:"100vh", background:"#D4A76A", padding:16}}>
      <div style={{maxWidth:400, margin:"0 auto"}}>
        <Header screen={screen} setScreen={setScreen} t={t} />
        {screen==="Home" && <HomeScreen setScreen={setScreen} t={t}/>}
        {screen==="Play" && <GameScreen t={t}/>}
        {screen==="Rules" && <RulesScreen t={t}/>}
      </div>
    </div>
  )
}

function Header({screen,setScreen,t}){
  return (
    <div style={{background:"#8B4513", color:"white", padding:12, borderRadius:12, marginBottom:16, textAlign:"center"}}>
      <h1 style={{fontSize:20, fontWeight:"bold", margin:0}}>🐯 {t.home} 🐐</h1>
      <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:8}}>
        <button onClick={()=>setScreen("Home")} style={{padding:"6px 12px", borderRadius:8, border:"none"}}>Home</button>
        <button onClick={()=>setScreen("Play")} style={{padding:"6px 12px", borderRadius:8, border:"none"}}>Play</button>
        <button onClick={()=>setScreen("Rules")} style={{padding:"6px 12px", borderRadius:8, border:"none"}}>Rules</button>
      </div>
    </div>
  )
}

function HomeScreen({setScreen,t}){
  return (
    <div style={{background:"#F5DEB3", padding:24, borderRadius:12, textAlign:"center"}}>
      <div style={{fontSize:48, marginBottom:16}}>🐯 vs 🐐x18</div>
      <button onClick={()=>setScreen("Play")} style={{width:"100%", padding:14, background:"#22C55E", color:"white", border:"none", borderRadius:12, fontSize:16, fontWeight:"bold"}}>🎮 {t.play}</button>
    </div>
  )
}

/* ============ MAIN GAME WITH REAL BOARD ============ */
function GameScreen({t}){
  const [board,setBoard] = useState(initializeBoard()); // 23 points
  const [turn,setTurn] = useState("MEKA");
  const [mekasPlaced,setMekasPlaced] = useState(0);
  const [selected,setSelected] = useState(null);
  const [winner,setWinner] = useState(null);
  const [captured,setCaptured] = useState(0);

  const handleClick = (index) => {
    if(winner) return;
    let newBoard = [...board];

    // PHASE 1: Placing 18 Goats
    if(mekasPlaced < 18 && turn==="MEKA" && newBoard[index]===EMPTY){
      newBoard[index]=MEKA;
      setMekasPlaced(mekasPlaced+1);
      setTurn("PULI");
    }
    // PHASE 2: Moving
    else if(mekasPlaced >= 18){
      if(selected!== null){
        if(newBoard[index]===EMPTY){
          newBoard[index]=newBoard[selected];
          newBoard[selected]=EMPTY;
          setSelected(null);
          setTurn(turn==="PULI"?"MEKA":"PULI");
        }else setSelected(null);
      }else if(newBoard[index]=== (turn==="PULI"?PULI:MEKA)){
        setSelected(index);
      }
    }
    setBoard(newBoard);
  }

  const restart = () => {
    setBoard(initializeBoard()); 
    setTurn("MEKA"); 
    setMekasPlaced(0); 
    setWinner(null); 
    setCaptured(0); 
    setSelected(null);
  }

  return (
    <div style={{background:"#F5DEB3", padding:16, borderRadius:12}}>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:12, fontWeight:"bold"}}>
        <span>{turn==="PULI"?t.puliTurn:t.mekaTurn}</span>
        <span>Placed: {mekasPlaced}/18</span>
      </div>

      {/* REAL BAGH CHAL BOARD WITH SVG LINES */}
      <div style={{position:"relative", width:300, height:270, margin:"0 auto", background:"#E6C088", borderRadius:8, border:"3px solid #8B4513"}}>
        <svg style={{position:"absolute", top:0, left:0}} width="300" height="270">
          {LINES.map(([a,b],i)=>(
            <line key={i} x1={POINTS[a][0]} y1={POINTS[a][1]} x2={POINTS[b][0]} y2={POINTS[b][1]} stroke="#4B2E1A" strokeWidth="2"/>
          ))}
        </svg>
        
        {POINTS.map((pos, i)=>(
          <div key={i} onClick={()=>handleClick(i)}
            style={{
              position:"absolute", left:pos[0]-15, top:pos[1]-15,
              width:30, height:30, borderRadius:"50%", 
              background: selected===i? "yellow" : "#F5DEB3",
              border:"2px solid #8B4513", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, cursor:"pointer", zIndex:10
            }}>
            {board[i]===PULI&&"🐯"}{board[i]===MEKA&&"🐐"}
          </div>
        ))}
      </div>
      
      <button onClick={restart} style={{width:"100%", marginTop:12, background:"red", color:"white", padding:10, borderRadius:8, border:"none", fontWeight:"bold"}}>Restart</button>
    </div>
  )
}

function initializeBoard(){
  const b = Array(23).fill(EMPTY);
  b[0]=PULI; b[2]=PULI; b[14]=PULI; b[16]=PULI; // 4 corners
  return b;
}

function RulesScreen({t}){
  return (
    <div style={{background:"#F5DEB3", padding:16, borderRadius:12}}>
      <h2 style={{fontWeight:"bold", fontSize:18}}>📖 Rules</h2>
      <ul style={{paddingLeft:20}}>
        <li>4 Tigers at 4 corners</li>
        <li>18 Goats place cheyali lines meeda</li>
        <li>Tiger jump chesi goat ni capture cheyali</li>
        <li>5 Goats captured = Tigers Win</li>
      </ul>
    </div>
  )
  }
