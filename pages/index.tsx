import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, getDocs, updateDoc } from 'firebase/firestore';

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

const calc75 = (a: number, t: number) => {
  if (t === 0) return { cur: 0, need: 0, miss: 0, safe: false };
  const cur = (a / t) * 100;
  if (cur >= 75) { const miss = Math.floor((100 * a - 75 * t) / 75); return { cur: Math.round(cur), need: 0, miss: miss < 0 ? 0 : miss, safe: true }; }
  else { const need = Math.ceil((75 * t - 100 * a) / 25); return { cur: Math.round(cur), need: need < 0 ? 0 : need, miss: 0, safe: false }; }
};

export default function CampXBlack() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [tab, setTab] = useState('login');
  const [toast, setToast] = useState('');
  const [myAtt, setMyAtt] = useState<any[]>([]);
  const [tt, setTT] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [leaveReq, setLeaveReq] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [bus, setBus] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [lost, setLost] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [emergency, setEmergency] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [roll, setRoll] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u: any) => {
      if (u) { setUser(u); const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid))); if (snap.empty) setTab('login'); else { const d = snap.docs[0].data() as any; setUserData({ id: snap.docs[0].id, ...d }); setRoll(d.rollNumber || ''); setTab('home'); } } else setTab('login');
    });
  }, []);

  useEffect(() => { if (!userData?.rollNumber) return; return onSnapshot(query(collection(db, 'attendance_records'), where('rollNumber', '==', userData.rollNumber.toUpperCase())), (s) => setMyAtt(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))); }, [userData]);
  useEffect(() => { if (!user) return; return onSnapshot(query(collection(db, 'leave_requests'), where('uid', '==', user.uid)), (s) => setLeaveReq(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))); }, [user]);

  useEffect(() => {
    const subs = [
      onSnapshot(collection(db, 'campx_timetable'), (s) => setTT(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campx_notices'), (s) => setNotices(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campx_assignments'), (s) => setAssignments(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'study_materials'), (s) => setMaterials(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campx_exams'), (s) => setExams(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campx_events'), (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campx_notifications'), (s) => setNotifs(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'faculty_directory'), (s) => setFaculty(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campx_fees'), (s) => setFees(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'college_bus'), (s) => setBus(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'placements'), (s) => setPlacements(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'student_achievements'), (s) => setAchievements(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'clubs_activities'), (s) => setClubs(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'certificates'), (s) => setCerts(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'lost_found'), (s) => setLost(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'student_feedback'), (s) => setFeedback(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'academic_performance'), (s) => setPerformance(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'academic_calendar'), (s) => setCalendar(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'smart_reminders'), (s) => setReminders(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'emergency_contacts'), (s) => setEmergency(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'college_updates'), (s) => setUpdates(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  const handleLogin = async () => { const r = await signInWithPopup(auth, provider); const u = r.user; const ex = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid))); if (ex.empty) { await addDoc(collection(db, 'campx_users'), { uid: u.uid, email: u.email, name: u.displayName, photoURL: u.photoURL, rollNumber: roll.toUpperCase(), dept: 'CSE', section: 'A', role: 'student', createdAt: serverTimestamp() }); } window.location.reload(); };
  const handleSetup = async () => { if (!roll.trim()) { showToast('Enter Roll'); return; } const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', user.uid))); if (snap.empty) { await addDoc(collection(db, 'campx_users'), { uid: user.uid, email: user.email, name: user.displayName, photoURL: user.photoURL, rollNumber: roll.toUpperCase(), dept: 'CSE', section: 'A', role: 'student', createdAt: serverTimestamp() }); } else { await updateDoc(doc(db, 'campx_users', snap.docs[0].id), { rollNumber: roll.toUpperCase() }); } window.location.reload(); };
  const handleLeave = async () => { if (!leaveReason.trim()) { showToast('Enter reason'); return; } await addDoc(collection(db, 'leave_requests'), { uid: user.uid, rollNumber: userData.rollNumber, name: userData.name, reason: leaveReason, date: leaveDate, status: 'Pending', createdAt: serverTimestamp() }); showToast('Leave Request Sent'); setLeaveReason(''); };

  const total = myAtt.length; const present = myAtt.filter((a: any) => a.isPresent).length; const overall = total ? Math.round((present / total) * 100) : 0; const overallCalc = calc75(present, total); const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }); const todayTT = tt.filter((t: any) => t.day === todayName);

  const menuItems = [
    { id: 'home', icon: '🏠', label: 'Home Dashboard' },
    { id: 'attendance', icon: '📊', label: 'Attendance' },
    { id: 'timetable', icon: '🕐', label: 'Timetable' },
    { id: 'notices', icon: '📢', label: 'Notices' },
    { id: 'assignments', icon: '📝', label: 'Assignments' },
    { id: 'materials', icon: '📚', label: 'Study Materials' },
    { id: 'exams', icon: '🗓️', label: 'Exam Schedule' },
    { id: 'events', icon: '🎉', label: 'College Events' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
    { id: 'leave', icon: '📝', label: 'Leave Request' },
    { id: 'faculty', icon: '👨‍🏫', label: 'Faculty Directory' },
    { id: 'fees', icon: '💰', label: 'Fee Status' },
    { id: 'bus', icon: '🚌', label: 'College Bus' },
    { id: 'placements', icon: '💼', label: 'Placements' },
    { id: 'achievements', icon: '🏆', label: 'Achievements' },
    { id: 'clubs', icon: '🏫', label: 'Clubs & Activities' },
    { id: 'certs', icon: '📄', label: 'Certificates' },
    { id: 'lost', icon: '🔎', label: 'Lost & Found' },
    { id: 'feedback', icon: '💬', label: 'Student Feedback' },
    { id: 'performance', icon: '📊', label: 'Academic Performance' },
    { id: 'calendar', icon: '📅', label: 'Academic Calendar' },
    { id: 'reminders', icon: '🔔', label: 'Smart Reminders' },
    { id: 'emergency', icon: '🆘', label: 'Emergency Contacts' },
    { id: 'updates', icon: '📰', label: 'College Updates' },
    { id: 'profile', icon: '👤', label: 'Student Profile' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  if (tab === 'login') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[24px] p-8">
          <div className="w-12 h-12 bg-white text-black rounded-[14px] flex items-center justify-center font-black">C</div>
          <h1 className="text-[24px] font-black mt-4">🔐 Student Login</h1>
          <p className="text-[12px] text-white/40 mt-1">CampX Black • Real</p>
          <input value={roll} onChange={(e) => setRoll(e.target.value.toUpperCase())} placeholder="Roll e.g. 21CS101" className="w-full mt-6 p-4 bg-black border border-white/10 rounded-[12px] uppercase font-bold text-[13px]" />
          <button onClick={handleLogin} className="w-full mt-4 py-4 rounded-full bg-white text-black font-bold">Continue with Google</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-50">{toast}</div>}
      <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 z-30">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex justify-between items-center">
          <div className="flex gap-3 items-center"><button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 bg-white/10 rounded-full">☰</button><div className="w-8 h-8 bg-white text-black rounded-[10px] flex items-center justify-center font-black text-[12px]">C</div><p className="font-bold text-[14px]">CampX Black</p></div>
          <div className="flex gap-2 items-center"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${overallCalc.safe ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{overall}%</span><img src={userData?.photoURL} className="w-8 h-8 rounded-full" alt="" /></div>
        </div>
      </div>
      {showMenu && (
        <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setShowMenu(false)}>
          <div className="w-[300px] h-full bg-[#111] border-r border-white/10 p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-3 items-center pb-4 border-b border-white/10"><img src={userData?.photoURL} className="w-10 h-10 rounded-full" alt="" /><div><p className="font-bold text-[13px]">{userData?.name}</p><p className="text-[11px] text-white/40">{userData?.rollNumber} • {userData?.dept}</p></div></div>
            <div className="mt-4 space-y-1">
              {menuItems.map((m) => <button key={m.id} onClick={() => { setTab(m.id); setShowMenu(false); }} className={`w-full text-left px-3 py-2.5 rounded-[12px] text-[12px] flex gap-3 items-center ${tab === m.id ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/60 border border-white/5'}`}><span>{m.icon}</span>{m.label}</button>)}
              <button onClick={async () => { await signOut(auth); window.location.reload(); }} className="w-full text-left px-3 py-3 rounded-[12px] text-[12px] flex gap-3 items-center bg-red-600 text-white font-bold mt-4"><span>🚪</span>Logout</button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-[600px] mx-auto p-3 pb-24 space-y-3">
        {tab === 'home' && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-[20px] p-5">
              <p className="text-[11px] font-bold text-white/40">🏠 HOME DASHBOARD</p>
              <p className="font-black text-[18px] mt-2">Hi, {userData?.name?.split(' ')[0]} 👋</p>
              <p className="text-[12px] text-white/40">{userData?.rollNumber} • {todayName}</p>
              <div className="mt-4 bg-white text-black rounded-[14px] p-4 flex justify-between items-center"><div><p className="text-[11px] text-black/40">Overall Attendance</p><p className="text-[24px] font-black mt-1">{overall}%</p><p className="text-[11px] text-black/60 mt-1">{overallCalc.safe ? `Can miss ${overallCalc.miss}` : `Need ${overallCalc.need} more`}</p></div><div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-white ${overallCalc.safe ? 'bg-green-600' : 'bg-red-600'}`}>{overall}%</div></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setTab('attendance')} className="bg-white/5 border border-white/10 rounded-[16px] p-4 text-left"><p className="text-[20px]">📊</p><p className="font-bold text-[12px] mt-1">Attendance</p><p className="text-[10px] text-white/40">{total} classes</p></button>
              <button onClick={() => setTab('leave')} className="bg-white/5 border border-white/10 rounded-[16px] p-4 text-left"><p className="text-[20px]">📝</p><p className="font-bold text-[12px] mt-1">Leave Request</p><p className="text-[10px] text-white/40">{leaveReq.length} requests</p></button>
              <button onClick={() => setTab('faculty')} className="bg-white/5 border border-white/10 rounded-[16px] p-4 text-left"><p className="text-[20px]">👨‍🏫</p><p className="font-bold text-[12px] mt-1">Faculty</p><p className="text-[10px] text-white/40">{faculty.length}</p></button>
              <button onClick={() => setTab('fees')} className="bg-white/5 border border-white/10 rounded-[16px] p-4 text-left"><p className="text-[20px]">💰</p><p className="font-bold text-[12px] mt-1">Fee Status</p><p className="text-[10px] text-white/40">{fees.length} records</p></button>
            </div>
          </>
        )}
        {tab === 'attendance' && (
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-[20px] p-5"><p className="font-bold">📊 Attendance - Real</p><div className="mt-4 bg-white text-black rounded-[14px] p-4 flex justify-between"><div><p className="text-[11px] text-black/40">Overall</p><p className="text-[24px] font-black">{overall}%</p></div><div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white ${overallCalc.safe ? 'bg-green-600' : 'bg-red-600'}`}>{overall}%</div></div></div>
            {['DBMS', 'OS', 'CN', 'SE', 'DAA'].map((sub) => { const subAtt = myAtt.filter((a: any) => a.subject === sub); const p = subAtt.filter((a: any) => a.isPresent).length; const t = subAtt.length; const c = calc75(p, t); return <div key={sub} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{sub}</p><p className="text-[11px] text-white/40">{p}/{t} • {t ? (c.safe ? `Can miss ${c.miss}` : `Need ${c.need}`) : 'No data'}</p></div><span className={`px-3 py-1.5 rounded-full text-[12px] font-bold ${t === 0 ? 'bg-white/5 text-white/20' : c.safe ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{t ? `${c.cur}%` : '--'}</span></div>; })}
          </div>
        )}
        {tab === 'timetable' && <div className="space-y-2">{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => <div key={day} className={`bg-white/5 border rounded-[16px] p-4 ${day === todayName ? 'border-white border-2' : 'border-white/10'}`}><p className="font-bold text-[13px]">{day} {day === todayName && '• Today'}</p><div className="mt-2 space-y-1">{tt.filter((t: any) => t.day === day).map((t: any) => <div key={t.id} className="flex justify-between bg-white/5 rounded-[10px] p-2.5 text-[12px]"><span className="font-bold">{t.time} {t.subject}</span><span className="text-white/40">{t.room}</span></div>)}</div></div>)}</div>}
        {tab === 'notices' && <div className="space-y-2">{notices.map((n: any) => <div key={n.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{n.title}</p><p className="text-[11px] text-white/40 mt-1">{n.desc}</p></div>)}</div>}
        {tab === 'assignments' && <div className="space-y-2">{assignments.map((a: any) => <div key={a.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{a.title}</p><p className="text-[11px] text-white/40">{a.subject} • Due: {a.dueDate}</p></div>)}</div>}
        {tab === 'materials' && <div className="space-y-2">{materials.map((m: any) => <div key={m.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{m.subject} - {m.title}</p></div><a href={m.link} target="_blank" className="px-4 py-2 bg-white text-black rounded-full text-[11px] font-bold">Open</a></div>)}</div>}

                {tab === 'exams' && <div className="space-y-2">{exams.map((e: any) => <div key={e.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{e.subject} - {e.type}</p><p className="text-[11px] text-white/40">Date: {e.date} • Time: {e.time} • Room: {e.room}</p></div>)}</div>}
        {tab === 'events' && <div className="space-y-2">{events.map((e: any) => <div key={e.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{e.title}</p><p className="text-[11px] text-white/40">{e.date} • {e.location}</p></div>)}</div>}
        {tab === 'notifications' && <div className="space-y-2">{notifs.map((n: any) => <div key={n.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{n.title}</p><p className="text-[11px] text-white/40">{n.body}</p></div>)}</div>}

        {tab === 'leave' && (
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-[20px] p-5"><p className="font-bold">📝 Leave Request – Online Apply + Status</p><input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className="w-full mt-4 p-3 bg-black border border-white/10 rounded-[12px] text-[12px]" /><textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Reason e.g. Medical leave" className="w-full mt-2 p-3 bg-black border border-white/10 rounded-[12px] text-[12px] h-24" /><button onClick={handleLeave} className="w-full mt-3 py-3 rounded-full bg-white text-black font-bold text-[12px]">Submit Leave Request</button></div>
            <div className="space-y-2">{leaveReq.map((l: any) => <div key={l.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[12px]">{l.reason}</p><p className="text-[10px] text-white/40">{l.date}</p></div><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${l.status === 'Approved' ? 'bg-green-500/20 text-green-400' : l.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{l.status}</span></div>)}</div>
          </div>
        )}

        {tab === 'faculty' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">👨‍🏫 Faculty Directory</p><p className="text-[11px] text-white/40">Name, Subject, Department</p></div>{faculty.map((f: any) => <div key={f.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex gap-3"><div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">👨‍🏫</div><div><p className="font-bold text-[13px]">{f.name}</p><p className="text-[11px] text-white/40">{f.subject} • {f.department}</p><p className="text-[10px] text-white/30">{f.email || ''}</p></div></div>)}</div>}

        {tab === 'fees' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">💰 Fee Status – Paid / Pending</p></div>{fees.map((f: any) => <div key={f.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{f.type}</p><p className="text-[11px] text-white/40">{f.dueDate} • {f.status || 'Pending'}</p></div><p className={`font-black ${f.status === 'Paid' ? 'text-green-400' : 'text-yellow-400'}`}>₹{f.amount}</p></div>)}</div>}

        {tab === 'bus' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🚌 College Bus – Routes, Timings</p></div>{bus.map((b: any) => <div key={b.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">Bus {b.busNo} - {b.route}</p><p className="text-[11px] text-white/40">Timings: {b.timing} • Driver: {b.driver}</p><p className="text-[10px] text-white/30">{b.stops || ''}</p></div>)}</div>}

        {tab === 'placements' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">💼 Placements – Company, Eligibility, Drives</p></div>{placements.map((p: any) => <div key={p.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{p.company} - {p.role}</p><p className="text-[11px] text-white/40">Eligibility: {p.eligibility} • Package: {p.package}</p><p className="text-[10px] text-white/30 mt-1">{p.date} • {p.status || 'Open'}</p></div>)}</div>}

        {tab === 'achievements' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🏆 Student Achievements – Certificates, Awards</p></div>{achievements.map((a: any) => <div key={a.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{a.title}</p><p className="text-[11px] text-white/40">{a.type} • {a.date}</p><p className="text-[10px] text-white/30">{a.desc}</p></div>)}</div>}

        {tab === 'clubs' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🏫 Clubs & Activities</p></div>{clubs.map((c: any) => <div key={c.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{c.name} • {c.type}</p><p className="text-[11px] text-white/40">Members: {c.members} • Lead: {c.lead}</p><p className="text-[10px] text-white/30 mt-1">{c.desc}</p></div>)}</div>}

                {tab === 'certs' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">📄 Certificates – Request + Status</p></div>{certs.map((c: any) => <div key={c.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[12px]">{c.type}</p><p className="text-[10px] text-white/40">{c.date} • {c.reason}</p></div><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${c.status === 'Issued' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{c.status}</span></div>)}</div>}

        {tab === 'lost' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🔎 Lost & Found – Report and Search</p></div>{lost.map((l: any) => <div key={l.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{l.item} - {l.status || 'Lost'}</p><p className="text-[11px] text-white/40">{l.location} • {l.date} • by {l.reportedBy}</p><p className="text-[10px] text-white/30">{l.desc}</p></div>)}</div>}

        {tab === 'feedback' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">💬 Student Feedback – College/Faculty/Service</p><p className="text-[11px] text-white/40">College, faculty feedback submit chey</p></div>{feedback.map((f: any) => <div key={f.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[12px]">{f.category} • {f.rating}⭐</p><p className="text-[11px] text-white/40">{f.message}</p></div>)}</div>}

        {tab === 'performance' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">📊 Academic Performance – Marks + Semester</p></div>{performance.map((p: any) => <div key={p.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{p.subject} - {p.sem}</p><p className="text-[11px] text-white/40">Marks: {p.marks} • Grade: {p.grade}</p></div><span className="text-[12px] font-bold">{p.sgpa || ''}</span></div>)}</div>}

        {tab === 'calendar' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">📅 Academic Calendar – Holidays, Exams, Events</p></div>{calendar.map((c: any) => <div key={c.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{c.title} - {c.type}</p><p className="text-[11px] text-white/40">{c.date} • {c.desc}</p></div>)}</div>}

        {tab === 'reminders' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🔔 Smart Reminders – Attendance, Assignments, Exams</p></div>{reminders.map((r: any) => <div key={r.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[12px]">{r.title} • {r.type}</p><p className="text-[11px] text-white/40">{r.due} • {r.message}</p></div>)}</div>}

        {tab === 'emergency' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🆘 Emergency Contacts – College/Security/Medical</p></div>{emergency.map((e: any) => <div key={e.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{e.name} - {e.dept}</p><p className="text-[11px] text-white/40">{e.phone} • {e.location}</p></div><a href={`tel:${e.phone}`} className="px-4 py-2 bg-red-600 text-white rounded-full text-[11px] font-bold">Call</a></div>)}</div>}

        {tab === 'updates' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">📰 College Updates – Achievements, Announcements, Campus News</p></div>{updates.map((u: any) => <div key={u.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{u.title}</p><p className="text-[11px] text-white/40 mt-1">{u.desc}</p><p className="text-[10px] text-white/20 mt-1">{u.date}</p></div>)}</div>}

        {tab === 'profile' && (
          <div className="bg-white/5 border border-white/10 rounded-[20px] p-5">
            <p className="font-bold">👤 Student Profile</p>
            <div className="flex gap-4 mt-4"><img src={userData?.photoURL} className="w-16 h-16 rounded-full" alt="" /><div><p className="font-bold text-[16px]">{userData?.name}</p><p className="text-[12px] text-white/40">{userData?.rollNumber}</p><p className="text-[11px] text-white/30">{userData?.email}</p><p className="text-[10px] text-white/20 mt-1">{userData?.dept}-{userData?.section}</p></div></div>
            <div className="grid grid-cols-3 gap-2 mt-6"><div className="bg-black border border-white/10 rounded-[12px] p-3 text-center"><p className="font-black text-[18px]">{overall}%</p><p className="text-[9px] text-white/40">ATTENDANCE</p></div><div className="bg-black border border-white/10 rounded-[12px] p-3 text-center"><p className="font-black text-[18px]">{total}</p><p className="text-[9px] text-white/40">CLASSES</p></div><div className="bg-black border border-white/10 rounded-[12px] p-3 text-center"><p className="font-black text-[18px]">{present}</p><p className="text-[9px] text-white/40">PRESENT</p></div></div>
            <button onClick={async () => { await signOut(auth); window.location.reload(); }} className="w-full mt-6 py-3 rounded-full bg-red-600 text-white font-bold">🚪 Logout</button>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-[20px] p-5"><p className="font-bold">⚙️ Settings + Logout</p><div className="mt-4 space-y-2"><div className="flex justify-between bg-black border border-white/10 rounded-[12px] p-3"><span className="text-[13px] text-white/60">Roll</span><span className="font-bold text-[13px]">{userData?.rollNumber}</span></div><div className="flex justify-between bg-black border border-white/10 rounded-[12px] p-3"><span className="text-[13px] text-white/60">Dept</span><span className="font-bold text-[13px]">{userData?.dept}-{userData?.section}</span></div></div><button onClick={async () => { await signOut(auth); window.location.reload(); }} className="w-full mt-6 py-4 rounded-full bg-red-600 text-white font-bold">🚪 Logout from CampX Black</button><p className="text-[10px] text-white/20 text-center mt-4">© 2026 CampX Black • ANESH • Black UI</p></div>
          </div>
        )}
      </div>
      <div className="w-full py-6 flex justify-center border-t border-white/10 mt-6"><p className="text-[10px] tracking-widest text-white/20">© 2026 CampX Black • ANESH</p></div>
    </div>
  );
}
