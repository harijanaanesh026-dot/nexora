"use client";
import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion } from "firebase/firestore";

// ============ FIREBASE CONFIG ============
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
// ==========================================

export default function UpliftApp() {
  const [tab, setTab] = useState("Home");
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [posts, setPosts] = useState([]);
  const [people, setPeople] = useState([]);
  const [streak, setStreak] = useState(5);
  const [xp, setXp] = useState(240);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if(!u) signInAnonymously(auth);
      else setUser(u);
    });

    // Load Goals
    onSnapshot(query(collection(db,"goals"), orderBy("createdAt","desc")), snap =>
      setGoals(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
    // Load Posts
    onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc")), snap =>
      setPosts(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
    // Load People
    onSnapshot(collection(db,"users"), snap =>
      setPeople(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
  }, []);

  const tabs = [
    {id:"Home", icon:"🏠"}, {id:"People", icon:"👥"}, {id:"Goals", icon:"🎯"},
    {id:"Skills", icon:"📚"}, {id:"Opportunities", icon:"💼"}, {id:"Nearby", icon:"📍"},
    {id:"Social", icon:"💬"}, {id:"Rewards", icon:"🏆"}, {id:"Profile", icon:"👤"}
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="max-w-[500px] mx-auto">
        {tab==="Home" && <HomeScreen goals={goals} streak={streak} xp={xp}/>}
        {tab==="People" && <PeopleScreen people={people} db={db}/>}
        {tab==="Goals" && <GoalsScreen goals={goals} db={db} user={user} setXp={setXp}/>}
        {tab==="Skills" && <SkillsScreen/>}
        {tab==="Opportunities" && <OpportunitiesScreen/>}
        {tab==="Nearby" && <NearbyScreen/>}
        {tab==="Social" && <SocialScreen posts={posts} db={db} user={user}/>}
        {tab==="Rewards" && <RewardsScreen xp={xp} streak={streak}/>}
        {tab==="Profile" && <ProfileScreen user={user} xp={xp} streak={streak}/>}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`text-xs ${tab===t.id?"text-[#6366F1]":"text-gray-500"}`}>
            <div className="text-2xl">{t.icon}</div>
            {t.id}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============ 1. HOME ============
function HomeScreen({goals, streak, xp}){
  const todayGoals = goals.slice(0,3);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Good Morning 👋</h1>
      <div className="bg-white p-4 rounded-xl mt-4 shadow">🔥 {streak} Day Streak | ⭐ {xp} XP</div>

      <div className="bg-white p-4 rounded-xl mt-4 shadow">
        <h3 className="font-bold">🎯 Today's Goals</h3>
        {todayGoals.length===0? <p>No goals yet</p> : todayGoals.map(g=><p key={g.id}>☐ {g.title}</p>)}
      </div>

      <div className="bg-white p-4 rounded-xl mt-4 shadow">
        <h3 className="font-bold">🔥 Active Challenges</h3>
        <p>7-Day: No Sugar - Day 3/7</p>
      </div>

      <div className="bg-white p-4 rounded-xl mt-4 shadow">
        <h3 className="font-bold">💼 New Opportunities</h3>
        <p>React Internship - Hyderabad</p>
      </div>

      <div className="bg-white p-4 rounded-xl mt-4 shadow">
        <h3 className="font-bold">👥 People for You</h3>
        <p>Rahul - UI Designer | Same Goal: Learn Figma</p>
      </div>
    </div>
  )
}

// ============ 2. PEOPLE DISCOVER ============
function PeopleScreen({people, db}){
  const [search, setSearch] = useState("");
  const filtered = people.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase()));

  const connect = async (id) => {
    await addDoc(collection(db,"connections"), {from:"me", to:id, createdAt:serverTimestamp()})
    alert("Connection Request Sent!")
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">👥 Discover People</h2>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search skills, goals..." className="w-full p-2 border rounded-lg mt-2"/>

      {filtered.map(p=>(
        <div key={p.id} className="bg-white p-3 rounded-xl mt-3 flex justify-between items-center">
          <div>
            <p className="font-bold">{p.name || "User"}</p>
            <p className="text-sm text-gray-600">Skills: {p.skills?.join(", ") || "React, Design"}</p>
            <p className="text-xs">🎯 Goal: Learn Coding</p>
          </div>
          <button onClick={()=>connect(p.id)} className="bg-[#6366F1] text-white px-3 py-1 rounded-lg text-sm">Connect</button>
        </div>
      ))}
    </div>
  )
}

// ============ 3. GOALS & CHALLENGES ============
function GoalsScreen({goals, db, user, setXp}){
  const [newGoal, setNewGoal] = useState("");

  const addGoal = async () => {
    if(!newGoal) return;
    await addDoc(collection(db,"goals"), {title:newGoal, userId:user?.uid, completed:false, createdAt:serverTimestamp()})
    setNewGoal("");
    setXp(prev=>prev+10);
  }

  const completeGoal = async (id) => {
    await updateDoc(doc(db,"goals",id), {completed:true})
    setXp(prev=>prev+20);
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">🎯 Goals & Challenges</h2>
      <div className="flex gap-2 mt-2">
        <input value={newGoal} onChange={e=>setNewGoal(e.target.value)} placeholder="Add daily goal" className="flex-1 p-2 border rounded-lg"/>
        <button onClick={addGoal} className="bg-green-500 text-white px-4 rounded-lg">+ Add</button>
      </div>

      {goals.map(g=>(
        <div key={g.id} className="bg-white p-3 rounded-xl mt-3 flex justify-between">
          <span className={g.completed?"line-through":""}>{g.title}</span>
          {!g.completed && <button onClick={()=>completeGoal(g.id)} className="text-green-600">Done</button>}
        </div>
      ))}

      <div className="bg-orange-100 p-4 rounded-xl mt-4">
        <h3 className="font-bold">🔥 30-Day Challenge</h3>
        <p>Code Daily - Day 5/30</p>
      </div>
    </div>
  )
}

// ============ 4. SOCIAL ============
function SocialScreen({posts, db, user}){
  const [postText, setPostText] = useState("");

  const addPost = async () => {
    if(!postText) return;
    await addDoc(collection(db,"posts"), {text:postText, userId:user?.uid, likes:[], createdAt:serverTimestamp()})
    setPostText("");
  }

  const likePost = async (id) => {
    await updateDoc(doc(db,"posts",id), {likes: arrayUnion(user?.uid)})
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">💬 Social Feed</h2>
      <div className="flex gap-2 mt-2">
        <input value={postText} onChange={e=>setPostText(e.target.value)} placeholder="Share your progress..." className="flex-1 p-2 border rounded-lg"/>
        <button onClick={addPost} className="bg-blue-500 text-white px-4 rounded-lg">Post</button>
      </div>

      {posts.map(p=>(
        <div key={p.id} className="bg-white p-3 rounded-xl mt-3">
          <p>{p.text}</p>
          <button onClick={()=>likePost(p.id)} className="text-sm mt-2">❤️ {p.likes?.length || 0} Likes</button>
        </div>
      ))}
    </div>
  )
}

// ============ 5. SKILLS ============
function SkillsScreen(){
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">📚 Skills</h2>
      <div className="bg-white p-4 rounded-xl mt-3">
        <p className="font-bold">I Can Teach:</p>
        <p>React, Public Speaking</p>
      </div>
      <div className="bg-white p-4 rounded-xl mt-3">
        <p className="font-bold">I Want to Learn:</p>
        <p>Figma, Digital Marketing</p>
      </div>
      <button className="bg-purple-500 text-white w-full py-3 rounded-xl mt-4">Find Learning Partner</button>
    </div>
  )
}

// ============ 6. OPPORTUNITIES ============
function OpportunitiesScreen(){
  const opps = [
    {title:"Frontend Intern", type:"Internship", loc:"Remote"},
    {title:"UI/UX Freelance", type:"Freelance", loc:"Kurnool"},
    {title:"Hackathon 2026", type:"Event", loc:"Bangalore"}
  ]
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">💼 Opportunities</h2>
      {opps.map((o,i)=>(
        <div key={i} className="bg-white p-4 rounded-xl mt-3">
          <p className="font-bold">{o.title}</p>
          <p className="text-sm">{o.type} | {o.loc}</p>
          <button className="bg-green-500 text-white px-4 py-1 rounded-lg mt-2 text-sm">Apply</button>
        </div>
      ))}
    </div>
  )
}

// ============ 7. NEARBY ============
function NearbyScreen(){
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">📍 Nearby</h2>
      <div className="bg-white p-4 rounded-xl mt-3">
        <p className="font-bold">Kurnool Runners Club</p>
        <p className="text-sm">5km away - Sunday 6AM</p>
      </div>
      <div className="bg-white p-4 rounded-xl mt-3">
        <p className="font-bold">UI/UX Meetup</p>
        <p className="text-sm">Hyderabad - This Saturday</p>
      </div>
    </div>
  )
}

// ============ 8. REWARDS ============
function RewardsScreen({xp, streak}){
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">🏆 Rewards</h2>
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-4 rounded-xl mt-3">
        <p>Level 3 | {xp} XP</p>
        <p>🔥 {streak} Day Streak</p>
      </div>
      <div className="bg-white p-4 rounded-xl mt-3">
        <p>Badges Earned:</p>
        <p>🎯 Consistency King | 📚 Skill Learner | 💪 Challenge Winner</p>
      </div>
      <div className="bg-white p-4 rounded-xl mt-3">
        <h3 className="font-bold">Leaderboard</h3>
        <p>1. Rahul - 540 XP</p>
        <p>2. You - {xp} XP</p>
        <p>3. Priya - 210 XP</p>
      </div>
    </div>
  )
}

// ============ 9. PROFILE ============
function ProfileScreen({user, xp, streak}){
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">👤 Profile</h2>
      <div className="bg-white p-4 rounded-xl mt-3 text-center">
        <div className="text-5xl">😎</div>
        <p className="font-bold mt-2">Your Name</p>
        <p className="text-sm text-gray-600">Kurnool, AP</p>
        <p className="mt-2">Skills: React, Design, Fitness</p>
        <p className="mt-2">🏆 {xp} XP | 🔥 {streak} Streak</p>
      </div>
      <button className="bg-gray-200 w-full py-3 rounded-xl mt-4">⚙️ Settings</button>
      <button className="bg-red-100 text-red-600 w-full py-3 rounded-xl mt-2">🔒 Privacy & Safety</button>
    </div>
  )
                                                             }
