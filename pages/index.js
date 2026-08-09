import React, { useEffect, useState, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { Home, Search, Target, MessageCircle, User, Bell, Plus, Send, DollarSign, QrCode, Users, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Html5QrcodeScanner } from "html5-qrcode";

// ============ FIREBASE ============
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
if (!getApps().length) initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const googleProvider = new GoogleAuthProvider();

// ============ TYPES ============
type UserType = { uid: string; email: string; name?: string; username?: string; xp?: number; streak?: number; upiId?: string };
type GoalType = { id: string; title: string; completed: boolean; userId: string };
type PaymentType = { id: string; from: string; to: string; fromName: string; toName: string; amount: number; note: string; emoji: string; createdAt: any };

// ============ MAIN APP ============
export default function LifeLoop() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Home");

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
    <div className="font-sans bg-gray-50">
      <Toaster position="top-center"/>
      {user? user.name? <MainApp user={user} tab={tab} setTab={setTab}/> : <Onboarding user={user} setUser={setUser}/> : <AuthPage/>}
    </div>
  );
}

// ============ ONBOARDING ============
function Onboarding({ user, setUser }: { user: UserType, setUser: any }) {
  const [form, setForm] = useState({ name: "", username: "", upiId: "" });
  const save = async () => {
    if (!form.name ||!form.username ||!form.upiId) return toast.error("All fields required");
    await setDoc(doc(db, "users", user.uid), {...user,...form, xp: 0, streak: 0 });
    setUser({...user,...form });
    toast.success("Profile Created!");
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Complete Profile</h2>
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full Name" className="w-full p-3 border rounded-xl mb-3"/>
        <input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="Username" className="w-full p-3 border rounded-xl mb-3"/>
        <input value={form.upiId} onChange={e=>setForm({...form,upiId:e.target.value})} placeholder="UPI ID: name@upi" className="w-full p-3 border rounded-xl mb-3"/>
        <button onClick={save} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">Save</button>
      </div>
    </div>
  )
}

// ============ AUTH ============
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleAuth = async () => {
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-2 text-green-600">LIFELOOP</h2>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-3 border rounded-xl mb-3"/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full p-3 border rounded-xl mb-3"/>
        <button onClick={handleAuth} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold mb-2">{isLogin?"Login":"Sign Up"}</button>
        <button onClick={()=>signInWithPopup(auth, googleProvider)} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold mb-2">Google</button>
        <p className="text-center cursor-pointer text-green-600" onClick={()=>setIsLogin(!isLogin)}>{isLogin?"New? Sign Up":"Login"}</p>
      </div>
    </div>
  )
}

// ============ MAIN WITH TABS ============
function MainApp({ user, tab, setTab }: { user: UserType, tab: string, setTab: any }) {
  const tabs: any = {
    Home: <HomePage user={user} />,
    Discover: <DiscoverPage user={user} />,
    Pay: <PayPage user={user} />,
    Goals: <GoalsPage user={user} />,
    Chat: <ChatPage user={user} />,
    Profile: <ProfilePage user={user} />
  }
  return (
    <div className="max-w-[500px] mx-auto bg-gray-50 min-h-screen pb-20">
      <Header/>
      {tabs[tab]}
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  )
}

function Header() {
  return <div className="sticky top-0 bg-white/80 backdrop-blur p-4 flex justify-between items-center border-b z-10">
    <h1 className="text-xl font-bold text-green-600">LIFELOOP</h1>
    <Bell className="w-6 h-6"/>
  </div>
}

function BottomNav({ tab, setTab }: any) {
  const tabs = [
    { id: "Home", icon: Home }, { id: "Discover", icon: Search },
    { id: "Pay", icon: DollarSign }, { id: "Goals", icon: Target },
    { id: "Chat", icon: MessageCircle }, { id: "Profile", icon: User },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 max-w-[500px] mx-auto">
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center text-xs ${tab === t.id? "text-green-600" : "text-gray-400"}`}>
          <t.icon className="w-6 h-6" />{t.id}
        </button>
      ))}
    </div>
  )
}

// ============ HOME ============
function HomePage({ user }: { user: UserType }) {
  const [goals, setGoals] = useState<GoalType[]>([]);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  useEffect(() => {
    const q1 = query(collection(db, "goals"), where("userId", "==", user.uid));
    const unsub1 = onSnapshot(q1, snap => setGoals(snap.docs.map(d => ({ id: d.id,...d.data() } as GoalType))));
    const q2 = query(collection(db, "payments"), orderBy("createdAt","desc"));
    const unsub2 = onSnapshot(q2, snap => setPayments(snap.docs.map(d => ({ id: d.id,...d.data() } as PaymentType))));
    return () => { unsub1(); unsub2(); }
  }, [user]);
  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-5 rounded-2xl">
        <h2 className="text-2xl font-bold">Live Better. Together.</h2>
        <div className="flex gap-4 mt-2">🔥 {user.streak} Streak | ⭐ {user.xp} XP</div>
      </div>
      <Card title="💸 Friend Activity">
        {payments.length===0? <p className="text-gray-500">No payments yet</p> : payments.slice(0,5).map(p => (
          <div key={p.id} className="flex justify-between py-2 border-b">
            <div><p><b>{p.fromName}</b> → <b>{p.toName}</b></p><p className="text-sm">{p.emoji} {p.note}</p></div>
            <p className="font-bold text-green-600">₹{p.amount}</p>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ============ PAY PAGE - QR + SPLIT BILL ============
function PayPage({ user }: { user: UserType }) {
  const [mode, setMode] = useState<"menu"|"pay"|"qr"|"split">("menu");
  const [people, setPeople] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [splitMembers, setSplitMembers] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"));
    return onSnapshot(q, snap => setPeople(snap.docs.map(d => d.data())));
  }, []);

  const payUPI = async (toUser: any, amt: string, nt: string) => {
    if (!amt ||!toUser?.upiId) return toast.error("Select person and amount");
    const upiLink = `upi://pay?pa=${toUser.upiId}&pn=${toUser.name}&am=${amt}&cu=INR&tn=${nt}`;
    window.location.href = upiLink;
    await addDoc(collection(db, "payments"), {
      from: user.uid, to: toUser.uid, fromName: user.name, toName: toUser.name,
      amount: Number(amt), note: nt, emoji: "💸", createdAt: serverTimestamp()
    });
    toast.success(`Payment initiated to ${toUser.name}`);
    setMode("menu");
  }

  function QRScanner({ onClose }: any) {
    const scannerRef = useRef<any>(null);
    useEffect(() => {
      scannerRef.current = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
      scannerRef.current.render((decodedText: string) => {
        const urlParams = new URLSearchParams(decodedText.split('?')[1]);
        const pa = urlParams.get('pa'); const pn = urlParams.get('pn'); const am = urlParams.get('am');
        setSelected({ upiId: pa, name: pn });
        setAmount(am || "");
        setMode("pay");
        onClose();
        scannerRef.current.clear();
      }, () => {});
      return () => scannerRef.current?.clear();
    }, []);
    return <div id="qr-reader" className="w-full"></div>
  }

  const createSplit = async () => {
    if (!totalAmount || splitMembers.length===0) return toast.error("Add amount and members");
    const perPerson = Number(totalAmount) / (splitMembers.length + 1);
    splitMembers.forEach(member => {
      payUPI(member, perPerson.toString(), `Split: ${note}`);
    });
    setMode("menu");
    toast.success(`Split request sent to ${splitMembers.length} people`);
  }

  if (mode === "qr") return <div className="p-4"><button onClick={()=>setMode("menu")} className="mb-2"><X/></button><QRScanner onClose={()=>setMode("menu")}/></div>
  if (mode === "split") return (
    <div className="p-4 space-y-3">
      <button onClick={()=>setMode("menu")} className="mb-2">← Back</button>
      <h2 className="text-2xl font-bold">Split Bill</h2>
      <input value={totalAmount} onChange={e=>setTotalAmount(e.target.value)} placeholder="Total Amount ₹" type="number" className="w-full p-3 border rounded-xl"/>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="For what? Dinner" className="w-full p-3 border rounded-xl"/>
      <p className="font-bold">Select Friends:</p>
      {people.filter((p:any)=>p.uid!==user.uid).map((p:any)=>(
        <label key={p.uid} className="flex items-center gap-2 bg-white p-3 rounded-xl">
          <input type="checkbox" onChange={e=> setSplitMembers(e.target.checked? [...splitMembers, p] : splitMembers.filter((m:any)=>m.uid!==p.uid))}/>
          {p.name}
        </label>
      ))}
      {splitMembers.length>0 && <p>Each person pays: ₹{(Number(totalAmount)/(splitMembers.length+1)).toFixed(2)}</p>}
      <button onClick={createSplit} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">Send Split Requests</button>
    </div>
  )
  if (mode === "pay") return (
    <div className="p-4 space-y-3">
      <button onClick={()=>setMode("menu")} className="mb-2">← Back</button>
      <h3 className="font-bold text-lg">Paying {selected.name}</h3>
      <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="₹ Amount" type="number" className="w-full p-3 border rounded-xl"/>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="What's this for? 🍕" className="w-full p-3 border rounded-xl"/>
      <button onClick={()=>payUPI(selected, amount, note)} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><QrCode/> Pay with UPI</button>
    </div>
  )
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-2xl font-bold">Pay</h2>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={()=>setMode("qr")} className="bg-white p-6 rounded-2xl shadow flex flex-col items-center"><QrCode className="w-10 h-10 mb-2"/><span>Scan QR</span></button>
        <button onClick={()=>setMode("split")} className="bg-white p-6 rounded-2xl shadow flex-col items-center"><Users className="w-10 h-10 mb-2"/><span>Split Bill</span></button>
      </div>
      <p className="font-bold mt-4">Pay Friend</p>
      {people.filter((p:any)=>p.uid!==user.uid).map((p:any)=>(
        <div key={p.uid} onClick={()=>{setSelected(p); setMode("pay")}} className="bg-white p-4 rounded-2xl shadow flex justify-between cursor-pointer">
          <div><p className="font-bold">{p.name}</p><p className="text-sm text-gray-500">{p.upiId}</p></div>
          <button className="bg-green-600 text-white px-4 rounded-xl">Pay</button>
        </div>
      ))}
    </div>
  )
}

// ============ OTHER PAGES ============
function GoalsPage({ user }: { user: UserType }) {
  const [goals, setGoals] = useState<GoalType[]>([]); const [title, setTitle] = useState("");
  useEffect(() => { const q = query(collection(db, "goals"), where("userId", "==", user.uid)); return onSnapshot(q, snap => setGoals(snap.docs.map(d => ({ id: d.id,...d.data() } as GoalType)))); }, [user]);
  const addGoal = async () => { if (!title) return; await addDoc(collection(db, "goals"), { userId: user.uid, title, completed: false, createdAt: serverTimestamp() }); setTitle(""); };
  return <div className="p-4 space-y-3"><h2 className="text-2xl font-bold">Goals</h2><div className="flex gap-2"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Add goal" className="flex-1 p-3 border rounded-xl"/><button onClick={addGoal} className="bg-green-600 text-white px-5 rounded-xl"><Plus/></button></div>{goals.map(g=><div key={g.id} className="bg-white p-4 rounded-2xl shadow">{g.title}</div>)}</div>
}
function DiscoverPage({ user }: { user: UserType }) {
  const [people, setPeople] = useState<any[]>([]);
  useEffect(() => { const q = query(collection(db, "users")); return onSnapshot(q, snap => setPeople(snap.docs.map(d => d.data()))); }, []);
  return <div className="p-4"><h2 className="text-2xl font-bold">Discover</h2>{people.filter((p:any)=>p.uid!==user.uid).map((p:any)=><div key={p.uid} className="bg-white p-4 rounded-2xl shadow mt-3"><p className="font-bold">{p.name}</p><p className="text-sm">@{p.username}</p></div>)}</div>
}
function ChatPage({ user }: { user: UserType }) {
  const [msg, setMsg] = useState(""); const [chats, setChats] = useState<any[]>([]);
  useEffect(() => { const q = query(collection(db, "messages"), orderBy("createdAt")); return onSnapshot(q, snap => setChats(snap.docs.map(d => ({ id: d.id,...d.data() })))); }, []);
  const send = async () => { if (!msg) return; await addDoc(collection(db, "messages"), { text: msg, userId: user.uid, createdAt: serverTimestamp() }); setMsg(""); };
  return <div className="p-4 flex-col h-[80vh]"><h2 className="text-2xl font-bold mb-2">Chat</h2><div className="flex-1 overflow-y-auto space-y-2">{chats.map((c: any) => <div key={c.id} className={`p-2 rounded-lg w-fit ${c.userId === user.uid? "bg-green-600 text-white ml-auto" : "bg-gray-200"}`}>{c.text}</div>)}</div><div className="flex gap-2"><input value={msg} onChange={e=>setMsg(e.target.value)} className="flex-1 p-3 border rounded-xl" /><button onClick={send} className="bg-green-600 text-white p-3 rounded-xl"><Send /></button></div></div>
}
function ProfilePage({ user }: { user: UserType }) {
  return <div className="p-4 space-y-3"><h2 className="text-2xl font-bold">Profile</h2><div className="bg-white p-5 rounded-2xl shadow text-center"><div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-400 rounded-full mx-auto flex items-center justify-center text-4xl">😎</div><p className="font-bold text-xl mt-2">{user.name}</p><p className="text-gray-500">@{user.username}</p><p className="mt-2 text-sm">UPI: {user.upiId}</p></div><button onClick={() => signOut(auth)} className="w-full bg-red-500 text-white py-3 rounded-xl">Logout</button></div>
}
function Card({ title, children }: any) {
  return <div className="bg-white p-4 rounded-2xl shadow space-y-2"><h3 className="font-bold text-lg">{title}</h3>{children}</div>
    }
