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
const AVATARS = ["❤️","💚","💜","🩷","🖤","🤍","💙","🩵"];
const ANON_NAMES = ["Anonymous Owl","Secret Tiger","Hidden Fox","Silent Panda","Ghost User","Shadow Yak"];
const REPORT_REASONS = ["Spam / Promotion","Abusive / Hate","Fake Info / Misleading","NSFW / Inappropriate","Personal Info Leak","Harassment / Bullying","Other"];
const Footer = () => (<div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.3em] font-bold text-white/40">© 2026 Anonyfy. A Production By ANESH</p><p className="text-[9px] text-white/20"></p></div>);

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
      setMemeYaks([...data].filter(d=>d.type==='meme').sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
      setMarketYaks([...data].filter(d=>d.type==='market').slice(0,30));
      setPyqYaks([...data].filter(d=>d.type==='pyq').slice(0,30));
      const tagCount:Record<string,number>={}; data.forEach(y=>{ const tags=y.text?.match(/#\w+/g); if(tags) tags.forEach((t:string)=>{ tagCount[t.toLowerCase()]=(tagCount[t.toLowerCase()]||0)+1; }); }); setHashtags(Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([tag,count])=>({tag,count})));
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

  if(screen==='college'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>{toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}<div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">S</div><div><p className="font-black text-sm tracking-wide">SREE RAMA ENGINEERING COLLEGE</p><p className="text-[10px] text-white/40">{totalUsers} verified</p></div></div><h1 className="text-[36px] font-black mt-8 leading-[0.9] tracking-tight">Social<br/>network<br/><span className="text-white/30">campus</span></h1><p className="text-[13px] text-white/50 mt-3">“Anonyfy.” </p><p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">SELECT AVATAR - ANONYMOUS - SRET ONLY</p><div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/[0.05] border-white/10 text-white'}`}>{a}</button>)}</div><p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">COLLEGE - SRET ONLY</p><div className="mt-3"><div className="w-full p-4 rounded-[18px] border-2 bg-white text-black border-white flex justify-between"><div><p className="font-bold text-[13px]">SRET - Tirupati - Verified Only</p><p className="text-[11px] text-black/60">{collegeCounts["SRET"]||0} anonymous • MVP Secure • Private DM • Share 3in1 🔗</p></div><div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">✓</div></div></div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black text-[14px] bg-white text-black">Enter SRET - Premium - Share 3in1 🔗</button><Footer/></div></div>);
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full text-white">←</button><div className="mt-6 bg-white/[0.05] border border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-widest text-white/30">{collegeCounts["SRET"]||0} ANONYMOUS IN SRET</p><h2 className="font-black text-[18px] mt-1 text-white">Verify SRET Student - MVP + Share 3in1 🔗</h2><p className="text-[11px] text-white/40 mt-1">College Mail + Roll Number Only - No ID Needed - Private DM Secure + Share Ready 🔗</p></div><div className="flex p-1 bg-white/5 border border-white/10 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>College Mail OTP</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll Number</button></div>{verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3.5 rounded-xl border border-red-500/20">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><p className="text-[10px] font-bold text-white/30 mb-3">SRET COLLEGE EMAIL - MOST SECURE + Share Ready 🔗</p><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl text-sm outline-none text-white placeholder:text-white/30 focus:border-white"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Send OTP - SRET ONLY + Share 🔗</button>{otpSent&&<div className="mt-4 bg-black/30 border-2 border-white/10 rounded-xl p-4"><p className="text-xs text-emerald-400 font-bold">OTP: {generatedOtp} - Check Console - Share Ready 🔗</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full mt-3 p-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-center tracking-[0.3em] text-white"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify OTP - SRET ONLY + Share 🔗</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><p className="text-[10px] font-bold text-white/30 mb-3">ROLL NUMBER - QUICK VERIFY + Share Ready 🔗</p><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={`${config?.ex}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase font-bold tracking-widest text-white placeholder:text-white/30"/><p className="text-[10px] text-white/20 mt-2">Pattern: 21CS101 - SRET ONLY + Share Ready 🔗</p><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify Roll Number - SRET ONLY + Share 🔗</button></div>}<Footer/></div></div>);
     }

if(screen==='login'){
    return (<div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border-2 border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] flex items-center justify-center text-4xl">{selectedAvatar}</div><h1 className="font-black mt-6 text-center text-xl text-white">SRET Verified<br/><span className="text-white/40">1to1 Private DM + Share 3in1 🔗</span></h1><p className="text-[11px] text-white/30 mt-2 text-center">Anonymous - SRET • Share Ready • MVP Secure • Private Chat</p><button onClick={handleGoogleLogin} className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold text-sm">Continue with Google - SRET ONLY + Share 🔗</button></div><Footer/></div>);
  }

  const createNotification=async(toUid:string, type:string, text:string, yakId?:string)=>{
    if(toUid===user?.uid) return;
    await addDoc(collection(db,'notifications'),{toUid, fromUid:user?.uid, fromUsername:"Anonymous - SRET", type, text, yakId:yakId||null, read:false, createdAt:serverTimestamp()});
  };
  // ===== 3 IN 1 SHARE - ADDED - 12 LINES ONLY =====
  const handleSharePost = async (yy:any) => {
    const shareText = `${yy.text}\n\n- Shared from SRET ANON - Anonymous - SRET - SRET ONLY 👻\n#SRET #Anonymous - Text Only Real App`;
    const shareUrl = `${typeof window!=='undefined'? window.location.origin : ''}/?post=${yy.id}`;
    if (typeof navigator!== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share({ title: "SRET ANON - Text Only", text: shareText, url: shareUrl }); showToast("Shared - SRET ONLY 🔗"); return; } catch {}
    }
    try { await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`); showToast("Link copied 🔗 - Text Only"); } catch { showToast("Copy failed"); }
  };
  const handleWhatsAppShare = (yy:any) => {
    const text = encodeURIComponent(`${yy.text}\n\nFrom SRET ANON - Anonymous - SRET - SRET ONLY 👻 - Text Only Real App\n${typeof window!=='undefined'? window.location.origin : ''}/?post=${yy.id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };
  const handleCopyLink = async (yy:any) => {
    const url = `${typeof window!=='undefined'? window.location.origin : ''}/?post=${yy.id}`;
    try { await navigator.clipboard.writeText(url); showToast("Link copied 🔗 -?post=ID - Text Only"); } catch { showToast("Link: "+url); }
  };

  const handleVote=async(y:any,type:'up'|'down')=>{
    if(!userData) return; const yakRef=doc(db,'yaks',y.id); const userRef=doc(db,'users',userData.id); const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
    try{
      if(type==='up'){
        if(liked){ await updateDoc(yakRef,{likes:increment(-1)}); await updateDoc(userRef,{likedPosts:arrayRemove(y.id)}); setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)}); }
        else if(disliked){ await updateDoc(yakRef,{likes:increment(1), dislikes:increment(-1)}); await updateDoc(userRef,{dislikedPosts:arrayRemove(y.id), likedPosts:arrayUnion(y.id)}); setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id), likedPosts:[...(userData.likedPosts||[]), y.id]}); }
        else{ await updateDoc(yakRef,{likes:increment(1)}); await updateDoc(userRef,{likedPosts:arrayUnion(y.id)}); setUserData({...userData, likedPosts:[...(userData.likedPosts||[]), y.id]}); }
      }else{
        if(disliked){ await updateDoc(yakRef,{dislikes:increment(-1)}); await updateDoc(userRef,{dislikedPosts:arrayRemove(y.id)}); setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id)}); }
        else if(liked){ await updateDoc(yakRef,{likes:increment(-1), dislikes:increment(1)}); await updateDoc(userRef,{likedPosts:arrayRemove(y.id), dislikedPosts:arrayUnion(y.id)}); setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id), dislikedPosts:[...(userData.dislikedPosts||[]), y.id]}); }
        else{ await updateDoc(yakRef,{dislikes:increment(1)}); await updateDoc(userRef,{dislikedPosts:arrayUnion(y.id)}); setUserData({...userData, dislikedPosts:[...(userData.dislikedPosts||[]), y.id]}); }
      }
    }catch(e:any){ showToast(e.message); }
  };
  const handlePollVote=async(y:any, idx:number)=>{ if(!userData) return; if(userData.pollVoted?.includes(y.id)){ showToast("Already voted - SRET ONLY"); return; } try{ const n=[...y.pollOptions]; n[idx].votes=(n[idx].votes||0)+1; await updateDoc(doc(db,'yaks',y.id),{pollOptions:n, totalVotes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{pollVoted:arrayUnion(y.id)}); setUserData({...userData, pollVoted:[...(userData.pollVoted||[]), y.id]}); }catch(e:any){ showToast(e.message); } };
  const handlePost=async()=>{
    if(!newYak.trim()){ showToast("Type something - SRET ONLY - Text Only"); return; }
    if(yakType==='poll' && pollOptions.filter(o=>o.trim()).length<2){ showToast("Need 2 poll options - Text Only"); return; }
    if(yakType==='market' &&!marketPrice.trim()){ showToast("Enter price - Text Only"); return; }
    if(yakType==='pyq' &&!pyqSubject.trim()){ showToast("Enter subject - Text Only"); return; }
    if(!userData||!user||posting) return; setPosting(true);
    try{
      const payload:any={ text:newYak.trim(), uid:user.uid, username:"Anonymous - SRET", college:"SRET", type:yakType, likes:0, dislikes:0, commentsCount:0, reports:0, hidden:false, createdAt:serverTimestamp() };
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; }
      if(yakType==='market'){ payload.price=marketPrice; }
      if(yakType==='pyq'){ payload.subject=pyqSubject.toUpperCase(); }
      const hashtagsInText=newYak.match(/#\w+/g); if(hashtagsInText) payload.hashtags=hashtagsInText.map((h:string)=>h.toLowerCase());
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setPollOptions(['','']); setMarketPrice(''); setPyqSubject(''); setYakType('yak'); setScreen('feed'); showToast("Posted - SRET ONLY - Text Only + Share Ready 🔗");
    }catch(e:any){ showToast(e.message); }finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(user?.uid!==y.uid) return; if(!confirm("Delete this post? - SRET ONLY - Text Only")) return; try{ await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1)}); }catch(e:any){ showToast(e.message); } setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost) return; if(!editText.trim()) return; try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); }catch(e:any){ showToast(e.message); } setEditingPost(null); setEditText(''); setShowMenu(null); };
  const handleReport=async(y:any, reasonArg?:string)=>{ const finalReason=reasonArg||reportReason; if(!userData) return; if(userData.reportedPosts?.includes(y.id)){ showToast("Already reported - SRET ONLY"); setReportingPost(null); setShowMenu(null); return; } if(!finalReason){ showToast("Select reason - Text Only"); return; } try{ await addDoc(collection(db,'reports'),{yakId:y.id, yakText:y.text.slice(0,200), yakUid:y.uid, reportedBy:user.uid, reason:finalReason, status:"pending", createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{reports:increment(1)}); await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)}); setUserData({...userData, reportedPosts:[...(userData.reportedPosts||[]), y.id]}); showToast("Reported - SRET ONLY"); setReportingPost(null); setReportReason(''); setShowMenu(null); }catch(e:any){ showToast(e.message); } };
  const handleAdminRestore=async(report:any)=>{ try{ await updateDoc(doc(db,'yaks',report.yakId),{hidden:false, reports:0}); await updateDoc(doc(db,'reports',report.id),{status:"dismissed"}); }catch(e:any){ showToast(e.message); } };
  const handleAdminDelete=async(report:any)=>{ if(!confirm('Delete this post? - SRET ONLY - Text Only')) return; try{ await deleteDoc(doc(db,'yaks',report.yakId)); await updateDoc(doc(db,'reports',report.id),{status:"deleted"}); }catch(e:any){ showToast(e.message); } };
  const handleAdminDismiss=async(report:any)=>{ try{ await updateDoc(doc(db,'reports',report.id),{status:"dismissed"}); }catch(e:any){ showToast(e.message); } };
  const buildTree = (flat:any[]) => { const map:Record<string, any> = {}; const roots:any[] = []; flat.forEach(c => { map[c.id] = {...c, replies: []}; }); flat.forEach(c => { if(c.parentId && map[c.parentId]){ map[c.parentId].replies.push(map[c.id]); } else { roots.push(map[c.id]); } }); return roots; };
  const handleCommentPost = async (yId:string) => {
    if(!commentText.trim() ||!user) return;
    const payload:any = { text:commentText.trim(), uid: user.uid, username:"Anonymous - SRET", parentId: replyTo? replyTo.id : null, replyToUsername: replyTo? replyTo.username : null, createdAt: serverTimestamp() };
    setCommentText(''); const temp = replyTo; setReplyTo(null);
    try{ await addDoc(collection(db,'yaks/'+yId+'/comments'), payload); await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); }catch(e:any){ showToast(e.message); setCommentText(payload.text); setReplyTo(temp); }
  };
  const handleStartDm = async (otherUid:string, yakId?:string)=>{
    if(otherUid===user?.uid){ showToast("Can't DM yourself - SRET ONLY"); return; }
    if(blockedUsers.includes(otherUid)){ showToast("Blocked user - SRET ONLY"); return; }
    const existing=dmChats.find(c=> c.participants.includes(otherUid) && c.participants.length===2);
    if(existing){ setActiveDm(existing); setFeedTab('dm'); return; }
    try{
      const newChat=await addDoc(collection(db,'dms'),{ participants:[user.uid, otherUid], lastMessage:"Started private chat - SRET ONLY - Text Only + Share Safe 🔗", lastMessageAt:serverTimestamp(), createdAt:serverTimestamp(), isPrivate:true });
      setActiveDm({id:newChat.id, participants:[user.uid, otherUid], isPrivate:true});
      setFeedTab('dm');
    }catch(e:any){ showToast(e.message); }
  };
  const handleSendDm=async()=>{
    if(!dmText.trim()||!activeDm||!user) return;
    setDmText('');
    try{
      await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{ text:dmText.trim(), uid:user.uid, username:"Anonymous - SRET", createdAt:serverTimestamp(), private:true });
      await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:dmText.trim(), lastMessageAt:serverTimestamp()});
    }catch(e:any){ showToast(e.message); }
  };
  const markNotificationsRead=async()=>{ try{ const batch=notifications.filter((n:any)=>!n.read); for(const n of batch){ await updateDoc(doc(db,'notifications',n.id),{read:true}); } }catch{} };
  const handleBlockUser=async(targetUid:string)=>{ if(!userData || targetUid===user?.uid) return; if(!confirm("Block this user? - SRET ONLY - Text Only + Share Safe")) return; try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(targetUid)}); setBlockedUsers([...blockedUsers, targetUid]); setShowMenu(null); }catch(e:any){ showToast(e.message); } };
  const handleUnblockUser=async(targetUid:string)=>{ try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayRemove(targetUid)}); setBlockedUsers(blockedUsers.filter(id=>id!==targetUid)); }catch(e:any){ showToast(e.message); } };
  const handleCrushSubmit=async()=>{ const roll=crushRoll.trim().toUpperCase(); if(!roll) return; try{ await addDoc(collection(db,'crushes'),{fromUid:user.uid, toRoll:roll, matched:false, createdAt:serverTimestamp()}); setCrushRoll(''); showToast("Crush added - SRET ONLY - Text Only + Share Safe"); }catch(e:any){ showToast(e.message); } };
  const handleCancelCrush=async(crushId:string)=>{ if(!confirm("Cancel crush? - SRET ONLY")) return; try{ await deleteDoc(doc(db,'crushes',crushId)); }catch(e:any){ showToast(e.message); } };
  const handleBlockFromCrush=async(m:any)=>{ if(!confirm("Block crush? - SRET ONLY")) return; try{ await updateDoc(doc(db,'crushes',m.id),{blocked:true}); }catch(e:any){ showToast(e.message); } };
  const handleReportCrushAbuse=async(m:any)=>{ try{ await addDoc(collection(db,'reports'),{crushId:m.id, reason:"Crush Abuse", reportedBy:user.uid, status:"pending", createdAt:serverTimestamp()}); showToast("Reported - SRET ONLY"); }catch(e:any){ showToast(e.message); } };

  const renderComment = (c:any, depth=0) => {
    const isReply = depth > 0;
    return (<div key={c.id} className={`${isReply? 'ml-6 border-l-2 border-white/15 pl-3' : ''} mt-3`}><div className="flex gap-2.5"><div className={`bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white shrink-0 ${isReply? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'}`}>👻</div><div className="flex-1"><div className="bg-white/[0.05] border border-white/10 rounded-[14px] px-4 py-2.5"><div className="flex gap-2 items-center"><p className="text-[10px] font-bold text-white/40">Anonymous - SRET</p>{isReply && <span className="px-2 py-0.5 bg-white/10 rounded-full text-[7px] text-white/50 font-bold">REPLY - Text Only</span>}</div>{isReply && c.replyToUsername && <p className="text-[10px] text-white/30 mt-1">Reply to {c.replyToUsername} - Text Only</p>}<p className="text-[13px] text-white mt-1 leading-[1.4] whitespace-pre-wrap break-words">{c.text}</p></div><div className="flex gap-3 mt-1.5 ml-1 items-center"><button onClick={()=>setReplyTo(c)} className="text-[11px] font-bold text-white/30 hover:text-white">Reply - Text Only</button><button onClick={()=>handleStartDm(c.uid)} className="text-[11px] font-bold text-white/30 hover:text-white">Private DM 🔒 + Share Safe 🔗</button></div>{c.replies && c.replies.length > 0 && (<div className="mt-1">{c.replies.map((rep:any)=>renderComment(rep, depth+1))}</div>)}</div></div></div>);
  };
  const filteredYaks = (searchQuery? yaks.filter(y=> y.text.toLowerCase().includes(searchQuery.toLowerCase()) || y.hashtags?.some((h:string)=>h.includes(searchQuery.toLowerCase())) ) : yaks).filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);
  const displayHotYaks = hotYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);
  const displayMemeYaks = memeYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);
  const displayMarketYaks = marketYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);
  const displayPyqYaks = pyqYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    if(postId && yaks.length>0){ setActivePost(postId); showToast("Shared post opened 🔗 - Anonymous - SRET - Text Only"); }
  },[yaks]);

  return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-2xl">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">S</div><div><p className="font-bold text-[13px] leading-none text-white">Anonyfy - {yaks.length} • Anonymous - SRET • Share 3in1 🔗</p><p className="text-[10px] text-white/40">{totalUsers} verified • Text Only • Share Ready 🔗</p></div></div>
          <div className="flex gap-2 items-center">
            <button onClick={()=>{ setShowNotifications(true); markNotificationsRead(); }} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white relative">🔔{unreadCount>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white">{unreadCount}</span>}</button>
            <button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">👻</button>
          </div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-2">
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search #hashtag - Anonymous - SRET - Share Ready 🔗" className="flex-1 h-9 bg-white/5 border border-white/10 rounded-full px-4 text-xs outline-none text-white placeholder:text-white/30 focus:border-white" />
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2 overflow-x-auto">
          <button onClick={()=>setFeedTab('new')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='new'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>NEW {filteredYaks.length}</button>
          <button onClick={()=>setFeedTab('meme')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>MEME {displayMemeYaks.length}</button>
          <button onClick={()=>setFeedTab('hot')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='hot'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>HOT {displayHotYaks.length}</button>
          <button onClick={()=>setFeedTab('top')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='top'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>TOP</button>
          <button onClick={()=>setFeedTab('crush')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='crush'?'bg-pink-500 text-white border-pink-500':'bg-white/5 border-white/10 text-white/40'}`}>💘 {crushMatches.filter((c:any)=>c.matched &&!c.blocked).length}</button>
          <button onClick={()=>setFeedTab('market')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='market'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🛒 {displayMarketYaks.length}</button>
          <button onClick={()=>setFeedTab('pyq')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='pyq'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>📚 {displayPyqYaks.length}</button>
          <button onClick={()=>setFeedTab('dm')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='dm'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🔒 DM {dmChats.length}</button>
        </div>
      </div>

       <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        {feedTab==='crush' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-2 border-pink-500/20 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-pink-400">PREMIUM - CRUSH MATCHER 💘 • 1to1 PRIVATE DM 🔒 • Share Safe 🔗</p><h3 className="font-black mt-2 text-white">Secret Crush - 100% Anonymous - SRET - Share Safe 🔗</h3><p className="text-[11px] text-white/40 mt-1">Masked rolls • No total list • Only mutual reveals • Private DM after match 🔒 • Text Only + Share Ready 🔗</p><div className="flex gap-2 mt-4"><input value={crushRoll} onChange={e=>setCrushRoll(e.target.value.toUpperCase())} placeholder="Crush Roll 21CS*** masked" className="flex-1 bg-black/30 border-2 border-pink-500/20 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-pink-500"/><button onClick={handleCrushSubmit} className="px-6 h-11 bg-pink-500 text-white rounded-full font-bold text-xs">Add Secret 💜 + Share 🔗</button></div></div>
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4"><p className="text-[10px] font-bold text-white/30">YOUR SECRET CRUSHES - {crushMatches.filter((c:any)=>!c.matched &&!c.blocked).length} Pending • 🔒 PRIVATE • Share Safe 🔗</p>{crushMatches.filter((c:any)=>!c.matched &&!c.blocked).map((m:any)=><div key={m.id} className="mt-2 flex justify-between items-center bg-white/[0.02] p-3 rounded-xl"><p className="text-[13px] text-white/60">{m.toRoll||'Secret'} • 🤫 Secret - Share Safe 🔗</p><div className="flex gap-1.5"><button onClick={()=>handleCancelCrush(m.id)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40">Cancel</button></div></div>)}{crushMatches.filter((c:any)=>!c.matched &&!c.blocked).length===0 && <p className="text-[11px] text-white/20 mt-3 text-center py-6">No pending • Masked & private 👻 - Share Safe 🔗</p>}</div><Footer/>
          </div>
        )}
        {feedTab==='market' && (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET MARKETPLACE - ANONYMOUS 🛒 • Private DM 🔒 • Share 3in1 🔗 • Text Only</p><p className="font-black mt-1 text-white">Buy/Sell - Private Chat Only You 2 + Share 3in1 🔗 - Text Only</p><button onClick={()=>{setYakType('market'); setScreen('create');}} className="mt-3 bg-white text-black px-5 h-9 rounded-full text-xs font-bold">Sell Item + Share 🔗 - Text Only</button></div>
            {displayMarketYaks.map((y:any)=><div key={y.id} className="bg-white/[0.04] border-2 border-white/10 rounded-[20px] p-5"><div className="flex justify-between"><p className="font-bold text-[13px] text-white">Anonymous - SRET - 🛒 MARKET - Share 3in1 🔗 - Text Only</p><span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[11px] font-bold text-green-400">₹{y.price}</span></div><p className="text-[14px] text-white mt-3">{y.text}</p>{y.hidden && <div className="mt-3 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-xl p-3"><span className="text-yellow-400 text-[10px] font-bold">⏳ Hidden - Under review - Text Only + Share Safe 🔗</span></div>}
              <div className="flex gap-2 mt-4">
                <button onClick={()=>handleStartDm(y.uid, y.id)} className="flex-1 h-10 bg-white text-black rounded-full font-bold text-xs">Private DM to Buy 🔒 - Text Only</button>
                <button onClick={()=>handleSharePost(y)} className="px-4 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full font-bold text-xs">↗ Share 🔗</button>
                <button onClick={()=>handleWhatsAppShare(y)} className="px-4 h-10 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full font-bold text-xs">💬 WA</button>
              </div>
            </div>)}
            {displayMarketYaks.length===0 && <div className="py-16 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><p className="text-3xl">🛒</p><p className="font-black mt-3 text-white">No items yet - Share Ready 🔗 - Text Only</p></div>}<Footer/>
          </div>
        )}
        {feedTab==='pyq' && (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET PYQ VAULT - PREMIUM 📚 • Private DM 🔒 • Share 3in1 🔗 • Text Only</p><p className="font-black mt-1 text-white">PYQ - Private Chat Only You 2 + Share 3in1 🔗 - Text Only</p><button onClick={()=>{setYakType('pyq'); setScreen('create');}} className="mt-3 bg-white text-black px-5 h-9 rounded-full text-xs font-bold">Upload PYQ + Share 🔗 - Text Only</button></div>
            {displayPyqYaks.map((y:any)=><div key={y.id} className="bg-white/[0.04] border-2 border-white/10 rounded-[20px] p-5"><div className="flex gap-2 items-center"><span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-[10px] font-bold text-blue-400">{y.subject||'PYQ'} - Share 🔗</span><span className="text-[10px] text-white/30">{y.hashtags?.join(' ')}</span></div><p className="text-[14px] text-white mt-3">{y.text}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={()=>handleVote(y,'up')} className="px-4 h-8 bg-white/5 border border-white/10 rounded-full text-xs text-white/40">Up {y.likes||0} - Text Only</button>
                <button onClick={()=>handleStartDm(y.uid)} className="px-4 h-8 bg-white text-black rounded-full text-xs font-bold">Private DM 🔒 PDF + Share Safe 🔗</button>
                <button onClick={()=>handleSharePost(y)} className="px-4 h-8 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold">↗ Share 🔗 - Text Only</button>
                <button onClick={()=>handleCopyLink(y)} className="px-3 h-8 bg-white/5 border border-white/10 rounded-full text-xs text-white/40">🔗 Link - Text Only</button>
              </div>
            </div>)}
            {displayPyqYaks.length===0 && <div className="py-16 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><p className="text-3xl">📚</p><p className="font-black mt-3 text-white">No PYQs yet - Share Ready 🔗 - Text Only</p></div>}<Footer/>
          </div>
        )}
        {feedTab==='dm'? (
          <div className="space-y-3">
            {!activeDm? (
              <><div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">1to1 PRIVATE DM - SRET ONLY 🔒 • Share Safe 🔗 • Text Only</p><p className="font-black mt-1 text-white">Private Chats - {dmChats.length} • No One Sees Other Chat • Share Safe 🔗</p><p className="text-[11px] text-white/40 mt-1">1to1 only - 2 participants - 100% private - No group - SRET ONLY • Text Only + Share Ready 🔗</p></div>
              {dmChats.map((chat:any)=><button key={chat.id} onClick={()=>setActiveDm(chat)} className="w-full bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center text-left"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">🔒</div><div><p className="font-bold text-[13px] text-white">🔒 Private Chat - Only You 2 - Share Safe 🔗</p><p className="text-[11px] text-white/40 truncate max-w-[200px]">{chat.lastMessage}</p></div></div><span className="px-2 py-1 bg-green-500/20 rounded-full text-[8px] font-bold text-green-400">1to1 PRIVATE + Share Safe 🔗</span></button>)}
              {dmChats.length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><p className="font-black text-[18px] text-white">No Private DMs yet 🔒 - Share Safe 🔗</p><p className="text-[11px] text-white/30 mt-1">Start private DM from any post - No one can see other's chat - Text Only + Share Safe 🔗</p></div>}<Footer/></>
            ) : (
              <div className="bg-white/[0.03] border-2 border-white/10 rounded-[24px] flex flex-col h-[70vh]">
                <div className="p-4 border-b-2 border-white/10 flex justify-between items-center"><div className="flex gap-3 items-center"><button onClick={()=>setActiveDm(null)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">←</button><div><p className="font-bold text-[13px] text-white">🔒 1to1 Private Chat + Share Safe 🔗 - Text Only</p><p className="text-[9px] text-green-400">Only you 2 can see - No one else - Text Only + Share Safe 🔗</p></div></div><span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[8px] font-bold text-green-400">PRIVATE + Share Safe 🔗 - Text Only</span></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">{dmMessages.map((m:any)=><div key={m.id} className={`flex ${m.uid===user?.uid?'justify-end':'justify-start'}`}><div className={`max-w-[70%] rounded-[16px] px-4 py-2.5 ${m.uid===user?.uid?'bg-white text-black':'bg-white/10 border border-white/10 text-white'}`}><p className="text-[13px] leading-[1.4]">{m.text}</p><p className="text-[8px] opacity-50 mt-1">{m.uid===user?.uid?'You':'Anonymous - SRET'} • Private 🔒 • Text Only + Share Safe 🔗</p></div></div>)}</div>
                <div className="p-3 border-t-2 border-white/10 flex gap-2"><input value={dmText} onChange={e=>setDmText(e.target.value)} placeholder="Private message - Only you 2 can see 🔒 + Share Safe 🔗 + Text Only" className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white" onKeyDown={e=>{ if(e.key==='Enter') handleSendDm(); }}/><button onClick={handleSendDm} disabled={!dmText.trim()} className={`w-11 h-11 rounded-full font-bold ${!dmText.trim()?'bg-white/5 text-white/20':'bg-white text-black'}`}>Go - Text Only</button></div>
              </div>
            )}
          </div>
        ) : feedTab==='top'? (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET TOP ANONYMOUS - VERIFIED • Private DM 🔒 • Share 3in1 🔗 • Text Only</p><p className="font-black mt-1 text-white">Top Anonymous - SRET - Anonymous - SRET + Share 3in1 🔗 - Text Only</p></div>
            {leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">{i+1}</span><span className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">👻</span><div><p className="font-bold text-[13px] text-white">Anonymous - SRET {i===0?'👑':''} - Share 3in1 🔗 - Text Only</p><p className="text-[10px] text-white/40">{u.totalPosts||0} posts • Anonymous - SRET • Text Only + Share Ready 🔗</p></div></div><p className="font-black text-sm text-white">{u.yakarma}</p></div>)}<Footer/></div>
        ) :!['crush','market','pyq','dm','top'].includes(feedTab) && (
          <>
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">👻</div><div><p className="font-bold text-[13px] text-white">Anonymous + Premium - 1to1 Private 🔒 • Share 3in1 🔗 • Text Only</p><p className="text-[11px] text-white/40">Anonymous - SRET • No One Sees Other Chat • Text Only • Share Ready 🔗</p></div></div><span className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] font-bold text-green-400">🔒 + 🔗 Share 3in1 - Text Only</span></div>

             {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : displayHotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const hasVoted=userData.pollVoted?.includes(y.id); const nestedTree = activePost===y.id? buildTree(comments) : [];
              return(
                <div key={y.id} className={`bg-white/[0.04] border-2 rounded-[20px] p-5 ${isOwn?'border-white/20 bg-white/[0.06]':'border-white/10'}`}>
                  <div className="flex justify-between items-start"><div className="flex gap-3"><div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm relative text-white">👻</div><div><div className="flex gap-2 items-center flex-wrap"><p className="font-bold text-[13px] text-white">Anonymous - SRET {isOwn? '- YOU' : ''}</p><span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-white text-black">SRET {y.type?.toUpperCase()} - Text Only + Share 🔗</span></div><p className="text-[10px] text-white/30 mt-0.5">Anonymous - {score} • {y.hashtags?.join(' ')||''} {y.price? `• ₹${y.price}`:''} {y.subject? `• ${y.subject}`:''} • Share 3in1 🔗 • Text Only</p></div></div><div className="relative flex gap-2"><button onClick={()=>handleStartDm(y.uid, y.id)} className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-[12px]">🔒</button><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40">...</button>{showMenu===y.id && <div className="absolute right-0 top-10 w-[240px] bg-black border-2 border-white/10 rounded-2xl p-2 z-20 shadow-2xl"><p className="text-[9px] font-bold tracking-widest text-white/30 px-3 py-2">SHARE 3 IN 1 - NEE CODE + SHARE 3IN1 - TEXT ONLY</p><button onClick={()=>{ handleSharePost(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">↗ Native Share - Text Only + SRET ONLY</button><button onClick={()=>{ handleWhatsAppShare(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 mt-2">💬 WhatsApp Share - Text Only + SRET ONLY</button><button onClick={()=>{ handleCopyLink(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60 mt-2">🔗 Copy Link -?post=ID - Text Only - Deep</button><div className="h-[1px] bg-white/10 my-2"></div>{isOwn? (<><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 text-white">Edit - Text Only + Share 🔗</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 mt-2">Delete - Text Only + Share 🔗</button></>) : (<><button onClick={()=>handleStartDm(y.uid, y.id)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400">🔒 Private DM - Only You 2 + Share Safe 🔗</button><button onClick={()=>{ setReportingPost(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60 mt-2">Report {y.reports||0}/5 → Review - Text Only</button><button onClick={()=>handleBlockUser(y.uid)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 mt-2">🚫 Block User - Text Only + Share Safe 🔗</button></>)}<button onClick={()=>setShowMenu(null)} className="w-full mt-2 py-2 rounded-xl text-[11px] text-white/30">Cancel - Text Only</button></div>}</div></div>
                  <p className="text-[15px] mt-4 leading-[1.5] text-white whitespace-pre-wrap break-words">{y.text}</p>
                  {y.hidden && <div className="mt-3 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-xl p-3"><span className="text-yellow-400 text-[10px] font-bold">⏳ TEMPORARILY HIDDEN - {y.reports}/5 - Admin review - Only you see - Text Only + Share Safe 🔗</span></div>}
                  {isPoll && y.pollOptions && (<div className="mt-4 bg-white/[0.03] border-2 border-white/10 rounded-[16px] p-4"><div className="flex justify-between items-center mb-3"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">📊 POLL ANALYTICS - PRIVATE VOTE • Share Ready 🔗 • Text Only</p><span className="px-2 py-1 bg-white text-black rounded-full text-[9px] font-bold">{y.totalVotes||0} VOTES • 24H • Share 🔗 • Text Only</span></div><div className="space-y-2.5">{[...y.pollOptions].sort((a:any,b:any)=> (b.votes||0)-(a.votes||0)).map((opt:any,idx:number)=>{ const total=y.totalVotes||1; const percent=Math.round((opt.votes/total)*100)||0; const isWinner = idx===0 && hasVoted; const rank = idx+1; return (<button key={idx} onClick={()=>handlePollVote(y,y.pollOptions.indexOf(opt))} disabled={!!hasVoted} className={`w-full relative overflow-hidden rounded-xl border-2 text-left p-0 ${hasVoted?'border-white/10':'border-white/10 hover:border-white/20'} ${isWinner?'bg-yellow-500/10 border-yellow-500/30':''}`}><div className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all" style={{width:`${hasVoted? percent: 0}%`}}></div><div className="relative flex justify-between items-center p-3"><div className="flex gap-2 items-center"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${rank===1?'bg-yellow-500 text-black': rank===2?'bg-white/20 text-white':'bg-white/5 text-white/40'}`}>#{rank}</span><span className="text-[13px] font-bold">{opt.text} {isWinner?'👑':''} - Text Only + Share 🔗</span></div><div className="text-right"><p className="text-[12px] font-black">{hasVoted? `${percent}%` : `${opt.votes||0} votes`}</p><p className="text-[9px] text-white/40">{hasVoted? `${opt.votes} votes` : 'Vote - Text Only'}</p></div></div></button> )})}</div></div>)}
                  <div className="flex gap-2.5 mt-5 items-center flex-wrap"><div className="flex bg-white/5 border border-white/10 rounded-full p-1"><button onClick={()=>handleVote(y,'up')} className={`px-4 py-2 rounded-full text-xs font-bold ${liked?'bg-white text-black':'text-white/40'}`}>Up {y.likes||0}</button><span className="px-3 py-2 text-[11px] font-black min-w-[36px] text-center text-white/20">{score}</span><button onClick={()=>handleVote(y,'down')} className={`px-4 py-2 rounded-full text-xs font-bold ${disliked?'bg-red-500 text-white':'text-white/30'}`}>Down {y.dislikes||0}</button></div><button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); setReplyTo(null); }} className="px-4 h-9 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">Comments {y.commentsCount||0} - Text Only</button><button onClick={()=>handleSharePost(y)} className="px-4 h-9 rounded-full text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold">↗ Share 🔗 - Text Only</button><button onClick={()=>handleStartDm(y.uid, y.id)} className="px-3 h-9 rounded-full text-xs bg-green-500/10 border border-green-500/20 text-green-400 font-bold">🔒 DM + Share Safe 🔗</button></div>
                  {activePost===y.id && (<div className="mt-5 border-t-2 border-white/10 pt-4 space-y-1"><p className="text-[10px] font-bold tracking-widest text-white/30 mb-3">NESTED REPLIES - {comments.length} - Private 🔒 + Share Ready 🔗 + Text Only</p>{replyTo && (<div className="bg-white/10 border-2 border-white/20 rounded-xl px-4 py-2.5 flex justify-between items-center mb-3"><p className="text-[11px] text-white">Replying to {replyTo.username}: {replyTo.text.slice(0,30)} - Text Only + Share Ready 🔗</p><button onClick={()=>setReplyTo(null)} className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white text-xs">X</button></div>)}<div className="max-h-[420px] overflow-y-auto pr-1">{nestedTree.length===0 && <p className="text-xs text-white/20 text-center py-8">No comments yet - Be first - Text Only + Share Ready 🔗</p>}{nestedTree.map((c:any)=>renderComment(c,0))}</div><div className="flex gap-2.5 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={replyTo? `Reply to ${replyTo.username} anonymously - Text Only` : "Anonymous comment - Private 🔒 + Share Ready 🔗 + Text Only"} className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white" onKeyDown={e=>{ if(e.key==='Enter'){ handleCommentPost(y.id); } }}/><button onClick={()=>handleCommentPost(y.id)} disabled={!commentText.trim()} className={`w-11 h-11 rounded-full font-bold flex items-center justify-center ${!commentText.trim()?'bg-white/5 text-white/20 border border-white/5':'bg-white text-black'}`}>Go - Text Only</button></div></div>)}</div>
              );
            })}
            {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : displayHotYaks).length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] mx-auto flex items-center justify-center text-4xl">S</div><p className="font-black mt-6 text-[18px] text-white">No posts yet - SRET ONLY - Text Only + Share Ready 🔗</p><p className="text-[11px] text-white/30 mt-1">Use #hashtag - Try #SRET #Exams - Text Only + Share Ready 🔗</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full text-[13px] font-bold">Create First Post - Anonymous - SRET + Share 3in1 🔗 - Text Only</button></div>}
            <Footer/>
          </>
        )}
      </div>

       <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-2xl border-t-2 border-white/10"><div className="max-w-[600px] mx-auto px-6 h-[72px] flex items-center justify-between"><button onClick={()=>{ setFeedTab('new'); setActiveDm(null); }} className="flex flex-col items-center gap-1.5"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/30 border border-white/10'}`}>S</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {yaks.length} SHARE 🔗</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[24px] font-black">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1.5"><div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs text-white relative">👻{unreadCount>0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {userData?.yakarma||0} SHARE 🔗</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col overflow-hidden">
          {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100]">{toast}</div>}
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full bg-[#0a0a0b]">
            <div className="p-5 flex items-center justify-between border-b-2 border-white/10"><button onClick={()=>{ if(!posting) { setScreen('feed'); } }} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">X</button><div className="text-center"><p className="text-[11px] font-bold tracking-widest text-white">SRET ONLY - PRIVATE DM 🔒 + Share 3in1 🔗 • Text Only</p><p className="text-[10px] text-white/30">1to1 Private • No One Sees Other Chat • Text Only + Share Ready 🔗</p></div><button onClick={handlePost} disabled={posting||!newYak.trim()} className={`px-6 h-10 rounded-full font-bold text-[13px] ${posting||!newYak.trim()?'bg-white/5 text-white/20 border-2 border-white/5':'bg-white text-black'}`}>{posting?'Posting...':'Post + Share 🔗'}</button></div>
            <div className="p-3 flex gap-2 border-b-2 border-white/5 overflow-x-auto bg-white/[0.02]">
              <button onClick={()=>setYakType('yak')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='yak'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Talk #tag + Share 🔗</button>
              <button onClick={()=>setYakType('poll')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='poll'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Poll 📊 + Share 🔗</button>
              <button onClick={()=>setYakType('confession')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='confession'?'bg-purple-500 text-white border-purple-500':'bg-white/5 border-white/10 text-white/40'}`}>Confession + Share 🔗</button>
              <button onClick={()=>setYakType('meme')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Meme + Share 🔗</button>
              <button onClick={()=>setYakType('market')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='market'?'bg-green-500 text-white border-green-500':'bg-white/5 border-white/10 text-white/40'}`}>🛒 Sell + Share 🔗</button>
              <button onClick={()=>setYakType('pyq')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='pyq'?'bg-blue-500 text-white border-blue-500':'bg-white/5 border-white/10 text-white/40'}`}>📚 PYQ + Share 🔗</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto bg-[#0a0a0b]">
              <div className="flex gap-3 mb-6"><div className="w-11 h-11 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center text-white">👻</div><div><p className="font-bold text-[14px] text-white">Anonymous - SRET - Share 3in1 🔗 - Text Only</p><p className="text-[11px] text-white/40">Anonymous - SRET • No Hearts • Text Only • Share Ready 🔗💬</p></div></div>
              {yakType==='market' && <div className="flex gap-2 mb-4"><input value={marketPrice} onChange={e=>setMarketPrice(e.target.value)} placeholder="Price e.g. 250 - Text Only" className="w-[120px] p-4 bg-white/[0.03] border-2 border-green-500/20 rounded-xl text-sm outline-none text-white placeholder:text-white/30"/><p className="text-[10px] text-green-400 flex items-center">₹ Price - Text Only + Share Ready 🔗</p></div>}
              {yakType==='pyq' && <div className="flex gap-2 mb-4"><input value={pyqSubject} onChange={e=>setPyqSubject(e.target.value.toUpperCase())} placeholder="Subject: e.g. M1, DBMS - Text Only" className="flex-1 p-4 bg-white/[0.03] border-2 border-blue-500/20 rounded-xl text-sm outline-none text-white placeholder:text-white/30 uppercase"/><p className="text-[10px] text-blue-400 flex items-center">SUBJECT - Text Only + Share Ready 🔗</p></div>}
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`Talk about SRET... Use #hashtag like #SRET #Exams #Placements\n\nShare Ready - WhatsApp + Copy Link + Native Share 🔗💬 - Text Only Real App\n\nExample: Exams ela #SRET #Exams - Anonymous - SRET - Text Only - Share 🔗`} autoFocus className="w-full bg-transparent text-[19px] leading-[1.45] outline-none placeholder:text-white/20 resize-none min-h-[140px] text-white" maxLength={300}/>
              <p className="text-[10px] text-white/30 mt-2">{newYak.length}/300 - Anonymous - SRET - Text Only + Share 3in1 Ready 🔗</p>
              {yakType==='poll' && (<div className="mt-6 space-y-3"><p className="text-[10px] text-white/30 font-bold">POLL OPTIONS - 24H - Private votes - Text Only + Share Ready 🔗</p>{pollOptions.map((opt,idx)=><div key={idx} className="flex gap-2"><input value={opt} onChange={e=>{ const n=[...pollOptions]; n[idx]=e.target.value; setPollOptions(n); }} placeholder={`Option ${idx+1} - Text Only + Share Ready 🔗`} className="flex-1 p-4 bg-white/[0.03] border-2 border-white/10 rounded-xl text-sm outline-none focus:border-white text-white placeholder:text-white/30"/>{pollOptions.length>2 && <button onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))} className="w-12 h-12 bg-white/5 border-2 border-white/10 rounded-xl flex items-center justify-center text-white/40">X</button>}</div>)}{pollOptions.length<4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="w-full p-3 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-xl text-xs font-bold text-white/40">Add Option - Text Only + Share Ready 🔗</button>}</div>)}
              <div className="mt-6 bg-white/[0.03] border-2 border-white/10 rounded-[16px] p-4"><p className="text-[11px] font-bold text-white/40">TEXT ONLY REAL APP - Share 3in1 🔗 • Anonymous - SRET</p><p className="text-[10px] text-white/30 mt-1">No image upload - Text only 300 chars - Anonymous username - Anonymous Posts — share thoughts without revealing identity - Share 3in1: Native ↗ + WhatsApp 💬 + Copy Link 🔗 +?post=ID deep link</p></div>
            </div>
            <div className="p-5 border-t-2 border-white/5 bg-white/[0.02]"><div className="bg-green-500/5 border-2 border-green-500/10 rounded-xl p-4 flex gap-3 items-center"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] text-white/50"><span className="font-bold text-green-400">Anonymous - SRET + SHARE 3 IN 1 - TEXT ONLY:</span> No real name - Only Anonymous - SRET - Share safe - No image tag - Build pass - Deep link?post=ID</p></div><Footer/></div>
          </div>
        </div>
      )}

      {editingPost && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center p-4"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8 shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><h3 className="font-black text-[16px] text-white">Edit Post - SRET ONLY - Text Only + Share Ready 🔗</h3><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-5 bg-white/[0.05] border-2 border-white/10 rounded-xl p-4 text-[15px] outline-none min-h-[120px] resize-none text-white focus:border-white"/><div className="flex gap-3 mt-6"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs text-white">Cancel - Text Only</button><button onClick={handleEdit} disabled={!editText.trim()} className={`flex-1 h-12 rounded-full font-bold text-xs ${!editText.trim()?'bg-white/5 text-white/20 border-2 border-white/5':'bg-white text-black'}`}>Save - Text Only + Share 🔗</button></div></div></div>}

      {showNotifications && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><div className="flex justify-between items-center"><h3 className="font-black text-[16px] text-white">Notifications 🔔 {unreadCount>0? `(${unreadCount} new)` : ''} • Private • Share Safe 🔗 • Text Only</h3><button onClick={()=>setShowNotifications(false)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">X</button></div><div className="mt-6 space-y-3">{notifications.map((n:any)=><div key={n.id} className={`p-4 rounded-[16px] border-2 ${!n.read?'bg-white/10 border-white/20':'bg-white/[0.03] border-white/10'}`}><p className="text-[10px] font-bold text-white/40">{n.type.toUpperCase()} • 🔒 Private • Share Safe 🔗 • Text Only</p><p className="text-[13px] text-white mt-1">{n.text}</p><p className="text-[10px] text-white/20 mt-2">{n.createdAt?.toDate?.().toLocaleString?.()||'Just now'}</p></div>)}{notifications.length===0 && <div className="py-16 text-center"><p className="font-bold text-white/40">No notifications yet - Text Only + Share Safe 🔗</p></div>}<button onClick={()=>setShowNotifications(false)} className="w-full mt-6 bg-white text-black h-12 rounded-full font-bold text-xs">Close - Text Only + Share Safe 🔗</button></div></div></div>}

      {reportingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[60] flex items-end justify-center p-4">
          <div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div>
            <h3 className="font-black text-[16px] text-white">Report Post - SRET ONLY - Text Only + Share Safe 🔗</h3>
            <p className="text-[11px] text-white/40 mt-1">{reportingPost.text.slice(0,60)}... - Text Only + Share Safe 🔗</p>
            <p className="text-[10px] font-bold tracking-widest text-white/30 mt-5">SELECT REASON - Text Only</p>
            <div className="grid grid-cols-1 gap-2 mt-3">
              {REPORT_REASONS.map((r:any)=><button key={r} onClick={()=>setReportReason(r)} className={`p-3.5 rounded-xl text-left text-[12px] font-bold border-2 ${reportReason===r?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/60'}`}>{r} {reportReason===r?'✓':''}</button>)}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>{ setReportingPost(null); setReportReason(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs text-white">Cancel - Text Only</button>
              <button onClick={()=>handleReport(reportingPost)} disabled={!reportReason} className={`flex-1 h-12 rounded-full font-bold text-xs ${!reportReason?'bg-white/5 text-white/20 border-2 border-white/5':'bg-red-500 text-white'}`}>Submit Report - SRET ONLY - Text Only</button>
            </div>
          </div>
        </div>
      )}

      {showAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex flex-col">
          <div className="max-w-[600px] mx-auto w-full flex-1 flex flex-col bg-[#0a0a0b] p-4 overflow-y-auto">
            <div className="flex justify-between items-center"><h2 className="font-black text-white">ADMIN REVIEW - {adminReports.length} Pending - Share Safe 🔗 - Text Only</h2><button onClick={()=>setShowAdmin(false)} className="w-8 h-8 bg-white/10 rounded-full text-white">X</button></div>
            <div className="mt-6 space-y-4">
              {adminReports.map((rep:any)=><div key={rep.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4">
                <div className="flex justify-between"><span className="px-2 py-1 bg-yellow-500/20 rounded-full text-[10px] font-bold text-yellow-400">{rep.reason}</span><span className="text-[10px] text-white/30">{rep.createdAt?.toDate?.().toLocaleString?.()||''}</span></div>
                <p className="text-[13px] text-white mt-3">{rep.yakText} - Text Only</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={()=>handleAdminRestore(rep)} className="flex-1 h-10 bg-white text-black rounded-full text-[11px] font-bold">Restore ✅ + Share Safe 🔗</button>
                  <button onClick={()=>handleAdminDismiss(rep)} className="flex-1 h-10 bg-white/10 border border-white/10 rounded-full text-[11px] font-bold text-white">Dismiss - Text Only</button>
                  <button onClick={()=>handleAdminDelete(rep)} className="flex-1 h-10 bg-red-500 text-white rounded-full text-[11px] font-bold">Delete 🗑️ - Text Only</button>
                </div>
              </div>)}
              {adminReports.length===0 && <p className="text-center text-white/20 py-20">No pending reports - All clean - Text Only + Share Ready 🔗</p>}
            </div>
          </div>
        </div>
      )}

       {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
          <div className="bg-[#141416] border-2 border-white/10 w-full max-w-[360px] rounded-[24px] p-6 shadow-2xl">
            <div className="w-14 h-14 bg-white/5 border-2 border-white/10 rounded-full mx-auto flex items-center justify-center text-2xl">👋</div>
            <h3 className="font-black text-[18px] text-white text-center mt-4">Logout? Anonymous - SRET - Share Safe 🔗 - Text Only</h3>
            <p className="text-[11px] text-white/40 text-center mt-2 leading-[1.5]">Anonymous - SRET - Posts & Share links safe - Share 3in1 Safe 🔗 - Text Only</p>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 h-12 bg-white text-black rounded-full font-bold text-xs">Cancel - Text Only</button>
              <button onClick={()=>{ auth.signOut(); localStorage.clear(); window.location.reload(); }} className="flex-1 h-12 bg-red-500 text-white rounded-full font-bold text-xs">Yes, Logout - SRET ONLY + Share Safe 🔗</button>
            </div>
            <p className="text-[9px] text-white/20 text-center mt-4">Your data stays safe - Only logout - Private chats remain - Share 3in1 Safe 🔗 - Text Only</p>
          </div>
        </div>
      )}

      {showProfile && (<div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><div className="flex gap-4"><div className="w-[72px] h-[72px] bg-white/5 border-2 border-white/10 rounded-[20px] flex items-center justify-center text-3xl text-white">👻</div><div className="flex-1"><h2 className="font-black text-[16px] leading-none text-white">SRET ONLY - Anonymous - SRET - Share 3in1 🔗 - Text Only - Real App</h2><p className="text-[11px] text-white/40 mt-2 leading-[1.4]">Anonymous username • Anonymous Posts — share thoughts without revealing identity • Share 3in1 • {totalUsers} verified • {dmChats.length} private chats • Text Only Real App Feel + Share Ready 🔗</p><div className="flex gap-2 mt-4 flex-wrap"><span className="px-3 py-1.5 bg-white text-black rounded-full text-[10px] font-bold">{userData.yakarma} karma</span><span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[9px] font-bold">🔒 {dmChats.length} PRIVATE + Share Safe 🔗</span><span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[9px] font-bold">🔗 Share 3in1 - Text Only</span><span className="px-3 py-1.5 bg-pink-500 text-white rounded-full text-[9px] font-bold">💘 {crushMatches.filter((c:any)=>c.matched &&!c.blocked).length} MATCHES + Share Safe 🔗</span></div></div></div>
      <div className="grid grid-cols-4 gap-3 mt-6"><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">POSTS - TEXT ONLY + SHARE 🔗</p></div><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{totalUsers}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">VERIFIED + SHARE 🔗</p></div><div className="bg-green-500/10 border-2 border-green-500/20 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-green-400">{dmChats.length}</p><p className="text-[9px] font-bold tracking-widest text-green-400/60 mt-1">PRIVATE DM + SHARE 🔗</p></div><div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-blue-400">🔗</p><p className="text-[9px] font-bold tracking-widest text-blue-400/60 mt-1">SHARE 3IN1 - TEXT ONLY</p></div></div>
      <div className="mt-6 bg-white/[0.03] border-2 border-white/10 rounded-[16px] p-4"><p className="text-[11px] font-bold text-white/60">Anonymous - SRET + Share 3 in 1 - Text Only Real App - SRET ONLY</p><p className="text-[11px] text-white/40 mt-2 leading-[1.6]">✅ Anonymous username - Anonymous Posts — share thoughts without revealing identity - Nee code same - Anonymous - SRET - Text Only<br/>✅ Text Only - No image upload - No image tag - Clean & Fast - Build Pass - 300 chars - Share 3in1 Ready 🔗<br/>✅ 1to1 Private DM - No one sees other chat - Share Safe 🔗 - Text Only<br/>✅ Share 3in1 - Native ↗ + WhatsApp 💬 + Copy Link 🔗 +?post=ID deep link - Anonymous safe<br/>✅ Poll • Market • PYQ • Crush - All Text Only + Share Ready 🔗<br/>✅ SRET ONLY - Verified Students Only - Share Safe 🔗<br/>✅ Build Pass - No image tag - Text Only Real App Feel + Share 3in1 🔗</p></div>
      <button onClick={()=>setShowAdmin(true)} className="w-full mt-4 bg-yellow-500/10 border-2 border-yellow-500/20 h-12 rounded-full text-xs font-bold text-yellow-400">Admin Review Panel - {adminReports.length} Pending {adminReports.length>0?'🔴':''} + Share Safe 🔗 + Text Only</button>
      {blockedUsers.length>0 && (
        <div className="mt-6 bg-red-500/5 border-2 border-red-500/10 rounded-[16px] p-4">
          <p className="text-[11px] font-bold text-red-400">🚫 BLOCKED USERS - {blockedUsers.length} - Share Safe 🔗 - Text Only</p>
          <div className="mt-3 space-y-2">
            {blockedUsers.map((uid:string)=><div key={uid} className="flex justify-between items-center bg-white/[0.03] p-3 rounded-xl">
              <p className="text-[11px] text-white/60 font-mono">{uid.slice(0,8)}... (Anonymous - SRET)</p>
              <button onClick={()=>handleUnblockUser(uid)} className="px-3 py-1 bg-white text-black rounded-full text-[10px] font-bold">Unblock - Text Only + Share Safe 🔗</button>
            </div>)}
          </div>
        </div>
      )}
      <div className="mt-6 bg-red-500/5 border-2 border-red-500/10 rounded-[16px] p-4">
        <p className="text-[11px] font-bold text-red-400">🗑️ DANGER ZONE - DELETE DATA - Share Safe 🔗 - Text Only</p>
        <div className="mt-4 space-y-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
            <p className="text-[11px] font-bold text-white">Delete Only Posts - Anonymous - SRET - Text Only</p>
            <button onClick={async()=>{ if(!confirm("Delete your posts? - SRET ONLY - Text Only + Share Safe")) return; const uid=user.uid; const yaksSnap = await getDocs(query(collection(db,'yaks'),where('uid','==',uid))); for(const d of yaksSnap.docs){ await deleteDoc(doc(db,'yaks',d.id)); } await updateDoc(doc(db,'users',userData.id),{totalPosts:0, yakarma:100}); showToast("Posts deleted - SRET ONLY - Text Only + Share Safe 🔗"); }} className="w-full mt-3 h-10 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/60">Delete My Posts Only - Text Only + Share Safe 🔗</button>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
            <p className="text-[11px] font-bold text-red-400">Delete Account + All Data Permanently - Share Links Invalid - Text Only</p>
            <button onClick={async()=>{
              const confirm1 = confirm("DELETE ACCOUNT? - SRET ONLY - Text Only Real App + Share Safe 🔗\n\nDeletes all posts and data - Share links invalid\nCannot be undone - Anonymous - SRET - Text Only");
              if(!confirm1) return;
              const confirm2 = prompt(`Type "DELETE" to confirm - SRET ONLY - Text Only`);
              if(confirm2!=='DELETE'){ showToast("Cancelled - Text Only"); return; }
              try{
                const uid=user.uid; const userDocId=userData.id;
                const yaksSnap = await getDocs(query(collection(db,'yaks'),where('uid','==',uid))); for(const d of yaksSnap.docs){ await deleteDoc(doc(db,'yaks',d.id)); }
                await deleteDoc(doc(db,'users',userDocId));
                await auth.currentUser?.delete(); localStorage.clear(); window.location.reload();
              }catch(e:any){ showToast(e.message); }
            }} className="w-full mt-3 h-10 bg-red-500 text-white rounded-full text-[11px] font-bold">🗑️ Delete Account + All Data Forever - Text Only + Share Safe 🔗</button>
          </div>
        </div>
      </div>
      <button onClick={()=>setShowLogoutConfirm(true)} className="w-full mt-6 bg-white/5 border-2 border-white/10 h-12 rounded-full text-xs font-bold text-white/60">Logout - Text Only + Share Safe 🔗</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-12 rounded-full font-bold text-xs">Close - Anonymous - SRET + Share 3in1 Done 🔗👻 - Text Only</button><div className="mt-4"><Footer/></div></div></div>)}
    </div>
  );
}
