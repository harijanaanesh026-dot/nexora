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

const COLLEGES = [{id:"SRET", label:"SRET", city:"Tirupati", domains:["sret.edu.in","sret.ac.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21CS101"}];
const AVATARS = ["👻","🤫","💀","👽","🦊","🐼","🔥","😎"];
const ANON_NAMES = ["Anonymous Owl","Secret Tiger","Hidden Fox","Silent Panda","Ghost User","Shadow Yak"];
const REPORT_REASONS = ["Spam / Promotion","Abusive / Hate","Fake Info / Misleading","NSFW / Inappropriate","Personal Info Leak","Harassment / Bullying","Other"];
const Footer = () => (<div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.3em] font-bold text-white/40">SRET ONLY • A PRODUCTION BY ANESH</p><p className="text-[9px] text-white/20">Premium • Privacy Safe • 1to1 Private DM</p></div>);

export default function YakFixed(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hot'|'top'|'meme'|'dm'|'crush'|'market'|'pyq'>('new');
  const [yaks,setYaks]=useState<any[]>([]);
  const [hotYaks,setHotYaks]=useState<any[]>([]);
  const [memeYaks,setMemeYaks]=useState<any[]>([]);
  const [marketYaks,setMarketYaks]=useState<any[]>([]);
  const [pyqYaks,setPyqYaks]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [collegeCounts,setCollegeCounts]=useState<Record<string,number>>({});
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [yakType,setYakType]=useState<'yak'|'poll'|'confession'|'meme'|'market'|'pyq'>('yak');
  const [pollOptions,setPollOptions]=useState(['','']);
  const [yakImage,setYakImage]=useState<string>('');
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [replyTo,setReplyTo]=useState<any>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [selectedAvatar,setSelectedAvatar]=useState("👻");
  const [collegeEmail,setCollegeEmail]=useState('');
  const [rollNumber,setRollNumber]=useState('');
  const [verifyMethod,setVerifyMethod]=useState<'email'|'roll'>('email');
  const [otp,setOtp]=useState('');
  const [generatedOtp,setGeneratedOtp]=useState('');
  const [otpSent,setOtpSent]=useState(false);
  const [isVerified,setIsVerified]=useState(false);
  const [posting,setPosting]=useState(false);
  const [editingPost,setEditingPost]=useState<any>(null);
  const [editText,setEditText]=useState('');
  const [showMenu,setShowMenu]=useState<string|null>(null);
  const [verifyError,setVerifyError]=useState('');
  const [toast,setToast]=useState('');
  const [searchQuery,setSearchQuery]=useState('');
  const [hashtags,setHashtags]=useState<any[]>([]);
  const [notifications,setNotifications]=useState<any[]>([]);
  const [unreadCount,setUnreadCount]=useState(0);
  const [showNotifications,setShowNotifications]=useState(false);
  const [dmChats,setDmChats]=useState<any[]>([]);
  const [activeDm,setActiveDm]=useState<any>(null);
  const [dmMessages,setDmMessages]=useState<any[]>([]);
  const [dmText,setDmText]=useState('');
  const [weeklyAwards,setWeeklyAwards]=useState<any>({});
  const [crushRoll,setCrushRoll]=useState('');
  const [crushMatches,setCrushMatches]=useState<any[]>([]);
  const [marketPrice,setMarketPrice]=useState('');
  const [pyqSubject,setPyqSubject]=useState('');
  const [blockedUsers,setBlockedUsers]=useState<string[]>([]);
  const [reportReason,setReportReason]=useState('');
  const [reportingPost,setReportingPost]=useState<any>(null);
  const [adminReports,setAdminReports]=useState<any[]>([]);
  const [showAdmin,setShowAdmin]=useState(false);
  const [showLogoutConfirm,setShowLogoutConfirm]=useState(false);
  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2500); };

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{ return onSnapshot(collection(db,'users'), snap=>{ const c:Record<string,number>={}; snap.docs.forEach(d=>{ const col=(d.data() as any).college; if(col) c[col]=(c[col]||0)+1; }); setCollegeCounts(c); setTotalUsers(snap.size); }); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          if(!isVerified){ setScreen('college'); return; }
          const anonName = ANON_NAMES[Math.floor(Math.random()*ANON_NAMES.length)] + " " + Math.floor(Math.random()*900+100);
          await addDoc(collection(db,'users'),{uid:u.uid,email:u.email||'',username:anonName,avatar:localStorage.getItem('selected_avatar')||'👻',college:"SRET",collegeEmail:String(localStorage.getItem('college_email')||''),rollNumber:String(localStorage.getItem('roll_number')||''),yakarma:100,totalPosts:0,likedPosts:[],dislikedPosts:[],pollVoted:[],reportedPosts:[],blockedUsers:[],crushList:[],createdAt:serverTimestamp()});
          window.location.reload();
        }else{ setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen('feed'); }
      }else setScreen('college');
    });
  },[isVerified]);
  useEffect(()=>{ if(userData?.blockedUsers) setBlockedUsers(userData.blockedUsers); },[userData]);
  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(collection(db,'yaks'), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any));
      const data=all.filter(d=>d.college==="SRET" ||!d.college);
      data.sort((a,b)=> (b.createdAt?.toMillis?.()||b.createdAt?.seconds*1000||0) - (a.createdAt?.toMillis?.()||a.createdAt?.seconds*1000||0));
      setYaks(data);
      setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
      setMemeYaks([...data].filter(d=>d.type==='meme'||d.image).sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
      setMarketYaks([...data].filter(d=>d.type==='market').slice(0,30));
      setPyqYaks([...data].filter(d=>d.type==='pyq').slice(0,30));
      const tagCount:Record<string,number>={}; data.forEach(y=>{ const tags=y.text?.match(/#\w+/g); if(tags) tags.forEach((t:string)=>{ tagCount[t.toLowerCase()]=(tagCount[t.toLowerCase()]||0)+1; }); }); setHashtags(Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([tag,count])=>({tag,count})));
      const now=Date.now(); const weekAgo=now-7*24*60*60*1000; const weekPosts=data.filter(d=>(d.createdAt?.toMillis?.()||0)>weekAgo); if(weekPosts.length>0){ const topPost=[...weekPosts].sort((a,b)=>(b.likes||0)-(a.likes||0))[0]; const topMeme=weekPosts.filter(d=>d.type==='meme').sort((a,b)=>(b.likes||0)-(a.likes||0))[0]; const topConf=weekPosts.filter(d=>d.type==='confession').sort((a,b)=>(b.commentsCount||0)-(a.commentsCount||0))[0]; setWeeklyAwards({topPost, topMeme, topConf}); }
    });
  },[userData]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'users'), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)); const same=all.filter(u=>u.college==="SRET"||!u.college); setLeaderboard(same.sort((a,b)=>b.yakarma-a.yakarma).slice(0,20)); }); },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'notifications'),where('toUid','==',user.uid),orderBy('createdAt','desc')), s=>{ const nots=s.docs.map(d=>({id:d.id,...d.data()})); setNotifications(nots as any); setUnreadCount((nots as any).filter((n:any)=>!n.read).length); }); },[user]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'dms'),where('participants','array-contains',user.uid)), s=>{ const chats=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((c:any)=> c.participants.length===2 && c.participants.includes(user.uid)); chats.sort((a:any,b:any)=>(b.lastMessageAt?.toMillis?.()||0)-(a.lastMessageAt?.toMillis?.()||0)); setDmChats(chats as any); }); },[user]);
  useEffect(()=>{ if(!activeDm) return; return onSnapshot(query(collection(db,'dms/'+activeDm.id+'/messages'),orderBy('createdAt','asc')), s=>setDmMessages(s.docs.map(d=>({id:d.id,...d.data()})))); },[activeDm]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'crushes'),where('fromUid','==',user.uid)), s=>setCrushMatches(s.docs.map(d=>({id:d.id,...d.data()})))); },[user]);
  useEffect(()=>{ if(!userData) return; return onSnapshot(query(collection(db,'reports'),where('status','==','pending'),orderBy('createdAt','desc')), s=>setAdminReports(s.docs.map(d=>({id:d.id,...d.data()})))); },[userData]);

  const getCollegeConfig=()=>COLLEGES.find(c=>c.id==="SRET");
  const handleCollegeNext=()=>{ localStorage.setItem('selected_college',"SRET"); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const emailLower=collegeEmail.toLowerCase().trim(); if(!config.domains.some(d=>emailLower.endsWith(d))){ setVerifyError(`Only ${config.domains.join(' or ')} allowed - SRET ONLY`); return; } const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower))); if(!dup.empty){ setVerifyError('Email already used - SRET ONLY'); return; } const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode); await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()}); setOtpSent(true); showToast("OTP: "+otpCode+" - SRET ONLY"); };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp+' - SRET ONLY'); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const rollUpper=rollNumber.trim().toUpperCase(); if(!config.pattern.test(rollUpper)){ setVerifyError(`Invalid Roll - Example: ${config.ex} - SRET ONLY`); return; } const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper))); if(!dup.empty){ setVerifyError('Roll number already used - SRET ONLY'); return; } localStorage.setItem('roll_number',rollUpper); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleImageUpload=(e:any,setter:any)=>{ const file=e.target.files?.[0]; if(!file) return; if(file.size>800*1024){ showToast("Image must be less than 800KB"); return; } const reader=new FileReader(); reader.onloadend=()=>setter(reader.result as string); reader.readAsDataURL(file); };

  if(screen==='college'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>{toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}<div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">S</div><div><p className="font-black text-sm tracking-wide">SRET ONLY ANONYMOUS</p><p className="text-[10px] text-white/40">{totalUsers} SRET anonymous • 1to1 Private DM</p></div></div><h1 className="text-[36px] font-black mt-8 leading-[0.9] tracking-tight">SRET<br/>Only<br/><span className="text-white/30">Premium</span></h1><p className="text-[13px] text-white/50 mt-3">1to1 Private DM + Crush + Market + PYQ • No One Sees Other Chat</p><p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">SELECT AVATAR - ANONYMOUS</p><div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/[0.05] border-white/10 text-white'}`}>{a}</button>)}</div><p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">COLLEGE - SRET ONLY</p><div className="mt-3"><div className="w-full p-4 rounded-[18px] border-2 bg-white text-black border-white flex justify-between"><div><p className="font-bold text-[13px]">SRET - Tirupati - Verified Only</p><p className="text-[11px] text-black/60">{collegeCounts["SRET"]||0} anonymous • MVP Secure • Private DM</p></div><div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">✓</div></div></div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black text-[14px] bg-white text-black">Enter SRET - Premium</button><Footer/></div></div>);
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full text-white">←</button><div className="mt-6 bg-white/[0.05] border border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-widest text-white/30">{collegeCounts["SRET"]||0} ANONYMOUS IN SRET</p><h2 className="font-black text-[18px] mt-1 text-white">Verify SRET Student - MVP</h2><p className="text-[11px] text-white/40 mt-1">College Mail + Roll Number Only - No ID Needed - Private DM Secure</p></div><div className="flex p-1 bg-white/5 border border-white/10 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>College Mail OTP</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll Number</button></div>{verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3.5 rounded-xl border border-red-500/20">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><p className="text-[10px] font-bold text-white/30 mb-3">SRET COLLEGE EMAIL - MOST SECURE</p><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl text-sm outline-none text-white placeholder:text-white/30 focus:border-white"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Send OTP - SRET ONLY</button>{otpSent&&<div className="mt-4 bg-black/30 border-2 border-white/10 rounded-xl p-4"><p className="text-xs text-emerald-400 font-bold">OTP: {generatedOtp} - Check Console</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full mt-3 p-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-center tracking-[0.3em] text-white"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify OTP - SRET ONLY</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><p className="text-[10px] font-bold text-white/30 mb-3">ROLL NUMBER - QUICK VERIFY</p><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={`${config?.ex}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase font-bold tracking-widest text-white placeholder:text-white/30"/><p className="text-[10px] text-white/20 mt-2">Pattern: 21CS101 - SRET ONLY</p><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify Roll Number - SRET ONLY</button><div className="mt-4 bg-blue-500/5 border border-blue-500/10 rounded-xl p-3"><p className="text-[10px] text-blue-400 font-bold">1to1 PRIVATE DM:</p><p className="text-[10px] text-white/40 mt-1">No ID needed - Email OTP + Roll = 99% fake block - 1to1 chats no one sees other chat</p></div></div>}<Footer/></div></div>);
  }
  if(screen==='login'){
    return (<div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border-2 border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] flex items-center justify-center text-4xl">{selectedAvatar}</div><h1 className="font-black mt-6 text-center text-xl text-white">SRET Verified<br/><span className="text-white/40">1to1 Private DM</span></h1><p className="text-[11px] text-white/30 mt-2 text-center">MVP Secure • Private Chat • No One Sees Other Chat</p><button onClick={handleGoogleLogin} className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold text-sm">Continue with Google - SRET ONLY</button></div><Footer/></div>);
    }

  const createNotification=async(toUid:string, type:string, text:string, yakId?:string)=>{
    if(toUid===user?.uid) return; await addDoc(collection(db,'notifications'),{toUid, fromUid:user?.uid, fromUsername:"Anonymous - SRET", type, text, yakId:yakId||null, read:false, createdAt:serverTimestamp()});
  };
  const handleVote=async(y:any,type:'up'|'down')=>{
    if(!userData) return; const yakRef=doc(db,'yaks',y.id); const userRef=doc(db,'users',userData.id); const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
    try{
      if(type==='up'){
        if(liked){ await updateDoc(yakRef,{likes:increment(-1)}); await updateDoc(userRef,{likedPosts:arrayRemove(y.id)}); setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)}); }
        else if(disliked){ await updateDoc(yakRef,{likes:increment(1), dislikes:increment(-1)}); await updateDoc(userRef,{dislikedPosts:arrayRemove(y.id), likedPosts:arrayUnion(y.id)}); setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id), likedPosts:[...(userData.likedPosts||[]), y.id]}); await createNotification(y.uid, 'upvote', `Someone upvoted your post: ${y.text.slice(0,30)}`, y.id); }
        else{ await updateDoc(yakRef,{likes:increment(1)}); await updateDoc(userRef,{likedPosts:arrayUnion(y.id)}); setUserData({...userData, likedPosts:[...(userData.likedPosts||[]), y.id]}); await createNotification(y.uid, 'upvote', `Someone upvoted your post: ${y.text.slice(0,30)}`, y.id); }
      }else{
        if(disliked){ await updateDoc(yakRef,{dislikes:increment(-1)}); await updateDoc(userRef,{dislikedPosts:arrayRemove(y.id)}); setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id)}); }
        else if(liked){ await updateDoc(yakRef,{likes:increment(-1), dislikes:increment(1)}); await updateDoc(userRef,{likedPosts:arrayRemove(y.id), dislikedPosts:arrayUnion(y.id)}); setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id), dislikedPosts:[...(userData.dislikedPosts||[]), y.id]}); }
        else{ await updateDoc(yakRef,{dislikes:increment(1)}); await updateDoc(userRef,{dislikedPosts:arrayUnion(y.id)}); setUserData({...userData, dislikedPosts:[...(userData.dislikedPosts||[]), y.id]}); }
      }
    }catch(e:any){ showToast(e.message); }
  };
  const handlePollVote=async(y:any, idx:number)=>{ if(!userData) return; if(userData.pollVoted?.includes(y.id)){ showToast("Already voted"); return; } try{ const n=[...y.pollOptions]; n[idx].votes=(n[idx].votes||0)+1; await updateDoc(doc(db,'yaks',y.id),{pollOptions:n, totalVotes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{pollVoted:arrayUnion(y.id)}); setUserData({...userData, pollVoted:[...(userData.pollVoted||[]), y.id]}); showToast("Voted - SRET ONLY"); }catch(e:any){ showToast(e.message); } };
  const handlePost=async()=>{
    const txt=newYak.trim(); if(!txt &&!yakImage){ showToast("Type something"); return; }
    if(yakType==='poll' && pollOptions.filter(o=>o.trim()).length<2){ showToast("Need at least 2 options"); return; }
    if(yakType==='market' &&!marketPrice.trim()){ showToast("Enter price - SRET Market"); return; }
    if(yakType==='pyq' &&!pyqSubject.trim()){ showToast("Enter subject - SRET PYQ"); return; }
    if(!userData||!user) return; if(posting) return; setPosting(true);
    try{
      const anonAvatar = AVATARS[Math.floor(Math.random()*AVATARS.length)];
      const payload:any={ text:txt, uid:user.uid, username:"Anonymous - SRET", realUsername:userData.username, avatar:anonAvatar, college:"SRET", type:yakType, isAnonymous:true, likes:0, dislikes:0, commentsCount:0, reports:0, hidden:false, createdAt:serverTimestamp() };
      if(yakImage) payload.image=yakImage;
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; payload.pollEndsAt=serverTimestamp(); }
      if(yakType==='meme') payload.isMemeBattle=true;
      if(yakType==='confession') payload.isConfession=true;
      if(yakType==='market'){ payload.price=marketPrice; payload.isMarket=true; }
      if(yakType==='pyq'){ payload.subject=pyqSubject.toUpperCase(); payload.isPyq=true; }
      const hashtagsInText=txt.match(/#\w+/g); if(hashtagsInText) payload.hashtags=[...(payload.hashtags||[]),...hashtagsInText.map((h:string)=>h.toLowerCase())];
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(yakType==='pyq'?20:5)});
      setNewYak(''); setYakImage(''); setPollOptions(['','']); setMarketPrice(''); setPyqSubject(''); setYakType('yak'); setScreen('feed'); showToast("Posted Anonymously - SRET ONLY");
    }catch(e:any){ showToast(e.message); }finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(user?.uid!==y.uid) return; if(!confirm('Delete this post?')) return; try{ await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1)}); showToast("Deleted"); }catch(e:any){ showToast(e.message); } setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost) return; if(!editText.trim()) return; try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); showToast("Edited"); }catch(e:any){ showToast(e.message); } setEditingPost(null); setEditText(''); setShowMenu(null); };
  const handleReport=async(y:any)=>{
    if(!userData) return; if(userData.reportedPosts?.includes(y.id)){ showToast("Already reported"); setReportingPost(null); setShowMenu(null); return; }
    if(!reportReason){ showToast("Select reason"); return; }
    try{
      await addDoc(collection(db,'reports'),{yakId:y.id, yakText:y.text.slice(0,200), yakUid:y.uid, reportedBy:user.uid, reason:reportReason, status:"pending", createdAt:serverTimestamp(), yakData:y});
      await updateDoc(doc(db,'yaks',y.id),{reports:increment(1), reportReasons:arrayUnion(reportReason), lastReportedAt:serverTimestamp()});
      await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)});
      setUserData({...userData, reportedPosts:[...(userData.reportedPosts||[]), y.id]});
      const newReportCount=(y.reports||0)+1;
      if(newReportCount>=5){ await updateDoc(doc(db,'yaks',y.id),{hidden:true, hiddenReason:`5 reports - ${reportReason} - Pending admin review`, hiddenAt:serverTimestamp()}); showToast("Post hidden - Admin will review"); }
      else showToast(`Reported (${newReportCount}/5)`);
      setReportingPost(null); setReportReason(''); setShowMenu(null);
    }catch(e:any){ showToast(e.message); }
  };
  const handleAdminRestore=async(report:any)=>{ try{ await updateDoc(doc(db,'yaks',report.yakId),{hidden:false, hiddenReason:"", reports:0, reportReasons:[]}); await updateDoc(doc(db,'reports',report.id),{status:"dismissed", reviewedAt:serverTimestamp(), reviewedBy:user.uid}); showToast("Post restored"); }catch(e:any){ showToast(e.message); } };
  const handleAdminDelete=async(report:any)=>{ if(!confirm('Permanently delete?')) return; try{ await deleteDoc(doc(db,'yaks',report.yakId)); await updateDoc(doc(db,'reports',report.id),{status:"deleted", reviewedAt:serverTimestamp(), reviewedBy:user.uid}); showToast("Post deleted by Admin"); }catch(e:any){ showToast(e.message); } };
  const handleAdminDismiss=async(report:any)=>{ try{ await updateDoc(doc(db,'reports',report.id),{status:"dismissed", reviewedAt:serverTimestamp()}); showToast("Report dismissed"); }catch(e:any){ showToast(e.message); } };
  const buildTree = (flat:any[]) => { const map:Record<string, any> = {}; const roots:any[] = []; flat.forEach(c => { map[c.id] = {...c, replies: []}; }); flat.forEach(c => { if(c.parentId && map[c.parentId]){ map[c.parentId].replies.push(map[c.id]); } else { roots.push(map[c.id]); } }); return roots; };
  const handleCommentPost = async (yId:string) => {
    if(!commentText.trim() ||!user ||!userData) return; const text = commentText.trim(); const payload:any = { text, uid: user.uid, username: "Anonymous - SRET", avatar: "👻", parentId: replyTo? replyTo.id : null, replyToUsername: replyTo? replyTo.username : null, createdAt: serverTimestamp() }; setCommentText(''); const temp = replyTo; setReplyTo(null);
    try{ await addDoc(collection(db,'yaks/'+yId+'/comments'), payload); await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); const yak=yaks.find(d=>d.id===yId); if(yak && yak.uid!==user.uid) await createNotification(yak.uid, 'comment', `Someone commented: ${text.slice(0,30)}`, yId); if(temp && temp.uid!==user.uid) await createNotification(temp.uid, 'reply', `Someone replied to you: ${text.slice(0,30)}`, yId); }catch(e:any){ showToast(e.message); setCommentText(text); setReplyTo(temp); }
  };
  // 1to1 PRIVATE DM - NO ONE CAN SEE OTHER'S CHAT
  const handleStartDm = async (otherUid:string, yakId?:string)=>{
    if(otherUid===user?.uid){ showToast("Can't DM yourself"); return; }
    if(blockedUsers.includes(otherUid)){ showToast("You blocked this user"); return; }
    try{
      const otherSnap = await getDocs(query(collection(db,'users'),where('uid','==',otherUid)));
      if(!otherSnap.empty){
        const otherData = otherSnap.docs[0].data() as any;
        if(otherData.blockedUsers?.includes(user.uid)){ showToast("This user blocked you"); return; }
      }
    }catch{}
    const existing=dmChats.find(c=> c.participants.includes(otherUid) && c.participants.length===2 && c.participants.includes(user.uid));
    if(existing){ setActiveDm(existing); setFeedTab('dm'); return; }
    try{
      const newChat=await addDoc(collection(db,'dms'),{
        participants:[user.uid, otherUid],
        participantNames:["Anonymous","Anonymous"],
        lastMessage:"Started private chat - SRET ONLY - No one can see",
        lastMessageAt:serverTimestamp(),
        createdAt:serverTimestamp(),
        relatedYakId:yakId||null,
        isPrivate:true,
        visibleTo: [user.uid, otherUid]
      });
      setActiveDm({id:newChat.id, participants:[user.uid, otherUid], isPrivate:true});
      setFeedTab('dm');
      showToast("Private DM 🔒 - Only you 2 can see");
    }catch(e:any){ showToast(e.message); }
  };
  const handleSendDm=async()=>{
    if(!dmText.trim()||!activeDm||!user) return;
    const txt=dmText.trim();
    if(activeDm.participants.length!==2){ showToast("Private chat error"); return; }
    setDmText('');
    try{
      await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{
        text:txt, uid:user.uid, username:"Anonymous - SRET", createdAt:serverTimestamp(), private:true, visibleTo: activeDm.participants
      });
      await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:txt, lastMessageAt:serverTimestamp(), lastMessageBy: user.uid});
      const otherUid=activeDm.participants.find((p:string)=>p!==user.uid);
      await createNotification(otherUid, 'dm', `🔒 New private DM: ${txt.slice(0,30)} - Only you 2 can see`);
    }catch(e:any){ showToast(e.message); setDmText(txt); }
  };
  const markNotificationsRead=async()=>{ try{ const batch=notifications.filter((n:any)=>!n.read); for(const n of batch){ await updateDoc(doc(db,'notifications',n.id),{read:true}); } }catch{} };
  const handleBlockUser=async(targetUid:string)=>{
    if(!userData || targetUid===user?.uid) return;
    if(!confirm('Block this anonymous user? You will never see their posts again')) return;
    try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(targetUid)}); setBlockedUsers([...blockedUsers, targetUid]); setShowMenu(null); showToast("User blocked"); }catch(e:any){ showToast(e.message); }
  };
  const handleUnblockUser=async(targetUid:string)=>{ try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayRemove(targetUid)}); setBlockedUsers(blockedUsers.filter(id=>id!==targetUid)); showToast("User unblocked"); }catch(e:any){ showToast(e.message); } };
  const handleCrushSubmit=async()=>{
    const roll=crushRoll.trim().toUpperCase(); if(!roll) { showToast("Enter roll number"); return; }
    if(!COLLEGES[0].pattern.test(roll)){ showToast("Invalid Roll - Ex: 21CS101"); return; }
    if(roll===userData.rollNumber){ showToast("Can't crush yourself 😂"); return; }
    const alreadyExists = crushMatches.some((c:any)=>c.toRoll===roll &&!c.matched &&!c.blocked);
    if(alreadyExists){ showToast("Already added - Secret pending 🤫"); return; }
    try{
      const snap=await getDocs(query(collection(db,'users'),where('rollNumber','==',roll)));
      if(snap.empty){
        await addDoc(collection(db,'crushes'),{fromUid:user.uid, fromRollHash: btoa(userData.rollNumber||'ANON').slice(0,8), toRoll:roll, toRollMasked: roll.slice(0,2)+"***"+roll.slice(-2), matched:false, createdAt:serverTimestamp(), blocked:false});
        showToast("Secretly saved 💜 - Only mutual reveals"); setCrushRoll(''); return;
      }
      const other=snap.docs[0].data() as any;
      if(blockedUsers.includes(other.uid)){ showToast("You blocked this user"); return; }
      const mutualSnap=await getDocs(query(collection(db,'crushes'),where('fromUid','==',other.uid), where('toRoll','==',userData.rollNumber)));
      if(!mutualSnap.empty &&!mutualSnap.docs[0].data().blocked){
        await addDoc(collection(db,'crushes'),{fromUid:user.uid, fromRollHash: btoa(userData.rollNumber).slice(0,8), toRoll:roll, toRollMasked: roll.slice(0,2)+"***"+roll.slice(-2), toUid:other.uid, matched:true, createdAt:serverTimestamp(), blocked:false});
        await updateDoc(doc(db,'crushes',mutualSnap.docs[0].id),{matched:true, matchedAt:serverTimestamp()});
        await createNotification(other.uid, 'crush', `💘 SECRET MATCH! Check Crush tab`);
        showToast("💘 IT'S A MATCH!");
      }else{
        await addDoc(collection(db,'crushes'),{fromUid:user.uid, fromRollHash: btoa(userData.rollNumber).slice(0,8), toRoll:roll, toRollMasked: roll.slice(0,2)+"***"+roll.slice(-2), toUid:other.uid, matched:false, createdAt:serverTimestamp(), blocked:false});
        showToast("Secretly saved 🤫 - No one can see");
      }
      setCrushRoll('');
    }catch(e:any){ showToast(e.message); }
  };
  const handleCancelCrush=async(crushId:string)=>{ if(!confirm('Cancel this secret crush? They will never know')) return; try{ await deleteDoc(doc(db,'crushes',crushId)); showToast("Secret crush cancelled"); }catch(e:any){ showToast(e.message); } };
  const handleBlockFromCrush=async(crush:any)=>{ if(!crush.toUid) { showToast("User not in app yet"); return; } if(!confirm('Block this person from Crush?')) return; try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(crush.toUid)}); await updateDoc(doc(db,'crushes',crush.id),{blocked:true}); if(crush.matched){ const mutualSnap=await getDocs(query(collection(db,'crushes'),where('fromUid','==',crush.toUid), where('toRoll','==',userData.rollNumber))); if(!mutualSnap.empty) await updateDoc(doc(db,'crushes',mutualSnap.docs[0].id),{blocked:true}); } showToast("Blocked from Crush"); }catch(e:any){ showToast(e.message); } };
  const handleReportCrushAbuse=async(crush:any)=>{ const reason = prompt('Report reason? (Abuse / Harassment / Fake)'); if(!reason) return; try{ await addDoc(collection(db,'reports'),{type:'crush_abuse', crushId:crush.id, reportedBy:user.uid, targetUid:crush.toUid||crush.toRoll, reason, createdAt:serverTimestamp(), status:'pending'}); showToast("Crush abuse reported"); }catch(e:any){ showToast(e.message); } };
  const handleDeleteAccount=async()=>{
    const confirm1 = confirm('⚠️ DELETE ACCOUNT + ALL DATA?\n\nDeletes:\n- Profile\n- All posts\n- Comments\n- Crushes\n- DMs anonymized\n\nCannot be undone - SRET ONLY');
    if(!confirm1) return; const confirm2 = prompt('Type "DELETE" to confirm'); if(confirm2!=='DELETE'){ showToast('Cancelled'); return; } const confirm3 = confirm('Final confirm - Delete forever?'); if(!confirm3) return;
    try{
      showToast("Deleting..."); const uid=user.uid; const userDocId=userData.id;
      const yaksSnap = await getDocs(query(collection(db,'yaks'),where('uid','==',uid))); for(const d of yaksSnap.docs){ await deleteDoc(doc(db,'yaks',d.id)); }
      const crushFromSnap = await getDocs(query(collection(db,'crushes'),where('fromUid','==',uid))); for(const d of crushFromSnap.docs){ await deleteDoc(doc(db,'crushes',d.id)); }
      const crushToSnap = await getDocs(query(collection(db,'crushes'),where('toUid','==',uid))); for(const d of crushToSnap.docs){ await deleteDoc(doc(db,'crushes',d.id)); }
      const notifSnap = await getDocs(query(collection(db,'notifications'),where('toUid','==',uid))); for(const d of notifSnap.docs){ await deleteDoc(doc(db,'notifications',d.id)); }
      const dmSnap = await getDocs(query(collection(db,'dms'),where('participants','array-contains',uid))); for(const d of dmSnap.docs){ const msgSnap = await getDocs(collection(db,'dms/'+d.id+'/messages')); for(const m of msgSnap.docs){ if((m.data() as any).uid===uid) await deleteDoc(doc(db,'dms/'+d.id+'/messages',m.id)); } await updateDoc(doc(db,'dms',d.id),{lastMessage:"User deleted account - SRET", lastMessageAt:serverTimestamp(), deletedUser:true}); }
      const reportsSnap = await getDocs(query(collection(db,'reports'),where('reportedBy','==',uid))); for(const d of reportsSnap.docs){ await deleteDoc(doc(db,'reports',d.id)); }
      await deleteDoc(doc(db,'users',userDocId)); try{ await deleteDoc(doc(db,'email_otps',userData.collegeEmail)); }catch{}
      await auth.currentUser?.delete(); localStorage.clear(); showToast("Account deleted - Bye SRET 👋"); setTimeout(()=>{ window.location.reload(); },1500);
    }catch(e:any){ if((e as any).code==='auth/requires-recent-login'){ showToast("Re-login needed"); auth.signOut(); localStorage.clear(); window.location.reload(); }else showToast("Error: "+e.message); }
  };
  const handleDeleteDataOnly=async()=>{
    if(!confirm('Delete ONLY posts + crushes? Profile stays')) return;
    try{ const uid=user.uid; const yaksSnap = await getDocs(query(collection(db,'yaks'),where('uid','==',uid))); for(const d of yaksSnap.docs){ await deleteDoc(doc(db,'yaks',d.id)); } const crushSnap = await getDocs(query(collection(db,'crushes'),where('fromUid','==',uid))); for(const d of crushSnap.docs){ await deleteDoc(doc(db,'crushes',d.id)); } await updateDoc(doc(db,'users',userData.id),{totalPosts:0, yakarma:100, likedPosts:[], dislikedPosts:[], pollVoted:[], reportedPosts:[]}); showToast("Posts + crushes deleted"); }catch(e:any){ showToast(e.message); }
  };

  const renderComment = (c:any, depth=0) => {
    const isReply = depth > 0;
    return (<div key={c.id} className={`${isReply? 'ml-6 border-l-2 border-white/15 pl-3' : ''} mt-3`}><div className="flex gap-2.5"><div className={`bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white shrink-0 ${isReply? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'}`}>👻</div><div className="flex-1"><div className="bg-white/[0.05] border border-white/10 rounded-[14px] px-4 py-2.5"><div className="flex gap-2 items-center"><p className="text-[10px] font-bold text-white/40">Anonymous - SRET</p>{isReply && <span className="px-2 py-0.5 bg-white/10 rounded-full text-[7px] text-white/50 font-bold">REPLY</span>}</div>{isReply && c.replyToUsername && <p className="text-[10px] text-white/30 mt-1">Reply to {c.replyToUsername}</p>}<p className="text-[13px] text-white mt-1 leading-[1.4] whitespace-pre-wrap break-words">{c.text}</p></div><div className="flex gap-3 mt-1.5 ml-1 items-center"><button onClick={()=>setReplyTo(c)} className="text-[11px] font-bold text-white/30 hover:text-white">Reply</button><button onClick={()=>handleStartDm(c.uid)} className="text-[11px] font-bold text-white/30 hover:text-white">Private DM 🔒</button></div>{c.replies && c.replies.length > 0 && (<div className="mt-1">{c.replies.map((rep:any)=>renderComment(rep, depth+1))}</div>)}</div></div></div>);
  };
  const filteredYaks = (searchQuery? yaks.filter(y=> y.text.toLowerCase().includes(searchQuery.toLowerCase()) || y.hashtags?.some((h:string)=>h.includes(searchQuery.toLowerCase())) ) : yaks).filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);
  const displayHotYaks = hotYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);
  const displayMemeYaks = memeYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);
  const displayMarketYaks = marketYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);
  const displayPyqYaks = pyqYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);

  return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-2xl">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">S</div><div><p className="font-bold text-[13px] leading-none text-white">SRET ANON - {yaks.length} • 1to1 PRIVATE</p><p className="text-[10px] text-white/40">No One Sees Other Chat 🔒 • {totalUsers} verified</p></div></div>
          <div className="flex gap-2 items-center">
            <button onClick={()=>{ setShowNotifications(true); markNotificationsRead(); }} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white relative">🔔{unreadCount>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white">{unreadCount}</span>}</button>
            <button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">👻</button>
          </div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-2">
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search #hashtag - SRET ONLY" className="flex-1 h-9 bg-white/5 border border-white/10 rounded-full px-4 text-xs outline-none text-white placeholder:text-white/30 focus:border-white" />
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2 overflow-x-auto">
          <button onClick={()=>setFeedTab('new')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='new'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>NEW {filteredYaks.length}</button>
          <button onClick={()=>setFeedTab('meme')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>MEME</button>
          <button onClick={()=>setFeedTab('hot')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='hot'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>HOT</button>
          <button onClick={()=>setFeedTab('top')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='top'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>TOP</button>
          <button onClick={()=>setFeedTab('crush')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='crush'?'bg-pink-500 text-white border-pink-500':'bg-white/5 border-white/10 text-white/40'}`}>💘 {crushMatches.filter((c:any)=>c.matched &&!c.blocked).length}</button>
          <button onClick={()=>setFeedTab('market')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='market'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🛒 {displayMarketYaks.length}</button>
          <button onClick={()=>setFeedTab('pyq')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='pyq'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>📚 {displayPyqYaks.length}</button>
          <button onClick={()=>setFeedTab('dm')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='dm'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🔒 DM {dmChats.length}</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        {hashtags.length>0 &&!['dm','top','crush','market','pyq'].includes(feedTab) && (
          <><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">TRENDING HASHTAGS - SRET ONLY</p><div className="flex gap-2 mt-3 flex-wrap">{hashtags.map((h:any)=><button key={h.tag} onClick={()=>setSearchQuery(h.tag)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/60 hover:bg-white hover:text-black">{h.tag} {h.count}</button>)}</div></div>
          <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">🔥 TRENDING CAMPUS TOPICS - SRET ONLY</p><div className="grid grid-cols-2 gap-2 mt-3">{[{emoji:"🔥", label:"Mid Exams", tag:"#exams"},{emoji:"🔥", label:"Placements", tag:"#placements"},{emoji:"🔥", label:"Canteen", tag:"#canteen"},{emoji:"🔥", label:"Hostel", tag:"#hostel"},{emoji:"🔥", label:"Faculty", tag:"#faculty"},{emoji:"🔥", label:"Internships", tag:"#internships"}].map((t:any)=>{ const count = yaks.filter(y=> y.text.toLowerCase().includes(t.label.toLowerCase()) || y.hashtags?.some((h:string)=>h.toLowerCase().includes(t.tag))).length; return (<button key={t.label} onClick={()=>{ setSearchQuery(t.tag); setFeedTab('hot'); }} className="flex justify-between items-center p-3 bg-white/[0.03] border-2 border-white/10 rounded-xl hover:bg-white hover:text-black group"><div className="flex gap-2 items-center"><span className="text-[14px]">{t.emoji}</span><span className="text-[12px] font-bold">{t.label}</span></div><span className="px-2 py-1 bg-white/10 group-hover:bg-black/10 rounded-full text-[10px] font-bold">{count}</span></button>)})}</div></div></>
        )}
        {feedTab==='crush' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-2 border-pink-500/20 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-pink-400">PREMIUM - CRUSH MATCHER 💘 • 1to1 PRIVATE DM 🔒</p><h3 className="font-black mt-2 text-white">Secret Crush - 100% Anonymous</h3><p className="text-[11px] text-white/40 mt-1">Masked rolls • No total list • Only mutual reveals • Private DM after match 🔒</p><div className="flex gap-2 mt-4"><input value={crushRoll} onChange={e=>setCrushRoll(e.target.value.toUpperCase())} placeholder="Crush Roll 21CS*** masked" className="flex-1 bg-black/30 border-2 border-pink-500/20 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-pink-500"/><button onClick={handleCrushSubmit} className="px-6 h-11 bg-pink-500 text-white rounded-full font-bold text-xs">Add Secret 💜</button></div></div>
            {crushMatches.filter((c:any)=>c.matched &&!c.blocked).length>0 && <div className="bg-pink-500/10 border-2 border-pink-500/30 rounded-[18px] p-4"><p className="text-[10px] font-bold text-pink-400">💘 MUTUAL MATCHES - {crushMatches.filter((c:any)=>c.matched &&!c.blocked).length} • Private DM Only You 2 🔒</p>{crushMatches.filter((c:any)=>c.matched &&!c.blocked).map((m:any)=><div key={m.id} className="mt-3 bg-white/5 p-3 rounded-xl flex justify-between items-center"><div><p className="font-bold text-[13px] text-white">MATCH! 🎉 {m.toRollMasked}</p><p className="text-[10px] text-white/40">Private chat - No one else can see 🔒</p></div><div className="flex gap-2"><button onClick={()=>handleStartDm(m.toUid)} className="px-4 py-2 bg-white text-black rounded-full text-[11px] font-bold">Private DM 🔒</button><button onClick={()=>handleBlockFromCrush(m)} className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs">🚫</button></div></div>)}</div>}
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4"><p className="text-[10px] font-bold text-white/30">YOUR SECRET CRUSHES - {crushMatches.filter((c:any)=>!c.matched &&!c.blocked).length} Pending • 🔒 PRIVATE</p>{crushMatches.filter((c:any)=>!c.matched &&!c.blocked).map((m:any)=><div key={m.id} className="mt-2 flex justify-between items-center bg-white/[0.02] p-3 rounded-xl"><p className="text-[13px] text-white/60">{m.toRollMasked} • 🤫 Secret</p><div className="flex gap-1.5"><button onClick={()=>handleCancelCrush(m.id)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40">Cancel</button><button onClick={()=>handleBlockFromCrush(m)} className="w-7 h-7 bg-red-500/10 border border-red-500/20 rounded-full text-[10px]">🚫</button><button onClick={()=>handleReportCrushAbuse(m)} className="w-7 h-7 bg-white/5 border border-white/10 rounded-full text-[10px]">⚠️</button></div></div>)}{crushMatches.filter((c:any)=>!c.matched &&!c.blocked).length===0 && <p className="text-[11px] text-white/20 mt-3 text-center py-6">No pending • Masked & private 👻</p>}</div><Footer/>
          </div>
        )}
        {feedTab==='market' && (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET MARKETPLACE - ANONYMOUS 🛒 • Private DM 🔒</p><p className="font-black mt-1 text-white">Buy/Sell - Private Chat Only You 2</p><button onClick={()=>{setYakType('market'); setScreen('create');}} className="mt-3 bg-white text-black px-5 h-9 rounded-full text-xs font-bold">Sell Item +</button></div>
            {displayMarketYaks.map((y:any)=><div key={y.id} className="bg-white/[0.04] border-2 border-white/10 rounded-[20px] p-5"><div className="flex justify-between"><p className="font-bold text-[13px] text-white">Anonymous - SRET - 🛒 MARKET</p><span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[11px] font-bold text-green-400">₹{y.price}</span></div><p className="text-[14px] text-white mt-3">{y.text}</p>{y.image && <img src={y.image} className="mt-3 rounded-[16px] border-2 border-white/10 w-full max-h-[300px] object-cover"/>}{y.hidden && <div className="mt-3 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-xl p-3"><span className="text-yellow-400 text-[10px] font-bold">⏳ Hidden - Under review</span></div>}<button onClick={()=>handleStartDm(y.uid, y.id)} className="mt-4 w-full h-10 bg-white text-black rounded-full font-bold text-xs">Private DM to Buy 🔒</button></div>)}
            {displayMarketYaks.length===0 && <div className="py-16 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><p className="text-3xl">🛒</p><p className="font-black mt-3 text-white">No items yet</p></div>}<Footer/>
          </div>
        )}
        {feedTab==='pyq' && (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET PYQ VAULT - PREMIUM 📚 • Private DM 🔒</p><p className="font-black mt-1 text-white">PYQ - Private Chat Only You 2</p><button onClick={()=>{setYakType('pyq'); setScreen('create');}} className="mt-3 bg-white text-black px-5 h-9 rounded-full text-xs font-bold">Upload PYQ +</button></div>
            {displayPyqYaks.map((y:any)=><div key={y.id} className="bg-white/[0.04] border-2 border-white/10 rounded-[20px] p-5"><div className="flex gap-2 items-center"><span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-[10px] font-bold text-blue-400">{y.subject||'PYQ'}</span><span className="text-[10px] text-white/30">{y.hashtags?.join(' ')}</span></div><p className="text-[14px] text-white mt-3">{y.text}</p>{y.image && <img src={y.image} className="mt-3 rounded-[16px] border-2 border-white/10 w-full max-h-[400px] object-contain"/>}<div className="flex gap-2 mt-4"><button onClick={()=>handleVote(y,'up')} className="px-4 h-8 bg-white/5 border border-white/10 rounded-full text-xs text-white/40">Up {y.likes||0}</button><button onClick={()=>handleStartDm(y.uid)} className="px-4 h-8 bg-white text-black rounded-full text-xs font-bold">Private DM 🔒 PDF</button></div></div>)}
            {displayPyqYaks.length===0 && <div className="py-16 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><p className="text-3xl">📚</p><p className="font-black mt-3 text-white">No PYQs yet</p></div>}<Footer/>
          </div>
        )}

        {feedTab==='dm'? (
          <div className="space-y-3">
            {!activeDm? (
              <><div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">1to1 PRIVATE DM - SRET ONLY 🔒</p><p className="font-black mt-1 text-white">Private Chats - {dmChats.length} • No One Sees Other Chat</p><p className="text-[11px] text-white/40 mt-1">1to1 only - 2 participants - 100% private - No group - SRET ONLY</p></div>
              {dmChats.map((chat:any)=><button key={chat.id} onClick={()=>setActiveDm(chat)} className="w-full bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center text-left"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">🔒</div><div><p className="font-bold text-[13px] text-white">🔒 Private Chat - Only You 2</p><p className="text-[11px] text-white/40 truncate max-w-[200px]">{chat.lastMessage}</p></div></div><span className="px-2 py-1 bg-green-500/20 rounded-full text-[8px] font-bold text-green-400">1to1 PRIVATE</span></button>)}
              {dmChats.length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><p className="font-black text-[18px] text-white">No Private DMs yet 🔒</p><p className="text-[11px] text-white/30 mt-1">Start private DM from any post - No one can see other's chat</p></div>}<Footer/></>
            ) : (
              <div className="bg-white/[0.03] border-2 border-white/10 rounded-[24px] flex flex-col h-[70vh]">
                <div className="p-4 border-b-2 border-white/10 flex justify-between items-center"><div className="flex gap-3 items-center"><button onClick={()=>setActiveDm(null)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">←</button><div><p className="font-bold text-[13px] text-white">🔒 1to1 Private Chat</p><p className="text-[9px] text-green-400">Only you 2 can see - No one else</p></div></div><span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[8px] font-bold text-green-400">PRIVATE</span></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">{dmMessages.map((m:any)=><div key={m.id} className={`flex ${m.uid===user?.uid?'justify-end':'justify-start'}`}><div className={`max-w-[70%] rounded-[16px] px-4 py-2.5 ${m.uid===user?.uid?'bg-white text-black':'bg-white/10 border border-white/10 text-white'}`}><p className="text-[13px] leading-[1.4]">{m.text}</p><p className="text-[8px] opacity-50 mt-1">{m.uid===user?.uid?'You':'Anonymous'} • Private 🔒</p></div></div>)}</div>
                <div className="p-3 border-t-2 border-white/10 flex gap-2"><input value={dmText} onChange={e=>setDmText(e.target.value)} placeholder="Private message - Only you 2 can see 🔒" className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white" onKeyDown={e=>{ if(e.key==='Enter') handleSendDm(); }}/><button onClick={handleSendDm} disabled={!dmText.trim()} className={`w-11 h-11 rounded-full font-bold ${!dmText.trim()?'bg-white/5 text-white/20':'bg-white text-black'}`}>Go</button></div>
              </div>
            )}
          </div>
        ) : feedTab==='top'? (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET TOP ANONYMOUS - VERIFIED • Private DM 🔒</p><p className="font-black mt-1 text-white">Top Anonymous - 1to1 Private Chat</p></div>
            {leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">{i+1}</span><span className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">👻</span><div><p className="font-bold text-[13px] text-white">Anonymous Student {i+1} {i===0?'👑':''}</p><p className="text-[10px] text-white/40">{u.totalPosts||0} posts • SRET Verified</p></div></div><p className="font-black text-sm text-white">{u.yakarma}</p></div>)}<Footer/></div>
        ) :!['crush','market','pyq','dm','top'].includes(feedTab) && (
          <>
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">👻</div><div><p className="font-bold text-[13px] text-white">Anonymous + Premium - 1to1 Private 🔒</p><p className="text-[11px] text-white/40">No One Sees Other Chat • SRET ONLY</p></div></div><span className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] font-bold text-green-400">🔒 PRIVATE DM</span></div>
            {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : displayHotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const hasVoted=userData.pollVoted?.includes(y.id); const nestedTree = activePost===y.id? buildTree(comments) : [];
              return(
                <div key={y.id} className={`bg-white/[0.04] border-2 rounded-[20px] p-5 ${isOwn?'border-white/20 bg-white/[0.06]':'border-white/10'}`}>
                  <div className="flex justify-between items-start"><div className="flex gap-3"><div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm relative text-white">👻</div><div><div className="flex gap-2 items-center flex-wrap"><p className="font-bold text-[13px] text-white">Anonymous - SRET {isOwn? '- YOU' : ''}</p><span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-white text-black">SRET {y.type?.toUpperCase()}</span></div><p className="text-[10px] text-white/30 mt-0.5">Anonymous - {score} • {y.hashtags?.join(' ')||''} {y.price? `• ₹${y.price}`:''} {y.subject? `• ${y.subject}`:''}</p></div></div><div className="relative flex gap-2"><button onClick={()=>handleStartDm(y.uid, y.id)} className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-[12px]">🔒</button><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40">...</button>{showMenu===y.id && <div className="absolute right-0 top-10 w-[220px] bg-black border-2 border-white/10 rounded-2xl p-2 z-20 shadow-2xl">{isOwn? (<><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 text-white">Edit</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 mt-2">Delete</button></>) : (<><button onClick={()=>handleStartDm(y.uid, y.id)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400">🔒 Private DM - Only You 2</button><button onClick={()=>{ setReportingPost(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60 mt-2">Report {y.reports||0}/5 → Review</button><button onClick={()=>handleBlockUser(y.uid)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 mt-2">🚫 Block User</button></>)}<button onClick={()=>setShowMenu(null)} className="w-full mt-2 py-2 rounded-xl text-[11px] text-white/30">Cancel</button></div>}</div></div>
                  <p className="text-[15px] mt-4 leading-[1.5] text-white whitespace-pre-wrap break-words">{y.text}</p>
                  {y.image && <img src={y.image} className="mt-4 rounded-[16px] border-2 border-white/10 w-full max-h-[380px] object-cover" alt="yak" />}
                  {y.hidden && <div className="mt-3 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-xl p-3"><span className="text-yellow-400 text-[10px] font-bold">⏳ TEMPORARILY HIDDEN - {y.reports}/5 - Admin review - Only you see</span></div>}
                  {isPoll && y.pollOptions && (<div className="mt-4 bg-white/[0.03] border-2 border-white/10 rounded-[16px] p-4"><div className="flex justify-between items-center mb-3"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">📊 POLL ANALYTICS - PRIVATE VOTE</p><span className="px-2 py-1 bg-white text-black rounded-full text-[9px] font-bold">{y.totalVotes||0} VOTES • 24H</span></div><div className="space-y-2.5">{[...y.pollOptions].sort((a:any,b:any)=> (b.votes||0)-(a.votes||0)).map((opt:any,idx:number)=>{ const total=y.totalVotes||1; const percent=Math.round((opt.votes/total)*100)||0; const isWinner = idx===0 && hasVoted; const rank = idx+1; return (<button key={idx} onClick={()=>handlePollVote(y,y.pollOptions.indexOf(opt))} disabled={!!hasVoted} className={`w-full relative overflow-hidden rounded-xl border-2 text-left p-0 ${hasVoted?'border-white/10':'border-white/10 hover:border-white/20'} ${isWinner?'bg-yellow-500/10 border-yellow-500/30':''}`}><div className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all" style={{width:`${hasVoted? percent: 0}%`}}></div><div className="relative flex justify-between items-center p-3"><div className="flex gap-2 items-center"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${rank===1?'bg-yellow-500 text-black': rank===2?'bg-white/20 text-white':'bg-white/5 text-white/40'}`}>#{rank}</span><span className="text-[13px] font-bold">{opt.text} {isWinner?'👑':''}</span></div><div className="text-right"><p className="text-[12px] font-black">{hasVoted? `${percent}%` : `${opt.votes||0} votes`}</p><p className="text-[9px] text-white/40">{hasVoted? `${opt.votes} votes` : 'Vote'}</p></div></div></button> )})}</div><div className="flex justify-between mt-3 pt-3 border-t border-white/5"><p className="text-[10px] text-white/30">Total: {y.totalVotes||0} votes • Sorted by rank</p><p className="text-[10px] text-white/30">📊 {hasVoted? 'Voted': 'Vote to see %'} • ⏰ 24h</p></div></div>)}
                  <div className="flex gap-2.5 mt-5 items-center flex-wrap"><div className="flex bg-white/5 border border-white/10 rounded-full p-1"><button onClick={()=>handleVote(y,'up')} className={`px-4 py-2 rounded-full text-xs font-bold ${liked?'bg-white text-black':'text-white/40'}`}>Up {y.likes||0}</button><span className="px-3 py-2 text-[11px] font-black min-w-[36px] text-center text-white/20">{score}</span><button onClick={()=>handleVote(y,'down')} className={`px-4 py-2 rounded-full text-xs font-bold ${disliked?'bg-red-500 text-white':'text-white/30'}`}>Down {y.dislikes||0}</button></div><button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); setReplyTo(null); }} className="px-4 h-9 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">Comments {y.commentsCount||0}</button><button onClick={()=>handleStartDm(y.uid, y.id)} className="px-4 h-9 rounded-full text-xs bg-green-500/10 border border-green-500/20 text-green-400 font-bold">🔒 Private DM</button></div>
                  {activePost===y.id && (<div className="mt-5 border-t-2 border-white/10 pt-4 space-y-1"><p className="text-[10px] font-bold tracking-widest text-white/30 mb-3">NESTED REPLIES - {comments.length} - Private 🔒</p>{replyTo && (<div className="bg-white/10 border-2 border-white/20 rounded-xl px-4 py-2.5 flex justify-between items-center mb-3"><p className="text-[11px] text-white">Replying to {replyTo.username}: {replyTo.text.slice(0,30)}</p><button onClick={()=>setReplyTo(null)} className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white text-xs">X</button></div>)}<div className="max-h-[420px] overflow-y-auto pr-1">{nestedTree.length===0 && <p className="text-xs text-white/20 text-center py-8">No comments yet - Be first</p>}{nestedTree.map((c:any)=>renderComment(c,0))}</div><div className="flex gap-2.5 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={replyTo? `Reply to ${replyTo.username} anonymously` : "Anonymous comment - Private 🔒"} className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white" onKeyDown={e=>{ if(e.key==='Enter'){ handleCommentPost(y.id); } }}/><button onClick={()=>handleCommentPost(y.id)} disabled={!commentText.trim()} className={`w-11 h-11 rounded-full font-bold flex items-center justify-center ${!commentText.trim()?'bg-white/5 text-white/20 border border-white/5':'bg-white text-black'}`}>Go</button></div></div>)}</div>
              );
            })}
            {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : displayHotYaks).length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] mx-auto flex items-center justify-center text-4xl">S</div><p className="font-black mt-6 text-[18px] text-white">No posts yet - SRET ONLY</p><p className="text-[11px] text-white/30 mt-1">Use #hashtag - Try #SRET #Exams</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full text-[13px] font-bold">Create First Post</button></div>}
            <Footer/>
          </>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-2xl border-t-2 border-white/10"><div className="max-w-[600px] mx-auto px-6 h-[72px] flex items-center justify-between"><button onClick={()=>{ setFeedTab('new'); setActiveDm(null); }} className="flex flex-col items-center gap-1.5"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/30 border border-white/10'}`}>S</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {yaks.length}</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[24px] font-black">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1.5"><div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs text-white relative">P{unreadCount>0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {userData?.yakarma||0}</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col overflow-hidden">
          {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100]">{toast}</div>}
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full bg-[#0a0a0b]">
            <div className="p-5 flex items-center justify-between border-b-2 border-white/10"><button onClick={()=>{ if(!posting) { setScreen('feed'); setYakImage(''); } }} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">X</button><div className="text-center"><p className="text-[11px] font-bold tracking-widest text-white">SRET ONLY - PRIVATE DM 🔒</p><p className="text-[10px] text-white/30">1to1 Private • No One Sees Other Chat</p></div><button onClick={handlePost} disabled={posting||(!newYak.trim()&&!yakImage)} className={`px-6 h-10 rounded-full font-bold text-[13px] ${posting||(!newYak.trim()&&!yakImage)?'bg-white/5 text-white/20 border-2 border-white/5':'bg-white text-black'}`}>{posting?'Posting...':'Post'}</button></div>
            <div className="p-3 flex gap-2 border-b-2 border-white/5 overflow-x-auto bg-white/[0.02]">
              <button onClick={()=>setYakType('yak')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='yak'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Talk #tag</button>
              <button onClick={()=>setYakType('poll')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='poll'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Poll 📊</button>
              <button onClick={()=>setYakType('confession')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='confession'?'bg-purple-500 text-white border-purple-500':'bg-white/5 border-white/10 text-white/40'}`}>Confession</button>
              <button onClick={()=>setYakType('meme')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Meme</button>
              <button onClick={()=>setYakType('market')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='market'?'bg-green-500 text-white border-green-500':'bg-white/5 border-white/10 text-white/40'}`}>🛒 Sell</button>
              <button onClick={()=>setYakType('pyq')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='pyq'?'bg-blue-500 text-white border-blue-500':'bg-white/5 border-white/10 text-white/40'}`}>📚 PYQ</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto bg-[#0a0a0b]">
              <div className="flex gap-3 mb-6"><div className="w-11 h-11 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center text-white">🔒</div><div><p className="font-bold text-[14px] text-white">Anonymous - SRET - 1to1 Private 🔒</p><p className="text-[11px] text-white/40">Others DM you privately - No one sees other's chat</p></div></div>
              {yakType==='market' && <div className="flex gap-2 mb-4"><input value={marketPrice} onChange={e=>setMarketPrice(e.target.value)} placeholder="Price e.g. 250" className="w-[120px] p-4 bg-white/[0.03] border-2 border-green-500/20 rounded-xl text-sm outline-none text-white placeholder:text-white/30"/><p className="text-[10px] text-green-400 flex items-center">₹ Price</p></div>}
              {yakType==='pyq' && <div className="flex gap-2 mb-4"><input value={pyqSubject} onChange={e=>setPyqSubject(e.target.value.toUpperCase())} placeholder="Subject: e.g. M1, DBMS" className="flex-1 p-4 bg-white/[0.03] border-2 border-blue-500/20 rounded-xl text-sm outline-none text-white placeholder:text-white/30 uppercase"/><p className="text-[10px] text-blue-400 flex items-center">SUBJECT</p></div>}
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={yakType==='market'? `What selling? e.g. Drafter - Good condition - SRET ONLY #marketplace - Private DM only` : yakType==='pyq'? `Describe PYQ: e.g. DBMS 2023 Mid-1 - Important Qs - SRET ONLY #pyq #dbms - Private DM for PDF` : `Talk about SRET... Use #hashtag like #SRET #Exams\n\n1to1 Private DM - No one sees other chat 🔒\n\nExample: Exams ela #SRET #Exams 😭`} autoFocus className="w-full bg-transparent text-[19px] leading-[1.45] outline-none placeholder:text-white/20 resize-none min-h-[140px] text-white" maxLength={300}/>
              {yakType==='poll' && (<div className="mt-6 space-y-3"><p className="text-[10px] text-white/30 font-bold">POLL OPTIONS - 24H - Private votes</p>{pollOptions.map((opt,idx)=><div key={idx} className="flex gap-2"><input value={opt} onChange={e=>{ const n=[...pollOptions]; n[idx]=e.target.value; setPollOptions(n); }} placeholder={`Option ${idx+1}`} className="flex-1 p-4 bg-white/[0.03] border-2 border-white/10 rounded-xl text-sm outline-none focus:border-white text-white placeholder:text-white/30"/>{pollOptions.length>2 && <button onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))} className="w-12 h-12 bg-white/5 border-2 border-white/10 rounded-xl flex items-center justify-center text-white/40">X</button>}</div>)}{pollOptions.length<4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="w-full p-3 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-xl text-xs font-bold text-white/40">Add Option</button>}</div>)}
              <div className="mt-6">{yakImage? (<div className="relative"><img src={yakImage} className="w-full rounded-[16px] border-2 border-white/10 max-h-[300px] object-cover" alt="upload"/><button onClick={()=>setYakImage('')} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full flex items-center justify-center text-white">X</button></div>) : (<label className="w-full border-2 border-dashed border-white/10 rounded-[16px] p-8 flex flex-col items-center justify-center cursor-pointer hover:border-white/20 bg-white/[0.02]"><span className="text-2xl mb-2">📷</span><span className="text-xs font-bold text-white/60">{yakType==='market'?'Upload Item Photo - Private DM': yakType==='pyq'?'Upload PYQ Photo - Private DM': 'Upload Image'}</span><span className="text-[10px] text-white/30 mt-1">Max 800KB - Private DM Secure</span><input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,setYakImage)} /></label>)}</div>
            </div>
            <div className="p-5 border-t-2 border-white/5 bg-white/[0.02]"><div className="bg-green-500/5 border-2 border-green-500/10 rounded-xl p-4 flex gap-3 items-center"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] text-white/50"><span className="font-bold text-green-400">1to1 PRIVATE:</span> 🔒 No one can see other's chat - Only you 2 - SRET ONLY</p></div><Footer/></div>
          </div>
        </div>
      )}

      {editingPost && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center p-4"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8 shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><h3 className="font-black text-[16px] text-white">Edit Post - SRET ONLY</h3><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-5 bg-white/[0.05] border-2 border-white/10 rounded-xl p-4 text-[15px] outline-none min-h-[120px] resize-none text-white focus:border-white"/><div className="flex gap-3 mt-6"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs text-white">Cancel</button><button onClick={handleEdit} disabled={!editText.trim()} className={`flex-1 h-12 rounded-full font-bold text-xs ${!editText.trim()?'bg-white/5 text-white/20 border-2 border-white/5':'bg-white text-black'}`}>Save</button></div></div></div>}

      {showNotifications && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><div className="flex justify-between items-center"><h3 className="font-black text-[16px] text-white">Notifications 🔔 {unreadCount>0? `(${unreadCount} new)` : ''} • Private</h3><button onClick={()=>setShowNotifications(false)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">X</button></div><div className="mt-6 space-y-3">{notifications.map((n:any)=><div key={n.id} className={`p-4 rounded-[16px] border-2 ${!n.read?'bg-white/10 border-white/20':'bg-white/[0.03] border-white/10'}`}><p className="text-[10px] font-bold text-white/40">{n.type.toUpperCase()} • 🔒 Private</p><p className="text-[13px] text-white mt-1">{n.text}</p><p className="text-[10px] text-white/20 mt-2">{n.createdAt?.toDate?.().toLocaleString?.()||'Just now'}</p></div>)}{notifications.length===0 && <div className="py-16 text-center"><p className="font-bold text-white/40">No notifications yet</p></div>}<button onClick={()=>setShowNotifications(false)} className="w-full mt-6 bg-white text-black h-12 rounded-full font-bold text-xs">Close</button></div></div></div>}

      {reportingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[60] flex items-end justify-center p-4">
          <div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div>
            <h3 className="font-black text-[16px] text-white">Report Post - SRET ONLY</h3>
            <p className="text-[11px] text-white/40 mt-1">{reportingPost.text.slice(0,60)}...</p>
            <p className="text-[10px] font-bold tracking-widest text-white/30 mt-5">SELECT REASON</p>
            <div className="grid grid-cols-1 gap-2 mt-3">
              {REPORT_REASONS.map((r:any)=><button key={r} onClick={()=>setReportReason(r)} className={`p-3.5 rounded-xl text-left text-[12px] font-bold border-2 ${reportReason===r?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/60'}`}>{r} {reportReason===r?'✓':''}</button>)}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>{ setReportingPost(null); setReportReason(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs text-white">Cancel</button>
              <button onClick={()=>handleReport(reportingPost)} disabled={!reportReason} className={`flex-1 h-12 rounded-full font-bold text-xs ${!reportReason?'bg-white/5 text-white/20 border-2 border-white/5':'bg-red-500 text-white'}`}>Submit Report</button>
            </div>
          </div>
        </div>
      )}

      {showAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex flex-col">
          <div className="max-w-[600px] mx-auto w-full flex-1 flex flex-col bg-[#0a0a0b] p-4 overflow-y-auto">
            <div className="flex justify-between items-center"><h2 className="font-black text-white">ADMIN REVIEW - {adminReports.length} Pending</h2><button onClick={()=>setShowAdmin(false)} className="w-8 h-8 bg-white/10 rounded-full text-white">X</button></div>
            <div className="mt-6 space-y-4">
              {adminReports.map((rep:any)=><div key={rep.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4">
                <div className="flex justify-between"><span className="px-2 py-1 bg-yellow-500/20 rounded-full text-[10px] font-bold text-yellow-400">{rep.reason}</span><span className="text-[10px] text-white/30">{rep.createdAt?.toDate?.().toLocaleString?.()||''}</span></div>
                <p className="text-[13px] text-white mt-3">{rep.yakText}</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={()=>handleAdminRestore(rep)} className="flex-1 h-10 bg-white text-black rounded-full text-[11px] font-bold">Restore ✅</button>
                  <button onClick={()=>handleAdminDismiss(rep)} className="flex-1 h-10 bg-white/10 border border-white/10 rounded-full text-[11px] font-bold text-white">Dismiss</button>
                  <button onClick={()=>handleAdminDelete(rep)} className="flex-1 h-10 bg-red-500 text-white rounded-full text-[11px] font-bold">Delete 🗑️</button>
                </div>
              </div>)}
              {adminReports.length===0 && <p className="text-center text-white/20 py-20">No pending reports - All clean</p>}
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
          <div className="bg-[#141416] border-2 border-white/10 w-full max-w-[360px] rounded-[24px] p-6 shadow-2xl">
            <div className="w-14 h-14 bg-white/5 border-2 border-white/10 rounded-full mx-auto flex items-center justify-center text-2xl">👋</div>
            <h3 className="font-black text-[18px] text-white text-center mt-4">Are you sure you want to logout?</h3>
            <p className="text-[11px] text-white/40 text-center mt-2 leading-[1.5]">You will need to login again with Google<br/>Your anonymous posts & crushes stay safe<br/>SRET ONLY - Private DM secure 🔒</p>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 h-12 bg-white text-black rounded-full font-bold text-xs">Cancel</button>
              <button onClick={()=>{ auth.signOut(); localStorage.clear(); window.location.reload(); }} className="flex-1 h-12 bg-red-500 text-white rounded-full font-bold text-xs">Yes, Logout</button>
            </div>
            <p className="text-[9px] text-white/20 text-center mt-4">Your data stays safe - Only logout - Private chats remain 🔒</p>
          </div>
        </div>
      )}

      {showProfile && (<div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><div className="flex gap-4"><div className="w-[72px] h-[72px] bg-white/5 border-2 border-white/10 rounded-[20px] flex items-center justify-center text-3xl text-white">🔒</div><div className="flex-1"><h2 className="font-black text-[16px] leading-none text-white">SRET ONLY - 1to1 PRIVATE 🔒</h2><p className="text-[11px] text-white/40 mt-2 leading-[1.4]">No one sees other's chat • Private DM • {totalUsers} verified • {dmChats.length} private chats</p><div className="flex gap-2 mt-4 flex-wrap"><span className="px-3 py-1.5 bg-white text-black rounded-full text-[10px] font-bold">{userData.yakarma} karma</span><span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[9px] font-bold">🔒 {dmChats.length} PRIVATE</span><span className="px-3 py-1.5 bg-pink-500 text-white rounded-full text-[9px] font-bold">💘 {crushMatches.filter((c:any)=>c.matched &&!c.blocked).length} MATCHES</span></div></div></div>
      <div className="grid grid-cols-4 gap-3 mt-6"><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">POSTS</p></div><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{totalUsers}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">VERIFIED</p></div><div className="bg-green-500/10 border-2 border-green-500/20 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-green-400">{dmChats.length}</p><p className="text-[9px] font-bold tracking-widest text-green-400/60 mt-1">PRIVATE DM</p></div><div className="bg-white text-black rounded-[18px] p-4 text-center"><p className="font-black text-xl">{userData.yakarma}</p><p className="text-[9px] font-bold tracking-widest mt-1">KARMA</p></div></div>
      <div className="mt-6 bg-green-500/5 border-2 border-green-500/10 rounded-[16px] p-4"><p className="text-[11px] font-bold text-green-400">🔒 1to1 PRIVATE DM - FINAL:</p><p className="text-[11px] text-white/40 mt-2 leading-[1.6]">✅ 1to1 only - 2 participants - No group<br/>✅ No one can see other's chat - Only you 2<br/>✅ visibleTo + isPrivate flag + length===2 filter<br/>✅ Block check both ways<br/>✅ Private DM badge everywhere<br/>✅ Logout popup: Are you sure you want to logout?</p></div>
      <button onClick={()=>setShowAdmin(true)} className="w-full mt-4 bg-yellow-500/10 border-2 border-yellow-500/20 h-12 rounded-full text-xs font-bold text-yellow-400">Admin Review Panel - {adminReports.length} Pending {adminReports.length>0?'🔴':''}</button>
      {blockedUsers.length>0 && (
        <div className="mt-6 bg-red-500/5 border-2 border-red-500/10 rounded-[16px] p-4">
          <p className="text-[11px] font-bold text-red-400">🚫 BLOCKED USERS - {blockedUsers.length}</p>
          <div className="mt-3 space-y-2">
            {blockedUsers.map((uid:string)=><div key={uid} className="flex justify-between items-center bg-white/[0.03] p-3 rounded-xl">
              <p className="text-[11px] text-white/60 font-mono">{uid.slice(0,8)}... (Anonymous)</p>
              <button onClick={()=>handleUnblockUser(uid)} className="px-3 py-1 bg-white text-black rounded-full text-[10px] font-bold">Unblock</button>
            </div>)}
          </div>
        </div>
      )}
      <div className="mt-6 bg-red-500/5 border-2 border-red-500/10 rounded-[16px] p-4">
        <p className="text-[11px] font-bold text-red-400">🗑️ DANGER ZONE - DELETE DATA - SRET ONLY</p>
        <div className="mt-4 space-y-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
            <p className="text-[11px] font-bold text-white">Delete Only Posts + Crushes</p>
            <button onClick={handleDeleteDataOnly} className="w-full mt-3 h-10 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/60">Delete My Posts + Crushes Only</button>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
            <p className="text-[11px] font-bold text-red-400">Delete Account + All Data Permanently</p>
            <button onClick={handleDeleteAccount} className="w-full mt-3 h-10 bg-red-500 text-white rounded-full text-[11px] font-bold">🗑️ Delete Account + All Data Forever</button>
          </div>
        </div>
      </div>
      <button onClick={()=>setShowLogoutConfirm(true)} className="w-full mt-6 bg-white/5 border-2 border-white/10 h-12 rounded-full text-xs font-bold text-white/60">Logout - SRET ONLY</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-12 rounded-full font-bold text-xs">Close</button><div className="mt-4"><Footer/></div></div></div>)}
    </div>
  );
}
