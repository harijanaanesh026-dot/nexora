import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
const AVATARS = ["❤️","🩶","💛","🖤","🩵","💜","💙","🩷","💚","💝","🤎","🤍"];
const ANON_NAMES = ["Anonymous Owl","Secret Tiger","Hidden Fox","Silent Panda","Ghost User","Shadow Yak"];
const BAD_WORDS = ["fuck","sex","porn","xxx","boobs","pussy","dick","cock","nude","slut","bitch","asshole","rape","gaand","gandu","loda","chod","chutiya","lund","randi","bsdk","bhosdike","mc","bc"];
const containsVulgar = (text:string) => { if(!text) return false; const lower=text.toLowerCase(); return BAD_WORDS.some(w=>lower.includes(w)); };
const Footer = () => (<div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.3em] font-bold text-white/40">© 2026 Dabean. A production by ANESH</p></div>);

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
  const [collegeAlertsList, setCollegeAlertsList] = useState<any[]>([]);
  const [showCollegeAlertAdmin, setShowCollegeAlertAdmin] = useState(false);
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertDesc, setNewAlertDesc] = useState('');
  const [newAlertType, setNewAlertType] = useState('ExamAlert');
  const [pushEnabled, setPushEnabled] = useState(false);

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
          await addDoc(collection(db,'users'),{uid:u.uid,email:u.email||'',username:anonName,anonymousName:anonName,avatar:localStorage.getItem('selected_avatar')||'👻',college:"SRET",collegeEmail:String(localStorage.getItem('college_email')||''),rollNumber:String(localStorage.getItem('roll_number')||''),isAnonymous:true,isTextOnly:true,isClean:true,yakarma:100,totalPosts:0,likedPosts:[],dislikedPosts:[],pollVoted:[],reportedPosts:[],blockedUsers:[],crushList:[],createdAt:serverTimestamp()});
          window.location.reload();
        }else{ setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen('feed'); }
      }else setScreen('college');
    });
  },[isVerified]);

  useEffect(()=>{ if(userData?.blockedUsers) setBlockedUsers(userData.blockedUsers); },[userData]);
  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(collection(db,'yaks'), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((d:any)=>!d.hidden).filter((d:any)=>!containsVulgar(d.text));
      const data=all.filter(d=>d.college==="SRET" ||!d.college);
      data.sort((a,b)=> (b.createdAt?.toMillis?.()||b.createdAt?.seconds*1000||0) - (a.createdAt?.toMillis?.()||a.createdAt?.seconds*1000||0));
      setYaks(data);
      setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
      setMemeYaks([...data].filter(d=>d.type==='meme').slice(0,20));
      setMarketYaks([...data].filter(d=>d.type==='market').slice(0,30));
      setPyqYaks([...data].filter(d=>d.type==='pyq').slice(0,30));
      const tagCount:Record<string,number>={}; data.forEach(y=>{ const tags=y.text?.match(/#\w+/g); if(tags) tags.forEach((t:string)=>{ tagCount[t.toLowerCase()]=(tagCount[t.toLowerCase()]||0)+1; }); }); setHashtags(Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([tag,count])=>({tag,count})));
    });
  },[userData]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'users'), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)); const same=all.filter(u=>u.college==="SRET"||!u.college); setLeaderboard(same.sort((a,b)=>b.yakarma-a.yakarma).slice(0,20)); }); },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((c:any)=>!containsVulgar(c.text)))); },[activePost]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'notifications'),where('toUid','==',user.uid),orderBy('createdAt','desc')), s=>{ const nots=s.docs.map(d=>({id:d.id,...d.data()})); setNotifications(nots as any); setUnreadCount((nots as any).filter((n:any)=>!n.read).length); }); },[user]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'dms'),where('participants','array-contains',user.uid)), s=>{ const chats=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((c:any)=> c.participants.length===2); chats.sort((a:any,b:any)=>(b.lastMessageAt?.toMillis?.()||0)-(a.lastMessageAt?.toMillis?.()||0)); setDmChats(chats as any); }); },[user]);
  useEffect(()=>{ if(!activeDm) return; return onSnapshot(query(collection(db,'dms/'+activeDm.id+'/messages'),orderBy('createdAt','asc')), s=>setDmMessages(s.docs.map(d=>({id:d.id,...d.data()})))); },[activeDm]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'crushes'),where('fromUid','==',user.uid)), s=>setCrushMatches(s.docs.map(d=>({id:d.id,...d.data()})))); },[user]);
  useEffect(()=>{ if(!userData) return; return onSnapshot(query(collection(db,'reports'),where('status','==','pending'),orderBy('createdAt','desc')), s=>setAdminReports(s.docs.map(d=>({id:d.id,...d.data()})))); },[userData]);
  // COLLEGE ALERTS - CORRECT - NO INDEX NEEDED - FIXED
  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(collection(db,'college_alerts'), s=>{
      const all = s.docs.map(d=>({id:d.id,...d.data()} as any))
     .filter((a:any)=> a.college==="SRET")
     .filter((a:any)=>!containsVulgar(a.title||'') &&!containsVulgar(a.desc||''))
     .sort((a:any,b:any)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      setCollegeAlertsList(all);
    });
  },[userData]);
  // PUSH NOTIFICATION - CORRECT - FIXED
  useEffect(()=>{
    if(!user?.uid ||!userData) return;
    const setupPush = async()=>{
      try{
        if(typeof window==='undefined' ||!('Notification' in window)) return;
        const perm = await Notification.requestPermission();
        if(perm==='granted'){
          const messaging = getMessaging(app);
          const token = await getToken(messaging, {vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Iev-5oWq-fpYh-3sX9oXq-3sX9o'});
          if(token){
            setPushEnabled(true);
            await updateDoc(doc(db,'users',userData.id),{fcmToken:token, pushEnabled:true}).catch(()=>{});
            await setDoc(doc(db,'fcm_tokens',user.uid),{uid:user.uid,token,college:"SRET",createdAt:serverTimestamp()}).catch(()=>{});
          }
        }
        const messaging = getMessaging(app);
        onMessage(messaging, (payload)=>{ showToast(`🔔 ${payload.notification?.title}: ${payload.notification?.body}`); });
      }catch(e){ console.log("Push error",e); }
    };
    setupPush();
  },[user, userData]);

  const getCollegeConfig=()=>COLLEGES.find(c=>c.id==="SRET");
  const handleCollegeNext=()=>{ localStorage.setItem('selected_college',"SRET"); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const emailLower=collegeEmail.toLowerCase().trim(); if(!config.domains.some(d=>emailLower.endsWith(d))){ setVerifyError(`Only ${config.domains.join(' or ')} allowed`); return; } const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower))); if(!dup.empty){ setVerifyError('Email already used'); return; } const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode); await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()}); setOtpSent(true); showToast("OTP: "+otpCode); };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const rollUpper=rollNumber.trim().toUpperCase(); if(!config.pattern.test(rollUpper)){ setVerifyError(`Invalid Roll - Ex: ${config.ex}`); return; } const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper))); if(!dup.empty){ setVerifyError('Roll already used'); return; } localStorage.setItem('roll_number',rollUpper); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };

  const postCollegeAlert = async()=>{
    if(!newAlertTitle.trim() ||!newAlertDesc.trim()){ showToast("Title + Desc pettali"); return; }
    if(containsVulgar(newAlertTitle) || containsVulgar(newAlertDesc)){ showToast("Vulgar not allowed"); return; }
    if(!user?.uid){ showToast("Login ledu"); return; }
    try{
      const ref = await addDoc(collection(db,'college_alerts'),{
        title:newAlertTitle.trim(), desc:newAlertDesc.trim(), type:newAlertType,
        college:"SRET", createdBy:user.uid, isOfficial:true, createdAt:serverTimestamp()
      });
      setNewAlertTitle(''); setNewAlertDesc(''); setShowCollegeAlertAdmin(false);
      showToast("College Alert Posted 🔔 "+ref.id);
    }catch(e:any){
      showToast("Fail: "+e.message); alert("Error: "+e.message+"\nRules lo college_alerts allow chey - Nenu ichina rules paste chey");
    }
  };

  if(screen==='college'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style><div className="max-w-md mx-auto p-6 min-h-screen"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">🏫</div><div><p className="font-black text-sm">SRET ANON 🏫 OFFICIAL</p><p className="text-[10px] text-white/40">{totalUsers} verified • {collegeAlertsList.length} alerts</p></div></div><h1 className="text-[36px] font-black mt-8 leading-[0.9]">Talk<br/>Beyond<br/><span className="text-white/30">Identity</span></h1><p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">SELECT AVATAR</p><div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/[0.05] border-white/10'}`}>{a}</button>)}</div><div className="mt-8 w-full p-4 rounded-[18px] border-2 bg-white text-black border-white flex justify-between"><div><p className="font-bold text-[13px]">SRET - Tirupati 🏫 OFFICIAL</p><p className="text-[11px] text-black/60">{collegeCounts["SRET"]||0} verified</p></div><div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">✓</div></div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black bg-white text-black">Enter SRET 🏫</button><Footer/></div></div>);
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><div className="max-w-md mx-auto p-6 min-h-screen"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full">←</button><div className="mt-6 bg-white/[0.05] border border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold text-white/30">{collegeCounts["SRET"]||0} ANONYMOUS IN SRET 🏫</p><h2 className="font-black text-[18px] mt-1">Verify SRET Student</h2></div><div className="flex p-1 bg-white/5 border border-white/10 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>College Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll Number</button></div>{verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3.5 rounded-xl">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl text-sm text-white"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Send OTP</button>{otpSent&&<div className="mt-4 bg-black/30 border-2 border-white/10 rounded-xl p-4"><p className="text-xs text-emerald-400 font-bold">OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full mt-3 p-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-center tracking-[0.3em] text-white"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold">Verify</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={`${config?.ex}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase font-bold text-white"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold">Verify Roll</button></div>}<Footer/></div></div>);
  }
  if(screen==='login'){
    return (<div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border-2 border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] flex items-center justify-center text-4xl">{selectedAvatar}</div><h1 className="font-black mt-6 text-center text-xl">Anonymous Ready 🏫</h1><button onClick={handleGoogleLogin} className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold">Continue as Anonymous</button></div><Footer/></div>);
  }

  const createNotification=async(toUid:string, type:string, text:string, yakId?:string)=>{ if(toUid===user?.uid) return; await addDoc(collection(db,'notifications'),{toUid, fromUid:user?.uid, fromUsername:"Anonymous", type, text, yakId:yakId||null, read:false, createdAt:serverTimestamp()}); };
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
  const handlePollVote=async(y:any, idx:number)=>{ if(!userData) return; if(userData.pollVoted?.includes(y.id)){ showToast("Already voted"); return; } try{ const n=[...y.pollOptions]; n[idx].votes=(n[idx].votes||0)+1; await updateDoc(doc(db,'yaks',y.id),{pollOptions:n, totalVotes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{pollVoted:arrayUnion(y.id)}); setUserData({...userData, pollVoted:[...(userData.pollVoted||[]), y.id]}); }catch(e:any){ showToast(e.message); } };
  const handlePost=async()=>{
    if(!newYak.trim()){ showToast("Type something"); return; }
    if(containsVulgar(newYak)){ showToast("Vulgar not allowed"); return; }
    if(yakType==='poll' && pollOptions.filter(o=>o.trim()).length<2){ showToast("Need 2 options"); return; }
    if(yakType==='market' &&!marketPrice.trim()){ showToast("Enter price"); return; }
    if(yakType==='pyq' &&!pyqSubject.trim()){ showToast("Enter subject"); return; }
    if(!userData||!user||posting) return; setPosting(true);
    try{
      const payload:any={ text:newYak.trim(), uid:user.uid, username:"Anonymous - SRET", college:"SRET", type:yakType, likes:0, dislikes:0, commentsCount:0, reports:0, hidden:false, createdAt:serverTimestamp() };
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; }
      if(yakType==='market'){ payload.price=marketPrice; }
      if(yakType==='pyq'){ payload.subject=pyqSubject.toUpperCase(); }
      const hashtagsInText=newYak.match(/#\w+/g); if(hashtagsInText) payload.hashtags=hashtagsInText.map((h:string)=>h.toLowerCase());
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setPollOptions(['','']); setMarketPrice(''); setPyqSubject(''); setYakType('yak'); setScreen('feed'); showToast("Posted");
    }catch(e:any){ showToast(e.message); }finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(user?.uid!==y.uid) return; if(!confirm("Delete?")) return; try{ await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1)}); }catch(e:any){ showToast(e.message); } setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost) return; if(!editText.trim()) return; if(containsVulgar(editText)){ showToast("Vulgar not allowed"); return; } try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); }catch(e:any){ showToast(e.message); } setEditingPost(null); setEditText(''); setShowMenu(null); };
  const handleReport=async(y:any, reasonArg?:string)=>{ const finalReason=reasonArg||reportReason; if(!userData) return; if(userData.reportedPosts?.includes(y.id)){ showToast("Already reported"); setReportingPost(null); setShowMenu(null); return; } if(!finalReason){ showToast("Select reason"); return; } try{ await addDoc(collection(db,'reports'),{yakId:y.id, yakText:y.text.slice(0,200), yakUid:y.uid, reportedBy:user.uid, reason:finalReason, status:"pending", createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{reports:increment(1)}); await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)}); setUserData({...userData, reportedPosts:[...(userData.reportedPosts||[]), y.id]}); showToast("Reported"); setReportingPost(null); setReportReason(''); setShowMenu(null); }catch(e:any){ showToast(e.message); } };
  const buildTree = (flat:any[]) => { const map:Record<string, any> = {}; const roots:any[] = []; flat.forEach(c => { map[c.id] = {...c, replies: []}; }); flat.forEach(c => { if(c.parentId && map[c.parentId]){ map[c.parentId].replies.push(map[c.id]); } else { roots.push(map[c.id]); } }); return roots; };
  const handleCommentPost = async (yId:string) => {
    if(!commentText.trim() ||!user) return; if(containsVulgar(commentText)){ showToast("Vulgar not allowed"); return; }
    const payload:any = { text:commentText.trim(), uid: user.uid, username:"Anonymous - SRET", parentId: replyTo? replyTo.id : null, replyToUsername: replyTo? replyTo.username : null, createdAt: serverTimestamp() };
    setCommentText(''); const temp = replyTo; setReplyTo(null);
    try{ await addDoc(collection(db,'yaks/'+yId+'/comments'), payload); await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); }catch(e:any){ showToast(e.message); setCommentText(payload.text); setReplyTo(temp); }
  };
  const handleStartDm = async (otherUid:string, yakId?:string)=>{
    if(otherUid===user?.uid){ showToast("Can't DM yourself"); return; }
    if(blockedUsers.includes(otherUid)){ showToast("Blocked"); return; }
    const existing=dmChats.find(c=> c.participants.includes(otherUid) && c.participants.length===2);
    if(existing){ setActiveDm(existing); setFeedTab('dm'); return; }
    try{
      const newChat=await addDoc(collection(db,'dms'),{ participants:[user.uid, otherUid], lastMessage:"Started private chat - SRET ONLY", lastMessageAt:serverTimestamp(), createdAt:serverTimestamp(), isPrivate:true });
      setActiveDm({id:newChat.id, participants:[user.uid, otherUid], isPrivate:true});
      setFeedTab('dm');
    }catch(e:any){ showToast(e.message); }
  };
  const handleSendDm=async()=>{
    if(!dmText.trim()||!activeDm||!user) return; if(containsVulgar(dmText)){ showToast("Vulgar not allowed"); return; }
    setDmText('');
    try{
      await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{ text:dmText.trim(), uid:user.uid, username:"Anonymous - SRET", createdAt:serverTimestamp(), private:true });
      await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:dmText.trim(), lastMessageAt:serverTimestamp()});
    }catch(e:any){ showToast(e.message); }
  };
  const markNotificationsRead=async()=>{ try{ const batch=notifications.filter((n:any)=>!n.read); for(const n of batch){ await updateDoc(doc(db,'notifications',n.id),{read:true}); } }catch{} };
  const handleBlockUser=async(targetUid:string)=>{ if(!userData || targetUid===user?.uid) return; if(!confirm("Block?")) return; try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(targetUid)}); setBlockedUsers([...blockedUsers, targetUid]); setShowMenu(null); }catch(e:any){ showToast(e.message); } };
  const handleCrushSubmit=async()=>{ const roll=crushRoll.trim().toUpperCase(); if(!roll) return; try{ await addDoc(collection(db,'crushes'),{fromUid:user.uid, toRoll:roll, matched:false, createdAt:serverTimestamp()}); setCrushRoll(''); showToast("Crush added"); }catch(e:any){ showToast(e.message); } };

  const renderComment = (c:any, depth=0) => {
    const isReply = depth > 0;
    return (<div key={c.id} className={`${isReply? 'ml-6 border-l-2 border-white/15 pl-3' : ''} mt-3`}><div className="flex gap-2.5"><div className={`bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white shrink-0 ${isReply? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'}`}>🏫</div><div className="flex-1"><div className="bg-white/[0.05] border border-white/10 rounded-[14px] px-4 py-2.5"><p className="text-[10px] font-bold text-white/40">Anonymous - SRET</p><p className="text-[13px] text-white mt-1 whitespace-pre-wrap break-words">{c.text}</p></div><div className="flex gap-3 mt-1.5 ml-1"><button onClick={()=>setReplyTo(c)} className="text-[11px] font-bold text-white/30">Reply</button><button onClick={()=>handleStartDm(c.uid)} className="text-[11px] font-bold text-white/30">DM</button></div>{c.replies?.length>0 && <div className="mt-1">{c.replies.map((rep:any)=>renderComment(rep, depth+1))}</div>}</div></div></div>);
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm relative">S<span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[8px]">🏫</span></div>
            <div><p className="font-bold text-[13px] leading-none flex items-center gap-1">SRET ANON <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-[8px] px-1.5 py-0.5 rounded-full">OFFICIAL</span> 🏫</p><p className="text-[10px] text-white/40 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>{totalUsers} verified • {collegeAlertsList.length} alerts {pushEnabled?'🔔ON':'🔕OFF'}</p></div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={()=>setShowCollegeAlertAdmin(true)} className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center relative">🏫{collegeAlertsList.length>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold">{collegeAlertsList.length}</span>}</button>
            <button onClick={()=>{ setShowNotifications(true); markNotificationsRead(); }} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center relative">🔔{unreadCount>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">{unreadCount}</span>}</button>
            <button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center">🏫</button>
          </div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-2">
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search #hashtag - SRET ONLY" className="flex-1 h-9 bg-white/5 border border-white/10 rounded-full px-4 text-xs outline-none text-white placeholder:text-white/30" />
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2 overflow-x-auto">
          <button onClick={()=>setFeedTab('new')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='new'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>NEW {filteredYaks.length}</button>
          <button onClick={()=>setFeedTab('meme')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>MEME</button>
          <button onClick={()=>setFeedTab('hot')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='hot'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>HOT</button>
          <button onClick={()=>setFeedTab('top')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='top'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>TOP</button>
          <button onClick={()=>setFeedTab('crush')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='crush'?'bg-pink-500 text-white border-pink-500':'bg-white/5 border-white/10 text-white/40'}`}>💘 {crushMatches.length}</button>
          <button onClick={()=>setFeedTab('market')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='market'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🛒 {displayMarketYaks.length}</button>
          <button onClick={()=>setFeedTab('pyq')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='pyq'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>📚 {displayPyqYaks.length}</button>
          <button onClick={()=>setFeedTab('dm')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='dm'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🔒 DM {dmChats.length}</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        <div className="w-full bg-red-500/[0.08] border-2 border-red-500/20 rounded-[20px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">🏫</div>
            <span className="bg-red-600 text-white text-[9px] px-2 py-1 rounded-full animate-pulse font-black">LIVE OFFICIAL</span>
            <h2 className="font-black text-white text-[11px] tracking-widest">SRET COLLEGE ALERTS</h2>
            <span className="ml-auto flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${pushEnabled?'bg-green-500 animate-pulse':'bg-red-500'}`}></span><span className="text-[9px] text-white/30">{pushEnabled?'Push ON':'Push OFF'}</span></span>
            <button onClick={()=>setShowCollegeAlertAdmin(true)} className="text-[10px] bg-white text-black px-3 py-1 rounded-full font-bold">+ Alert</button>
          </div>
          {collegeAlertsList.slice(0,5).map((a:any)=><div key={a.id} className="mt-2 bg-black/60 border border-white/10 rounded-[14px] p-3"><div className="flex justify-between"><span className="text-red-400 text-[10px] font-black">🏫 #{a.type}</span><span className="text-white/20 text-[9px]">Official SRET</span></div><p className="text-white font-bold text-[13px] mt-1">{a.title}</p><p className="text-white/60 text-[11px] mt-1">{a.desc}</p></div>)}
          {collegeAlertsList.length===0 && <p className="text-white/30 text-[11px] mt-2">No alerts yet - Click + Alert to post - Text only clean - SRET ONLY 🏫 - Push work avuthundi</p>}
        </div>

        {hashtags.length>0 &&!['dm','top','crush','market','pyq'].includes(feedTab) && (
          <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">TRENDING HASHTAGS</p><div className="flex gap-2 mt-3 flex-wrap">{hashtags.map((h:any)=><button key={h.tag} onClick={()=>setSearchQuery(h.tag)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/60">{h.tag} {h.count}</button>)}</div></div>
        )}

        {feedTab==='top' && (<div className="space-y-3"><div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET TOP ANONYMOUS 🏫 OFFICIAL</p></div>{leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold">{i+1}</span><div><p className="font-bold text-[13px]">Anonymous {i+1} {i===0?'👑':''} 🏫</p><p className="text-[10px] text-white/40">{u.totalPosts||0} posts</p></div></div><p className="font-black text-sm">{u.yakarma}</p></div>)}<Footer/></div>)}

        {feedTab!=='top' && feedTab!=='crush' && feedTab!=='market' && feedTab!=='pyq' && feedTab!=='dm' && (
          <>
            {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : displayHotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const hasVoted=userData.pollVoted?.includes(y.id);
              return(
                <div key={y.id} className={`bg-white/[0.04] border-2 rounded-[20px] p-5 ${isOwn?'border-white/20 bg-white/[0.06]':'border-white/10'}`}>
                  <div className="flex justify-between items-start"><div className="flex gap-3"><div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm">👻</div><div><p className="font-bold text-[13px]">Anonymous - SRET 🏫 {isOwn? '- YOU' : ''}</p><p className="text-[10px] text-white/30">{score} • {y.hashtags?.join(' ')||''} {y.price? `• ₹${y.price}`:''} {y.subject? `• ${y.subject}`:''}</p></div></div><div className="relative flex gap-2"><button onClick={()=>handleStartDm(y.uid, y.id)} className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-full">🔒</button><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full">...</button>{showMenu===y.id && <div className="absolute right-0 top-10 w-[220px] bg-black border-2 border-white/10 rounded-2xl p-2 z-20">{isOwn? (<><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs bg-white/5">Edit</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-4 py-3 rounded-xl text-xs bg-red-500/10 text-red-400 mt-2">Delete</button></>) : (<><button onClick={()=>handleStartDm(y.uid, y.id)} className="w-full text-left px-4 py-3 rounded-xl text-xs bg-green-500/10 text-green-400">🔒 Private DM</button><button onClick={()=>{ setReportingPost(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs bg-white/5 text-white/60 mt-2">Report</button><button onClick={()=>handleBlockUser(y.uid)} className="w-full text-left px-4 py-3 rounded-xl text-xs bg-red-500/10 text-red-400 mt-2">Block</button></>)}<button onClick={()=>setShowMenu(null)} className="w-full mt-2 py-2 text-[11px] text-white/30">Cancel</button></div>}</div></div>
                  <p className="text-[15px] mt-4 whitespace-pre-wrap break-words">{y.text}</p>
                  {isPoll && y.pollOptions && (<div className="mt-4 bg-white/[0.03] border-2 border-white/10 rounded-[16px] p-4"><div className="space-y-2.5">{[...y.pollOptions].map((opt:any,idx:number)=><button key={idx} onClick={()=>handlePollVote(y,idx)} disabled={!!hasVoted} className="w-full rounded-xl border-2 border-white/10 text-left p-3"><div className="flex justify-between"><span className="text-[13px] font-bold">{opt.text}</span><span className="text-[12px]">{opt.votes||0} votes</span></div></button> )}</div></div>)}
                  <div className="flex gap-2.5 mt-5 items-center flex-wrap"><div className="flex bg-white/5 border border-white/10 rounded-full p-1"><button onClick={()=>handleVote(y,'up')} className={`px-4 py-2 rounded-full text-xs font-bold ${liked?'bg-white text-black':'text-white/40'}`}>Up {y.likes||0}</button><span className="px-3 py-2 text-[11px] font-black min-w-[36px] text-center text-white/20">{score}</span><button onClick={()=>handleVote(y,'down')} className={`px-4 py-2 rounded-full text-xs font-bold ${disliked?'bg-red-500 text-white':'text-white/30'}`}>Down {y.dislikes||0}</button></div><button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); setReplyTo(null); }} className="px-4 h-9 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">Comments {y.commentsCount||0}</button><button onClick={()=>handleStartDm(y.uid, y.id)} className="px-4 h-9 rounded-full text-xs bg-green-500/10 border border-green-500/20 text-green-400 font-bold">🔒 DM</button></div>
                  {activePost===y.id && (<div className="mt-5 border-t-2 border-white/10 pt-4"><div className="max-h-[420px] overflow-y-auto">{buildTree(comments).map((c:any)=>renderComment(c,0))}</div><div className="flex gap-2.5 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Anonymous comment" className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] text-white"/><button onClick={()=>handleCommentPost(y.id)} className="w-11 h-11 rounded-full bg-white text-black font-bold">Go</button></div></div>)}</div>
              );
            })}
            <Footer/>
          </>
        )}

        {feedTab==='crush' && <div className="space-y-3"><div className="bg-pink-500/10 border-2 border-pink-500/20 rounded-[20px] p-5"><h3 className="font-black">Secret Crush 💘</h3><div className="flex gap-2 mt-4"><input value={crushRoll} onChange={e=>setCrushRoll(e.target.value.toUpperCase())} placeholder="Roll" className="flex-1 bg-black/30 border-2 border-pink-500/20 rounded-full px-5 h-11 text-[13px] text-white"/><button onClick={handleCrushSubmit} className="px-6 h-11 bg-pink-500 text-white rounded-full font-bold text-xs">Add</button></div></div><Footer/></div>}
        {feedTab==='market' && <div className="space-y-3">{displayMarketYaks.map((y:any)=><div key={y.id} className="bg-white/[0.04] border-2 border-white/10 rounded-[20px] p-5"><p>{y.text}</p><p className="text-green-400">₹{y.price}</p></div>)}<Footer/></div>}
        {feedTab==='pyq' && <div className="space-y-3">{displayPyqYaks.map((y:any)=><div key={y.id} className="bg-white/[0.04] border-2 border-white/10 rounded-[20px] p-5"><p>{y.text} - {y.subject}</p></div>)}<Footer/></div>}
        {feedTab==='dm' && <div className="space-y-3"><div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><p className="font-bold">🔒 Private DMs - {dmChats.length}</p></div>{dmChats.map((c:any)=><div key={c.id} className="bg-white/[0.04] border-2 border-white/10 rounded-[18px] p-4"><p className="text-sm">{c.lastMessage}</p></div>)}<Footer/></div>}
      </div>

            <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-2xl border-t-2 border-white/10"><div className="max-w-[600px] mx-auto px-6 h-[72px] flex items-center justify-between"><button onClick={()=>{ setFeedTab('new'); setActiveDm(null); }} className="flex flex-col items-center gap-1.5"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/30 border border-white/10'}`}>S</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {yaks.length} 🏫</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[24px] font-black">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1.5"><div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs">P</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {userData?.yakarma||0}</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col overflow-hidden">
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full bg-[#0a0a0b]">
            <div className="p-5 flex items-center justify-between border-b-2 border-white/10"><button onClick={()=>{ if(!posting) { setScreen('feed'); } }} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full">X</button><p className="text-[11px] font-bold tracking-widest">PRIVATE DM 🔒 🏫 OFFICIAL</p><button onClick={handlePost} disabled={posting||!newYak.trim()} className={`px-6 h-10 rounded-full font-bold text-[13px] ${posting||!newYak.trim()?'bg-white/5 text-white/20':'bg-white text-black'}`}>{posting?'Posting...':'Post'}</button></div>
            <div className="p-3 flex gap-2 border-b-2 border-white/5 overflow-x-auto">
              <button onClick={()=>setYakType('yak')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 ${yakType==='yak'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>Talk</button>
              <button onClick={()=>setYakType('poll')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 ${yakType==='poll'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>Poll</button>
              <button onClick={()=>setYakType('meme')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 ${yakType==='meme'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>Meme</button>
              <button onClick={()=>setYakType('market')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 ${yakType==='market'?'bg-green-500 text-white':'bg-white/5 border-white/10 text-white/40'}`}>Sell</button>
              <button onClick={()=>setYakType('pyq')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 ${yakType==='pyq'?'bg-blue-500 text-white':'bg-white/5 border-white/10 text-white/40'}`}>PYQ</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {yakType==='market' && <input value={marketPrice} onChange={e=>setMarketPrice(e.target.value)} placeholder="Price e.g. 250" className="w-[120px] p-4 bg-white/[0.03] border-2 border-green-500/20 rounded-xl text-sm text-white mb-4"/>}
              {yakType==='pyq' && <input value={pyqSubject} onChange={e=>setPyqSubject(e.target.value.toUpperCase())} placeholder="Subject: M1, DBMS" className="flex-1 p-4 bg-white/[0.03] border-2 border-blue-500/20 rounded-xl text-sm text-white mb-4"/>}
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="Talk about SRET... Use #hashtag #SRET 🏫 Official" autoFocus className="w-full bg-transparent text-[19px] leading-[1.45] outline-none placeholder:text-white/20 resize-none min-h-[140px] text-white" maxLength={300}/>
              <p className="text-[10px] text-white/30 mt-2">{newYak.length}/300 • SRET ONLY • Text Only • Clean • Official 🏫</p>
              {yakType==='poll' && (<div className="mt-6 space-y-3">{pollOptions.map((opt,idx)=><div key={idx} className="flex gap-2"><input value={opt} onChange={e=>{ const n=[...pollOptions]; n[idx]=e.target.value; setPollOptions(n); }} placeholder={`Option ${idx+1}`} className="flex-1 p-4 bg-white/[0.03] border-2 border-white/10 rounded-xl text-sm text-white"/>{pollOptions.length>2 && <button onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))} className="w-12 h-12 bg-white/5 border-2 border-white/10 rounded-xl">X</button>}</div>)}{pollOptions.length<4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="w-full p-3 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-xl text-xs font-bold text-white/40">Add Option</button>}</div>)}
            </div>
          </div>
        </div>
      )}

      {editingPost && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center p-4"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><h3 className="font-black text-[16px]">Edit Post 🏫</h3><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-5 bg-white/[0.05] border-2 border-white/10 rounded-xl p-4 text-[15px] outline-none min-h-[120px] resize-none text-white"/><div className="flex gap-3 mt-6"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs">Cancel</button><button onClick={handleEdit} className="flex-1 h-12 rounded-full bg-white text-black font-bold text-xs">Save 🏫</button></div></div></div>}

      {showCollegeAlertAdmin && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border-2 border-white/10 rounded-[20px] p-5 w-full max-w-sm">
            <h3 className="font-black text-white flex items-center gap-2">🏫 Post College Alert - Official SRET</h3>
            <p className="text-[10px] text-white/40 mt-1">Only clean text - Text only - SRET ONLY - 100% Working - Push + Symbol</p>
            <select value={newAlertType} onChange={e=>setNewAlertType(e.target.value)} className="w-full mt-3 p-3 bg-black border-2 border-white/10 rounded-xl text-white text-sm"><option>ExamAlert</option><option>Holiday</option><option>FeeDue</option><option>Placement</option><option>Event</option><option>Canteen</option><option>Official</option></select>
            <input value={newAlertTitle} onChange={e=>setNewAlertTitle(e.target.value)} placeholder="Title - Ex: Mid Exams Postponed 🏫" className="w-full mt-3 p-3 bg-black border-2 border-white/10 rounded-xl text-white text-sm"/>
            <textarea value={newAlertDesc} onChange={e=>setNewAlertDesc(e.target.value)} placeholder="Description - Clean only - SRET ONLY - Text only" className="w-full mt-3 p-3 bg-black border-2 border-white/10 rounded-xl text-white text-sm h-20"/>
            <div className="flex gap-2 mt-4"><button onClick={()=>setShowCollegeAlertAdmin(false)} className="flex-1 py-3 rounded-full bg-white/10 text-white font-bold text-sm">Cancel</button><button onClick={postCollegeAlert} className="flex-1 py-3 rounded-full bg-white text-black font-bold text-sm">Post Alert 🔔🏫</button></div>
            <p className="text-[9px] text-white/20 mt-3 text-center">Push Status: {pushEnabled?'ON 🔔 - Users ki notification vasthundi':'OFF 🔕 - Permission ivvu'} • Rules: college_alerts allow chey - Nenu ichina rules paste chey</p>
            <p className="text-[8px] text-white/10 mt-2 text-center">College Symbol 🏫 - Official badge - SRET ONLY</p>
          </div>
        </div>
      )}
    </div>
  );
}
