import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc, arrayUnion, arrayRemove, setDoc, limit } from 'firebase/firestore';

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
const ADMIN_EMAILS = ["anesh@gmail.com","aneshproductions@gmail.com"];

const COLLEGES = [
  {id:"SRET", label:"SRET", city:"Tirupati", color:"from-blue-600 to-cyan-500", emoji:"🎓", domains:["sret.edu.in","sret.ac.in","srit.ac.in"], rollPattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, rollExample:"21CS101"},
  {id:"SVCE", label:"SVCE", city:"Tirupati", color:"from-emerald-600 to-teal-500", emoji:"🚀", domains:["svce.edu.in","svce.ac.in"], rollPattern:/^(19|20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, rollExample:"20CS123"},
  {id:"BITS", label:"BITS", city:"Pilani", color:"from-violet-600 to-indigo-600", emoji:"⚡", domains:["bits-pilani.ac.in","bits.edu"], rollPattern:/^20[0-9]{2}[A-Z]{2,4}[0-9]{4}$/i, rollExample:"2021CS1234"},
  {id:"ST.JOHNS", label:"ST.JOHNS", city:"Tirupati", color:"from-orange-600 to-red-500", emoji:"🔥", domains:["stjohns.edu.in","sjct.ac.in"], rollPattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, rollExample:"22CS045"},
  {id:"VEMU", label:"VEMU", city:"Chittoor", color:"from-amber-500 to-orange-500", emoji:"💎", domains:["vemu.edu.in","vemu.ac.in"], rollPattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, rollExample:"21IT089"},
  {id:"OTHER", label:"OTHER", city:"India", color:"from-zinc-700 to-zinc-900", emoji:"🌍", domains:["edu.in","ac.in"], rollPattern:/^[A-Z0-9]{6,15}$/i, rollExample:"COL12345"},
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
    <p className="text-[10px] text-zinc-600">Real • Hot • Report • Leaderboard • Push • Admin</p>
  </div>
);

export default function YakApp(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hot'|'trending'>('new');
  const [yaks,setYaks]=useState<any[]>([]);
  const [hotYaks,setHotYaks]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [pendingIDs,setPendingIDs]=useState<any[]>([]);
  const [collegeCounts,setCollegeCounts]=useState<Record<string,number>>({});
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [images,setImages]=useState<string[]>([]);
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [replyTo,setReplyTo]=useState<any>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [showAdmin,setShowAdmin]=useState(false);
  const [selectedCollege,setSelectedCollege]=useState('');
  const [selectedAvatar,setSelectedAvatar]=useState(AVATARS[0]);
  const [collegeEmail,setCollegeEmail]=useState('');
  const [rollNumber,setRollNumber]=useState('');
  const [idImage,setIdImage]=useState<string>('');
  const [idName,setIdName]=useState('');
  const [verifyMethod,setVerifyMethod]=useState<'email'|'roll'|'id'>('email');
  const [otp,setOtp]=useState('');
  const [generatedOtp,setGeneratedOtp]=useState('');
  const [otpSent,setOtpSent]=useState(false);
  const [isVerified,setIsVerified]=useState(false);
  const [posting,setPosting]=useState(false);
  const [editingPost,setEditingPost]=useState<any>(null);
  const [editText,setEditText]=useState('');
  const [showMenu,setShowMenu]=useState<string|null>(null);
  const [verifyError,setVerifyError]=useState('');
  const [pushEnabled,setPushEnabled]=useState(false);

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{ if("Notification" in window && Notification.permission==="granted") setPushEnabled(true); },[]);
  const requestPush=async()=>{ if(!("Notification" in window)) return; const p=await Notification.requestPermission(); if(p==="granted"){ setPushEnabled(true); try{ new Notification("YAK 🔥",{body:`${userData?.college||selectedCollege} herd push ON`}); }catch{} } };

  useEffect(()=>{ return onSnapshot(collection(db,'users'), snap=>{ const counts:Record<string,number>={}; snap.docs.forEach(d=>{ const col=(d.data() as any).college; if(col) counts[col]=(counts[col]||0)+1; }); setCollegeCounts(counts); setTotalUsers(snap.size); }); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college'); if(!col ||!isVerified){ setScreen('college'); return; }
          let av:any=AVATARS[0]; try{ const s=localStorage.getItem('selected_avatar_data'); if(s) av=JSON.parse(s); }catch{}
          const safeAv={emoji:String(av?.emoji||"👻"), bg:String(av?.bg||"bg-zinc-900"), glow:String(av?.glow||"")};
          await addDoc(collection(db,'users'),{ uid:u.uid, email:u.email||'', username:'Yak_'+Math.floor(Math.random()*9000+1000), avatar:safeAv.emoji, avatarBg:safeAv.bg, avatarGlow:safeAv.glow, college:String(col), collegeEmail:String(localStorage.getItem('college_email')||''), rollNumber:String(localStorage.getItem('roll_number')||''), idImage:String(localStorage.getItem('id_image')||''), idName:String(localStorage.getItem('id_name')||''), verifyMethod:String(localStorage.getItem('verify_method')||'email'), idVerified: localStorage.getItem('verify_method')==='id'? false : true, yakarma:120, totalPosts:0, likedPosts:[], dislikedPosts:[], reportedPosts:[], createdAt:serverTimestamp() });
          window.location.reload();
        }else{
          let raw:any={id:snap.docs[0].id,...snap.docs[0].data()};
          if(!raw.avatarBg){ const f={avatar:raw.avatar||"👻", avatarBg:"bg-zinc-900", avatarGlow:""}; await updateDoc(doc(db,'users',raw.id),f); raw={...raw,...f}; }
          setUserData(raw); setScreen('feed');
        }
      }else setScreen('college');
    });
  },[isVerified]);

    useEffect(()=>{
    if(!userData?.college) return;
    const q = query(collection(db,'yaks'), where('college','==', userData.college), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, s=>{
      const data=s.docs.map(d=>({id:d.id,...d.data()} as any));
      setYaks(data); setHotYaks([...data].sort((a,b)=> ((b.likes||0)-(b.dislikes||0)) - ((a.likes||0)-(a.dislikes||0)) ).slice(0,20));
      if(pushEnabled && data.length>0){ const latest=data[0]; if(latest.uid!==user?.uid && Date.now() - (latest.createdAt?.toMillis?.()||0) < 12000){ try{ new Notification(`🔥 New Yak in ${userData.college}`,{body: latest.text.slice(0,60)}); }catch{} } }
    }, ()=>{ onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((y:any)=>y.college===userData.college); setYaks(all); setHotYaks([...all].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20)); }); });
    return ()=>unsub();
  },[userData, pushEnabled, user]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(query(collection(db,'users'), where('college','==', userData.college), orderBy('yakarma','desc'), limit(10)), s=>{ setLeaderboard(s.docs.map(d=>({id:d.id,...d.data()}))); }); },[userData]);
  useEffect(()=>{ if(!user ||!ADMIN_EMAILS.includes(user.email||'')) return; return onSnapshot(query(collection(db,'users'), where('idVerified','==', false)), s=>{ setPendingIDs(s.docs.map(d=>({id:d.id,...d.data()}))); }); },[user]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

  const getCollegeConfig=()=>COLLEGES.find(c=>c.id===selectedCollege);
  const handleCollegeNext=()=>{ if(!selectedCollege) return; localStorage.setItem('selected_college',selectedCollege); localStorage.setItem('selected_avatar_data',JSON.stringify(selectedAvatar)); setScreen('verify'); };
  const handleEmailVerify=async()=>{
    setVerifyError(''); const config=getCollegeConfig(); if(!config) return;
    const emailLower=collegeEmail.toLowerCase().trim();
    const isRealDomain=config.domains.some(d=>emailLower.endsWith(d.toLowerCase()));
    if(!isRealDomain){ setVerifyError(`❌ Only real ${selectedCollege} mail: ${config.domains.join(' or ')}`); return; }
    const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower)));
    if(!dup.empty){ setVerifyError('❌ This real mail already used!'); return; }
    const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode);
    await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,college:selectedCollege,createdAt:serverTimestamp()}); setOtpSent(true);
  };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('❌ Wrong OTP. Real: '+d.otp); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{
    setVerifyError(''); const config=getCollegeConfig(); if(!config) return;
    const rollUpper=rollNumber.trim().toUpperCase();
    if(!config.rollPattern.test(rollUpper)){ setVerifyError(`❌ Invalid ${selectedCollege} roll. Ex: ${config.rollExample}`); return; }
    const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper)));
    if(!dup.empty){ setVerifyError('❌ This real roll already used!'); return; }
    localStorage.setItem('roll_number',rollUpper); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login');
  };
  const handleIdVerify=async()=>{
    setVerifyError(''); if(!idImage){ setVerifyError('❌ Upload real ID photo'); return; } if(!idName.trim()){ setVerifyError('❌ Name as on ID'); return; }
    localStorage.setItem('id_image',idImage); localStorage.setItem('id_name',idName.trim().toUpperCase()); localStorage.setItem('verify_method','id'); setIsVerified(true); setScreen('login');
  };
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
  const handleReport=async(y:any)=>{
    if(userData.reportedPosts?.includes(y.id)) return alert('Already reported');
    if(!confirm(`Report? 5 reports = auto delete`)) return;
    await updateDoc(doc(db,'yaks',y.id),{reports:increment(1), reportedBy:arrayUnion(userData.uid)});
    await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)});
    const updated= (y.reports||0)+1;
    if(updated>=5){ await deleteDoc(doc(db,'yaks',y.id)); alert('🚨 5 reports - deleted'); }
    else alert(`Reported ${updated}/5`);
    setShowMenu(null);
  };
  const handlePost=async()=>{
    if(!userData || (!newYak.trim() && images.length===0)) return;
    setPosting(true);
    try{
      const payload:any={text:String(newYak.trim()), uid:String(user.uid), username:String(userData.username), avatar:String(userData.avatar||'👻'), avatarBg:String(userData.avatarBg||'bg-zinc-900'), avatarGlow:String(userData.avatarGlow||'bg-zinc-900'), college:String(userData.college), likes:0, dislikes:0, commentsCount:0, reports:0, reportedBy:[], imageUrls:(images||[]).filter(Boolean).map(String), createdAt:serverTimestamp()};
      Object.keys(payload).forEach(k=>{ if(payload[k]===undefined) delete payload[k]; });
      await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setImages([]); setScreen('feed');
    }catch(e:any){ alert(e.message); } finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(!confirm(`Delete?`)) return; if(user?.uid!==y.uid) return; await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1), yakarma:increment(-5)}); setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost ||!editText.trim()) return; await updateDoc(doc(db,'yaks',editingPost.id),{text:String(editText.trim()), edited:true, editedAt:serverTimestamp()}); setEditingPost(null); setEditText(''); setShowMenu(null); };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#050507] text-white flex flex-col">
        <style>{`body{background:#050507} ::-webkit-scrollbar{display:none} button{transition:all 0.25s} button:active{transform:scale(0.95)}`}</style>
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <div className="mt-6 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center font-black text-black text-xl">Y</div><div><p className="font-black text-[18px] tracking-tighter leading-none">YAK PRO MAX</p><p className="text-[10px] tracking-[0.2em] text-zinc-500 font-bold">REAL • HOT • REPORT • LEADER • PUSH • ADMIN</p></div></div><div className="bg-white/10 border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] font-black">{totalUsers} REAL</p></div></div>
          <h1 className="text-[42px] font-black mt-8 leading-[0.85] tracking-tighter">Real mail.<br/>Hot feed.<br/><span className="text-zinc-600">Pro Max.</span></h1>
          <p className="font-bold mt-8 text-[10px] tracking-[0.2em] text-zinc-500">CHOOSE VIBE • ATTRACTIVE</p>
          <div className="grid grid-cols-4 gap-3 mt-3">{AVATARS.map((av,i)=><button key={i} onClick={()=>setSelectedAvatar(av)} className={`h-[72px] rounded-[22px] border-2 text-2xl ${selectedAvatar.emoji===av.emoji?'border-white scale-105':'border-zinc-800 bg-zinc-900/50'} ${av.bg} ${av.glow} flex items-center justify-center`}>{av.emoji}</button>)}</div>
          <p className="font-bold mt-7 text-[10px] tracking-[0.2em] text-zinc-500">SELECT COLLEGE • LIVE REAL COUNT</p>
          <div className="grid grid-cols-1 gap-3 mt-3">{COLLEGES.map(c=>{const a=selectedCollege===c.id; const count=collegeCounts[c.id]||0; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`p-4 rounded-[22px] border-2 text-left flex items-center justify-between ${a?'bg-white text-black border-white scale-[1.02]':'bg-[#0a0a0f] border-zinc-900 text-white'}`}><div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${c.color} flex items-center justify-center text-xl`}>{c.emoji}</div><div><p className="font-black text-[14px]">{c.label} • {c.city}</p><p className={`text-[11px] ${a?'text-black/60':'text-zinc-500'}`}>{count} real • {c.domains[0]}</p></div></div><div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-xs ${a?'bg-black text-white border-black':'border-zinc-700 text-zinc-600'}`}>{a?'✓':count>0?String(count):'+'}</div></button>})}</div>
        </div>
        <div className="p-6 max-w-md mx-auto w-full sticky bottom-0 bg-[#050507]/80 backdrop-blur-xl border-t border-zinc-900/50"><button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full py-5 rounded-full font-black text-[15px] flex items-center justify-center gap-2 ${selectedCollege?'bg-white text-black':'bg-zinc-900 text-zinc-700'}`}><span className="text-xl">{selectedAvatar.emoji}</span> Enter {selectedCollege||'College'} Pro Max →</button></div>
        <Footer/>
      </div>
    );
  }
  if(screen==='verify'){
    const config=getCollegeConfig(); const count=collegeCounts[selectedCollege]||0;
    return(
      <div className="min-h-screen bg-[#050507] text-white"><div className="max-w-md mx-auto min-h-screen flex flex-col"><div className="p-6"><button onClick={()=>setScreen('college')} className="w-10 h-10 bg-zinc-900 rounded-full">←</button><div className="mt-6 rounded-[28px] bg-[#0a0a0f] border border-zinc-900 p-6"><div className="flex gap-4"><div className={`w-16 h-16 rounded-[20px] ${selectedAvatar.bg} flex items-center justify-center text-3xl ${selectedAvatar.glow}`}>{selectedAvatar.emoji}</div><div className="flex-1"><p className="text-[10px] tracking-[0.2em] text-zinc-500 font-bold">REAL VERIFY • {count} REAL IN {selectedCollege}</p><h1 className="text-[20px] font-black leading-none mt-1">Prove Real Student</h1><p className="text-[11px] text-zinc-500 mt-1">Domain: {config?.domains.join(', ')}</p></div></div></div></div>
      <div className="px-6"><div className="flex p-1 bg-[#0a0a0f] border border-zinc-900 rounded-full"><button onClick={()=>{setVerifyMethod('email'); setVerifyError('');}} className={`flex-1 py-3 rounded-full text-[10px] font-black ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>📧 Real Mail</button><button onClick={()=>{setVerifyMethod('roll'); setVerifyError('');}} className={`flex-1 py-3 rounded-full text-[10px] font-black ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>🎓 Real Roll</button><button onClick={()=>{setVerifyMethod('id'); setVerifyError('');}} className={`flex-1 py-3 rounded-full text-[10px] font-black ${verifyMethod==='id'?'bg-white text-black':'text-zinc-500'}`}>🪪 Real ID</button></div></div>
      {verifyError && <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-[14px] p-3"><p className="text-[12px] text-red-400 font-bold">{verifyError}</p></div>}
      {verifyMethod==='email' && <div className="p-6 flex-1"><div className="bg-[#0a0a0f] border border-zinc-900 rounded-[24px] p-5"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full mt-3 p-4 bg-black border-2 border-zinc-900 rounded-2xl outline-none font-bold"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-4 rounded-full font-black">Send Code</button>{otpSent&&<div className="mt-3 p-4 bg-black border border-green-900/50 rounded-2xl"><p className="text-xs text-green-400 font-bold">CODE: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" className="w-full mt-3 p-3 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-center tracking-[0.4em] font-black outline-none"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-green-500 text-black py-3 rounded-full font-black">Verify Real Mail ✓</button></div>}</div></div>}
      {verifyMethod==='roll' && <div className="p-6 flex-1"><div className="bg-[#0a0a0f] border border-zinc-900 rounded-[24px] p-5"><p className="text-[11px] font-black tracking-widest text-zinc-500">REAL ROLL ONLY - {config?.rollExample}</p><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={config?.rollExample} className="w-full mt-3 p-4 bg-black border-2 border-zinc-900 rounded-2xl uppercase font-black tracking-widest outline-none"/><button onClick={handleRollVerify} className="w-full mt-3 bg-white text-black py-4 rounded-full font-black">Verify Real Roll ✓</button></div></div>}
      {verifyMethod==='id' && <div className="p-6 flex-1"><div className="bg-[#0a0a0f] border border-zinc-900 rounded-[24px] p-5"><p className="text-[11px] font-black tracking-widest text-zinc-500">REAL ID - Admin verify</p><input value={idName} onChange={e=>setIdName(e.target.value.toUpperCase())} placeholder="NAME AS ON ID" className="w-full mt-3 p-4 bg-black border-2 border-zinc-900 rounded-2xl uppercase font-black tracking-widest outline-none"/><label className="mt-3 border-2 border-dashed border-zinc-700 rounded-[18px] p-6 flex flex-col items-center cursor-pointer"><span className="text-[11px] font-black tracking-widest text-zinc-500">📸 UPLOAD REAL ID CARD</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setIdImage(r.result as string); r.readAsDataURL(f); } }}/></label>{idImage && <div className="mt-4 relative"><img src={idImage} alt="" className="rounded-[18px] w-full border-2 border-green-500/30"/><button onClick={()=>setIdImage('')} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full text-white">✕</button></div>}<button onClick={handleIdVerify} disabled={!idImage ||!idName.trim()} className={`w-full mt-4 py-4 rounded-full font-black ${!idImage||!idName.trim()?'bg-zinc-900 text-zinc-700':'bg-white text-black'}`}>Submit Real ID ✓</button></div></div>}
      <Footer/></div></div>
    );
  }
  if(screen==='login'){ const count=collegeCounts[selectedCollege]||0; return <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6"><div className={`w-28 h-28 rounded-[32px] border-2 border-white/10 flex items-center justify-center text-5xl ${selectedAvatar.bg} ${selectedAvatar.glow}`}>{selectedAvatar.emoji}</div><h1 className="text-[28px] font-black mt-6 tracking-tighter text-center">Real Verified ✓<br/>{selectedCollege} Herd Pro Max 🔥</h1><p className="text-zinc-500 text-sm mt-2">{count} real • You #{count+1}</p><button onClick={handleGoogleLogin} className="w-full max-w-sm mt-8 bg-white text-black py-4 rounded-full font-black">Continue → Pro Max Feed</button><div className="mt-16 w-full max-w-md"><Footer/></div></div>; }

   return(
    <div className="min-h-screen bg-[#050507] text-white flex flex-col">
      <style>{`body{background:#050507} ::-webkit-scrollbar{display:none} button{transition:all 0.25s cubic-bezier(0.16,1,0.3,1)} button:active{transform:scale(0.94)}.attractive-glow{animation:glowPulse 2.5s infinite} @keyframes glowPulse{0%,100%{filter:brightness(1) drop-shadow(0 0 12px rgba(255,255,255,0.2))}50%{filter:brightness(1.2) drop-shadow(0 0 22px rgba(255,255,255,0.35))}}`}</style>
      <div className="sticky top-0 z-30 bg-[#050507]/80 backdrop-blur-xl border-b border-zinc-900/50">
        <div className="max-w-[600px] mx-auto px-5 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black attractive-glow">Y</div><div><p className="font-black text-[15px] tracking-tighter leading-none">{userData.college} Pro Max • {collegeCounts[userData.college]||0} real</p><p className="text-[11px] text-zinc-500 font-bold">Push {pushEnabled?'ON ✓':'OFF'} • {yaks.length} yaks • Pending {pendingIDs.length}</p></div></div>
          <div className="flex gap-2"><button onClick={requestPush} className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm ${pushEnabled?'bg-green-500 text-black border-green-500':'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>🔔</button><button onClick={()=>setShowAdmin(true)} className={`${ADMIN_EMAILS.includes(user?.email||'')?'flex':'hidden'} w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center text-sm`}>🛡️</button><button onClick={()=>setShowProfile(true)} className={`w-11 h-11 rounded-full ${userData.avatarBg} border-2 border-white/20 flex items-center justify-center text-xl ${userData.avatarGlow} attractive-glow`}>{userData.avatar}</button></div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2">
          <button onClick={()=>setFeedTab('new')} className={`flex-1 h-10 rounded-full text-[12px] font-black tracking-widest border ${feedTab==='new'?'bg-white text-black border-white':'bg-[#0a0a0f] border-zinc-900 text-zinc-500'}`}>NEW • {yaks.length}</button>
          <button onClick={()=>setFeedTab('hot')} className={`flex-1 h-10 rounded-full text-[12px] font-black tracking-widest border ${feedTab==='hot'?'bg-orange-500 text-black border-orange-500':'bg-[#0a0a0f] border-zinc-900 text-zinc-500'}`}>🔥 HOT • {hotYaks.length}</button>
          <button onClick={()=>setFeedTab('trending')} className={`flex-1 h-10 rounded-full text-[12px] font-black tracking-widest border ${feedTab==='trending'?'bg-violet-500 text-white border-violet-500':'bg-[#0a0a0f] border-zinc-900 text-zinc-500'}`}>🏆 TOP</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 pb-[90px] p-3 space-y-3 mt-2">
        {feedTab==='trending'? (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[24px] p-5"><p className="text-[11px] font-black tracking-[0.2em] text-white/70">🏆 {userData.college} LEADERBOARD • TOP YAKARMA</p><p className="text-[22px] font-black mt-1 text-white">Weekly Kings 👑</p></div>
            {leaderboard.map((u:any,i:number)=><div key={u.id} className={`bg-[#0a0a0f] border ${i===0?'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]':'border-zinc-900'} rounded-[20px] p-4 flex items-center justify-between`}><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${i===0?'bg-yellow-500 text-black':i===1?'bg-zinc-300 text-black':i===2?'bg-orange-500 text-black':'bg-zinc-900 text-zinc-500'}`}>{i+1}</div><div className={`w-11 h-11 rounded-full ${u.avatarBg||'bg-zinc-900'} flex items-center justify-center text-lg border border-zinc-800`}>{u.avatar||'👻'}</div><div><p className="font-black text-[14px]">{u.username} {i===0&&'👑'} {u.id===userData.id&&'• YOU ✨'}</p><p className="text-[11px] text-zinc-500">{u.college} • {u.totalPosts||0} yaks</p></div></div><div className="text-right"><p className="text-[18px] font-black">{u.yakarma}</p><p className="text-[9px] font-bold tracking-widest text-zinc-500">KARMA</p></div></div>)}
            <Footer/>
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-br from-white via-zinc-100 to-zinc-300 rounded-[28px] p-[1.5px] attractive-glow"><div className="bg-gradient-to-br from-white to-zinc-200 rounded-[26px] p-5 relative overflow-hidden"><div className="relative flex items-start justify-between"><div className="flex gap-4"><div className="relative"><div className={`w-[68px] h-[68px] rounded-[20px] ${userData.avatarBg} border-[3px] border-black/10 flex items-center justify-center text-[30px] ${userData.avatarGlow} attractive-glow`}>{userData.avatar}</div><div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-[3px] border-white rounded-full flex items-center justify-center text-[10px] font-black">✓</div></div><div><h2 className="font-black text-[18px] tracking-tighter leading-none">{userData.username} • Attractive ✨</h2><p className="text-[11px] font-bold opacity-70 mt-1">{userData.college} • {collegeCounts[userData.college]||0} real • Push {pushEnabled?'ON':'OFF'}</p><div className="flex gap-2 mt-2"><span className="px-3 py-1.5 bg-black text-white rounded-full text-[10px] font-black">🔥 {userData.yakarma}</span><button onClick={requestPush} className={`px-3 py-1.5 rounded-full text-[10px] font-black border ${pushEnabled?'bg-green-500 text-black border-green-500':'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>{pushEnabled?'🔔 ON':'🔕 Push'}</button></div></div></div><div className="text-right"><p className="text-[22px] font-black leading-none">{feedTab==='hot'? hotYaks.length : yaks.length}</p><p className="text-[8px] font-black tracking-widest opacity-60">{feedTab.toUpperCase()}</p></div></div></div></div>

                        {(feedTab==='new'? yaks : hotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isHot= (y.likes||0) >=5;
              return(
                <div key={y.id} className={`bg-[#0a0a0f] border rounded-[26px] p-5 relative ${isHot?'border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]':isOwn?'border-white/20':'border-zinc-900'}`}>
                  {isHot && <div className="absolute -top-2 -right-2 bg-orange-500 text-black px-2.5 py-1 rounded-full text-[9px] font-black">🔥 HOT • {y.likes}</div>}
                  <div className="flex justify-between items-start"><div className="flex gap-3"><div className={`w-11 h-11 rounded-full ${y.avatarBg||'bg-zinc-900'} border-2 flex items-center justify-center text-lg relative ${y.avatarGlow||''} shrink-0 ${isOwn?'border-white/30 attractive-glow':'border-zinc-800'}`}>{y.avatar||'👻'}{isOwn && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black rounded-full flex items-center justify-center text-[8px] font-black">YOU</div>}<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-[8px]">✓</div></div><div><div className="flex items-center gap-2 flex-wrap"><p className="font-black text-[13px]">{y.username} {isOwn&&'• YOU ✨'}</p><span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${isOwn?'bg-white text-black':'bg-white/10 text-zinc-400 border border-white/10'}`}>{y.college} • {collegeCounts[y.college]||0} REAL</span>{y.reports>0 && <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full text-[8px] font-black">{y.reports}/5</span>}</div><p className="text-[10px] text-zinc-500">{score} score • {isHot?'Trending 🔥':'New'}</p></div></div>
                    <div className="relative"><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-8 h-8 bg-[#111113] border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500">⋯</button>{showMenu===y.id && (<div className="absolute right-0 top-10 w-[180px] bg-[#111113] border border-zinc-800 rounded-[18px] p-2 z-20 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">{isOwn? <><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-3.5 py-3 rounded-[12px] text-[13px] font-bold hover:bg-white hover:text-black flex items-center gap-2"><span>✏️</span> Edit</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-3.5 py-3 rounded-[12px] text-[13px] font-bold hover:bg-red-500 hover:text-white text-red-400 flex items-center gap-2 mt-1"><span>🗑️</span> Delete</button></> : <button onClick={()=>handleReport(y)} className="w-full text-left px-3.5 py-3 rounded-[12px] text-[13px] font-bold hover:bg-red-500 hover:text-white text-red-400 flex items-center gap-2"><span>🚨</span> Report ({y.reports||0}/5)</button>}<button onClick={()=>setShowMenu(null)} className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold text-zinc-500 hover:bg-zinc-800 mt-2">Cancel</button></div>)}</div>
                  </div>
                  <p className="mt-3 text-[15px] leading-[1.5] font-medium">{y.text}</p>{y.imageUrls?.[0] && <img src={y.imageUrls[0]} alt="" className="mt-3 rounded-[18px] w-full border border-zinc-900"/>}
                  <div className="mt-4 flex items-center gap-2"><div className="flex bg-[#111113] rounded-full border border-zinc-900 p-1"><button onClick={()=>handleVote(y,'up')} className={`px-4 py-1.5 rounded-full text-[13px] font-black ${liked?'bg-white text-black':'text-zinc-500'}`}>▲ {y.likes||0}</button><div className={`px-2 py-1.5 text-[12px] font-black ${score>0?'text-green-400':score<0?'text-red-400':'text-zinc-600'}`}>{score}</div><button onClick={()=>handleVote(y,'down')} className={`px-3 py-1.5 rounded-full text-[13px] font-black ${disliked?'bg-red-500 text-white':'text-zinc-600'}`}>▼</button></div><button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#111113] border border-zinc-900 px-4 h-[36px] rounded-full text-[12px] font-bold text-zinc-500">💬 {y.commentsCount||0}</button></div>
                  {activePost===y.id && <div className="mt-4 border-t border-zinc-900/50 pt-4"><div className="space-y-3 max-h-[300px] overflow-y-auto">{comments.map(c=>{ const isReply=!!c.replyTo; return <div key={c.id} className={`${isReply?'ml-8 border-l-2 border-zinc-800 pl-3':''} flex gap-2.5`}><div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-sm shrink-0 border border-zinc-800">{c.avatar||'👻'}</div><div className="flex-1"><div className="bg-[#111113] border border-zinc-900 rounded-2xl px-4 py-2.5"><p className="text-[13px]">{c.replyTo && <span className="text-[11px] text-violet-400 font-bold">@{c.replyTo} </span>}{c.text}</p></div><button onClick={()=>setReplyTo(c)} className="text-[10px] font-bold text-zinc-500 mt-1 ml-1">↩ Reply</button></div></div>})}</div><div className="flex gap-2 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={replyTo?`Reply to ${replyTo.username}...`:"Add comment..."} className="flex-1 bg-[#111113] border border-zinc-900 rounded-full px-5 h-11 text-sm outline-none focus:border-white/30"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText,uid:user.uid,username:userData.username,avatar:userData.avatar,replyTo:replyTo?.username||null,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); setReplyTo(null); }} className="w-11 h-11 bg-white text-black rounded-full font-black shrink-0">↑</button></div></div>}
                </div>
              );
            })}
            {(feedTab==='new'? yaks : hotYaks).length===0 && <div className="py-16 text-center"><div className={`w-28 h-28 rounded-[32px] mx-auto flex items-center justify-center text-5xl border-[3px] border-white/20 ${userData.avatarBg} ${userData.avatarGlow} attractive-glow`}>{userData.avatar}</div><p className="font-black mt-6 text-[22px] tracking-tighter">No {feedTab} yaks yet</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-12 rounded-full font-black text-sm attractive-glow">+ First Yak</button><div className="mt-12"><Footer/></div></div>}
            <Footer/>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#050507]/80 backdrop-blur-xl border-t border-zinc-900/50"><div className="max-w-[600px] mx-auto px-8 h-[80px] flex items-center justify-between"><button onClick={()=>setFeedTab('new')} className="flex flex-col items-center gap-1 text-white"><div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${feedTab==='new'?'bg-white text-black attractive-glow':'bg-zinc-800 text-zinc-500'}`}>⌂</div><span className="text-[9px] font-black tracking-widest">{userData.college} • {collegeCounts[userData.college]||0} REAL</span></button><button onClick={()=>setScreen('create')} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)] attractive-glow">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1"><div className={`w-7 h-7 rounded-full ${userData.avatarBg} border border-white/20 flex items-center justify-center text-sm ${userData.avatarGlow} attractive-glow`}>{userData.avatar}</div><span className="text-[9px] font-black tracking-widest">YOU ✨ • {userData.yakarma}</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#050507] z-40"><div className="max-w-[600px] mx-auto h-full flex flex-col"><div className="p-4 flex items-center justify-between border-b border-zinc-900/50"><button onClick={()=>setScreen('feed')} className="w-9 h-9 bg-zinc-900 rounded-full text-white">✕</button><p className="font-bold text-[11px] tracking-widest">{userData.college} • PUSH {pushEnabled?'ON':'OFF'}</p><button onClick={handlePost} disabled={posting ||!newYak.trim()} className={`px-5 h-9 rounded-full font-black text-sm ${!newYak.trim()?'bg-zinc-900 text-zinc-700':'bg-white text-black attractive-glow'}`}>{posting?'Posting...':'Yak 🔥'}</button></div>
        <div className="p-5 flex-1 overflow-y-auto"><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}? Attractive ga...`} autoFocus className="w-full bg-transparent text-[22px] outline-none placeholder:text-zinc-800 resize-none min-h-[160px]" maxLength={300}/><label className="mt-6 border-2 border-dashed border-zinc-800 rounded-[18px] p-6 flex flex-col items-center cursor-pointer hover:border-white/30"><span className="text-[11px] font-black tracking-widest text-zinc-500">ADD PHOTO ✨</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setImages([r.result as string]); r.readAsDataURL(f); } }}/></label>{images[0] && <div className="mt-4 relative"><img src={images[0]} alt="" className="rounded-[18px] w-full border border-zinc-900"/><button onClick={()=>setImages([])} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full text-white">✕</button></div>}</div><div className="p-4 border-t border-zinc-900/50"><Footer/></div></div></div>
      )}

      {editingPost && (<div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[60] flex items-end justify-center p-3"><div className="bg-[#0a0a0f] border border-zinc-800 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8"><div className="w-10 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6"></div><h2 className="font-black text-[18px]">✏️ Edit Yak</h2><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-4 bg-[#111113] border border-zinc-800 rounded-[18px] p-4 text-[16px] outline-none min-h-[120px] resize-none" autoFocus/><div className="flex gap-3 mt-5"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-12 bg-zinc-900 border border-zinc-800 rounded-full font-bold">Cancel</button><button onClick={handleEdit} disabled={!editText.trim()} className={`flex-1 h-12 rounded-full font-black ${!editText.trim()?'bg-zinc-800 text-zinc-600':'bg-white text-black attractive-glow'}`}>Save ✓</button></div></div></div>)}
      {showAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-end justify-center"><div className="bg-[#0a0a0f] border border-zinc-800 w-full max-w-[600px] rounded-t-[32px] p-6 pb-8 max-h-[90vh] overflow-y-auto"><div className="w-10 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6"></div><h2 className="font-black text-[22px]">🛡️ Admin ID Verify Panel</h2><p className="text-[11px] text-zinc-500 mt-1 font-bold tracking-widest">{pendingIDs.length} PENDING REAL IDS</p>
        <div className="mt-5 space-y-3">{pendingIDs.map((u:any)=><div key={u.id} className="bg-[#111113] border border-zinc-900 rounded-[20px] p-4"><div className="flex gap-3"><div className={`w-12 h-12 rounded-[14px] ${u.avatarBg} flex items-center justify-center text-xl border border-zinc-800`}>{u.avatar}</div><div className="flex-1"><p className="font-black text-[14px]">{u.username} • {u.idName}</p><p className="text-[11px] text-zinc-500">{u.college} • {u.rollNumber||u.collegeEmail}</p></div></div>{u.idImage && <img src={u.idImage} alt="" className="mt-3 rounded-[16px] w-full border border-zinc-800"/>}<div className="flex gap-2 mt-3"><button onClick={async()=>{ await updateDoc(doc(db,'users',u.id),{idVerified:true}); }} className="flex-1 h-10 bg-green-500 text-black rounded-full font-black text-[12px]">✓ Approve</button><button onClick={async()=>{ if(!confirm('Reject? Delete user?')) return; await deleteDoc(doc(db,'users',u.id)); }} className="flex-1 h-10 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full font-black text-[12px]">✕ Reject</button></div></div>)}{pendingIDs.length===0 && <div className="py-12 text-center"><p className="font-black text-[18px]">No pending IDs ✓</p></div>}</div><button onClick={()=>setShowAdmin(false)} className="w-full mt-6 bg-white text-black h-11 rounded-full font-black">Close Admin</button><div className="mt-4"><Footer/></div></div></div>
      )}
      {showProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#0a0a0f] border border-zinc-900 w-full max-w-[600px] rounded-t-[32px] p-6 pb-8 max-h-[85vh] overflow-y-auto"><div className="w-10 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6"></div>
        <div className="relative bg-gradient-to-br from-white via-zinc-100 to-zinc-200 rounded-[32px] p-[1.5px] attractive-glow"><div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-[30px] p-6 relative overflow-hidden"><div className="relative flex gap-5"><div className="relative"><div className={`w-24 h-24 rounded-[26px] ${userData.avatarBg} border-[3px] border-white/20 flex items-center justify-center text-[38px] ${userData.avatarGlow} attractive-glow`}>{userData.avatar}</div><div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-[3px] border-[#0a0a0f] rounded-full flex items-center justify-center text-[14px]">✓</div></div><div className="flex-1"><h2 className="font-black text-[24px] tracking-tighter leading-none text-white">{userData.username} • Attractive ✨</h2><p className="text-[13px] font-bold text-white/60 mt-1.5">{userData.college} • {collegeCounts[userData.college]||0} real • Push {pushEnabled?'ON ✓':'OFF'}</p><div className="flex gap-2 mt-4 flex-wrap"><span className="px-4 py-2 bg-white text-black rounded-full text-[12px] font-black attractive-glow">🔥 {userData.yakarma} Karma</span><span className="px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-[11px] font-black">✓ REAL • #{totalUsers}</span></div></div></div><div className="mt-6 grid grid-cols-4 gap-2.5"><div className="bg-white/[0.06] border border-white/10 rounded-[16px] p-3 text-center"><p className="text-[20px] font-black text-white">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-[0.15em] text-white/50">YAKS</p></div><div className="bg-white/[0.06] border border-white/10 rounded-[16px] p-3 text-center"><p className="text-[20px] font-black text-white">{collegeCounts[userData.college]||0}</p><p className="text-[9px] font-bold tracking-[0.15em] text-white/50">REAL</p></div><div className="bg-white/[0.06] border border-white/10 rounded-[16px] p-3 text-center"><p className="text-[20px] font-black text-white">{hotYaks.filter((h:any)=>h.uid===userData.uid).length}</p><p className="text-[9px] font-bold tracking-[0.15em] text-white/50">HOT</p></div><div className="bg-white text-black rounded-[16px] p-3 text-center attractive-glow"><p className="text-[20px] font-black">{userData.yakarma}</p><p className="text-[9px] font-bold tracking-[0.15em] opacity-70">KARMA ✨</p></div></div></div></div>
        <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={requestPush} className={`h-11 rounded-full font-black text-[12px] border ${pushEnabled?'bg-green-500 text-black border-green-500':'bg-zinc-900 text-white border-zinc-800'}`}>{pushEnabled?'🔔 Push ON':'🔕 Enable Push'}</button><button onClick={()=>{ setShowProfile(false); setFeedTab('trending'); }} className="h-11 bg-violet-600 text-white rounded-full font-black text-[12px]">🏆 Leaderboard</button></div>
        <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-4 bg-zinc-900 border border-zinc-800 h-11 rounded-full font-bold text-sm">Log out • Pro Max</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-11 rounded-full font-black attractive-glow">Close • Stay Attractive ✨</button><div className="mt-4"><Footer/></div></div></div>
      )}
    </div>
  );
                  }
