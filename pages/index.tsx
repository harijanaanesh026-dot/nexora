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
  if (cur >= 75) {
    const miss = Math.floor((100 * a - 75 * t) / 75);
    return { cur: Math.round(cur), need: 0, miss: miss < 0 ? 0 : miss, safe: true };
  } else {
    const need = Math.ceil((75 * t - 100 * a) / 25);
    return { cur: Math.round(cur), need: need < 0 ? 0 : need, miss: 0, safe: false };
  }
};

export default function CampXFinal() {
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
  const [roll, setRoll] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u: any) => {
      if (u) {
        setUser(u);
        const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid)));
        if (snap.empty) setTab('login');
        else { const d = snap.docs[0].data() as any; setUserData({ id: snap.docs[0].id, ...d }); setRoll(d.rollNumber || ''); setTab('home'); }
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
    const u1 = onSnapshot(collection(db, 'campx_timetable'), (s) => setTT(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    const u2 = onSnapshot(collection(db, 'campx_notices'), (s) => setNotices(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    const u3 = onSnapshot(collection(db, 'campx_assignments'), (s) => setAssignments(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    const u4 = onSnapshot(collection(db, 'study_materials'), (s) => setMaterials(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    const u5 = onSnapshot(collection(db, 'campx_exams'), (s) => setExams(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    const u6 = onSnapshot(collection(db, 'campx_events'), (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    const u7 = onSnapshot(collection(db, 'campx_notifications'), (s) => setNotifs(s.docs.map((d) => ({ id: d.id, ...d.data() } as any))));
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); };
  }, []);

  const handleLogin = async () => {
    const r = await signInWithPopup(auth, provider);
    const u = r.user;
    const ex = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', u.uid)));
    if (ex.empty) {
      await addDoc(collection(db, 'campx_users'), { uid: u.uid, email: u.email, name: u.displayName, photoURL: u.photoURL, rollNumber: '', dept: 'CSE', section: 'A', role: 'student', createdAt: serverTimestamp() });
    }
    window.location.reload();
  };

  const handleSetup = async () => {
    if (!roll.trim()) { showToast('Enter Roll'); return; }
    const snap = await getDocs(query(collection(db, 'campx_users'), where('uid', '==', user.uid)));
    if (snap.empty) {
      await addDoc(collection(db, 'campx_users'), { uid: user.uid, email: user.email, name: user.displayName, photoURL: user.photoURL, rollNumber: roll.toUpperCase(), dept: 'CSE', section: 'A', role: 'student', createdAt: serverTimestamp() });
    } else {
      await updateDoc(doc(db, 'campx_users', snap.docs[0].id), { rollNumber: roll.toUpperCase() });
    }
    window.location.reload();
  };

  const total = myAtt.length;
  const present = myAtt.filter((a: any) => a.isPresent).length;
  const overall = total ? Math.round((present / total) * 100) : 0;
  const overallCalc = calc75(present, total);
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayTT = tt.filter((t: any) => t.day === todayName);

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
    { id: 'profile', icon: '👤', label: 'Student Profile' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  if (tab === 'login') {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white border rounded-[24px] p-8 shadow-xl">
          <div className="w-12 h-12 bg-black text-white rounded-[14px] flex items-center justify-center font-black">C</div>
          <h1 className="text-[24px] font-black mt-4">🔐 Student Login</h1>
          <p className="text-[12px] text-black/50 mt-1">CampX - Real College App</p>
          <input value={roll} onChange={(e) => setRoll(e.target.value.toUpperCase())} placeholder="Roll Number e.g. 21CS101" className="w-full mt-6 p-4 bg-[#F8F9FA] border rounded-[12px] uppercase font-bold text-[13px]" />
          <button onClick={handleLogin} className="w-full mt-4 py-4 rounded-full bg-black text-white font-bold text-[13px]">Continue with Google</button>
          <p className="text-[10px] text-black/30 text-center mt-4">Roll enter chesi login avvu - Real attendance</p>
        </div>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-2 rounded-full text-xs font-bold">{toast}</div>}
      </div>
    );
  }

  if (roll === '' && user && !userData?.rollNumber) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white border rounded-[24px] p-8 shadow-xl">
          <h2 className="font-black text-[18px]">Enter Roll Number</h2>
          <input value={roll} onChange={(e) => setRoll(e.target.value.toUpperCase())} placeholder="21CS101" className="w-full mt-5 p-4 bg-[#F8F9FA] border rounded-[12px] uppercase font-bold" />
          <button onClick={handleSetup} className="w-full mt-4 py-4 rounded-full bg-black text-white font-bold">Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-black">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-2 rounded-full text-xs font-bold z-50">{toast}</div>}
      <div className="sticky top-0 bg-white border-b z-30">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex justify-between items-center">
          <div className="flex gap-3 items-center"><button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 bg-[#F8F9FA] border rounded-full">☰</button><div className="w-8 h-8 bg-black text-white rounded-[10px] flex items-center justify-center font-black text-[12px]">C</div><p className="font-bold text-[14px]">CampX</p></div>
          <div className="flex gap-2 items-center"><span className="text-[10px] bg-black text-white px-2 py-1 rounded-full">{overall}%</span><img src={userData?.photoURL} className="w-8 h-8 rounded-full" alt="" /></div>
        </div>
      </div>
      {showMenu && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowMenu(false)}>
          <div className="w-[280px] h-full bg-white p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-3 items-center pb-4 border-b"><img src={userData?.photoURL} className="w-10 h-10 rounded-full" alt="" /><div><p className="font-bold text-[13px]">{userData?.name}</p><p className="text-[11px] text-black/50">{userData?.rollNumber} • {userData?.dept}</p></div></div>
            <div className="mt-4 space-y-1">
              {menuItems.map((m) => <button key={m.id} onClick={() => { setTab(m.id); setShowMenu(false); }} className={`w-full text-left px-3 py-3 rounded-[12px] text-[13px] flex gap-3 items-center ${tab === m.id ? 'bg-black text-white font-bold' : 'bg-[#F8F9FA] border text-black/70'}`}><span>{m.icon}</span>{m.label}</button>)}
            </div>
          </div>
        </div>
      )}
      <div className="max-w-[600px] mx-auto p-3 pb-24 space-y-3">
        {tab === 'home' && (
          <>
            <div className="bg-white border rounded-[20px] p-5">
              <p className="text-[11px] font-bold text-black/40">🏠 HOME DASHBOARD</p>
              <p className="font-black text-[18px] mt-2">Hi, {userData?.name?.split(' ')[0]} 👋</p>
              <p className="text-[12px] text-black/50">{userData?.rollNumber} • {todayName}</p>
              <div className="mt-4 bg-black text-white rounded-[14px] p-4 flex justify-between items-center"><div><p className="text-[11px] text-white/60">Overall Attendance</p><p className="text-[24px] font-black mt-1">{overall}%</p><p className="text-[11px] text-white/60 mt-1">{overallCalc.safe ? `Can miss ${overallCalc.miss}` : `Need ${overallCalc.need} more`}</p></div><div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-[14px] ${overallCalc.safe ? 'bg-green-500' : 'bg-red-500'}`}>{overall}%</div></div>
              {todayTT.length > 0 && <div className="mt-4 bg-[#F8F9FA] border rounded-[12px] p-3"><p className="text-[11px] font-bold">Next Class Today</p><p className="text-[13px] font-bold mt-1">{todayTT[0]?.subject} • {todayTT[0]?.time}</p><p className="text-[11px] text-black/50">Room: {todayTT[0]?.room}</p></div>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setTab('attendance')} className="bg-white border rounded-[16px] p-4 text-left"><p className="text-[20px]">📊</p><p className="font-bold text-[12px] mt-1">Attendance</p><p className="text-[10px] text-black/40">{total} classes</p></button>
              <button onClick={() => setTab('timetable')} className="bg-white border rounded-[16px] p-4 text-left"><p className="text-[20px]">🕐</p><p className="font-bold text-[12px] mt-1">Timetable</p><p className="text-[10px] text-black/40">Today {todayTT.length}</p></button>
              <button onClick={() => setTab('notices')} className="bg-white border rounded-[16px] p-4 text-left"><p className="text-[20px]">📢</p><p className="font-bold text-[12px] mt-1">Notices</p><p className="text-[10px] text-black/40">{notices.length} new</p></button>
              <button onClick={() => setTab('assignments')} className="bg-white border rounded-[16px] p-4 text-left"><p className="text-[20px]">📝</p><p className="font-bold text-[12px] mt-1">Assignments</p><p className="text-[10px] text-black/40">{assignments.length} due</p></button>
            </div>
          </>
        )}
        {tab === 'attendance' && (
          <div className="space-y-3">
            <div className="bg-white border rounded-[20px] p-5"><p className="font-bold">📊 Attendance - Real</p><p className="text-[11px] text-black/40 mt-1">Roll: {userData?.rollNumber} • Every class marked</p><div className="mt-4 bg-black text-white rounded-[14px] p-4 flex justify-between"><div><p className="text-[11px] text-white/60">Overall</p><p className="text-[24px] font-black">{overall}%</p><p className="text-[11px] text-white/60">{overallCalc.safe ? `Can miss ${overallCalc.miss}` : `Need ${overallCalc.need} more`}</p></div><div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${overallCalc.safe ? 'bg-green-500' : 'bg-red-500'}`}>{overall}%</div></div></div>
            {['DBMS', 'OS', 'CN', 'SE', 'DAA'].map((sub) => { const subAtt = myAtt.filter((a: any) => a.subject === sub); const p = subAtt.filter((a: any) => a.isPresent).length; const t = subAtt.length; const c = calc75(p, t); return <div key={sub} className="bg-white border rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{sub}</p><p className="text-[11px] text-black/50">{p}/{t} • {t ? (c.safe ? `Can miss ${c.miss}` : `Need ${c.need}`) : 'No data'}</p></div><span className={`px-3 py-1.5 rounded-full text-[12px] font-bold ${t === 0 ? 'bg-[#F8F9FA] text-black/20' : c.safe ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t ? `${c.cur}%` : '--'}</span></div>; })}
          </div>
        )}
        {tab === 'timetable' && (
          <div className="space-y-2">
            <div className="bg-white border rounded-[16px] p-4"><p className="font-bold">🕐 Timetable - {todayName}</p></div>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => <div key={day} className={`bg-white border rounded-[16px] p-4 ${day === todayName ? 'border-black border-2' : ''}`}><p className="font-bold text-[13px]">{day} {day === todayName && '• Today'}</p><div className="mt-2 space-y-1">{tt.filter((t: any) => t.day === day).map((t: any) => <div key={t.id} className="flex justify-between bg-[#F8F9FA] rounded-[10px] p-2.5 text-[12px]"><span className="font-bold">{t.time} {t.subject}</span><span className="text-black/50">{t.room}</span></div>)}{tt.filter((t: any) => t.day === day).length === 0 && <p className="text-[11px] text-black/20">No classes</p>}</div></div>)}
          </div>
        )}
        {tab === 'notices' && <div className="space-y-2"><div className="bg-white border rounded-[16px] p-4"><p className="font-bold">📢 Notices</p></div>{notices.map((n: any) => <div key={n.id} className="bg-white border rounded-[16px] p-4"><p className="font-bold text-[13px]">{n.title}</p><p className="text-[11px] text-black/60 mt-1">{n.desc}</p></div>)}{notices.length === 0 && <p className="text-center py-16 text-black/20">No notices</p>}</div>}
        {tab === 'assignments' && <div className="space-y-2"><div className="bg-white border rounded-[16px] p-4"><p className="font-bold">📝 Assignments</p></div>{assignments.map((a: any) => <div key={a.id} className="bg-white border rounded-[16px] p-4"><p className="font-bold text-[13px]">{a.title}</p><p className="text-[11px] text-black/50 mt-1">{a.subject} • Due: {a.dueDate}</p><p className="text-[11px] mt-2">{a.desc}</p></div>)}{assignments.length === 0 && <p className="text-center py-16 text-black/20">No assignments</p>}</div>}

                {tab === 'materials' && <div className="space-y-2"><div className="bg-white border rounded-[16px] p-4"><p className="font-bold">📚 Study Materials</p></div>{materials.map((m: any) => <div key={m.id} className="bg-white border rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{m.subject} - {m.title}</p><p className="text-[11px] text-black/50">by {m.uploadedBy || 'Faculty'}</p></div><a href={m.link} target="_blank" className="px-4 py-2 bg-black text-white rounded-full text-[11px] font-bold">Open</a></div>)}{materials.length === 0 && <p className="text-center py-16 text-black/20">No materials</p>}</div>}

        {tab === 'exams' && <div className="space-y-2"><div className="bg-white border rounded-[16px] p-4"><p className="font-bold">🗓️ Exam Schedule</p></div>{exams.map((e: any) => <div key={e.id} className="bg-white border rounded-[16px] p-4"><p className="font-bold text-[13px]">{e.subject} - {e.type || 'Exam'}</p><p className="text-[11px] text-black/50 mt-1">Date: {e.date} • Time: {e.time}</p><p className="text-[11px] mt-1">Room: {e.room || ''}</p></div>)}{exams.length === 0 && <p className="text-center py-16 text-black/20">No exam schedule</p>}</div>}

        {tab === 'events' && <div className="space-y-2"><div className="bg-white border rounded-[16px] p-4"><p className="font-bold">🎉 College Events</p></div>{events.map((e: any) => <div key={e.id} className="bg-white border rounded-[16px] p-4"><p className="font-bold text-[13px]">{e.title}</p><p className="text-[11px] text-black/50 mt-1">{e.date} • {e.location || ''}</p><p className="text-[11px] mt-2">{e.desc || ''}</p></div>)}{events.length === 0 && <p className="text-center py-16 text-black/20">No events</p>}</div>}

        {tab === 'notifications' && <div className="space-y-2"><div className="bg-white border rounded-[16px] p-4"><p className="font-bold">🔔 Notifications • {notifs.length}</p></div>{notifs.map((n: any) => <div key={n.id} className="bg-white border rounded-[16px] p-4"><p className="font-bold text-[13px]">{n.title}</p><p className="text-[11px] text-black/60 mt-1">{n.body}</p></div>)}{notifs.length === 0 && <p className="text-center py-16 text-black/20">No notifications</p>}</div>}

        {tab === 'profile' && (
          <div className="bg-white border rounded-[20px] p-5">
            <p className="font-bold">👤 Student Profile</p>
            <div className="flex gap-4 mt-4"><img src={userData?.photoURL} className="w-16 h-16 rounded-full" alt="" /><div><p className="font-bold text-[16px]">{userData?.name}</p><p className="text-[12px] text-black/50">{userData?.rollNumber}</p><p className="text-[11px] text-black/40">{userData?.email}</p><p className="text-[10px] text-black/30 mt-1">{userData?.dept}-{userData?.section}</p></div></div>
            <div className="grid grid-cols-3 gap-2 mt-6"><div className="bg-[#F8F9FA] border rounded-[12px] p-3 text-center"><p className="font-black text-[18px]">{overall}%</p><p className="text-[9px] text-black/40">ATTENDANCE</p></div><div className="bg-[#F8F9FA] border rounded-[12px] p-3 text-center"><p className="font-black text-[18px]">{total}</p><p className="text-[9px] text-black/40">CLASSES</p></div><div className="bg-[#F8F9FA] border rounded-[12px] p-3 text-center"><p className="font-black text-[18px]">{present}</p><p className="text-[9px] text-black/40">PRESENT</p></div></div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-3">
            <div className="bg-white border rounded-[20px] p-5"><p className="font-bold">⚙️ Settings</p><div className="mt-4 space-y-2"><div className="flex justify-between bg-[#F8F9FA] border rounded-[12px] p-3"><span className="text-[13px]">Roll Number</span><span className="font-bold text-[13px]">{userData?.rollNumber}</span></div><div className="flex justify-between bg-[#F8F9FA] border rounded-[12px] p-3"><span className="text-[13px]">Department</span><span className="font-bold text-[13px]">{userData?.dept}-{userData?.section}</span></div><div className="flex justify-between bg-[#F8F9FA] border rounded-[12px] p-3"><span className="text-[13px]">Email</span><span className="text-[11px]">{userData?.email}</span></div></div><button onClick={async () => { await signOut(auth); window.location.reload(); }} className="w-full mt-6 py-3 rounded-full bg-red-600 text-white font-bold">Logout</button><p className="text-[10px] text-black/30 text-center mt-4">© 2026 CampX • v2.0 • ANESH</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
