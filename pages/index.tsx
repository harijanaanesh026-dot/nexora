import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';

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

const COLLEGES = [
  {id:"SRET", label:"SRET", city:"Tirupati", color:"from-blue-600 to-cyan-500", emoji:"🎓"},
  {id:"SVCE", label:"SVCE", city:"Tirupati", color:"from-emerald-600 to-teal-500", emoji:"🚀"},
  {id:"BITS", label:"BITS", city:"Pilani", color:"from-violet-600 to-indigo-600", emoji:"⚡"},
  {id:"ST.JOHNS", label:"ST.JOHNS", city:"Tirupati", color:"from-orange-600 to-red-500", emoji:"🔥"},
  {id:"VEMU", label:"VEMU", city:"Chittoor", color:"from-amber-500 to-orange-500", emoji:"💎"},
  {id:"OTHER", label:"OTHER", city:"India", color:"from-zinc-700 to-zinc-900", emoji:"🌍"},
];
const AVATARS = [
  {emoji:"👻", bg:"bg-gradient-to-br from-zinc-800 to-zinc-900", glow:"shadow-[0_0_25px_rgba(255,255,255,0.15)]"},
  {emoji:"🔥", bg:"bg-gradient-to-br from-orange-500 to-red-600", glow:"shadow-[0_0_25px_rgba(249,115,22,0.5)]"},
  {emoji:"😎", bg:"bg-gradient-to-br from-blue-500 to-cyan-600", glow:"shadow-[0_0_25px_rgba(59,130,246,0.5)]"},
  {emoji:"🤫", bg:"bg-gradient-to-br from-violet-500 to-purple-600", glow:"shadow-[0_0_25px_rgba(139,92,246,0.5)]"},
  {emoji:"💀", bg:"bg-gradient-to-br from-zinc-700 to-zinc-900", glow:"shadow-[0_0_25px_rgba(255,255,255,0.1)]"},
  {emoji:"👽", bg:"bg-gradient-to-br from-green-500 to-emerald-600", glow:"shadow-[0_0_25px_rgba(34,197,94,0.5)]"},
  {emoji:"🦊", bg:"bg-gradient-to-br from-orange-400 to-pink-600", glow:"shadow-[0_0_25px_rgba(251,146,60,0.5)]"},
  {emoji:"🐼", bg:"bg-gradient-to-br from-zinc-800 to-black", glow:"shadow-[0_0_25px_rgba(255,255,255,0.1)]"},
];
const Footer = () => (
  <div className="w-full py-8 flex flex-col items-center gap-2 border-t border-zinc-900/50 mt-8 bg-[#050507]">
    <div className="flex items-center gap-2"><div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-black text-black">Y</div><p className="text-[11px] tracking-[0.35em] font-black text-white">A PRODUCTION BY ANESH</p></div>
    <p className="text-[10px] text-zinc-600">Real Count • Attractive • Instant • Edit/Delete</p>
  </div>
);

export default function YakApp(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [yaks,setYaks]=useState<any[]>([]);
  const [collegeCounts,setCollegeCounts]=useState<Record<string,number>>({});
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [images,setImages]=useState<string[]>([]);
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [replyTo,setReplyTo]=useState<any>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [selectedCollege,setSelectedCollege]=useState('');
  const [selectedAvatar,setSelectedAvatar]=useState(AVATARS[0]);
  const [collegeEmail,setCollegeEmail]=useState('');
  const [rollNumber,setRollNumber]=useState('');
  const [verifyMethod,setVerifyMethod]=useState('email');
  const [otp,setOtp]=useState('');
  const [generatedOtp,setGeneratedOtp]=useState('');
  const [otpSent,setOtpSent]=useState(false);
  const [isVerified,setIsVerified]=useState(false);
  const [posting,setPosting]=useState(false);
  const [editingPost,setEditingPost]=useState<any>(null);
  const [editText,setEditText]=useState('');
  const [showMenu,setShowMenu]=useState<string|null>(null);

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);

  // REAL COUNT - Live
  useEffect(()=>{
    return onSnapshot(collection(db,'users'), snap=>{
      const counts:Record<string,number>={};
      snap.docs.forEach(d=>{ const col=(d.data() as any).college; if(col) counts[col]=(counts[col]||0)+1; });
      setCollegeCounts(counts); setTotalUsers(snap.size);
    });
  },[]);

  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college'); if(!col ||!isVerified){ setScreen('college'); return; }
          let av:any=AVATARS[0]; try{ const s=localStorage.getItem('selected_avatar_data'); if(s) av=JSON.parse(s); }catch{}
          const safeAv={emoji:String(av?.emoji||"👻"), bg:String(av?.bg||"bg-zinc-900"), glow:String(av?.glow||"")};
          await addDoc(collection(db,'users'),{
            uid:u.uid, email:u.email||'', username:'Yak_'+Math.floor(Math.random()*9000+1000),
            avatar:safeAv.emoji, avatarBg:safeAv.bg, avatarGlow:safeAv.glow,
            college:String(col), collegeEmail:String(localStorage.getItem('college_email')||''), rollNumber:String(localStorage.getItem('roll_number')||''), verifyMethod:String(localStorage.getItem('verify_method')||'email'),
            yakarma:120, totalPosts:0, likedPosts:[], dislikedPosts:[], createdAt:serverTimestamp()
          });
          window.location.reload();
        }else{
          let raw:any={id:snap.docs[0].id,...snap.docs[0].data()};
          if(!raw.avatarBg ||!raw.avatarGlow){ const f={avatar:raw.avatar||"👻", avatarBg:raw.avatarBg||"bg-zinc-900", avatarGlow:raw.avatarGlow||raw.avatarBg||"bg-zinc-900"}; await updateDoc(doc(db,'users',raw.id),f); raw={...raw,...f}; }
          setUserData(raw); setScreen('feed');
        }
      }else setScreen('college');
    });
  },[isVerified]);

  useEffect(()=>{
    if(!userData?.college) return;
    const q = query(collection(db,'yaks'), where('college','==', userData.college), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, s=>{ setYaks(s.docs.map(d=>({id:d.id,...d.data()}))); },
    ()=>{ onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')), s=>{ setYaks(s.docs.map(d=>({id:d.id,...d.data()})).filter((y:any)=>y.college===userData.college)); }); });
    return ()=>unsub();
  },[userData]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);
    const handleCollegeNext=()=>{ if(!selectedCollege) return; localStorage.setItem('selected_college',selectedCollege); localStorage.setItem('selected_avatar_data',JSON.stringify(selectedAvatar)); setScreen('verify'); };
  const handleEmailVerify=async()=>{ if(!collegeEmail.includes('@')) return alert('Valid email'); const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode); await setDoc(doc(db,'email_otps',collegeEmail.toLowerCase()),{email:collegeEmail.toLowerCase(),otp:otpCode,college:selectedCollege,createdAt:serverTimestamp()}); setOtpSent(true); };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()) return alert('Wrong OTP: '+d.otp); await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase())); localStorage.setItem('college_email',collegeEmail.toLowerCase()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ if(rollNumber.trim().length<4) return alert('Invalid'); localStorage.setItem('roll_number',rollNumber.trim().toUpperCase()); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleVote=async(y:any,type:string)=>{
    const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
    if(type==='up'){
      if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id), yakarma:increment(-1)}); setUserData({...userData,likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)}); }
      else if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1),likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id),likedPosts:arrayUnion(y.id), yakarma:increment(2)}); setUserData({...userData,dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id),likedPosts:[...userData.likedPosts,y.id]}); }
      else{ await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id), yakarma:increment(1)}); setUserData({...userData,likedPosts:[...(userData.likedPosts||[]),y.id]}); }
    }else{
      if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id), yakarma:increment(1)}); setUserData({...userData,dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id)}); }
      else if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1),dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id),dislikedPosts:arrayUnion(y.id), yakarma:increment(-2)}); setUserData({...userData,likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id),dislikedPosts:[...userData.dislikedPosts,y.id]}); }
      else{ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayUnion(y.id), yakarma:increment(-1)}); setUserData({...userData,dislikedPosts:[...(userData.dislikedPosts||[]),y.id]}); }
    }
  };
  const handlePost=async()=>{
    if(!userData || (!newYak.trim() && images.length===0)) return;
    setPosting(true);
    try{
      const payload:any={text:String(newYak.trim()), uid:String(user.uid), username:String(userData.username), avatar:String(userData.avatar||'👻'), avatarBg:String(userData.avatarBg||'bg-zinc-900'), avatarGlow:String(userData.avatarGlow||'bg-zinc-900'), college:String(userData.college), likes:0, dislikes:0, commentsCount:0, imageUrls:(images||[]).filter(Boolean).map(String), createdAt:serverTimestamp()};
      Object.keys(payload).forEach(k=>{ if(payload[k]===undefined) delete payload[k]; });
      await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setImages([]); setScreen('feed');
    }catch(e:any){ alert(e.message); } finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(!confirm(`Delete yak from ${y.college}?`)) return; if(user?.uid!==y.uid) return; await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1), yakarma:increment(-5)}); setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost ||!editText.trim()) return; await updateDoc(doc(db,'yaks',editingPost.id),{text:String(editText.trim()), edited:true, editedAt:serverTimestamp()}); setEditingPost(null); setEditText(''); setShowMenu(null); };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#050507] text-white flex flex-col">
        <style>{`body{background:#050507} ::-webkit-scrollbar{display:none} button{transition:all 0.25s} button:active{transform:scale(0.95)}`}</style>
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <div className="mt-6 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center font-black text-black text-xl">Y</div><div><p className="font-black text-[18px] tracking-tighter leading-none">YAK</p><p className="text-[10px] tracking-[0.2em] text-zinc-500 font-bold">REAL STUDENTS ONLY</p></div></div><div className="bg-white/10 border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] font-black">{totalUsers} REAL JOINED</p></div></div>
          <h1 className="text-[42px] font-black mt-8 leading-[0.85] tracking-tighter">Your college.<br/>Your herd.<br/><span className="text-zinc-600">Real count.</span></h1>
          <div className="mt-4 bg-[#0a0a0f] border border-zinc-900 rounded-[18px] p-4 flex items-center justify-between"><div><p className="text-[11px] tracking-widest font-black text-zinc-500">TOTAL REAL STUDENTS JOINED</p><p className="text-[28px] font-black tracking-tighter">{totalUsers} <span className="text-[14px] text-zinc-500">verified</span></p></div><div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center text-xl">✓</div></div>
          <p className="font-bold mt-8 text-[10px] tracking-[0.2em] text-zinc-500">CHOOSE VIBE • ATTRACTIVE</p>
          <div className="grid grid-cols-4 gap-3 mt-3">{AVATARS.map((av,i)=><button key={i} onClick={()=>setSelectedAvatar(av)} className={`h-[72px] rounded-[22px] border-2 text-2xl ${selectedAvatar.emoji===av.emoji?'border-white scale-105':'border-zinc-800 bg-zinc-900/50'} ${av.bg} ${av.glow} flex items-center justify-center`}>{av.emoji}</button>)}</div>
          <p className="font-bold mt-7 text-[10px] tracking-[0.2em] text-zinc-500">SELECT COLLEGE • LIVE REAL COUNT</p>
          <div className="grid grid-cols-1 gap-3 mt-3">{COLLEGES.map(c=>{const a=selectedCollege===c.id; const count=collegeCounts[c.id]||0; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`p-4 rounded-[22px] border-2 text-left flex items-center justify-between ${a?'bg-white text-black border-white scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.2)]':'bg-[#0a0a0f] border-zinc-900 text-white'}`}><div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${c.color} flex items-center justify-center text-xl`}>{c.emoji}</div><div><p className="font-black text-[14px]">{c.label} • {c.city}</p><div className="flex items-center gap-2"><p className={`text-[11px] ${a?'text-black/60':'text-zinc-500'}`}>{count>0?`${count} real students`:'Be first!' } • {count>0?`${count*3} yaks`:''}</p>{count>0&&<span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${a?'bg-black text-white':'bg-green-500/20 text-green-400 border border-green-500/30'}`}>● LIVE</span>}</div></div></div><div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-xs ${a?'bg-black text-white border-black':'border-zinc-700 text-zinc-600'}`}>{a?'✓':count>0?String(count):'+'}</div></button>})}</div>
        </div>
        <div className="p-6 max-w-md mx-auto w-full sticky bottom-0 bg-[#050507]/80 backdrop-blur-xl border-t border-zinc-900/50"><button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full py-5 rounded-full font-black text-[15px] flex items-center justify-center gap-2 ${selectedCollege?'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]':'bg-zinc-900 text-zinc-700'}`}><span className="text-xl">{selectedAvatar.emoji}</span> Enter {selectedCollege||'College'} Herd → {selectedCollege && collegeCounts[selectedCollege]? `(${collegeCounts[selectedCollege]} real)` : ''}</button><p className="text-[10px] text-center text-zinc-600 mt-2 font-bold">{totalUsers} real students joined • Live count</p></div>
        <Footer/>
      </div>
    );
  }
  if(screen==='verify'){
    const count=collegeCounts[selectedCollege]||0;
    return(
      <div className="min-h-screen bg-[#050507] text-white"><div className="max-w-md mx-auto min-h-screen flex flex-col"><div className="p-6"><button onClick={()=>setScreen('college')} className="w-10 h-10 bg-zinc-900 rounded-full">←</button><div className="mt-6 rounded-[28px] bg-[#0a0a0f] border border-zinc-900 p-6"><div className="flex gap-4"><div className={`w-16 h-16 rounded-[20px] ${selectedAvatar.bg} border-2 border-zinc-800 flex items-center justify-center text-3xl ${selectedAvatar.glow}`}>{selectedAvatar.emoji}</div><div className="flex-1"><p className="text-[10px] tracking-[0.2em] text-zinc-500 font-bold">REAL COUNT • {count} JOINED IN {selectedCollege}</p><h1 className="text-[20px] font-black leading-none mt-1">Enter {selectedCollege} Herd</h1><p className="text-[11px] text-zinc-500 mt-1">{count>0?`${count} real students already inside`:'Be first real student'}</p></div></div><div className="mt-4 bg-white/5 border border-white/10 rounded-[14px] p-3 flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] font-black">{selectedCollege}: {count} REAL JOINED</p></div><p className="text-[10px] text-zinc-500 font-bold">Live • Real time</p></div></div></div>
      <div className="px-6"><div className="flex p-1 bg-[#0a0a0f] border border-zinc-900 rounded-full"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-[13px] font-black ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>📧 Email</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-[13px] font-black ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>🎓 Roll</button></div></div>
      {verifyMethod==='email'?<div className="p-6 flex-1"><div className="bg-[#0a0a0f] border border-zinc-900 rounded-[24px] p-5"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder="college email" className="w-full p-4 bg-black border-2 border-zinc-900 rounded-2xl outline-none font-bold"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-4 rounded-full font-black">Send Code</button>{otpSent&&<div className="mt-3 p-4 bg-black border border-green-900/50 rounded-2xl"><p className="text-xs text-green-400 font-bold">CODE: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" className="w-full mt-3 p-3 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-center tracking-[0.4em] font-black outline-none"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-green-500 text-black py-3 rounded-full font-black">Verify & Join {count+1} Real</button></div>}</div></div>:<div className="p-6 flex-1"><div className="bg-[#0a0a0f] border border-zinc-900 rounded-[24px] p-5"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value)} placeholder="ROLL NUMBER" className="w-full p-4 bg-black border-2 border-zinc-900 rounded-2xl uppercase font-black tracking-widest outline-none"/><button onClick={handleRollVerify} className="w-full mt-3 bg-white text-black py-4 rounded-full font-black">Verify & Join {count+1} Real</button></div></div>}
      <Footer/></div></div>
    );
  }
  if(screen==='login'){ const count=collegeCounts[selectedCollege]||0; return <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6"><div className={`w-28 h-28 rounded-[32px] border-2 border-white/10 flex items-center justify-center text-5xl ${selectedAvatar.bg} ${selectedAvatar.glow}`}>{selectedAvatar.emoji}</div><h1 className="text-[28px] font-black mt-6 tracking-tighter text-center">Welcome to<br/>{selectedCollege} Herd 🔥</h1><p className="text-zinc-500 text-sm mt-2">{count} real students already joined • You are #{count+1}</p><button onClick={handleGoogleLogin} className="w-full max-w-sm mt-8 bg-white text-black py-4 rounded-full font-black">Continue → Join {count+1} Real Herd</button><div className="mt-16 w-full max-w-md"><Footer/></div></div>; }

  return(
    <div className="min-h-screen bg-[#050507] text-white flex flex-col">
      <style>{`body{background:#050507} ::-webkit-scrollbar{display:none} button{transition:all 0.25s} button:active{transform:scale(0.96)}`}</style>
      <div className="sticky top-0 z-30 bg-[#050507]/80 backdrop-blur-xl border-b border-zinc-900/50">
        <div className="max-w-[600px] mx-auto px-5 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black">Y</div><div><p className="font-black text-[15px] tracking-tighter leading-none">{userData.college} Herd • {collegeCounts[userData.college]||0} real • {yaks.length} yaks</p><p className="text-[11px] text-zinc-500 font-bold">Real count: {collegeCounts[userData.college]||0} joined • {yaks.length} live posts • Attractive</p></div></div>
          <button onClick={()=>setShowProfile(true)} className={`w-11 h-11 rounded-full ${userData.avatarBg} border-2 border-white/10 flex items-center justify-center text-xl ${userData.avatarGlow}`}>{userData.avatar}</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 pb-[90px] p-3 space-y-3 mt-2">
        {/* REAL COUNT CARD */}
        <div className="bg-gradient-to-br from-white to-zinc-200 text-black rounded-[24px] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className={`w-14 h-14 rounded-[18px] ${userData.avatarBg} flex items-center justify-center text-2xl border-2 border-black/10 ${userData.avatarGlow}`}>{userData.avatar}</div><div><p className="font-black text-[16px] leading-none">{userData.username} • Attractive ✨</p><p className="text-[12px] font-bold opacity-70 mt-1">{userData.college} herd • {collegeCounts[userData.college]||0} real students • You #{Object.keys(collegeCounts).reduce((a,c)=>a+(collegeCounts[c]||0),0)}</p></div></div>
            <div className="text-right"><p className="text-[24px] font-black leading-none">{collegeCounts[userData.college]||0}</p><p className="text-[9px] font-black tracking-widest opacity-60">REAL JOINED</p></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {COLLEGES.slice(0,3).map(c=><div key={c.id} className={`rounded-[12px] p-2.5 border text-center ${c.id===userData.college?'bg-black text-white border-black':'bg-black/5 border-black/10'}`}><p className="text-[11px] font-black">{c.id}: {collegeCounts[c.id]||0}</p><p className="text-[8px] font-bold opacity-60">{collegeCounts[c.id]||0>0?'real':'be first'}</p></div>)}
          </div>
        </div>

        {yaks.map(y=>{
          const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid;
          return(
            <div key={y.id} className="bg-[#0a0a0f] border border-zinc-900 rounded-[26px] p-5 hover:border-zinc-800 transition-all relative">
              <div className="flex justify-between items-start">
                <div className="flex gap-3"><div className={`w-11 h-11 rounded-full ${y.avatarBg||'bg-zinc-900'} border-2 border-zinc-800 flex items-center justify-center text-lg relative ${y.avatarGlow||''} shrink-0`}>{y.avatar||'👻'}<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-[8px]">✓</div></div><div><div className="flex items-center gap-2 flex-wrap"><p className="font-black text-[13px]">{y.username}</p><span className="px-2.5 py-0.5 bg-white text-black text-[9px] rounded-full font-black">{y.college} HERD • {collegeCounts[y.college]||0} REAL</span>{y.edited&&<span className="text-[9px] text-zinc-500">(edited)</span>}</div><p className="text-[10px] text-zinc-500">{y.college} • {collegeCounts[y.college]||0} real students herd</p></div></div>
                {isOwn && (
                  <div className="relative">
                    <button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-8 h-8 bg-[#111113] border border-zinc-900 rounded-full flex items-center justify-center text-zinc-500 hover:text-white">⋯</button>
                    {showMenu===y.id && (
                      <div className="absolute right-0 top-10 w-[160px] bg-[#111113] border border-zinc-800 rounded-[16px] p-2 z-20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                        <button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-bold hover:bg-zinc-800 flex items-center gap-2"><span>✏️</span> Edit Yak</button>
                        <button onClick={()=>handleDelete(y)} className="w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-bold hover:bg-red-950/50 text-red-400 flex items-center gap-2"><span>🗑️</span> Delete Yak</button>
                        <button onClick={()=>setShowMenu(null)} className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold text-zinc-500 hover:bg-zinc-800 mt-1">Cancel</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-3 text-[15px] leading-[1.5] font-medium">{y.text}</p>
              {y.imageUrls?.[0] && <img src={y.imageUrls[0]} alt="" className="mt-3 rounded-[18px] w-full border border-zinc-900"/>}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex bg-[#111113] rounded-full border border-zinc-900 p-1"><button onClick={()=>handleVote(y,'up')} className={`px-4 py-1.5 rounded-full text-[13px] font-black ${liked?'bg-white text-black':'text-zinc-500'}`}>▲ {y.likes||0}</button><div className={`px-2 py-1.5 text-[12px] font-black ${score>0?'text-green-400':score<0?'text-red-400':'text-zinc-600'}`}>{score}</div><button onClick={()=>handleVote(y,'down')} className={`px-3 py-1.5 rounded-full text-[13px] font-black ${disliked?'bg-red-500 text-white':'text-zinc-600'}`}>▼</button></div>
                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#111113] border border-zinc-900 px-4 h-[36px] rounded-full text-[12px] font-bold text-zinc-500">💬 {y.commentsCount||0}</button>
              </div>
              {activePost===y.id && <div className="mt-4 border-t border-zinc-900/50 pt-4"><div className="space-y-3 max-h-[300px] overflow-y-auto">{comments.map(c=>{ const isReply=!!c.replyTo; return <div key={c.id} className={`${isReply?'ml-8 border-l-2 border-zinc-800 pl-3':''} flex gap-2.5`}><div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-sm shrink-0">{c.avatar||'👻'}</div><div className="flex-1"><div className="bg-[#111113] border border-zinc-900 rounded-2xl px-4 py-2.5"><p className="text-[13px]">{c.replyTo && <span className="text-[11px] text-violet-400 font-bold">@{c.replyTo} </span>}{c.text}</p></div><button onClick={()=>setReplyTo(c)} className="text-[10px] font-bold text-zinc-500 mt-1 ml-1">↩ Reply</button></div></div>})}</div><div className="flex gap-2 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={replyTo?`Reply to ${replyTo.username}...`:"Add comment..."} className="flex-1 bg-[#111113] border border-zinc-900 rounded-full px-5 h-11 text-sm outline-none focus:border-zinc-700"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText,uid:user.uid,username:userData.username,avatar:userData.avatar,replyTo:replyTo?.username||null,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); setReplyTo(null); }} className="w-11 h-11 bg-white text-black rounded-full font-black shrink-0">↑</button></div></div>}
            </div>
          );
        })}
        {yaks.length===0 && <div className="py-16 text-center"><div className={`w-24 h-24 rounded-[28px] mx-auto flex items-center justify-center text-4xl border-2 border-white/10 ${userData.avatarBg} ${userData.avatarGlow}`}>{userData.avatar}</div><p className="font-black mt-6 text-[20px] tracking-tighter">Welcome to {userData.college} Herd 🔥</p><p className="text-sm text-zinc-500 mt-2">{collegeCounts[userData.college]||0} real students joined • You are real</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full font-black text-sm">+ First Yak in {userData.college}</button><div className="mt-12"><Footer/></div></div>}
        {yaks.length>0 && <Footer/>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#050507]/80 backdrop-blur-xl border-t border-zinc-900/50"><div className="max-w-[600px] mx-auto px-8 h-[80px] flex items-center justify-between"><button className="flex flex-col items-center gap-1 text-white"><div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-black font-black text-xs">⌂</div><span className="text-[9px] font-black tracking-widest">{userData.college} • {collegeCounts[userData.college]||0} REAL</span></button><button onClick={()=>setScreen('create')} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)]">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1"><div className={`w-7 h-7 rounded-full ${userData.avatarBg} border border-white/10 flex items-center justify-center text-sm ${userData.avatarGlow}`}>{userData.avatar}</div><span className="text-[9px] font-black tracking-widest">YOU • {userData.yakarma}</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#050507] z-40"><div className="max-w-[600px] mx-auto h-full flex flex-col"><div className="p-4 flex items-center justify-between border-b border-zinc-900/50"><button onClick={()=>setScreen('feed')} className="w-9 h-9 bg-zinc-900 rounded-full text-white">✕</button><p className="font-bold text-[11px] tracking-widest">{userData.college} HERD • {collegeCounts[userData.college]||0} REAL</p><button onClick={handlePost} disabled={posting ||!newYak.trim()} className={`px-5 h-9 rounded-full font-black text-sm ${!newYak.trim()?'bg-zinc-900 text-zinc-700':'bg-white text-black'}`}>{posting?'Posting...':'Yak'}</button></div>
        <div className="p-5 flex-1 overflow-y-auto"><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}? ${collegeCounts[userData.college]||0} real students chusthunnaru`} autoFocus className="w-full bg-transparent text-[22px] outline-none placeholder:text-zinc-800 resize-none min-h-[160px]" maxLength={300}/><label className="mt-6 border-2 border-dashed border-zinc-800 rounded-[18px] p-6 flex flex-col items-center cursor-pointer"><span className="text-[11px] font-black tracking-widest text-zinc-500">ADD PHOTO</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setImages([r.result as string]); r.readAsDataURL(f); } }}/></label>{images[0] && <div className="mt-4 relative"><img src={images[0]} alt="" className="rounded-[18px] w-full border border-zinc-900"/><button onClick={()=>setImages([])} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full text-white">✕</button></div>}</div>
        <div className="p-4 border-t border-zinc-900/50"><Footer/></div>
        </div></div>
      )}

      {editingPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[60] flex items-end justify-center p-3">
          <div className="bg-[#0a0a0f] border border-zinc-800 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8">
            <div className="w-10 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6"></div>
            <div className="flex items-center justify-between"><h2 className="font-black text-[18px]">✏️ Edit Yak</h2><span className="text-[10px] bg-white/10 px-2 py-1 rounded-full">{editingPost.college} • {collegeCounts[editingPost.college]||0} real</span></div>
            <textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-4 bg-[#111113] border border-zinc-800 rounded-[18px] p-4 text-[16px] outline-none focus:border-zinc-700 min-h-[120px] resize-none" autoFocus/>
            <div className="flex gap-3 mt-5"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-12 bg-zinc-900 border border-zinc-800 rounded-full font-bold">Cancel</button><button onClick={handleEdit} disabled={!editText.trim()} className={`flex-1 h-12 rounded-full font-black ${!editText.trim()?'bg-zinc-800 text-zinc-600':'bg-white text-black'}`}>Save ✓</button></div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#0a0a0f] border border-zinc-900 w-full max-w-[600px] rounded-t-[32px] p-6 pb-8 max-h-[85vh] overflow-y-auto"><div className="w-10 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6"></div>
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[28px] p-6"><div className="flex gap-4"><div className={`w-20 h-20 rounded-[22px] ${userData.avatarBg} border-2 border-white/20 flex items-center justify-center text-3xl ${userData.avatarGlow}`}>{userData.avatar}</div><div><h2 className="font-black text-[22px] tracking-tighter leading-none">{userData.username}</h2><p className="text-[13px] font-bold text-white/70 mt-1">{userData.college} Herd • {collegeCounts[userData.college]||0} real joined</p><div className="flex gap-2 mt-3"><span className="px-3 py-1.5 bg-white text-black rounded-full text-[11px] font-black">Yakarma {userData.yakarma}</span><span className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-[10px] font-black">✓ REAL • #{collegeCounts[userData.college]||1}</span></div></div></div>
        <div className="mt-5"><p className="text-[10px] font-black tracking-widest text-zinc-500">REAL STUDENTS PER COLLEGE (LIVE)</p><div className="mt-2 grid grid-cols-2 gap-2">{COLLEGES.map(c=><div key={c.id} className={`rounded-[12px] p-3 border flex items-center justify-between ${c.id===userData.college?'bg-white text-black border-white':'bg-white/5 border-white/10'}`}><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-[8px] bg-gradient-to-br ${c.color} flex items-center justify-center text-sm`}>{c.emoji}</div><p className="font-black text-[12px]">{c.id}</p></div><div className="text-right"><p className="font-black text-[14px]">{collegeCounts[c.id]||0}</p><p className="text-[8px] font-bold opacity-60">real</p></div></div>)}</div></div>
        <div className="mt-5 grid grid-cols-3 gap-2"><div className="bg-white/5 border border-white/10 rounded-[14px] p-3 text-center"><p className="text-[20px] font-black">{totalUsers}</p><p className="text-[9px] font-bold tracking-widest text-zinc-500">TOTAL REAL</p></div><div className="bg-white/5 border border-white/10 rounded-[14px] p-3 text-center"><p className="text-[20px] font-black">{collegeCounts[userData.college]||0}</p><p className="text-[9px] font-bold tracking-widest text-zinc-500">{userData.college} REAL</p></div><div className="bg-white/5 border border-white/10 rounded-[14px] p-3 text-center"><p className="text-[20px] font-black">{yaks.length}</p><p className="text-[9px] font-bold tracking-widest text-zinc-500">YAKS</p></div></div></div>
        <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-zinc-900 border border-zinc-800 h-11 rounded-full font-bold text-sm">Log out</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-11 rounded-full font-black">Close</button><div className="mt-4"><Footer/></div></div></div>
      )}
    </div>
  );
}
