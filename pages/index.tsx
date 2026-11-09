import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// REAL 75% RULE CALCULATOR - Original CampX Logic
const calc75Rule = (att: number, tot: number) => {
  if (tot === 0) return { cur: 0, canMiss: 0, need: 0, text: "No data", safe: false };
  const cur = (att / tot) * 100;
  if (cur >= 75) {
    const canMiss = Math.floor((100 * att - 75 * tot) / 75);
    return { cur: Math.round(cur), canMiss, need: 0, text: `You can miss ${canMiss} classes`, safe: true };
  } else {
    const need = Math.ceil((75 * tot - 100 * att) / 25);
    return { cur: Math.round(cur), canMiss: 0, need, text: `Attend ${need} more to reach 75%`, safe: false };
  }
};

export default function CampXClone() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [tab, setTab] = useState('today');
  const [toast, setToast] = useState('');
  const [myAtt, setMyAtt] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [roll, setRoll] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u: any) => {
      if (u) {
        setUser(u);
        const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid)));
        if (snap.empty) setTab('setup');
        else { const d = snap.docs[0].data() as any; setUserData({ id: snap.docs[0].id, ...d }); setRoll(d.rollNumber || ''); setTab('today'); }
      } else setTab('login');
    });
  }, []);

  useEffect(() => {
    if (!userData?.rollNumber) return;
    return onSnapshot(query(collection(db, 'attendance_records'), where('rollNumber', '==', userData.rollNumber.toUpperCase())), (s) => {
      setMyAtt(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)));
    });
  }, [userData]);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'campx_timetable'), (s) => setTimetable(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    const u2 = onSnapshot(collection(db, 'campx_notices'), (s) => setNotices(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    const u3 = onSnapshot(collection(db, 'campx_assignments'), (s) => setAssignments(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    const u4 = onSnapshot(collection(db, 'campx_results'), (s) => setResults(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    const u5 = onSnapshot(collection(db, 'campx_fees'), (s) => setFees(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, []);

  const handleLogin = async () => {
    const r = await signInWithPopup(auth, provider);
    const u = r.user;
    const ex = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid)));
    if (ex.empty) {
      await addDoc(collection(db, 'campx_users'), { uid: u.uid, email: u.email, name: u.displayName, photoURL: u.photoURL, rollNumber: '', dept: 'CSE', section: 'A', role: 'student', sgpa: 8.2, cgpa: 8.0, createdAt: serverTimestamp() });
    }
    window.location.reload();
  };

  const handleSetup = async () => {
    if (!roll.trim()) { showToast('Enter Roll'); return; }
    const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', user.uid)));
    if (snap.empty) {
      await addDoc(collection(db, 'campx_users'), { uid: user.uid, email: user.email, name: user.displayName, photoURL: user.photoURL, rollNumber: roll.toUpperCase(), dept: 'CSE', section: 'A', role: 'student', sgpa: 8.2, cgpa: 8.0, createdAt: serverTimestamp() });
    } else {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'campx_users', snap.docs[0].id), { rollNumber: roll.toUpperCase() });
    }
    window.location.reload();
  };

  const total = myAtt.length;
  const present = myAtt.filter((a: any) => a.isPresent).length;
  const overall = total ? Math.round((present / total) * 100) : 0;
  const overallCalc = calc75Rule(present, total);
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayTT = timetable.filter((t: any) => t.day === todayName);
  const nextClass = todayTT[0];

  if (tab === 'login') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-black flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-[24px] p-8 shadow-xl text-center border">
          <div className="w-12 h-12 bg-black text-white rounded-[12px] flex items-center justify-center font-black mx-auto">C</div>
          <h1 className="text-[24px] font-black mt-4">CampX</h1>
          <p className="text-[12px] text-black/50 mt-1">Your college in your pocket</p>
          <p className="text-[11px] text-black/40 mt-4 text-left">✓ Timetable, attendance, exams, results and fees from your college, in one app.</p>
          <button onClick={handleLogin} className="w-full mt-8 py-4 rounded-full bg-black text-white font-bold">Sign in with College Account</button>
          <p className="text-[9px] text-black/30 mt-4">310k+ installs • Original by CampX EduTech</p>
        </div>
      </div>
    );
  }

  if (tab === 'setup') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-black flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-[24px] p-8 border shadow-xl">
          <h2 className="font-black text-[18px]">Enter Roll Number</h2>
          <p className="text-[11px] text-black/50 mt-1">Your college gave you account - Enter roll</p>
          <input value={roll} onChange={(e) => setRoll(e.target.value.toUpperCase())} placeholder="21CS101" className="w-full mt-5 p-4 bg-[#F8F9FA] border rounded-[12px] uppercase font-bold" />
          <button onClick={handleSetup} className="w-full mt-4 py-4 rounded-full bg-black text-white font-bold">Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-black">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-2 rounded-full text-xs font-bold z-50">{toast}</div>}

      <div className="sticky top-0 bg-white border-b z-20">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex justify-between items-center">
          <div className="flex gap-2 items-center"><div className="w-8 h-8 bg-black text-white rounded-[10px] flex items-center justify-center font-black text-[12px]">C</div><p className="font-bold">CampX</p><span className="text-[10px] bg-black text-white px-2 py-1 rounded-full">{overall}%</span></div>
          <div className="flex gap-2 items-center"><img src={userData?.photoURL} className="w-8 h-8 rounded-full" alt="" /><button onClick={async () => { await signOut(auth); window.location.reload(); }} className="text-[10px] bg-[#F8F9FA] px-3 py-1 rounded-full border">Logout</button></div>
        </div>
        <div className="max-w-[600px] mx-auto px-2 pb-2 flex gap-1.5 overflow-x-auto">
          {[
            { id: 'today', label: 'TODAY' },
            { id: 'timetable', label: 'Timetable' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'results', label: 'Results' },
            { id: 'assignments', label: 'Assignments' },
            { id: 'fees', label: 'Fees' },
          ].map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap border ${tab === t.id ? 'bg-black text-white border-black' : 'bg-[#F8F9FA] border-black/10 text-black/40'}`}>{t.label}</button>)}
        </div>
      </div>

      <div className="max-w-[600px] mx-auto p-3 pb-24 space-y-3">
        {tab === 'today' && (
          <>
            <div className="bg-white border rounded-[20px] p-5 shadow-sm">
              <p className="text-[11px] font-bold text-black/40 tracking-widest">TODAY, AT A GLANCE</p>
              {nextClass ? <div className="mt-3"><p className="font-black text-[16px]">{nextClass.subject} • {nextClass.time}</p><p className="text-[12px] text-black/50 mt-1">Room: {nextClass.room} • Faculty: {nextClass.faculty}</p></div> : <p className="text-[13px] font-bold mt-3">No classes today 🎉</p>}
              <div className="mt-4 bg-[#F8F9FA] border rounded-[14px] p-4 flex justify-between">
                <div><p className="text-[11px] text-black/40">Attendance vs 75% rule</p><p className={`text-[18px] font-black mt-1 ${overallCalc.safe ? 'text-green-600' : 'text-red-600'}`}>{overallCalc.cur}% • {overallCalc.text}</p><p className="text-[10px] text-black/40 mt-1">{present}/{total} classes • Roll: {userData?.rollNumber}</p></div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white ${overallCalc.safe ? 'bg-green-600' : 'bg-red-600'}`}>{overall}%</div>
              </div>
              {notices.slice(0, 2).map((n: any) => <div key={n.id} className="mt-3 bg-yellow-50 border border-yellow-200 rounded-[12px] p-3"><p className="text-[12px] font-bold">{n.title}</p><p className="text-[11px] text-black/60 mt-1">{n.desc}</p></div>)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border rounded-[16px] p-4"><p className="text-[11px] text-black/40">What's Due</p><p className="font-bold text-[13px] mt-1">{assignments.length} Assignments</p></div>
              <div className="bg-white border rounded-[16px] p-4"><p className="text-[11px] text-black/40">Fees Due</p><p className="font-bold text-[13px] mt-1">{fees.length ? `₹${fees[0]?.amount}` : 'No dues'}</p></div>
            </div>
          </>
        )}

        {tab === 'timetable' && (
          <div className="space-y-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className={`bg-white border rounded-[16px] p-4 ${day === todayName ? 'border-black border-2' : ''}`}><p className="font-bold text-[13px]">{day} {day === todayName && '• Today'}</p><div className="mt-2 space-y-1">{timetable.filter((t: any) => t.day === day).map((t: any) => <div key={t.id} className="flex justify-between text-[12px] bg-[#F8F9FA] rounded-[10px] p-2.5"><span className="font-bold">{t.time} {t.subject}</span><span className="text-black/50">{t.room} • {t.faculty}</span></div>)}{timetable.filter((t: any) => t.day === day).length === 0 && <p className="text-[11px] text-black/20">No classes</p>}</div></div>
            ))}
          </div>
        )}

        {tab === 'attendance' && (
          <div className="space-y-3">
            <div className="bg-white border rounded-[20px] p-5"><p className="text-[11px] font-bold text-black/40">ATTENDANCE BY SUBJECT</p><p className="text-[11px] text-black/30 mt-1">Every class marked - Real from Firestore</p>
              <div className="mt-4 space-y-3">
                {['DBMS', 'OS', 'CN', 'SE', 'DAA'].map((sub) => {
                  const subAtt = myAtt.filter((a: any) => a.subject === sub);
                  const p = subAtt.filter((a: any) => a.isPresent).length;
                  const t = subAtt.length;
                  const calc = calc75Rule(p, t);
                  return <div key={sub} className="flex justify-between items-center bg-[#F8F9FA] border rounded-[14px] p-3"><div><p className="font-bold text-[13px]">{sub}</p><p className="text-[11px] text-black/50">{p}/{t} • {calc.text}</p><div className="w-24 h-1.5 bg-black/10 rounded-full mt-2"><div className={`h-full ${calc.cur >= 75 ? 'bg-green-600' : 'bg-red-600'}`} style={{ width: `${calc.cur}%` }}></div></div></div><span className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black text-white ${calc.cur >= 75 ? 'bg-green-600' : calc.cur === 0 ? 'bg-black/10 text-black/20' : 'bg-red-600'}`}>{t ? `${calc.cur}%` : '-'}</span></div>;
                })}
              </div>
            </div>
            <div className="bg-black text-white rounded-[16px] p-4"><p className="font-bold text-[12px]">How 75% Rule Works - REAL</p><p className="text-[11px] text-white/60 mt-2">If you have 68% (34/50), need: (75×50 - 100×34)/25 = 14 classes. Original CampX same formula.</p></div>
          </div>
        )}

        {tab === 'results' && (
          <div className="space-y-3">
            <div className="bg-white border rounded-[20px] p-5 text-center"><p className="text-[11px] font-bold text-black/40">RESULTS</p><p className="text-[40px] font-black mt-2">{userData?.cgpa || 8.0}</p><p className="text-[12px] text-black/50">CGPA • SGPA: {userData?.sgpa || 8.2}</p><div className="grid grid-cols-2 gap-2 mt-4">{results.map((r: any) => <div key={r.id} className="bg-[#F8F9FA] border rounded-[12px] p-3"><p className="font-bold text-[12px]">{r.subject}</p><p className="text-[11px] text-black/50">{r.grade} • {r.marks}</p></div>)}{results.length === 0 && <p className="col-span-2 text-[11px] text-black/20 py-6">No results yet - Faculty will upload</p>}</div></div>
          </div>
        )}

        {tab === 'assignments' && (
          <div className="space-y-2">{assignments.map((a: any) => <div key={a.id} className="bg-white border rounded-[16px] p-4"><p className="font-bold text-[13px]">{a.title}</p><p className="text-[11px] text-black/50 mt-1">{a.subject} • Due: {a.dueDate}</p><p className="text-[11px] text-black/70 mt-2">{a.desc}</p></div>)}{assignments.length === 0 && <p className="text-center py-16 text-black/20">No assignments</p>}</div>
        )}

        {tab === 'fees' && (
          <div className="space-y-2">{fees.map((f: any) => <div key={f.id} className="bg-white border rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{f.type}</p><p className="text-[11px] text-black/50">{f.dueDate}</p></div><p className="font-black text-[14px]">₹{f.amount}</p></div>)}{fees.length === 0 && <p className="text-center py-16 text-black/20">No dues</p>}</div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t"><div className="max-w-[600px] mx-auto flex justify-around h-[64px] items-center"><button onClick={() => setTab('today')} className={`flex flex-col items-center ${tab === 'today' ? 'opacity-100' : 'opacity-40'}`}><span>🏠</span><span className="text-[9px] font-bold">TODAY</span></button><button onClick={() => setTab('timetable')} className={`flex flex-col items-center ${tab === 'timetable' ? 'opacity-100' : 'opacity-40'}`}><span>📅</span><span className="text-[9px]">WEEK</span></button><button onClick={() => setTab('attendance')} className="w-12 h-12 bg-black text-white rounded-full font-black">%</button><button onClick={() => setTab('results')} className={`flex flex-col items-center ${tab === 'results' ? 'opacity-100' : 'opacity-40'}`}><span>📊</span><span className="text-[9px]">RESULTS</span></button><button onClick={() => setTab('assignments')} className={`flex flex-col items-center ${tab === 'assignments' ? 'opacity-100' : 'opacity-40'}`}><span>📝</span><span className="text-[9px]">WORK</span></button></div></div>
    </div>
  );
                                                                                                                                                                                                                                                                                                                                                    }
