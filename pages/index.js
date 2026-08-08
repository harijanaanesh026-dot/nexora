import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { Home, Search, Target, Flame, MessageCircle, User, Bell, Plus, X, Send, Award, Trophy } from "lucide-react";
import { motion } from "framer-motion";
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ============ TYPES ============
type UserType = { uid: string; email: string; name?: string; username?: string; xp?: number; streak?: number; level?: number; bio?: string; city?: string };
type GoalType = { id: string; title: string; category: string; completed: boolean; userId: string; date: string };
type BadgeType = { id: string; name: string; icon: string; unlocked: boolean };
type NotificationType = { id: string; text: string; read: boolean; userId: string; createdAt: any };

// ============ XP & LEVEL SYSTEM ============
const XP_PER_GOAL = 20;
const XP_PER_CHALLENGE = 50;
const XP_PER_STREAK = 10;
const getLevel = (xp: number) => Math.floor(xp / 100) + 1;
const xpToNextLevel = (xp: number) => 100 - (xp % 100);

// ============ BADGES ============
const BADGES: BadgeType[] = [
  { id: "first_goal", name: "First Goal", icon: "🎯", unlocked: false },
  { id: "first_challenge", name: "First Challenge", icon: "🔥", unlocked: false },
  { id: "streak_7", name: "7 Day Streak", icon: "🏆", unlocked: false },
  { id: "streak_30", name: "30 Day Streak", icon: "👑", unlocked: false },
];

// ============ MAIN APP ============
function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        setUser(userDoc.exists()? userDoc.data() as UserType : { uid: u.uid, email: u.email! });
      } else setUser(null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <BrowserRouter>
      <Toaster position="top-center"/>
      {user? user.name? <MainApp user={user}/> : <Onboarding user={user} setUser={setUser}/> : <AuthPage setUser={setUser}/>}
    </BrowserRouter>
  );
}

// ============ A. ONBOARDING ============
function Onboarding({ user, setUser }: any) {
  const [form, setForm] = useState({ name: "", username: "", bio: "", city: "", interests: "" });
  const save = async () => {
    if (!form.name ||!form.username) return toast.error("Name & Username required");

    // Check username unique
    const q = query(collection(db, "users"), where("username", "==", form.username));
    const snap = await getDocs(q);
    if (!snap.empty) return toast.error("Username already taken");

    await setDoc(doc(db, "users", user.uid), {...user,...form, xp: 0, level: 1, streak: 0 });
    setUser({...user,...form });
    toast.success("Profile Created! +50 XP");
    addXP(user.uid, 50);
    addNotification(user.uid, "Welcome to LIFELOOP! 🎉");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-purple-500 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Complete Profile</h2>
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" className="w-full p-3 border rounded-xl mb-3"/>
        <input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="Username" className="w-full p-3 border rounded-xl mb-3"/>
        <input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="City" className="w-full p-3 border rounded-xl mb-3"/>
        <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Bio" className="w-full p-3 border rounded-xl mb-3"/>
        <button onClick={save} className="w-full bg-primary text-white py-3 rounded-xl font-bold">Save & Continue</button>
      </div>
    </div>
  )
}

// ============ AUTH PAGE ============
function AuthPage({ setUser }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async () => {
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) { toast.error(e.message); }
  };

  const googleLogin = async () => await signInWithPopup(auth, googleProvider);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-purple-500 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-4">LIFELOOP</h2>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-3 border rounded-xl mb-3"/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full p-3 border rounded-xl mb-3"/>
        <button onClick={handleAuth} className="w-full bg-primary text-white py-3 rounded-xl font-bold mb-2">{isLogin?"Login":"Sign Up"}</button>
        <button onClick={googleLogin} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold mb-2">Google</button>
        <p className="text-center cursor-pointer" onClick={()=>setIsLogin(!isLogin)}>
          {isLogin?"New? Sign Up":"Login"}
        </p>
      </div>
    </div>
  )
}

// ============ MAIN APP ============
function MainApp({ user }: { user: UserType }) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    const q = query(collection(db, "notifications"), where("userId","==",user.uid), orderBy("createdAt","desc"));
    return onSnapshot(q, snap => setNotifications(snap.docs.map(d=>({id:d.id,...d.data()} as NotificationType))));
  }, [user]);

  return (
    <div className="max-w-[500px] mx-auto bg-gray-50 min-h-screen pb-20">
      <Header notifications={notifications}/>
      <Routes>
        <Route path="/" element={<HomePage user={user}/>}/>
        <Route path="/discover" element={<DiscoverPage user={user}/>}/>
        <Route path="/goals" element={<GoalsPage user={user}/>}/>
        <Route path="/challenges" element={<ChallengesPage user={user}/>}/>
        <Route path="/chat" element={<ChatPage user={user}/>}/>
        <Route path="/profile" element={<ProfilePage user={user}/>}/>
      </Routes>
      <BottomNav/>
    </div>
  )
}

// ============ HEADER WITH NOTIFICATIONS ============
function Header({ notifications }: any) {
  const [show, setShow] = useState(false);
  const unread = notifications.filter((n:NotificationType)=>!n.read).length;

  const markRead = async (id: string) => {
    await updateDoc(doc(db,"notifications",id), {read:true});
  }

  return (
    <div className="sticky top-0 bg-white/80 backdrop-blur p-4 flex justify-between items-center border-b z-10">
      <h1 className="text-xl font-bold text-primary">LIFELOOP</h1>
      <div className="relative">
        <Bell className="w-6 h-6 cursor-pointer" onClick={()=>setShow(!show)}/>
        {unread>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{unread}</span>}
        {show && <div className="absolute right-0 mt-2 w-72 bg-white shadow-xl rounded-xl p-3">
          {notifications.length===0?<p>No notifications</p>:notifications.map((n:NotificationType)=>(
            <div key={n.id} onClick={()=>markRead(n.id)} className={`p-2 ${n.read?"text-gray-400":"font-bold"}`}>{n.text}</div>
          ))}
        </div>}
      </div>
    </div>
  )
}

// ============ BOTTOM NAV ============
function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const tabs = [
    { path: "/", icon: Home }, { path: "/discover", icon: Search },
    { path: "/goals", icon: Target }, { path: "/challenges", icon: Flame },
    { path: "/chat", icon: MessageCircle }, { path: "/profile", icon: User },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 max-w-[500px] mx-auto">
      {tabs.map(t => (
        <button key={t.path} onClick={() => nav(t.path)}
          className={`flex flex-col items-center ${loc.pathname===t.path?"text-primary":"text-gray-400"}`}>
          <t.icon className="w-6 h-6"/>
        </button>
      ))}
    </div>
  )
}

// ============ HOME PAGE ============
function HomePage({ user }: { user: UserType }) {
  const [goals, setGoals] = useState<GoalType[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>(BADGES);

  useEffect(() => {
    const q = query(collection(db, "goals"), where("userId", "==", user.uid));
    return onSnapshot(q, snap => setGoals(snap.docs.map(d => ({ id: d.id,...d.data() } as GoalType))));
  }, [user]);

  // B. BADGE UNLOCK LOGIC
  useEffect(() => {
    if (goals.length>=1 &&!badges[0].unlocked) unlockBadge(user.uid, "first_goal");
    if (user.streak>=7 &&!badges[2].unlocked) unlockBadge(user.uid, "streak_7");
  }, [goals, user.streak]);

  const completed = goals.filter(g => g.completed).length;
  const percent = goals.length? Math.round(completed / goals.length * 100) : 0;

  return (
    <div className="p-4 space-y-4">
      <motion.div className="bg-gradient-to-r from-primary to-purple-500 text-white p-5 rounded-2xl">
        <p>Good Morning 👋</p>
        <h2 className="text-2xl font-bold">Live Better. Together.</h2>
        <div className="flex gap-4 mt-2">🔥 {user.streak} Streak | ⭐ {user.xp} XP | Level {getLevel(user.xp||0)}</div>
        <div className="w-full bg-white/30 rounded-full h-2 mt-2">
          <div className="bg-white h-2 rounded-full" style={{width: `${xpToNextLevel(user.xp||0)}%`}}/>
        </div>
      </motion.div>

      <Card title="🎯 Today's Goals">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div className="bg-primary h-2 rounded-full" style={{width: `${percent}%`}}/>
        </div>
        {goals.map(g => <GoalItem key={g.id} goal={g} user={user}/>)}
      </Card>

      <Card title="🏆 Badges">
        <div className="flex gap-3">
          {badges.map(b=>(
            <div key={b.id} className={`text-center ${b.unlocked?"opacity-100":"opacity-30"}`}>
              <div className="text-3xl">{b.icon}</div>
              <p className="text-xs">{b.name}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function GoalItem({ goal, user }: any) {
  const toggle = async () => {
    const newStatus =!goal.completed;
    await updateDoc(doc(db, "goals", goal.id), { completed: newStatus });
    if (newStatus) {
      addXP(user.uid, XP_PER_GOAL);
      addNotification(user.uid, `Goal completed! +${XP_PER_GOAL} XP`);
      toast.success(`+${XP_PER_GOAL} XP`);
    }
  }
  return <div className="flex justify-between py-1"><span>{goal.title}</span><input type="checkbox" checked={goal.completed} onChange={toggle}/></div>
}

// ============ GOALS PAGE ============
function GoalsPage({ user }: { user: UserType }) {
  const [goals, setGoals] = useState<GoalType[]>([]);
  const [title, setTitle] = useState("");
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const q = query(collection(db, "goals"), where("userId", "==", user.uid));
    return onSnapshot(q, snap => setGoals(snap.docs.map(d => ({ id: d.id,...d.data() } as GoalType))));
  }, [user]);

  const addGoal = async () => {
    if (!title) return;
    await addDoc(collection(db, "goals"), { userId: user.uid, title, category: "Personal", completed: false, date: today, createdAt: serverTimestamp() });
    setTitle(""); addXP(user.uid, 10);
  };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Goals</h2>
      <div className="flex gap-2">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Add goal" className="flex-1 p-3 border rounded-xl"/>
        <button onClick={addGoal} className="bg-primary text-white px-5 rounded-xl"><Plus/></button>
      </div>
      {goals.map(g=>(
        <div key={g.id} className="bg-white p-4 rounded-2xl shadow flex justify-between">
          <span className={g.completed?"line-through":""}>{g.title}</span>
        </div>
      ))}
    </div>
  )
}

// ============ CHALLENGES PAGE ============
function ChallengesPage({ user }: { user: UserType }) {
  const challenges = [
    { id: "1", title: "Read 20 mins daily", days: 30 },
    { id: "2", title: "Exercise daily", days: 7 },
  ];

  const join = async (id: string) => {
    await addDoc(collection(db, "challengeParticipants"), { challengeId: id, userId: user.uid });
    addXP(user.uid, XP_PER_CHALLENGE);
    addNotification(user.uid, "Challenge Joined! +50 XP");
    toast.success("Joined! +50 XP");
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Challenges</h2>
      {challenges.map(c=>(
        <div key={c.id} className="bg-white p-4 rounded-2xl shadow">
          <p className="font-bold">{c.title}</p>
          <p className="text-sm text-gray-500">{c.days} Days</p>
          <button onClick={()=>join(c.id)} className="bg-orange-500 text-white px-4 py-2 rounded-xl mt-2">Join</button>
        </div>
      ))}
    </div>
  )
}

// ============ DISCOVER & CHAT & PROFILE ============
function DiscoverPage({ user }: { user: UserType }) {
  const [people, setPeople] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, "users"));
    return onSnapshot(q, snap => setPeople(snap.docs.map(d => d.data())));
  }, []);
  return (
    <div className="p-4"><h2 className="text-2xl font-bold">Discover</h2>
      {people.filter((p:any)=>p.uid!==user.uid).map((p:any)=>(
        <div key={p.uid} className="bg-white p-4 rounded-2xl shadow mt-3">
          <p className="font-bold">{p.name}</p><p className="text-sm">@{p.username}</p>
        </div>
      ))}
    </div>
  )
}

function ChatPage({ user }: { user: UserType }) {
  const [msg, setMsg] = useState("");
  const [chats, setChats] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt"));
    return onSnapshot(q, snap => setChats(snap.docs.map(d => ({ id: d.id,...d.data() }))));
  }, []);
  const send = async () => {
    if (!msg) return;
    await addDoc(collection(db, "messages"), { text: msg, userId: user.uid, createdAt: serverTimestamp() });
    setMsg("");
  };
  return (
    <div className="p-4 flex-col h-[80vh]">
      <h2 className="text-2xl font-bold mb-2">Chat</h2>
      <div className="flex-1 overflow-y-auto space-y-2">
        {chats.map((c:any) => <div key={c.id} className={`p-2 rounded-lg w-fit ${c.userId===user.uid?"bg-primary text-white ml-auto":"bg-gray-200"}`}>{c.text}</div>)}
      </div>
      <div className="flex gap-2"><input value={msg} onChange={e=>setMsg(e.target.value)} className="flex-1 p-3 border rounded-xl"/><button onClick={send} className="bg-primary text-white p-3 rounded-xl"><Send/></button></div>
    </div>
  )
}

function ProfilePage({ user }: { user: UserType }) {
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Profile</h2>
      <div className="bg-white p-5 rounded-2xl shadow text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto flex items-center justify-center text-4xl">😎</div>
        <p className="font-bold text-xl mt-2">{user.name}</p>
        <p className="text-gray-500">@{user.username}</p>
        <p className="mt-2">{user.bio}</p>
        <p className="mt-2 font-bold">⭐ {user.xp} XP | Level {getLevel(user.xp||0)} | 🔥 {user.streak} Streak</p>
      </div>
      <button onClick={()=>signOut(auth)} className="w-full bg-red-500 text-white py-3 rounded-xl">Logout</button>
    </div>
  )
}

// ============ HELPERS ============
async function addXP(uid: string, amount: number) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const currentXP = snap.data()?.xp || 0;
  await updateDoc(userRef, { xp: currentXP + amount });
}

async function addNotification(uid: string, text: string) {
  await addDoc(collection(db, "notifications"), { userId: uid, text, read: false, createdAt: serverTimestamp() });
}

async function unlockBadge(uid: string, badgeId: string) {
  await addDoc(collection(db, "userBadges"), { userId: uid, badgeId });
  addNotification(uid, `Badge Unlocked! 🏆`);
  toast.success("Badge Unlocked!");
}

function Card({title, children}: any) {
  return <div className="bg-white p-4 rounded-2xl shadow space-y-2">
    <h3 className="font-bold text-lg">{title}</h3>
    {children}
  </div>
}

export default App;
