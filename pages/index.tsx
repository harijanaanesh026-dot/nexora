import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';
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
const REPORT_REASONS = ["Spam","Abusive","Fake Info","NSFW","Personal Info Leak","Harassment","Other"];
const BAD_WORDS = ["fuck","sex","porn","xxx","boobs","pussy","dick","cock","nude","slut","bitch","asshole","rape","gaand","gandu","loda","chod","chutiya","lund","randi","bsdk","bhosdike","mc","bc"];
const containsVulgar = (t:string) => { if(!t) return false; return BAD_WORDS.some(w=>t.toLowerCase().includes(w)); };

// === NEE WISH 1 - ADMIN DELETE ===
const ADMIN_EMAILS = ["tonyhayes026@gmail.com", "harijanaamesh026@gmail.com"];
const isAdmin = (email: any) => email && ADMIN_EMAILS.includes(String(email).toLowerCase());
// === NEE WISH 2 - POST SHARING ===
const APP_URL = "https://nexora.vercel.app";

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
  const [showAdmin,setShowAdmin]=useState(false);
  const [showLogoutConfirm,setShowLogoutConfirm]=useState(false);
  const [collegeAlertsList, setCollegeAlertsList] = useState<any[]>([]);
  const [showCollegeAlertAdmin, setShowCollegeAlertAdmin] = useState(false);
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertDesc, setNewAlertDesc] = useState('');
  const [newAlertType, setNewAlertType] = useState('ExamAlert');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);
  const [editAlertTitle, setEditAlertTitle] = useState('');
  const [editAlertDesc, setEditAlertDesc] = useState('');
  const [editAlertType, setEditAlertType] = useState('ExamAlert');
  const [showDmMenu,setShowDmMenu]=useState<string|null>(null);
  const [showDmDeleteConfirm,setShowDmDeleteConfirm]=useState<any>(null);
  const [showDmMessageMenu,setShowDmMessageMenu]=useState<string|null>(null);
  const [showCommentMenu,setShowCommentMenu]=useState<string|null>(null);
  const [showShareMenu,setShowShareMenu]=useState<string|null>(null);
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
          await addDoc(collection(db,'users'),{uid:u.uid,email:u.email||'',username:anonName,anonymousName:anonName,avatar:localStorage.getItem('selected_avatar')||'👻',college:"SRET",collegeEmail:String(localStorage.getItem('college_email')||''),rollNumber:String(localStorage.getItem('roll_number')||''),isAnonymous:true,yakarma:100,totalPosts:0,likedPosts:[],dislikedPosts:[],pollVoted:[],reportedPosts:[],blockedUsers:[],crushList:[],createdAt:serverTimestamp()});
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
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'dms'),where('participants','array-contains',user.uid)), s=>{ const chats=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((c:any)=> c.participants.length===2 && c.participants.includes(user.uid)); chats.sort((a:any,b:any)=>(b.lastMessageAt?.toMillis?.()||0)-(a.lastMessageAt?.toMillis?.()||0)); setDmChats(chats as any); }); },[user]);
  useEffect(()=>{ if(!activeDm) return; return onSnapshot(query(collection(db,'dms/'+activeDm.id+'/messages'),orderBy('createdAt','asc')), s=>setDmMessages(s.docs.map(d=>({id:d.id,...d.data()})))); },[activeDm]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'crushes'),where('fromUid','==',user.uid)), s=>setCrushMatches(s.docs.map(d=>({id:d.id,...d.data()})))); },[user]);
  useEffect(()=>{ if(!userData) return; return onSnapshot(query(collection(db,'reports'),where('status','==','pending'),orderBy('createdAt','desc')), s=>setAdminReports(s.docs.map(d=>({id:d.id,...d.data()})))); },[userData]);
  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(collection(db,'college_alerts'), s=>{
      const all = s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((a:any)=> a.college==="SRET").filter((a:any)=>!containsVulgar(a.title||'') &&!containsVulgar(a.desc||'')).sort((a:any,b:any)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      setCollegeAlertsList(all);
    });
  },[userData]);

  // === POST SHARING FUNCTIONS - NEW ===
  const handleShare = async (y:any) => {
    const shareText = `${y.text}\n\n— via DABEAN SRET • Anonymous\n${APP_URL}?post=${y.id}`;
    const shareData = { title: "DABEAN - SRET Anon", text: shareText, url: `${APP_URL}?post=${y.id}` };
    try {
      if(navigator.share && navigator.canShare && navigator.canShare(shareData)){
        await navigator.share(shareData);
        showToast("Shared ✅");
      } else {
        await navigator.clipboard.writeText(shareText);
        showToast("Link copied! Share anywhere 📋");
      }
    } catch {
      try { await navigator.clipboard.writeText(shareText); showToast("Copied to clipboard 📋"); } catch { showToast(shareText.slice(0,60)); }
    }
    setShowShareMenu(null);
  };
  const handleWhatsAppShare = async (y:any) => {
    const text = encodeURIComponent(`${y.text}\n\n— via DABEAN SRET\n${APP_URL}?post=${y.id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareMenu(null);
  };
  const handleCopyLink = async (y:any) => {
    const link = `${APP_URL}?post=${y.id}`;
    await navigator.clipboard.writeText(link);
    showToast("Link copied 📋");
    setShowShareMenu(null);
  };

    const getCollegeConfig=()=>COLLEGES.find(c=>c.id==="SRET");
  const handleCollegeNext=()=>{ localStorage.setItem('selected_college',"SRET"); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const emailLower=collegeEmail.toLowerCase().trim(); if(!config.domains.some(d=>emailLower.endsWith(d))){ setVerifyError(`Only ${config.domains.join(' or ')} allowed`); return; } const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower))); if(!dup.empty){ setVerifyError('Email already used'); return; } const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode); await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()}); setOtpSent(true); showToast("OTP: "+otpCode); };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const rollUpper=rollNumber.trim().toUpperCase(); if(!config.pattern.test(rollUpper)){ setVerifyError(`Invalid Roll - Ex: ${config.ex}`); return; } const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper))); if(!dup.empty){ setVerifyError('Roll already used'); return; } localStorage.setItem('roll_number',rollUpper); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleLogout=async()=>{ try{ await signOut(auth); localStorage.clear(); setUser(null); setUserData(null); setScreen('college'); setShowProfile(false); setShowLogoutConfirm(false); window.location.reload(); }catch(e:any){ showToast(e.message); } };
  const postCollegeAlert=async()=>{ if(!newAlertTitle.trim()||!newAlertDesc.trim()){ showToast("Title+Desc needed"); return; } if(containsVulgar(newAlertTitle)||containsVulgar(newAlertDesc)){ showToast("Vulgar not allowed"); return; } try{ await addDoc(collection(db,'college_alerts'),{title:newAlertTitle.trim(),desc:newAlertDesc.trim(),type:newAlertType,college:"SRET",createdBy:user.uid,isOfficial:true,createdAt:serverTimestamp()}); setNewAlertTitle(''); setNewAlertDesc(''); setShowCollegeAlertAdmin(false); showToast("Alert Posted"); }catch(e:any){ showToast(e.message); } };
  const handleDeleteAlert=async(id:string)=>{ if(!confirm("Delete alert?")) return; try{ await deleteDoc(doc(db,'college_alerts',id)); showToast("Deleted"); setShowMenu(null); }catch(e:any){ showToast(e.message); } };
  const handleUpdateAlert=async()=>{ if(!editingAlert) return; if(!editAlertTitle.trim()||!editAlertDesc.trim()){ showToast("Title+Desc needed"); return; } try{ await updateDoc(doc(db,'college_alerts',editingAlert.id),{title:editAlertTitle.trim(),desc:editAlertDesc.trim(),type:editAlertType,edited:true}); setEditingAlert(null); showToast("Updated"); }catch(e:any){ showToast(e.message); } };
  const handleDeleteDmChat=async(chatId:string)=>{ if(!confirm("Delete this DM?")) return; try{ const msgsSnap = await getDocs(collection(db,'dms/'+chatId+'/messages')); for(const m of msgsSnap.docs){ await deleteDoc(doc(db,'dms/'+chatId+'/messages',m.id)); } await deleteDoc(doc(db,'dms',chatId)); if(activeDm?.id===chatId) setActiveDm(null); setShowDmMenu(null); setShowDmDeleteConfirm(null); showToast("DM Deleted"); }catch(e:any){ showToast(e.message); } };
  const handleDeleteDmMessage=async(chatId:string, messageId:string)=>{ if(!confirm("Delete message?")) return; try{ await deleteDoc(doc(db,'dms/'+chatId+'/messages',messageId)); setShowDmMessageMenu(null); showToast("Message Deleted"); }catch(e:any){ showToast(e.message); } };
  const handleDeleteComment=async(yakId:string, commentId:string)=>{ if(!confirm("Delete comment?")) return; try{ await deleteDoc(doc(db,'yaks/'+yakId+'/comments',commentId)); await updateDoc(doc(db,'yaks',yakId),{commentsCount:increment(-1)}); setShowCommentMenu(null); showToast("Comment Deleted"); }catch(e:any){ showToast(e.message); } };
  const handleBlockUser=async(uid:string)=>{ if(!userData || uid===user?.uid) return; if(blockedUsers.includes(uid)){ showToast("Already blocked"); return; } if(!confirm("Block this ghost? You won't see posts/comments/DMs")) return; try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(uid)}); setBlockedUsers([...blockedUsers, uid]); showToast("Ghost blocked 🚫"); setShowMenu(null); setReportingPost(null); setShowCommentMenu(null); }catch(e:any){ showToast(e.message); } };
  const handleUnblockUser=async(uid:string)=>{ try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayRemove(uid)}); setBlockedUsers(blockedUsers.filter(id=>id!==uid)); showToast("Ghost unblocked ✅"); }catch(e:any){ showToast(e.message); } };

  if(screen==='college'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style>{toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}<div className="max-w-md mx-auto p-6 min-h-screen"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">S</div><div><p className="font-black text-sm">SRET ANON</p><p className="text-[10px] text-white/40">{totalUsers} verified</p></div></div><h1 className="text-[36px] font-black mt-8 leading-[0.9]">Talk<br/>Beyond<br/><span className="text-white/30">Identity</span></h1><p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">SELECT AVATAR</p><div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/[0.05] border-white/10'}`}>{a}</button>)}</div><div className="mt-8 w-full p-4 rounded-[18px] border-2 bg-white text-black flex justify-between"><div><p className="font-bold text-[13px]">SRET - Tirupati</p><p className="text-[11px] text-black/60">{collegeCounts["SRET"]||0} verified</p></div><div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">✓</div></div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black bg-white text-black">Enter SRET</button><Footer/></div></div>);
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><div className="max-w-md mx-auto p-6 min-h-screen"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full">←</button><div className="mt-6 bg-white/[0.05] border border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold text-white/30">{collegeCounts["SRET"]||0} IN SRET</p><h2 className="font-black text-[18px] mt-1">Verify SRET Student</h2></div><div className="flex p-1 bg-white/5 border border-white/10 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>College Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll Number</button></div>{verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3.5 rounded-xl">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl text-sm text-white"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold">Send OTP</button>{otpSent&&<div className="mt-4 bg-black/30 border-2 border-white/10 rounded-xl p-4"><p className="text-xs text-emerald-400 font-bold">OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full mt-3 p-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-center tracking-[0.3em] text-white"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold">Verify</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={`${config?.ex}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase font-bold text-white"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold">Verify Roll</button></div>}<Footer/></div></div>);
  }
  if(screen==='login'){
    return (<div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border-2 border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] flex items-center justify-center text-4xl">{selectedAvatar}</div><h1 className="font-black mt-6 text-center text-xl">Anonymous Ready</h1><button onClick={handleGoogleLogin} className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold">Continue</button></div><Footer/></div>);
  }

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
      const payload:any={ text:newYak.trim(), uid:user.uid, username:"Anonymous", college:"SRET", type:yakType, likes:0, dislikes:0, commentsCount:0, reports:0, hidden:false, createdAt:serverTimestamp() };
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; }
      if(yakType==='market'){ payload.price=marketPrice; }
      if(yakType==='pyq'){ payload.subject=pyqSubject.toUpperCase(); }
      const hashtagsInText=newYak.match(/#\w+/g); if(hashtagsInText) payload.hashtags=hashtagsInText.map((h:string)=>h.toLowerCase());
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setPollOptions(['','']); setMarketPrice(''); setPyqSubject(''); setYakType('yak'); setScreen('feed'); showToast("Posted");
    }catch(e:any){ showToast(e.message); }finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ 
    const isOwner = user?.uid===y.uid;
    const isAdminUser = isAdmin(user?.email);
    if(!isOwner && !isAdminUser) return; 
    if(!confirm(isAdminUser && !isOwner ? "🛡️ Admin Delete this vulgar post?" : "Delete?")) return; 
    try{ await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1)}).catch(()=>{}); showToast(isAdminUser && !isOwner ? "🛡️ Admin deleted vulgar post ✅" : "Deleted"); }catch(e:any){ showToast(e.message); } setShowMenu(null); 
  };
  const handleEdit=async()=>{ if(!editingPost) return; if(!editText.trim()) return; if(containsVulgar(editText)){ showToast("Vulgar not allowed"); return; } try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); }catch(e:any){ showToast(e.message); } setEditingPost(null); setEditText(''); setShowMenu(null); };
  const handleReport=async(y:any, reasonArg?:string)=>{ const finalReason=reasonArg||reportReason; if(!userData) return; if(userData.reportedPosts?.includes(y.id)){ showToast("Already reported"); setReportingPost(null); setShowMenu(null); return; } if(!finalReason){ showToast("Select reason"); return; } try{ await addDoc(collection(db,'reports'),{yakId:y.id, yakText:y.text.slice(0,200), yakUid:y.uid, reportedBy:user.uid, reason:finalReason, status:"pending", createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{reports:increment(1)}); await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)}); setUserData({...userData, reportedPosts:[...(userData.reportedPosts||[]), y.id]}); showToast("Reported"); setReportingPost(null); setReportReason(''); setShowMenu(null); }catch(e:any){ showToast(e.message); } };
  const handleAdminRestore=async(r:any)=>{ try{ await updateDoc(doc(db,'yaks',r.yakId),{hidden:false, reports:0}); await updateDoc(doc(db,'reports',r.id),{status:"dismissed"}); }catch(e:any){ showToast(e.message); } };
  const handleAdminDelete=async(r:any)=>{ if(!confirm('Delete?')) return; try{ await deleteDoc(doc(db,'yaks',r.yakId)); await updateDoc(doc(db,'reports',r.id),{status:"deleted"}); }catch(e:any){ showToast(e.message); } };
  const handleAdminDismiss=async(r:any)=>{ try{ await updateDoc(doc(db,'reports',r.id),{status:"dismissed"}); }catch(e:any){ showToast(e.message); } };
  const buildTree = (flat:any[]) => { const map:Record<string, any> = {}; const roots:any[] = []; flat.forEach(c => { map[c.id] = {...c, replies: []}; }); flat.forEach(c => { if(c.parentId && map[c.parentId]){ map[c.parentId].replies.push(map[c.id]); } else { roots.push(map[c.id]); } }); return roots; };
  const handleCommentPost = async (yId:string) => {
    if(!commentText.trim() ||!user) return; if(containsVulgar(commentText)){ showToast("Vulgar not allowed"); return; }
    const payload:any = { text:commentText.trim(), uid: user.uid, username:"Anonymous", parentId: replyTo? replyTo.id : null, replyToUsername: replyTo? replyTo.username : null, createdAt: serverTimestamp() };
    setCommentText(''); const temp = replyTo; setReplyTo(null);
    try{ await addDoc(collection(db,'yaks/'+yId+'/comments'), payload); await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); }catch(e:any){ showToast(e.message); setCommentText(payload.text); setReplyTo(temp); }
  };
  const handleStartDm = async (otherUid:string)=>{
    if(otherUid===user?.uid){ showToast("Can't DM yourself"); return; }
    if(blockedUsers.includes(otherUid)){ showToast("Blocked - Unblock in profile"); return; }
    const existing=dmChats.find(c=> c.participants.includes(otherUid) && c.participants.length===2);
    if(existing){ setActiveDm(existing); setFeedTab('dm'); setScreen('feed'); return; }
    try{ const newChat=await addDoc(collection(db,'dms'),{ participants:[user.uid, otherUid], lastMessage:"Started chat", lastMessageAt:serverTimestamp(), createdAt:serverTimestamp(), isPrivate:true }); setActiveDm({id:newChat.id, participants:[user.uid, otherUid]}); setFeedTab('dm'); setScreen('feed'); }catch(e:any){ showToast(e.message); }
  };
  const handleSendDm=async()=>{
    if(!dmText.trim()||!activeDm||!user) return; if(containsVulgar(dmText)){ showToast("Vulgar not allowed"); return; } setDmText('');
    try{ await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{ text:dmText.trim(), uid:user.uid, username:"Anonymous", createdAt:serverTimestamp() }); await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:dmText.trim(), lastMessageAt:serverTimestamp()}); }catch(e:any){ showToast(e.message); }
  };
  const markNotificationsRead=async()=>{ try{ for(const n of notifications.filter((n:any)=>!n.read)){ await updateDoc(doc(db,'notifications',n.id),{read:true}); } }catch{} };
  const handleCrushSubmit=async()=>{ const roll=crushRoll.trim().toUpperCase(); if(!roll) return; try{ await addDoc(collection(db,'crushes'),{fromUid:user.uid, toRoll:roll, matched:false, createdAt:serverTimestamp()}); setCrushRoll(''); showToast("Crush added"); }catch(e:any){ showToast(e.message); } };
  const handleCancelCrush=async(id:string)=>{ if(!confirm("Cancel?")) return; try{ await deleteDoc(doc(db,'crushes',id)); }catch(e:any){ showToast(e.message); } };
  const renderComment = (c:any, depth=0) => {
    const isReply = depth > 0;
    const isOwn = c.uid===user?.uid;
    if(blockedUsers.includes(c.uid)) return null;
    return (
      <div key={c.id} className={`${isReply? 'ml-6 border-l border-white/10 pl-3' : ''} mt-3`}>
        <div className="flex gap-2.5">
          <div className={`bg-white/5 border border-white/10 rounded-full flex items-center justify-center shrink-0 ${isReply? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'}`}>A</div>
          <div className="flex-1">
            <div className="bg-white/[0.05] border border-white/10 rounded-[14px] px-4 py-2.5 relative">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-white/40">Anonymous {isOwn?'- You':''}</p>
                <button onClick={()=>setShowCommentMenu(showCommentMenu===c.id?null:c.id)} className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-white/30 text-[10px]">...</button>
              </div>
              {showCommentMenu===c.id && (
                <div className="absolute right-2 top-8 w-[160px] bg-black border border-white/10 rounded-xl p-2 z-10">
                  {isOwn? <button onClick={()=>{ if(activePost) handleDeleteComment(activePost, c.id); }} className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-400">Delete</button> : <><button onClick={()=>{ setReplyTo(c); setShowCommentMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-[11px] bg-white/5">Reply</button><button onClick={()=>handleBlockUser(c.uid)} className="w-full text-left px-3 py-2 rounded-lg text-[11px] bg-red-500/10 text-red-400 mt-1">🚫 Block</button></>}
                  <button onClick={()=>setShowCommentMenu(null)} className="w-full mt-1 py-1 rounded-lg text-[10px] text-white/30">Cancel</button>
                </div>
              )}
              {isReply && c.replyToUsername && <p className="text-[10px] text-white/30 mt-1">Reply to {c.replyToUsername}</p>}
              <p className="text-[13px] mt-1 leading-[1.4] whitespace-pre-wrap break-words">{c.text}</p>
            </div>
            <div className="flex gap-3 mt-1.5 ml-1">
              <button onClick={()=>setReplyTo(c)} className="text-[11px] font-bold text-white/30">Reply</button>
              {isOwn && <button onClick={()=>{ if(activePost) handleDeleteComment(activePost, c.id); }} className="text-[11px] font-bold text-red-400/60">Delete</button>}
              {!isOwn && <button onClick={()=>handleBlockUser(c.uid)} className="text-[11px] font-bold text-red-400/40">Block</button>}
            </div>
            {c.replies?.length > 0 && <div className="mt-1">{c.replies.map((rep:any)=>renderComment(rep, depth+1))}</div>}
          </div>
        </div>
      </div>
    );
  };
  const filteredYaks = (searchQuery? yaks.filter(y=> y.text.toLowerCase().includes(searchQuery.toLowerCase()) ) : yaks).filter(y=>!blockedUsers.includes(y.uid)).filter(y=>!y.hidden || y.uid===user?.uid);
  const displayHotYaks = hotYaks.filter(y=>!blockedUsers.includes(y.uid));
  const displayMemeYaks = memeYaks.filter(y=>!blockedUsers.includes(y.uid));
  const displayMarketYaks = marketYaks.filter(y=>!blockedUsers.includes(y.uid));
  const displayPyqYaks = pyqYaks.filter(y=>!blockedUsers.includes(y.uid));

  return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black">S</div><p className="font-bold text-[13px]">SRET • {blockedUsers.length} blocked {isAdmin(user?.email) && <span className="bg-red-600 px-2 py-0.5 rounded text-[10px]">ADMIN</span>}</p></div>
          <div className="flex gap-2">
            <button onClick={()=>setScreen('alerts')} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center relative">🏫{collegeAlertsList.length>0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[8px] flex items-center justify-center">{collegeAlertsList.length}</span>}</button>
            <button onClick={()=>{ setShowNotifications(true); markNotificationsRead(); }} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center relative">🔔{unreadCount>0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center">{unreadCount}</span>}</button>
            <button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/10 rounded-full">👤</button>
          </div>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        {screen==='feed' && (
          <>
            {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : displayHotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const hasVoted=userData.pollVoted?.includes(y.id); const nestedTree = activePost===y.id? buildTree(comments) : [];
              return(
                <div key={y.id} className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2"><div className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs">A</div><div><p className="font-bold text-[12px]">Anonymous {isOwn?'- You':''}</p><p className="text-[10px] text-white/30">{score} • {y.type}</p></div></div>
                    <div className="flex gap-2">
                      {/* SHARE BUTTON - NEW */}
                      <button onClick={()=>setShowShareMenu(showShareMenu===y.id?null:y.id)} className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-[12px]">↗️</button>
                      <button onClick={()=>handleStartDm(y.uid)} className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-[10px]">DM</button>
                      <button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-7 h-7 bg-white/5 rounded-full text-white/40">...</button>
                    </div>
                  </div>
                  {showShareMenu===y.id && (
                    <div className="absolute top-12 right-12 bg-[#1a1a1a] border border-white/10 rounded-xl p-2 z-20 w-[180px]">
                      <button onClick={()=>handleShare(y)} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-white text-black font-bold">📤 Share Post</button>
                      <button onClick={()=>handleWhatsAppShare(y)} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-green-500/20 text-green-400 mt-1">💬 WhatsApp</button>
                      <button onClick={()=>handleCopyLink(y)} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-white/5 mt-1">🔗 Copy Link</button>
                      <button onClick={()=>setShowShareMenu(null)} className="w-full mt-1 py-1 text-[10px] text-white/30">Cancel</button>
                    </div>
                  )}
                  {showMenu===y.id && (
                    <div className="mt-2 bg-black border border-white/10 rounded-xl p-2 z-10">
                      {(isOwn || isAdmin(user?.email)) ? (
                        <>
                          {isOwn && <button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-white/5">Edit</button>}
                          <button onClick={()=>handleDelete(y)} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-red-500/20 text-red-400 mt-1 font-bold">
                            {isAdmin(user?.email) && !isOwn ? "🛡️ Admin Delete (Vulgar)" : "🗑️ Delete"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={()=>{ setReportingPost(y); setShowMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-white/5">Report</button>
                          <button onClick={()=>handleBlockUser(y.uid)} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-red-500/10 text-red-400 mt-1">🚫 Block</button>
                        </>
                      )}
                      <button onClick={()=>setShowMenu(null)} className="w-full mt-1 py-1 text-[10px] text-white/30">Cancel</button>
                    </div>
                  )}
                  <p className="text-[14px] mt-3 leading-[1.4] whitespace-pre-wrap">{y.text}</p>
                  <div className="flex gap-2 mt-3">
                    <div className="flex bg-white/5 border border-white/10 rounded-full p-1"><button onClick={()=>handleVote(y,'up')} className={`px-3 py-1.5 rounded-full text-xs ${liked?'bg-white text-black':'text-white/40'}`}>Up {y.likes||0}</button><span className="px-2 py-1.5 text-[11px] text-white/20">{score}</span><button onClick={()=>handleVote(y,'down')} className={`px-3 py-1.5 rounded-full text-xs ${disliked?'bg-red-500 text-white':'text-white/30'}`}>Down {y.dislikes||0}</button></div>
                    <button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); }} className="px-3 h-8 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">💬 {y.commentsCount||0}</button>
                    <button onClick={()=>handleShare(y)} className="px-3 h-8 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">↗️ Share</button>
                  </div>
                  {activePost===y.id && (
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <div className="max-h-[350px] overflow-y-auto pr-1">{nestedTree.length===0 && <p className="text-xs text-white/20 text-center py-6">No comments</p>}{nestedTree.map((c:any)=>renderComment(c,0))}</div>
                      <div className="flex gap-2 mt-3"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={replyTo? `Reply to ${replyTo.username}` : "Comment"} className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 h-9 text-xs outline-none"/><button onClick={()=>handleCommentPost(y.id)} className="w-9 h-9 rounded-full bg-white text-black text-xs">Go</button></div>
                    </div>
                  )}
                </div>
              );
            })}
            <Footer/>
          </>
        )}

                {screen==='alerts' && (
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/20 rounded-[16px] p-4">
              <div className="flex justify-between items-center"><p className="font-bold text-[14px]">College Alerts</p><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-white/10 rounded-full">←</button></div>
              <button onClick={()=>setShowCollegeAlertAdmin(true)} className="w-full mt-3 py-2.5 bg-white text-black rounded-full font-bold text-xs">+ New Alert</button>
            </div>
            {collegeAlertsList.map((a:any)=><div key={a.id} className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4"><div className="flex justify-between"><span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded-full">#{a.type}</span><button onClick={()=>setShowMenu(showMenu===a.id?null:a.id)} className="w-6 h-6 bg-white/5 rounded-full">...</button></div>{showMenu===a.id && <div className="mt-2 bg-black border border-white/10 rounded-xl p-2"><button onClick={()=>{ setEditingAlert(a); setEditAlertTitle(a.title); setEditAlertDesc(a.desc); setEditAlertType(a.type); setShowMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-white/5">Edit</button><button onClick={()=>handleDeleteAlert(a.id)} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-red-500/10 text-red-400 mt-1">Delete</button></div>}<p className="font-bold text-[14px] mt-2">{a.title}</p><p className="text-[12px] text-white/60 mt-1 whitespace-pre-wrap">{a.desc}</p></div>)}
            <Footer/>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-xl border-t border-white/10"><div className="max-w-[600px] mx-auto px-4 h-[64px] flex items-center justify-between"><button onClick={()=>{ setScreen('feed'); setFeedTab('new'); }} className="flex flex-col items-center"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${screen==='feed' && feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/40'}`}>S</div><span className="text-[8px] text-white/30 mt-1">Feed</span></button><button onClick={()=>setScreen('alerts')} className="flex flex-col items-center"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] ${screen==='alerts'?'bg-red-600 text-white':'bg-white/5 text-white/40'}`}>🏫</div><span className="text-[8px] text-white/30 mt-1">Alerts</span></button><button onClick={()=>setScreen('create')} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center text-xl font-black">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center"><div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-xs">👤</div><span className="text-[8px] text-white/30 mt-1">{userData?.yakarma||0}</span></button></div></div>
      {screen==='create' && (<div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col"><div className="max-w-[600px] mx-auto w-full flex flex-col h-full"><div className="p-4 flex items-center justify-between border-b border-white/10"><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-white/5 rounded-full">X</button><p className="text-[11px] font-bold">Create</p><button onClick={handlePost} disabled={posting||!newYak.trim()} className={`px-5 h-8 rounded-full font-bold text-xs ${posting||!newYak.trim()?'bg-white/5 text-white/20':'bg-white text-black'}`}>{posting?'...':'Post'}</button></div><div className="p-4 flex-1 overflow-y-auto"><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="What's happening in SRET?" autoFocus className="w-full bg-transparent text-[18px] outline-none placeholder:text-white/20 resize-none min-h-[120px]" maxLength={300}/><p className="text-[10px] text-white/30 mt-2">{newYak.length}/300</p></div></div></div>)}
      {showProfile && (<div className="fixed inset-0 bg-black/70 z-[150] flex items-end justify-center p-4"><div className="bg-[#141416] border border-white/10 w-full max-w-[600px] rounded-t-[24px] p-5 pb-8"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-white/5 rounded-[14px] flex items-center justify-center">👤</div><div><p className="font-bold">Anonymous {isAdmin(user?.email) && <span className="bg-red-600 text-[10px] px-2 py-0.5 rounded ml-2">ADMIN</span>}</p><p className="text-[11px] text-white/40">{user?.email} {isAdmin(user?.email) && "• Can delete any vulgar post"}</p></div></div><button onClick={()=>setShowLogoutConfirm(true)} className="w-full mt-6 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold">Logout</button><button onClick={()=>setShowProfile(false)} className="w-full mt-2 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs">Close</button></div></div>)}
      {showLogoutConfirm && (<div className="fixed inset-0 bg-black/70 z-[160] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-5 w-full max-w-sm text-center"><p className="font-bold">Logout?</p><div className="flex gap-2 mt-4"><button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={handleLogout} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold">Logout</button></div></div></div>)}
    </div>
  );
}
