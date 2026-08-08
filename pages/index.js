"use client";
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Home, Users, Target, Flame, BookOpen, Briefcase, MapPin, MessageCircle, Trophy, User, Send, Heart, Search, Bell } from "lucide-react";

// ============ FIREBASE ============
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

export default function UpliftApp() {
  const [tab, setTab] = useState("Home");
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [posts, setPosts] = useState([]);
  const [people, setPeople] = useState([]);
  const [chats, setChats] = useState([]);
  const [streak, setStreak] = useState(7);
  const [xp, setXp] = useState(340);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => { if(!u) signInAnonymously(auth); else setUser(u); });

    onSnapshot(query(collection(db,"goals"), orderBy("createdAt","desc")), snap => setGoals(snap.docs.map(d=>({id:d.id,...d.data()}))));
    onSnapshot(query(collection(db,"posts"), orderBy("createdAt","desc")), snap => setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))));
    onSnapshot(collection(db,"users"), snap => setPeople(snap.docs.map(d=>({id:d.id,...d.data()}))));
    onSnapshot(query(collection(db,"chats"), orderBy("createdAt","asc")), snap => setChats(snap.docs.map(d=>({id:d.id,...d.data()}))));
  }, []);

  const tabs = [
    {id:"Home", icon:Home}, {id:"People", icon:Users}, {id:"Goals", icon:Target},
    {id:"Skills", icon:BookOpen}, {id:"Opportunities", icon:Briefcase}, {id:"Nearby", icon:MapPin},
    {id:"Social", icon:MessageCircle}, {id:"Rewards", icon:Trophy}, {id:"Profile", icon:User}
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#EDE9FE] pb-24">
      <div className="max-w-[500px] mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur z-10 p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#6366F1]">UPLIFT</h1>
          <Bell className="w-6 h-6 text-gray-600"/>
        </div>

        {tab==="Home" && <HomeScreen goals={goals} streak={streak} xp={xp} people={people}/>}
        {tab==="People" && <PeopleScreen people={people} db={db}/>}
        {tab==="Goals" && <GoalsScreen goals={goals} db={db} user={user} setXp={setXp}/>}
        {tab==="Skills" && <SkillsScreen/>}
        {tab==="Opportunities" && <OpportunitiesScreen/>}
        {tab==="Nearby" && <NearbyScreen/>}
        {tab==="Social" && <SocialScreen posts={posts} db={db} user={user} chats={chats}/>}
        {tab==="Rewards" && <RewardsScreen xp={xp} streak={streak}/>}
        {tab==="Profile" && <ProfileScreen user={user} xp={xp} streak={streak}/>}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg flex justify-around py-2 max-w-[500px] mx-auto">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`flex flex-col items-center text-xs ${tab===t.id?"text-[#6366F1]":"text-gray-400"}`}>
            <t.icon className="w-6 h-6"/>
            <span>{t.id}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============ 1. HOME ============
function HomeScreen({goals, streak, xp, people}){
  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white p-5 rounded-2xl shadow-lg">
        <p className="text-sm">Good Morning 👋</p>
        <h2 className="text-2xl font-bold">Ready to grow today?</h2>
        <div className="flex gap-4 mt-3">
          <div>🔥 {streak} Day Streak</div>
          <div>⭐ {xp} XP</div>
        </div>
      </div>

      <Card title="🎯 Today's Goals">
        {goals.length===0? <p className="text-gray-500">No goals yet. Add one!</p> :
         goals.slice(0,3).map(g=><div key={g.id} className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4"/> {g.title}</div>)}
      </Card>

      <Card title="🔥 Active Challenge">
        <div className="bg-orange-100 p-3 rounded-lg">7-Day No Sugar - Day 4/7</div>
      </Card>

      <Card title="👥 People You May Know">
        {people.slice(0,2).map(p=>(
          <div key={p.id} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">😊</div>
            <div>
              <p className="font-semibold">{p.name || "User"}</p>
              <p className="text-xs text-gray-500">Same goal: Learn React</p>
            </div>
          </div>
        ))}
      </Card>

      <Card title="💼 New Opportunities">
        <p>React Intern - Remote - Apply Now</p>
      </Card>
    </div>
  )
}

// ============ 2. PEOPLE ============
function PeopleScreen({people, db}){
  const [search, setSearch] = useState("");
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Discover People</h2>
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search skills, goals..." className="w-full pl-10 p-3 border rounded-xl"/>
      </div>

      {people.map(p=>(
        <div key={p.id} className="bg-white p-4 rounded-2xl shadow flex items-center justify-between">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl">😎</div>
            <div>
              <p className="font-bold">{p.name || "Rahul"}</p>
              <p className="text-sm text-gray-500">Skills: React, UI Design</p>
              <p className="text-xs text-green-600">● Active now</p>
            </div>
          </div>
          <button className="bg-[#6366F1] text-white px-4 py-2 rounded-xl text-sm">Connect</button>
        </div>
      ))}
    </div>
  )
}

// ============ 3. GOALS ============
function GoalsScreen({goals, db, user, setXp}){
  const [newGoal, setNewGoal] = useState("");
  const addGoal = async () => {
    if(!newGoal) return;
    await addDoc(collection(db,"goals"), {title:newGoal, userId:user?.uid, completed:false, createdAt:serverTimestamp()})
    setNewGoal(""); setXp(prev=>prev+10);
  }
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Goals & Challenges</h2>
      <div className="flex gap-2">
        <input value={newGoal} onChange={e=>setNewGoal(e.target.value)} placeholder="Add daily goal" className="flex-1 p-3 border rounded-xl"/>
        <button onClick={addGoal} className="bg-green-500 text-white px-5 rounded-xl font-bold">+ Add</button>
      </div>
      {goals.map(g=>(
        <div key={g.id} className="bg-white p-4 rounded-2xl shadow flex justify-between">
          <span>{g.title}</span>
          <button className="text-green-600 font-semibold">Mark Done</button>
        </div>
      ))}
    </div>
  )
}

// ============ 4. SOCIAL + CHAT ============
function SocialScreen({posts, db, user, chats}){
  const [postText, setPostText] = useState("");
  const [chatText, setChatText] = useState("");
  const chatRef = useRef(null);

  const addPost = async () => {
    if(!postText) return;
    await addDoc(collection(db,"posts"), {text:postText, userId:user?.uid, likes:[], createdAt:serverTimestamp()})
    setPostText("");
  }
  const sendChat = async () => {
    if(!chatText) return;
    await addDoc(collection(db,"chats"), {text:chatText, userId:user?.uid, createdAt:serverTimestamp()})
    setChatText("");
    chatRef.current?.scrollIntoView({behavior:"smooth"})
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Social & Chat</h2>

      {/* Post */}
      <div className="flex gap-2">
        <input value={postText} onChange={e=>setPostText(e.target.value)} placeholder="Share your progress..." className="flex-1 p-3 border rounded-xl"/>
        <button onClick={addPost} className="bg-blue-500 text-white px-5 rounded-xl">Post</button>
      </div>

      {posts.map(p=>(
        <div key={p.id} className="bg-white p-4 rounded-2xl shadow">
          <p>{p.text}</p>
          <button className="flex items-center gap-1 text-sm mt-2 text-gray-600"><Heart className="w-4 h-4"/> {p.likes?.length || 0}</button>
        </div>
      ))}

      {/* Chat Box */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-bold mb-2">💬 Group Chat</h3>
        <div className="h-64 overflow-y-auto space-y-2 mb-2">
          {chats.map(c=>(
            <div key={c.id} className="bg-purple-100 p-2 rounded-lg w-fit">{c.text}</div>
          ))}
          <div ref={chatRef}/>
        </div>
        <div className="flex gap-2">
          <input value={chatText} onChange={e=>setChatText(e.target.value)} placeholder="Message..." className="flex-1 p-2 border rounded-lg"/>
          <button onClick={sendChat} className="bg-[#6366F1] text-white p-2 rounded-lg"><Send className="w-5 h-5"/></button>
        </div>
      </div>
    </div>
  )
}

// ============ 5. SKILLS ============
function SkillsScreen(){
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Skills</h2>
      <Card title="I Can Teach"><p>React, Public Speaking</p></Card>
      <Card title="I Want to Learn"><p>Figma, Digital Marketing</p></Card>
      <button className="w-full bg-purple-500 text-white py-3 rounded-xl font-bold">Find Learning Partner</button>
    </div>
  )
}

// ============ 6. OPPORTUNITIES ============
function OpportunitiesScreen(){
  const opps = [
    {title:"Frontend Intern", type:"Internship", loc:"Remote", company:"Google"},
    {title:"UI/UX Freelance", type:"Freelance", loc:"Kurnool", company:"Startup"},
  ]
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Opportunities</h2>
      {opps.map((o,i)=>(
        <div key={i} className="bg-white p-4 rounded-2xl shadow">
          <p className="font-bold text-lg">{o.title}</p>
          <p className="text-sm text-gray-600">{o.company} | {o.type} | {o.loc}</p>
          <button className="bg-green-500 text-white px-4 py-2 rounded-xl mt-2">Apply Now</button>
        </div>
      ))}
    </div>
  )
}

// ============ 7. NEARBY ============
function NearbyScreen(){
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Nearby</h2>
      <Card title="📍 Kurnool Runners Club"><p>5km away - Sunday 6AM</p></Card>
      <Card title="📍 UI/UX Meetup"><p>Hyderabad - This Saturday</p></Card>
    </div>
  )
}

// ============ 8. REWARDS ============
function RewardsScreen({xp, streak}){
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Rewards</h2>
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-5 rounded-2xl">
        <p className="text-lg">Level 4</p>
        <p className="text-3xl font-bold">{xp} XP</p>
        <p>🔥 {streak} Day Streak</p>
      </div>
      <Card title="🏆 Badges"><p>Consistency King | Skill Learner | Challenge Winner</p></Card>
      <Card title="🏆 Leaderboard">
        <p>1. Rahul - 540 XP</p>
        <p>2. You - {xp} XP</p>
        <p>3. Priya - 210 XP</p>
      </Card>
    </div>
  )
}

// ============ 9. PROFILE ============
function ProfileScreen({user, xp, streak}){
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Profile</h2>
      <div className="bg-white p-5 rounded-2xl shadow text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto flex items-center justify-center text-4xl">😎</div>
        <p className="font-bold text-xl mt-2">Your Name</p>
        <p className="text-gray-500">Kurnool, AP</p>
        <p className="mt-2">Skills: React, Design, Fitness</p>
        <p className="mt-2 font-bold">🏆 {xp} XP | 🔥 {streak} Streak</p>
      </div>
      <button className="w-full bg-gray-200 py-3 rounded-xl">⚙️ Settings</button>
      <button className="w-full bg-red-100 text-red-600 py-3 rounded-xl">🔒 Privacy & Safety</button>
    </div>
  )
}

// ============ REUSABLE CARD COMPONENT ============
function Card({title, children}){
  return (
    <div className="bg-white p-4 rounded-2xl shadow space-y-2">
      <h3 className="font-bold text-lg">{title}</h3>
      {children}
    </div>
  )
          }
