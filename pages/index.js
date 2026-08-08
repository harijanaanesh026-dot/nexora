"use client";
import { useState, useEffect } from "react";

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

const PULI = "P";
const MEKA = "M";
const EMPTY = null;

const POINTS = [
  [50,10], [150,10], [250,10],
  [10,70], [90,70], [170,70], [250,70],
  [50,130], [130,130], [210,130],
  [10,190], [90,190], [170,190], [250,190],
  [50,250], [150,250], [250,250]
];

const LINES = [
  [0,1],[1,2], [3,4],[4,5],[5,6], [7,8],[8,9], [10,11],[11,12],[12,13], [14,15],[15,16],
  [0,4],[4,8],[8,12],[12,16], [2,5],[5,9],[9,13],[13,16],
  [1,5],[5,11],[11,15], [3,7],[7,14], [6,9],[9,15]
];

const CONNECTIONS = {
 0:[1,4], 1:[0,2,5], 2:[1,5],
 3:[4,7], 4:[0,3,5,8], 5:[1,2,4,6,9], 6:[5,9],
 7:[3,8,14], 8:[4,7,9,12], 9:[5,6,8,10,13],
 10:[9,13], 11:[12,15], 12:[8,11,13,16], 13:[9,10,12],
 14:[7,15], 15:[11,14,16], 16:[12,15]
};

export default function App() {
  const [screen, setScreen] = useState("Play"); // Direct ga Play ki pampisthunna
  const [lang, setLang] = useState("te");

  useEffect(() => { onAuthStateChanged(auth, (u) => { if(!u) signInAnonymously(auth); }); }, []);

  const texts = {
    te: { puliTurn:"పులి వంతు 🐯", mekaTurn:"మేకల వంతు 🐐", placing:"మేకను పెట్టు", moving:"కదిలించు" },
    en: { puliTurn:"Tiger Turn 🐯", mekaTurn:"Goat Turn 🐐", placing:"Place Goat", moving:"Move" }
  }
  const t = texts[lang];

  return (
    <div style={{minHeight:"100vh", background:"#D4A76A", padding:16}}>
      <div style={{maxWidth:420, margin:"0 auto"}}>
        <GameScreen t={t}/>
      </div>
    </div>
  )
}

function GameScreen({t}){
  const [board,setBoard] = useState(initializeBoard());
  const [phase,setPhase] = useState("PLACING"); // PLACING or MOVING
  const [turn,setTurn] = useState("MEKA"); // MEKA starts placing
  const [mekasPlaced,setMekasPlaced] = useState(0);
  const [selected,setSelected] = useState(null);
  const [captured,setCaptured] = useState(0);

  const handleClick = (index) => {
    let newBoard = [...board];

    // PHASE 1: PLACING 18 GOATS
    if(phase === "PLACING"){
      if(turn==="MEKA" && newBoard[index]===EMPTY){
        newBoard[index]=MEKA;
        const newCount = mekasPlaced+1;
        setMekasPlaced(newCount);

        if(newCount >= 18){
          setPhase("MOVING"); // 18 ayyaka moving phase
          setTurn("PULI"); // Tiger starts moving
        }else{
          setTurn("PULI"); // Next tiger turn - but tiger can't move in placing
        }
      }
      // Tiger can't do anything in placing phase
    }

    // PHASE 2: MOVING
    else if(phase === "MOVING"){
      if(selected!== null){
        const result = tryMove(selected, index, newBoard);
        if(result.valid){
          newBoard = result.board;
          if(result.captured) setCaptured(captured + 1);
          setSelected(null);
          setTurn(turn==="PULI"?"MEKA":"PULI"); // Turn change
        }else{
          if(newBoard[index] === (turn==="PULI"?PULI:MEKA)) setSelected(index);
          else setSelected(null);
        }
      }else if(newBoard[index] === (turn==="PULI"?PULI:MEKA)){
        setSelected(index); // Select your piece
      }
    }
    setBoard(newBoard);
  }

  const tryMove = (from, to, b) => {
    // Normal move
    if(CONNECTIONS[from].includes(to) && b[to]===EMPTY){
      let newB = [...b];
      newB[to] = newB[from];
      newB[from] = EMPTY;
      return {valid:true, board:newB, captured:false};
    }

    // Capture move - Tiger only
    if(b[from]===PULI){
      for(let mid of CONNECTIONS[from]){
        if(b[mid]===MEKA){
          // Check if 'to' is 2 steps away from 'from' via 'mid'
          for(let jump of CONNECTIONS[mid]){
            if(jump===to && b[to]===EMPTY){
              let newB = [...b];
              newB[to] = PULI;
              newB[from] = EMPTY;
              newB[mid] = EMPTY; // Goat captured
              return {valid:true, board:newB, captured:true};
            }
          }
        }
      }
    }
    return {valid:false};
  }

  const restart = () => {
    setBoard(initializeBoard());
    setPhase("PLACING");
    setTurn("MEKA");
    setMekasPlaced(0);
    setCaptured(0);
    setSelected(null);
  }

  const statusText = phase==="PLACING"
   ? `${t.mekaTurn} - ${t.placing}: ${mekasPlaced}/18`
    : turn==="PULI"? t.puliTurn : t.mekaTurn;

  return (
    <div style={{background:"#F5DEB3", padding:16, borderRadius:12}}>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:12, fontWeight:"bold", fontSize:14}}>
        <span>{statusText}</span>
        <span>Captured: {captured}/5</span>
      </div>

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
              fontSize:22, cursor:"pointer", zIndex:10
            }}>
            {board[i]===PULI&&"🐯"}{board[i]===MEKA&&"🐐"}
          </div>
        ))}
      </div>
      <button onClick={restart} style={{width:"100%", marginTop:12, background:"red", color:"white", padding:12, borderRadius:8, border:"none", fontWeight:"bold"}}>Restart</button>
    </div>
  )
}

function initializeBoard(){
  const b = Array(17).fill(EMPTY);
  b[0]=PULI; b[2]=PULI; b[14]=PULI; b[16]=PULI; // 4 corners
  return b;
  }
