import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, getDocs, deleteDoc, setDoc, orderBy, increment, arrayUnion, arrayRemove } from 'firebase/firestore';

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

// Footer - BUILD FIX
const Footer = () => {
  return <div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.3em] font-bold text-white/40">© 2026 CampX. A production by ANESH</p></div>;
};

const formatDate = (ts:any) => {
  if(!ts) return "now";
  try {
    const millis = ts.toMillis?.() || (ts.seconds ? ts.seconds*1000 : Date.now());
    const d = new Date(millis);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return "now"; }
};

// REAL CALCULATOR
export const calculateAttendanceNeeded = (attended: number, total: number, required: number = 75) => {
  const currentPercent = total === 0 ? 0 : (attended / total) * 100;
  let needToAttend = 0;
  let canBunk = 0;
  let status = "";
  if (currentPercent < required) {
    const numerator = (required * total) - (100 * attended);
    const denominator = 100 - required;
    needToAttend = Math.ceil(numerator / denominator);
    if (needToAttend < 0) needToAttend = 0;
    status = `Need to attend ${needToAttend} more classes`;
  } else {
    const numerator = (100 * attended) - (required * total);
    canBunk = Math.floor(numerator / required);
    if (canBunk < 0) canBunk = 0;
    status = canBunk > 0 ? `You can bunk ${canBunk} classes` : "Safe ✅";
  }
  return { currentPercent: Math.round(currentPercent * 10) / 10, needToAttend, canBunk, status, isSafe: currentPercent >= required };
};

export default function CampX(){
  // ALL HOOKS AT TOP - FIX FOR BUILD
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [role,setRole]=useState<any>(null);
  const [screen,setScreen]=useState('login');
  const [feedTab,setFeedTab]=useState('new');
  const [attendance,setAttendance]=useState<any[]>([]);
  const [myAttendance,setMyAttendance]=useState<any[]>([]);
  const [todayAttendance,setTodayAttendance]=useState<any[]>([]);
  const [timetable,setTimetable]=useState<any[]>([]);
  const [leaveRequests,setLeaveRequests]=useState<any[]>([]);
  const [students,setStudents]=useState<any[]>([]);
  const [facultyList,setFacultyList]=useState<any[]>([]);
  const [selectedClass,setSelectedClass]=useState('');
  const [selectedSubject,setSelectedSubject]=useState('');
  const [selectedDate,setSelectedDate]=useState(new Date().toISOString().split('T')[0]);
  const [markList,setMarkList]=useState<Record<string, boolean>>({});
  const [toast,setToast]=useState('');
  const [calcAttended,setCalcAttended]=useState('');
  const [calcTotal,setCalcTotal]=useState('');
  const [calcRequired,setCalcRequired]=useState('75');
  const [calcResult,setCalcResult]=useState<any>(null);
  const [newStudentRoll,setNewStudentRoll]=useState('');
  const [newStudentName,setNewStudentName]=useState('');
  const [newStudentDept,setNewStudentDept]=useState('CSE');
  const [newStudentSection,setNewStudentSection]=useState('A');
  const [leaveReason,setLeaveReason]=useState('');
  const [leaveDate,setLeaveDate]=useState(new Date().toISOString().split('T')[0]);
  const [yaks,setYaks]=useState<any[]>([]);
  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000); };

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'campx_users'),where('uid','==',u.uid)));
        if(snap.empty){ setScreen('login'); }
        else{ const data=snap.docs[0].data(); setUserData({id:snap.docs[0].id, ...data}); setRole(data.role); setScreen('home'); }
      } else setScreen('login');
    });
  },[]);

  useEffect(()=>{
    if(!userData || role!=='student') return;
    return onSnapshot(query(collection(db,'attendance_records'), where('rollNumber','==', userData.rollNumber?.toUpperCase())), s=>{
      const data=s.docs.map(d=>({id:d.id, ...d.data()} as any));
      setMyAttendance(data);
      const todayStr = new Date().toISOString().split('T')[0];
      setTodayAttendance(data.filter((a:any)=>a.date===todayStr));
    });
  },[userData, role]);

  useEffect(()=>{
    if(role==='faculty' || role==='admin'){
      return onSnapshot(collection(db,'attendance_records'), s=>{
        setAttendance(s.docs.map(d=>({id:d.id, ...d.data()} as any)));
      });
    }
  },[role]);

  useEffect(()=>{
    return onSnapshot(collection(db,'campx_users'), s=>{
      const all=s.docs.map(d=>({id:d.id, ...d.data()} as any));
      setStudents(all.filter((u:any)=>u.role==='student'));
      setFacultyList(all.filter((u:any)=>u.role==='faculty'));
    });
  },[]);

  const handleLogin = async (selectedRole:'student'|'faculty'|'admin') => {
    try{
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      const existing = await getDocs(query(collection(db,'campx_users'), where('uid','==',u.uid)));
      if(existing.empty){
        await addDoc(collection(db,'campx_users'),{ uid: u.uid, email: u.email, name: u.displayName, photoURL: u.photoURL, role: selectedRole, rollNumber: '', dept: 'CSE', section: 'A', createdAt: serverTimestamp() });
      }
      window.location.reload();
    }catch(e:any){ showToast(e.message); }
  };

  const handleCalculate = () => {
    const attended = parseInt(calcAttended);
    const total = parseInt(calcTotal);
    const required = parseInt(calcRequired) || 75;
    if(isNaN(attended) || isNaN(total) || total===0){ showToast("Enter valid numbers"); return; }
    if(attended>total){ showToast("Attended can't be > Total"); return; }
    const result = calculateAttendanceNeeded(attended, total, required);
    setCalcResult(result);
  };

  const handleMarkAttendance = async () => {
    if(!selectedClass || !selectedSubject){ showToast("Select Class & Subject"); return; }
    const classStudents = students.filter(s=> `${s.dept}-${s.section}`===selectedClass);
    if(classStudents.length===0){ showToast("No students in class"); return; }
    try{
      for(const student of classStudents){
        const isPresent = markList[student.rollNumber] !== false;
        await addDoc(collection(db,'attendance_records'),{ rollNumber: student.rollNumber.toUpperCase(), studentName: student.name, subject: selectedSubject, date: selectedDate, isPresent, class: selectedClass, markedBy: user.uid, facultyName: userData.name, createdAt: serverTimestamp() });
      }
      showToast(`Attendance marked for ${classStudents.length} students ✅`);
      setMarkList({});
    }catch(e:any){ showToast(e.message); }
  };

  const overallPercent = myAttendance.length>0 ? Math.round((myAttendance.filter((a:any)=>a.isPresent).length / myAttendance.length)*100) : 0;

  if(screen==='login'){
    return(<div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6"><style>{`body{background:#000}`}</style><div className="w-full max-w-sm bg-white/[0.05] border border-white/[0.1] rounded-[24px] p-8"><h1 className="text-[28px] font-black">CampX</h1><p className="text-[12px] text-white/40 mt-1">SRET • Real Attendance</p><div className="mt-8 space-y-3"><button onClick={()=>handleLogin('student')} className="w-full py-4 rounded-full bg-white text-black font-bold text-[13px]">🎓 Student Login</button><button onClick={()=>handleLogin('faculty')} className="w-full py-4 rounded-full bg-white/[0.06] border border-white/[0.08] font-bold text-[13px]">👨‍🏫 Faculty Login</button><button onClick={()=>handleLogin('admin')} className="w-full py-4 rounded-full bg-white/[0.04] border border-white/[0.06] font-bold text-[13px]">🏫 Admin Login</button></div><p className="text-[10px] text-white/20 text-center mt-6">© 2026 CampX • ANESH</p></div>{toast && <div className="fixed top-5 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}</div>);
  }

  // HOME - Student
  if(screen==='home' && role==='student'){
    return(
      <div className="min-h-screen bg-black text-white"><style>{`body{background:#000} ::-webkit-scrollbar{display:none}`}</style>
        <div className="max-w-[600px] mx-auto p-4 pb-20">
          <div className="flex justify-between items-center h-14"><div className="flex gap-3 items-center"><img src={userData?.photoURL} className="w-9 h-9 rounded-full" alt="" /><div><p className="font-bold text-[13px]">{userData?.name}</p><p className="text-[10px] text-white/40">{userData?.rollNumber || userData?.dept} • Student</p></div></div><button onClick={()=>setScreen('profile')} className="w-9 h-9 bg-white/[0.06] rounded-full">👤</button></div>
          <div className="mt-4 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] rounded-[20px] p-5"><p className="text-[11px] font-bold text-white/40 tracking-widest">OVERALL ATTENDANCE</p><p className={`text-[48px] font-black leading-none mt-2 ${overallPercent>=75?'text-green-400':overallPercent>=65?'text-yellow-400':'text-red-400'}`}>{overallPercent}%</p><p className="text-[11px] text-white/60 mt-1">{myAttendance.filter((a:any)=>a.isPresent).length}/{myAttendance.length} classes • {formatDate(new Date())}</p><div className="w-full h-2 bg-white/[0.06] rounded-full mt-4 overflow-hidden"><div className={`h-full ${overallPercent>=75?'bg-green-500':overallPercent>=65?'bg-yellow-500':'bg-red-500'}`} style={{width:`${overallPercent}%`}}></div></div></div>
          <div className="grid grid-cols-2 gap-3 mt-4"><button onClick={()=>setScreen('attendance')} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 text-left"><p className="text-[20px]">📊</p><p className="font-bold text-[12px] mt-2">Subject-wise</p></button><button onClick={()=>setScreen('calculator')} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 text-left"><p className="text-[20px]">🔥</p><p className="font-bold text-[12px] mt-2">Calculator</p><p className="text-[10px] text-white/40">Real Formula</p></button></div>
          <div className="mt-4 bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><p className="font-bold text-[13px]">Today's Attendance • {formatDate(new Date())}</p><div className="mt-3 space-y-2">{todayAttendance.length===0 ? <p className="text-[11px] text-white/30 py-4 text-center">No classes today</p> : todayAttendance.map((a:any)=><div key={a.id} className="flex justify-between bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-3"><div><p className="text-[12px] font-bold">{a.subject}</p><p className="text-[10px] text-white/40">{a.date}</p></div><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${a.isPresent?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{a.isPresent?'Present':'Absent'}</span></div>)}</div></div>
          <Footer/>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/[0.06]"><div className="max-w-[600px] mx-auto flex justify-around h-[64px] items-center"><button onClick={()=>setScreen('home')} className="flex flex-col items-center"><span>🏠</span><span className="text-[9px]">HOME</span></button><button onClick={()=>setScreen('attendance')} className="flex flex-col items-center opacity-60"><span>📊</span><span className="text-[9px]">ATTEND</span></button><button onClick={()=>setScreen('calculator')} className="w-12 h-12 bg-white text-black rounded-full text-[20px] font-black">%</button><button onClick={()=>setScreen('profile')} className="flex flex-col items-center opacity-60"><span>👤</span><span className="text-[9px]">PROFILE</span></button></div></div>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
      </div>
    );
  }

  // CALCULATOR - Real
  if(screen==='calculator'){
    return(
      <div className="min-h-screen bg-black text-white"><div className="max-w-[600px] mx-auto p-4 pb-20">
        <div className="flex items-center gap-3 h-14"><button onClick={()=>setScreen('home')} className="w-8 h-8 bg-white/[0.06] rounded-full">←</button><p className="font-bold">🔥 Attendance Calculator - Real</p></div>
        <div className="mt-6 bg-[#111111] border border-white/[0.06] rounded-[20px] p-5">
          <p className="text-[11px] font-bold text-white/40">REAL FORMULA</p><p className="text-[10px] text-white/30 mt-1">x = (R×T - 100×A)/(100-R)</p>
          <div className="mt-5 space-y-4"><div><label className="text-[11px] text-white/40">Attended</label><input value={calcAttended} onChange={e=>setCalcAttended(e.target.value)} type="number" placeholder="e.g. 34" className="w-full mt-1 p-3.5 bg-black border border-white/[0.08] rounded-[12px]" /></div><div><label className="text-[11px] text-white/40">Total</label><input value={calcTotal} onChange={e=>setCalcTotal(e.target.value)} type="number" placeholder="e.g. 50" className="w-full mt-1 p-3.5 bg-black border border-white/[0.08] rounded-[12px]" /></div><div><label className="text-[11px] text-white/40">Required %</label><input value={calcRequired} onChange={e=>setCalcRequired(e.target.value)} type="number" placeholder="75" className="w-full mt-1 p-3.5 bg-black border border-white/[0.08] rounded-[12px]" /></div><button onClick={handleCalculate} className="w-full py-4 rounded-full bg-white text-black font-bold">Calculate Real Need</button></div>
          {calcResult && (
            <div className="mt-6">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-[14px] p-4"><p className="text-[11px] text-white/40">CURRENT</p><p className={`text-[32px] font-black ${calcResult.isSafe?'text-green-400':'text-red-400'}`}>{calcResult.currentPercent}%</p></div>
              {!calcResult.isSafe ? <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-[14px] p-4"><p className="text-[12px] font-bold text-red-400">Need to attend</p><p className="text-[36px] font-black text-red-400">{calcResult.needToAttend} classes</p><p className="text-[11px] text-white/60 mt-1">{calcResult.status}</p></div> : <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-[14px] p-4"><p className="text-[12px] font-bold text-green-400">Safe</p><p className="text-[36px] font-black text-green-400">{calcResult.canBunk} can bunk</p></div>}
            </div>
          )}
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-[16px] p-4"><p className="font-bold text-[12px] text-yellow-400">Example: 68% → 75%</p><p className="text-[11px] text-white/60 mt-1">34/50 = 68%, Need {calculateAttendanceNeeded(34,50,75).needToAttend} classes more</p><p className="text-[10px] text-white/40 mt-1">(75×50 - 100×34)/25 = 14</p></div>
        </div>
        <Footer/>
      </div></div>
    );
  }

  // Default fallback
  return(<div className="min-h-screen bg-black text-white flex items-center justify-center"><div className="text-center"><p className="font-bold">CampX - {role}</p><button onClick={()=>setScreen('home')} className="mt-4 px-6 py-2 bg-white text-black rounded-full text-xs font-bold">Go Home</button><div className="mt-8"><Footer/></div></div></div>);
    }
