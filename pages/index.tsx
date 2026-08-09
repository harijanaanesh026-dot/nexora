import React, { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, getDoc, setDoc, increment } from "firebase/firestore";
import { Home, Target, BarChart3, Flame, Users, TreePine, Coins, Bell, BookOpen, Heart, Trophy, Shield, TrendingDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

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

// ============ TYPES ============
type UserType = {
  uid: string; coins: number; xp: number; level: number; streak: number;
  timeBank: number; lifeScore: number; scrollTimeToday: number; focusTimeToday: number;
};
type MissionType = { id: string; title: string; target: number; progress: number; reward: number; completed: boolean };

export default function QUITTR() {
  const [user, setUser] = useState<UserType | null>(null);
  const [tab, setTab] = useState("Home");
  const [missions, setMissions] = useState<MissionType[]>([]);

  useEffect(() => {
    signInAnonymously(auth);
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, "users", u.uid), {
            coins: 500, xp: 0, level: 1, streak: 0, timeBank: 0, lifeScore: 65,
            scrollTimeToday: 0, focusTimeToday: 0
          });
        }
        setUser(userDoc.exists()? userDoc.data() as UserType : { uid: u.uid, coins: 500, xp: 0, level: 1, streak: 0, timeBank: 0, lifeScore: 65, scrollTimeToday: 0, focusTimeToday: 0 });
      }
    });
    return () => unsub();
  }, []);

  if (!user) return <div className="h-screen flex items-center justify-center">Loading QUITTR 2.0...</div>;

  const tabs: any = {
    Home: <HomePage user={user} />,
    Focus: <FocusPage user={user} />,
    Learn: <LearnPage />,
    LifeScore: <LifeScorePage user={user} />,
    Challenges: <ChallengesPage />,
    Profile: <ProfilePage user={user} />
  }
  return (
    <div className="max-w-[500px] mx-auto bg-gray-50 min-h-screen pb-20">
      <Header user={user}/>
      {tabs[tab]}
      <BottomNav tab={tab} setTab={setTab} />
      <Toaster/>
    </div>
  )
}

function Header({ user }: { user: UserType }) {
  return <div className="sticky top-0 bg-white/80 backdrop-blur p-4 border-b">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-purple-600">QUITTR</h1>
      <div className="flex gap-3 items-center">
        <span className="bg-yellow-100 px-3 py-1 rounded-full text-sm">💰 {user.coins}</span>
        <span className="bg-purple-100 px-3 py-1 rounded-full text-sm">⭐ Lv.{user.level}</span>
      </div>
    </div>
  </div>
}

// ============ 1. HOME - DAILY MISSION + TIME BANK ============
function HomePage({ user }: { user: UserType }) {
  const lifeScoreColor = user.lifeScore > 80? "text-green-600" : user.lifeScore > 50? "text-yellow-600" : "text-red-600";

  const simulateScroll = async () => {
    // SCROLL TAX FEATURE 💥
    const tax = 100;
    await updateDoc(doc(db, "users", user.uid), {
      coins: increment(-tax),
      scrollTimeToday: increment(60)
    });
    toast.error(`Scroll Tax: -${tax} Coins 😭 Open Learn Instead?`, { duration: 4000 });
  }

  return (
    <div className="p-4 space-y-4">
      <Card title="">
        <div className="text-center">
          <p className="text-sm text-gray-500">Your Life Score</p>
          <p className={`text-6xl font-bold ${lifeScoreColor}`}>{user.lifeScore}/100</p>
          <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
            <div className="bg-gradient-to-r from-red-500 to-green-500 h-3 rounded-full" style={{width: `${user.lifeScore}%`}}></div>
          </div>
        </div>
      </Card>

      <Card title="🎯 Today's Mission">
        <div className="bg-purple-50 p-3 rounded-xl">
          <p className="font-bold">Scroll 2 hours less</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{width: `40%`}}></div>
          </div>
          <p className="text-sm mt-1">Reward: +200 Coins +50 XP</p>
        </div>
      </Card>

      <Card title="💰 Time Bank">
        <p className="text-3xl font-bold text-green-600">{user.timeBank}h 42m</p>
        <p className="text-sm">Saved this month. That's 5.3 movies 🎬</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={()=>toast("Focus Started")} className="bg-green-600 text-white py-4 rounded-2xl font-bold">+Focus 1h = +200🪙</button>
        <button onClick={simulateScroll} className="bg-red-500 text-white py-4 rounded-2xl font-bold">-Scroll 1h = -100🪙</button>
      </div>
    </div>
  )
}

// ============ 2. LEARN INSTEAD ============
function LearnPage() {
  const topics = [
    { name: "English", icon: "📚", time: "5 min" },
    { name: "Coding", icon: "💻", time: "10 min" },
    { name: "GK", icon: "🧠", time: "3 min" },
    { name: "Fitness", icon: "💪", time: "7 min" },
  ]
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Learn Instead of Scrolling</h2>
      {topics.map(t => (
        <Card key={t.name} title="">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <span className="text-3xl">{t.icon}</span>
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-gray-500">{t.time} lesson</p>
              </div>
            </div>
            <button onClick={()=>toast.success("+20 XP +10 Coins")} className="bg-purple-600 text-white px-4 py-2 rounded-xl">Start</button>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ============ 3. LIFE SCORE DASHBOARD ============
function LifeScorePage({ user }: { user: UserType }) {
  const categories = [
    { name: "Sleep", score: 90, icon: <Heart className="text-red-500"/> },
    { name: "Exercise", score: 60, icon: <Target className="text-green-500"/> },
    { name: "Learning", score: 70, icon: <BookOpen className="text-blue-500"/> },
    { name: "Focus", score: 80, icon: <Shield className="text-purple-500"/> },
    { name: "Social Media", score: 30, icon: <TrendingDown className="text-red-500"/> },
  ]
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Life Dashboard</h2>
      {categories.map(c => (
        <Card key={c.name} title="">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              {c.icon} <span className="font-bold">{c.name}</span>
            </div>
            <span className="font-bold">{c.score}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div className="bg-purple-600 h-2 rounded-full" style={{width: `${c.score}%`}}></div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ============ 4. GLOBAL CHALLENGES ============
function ChallengesPage() {
  const challenges = [
    { name: "No-Reels Sunday", members: "12.4K", reward: "500 Coins" },
    { name: "7-Day Focus Challenge", members: "8.2K", reward: "Golden Badge" },
    { name: "30-Day Digital Detox", members: "2.1K", reward: "1000 Coins" },
  ]
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">🌍 Global Challenges</h2>
      {challenges.map(c => (
        <Card key={c.name} title="">
          <p className="font-bold text-lg">{c.name}</p>
          <p className="text-sm text-gray-500">{c.members} joining</p>
          <p className="text-sm">Reward: {c.reward}</p>
          <button onClick={()=>toast.success("Joined Challenge!")} className="w-full bg-purple-600 text-white py-2 rounded-xl mt-2">Join</button>
        </Card>
      ))}
    </div>
  )
}

function ProfilePage({ user }: { user: UserType }) {
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Profile</h2>
      <Card title="">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500"/>
          <p className="font-bold text-xl">Level {user.level}</p>
          <p>{user.xp}/1000 XP</p>
          <p className="mt-2">🔥 {user.streak} Day Streak</p>
        </div>
      </Card>
      <Card title="Accountability Partner">
        <p>Anesh will get notified if you exceed limit</p>
        <button onClick={()=>toast("Invite Sent")} className="w-full bg-purple-600 text-white py-2 rounded-xl mt-2">Add Friend</button>
      </Card>
    </div>
  )
}

function BottomNav({ tab, setTab }: any) {
  const tabs = [
    { id: "Home", icon: Home }, { id: "Focus", icon: Target },
    { id: "Learn", icon: BookOpen }, { id: "LifeScore", icon: BarChart3 },
    { id: "Challenges", icon: Users }, { id: "Profile", icon: User },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t grid grid-cols-6 py-1 max-w-[500px] mx-auto">
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center text-[10px] ${tab === t.id? "text-purple-600" : "text-gray-400"}`}>
          <t.icon className="w-5 h-5" />{t.id}
        </button>
      ))}
    </div>
  )
}

function Card({ title, children }: any) {
  return <div className="bg-white p-4 rounded-2xl shadow space-y-2">
    {title && <h3 className="font-bold text-lg">{title}</h3>}
    {children}
  </div>
}
