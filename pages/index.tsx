import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, getDocs, deleteDoc, orderBy, increment, arrayUnion } from 'firebase/firestore';

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

const formatDate = (ts:any) => {
  if(!ts) return "now";
  try{ const m=ts.toMillis?.()||ts.seconds*1000||Date.now(); return new Date(m).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch{ return "now"; }
};

const calculateNeed = (att:number, tot:number, req=75) => {
  if(tot===0) return {cur:0, need:0, bunk:0, status:"No data", safe:false};
  const cur=(att/tot)*100;
  if(cur<req){ const need=Math.ceil((req*tot-100*att)/(100-req)); return {cur:Math.round(cur*10)/10, need:need<0?0:need, bunk:0, status:`Need ${need} more`, safe:false}; }
  else{ const bunk=Math.floor((100*att-req*tot)/req); return {cur:Math.round(cur*10)/10, need:0, bunk:bunk<0?0:bunk, status:`Can bunk ${bunk}`, safe:true}; }
};

const Footer = () => <div className="w-full py-6 flex justify-center border-t border-white/[0.06] mt-6"><p className="text-[10px] tracking-[0.2em] text-white/30">© 2026 CampX • ANESH</p></div>;

export default function CampXV2(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [activeTab,setActiveTab]=useState('feed');
  const [toast,setToast]=useState('');
  const [feed,setFeed]=useState<any[]>([]);
  const [timetable,setTimetable]=useState<any[]>([]);
  const [attendance,setAttendance]=useState<any[]>([]);
  const [materials,setMaterials]=useState<any[]>([]);
  const [events,setEvents]=useState<any[]>([]);
  const [market,setMarket]=useState<any[]>([]);
  const [lostFound,setLostFound]=useState<any[]>([]);
  const [doubts,setDoubts]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [chats,setChats]=useState<any[]>([]);
  const [notifications,setNotifications]=useState<any[]>([]);
  const [newPost,setNewPost]=useState('');
  const [postType,setPostType]=useState('general');
  const [showCreate,setShowCreate]=useState(false);
  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2500); };

  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){ setUser(u); const s=await getDocs(query(collection(db,'campx_users'),where('uid','==',u.uid))); if(s.empty) setActiveTab('login'); else{ setUserData({id:s.docs[0].id,...s.docs[0].data()}); setActiveTab('feed'); } } else setActiveTab('login');
    });
  },[]);

  useEffect(()=>{
    if(!userData) return;
    // Feed
    const unsub1=onSnapshot(query(collection(db,'campx_feed'),orderBy('createdAt','desc')),s=>setFeed(s.docs.map(d=>({id:d.id,...d.data()} as any))));
    // Timetable
    const unsub2=onSnapshot(collection(db,'campx_timetable'),s=>setTimetable(s.docs.map(d=>({id:d.id,...d.data()} as any))));
    // Attendance
    const unsub3=onSnapshot(query(collection(db,'attendance_records'),where('rollNumber','==',userData.rollNumber?.toUpperCase()||'__')),s=>setAttendance(s.docs.map(d=>({id:d.id,...d.data()} as any))));
    // Materials
    const unsub4=onSnapshot(collection(db,'study_materials'),s=>setMaterials(s.docs.map(d=>({id:d.id,...d.data()} as any))));
    // Events
    const unsub5=onSnapshot(collection(db,'campx_events'),s=>setEvents(s.docs.map(d=>({id:d.id,...d.data()} as any))));
    // Marketplace
    const unsub6=onSnapshot(collection(db,'marketplace'),s=>setMarket(s.docs.map(d=>({id:d.id,...d.data()} as any))));
    // Lost & Found
    const unsub7=onSnapshot(collection(db,'lost_found'),s=>setLostFound(s.docs.map(d=>({id:d.id,...d.data()} as any))));
    // Doubts
    const unsub8=onSnapshot(query(collection(db,'doubts'),orderBy('createdAt','desc')),s=>setDoubts(s.docs.map(d=>({id:d.id,...d.data()} as any))));
    // Leaderboard
    const unsub9=onSnapshot(query(collection(db,'campx_users'),orderBy('yakarma','desc')),s=>setLeaderboard(s.docs.map(d=>({id:d.id,...d.data()} as any)).slice(0,20)));
    // Notifications
    const unsub10=onSnapshot(query(collection(db,'campx_notifications'),where('to','==',userData.rollNumber)),s=>setNotifications(s.docs.map(d=>({id:d.id,...d.data()} as any))));

    return ()=>{ unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsub8(); unsub9(); unsub10(); };
  },[userData]);

  const handleLogin = async()=>{
    try{ const r=await signInWithPopup(auth,provider); const u=r.user; const ex=await getDocs(query(collection(db,'campx_users'),where('uid','==',u.uid))); if(ex.empty){ await addDoc(collection(db,'campx_users'),{uid:u.uid,email:u.email,name:u.displayName,photoURL:u.photoURL,rollNumber:'',dept:'CSE',section:'A',yakarma:100,attendancePercent:0,createdAt:serverTimestamp()}); } window.location.reload(); }catch(e:any){ showToast(e.message); }
  };

  const handlePost = async()=>{
    if(!newPost.trim()) return;
    await addDoc(collection(db,'campx_feed'),{text:newPost.trim(),type:postType,uid:user.uid,name:userData.name,photoURL:userData.photoURL,rollNumber:userData.rollNumber,likes:0,comments:0,createdAt:serverTimestamp()});
    setNewPost(''); setShowCreate(false); showToast("Posted ✅");
  };

  const overallAtt = attendance.length? Math.round((attendance.filter((a:any)=>a.isPresent).length/attendance.length)*100 : 0;
  const todayDay = new Date().toLocaleDateString('en-US',{weekday:'long'});
  const todayTT = timetable.filter((t:any)=>t.day===todayDay);

  if(activeTab==='login'){
    return(<div className="min-h-screen bg-black text-white flex items-center justify-center p-6"><div className="w-full max-w-sm bg-white/[0.05] border border-white/[0.1] rounded-[24px] p-8 text-center"><h1 className="text-[32px] font-black">CampX</h1><p className="text-[12px] text-white/40 mt-1">Complete Student Experience</p><div className="mt-6 grid grid-cols-2 gap-2 text-[10px] text-left"><span>✅ Profile</span><span>📚 Feed</span><span>📅 Timetable</span><span>📊 Attendance</span><span>📄 Materials</span><span>🔔 Notifications</span><span>💬 Chat</span><span>🎉 Events</span><span>🛒 Market</span><span>🔍 Lost&Found</span><span>🏆 Leaderboard</span><span>❓ Doubt Zone</span></div><button onClick={handleLogin} className="w-full mt-8 py-4 rounded-full bg-white text-black font-bold">Continue with Google</button></div></div>);
  }

  return(
    <div className="min-h-screen bg-black text-white">
      <style>{`body{background:#000} ::-webkit-scrollbar{display:none}`}</style>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-50">{toast}</div>}
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex justify-between items-center">
          <div className="flex gap-2 items-center"><div className="w-8 h-8 bg-white text-black rounded-[10px] flex items-center justify-center font-black">C</div><p className="font-bold">CampX</p><span className="text-[10px] bg-white/[0.06] px-2 py-1 rounded-full">{overallAtt}% Att</span></div>
          <div className="flex gap-2"><button onClick={()=>setActiveTab('notifications')} className="w-8 h-8 bg-white/[0.06] rounded-full relative">🔔{notifications.length>0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[8px] flex items-center justify-center">{notifications.length}</span>}</button><button onClick={()=>setActiveTab('profile')} className="w-8 h-8 rounded-full overflow-hidden bg-white/[0.06]">{userData?.photoURL ? <img src={userData.photoURL} className="w-full h-full" /> : '👤'}</button></div>
        </div>
        {/* Top Tabs Scroll */}
        <div className="max-w-[600px] mx-auto px-2 pb-2 flex gap-1.5 overflow-x-auto">
          {[
            {id:'feed',label:'Feed'},{id:'timetable',label:'Timetable'},{id:'attendance',label:'Attendance'},{id:'materials',label:'Materials'},{id:'events',label:'Events'},{id:'market',label:'Market'},{id:'lost',label:'Lost&Found'},{id:'doubts',label:'Doubt Zone'},{id:'leaderboard',label:'Top'},
          ].map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border ${activeTab===t.id?'bg-white text-black border-white':'bg-white/[0.04] border-white/[0.06] text-white/40'}`}>{t.label}</button>)}
        </div>
      </div>

      <div className="max-w-[600px] mx-auto p-3 pb-20 space-y-3">
        {/* MY PROFILE */}
        {activeTab==='profile' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] rounded-[20px] p-5">
              <div className="flex gap-4"><img src={userData?.photoURL} className="w-16 h-16 rounded-full" alt="" /><div><p className="font-bold text-[16px]">{userData?.name}</p><p className="text-[12px] text-white/40">{userData?.rollNumber || "Add Roll"} • {userData?.dept}-{userData?.section}</p><p className="text-[10px] text-white/30 mt-1">{userData?.email}</p><p className="text-[10px] text-white/20">{formatDate(userData?.createdAt)}</p></div></div>
              <div className="grid grid-cols-3 gap-2 mt-5"><div className="bg-black/40 border border-white/[0.06] rounded-[12px] p-3 text-center"><p className="text-[18px] font-black">{overallAtt}%</p><p className="text-[9px] text-white/30">ATTENDANCE</p></div><div className="bg-black/40 border border-white/[0.06] rounded-[12px] p-3 text-center"><p className="text-[18px] font-black">{feed.filter((f:any)=>f.uid===user?.uid).length}</p><p className="text-[9px] text-white/30">POSTS</p></div><div className="bg-black/40 border border-white/[0.06] rounded-[12px] p-3 text-center"><p className="text-[18px] font-black">{userData?.yakarma||0}</p><p className="text-[9px] text-white/30">KARMA</p></div></div>
              <button onClick={async()=>{ await signOut(auth); window.location.reload(); }} className="w-full mt-4 py-3 rounded-full bg-red-600 text-white font-bold text-[12px]">Logout</button>
            </div>
            <Footer/>
          </div>
        )}

        {/* CAMPUS FEED */}
        {activeTab==='feed' && (
          <div className="space-y-3">
            <div className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-3 flex gap-3 items-center"><img src={userData?.photoURL} className="w-8 h-8 rounded-full" alt="" /><button onClick={()=>setShowCreate(true)} className="flex-1 text-left px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-[12px] text-white/40">What's happening in campus?</button><button onClick={()=>setShowCreate(true)} className="w-8 h-8 bg-white text-black rounded-full font-black">+</button></div>
            {feed.map((f:any)=><div key={f.id} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><div className="flex gap-2.5"><img src={f.photoURL} className="w-8 h-8 rounded-full" alt="" /><div><p className="font-bold text-[12px]">{f.name} • {f.rollNumber}</p><p className="text-[10px] text-white/40">{formatDate(f.createdAt)} • {f.type}</p></div></div><p className="text-[14px] mt-3 whitespace-pre-wrap">{f.text}</p><div className="flex gap-2 mt-3"><span className="px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full text-[11px]">❤️ {f.likes||0}</span><span className="px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full text-[11px]">💬 {f.comments||0}</span></div></div>)}
            {feed.length===0 && <p className="text-center py-16 text-white/20 text-[12px]">No posts yet - Be first!</p>}
            <Footer/>
          </div>
        )}

        {/* TIMETABLE */}
        {activeTab==='timetable' && (
          <div className="space-y-3">
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-[16px] p-4"><p className="font-bold text-[13px]">Today • {todayDay}</p><div className="mt-3 space-y-2">{todayTT.length? todayTT.map((t:any)=><div key={t.id} className="flex justify-between bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-3"><div><p className="font-bold text-[12px]">{t.subject} • {t.code}</p><p className="text-[10px] text-white/40">{t.time} • {t.room}</p></div><span className="text-[10px] bg-white text-black px-2 py-1 rounded-full h-fit">{t.faculty}</span></div>) : <p className="text-[11px] text-white/20 text-center py-6">No classes today 🎉</p>}</div></div>
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(day=><div key={day} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><p className="font-bold text-[12px]">{day}</p><div className="mt-2 space-y-1">{timetable.filter((t:any)=>t.day===day).map((t:any)=><div key={t.id} className="flex justify-between text-[11px] bg-white/[0.02] rounded-[10px] p-2"><span>{t.time} {t.subject}</span><span className="text-white/40">{t.faculty}</span></div>)}{timetable.filter((t:any)=>t.day===day).length===0 && <p className="text-[11px] text-white/10">Free</p>}</div></div>)}
            <Footer/>
          </div>
        )}

        {/* ATTENDANCE */}
        {activeTab==='attendance' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] rounded-[20px] p-5"><p className="text-[11px] font-bold text-white/40">OVERALL</p><p className={`text-[44px] font-black ${overallAtt>=75?'text-green-400':'text-red-400'}`}>{overallAtt}%</p><p className="text-[11px] text-white/40">{attendance.filter((a:any)=>a.isPresent).length}/{attendance.length} classes • Roll: {userData?.rollNumber}</p><div className="w-full h-2 bg-white/[0.06] rounded-full mt-3"><div className={`h-full ${overallAtt>=75?'bg-green-500':'bg-red-500'}`} style={{width:`${overallAtt}%`}}></div></div></div>
            {["DBMS","OS","CN","SE","DAA"].map(sub=>{ const subAtt=attendance.filter((a:any)=>a.subject===sub); const pres=subAtt.filter((a:any)=>a.isPresent).length; const tot=subAtt.length; const calc=calculateNeed(pres,tot,75); return <div key={sub} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><div className="flex justify-between"><div><p className="font-bold text-[13px]">{sub}</p><p className="text-[10px] text-white/40">{pres}/{tot} • {calc.status}</p></div><span className={`px-3 py-1 rounded-full border text-[12px] font-bold ${tot===0?'bg-white/[0.04] text-white/20':calc.safe?'bg-green-500/10 text-green-400 border-green-500/20':'bg-red-500/10 text-red-400 border-red-500/20'}`}>{tot? `${calc.cur}%` : '—'}</span></div>{tot>0 && <div className="w-full h-2 bg-white/[0.06] rounded-full mt-3"><div className={`h-full ${calc.safe?'bg-green-500':'bg-red-500'}`} style={{width:`${calc.cur}%`}}></div></div>}</div>; })}
            <Footer/>
          </div>
        )}
      </div>

              {/* STUDY MATERIALS */}
        {activeTab==='materials' && (
          <div className="space-y-3">
            <div className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 flex justify-between items-center"><p className="font-bold text-[13px]">Study Materials • PYQ • Notes</p><button onClick={async()=>{ const name=prompt("Subject?"); const link=prompt("Drive Link?"); if(!name||!link) return; await addDoc(collection(db,'study_materials'),{subject:name.toUpperCase(),title:name,link,uploadedBy:userData.name,createdAt:serverTimestamp()}); showToast("Added ✅"); }} className="px-3 py-1.5 bg-white text-black rounded-full text-[11px] font-bold">+ Upload</button></div>
            {materials.map((m:any)=><div key={m.id} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{m.subject} • {m.title}</p><p className="text-[10px] text-white/40">{formatDate(m.createdAt)} • by {m.uploadedBy}</p></div><a href={m.link} target="_blank" className="px-4 py-2 bg-white text-black rounded-full text-[11px] font-bold">Open</a></div>)}
            {materials.length===0 && <p className="text-center py-16 text-white/20">No materials - Upload first PYQ!</p>}
            <Footer/>
          </div>
        )}

        {/* EVENTS */}
        {activeTab==='events' && (
          <div className="space-y-3">
            <div className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 flex justify-between"><p className="font-bold text-[13px]">College Events 🎉</p><button onClick={async()=>{ const title=prompt("Event Title?"); const date=prompt("Date?"); if(!title) return; await addDoc(collection(db,'campx_events'),{title,date,createdBy:userData.name,createdAt:serverTimestamp()}); }} className="px-3 py-1.5 bg-white text-black rounded-full text-[11px] font-bold">+ Add</button></div>
            {events.map((e:any)=><div key={e.id} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><p className="font-bold text-[13px]">{e.title}</p><p className="text-[11px] text-white/40 mt-1">{e.date} • {formatDate(e.createdAt)}</p><p className="text-[11px] text-white/60 mt-2">{e.desc||"College official event"}</p></div>)}
            <Footer/>
          </div>
        )}

        {/* MARKETPLACE */}
        {activeTab==='market' && (
          <div className="space-y-3">
            <div className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 flex justify-between"><p className="font-bold text-[13px]">Marketplace 🛒</p><button onClick={async()=>{ const item=prompt("Item Name?"); const price=prompt("Price?"); if(!item) return; await addDoc(collection(db,'marketplace'),{item,price,owner:userData.name,contact:userData.email,createdAt:serverTimestamp()}); }} className="px-3 py-1.5 bg-white text-black rounded-full text-[11px] font-bold">+ Sell</button></div>
            <div className="grid grid-cols-2 gap-2">{market.map((m:any)=><div key={m.id} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-3"><p className="font-bold text-[12px]">{m.item}</p><p className="text-[12px] text-green-400 font-bold mt-1">₹{m.price}</p><p className="text-[10px] text-white/40 mt-1">{m.owner} • {formatDate(m.createdAt)}</p><button onClick={()=>showToast(`Contact: ${m.contact}`)} className="w-full mt-2 py-2 bg-white/[0.06] rounded-full text-[11px]">Contact</button></div>)}</div>
            <Footer/>
          </div>
        )}

        {/* LOST & FOUND */}
        {activeTab==='lost' && (
          <div className="space-y-3">
            <div className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 flex justify-between"><p className="font-bold text-[13px]">Lost & Found 🔍</p><button onClick={async()=>{ const item=prompt("Lost/Found Item?"); const loc=prompt("Location?"); if(!item) return; await addDoc(collection(db,'lost_found'),{item,location:loc,type:'Lost',owner:userData.name,createdAt:serverTimestamp()}); }} className="px-3 py-1.5 bg-white text-black rounded-full text-[11px] font-bold">+ Post</button></div>
            {lostFound.map((l:any)=><div key={l.id} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><div className="flex justify-between"><p className="font-bold text-[13px]">{l.item}</p><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${l.type==='Lost'?'bg-red-500/10 text-red-400':'bg-green-500/10 text-green-400'}`}>{l.type}</span></div><p className="text-[11px] text-white/40 mt-1">📍 {l.location} • {formatDate(l.createdAt)} • {l.owner}</p></div>)}
            <Footer/>
          </div>
        )}

              {/* DOUBT ZONE */}
        {activeTab==='doubts' && (
          <div className="space-y-3">
            <div className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 flex justify-between"><p className="font-bold text-[13px]">Doubt Zone ❓ - Seniors Help</p><button onClick={async()=>{ const q=prompt("Your doubt?"); if(!q) return; await addDoc(collection(db,'doubts'),{question:q,subject:'General',askedBy:userData.name,photoURL:userData.photoURL,answers:[],createdAt:serverTimestamp()}); }} className="px-3 py-1.5 bg-white text-black rounded-full text-[11px] font-bold">+ Ask</button></div>
            {doubts.map((d:any)=><div key={d.id} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><div className="flex gap-2"><img src={d.photoURL} className="w-7 h-7 rounded-full" alt="" /><div><p className="font-bold text-[12px]">{d.askedBy} • {formatDate(d.createdAt)}</p><p className="text-[10px] text-white/40">{d.subject}</p></div></div><p className="text-[13px] mt-3">{d.question}</p><button onClick={async()=>{ const ans=prompt("Your answer?"); if(!ans) return; await updateDoc(doc(db,'doubts',d.id),{answers:arrayUnion({text:ans,by:userData.name,at:Date.now()})}); }} className="mt-3 px-3 py-1.5 bg-white/[0.06] border border-white/[0.06] rounded-full text-[11px]">💬 Answer • {d.answers?.length||0}</button>{d.answers?.map((a:any,i:number)=><div key={i} className="mt-2 ml-4 bg-white/[0.02] border border-white/[0.04] rounded-[12px] p-3"><p className="text-[12px]">{a.text}</p><p className="text-[10px] text-white/30 mt-1">by {a.by}</p></div>)}</div>)}
            <Footer/>
          </div>
        )}

        {/* LEADERBOARD */}
        {activeTab==='leaderboard' && (
          <div className="space-y-2">
            <div className="bg-gradient-to-br from-yellow-500/10 to-white/[0.02] border border-yellow-500/20 rounded-[16px] p-4"><p className="font-bold text-[13px]">🏆 Leaderboard - Top Students</p><p className="text-[10px] text-white/40 mt-1">Based on Karma + Posts + Attendance</p></div>
            {leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-[#111111] border border-white/[0.06] rounded-[14px] p-3 flex justify-between items-center"><div className="flex gap-3 items-center"><span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${i===0?'bg-yellow-500 text-black':i===1?'bg-white/20':i===2?'bg-orange-500/20':'bg-white/[0.06]'}`}>{i+1}</span><img src={u.photoURL} className="w-8 h-8 rounded-full" alt="" /><div><p className="font-bold text-[12px]">{u.name}</p><p className="text-[10px] text-white/40">{u.rollNumber||u.dept} • {u.yakarma||0} karma</p></div></div><span className="text-[12px] font-bold">🔥 {u.yakarma||0}</span></div>)}
            <Footer/>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab==='notifications' && (
          <div className="space-y-2">
            <div className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4"><p className="font-bold text-[13px]">Notifications • {notifications.length}</p></div>
            {notifications.map((n:any)=><div key={n.id} className="bg-[#111111] border border-white/[0.06] rounded-[14px] p-3"><p className="text-[12px] font-bold">{n.title}</p><p className="text-[11px] text-white/40 mt-1">{n.body}</p><p className="text-[10px] text-white/20 mt-1">{formatDate(n.createdAt)}</p></div>)}
            {notifications.length===0 && <p className="text-center py-16 text-white/20">No notifications</p>}
            <Footer/>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4"><div className="bg-[#111111] border border-white/[0.08] w-full max-w-[600px] rounded-t-[20px] p-5 pb-8"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5"></div><p className="font-bold text-[14px]">Create Post - {userData?.name}</p><div className="flex gap-2 mt-4 overflow-x-auto"><button onClick={()=>setPostType('general')} className={`px-3 py-1.5 rounded-full text-[11px] border ${postType==='general'?'bg-white text-black':'bg-white/[0.04] border-white/[0.06]'}`}>General</button><button onClick={()=>setPostType('doubt')} className={`px-3 py-1.5 rounded-full text-[11px] border ${postType==='doubt'?'bg-white text-black':'bg-white/[0.04] border-white/[0.06]'}`}>Doubt</button><button onClick={()=>setPostType('event')} className={`px-3 py-1.5 rounded-full text-[11px] border ${postType==='event'?'bg-white text-black':'bg-white/[0.04] border-white/[0.06]'}`}>Event</button><button onClick={()=>setPostType('meme')} className={`px-3 py-1.5 rounded-full text-[11px] border ${postType==='meme'?'bg-white text-black':'bg-white/[0.04] border-white/[0.06]'}`}>Meme</button></div><textarea value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="What's happening?" className="w-full mt-4 bg-black border border-white/[0.08] rounded-[16px] p-4 text-[14px] min-h-[100px]" autoFocus /><div className="flex gap-2 mt-4"><button onClick={()=>setShowCreate(false)} className="flex-1 py-3 rounded-full bg-white/[0.06] text-[12px]">Cancel</button><button onClick={handlePost} className="flex-1 py-3 rounded-full bg-white text-black font-bold text-[12px]">Post • {formatDate(new Date())}</button></div></div></div>
      )}

      {/* Bottom Nav - Main */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/[0.06] z-30"><div className="max-w-[600px] mx-auto px-2 h-[64px] flex justify-between items-center"><button onClick={()=>setActiveTab('feed')} className={`flex flex-col items-center gap-1 ${activeTab==='feed'?'opacity-100':'opacity-40'}`}><span>🏠</span><span className="text-[8px] font-bold">FEED</span></button><button onClick={()=>setActiveTab('timetable')} className={`flex flex-col items-center gap-1 ${activeTab==='timetable'?'opacity-100':'opacity-40'}`}><span>📅</span><span className="text-[8px]">TIME</span></button><button onClick={()=>setActiveTab('attendance')} className={`flex flex-col items-center gap-1 ${activeTab==='attendance'?'opacity-100':'opacity-40'}`}><span>📊</span><span className="text-[8px]">ATTEND</span><span className="text-[8px] bg-red-600 text-white px-1 rounded-full">{overallAtt}%</span></button><button onClick={()=>setShowCreate(true)} className="w-12 h-12 bg-white text-black rounded-full text-[20px] font-black">+</button><button onClick={()=>setActiveTab('market')} className={`flex flex-col items-center gap-1 ${activeTab==='market'?'opacity-100':'opacity-40'}`}><span>🛒</span><span className="text-[8px]">MARKET</span></button><button onClick={()=>setActiveTab('doubts')} className={`flex flex-col items-center gap-1 ${activeTab==='doubts'?'opacity-100':'opacity-40'}`}><span>❓</span><span className="text-[8px]">DOUBT</span></button><button onClick={()=>setActiveTab('profile')} className="flex flex-col items-center gap-1 opacity-40"><span>👤</span><span className="text-[8px]">YOU</span></button></div></div>
    </div>
  );
}
