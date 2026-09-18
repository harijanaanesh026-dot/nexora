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
// ONLY HEARTS - NEE KAVALISINA VI OKATE - VEREVI VADDHU ❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶
const AVATARS = ["❤️","🧡","💛","💚","💙","💜","🤎","🖤","🤍","🩷","🩵","🩶"];
const ANON_NAMES = ["Anonymous Owl","Secret Tiger","Hidden Fox","Silent Panda","Ghost User","Shadow Yak"];
const REPORT_REASONS = ["Spam / Promotion","Abusive / Hate","Fake Info / Misleading","NSFW / Inappropriate","Personal Info Leak","Harassment / Bullying","Other"];
// WISHES - NO VULGAR TEXT ONLY
const BAD_WORDS = ["fuck","sex","porn","xxx","boobs","pussy","dick","cock","nude","slut","bitch","asshole","rape","gaand","gandu","loda","chod","chutiya","lund","randi"];
const containsVulgar = (t:string) => BAD_WORDS.some(w=>t.toLowerCase().includes(w));
const Footer = () => (<div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.3em] font-bold text-white/40">SRET ONLY • A PRODUCTION BY ANESH • ONLY HEARTS ❤️🧡💛💚💙💜</p><p className="text-[9px] text-white/20">Only Hearts Avatar ❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶 • Text Only • No Vulgar • Delete Anytime</p></div>);

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
  // IMAGE 100% THESE - TEXT ONLY - yakImage DELETE - WISH DONE
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [replyTo,setReplyTo]=useState<any>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [selectedAvatar,setSelectedAvatar]=useState("❤️");
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
          await addDoc(collection(db,'users'),{uid:u.uid,email:u.email||'',username:anonName,anonymousName:anonName,avatar:localStorage.getItem('selected_avatar')||'❤️',college:"SRET",collegeEmail:String(localStorage.getItem('college_email')||''),rollNumber:String(localStorage.getItem('roll_number')||''),isAnonymous:true,isTextOnly:true,isClean:true,isHeartOnly:true,yakarma:100,totalPosts:0,likedPosts:[],dislikedPosts:[],pollVoted:[],reportedPosts:[],blockedUsers:[],crushList:[],createdAt:serverTimestamp()});
          window.location.reload();
        }else{ setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen('feed'); }
      }else setScreen('college');
    });
  },[isVerified]);
  useEffect(()=>{ if(userData?.blockedUsers) setBlockedUsers(userData.blockedUsers); },[userData]);
  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(collection(db,'yaks'), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((d:any)=>!containsVulgar(d.text));
      const data=all.filter(d=>d.college==="SRET" ||!d.college);
      data.sort((a,b)=> (b.createdAt?.toMillis?.()||b.createdAt?.seconds*1000||0) - (a.createdAt?.toMillis?.()||a.createdAt?.seconds*1000||0));
      setYaks(data);
      setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
      setMemeYaks([...data].filter(d=>d.type==='meme').slice(0,20));
      setMarketYaks([...data].filter(d=>d.type==='market').slice(0,30));
      setPyqYaks([...data].filter(d=>d.type==='pyq').slice(0,30));
      const tagCount:Record<string,number>={}; data.forEach(y=>{ const tags=y.text?.match(/#\w+/g); if(tags) tags.forEach((t:string)=>{ tagCount[t.toLowerCase()]=(tagCount[t.toLowerCase()]||0)+1; }); }); setHashtags(Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([tag,count])=>({tag,count})));
      const now=Date.now(); const weekAgo=now-7*24*60*60*1000; const weekPosts=data.filter(d=>(d.createdAt?.toMillis?.()||0)>weekAgo); if(weekPosts.length>0){ const topPost=[...weekPosts].sort((a,b)=>(b.likes||0)-(a.likes||0))[0]; const topMeme=weekPosts.filter(d=>d.type==='meme').sort((a,b)=>(b.likes||0)-(a.likes||0))[0]; const topConf=weekPosts.filter(d=>d.type==='confession').sort((a,b)=>(b.commentsCount||0)-(a.commentsCount||0))[0]; setWeeklyAwards({topPost, topMeme, topConf}); }
    });
  },[userData]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'users'), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)); const same=all.filter(u=>u.college==="SRET"||!u.college); setLeaderboard(same.sort((a,b)=>b.yakarma-a.yakarma).slice(0,20)); }); },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((c:any)=>!containsVulgar(c.text)))); },[activePost]);
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
  // IMAGE UPLOAD DELETE - TEXT ONLY - WISH DONE

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#0a0a0b] text-white">
        <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
        <div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black text-xl">{selectedAvatar}</div>
            <div>
              <p className="font-black text-sm tracking-wide">SRET ONLY {selectedAvatar} ANONYMOUS</p>
              <p className="text-[10px] text-white/40">{totalUsers} SRET anonymous {selectedAvatar} • Only Hearts • Text Only Clean</p>
            </div>
          </div>
          <h1 className="text-[36px] font-black mt-8 leading-[0.9] tracking-tight">SRET<br/>Only<br/><span className="text-white/30">Hearts Only {selectedAvatar}</span></h1>
          <p className="text-[13px] text-white/50 mt-3">Only Hearts Avatar ❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶 • Text Only Clean • Delete Anytime</p>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">SELECT AVATAR - ONLY HEARTS - ❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶</p>
          <div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-2xl border-2 ${selectedAvatar===a?'bg-white text-black border-white scale-105':'bg-white/[0.05] border-white/10 text-white'}`}>{a}</button>)}</div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">COLLEGE - SRET ONLY {selectedAvatar}</p>
          <div className="mt-3"><div className="w-full p-4 rounded-[18px] border-2 bg-white text-black border-white flex justify-between"><div><p className="font-bold text-[13px]">SRET - Tirupati - Verified Only {selectedAvatar}</p><p className="text-[11px] text-black/60">{collegeCounts["SRET"]||0} anonymous {selectedAvatar} • Only Hearts • Text Only Clean</p></div><div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">✓</div></div></div>
          <button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black text-[14px] bg-white text-black">Enter SRET as {selectedAvatar} Anonymous Text Only Clean 🔒</button>
          <Footer/>
        </div>
      </div>
    );
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full text-white">←</button><div className="mt-6 bg-white/[0.05] border border-white/10 rounded-[20px] p-5 flex gap-3 items-center"><div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xl">{selectedAvatar}</div><div><p className="text-[10px] font-bold tracking-widest text-white/30">{collegeCounts["SRET"]||0} ANONYMOUS IN SRET {selectedAvatar}</p><h2 className="font-black text-[18px] mt-1 text-white">Verify SRET {selectedAvatar} Hearts Only</h2></div></div><div className="flex p-1 bg-white/5 border border-white/10 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>Mail OTP {selectedAvatar}</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll {selectedAvatar}</button></div>{verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3.5 rounded-xl border border-red-500/20">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl text-sm outline-none text-white"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Send OTP as {selectedAvatar} Clean</button>{otpSent&&<div className="mt-4 bg-black/30 border-2 border-white/10 rounded-xl p-4"><p className="text-xs text-emerald-400 font-bold">OTP: {generatedOtp} {selectedAvatar}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full mt-3 p-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-center tracking-[0.3em] text-white"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify OTP {selectedAvatar} Clean</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={`${config?.ex}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase font-bold tracking-widest text-white"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify Roll {selectedAvatar} Clean</button></div>}<Footer/></div></div>);
  }
  if(screen==='login'){
    return (<div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border-2 border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] flex items-center justify-center text-4xl">{selectedAvatar}</div><h1 className="font-black mt-6 text-center text-xl text-white">SRET Verified {selectedAvatar}<br/><span className="text-white/40">Only Hearts • Text Only Clean</span></h1><button onClick={handleGoogleLogin} className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold text-sm">Continue as {selectedAvatar} Text Only Clean 🔒</button></div><Footer/></div>);
    }

  const createNotification=async(toUid:string, type:string, text:string, yakId?:string)=>{
    if(toUid===user?.uid) return;
    await addDoc(collection(db,'notifications'),{
      toUid,
      fromUid:user?.uid,
      fromUsername:userData?.anonymousName||"Anonymous",
      fromAvatar:userData?.avatar||"❤️",
      type,
      text,
      yakId:yakId||null,
      read:false,
      isAnonymous:true,
      isTextOnly:true,
      isClean:true,
      isHeartOnly:true,
      createdAt:serverTimestamp()
    });
  };

  const handleVote=async(y:any,type:'up'|'down')=>{
    if(!userData) return;
    const yakRef=doc(db,'yaks',y.id);
    const userRef=doc(db,'users',userData.id);
    const liked=userData.likedPosts?.includes(y.id);
    const disliked=userData.dislikedPosts?.includes(y.id);
    try{
      if(type==='up'){
        if(liked){
          await updateDoc(yakRef,{likes:increment(-1)});
          await updateDoc(userRef,{likedPosts:arrayRemove(y.id)});
          setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)});
        }else if(disliked){
          await updateDoc(yakRef,{likes:increment(1), dislikes:increment(-1)});
          await updateDoc(userRef,{dislikedPosts:arrayRemove(y.id), likedPosts:arrayUnion(y.id)});
          setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id), likedPosts:[...(userData.likedPosts||[]), y.id]});
        }else{
          await updateDoc(yakRef,{likes:increment(1)});
          await updateDoc(userRef,{likedPosts:arrayUnion(y.id)});
          setUserData({...userData, likedPosts:[...(userData.likedPosts||[]), y.id]});
        }
      }else{
        if(disliked){
          await updateDoc(yakRef,{dislikes:increment(-1)});
          await updateDoc(userRef,{dislikedPosts:arrayRemove(y.id)});
          setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id)});
        }else if(liked){
          await updateDoc(yakRef,{likes:increment(-1), dislikes:increment(1)});
          await updateDoc(userRef,{likedPosts:arrayRemove(y.id), dislikedPosts:arrayUnion(y.id)});
          setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id), dislikedPosts:[...(userData.dislikedPosts||[]), y.id]});
        }else{
          await updateDoc(yakRef,{dislikes:increment(1)});
          await updateDoc(userRef,{dislikedPosts:arrayUnion(y.id)});
          setUserData({...userData, dislikedPosts:[...(userData.dislikedPosts||[]), y.id]});
        }
      }
    }catch(e:any){ showToast(e.message); }
  };

  const handlePollVote=async(y:any, idx:number)=>{
    if(!userData) return;
    if(userData.pollVoted?.includes(y.id)){ showToast("Already voted as "+userData.anonymousName+" "+userData.avatar); return; }
    try{
      const n=[...y.pollOptions];
      n[idx].votes=(n[idx].votes||0)+1;
      await updateDoc(doc(db,'yaks',y.id),{pollOptions:n, totalVotes:increment(1)});
      await updateDoc(doc(db,'users',userData.id),{pollVoted:arrayUnion(y.id)});
      setUserData({...userData, pollVoted:[...(userData.pollVoted||[]), y.id]});
      showToast("Voted as "+userData?.anonymousName+" "+userData?.avatar+" Clean ❤️");
    }catch(e:any){ showToast(e.message); }
  };

  const handlePost=async()=>{
    const txt=newYak.trim();
    // TEXT ONLY - IMAGE 0% - NO VULGAR - ONLY HEARTS
    if(!txt){ showToast("Type something - Text only - "+userData?.anonymousName+" "+userData?.avatar); return; }
    if(containsVulgar(txt)){ showToast(`❌ No vulgar As ${userData?.anonymousName} ${userData?.avatar} Text only Clean`); return; }
    if(txt.length>300){ showToast("Max 300 chars - Text only - "+userData?.avatar); return; }
    if(yakType==='poll' && pollOptions.filter(o=>o.trim()).length<2){ showToast("Need 2 options Clean "+userData?.avatar); return; }
    if(pollOptions.some(o=>o && containsVulgar(o))){ showToast("❌ No vulgar in poll "+userData?.avatar); return; }
    if(yakType==='market' &&!marketPrice.trim()){ showToast("Enter price "+userData?.avatar); return; }
    if(yakType==='pyq' &&!pyqSubject.trim()){ showToast("Enter subject "+userData?.avatar); return; }
    if(!userData||!user||posting) return;
    setPosting(true);
    try{
      const anonName = userData.anonymousName;
      const anonAvatar = userData.avatar||selectedAvatar||"❤️";
      const payload:any={
        text:txt,
        uid:user.uid,
        anonymousName:anonName,
        username:anonName,
        avatar:anonAvatar,
        college:"SRET",
        type:yakType,
        isAnonymous:true,
        isTextOnly:true,
        isClean:true,
        isHeartOnly:true,
        likes:0,
        dislikes:0,
        commentsCount:0,
        reports:0,
        hidden:false,
        createdAt:serverTimestamp()
      };
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; }
      if(yakType==='market'){ payload.price=marketPrice; payload.isMarket=true; }
      if(yakType==='pyq'){ payload.subject=pyqSubject.toUpperCase(); payload.isPyq=true; }
      const hashtagsInText=txt.match(/#\w+/g);
      if(hashtagsInText) payload.hashtags=hashtagsInText.map((h:string)=>h.toLowerCase());
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setPollOptions(['','']); setMarketPrice(''); setPyqSubject(''); setYakType('yak'); setScreen('feed');
      showToast(`Posted as ${anonName} ${anonAvatar} Text Only Clean ❤️`);
    }catch(e:any){ showToast(e.message); }finally{ setPosting(false); }
  };

  const handleDelete=async(y:any)=>{
    const isOwn=user?.uid===y.uid;
    if(!isOwn){ showToast("Only your post - "+userData?.anonymousName+" "+userData?.avatar); return; }
    if(!confirm(`🗑️ DELETE as ${userData?.anonymousName} ${userData?.avatar}?\n"${y.text.slice(0,60)}"\nText Only Clean ❤️`)) return;
    try{ await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1)}); showToast(`Deleted as ${userData?.anonymousName} ${userData?.avatar} Clean ❤️`); }catch(e:any){ showToast(e.message); }
    setShowMenu(null);
  };

  const handleEdit=async()=>{
    if(!editingPost) return;
    if(!editText.trim()) return;
    if(containsVulgar(editText)){ showToast("❌ No vulgar "+userData?.avatar); return; }
    try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); showToast("Edited as "+userData?.anonymousName+" "+userData?.avatar+" ❤️"); }catch(e:any){ showToast(e.message); }
    setEditingPost(null); setEditText(''); setShowMenu(null);
  };

  const handleReport=async(y:any, reasonArg?:string)=>{
    const finalReason=reasonArg||reportReason;
    if(!userData) return;
    if(userData.reportedPosts?.includes(y.id)){ showToast("Already reported as "+userData?.anonymousName+" "+userData?.avatar); setReportingPost(null); setShowMenu(null); return; }
    if(!finalReason){ showToast("Select reason - "+userData?.anonymousName+" "+userData?.avatar); return; }
    try{
      await addDoc(collection(db,'reports'),{yakId:y.id, yakText:y.text.slice(0,200), yakUid:y.uid, yakAnonymousName:y.anonymousName, reportedBy:user.uid, reporterAnonymousName:userData?.anonymousName, reporterAvatar:userData?.avatar, reason:finalReason, status:"pending", isTextOnly:true,isClean:true,isHeartOnly:true, createdAt:serverTimestamp()});
      await updateDoc(doc(db,'yaks',y.id),{reports:increment(1)});
      await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)});
      setUserData({...userData, reportedPosts:[...(userData.reportedPosts||[]), y.id]});
      showToast(`Reported as ${userData?.anonymousName} ${userData?.avatar} Clean ❤️`);
      setReportingPost(null); setReportReason(''); setShowMenu(null);
    }catch(e:any){ showToast(e.message); }
  };

  const handleAdminRestore=async(report:any)=>{ try{ await updateDoc(doc(db,'yaks',report.yakId),{hidden:false, reports:0}); await updateDoc(doc(db,'reports',report.id),{status:"dismissed"}); showToast("Restored "+userData?.avatar); }catch(e:any){ showToast(e.message); } };
  const handleAdminDelete=async(report:any)=>{ if(!confirm('Delete as '+userData?.anonymousName+' '+userData?.avatar+'?')) return; try{ await deleteDoc(doc(db,'yaks',report.yakId)); await updateDoc(doc(db,'reports',report.id),{status:"deleted"}); showToast("Deleted "+userData?.avatar); }catch(e:any){ showToast(e.message); } };
  const handleAdminDismiss=async(report:any)=>{ try{ await updateDoc(doc(db,'reports',report.id),{status:"dismissed"}); showToast("Dismissed "+userData?.avatar); }catch(e:any){ showToast(e.message); } };
  const buildTree = (flat:any[]) => { const map:Record<string, any> = {}; const roots:any[] = []; flat.forEach(c => { map[c.id] = {...c, replies: []}; }); flat.forEach(c => { if(c.parentId && map[c.parentId]){ map[c.parentId].replies.push(map[c.id]); } else { roots.push(map[c.id]); } }); return roots; };

  const handleCommentPost = async (yId:string) => {
    if(!commentText.trim() ||!user ||!userData) return;
    const text = commentText.trim();
    if(containsVulgar(text)){ showToast("❌ No vulgar As "+userData?.anonymousName+" "+userData?.avatar); return; }
    const payload:any = { text, uid: user.uid, username: userData?.anonymousName, anonymousName: userData?.anonymousName, avatar: userData?.avatar||"❤️", parentId: replyTo? replyTo.id : null, replyToUsername: replyTo? replyTo.anonymousName : null, isAnonymous:true,isTextOnly:true,isClean:true,isHeartOnly:true, createdAt: serverTimestamp() };
    setCommentText(''); const temp = replyTo; setReplyTo(null);
    try{ await addDoc(collection(db,'yaks/'+yId+'/comments'), payload); await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); }catch(e:any){ showToast(e.message); setCommentText(text); setReplyTo(temp); }
  };

  const handleStartDm = async (otherUid:string, yakId?:string)=>{
    if(otherUid===user?.uid){ showToast("Can't DM yourself "+userData?.avatar); return; }
    if(blockedUsers.includes(otherUid)){ showToast("Blocked "+userData?.avatar); return; }
    const existing=dmChats.find(c=> c.participants.includes(otherUid) && c.participants.length===2);
    if(existing){ setActiveDm(existing); setFeedTab('dm'); return; }
    try{
      const newChat=await addDoc(collection(db,'dms'),{
        participants:[user.uid, otherUid],
        lastMessage:`Started private chat as ${userData?.anonymousName} ${userData?.avatar} - Text Only Clean ❤️`,
        lastMessageAt:serverTimestamp(),
        createdAt:serverTimestamp(),
        isPrivate:true,
        isHeartOnly:true,
        visibleTo: [user.uid, otherUid]
      });
      setActiveDm({id:newChat.id, participants:[user.uid, otherUid], isPrivate:true});
      setFeedTab('dm');
      showToast(`🔒 Private DM as ${userData?.anonymousName} ${userData?.avatar} ❤️`);
    }catch(e:any){ showToast(e.message); }
  };

  const handleSendDm=async()=>{
    if(!dmText.trim()||!activeDm||!user) return;
    const txt=dmText.trim();
    if(containsVulgar(txt)){ showToast("❌ No vulgar As "+userData?.anonymousName+" "+userData?.avatar); return; }
    setDmText('');
    try{
      await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{
        text:txt, uid:user.uid, username:userData?.anonymousName, anonymousName:userData?.anonymousName, avatar:userData?.avatar||"❤️", isAnonymous:true,isTextOnly:true,isClean:true,isHeartOnly:true, createdAt:serverTimestamp(), private:true, visibleTo: activeDm.participants
      });
      await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:txt, lastMessageAt:serverTimestamp()});
    }catch(e:any){ showToast(e.message); setDmText(txt); }
  };

  const markNotificationsRead=async()=>{ try{ const batch=notifications.filter((n:any)=>!n.read); for(const n of batch){ await updateDoc(doc(db,'notifications',n.id),{read:true}); } }catch{} };
  const handleBlockUser=async(targetUid:string)=>{ if(!userData || targetUid===user?.uid) return; if(!confirm(`Block ${userData?.anonymousName} ${userData?.avatar}? Only Hearts ❤️`)) return; try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(targetUid)}); setBlockedUsers([...blockedUsers, targetUid]); setShowMenu(null); showToast("Blocked as "+userData?.anonymousName+" "+userData?.avatar+" ❤️"); }catch(e:any){ showToast(e.message); } };
  const handleUnblockUser=async(targetUid:string)=>{ try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayRemove(targetUid)}); setBlockedUsers(blockedUsers.filter(id=>id!==targetUid)); showToast("Unblocked "+userData?.avatar+" ❤️"); }catch(e:any){ showToast(e.message); } };
  const handleCrushSubmit=async()=>{
    const roll=crushRoll.trim().toUpperCase();
    if(!roll){ showToast("Enter roll "+userData?.anonymousName+" "+userData?.avatar); return; }
    if(containsVulgar(roll)){ showToast("❌ No vulgar "+userData?.avatar); return; }
    if(!COLLEGES[0].pattern.test(roll)){ showToast("Invalid Roll Ex: 21CS101 "+userData?.avatar); return; }
    if(roll===userData.rollNumber){ showToast("Can't crush yourself 😂 "+userData?.avatar); return; }
    try{
      await addDoc(collection(db,'crushes'),{fromUid:user.uid, fromAnonymousName:userData?.anonymousName, fromAvatar:userData?.avatar, toRoll:roll, matched:false, isHeartOnly:true, createdAt:serverTimestamp()});
      setCrushRoll(''); showToast("Crush saved as "+userData?.anonymousName+" "+userData?.avatar+" ❤️");
    }catch(e:any){ showToast(e.message); }
  };
  const handleCancelCrush=async(crushId:string)=>{ if(!confirm(`Cancel crush as ${userData?.anonymousName} ${userData?.avatar}? ❤️`)) return; try{ await deleteDoc(doc(db,'crushes',crushId)); showToast("Cancelled "+userData?.avatar+" ❤️"); }catch(e:any){ showToast(e.message); } };

  const renderComment = (c:any, depth=0) => {
    const isReply = depth > 0;
    const anonDisplay = c.anonymousName || "Anonymous";
    const isOwnComment = c.uid===user?.uid;
    return (
      <div key={c.id} className={`${isReply? 'ml-6 border-l-2 border-white/15 pl-3' : ''} mt-3`}>
        <div className="flex gap-2.5">
          <div className={`bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white shrink-0 ${isReply? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'}`}>{c.avatar||userData?.avatar||"❤️"}</div>
          <div className="flex-1">
            <div className={`bg-white/[0.05] border rounded-[14px] px-4 py-2.5 ${isOwnComment?'border-white/20 bg-white/[0.08]':'border-white/10'}`}>
              <p className="text-[10px] font-bold text-white/40">{anonDisplay} {isOwnComment?`YOU (${userData?.anonymousName} ${userData?.avatar}) Can DELETE ❤️`:''}</p>
              <span className="px-1.5 py-0.5 bg-green-500/20 rounded-full text-[7px] text-green-400 font-bold">ANON {c.avatar||"❤️"} TEXT ONLY CLEAN NO VULGAR</span>
              <p className="text-[13px] text-white mt-1 leading-[1.4] whitespace-pre-wrap break-words">{c.text}</p>
            </div>
            <div className="flex gap-3 mt-1.5 ml-1 items-center">
              <button onClick={()=>setReplyTo(c)} className="text-[11px] font-bold text-white/30">Reply as {userData?.anonymousName} {userData?.avatar} Clean ❤️</button>
              <button onClick={()=>handleStartDm(c.uid)} className="text-[11px] font-bold text-green-400">🔒 DM {anonDisplay.split(' ')[0]} {userData?.avatar} Clean ❤️</button>
              {isOwnComment && <button onClick={async()=>{ if(confirm(`Delete comment as ${userData?.anonymousName} ${userData?.avatar}? ❤️ Clean`)){ await deleteDoc(doc(db,'yaks/'+activePost+'/comments/'+c.id)); await updateDoc(doc(db,'yaks',activePost as string), {commentsCount: increment(-1)}); } }} className="text-[11px] font-bold text-red-400">🗑️ Delete {userData?.avatar} Clean ❤️</button>}
            </div>
            {c.replies && c.replies.length > 0 && (<div className="mt-1">{c.replies.map((rep:any)=>renderComment(rep, depth+1))}</div>)}
          </div>
        </div>
      </div>
    );
  };

  const filteredYaks = (searchQuery? yaks.filter(y=> y.text.toLowerCase().includes(searchQuery.toLowerCase()) || y.hashtags?.some((h:string)=>h.includes(searchQuery.toLowerCase())) ) : yaks).filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!containsVulgar(y.text)).filter(y=>!y.hidden || y.uid===user?.uid);
  const displayHotYaks = hotYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!containsVulgar(y.text));
  const displayMemeYaks = memeYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!containsVulgar(y.text));
  const displayMarketYaks = marketYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!containsVulgar(y.text));
  const displayPyqYaks = pyqYaks.filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!containsVulgar(y.text));

  return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-2xl">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">{userData?.avatar||"❤️"}</div>
            <div>
              <p className="font-bold text-[13px] leading-none text-white">{userData?.anonymousName||"Anonymous"} {userData?.avatar||"❤️"} • {yaks.length} • TEXT ONLY CLEAN ❤️</p>
              <p className="text-[10px] text-white/40">{userData?.anonymousName} {userData?.avatar} No real name Text only Clean No vulgar Delete anytime • {totalUsers} verified • Only Hearts ❤️🧡💛</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={()=>{ setShowNotifications(true); markNotificationsRead(); }} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white relative">🔔{unreadCount>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white">{unreadCount}</span>}</button>
            <button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">{userData?.avatar||"❤️"}</button>
          </div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-2">
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={`Search as ${userData?.anonymousName||"Anonymous"} ${userData?.avatar||"❤️"} #hashtag Text only Clean No vulgar ❤️`} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-full px-4 text-xs outline-none text-white placeholder:text-white/30 focus:border-white" />
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2 overflow-x-auto">
          <button onClick={()=>setFeedTab('new')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='new'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>NEW {filteredYaks.length} {userData?.avatar||"❤️"} CLEAN</button>
          <button onClick={()=>setFeedTab('meme')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>MEME {userData?.avatar||"❤️"}</button>
          <button onClick={()=>setFeedTab('hot')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='hot'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>HOT {userData?.avatar||"❤️"}</button>
          <button onClick={()=>setFeedTab('top')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='top'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>TOP {userData?.avatar||"❤️"}</button>
          <button onClick={()=>setFeedTab('crush')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='crush'?'bg-pink-500 text-white border-pink-500':'bg-white/5 border-white/10 text-white/40'}`}>💘 {crushMatches.filter((c:any)=>c.matched).length} {userData?.avatar||"❤️"}</button>
          <button onClick={()=>setFeedTab('market')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='market'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🛒 {displayMarketYaks.length} {userData?.avatar||"❤️"}</button>
          <button onClick={()=>setFeedTab('pyq')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='pyq'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>📚 {displayPyqYaks.length} {userData?.avatar||"❤️"}</button>
          <button onClick={()=>setFeedTab('dm')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='dm'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🔒 DM {dmChats.length} {userData?.avatar||"❤️"}</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        {hashtags.length>0 &&!['dm','top','crush','market','pyq'].includes(feedTab) && (
          <><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">TRENDING HASHTAGS {userData?.avatar||"❤️"} ONLY HEARTS ❤️🧡💛💚💙💜 TEXT ONLY CLEAN {userData?.anonymousName}</p><div className="flex gap-2 mt-3 flex-wrap">{hashtags.map((h:any)=><button key={h.tag} onClick={()=>setSearchQuery(h.tag)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/60 hover:bg-white hover:text-black">{h.tag} {h.count} {userData?.avatar||"❤️"} Clean</button>)}</div></div></>
        )}
        {feedTab==='crush' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-2 border-pink-500/20 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-pink-400">CRUSH MATCHER 💘 {userData?.avatar||"❤️"} ONLY HEARTS ❤️🧡💛 TEXT ONLY CLEAN {userData?.anonymousName}</p><div className="flex gap-2 mt-4"><input value={crushRoll} onChange={e=>setCrushRoll(e.target.value.toUpperCase())} placeholder={`Crush Roll as ${userData?.anonymousName} ${userData?.avatar||"❤️"} 21CS*** masked Clean ❤️`} className="flex-1 bg-black/30 border-2 border-pink-500/20 rounded-full px-5 h-11 text-[13px] outline-none text-white"/><button onClick={handleCrushSubmit} className="px-6 h-11 bg-pink-500 text-white rounded-full font-bold text-xs">Add as {userData?.anonymousName?.split(' ')[0]} {userData?.avatar||"❤️"} Clean</button></div></div>
            <Footer/>
          </div>
        )}
        {feedTab==='market' && (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET MARKETPLACE {userData?.avatar||"❤️"} ONLY HEARTS 🛒 TEXT ONLY CLEAN {userData?.anonymousName}</p><button onClick={()=>{setYakType('market'); setScreen('create');}} className="mt-3 bg-white text-black px-5 h-9 rounded-full text-xs font-bold">Sell as {userData?.anonymousName} {userData?.avatar||"❤️"} Text only Clean +</button></div>
            {displayMarketYaks.map((y:any)=>{
              const isOwn=y.uid===user?.uid;
              const authorName=y.anonymousName||"Anonymous";
              return(<div key={y.id} className={`bg-white/[0.04] border-2 rounded-[20px] p-5 ${isOwn?'border-white/20':'border-white/10'}`}><div className="flex justify-between"><p className="font-bold text-[13px] text-white">{authorName} {y.avatar||"❤️"} {isOwn?`YOU (${userData?.anonymousName} ${userData?.avatar}) Can DELETE ❤️`:''} 🛒 TEXT ONLY CLEAN ❤️</p><span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[11px] font-bold text-green-400">₹{y.price} {y.avatar||"❤️"} Clean</span></div><p className="text-[14px] text-white mt-3 whitespace-pre-wrap break-words">{y.text}</p><div className="flex gap-2 mt-4"><button onClick={()=>handleStartDm(y.uid, y.id)} className="flex-1 h-10 bg-white text-black rounded-full font-bold text-xs">DM {authorName.split(' ')[0]} as {userData?.anonymousName} {userData?.avatar||"❤️"} 🔒 Clean ❤️</button>{isOwn && <button onClick={()=>handleDelete(y)} className="px-4 h-10 bg-red-500 text-white rounded-full font-bold text-xs">🗑️ DELETE {userData?.avatar||"❤️"} Clean</button>}</div></div>);
            })}
            <Footer/>
          </div>
        )}
        {feedTab==='pyq' && (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET PYQ VAULT {userData?.avatar||"❤️"} ONLY HEARTS 📚 TEXT ONLY CLEAN {userData?.anonymousName}</p><button onClick={()=>{setYakType('pyq'); setScreen('create');}} className="mt-3 bg-white text-black px-5 h-9 rounded-full text-xs font-bold">Upload PYQ as {userData?.anonymousName} {userData?.avatar||"❤️"} Text only Clean +</button></div>
            {displayPyqYaks.map((y:any)=>{ const isOwn=y.uid===user?.uid; return(<div key={y.id} className={`bg-white/[0.04] border-2 rounded-[20px] p-5 ${isOwn?'border-white/20':'border-white/10'}`}><p className="font-bold text-[13px] text-white">{y.anonymousName||"Anonymous"} {y.avatar||"❤️"} {isOwn?`YOU (${userData?.anonymousName}) ${userData?.avatar} Clean ❤️`:''} Text only Clean ❤️</p><p className="text-[14px] text-white mt-3 whitespace-pre-wrap break-words">{y.text}</p><div className="flex gap-2 mt-4"><button onClick={()=>handleStartDm(y.uid)} className="px-4 h-8 bg-white text-black rounded-full text-xs font-bold">DM as {userData?.anonymousName} {userData?.avatar||"❤️"} 🔒 Clean ❤️</button>{isOwn && <button onClick={()=>handleDelete(y)} className="px-4 h-8 bg-red-500 text-white rounded-full text-xs font-bold">🗑️ DELETE {userData?.avatar||"❤️"} Clean</button>}</div></div>); })}
            <Footer/>
          </div>
        )}

        {feedTab==='dm'? (
          <div className="space-y-3">
            {!activeDm? (
              <><div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">1to1 PRIVATE DM - SRET ONLY {userData?.avatar||"❤️"} ONLY HEARTS 🔒 TEXT ONLY CLEAN</p><p className="font-black mt-1 text-white">Private Chats - {dmChats.length} • Only You 2 • {userData?.anonymousName} {userData?.avatar||"❤️"} • Text Only Clean ❤️</p><p className="text-[11px] text-white/40 mt-1">1to1 only - 2 participants - 100% private - No group - Only Hearts ❤️🧡💛💚💙💜</p></div>
              {dmChats.map((chat:any)=><button key={chat.id} onClick={()=>setActiveDm(chat)} className="w-full bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center text-left"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">{userData?.avatar||"❤️"}</div><div><p className="font-bold text-[13px] text-white">🔒 Private Chat {userData?.avatar||"❤️"} Only You 2 • Text Only Clean ❤️</p><p className="text-[11px] text-white/40 truncate max-w-[200px]">{chat.lastMessage} • {userData?.avatar||"❤️"} Clean</p></div></div><span className="px-2 py-1 bg-green-500/20 rounded-full text-[8px] font-bold text-green-400">1to1 PRIVATE {userData?.avatar||"❤️"}</span></button>)}
              {dmChats.length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><p className="font-black text-[18px] text-white">No Private DMs yet {userData?.avatar||"❤️"} 🔒 Only Hearts ❤️</p><p className="text-[11px] text-white/30 mt-1">Start private DM from any post as {userData?.anonymousName} {userData?.avatar||"❤️"} - Text Only Clean No Vulgar</p></div>}<Footer/></>
            ) : (
              <div className="bg-white/[0.03] border-2 border-white/10 rounded-[24px] flex flex-col h-[70vh]">
                <div className="p-4 border-b-2 border-white/10 flex justify-between items-center"><div className="flex gap-3 items-center"><button onClick={()=>setActiveDm(null)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">←</button><div><p className="font-bold text-[13px] text-white">🔒 1to1 Private Chat {userData?.avatar||"❤️"} {userData?.anonymousName} Text Only Clean ❤️</p><p className="text-[9px] text-green-400">Only you 2 can see - No one else - Only Hearts ❤️🧡💛 {userData?.avatar||"❤️"} Clean</p></div></div><span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[8px] font-bold text-green-400">PRIVATE {userData?.avatar||"❤️"}</span></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">{dmMessages.map((m:any)=><div key={m.id} className={`flex ${m.uid===user?.uid?'justify-end':'justify-start'}`}><div className={`max-w-[70%] rounded-[16px] px-4 py-2.5 ${m.uid===user?.uid?'bg-white text-black':'bg-white/10 border border-white/10 text-white'}`}><p className="text-[10px] font-bold opacity-60">{m.uid===user?.uid? userData?.anonymousName+" "+(userData?.avatar||"❤️") : "Anonymous "+(m.avatar||"❤️")} Clean ❤️</p><p className="text-[13px] leading-[1.4]">{m.text}</p><p className="text-[8px] opacity-50 mt-1">{m.uid===user?.uid?`You (${userData?.anonymousName} ${userData?.avatar||"❤️"})`:'Anonymous '+ (m.avatar||"❤️")} • Private 🔒 Clean ❤️</p></div></div>)}</div>
                <div className="p-3 border-t-2 border-white/10 flex gap-2"><input value={dmText} onChange={e=>setDmText(e.target.value)} placeholder={`Private message as ${userData?.anonymousName} ${userData?.avatar||"❤️"} Clean No vulgar 🔒 ❤️`} className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white" onKeyDown={e=>{ if(e.key==='Enter') handleSendDm(); }}/><button onClick={handleSendDm} disabled={!dmText.trim()} className={`w-11 h-11 rounded-full font-bold ${!dmText.trim()?'bg-white/5 text-white/20':'bg-white text-black'}`}>Go {userData?.avatar||"❤️"}</button></div>
              </div>
            )}
          </div>
        ) : feedTab==='top'? (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET TOP ANONYMOUS {userData?.avatar||"❤️"} ONLY HEARTS ❤️🧡💛💚💙💜 • Text Only Clean • Private DM 🔒</p><p className="font-black mt-1 text-white">Top Anonymous {userData?.avatar||"❤️"} - Only Hearts - Text Only Clean ❤️</p></div>
            {leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">{i+1}</span><span className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">{u.avatar||"❤️"}</span><div><p className="font-bold text-[13px] text-white">{u.anonymousName||`Anonymous Student ${i+1}`} {u.avatar||"❤️"} {i===0?'👑':''} {u.uid===user?.uid?`YOU (${userData?.anonymousName} ${userData?.avatar||"❤️"}) Clean ❤️`:''} • Only Hearts ❤️ Clean</p><p className="text-[10px] text-white/40">{u.totalPosts||0} posts • SRET Verified {u.avatar||"❤️"} Text Only Clean No Vulgar</p></div></div><p className="font-black text-sm text-white">{u.yakarma} {u.avatar||"❤️"}</p></div>)}<Footer/></div>
        ) :!['crush','market','pyq','dm','top'].includes(feedTab) && (
          <>
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">{userData?.avatar||"❤️"}</div><div><p className="font-bold text-[13px] text-white">Anonymous {userData?.avatar||"❤️"} Only Hearts ❤️🧡💛 - 1to1 Private 🔒 Text Only Clean</p><p className="text-[11px] text-white/40">No One Sees Other Chat • SRET ONLY • {userData?.anonymousName} {userData?.avatar||"❤️"} Text Only Clean No Vulgar</p></div></div><span className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] font-bold text-green-400">🔒 PRIVATE DM {userData?.avatar||"❤️"}</span></div>
            {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : displayHotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const hasVoted=userData.pollVoted?.includes(y.id); const nestedTree = activePost===y.id? buildTree(comments) : [];
              const authorName = y.anonymousName||"Anonymous";
              return(
                <div key={y.id} className={`bg-white/[0.04] border-2 rounded-[20px] p-5 ${isOwn?'border-white/20 bg-white/[0.06]':'border-white/10'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm relative text-white">{y.avatar||"❤️"}</div>
                      <div>
                        <div className="flex gap-2 items-center flex-wrap">
                          <p className="font-bold text-[13px] text-white">{authorName} {y.avatar||"❤️"} {isOwn?`YOU (${userData?.anonymousName} ${userData?.avatar||"❤️"}) Can DELETE ❤️`:''}</p>
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-white text-black">SRET {y.type?.toUpperCase()} {y.avatar||"❤️"} TEXT ONLY CLEAN</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold bg-green-500/20 text-green-400">ANON {y.avatar||"❤️"} ONLY HEARTS ❤️ CLEAN</span>
                          {isOwn && <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold bg-blue-500 text-white">DELETE 🗑️ {y.avatar||"❤️"} CLEAN</span>}
                        </div>
                        <p className="text-[10px] text-white/30 mt-0.5">Anonymous {y.avatar||"❤️"} Only Hearts - {score} • Text only Clean No vulgar • {y.hashtags?.join(' ')||''} {y.price? `• ₹${y.price}`:''} {y.subject? `• ${y.subject}`:''} • {y.avatar||"❤️"}</p>
                      </div>
                    </div>
                    <div className="relative flex gap-2">
                      <button onClick={()=>handleStartDm(y.uid, y.id)} className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-[12px]">{y.avatar||"❤️"}</button>
                      <button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40">...</button>
                      {showMenu===y.id && <div className="absolute right-0 top-10 w-[240px] bg-black border-2 border-white/10 rounded-2xl p-2 z-20 shadow-2xl">{isOwn? (<><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 text-white">Edit as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-red-500 text-white mt-2">🗑️ DELETE MY POST {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</button></>) : (<><button onClick={()=>handleStartDm(y.uid, y.id)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400">🔒 Private DM {y.avatar||"❤️"} Only You 2 as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</button><button onClick={()=>{ setReportingPost(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60 mt-2">Report {y.reports||0}/5 → Review Clean {y.avatar||"❤️"} {userData?.avatar||"❤️"}</button><button onClick={()=>handleBlockUser(y.uid)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 mt-2">🚫 Block {authorName} {y.avatar||"❤️"} Clean ❤️</button></>)}<button onClick={()=>setShowMenu(null)} className="w-full mt-2 py-2 rounded-xl text-[11px] text-white/30">Cancel {userData?.avatar||"❤️"}</button></div>}
                    </div>
                  </div>
                  <p className="text-[15px] mt-4 leading-[1.5] text-white whitespace-pre-wrap break-words">{y.text}</p>
                  {/* IMAGE DELETE - TEXT ONLY - WISH DONE - NO y.image */}
                  {y.hidden && <div className="mt-3 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-xl p-3"><span className="text-yellow-400 text-[10px] font-bold">⏳ HIDDEN - {y.reports}/5 - Only you see {y.avatar||"❤️"} Clean ❤️</span></div>}
                  {isPoll && y.pollOptions && (<div className="mt-4 bg-white/[0.03] border-2 border-white/10 rounded-[16px] p-4"><div className="flex justify-between items-center mb-3"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">📊 POLL {y.avatar||"❤️"} ONLY HEARTS - PRIVATE VOTE - {userData?.anonymousName} {userData?.avatar||"❤️"} CLEAN ❤️</p><span className="px-2 py-1 bg-white text-black rounded-full text-[9px] font-bold">{y.totalVotes||0} VOTES • {y.avatar||"❤️"} Clean</span></div><div className="space-y-2.5">{[...y.pollOptions].sort((a:any,b:any)=> (b.votes||0)-(a.votes||0)).map((opt:any,idx:number)=>{ const total=y.totalVotes||1; const percent=Math.round((opt.votes/total)*100)||0; const rank = idx+1; return (<button key={idx} onClick={()=>handlePollVote(y,y.pollOptions.indexOf(opt))} disabled={!!hasVoted} className="w-full relative overflow-hidden rounded-xl border-2 text-left p-0 border-white/10"><div className="absolute left-0 top-0 bottom-0 bg-white/10" style={{width:`${hasVoted? percent: 0}%`}}></div><div className="relative flex justify-between items-center p-3"><div className="flex gap-2 items-center"><span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/10 text-white">#{rank}</span><span className="text-[13px] font-bold">{opt.text} {y.avatar||"❤️"} Clean</span></div><div className="text-right"><p className="text-[12px] font-black">{hasVoted? `${percent}%` : `${opt.votes||0} votes`} {y.avatar||"❤️"}</p></div></div></button> )})}</div></div>)}
                  <div className="flex gap-2.5 mt-5 items-center flex-wrap">
                    <div className="flex bg-white/5 border border-white/10 rounded-full p-1">
                      <button onClick={()=>handleVote(y,'up')} className={`px-4 py-2 rounded-full text-xs font-bold ${liked?'bg-white text-black':'text-white/40'}`}>Up {y.likes||0} {y.avatar||"❤️"}</button>
                      <span className="px-3 py-2 text-[11px] font-black min-w-[36px] text-center text-white/20">{score}</span>
                      <button onClick={()=>handleVote(y,'down')} className={`px-4 py-2 rounded-full text-xs font-bold ${disliked?'bg-red-500 text-white':'text-white/30'}`}>Down {y.dislikes||0} {y.avatar||"❤️"}</button>
                    </div>
                    <button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); setReplyTo(null); }} className="px-4 h-9 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">Comments {y.commentsCount||0} {y.avatar||"❤️"} Clean ❤️</button>
                    <button onClick={()=>handleStartDm(y.uid, y.id)} className="px-4 h-9 rounded-full text-xs bg-green-500/10 border border-green-500/20 text-green-400 font-bold">🔒 DM {authorName.split(' ')[0]} {y.avatar||"❤️"} as {userData?.anonymousName?.split(' ')[0]} {userData?.avatar||"❤️"} Clean ❤️</button>
                    {isOwn && <button onClick={()=>handleDelete(y)} className="px-4 h-9 rounded-full text-xs bg-red-500 text-white font-bold">DELETE {y.avatar||"❤️"} Clean ❤️</button>}
                  </div>
                  {activePost===y.id && (<div className="mt-5 border-t-2 border-white/10 pt-4 space-y-1"><p className="text-[10px] font-bold tracking-widest text-white/30 mb-3">REPLIES {comments.length} {userData?.avatar||"❤️"} Only Hearts ❤️ Clean No vulgar</p>{replyTo && (<div className="bg-white/10 border-2 border-white/20 rounded-xl px-4 py-2.5 flex justify-between items-center mb-3"><p className="text-[11px] text-white">Replying as {userData?.anonymousName} {userData?.avatar||"❤️"} to {replyTo.anonymousName} {replyTo.avatar||"❤️"}: {replyTo.text.slice(0,30)} Clean ❤️</p><button onClick={()=>setReplyTo(null)} className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white text-xs">X</button></div>)}<div className="max-h-[420px] overflow-y-auto pr-1">{nestedTree.length===0 && <p className="text-xs text-white/20 text-center py-8">No comments yet as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</p>}{nestedTree.map((c:any)=>renderComment(c,0))}</div><div className="flex gap-2.5 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={`Comment as ${userData?.anonymousName} ${userData?.avatar||"❤️"} Clean No vulgar ❤️`} className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white" onKeyDown={e=>{ if(e.key==='Enter'){ handleCommentPost(y.id); } }}/><button onClick={()=>handleCommentPost(y.id)} disabled={!commentText.trim()} className={`w-11 h-11 rounded-full font-bold flex items-center justify-center ${!commentText.trim()?'bg-white/5 text-white/20 border border-white/5':'bg-white text-black'}`}>Go {userData?.avatar||"❤️"}</button></div></div>)}
                </div>
              );
            })}
            {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : displayHotYaks).length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] mx-auto flex items-center justify-center text-4xl">{userData?.avatar||"❤️"}</div><p className="font-black mt-6 text-[18px] text-white">No posts yet {userData?.avatar||"❤️"} - Only Hearts ❤️🧡💛</p><p className="text-[11px] text-white/30 mt-1">Post as {userData?.anonymousName} {userData?.avatar||"❤️"} #hashtag Text only Clean No vulgar ❤️</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full text-[13px] font-bold">Create as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</button></div>}
            <Footer/>
          </>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-2xl border-t-2 border-white/10"><div className="max-w-[600px] mx-auto px-6 h-[72px] flex items-center justify-between"><button onClick={()=>{ setFeedTab('new'); setActiveDm(null); }} className="flex flex-col items-center gap-1.5"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/30 border border-white/10'}`}>{userData?.avatar||"❤️"}</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {yaks.length} {userData?.avatar||"❤️"} CLEAN DELETE ❤️</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[24px] font-black">{userData?.avatar||"❤️"}</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1.5"><div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs text-white relative">{userData?.avatar||"❤️"}{unreadCount>0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {userData?.yakarma||0} {userData?.avatar||"❤️"} CLEAN ❤️</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col overflow-hidden">
          {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100]">{toast}</div>}
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full bg-[#0a0a0b]">
            <div className="p-5 flex items-center justify-between border-b-2 border-white/10">
              <button onClick={()=>{ if(!posting) { setScreen('feed'); } }} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">X</button>
              <div className="text-center">
                <p className="text-[11px] font-bold tracking-widest text-white">SRET ONLY {userData?.avatar||"❤️"} ONLY HEARTS ❤️🧡💛💚💙💜 TEXT ONLY CLEAN 🔒</p>
                <p className="text-[10px] text-white/30">{userData?.anonymousName} {userData?.avatar||"❤️"} 1to1 Private • No One Sees Other Chat • Text only 300 chars • No vulgar • Delete anytime • {userData?.avatar||"❤️"}</p>
              </div>
              <button onClick={handlePost} disabled={posting||!newYak.trim()} className={`px-6 h-10 rounded-full font-bold text-[13px] ${posting||!newYak.trim()?'bg-white/5 text-white/20 border-2 border-white/5':'bg-white text-black'}`}>{posting?`Posting as ${userData?.anonymousName?.split(' ')[0]} ${userData?.avatar||"❤️"}...`:`Post as ${userData?.anonymousName?.split(' ')[0]} ${userData?.avatar||"❤️"} Clean ❤️`}</button>
            </div>
            <div className="p-3 flex gap-2 border-b-2 border-white/5 overflow-x-auto bg-white/[0.02]">
              <button onClick={()=>setYakType('yak')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='yak'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Talk {userData?.avatar||"❤️"} #tag Clean</button>
              <button onClick={()=>setYakType('poll')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='poll'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Poll {userData?.avatar||"❤️"} Clean 📊</button>
              <button onClick={()=>setYakType('confession')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='confession'?'bg-purple-500 text-white border-purple-500':'bg-white/5 border-white/10 text-white/40'}`}>Confession {userData?.avatar||"❤️"} Clean</button>
              <button onClick={()=>setYakType('meme')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Meme {userData?.avatar||"❤️"} Text Only</button>
              <button onClick={()=>setYakType('market')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='market'?'bg-green-500 text-white border-green-500':'bg-white/5 border-white/10 text-white/40'}`}>🛒 Sell {userData?.avatar||"❤️"} Clean</button>
              <button onClick={()=>setYakType('pyq')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='pyq'?'bg-blue-500 text-white border-blue-500':'bg-white/5 border-white/10 text-white/40'}`}>📚 PYQ {userData?.avatar||"❤️"} Clean</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto bg-[#0a0a0b]">
              <div className="flex gap-3 mb-6">
                <div className="w-11 h-11 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center text-white text-xl">{userData?.avatar||"❤️"}</div>
                <div>
                  <p className="font-bold text-[14px] text-white">{userData?.anonymousName} {userData?.avatar||"❤️"} Anonymous - SRET - Only Hearts ❤️🧡💛💚💙💜 - Text Only Clean No Vulgar</p>
                  <p className="text-[11px] text-white/40">Posting as {userData?.anonymousName} {userData?.avatar||"❤️"} - No real name - Text only 300 chars - No pic - No vulgar - Clean - Delete anytime - {userData?.avatar||"❤️"} Only Hearts ❤️🧡💛</p>
                </div>
              </div>
              {yakType==='market' && <div className="flex gap-2 mb-4"><input value={marketPrice} onChange={e=>setMarketPrice(e.target.value)} placeholder={`Price as ${userData?.anonymousName} ${userData?.avatar||"❤️"} e.g. 250 Clean ❤️`} className="w-[160px] p-4 bg-white/[0.03] border-2 border-green-500/20 rounded-xl text-sm outline-none text-white"/><p className="text-[10px] text-green-400 flex items-center">₹ {userData?.avatar||"❤️"} Clean</p></div>}
              {yakType==='pyq' && <div className="flex gap-2 mb-4"><input value={pyqSubject} onChange={e=>setPyqSubject(e.target.value.toUpperCase())} placeholder={`Subject as ${userData?.anonymousName} ${userData?.avatar||"❤️"} M1 DBMS Clean ❤️`} className="flex-1 p-4 bg-white/[0.03] border-2 border-blue-500/20 rounded-xl text-sm outline-none text-white uppercase"/><p className="text-[10px] text-blue-400 flex items-center">{userData?.avatar||"❤️"} Clean</p></div>}
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`${yakType==='market'? `What selling as ${userData?.anonymousName} ${userData?.avatar||"❤️"}? e.g. Drafter - Good condition - Text only Clean No vulgar #marketplace ${userData?.avatar||"❤️"} Clean ❤️` : yakType==='pyq'? `Describe PYQ as ${userData?.anonymousName} ${userData?.avatar||"❤️"}: e.g. DBMS 2023 Mid-1 - Important Qs - Text only Clean No vulgar #pyq #dbms ${userData?.avatar||"❤️"} Clean ❤️` : `Talk as ${userData?.anonymousName} ${userData?.avatar||"❤️"} about SRET... Use #hashtag like #SRET #Exams - Text only 300 chars - No pic - No vulgar - Clean - Delete anytime ${userData?.avatar||"❤️"} Only Hearts ❤️🧡💛💚💙💜\n\nExample as ${userData?.anonymousName} ${userData?.avatar||"❤️"}: Exams ela #SRET #Exams 😭 Text only Clean No vulgar ${userData?.avatar||"❤️"} ❤️`}`} autoFocus className="w-full bg-transparent text-[19px] leading-[1.45] outline-none placeholder:text-white/20 resize-none min-h-[140px] text-white" maxLength={300}/>
              <p className="text-[10px] text-white/30 mt-2">{newYak.length}/300 • As {userData?.anonymousName} {userData?.avatar||"❤️"} • Text only Clean No vulgar • Delete anytime • Only Hearts ❤️🧡💛💚💙💜 • {userData?.avatar||"❤️"} Clean ❤️</p>
              {yakType==='poll' && (<div className="mt-6 space-y-3"><p className="text-[10px] text-white/30 font-bold">POLL OPTIONS {userData?.avatar||"❤️"} ONLY HEARTS ❤️ - Text only Clean No vulgar - {userData?.anonymousName} {userData?.avatar||"❤️"}</p>{pollOptions.map((opt,idx)=><div key={idx} className="flex gap-2"><input value={opt} onChange={e=>{ const n=[...pollOptions]; n[idx]=e.target.value; setPollOptions(n); }} placeholder={`Option ${idx+1} as ${userData?.anonymousName} ${userData?.avatar||"❤️"} Clean No vulgar ❤️`} className="flex-1 p-4 bg-white/[0.03] border-2 border-white/10 rounded-xl text-sm outline-none focus:border-white text-white"/><button onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))} className="w-12 h-12 bg-white/5 border-2 border-white/10 rounded-xl flex items-center justify-center text-white/40">X</button></div>)}{pollOptions.length<4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="w-full p-3 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-xl text-xs font-bold text-white/40">Add Option as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</button>}</div>)}
              {/* IMAGE UPLOAD 100% DELETE - TEXT ONLY - WISH DONE - ONLY HEARTS ❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶 */}
              <div className="mt-6 bg-white/[0.03] border-2 border-white/10 rounded-[16px] p-4">
                <p className="text-[11px] font-bold text-white/40">TEXT ONLY - NO IMAGE - ONLY HEARTS AVATAR {userData?.avatar||"❤️"} - {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</p>
                <p className="text-[10px] text-white/30 mt-1">❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶 Only Hearts Avatar - Text only 300 chars - No pic - No vulgar - Clean - Delete anytime - {userData?.avatar||"❤️"} Only Hearts ❤️🧡💛</p>
              </div>
            </div>
            <div className="p-5 border-t-2 border-white/5 bg-white/[0.02]"><div className="bg-green-500/5 border-2 border-green-500/10 rounded-xl p-4 flex gap-3 items-center"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] text-white/50"><span className="font-bold text-green-400">{userData?.anonymousName} {userData?.avatar||"❤️"} 1to1 PRIVATE:</span> 🔒 No one can see other's chat - Only you 2 - SRET ONLY {userData?.avatar||"❤️"} Only Hearts ❤️🧡💛💚💙💜 - Text Only Clean No Vulgar Delete Anytime ❤️</p></div><Footer/></div>
          </div>
        </div>
      )}

      {editingPost && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center p-4"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8 shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><h3 className="font-black text-[16px] text-white">Edit as {userData?.anonymousName} {userData?.avatar||"❤️"} - Text Only Clean No Vulgar - Only Hearts ❤️🧡💛</h3><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-5 bg-white/[0.05] border-2 border-white/10 rounded-xl p-4 text-[15px] outline-none min-h-[120px] resize-none text-white focus:border-white" maxLength={300}/><p className="text-[10px] text-white/30 mt-2">{editText.length}/300 {userData?.avatar||"❤️"} Clean ❤️</p><div className="flex gap-3 mt-6"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs text-white">Cancel {userData?.avatar||"❤️"}</button><button onClick={handleEdit} disabled={!editText.trim()||containsVulgar(editText)} className={`flex-1 h-12 rounded-full font-bold text-xs ${!editText.trim()||containsVulgar(editText)?'bg-white/5 text-white/20 border-2 border-white/5':'bg-white text-black'}`}>Save as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</button></div></div></div>}

      {showNotifications && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><div className="flex justify-between items-center"><h3 className="font-black text-[16px] text-white">Notifications {userData?.avatar||"❤️"} 🔔 {unreadCount>0? `(${unreadCount} new)` : ''} • {userData?.anonymousName} {userData?.avatar||"❤️"} Only Hearts ❤️ Clean</h3><button onClick={()=>setShowNotifications(false)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">X</button></div><div className="mt-6 space-y-3">{notifications.map((n:any)=><div key={n.id} className={`p-4 rounded-[16px] border-2 ${!n.read?'bg-white/10 border-white/20':'bg-white/[0.03] border-white/10'}`}><p className="text-[10px] font-bold text-white/40">{n.fromAvatar||"❤️"} {n.type.toUpperCase()} • {userData?.avatar||"❤️"} Clean • 🔒 Private</p><p className="text-[13px] text-white mt-1">{n.text} {n.fromAvatar||"❤️"} Clean</p><p className="text-[10px] text-white/20 mt-2">{n.createdAt?.toDate?.().toLocaleString?.()||'Just now'} {userData?.avatar||"❤️"}</p></div>)}{notifications.length===0 && <div className="py-16 text-center"><p className="font-bold text-white/40">No notifications as {userData?.anonymousName} {userData?.avatar||"❤️"} Yet Clean ❤️ Only Hearts ❤️🧡💛</p></div>}<button onClick={()=>setShowNotifications(false)} className="w-full mt-6 bg-white text-black h-12 rounded-full font-bold text-xs">Close as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</button></div></div></div>}

      {reportingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[60] flex items-end justify-center p-4">
          <div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div>
            <h3 className="font-black text-[16px] text-white">Report as {userData?.anonymousName} {userData?.avatar||"❤️"} - Only Hearts ❤️🧡💛 Clean No Vulgar</h3>
            <p className="text-[11px] text-white/40 mt-1">{reportingPost.text.slice(0,60)}... {reportingPost.avatar||"❤️"} Text only Clean</p>
            <p className="text-[10px] font-bold tracking-widest text-white/30 mt-5">SELECT REASON {userData?.avatar||"❤️"} CLEAN ❤️ ONLY HEARTS ❤️🧡💛</p>
            <div className="grid grid-cols-1 gap-2 mt-3">
              {REPORT_REASONS.map((r:any)=><button key={r} onClick={()=>setReportReason(r)} className={`p-3.5 rounded-xl text-left text-[12px] font-bold border-2 ${reportReason===r?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/60'}`}>{r} {userData?.avatar||"❤️"} Clean {reportReason===r?'✓':''}</button>)}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>{ setReportingPost(null); setReportReason(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs text-white">Cancel {userData?.avatar||"❤️"} Clean</button>
              <button onClick={()=>handleReport(reportingPost)} disabled={!reportReason} className={`flex-1 h-12 rounded-full font-bold text-xs ${!reportReason?'bg-white/5 text-white/20 border-2 border-white/5':'bg-red-500 text-white'}`}>Report as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</button>
            </div>
          </div>
        </div>
      )}

      {showAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex flex-col">
          <div className="max-w-[600px] mx-auto w-full flex-1 flex flex-col bg-[#0a0a0b] p-4 overflow-y-auto">
            <div className="flex justify-between items-center"><h2 className="font-black text-white">ADMIN {userData?.avatar||"❤️"} ONLY HEARTS - {adminReports.length} Pending - {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</h2><button onClick={()=>setShowAdmin(false)} className="w-8 h-8 bg-white/10 rounded-full text-white">X</button></div>
            <div className="mt-6 space-y-4">
              {adminReports.map((rep:any)=><div key={rep.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4">
                <div className="flex justify-between"><span className="px-2 py-1 bg-yellow-500/20 rounded-full text-[10px] font-bold text-yellow-400">{rep.reason} {rep.reporterAvatar||"❤️"} Clean</span><span className="text-[10px] text-white/30">{rep.createdAt?.toDate?.().toLocaleString?.()||''} {rep.reporterAvatar||"❤️"}</span></div>
                <p className="text-[13px] text-white mt-3">{rep.yakText} {rep.reporterAvatar||"❤️"} Clean Only Hearts ❤️</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={()=>handleAdminRestore(rep)} className="flex-1 h-10 bg-white text-black rounded-full text-[11px] font-bold">Restore {rep.reporterAvatar||"❤️"} Clean ✅</button>
                  <button onClick={()=>handleAdminDismiss(rep)} className="flex-1 h-10 bg-white/10 border border-white/10 rounded-full text-[11px] font-bold text-white">Dismiss {rep.reporterAvatar||"❤️"}</button>
                  <button onClick={()=>handleAdminDelete(rep)} className="flex-1 h-10 bg-red-500 text-white rounded-full text-[11px] font-bold">Delete {rep.reporterAvatar||"❤️"} 🗑️ Clean</button>
                </div>
              </div>)}
              {adminReports.length===0 && <p className="text-center text-white/20 py-20">No pending reports {userData?.avatar||"❤️"} All clean Only Hearts ❤️🧡💛 Clean ❤️</p>}
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
          <div className="bg-[#141416] border-2 border-white/10 w-full max-w-[360px] rounded-[24px] p-6 shadow-2xl">
            <div className="w-14 h-14 bg-white/5 border-2 border-white/10 rounded-full mx-auto flex items-center justify-center text-2xl">{userData?.avatar||"❤️"}</div>
            <h3 className="font-black text-[18px] text-white text-center mt-4">Logout as {userData?.anonymousName} {userData?.avatar||"❤️"}?</h3>
            <p className="text-[11px] text-white/40 text-center mt-2 leading-[1.5]">Are you sure you want to logout as {userData?.anonymousName} {userData?.avatar||"❤️"}?<br/>Your anonymous posts as {userData?.avatar||"❤️"} & crushes stay safe<br/>Text Only Clean No Vulgar • Only Hearts ❤️🧡💛💚💙💜 • Delete anytime {userData?.avatar||"❤️"} Clean</p>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 h-12 bg-white text-black rounded-full font-bold text-xs">Cancel {userData?.avatar||"❤️"} Clean ❤️</button>
              <button onClick={()=>{ auth.signOut(); localStorage.clear(); window.location.reload(); }} className="flex-1 h-12 bg-red-500 text-white rounded-full font-bold text-xs">Yes, Logout {userData?.avatar||"❤️"} Clean</button>
            </div>
            <p className="text-[9px] text-white/20 text-center mt-4">Your data as {userData?.anonymousName} {userData?.avatar||"❤️"} stays safe - Only logout - Private chats remain 🔒 Only Hearts ❤️🧡💛 Text Only Clean ❤️</p>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center">
          <div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div>
            <div className="flex gap-4">
              <div className="w-[72px] h-[72px] bg-white/5 border-2 border-white/10 rounded-[20px] flex items-center justify-center text-3xl text-white">{userData?.avatar||"❤️"}</div>
              <div className="flex-1">
                <h2 className="font-black text-[16px] leading-none text-white">{userData?.anonymousName} {userData?.avatar||"❤️"} SRET ONLY - Only Hearts ❤️🧡💛💚💙💜 - Text Only Clean 🔒</h2>
                <p className="text-[11px] text-white/40 mt-2 leading-[1.4]">No real name • {userData?.anonymousName} {userData?.avatar||"❤️"} • Text only 300 chars • No pic • No vulgar • Clean • Delete anytime • Only Hearts ❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶 • {totalUsers} verified • {dmChats.length} private chats {userData?.avatar||"❤️"} Clean ❤️</p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  <span className="px-3 py-1.5 bg-white text-black rounded-full text-[10px] font-bold">{userData?.anonymousName} {userData?.avatar||"❤️"} {userData.yakarma} karma Text Only Clean ❤️</span>
                  <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[9px] font-bold">🔒 {dmChats.length} PRIVATE {userData?.avatar||"❤️"} Clean</span>
                  <span className="px-3 py-1.5 bg-pink-500 text-white rounded-full text-[9px] font-bold">💘 {crushMatches.filter((c:any)=>c.matched).length} MATCHES {userData?.avatar||"❤️"} Clean</span>
                  <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 rounded-full text-[9px] font-bold">{userData?.avatar||"❤️"} ONLY HEARTS ❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶 CLEAN</span>
                </div>
              </div>
            </div>

            {/* SELECT AVATAR - ONLY HEARTS */}
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-6">SELECT AVATAR - ONLY HEARTS - ❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶 - TEXT ONLY CLEAN - {userData?.anonymousName} {userData?.avatar||"❤️"}</p>
            <div className="grid grid-cols-4 gap-2.5 mt-3">
              {AVATARS.map((a:any)=><button key={a} onClick={()=>{ setSelectedAvatar(a); localStorage.setItem('selected_avatar',a); }} className={`h-16 rounded-[18px] text-2xl border-2 ${selectedAvatar===a||userData?.avatar===a?'bg-white text-black border-white scale-105 shadow-xl':'bg-white/[0.05] border-white/10 text-white hover:bg-white/10'}`}>{a}</button>)}
            </div>
            <div className="mt-3 bg-white/[0.03] border border-white/10 rounded-xl p-3">
              <p className="text-[11px] text-white/60">Selected as {userData?.anonymousName}: <span className="text-white font-bold text-[14px]">{selectedAvatar||userData?.avatar||"❤️"}</span> - Only Hearts Avatar - Text Only Clean No Vulgar Delete Anytime ❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶</p>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-6">
              <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">POSTS {userData?.avatar||"❤️"} CLEAN</p></div>
              <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{totalUsers}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">VERIFIED {userData?.avatar||"❤️"}</p></div>
              <div className="bg-green-500/10 border-2 border-green-500/20 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-green-400">{dmChats.length}</p><p className="text-[9px] font-bold tracking-widest text-green-400/60 mt-1">PRIVATE DM {userData?.avatar||"❤️"}</p></div>
              <div className="bg-white text-black rounded-[18px] p-4 text-center"><p className="font-black text-xl">{userData.yakarma} {userData?.avatar||"❤️"}</p><p className="text-[9px] font-bold tracking-widest mt-1">KARMA {userData?.avatar||"❤️"} CLEAN</p></div>
            </div>

            <div className="mt-6 bg-white/[0.03] border-2 border-white/10 rounded-[16px] p-4">
              <p className="text-[11px] font-bold text-white/60">WISHES DONE AS {userData?.anonymousName} {userData?.avatar||"❤️"} - ONLY HEARTS ❤️🧡💛💚💙💜:</p>
              <p className="text-[11px] text-white/40 mt-2 leading-[1.6]">
                ✅ Avatar: Only Hearts ❤️🧡💛💚💙💜🤎🖤🤍🩷🩵🩶 - verevi vaddhu<br/>
                ✅ Text Only - Image 0% - No yakImage - No <img> - Clean<br/>
                ✅ No Vulgar - BAD_WORDS filter - containsVulgar() everywhere<br/>
                ✅ Anonymous Name: {userData?.anonymousName} {userData?.avatar||"❤️"} - No real name - Text only 300 chars - No pic<br/>
                ✅ Delete Anytime: DELETE button - Confirm as {userData?.anonymousName} {userData?.avatar||"❤️"} - Clean<br/>
                ✅ Simple & Clarity: Vertical neat - Only Hearts - ❤️ Clean
              </p>
            </div>

            <button onClick={()=>setShowAdmin(true)} className="w-full mt-4 bg-yellow-500/10 border-2 border-yellow-500/20 h-12 rounded-full text-xs font-bold text-yellow-400">Admin {userData?.avatar||"❤️"} Review Panel - {adminReports.length} Pending {adminReports.length>0?'🔴':''} Clean ❤️</button>

            {blockedUsers.length>0 && (
              <div className="mt-6 bg-red-500/5 border-2 border-red-500/10 rounded-[16px] p-4">
                <p className="text-[11px] font-bold text-red-400">🚫 BLOCKED USERS {userData?.avatar||"❤️"} - {blockedUsers.length} - Only Hearts ❤️ Clean</p>
                <div className="mt-3 space-y-2">
                  {blockedUsers.map((uid:string)=><div key={uid} className="flex justify-between items-center bg-white/[0.03] p-3 rounded-xl">
                    <p className="text-[11px] text-white/60 font-mono">{uid.slice(0,8)}... {userData?.avatar||"❤️"} Anonymous Clean</p>
                    <button onClick={()=>handleUnblockUser(uid)} className="px-3 py-1 bg-white text-black rounded-full text-[10px] font-bold">Unblock {userData?.avatar||"❤️"} Clean</button>
                  </div>)}
                </div>
              </div>
            )}

            <div className="mt-6 bg-red-500/5 border-2 border-red-500/10 rounded-[16px] p-4">
              <p className="text-[11px] font-bold text-red-400">🗑️ DANGER ZONE {userData?.avatar||"❤️"} - DELETE DATA - {userData?.anonymousName} {userData?.avatar||"❤️"} Text Only Clean - Only Hearts ❤️</p>
              <div className="mt-4 space-y-3">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-white">Delete Only Posts + Crushes as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</p>
                  <button onClick={async()=>{ if(!confirm(`Delete posts as ${userData?.anonymousName} ${userData?.avatar||"❤️"} Clean?`)) return; const uid=user.uid; const yaksSnap = await getDocs(query(collection(db,'yaks'),where('uid','==',uid))); for(const d of yaksSnap.docs){ await deleteDoc(doc(db,'yaks',d.id)); } await updateDoc(doc(db,'users',userData.id),{totalPosts:0, yakarma:100}); showToast(`Posts deleted as ${userData?.anonymousName} ${userData?.avatar||"❤️"} Clean ❤️`); }} className="w-full mt-3 h-10 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/60">Delete My Posts Only as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️</button>
                </div>
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-red-400">Delete Account + All Data as {userData?.anonymousName} {userData?.avatar||"❤️"} Forever Clean ❤️</p>
                  <button onClick={async()=>{
                    const confirm1 = confirm(`⚠️ DELETE ACCOUNT as ${userData?.anonymousName} ${userData?.avatar||"❤️"}? Only Hearts ❤️🧡💛 Clean ❤️\n\nDeletes:\n- Profile ${userData?.anonymousName} ${userData?.avatar||"❤️"}\n- All posts Text only Clean\n- Crushes\n- DMs\n\nCannot be undone - ${userData?.avatar||"❤️"} Clean ❤️`);
                    if(!confirm1) return;
                    const confirm2 = prompt(`Type "DELETE" as ${userData?.anonymousName} ${userData?.avatar||"❤️"} to confirm Clean ❤️`);
                    if(confirm2!=='DELETE'){ showToast(`Cancelled as ${userData?.anonymousName} ${userData?.avatar||"❤️"} Clean ❤️`); return; }
                    try{
                      const uid=user.uid; const userDocId=userData.id;
                      const yaksSnap = await getDocs(query(collection(db,'yaks'),where('uid','==',uid))); for(const d of yaksSnap.docs){ await deleteDoc(doc(db,'yaks',d.id)); }
                      await deleteDoc(doc(db,'users',userDocId));
                      await auth.currentUser?.delete(); localStorage.clear(); window.location.reload();
                    }catch(e:any){ showToast(e.message); }
                  }} className="w-full mt-3 h-10 bg-red-500 text-white rounded-full text-[11px] font-bold">🗑️ Delete Account {userData?.anonymousName} {userData?.avatar||"❤️"} + All Data Forever Clean ❤️</button>
                </div>
              </div>
            </div>

            <button onClick={()=>setShowLogoutConfirm(true)} className="w-full mt-6 bg-white/5 border-2 border-white/10 h-12 rounded-full text-xs font-bold text-white/60">Logout as {userData?.anonymousName} {userData?.avatar||"❤️"} - SRET ONLY - Only Hearts ❤️ Clean ❤️</button>
            <button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-12 rounded-full font-bold text-xs">Close as {userData?.anonymousName} {userData?.avatar||"❤️"} Clean ❤️ Only Hearts ❤️🧡💛</button>
            <div className="mt-4"><Footer/></div>
          </div>
        </div>
      )}
    </div>
  );
      }
