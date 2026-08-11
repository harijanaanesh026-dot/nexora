import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Home, Timer, Target, BarChart3, User, Flame, Trophy, Play, Check, Clock, Shield, Users, Calendar, TreePine, Gift } from 'lucide-react';

// FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058"
};
const app =!getApps().length? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export default function QUITTR_V2() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    // 1. Time Bank
    timeSavedToday: 4800, timeSavedWeek: 31500, timeSavedLife: 432000,
    // 2. App Limits
    instaLimit: 30*60, ytLimit: 45*60, instaUsed: 1200, ytUsed: 800,
    // 3. Missions
    missions: [
      {id:1, title:"Complete 2 focus sessions", done:0, total:2},
      {id:2, title:"Keep screen time below 2h", done:0, total:1},
      {id:3, title:"No reels for 1 hour", done:0, total:1}
    ],
    // 4. Streak
    dailyStreak: 7, weeklyStreak: 3, badges: ["7 Day Streak", "No Reels Master"],
    // 5. XP
    xp: 450, level: 5,
    // 6. Friends
    friends: [{name:"Arjun", hours:12}, {name:"You", hours:15}],
    // 7. Calendar
    calendar: Array(30).fill('green').map((v,i)=> i%5===0?'red':i%3===0?'yellow':'green'),
    // 8. Tree
    treeStage: 3, // 0: seed, 1: sapling, 2: tree, 3: big tree, 4: forest
    // 9. Rewards
    coins: 1250, theme: "Dark"
  });

  const [isFocusing, setIsFocusing] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u){ const snap = await getDoc(doc(db, "users", u.uid)); if(snap.exists()) setData(snap.data() as any) }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setData(prev => {
        const newData = {...prev};
        if(isFocusing){
          newData.timeSavedToday += 1;
          newData.timeSavedWeek += 1;
          newData.timeSavedLife += 1;
          newData.xp += 1;
          if(newData.xp % 100 === 0) newData.level += 1;
        } else {
          newData.instaUsed += 1;
          newData.ytUsed += 1;
        }
        newData.level = Math.floor(newData.xp / 100) + 1;
        return newData;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [isFocusing]);

  useEffect(() => { if(user) setDoc(doc(db, "users", user.uid), {...data, last: serverTimestamp()}, {merge:true}) }, [data, user]);

  const fmt = (s:number) => `${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m`;
  const login = () => signInWithPopup(auth, new GoogleAuthProvider());

  if(loading) return <div className="bg-black h-screen flex items-center justify-center text-white">Loading...</div>;
  if(!user) return (
    <main className="bg-gradient-to-b from-black to-red-950 text-white min-h-screen flex-col items-center justify-center">
      <h1 className="text-7xl font-extrabold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">QUITTR v2</h1>
      <button onClick={login} className="mt-6 bg-red-600 px-10 py-4 rounded-xl text-xl font-bold">Google Login</button>
    </main>
  );

  const TABS = [
    {id:'dashboard',icon:Home,name:'Dashboard'},
    {id:'bank',icon:Clock,name:'Time Bank'},
    {id:'limits',icon:Shield,name:'Limits'},
    {id:'missions',icon:Target,name:'Missions'},
    {id:'streak',icon:Flame,name:'Streak'},
    {id:'game',icon:Trophy,name:'XP'},
    {id:'friends',icon:Users,name:'Friends'},
    {id:'calendar',icon:Calendar,name:'Calendar'},
    {id:'tree',icon:TreePine,name:'Tree'},
    {id:'rewards',icon:Gift,name:'Rewards'},
  ];

  return (
    <main className="bg-black text-white min-h-screen pb-20">
      <header className="p-4 border-b border-gray-800 flex justify-between">
        <h1 className="text-2xl font-bold">QUITTR<span className="text-red-500">v2</span></h1>
        <div>Lvl {data.level} | {data.coins} Coins</div>
      </header>

      <nav className="flex gap-2 p-2 bg-gray-900/50 overflow-x-auto">
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${tab===t.id?'bg-red-600':''}`}><t.icon size={16}/>{t.name}</button>)}
      </nav>

      <div className="p-4 max-w-4xl mx-auto space-y-6">

        {/* DASHBOARD */}
        {tab==='dashboard' && <div>
          <h2 className="text-2xl font-bold mb-4">Today</h2>
          <button onClick={()=>setIsFocusing(!isFocusing)} className={`w-full py-6 rounded-2xl text-2xl font-bold ${isFocusing?'bg-green-600':'bg-red-600'}`}>
            {isFocusing?'STOP FOCUS':'START 25min FOCUS'}
          </button>
        </div>}

        {/* 1. TIME BANK */}
        {tab==='bank' && <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Clock/> Time Bank</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <Card title="Today saved" val={fmt(data.timeSavedToday)}/>
            <Card title="This week saved" val={fmt(data.timeSavedWeek)}/>
            <Card title="Lifetime saved" val={fmt(data.timeSavedLife)}/>
          </div>
        </div>}

        {/* 2. APP LIMITS */}
        {tab==='limits' && <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Shield/> App Limits</h2>
          <div className="space-y-4 mt-4">
            <LimitBar name="Instagram" used={data.instaUsed} limit={data.instaLimit}/>
            <LimitBar name="YouTube" used={data.ytUsed} limit={data.ytLimit}/>
            <div className="bg-gray-900/50 p-4 rounded-xl">+ Add Custom App Limit</div>
          </div>
        </div>}

        {/* 3. DAILY MISSIONS */}
        {tab==='missions' && <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Target/> Daily Missions</h2>
          {data.missions.map(m=>(
            <div key={m.id} className="bg-gray-900/50 p-4 rounded-xl mt-3 flex justify-between">
              <p>{m.title}</p>
              <span>{m.done}/{m.total}</span>
            </div>
          ))}
        </div>}

        {/* 4. STREAK SYSTEM */}
        {tab==='streak' && <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Flame/> Streak System</h2>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Card title="Daily Streak" val={`${data.dailyStreak} Days`}/>
            <Card title="Weekly Streak" val={`${data.weeklyStreak} Weeks`}/>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-xl mt-4">
            <p className="font-bold mb-2">Milestone Badges</p>
            {data.badges.map(b=><span key={b} className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full mr-2">{b}</span>)}
          </div>
        </div>}

        {/* 5. XP & LEVELS */}
        {tab==='game' && <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Trophy/> XP & Levels</h2>
          <div className="bg-gray-900/50 p-5 rounded-2xl mt-4">
            <p>Level {data.level}</p>
            <div className="w-full bg-gray-800 rounded-full h-3 mt-2">
              <div className="bg-blue-600 h-3 rounded-full" style={{width: `${data.xp%100}%`}}></div>
            </div>
            <p>{data.xp%100}/100 XP to next level</p>
            <p className="text-sm text-gray-400 mt-2">Focus sessions = +XP. Unlock badges at milestones.</p>
          </div>
        </div>}

        {/* 6. FRIEND CHALLENGES */}
        {tab==='friends' && <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users/> Friend Challenges</h2>
          <button className="bg-red-600 px-4 py-2 rounded mt-4">Challenge a Friend</button>
          <div className="bg-gray-900/50 p-4 rounded-xl mt-4">
            <p className="font-bold">Leaderboard - This Week</p>
            {data.friends.sort((a,b)=>b.hours-a.hours).map((f,i)=><p key={f.name}>{i+1}. {f.name} - {f.hours}h</p>)}
          </div>
        </div>}

        {/* 7. LIFE CALENDAR */}
        {tab==='calendar' && <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar/> Life Calendar</h2>
          <p className="text-sm text-gray-400">🟢 Productive | 🟡 Average | 🔴 Excessive</p>
          <div className="grid grid-cols-7 gap-2 mt-4">
            {data.calendar.map((d,i)=><div key={i} className={`w-10 h-10 rounded ${d==='green'?'bg-green-500':d==='yellow'?'bg-yellow-500':'bg-red-500'}`}></div>)}
          </div>
        </div>}

        {/* 8. VIRTUAL TREE */}
        {tab==='tree' && <div className="bg-gray-900/50 p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2"><TreePine/> Virtual Tree</h2>
          <div className="text-9xl">
            {data.treeStage===0?'🌱':data.treeStage===1?'🌿':data.treeStage===2?'🌳':data.treeStage===3?'🌲':'🏞️'}
          </div>
          <p className="mt-4">Focus chesthe tree perugutundi</p>
          <p className="text-red-400">Ekkuva scroll cheste growth slow</p>
        </div>}

        {/* 9. REWARDS */}
        {tab==='rewards' && <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Gift/> Rewards</h2>
          <Card title="Coins" val={data.coins}/>
          <div className="bg-gray-900/50 p-4 rounded-xl mt-4">
            <p>Unlock: Themes, Profile Frames, Avatars</p>
          </div>
        </div>}

      </div>
    </main>
  );
}

const Card = ({title, val}:any) => (
  <div className="bg-gray-900/50 p-5 rounded-2xl border-gray-800">
    <p className="text-gray-400">{title}</p>
    <p className="text-3xl font-bold">{val}</p>
  </div>
);

const LimitBar = ({name, used, limit}:any) => (
  <div className="bg-gray-900/50 p-4 rounded-xl">
    <p>{name} Limit: {Math.floor(limit/60)}min</p>
    <p>Used: {Math.floor(used/60)}min</p>
    <div className="w-full bg-gray-800 rounded-full h-2.5 mt-2">
      <div className="bg-red-600 h-2.5 rounded-full" style={{width: `${(used/limit)*100}%`}}></div>
    </div>
  </div>
);
