import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, getDocs, deleteDoc, setDoc } from 'firebase/firestore';

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

// 🔥 REAL ATTENDANCE CALCULATOR - NOT FAKE
export const calculateAttendanceNeeded = (attended: number, total: number, required: number = 75) => {
  const currentPercent = total === 0 ? 0 : (attended / total) * 100;
  
  // How many more to attend to reach required %
  // Formula: (A + x) / (T + x) >= R/100 => x >= (R*T - 100*A)/(100 - R)
  let needToAttend = 0;
  let canBunk = 0;
  let status = "";
  
  if (currentPercent < required) {
    // Need to attend
    const numerator = (required * total) - (100 * attended);
    const denominator = 100 - required;
    needToAttend = Math.ceil(numerator / denominator);
    if (needToAttend < 0) needToAttend = 0;
    status = `Need to attend ${needToAttend} more classes`;
  } else {
    // Can bunk
    // Max bunk: (100*A - R*T)/R
    const numerator = (100 * attended) - (required * total);
    canBunk = Math.floor(numerator / required);
    if (canBunk < 0) canBunk = 0;
    status = canBunk > 0 ? `You can bunk ${canBunk} classes` : "Safe ✅";
  }
  
  return {
    currentPercent: Math.round(currentPercent * 10) / 10,
    needToAttend,
    canBunk,
    status,
    isSafe: currentPercent >= required
  };
};

const formatDate = (ts:any) => {
  if(!ts) return "";
  const millis = ts.toMillis?.() || (ts.seconds ? ts.seconds*1000 : Date.now());
  const d = new Date(millis);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const DEPARTMENTS = ["CSE","ECE","EEE","MECH","CIVIL","AI&DS","CSM"];
const SECTIONS = ["A","B","C","D"];
const SUBJECTS = [
  {code:"CS301", name:"DBMS", dept:"CSE"},
  {code:"CS302", name:"OS", dept:"CSE"},
  {code:"CS303", name:"CN", dept:"CSE"},
  {code:"CS304", name:"SE", dept:"CSE"},
  {code:"CS305", name:"DAA", dept:"CSE"},
];

export default function CampX(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [role,setRole]=useState<'student'|'faculty'|'admin'|null>(null);
  const [screen,setScreen]=useState<'login'|'home'|'attendance'|'timetable'|'leave'|'profile'|'faculty_mark'|'admin_panel'|'calculator'>('login');
  const [attendance,setAttendance]=useState<any[]>([]);
  const [myAttendance,setMyAttendance]=useState<any[]>([]);
  const [todayAttendance,setTodayAttendance]=useState<any[]>([]);
  const [timetable,setTimetable]=useState<any[]>([]);
  const [leaveRequests,setLeaveRequests]=useState<any[]>([]);
  const [notifications,setNotifications]=useState<any[]>([]);
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
  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000); };

    useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'campx_users'),where('uid','==',u.uid)));
        if(snap.empty){
          // New user - role select
          setScreen('login');
        }else{
          const data=snap.docs[0].data();
          setUserData({id:snap.docs[0].id, ...data});
          setRole(data.role);
          setScreen('home');
        }
      }else setScreen('login');
    });
  },[]);

  useEffect(()=>{
    if(!userData) return;
    // My Attendance
    if(role==='student'){
      return onSnapshot(query(collection(db,'attendance_records'), where('rollNumber','==', userData.rollNumber?.toUpperCase())), s=>{
        const data=s.docs.map(d=>({id:d.id, ...d.data()} as any));
        setMyAttendance(data);
        const todayStr = new Date().toISOString().split('T')[0];
        setTodayAttendance(data.filter((a:any)=>a.date===todayStr));
      });
    }
  },[userData, role]);

  useEffect(()=>{
    // All attendance for faculty/admin
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

  useEffect(()=>{
    return onSnapshot(collection(db,'timetable'), s=>{
      setTimetable(s.docs.map(d=>({id:d.id, ...d.data()} as any)));
    });
  },[]);

  useEffect(()=>{
    if(!userData) return;
    return onSnapshot(query(collection(db,'leave_requests'), where('uid','==', userData.uid || user?.uid)), s=>{
      setLeaveRequests(s.docs.map(d=>({id:d.id, ...d.data()} as any)));
    });
  },[userData, user]);

  const handleLogin = async (selectedRole:'student'|'faculty'|'admin') => {
    try{
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      // Check if exists
      const existing = await getDocs(query(collection(db,'campx_users'), where('uid','==',u.uid)));
      if(existing.empty){
        // Create
        await addDoc(collection(db,'campx_users'),{
          uid: u.uid,
          email: u.email,
          name: u.displayName,
          photoURL: u.photoURL,
          role: selectedRole,
          rollNumber: selectedRole==='student' ? '' : '',
          dept: 'CSE',
          section: 'A',
          createdAt: serverTimestamp()
        });
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
        const isPresent = markList[student.rollNumber] !== false; // default present
        await addDoc(collection(db,'attendance_records'),{
          rollNumber: student.rollNumber.toUpperCase(),
          studentName: student.name,
          subject: selectedSubject,
          subjectCode: SUBJECTS.find(s=>s.name===selectedSubject)?.code || selectedSubject,
          date: selectedDate,
          isPresent,
          class: selectedClass,
          markedBy: user.uid,
          facultyName: userData.name,
          createdAt: serverTimestamp()
        });
      }
      showToast(`Attendance marked for ${classStudents.length} students ✅`);
      setMarkList({});
    }catch(e:any){ showToast(e.message); }
  };

  if(screen==='login'){
    return(
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white/[0.05] border border-white/[0.1] rounded-[24px] p-8">
          <h1 className="text-[28px] font-black">CampX</h1>
          <p className="text-[12px] text-white/40 mt-1">SRET • Real Attendance</p>
          <div className="mt-8 space-y-3">
            <button onClick={()=>handleLogin('student')} className="w-full py-4 rounded-full bg-white text-black font-bold text-[13px]">🎓 Student Login</button>
            <button onClick={()=>handleLogin('faculty')} className="w-full py-4 rounded-full bg-white/[0.06] border border-white/[0.08] font-bold text-[13px]">👨‍🏫 Faculty Login</button>
            <button onClick={()=>handleLogin('admin')} className="w-full py-4 rounded-full bg-white/[0.04] border border-white/[0.06] font-bold text-[13px]">🏫 Admin Login</button>
          </div>
          <p className="text-[10px] text-white/20 text-center mt-6">© 2026 CampX • ANESH</p>
        </div>
        {toast && <div className="fixed top-5 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
      </div>
    );
  }

  const overallPercent = myAttendance.length>0 ? Math.round((myAttendance.filter(a=>a.isPresent).length / myAttendance.length)*100) : 0;
  const subjectWise = SUBJECTS.map(sub=>{
    const subAtt = myAttendance.filter(a=>a.subject===sub.name);
    const present = subAtt.filter(a=>a.isPresent).length;
    const total = subAtt.length;
    const percent = total>0 ? Math.round((present/total)*100) : 0;
    return {...sub, present, total, percent, calc: calculateAttendanceNeeded(present, total, 75)};
  });
  const lowAttendance = subjectWise.filter(s=>s.percent<75 && s.total>0);

  if(screen==='home' && role==='student'){
    return(
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-[600px] mx-auto p-4 pb-20">
          <div className="flex justify-between items-center h-14">
            <div className="flex gap-3 items-center"><img src={userData?.photoURL} className="w-9 h-9 rounded-full" /><div><p className="font-bold text-[13px]">{userData?.name}</p><p className="text-[10px] text-white/40">{userData?.rollNumber || userData?.dept} • Student</p></div></div>
            <button onClick={()=>setScreen('profile')} className="w-9 h-9 bg-white/[0.06] rounded-full">👤</button>
          </div>

          {/* Overall Attendance */}
          <div className="mt-4 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] rounded-[20px] p-5">
            <p className="text-[11px] font-bold text-white/40 tracking-widest">OVERALL ATTENDANCE</p>
            <div className="flex items-end gap-4 mt-3">
              <p className={`text-[48px] font-black leading-none ${overallPercent>=75?'text-green-400':overallPercent>=65?'text-yellow-400':'text-red-400'}`}>{overallPercent}%</p>
              <div className="mb-2"><p className="text-[11px] text-white/60">{myAttendance.filter(a=>a.isPresent).length}/{myAttendance.length} classes</p><p className={`text-[10px] font-bold mt-1 ${overallPercent>=75?'text-green-400':'text-red-400'}`}>{overallPercent>=75?'Safe ✅':'Low ⚠️'}</p></div>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full mt-4 overflow-hidden"><div className={`h-full ${overallPercent>=75?'bg-green-500':overallPercent>=65?'bg-yellow-500':'bg-red-500'}`} style={{width:`${overallPercent}%`}}></div></div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={()=>setScreen('attendance')} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 text-left"><p className="text-[20px]">📊</p><p className="font-bold text-[12px] mt-2">Subject-wise</p><p className="text-[10px] text-white/40">{subjectWise.filter(s=>s.total>0).length} subjects</p></button>
            <button onClick={()=>setScreen('calculator')} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 text-left"><p className="text-[20px]">🔥</p><p className="font-bold text-[12px] mt-2">Calculator</p><p className="text-[10px] text-white/40">How many needed?</p></button>
            <button onClick={()=>setScreen('timetable')} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 text-left"><p className="text-[20px]">📅</p><p className="font-bold text-[12px] mt-2">Timetable</p><p className="text-[10px] text-white/40">Today's classes</p></button>
            <button onClick={()=>setScreen('leave')} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 text-left"><p className="text-[20px]">📝</p><p className="font-bold text-[12px] mt-2">Leave Request</p><p className="text-[10px] text-white/40">{leaveRequests.length} requests</p></button>
          </div>

          {/* Today's Attendance */}
          <div className="mt-4 bg-[#111111] border border-white/[0.06] rounded-[16px] p-4">
            <p className="font-bold text-[13px]">Today's Attendance • {formatDate(new Date())}</p>
            <div className="mt-3 space-y-2">
              {todayAttendance.length===0 ? <p className="text-[11px] text-white/30 py-4 text-center">No classes today</p> : todayAttendance.map((a:any)=><div key={a.id} className="flex justify-between bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-3"><div><p className="text-[12px] font-bold">{a.subject}</p><p className="text-[10px] text-white/40">{a.date}</p></div><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${a.isPresent?'bg-green-500/10 text-green-400 border border-green-500/20':'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{a.isPresent?'Present':'Absent'}</span></div>)}
            </div>
          </div>

          {/* Low Attendance Alert */}
          {lowAttendance.length>0 && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-[16px] p-4">
              <p className="font-bold text-[13px] text-red-400">⚠️ Low Attendance Alert</p>
              <div className="mt-3 space-y-2">{lowAttendance.map(s=><div key={s.code} className="flex justify-between bg-black/30 rounded-[12px] p-3"><div><p className="text-[12px] font-bold">{s.name}</p><p className="text-[10px] text-white/40">{s.calc.status}</p></div><span className="text-[12px] font-bold text-red-400">{s.percent}%</span></div>)}</div>
            </div>
          )}

          {/* Attendance History */}
          <div className="mt-4 bg-[#111111] border border-white/[0.06] rounded-[16px] p-4">
            <p className="font-bold text-[13px]">Attendance History</p>
            <div className="mt-3 max-h-[300px] overflow-y-auto space-y-2">{myAttendance.slice(0,20).map((a:any)=><div key={a.id} className="flex justify-between text-[11px] bg-white/[0.02] rounded-[10px] p-2.5"><span>{formatDate(a.createdAt)} • {a.subject}</span><span className={a.isPresent?'text-green-400':'text-red-400'}>{a.isPresent?'P':'A'}</span></div>)}{myAttendance.length===0 && <p className="text-[11px] text-white/20 text-center py-6">No history yet</p>}</div>
          </div>
        </div>
        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/[0.06]"><div className="max-w-[600px] mx-auto flex justify-around h-[64px] items-center"><button onClick={()=>setScreen('home')} className="flex flex-col items-center"><span className="text-[18px]">🏠</span><span className="text-[9px]">HOME</span></button><button onClick={()=>setScreen('attendance')} className="flex flex-col items-center opacity-60"><span className="text-[18px]">📊</span><span className="text-[9px]">ATTEND</span></button><button onClick={()=>setScreen('calculator')} className="w-12 h-12 bg-white text-black rounded-full text-[20px] font-black">%</button><button onClick={()=>setScreen('timetable')} className="flex flex-col items-center opacity-60"><span className="text-[18px]">📅</span><span className="text-[9px]">TIME</span></button><button onClick={()=>setScreen('profile')} className="flex flex-col items-center opacity-60"><span className="text-[18px]">👤</span><span className="text-[9px]">PROFILE</span></button></div></div>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
      </div>
    );
  }

  if(screen==='attendance' && role==='student'){
    return(
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-[600px] mx-auto p-4 pb-20">
          <div className="flex items-center gap-3 h-14"><button onClick={()=>setScreen('home')} className="w-8 h-8 bg-white/[0.06] rounded-full">←</button><p className="font-bold">Subject-wise Attendance</p></div>
          <div className="mt-4 space-y-3">{subjectWise.map(s=>(
            <div key={s.code} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4">
              <div className="flex justify-between"><div><p className="font-bold text-[13px]">{s.name} • {s.code}</p><p className="text-[10px] text-white/40 mt-1">{s.present}/{s.total} classes • {formatDate(new Date())}</p><p className="text-[10px] mt-1 font-bold text-yellow-400">{s.total>0 ? s.calc.status : "No data"}</p></div><span className={`px-3 py-1.5 rounded-full border text-[12px] font-bold h-fit ${s.total===0?'bg-white/[0.04] text-white/20 border-white/[0.06]': s.percent>=75?'bg-green-500/10 text-green-400 border-green-500/20': s.percent>=65?'bg-yellow-500/10 text-yellow-400 border-yellow-500/20':'bg-red-500/10 text-red-400 border-red-500/20'}`}>{s.percent}%</span></div>
              <div className="w-full h-2 bg-white/[0.06] rounded-full mt-3 overflow-hidden"><div className={`h-full ${s.percent>=75?'bg-green-500':s.percent>=65?'bg-yellow-500':'bg-red-500'}`} style={{width:`${s.percent}%`}}></div></div>
              {s.total>0 && s.percent<75 && <p className="text-[11px] text-red-300 mt-2">Need {s.calc.needToAttend} more classes to reach 75%</p>}
              {s.total>0 && s.percent>=75 && <p className="text-[11px] text-green-300 mt-2">You can bunk {s.calc.canBunk} classes and still be safe</p>}
            </div>
          ))}</div>
        </div>
      </div>
    );
  }

  if(screen==='calculator'){
    return(
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-[600px] mx-auto p-4 pb-20">
          <div className="flex items-center gap-3 h-14"><button onClick={()=>setScreen('home')} className="w-8 h-8 bg-white/[0.06] rounded-full">←</button><p className="font-bold">🔥 Attendance Calculator</p></div>
          
          <div className="mt-6 bg-[#111111] border border-white/[0.06] rounded-[20px] p-5">
            <p className="text-[11px] font-bold text-white/40 tracking-widest">REAL CALCULATOR</p>
            <p className="text-[10px] text-white/30 mt-1">Formula: (A+x)/(T+x) ≥ R%</p>
            <div className="mt-5 space-y-4">
              <div><label className="text-[11px] text-white/40">Attended Classes</label><input value={calcAttended} onChange={e=>setCalcAttended(e.target.value)} type="number" placeholder="e.g. 30" className="w-full mt-1 p-3.5 bg-black border border-white/[0.08] rounded-[12px] text-[14px]" /></div>
              <div><label className="text-[11px] text-white/40">Total Classes</label><input value={calcTotal} onChange={e=>setCalcTotal(e.target.value)} type="number" placeholder="e.g. 45" className="w-full mt-1 p-3.5 bg-black border border-white/[0.08] rounded-[12px] text-[14px]" /></div>
              <div><label className="text-[11px] text-white/40">Required % (Default 75)</label><input value={calcRequired} onChange={e=>setCalcRequired(e.target.value)} type="number" placeholder="75" className="w-full mt-1 p-3.5 bg-black border border-white/[0.08] rounded-[12px] text-[14px]" /></div>
              <button onClick={handleCalculate} className="w-full py-4 rounded-full bg-white text-black font-bold text-[13px]">Calculate Real Need</button>
            </div>

            {calcResult && (
              <div className="mt-6 space-y-3">
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-[14px] p-4">
                  <p className="text-[11px] text-white/40">CURRENT</p>
                  <p className={`text-[32px] font-black mt-1 ${calcResult.isSafe?'text-green-400':'text-red-400'}`}>{calcResult.currentPercent}%</p>
                  <p className="text-[11px] text-white/50 mt-1">{calcAttended}/{calcTotal} classes</p>
                </div>
                
                {!calcResult.isSafe ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-[14px] p-4">
                    <p className="text-[12px] font-bold text-red-400">You Need To Attend:</p>
                    <p className="text-[36px] font-black text-red-400 mt-1">{calcResult.needToAttend} more</p>
                    <p className="text-[11px] text-white/60 mt-2">Attend next {calcResult.needToAttend} classes continuously to reach {calcRequired}%</p>
                    <div className="mt-3 p-3 bg-black/30 rounded-[10px]"><p className="text-[10px] text-white/40">FORMULA USED:</p><p className="text-[11px] font-mono mt-1">x = (R×T - 100×A) / (100 - R)</p><p className="text-[11px] font-mono">x = ({calcRequired}×{calcTotal} - 100×{calcAttended}) / {100 - parseInt(calcRequired)} = {calcResult.needToAttend}</p></div>
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-[14px] p-4">
                    <p className="text-[12px] font-bold text-green-400">You Are Safe ✅</p>
                    <p className="text-[36px] font-black text-green-400 mt-1">{calcResult.canBunk} can bunk</p>
                    <p className="text-[11px] text-white/60 mt-2">You can bunk {calcResult.canBunk} classes and still stay above {calcRequired}%</p>
                    <div className="mt-3 p-3 bg-black/30 rounded-[10px]"><p className="text-[10px] text-white/40">FORMULA:</p><p className="text-[11px] font-mono mt-1">Max Bunk = (100×A - R×T) / R = {calcResult.canBunk}</p></div>
                  </div>
                )}

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[14px] p-3">
                  <p className="text-[10px] font-bold text-white/30">EXAMPLE:</p>
                  <p className="text-[11px] text-white/50 mt-1">Current: {calcResult.currentPercent}% ({calcAttended}/{calcTotal})</p>
                  <p className="text-[11px] text-white/50">Required: {calcRequired}%</p>
                  <p className="text-[11px] text-white/50 mt-1 font-bold">{calcResult.status}</p>
                </div>
              </div>
            )}
          </div>

          {/* Example given by user */}
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-[16px] p-4">
            <p className="font-bold text-[12px] text-yellow-400">Example You Asked:</p>
            <p className="text-[11px] text-white/60 mt-2">Current: 68% • Required: 75%</p>
            <p className="text-[11px] text-white/60">Let's say 34/50 = 68%</p>
            <p className="text-[13px] font-bold text-white mt-2">Need to attend: {calculateAttendanceNeeded(34,50,75).needToAttend} more classes</p>
            <p className="text-[10px] text-white/40 mt-1">Real math: (75×50 - 100×34)/(25) = (3750-3400)/25 = 14 classes</p>
          </div>
        </div>
      </div>
    );
  }

  // FACULTY - Mark Attendance
  if((screen==='home' || screen==='faculty_mark') && role==='faculty'){
    return(
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-[600px] mx-auto p-4 pb-20">
          <div className="flex justify-between h-14 items-center"><div className="flex gap-3 items-center"><img src={userData?.photoURL} className="w-9 h-9 rounded-full" /><div><p className="font-bold text-[13px]">{userData?.name} • Faculty</p><p className="text-[10px] text-white/40">{userData?.dept}</p></div></div><button onClick={()=>setScreen('profile')} className="w-9 h-9 bg-white/[0.06] rounded-full">👤</button></div>

          <div className="mt-4 bg-[#111111] border border-white/[0.06] rounded-[16px] p-4">
            <p className="font-bold text-[13px]">Select Class & Subject</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="p-3 bg-black border border-white/[0.08] rounded-[12px] text-[12px]"><option value="">Select Class</option>{DEPARTMENTS.map(d=>SECTIONS.map(s=><option key={d+'-'+s} value={`${d}-${s}`}>{d}-{s}</option>))}</select>
              <select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)} className="p-3 bg-black border border-white/[0.08] rounded-[12px] text-[12px]"><option value="">Subject</option>{SUBJECTS.map(s=><option key={s.code} value={s.name}>{s.name}</option>)}</select>
            </div>
            <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="w-full mt-2 p-3 bg-black border border-white/[0.08] rounded-[12px] text-[12px]" />
            <button onClick={()=>setScreen('faculty_mark')} className="w-full mt-3 py-3 rounded-full bg-white text-black font-bold text-[12px]">Load Students</button>
          </div>

          {screen==='faculty_mark' && selectedClass && (
            <div className="mt-4 bg-[#111111] border border-white/[0.06] rounded-[16px] p-4">
              <p className="font-bold text-[13px]">Mark Attendance • {selectedClass} • {selectedSubject} • {selectedDate}</p>
              <p className="text-[10px] text-white/40 mt-1">Toggle: Green=Present, Red=Absent</p>
              <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                {students.filter(s=> `${s.dept}-${s.section}`===selectedClass).map(st=>(
                  <div key={st.id} className="flex justify-between items-center bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-3">
                    <div><p className="font-bold text-[12px]">{st.name}</p><p className="text-[10px] text-white/40">{st.rollNumber}</p></div>
                    <button onClick={()=>setMarkList({...markList, [st.rollNumber]: markList[st.rollNumber]===false ? true : false})} className={`px-4 py-2 rounded-full text-[11px] font-bold border ${markList[st.rollNumber]===false ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>{markList[st.rollNumber]===false ? 'Absent' : 'Present'}</button>
                  </div>
                ))}
                {students.filter(s=> `${s.dept}-${s.section}`===selectedClass).length===0 && <p className="text-[11px] text-white/30 text-center py-8">No students in {selectedClass}</p>}
              </div>
              <button onClick={handleMarkAttendance} className="w-full mt-4 py-3 rounded-full bg-white text-black font-bold text-[12px]">Submit Attendance ✅</button>
            </div>
          )}

          <div className="mt-4 bg-[#111111] border border-white/[0.06] rounded-[16px] p-4">
            <p className="font-bold text-[13px]">Class Report • {selectedClass || "All"}</p>
            <div className="mt-3 space-y-2">{attendance.filter(a=>!selectedClass || a.class===selectedClass).slice(0,20).map((a:any)=><div key={a.id} className="flex justify-between text-[11px] bg-white/[0.02] rounded-[10px] p-2.5"><span>{a.rollNumber} • {a.subject} • {a.date}</span><span className={a.isPresent?'text-green-400':'text-red-400'}>{a.isPresent?'P':'A'}</span></div>)}</div>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN
  if(role==='admin'){
    return(
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-[600px] mx-auto p-4 pb-20">
          <div className="flex justify-between h-14 items-center"><p className="font-black text-[16px]">Admin • CampusX</p><button onClick={()=>setScreen('profile')} className="w-9 h-9 bg-white/[0.06] rounded-full">👤</button></div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-[16px] p-4"><p className="text-[24px] font-black">{students.length}</p><p className="text-[10px] text-white/40">Students</p></div>
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-[16px] p-4"><p className="text-[24px] font-black">{facultyList.length}</p><p className="text-[10px] text-white/40">Faculty</p></div>
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-[16px] p-4"><p className="text-[24px] font-black">{attendance.length}</p><p className="text-[10px] text-white/40">Attendance Records</p></div>
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-[16px] p-4"><p className="text-[24px] font-black">{DEPARTMENTS.length}</p><p className="text-[10px] text-white/40">Departments</p></div>
          </div>

          <div className="mt-6 bg-[#111111] border border-white/[0.06] rounded-[16px] p-4">
            <p className="font-bold text-[13px]">Add Student</p>
            <div className="mt-3 space-y-2">
              <input value={newStudentRoll} onChange={e=>setNewStudentRoll(e.target.value.toUpperCase())} placeholder="Roll e.g. 21CS101" className="w-full p-3 bg-black border border-white/[0.08] rounded-[12px] text-[12px] uppercase" />
              <input value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} placeholder="Name" className="w-full p-3 bg-black border border-white/[0.08] rounded-[12px] text-[12px]" />
              <div className="flex gap-2"><select value={newStudentDept} onChange={e=>setNewStudentDept(e.target.value)} className="flex-1 p-3 bg-black border border-white/[0.08] rounded-[12px] text-[12px]">{DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}</select><select value={newStudentSection} onChange={e=>setNewStudentSection(e.target.value)} className="flex-1 p-3 bg-black border border-white/[0.08] rounded-[12px] text-[12px]">{SECTIONS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              <button onClick={async()=>{ if(!newStudentRoll.trim()||!newStudentName.trim()){ showToast("Fill all"); return; } await addDoc(collection(db,'campx_users'),{uid:`STU_${newStudentRoll}`, rollNumber:newStudentRoll.toUpperCase(), name:newStudentName, dept:newStudentDept, section:newStudentSection, role:'student', createdAt:serverTimestamp()}); setNewStudentRoll(''); setNewStudentName(''); showToast("Student Added ✅"); }} className="w-full py-3 rounded-full bg-white text-black font-bold text-[12px]">Add Student</button>
            </div>
          </div>

          <div className="mt-4 bg-[#111111] border border-white/[0.06] rounded-[16px] p-4">
            <p className="font-bold text-[13px]">All Students</p>
            <div className="mt-3 max-h-[300px] overflow-y-auto space-y-2">{students.map(s=><div key={s.id} className="flex justify-between bg-white/[0.02] rounded-[10px] p-2.5 text-[11px]"><span>{s.rollNumber} • {s.name} • {s.dept}-{s.section}</span><button onClick={async()=>{ if(!confirm("Delete?")) return; await deleteDoc(doc(db,'campx_users',s.id)); }} className="text-red-400">✕</button></div>)}</div>
          </div>
        </div>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
      </div>
    );
            }

  // Timetable
  if(screen==='timetable'){
    return(
      <div className="min-h-screen bg-black text-white"><div className="max-w-[600px] mx-auto p-4 pb-20"><div className="flex items-center gap-3 h-14"><button onClick={()=>setScreen('home')} className="w-8 h-8 bg-white/[0.06] rounded-full">←</button><p className="font-bold">Timetable</p></div>
        <div className="mt-4 space-y-2">{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(day=><div key={day} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><p className="font-bold text-[12px]">{day}</p><div className="mt-2 space-y-1">{timetable.filter((t:any)=>t.day===day).map((t:any)=><div key={t.id} className="flex justify-between text-[11px] bg-white/[0.02] rounded-[10px] p-2"><span>{t.time} • {t.subject}</span><span className="text-white/40">{t.faculty}</span></div>)}{timetable.filter((t:any)=>t.day===day).length===0 && <p className="text-[11px] text-white/20">No classes</p>}</div></div>)}
        </div>
      </div></div>
    );
  }

  // Leave Request
  if(screen==='leave'){
    const [leaveReason,setLeaveReason]=useState('');
    const [leaveDate,setLeaveDate]=useState(new Date().toISOString().split('T')[0]);
    return(
      <div className="min-h-screen bg-black text-white"><div className="max-w-[600px] mx-auto p-4 pb-20"><div className="flex items-center gap-3 h-14"><button onClick={()=>setScreen('home')} className="w-8 h-8 bg-white/[0.06] rounded-full">←</button><p className="font-bold">Leave Request</p></div>
        <div className="mt-4 bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><p className="font-bold text-[13px]">Apply Leave</p><input type="date" value={leaveDate} onChange={e=>setLeaveDate(e.target.value)} className="w-full mt-3 p-3 bg-black border border-white/[0.08] rounded-[12px] text-[12px]" /><textarea value={leaveReason} onChange={e=>setLeaveReason(e.target.value)} placeholder="Reason" className="w-full mt-2 p-3 bg-black border border-white/[0.08] rounded-[12px] text-[12px] h-20" /><button onClick={async()=>{ if(!leaveReason.trim()){ showToast("Enter reason"); return; } await addDoc(collection(db,'leave_requests'),{uid:user.uid, name:userData.name, rollNumber:userData.rollNumber, date:leaveDate, reason:leaveReason, status:'pending', createdAt:serverTimestamp()}); setLeaveReason(''); showToast("Leave Applied ✅"); }} className="w-full mt-3 py-3 rounded-full bg-white text-black font-bold text-[12px]">Submit</button></div>
        <div className="mt-4 bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><p className="font-bold text-[13px]">My Requests</p><div className="mt-3 space-y-2">{leaveRequests.map((l:any)=><div key={l.id} className="bg-white/[0.02] rounded-[12px] p-3 flex justify-between"><div><p className="text-[12px] font-bold">{l.date}</p><p className="text-[11px] text-white/40">{l.reason}</p></div><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${l.status==='approved'?'bg-green-500/10 text-green-400':l.status==='rejected'?'bg-red-500/10 text-red-400':'bg-yellow-500/10 text-yellow-400'}`}>{l.status}</span></div>)}{leaveRequests.length===0 && <p className="text-[11px] text-white/20 text-center py-6">No requests</p>}</div></div>
      </div></div>
    );
  }

  // Profile
  if(screen==='profile'){
    return(
      <div className="min-h-screen bg-black text-white"><div className="max-w-[600px] mx-auto p-4 pb-20"><div className="flex items-center gap-3 h-14"><button onClick={()=>setScreen('home')} className="w-8 h-8 bg-white/[0.06] rounded-full">←</button><p className="font-bold">Profile</p></div>
        <div className="mt-4 bg-[#111111] border border-white/[0.06] rounded-[20px] p-5 flex gap-4 items-center"><img src={userData?.photoURL} className="w-14 h-14 rounded-full" /><div><p className="font-bold text-[14px]">{userData?.name}</p><p className="text-[11px] text-white/40">{userData?.rollNumber || userData?.email} • {role}</p><p className="text-[10px] text-white/30">{userData?.dept}-{userData?.section} • {formatDate(userData?.createdAt)}</p></div></div>
        <div className="mt-4 space-y-2"><button onClick={async()=>{ await signOut(auth); window.location.reload(); }} className="w-full py-3 rounded-full bg-red-600 text-white font-bold text-[12px]">Logout</button><button onClick={()=>setScreen('home')} className="w-full py-3 rounded-full bg-white/[0.06] border border-white/[0.08] text-[12px]">Back to Home</button></div>
        <Footer/>
      </div></div>
    );
  }

  return(<div className="min-h-screen bg-black text-white flex items-center justify-center"><p>Loading...</p></div>);
}
