"use client";
import { useState, useEffect } from "react";

// ============ FIREBASE DIRECT SETUP ============
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";

// ============ NEE FIREBASE CONFIG IKKADA PASTE CHEY ============
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
// ===============================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const BOARD_SIZE = 5;
const TIGER = "T";
const GOAT = "G";
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
      home: "పులి మేక ఆట", play: "ఆడు", rules: "నియమాలు", leaderboard: "లీడర్‌బోర్డ్", settings: "సెట్టింగ్స్",
      tigerTurn: "పులి వంతు 🐯", goatTurn: "మేకల వంతు 🐐", tigerWins: "పులి గెలిచింది! 🐯", goatsWin: "మేకలు గెలిచాయి! 🐐",
      restart: "మళ్ళీ ఆడు"
    },
    en: {
      home: "Puli Meka Game", play: "Play", rules: "Rules", leaderboard: "Leaderboard", settings: "Settings",
      tigerTurn: "Tiger Turn 🐯", goatTurn: "Goat Turn 🐐", tigerWins: "Tiger Wins! 🐯", goatsWin: "Goats Win! 🐐",
      restart: "Play Again"
    }
  }
  const t = texts[lang];

  return (
    <div className="min-h-screen bg-[#F4E4BC]" style={{backgroundImage:"linear-gradient(#F4E4BC, #E6D3A3)"}}>
      <div className="max-w-md mx-auto p-4">
        <Header screen={screen} setScreen={setScreen} lang={lang} setLang={setLang} t={t} />

        {screen === "Home" && <HomeScreen setScreen={setScreen} t={t} />}
        {screen === "Play" && <GameScreen t={t} user={user} />}
        {screen === "Rules" && <RulesScreen t={t} />}
        {screen === "Leaderboard" && <LeaderboardScreen t={t} />}
        {screen === "Settings" && <SettingsScreen lang={lang} setLang={setLang} t={t} />}
      </div>
    </div>
  )
}

function Header({screen, setScreen, lang, setLang, t}) {
  const tabs = ["Home","Play","Rules","Leaderboard","Settings"];
  return (
    <div className="bg-[#8B4513] text-white p-3 rounded-xl mb-4 shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-2">🐯 {t.home} 🐐</h1>
      <div className="flex gap-2 justify-center flex-wrap">
        {tabs.map(tab =>
          <button key={tab} onClick={()=>setScreen(tab)}
            className={`px-3 py-1 rounded-lg text-sm ${screen===tab?"bg-yellow-400 text-black":"bg-[#A0522D]"}`}>
            {tab}
          </button>
        )}
      </div>
    </div>
  )
}

function HomeScreen({setScreen, t}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg text-center">
      <div className="text-6xl mb-4">🐯 vs 🐐</div>
      <button onClick={()=>setScreen("Play")} className="w-full bg-green-600 text-white py-3 rounded-xl mb-3 font-bold text-lg">🎮 {t.play}</button>
      <button onClick={()=>setScreen("Rules")} className="w-full bg-blue-600 text-white py-3 rounded-xl mb-3">📖 {t.rules}</button>
      <button onClick={()=>setScreen("Leaderboard")} className="w-full bg-purple-600 text-white py-3 rounded-xl">🏆 {t.leaderboard}</button>
    </div>
  )
}

/* ============ GAME SCREEN ============ */
function GameScreen({t, user}) {
  const [board, setBoard] = useState(initializeBoard());
  const [turn, setTurn] = useState("GOAT");
  const [goatsPlaced, setGoatsPlaced] = useState(0);
  const [mode, setMode] = useState("2Player");
  const [winner, setWinner] = useState(null);
  const [capturedGoats, setCapturedGoats] = useState(0);

  const playSound = (type) => {
    // /public/sounds/move.mp3 file undali
    try{ new Audio(`/sounds/${type}.mp3`).play() }catch(e){}
  }

  const handleClick = (row, col) => {
    if(winner) return;
    const newBoard = board.map(r=>[...r]);

    // 1. GOAT PLACING PHASE
    if(goatsPlaced < 15 && turn === "GOAT" && newBoard[row][col] === EMPTY){
      newBoard[row][col] = GOAT;
      setGoatsPlaced(goatsPlaced + 1);
      setTurn("TIGER");
      playSound("move");
    }
    // 2. TIGER MOVE + CAPTURE LOGIC
    else if(turn === "TIGER"){
      // Simple move logic - full AI tarvatha add cheddam
      // Ikkada tiger adjacent ki move cheyali
      setTurn("GOAT");
      playSound("tiger-roar");
    }

    setBoard(newBoard);
    checkWinner(newBoard);
  }

  const checkWinner = (b) => {
    if(capturedGoats >= 5){
      setWinner("TIGER");
      saveScore("Tiger", capturedGoats);
    }
    // Goats blocking logic - tiger ki moves levu ante
  }

  const saveScore = async (who, score) => {
    await addDoc(collection(db, "leaderboard"), {
      name: who, wins: 1, createdAt: serverTimestamp()
    });
  }

  const restart = () => {
    setBoard(initializeBoard());
    setTurn("GOAT");
    setGoatsPlaced(0);
    setWinner(null);
    setCapturedGoats(0);
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <div className="flex justify-between mb-3">
        <p className="font-bold">{turn==="TIGER"? t.tigerTurn : t.goatTurn}</p>
        <p>Captured: {capturedGoats}/5</p>
        <button onClick={restart} className="bg-red-500 text-white px-3 py-1 rounded">Restart</button>
      </div>

      {/* VILLAGE STYLE BOARD */}
      <div className="grid grid-cols-5 gap-1 bg-[#D2B48C] p-2 rounded-lg">
        {board.map((row, i) => row.map((cell, j) => (
          <div key={`${i}-${j}`} onClick={()=>handleClick(i,j)}
            className="w-14 h-14 bg-[#F5DEB3] rounded-full flex items-center justify-center text-3xl border-2 border-[#8B4513] cursor-pointer">
            {cell === TIGER && "🐯"}
            {cell === GOAT && "🐐"}
          </div>
        )))}
      </div>

      {winner && <ResultScreen winner={winner} t={t} restart={restart} />}
    </div>
  )
}

function initializeBoard() {
  const b = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
  b[0][0] = TIGER;
  return b;
}

function ResultScreen({winner, t, restart}) {
  return (
    <div className="mt-4 p-4 bg-yellow-100 rounded-xl text-center">
      <h2 className="text-2xl font-bold">{winner==="TIGER"? t.tigerWins : t.goatsWin}</h2>
      <button onClick={restart} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">{t.restart}</button>
    </div>
  )
}

/* ============ RULES SCREEN ============ */
function RulesScreen({t}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-3">📖 Rules</h2>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li>15 Goats vs 1 Tiger</li>
        <li>First place all 15 goats on board one by one</li>
        <li>Tiger can jump over goat to capture it</li>
        <li>If Tiger captures 5 goats = Tiger Wins 🐯</li>
        <li>If Goats block Tiger so it cant move = Goats Win 🐐</li>
      </ul>
    </div>
  )
}

/* ============ LEADERBOARD ============ */
function LeaderboardScreen({t}) {
  const [scores, setScores] = useState([]);
  useEffect(() => {
    const q = query(collection(db, "leaderboard"), orderBy("createdAt","desc"), limit(10));
    onSnapshot(q, snap => setScores(snap.docs.map(d=>d.data())));
  }, []);
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-3">🏆 {t.leaderboard}</h2>
      {scores.length===0 && <p>No games yet</p>}
      {scores.map((s,i)=><div key={i} className="flex justify-between p-2 border-b">{s.name}<span>Win</span></div>)}
    </div>
  )
}

/* ============ SETTINGS ============ */
function SettingsScreen({lang, setLang, t}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-3">⚙️ {t.settings}</h2>
      <p className="mb-2">Language / భాష:</p>
      <button onClick={()=>setLang("te")} className={`mr-2 p-2 rounded ${lang==="te"?"bg-blue-500 text-white":"bg-gray-200"}`}>తెలుగు</button>
      <button onClick={()=>setLang("en")} className={`p-2 rounded ${lang==="en"?"bg-blue-500 text-white":"bg-gray-200"}`}>English</button>
      <p className="mt-4">🔊 Sounds: ON</p>
      <p>🎨 Themes: Village - Coming Soon</p>
    </div>
  )
  }
