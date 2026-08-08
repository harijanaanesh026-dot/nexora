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

// 5x5 Board with diagonal lines - Bagh Chal board
const VALID_MOVES = {
  "0-0":[["0-1"],["1-0"],["1-1"]], "0-1":[["0-0"],["0-2"],["1-1"]], "0-2":[["0-1"],["0-3"],["1-1"],["1-3"]],
  "0-3":[["0-2"],["0-4"],["1-3"]], "0-4":[["0-3"],["1-3"],["1-4"]],
  "1-0":[["0-0"],["1-1"],["2-0"]], "1-1":[["0-0"],["0-1"],["0-2"],["1-0"],["1-2"],["2-0"],["2-1"],["2-2"]],
  "1-2":[["1-1"],["1-3"],["2-2"]], "1-3":[["0-2"],["0-3"],["0-4"],["1-2"],["1-4"],["2-2"],["2-3"],["2-4"]],
  "1-4":[["0-4"],["1-3"],["2-4"]],
  "2-0":[["1-0"],["2-1"],["3-0"],["3-1"]], "2-1":[["1-1"],["2-0"],["2-2"],["3-1"]],
  "2-2":[["1-1"],["1-2"],["1-3"],["2-1"],["2-3"],["3-1"],["3-2"],["3-3"]],
  "2-3":[["1-3"],["2-2"],["2-4"],["3-3"]], "2-4":[["1-4"],["2-3"],["3-3"],["3-4"]],
  "3-0":[["2-0"],["3-1"],["4-0"]], "3-1":[["2-0"],["2-1"],["2-2"],["3-0"],["3-2"],["4-0"],["4-1"],["4-2"]],
  "3-2":[["3-1"],["3-3"],["4-2"]], "3-3":[["2-2"],["2-3"],["2-4"],["3-2"],["3-4"],["4-2"],["4-3"],["4-4"]],
  "3-4":[["2-4"],["3-3"],["4-4"]],
  "4-0":[["3-0"],["4-1"]], "4-1":[["3-1"],["4-0"],["4-2"]], "4-2":[["3-1"],["3-2"],["3-3"],["4-1"],["4-3"]],
  "4-3":[["3-3"],["4-2"],["4-4"]], "4-4":[["3-3"],["3-4"],["4-3"]]
};

export default function App() {
  const [screen, setScreen] = useState("Home");
  const [lang, setLang] = useState("te");
  const [user, setUser] = useState(null);

  useEffect(() => { onAuthStateChanged(auth, (u) => { if(!u) signInAnonymously(auth); else setUser(u); }); }, []);

  const texts = {
    te: { home:"4 పులి 18 మేకల ఆట", play:"ఆడు", rules:"నియమాలు", leaderboard:"లీడర్‌బోర్డ్", settings:"సెట్టింగ్స్",
      puliTurn:"పులి వంతు 🐯", mekaTurn:"మేకల వంతు 🐐", puliWins:"పులులు గెలిచాయి! 🐯", mekaWins:"మేకలు గెలిచాయి! 🐐" },
    en: { home:"4 Tiger 18 Goats", play:"Play", rules:"Rules", leaderboard:"Leaderboard", settings:"Settings",
      puliTurn:"Tiger Turn 🐯", mekaTurn:"Goat Turn 🐐", puliWins:"Tigers Win! 🐯", mekaWins:"Goats Win! 🐐" }
  }
  const t = texts[lang];

  return <div className="min-h-screen bg-[#E8D5B7] p-4">
    <div className="max-w-md mx-auto">
      <Header screen={screen} setScreen={setScreen} t={t} lang={lang} setLang={setLang}/>
      {screen==="Home" && <HomeScreen setScreen={setScreen} t={t}/>}
      {screen==="Play" && <GameScreen t={t}/>}
      {screen==="Rules" && <RulesScreen t={t}/>}
      {screen==="Leaderboard" && <LeaderboardScreen t={t}/>}
      {screen==="Settings" && <SettingsScreen lang={lang} setLang={setLang} t={t}/>}
    </div>
  </div>
}

function Header({screen,setScreen,t,lang,setLang}){
  return <div className="bg-[#8B4513] text-white p-3 rounded-xl mb-4">
    <h1 className="text-xl font-bold text-center">🐯 {t.home} 🐐</h1>
    <div className="flex gap-2 justify-center mt-2 flex-wrap">
      {["Home","Play","Rules","Leaderboard","Settings"].map(tab=>
        <button key={tab} onClick={()=>setScreen(tab)} className={`px-3 py-1 rounded ${screen===tab?"bg-yellow-400 text-black":"bg-[#A0522D]"}`}>{tab}</button>
      )}
    </div>
  </div>
}

function HomeScreen({setScreen,t}){
  return <div className="bg-white p-6 rounded-xl text-center shadow">
    <div className="text-5xl mb-4">🐯🐯🐯🐯 vs 🐐x18</div>
    <button onClick={()=>setScreen("Play")} className="w-full bg-green-600 text-white py-3 rounded-xl mb-2 font-bold">🎮 {t.play}</button>
    <button onClick={()=>setScreen("Rules")} className="w-full bg-blue-600 text-white py-3 rounded-xl mb-2">📖 {t.rules}</button>
    <button onClick={()=>setScreen("Leaderboard")} className="w-full bg-purple-600 text-white py-3 rounded-xl">🏆 {t.leaderboard}</button>
  </div>
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
    const key = `${r}-${c}`;
    let newBoard = board.map(row=>[...row]);

    // PHASE 1: Placing 18 Goats
    if(mekasPlaced < 18 && turn==="MEKA" && newBoard[r][c]===EMPTY){
      newBoard[r][c]=MEKA;
      setMekasPlaced(mekasPlaced+1);
      setTurn("PULI");
    }
    // PHASE 2: Moving
    else if(mekasPlaced>=18){
      if(selected){
        if(isValidMove(selected,[r,c],newBoard)){
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

  const isValidMove = (from,to,b) => {
    const [fr,fc]=from; const [tr,tc]=to;
    if(b[tr][tc]!==EMPTY) return false;
    const moves = VALID_MOVES[`${fr}-${fc}`] || [];
    return moves.some(m=>m[0]===`${tr}-${tc}`);
  }

  const checkWin = (b) => {
    // If all 4 tigers blocked = Goats win
    // If 5 goats captured = Tigers win
    if(captured>=5) setWinner("PULI");
  }

  const restart = () => {
    setBoard(initializeBoard()); setTurn("MEKA"); setMekasPlaced(0); setWinner(null); setCaptured(0); setSelected(null);
  }

  return <div className="bg-white p-4 rounded-xl shadow">
    <div className="flex justify-between mb-2 font-bold">
      <span>{turn==="PULI"?t.puliTurn:t.mekaTurn}</span>
      <span>Captured: {captured}/5</span>
    </div>

    {/* BOARD */}
    <div className="grid grid-cols-5 gap-1 bg-[#8B4513] p-2 rounded">
      {board.map((row,i)=>row.map((cell,j)=>
        <div key={`${i}-${j}`} onClick={()=>handleClick(i,j)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl bg-[#F5DEB3] border-2 ${selected&&selected[0]===i&&selected[1]===j?"border-yellow-400":"border-[#8B4513]"}`}>
          {cell===PULI&&"🐯"}{cell===MEKA&&"🐐"}
        </div>
      ))}
    </div>
    <button onClick={restart} className="w-full mt-3 bg-red-500 text-white py-2 rounded">Restart</button>
    {winner && <div className="mt-3 p-3 bg-yellow-200 rounded text-center font-bold">{winner==="PULI"?t.puliWins:t.mekaWins}</div>}
  </div>
}

function initializeBoard(){
  const b = Array(5).fill(null).map(()=>Array(5).fill(EMPTY));
  b[0][0]=PULI; b[0][4]=PULI; b[4][0]=PULI; b[4][4]=PULI; // 4 corners
  return b;
}

function RulesScreen({t}){
  return <div className="bg-white p-4 rounded-xl shadow">
    <h2 className="font-bold text-lg mb-2">📖 Rules</h2>
    <ul className="list-disc pl-5 text-sm space-y-1">
      <li>4 Tigers start at 4 corners</li>
      <li>18 Goats placed one by one</li>
      <li>Tiger can jump over goat to capture</li>
      <li>5 Goats captured = Tigers Win</li>
      <li>Tigers blocked = Goats Win</li>
    </ul>
  </div>
}

function LeaderboardScreen({t}){
  const [scores,setScores]=useState([]);
  useEffect(()=>{onSnapshot(query(collection(db,"scores"),orderBy("createdAt","desc"),limit(10)), snap=>setScores(snap.docs.map(d=>d.data())))},[]);
  return <div className="bg-white p-4 rounded-xl shadow"><h2 className="font-bold mb-2">🏆 {t.leaderboard}</h2>{scores.map((s,i)=><div key={i}>{s.winner}</div>)}</div>
}

function SettingsScreen({lang,setLang,t}){
  return <div className="bg-white p-4 rounded-xl shadow">
    <h2 className="font-bold mb-2">⚙️ {t.settings}</h2>
    <button onClick={()=>setLang("te")} className={`mr-2 p-2 rounded ${lang==="te"?"bg-blue-500 text-white":"bg-gray-200"}`}>తెలుగు</button>
    <button onClick={()=>setLang("en")} className={`p-2 rounded ${lang==="en"?"bg-blue-500 text-white":"bg-gray-200"}`}>English</button>
  </div>
       }
