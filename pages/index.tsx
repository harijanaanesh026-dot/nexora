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
const ADMIN_EMAILS = ["tonyhayes026@gmail.com", "harijanaamesh026@gmail.com"];
const isAdmin = (email: any) => email && ADMIN_EMAILS.includes(String(email).toLowerCase());
const APP_URL = "https://nexora-gamma-gilt.vercel.app";
const REPORT_DELETE_THRESHOLD = 3;

const Footer = () => (<div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.3em] font-bold text-white/40">© 2026 Dabean. A production by ANESH</p></div>);

export default function YakFixed(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hot'|'top'|'meme'|'poll'>('new');
  const [yaks,setYaks]=useState<any[]>([]);
  const [hotYaks,setHotYaks]=useState<any[]>([]);
  const [memeYaks,setMemeYaks]=useState<any[]>([]);
  const [marketYaks,setMarketYaks]=useState<any[]>([]);
  const [pyqYaks,setPyqYaks]=useState<any[]>([]);
  const [pollYaks,setPollYaks]=useState<any[]>([]);
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
  const [showDmDeleteConfirm,setShowDmDeleteConfirm]=useState<any>(null);
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
      setPollYaks([...data].filter(d=>d.type==='poll').slice(0,30));
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
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'college_alerts'), s=>{ const all = s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((a:any)=> a.college==="SRET").filter((a:any)=>!containsVulgar(a.title||'') &&!containsVulgar(a.desc||'')).sort((a:any,b:any)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)); setCollegeAlertsList(all); }); },[userData]);
  useEffect(()=>{
    if(!user?.uid ||!userData) return;
    const setupPush = async()=>{
      try{
        if(typeof window==='undefined' ||!('Notification' in window) ||!('serviceWorker' in navigator)) return;
        const perm = await Notification.requestPermission();
        if(perm==='granted'){
          const messaging = getMessaging(app);
          const token = await getToken(messaging, {vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Iev-5oWq-fpYh-3sX9oXq-3sX9o'});
          if(token){ setPushEnabled(true); await updateDoc(doc(db,'users',userData.id),{fcmToken:token, pushEnabled:true}).catch(()=>{}); await setDoc(doc(db,'fcm_tokens',user.uid),{uid:user.uid,token,college:"SRET",createdAt:serverTimestamp()}).catch(()=>{}); }
        }
        const messaging = getMessaging(app);
        onMessage(messaging, (payload)=>{ showToast(`${payload.notification?.title}`); });
      }catch(e){ console.log(e); }
    };
    setupPush();
  },[user, userData]);

  const handleShare = async (y:any) => {
    const shareText = `${y.text}\n\n— via DABEAN SRET • Anonymous\n${APP_URL}?post=${y.id}`;
    try {
      if(navigator.share){ await navigator.share({ title: "DABEAN - SRET", text: y.text, url: `${APP_URL}?post=${y.id}` }); showToast("Shared ✅"); }
      else { await navigator.clipboard.writeText(shareText); showToast("Link copied! 📋"); }
    } catch { try { await navigator.clipboard.writeText(shareText); showToast("Copied 📋"); } catch {} }
    setShowShareMenu(null);
  };
  const handleWhatsAppShare = (y:any) => { const text = encodeURIComponent(`${y.text}\n\n— via DABEAN\n${APP_URL}?post=${y.id}`); window.open(`https://wa.me/?text=${text}`, '_blank'); setShowShareMenu(null); };
  const handleCopyLink = async (y:any) => { await navigator.clipboard.writeText(`${APP_URL}?post=${y.id}`); showToast("Link copied 📋"); setShowShareMenu(null); };
  const handleCommentLike = async (yakId:string, commentId:string) => {
    if(!user?.uid) return;
    try {
      const c = comments.find((cc:any)=>cc.id===commentId);
      const hasLiked = c?.likedBy?.includes(user.uid);
      if(hasLiked){ await updateDoc(doc(db,'yaks/'+yakId+'/comments', commentId), { likes: increment(-1), likedBy: arrayRemove(user.uid) }); }
      else { await updateDoc(doc(db,'yaks/'+yakId+'/comments', commentId), { likes: increment(1), likedBy: arrayUnion(user.uid) }); }
    } catch(e:any){ showToast(e.message); }
  };
  const handleCommentShare = async (c:any) => { const text = `${c.text}\n\n— Comment via DABEAN\n${APP_URL}`; try { await navigator.clipboard.writeText(text); showToast("Comment copied 📋"); } catch {} };

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
  const handleDeleteDmChat=async(chatId:string)=>{ if(!confirm("Delete this DM?")) return; try{ const msgsSnap = await getDocs(collection(db,'dms/'+chatId+'/messages')); for(const m of msgsSnap.docs){ await deleteDoc(doc(db,'dms/'+chatId+'/messages',m.id)); } await deleteDoc(doc(db,'dms',chatId)); if(activeDm?.id===chatId) setActiveDm(null); setShowDmDeleteConfirm(null); showToast("DM Deleted"); }catch(e:any){ showToast(e.message); } };
  const handleDeleteDmMessage=async(chatId:string, messageId:string)=>{ if(!confirm("Delete message?")) return; try{ await deleteDoc(doc(db,'dms/'+chatId+'/messages',messageId)); showToast("Message Deleted"); }catch(e:any){ showToast(e.message); } };
  const handleDeleteComment=async(yakId:string, commentId:string)=>{ if(!confirm("Delete comment?")) return; try{ await deleteDoc(doc(db,'yaks/'+yakId+'/comments',commentId)); await updateDoc(doc(db,'yaks',yakId),{commentsCount:increment(-1)}); setShowCommentMenu(null); showToast("Comment Deleted"); }catch(e:any){ showToast(e.message); } };
  const handleBlockUser=async(uid:string)=>{ if(!userData || uid===user?.uid) return; if(blockedUsers.includes(uid)){ showToast("Already blocked"); return; } if(!confirm("Block this ghost?")) return; try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(uid)}); setBlockedUsers([...blockedUsers, uid]); showToast("Ghost blocked 🚫"); setShowMenu(null); setReportingPost(null); setShowCommentMenu(null); }catch(e:any){ showToast(e.message); } };
  const handleUnblockUser=async(uid:string)=>{ try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayRemove(uid)}); setBlockedUsers(blockedUsers.filter(id=>id!==uid)); showToast("Ghost unblocked ✅"); }catch(e:any){ showToast(e.message); } };

  if(screen==='college'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><style>{`body{background:#000} ::-webkit-scrollbar{display:none}`}</style>{toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}<div className="max-w-md mx-auto p-6 min-h-screen"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">D</div><div><p className="font-black text-sm">DABEAN</p><p className="text-[10px] text-white/40">{totalUsers} verified</p></div></div><h1 className="text-[36px] font-black mt-8 leading-[0.9]">Talk<br/>Beyond<br/><span className="text-white/30">Identity</span></h1><p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">SELECT AVATAR</p><div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/[0.05] border-white/10'}`}>{a}</button>)}</div><div className="mt-8 w-full p-4 rounded-[18px] border-2 bg-white text-black flex justify-between"><div><p className="font-bold text-[13px]">SRET - Tirupati</p><p className="text-[11px] text-black/60">{collegeCounts["SRET"]||0} verified</p></div><div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">✓</div></div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black bg-white text-black">Enter SRET</button><Footer/></div></div>);
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
  const handleDelete=async(y:any)=>{ const isOwner = user?.uid===y.uid; const isAdminUser = isAdmin(user?.email); if(!isOwner && !isAdminUser) return; if(!confirm(isAdminUser && !isOwner ? "🛡️ Admin Delete?" : "Delete?")) return; try{ await deleteDoc(doc(db,'yaks',y.id)); showToast(isAdminUser && !isOwner ? "🛡️ Admin deleted ✅" : "Deleted"); }catch(e:any){ showToast(e.message); } setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost) return; if(!editText.trim()) return; if(containsVulgar(editText)){ showToast("Vulgar not allowed"); return; } try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); }catch(e:any){ showToast(e.message); } setEditingPost(null); setEditText(''); setShowMenu(null); };
  const handleReport=async(y:any, reasonArg?:string)=>{ const finalReason=reasonArg||reportReason; if(!userData) return; if(userData.reportedPosts?.includes(y.id)){ showToast("Already reported"); setReportingPost(null); setShowMenu(null); return; } if(!finalReason){ showToast("Select reason"); return; } try{ await addDoc(collection(db,'reports'),{yakId:y.id, yakText:y.text.slice(0,200), yakUid:y.uid, reportedBy:user.uid, reason:finalReason, status:"pending", createdAt:serverTimestamp()}); const newReportCount = (y.reports||0)+1; if(newReportCount >= REPORT_DELETE_THRESHOLD){ await updateDoc(doc(db,'yaks',y.id),{reports:increment(1), hidden:true}); showToast(`🚫 Auto deleted - ${REPORT_DELETE_THRESHOLD} reports`); } else { await updateDoc(doc(db,'yaks',y.id),{reports:increment(1)}); showToast(`Reported (${newReportCount}/${REPORT_DELETE_THRESHOLD})`); } await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)}); setUserData({...userData, reportedPosts:[...(userData.reportedPosts||[]), y.id]}); setReportingPost(null); setReportReason(''); setShowMenu(null); }catch(e:any){ showToast(e.message); } };
  const handleAdminRestore=async(r:any)=>{ try{ await updateDoc(doc(db,'yaks',r.yakId),{hidden:false, reports:0}); await updateDoc(doc(db,'reports',r.id),{status:"dismissed"}); }catch(e:any){ showToast(e.message); } };
  const handleAdminDelete=async(r:any)=>{ if(!confirm('Delete?')) return; try{ await deleteDoc(doc(db,'yaks',r.yakId)); await updateDoc(doc(db,'reports',r.id),{status:"deleted"}); }catch(e:any){ showToast(e.message); } };
  const handleAdminDismiss=async(r:any)=>{ try{ await updateDoc(doc(db,'reports',r.id),{status:"dismissed"}); }catch(e:any){ showToast(e.message); } };
  const buildTree = (flat:any[]) => { const map:Record<string, any> = {}; const roots:any[] = []; flat.forEach(c => { map[c.id] = {...c, replies: []}; }); flat.forEach(c => { if(c.parentId && map[c.parentId]){ map[c.parentId].replies.push(map[c.id]); } else { roots.push(map[c.id]); } }); return roots; };
  const handleCommentPost = async (yId:string) => {
    if(!commentText.trim() ||!user) return; if(containsVulgar(commentText)){ showToast("Vulgar not allowed"); return; }
    const payload:any = { text:commentText.trim(), uid: user.uid, username:"Anonymous", parentId: replyTo? replyTo.id : null, replyToUsername: replyTo? replyTo.username : null, likes:0, likedBy:[], createdAt: serverTimestamp() };
    setCommentText(''); const temp = replyTo; setReplyTo(null);
    try{ await addDoc(collection(db,'yaks/'+yId+'/comments'), payload); await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); }catch(e:any){ showToast(e.message); setCommentText(payload.text); setReplyTo(temp); }
  };
  const handleStartDm = async (otherUid:string)=>{ if(otherUid===user?.uid){ showToast("Can't DM yourself"); return; } if(blockedUsers.includes(otherUid)){ showToast("Blocked"); return; } const existing=dmChats.find(c=> c.participants.includes(otherUid) && c.participants.length===2); if(existing){ setActiveDm(existing); setScreen('dm'); return; } try{ const newChat=await addDoc(collection(db,'dms'),{ participants:[user.uid, otherUid], lastMessage:"Started chat", lastMessageAt:serverTimestamp(), createdAt:serverTimestamp(), isPrivate:true }); setActiveDm({id:newChat.id, participants:[user.uid, otherUid]}); setScreen('dm'); }catch(e:any){ showToast(e.message); } };
  const handleSendDm=async()=>{ if(!dmText.trim()||!activeDm||!user) return; if(containsVulgar(dmText)){ showToast("Vulgar not allowed"); return; } setDmText(''); try{ await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{ text:dmText.trim(), uid:user.uid, username:"Anonymous", createdAt:serverTimestamp() }); await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:dmText.trim(), lastMessageAt:serverTimestamp()}); }catch(e:any){ showToast(e.message); } };
  const markNotificationsRead=async()=>{ try{ for(const n of notifications.filter((n:any)=>!n.read)){ await updateDoc(doc(db,'notifications',n.id),{read:true}); } }catch{} };
  const handleCrushSubmit=async()=>{ const roll=crushRoll.trim().toUpperCase(); if(!roll) return; try{ await addDoc(collection(db,'crushes'),{fromUid:user.uid, toRoll:roll, matched:false, createdAt:serverTimestamp()}); setCrushRoll(''); showToast("Crush added"); }catch(e:any){ showToast(e.message); } };
  const handleCancelCrush=async(id:string)=>{ if(!confirm("Cancel?")) return; try{ await deleteDoc(doc(db,'crushes',id)); }catch(e:any){ showToast(e.message); } };
  const renderComment = (c:any, depth=0) => {
    const isReply = depth > 0;
    const isOwn = c.uid===user?.uid;
    const hasLiked = c.likedBy?.includes(user?.uid);
    if(blockedUsers.includes(c.uid)) return null;
    return (
      <div key={c.id} className={`${isReply? 'ml-6 border-l border-white/10 pl-3' : ''} mt-3`}>
        <div className="flex gap-2.5">
          <div className={`bg-white/5 border border-white/10 rounded-full flex items-center justify-center shrink-0 ${isReply? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'}`}>A</div>
          <div className="flex-1">
            <div className="bg-[#111111] border border-white/[0.06] rounded-[14px] px-4 py-2.5 relative">
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
            <div className="flex gap-3 mt-1.5 ml-1 items-center">
              <button onClick={()=>{ if(activePost) handleCommentLike(activePost, c.id); }} className={`text-[11px] font-bold flex items-center gap-1 ${hasLiked?'text-white':'text-white/30'}`}>{hasLiked?'❤️':'🤍'} {c.likes||0}</button>
              <button onClick={()=>setReplyTo(c)} className="text-[11px] font-bold text-white/30">Reply</button>
              <button onClick={()=>handleCommentShare(c)} className="text-[11px] font-bold text-white/30">↗ Share</button>
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
  const displayPollYaks = pollYaks.filter(y=>!blockedUsers.includes(y.uid));

return(
    <div className="min-h-screen bg-[#000000] text-white flex flex-col">
      <style>{`body{background:#000} ::-webkit-scrollbar{display:none}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#000000]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-white text-black rounded-[10px] flex items-center justify-center font-black text-[13px]">D</div><p className="font-bold text-[14px]">DABEAN <span className="text-white/30 text-[11px] ml-1">SRET</span> {isAdmin(user?.email) && <span className="bg-red-600 px-2 py-0.5 rounded-full text-[9px] ml-2">ADMIN</span>}</p></div>
          <div className="flex gap-2">
            <button onClick={()=>{ setShowNotifications(true); markNotificationsRead(); }} className="w-9 h-9 bg-white/[0.06] border border-white/[0.08] rounded-full flex items-center justify-center relative">🔔{(collegeAlertsList.length>0 || unreadCount>0) && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[9px] flex items-center justify-center font-bold border-2 border-black">{collegeAlertsList.length + unreadCount}</span>}</button>
            <button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/[0.06] border border-white/[0.08] rounded-full flex items-center justify-center">👤</button>
          </div>
        </div>
        <div className="max-w-[600px] mx-auto px-4 pb-3"><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search posts, #tags" className="w-full h-9 bg-white/[0.04] border border-white/[0.06] rounded-full px-4 text-[12px] outline-none placeholder:text-white/25" /></div>
        <div className="max-w-[600px] mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            {[{id:'new',label:'NEW'},{id:'hot',label:'HOT'},{id:'top',label:'TOP'},{id:'meme',label:'MEME'},{id:'poll',label:'POLL'}].map(tab=>(
              <button key={tab.id} onClick={()=>{ setScreen('feed'); setFeedTab(tab.id as any); }} className={`h-8 px-4 rounded-full text-[11px] font-bold border whitespace-nowrap ${feedTab===tab.id && screen==='feed' ? 'bg-white text-black border-white' : 'bg-white/[0.04] border-white/[0.08] text-white/40'}`}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        {screen==='feed' && (
          <>
            {feedTab==='new' && hashtags.length>0 && (<div className="bg-white/[0.02] border border-white/[0.06] rounded-[14px] p-3"><p className="text-[10px] font-bold text-white/25 tracking-widest">TRENDING</p><div className="flex gap-2 mt-2 flex-wrap">{hashtags.slice(0,6).map((h:any)=><button key={h.tag} onClick={()=>setSearchQuery(h.tag)} className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-[11px] text-white/60">{h.tag}</button>)}</div></div>)}
            {feedTab==='top' && (<div className="space-y-2">{leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-[#111111] border border-white/[0.06] rounded-[14px] p-3 flex justify-between items-center"><div className="flex gap-3 items-center"><span className="w-7 h-7 bg-white/[0.06] rounded-full flex items-center justify-center text-[11px] font-bold">{i+1}</span><p className="text-[13px] font-bold">Anonymous {i+1}</p></div><p className="text-[13px] font-bold">{u.yakarma}</p></div>)}<Footer/></div>)}
            {feedTab!=='top' && (
              <>
                {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : feedTab==='poll'? displayPollYaks : displayHotYaks).map(y=>{
                  const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const hasVoted=userData.pollVoted?.includes(y.id); const nestedTree = activePost===y.id? buildTree(comments) : [];
                  return(
                    <div key={y.id} className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 relative">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2.5"><div className="w-8 h-8 bg-white/[0.06] border border-white/[0.08] rounded-full flex items-center justify-center text-[12px]">A</div><div><p className="font-bold text-[12px]">Anonymous {isOwn?'- You':''}</p><p className="text-[10px] text-white/30 mt-0.5">{score} • {y.type} {y.reports>0 && <span className="text-red-400">• {y.reports} reports</span>}</p></div></div>
                        <div className="flex gap-1.5">
                          <button onClick={()=>setShowShareMenu(showShareMenu===y.id?null:y.id)} className="w-7 h-7 bg-white/[0.05] border border-white/[0.06] rounded-full flex items-center justify-center text-[11px]">↗</button>
                          <button onClick={()=>handleStartDm(y.uid)} className="w-7 h-7 bg-white/[0.05] border border-white/[0.06] rounded-full flex items-center justify-center text-[10px]">DM</button>
                          <button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-7 h-7 bg-white/[0.05] border border-white/[0.06] rounded-full text-white/30">•••</button>
                        </div>
                      </div>
                      {showShareMenu===y.id && (<div className="absolute top-12 right-4 bg-[#1a1a1a] border border-white/10 rounded-[12px] p-2 z-20 w-[180px]"><button onClick={()=>handleShare(y)} className="w-full text-left px-3 py-2 rounded-full text-[11px] bg-white text-black font-bold">📤 Share Post</button><button onClick={()=>handleWhatsAppShare(y)} className="w-full text-left px-3 py-2 rounded-full text-[11px] bg-white/[0.06] mt-1">💬 WhatsApp</button><button onClick={()=>handleCopyLink(y)} className="w-full text-left px-3 py-2 rounded-full text-[11px] bg-white/[0.04] mt-1">🔗 Copy Link</button></div>)}
                      {showMenu===y.id && (<div className="mt-3 bg-black border border-white/[0.08] rounded-[12px] p-2">{(isOwn || isAdmin(user?.email)) ? (<><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-3 py-2.5 rounded-full text-[11px] bg-white/[0.05]">Edit</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-3 py-2.5 rounded-full text-[11px] bg-red-500/10 text-red-400 mt-1 font-bold">{isAdmin(user?.email) && !isOwn ? "🛡️ Admin Delete" : "🗑️ Delete"}</button></>) : (<><button onClick={()=>{ setReportingPost(y); setShowMenu(null); }} className="w-full text-left px-3 py-2.5 rounded-full text-[11px] bg-white/[0.05]">Report</button><button onClick={()=>handleBlockUser(y.uid)} className="w-full text-left px-3 py-2.5 rounded-full text-[11px] bg-red-500/10 text-red-400 mt-1">🚫 Block</button></>)}<button onClick={()=>setShowMenu(null)} className="w-full mt-1 py-1 text-[10px] text-white/30">Cancel</button></div>)}
                      <p className="text-[14px] mt-3 leading-[1.5] whitespace-pre-wrap text-white/90">{y.text}</p>
                      {isPoll && y.pollOptions && (<div className="mt-3 space-y-2">{[...y.pollOptions].sort((a:any,b:any)=> (b.votes||0)-(a.votes||0)).map((opt:any,idx:number)=>{ const total=y.totalVotes||1; const percent=Math.round((opt.votes/total)*100)||0; return(<button key={idx} onClick={()=>handlePollVote(y,y.pollOptions.indexOf(opt))} disabled={!!hasVoted} className="w-full relative overflow-hidden rounded-full border border-white/[0.08] text-left p-3 bg-white/[0.02]"><div className="absolute left-0 top-0 bottom-0 bg-white/[0.08]" style={{width:`${hasVoted? percent:0}%`}}></div><div className="relative flex justify-between items-center"><span className="text-[12px]">{opt.text}</span><span className="text-[11px] font-bold">{hasVoted? `${percent}%` : `${opt.votes||0}`}</span></div></button>); })}</div>)}
                      <div className="flex gap-2 mt-4"><div className="flex bg-white/[0.04] border border-white/[0.06] rounded-full p-1"><button onClick={()=>handleVote(y,'up')} className={`px-3 py-1 rounded-full text-[11px] font-bold ${liked?'bg-white text-black':'text-white/40'}`}>↑ {y.likes||0}</button><span className="px-2 py-1 text-[10px] text-white/15">•</span><button onClick={()=>handleVote(y,'down')} className={`px-3 py-1 rounded-full text-[11px] font-bold ${disliked?'bg-red-500 text-white':'text-white/30'}`}>↓ {y.dislikes||0}</button></div><button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); }} className="px-3 h-7 rounded-full text-[11px] bg-white/[0.04] border border-white/[0.06] text-white/40">💬 {y.commentsCount||0}</button><button onClick={()=>handleShare(y)} className="px-3 h-7 rounded-full text-[11px] bg-white/[0.04] border border-white/[0.06] text-white/40">↗ Share</button></div>
                      {activePost===y.id && (<div className="mt-4 border-t border-white/[0.06] pt-3"><div className="max-h-[350px] overflow-y-auto pr-1">{nestedTree.length===0 && <p className="text-[11px] text-white/20 text-center py-6">No comments yet</p>}{nestedTree.map((c:any)=>renderComment(c,0))}</div><div className="flex gap-2 mt-3"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={replyTo? `Reply to ${replyTo.username}` : "Add comment"} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 h-9 text-[12px] outline-none" onKeyDown={e=>{ if(e.key==='Enter') handleCommentPost(y.id); }}/><button onClick={()=>handleCommentPost(y.id)} className="w-9 h-9 rounded-full bg-white text-black text-[12px] font-bold">↗</button></div></div>)}
                    </div>
                  );
                })}
                {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : feedTab==='poll'? displayPollYaks : displayHotYaks).length===0 && <div className="py-20 text-center bg-white/[0.02] border border-white/[0.06] rounded-[16px]"><p className="font-bold text-[13px]">No posts yet</p><button onClick={()=>setScreen('create')} className="mt-4 bg-white text-black px-6 h-9 rounded-full text-[11px] font-bold">Create Post</button></div>}
                <Footer/>
              </>
            )}
          </>
        )}
        {screen==='dm' && (
          <div className="space-y-3">
            <div className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4">
              <div className="flex justify-between items-center"><p className="font-bold text-[13px]">DM • {dmChats.length}</p><button onClick={()=>setActiveDm(null)} className="text-[10px] bg-white/[0.06] px-3 py-1.5 rounded-full">All</button></div>
              {activeDm? (
                <div className="mt-4"><div className="flex justify-between"><p className="text-[11px] text-white/30">{activeDm.id.slice(0,8)}</p><button onClick={()=>setShowDmDeleteConfirm(activeDm)} className="text-[10px] bg-red-500/10 text-red-400 px-3 py-1 rounded-full">Delete</button></div><div className="max-h-[400px] overflow-y-auto mt-3 space-y-2">{dmMessages.map((m:any)=><div key={m.id} className={`p-3 rounded-[14px] max-w-[80%] text-[12px] ${m.uid===user?.uid?'bg-white text-black ml-auto':'bg-white/[0.06] border border-white/[0.08]'}`}><p>{m.text}</p>{m.uid===user?.uid && <button onClick={()=>handleDeleteDmMessage(activeDm.id, m.id)} className="text-[9px] opacity-50 mt-1">Delete</button>}</div>)}</div><div className="flex gap-2 mt-4"><input value={dmText} onChange={e=>setDmText(e.target.value)} placeholder="Message" className="flex-1 h-10 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 text-[12px]"/><button onClick={handleSendDm} className="w-10 h-10 bg-white text-black rounded-full font-bold">↗</button></div></div>
              ) : (<div className="mt-3 space-y-2">{dmChats.map((c:any)=><div key={c.id} className="flex justify-between items-center bg-white/[0.02] border border-white/[0.06] rounded-[14px] p-3"><button onClick={()=>setActiveDm(c)} className="flex-1 text-left"><p className="text-[12px] font-bold">Chat {c.participants.filter((p:string)=>p!==user?.uid)[0]?.slice(0,6)}</p><p className="text-[11px] text-white/40">{c.lastMessage?.slice(0,30)}</p></button><button onClick={()=>handleDeleteDmChat(c.id)} className="text-[10px] bg-red-500/10 text-red-400 px-3 py-1 rounded-full ml-2">Delete</button></div>)}{dmChats.length===0 && <p className="text-[11px] text-white/30 text-center py-8">No DMs</p>}</div>)}
            </div>
            <Footer/>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#000000]/95 backdrop-blur-xl border-t border-white/[0.06] z-30">
        <div className="max-w-[600px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <button onClick={()=>{ setScreen('feed'); setFeedTab('new'); }} className="flex flex-col items-center gap-1"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] ${screen==='feed'?'bg-white text-black':'bg-white/[0.06] text-white/40'}`}>⌂</div><span className={`text-[9px] font-bold ${screen==='feed'?'text-white':'text-white/30'}`}>FEED</span></button>
          <button onClick={()=>{ setScreen('dm'); }} className="flex flex-col items-center gap-1 relative"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] ${screen==='dm'?'bg-white text-black':'bg-white/[0.06] text-white/40'}`}>✉</div><span className={`text-[9px] font-bold ${screen==='dm'?'text-white':'text-white/30'}`}>DM</span>{dmChats.length>0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[8px] flex items-center justify-center font-bold">{dmChats.length}</span>}</button>
          <button onClick={()=>setScreen('create')} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center text-[20px] font-black shadow-xl">+</button>
          <button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1"><div className="w-7 h-7 bg-white/[0.06] rounded-full flex items-center justify-center text-[12px]">👤</div><span className="text-[9px] font-bold text-white/30">PROFILE</span></button>
        </div>
      </div>

            {screen==='create' && (
        <div className="fixed inset-0 bg-[#000000] z-40 flex flex-col">
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full">
            <div className="p-4 flex items-center justify-between border-b border-white/[0.06]"><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-white/[0.06] rounded-full">✕</button><p className="text-[11px] font-bold">CREATE</p><button onClick={handlePost} disabled={posting||!newYak.trim()} className={`px-5 h-8 rounded-full font-bold text-[11px] ${posting||!newYak.trim()?'bg-white/[0.06] text-white/20':'bg-white text-black'}`}>{posting?'...':'POST'}</button></div>
            <div className="p-4 flex gap-2 border-b border-white/[0.04] overflow-x-auto"><button onClick={()=>setYakType('yak')} className={`px-4 h-8 rounded-full text-[11px] font-bold border ${yakType==='yak'?'bg-white text-black':'bg-white/[0.04] border-white/[0.06] text-white/40'}`}>TALK</button><button onClick={()=>setYakType('poll')} className={`px-4 h-8 rounded-full text-[11px] font-bold border ${yakType==='poll'?'bg-white text-black':'bg-white/[0.04] border-white/[0.06] text-white/40'}`}>POLL</button><button onClick={()=>setYakType('meme')} className={`px-4 h-8 rounded-full text-[11px] font-bold border ${yakType==='meme'?'bg-white text-black':'bg-white/[0.04] border-white/[0.06] text-white/40'}`}>MEME</button><button onClick={()=>setYakType('market')} className={`px-4 h-8 rounded-full text-[11px] font-bold border ${yakType==='market'?'bg-white text-black':'bg-white/[0.04] border-white/[0.06] text-white/40'}`}>MARKET</button><button onClick={()=>setYakType('pyq')} className={`px-4 h-8 rounded-full text-[11px] font-bold border ${yakType==='pyq'?'bg-white text-black':'bg-white/[0.04] border-white/[0.06] text-white/40'}`}>PYQ</button></div>
            <div className="p-4 flex-1 overflow-y-auto">
              {yakType==='market' && <input value={marketPrice} onChange={e=>setMarketPrice(e.target.value)} placeholder="Price ₹" className="w-24 p-3 bg-white/[0.04] border border-white/[0.06] rounded-[12px] text-[12px] mb-3"/>}
              {yakType==='pyq' && <input value={pyqSubject} onChange={e=>setPyqSubject(e.target.value.toUpperCase())} placeholder="Subject" className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-[12px] text-[12px] mb-3"/>}
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="What's happening in SRET?" autoFocus className="w-full bg-transparent text-[18px] outline-none placeholder:text-white/20 resize-none min-h-[120px]" maxLength={300}/>
              <p className="text-[10px] text-white/20 mt-3">{newYak.length}/300</p>
              {yakType==='poll' && (<div className="mt-4 space-y-2">{pollOptions.map((opt,idx)=><div key={idx} className="flex gap-2"><input value={opt} onChange={e=>{ const n=[...pollOptions]; n[idx]=e.target.value; setPollOptions(n); }} placeholder={`Option ${idx+1}`} className="flex-1 p-3 bg-white/[0.04] border border-white/[0.06] rounded-[12px] text-[12px]"/>{pollOptions.length>2 && <button onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))} className="w-10 h-10 bg-white/[0.04] rounded-[12px]">✕</button>}</div>)}{pollOptions.length<4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="w-full p-2.5 border border-dashed border-white/[0.08] rounded-[12px] text-[11px] text-white/30">+ Add Option</button>}</div>)}
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 z-[150] flex items-end justify-center p-4">
          <div className="bg-[#111111] border border-white/[0.08] w-full max-w-[600px] rounded-t-[20px] p-5 pb-8 max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5"></div>
            <div className="flex items-center gap-3"><div className="w-12 h-12 bg-white/[0.06] rounded-[14px] flex items-center justify-center">👤</div><div><p className="font-bold text-[13px]">Anonymous {isAdmin(user?.email) && <span className="bg-red-600 text-[9px] px-2 py-0.5 rounded-full ml-2">ADMIN</span>}</p><p className="text-[11px] text-white/40">Karma {userData?.yakarma||0} • {userData?.totalPosts||0} posts</p><p className="text-[10px] text-white/20">{user?.email}</p></div></div>
            <div className="mt-5 grid grid-cols-3 gap-2"><button onClick={()=>{ setShowProfile(false); }} className="py-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-bold">MARKET {marketYaks.length}</button><button onClick={()=>{ setShowProfile(false); }} className="py-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-bold">PYQ {pyqYaks.length}</button><button onClick={()=>{ setShowProfile(false); }} className="py-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-bold">CRUSH {crushMatches.length}</button></div>
            <div className="mt-4 bg-white/[0.02] border border-white/[0.06] rounded-[14px] p-3"><div className="flex justify-between"><p className="text-[11px] font-bold">🚫 Blocked • {blockedUsers.length}</p></div><div className="mt-3 max-h-[150px] overflow-y-auto space-y-2">{blockedUsers.length===0 ? <p className="text-[11px] text-white/20 text-center py-4">No blocked</p> : blockedUsers.map(uid=><div key={uid} className="flex justify-between items-center bg-black/40 border border-white/[0.04] rounded-[12px] p-3"><p className="text-[11px] font-mono">{uid.slice(0,12)}...</p><button onClick={()=>handleUnblockUser(uid)} className="px-3 py-1 bg-white text-black rounded-full text-[10px] font-bold">Unblock</button></div>)}</div></div>
            <div className="mt-4 space-y-2"><button onClick={()=>{ setShowProfile(false); setShowNotifications(true); }} className="w-full py-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-bold">🔔 Alerts • {collegeAlertsList.length}</button><button onClick={()=>{ setShowProfile(false); setShowAdmin(true); }} className="w-full py-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-bold">Admin • {adminReports.length}</button><button onClick={()=>setShowLogoutConfirm(true)} className="w-full py-3 rounded-full bg-red-600 text-white text-[11px] font-bold">Logout</button><button onClick={()=>setShowProfile(false)} className="w-full py-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px]">Close</button></div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (<div className="fixed inset-0 bg-black/70 z-[160] flex items-center justify-center p-4"><div className="bg-[#111111] border border-white/[0.08] rounded-[16px] p-5 w-full max-w-sm text-center"><p className="font-bold text-[13px]">Logout?</p><div className="flex gap-2 mt-4"><button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-full bg-white/[0.06] text-[11px]">Cancel</button><button onClick={handleLogout} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-[11px] font-bold">Logout</button></div></div></div>)}
      {editingPost && <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4"><div className="bg-[#111111] border border-white/[0.08] w-full max-w-[600px] rounded-t-[20px] p-5 pb-8"><p className="font-bold text-[13px]">Edit Post</p><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-4 bg-white/[0.04] border border-white/[0.06] rounded-[12px] p-3 text-[13px] min-h-[100px] resize-none"/><div className="flex gap-2 mt-4"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-10 bg-white/[0.06] border border-white/[0.08] rounded-full text-[11px]">Cancel</button><button onClick={handleEdit} className="flex-1 h-10 bg-white text-black rounded-full text-[11px] font-bold">Save</button></div></div></div>}
      {reportingPost && (<div className="fixed inset-0 bg-black/70 z-[180] flex items-center justify-center p-4"><div className="bg-[#111111] border border-white/[0.08] rounded-[16px] p-4 w-full max-w-sm"><p className="font-bold text-[13px]">Report</p><p className="text-[10px] text-white/30 mt-1">Auto delete at {REPORT_DELETE_THRESHOLD} reports</p><div className="mt-3 space-y-2">{REPORT_REASONS.map(r=><button key={r} onClick={()=>setReportReason(r)} className={`w-full text-left px-3 py-2.5 rounded-full text-[11px] border ${reportReason===r?'bg-white text-black':'bg-white/[0.04] border-white/[0.06] text-white/60'}`}>{r}</button>)}</div><div className="flex gap-2 mt-3"><button onClick={()=>{ setReportingPost(null); setReportReason(''); }} className="flex-1 py-2.5 rounded-full bg-white/[0.06] text-[11px]">Cancel</button><button onClick={()=>handleReport(reportingPost, reportReason)} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-[11px] font-bold">Report</button></div></div></div>)}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/80 z-[170] flex items-end justify-center p-4">
          <div className="bg-[#111111] border border-white/[0.08] w-full max-w-[600px] rounded-t-[20px] p-5 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center"><p className="font-bold text-[14px]">🔔 Notifications</p><button onClick={()=>setShowNotifications(false)} className="w-8 h-8 bg-white/[0.06] rounded-full">✕</button></div>
            <div className="mt-5"><div className="flex justify-between items-center"><p className="text-[11px] font-bold text-white/40">COLLEGE ALERTS • {collegeAlertsList.length}</p><button onClick={()=>setShowCollegeAlertAdmin(true)} className="text-[10px] bg-white text-black px-3 py-1 rounded-full font-bold">+ New</button></div><div className="mt-3 space-y-2">{collegeAlertsList.map((a:any)=><div key={a.id} className="bg-red-500/10 border border-red-500/20 rounded-[14px] p-3"><div className="flex justify-between"><span className="bg-red-500/20 text-red-400 text-[9px] px-2 py-1 rounded-full font-bold">#{a.type}</span><div className="flex gap-2"><button onClick={()=>{ setEditingAlert(a); setEditAlertTitle(a.title); setEditAlertDesc(a.desc); setEditAlertType(a.type); }} className="text-[10px] bg-white/10 px-2 py-1 rounded-full">Edit</button><button onClick={()=>handleDeleteAlert(a.id)} className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Delete</button></div></div><p className="font-bold text-[13px] mt-2">{a.title}</p><p className="text-[11px] text-white/60 mt-1">{a.desc}</p></div>)}{collegeAlertsList.length===0 && <p className="text-[11px] text-white/20 text-center py-4">No alerts</p>}</div></div>
            <div className="mt-6 pt-5 border-t border-white/[0.06]"><p className="text-[11px] font-bold text-white/40">OTHER NOTIFICATIONS</p><div className="mt-3 space-y-2">{notifications.map((n:any)=><div key={n.id} className="p-3 rounded-[12px] border border-white/[0.06] bg-white/[0.02]"><p className="text-[11px] font-bold">{n.type}</p><p className="text-[11px] text-white/50 mt-1">{n.text}</p></div>)}{notifications.length===0 && <p className="text-[11px] text-white/20 text-center py-4">No notifications</p>}</div></div>
          </div>
        </div>
      )}
      {showAdmin && (<div className="fixed inset-0 bg-black/70 z-[175] flex items-end justify-center p-4"><div className="bg-[#111111] border border-white/[0.08] w-full max-w-[600px] rounded-t-[20px] p-5 pb-8 max-h-[80vh] overflow-y-auto"><div className="flex justify-between items-center"><p className="font-bold text-[13px]">Admin Reports</p><button onClick={()=>setShowAdmin(false)} className="w-8 h-8 bg-white/[0.06] rounded-full">✕</button></div><div className="mt-4 space-y-2">{adminReports.map((r:any)=><div key={r.id} className="bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-3"><p className="text-[11px] font-bold text-red-400">{r.reason}</p><p className="text-[11px] mt-1">{r.yakText}</p><div className="flex gap-2 mt-2"><button onClick={()=>handleAdminRestore(r)} className="px-3 h-7 rounded-full bg-green-600 text-white text-[10px]">Restore</button><button onClick={()=>handleAdminDelete(r)} className="px-3 h-7 rounded-full bg-red-600 text-white text-[10px]">Delete</button><button onClick={()=>handleAdminDismiss(r)} className="px-3 h-7 rounded-full bg-white/[0.06] text-white text-[10px]">Dismiss</button></div></div>)}{adminReports.length===0 && <p className="text-[11px] text-white/20 text-center py-8">No reports</p>}</div></div></div>)}
      {showCollegeAlertAdmin && (<div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4"><div className="bg-[#111111] border border-white/[0.08] rounded-[16px] p-4 w-full max-w-sm"><p className="font-bold text-[13px]">New Alert</p><select value={newAlertType} onChange={e=>setNewAlertType(e.target.value)} className="w-full mt-3 p-2.5 bg-black border border-white/[0.08] rounded-[12px] text-[12px]"><option>ExamAlert</option><option>Holiday</option><option>FeeDue</option><option>Placement</option><option>Event</option><option>Official</option></select><input value={newAlertTitle} onChange={e=>setNewAlertTitle(e.target.value)} placeholder="Title" className="w-full mt-3 p-2.5 bg-black border border-white/[0.08] rounded-[12px] text-[12px]"/><textarea value={newAlertDesc} onChange={e=>setNewAlertDesc(e.target.value)} placeholder="Description" className="w-full mt-3 p-2.5 bg-black border border-white/[0.08] rounded-[12px] text-[12px] h-20"/><div className="flex gap-2 mt-3"><button onClick={()=>setShowCollegeAlertAdmin(false)} className="flex-1 py-2.5 rounded-full bg-white/[0.06] text-[11px]">Cancel</button><button onClick={postCollegeAlert} className="flex-1 py-2.5 rounded-full bg-white text-black text-[11px] font-bold">Post</button></div></div></div>)}
      {editingAlert && (<div className="fixed inset-0 bg-black/70 z-[210] flex items-center justify-center p-4"><div className="bg-[#111111] border border-white/[0.08] rounded-[16px] p-4 w-full max-w-sm"><p className="font-bold text-[13px]">Edit Alert</p><select value={editAlertType} onChange={e=>setEditAlertType(e.target.value)} className="w-full mt-3 p-2.5 bg-black border border-white/[0.08] rounded-[12px] text-[12px]"><option>ExamAlert</option><option>Holiday</option><option>FeeDue</option><option>Placement</option><option>Event</option><option>Official</option></select><input value={editAlertTitle} onChange={e=>setEditAlertTitle(e.target.value)} placeholder="Title" className="w-full mt-3 p-2.5 bg-black border border-white/[0.08] rounded-[12px] text-[12px]"/><textarea value={editAlertDesc} onChange={e=>setEditAlertDesc(e.target.value)} placeholder="Description" className="w-full mt-3 p-2.5 bg-black border border-white/[0.08] rounded-[12px] text-[12px] h-20"/><div className="flex gap-2 mt-3"><button onClick={()=>setEditingAlert(null)} className="flex-1 py-2.5 rounded-full bg-white/[0.06] text-[11px]">Cancel</button><button onClick={handleUpdateAlert} className="flex-1 py-2.5 rounded-full bg-white text-black text-[11px] font-bold">Update</button></div></div></div>)}
      {showDmDeleteConfirm && (<div className="fixed inset-0 bg-black/70 z-[220] flex items-center justify-center p-4"><div className="bg-[#111111] border border-white/[0.08] rounded-[16px] p-5 w-full max-w-sm text-center"><p className="font-bold text-[13px]">Delete DM?</p><p className="text-[11px] text-white/40 mt-1">All messages will be deleted</p><div className="flex gap-2 mt-4"><button onClick={()=>setShowDmDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full bg-white/[0.06] text-[11px]">Cancel</button><button onClick={()=>handleDeleteDmChat(showDmDeleteConfirm.id)} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-[11px] font-bold">Delete</button></div></div></div>)}
    </div>
  );
}
