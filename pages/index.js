"use client"
import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

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

const styles = {
  body: {background:"radial-gradient(ellipse at top, #1A0A1F 0%, #050A18 100%)", color:"#E2E8F0", fontFamily:"'Inter', sans-serif", margin:0, paddingBottom:80},
  header: {display:"flex", justifyContent:"space-between", padding:"14px 16px", background:"rgba(168,85,247,0.2)", borderBottom:"1px solid #A855F7"},
  logo: {fontSize:22, fontWeight:"800", background: "linear-gradient(90deg, #EC4899, #A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"},
  card: {background:"rgba(30,10,40,0.8)", border:"1px solid #A855F7", margin:"16px", borderRadius:16, padding:16},
  btnPrimary: {background:"linear-gradient(90deg, #EC4899, #A855F7)", border:"none", color:"white", padding:"12px 20px", borderRadius:12, fontWeight:"700", width:"100%"},
  btnGhost: {background:"#1E293B", border:"1px solid #A855F7", color:"white", padding:"10px 16px", borderRadius:12},
  input: {background:"#1E293B", border:"1px solid #334155", color:"white", width:"100%", padding:12, borderRadius:12, margin:"8px 0"},
}

export default function RishtaApp() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("discover");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u) {
        const d = await getDoc(doc(db, "rishta_users", u.uid));
        setProfile(d.data());
      }
    });
  }, []);

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h2 style={styles.logo}>NEXORA RISHTA 💍</h2>
        {user && <span onClick={()=>setTab("profile")}>👤</span>}
      </div>

      {!user && <AuthWall/>}
      {user && !profile && <CreateProfile user={user}/>}
      
      {user && profile && <>
        {tab === "discover" && <Discover user={user} profile={profile}/>}
        {tab === "matches" && <Matches user={user}/>}
        {tab === "chat" && <ChatPage user={user}/>}
        {tab === "profile" && <MyProfile user={user} profile={profile}/>}
      </>}

      {user && profile && <div style={{display:"flex", justifyContent:"space-around", position:"fixed", bottom:0, width:"100%", background:"#0F172A", padding:12}}>
        <span onClick={()=>setTab("discover")}>🔍</span>
        <span onClick={()=>setTab("matches")}>❤️</span>
        <span onClick={()=>setTab("chat")}>💬</span>
      </div>}
    </div>
  )
}

function AuthWall() {
  return(<div style={{textAlign:"center", padding:60}}>
    <h2>Find Your Person</h2>
    <p>Love + Arrange = Best</p>
    <button style={styles.btnPrimary} onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())}>Continue with Google</button>
  </div>)
}

// ===== 1. CREATE PROFILE WITH FILTERS =====
function CreateProfile({user}) {
  const [form, setForm] = useState({name:"", age:"", gender:"Male", city:"", job:"", education:"", food:"Veg", religion:"", bio:""});

  const save = async() => {
    await setDoc(doc(db,"rishta_users",user.uid), {...form, photo: user.photoURL, uid: user.uid, likes:[], matches:[]});
    alert("Profile Created!");
  }

  return(<div style={{padding:16}}>
    <h3>Create Your Profile</h3>
    <input style={styles.input} placeholder="Full Name" onChange={e=>setForm({...form,name:e.target.value})}/>
    <input style={styles.input} type="number" placeholder="Age" onChange={e=>setForm({...form,age:e.target.value})}/>
    <select style={styles.input} onChange={e=>setForm({...form,gender:e.target.value})}><option>Male</option><option>Female</option></select>
    <input style={styles.input} placeholder="City" onChange={e=>setForm({...form,city:e.target.value})}/>
    <input style={styles.input} placeholder="Job" onChange={e=>setForm({...form,job:e.target.value})}/>
    <select style={styles.input} onChange={e=>setForm({...form,food:e.target.value})}><option>Veg</option><option>Non-Veg</option><option>Eggetarian</option></select>
    <textarea style={styles.input} placeholder="About you" onChange={e=>setForm({...form,bio:e.target.value})}/>
    <button style={styles.btnPrimary} onClick={save}>Save & Find Matches</button>
  </div>)
}

// ===== 2. DISCOVER WITH FILTERS =====
function Discover({user, profile}) {
  const [people, setPeople] = useState([]);
  
  useEffect(()=>{
    // Show opposite gender + same city first
    const q = query(collection(db,"rishta_users"), 
      where("gender","!=",profile.gender),
      where("city","==",profile.city)
    );
    onSnapshot(q, snap=>{ setPeople(snap.docs.map(d=>d.data()).filter(p=>p.uid!==user.uid)) })
  },[]);

  const like = async(person) => {
    // Add to my likes
    await updateDoc(doc(db,"rishta_users",user.uid), {likes: arrayUnion(person.uid)});
    // Check if they also liked me = MATCH
    if(person.likes?.includes(user.uid)) {
      await updateDoc(doc(db,"rishta_users",user.uid), {matches: arrayUnion(person.uid)});
      await updateDoc(doc(db,"rishta_users",person.uid), {matches: arrayUnion(user.uid)});
      alert(`It's a Match with ${person.name}! Chat open ayindi 💌`);
    }
  }

  return(<div style={{padding:16}}>
    <h3>Discover in {profile.city}</h3>
    {people.map(p=>(
      <div key={p.uid} style={styles.card}>
        <img src={p.photo} style={{width:80,height:80,borderRadius:"50%"}}/>
        <h4>{p.name}, {p.age}</h4>
        <p>{p.job} • {p.food} • {p.education}</p>
        <p style={{fontSize:13}}>{p.bio}</p>
        <button style={styles.btnPrimary} onClick={()=>like(p)}>❤️ Interested</button>
      </div>
    ))}
  </div>)
}

// ===== 3. MATCHES + 7 DAY CHAT =====
function Matches({user}) {
  const [matches, setMatches] = useState([]);
  useEffect(()=>{
    getDoc(doc(db,"rishta_users",user.uid)).then(d=>{
      const data = d.data();
      if(data.matches) {
        data.matches.forEach(id=>{
          getDoc(doc(db,"rishta_users",id)).then(m=>setMatches(prev=>[...prev, m.data()]))
        })
      }
    })
  },[]);
  
  return(<div style={{padding:16}}>
    <h3>Your Matches</h3>
    <p style={{fontSize:12}}>Rule: 7 days app lo matrame chat. Tarvatha number</p>
    {matches.map(m=>(
      <div key={m.uid} style={styles.card}>
        <img src={m.photo} style={{width:50,height:50,borderRadius:"50%"}}/>
        <b>{m.name}</b>
        <button style={styles.btnGhost}>Chat Now 💬</button>
      </div>
    ))}
  </div>)
}

function MyProfile({user, profile}) {
  return(<div style={{padding:20, textAlign:"center"}}>
    <img src={profile.photo} style={{width:100,height:100,borderRadius:"50%", border:"3px solid #A855F7"}}/>
    <h2>{profile.name}</h2>
    <p>{profile.job} • {profile.city}</p>
    <button style={{...styles.btnPrimary, background:"#F87171"}} onClick={()=>signOut(auth)}>Logout</button>
  </div>)
        }
