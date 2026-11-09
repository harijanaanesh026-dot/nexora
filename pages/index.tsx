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

// REAL FORMULA - PROOF INCLUDED
const realCalc = (att: number, tot: number, req: number) => {
  if (tot === 0) return { cur: 0, need: 0, bunk: 0 };
  const cur = (att / tot) * 100;
  // Real math derivation: (A+x)/(T+x) >= R/100
  // => 100A + 100x >= RT + Rx => x(100-R) >= RT - 100A
  // => x >= (R*T - 100*A)/(100-R)
  if (cur < req) {
    const need = Math.ceil((req * tot - 100 * att) / (100 - req));
    return { cur: Math.round(cur), need: need < 0 ? 0 : need, bunk: 0, safe: false };
  } else {
    const bunk = Math.floor((100 * att - req * tot) / req);
    return { cur: Math.round(cur), need: 0, bunk: bunk < 0 ? 0 : bunk, safe: true };
  }
};

export default function RealCampX() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [screen, setScreen] = useState('login');
  const [toast, setToast] = useState('');
  const [myAtt, setMyAtt] = useState<any[]>([]);
  const [allAtt, setAllAtt] = useState<any[]>([]);
  const [roll, setRoll] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selClass, setSelClass] = useState('CSE-A');
  const [selSub, setSelSub] = useState('DBMS');
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [markMap, setMarkMap] = useState<Record<string, boolean>>({});
  const [calcA, setCalcA] = useState('34');
  const [calcT, setCalcT] = useState('50');
  const [calcR, setCalcR] = useState('75');
  const [calcRes, setCalcRes] = useState<any>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u: any) => {
      if (u) {
        setUser(u);
        const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid)));
        if (snap.empty) setScreen('setup');
        else {
          const d = snap.docs[0].data() as any;
          setUserData({ id: snap.docs[0].id, ...d });
          setRoll(d.rollNumber || '');
          setScreen('home');
        }
      } else setScreen('login');
    });
  }, []);

  // REAL DATA - Student reads only his roll
  useEffect(() => {
    if (!userData?.rollNumber) return;
    return onSnapshot(query(collection(db, 'attendance_records'), where('rollNumber', '==', userData.rollNumber.toUpperCase())), (s) => {
      setMyAtt(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)));
    });
  }, [userData]);

  // REAL DATA - Faculty reads all
  useEffect(() => {
    if (userData?.role !== 'faculty' && userData?.role !== 'admin') return;
    return onSnapshot(collection(db, 'attendance_records'), (s) => {
      setAllAtt(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)));
    });
  }, [userData]);

  useEffect(() => {
    return onSnapshot(collection(db, 'campx_users'), (s) => {
      setStudents(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)).filter((x: any) => x.role === 'student'));
    });
  }, []);

  const handleLogin = async (role: string) => {
    const r = await signInWithPopup(auth, provider);
    const u = r.user;
    const ex = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid)));
    if (ex.empty) {
      await addDoc(collection(db, 'campx_users'), {
        uid: u.uid, email: u.email, name: u.displayName, photoURL: u.photoURL,
        rollNumber: '', dept: 'CSE', section: 'A', role: role, createdAt: serverTimestamp()
      });
    }
    window.location.reload();
  };

  const handleSetup = async () => {
    if (!roll.trim()) { showToast('Enter Roll'); return; }
    const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', user.uid)));
    if (snap.empty) {
      await addDoc(collection(db, 'campx_users'), { uid: user.uid, email: user.email, name: user.displayName, photoURL: user.photoURL, rollNumber: roll.toUpperCase(), dept: 'CSE', section: 'A', role: 'student', createdAt: serverTimestamp() });
    } else {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'campx_users', snap.docs[0].id), { rollNumber: roll.toUpperCase() });
    }
    window.location.reload();
  };

  const handleMarkReal = async () => {
    const list = students.filter((s: any) => `${s.dept}-${s.section}` === selClass);
    if (list.length === 0) { showToast('No students in ' + selClass); return; }
    for (const st of list) {
      const present = markMap[st.rollNumber] !== false;
      // REAL WRITE TO FIRESTORE
      await addDoc(collection(db, 'attendance_records'), {
        rollNumber: st.rollNumber.toUpperCase(),
        studentName: st.name,
        subject: selSub,
        date: selDate,
        isPresent: present,
        class: selClass,
        markedBy: user.uid,
        facultyName: userData.name,
        createdAt: serverTimestamp()
      });
    }
    showToast(`REAL: Marked ${list.length} students in Firestore`);
    setMarkMap({});
  };

  // REAL CALCULATIONS FROM FIRESTORE DATA
  const total = myAtt.length;
  const present = myAtt.filter((a: any) => a.isPresent).length;
  const overall = total ? Math.round((present / total) * 100) : 0;

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[24px] p-8 text-center">
          <h1 className="text-[28px] font-black">CampX - REAL</h1>
          <p className="text-[11px] text-white/40 mt-1">No Fake - Firebase Real Data</p>
          <div className="mt-6 space-y-2">
            <button onClick={() => handleLogin('student')} className="w-full py-4 rounded-full bg-white text-black font-bold">🎓 Student - Real Attendance</button>
            <button onClick={() => handleLogin('faculty')} className="w-full py-4 rounded-full bg-white/10 border border-white/10 font-bold">👨‍🏫 Faculty - Mark Real</button>
          </div>
          <p className="text-[9px] text-white/20 mt-6">All data stored in Firestore - attendance_records</p>
        </div>
      </div>
    );
  }

  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[24px] p-8">
          <h2 className="font-black">Enter Roll - REAL</h2>
          <p className="text-[11px] text-white/40 mt-1">Ee roll ke attendance kanipistundi - Firestore query</p>
          <input value={roll} onChange={(e) => setRoll(e.target.value.toUpperCase())} placeholder="21CS101" className="w-full mt-4 p-4 bg-black border border-white/10 rounded-[12px] uppercase font-bold" />
          <button onClick={handleSetup} className="w-full mt-4 py-4 rounded-full bg-white text-black font-bold">Save Real Roll</button>
        </div>
      </div>
    );
  }

  // FACULTY REAL MARKING SCREEN
  if (userData?.role === 'faculty') {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-[600px] mx-auto">
          <div className="flex justify-between items-center h-14"><p className="font-black">Faculty - REAL MARKING</p><button onClick={async () => { await signOut(auth); window.location.reload(); }} className="px-3 py-1 bg-white/10 rounded-full text-[11px]">Logout</button></div>
          <div className="bg-[#111] border border-white/10 rounded-[16px] p-4 mt-4">
            <p className="text-[12px] font-bold">Mark Attendance - Writes to Firestore (REAL)</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <select value={selClass} onChange={(e) => setSelClass(e.target.value)} className="p-3 bg-black border border-white/10 rounded-[12px] text-[12px]"><option>CSE-A</option><option>CSE-B</option><option>ECE-A</option></select>
              <select value={selSub} onChange={(e) => setSelSub(e.target.value)} className="p-3 bg-black border border-white/10 rounded-[12px] text-[12px]"><option>DBMS</option><option>OS</option><option>CN</option><option>SE</option><option>DAA</option></select>
            </div>
            <input type="date" value={selDate} onChange={(e) => setSelDate(e.target.value)} className="w-full mt-2 p-3 bg-black border border-white/10 rounded-[12px] text-[12px]" />
          </div>

          <div className="bg-[#111] border border-white/10 rounded-[16px] p-4 mt-4">
            <p className="font-bold text-[13px]">Students in {selClass} - REAL from DB: {students.filter((s: any) => `${s.dept}-${s.section}` === selClass).length}</p>
            <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
              {students.filter((s: any) => `${s.dept}-${s.section}` === selClass).map((st: any) => (
                <div key={st.id} className="flex justify-between items-center bg-white/5 rounded-[12px] p-3">
                  <div><p className="font-bold text-[12px]">{st.name}</p><p className="text-[10px] text-white/40">{st.rollNumber}</p></div>
                  <button onClick={() => setMarkMap({ ...markMap, [st.rollNumber]: markMap[st.rollNumber] === false ? true : false })} className={`px-4 py-2 rounded-full text-[11px] font-bold border ${markMap[st.rollNumber] === false ? 'bg-red-500/20 text-red-400 border-red-500/20' : 'bg-green-500/20 text-green-400 border-green-500/20'}`}>{markMap[st.rollNumber] === false ? 'Absent' : 'Present'}</button>
                </div>
              ))}
            </div>
            <button onClick={handleMarkReal} className="w-full mt-4 py-3 rounded-full bg-white text-black font-bold">Save REAL to Firestore</button>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-[16px] p-4 mt-4">
            <p className="font-bold text-[12px]">Recent REAL Records in Firestore: {allAtt.length}</p>
            <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">{allAtt.slice(0, 10).map((a: any) => <div key={a.id} className="text-[11px] bg-white/5 rounded-[8px] p-2 flex justify-between"><span>{a.rollNumber} {a.subject} {a.date}</span><span className={a.isPresent ? 'text-green-400' : 'text-red-400'}>{a.isPresent ? 'P' : 'A'}</span></div>)}</div>
          </div>
        </div>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
      </div>
    );
  }

  // STUDENT REAL VIEW
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[600px] mx-auto p-4 pb-20">
        <div className="flex justify-between items-center h-14"><div className="flex gap-2 items-center"><div className="w-8 h-8 bg-white text-black rounded-[10px] flex items-center justify-center font-black">C</div><p className="font-bold">CampX REAL</p><span className="text-[10px] bg-white/10 px-2 py-1 rounded-full">{overall}% • {total} classes</span></div><button onClick={async () => { await signOut(auth); window.location.reload(); }} className="w-8 h-8 bg-white/10 rounded-full">👤</button></div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[20px] p-5 mt-4">
          <p className="text-[11px] font-bold text-white/40">REAL OVERALL FROM FIRESTORE</p>
          <p className={`text-[48px] font-black ${overall >= 75 ? 'text-green-400' : 'text-red-400'}`}>{overall}%</p>
          <p className="text-[12px] text-white/60">Roll: {userData?.rollNumber} • {present}/{total} Present • Data from attendance_records collection</p>
          <div className="w-full h-2 bg-white/10 rounded-full mt-3"><div className={`h-full ${overall >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${overall}%` }}></div></div>
        </div>

        <div className="mt-4 space-y-2">
          {['DBMS', 'OS', 'CN', 'SE', 'DAA'].map((sub) => {
            const subAtt = myAtt.filter((a: any) => a.subject === sub);
            const p = subAtt.filter((a: any) => a.isPresent).length;
            const t = subAtt.length;
            const r = realCalc(p, t, 75);
            return <div key={sub} className="bg-[#111] border border-white/10 rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{sub}</p><p className="text-[10px] text-white/40">{p}/{t} • {t ? (r.safe ? `Can bunk ${r.bunk}` : `Need ${r.need} more`) : 'No real data'}</p></div><span className={`px-3 py-1 rounded-full text-[12px] font-bold border ${t === 0 ? 'bg-white/5 text-white/20' : r.cur >= 75 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{t ? `${r.cur}%` : '--'}</span></div>;
          })}
        </div>

        <div className="mt-4 bg-[#111] border border-white/10 rounded-[16px] p-4">
          <p className="font-bold text-[13px]">🔥 REAL Calculator - Example: 68% → 75%</p>
          <p className="text-[11px] text-white/40 mt-1">Current 34/50 = 68% → Need {realCalc(34, 50, 75).need} classes (Real formula)</p>
          <div className="mt-3 flex gap-2"><input value={calcA} onChange={(e) => setCalcA(e.target.value)} type="number" placeholder="Attended" className="flex-1 p-3 bg-black border border-white/10 rounded-[12px] text-[12px]" /><input value={calcT} onChange={(e) => setCalcT(e.target.value)} type="number" placeholder="Total" className="flex-1 p-3 bg-black border border-white/10 rounded-[12px] text-[12px]" /></div>
          <button onClick={() => setCalcRes(realCalc(parseInt(calcA), parseInt(calcT), parseInt(calcR)))} className="w-full mt-2 py-3 rounded-full bg-white text-black font-bold text-[12px]">Calculate REAL Need</button>
          {calcRes && <div className="mt-3 p-3 bg-white/5 rounded-[12px]"><p className="text-[12px] font-bold">{calcRes.safe ? `Can bunk ${calcRes.bunk}` : `Need ${calcRes.need} more classes`}</p><p className="text-[10px] text-white/40 mt-1">Formula: x = (R×T - 100×A)/(100-R) = ({calcR}×{calcT} - 100×{calcA})/(100-{calcR}) = {calcRes.need || calcRes.bunk}</p></div>}
        </div>

        <div className="mt-4 bg-[#111] border border-white/10 rounded-[16px] p-4">
          <p className="font-bold text-[13px]">History - REAL from Firestore • {myAtt.length}</p>
          <div className="mt-2 space-y-1 max-h-[300px] overflow-y-auto">{myAtt.map((a: any) => <div key={a.id} className="flex justify-between text-[11px] bg-white/5 rounded-[8px] p-2"><span>{a.date} • {a.subject} • {a.class}</span><span className={a.isPresent ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{a.isPresent ? 'Present' : 'Absent'}</span></div>)}{myAtt.length === 0 && <p className="text-[11px] text-white/20 text-center py-8">No REAL data yet<br/>Ask faculty to mark attendance for {userData?.rollNumber}<br/>Collection: attendance_records where rollNumber == {userData?.rollNumber}</p>}</div>
        </div>

        <div className="w-full py-6 flex justify-center border-t border-white/10 mt-6"><p className="text-[10px] text-white/30">© 2026 CampX • REAL DATA • {userData?.rollNumber}</p></div>
      </div>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
    </div>
  );
        }
