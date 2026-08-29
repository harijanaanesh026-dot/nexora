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
  {id:"SRET", label:"SRET", city:"Tirupati", color:"from-blue-600 to-cyan-500", emoji:"🎓", students:"2.1k", yaks:"842"},
  {id:"SVCE", label:"SVCE", city:"Tirupati", color:"from-emerald-600 to-teal-500", emoji:"🚀", students:"1.8k", yaks:"623"},
  {id:"BITS", label:"BITS", city:"Pilani", color:"from-violet-600 to-indigo-600", emoji:"⚡", students:"3.2k", yaks:"1.2k"},
  {id:"ST.JOHNS", label:"ST.JOHNS", city:"Tirupati", color:"from-orange-600 to-red-500", emoji:"🔥", students:"1.5k", yaks:"540"},
  {id:"VEMU", label:"VEMU", city:"Chittoor", color:"from-amber-500 to-orange-500", emoji:"💎", students:"1.2k", yaks:"412"},
  {id:"OTHER", label:"OTHER", city:"India", color:"from-zinc-700 to-zinc-900", emoji:"🌍", students:"5k+", yaks:"2k+"},
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
    <div className="flex items-center gap-2"><div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">Y</div><p className="text-[11px] tracking-[0.35em] font-black text-white">A PRODUCTION BY ANESH</p></div>
    <p className="text-[10px] text-zinc-600">Attractive • Real • Smooth • College Herd</p>
  </div>
);

export default function YakAttractive(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [yaks,setYaks]=useState<any[]>([]);
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

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college'); if(!col ||!isVerified){ setScreen('college'); return; }
          let av:any=AVATARS[0]; try{ const s=localStorage.getItem('selected_avatar_data'); if(s) av=JSON.parse(s); }catch{}
          const safeAv={emoji:av?.emoji||"👻", bg:av?.bg||"bg-zinc-900", glow:av?.glow||""};
          await addDoc(collection(db,'users'),{
            uid:u.uid, email:u.email||'', username:'Yak_'+Math.floor(Math.random()*9000+1000),
            avatar:String(safeAv.emoji), avatarBg:String(safeAv.bg), avatarGlow:String(safeAv.glow),
            college:String(col), collegeEmail:String(localStorage.getItem('college_email')||''), rollNumber:String(localStorage.getItem('roll_number')||''), verifyMethod:String(localStorage.getItem('verify_method')||'email'),
            yakarma:120, totalPosts:0, likedPosts:[], dislikedPosts:[], createdAt:serverTimestamp()
          });
          window.location.reload();
        }else{
          let raw:any={id:snap.docs[0].id,...snap.docs[0].data()};
          if(!raw.avatarBg){ const f={avatar:raw.avatar||"👻", avatarBg:"bg-zinc-900", avatarGlow:""}; await updateDoc(doc(db,'users',raw.id),f); raw={...raw,...f}; }
          setUserData(raw); setScreen('feed');
        }
      }else setScreen('college');
    });
  },[isVerified]);

  // MAIN FIX: College loki enter avvagane instant ga aa college posts ye kanipinchali
  useEffect(()=>{
    if(!userData?.college) return;
    const q = query(collection(db,'yaks'), where('college','==', userData.college), orderBy('createdAt','desc'));
    // fallback if where+orderBy index ledu, then simple orderBy
    const unsub = onSnapshot(q,
      s=>{ setYaks(s.docs.map(d=>({id:d.id,...d.data()}))); },
      ()=>{ onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()})); setYaks(all.filter((y:any)=>y.college===userData.college)); }); }
    );
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
    if(navigator.vibrate) navigator.vibrate(12);
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
      const payload:any={text:String(newYak.trim()), uid:String(user.uid), username:String(userData.username), avatar:String(userData.avatar||'👻'), avatarBg:String(userData.avatarBg||'bg-zinc-900'), avatarGlow:String(userData.avatarGlow||''), college:String(userData.college), likes:0, dislikes:0, commentsCount:0, imageUrls:(images||[]).filter(Boolean).map(String), createdAt:serverTimestamp()};
      Object.keys(payload).forEach(k=>{ if(payload[k]===undefined) delete payload[k]; });
      await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setImages([]); setScreen('feed');
    }catch(e:any){ alert(e.message); } finally{ setPosting(false); }
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#050507] text-white flex flex-col">
        <style>{`body{background:#050507} ::-webkit-scrollbar{display:none} button{transition:all 0.25s cubic-bezier(0.16,1,0.3,1)} button:active{transform:scale(0.95)}`}</style>
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <div className="mt-6 flex items-center gap-3"><div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center font-black text-black text-xl shadow-[0_0_20px_rgba(255,255,255,0.3)]">Y</div><div><p className="font-black text-[18px] tracking-tighter leading-none">YAK</p><p className="text-[10px] tracking-[0.2em] text-zinc-500 font-bold">ATTRACTIVE HERD</p></div></div>
          <h1 className="text-[42px] font-black mt-8 leading-[0.85] tracking-tighter">Your college.<br/>Your herd.<br/><span className="text-zinc-600">Instantly.</span></h1>
          <p className="text-zinc-400 text-[13px] mt-3 leading-[1.4]">Enter avvagane ne college posts ye kanipisthay. Attractive anonymous.</p>
          <p className="font-bold mt-8 text-[10px] tracking-[0.2em] text-zinc-500">CHOOSE YOUR VIBE • ATTRACTIVE MASK</p>
          <div className="grid grid-cols-4 gap-3 mt-3">{AVATARS.map((av,i)=><button key={i} onClick={()=>setSelectedAvatar(av)} className={`h-[72px] rounded-[22px] border-2 text-2xl ${selectedAvatar.emoji===av.emoji?'border-white scale-105':'border-zinc-800 bg-zinc-900/50'} ${av.bg} ${av.glow} flex items-center justify-center`}>{av.emoji}</button>)}</div>
          <p className="font-bold mt-7 text-[10px] tracking-[0.2em] text-zinc-500">SELECT COLLEGE • INSTANT FEED</p>
          <div className="grid grid-cols-1 gap-3 mt-3">{COLLEGES.map(c=>{const a=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`p-4 rounded-[22px] border-2 text-left flex items-center justify-between transition-all ${a?'bg-white text-black border-white scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.2)]':'bg-[#0a0a0f] border-zinc-900 hover:border-zinc-800 text-white'}`}><div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${c.color} flex items-center justify-center text-xl`}>{c.emoji}</div><div><p className="font-black text-[14px]">{c.label} • {c.city}</p><p className={`text-[11px] ${a?'text-black/60':'text-zinc-500'}`}>{c.students} students • {c.yaks} yaks • Real herd</p></div></div><div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-xs ${a?'bg-black text-white border-black':'border-zinc-700 text-zinc-600'}`}>{a?'✓':'+'}</div></button>})}</div>
        </div>
        <div className="p-6 max-w-md mx-auto w-full sticky bottom-0 bg-[#050507]/80 backdrop-blur-xl border-t border-zinc-900/50"><button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full py-5 rounded-full font-black text-[15px] flex items-center justify-center gap-2 ${selectedCollege?'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]':'bg-zinc-900 text-zinc-700'}`}><span className="text-xl">{selectedAvatar.emoji}</span> Enter {selectedCollege||'College'} Herd → Instant Feed</button><p className="text-[10px] text-center text-zinc-600 mt-2 font-bold">Enter avvagane ne college posts kanipisthay • Attractive</p></div>
        <Footer/>
      </div>
    );
  }
  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-[#050507] text-white"><div className="max-w-md mx-auto min-h-screen flex flex-col"><div className="p-6"><button onClick={()=>setScreen('college')} className="w-10 h-10 bg-zinc-900 rounded-full">←</button><div className="mt-6 rounded-[28px] bg-[#0a0a0f] border border-zinc-900 p-6 flex gap-4"><div className={`w-16 h-16 rounded-[20px] ${selectedAvatar.bg} border-2 border-zinc-800 flex items-center justify-center text-3xl ${selectedAvatar.glow}`}>{selectedAvatar.emoji}</div><div><p className="text-[10px] tracking-[0.2em] text-zinc-500 font-bold">ATTRACTIVE • REAL PROOF</p><h1 className="text-[20px] font-black leading-none mt-1">Enter {selectedCollege} Herd</h1><p className="text-[11px] text-zinc-500 mt-1">Enter avvagane posts kanipisthay</p></div></div></div>
      <div className="px-6"><div className="flex p-1 bg-[#0a0a0f] border border-zinc-900 rounded-full"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-[13px] font-black ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>📧 Email</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-[13px] font-black ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>🎓 Roll</button></div></div>
      {verifyMethod==='email'?<div className="p-6 flex-1"><div className="bg-[#0a0a0f] border border-zinc-900 rounded-[24px] p-5"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder="college email" className="w-full p-4 bg-black border-2 border-zinc-900 rounded-2xl outline-none focus:border-zinc-700 font-bold"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-4 rounded-full font-black">Send Code</button>{otpSent&&<div className="mt-3 p-4 bg-black border border-green-900/50 rounded-2xl"><p className="text-xs text-green-400 font-bold">CODE: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" className="w-full mt-3 p-3 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-center tracking-[0.4em] font-black outline-none"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-green-500 text-black py-3 rounded-full font-black">Verify & Enter Herd</button></div>}</div></div>:<div className="p-6 flex-1"><div className="bg-[#0a0a0f] border border-zinc-900 rounded-[24px] p-5"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value)} placeholder="ROLL NUMBER" className="w-full p-4 bg-black border-2 border-zinc-900 rounded-2xl uppercase font-black tracking-widest outline-none"/><button onClick={handleRollVerify} className="w-full mt-3 bg-white text-black py-4 rounded-full font-black">Verify & Enter Herd</button></div></div>}
      <Footer/></div></div>
    );
  }
  if(screen==='login'){ return <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6"><div className={`w-28 h-28 rounded-[32px] border-2 border-white/10 flex items-center justify-center text-5xl ${selectedAvatar.bg} ${selectedAvatar.glow}`}>{selectedAvatar.emoji}</div><h1 className="text-[28px] font-black mt-6 tracking-tighter text-center">Welcome to<br/>{selectedCollege} Herd 🔥</h1><p className="text-zinc-500 text-sm mt-2">Enter avvagane ne college posts kanipisthay</p><button onClick={handleGoogleLogin} className="w-full max-w-sm mt-8 bg-white text-black py-4 rounded-full font-black">Continue with Google → Feed</button><div className="mt-16 w-full max-w-md"><Footer/></div></div>; }

    return(
    <div className="min-h-screen bg-[#050507] text-white flex flex-col">
      <style>{`body{background:#050507} ::-webkit-scrollbar{display:none} button{transition:all 0.25s cubic-bezier(0.16,1,0.3,1)} button:active{transform:scale(0.96)}`}</style>

      <div className="sticky top-0 z-30 bg-[#050507]/80 backdrop-blur-xl border-b border-zinc-900/50">
        <div className="max-w-[600px] mx-auto px-5 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black">Y</div>
            <div>
              <p className="font-black text-[15px] tracking-tighter leading-none">{userData.college} Herd • {yaks.length} yaks live</p>
              <p className="text-[11px] text-zinc-500 font-bold">Enter avvagane ne college posts • Real time • Attractive</p>
            </div>
          </div>
          <button onClick={()=>setShowProfile(true)} className={`w-11 h-11 rounded-full ${userData.avatarBg} border-2 border-white/10 flex items-center justify-center text-xl ${userData.avatarGlow} hover:scale-105 transition-all`}>{userData.avatar}</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 pb-[90px] p-3 space-y-3 mt-2">
        {/* Attractive User Welcome Card - First time */}
        <div className="bg-gradient-to-br from-white to-zinc-200 text-black rounded-[24px] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-[18px] ${userData.avatarBg} flex items-center justify-center text-2xl border-2 border-black/10 ${userData.avatarGlow}`}>{userData.avatar}</div>
            <div><p className="font-black text-[16px] leading-none">{userData.username} • Attractive ✨</p><p className="text-[12px] font-bold opacity-70 mt-1">{userData.college} herd • Yakarma {userData.yakarma} • Real student ✓</p><p className="text-[10px] font-bold opacity-50 mt-0.5">Enter avvagane ne college posts kanipisthunnay</p></div>
          </div>
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-black">→</div>
        </div>

        {yaks.map(y=>{
          const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0);
          return(
            <div key={y.id} className="bg-[#0a0a0f] border border-zinc-900 rounded-[26px] p-5 hover:border-zinc-800 transition-all">
              <div className="flex gap-3">
                <div className={`w-11 h-11 rounded-full ${y.avatarBg||'bg-zinc-900'} border-2 border-zinc-800 flex items-center justify-center text-lg relative ${y.avatarGlow||''} shrink-0`}>{y.avatar||'👻'}<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-[8px]">✓</div></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><p className="font-black text-[13px]">{y.username}</p><span className="px-2.5 py-0.5 bg-white text-black text-[9px] rounded-full font-black tracking-widest">{y.college} HERD</span><span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 text-[8px] rounded-full font-black">REAL</span><span className="text-[10px] text-zinc-600">• instant feed</span></div>
                  <p className="mt-2.5 text-[15px] leading-[1.5] font-medium">{y.text}</p>
                  {y.imageUrls?.[0] && <img src={y.imageUrls[0]} alt="" className="mt-3 rounded-[18px] w-full border border-zinc-900"/>}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex bg-[#111113] rounded-full border border-zinc-900 p-1"><button onClick={()=>handleVote(y,'up')} className={`px-4 py-1.5 rounded-full text-[13px] font-black transition-all ${liked?'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]':'text-zinc-500 hover:text-white'}`}>▲ {y.likes||0}</button><div className={`px-2 py-1.5 text-[12px] font-black ${score>0?'text-green-400':score<0?'text-red-400':'text-zinc-600'}`}>{score>0?`+${score}`:score}</div><button onClick={()=>handleVote(y,'down')} className={`px-3 py-1.5 rounded-full text-[13px] font-black ${disliked?'bg-red-500 text-white':'text-zinc-600 hover:text-zinc-300'}`}>▼ {y.dislikes||0}</button></div>
                    <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#111113] border border-zinc-900 px-4 h-[36px] rounded-full text-[12px] font-bold text-zinc-500 hover:text-zinc-300 hover:border-zinc-800 transition-all">💬 {y.commentsCount||0}</button>
                  </div>
                  {activePost===y.id && <div className="mt-4 border-t border-zinc-900/50 pt-4"><div className="space-y-3 max-h-[300px] overflow-y-auto">{comments.map(c=>{ const isReply=!!c.replyTo; return <div key={c.id} className={`${isReply?'ml-8 border-l-2 border-zinc-800 pl-3':''} flex gap-2.5`}><div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-sm shrink-0">{c.avatar||'👻'}</div><div className="flex-1"><div className="bg-[#111113] border border-zinc-900 rounded-2xl px-4 py-2.5"><p className="text-[13px]">{c.replyTo && <span className="text-[11px] text-violet-400 font-bold">@{c.replyTo} </span>}{c.text}</p></div><button onClick={()=>setReplyTo(c)} className="text-[10px] font-bold text-zinc-500 mt-1 ml-1">↩ Reply</button></div></div>})}</div><div className="flex gap-2 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={replyTo?`Reply to ${replyTo.username}...`:"Add comment..."} className="flex-1 bg-[#111113] border border-zinc-900 rounded-full px-5 h-11 text-sm outline-none focus:border-zinc-700"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText,uid:user.uid,username:userData.username,avatar:userData.avatar,replyTo:replyTo?.username||null,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); setReplyTo(null); }} className="w-11 h-11 bg-white text-black rounded-full font-black shrink-0">↑</button></div></div>}
                </div>
              </div>
            </div>
          );
        })}
        {yaks.length===0 && <div className="py-16 text-center"><div className={`w-24 h-24 rounded-[28px] mx-auto flex items-center justify-center text-4xl border-2 border-white/10 ${userData.avatarBg} ${userData.avatarGlow}`}>{userData.avatar}</div><p className="font-black mt-6 text-[20px] tracking-tighter">Welcome to {userData.college} Herd 🔥</p><p className="text-sm text-zinc-500 mt-2">Ne college ki nuvve first - instant feed active</p><p className="text-[11px] text-zinc-600 mt-1 font-bold">Enter avvagane ne college posts kanipisthay - ippudu nuvve start chey</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full font-black text-sm shadow-[0_0_30px_rgba(255,255,255,0.2)]">+ First Yak in {userData.college}</button><div className="mt-12"><Footer/></div></div>}
        {yaks.length>0 && <Footer/>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#050507]/80 backdrop-blur-xl border-t border-zinc-900/50"><div className="max-w-[600px] mx-auto px-8 h-[80px] flex items-center justify-between"><button className="flex flex-col items-center gap-1 text-white"><div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-black font-black text-xs">⌂</div><span className="text-[9px] font-black tracking-widest">{userData.college} FEED</span></button><button onClick={()=>setScreen('create')} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1"><div className={`w-7 h-7 rounded-full ${userData.avatarBg} border border-white/10 flex items-center justify-center text-sm ${userData.avatarGlow}`}>{userData.avatar}</div><span className="text-[9px] font-black tracking-widest">YOU • {userData.yakarma}</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#050507] z-40"><div className="max-w-[600px] mx-auto h-full flex flex-col"><div className="p-4 flex items-center justify-between border-b border-zinc-900/50"><button onClick={()=>setScreen('feed')} className="w-9 h-9 bg-zinc-900 rounded-full text-white">✕</button><div className="flex items-center gap-2"><div className={`w-7 h-7 rounded-full ${userData.avatarBg} flex items-center justify-center text-sm ${userData.avatarGlow}`}>{userData.avatar}</div><p className="font-bold text-[11px] tracking-widest">{userData.college} HERD • ATTRACTIVE • REAL</p></div><button onClick={handlePost} disabled={posting ||!newYak.trim()} className={`px-5 h-9 rounded-full font-black text-sm ${!newYak.trim()?'bg-zinc-900 text-zinc-700':'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}>{posting?'Posting...':'Yak'}</button></div>
        <div className="p-5 flex-1 overflow-y-auto"><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}? Anonymous ga cheppu... Enter avvagane andariki kanipisthundi`} autoFocus className="w-full bg-transparent text-[22px] outline-none placeholder:text-zinc-800 resize-none min-h-[160px] font-medium" maxLength={300}/><div className="mt-2 flex justify-between"><span className="text-[11px] text-zinc-600 font-bold">Posting to {userData.college} herd • Instant feed • Attractive</span><span className={`text-[12px] font-bold ${newYak.length>250?'text-red-400':'text-zinc-600'}`}>{newYak.length}/300</span></div><label className="mt-6 border-2 border-dashed border-zinc-800 rounded-[18px] p-6 flex flex-col items-center cursor-pointer hover:border-zinc-700 transition-all"><span className="text-[11px] font-black tracking-widest text-zinc-500">ADD PHOTO • Attractive post</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setImages([r.result as string]); r.readAsDataURL(f); } }}/></label>{images[0] && <div className="mt-4 relative"><img src={images[0]} alt="" className="rounded-[18px] w-full border border-zinc-900"/><button onClick={()=>setImages([])} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full text-white">✕</button></div>}</div>
        <div className="p-4 border-t border-zinc-900/50"><Footer/></div>
        </div></div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#0a0a0f] border border-zinc-900 w-full max-w-[600px] rounded-t-[32px] p-6 pb-8 max-h-[85vh] overflow-y-auto"><div className="w-10 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6"></div>
        {/* ATTRACTIVE USER CARD */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[28px] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[30px]"></div>
          <div className="flex gap-4 relative"><div className={`w-20 h-20 rounded-[22px] ${userData.avatarBg} border-2 border-white/20 flex items-center justify-center text-3xl ${userData.avatarGlow} shadow-2xl`}>{userData.avatar}</div><div className="flex-1"><h2 className="font-black text-[22px] tracking-tighter leading-none">{userData.username}</h2><p className="text-[13px] font-bold text-white/70 mt-1">Attractive • Anonymous • {userData.college} Herd</p><div className="flex gap-2 mt-3"><span className="px-3 py-1.5 bg-white text-black rounded-full text-[11px] font-black">Yakarma {userData.yakarma} ✨</span><span className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-[10px] font-black">✓ REAL STUDENT</span></div></div></div>
          <div className="mt-5 grid grid-cols-3 gap-2"><div className="bg-white/5 border border-white/10 rounded-[14px] p-3 text-center"><p className="text-[20px] font-black">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-zinc-500">YAKS</p></div><div className="bg-white/5 border border-white/10 rounded-[14px] p-3 text-center"><p className="text-[20px] font-black">{yaks.length}</p><p className="text-[9px] font-bold tracking-widest text-zinc-500">HERD FEED</p></div><div className="bg-white/5 border border-white/10 rounded-[14px] p-3 text-center"><p className="text-[20px] font-black">{userData.yakarma}</p><p className="text-[9px] font-bold tracking-widest text-zinc-500">KARMA</p></div></div>
          <p className="text-[11px] text-zinc-500 mt-4 leading-[1.4]">💡 Enter avvagane <b className="text-white">{userData.college}</b> posts ye kanipisthunnay. Ne posts kuda instant ga {userData.college} herd lo kanipisthay. Attractive anonymous.</p>
        </div>
        <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-zinc-900 border border-zinc-800 h-11 rounded-full font-bold text-sm">Log out</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-11 rounded-full font-black">Close</button><div className="mt-4"><Footer/></div></div></div>
      )}
    </div>
  );
}
