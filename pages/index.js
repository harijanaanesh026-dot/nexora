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

// 23 points - Real Bagh Chal board positions
const POINTS = [
  [50,10], [150,10], [250,10], // 0,1,2 top
  [10,70], [90,70], [170,70], [250,70], // 3,4,5,6
  [50,130], [130,130], [210,130], // 7,8,9
  [10,190], [90,190], [170,190], [250,190], // 10,11,12,13
  [50,250], [150,250], [250,250] // 14,15,16 bottom
];

// Lines between points
const LINES = [
  [0,1],[1,2], [3,4],[4,5],[5,6], [7,8],[8,9], [10,11],[11,12],[12,13], [14,15],[15,16],
  [0,4],[4,8],[8,12],[12,16], [2,5],[5,9],[9,13],[13,16],
  [1,5],[5,11],[11,15], [3,7],[7,14], [6,9],[9,15]
];

// Valid moves for each point
const CONNECTIONS = {
 0:[1,4], 1:[0,2,5], 2:[1,5],
 3:[4,7], 4:[0,3,5,8], 5:[1,2,4,6,9], 6:[5,9],
 7:[3,8,14], 8:[4,7,9,12], 9:[5,6,8,10,13],
  10:[9,13], 11:[12,15], 12:[8,11,13,16], 13:[9,10,12],
  14:[7,15], 15:[11,14,16], 16:[12,15]
};

export default function App() {
  const [screen, setScreen] = useState("Home");
  const [lang, setLang] = useState("te");
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => { if(!u) signInAnonymously(auth); else setUser(u); });
  }, []);

  const texts = {
    te: {
      home:"పులి మేక ఆట", play:"ఆడు", rules:"నియమాలు", leaderboard:"లీడర్‌బోర్డ్", settings:"సెట్టింగ్స్",
      puliTurn:"పులి వంతు 🐯", mekaTurn:"మేకల వంతు 🐐", puliWins:"పులులు గెలిచాయి! 🐯", mekaWins:"మేకలు గెలిచాయి! 🐐", restart:"మళ్ళీ ఆడు"
    },
    en: {
      home:"Puli Meka Game", play:"Play", rules:"Rules", leaderboard:"Leaderboard", settings:"Settings",
      puliTurn:"Tiger Turn 🐯", mekaTurn:"Goat Turn 🐐", puliWins:"Tigers Win! 🐯", mekaWins:"Goats Win! 🐐", restart:"Play Again"
    }
  }
  const t = texts[lang];

  return (
    <div style={{minHeight:"100vh", background:"#D4A76A", padding:16, fontFamily:"sans-serif"}}>
      <div style={{maxWidth:420, margin:"0 auto"}}>
        <Header screen={screen} setScreen={setScreen} t={t} />
        {screen==="Home" && <HomeScreen setScreen={setScreen} t={t}/>}
        {screen==="Play" && <GameScreen t={t}/>}
        {screen==="Rules" && <RulesScreen t={t}/>}
        {screen==="Leaderboard" && <LeaderboardScreen t={t}/>}
        {screen==="Settings" && <SettingsScreen lang={lang} setLang={setLang} t={t}/>}
      </div>
    </div>
  )
}

function Header({screen,setScreen,t}){
  const btn = (active) => ({padding:"6px 10px", borderRadius:8, border:"none", cursor:"pointer", background: active? "#FFD700" : "#A0522D", color: active? "black" : "white", fontSize:12})
  return (
    <div style={{background:"#8B4513", color:"white", padding:12, borderRadius:12, marginBottom:16, textAlign:"center"}}>
      <h1 style={{fontSize:20, fontWeight:"bold", margin:0}}>🐯 {t.home} 🐐</h1>
      <div style={{display:"flex", gap:6, justifyContent:"center", marginTop:8, flexWrap:"wrap"}}>
        {["Home","Play","Rules","Leaderboard","Settings"].map(tab=><button key={tab} onClick={()=>setScreen(tab)} style={btn(screen===tab)}>{tab}</button>)}
      </div>
    </div>
  )
}

function HomeScreen({setScreen,t}){
  return (
    <div style={{background:"#F5DEB3", padding:24, borderRadius:12, textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
      <div style={{fontSize:48, marginBottom:16}}>🐯🐯 vs 🐐x18</div>
      <button onClick={()=>setScreen("Play")} style={{width:"100%", padding:14, background:"#22C55E", color:"white", border:"none", borderRadius:12, fontSize:16, fontWeight:"bold", marginBottom:10}}>🎮 {t.play}</button>
      <button onClick={()=>setScreen("Rules")} style={{width:"100%", padding:14, background:"#3B82F6", color:"white", border:"none", borderRadius:12, fontSize:16, marginBottom:10}}>📖 {t.rules}</button>
      <button onClick={()=>setScreen("Leaderboard")} style={{width:"100%", padding:14, background:"#A855F7", color:"white", border:"none", borderRadius:12, fontSize:16}}>🏆 {t.leaderboard}</button>
    </div>
  )
}

/* ============ MAIN GAME ============ */
function GameScreen({t}){
  const [board,setBoard] = useState(initializeBoard());
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
    // PHASE 2: Moving pieces
    else if(mekasPlaced >= 18){
      if(selected!== null){
        const result = tryMove(selected, index, newBoard);
        if(result.valid){
          newBoard = result.board;
          if(result.captured) setCaptured(captured + 1);
          setSelected(null);
          setTurn(turn==="PULI"?"MEKA":"PULI");
        }else{
          setSelected(null);
        }
      }else if(newBoard[index] === (turn==="PULI"?PULI:MEKA)){
        setSelected(index);
      }
    }
    setBoard(newBoard);
    checkWin(newBoard);
  }

  const tryMove = (from, to, b) => {
    // Normal move
    if(CONNECTIONS[from].includes(to) && b[to]===EMPTY){
      let newB = [...b];
      newB[to] = newB[from];
      newB[from] = EMPTY;
      return {valid:true, board:newB, captured:false};
    }
    // Capture move - Tiger jumps
    if(b[from]===PULI){
      for(let mid of CONNECTIONS[from]){
        if(b[mid]===MEKA){
          for(let jump of CONNECTIONS[mid]){
            if(jump===to && b[to]===EMPTY){
              let newB = [...b];
              newB[to] = PULI;
              newB[from] = EMPTY;
              newB[mid] = EMPTY;
              return {valid:true, board:newB, captured:true};
            }
          }
        }
      }
    }
    return {valid:false};
  }

  const checkWin = (b) => {
    if(captured >= 5) setWinner("PULI");
    // TODO: Check if all tigers blocked = MEKA wins
  }

  const restart = () => {
    setBoard(initializeBoard()); setTurn("MEKA"); setMekasPlaced(0); setWinner(null); setCaptured(0); setSelected(null);
  }

  return (
    <div style={{background:"#F5DEB3", padding:16, borderRadius:12, boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:12, fontWeight:"bold", fontSize:14}}>
        <span>{turn==="PULI"?t.puliTurn:t.mekaTurn}</span>
        <span>Placed: {mekasPlaced}/18</span>
        <span>Captured: {captured}/5</span>
      </div>

      {/* REAL BOARD */}
      <div style={{position:"relative", width:300, height:270, margin:"0 auto", background:"#E6C088", borderRadius:8, border:"4px solid #8B4513"}}>
        <svg style={{position:"absolute", top:0, left:0}} width="300" height="270">
          {LINES.map(([a,b],i)=>( <line key={i} x1={POINTS[a][0]} y1={POINTS[a][1]} x2={POINTS[b][0]} y2={POINTS[b][1]} stroke="#4B2E1A" strokeWidth="3"/> ))}
        </svg>

        {POINTS.map((pos, i)=>(
          <div key={i} onClick={()=>handleClick(i)}
            style={{
              position:"absolute", left:pos[0]-15, top:pos[1]-15,
              width:30, height:30, borderRadius:"50%",
              background: selected===i? "#FFD700" : "#F5DEB3",
              border:"3px solid #8B4513", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, cursor:"pointer", zIndex:10, boxShadow:"inset 0 2px 4px rgba(0,0,0,0.2)"
            }}>
            {board[i]===PULI&&"🐯"}{board[i]===MEKA&&"🐐"}
          </div>
        ))}
      </div>

      {winner && <div style={{marginTop:12, padding:12, background:"#FEF3C7", borderRadius:8, textAlign:"center", fontWeight:"bold", fontSize:18}}>{winner==="PULI"?t.puliWins:t.mekaWins}</div>}
      <button onClick={restart} style={{width:"100%", marginTop:12, background:"red", color:"white", padding:12, borderRadius:8, border:"none", fontWeight:"bold"}}>{t.restart}</button>
    </div>
  )
}

function initializeBoard(){
  const b = Array(17).fill(EMPTY);
  b[0]=PULI; b[2]=PULI; b[14]=PULI; b[16]=PULI; // 4 corners
  return b;
}

function RulesScreen({t}){
  return (
    <div style={{background:"#F5DEB3", padding:16, borderRadius:12}}>
      <h2 style={{fontWeight:"bold", fontSize:18, marginBottom:10}}>📖 Rules</h2>
      <ul style={{paddingLeft:20, lineHeight:1.8}}>
        <li>4 Tigers start at 4 corners 🐯</li>
        <li>18 Goats place cheyali one by one 🐐</li>
        <li>Goats kuda lines meeda move cheyavachu</li>
        <li>Tiger goat ni jump cheste capture avthadi</li>
        <li>5 Goats captured = Tigers Win</li>
        <li>4 Tigers ni block cheste Goats Win</li>
      </ul>
    </div>
  )
}

function LeaderboardScreen({t}){
  const [scores,setScores]=useState([]);
  useEffect(()=>{onSnapshot(query(collection(db,"scores"),orderBy("createdAt","desc"),limit(10)), snap=>setScores(snap.docs.map(d=>d.data())))},[]);
  return <div style={{background:"#F5DEB3", padding:16, borderRadius:12}}><h2 style={{fontWeight:"bold", marginBottom:10}}>🏆 {t.leaderboard}</h2>{scores.length===0?<p>No games yet</p>:scores.map((s,i)=><div key={i}>{s.winner}</div>)}</div>
}

function SettingsScreen({lang,setLang,t}){
  return (
    <div style={{background:"#F5DEB3", padding:16, borderRadius:12}}>
      <h2 style={{fontWeight:"bold", marginBottom:10}}>⚙️ {t.settings}</h2>
      <button onClick={()=>setLang("te")} style={{marginRight:8, padding:8, borderRadius:8, border:"none", background:lang==="te"?"#3B82F6":"#E5E7EB"}}>తెలుగు</button>
      <button onClick={()=>setLang("en")} style={{padding:8, borderRadius:8, border:"none", background:lang==="en"?"#3B82F6":"#E5E7EB"}}>English</button>
    </div>
  )
                                           }
