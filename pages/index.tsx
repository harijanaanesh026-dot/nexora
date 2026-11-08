import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, getDocs, deleteDoc } from 'firebase/firestore';

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

const formatDate = (ts: any) => {
  if (!ts) return "now";
  try {
    const ms = ts.toMillis ? ts.toMillis() : (ts.seconds ? ts.seconds * 1000 : Date.now());
    return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return "now"; }
};

const calcNeed = (att: number, tot: number, req = 75) => {
  if (tot === 0) return { cur: 0, need: 0, bunk: 0, status: "No data", safe: false };
  const cur = (att / tot) * 100;
  if (cur < req) {
    const need = Math.ceil((req * tot - 100 * att) / (100 - req));
    return { cur: Math.round(cur * 10) / 10, need: need < 0 ? 0 : need, bunk: 0, status: `Need ${need} more`, safe: false };
  } else {
    const bunk = Math.floor((100 * att - req * tot) / req);
    return { cur: Math.round(cur * 10) / 10, need: 0, bunk: bunk < 0 ? 0 : bunk, status: `Can bunk ${bunk}`, safe: true };
  }
};

const Footer = () => {
  return <div className="w-full py-6 flex justify-center border-t border-white/10 mt-6"><p className="text-[10px] tracking-widest text-white/30">© 2026 CampX • ANESH</p></div>;
};

export default function CampX() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [screen, setScreen] = useState('login');
  const [toast, setToast] = useState('');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [myAttendance, setMyAttendance] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('DBMS');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markList, setMarkList] = useState<Record<string, boolean>>({});
  const [calcAttended, setCalcAttended] = useState('');
  const [calcTotal, setCalcTotal] = useState('');
  const [calcRequired, setCalcRequired] = useState('75');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [newRoll, setNewRoll] = useState('');
  const [newName, setNewName] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  useEffect(() => { getRedirectResult(auth).catch(() => {}); }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u: any) => {
      if (u) {
        setUser(u);
        const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid)));
        if (snap.empty) { setScreen('login'); }
        else {
          const d = snap.docs[0].data();
          setUserData({ id: snap.docs[0].id, ...d });
          setRole(d.role);
          setScreen('home');
        }
      } else { setScreen('login'); }
    });
  }, []);

  useEffect(() => {
    if (!userData || role !== 'student') return;
    return onSnapshot(query(collection(db, 'attendance_records'), where('rollNumber', '==', (userData.rollNumber || '').toUpperCase())), (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setMyAttendance(data);
      const todayStr = new Date().toISOString().split('T')[0];
      setTodayAttendance(data.filter((a: any) => a.date === todayStr));
    });
  }, [userData, role]);

  useEffect(() => {
    if (role !== 'faculty' && role !== 'admin') return;
    return onSnapshot(collection(db, 'attendance_records'), (s) => {
      setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });
  }, [role]);

  useEffect(() => {
    return onSnapshot(collection(db, 'campx_users'), (s) => {
      const all = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setStudents(all.filter((u: any) => u.role === 'student'));
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'leave_requests'), where('uid', '==', user.uid)), (s) => {
      setLeaveRequests(s.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });
  }, [user]);

  const handleLogin = async (selectedRole: string) => {
    try {
      const r = await signInWithPopup(auth, provider);
      const u = r.user;
      const ex = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid)));
      if (ex.empty) {
        await addDoc(collection(db, 'campx_users'), {
          uid: u.uid, email: u.email, name: u.displayName, photoURL: u.photoURL,
          role: selectedRole, rollNumber: '', dept: 'CSE', section: 'A',
          yakarma: 100, createdAt: serverTimestamp()
        });
      }
      window.location.reload();
    } catch (e: any) { showToast(e.message); }
  };

  const handleCalculate = () => {
    const att = parseInt(calcAttended);
    const tot = parseInt(calcTotal);
    const req = parseInt(calcRequired) || 75;
    if (isNaN(att) || isNaN(tot) || tot === 0) { showToast("Enter valid numbers"); return; }
    if (att > tot) { showToast("Attended > Total"); return; }
    setCalcResult(calcNeed(att, tot, req));
  };

  const handleMark = async () => {
    if (!selectedClass || !selectedSubject) { showToast("Select class & subject"); return; }
    const classStudents = students.filter((s: any) => `${s.dept}-${s.section}` === selectedClass);
    if (classStudents.length === 0) { showToast("No students in " + selectedClass); return; }
    try {
      for (const st of classStudents) {
        const present = markList[st.rollNumber] !== false;
        await addDoc(collection(db, 'attendance_records'), {
          rollNumber: (st.rollNumber || '').toUpperCase(),
          studentName: st.name, subject: selectedSubject, date: selectedDate,
          isPresent: present, class: selectedClass, markedBy: user.uid,
          facultyName: userData.name, createdAt: serverTimestamp()
        });
      }
      showToast(`Marked ${classStudents.length} students`);
      setMarkList({});
    } catch (e: any) { showToast(e.message); }
  };

  const overallPercent = myAttendance.length > 0 ? Math.round((myAttendance.filter((a: any) => a.isPresent).length / myAttendance.length) * 100) : 0;

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <style>{`body{background:#000}`}</style>
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[24px] p-8 text-center">
          <h1 className="text-[32px] font-black">CampX</h1>
          <p className="text-[12px] text-white/40 mt-1">SRET • Real Attendance</p>
          <div className="mt-8 space-y-3">
            <button onClick={() => handleLogin('student')} className="w-full py-4 rounded-full bg-white text-black font-bold">🎓 Student Login</button>
            <button onClick={() => handleLogin('faculty')} className="w-full py-4 rounded-full bg-white/10 border border-white/10 font-bold">👨‍🏫 Faculty Login</button>
            <button onClick={() => handleLogin('admin')} className="w-full py-4 rounded-full bg-white/5 border border-white/10 font-bold">🏫 Admin Login</button>
          </div>
          <Footer />
        </div>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
      </div>
    );
  }

  if (screen === 'home' && role === 'student') {
    return (
      <div className="min-h-screen bg-black text-white">
        <style>{`body{background:#000} ::-webkit-scrollbar{display:none}`}</style>
        <div className="max-w-[600px] mx-auto p-4 pb-24">
          <div className="flex justify-between items-center h-14">
            <div className="flex gap-3 items-center"><img src={userData?.photoURL} className="w-9 h-9 rounded-full" alt="" /><div><p className="font-bold text-[13px]">{userData?.name}</p><p className="text-[10px] text-white/40">{userData?.rollNumber || userData?.dept} • Student</p></div></div>
            <button onClick={() => setScreen('profile')} className="w-9 h-9 bg-white/10 rounded-full">👤</button>
          </div>

          <div className="mt-4 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[20px] p-5">
            <p className="text-[11px] font-bold text-white/40">OVERALL ATTENDANCE</p>
            <p className={`text-[48px] font-black leading-none mt-2 ${overallPercent >= 75 ? 'text-green-400' : 'text-red-400'}`}>{overallPercent}%</p>
            <p className="text-[11px] text-white/60 mt-1">{myAttendance.filter((a: any) => a.isPresent).length}/{myAttendance.length} classes • {formatDate(new Date())}</p>
            <div className="w-full h-2 bg-white/10 rounded-full mt-4 overflow-hidden"><div className={`h-full ${overallPercent >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${overallPercent}%` }}></div></div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setScreen('attendance')} className="bg-[#111] border border-white/10 rounded-[16px] p-4 text-left"><p className="text-[20px]">📊</p><p className="font-bold text-[12px] mt-2">Subject-wise</p><p className="text-[10px] text-white/40">{myAttendance.length} records</p></button>
            <button onClick={() => setScreen('calculator')} className="bg-[#111] border border-white/10 rounded-[16px] p-4 text-left"><p className="text-[20px]">🔥</p><p className="font-bold text-[12px] mt-2">Calculator</p><p className="text-[10px] text-white/40">Real Formula</p></button>
            <button onClick={() => setScreen('timetable')} className="bg-[#111] border border-white/10 rounded-[16px] p-4 text-left"><p className="text-[20px]">📅</p><p className="font-bold text-[12px] mt-2">Today</p><p className="text-[10px] text-white/40">{todayAttendance.length} classes</p></button>
            <button onClick={() => setScreen('leave')} className="bg-[#111] border border-white/10 rounded-[16px] p-4 text-left"><p className="text-[20px]">📝</p><p className="font-bold text-[12px] mt-2">Leave</p><p className="text-[10px] text-white/40">{leaveRequests.length} req</p></button>
          </div>

          <div className="mt-4 bg-[#111] border border-white/10 rounded-[16px] p-4">
            <p className="font-bold text-[13px]">Today • {formatDate(new Date())}</p>
            <div className="mt-3 space-y-2">
              {todayAttendance.length === 0 ? <p className="text-[11px] text-white/30 text-center py-6">No classes today</p> :
                todayAttendance.map((a: any) => <div key={a.id} className="flex justify-between bg-white/5 rounded-[12px] p-3"><div><p className="text-[12px] font-bold">{a.subject}</p><p className="text-[10px] text-white/40">{a.date}</p></div><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${a.isPresent ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{a.isPresent ? 'Present' : 'Absent'}</span></div>)}
            </div>
          </div>
          <Footer />
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/10"><div className="max-w-[600px] mx-auto flex justify-around h-[64px] items-center"><button onClick={() => setScreen('home')} className="flex flex-col items-center"><span>🏠</span><span className="text-[9px]">HOME</span></button><button onClick={() => setScreen('attendance')} className="flex flex-col items-center opacity-60"><span>📊</span><span className="text-[9px]">ATTEND</span></button><button onClick={() => setScreen('calculator')} className="w-12 h-12 bg-white text-black rounded-full font-black">%</button><button onClick={() => setScreen('profile')} className="flex flex-col items-center opacity-60"><span>👤</span><span className="text-[9px]">YOU</span></button></div></div>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
      </div>
    );
  }

  if (screen === 'calculator') {
    return (
      <div className="min-h-screen bg-black text-white"><div className="max-w-[600px] mx-auto p-4 pb-24">
        <div className="flex items-center gap-3 h-14"><button onClick={() => setScreen('home')} className="w-8 h-8 bg-white/10 rounded-full">←</button><p className="font-bold">🔥 Real Calculator</p></div>
        <div className="mt-6 bg-[#111] border border-white/10 rounded-[20px] p-5">
          <p className="text-[11px] font-bold text-white/40">FORMULA: (A+x)/(T+x) ≥ R%</p>
          <div className="mt-5 space-y-4">
            <input value={calcAttended} onChange={e => setCalcAttended(e.target.value)} type="number" placeholder="Attended e.g. 34" className="w-full p-3.5 bg-black border border-white/10 rounded-[12px]" />
            <input value={calcTotal} onChange={e => setCalcTotal(e.target.value)} type="number" placeholder="Total e.g. 50" className="w-full p-3.5 bg-black border border-white/10 rounded-[12px]" />
            <input value={calcRequired} onChange={e => setCalcRequired(e.target.value)} type="number" placeholder="Required % 75" className="w-full p-3.5 bg-black border border-white/10 rounded-[12px]" />
            <button onClick={handleCalculate} className="w-full py-4 rounded-full bg-white text-black font-bold">Calculate</button>
          </div>
          {calcResult && (
            <div className="mt-6 space-y-3">
              <div className="bg-white/5 rounded-[14px] p-4"><p className="text-[11px] text-white/40">CURRENT</p><p className={`text-[32px] font-black ${calcResult.safe ? 'text-green-400' : 'text-red-400'}`}>{calcResult.cur}%</p><p className="text-[11px] text-white/40">{calcResult.status}</p></div>
              {!calcResult.safe ? <div className="bg-red-500/10 border border-red-500/20 rounded-[14px] p-4"><p className="text-red-400 font-bold">Need: {calcResult.need} more classes</p><p className="text-[11px] text-white/60 mt-1">Real math: (R×T - 100×A)/(100-R)</p></div> : <div className="bg-green-500/10 border border-green-500/20 rounded-[14px] p-4"><p className="text-green-400 font-bold">Can bunk: {calcResult.bunk} classes</p></div>}
            </div>
          )}
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-[14px] p-4"><p className="text-[11px] font-bold text-yellow-400">Example: 34/50 = 68% → Need 75%</p><p className="text-[11px] text-white/60 mt-1">Answer: {calcNeed(34, 50, 75).need} classes (Real)</p></div>
        </div>
        <Footer />
      </div></div>
    );
  }

  // Fallback for other screens
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-[600px] mx-auto">
        <button onClick={() => setScreen('home')} className="w-8 h-8 bg-white/10 rounded-full mb-4">←</button>
        <p className="font-bold">Screen: {screen} • Role: {role}</p>
        <p className="text-[12px] text-white/40 mt-2">Coming soon...</p>
        <Footer />
      </div>
    </div>
  );
  }
