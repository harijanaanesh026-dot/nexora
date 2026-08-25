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
  {id:"BITS", label:"BITS", domain:"bits,pilani", grad:"from-violet-500 to-indigo-600", icon:"⚡", city:"Pilani"},
  {id:"SRET", label:"SRET", domain:"sret,srit", grad:"from-blue-500 to-cyan-600", icon:"🎓", city:"Tirupati"},
  {id:"SVCE", label:"SVCE", domain:"svce", grad:"from-emerald-500 to-teal-600", icon:"🚀", city:"Tirupati"},
  {id:"ST.JOHNS", label:"ST.JOHNS", domain:"stjohns,sjct", grad:"from-orange-500 to-red-600", icon:"🔥", city:"Tirupati"},
  {id:"VEMU", label:"VEMU", domain:"vemu", grad:"from-amber-500 to-orange-600", icon:"💎", city:"Chittoor"},
  {id:"ARTS & SCIENCE", label:"ARTS", domain:"edu,ac", grad:"from-pink-500 to-rose-600", icon:"🎨", city:"Tirupati"},
  {id:"OTHER", label:"OTHER", domain:"gmail,edu,ac", grad:"from-zinc-700 to-zinc-900", icon:"🌍", city:"India"},
];
const TOPICS = [
  {id:"All", label:"All", icon:"🌑"},
  {id:"Confessions", label:"Confessions", icon:"🤫"},
  {id:"Notes", label:"Notes & PYQ", icon:"📚"},
  {id:"Placement", label:"Placement Hub", icon:"💼"},
  {id:"Prof", label:"Prof Reviews", icon:"👨‍🏫"},
  {id:"Hostel", label:"Hostel & Mess", icon:"🍛"},
  {id:"Alerts", label:"Campus Alerts", icon:"🚨"},
  {id:"Poll", label:"Polls", icon:"📊"},
];
const AVATARS = [
  {emoji:"👻", bg:"bg-zinc-900", border:"border-zinc-800", glow:"shadow-[0_0_20px_rgba(255,255,255,0.1)]"},
  {emoji:"🔥", bg:"bg-orange-950/50", border:"border-orange-900/50", glow:"shadow-[0_0_20px_rgba(249,115,22,0.4)]"},
  {emoji:"😎", bg:"bg-blue-950/50", border:"border-blue-900/50", glow:"shadow-[0_0_20px_rgba(59,130,246,0.4)]"},
  {emoji:"🤫", bg:"bg-violet-950/50", border:"border-violet-900/50", glow:"shadow-[0_0_20px_rgba(139,92,246,0.4)]"},
  {emoji:"💀", bg:"bg-zinc-900", border:"border-zinc-700", glow:"shadow-[0_0_20px_rgba(255,255,255,0.15)]"},
  {emoji:"👽", bg:"bg-green-950/50", border:"border-green-900/50", glow:"shadow-[0_0_20px_rgba(34,197,94,0.4)]"},
  {emoji:"🦊", bg:"bg-orange-950/50", border:"border-orange-800/50", glow:"shadow-[0_0_20px_rgba(251,146,60,0.4)]"},
  {emoji:"🐼", bg:"bg-zinc-900", border:"border-zinc-800", glow:"shadow-[0_0_20px_rgba(255,255,255,0.1)]"},
];

const Footer = () => (
  <div className="w-full py-8 flex flex-col items-center gap-2 border-t border-zinc-900/50 mt-10 bg-[#050507]">
    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">Y</div>
    <p className="text-[11px] tracking-[0.35em] font-black text-white">A PRODUCTION BY ANESH</p>
    <p className="text-[10px] text-zinc-600">Real • Attractive • Smooth • Verified</p>
  </div>
);

export default function YakApp(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [yaks,setYaks]=useState<any[]>([]);
  const [feedType,setFeedType]=useState('College');
  const [topic,setTopic]=useState('All');
  const [newYak,setNewYak]=useState('');
  const [postType,setPostType]=useState('Text');
  const [images,setImages]=useState<string[]>([]);
  const [pollOptions,setPollOptions]=useState(['Option 1','Option 2','']);
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [replyTo,setReplyTo]=useState<any>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [selectedCollege,setSelectedCollege]=useState('');
  const [selectedAvatar,setSelectedAvatar]=useState(AVATARS[0]);
  const [verifyMethod,setVerifyMethod]=useState('email');
  const [collegeEmail,setCollegeEmail]=useState('');
  const [rollNumber,setRollNumber]=useState('');
  const [otp,setOtp]=useState('');
  const [generatedOtp,setGeneratedOtp]=useState('');
  const [otpSent,setOtpSent]=useState(false);
  const [isVerified,setIsVerified]=useState(false);
  const [posting,setPosting]=useState(false);

  useEffect(()=>{ const old=localStorage.getItem('selected_college'); if(old?.includes('JNTU')) localStorage.clear(); getRedirectResult(auth).catch(()=>{}); },[]);

  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college'); if(!col ||!isVerified){ setScreen('college'); return; }
          if(col.includes('JNTU')){ localStorage.clear(); setScreen('college'); return; }
          const username='Yak_'+Math.floor(Math.random()*9000+1000);
          let avData:any=AVATARS[0]; try{ const s=localStorage.getItem('selected_avatar_data'); if(s) avData=JSON.parse(s); }catch{}
          const safeAv = {
            emoji: avData?.emoji || "👻",
            bg: avData?.bg || "bg-zinc-900",
            border: avData?.border || "border-zinc-800",
            glow: avData?.glow || "shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          };
          await addDoc(collection(db,'users'),{
            uid:u.uid,
            email:u.email||'',
            username:String(username),
            avatar:String(safeAv.emoji),
            avatarBg:String(safeAv.bg),
            avatarBorder:String(safeAv.border),
            avatarGlow:String(safeAv.glow),
            college:String(col),
            collegeEmail:String(localStorage.getItem('college_email')||''),
            rollNumber:String(localStorage.getItem('roll_number')||''),
            verifyMethod:String(localStorage.getItem('verify_method')||'email'),
            karma:120,totalPosts:0,likedPosts:[],dislikedPosts:[],
            createdAt:serverTimestamp()
          });
          window.location.reload();
        }else{
          let raw:any={id:snap.docs[0].id,...snap.docs[0].data()};
          if(raw.college?.includes('JNTU')){ await deleteDoc(doc(db,'users',raw.id)); localStorage.clear(); window.location.reload(); return; }
          // FIX OLD USERS - auto fix missing glow
          if(!raw.avatarGlow ||!raw.avatarBg ||!raw.avatar){
            const fixedData:any = {
              avatar: raw.avatar || "👻",
              avatarBg: raw.avatarBg || "bg-zinc-900",
              avatarBorder: raw.avatarBorder || "border-zinc-800",
              avatarGlow: raw.avatarGlow || raw.avatarBg || "bg-zinc-900"
            };
            await updateDoc(doc(db,'users',raw.id), fixedData);
            raw = {...raw,...fixedData};
          }
          setUserData(raw); setScreen('feed');
        }
      }else setScreen('college');
    });
  },[isVerified]);

  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')),s=>{
      let data:any[]=s.docs.map(d=>({id:d.id,...d.data()})).filter((y:any)=>!y.college?.includes('JNTU'));
      if(feedType==='College') data=data.filter((y:any)=>y.college===userData.college);
      if(feedType==='Nearby'){ const city=COLLEGES.find(c=>c.id===userData.college)?.city; data=data.filter((y:any)=>COLLEGES.find(c=>c.id===y.college)?.city===city); }
      if(topic!=='All') data=data.filter((y:any)=>y.topic===topic);
      setYaks(data);
    });
  },[userData,feedType,topic]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

  const handleCollegeNext=()=>{ if(!selectedCollege) return; localStorage.setItem('selected_college',selectedCollege); localStorage.setItem('selected_avatar_data',JSON.stringify(selectedAvatar)); setScreen('verify'); };

  const handleEmailVerify=async()=>{
    if(!collegeEmail.includes('@')) return alert('Valid email'); const colData=COLLEGES.find(c=>c.id===selectedCollege); const domain=collegeEmail.split('@')[1].toLowerCase();
    const allowed=colData?.domain.split(',').map(d=>d.trim())||[]; if(!allowed.some(d=>domain.includes(d)) && selectedCollege!=='OTHER') return alert(`Need ${colData?.domain}, got ${domain}`);
    const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',collegeEmail.toLowerCase()))); if(!dup.empty) return alert('Already used!');
    const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode);
    await setDoc(doc(db,'email_otps',collegeEmail.toLowerCase()),{email:collegeEmail.toLowerCase(),otp:otpCode,college:selectedCollege,createdAt:serverTimestamp(),expiresAt:Date.now()+600000});
    setOtpSent(true);
  };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()) return alert('Wrong OTP: '+d.otp); await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase())); localStorage.setItem('college_email',collegeEmail.toLowerCase()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ const pat=/^[A-Z0-9]{6,15}$/i; if(!pat.test(rollNumber.trim())) return alert('Invalid'); const snap=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollNumber.trim().toUpperCase()))); if(!snap.empty) return alert('Used!'); localStorage.setItem('roll_number',rollNumber.trim().toUpperCase()); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };

  const handleLike=async(y:any,type:string)=>{
    const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
    if(navigator.vibrate) navigator.vibrate(10);
    if(type==='like'){
      if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id)}); setUserData({...userData,likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)}); }
      else if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1),likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id),likedPosts:arrayUnion(y.id)}); setUserData({...userData,dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id),likedPosts:[...userData.likedPosts,y.id]}); }
      else{ await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id)}); setUserData({...userData,likedPosts:[...(userData.likedPosts||[]),y.id]}); }
    }else{
      if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id)}); setUserData({...userData,dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id)}); }
      else if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1),dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id),dislikedPosts:arrayUnion(y.id)}); setUserData({...userData,likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id),dislikedPosts:[...userData.dislikedPosts,y.id]}); }
      else{ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayUnion(y.id)}); setUserData({...userData,dislikedPosts:[...(userData.dislikedPosts||[]),y.id]}); }
    }
  };

  const handlePost=async()=>{
    if(!userData) return;
    if(!newYak.trim() && images.length===0 && postType!=='Poll') return alert('Emanna rayi');
    if(postType==='Poll' && pollOptions.filter((o:string)=>o.trim()).length<2) return alert('Poll ki 2 options kavali');
    setPosting(true);
    try{
      const payload:any = {
        text: String(newYak.trim() || (postType==='Poll'?'Poll':'')),
        uid: String(user.uid),
        username: String(userData.username || 'Yak_0000'),
        avatar: String(userData.avatar || '👻'),
        avatarBg: String(userData.avatarBg || 'bg-zinc-900'),
        avatarBorder: String(userData.avatarBorder || 'border-zinc-800'),
        avatarGlow: String(userData.avatarGlow || userData.avatarBg || 'bg-zinc-900'),
        college: String(userData.college),
        city: String(COLLEGES.find(c=>c.id===userData.college)?.city || 'India'),
        collegeEmail: String(userData.collegeEmail || ''),
        rollNumber: String(userData.rollNumber || ''),
        verifyMethod: String(userData.verifyMethod || 'email'),
        topic: String(topic),
        postType: String(postType),
        likes: 0,
        dislikes: 0,
        commentsCount: 0,
        imageUrls: (images || []).filter(Boolean).map(String),
        pollOptions: postType==='Poll'? pollOptions.filter((o:string)=>o.trim()).map(String) : [],
        pollVotes: postType==='Poll'? pollOptions.filter((o:string)=>o.trim()).map(()=>0) : [],
        createdAt: serverTimestamp()
      };
      Object.keys(payload).forEach(k=> { if(payload[k]===undefined) delete payload[k]; });
      await addDoc(collection(db,'yaks'), payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1)});
      setNewYak(''); setImages([]); setPollOptions(['Option 1','Option 2','']); setScreen('feed');
    }catch(e:any){ alert('Post failed: '+e.message); } finally{ setPosting(false); }
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#050507] text-white flex flex-col">
        <style>{`body{background:#050507} ::-webkit-scrollbar{display:none} button{transition:all 0.25s} button:active{transform:scale(0.96)}`}</style>
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <div className="mt-8"><div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center font-black text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]">Y</div><h1 className="text-[40px] font-black mt-6 leading-[0.9] tracking-tighter">Anonymous<br/>College Feed<br/><span className="text-zinc-600">Real students only</span></h1></div>
          <p className="font-bold mt-8 text-[10px] tracking-[0.2em] text-zinc-500">CHOOSE MASK • ATTRACTIVE • SMOOTH</p>
          <div className="grid grid-cols-4 gap-3 mt-3">{AVATARS.map((av,i)=><button key={i} onClick={()=>setSelectedAvatar(av)} className={`h-[72px] rounded-[20px] border-2 text-2xl ${selectedAvatar.emoji===av.emoji?'bg-white border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]':'bg-zinc-900/50 border-zinc-800'} ${av.glow}`}>{av.emoji}</button>)}</div>
          <p className="font-bold mt-6 text-[10px] tracking-[0.2em] text-zinc-500">SELECT CAMPUS • REAL PROOF</p>
          <div className="grid grid-cols-2 gap-3 mt-3">{COLLEGES.map(c=>{const a=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`p-4 rounded-[22px] border-2 text-left ${a?'bg-white text-black border-white scale-[1.02]':'bg-[#0a0a0f] border-zinc-900'}`}><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center mb-3`}>{c.icon}</div><p className="font-black text-[13px]">{c.label}</p><p className="text-[9px] opacity-60">{c.city}</p></button>})}</div>
        </div>
        <div className="p-6 max-w-md mx-auto w-full sticky bottom-0 bg-[#050507]/80 backdrop-blur-xl border-t border-zinc-900/50"><button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full py-5 rounded-full font-black ${selectedCollege?'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]':'bg-zinc-900 text-zinc-700'}`}>Continue as {selectedAvatar.emoji} →</button></div>
        <Footer/>
      </div>
    );
  }
  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-[#050507] text-white"><div className="max-w-md mx-auto min-h-screen flex flex-col"><div className="p-6"><button onClick={()=>setScreen('college')} className="w-10 h-10 bg-zinc-900 rounded-full">←</button><div className="mt-6 rounded-[28px] bg-[#0a0a0f] border border-zinc-900 p-6"><div className="flex gap-4"><div className={`w-16 h-16 rounded-[20px] ${selectedAvatar.bg} ${selectedAvatar.border} border-2 flex items-center justify-center text-3xl ${selectedAvatar.glow}`}>{selectedAvatar.emoji}</div><div><p className="text-[10px] tracking-[0.2em] text-zinc-500 font-bold">REAL STUDENT PROOF</p><h1 className="text-[22px] font-black leading-none mt-1">Prove {selectedCollege}</h1></div></div></div></div>
      <div className="px-6"><div className="flex p-1 bg-[#0a0a0f] border border-zinc-900 rounded-full"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-[13px] font-black ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>📧 Email</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-[13px] font-black ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>🎓 Roll</button></div></div>
      {verifyMethod==='email'?<div className="p-6 flex-1"><div className="bg-[#0a0a0f] border border-zinc-900 rounded-[24px] p-5"><p className="font-black text-sm">College Email • Domain proof</p><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`${selectedCollege.toLowerCase()}@college.edu.in`} className="w-full mt-3 p-4 bg-black border-2 border-zinc-900 rounded-2xl outline-none font-bold"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-4 rounded-full font-black">Generate OTP</button>{otpSent&&<div className="mt-3 p-4 bg-black border border-green-900/50 rounded-2xl"><p className="text-xs text-green-400 font-bold">OTP: {generatedOtp} ✓</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full mt-3 p-3 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-center tracking-[0.4em] font-black text-lg outline-none"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-green-500 text-black py-3 rounded-full font-black">Verify</button></div>}</div></div>:<div className="p-6 flex-1"><div className="bg-[#0a0a0f] border border-zinc-900 rounded-[24px] p-5"><p className="font-black text-sm">Roll Proof</p><input value={rollNumber} onChange={e=>setRollNumber(e.target.value)} placeholder="2021CS001" className="w-full mt-3 p-4 bg-black border-2 border-zinc-900 rounded-2xl uppercase font-black tracking-widest outline-none"/><button onClick={handleRollVerify} className="w-full mt-3 bg-white text-black py-4 rounded-full font-black">Verify Roll</button></div></div>}
      <Footer/></div></div>
    );
  }
  if(screen==='login'){ return <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6"><div className={`w-24 h-24 ${selectedAvatar.bg} border-2 rounded-[28px] flex items-center justify-center text-4xl ${selectedAvatar.glow}`}>{selectedAvatar.emoji}</div><h1 className="text-2xl font-black mt-6">Real Student Verified ✓</h1><button onClick={handleGoogleLogin} className="w-full max-w-sm mt-8 bg-white text-black py-4 rounded-full font-black">Continue with Google</button><div className="mt-16 w-full max-w-md"><Footer/></div></div>; }

  return(
    <div className="min-h-screen bg-[#050507] text-white flex flex-col">
      <style>{`body{background:#050507} ::-webkit-scrollbar{display:none} button{transition:all 0.25s} button:active{transform:scale(0.96)}`}</style>
      <div className="sticky top-0 z-30 bg-[#050507]/80 backdrop-blur-xl border-b border-zinc-900/50">
        <div className="max-w-[600px] mx-auto px-5 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-black text-black">Y</div><div><p className="font-black text-[13px]">YAK • {userData.college} • Anonymous</p><p className="text-[10px] text-zinc-500">{feedType} • {topic} • Real 🔒</p></div></div>
          <button onClick={()=>setShowProfile(true)}><div className={`w-9 h-9 rounded-full ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center ${userData.avatarGlow}`}>{userData.avatar}</div></button>
        </div>
        <div className="max-w-[600px] mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {["College","Nearby"].map(f=><button key={f} onClick={()=>setFeedType(f)} className={`px-4 h-8 rounded-full text-[12px] font-black border ${feedType===f?'bg-white text-black border-white':'bg-[#0a0a0f] border-zinc-900 text-zinc-500'}`}>{f}</button>)}
          <div className="w-px h-8 bg-zinc-900 mx-1"></div>
          {TOPICS.map(t=><button key={t.id} onClick={()=>setTopic(t.id)} className={`px-3 h-8 rounded-full text-[11px] font-bold border whitespace-nowrap ${topic===t.id?'bg-zinc-800 text-white border-zinc-700':'bg-[#0a0a0f] border-zinc-900 text-zinc-600'}`}>{t.icon} {t.label}</button>)}
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 pb-[90px] p-3 space-y-3 mt-2">
        {yaks.map(y=>{
          const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
          return(
            <div key={y.id} className="bg-[#0a0a0f]/80 backdrop-blur border border-zinc-900 rounded-[24px] p-5 hover:border-zinc-800 transition-all">
              <div className="flex justify-between">
                <div className="flex gap-3">
                  <div className={`w-11 h-11 rounded-full ${y.avatarBg||'bg-zinc-900'} ${y.avatarBorder||'border-zinc-800'} border-2 flex items-center justify-center text-lg relative ${y.avatarGlow||''}`}>{y.avatar||'👻'}<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-[8px]">✓</div></div>
                  <div><p className="font-black text-[13px] flex gap-1.5 items-center flex-wrap">{y.username||'Yak'}<span className="px-2 py-0.5 bg-white text-black text-[9px] rounded-full font-black">{y.college}</span><span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 text-[8px] rounded-full font-black">✓ {y.verifyMethod||'email'} REAL</span></p><p className="text-[10px] text-zinc-500">{y.topic} • {y.city||y.college} • {y.postType||'Text'}</p></div>
                </div>
                {user?.uid===y.uid && <button onClick={async()=>{ if(confirm('Delete?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="w-7 h-7 bg-zinc-900 rounded-full text-xs">✕</button>}
              </div>
              <p className="mt-3 text-[15px] leading-[1.5]">{y.text}</p>
              {y.imageUrls?.[0] && <img src={y.imageUrls[0]} alt="" className="mt-3 rounded-[18px] w-full border border-zinc-900"/>}
              {y.postType==='Poll' && y.pollOptions?.length>0 && <div className="mt-4 space-y-2">{y.pollOptions.map((opt:string,i:number)=>{ const total=(y.pollVotes||[]).reduce((a:number,b:number)=>a+b,0)||1; const votes=y.pollVotes?.[i]||0; const perc=Math.round(votes/total*100); return <button key={i} onClick={async()=>{ await updateDoc(doc(db,'yaks',y.id),{[`pollVotes.${i}`]:increment(1)}); }} className="w-full text-left bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex justify-between items-center hover:border-zinc-700"><span className="text-[13px] font-bold">{opt}</span><span className="text-[11px] font-black bg-white text-black px-2.5 py-1 rounded-full">{perc}% • {votes}</span></button>})}</div>}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex bg-[#111113] rounded-full border border-zinc-900 p-1"><button onClick={()=>handleLike(y,'like')} className={`px-4 py-1.5 rounded-full text-[13px] font-black ${liked?'bg-white text-black':'text-zinc-500'}`}>▲ {y.likes||0}</button><button onClick={()=>handleLike(y,'dislike')} className={`px-3 py-1.5 rounded-full text-[13px] font-black ${disliked?'bg-red-500 text-white':'text-zinc-600'}`}>▼ {y.dislikes||0}</button></div>
                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#111113] border border-zinc-900 px-4 h-[34px] rounded-full text-[12px] font-bold text-zinc-500">💬 {y.commentsCount||0}</button>
              </div>
              {activePost===y.id && <div className="mt-4 border-t border-zinc-900/50 pt-4"><div className="space-y-3 max-h-[350px] overflow-y-auto">{comments.map(c=>{ const isReply=!!c.replyTo; return <div key={c.id} className={`${isReply?'ml-8 border-l-2 border-zinc-800 pl-3':''} flex gap-2.5`}><div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-sm shrink-0">{c.avatar||'👻'}</div><div className="flex-1"><div className="bg-[#111113] border border-zinc-900 rounded-2xl px-4 py-2.5"><p className="text-[13px]">{c.replyTo && <span className="text-[11px] text-violet-400 font-bold">@{c.replyTo} </span>}{c.text}</p></div><div className="flex gap-3 mt-1 ml-1"><button onClick={()=>setReplyTo(c)} className="text-[10px] font-bold text-zinc-500">↩ Reply</button></div></div></div>})}</div><div className="flex gap-2 mt-4"><div className="flex-1 relative"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={replyTo?`Reply to ${replyTo.username}...`:"Add comment..."} className="w-full bg-[#111113] border border-zinc-900 rounded-full px-5 h-11 text-sm outline-none focus:border-zinc-700 pr-16"/>{replyTo && <button onClick={()=>setReplyTo(null)} className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] bg-zinc-800 px-2 py-1 rounded-full">✕</button>}</div><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText,uid:user.uid,username:userData.username,avatar:userData.avatar,replyTo:replyTo?.username||null,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); setReplyTo(null); }} className="w-11 h-11 bg-white text-black rounded-full font-black shrink-0">↑</button></div></div>}
            </div>
          )
        })}
        {yaks.length===0 && <div className="py-20 text-center"><div className={`w-20 h-20 ${userData.avatarBg} border-2 rounded-[24px] mx-auto flex items-center justify-center text-3xl ${userData.avatarGlow}`}>{userData.avatar}</div><p className="font-black mt-5">No {topic} in {feedType}</p><button onClick={()=>setScreen('create')} className="mt-5 bg-white text-black px-6 h-10 rounded-full font-black text-sm">+ Create {topic}</button><div className="mt-12"><Footer/></div></div>}
        {yaks.length>0 && <Footer/>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#050507]/80 backdrop-blur-xl border-t border-zinc-900/50"><div className="max-w-[600px] mx-auto px-8 h-[80px] flex items-center justify-between"><button className="flex flex-col items-center gap-1 text-white"><span className="text-lg">⌂</span><span className="text-[9px] font-black tracking-widest">FEED</span></button><button onClick={()=>setScreen('create')} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all">+</button><button onClick={()=>setShowProfile(true)}><div className={`w-7 h-7 rounded-full ${userData.avatarBg} border flex items-center justify-center text-sm ${userData.avatarGlow}`}>{userData.avatar}</div></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#050507] z-40"><div className="max-w-[600px] mx-auto h-full flex flex-col"><div className="p-4 flex items-center justify-between border-b border-zinc-900/50"><button onClick={()=>setScreen('feed')} className="w-9 h-9 bg-zinc-900 rounded-full">✕</button><p className="font-bold text-[11px] tracking-widest">{postType} • {topic} • {feedType} • REAL • SMOOTH</p><button onClick={handlePost} disabled={posting || (!newYak.trim() && images.length===0 && postType!=='Poll')} className={`px-5 h-9 rounded-full font-black text-sm ${!newYak.trim() && images.length===0 && postType!=='Poll'?'bg-zinc-900 text-zinc-700':'bg-white text-black'}`}>{posting?'Posting...':'Post'}</button></div>
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex gap-2 mb-4">{["Text","Poll"].map(pt=><button key={pt} onClick={()=>setPostType(pt)} className={`px-4 py-2 rounded-full text-xs font-black border ${postType===pt?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{pt}</button>)}</div>
          <div className="flex gap-2 mb-5 overflow-x-auto">{TOPICS.map(t=><button key={t.id} onClick={()=>setTopic(t.id)} className={`px-3 py-2 rounded-full text-[11px] font-bold border whitespace-nowrap ${topic===t.id?'bg-white text-black border-white':'bg-[#0a0a0f] border-zinc-900 text-zinc-500'}`}>{t.icon} {t.label}</button>)}</div>
          <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={topic==='Notes'?'Share Notes/PYQ: Subject, Sem, Drive link...' : topic==='Placement'?'Company, Package, Questions...' : topic==='Prof'?'Prof Name, Teaching, Attendance...' : topic==='Hostel'?'Mess food rating, WiFi...' : topic==='Alerts'?'Holiday/Exam/Circular alert...' : topic==='Poll'?"Who's famous in our..." : `Anonymous ${topic} in ${userData.college}...`} autoFocus className="w-full bg-transparent text-[20px] outline-none placeholder:text-zinc-800 resize-none min-h-[120px]" maxLength={800}/>
          {postType==='Poll' && <div className="mt-4 space-y-2"><p className="text-[11px] font-bold text-zinc-500 tracking-widest">POLL OPTIONS • Min 2</p>{pollOptions.map((o,i)=><input key={i} value={o} onChange={e=>{ const n=[...pollOptions]; n[i]=e.target.value; setPollOptions(n); }} placeholder={`Option ${i+1}`} className="w-full p-3.5 bg-[#0a0a0f] border border-zinc-900 rounded-xl text-sm outline-none focus:border-zinc-700"/>)}<div className="flex gap-2"><button onClick={()=>setPollOptions([...pollOptions,''])} className="text-xs text-zinc-500 font-bold">+ Add option</button>{pollOptions.length>2 && <button onClick={()=>setPollOptions(pollOptions.slice(0,-1))} className="text-xs text-red-400 font-bold">- Remove</button>}</div></div>}
          <label className="mt-5 border border-dashed border-zinc-800 rounded-[18px] p-5 flex flex-col items-center cursor-pointer hover:border-zinc-700"><span className="text-[11px] font-bold text-zinc-600 tracking-widest">ADD IMAGE</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setImages([r.result as string]); r.readAsDataURL(f); } }}/></label>
          {images[0] && <div className="mt-3 relative"><img src={images[0]} alt="" className="rounded-[18px] w-full border border-zinc-900"/><button onClick={()=>setImages([])} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full">✕</button></div>}
        </div>
        <div className="p-4 border-t border-zinc-900/50"><Footer/></div>
        </div></div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#0a0a0f] border border-zinc-900 w-full max-w-[600px] rounded-t-[32px] p-6 pb-8 max-h-[85vh] overflow-y-auto"><div className="w-10 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6"></div><div className="flex gap-4"><div className={`w-16 h-16 rounded-[18px] ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center text-2xl ${userData.avatarGlow}`}>{userData.avatar}</div><div><h2 className="font-black text-lg">{userData.username}</h2><p className="text-[11px] text-zinc-500">{userData.college} • {userData.collegeEmail||userData.rollNumber} • Real proof ✓</p><div className="flex gap-1.5 mt-2"><span className="px-2.5 py-1 bg-white text-black rounded-full text-[10px] font-black">Attractive • Smooth</span><span className="px-2.5 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-[9px] font-black">✓ REAL STUDENT</span></div></div></div>
        <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-zinc-900 border border-zinc-800 h-11 rounded-full font-bold text-sm">Log out</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-11 rounded-full font-black">Close</button><div className="mt-4"><Footer/></div></div></div>
      )}
    </div>
  );
                                                                                                                                                                                                                                                                                                                                                      }
