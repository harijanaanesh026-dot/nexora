import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, getDocs } from 'firebase/firestore';

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

const Footer = () => {
  return (
    <div className="w-full py-6 flex justify-center border-t border-white/10 mt-8">
      <p className="text-[10px] tracking-widest text-white/30">© 2026 CampX • ANESH</p>
    </div>
  );
};

const calcNeed = (att: number, tot: number, req: number) => {
  if (tot === 0) return { cur: 0, need: 0, bunk: 0, safe: false };
  const cur = (att / tot) * 100;
  if (cur < req) {
    const need = Math.ceil((req * tot - 100 * att) / (100 - req));
    return { cur: Math.round(cur), need: need < 0 ? 0 : need, bunk: 0, safe: false };
  } else {
    const bunk = Math.floor((100 * att - req * tot) / req);
    return { cur: Math.round(cur), need: 0, bunk: bunk < 0 ? 0 : bunk, safe: true };
  }
};

export default function CampX() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [screen, setScreen] = useState('login');
  const [toast, setToast] = useState('');
  const [myAtt, setMyAtt] = useState<any[]>([]);
  const [roll, setRoll] = useState('');
  const [calcA, setCalcA] = useState('');
  const [calcT, setCalcT] = useState('');
  const [calcR, setCalcR] = useState('75');
  const [calcResult, setCalcResult] = useState<any>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u: any) => {
      if (u) {
        setUser(u);
        const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid)));
        if (snap.empty) {
          setScreen('setup');
        } else {
          const d = snap.docs[0].data() as any;
          setUserData({ id: snap.docs[0].id, ...d });
          setRoll(d.rollNumber || '');
          setScreen('home');
        }
      } else {
        setScreen('login');
      }
    });
  }, []);

  useEffect(() => {
    if (!userData || !userData.rollNumber) return;
    const q = query(collection(db, 'attendance_records'), where('rollNumber', '==', userData.rollNumber.toUpperCase()));
    return onSnapshot(q, (s) => {
      const data = s.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      setMyAtt(data);
    });
  }, [userData]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      showToast(e.message);
    }
  };

  const handleSetup = async () => {
    if (!roll.trim()) {
      showToast('Enter Roll Number');
      return;
    }
    try {
      const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', user.uid)));
      if (snap.empty) {
        await addDoc(collection(db, 'campx_users'), {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          rollNumber: roll.toUpperCase(),
          dept: 'CSE',
          section: 'A',
          role: 'student',
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'campx_users', snap.docs[0].id), {
          rollNumber: roll.toUpperCase()
        });
      }
      showToast('Roll Saved');
      window.location.reload();
    } catch (e: any) {
      showToast(e.message);
    }
  };

  const handleCalc = () => {
    const a = parseInt(calcA);
    const t = parseInt(calcT);
    const r = parseInt(calcR) || 75;
    if (isNaN(a) || isNaN(t) || t === 0) {
      showToast('Enter valid numbers');
      return;
    }
    if (a > t) {
      showToast('Attended > Total');
      return;
    }
    setCalcResult(calcNeed(a, t, r));
  };

  const totalClasses = myAtt.length;
  const presentClasses = myAtt.filter((a: any) => a.isPresent).length;
  const overall = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  const subjects = ['DBMS', 'OS', 'CN', 'SE', 'DAA'];
  const subjectData = subjects.map((sub) => {
    const subAtt = myAtt.filter((a: any) => a.subject === sub);
    const p = subAtt.filter((a: any) => a.isPresent).length;
    const tt = subAtt.length;
    const res = calcNeed(p, tt, 75);
    return { name: sub, present: p, total: tt, result: res };
  });

  const lowSubs = subjectData.filter((s) => s.total > 0 && s.result.cur < 75);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAtt = myAtt.filter((a: any) => a.date === todayStr);

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[24px] p-8 text-center">
          <h1 className="text-[32px] font-black">CampX</h1>
          <p className="text-[12px] text-white/40 mt-1">Student Attendance</p>
          <p className="text-[10px] text-white/20 mt-2">Roll number tho attendance chudu</p>
          <button onClick={handleLogin} className="w-full mt-8 py-4 rounded-full bg-white text-black font-bold">Login with Google</button>
          <Footer />
        </div>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
      </div>
    );
  }

  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[24px] p-8">
          <h2 className="font-black text-[18px]">Enter Roll Number</h2>
          <p className="text-[11px] text-white/40 mt-1">Idhe roll tho attendance kanipistundi</p>
          <input value={roll} onChange={(e) => setRoll(e.target.value.toUpperCase())} placeholder="21CS101" className="w-full mt-5 p-4 bg-black border border-white/10 rounded-[12px] uppercase font-bold" />
          <button onClick={handleSetup} className="w-full mt-4 py-4 rounded-full bg-white text-black font-bold">Save & Continue</button>
          <Footer />
        </div>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`body{background:#000} ::-webkit-scrollbar{display:none}`}</style>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-50">{toast}</div>}

      <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 z-20">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex justify-between items-center">
          <div className="flex gap-2 items-center"><div className="w-8 h-8 bg-white text-black rounded-[10px] flex items-center justify-center font-black">C</div><p className="font-bold text-[14px]">CampX</p><span className="text-[10px] bg-white/10 px-2 py-1 rounded-full">{overall}%</span></div>
          <button onClick={() => setScreen('profile')} className="w-8 h-8 bg-white/10 rounded-full overflow-hidden">{userData?.photoURL ? <img src={userData.photoURL} className="w-full h-full" alt="" /> : '👤'}</button>
        </div>
        <div className="max-w-[600px] mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
          <button onClick={() => setScreen('home')} className={`px-4 py-2 rounded-full text-[11px] font-bold border whitespace-nowrap ${screen === 'home' ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-white/40'}`}>HOME</button>
          <button onClick={() => setScreen('attendance')} className={`px-4 py-2 rounded-full text-[11px] font-bold border whitespace-nowrap ${screen === 'attendance' ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-white/40'}`}>SUBJECT-WISE</button>
          <button onClick={() => setScreen('calculator')} className={`px-4 py-2 rounded-full text-[11px] font-bold border whitespace-nowrap ${screen === 'calculator' ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-white/40'}`}>CALCULATOR</button>
          <button onClick={() => setScreen('history')} className={`px-4 py-2 rounded-full text-[11px] font-bold border whitespace-nowrap ${screen === 'history' ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-white/40'}`}>HISTORY</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto p-4 pb-24 space-y-3">
        {screen === 'home' && (
          <>
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[20px] p-5">
              <p className="text-[11px] font-bold text-white/40 tracking-widest">OVERALL ATTENDANCE</p>
              <p className={`text-[48px] font-black leading-none mt-2 ${overall >= 75 ? 'text-green-400' : overall >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{overall}%</p>
              <p className="text-[12px] text-white/60 mt-1">{presentClasses}/{totalClasses} classes • Roll: {userData?.rollNumber}</p>
              <div className="w-full h-2 bg-white/10 rounded-full mt-4 overflow-hidden"><div className={`h-full ${overall >= 75 ? 'bg-green-500' : overall >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${overall}%` }}></div></div>
              <p className="text-[11px] mt-3 font-bold">{overall >= 75 ? 'Safe ✅' : `Need ${calcNeed(presentClasses, totalClasses, 75).need} more classes`}</p>
            </div>

            {lowSubs.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-[16px] p-4">
                <p className="font-bold text-[13px] text-red-400">⚠️ Low Attendance Alert</p>
                <div className="mt-3 space-y-2">
                  {lowSubs.map((s) => <div key={s.name} className="flex justify-between bg-black/30 rounded-[12px] p-3"><div><p className="text-[12px] font-bold">{s.name}</p><p className="text-[10px] text-white/40">Need {s.result.need} more</p></div><span className="text-[12px] font-bold text-red-400">{s.result.cur}%</span></div>)}
                </div>
              </div>
            )}

            <div className="bg-[#111] border border-white/10 rounded-[16px] p-4">
              <p className="font-bold text-[13px]">Today • {todayStr}</p>
              <div className="mt-3 space-y-2">
                {todayAtt.length === 0 ? <p className="text-[11px] text-white/30 text-center py-6">No attendance marked today</p> : todayAtt.map((a: any) => <div key={a.id} className="flex justify-between bg-white/5 rounded-[12px] p-3"><div><p className="text-[12px] font-bold">{a.subject}</p><p className="text-[10px] text-white/40">{a.date} • {a.class || ''}</p></div><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${a.isPresent ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{a.isPresent ? 'Present' : 'Absent'}</span></div>)}
              </div>
            </div>
          </>
        )}

        {screen === 'attendance' && (
          <div className="space-y-3">
            {subjectData.map((s) => (
              <div key={s.name} className="bg-[#111] border border-white/10 rounded-[16px] p-4">
                <div className="flex justify-between"><div><p className="font-bold text-[13px]">{s.name}</p><p className="text-[10px] text-white/40 mt-1">{s.present}/{s.total} classes</p><p className="text-[10px] mt-1 font-bold text-yellow-400">{s.total > 0 ? s.result.need > 0 ? `Need ${s.result.need} more` : `Can bunk ${s.result.bunk}` : 'No data'}</p></div><span className={`px-3 py-1.5 rounded-full border text-[12px] font-bold h-fit ${s.total === 0 ? 'bg-white/5 text-white/20 border-white/10' : s.result.cur >= 75 ? 'bg-green-500/10 text-green-400 border-green-500/20' : s.result.cur >= 65 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{s.total ? `${s.result.cur}%` : '--'}</span></div>
                {s.total > 0 && <div className="w-full h-2 bg-white/10 rounded-full mt-3 overflow-hidden"><div className={`h-full ${s.result.cur >= 75 ? 'bg-green-500' : s.result.cur >= 65 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${s.result.cur}%` }}></div></div>}
              </div>
            ))}
          </div>
        )}

        {screen === 'calculator' && (
          <div className="space-y-3">
            <div className="bg-[#111] border border-white/10 rounded-[20px] p-5">
              <p className="text-[11px] font-bold text-white/40">🔥 REAL CALCULATOR</p>
              <p className="text-[10px] text-white/30 mt-1">Formula: x = (R×T - 100×A)/(100-R)</p>
              <div className="mt-5 space-y-3">
                <input value={calcA} onChange={(e) => setCalcA(e.target.value)} type="number" placeholder="Attended e.g. 34" className="w-full p-3.5 bg-black border border-white/10 rounded-[12px]" />
                <input value={calcT} onChange={(e) => setCalcT(e.target.value)} type="number" placeholder="Total e.g. 50" className="w-full p-3.5 bg-black border border-white/10 rounded-[12px]" />
                <input value={calcR} onChange={(e) => setCalcR(e.target.value)} type="number" placeholder="Required 75" className="w-full p-3.5 bg-black border border-white/10 rounded-[12px]" />
                <button onClick={handleCalc} className="w-full py-4 rounded-full bg-white text-black font-bold">Calculate</button>
              </div>
              {calcResult && (
                <div className="mt-5">
                  <div className="bg-white/5 rounded-[14px] p-4"><p className="text-[11px] text-white/40">CURRENT</p><p className={`text-[32px] font-black ${calcResult.safe ? 'text-green-400' : 'text-red-400'}`}>{calcResult.cur}%</p></div>
                  {!calcResult.safe ? <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-[14px] p-4"><p className="text-red-400 font-bold text-[13px]">Need to attend: {calcResult.need} classes</p><p className="text-[11px] text-white/60 mt-1">Example: 68% (34/50) → Need {calcNeed(34, 50, 75).need} more for 75%</p></div> : <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-[14px] p-4"><p className="text-green-400 font-bold">You can bunk {calcResult.bunk} classes ✅</p></div>}
                </div>
              )}
            </div>
          </div>
        )}

        {screen === 'history' && (
          <div className="bg-[#111] border border-white/10 rounded-[16px] p-4">
            <p className="font-bold text-[13px]">Attendance History • {myAtt.length}</p>
            <div className="mt-3 max-h-[500px] overflow-y-auto space-y-2">
              {myAtt.map((a: any) => <div key={a.id} className="flex justify-between bg-white/5 rounded-[10px] p-3 text-[11px]"><span>{a.date} • {a.subject} • {a.class || ''}</span><span className={a.isPresent ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{a.isPresent ? 'P' : 'A'}</span></div>)}
              {myAtt.length === 0 && <p className="text-[11px] text-white/20 text-center py-16">No records yet<br/>Roll: {userData?.rollNumber}<br/>Ask faculty to mark attendance</p>}
            </div>
          </div>
        )}

        {screen === 'profile' && (
          <div className="bg-[#111] border border-white/10 rounded-[20px] p-5">
            <div className="flex gap-4"><img src={userData?.photoURL} className="w-14 h-14 rounded-full" alt="" /><div><p className="font-bold">{userData?.name}</p><p className="text-[12px] text-white/40">{userData?.rollNumber} • CSE</p><p className="text-[10px] text-white/20">{userData?.email}</p></div></div>
            <div className="grid grid-cols-3 gap-2 mt-5"><div className="bg-black border border-white/10 rounded-[12px] p-3 text-center"><p className="font-black text-[16px]">{overall}%</p><p className="text-[9px] text-white/30">OVERALL</p></div><div className="bg-black border border-white/10 rounded-[12px] p-3 text-center"><p className="font-black text-[16px]">{myAtt.length}</p><p className="text-[9px] text-white/30">CLASSES</p></div><div className="bg-black border border-white/10 rounded-[12px] p-3 text-center"><p className="font-black text-[16px]">{presentClasses}</p><p className="text-[9px] text-white/30">PRESENT</p></div></div>
            <button onClick={async () => { await signOut(auth); window.location.reload(); }} className="w-full mt-6 py-3 rounded-full bg-red-600 text-white font-bold text-[12px]">Logout</button>
            <button onClick={() => setScreen('home')} className="w-full mt-2 py-3 rounded-full bg-white/10 text-[12px]">Back</button>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
