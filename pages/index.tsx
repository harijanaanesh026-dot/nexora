import { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Home, Timer, Target, BarChart3, User, Flame, Clock, Trophy, Play, Check, Settings, X, Shield, Zap, Users, Music, TreePine, Coins, AlertTriangle, Quote, Phone, Wind, TrendingUp, Medal, Github, Instagram, Twitter } from 'lucide-react';

// FIREBASE CONFIG
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

const QUOTES = [
  "Nuv scroll chesthe time pothundi. Nuv create chesthe history.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your future self will thank you for this focus session."
];

const MUSIC_TRACKS = {
  rain: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  white: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  nature: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  lofi: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
};

export default function QUITTR_PRO() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [showRelapse, setShowRelapse] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [data, setData] = useState({
    streak: 0, lastCheckin: "", streakFreeze: 1, badges: [] as string[],
    screenTime: 0, yesterdayScreenTime: 0, timeSaved: 0, weeklyTimeSaved: 0, lifeScore: 78, productivityScore: 50, mostDistractingApp: "Instagram",
    focusTime: 0, xp: 0, level: 1, coins: 0,
    dailyMissions: [
      {id: 1, task: "Complete 2 focus sessions", progress: 0, target: 2, reward: 50, claimed: false},
      {id: 2, task: "Stay under 1 hour Instagram", progress: 0, target: 1, reward: 30, claimed: false},
      {id: 3, task: "Save 30 mins today", progress: 0, target: 30, reward: 40, claimed: false}
    ],
    goal: "Screen Time < 2h Daily", instaLimit: 30*60, ytLimit: 45*60, fbLimit: 30*60, instaUsed: 0, ytUsed: 0, fbUsed: 0,
    treesPlanted: 0, treeHealth: 100, forestLevel: 0,
    friends: [] as string[], accountabilityPartner: "", mutualChallenges: [] as any[],
    achievements: [] as string[],
    shopItems: [
      {id: 1, name: "Dark Theme", cost: 200, owned: false},
      {id: 2, name: "Neon Theme", cost: 500, owned: false},
      {id: 3, name: "Avatar Frame", cost: 1000, owned: false}
    ],
  });

  const [isFocusing, setIsFocusing] = useState(false);
  const [focusTimer, setFocusTimer] = useState(0);
  const [selectedFocus, setSelectedFocus] = useState(25);
  const [relapseTimer, setRelapseTimer] = useState(5);

  // AUTH + DATA LOAD
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if(currentUser){
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) setData(prev => ({...prev,...(docSnap.data() as any)}));
        loadLeaderboard();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // DAILY CHECKIN + STREAK
  useEffect(() => {
    if(!user) return;
    const today = new Date().toDateString();
    if(data.lastCheckin!== today){
      setData(prev => {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const missed = prev.lastCheckin!== yesterday.toDateString() && prev.lastCheckin!== "";
        let newStreak = prev.streak; let newFreeze = prev.streakFreeze;
        if(missed && prev.streakFreeze > 0){ newStreak = prev.streak; newFreeze = 0; }
        else if(missed){ newStreak = 0; }
        else { newStreak = prev.streak + 1; }
        const newBadges = [...prev.badges];
        if(newStreak >= 7 &&!newBadges.includes("7 Day Streak")) newBadges.push("7 Day Streak");
        if(newStreak >= 30 &&!newBadges.includes("30 Day Streak")) newBadges.push("30 Day Streak");
        if(newStreak >= 100 &&!newBadges.includes("100 Day Streak")) newBadges.push("100 Day Streak");
        return {...prev, streak: newStreak, lastCheckin: today, badges: newBadges, streakFreeze: newFreeze};
      });
    }
  }, [user, data.lastCheckin]);

  // MAIN TIMER
  useEffect(() => {
    if(!user) return;
    const interval = setInterval(() => {
      setData(prev => {
        const newData = {...prev};
        if(isFocusing){
          newData.focusTime += 1; newData.timeSaved += 1; newData.weeklyTimeSaved += 1;
        } else {
          newData.screenTime += 1; newData.instaUsed += 1; newData.ytUsed += 1; newData.fbUsed += 1;
          newData.dailyMissions = newData.dailyMissions.map(m => {
            if(m.id === 2 && newData.instaUsed < newData.instaLimit) return {...m, progress: 1};
            if(m.id === 3) return {...m, progress: Math.floor(newData.timeSaved/60)};
            return m;
          });
          newData.dailyMissions.forEach(m => { if(m.progress >= m.target &&!m.claimed){ newData.xp += m.reward; newData.coins += m.reward; m.claimed = true; }});
        }
        newData.level = Math.floor(newData.xp / 100) + 1;
        newData.productivityScore = Math.min(100, Math.floor((newData.focusTime / (newData.screenTime + 1)) * 100));
        const apps = {Instagram: newData.instaUsed, YouTube: newData.ytUsed, Facebook: newData.fbUsed};
        newData.mostDistractingApp = Object.keys(apps).reduce((a, b) => apps[a as keyof typeof apps] > apps[b as keyof typeof apps]? a : b);
        const shouldBlock = newData.instaUsed > newData.instaLimit || newData.ytUsed > newData.ytLimit || newData.fbUsed > newData.fbLimit;
        if(shouldBlock &&!showRelapse){ setShowRelapse(true); setRelapseTimer(5); newData.treeHealth = Math.max(0, newData.treeHealth - 20); }
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [user, isFocusing, showRelapse]);

  useEffect(() => { if(!showRelapse) return; const i = setInterval(() => { setRelapseTimer(prev => prev > 0? prev - 1 : 0); }, 1000); return () => clearInterval(i); }, [showRelapse]);
  useEffect(() => { if(user) setDoc(doc(db, "users", user.uid), {...data, last: serverTimestamp()}, {merge:true}); }, [data, user]);

  const loadLeaderboard = async () => {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
    const snap = await getDocs(q); setLeaderboard(snap.docs.map(d => ({id: d.id,...d.data()})));
  }

  const handleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const fmt = (s:number) => `${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m`;

  const startFocus = () => {
    setFocusTimer(0); setIsFocusing(true); setShowRelapse(false);
    setData(prev => ({...prev, instaUsed: 0, ytUsed: 0, fbUsed: 0}));
    setTimeout(() => {
      setIsFocusing(false);
      setData(prev => {
        const newAchievements = [...prev.achievements]; const newTrees = prev.treesPlanted + 1;
        if(newTrees >= 1 &&!newAchievements.includes("First Focus Session")) newAchievements.push("First Focus Session");
        if(newTrees >= 10 &&!newAchievements.includes("10 Hours Focus")) newAchievements.push("10 Hours Focus");
        if(prev.screenTime < 3600 &&!newAchievements.includes("Screen Time Under 1 Hour")) newAchievements.push("Screen Time Under 1 Hour");
        const newForestLevel = Math.floor(newTrees / 100);
        return {...prev, xp: prev.xp + selectedFocus, coins: prev.coins + selectedFocus, treesPlanted: newTrees, treeHealth: 100, achievements: newAchievements, forestLevel: newForestLevel}
      });
      alert(`Session completed! +${selectedFocus} XP + ${selectedFocus} Coins 🌱`);
    }, selectedFocus * 60 * 1000);
  }

  if(loading) return <div className="bg-black h-screen flex items-center justify-center text-white">Loading QUITTR...</div>;
  if(!user) return (
    <main className="bg-gradient-to-b from-black to-red-950 text-white min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-extrabold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">QUITTR</h1>
      <p className="text-gray-400 mb-10">Break the Scroll</p>
      <button onClick={handleLogin} className="bg-red-600 hover:bg-red-700 font-bold py-4 px-10 rounded-xl text-xl">Google tho Login</button>
    </main>
  );

  const TABS = [
    {id:'home', icon:Home, name:'Home'}, {id:'focus', icon:Timer, name:'Focus'}, {id:'missions', icon:Target, name:'Missions'},
    {id:'forest', icon:TreePine, name:'Forest'}, {id:'shop', icon:Coins, name:'Shop'}, {id:'progress', icon:BarChart3, name:'Progress'},
    {id:'leaderboard', icon:Trophy, name:'Leaders'}, {id:'friends', icon:Users, name:'Friends'}, {id:'profile', icon:User, name:'Profile'},
  ];

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <header className="p-4 border-b border-gray-800 sticky top-0 bg-black flex justify-between items-center z-10">
        <h1 className="text-2xl font-bold">QUITTR<span className="text-red-500">PRO</span></h1>
        <div className="flex gap-4"><button onClick={() => setShowMusic(true)}><Music/></button><button onClick={() => setShowEmergency(true)} className="text-red-500"><AlertTriangle/></button></div>
      </header>

      {/* MODALS */}
      {showEmergency && (<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"><div className="bg-gray-900 border-red-500/50 p-8 rounded-2xl text-center max-w-md"><h1 className="text-2xl font-bold text-red-500 mb-4">Temptation vastunda? 🚨</h1><button onClick={() => {setShowEmergency(false); startFocus();}} className="w-full bg-red-600 py-3 rounded-lg mb-3 flex items-center justify-center gap-2"><Play/> Start Focus Now</button><button onClick={() => {alert(QUOTES[Math.floor(Math.random()*QUOTES.length)]);}} className="w-full bg-gray-800 py-3 rounded-lg mb-3 flex items-center justify-center gap-2"><Quote/> Quote</button><button onClick={() => {alert("5 min breathing: Inhale 4s, Hold 4s, Exhale 4s");}} className="w-full bg-blue-600 py-3 rounded-lg mb-3 flex items-center justify-center gap-2"><Wind/> Breathing</button><button onClick={() => setShowEmergency(false)} className="w-full bg-gray-700 py-3 rounded-lg">Close</button></div></div>)}
      {showMusic && (<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"><div className="bg-gray-900 p-8 rounded-2xl max-w-sm w-full"><h2 className="text-2xl font-bold mb-4">Focus Music 🎵</h2>{Object.keys(MUSIC_TRACKS).map(key => (<button key={key} onClick={() => {if(audioRef.current){audioRef.current.src = MUSIC_TRACKS[key as keyof typeof MUSIC_TRACKS]; audioRef.current.play();}}} className="w-full bg-gray-800 py-3 rounded-lg mb-2 capitalize">{key}</button>))}<audio ref={audioRef} loop /><button onClick={() => {audioRef.current?.pause(); setShowMusic(false);}} className="w-full bg-red-600 py-3 rounded-lg mt-4">Stop</button></div></div>)}
      {showRelapse && (<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"><div className="bg-gray-900 border-red-500/50 p-8 rounded-2xl text-center max-w-md"><Shield size={48} className="text-red-500 mx-auto mb-4"/><h1 className="text-3xl font-bold text-red-500 mb-2">WAIT!</h1><p className="text-gray-300 mb-4">QUITTR gurtuchestundi...</p><p className="text-xl font-mono my-4">{relapseTimer}s</p><button onClick={() => setShowRelapse(false)} disabled={relapseTimer > 0} className={`w-full py-3 rounded-lg font-bold ${relapseTimer > 0? 'bg-gray-700' : 'bg-red-600'}`}>{relapseTimer > 0? 'Aagu...' : 'Proceed Anyway'}</button><button onClick={startFocus} className="w-full mt-3 bg-green-600 py-3 rounded-lg font-bold">Start Focus Instead</button></div></div>)}

      <div className="p-4 max-w-2xl mx-auto flex-1 w-full">
        {/* HOME */}
        {tab==='home' && <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 p-5 rounded-2xl flex justify-between items-center">
            <div><p className="text-gray-400">Current Streak</p><p className="text-4xl font-bold flex items-center gap-2"><Flame className="text-orange-400"/>{data.streak} Days</p><p className="text-sm text-gray-400">Freeze: {data.streakFreeze}</p></div>
            <div><p className="text-gray-400">Coins</p><p className="text-3xl font-bold flex items-center gap-2"><Coins className="text-yellow-400"/>{data.coins}</p></div>
          </div>
          <h2 className="text-xl font-bold">Today's Insights 📊</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Screen Time" value={fmt(data.screenTime)} />
            <StatCard title="Time Saved" value={fmt(data.timeSaved)} color="text-green-400" />
            <StatCard title="Productivity" value={`${data.productivityScore}%`} color="text-blue-400" />
            <StatCard title="Worst App" value={data.mostDistractingApp} />
          </div>
          <div className="bg-gray-900/50 p-4 rounded-xl"><p>Instagram: {fmt(data.instaUsed)} / {fmt(data.instaLimit)}</p><div className="w-full bg-gray-800 rounded-full h-2 mt-1"><div className="bg-red-600 h-2 rounded-full" style={{width: `${(data.instaUsed/data.instaLimit)*100}%`}}></div></div></div>
          <div className="bg-gray-900/50 p-4 rounded-xl"><p>Facebook: {fmt(data.fbUsed)} / {fmt(data.fbLimit)}</p><div className="w-full bg-gray-800 rounded-full h-2 mt-1"><div className="bg-blue-600 h-2 rounded-full" style={{width: `${(data.fbUsed/data.fbLimit)*100}%`}}></div></div></div>
          <div className="bg-gray-900/50 p-4 rounded-xl"><p className="font-bold mb-2 flex items-center gap-2"><TreePine/> Focus Tree Health</p><div className="w-full bg-gray-800 rounded-full h-4"><div className="bg-green-500 h-4 rounded-full" style={{width: `${data.treeHealth}%`}}></div></div><p className="text-sm text-gray-400 mt-1">Trees: {data.treesPlanted}</p></div>
          <button onClick={() => setTab('focus')} className="w-full bg-red-600 py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2"><Play/> Start Focus</button>
        </div>}

        {/* FOCUS */}
        {tab==='focus' && <div className="space-y-6 text-center"><h2 className="text-2xl font-bold">Focus Mode</h2>{isFocusing? (<div><p className="text-gray-400">{selectedFocus} min Session Running...</p><p className="text-6xl font-mono my-6">{Math.floor(focusTimer/60)}:{(focusTimer%60).toString().padStart(2,'0')}</p><button onClick={() => setIsFocusing(false)} className="bg-red-600 px-8 py-3 rounded-lg">Stop</button></div>) : (<div className="space-y-4"><p className="text-gray-400">Choose duration</p><div className="flex gap-3 justify-center">{[25, 50, 90].map(mins => (<button key={mins} onClick={() => setSelectedFocus(mins)} className={`px-6 py-3 rounded-xl font-bold ${selectedFocus===mins?'bg-red-600':'bg-gray-900'}`}>{mins} min</button>))}</div><button onClick={startFocus} className="w-full bg-red-600 py-4 rounded-xl text-xl font-bold">Start Focus</button></div>)}</div>}

        {/* MISSIONS */}
        {tab==='missions' && <div className="space-y-4"><h2 className="text-2xl font-bold">Daily Missions ⚡</h2>{data.dailyMissions.map(m => (<div key={m.id} className="bg-gray-900/50 p-5 rounded-2xl"><p className="font-bold">{m.task}</p><div className="w-full bg-gray-800 rounded-full h-2 mt-2"><div className="bg-yellow-500 h-2 rounded-full" style={{width: `${(m.progress/m.target)*100}%`}}></div></div><p className="text-sm mt-1">Reward: {m.reward} XP + {m.reward} Coins {m.claimed && "✅"}</p></div>))}</div>}

                {/* FOREST */}
        {tab==='forest' && <div className="space-y-4 text-center"><h2 className="text-2xl font-bold">Your Forest 🌱</h2><p className="text-gray-400">Every focus session = 1 Tree</p><div className="bg-gray-900/50 p-10 rounded-2xl"><TreePine size={80} className="text-green-500 mx-auto mb-4"/><p className="text-4xl font-bold">{data.treesPlanted} Trees</p><p className="text-gray-400">Forest Level: {data.forestLevel}</p>{data.forestLevel >= 1 && <p className="text-green-400 mt-2">🏆 You have a Forest!</p>}</div></div>}

        {/* SHOP */}
        {tab==='shop' && <div className="space-y-4"><h2 className="text-2xl font-bold">QUITTR Shop 🪙 {data.coins}</h2>{data.shopItems.map(item => (<div key={item.id} className="bg-gray-900/50 p-4 rounded-xl flex justify-between items-center"><div><p className="font-bold">{item.name}</p><p className="text-sm text-gray-400">{item.cost} Coins</p></div><button onClick={() => {if(data.coins >= item.cost &&!item.owned){setData(prev => ({...prev, coins: prev.coins - item.cost, shopItems: prev.shopItems.map(s => s.id === item.id? {...s, owned: true} : s)}))}}} className={`px-4 py-2 rounded font-bold ${item.owned? 'bg-green-600' : 'bg-yellow-600'}`}>{item.owned? 'Owned' : 'Buy'}</button></div>))}</div>}

        {/* PROGRESS */}
        {tab==='progress' && <div className="space-y-4"><h2 className="text-2xl font-bold">Your Progress</h2><StatCard title="Daily Screen Time" value={fmt(data.screenTime)} /><StatCard title="Weekly Time Saved" value={fmt(data.weeklyTimeSaved)} color="text-green-400" /><StatCard title="Total Focus Hours" value={fmt(data.focusTime)} /><StatCard title="Productivity Score" value={`${data.productivityScore}%`} /></div>}

        {/* LEADERBOARD */}
        {tab==='leaderboard' && <div className="space-y-4"><h2 className="text-2xl font-bold">Leaderboard 🏆</h2>{leaderboard.map((p, i) => (<div key={p.id} className="bg-gray-900/50 p-4 rounded-xl flex justify-between"><span className="font-bold">#{i+1} {p.email?.split('@')[0] || 'User'}</span><span>{p.xp} XP</span></div>))}</div>}

        {/* FRIENDS */}
        {tab==='friends' && <div className="space-y-4"><h2 className="text-2xl font-bold">Accountability Partner 👥</h2><div className="bg-gray-900/50 p-5 rounded-2xl"><p className="font-bold">Invite Friend</p><input type="email" placeholder="friend@email.com" className="w-full bg-black p-2 rounded mt-2"/><button className="w-full bg-blue-600 py-2 rounded mt-2 font-bold">Send Invite</button></div><div className="bg-gray-900/50 p-5 rounded-2xl"><p className="font-bold mb-2">Mutual Challenge</p><p className="text-gray-400">7 Day Streak Challenge</p><div className="w-full bg-gray-800 rounded-full h-2 mt-2"><div className="bg-purple-600 h-2 rounded-full" style={{width: '40%'}}></div></div></div></div>}

        {/* PROFILE */}
        {tab==='profile' && <div className="space-y-4"><h2 className="text-2xl font-bold">Profile</h2><div className="bg-gray-900/50 p-5 rounded-2xl text-center"><p className="text-gray-400">Level</p><p className="text-5xl font-bold">{data.level}</p><p className="text-gray-400 mt-2">{data.xp} XP</p></div><div className="bg-gray-900/50 p-5 rounded-2xl"><h3 className="font-bold mb-2 flex items-center gap-2"><Trophy/> Achievements</h3>{data.achievements.length === 0 && <p className="text-gray-500">No achievements yet</p>}{data.achievements.map(a => <span key={a} className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full inline-block mr-2 mb-2">{a}</span>)}</div><div className="bg-gray-900/50 p-5 rounded-2xl"><h3 className="font-bold mb-2 flex items-center gap-2"><Medal/> Streak Badges</h3>{data.badges.map(b => <span key={b} className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full inline-block mr-2 mb-2">{b}</span>)}</div><button onClick={() => signOut(auth)} className="w-full bg-red-600 py-2 rounded font-bold">Logout</button></div>}
      </div>

      {/* BOTTOM NAV */}
      <nav className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 flex justify-around p-2 overflow-x-auto">
        {TABS.map(t => (<button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 p-2 min-w-[70px] ${tab===t.id? 'text-red-500' : 'text-gray-400'}`}><t.icon size={22}/><span className="text-xs">{t.name}</span></button>))}
      </nav>

      {/* FOOTER */}
      <footer className="bg-black border-t border-gray-800 p-6 text-center text-gray-500">
        <div className="flex justify-center gap-4 mb-4">
          <a href="#"><Github size={20}/></a>
          <a href="#"><Instagram size={20}/></a>
          <a href="#"><Twitter size={20}/></a>
        </div>
        <p className="text-sm">© 2026 QUITTR. Break the Scroll.</p>
        <p className="text-xs mt-2">Made with 🔥 in India</p>
      </footer>
    </div>
  );
}

const StatCard = ({title, value, color="", icon}:any) => (
  <div className="bg-gray-900/50 p-4 rounded-xl border-gray-800">
    <p className="text-gray-400 text-sm">{title}</p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
  </div>
);
