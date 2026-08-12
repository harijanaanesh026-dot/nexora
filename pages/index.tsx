import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Home, Timer, Target, BarChart3, User, Flame, Clock, Trophy, Play, Check, Settings, X, Shield } from 'lucide-react';

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

export default function QUITTR_MVP() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [showRelapse, setShowRelapse] = useState(false); // MANADHI RELAPSE WALL

  const [data, setData] = useState({
    screenTime: 0,
    timeSaved: 0,
    streak: 7,
    lifeScore: 78,
    focusTime: 0,
    xp: 250,
    level: 3,
    missionsDone: 1,
    challengeDay: 3,
    badges: ["7 Day Streak", "Focus King"],
    goal: "Screen Time < 2h Daily",
    instaLimit: 30*60, // 30min
    ytLimit: 45*60, // 45min
    instaUsed: 0,
    ytUsed: 0
  });

  const [isFocusing, setIsFocusing] = useState(false);
  const [focusTimer, setFocusTimer] = useState(0);
  const [selectedFocus, setSelectedFocus] = useState(25);
  const [relapseTimer, setRelapseTimer] = useState(5);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if(currentUser){
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) setData(docSnap.data() as any);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // MAIN TIMER LOGIC
  useEffect(() => {
    if(!user) return;
    const interval = setInterval(() => {
      setData(prev => {
        const newData = {...prev};

        if(isFocusing){
          newData.focusTime += 1;
          newData.timeSaved += 1;
        } else {
          // Simulate app usage - real lo extension nundi vastundi
          newData.screenTime += 1;
          newData.instaUsed += 1;
          newData.ytUsed += 1;
          newData.lifeScore = Math.max(0, 100 - Math.floor(newData.screenTime/600));
        }

        // MANADHI BLOCKER LOGIC - APP LOPALE
        const shouldBlock = newData.instaUsed > newData.instaLimit || newData.ytUsed > newData.ytLimit;
        if(shouldBlock &&!showRelapse){
          setShowRelapse(true);
          setRelapseTimer(5);
        }

        newData.level = Math.floor(newData.xp / 100) + 1;
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [user, isFocusing, showRelapse]);

  // RELAPSE WALL TIMER
  useEffect(() => {
    if(!showRelapse) return;
    const i = setInterval(() => {
      setRelapseTimer(prev => prev > 0? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(i);
  }, [showRelapse]);

  useEffect(() => {
    if(user) setDoc(doc(db, "users", user.uid), {...data, last: serverTimestamp()}, {merge:true});
  }, [data, user]);

  const handleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const fmt = (s:number) => `${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m`;

  const startFocus = () => {
    setFocusTimer(0);
    setIsFocusing(true);
    setShowRelapse(false); // Focus start ayithe block off
    setData(prev => ({...prev, instaUsed: 0, ytUsed: 0})); // Reset usage
    setTimeout(() => {
      setIsFocusing(false);
      setData(prev => ({...prev, xp: prev.xp + selectedFocus }));
      alert(`Session completed! +${selectedFocus} XP`);
    }, selectedFocus * 60 * 1000);
  }

  if(loading) return <div className="bg-black h-screen flex items-center justify-center text-white">Loading...</div>;

  if(!user) return (
    <main className="bg-gradient-to-b from-black to-red-950 text-white min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-extrabold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">QUITTR</h1>
      <p className="text-gray-400 mb-10">Break the Scroll</p>
      <button onClick={handleLogin} className="bg-red-600 hover:bg-red-700 font-bold py-4 px-10 rounded-xl text-xl">Google tho Login</button>
    </main>
  );

  const TABS = [
    {id:'home', icon:Home, name:'Home'},
    {id:'focus', icon:Timer, name:'Focus'},
    {id:'challenges', icon:Target, name:'Challenges'},
    {id:'progress', icon:BarChart3, name:'Progress'},
    {id:'profile', icon:User, name:'Profile'},
  ];

  return (
    <main className="bg-black text-white min-h-screen pb-20">
      <header className="p-4 border-b border-gray-800 sticky top-0 bg-black flex justify-between">
        <h1 className="text-2xl font-bold">QUITTR<span className="text-red-500">MVP</span></h1>
        <button onClick={()=>setTab('profile')}><Settings/></button>
      </header>

      {/* MANADHI RELAPSE WALL - APP LOPALE */}
      {showRelapse && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500/50 p-8 rounded-2xl text-center max-w-md">
            <Shield size={48} className="text-red-500 mx-auto mb-4"/>
            <h1 className="text-3xl font-bold text-red-500 mb-2">WAIT!</h1>
            <p className="text-gray-300 mb-4">QUITTR gurtuchestundi...</p>
            <p>Nuv focus cheyalanukunnav kada?</p>
            <p className="text-xl font-mono my-4">{relapseTimer}s</p>
            <button
              onClick={() => setShowRelapse(false)}
              disabled={relapseTimer > 0}
              className={`w-full py-3 rounded-lg font-bold ${relapseTimer > 0? 'bg-gray-700' : 'bg-red-600'}`}
            >
              {relapseTimer > 0? 'Aagu...' : 'I Know, Proceed'}
            </button>
            <button onClick={startFocus} className="w-full mt-3 bg-green-600 py-3 rounded-lg font-bold">Start Focus Instead</button>
          </div>
        </div>
      )}

      <div className="p-4 max-w-2xl mx-auto">

        {/* 1. HOME SCREEN */}
        {tab==='home' && <div className="space-y-4">
          <h2 className="text-2xl font-bold">Today</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Screen Time" value={fmt(data.screenTime)} />
            <StatCard title="Time Saved" value={fmt(data.timeSaved)} color="text-green-400" />
            <StatCard title="Streak" value={`${data.streak} Days`} icon={<Flame className="text-orange-400"/>} />
            <StatCard title="Life Score" value={`${data.lifeScore}/100`} color="text-blue-400" />
          </div>
          <div className="bg-gray-900/50 p-4 rounded-xl">
            <p>Instagram: {fmt(data.instaUsed)} / {fmt(data.instaLimit)}</p>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
              <div className="bg-red-600 h-2 rounded-full" style={{width: `${(data.instaUsed/data.instaLimit)*100}%`}}></div>
            </div>
          </div>
          <button onClick={() => setTab('focus')} className="w-full bg-red-600 py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2">
            <Play/> Start Focus
          </button>
        </div>}

        {/* 2. FOCUS SCREEN */}
        {tab==='focus' && <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold">Focus Mode</h2>
          {isFocusing? (
            <div>
              <p className="text-gray-400">{selectedFocus} min Session Running...</p>
              <p className="text-6xl font-mono my-6">{Math.floor(focusTimer/60)}:{(focusTimer%60).toString().padStart(2,'0')}</p>
              <button onClick={() => setIsFocusing(false)} className="bg-red-600 px-8 py-3 rounded-lg">Stop</button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400">Choose duration</p>
              <div className="flex gap-3 justify-center">
                {[25, 50, 90].map(mins => (
                  <button key={mins} onClick={() => setSelectedFocus(mins)}
                    className={`px-6 py-3 rounded-xl font-bold ${selectedFocus===mins?'bg-red-600':'bg-gray-900 border-gray-800'}`}>
                    {mins} min
                  </button>
                ))}
              </div>
              <button onClick={startFocus} className="w-full bg-red-600 py-4 rounded-xl text-xl font-bold">Start Focus</button>
            </div>
          )}
        </div>}

        {/* 3. CHALLENGES SCREEN */}
        {tab==='challenges' && <div className="space-y-4">
          <h2 className="text-2xl font-bold">Challenges</h2>
          <div className="bg-gray-900/50 p-5 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">Daily Mission</h3>
            <p className="text-gray-400">Complete 1 Focus Session</p>
            <div className="flex justify-between items-center mt-3">
              <span>Progress: {data.missionsDone}/1</span>
              <button className="bg-green-600 px-4 py-2 rounded flex items-center gap-1"><Check size={16}/> Done</button>
            </div>
          </div>
          <div className="bg-gray-900/50 p-5 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">7-Day Challenge</h3>
            <p className="text-gray-400">Screen Time {"<"} 2 Hours Daily</p>
            <div className="w-full bg-gray-800 rounded-full h-2.5 mt-3">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${(data.challengeDay/7)*100}%`}}></div>
            </div>
            <p className="mt-2">Progress: Day {data.challengeDay} / 7</p>
          </div>
        </div>}

        {/* 4. PROGRESS SCREEN */}
        {tab==='progress' && <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Progress</h2>
          <StatCard title="Daily Screen Time" value={fmt(data.screenTime)} />
          <StatCard title="Weekly Screen Time" value={fmt(data.screenTime * 7)} />
          <StatCard title="Focus Hours" value={fmt(data.focusTime)} />
          <StatCard title="Time Saved" value={fmt(data.timeSaved)} color="text-green-400" />
          <StatCard title="Streak History" value={`${data.streak} Days Current`} />
        </div>}

        {/* 5. PROFILE SCREEN */}
        {tab==='profile' && <div className="space-y-4">
          <h2 className="text-2xl font-bold">Profile</h2>
          <div className="bg-gray-900/50 p-5 rounded-2xl text-center">
            <p className="text-gray-400">Level</p>
            <p className="text-5xl font-bold">{data.level}</p>
            <p className="text-gray-400 mt-2">{data.xp} XP</p>
          </div>
          <div className="bg-gray-900/50 p-5 rounded-2xl">
            <h3 className="font-bold mb-2 flex items-center gap-2"><Trophy/> Badges</h3>
            {data.badges.map(b => <span key={b} className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full inline-block mr-2 mb-2">{b}</span>)}
          </div>
          <div className="bg-gray-900/50 p-5 rounded-2xl">
            <h3 className="font-bold mb-2">Goals</h3>
            <p>{data.goal}</p>
          </div>
          <div className="bg-gray-900/50 p-5 rounded-2xl">
            <h3 className="font-bold mb-2">Settings</h3>
            <button onClick={() => signOut(auth)} className="w-full bg-red-600 py-2 rounded">Logout</button>
          </div>
        </div>}

      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 flex justify-around p-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 ${tab===t.id? 'text-red-500' : 'text-gray-400'}`}>
            <t.icon size={22}/>
            <span className="text-xs">{t.name}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

const StatCard = ({title, value, color="", icon}:any) => (
  <div className="bg-gray-900/50 p-5 rounded-2xl border-gray-800">
    {icon}
    <p className="text-gray-400 text-sm">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);
