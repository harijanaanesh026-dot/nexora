import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { getMessaging, getToken } from "firebase/messaging";

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
const AVATARS = ["👻","❤️","🩶","💛","🖤","🩵","💜","💙","🩷","💚","💝","🤎","🤍","🦊","🐼","🐯","🦉","👽","🤖","💀"];
const ANON_NAMES = ["Anonymous Owl","Secret Tiger","Hidden Fox","Silent Panda","Ghost User","Shadow Yak","Night Wolf","Dark Eagle","Silent Cat","Mystic Deer"];
const REPORT_REASONS = ["Spam","Abusive","Fake Info","NSFW","Harassment","Other"];
const BAD_WORDS = ["fuck","sex","porn","xxx","boobs","pussy","dick","cock","nude","slut","bitch","asshole","rape","gaand","gandu","loda","chod","chutiya","lund","randi","bsdk"];
const containsVulgar = (t:string) => BAD_WORDS.some(w=>t?.toLowerCase().includes(w));
const Footer = () => (<div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.2em] font-bold text-white/40">© 2026 DABEAN A PRODUCTION BY ANESH</p><p className="text-[8px] text-white/20 mt-1">v1.0.0 • SRET</p></div>);

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
  const [editingAlert, setEditingAlert] = useState<any>(null);
  const [editAlertTitle, setEditAlertTitle] = useState('');
  const [editAlertDesc, setEditAlertDesc] = useState('');
  const [editAlertType, setEditAlertType] = useState('ExamAlert');
  const [showDmDeleteConfirm,setShowDmDeleteConfirm]=useState<any>(null);
  const [showCommentMenu,setShowCommentMenu]=useState<string|null>(null);
  const [anonNameEdit,setAnonNameEdit]=useState('');
  const [notifReplies,setNotifReplies]=useState(true);
  const [notifLikes,setNotifLikes]=useState(true);
  const [notifDMs,setNotifDMs]=useState(true);
  const [notifPolls,setNotifPolls]=useState(true);
  const [whoCanDM,setWhoCanDM]=useState<'everyone'|'verified'|'none'>('everyone');
  const [onlineStatus,setOnlineStatus]=useState(true);
  const [readReceipts,setReadReceipts]=useState(true);
  const [darkMode,setDarkMode]=useState<'dark'|'light'|'system'>('dark');
  const [sretOnlyMode,setSretOnlyMode]=useState(true);
  const [branchPref,setBranchPref]=useState('All');
  const [yearPref,setYearPref]=useState('All');
  const [messageRequests,setMessageRequests]=useState(true);
  const [chatPrivacy,setChatPrivacy]=useState<'everyone'|'following'|'none'>('everyone');
  const [ghostHideOnline,setGhostHideOnline]=useState(false);
  const [ghostHideActivity,setGhostHideActivity]=useState(false);
  const [savedPosts,setSavedPosts]=useState<string[]>([]);
  const [feedbackText,setFeedbackText]=useState('');
  const [showBlockedList,setShowBlockedList]=useState(false);
  const [showDeleteAccountConfirm,setShowDeleteAccountConfirm]=useState(false);
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
          await addDoc(collection(db,'users'),{uid:u.uid,email:u.email||'',username:anonName,anonymousName:anonName,avatar:localStorage.getItem('selected_avatar')||'👻',college:"SRET",collegeEmail:String(localStorage.getItem('college_email')||''),rollNumber:String(localStorage.getItem('roll_number')||''),isAnonymous:true,yakarma:100,totalPosts:0,likedPosts:[],dislikedPosts:[],pollVoted:[],reportedPosts:[],blockedUsers:[],savedPosts:[],settings:{notifReplies:true,notifLikes:true,notifDMs:true,notifPolls:true,whoCanDM:'everyone',onlineStatus:true,readReceipts:true,darkMode:'dark',sretOnlyMode:true,branchPref:'All',yearPref:'All',messageRequests:true,chatPrivacy:'everyone',ghostHideOnline:false,ghostHideActivity:false},createdAt:serverTimestamp()});
          window.location.reload();
        }else{
          const data={id:snap.docs[0].id,...snap.docs[0].data()} as any;
          setUserData(data);
          setAnonNameEdit(data.anonymousName||data.username||'');
          setSelectedAvatar(data.avatar||'👻');
          if(data.settings){
            setNotifReplies(data.settings.notifReplies??true);
            setNotifLikes(data.settings.notifLikes??true);
            setNotifDMs(data.settings.notifDMs??true);
            setNotifPolls(data.settings.notifPolls??true);
            setWhoCanDM(data.settings.whoCanDM||'everyone');
            setOnlineStatus(data.settings.onlineStatus??true);
            setReadReceipts(data.settings.readReceipts??true);
            setDarkMode(data.settings.darkMode||'dark');
            setSretOnlyMode(data.settings.sretOnlyMode??true);
            setBranchPref(data.settings.branchPref||'All');
            setYearPref(data.settings.yearPref||'All');
            setMessageRequests(data.settings.messageRequests??true);
            setChatPrivacy(data.settings.chatPrivacy||'everyone');
            setGhostHideOnline(data.settings.ghostHideOnline||false);
            setGhostHideActivity(data.settings.ghostHideActivity||false);
          }
          if(data.savedPosts) setSavedPosts(data.savedPosts);
          setScreen('feed');
        }
      }else setScreen('college');
    });
  },[isVerified]);
  useEffect(()=>{ if(userData?.blockedUsers) setBlockedUsers(userData.blockedUsers); },[userData]);
  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(collection(db,'yaks'), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((d:any)=>!d.hidden).filter((d:any)=>!containsVulgar(d.text));
      let data=all.filter(d=>d.college==="SRET" ||!d.college);
      if(sretOnlyMode) data=data.filter(d=>d.college==="SRET");
      if(branchPref!=='All') data=data.filter(d=>!d.branch || d.branch===branchPref);
      if(yearPref!=='All') data=data.filter(d=>!d.year || d.year===yearPref);
      data.sort((a,b)=> (b.createdAt?.toMillis?.()||b.createdAt?.seconds*1000||0) - (a.createdAt?.toMillis?.()||a.createdAt?.seconds*1000||0));
      setYaks(data);
      setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
      setMemeYaks([...data].filter(d=>d.type==='meme').slice(0,20));
      setMarketYaks([...data].filter(d=>d.type==='market').slice(0,30));
      setPyqYaks([...data].filter(d=>d.type==='pyq').slice(0,30));
      const tagCount:Record<string,number>={}; data.forEach(y=>{ const tags=y.text?.match(/#\w+/g); if(tags) tags.forEach((t:string)=>{ tagCount[t.toLowerCase()]=(tagCount[t.toLowerCase()]||0)+1; }); }); setHashtags(Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([tag,count])=>({tag,count})));
    });
  },[userData, sretOnlyMode, branchPref, yearPref]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'users'), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)); const same=all.filter(u=>u.college==="SRET"||!u.college); setLeaderboard(same.sort((a,b)=>b.yakarma-a.yakarma).slice(0,20)); }); },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((c:any)=>!containsVulgar(c.text)))); },[activePost]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'notifications'),where('toUid','==',user.uid),orderBy('createdAt','desc')), s=>{ const nots=s.docs.map(d=>({id:d.id,...d.data()})); setNotifications(nots as any); setUnreadCount((nots as any).filter((n:any)=>!n.read).length); }); },[user]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'dms'),where('participants','array-contains',user.uid)), s=>{ const chats=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((c:any)=> c.participants.length===2); chats.sort((a:any,b:any)=>(b.lastMessageAt?.toMillis?.()||0)-(a.lastMessageAt?.toMillis?.()||0)); setDmChats(chats as any); }); },[user]);
  useEffect(()=>{ if(!activeDm) return; return onSnapshot(query(collection(db,'dms/'+activeDm.id+'/messages'),orderBy('createdAt','asc')), s=>setDmMessages(s.docs.map(d=>({id:d.id,...d.data()})))); },[activeDm]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'crushes'),where('fromUid','==',user.uid)), s=>setCrushMatches(s.docs.map(d=>({id:d.id,...d.data()})))); },[user]);
  useEffect(()=>{ if(!userData) return; return onSnapshot(query(collection(db,'reports'),where('status','==','pending'),orderBy('createdAt','desc')), s=>setAdminReports(s.docs.map(d=>({id:d.id,...d.data()})))); },[userData]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'college_alerts'), s=>{ const all = s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((a:any)=> a.college==="SRET").sort((a:any,b:any)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)); setCollegeAlertsList(all); }); },[userData]);

    const getCollegeConfig=()=>COLLEGES.find(c=>c.id==="SRET");
  const handleCollegeNext=()=>{ localStorage.setItem('selected_college',"SRET"); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); const emailLower=collegeEmail.toLowerCase().trim(); if(!config!.domains.some(d=>emailLower.endsWith(d))){ setVerifyError(`Only ${config!.domains.join(' or ')} allowed`); return; } const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower))); if(!dup.empty){ setVerifyError('Email already used'); return; } const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode); await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()} as any); setOtpSent(true); showToast("OTP: "+otpCode); };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ const rollUpper=rollNumber.trim().toUpperCase(); const config=getCollegeConfig(); if(!config!.pattern.test(rollUpper)){ setVerifyError(`Invalid Roll - Ex: ${config!.ex}`); return; } const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper))); if(!dup.empty){ setVerifyError('Roll already used'); return; } localStorage.setItem('roll_number',rollUpper); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleLogout=async()=>{ await signOut(auth); localStorage.clear(); window.location.reload(); };
  const saveSettings=async(newSettings:any)=>{ if(!userData) return; try{ await updateDoc(doc(db,'users',userData.id),{settings:newSettings}); }catch(e:any){ showToast(e.message); } };
  const handleSaveProfile=async()=>{
    if(!userData) return;
    if(containsVulgar(anonNameEdit)){ showToast("Vulgar not allowed"); return; }
    try{ await updateDoc(doc(db,'users',userData.id),{anonymousName:anonNameEdit.trim(), username:anonNameEdit.trim(), avatar:selectedAvatar}); showToast("Profile updated"); }catch(e:any){ showToast(e.message); }
  };
  const postCollegeAlert=async()=>{ if(!newAlertTitle.trim()||!newAlertDesc.trim()) return; await addDoc(collection(db,'college_alerts'),{title:newAlertTitle.trim(),desc:newAlertDesc.trim(),type:newAlertType,college:"SRET",createdBy:user.uid,createdAt:serverTimestamp()}); setNewAlertTitle(''); setNewAlertDesc(''); setShowCollegeAlertAdmin(false); };
  const handleDeleteAlert=async(id:string)=>{ if(!confirm("Delete?")) return; await deleteDoc(doc(db,'college_alerts',id)); };
  const handleUpdateAlert=async()=>{ if(!editingAlert) return; await updateDoc(doc(db,'college_alerts',editingAlert.id),{title:editAlertTitle.trim(),desc:editAlertDesc.trim(),type:editAlertType}); setEditingAlert(null); };
  const handleDeleteDmChat=async(chatId:string)=>{ if(!confirm("Delete DM?")) return; const msgsSnap = await getDocs(collection(db,'dms/'+chatId+'/messages')); for(const m of msgsSnap.docs){ await deleteDoc(doc(db,'dms/'+chatId+'/messages',m.id)); } await deleteDoc(doc(db,'dms',chatId)); if(activeDm?.id===chatId) setActiveDm(null); setShowDmDeleteConfirm(null); };
  const handleDeleteDmMessage=async(chatId:string, messageId:string)=>{ if(!confirm("Delete?")) return; await deleteDoc(doc(db,'dms/'+chatId+'/messages',messageId)); };
  const handleDeleteComment=async(yakId:string, commentId:string)=>{ if(!confirm("Delete comment?")) return; await deleteDoc(doc(db,'yaks/'+yakId+'/comments',commentId)); await updateDoc(doc(db,'yaks',yakId),{commentsCount:increment(-1)}); };
  const handleUnblockUser=async(uid:string)=>{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayRemove(uid)}); setBlockedUsers(blockedUsers.filter(id=>id!==uid)); showToast("Unblocked"); };
  const handleDeleteAccount=async()=>{
    try{
      const userPosts = await getDocs(query(collection(db,'yaks'), where('uid','==',user.uid)));
      for(const p of userPosts.docs){ await deleteDoc(doc(db,'yaks',p.id)); }
      await deleteDoc(doc(db,'users',userData.id));
      if(auth.currentUser) await deleteUser(auth.currentUser);
      localStorage.clear(); window.location.reload();
    }catch(e:any){ showToast(e.message); }
  };
  const handleToggleSavePost=async(yakId:string)=>{
    try{
      if(savedPosts.includes(yakId)){ await updateDoc(doc(db,'users',userData.id),{savedPosts:arrayRemove(yakId)}); setSavedPosts(savedPosts.filter(id=>id!==yakId)); showToast("Unsaved"); }
      else{ await updateDoc(doc(db,'users',userData.id),{savedPosts:arrayUnion(yakId)}); setSavedPosts([...savedPosts, yakId]); showToast("Saved"); }
    }catch(e:any){ showToast(e.message); }
  };
  const handleSendFeedback=async()=>{
    if(!feedbackText.trim()) return;
    await addDoc(collection(db,'feedbacks'),{uid:user.uid, text:feedbackText.trim(), college:"SRET", createdAt:serverTimestamp()});
    setFeedbackText(''); showToast("Feedback sent");
  };
  const Toggle = ({enabled, onToggle}:{enabled:boolean, onToggle:()=>void})=>(
    <button onClick={onToggle} className={`w-11 h-6 rounded-full flex items-center px-0.5 ${enabled?'bg-white justify-end':'bg-white/15 justify-start'}`}><div className={`w-5 h-5 rounded-full ${enabled?'bg-black':'bg-white/40'}`}></div></button>
  );

  if(screen==='college'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style>{toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}<div className="max-w-md mx-auto p-6 min-h-screen"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-bold">S</div><p className="font-bold text-sm">SRET ANON</p></div><h1 className="text-[36px] font-bold mt-8 leading-[0.9]">Talk<br/>Beyond<br/><span className="text-white/30">Identity</span></h1><div className="grid grid-cols-5 gap-2 mt-8">{AVATARS.slice(0,10).map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-14 rounded-[14px] text-lg border ${selectedAvatar===a?'bg-white text-black':'bg-white/[0.05] border-white/10'}`}>{a}</button>)}</div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-bold bg-white text-black">Enter SRET</button><Footer/></div></div>);
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><div className="max-w-md mx-auto p-6 min-h-screen"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full">←</button><h2 className="font-bold text-[18px] mt-6">Verify SRET</h2><div className="flex p-1 bg-white/5 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll</button></div>{verifyError && <p className="text-xs text-red-400 mt-4">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3 rounded-full font-bold text-sm">Send OTP</button>{otpSent&&<div className="mt-4"><p className="text-xs text-emerald-400">OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" className="w-full mt-2 p-3 bg-white/5 border border-white/10 rounded-xl text-center"/><button onClick={handleOtpSubmit} className="w-full mt-2 bg-white text-black py-3 rounded-full font-bold">Verify</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={config?.ex} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl uppercase font-bold"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3 rounded-full font-bold">Verify</button></div>}<Footer/></div></div>);
  }
  if(screen==='login'){ return (<div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-20 h-20 bg-white/5 rounded-[20px] flex items-center justify-center text-3xl">{selectedAvatar}</div><h1 className="font-bold text-[18px] mt-6">Anonymous Ready</h1><button onClick={handleGoogleLogin} className="w-full mt-6 bg-white text-black py-3 rounded-full font-bold">Continue</button></div><Footer/></div>); }

    const handleVote=async(y:any,type:'up'|'down')=>{
    if(!userData) return; const yakRef=doc(db,'yaks',y.id); const userRef=doc(db,'users',userData.id); const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
    if(type==='up'){
      if(liked){ await updateDoc(yakRef,{likes:increment(-1)}); await updateDoc(userRef,{likedPosts:arrayRemove(y.id)}); }
      else if(disliked){ await updateDoc(yakRef,{likes:increment(1), dislikes:increment(-1)}); await updateDoc(userRef,{dislikedPosts:arrayRemove(y.id), likedPosts:arrayUnion(y.id)}); }
      else{ await updateDoc(yakRef,{likes:increment(1)}); await updateDoc(userRef,{likedPosts:arrayUnion(y.id)}); }
    }else{
      if(disliked){ await updateDoc(yakRef,{dislikes:increment(-1)}); await updateDoc(userRef,{dislikedPosts:arrayRemove(y.id)}); }
      else if(liked){ await updateDoc(yakRef,{likes:increment(-1), dislikes:increment(1)}); await updateDoc(userRef,{likedPosts:arrayRemove(y.id), dislikedPosts:arrayUnion(y.id)}); }
      else{ await updateDoc(yakRef,{dislikes:increment(1)}); await updateDoc(userRef,{dislikedPosts:arrayUnion(y.id)}); }
    }
  };
  const handlePollVote=async(y:any, idx:number)=>{ if(userData.pollVoted?.includes(y.id)) return; const n=[...y.pollOptions]; n[idx].votes++; await updateDoc(doc(db,'yaks',y.id),{pollOptions:n, totalVotes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{pollVoted:arrayUnion(y.id)}); };
  const handlePost=async()=>{
    if(!newYak.trim()) return;
    if(containsVulgar(newYak)) return;
    if(yakType==='poll' && pollOptions.filter(o=>o.trim()).length<2) return;
    setPosting(true);
    try{
      const payload:any={ text:newYak.trim(), uid:user.uid, username:userData?.anonymousName||"Anonymous", college:"SRET", type:yakType, likes:0, dislikes:0, commentsCount:0, reports:0, hidden:false, createdAt:serverTimestamp() };
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; }
      if(yakType==='market'){ payload.price=marketPrice; }
      if(yakType==='pyq'){ payload.subject=pyqSubject.toUpperCase(); }
      if(branchPref!=='All') payload.branch=branchPref;
      if(yearPref!=='All') payload.year=yearPref;
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1)});
      setNewYak(''); setPollOptions(['','']); setMarketPrice(''); setYakType('yak'); setScreen('feed');
    }catch{}finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(user?.uid!==y.uid) return; if(!confirm("Delete?")) return; await deleteDoc(doc(db,'yaks',y.id)); };
  const handleEdit=async()=>{ if(!editingPost) return; await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim()}); setEditingPost(null); };
  const handleReport=async(y:any)=>{ if(!reportReason) return; await addDoc(collection(db,'reports'),{yakId:y.id, yakText:y.text.slice(0,100), yakUid:y.uid, reportedBy:user.uid, reason:reportReason, status:"pending", createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{reports:increment(1)}); setReportingPost(null); setReportReason(''); setShowMenu(null); };
  const handleAdminRestore=async(r:any)=>{ await updateDoc(doc(db,'yaks',r.yakId),{hidden:false, reports:0}); await updateDoc(doc(db,'reports',r.id),{status:"dismissed"}); };
  const handleAdminDelete=async(r:any)=>{ await deleteDoc(doc(db,'yaks',r.yakId)); await updateDoc(doc(db,'reports',r.id),{status:"deleted"}); };
  const handleAdminDismiss=async(r:any)=>{ await updateDoc(doc(db,'reports',r.id),{status:"dismissed"}); };
  const buildTree = (flat:any[]) => { const map:Record<string, any> = {}; const roots:any[] = []; flat.forEach(c => { map[c.id] = {...c, replies: []}; }); flat.forEach(c => { if(c.parentId && map[c.parentId]){ map[c.parentId].replies.push(map[c.id]); } else { roots.push(map[c.id]); } }); return roots; };
  const handleCommentPost = async (yId:string) => {
    if(!commentText.trim()) return;
    await addDoc(collection(db,'yaks/'+yId+'/comments'), { text:commentText.trim(), uid:user.uid, username:userData?.anonymousName||"Anonymous", parentId: replyTo? replyTo.id : null, replyToUsername: replyTo? replyTo.username : null, createdAt: serverTimestamp() });
    await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); setCommentText(''); setReplyTo(null);
  };
  const handleStartDm = async (otherUid:string)=>{
    if(otherUid===user?.uid) return;
    if(whoCanDM==='none'){ showToast("DM disabled in settings"); return; }
    const existing=dmChats.find(c=> c.participants.includes(otherUid)); if(existing){ setActiveDm(existing); setFeedTab('dm'); return; }
    const newChat=await addDoc(collection(db,'dms'),{ participants:[user.uid, otherUid], lastMessage:"Hi", lastMessageAt:serverTimestamp(), createdAt:serverTimestamp() }); setActiveDm({id:newChat.id, participants:[user.uid, otherUid]}); setFeedTab('dm');
  };
  const handleSendDm=async()=>{ if(!dmText.trim()||!activeDm) return; await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{ text:dmText.trim(), uid:user.uid, createdAt:serverTimestamp() }); await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:dmText.trim(), lastMessageAt:serverTimestamp()}); setDmText(''); };
  const markNotificationsRead=async()=>{ for(const n of notifications.filter((n:any)=>!n.read)){ await updateDoc(doc(db,'notifications',n.id),{read:true}); } };
  const handleBlockUser=async(uid:string)=>{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(uid)}); };
  const handleCrushSubmit=async()=>{ const roll=crushRoll.trim().toUpperCase(); if(!roll) return; await addDoc(collection(db,'crushes'),{fromUid:user.uid, toRoll:roll, matched:false, createdAt:serverTimestamp()}); setCrushRoll(''); };
  const handleCancelCrush=async(id:string)=>{ await deleteDoc(doc(db,'crushes',id)); };
  const renderComment = (c:any, depth=0) => {
    const isOwn = c.uid===user?.uid;
    return (
      <div key={c.id} className={`${depth>0? 'ml-6 border-l border-white/10 pl-3' : ''} mt-3`}>
        <div className="flex gap-2">
          <div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-xs">A</div>
          <div className="flex-1">
            <div className="bg-white/[0.05] border border-white/10 rounded-[12px] px-3 py-2">
              <div className="flex justify-between"><p className="text-[10px] text-white/40">Anonymous {isOwn?'- You':''}</p><button onClick={()=>setShowCommentMenu(showCommentMenu===c.id?null:c.id)} className="w-5 h-5 bg-white/5 rounded-full text-[10px]">...</button></div>
              {showCommentMenu===c.id && <div className="mt-1 bg-black border border-white/10 rounded-lg p-1">{isOwn? <button onClick={()=>{ if(activePost) handleDeleteComment(activePost,c.id); }} className="w-full text-left px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded">Delete</button> : <button onClick={()=>{ setReplyTo(c); setShowCommentMenu(null); }} className="w-full text-left px-2 py-1 text-xs bg-white/5 rounded">Reply</button>}</div>}
              <p className="text-[13px] mt-1 leading-[1.4]">{c.text}</p>
            </div>
            <div className="flex gap-2 mt-1"><button onClick={()=>setReplyTo(c)} className="text-[10px] text-white/30">Reply</button>{isOwn && <button onClick={()=>{ if(activePost) handleDeleteComment(activePost,c.id); }} className="text-[10px] text-red-400/50">Delete</button>}</div>
            {c.replies?.map((r:any)=>renderComment(r, depth+1))}
          </div>
        </div>
      </div>
    );
  };
  const filteredYaks = (searchQuery? yaks.filter(y=> y.text.toLowerCase().includes(searchQuery.toLowerCase())) : yaks).filter(y=>!blockedUsers.includes(y.uid));
  const displayHotYaks = hotYaks.filter(y=>!blockedUsers.includes(y.uid));
  const displayMemeYaks = memeYaks.filter(y=>!blockedUsers.includes(y.uid));
  const displayMarketYaks = marketYaks.filter(y=>!blockedUsers.includes(y.uid));
  const displayPyqYaks = pyqYaks.filter(y=>!blockedUsers.includes(y.uid));
  const userPosts = yaks.filter(y=> y.uid===user?.uid);
  const userPolls = userPosts.filter(y=> y.type==='poll');
  const savedYaks = yaks.filter(y=> savedPosts.includes(y.id));

    return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-bold text-xs">S</div><p className="font-bold text-[12px]">SRET {ghostHideOnline?'🕶️':''}</p></div>
          <div className="flex gap-1.5"><button onClick={()=>setScreen('alerts')} className="w-8 h-8 bg-white/5 rounded-full text-xs">🏫</button><button onClick={()=>{ setShowNotifications(true); markNotificationsRead(); }} className="w-8 h-8 bg-white/5 rounded-full text-xs relative">🔔{unreadCount>0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}</button><button onClick={()=>setScreen('settings')} className="w-8 h-8 bg-white text-black rounded-full text-xs font-bold">⚙️</button></div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-1.5">
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search posts..." className="flex-1 h-8 bg-white/5 border border-white/10 rounded-full px-4 text-xs outline-none"/>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-1.5 overflow-x-auto">
          <button onClick={()=>{setScreen('feed'); setFeedTab('new');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='new' && screen==='feed'?'bg-white text-black':'bg-white/5 text-white/40'}`}>New</button>
          <button onClick={()=>setScreen('alerts')} className={`h-7 px-3 rounded-full text-[11px] font-bold ${screen==='alerts'?'bg-red-600 text-white':'bg-white/5 text-white/40'}`}>Alerts {collegeAlertsList.length}</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('hot');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='hot'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Hot</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('top');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='top'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Top</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('meme');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='meme'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Meme</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('market');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='market'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Market</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('pyq');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='pyq'?'bg-white text-black':'bg-white/5 text-white/40'}`}>PYQ</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('dm');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='dm'?'bg-white text-black':'bg-white/5 text-white/40'}`}>DM {dmChats.length}</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('crush');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='crush'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Crush</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[80px] space-y-3">
        {screen==='feed' && (
          <>
            {collegeAlertsList.length>0 && feedTab==='new' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-[14px] p-3"><div className="flex justify-between"><p className="text-[11px] font-bold">🏫 Alerts</p><button onClick={()=>setScreen('alerts')} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">View</button></div><p className="text-[12px] mt-1">{collegeAlertsList[0]?.title}</p></div>
            )}
            {hashtags.length>0 && feedTab==='new' && (
              <div className="bg-white/[0.03] border border-white/10 rounded-[14px] p-3"><p className="text-[10px] font-bold text-white/30">TRENDING</p><div className="flex gap-1.5 mt-2 flex-wrap">{hashtags.slice(0,6).map((h:any)=><button key={h.tag} onClick={()=>setSearchQuery(h.tag)} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[11px]">{h.tag}</button>)}</div></div>
            )}
            {feedTab==='top' && (<div className="space-y-2">{leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-3 flex justify-between"><p className="text-[12px]">#{i+1} Anonymous {i===0?'👑':''}</p><p className="text-[12px] font-bold">{u.yakarma}</p></div>)}<Footer/></div>)}
            {feedTab==='crush' && (<div className="space-y-3"><div className="bg-pink-500/10 border border-pink-500/20 rounded-[14px] p-4"><p className="font-bold text-sm">Secret Crush</p><div className="flex gap-2 mt-3"><input value={crushRoll} onChange={e=>setCrushRoll(e.target.value.toUpperCase())} placeholder="Roll" className="flex-1 bg-black/30 border border-white/10 rounded-full px-4 h-9 text-sm"/><button onClick={handleCrushSubmit} className="px-4 h-9 bg-pink-500 rounded-full text-xs font-bold">Add</button></div></div>{crushMatches.map((m:any)=><div key={m.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-3 flex justify-between"><p className="text-[12px]">{m.toRoll}</p><button onClick={()=>handleCancelCrush(m.id)} className="text-[10px] bg-white/5 px-2 py-1 rounded-full">Cancel</button></div>)}<Footer/></div>)}
            {feedTab==='market' && (<div className="space-y-2">{displayMarketYaks.map((y:any)=><div key={y.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-4"><div className="flex justify-between"><p className="font-bold text-[12px]">Anonymous</p><p className="text-green-400 font-bold">₹{y.price}</p></div><p className="text-[14px] mt-2">{y.text}</p></div>)}<Footer/></div>)}
            {feedTab==='pyq' && (<div className="space-y-2">{displayPyqYaks.map((y:any)=><div key={y.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-4"><p className="font-bold text-[12px]">{y.subject}</p><p className="text-[14px] mt-2">{y.text}</p></div>)}<Footer/></div>)}
            {feedTab==='dm' && (
              <div className="space-y-2">
                <div className="bg-white/[0.03] border border-white/10 rounded-[14px] p-4">
                  <div className="flex justify-between"><p className="font-bold text-[12px]">DM {dmChats.length} {messageRequests?'• Requests ON':''}</p><button onClick={()=>setActiveDm(null)} className="text-[10px] bg-white/10 px-2 py-1 rounded-full">All</button></div>
                  {activeDm? (
                    <div className="mt-3"><div className="flex justify-between"><p className="text-[10px] text-white/30">{activeDm.id.slice(0,8)} {readReceipts?'✓✓':''} {ghostHideOnline?'🕶️ Ghost':''}</p><button onClick={()=>setShowDmDeleteConfirm(activeDm)} className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Delete</button></div><div className="max-h-[300px] overflow-y-auto mt-3 space-y-2">{dmMessages.map((m:any)=><div key={m.id} className={`p-2.5 rounded-[12px] max-w-[80%] text-[13px] ${m.uid===user?.uid?'bg-white text-black ml-auto':'bg-white/5 border border-white/10'}`}><div className="flex justify-between gap-2"><p>{m.text}</p>{m.uid===user?.uid && <button onClick={()=>handleDeleteDmMessage(activeDm.id, m.id)} className="text-[9px] opacity-50">Del</button>}</div></div>)}</div><div className="flex gap-2 mt-3"><input value={dmText} onChange={e=>setDmText(e.target.value)} placeholder={chatPrivacy==='everyone'?'Message':'Restricted'} className="flex-1 h-9 bg-white/5 border border-white/10 rounded-full px-3 text-xs"/><button onClick={handleSendDm} className="w-9 h-9 bg-white text-black rounded-full text-xs">Go</button></div></div>
                  ) : (
                    <div className="mt-3 space-y-2">{dmChats.map((c:any)=><div key={c.id} className="flex justify-between items-center bg-white/[0.02] border border-white/10 rounded-[14px] p-3"><button onClick={()=>setActiveDm(c)} className="flex-1 text-left"><p className="text-[12px] font-bold">Chat {c.participants.filter((p:string)=>p!==user?.uid)[0]?.slice(0,6)}</p><p className="text-[11px] text-white/40">{c.lastMessage?.slice(0,30)}</p></button><button onClick={()=>handleDeleteDmChat(c.id)} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-full ml-2">Del</button></div>)}{dmChats.length===0 && <p className="text-[11px] text-white/30 text-center py-6">No DMs</p>}</div>
                  )}
                </div>
                <Footer/>
              </div>
            )}

                        {['new','hot','meme'].includes(feedTab) && (
              <>
                {(feedTab==='new'? filteredYaks : feedTab==='hot'? displayHotYaks : displayMemeYaks).map(y=>{
                  const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const hasVoted=userData.pollVoted?.includes(y.id); const nestedTree = activePost===y.id? buildTree(comments) : []; const isSaved=savedPosts.includes(y.id);
                  return(
                    <div key={y.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-4">
                      <div className="flex justify-between"><div className="flex gap-2"><div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-xs">A</div><div><p className="text-[12px] font-bold">Anonymous {isOwn?'- You':''}</p><p className="text-[10px] text-white/30">{score} • {y.type} {ghostHideActivity?'• Hidden':''}</p></div></div><div className="flex gap-1"><button onClick={()=>handleToggleSavePost(y.id)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isSaved?'bg-white text-black':'bg-white/5 text-white/30'}`}>{isSaved?'★':'☆'}</button><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-7 h-7 bg-white/5 rounded-full text-white/30">...</button></div></div>
                      {showMenu===y.id && <div className="mt-2 bg-black border border-white/10 rounded-xl p-2">{isOwn? <><button onClick={()=>{ setEditingPost(y); setEditText(y.text); }} className="w-full text-left px-3 py-2 text-xs bg-white/5 rounded-lg">Edit</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-3 py-2 text-xs bg-red-500/10 text-red-400 rounded-lg mt-1">Delete</button></> : <><button onClick={()=>{ setReportingPost(y); }} className="w-full text-left px-3 py-2 text-xs bg-white/5 rounded-lg">Report Post</button><button onClick={()=>handleBlockUser(y.uid)} className="w-full text-left px-3 py-2 text-xs bg-red-500/10 text-red-400 rounded-lg mt-1">Block User</button></>}</div>}
                      {/* NORMAL FONT - NO THICK */}
                      <p className="text-[14px] mt-3 leading-[1.5] whitespace-pre-wrap">{y.text}</p>
                      {isPoll && y.pollOptions && <div className="mt-3 space-y-2">{[...y.pollOptions].sort((a:any,b:any)=>b.votes-a.votes).map((opt:any,idx:number)=>{ const total=y.totalVotes||1; const pct=Math.round((opt.votes/total)*100)||0; return <button key={idx} onClick={()=>handlePollVote(y,y.pollOptions.indexOf(opt))} disabled={!!hasVoted} className="w-full relative overflow-hidden rounded-xl border border-white/10 p-2.5 text-left"><div className="absolute left-0 top-0 bottom-0 bg-white/10" style={{width:`${hasVoted? pct:0}%`}}></div><div className="relative flex justify-between"><span className="text-[12px]">#{idx+1} {opt.text} {idx===0 && hasVoted?'👑':''}</span><span className="text-xs font-bold">{hasVoted? `${pct}%` : opt.votes}</span></div></button>; })}</div>}
                      <div className="flex gap-2 mt-3"><button onClick={()=>handleVote(y,'up')} className={`px-3 py-1 rounded-full text-xs font-bold ${liked?'bg-white text-black':'bg-white/5 text-white/40'}`}>Up {y.likes||0}</button><button onClick={()=>handleVote(y,'down')} className={`px-3 py-1 rounded-full text-xs ${disliked?'bg-red-500 text-white':'bg-white/5 text-white/30'}`}>Down {y.dislikes||0}</button><button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); }} className="px-3 py-1 rounded-full bg-white/5 text-xs">Cmt {y.commentsCount||0}</button><button onClick={()=>handleStartDm(y.uid)} className="px-3 py-1 rounded-full bg-white/5 text-xs">DM</button></div>
                      {activePost===y.id && <div className="mt-3 border-t border-white/10 pt-3"><div className="max-h-[300px] overflow-y-auto">{nestedTree.map((c:any)=>renderComment(c,0))}{nestedTree.length===0 && <p className="text-xs text-white/20 text-center py-4">No comments</p>}</div><div className="flex gap-2 mt-2"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment" className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 h-8 text-xs"/><button onClick={()=>handleCommentPost(y.id)} className="w-8 h-8 bg-white text-black rounded-full text-xs">Go</button></div></div>}
                    </div>
                  );
                })}
                <Footer/>
              </>
            )}
          </>
        )}

        {screen==='alerts' && (
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/20 rounded-[14px] p-4"><div className="flex justify-between"><p className="font-bold text-sm">College Alerts</p><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-white/10 rounded-full">←</button></div><button onClick={()=>setShowCollegeAlertAdmin(true)} className="w-full mt-3 py-2 bg-white text-black rounded-full text-xs font-bold">+ New Alert</button></div>
            {collegeAlertsList.map((a:any)=><div key={a.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-4"><p className="font-bold text-[13px]">{a.title}</p><p className="text-[12px] text-white/60 mt-1">{a.desc}</p><div className="flex gap-2 mt-2"><button onClick={()=>{ setEditingAlert(a); setEditAlertTitle(a.title); setEditAlertDesc(a.desc); setEditAlertType(a.type); }} className="px-2 py-1 bg-white/5 rounded-full text-[10px]">Edit</button><button onClick={()=>handleDeleteAlert(a.id)} className="px-2 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px]">Delete</button></div></div>)}
            <Footer/>
          </div>
        )}
      </div>

            {screen==='settings' && (
        <div className="space-y-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4 flex justify-between items-center">
            <div className="flex items-center gap-2"><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-white/10 rounded-full">←</button><p className="font-bold text-[15px]">⚙️ Dabean Settings</p></div>
            <p className="text-[10px] bg-white text-black px-2 py-1 rounded-full font-bold">v1.0.0</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">👤 PROFILE</p>
            <div className="mt-3">
              <p className="text-[11px] text-white/50">Anonymous Name</p>
              <input value={anonNameEdit} onChange={e=>setAnonNameEdit(e.target.value)} placeholder="Anonymous name" className="w-full mt-1 p-3 bg-black border border-white/10 rounded-xl text-sm"/>
              <p className="text-[11px] text-white/50 mt-3">Avatar</p>
              <div className="grid grid-cols-6 gap-2 mt-1">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-10 rounded-xl text-lg border ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/5 border-white/10'}`}>{a}</button>)}</div>
              <button onClick={handleSaveProfile} className="w-full mt-3 py-2.5 bg-white text-black rounded-full text-xs font-bold">Save Profile</button>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">🔔 NOTIFICATIONS</p>
            <div className="mt-3 space-y-3">
              <div className="flex justify-between items-center"><div><p className="text-[12px] font-bold">Replies</p><p className="text-[10px] text-white/40">When someone replies</p></div><Toggle enabled={notifReplies} onToggle={()=>{ setNotifReplies(!notifReplies); saveSettings({notifReplies:!notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} /></div>
              <div className="flex justify-between items-center"><div><p className="text-[12px] font-bold">Likes</p><p className="text-[10px] text-white/40">When someone likes</p></div><Toggle enabled={notifLikes} onToggle={()=>{ setNotifLikes(!notifLikes); saveSettings({notifReplies,notifLikes:!notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} /></div>
              <div className="flex justify-between items-center"><div><p className="text-[12px] font-bold">DMs</p><p className="text-[10px] text-white/40">New messages</p></div><Toggle enabled={notifDMs} onToggle={()=>{ setNotifDMs(!notifDMs); saveSettings({notifReplies,notifLikes,notifDMs:!notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} /></div>
              <div className="flex justify-between items-center"><div><p className="text-[12px] font-bold">Poll Results</p><p className="text-[10px] text-white/40">Poll ends</p></div><Toggle enabled={notifPolls} onToggle={()=>{ setNotifPolls(!notifPolls); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls:!notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} /></div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">🔐 PRIVACY</p>
            <div className="mt-3 space-y-3">
              <div><p className="text-[12px] font-bold">Who can DM me</p><div className="flex gap-1.5 mt-1"><button onClick={()=>{ setWhoCanDM('everyone'); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM:'everyone',onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${whoCanDM==='everyone'?'bg-white text-black':'bg-white/10 text-white/40'}`}>Everyone</button><button onClick={()=>{ setWhoCanDM('verified'); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM:'verified',onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${whoCanDM==='verified'?'bg-white text-black':'bg-white/10 text-white/40'}`}>Verified</button><button onClick={()=>{ setWhoCanDM('none'); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM:'none',onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${whoCanDM==='none'?'bg-white text-black':'bg-white/10 text-white/40'}`}>None</button></div></div>
              <div className="flex justify-between items-center"><div><p className="text-[12px] font-bold">Online Status</p></div><Toggle enabled={onlineStatus} onToggle={()=>{ setOnlineStatus(!onlineStatus); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus:!onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} /></div>
              <div className="flex justify-between items-center"><div><p className="text-[12px] font-bold">Read Receipts</p></div><Toggle enabled={readReceipts} onToggle={()=>{ setReadReceipts(!readReceipts); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts:!readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} /></div>
              <button onClick={()=>setShowBlockedList(!showBlockedList)} className="w-full flex justify-between items-center py-2 mt-2"><p className="text-[12px] font-bold">Blocked Users ({blockedUsers.length})</p><span className="text-white/30">›</span></button>
              {showBlockedList && <div className="bg-black/40 border border-white/10 rounded-xl p-2">{blockedUsers.length===0? <p className="text-[11px] text-white/30 text-center py-2">No blocked</p> : blockedUsers.map((id:any)=><div key={id} className="flex justify-between py-2"><p className="text-[11px]">{id.slice(0,12)}...</p><button onClick={()=>handleUnblockUser(id)} className="px-2 py-1 bg-white text-black rounded-full text-[10px] font-bold">Unblock</button></div>)}</div>}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">🛡️ SAFETY</p>
            <div className="mt-3 space-y-2">
              <button onClick={()=>showToast("Report User - Use block or report on post")} className="w-full flex justify-between py-2"><p className="text-[12px] font-bold">Report User</p><span className="text-white/30">›</span></button>
              <button onClick={()=>showToast("Report Post - Use... on post")} className="w-full flex justify-between py-2"><p className="text-[12px] font-bold">Report Post</p><span className="text-white/30">›</span></button>
              <button onClick={()=>showToast("Guidelines: Respect, No spam, No NSFW, SRET only")} className="w-full flex justify-between py-2"><p className="text-[12px] font-bold">Community Guidelines</p><span className="text-white/30">›</span></button>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">🌙 APPEARANCE</p>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>{ setDarkMode('dark'); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode:'dark',sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} className={`flex-1 py-2.5 rounded-full text-xs font-bold border ${darkMode==='dark'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>🌙 Dark</button>
              <button onClick={()=>{ setDarkMode('light'); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode:'light',sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} className={`flex-1 py-2.5 rounded-full text-xs font-bold border ${darkMode==='light'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>☀️ Light</button>
              <button onClick={()=>{ setDarkMode('system'); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode:'system',sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} className={`flex-1 py-2.5 rounded-full text-xs font-bold border ${darkMode==='system'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>⚙️ System</button>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">🎓 CAMPUS</p>
            <div className="mt-3 space-y-3">
              <div className="flex justify-between items-center"><div><p className="text-[12px] font-bold">SRET Only Mode</p><p className="text-[10px] text-white/40">Only SRET posts</p></div><Toggle enabled={sretOnlyMode} onToggle={()=>{ setSretOnlyMode(!sretOnlyMode); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode:!sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} /></div>
              <div><p className="text-[12px] font-bold">Branch/Year Preferences</p><div className="flex gap-1.5 mt-1 flex-wrap">{['All','CSE','ECE','EEE','MECH','CIVIL'].map(b=><button key={b} onClick={()=>{ setBranchPref(b); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref:b,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${branchPref===b?'bg-white text-black':'bg-white/10 text-white/40'}`}>{b}</button>)}</div><div className="flex gap-1.5 mt-2">{['All','1st','2nd','3rd','4th'].map(y=><button key={y} onClick={()=>{ setYearPref(y); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref:y,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${yearPref===y?'bg-white text-black':'bg-white/10 text-white/40'}`}>{y}</button>)}</div></div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">💬 GHOST CHAT</p>
            <div className="mt-3 space-y-3">
              <div className="flex justify-between items-center"><div><p className="text-[12px] font-bold">Message Requests</p></div><Toggle enabled={messageRequests} onToggle={()=>{ setMessageRequests(!messageRequests); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests:!messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity}); }} /></div>
              <div><p className="text-[12px] font-bold">Chat Privacy</p><div className="flex gap-1.5 mt-1"><button onClick={()=>{ setChatPrivacy('everyone'); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy:'everyone',ghostHideOnline,ghostHideActivity}); }} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${chatPrivacy==='everyone'?'bg-white text-black':'bg-white/10 text-white/40'}`}>Everyone</button><button onClick={()=>{ setChatPrivacy('following'); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy:'following',ghostHideOnline,ghostHideActivity}); }} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${chatPrivacy==='following'?'bg-white text-black':'bg-white/10 text-white/40'}`}>Following</button><button onClick={()=>{ setChatPrivacy('none'); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy:'none',ghostHideOnline,ghostHideActivity}); }} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${chatPrivacy==='none'?'bg-white text-black':'bg-white/10 text-white/40'}`}>None</button></div></div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">🕶️ GHOST MODE</p>
            <div className="mt-3 space-y-3">
              <div className="flex justify-between items-center"><div><p className="text-[12px] font-bold">Hide Online Status</p></div><Toggle enabled={ghostHideOnline} onToggle={()=>{ setGhostHideOnline(!ghostHideOnline); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline:!ghostHideOnline,ghostHideActivity}); }} /></div>
              <div className="flex justify-between items-center"><div><p className="text-[12px] font-bold">Hide Activity</p></div><Toggle enabled={ghostHideActivity} onToggle={()=>{ setGhostHideActivity(!ghostHideActivity); saveSettings({notifReplies,notifLikes,notifDMs,notifPolls,whoCanDM,onlineStatus,readReceipts,darkMode,sretOnlyMode,branchPref,yearPref,messageRequests,chatPrivacy,ghostHideOnline,ghostHideActivity:!ghostHideActivity}); }} /></div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">📊 MY ACTIVITY</p>
            <div className="mt-3 space-y-2">
              <button onClick={()=>{ setScreen('feed'); setFeedTab('new'); }} className="w-full flex justify-between py-2.5 px-3 bg-white/5 rounded-xl"><p className="text-[12px] font-bold">My Posts ({userPosts.length})</p><span className="text-white/30">›</span></button>
              <button onClick={()=>{ setScreen('feed'); }} className="w-full flex justify-between py-2.5 px-3 bg-white/5 rounded-xl"><p className="text-[12px] font-bold">Saved Posts ({savedYaks.length})</p><span className="text-white/30">›</span></button>
              <button onClick={()=>{ setScreen('feed'); }} className="w-full flex justify-between py-2.5 px-3 bg-white/5 rounded-xl"><p className="text-[12px] font-bold">My Polls ({userPolls.length})</p><span className="text-white/30">›</span></button>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">❓ HELP & SUPPORT</p>
            <div className="mt-3 space-y-2">
              <button onClick={()=>showToast("FAQ: Anonymous, SRET verified only")} className="w-full flex justify-between py-2"><p className="text-[12px] font-bold">FAQ</p><span className="text-white/30">›</span></button>
              <button onClick={()=>showToast("Contact: dabean.sret@gmail.com")} className="w-full flex justify-between py-2"><p className="text-[12px] font-bold">Contact Support</p><span className="text-white/30">›</span></button>
              <div className="mt-2"><p className="text-[12px] font-bold">Send Feedback</p><textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Your feedback..." className="w-full mt-2 p-3 bg-black border border-white/10 rounded-xl text-xs h-20"/><button onClick={handleSendFeedback} className="w-full mt-2 py-2 bg-white text-black rounded-full text-xs font-bold">Send Feedback</button></div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30">ℹ️ ABOUT</p>
            <div className="mt-3 space-y-2">
              <button onClick={()=>showToast("About Dabean: Anonymous campus app for SRET - Made by ANESH 2026")} className="w-full flex justify-between py-2"><p className="text-[12px] font-bold">About Dabean</p><span className="text-white/30">›</span></button>
              <button onClick={()=>showToast("Terms: SRET only, No harassment")} className="w-full flex justify-between py-2"><p className="text-[12px] font-bold">Terms</p><span className="text-white/30">›</span></button>
              <button onClick={()=>showToast("Privacy: Anonymous, DMs private")} className="w-full flex justify-between py-2"><p className="text-[12px] font-bold">Privacy Policy</p><span className="text-white/30">›</span></button>
              <div className="flex justify-between py-2"><p className="text-[12px] text-white/40">App Version</p><p className="text-[12px] font-bold">1.0.0 - 2026</p></div>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-[16px] p-4">
            <p className="text-[11px] font-bold tracking-widest text-red-400">DANGER ZONE</p>
            <div className="mt-3 space-y-2">
              <button onClick={()=>setShowLogoutConfirm(true)} className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold">Logout</button>
              <button onClick={()=>setShowDeleteAccountConfirm(true)} className="w-full py-3 rounded-full bg-red-600 text-white text-xs font-bold">Delete Account</button>
            </div>
          </div>

          <Footer/>
        </div>
      )}
    </div>

          <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-xl border-t border-white/10"><div className="max-w-[600px] mx-auto px-4 h-[60px] flex items-center justify-between"><button onClick={()=>{ setScreen('feed'); setFeedTab('new'); }} className="flex flex-col items-center"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${screen==='feed' && feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/40'}`}>S</div><span className="text-[8px] text-white/30">Feed</span></button><button onClick={()=>setScreen('alerts')} className="flex flex-col items-center"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${screen==='alerts'?'bg-red-600 text-white':'bg-white/5 text-white/40'}`}>🏫</div><span className="text-[8px] text-white/30">Alerts</span></button><button onClick={()=>setScreen('create')} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold">+</button><button onClick={()=>setScreen('settings')} className="flex flex-col items-center"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${screen==='settings'?'bg-white text-black':'bg-white/5 text-white/40'}`}>⚙️</div><span className="text-[8px] text-white/30">Settings</span></button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center"><div className="w-6 h-6 bg-white/5 rounded-full text-[10px]">👤</div><span className="text-[8px] text-white/30">Profile</span></button></div></div>

    {screen==='create' && (
      <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col">
        <div className="max-w-[600px] mx-auto w-full flex flex-col h-full">
          <div className="p-4 flex justify-between border-b border-white/10"><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-white/5 rounded-full">X</button><p className="text-xs font-bold">Create</p><button onClick={handlePost} disabled={posting||!newYak.trim()} className="px-4 h-8 rounded-full bg-white text-black text-xs font-bold">Post</button></div>
          <div className="p-3 flex gap-1.5 overflow-x-auto border-b border-white/5">
            <button onClick={()=>setYakType('yak')} className={`px-3 h-7 rounded-full text-[11px] font-bold border ${yakType==='yak'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>Talk</button>
            <button onClick={()=>setYakType('poll')} className={`px-3 h-7 rounded-full text-[11px] font-bold border ${yakType==='poll'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>Poll</button>
            <button onClick={()=>setYakType('market')} className={`px-3 h-7 rounded-full text-[11px] font-bold border ${yakType==='market'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>Sell</button>
            <button onClick={()=>setYakType('pyq')} className={`px-3 h-7 rounded-full text-[11px] font-bold border ${yakType==='pyq'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>PYQ</button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {yakType==='market' && <input value={marketPrice} onChange={e=>setMarketPrice(e.target.value)} placeholder="Price" className="w-24 p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs mb-3"/>}
            {yakType==='pyq' && <input value={pyqSubject} onChange={e=>setPyqSubject(e.target.value.toUpperCase())} placeholder="Subject" className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs mb-3"/>}
            <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="What's happening in SRET?" autoFocus className="w-full bg-transparent text-[16px] outline-none placeholder:text-white/20 resize-none min-h-[120px]" maxLength={300}/>
            <p className="text-[10px] text-white/30 mt-2">{newYak.length}/300</p>
            {yakType==='poll' && (<div className="mt-4 space-y-2">{pollOptions.map((opt,idx)=><div key={idx} className="flex gap-2"><input value={opt} onChange={e=>{ const n=[...pollOptions]; n[idx]=e.target.value; setPollOptions(n); }} placeholder={`Option ${idx+1}`} className="flex-1 p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs"/>{pollOptions.length>2 && <button onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))} className="w-9 h-9 bg-white/5 rounded-xl text-xs">X</button>}</div>)}{pollOptions.length<4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="w-full p-2 border border-dashed border-white/10 rounded-xl text-xs text-white/30">Add Option</button>}</div>)}
          </div>
        </div>
      </div>
    )}

    {showProfile && (
      <div className="fixed inset-0 bg-black/70 z-[150] flex items-end justify-center p-4">
        <div className="bg-[#141416] border border-white/10 w-full max-w-[600px] rounded-t-[24px] p-5 pb-8">
          <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5"></div>
          <div className="flex items-center gap-3"><div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-lg">{selectedAvatar}</div><div><p className="font-bold">{anonNameEdit||'Anonymous'}</p><p className="text-[11px] text-white/40">{userData?.yakarma||0} karma • {userData?.totalPosts||0} posts</p></div></div>
          <div className="mt-4 space-y-2">
            <button onClick={()=>{ setShowProfile(false); setScreen('settings'); }} className="w-full py-2.5 rounded-full bg-white text-black text-xs font-bold">⚙️ Open Settings</button>
            <button onClick={()=>{ setShowProfile(false); setScreen('alerts'); }} className="w-full py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold">Alerts {collegeAlertsList.length}</button>
            <button onClick={()=>setShowProfile(false)} className="w-full py-2.5 rounded-full bg-white/5 border border-white/10 text-xs">Close</button>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col items-center"><p className="text-[10px] font-bold tracking-[0.2em] text-white/60">© 2026 DABEAN A PRODUCTION BY ANESH</p></div>
        </div>
      </div>
    )}

    {showLogoutConfirm && (<div className="fixed inset-0 bg-black/70 z-[160] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-5 w-full max-w-sm text-center"><p className="font-bold">Logout?</p><div className="flex gap-2 mt-4"><button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={handleLogout} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold">Logout</button></div></div></div>)}
    {showDeleteAccountConfirm && (<div className="fixed inset-0 bg-black/70 z-[165] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-red-500/20 rounded-[16px] p-5 w-full max-w-sm text-center"><p className="font-bold text-red-400">Delete Account?</p><p className="text-[11px] text-white/40 mt-2">All data deleted</p><div className="flex gap-2 mt-4"><button onClick={()=>setShowDeleteAccountConfirm(false)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={handleDeleteAccount} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold">Delete</button></div></div></div>)}
    {editingPost && <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4"><div className="bg-[#141416] border border-white/10 w-full max-w-[600px] rounded-t-[24px] p-5"><p className="font-bold">Edit</p><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl p-3 text-[14px] min-h-[80px]"/><div className="flex gap-2 mt-3"><button onClick={()=>setEditingPost(null)} className="flex-1 h-9 bg-white/5 rounded-full text-xs">Cancel</button><button onClick={handleEdit} className="flex-1 h-9 bg-white text-black rounded-full text-xs font-bold">Save</button></div></div></div>}
    {reportingPost && (<div className="fixed inset-0 bg-black/70 z-[180] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-4 w-full max-w-sm"><p className="font-bold text-sm">Report</p><div className="mt-3 space-y-1">{REPORT_REASONS.map(r=><button key={r} onClick={()=>setReportReason(r)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold border ${reportReason===r?'bg-white text-black':'bg-white/5 border-white/10'}`}>{r}</button>)}</div><div className="flex gap-2 mt-3"><button onClick={()=>setReportingPost(null)} className="flex-1 py-2 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={()=>handleReport(reportingPost)} className="flex-1 py-2 rounded-full bg-red-600 text-white text-xs font-bold">Report</button></div></div></div>)}
    {showNotifications && (<div className="fixed inset-0 bg-black/70 z-[170] flex items-end justify-center p-4"><div className="bg-[#141416] border border-white/10 w-full max-w-[600px] rounded-t-[24px] p-5 max-h-[80vh] overflow-y-auto"><div className="flex justify-between"><p className="font-bold">Notifications</p><button onClick={()=>setShowNotifications(false)} className="w-8 h-8 bg-white/5 rounded-full">X</button></div><div className="mt-4 space-y-2">{notifications.map((n:any)=><div key={n.id} className="p-3 rounded-xl border border-white/10 bg-white/[0.03]"><p className="text-xs">{n.text}</p></div>)}{notifications.length===0 && <p className="text-[11px] text-white/30 text-center py-8">No notifications</p>}</div></div></div>)}
    {showAdmin && (<div className="fixed inset-0 bg-black/70 z-[175] flex items-end justify-center p-4"><div className="bg-[#141416] border border-white/10 w-full max-w-[600px] rounded-t-[24px] p-5 max-h-[80vh] overflow-y-auto"><div className="flex justify-between"><p className="font-bold">Admin - Reports</p><button onClick={()=>setShowAdmin(false)} className="w-8 h-8 bg-white/5 rounded-full">X</button></div><div className="mt-4 space-y-2">{adminReports.map((r:any)=><div key={r.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-3"><p className="text-[11px] font-bold text-red-400">{r.reason}</p><p className="text-[11px] mt-1">{r.yakText}</p><div className="flex gap-2 mt-2"><button onClick={()=>handleAdminRestore(r)} className="px-3 h-7 rounded-full bg-green-600 text-white text-[10px] font-bold">Restore</button><button onClick={()=>handleAdminDelete(r)} className="px-3 h-7 rounded-full bg-red-600 text-white text-[10px] font-bold">Delete</button></div></div>)}{adminReports.length===0 && <p className="text-[11px] text-white/30 text-center py-8">No reports</p>}</div></div></div>)}
    {showCollegeAlertAdmin && (<div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-4 w-full max-w-sm"><p className="font-bold text-sm">New Alert</p><select value={newAlertType} onChange={e=>setNewAlertType(e.target.value)} className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm"><option>ExamAlert</option><option>Holiday</option><option>FeeDue</option><option>Placement</option><option>Official</option></select><input value={newAlertTitle} onChange={e=>setNewAlertTitle(e.target.value)} placeholder="Title" className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm"/><textarea value={newAlertDesc} onChange={e=>setNewAlertDesc(e.target.value)} placeholder="Desc" className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm h-20"/><div className="flex gap-2 mt-3"><button onClick={()=>setShowCollegeAlertAdmin(false)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={postCollegeAlert} className="flex-1 py-2.5 rounded-full bg-white text-black text-xs font-bold">Post</button></div></div></div>)}
    {editingAlert && (<div className="fixed inset-0 bg-black/70 z-[210] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-4 w-full max-w-sm"><p className="font-bold text-sm">Edit Alert</p><input value={editAlertTitle} onChange={e=>setEditAlertTitle(e.target.value)} placeholder="Title" className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm"/><textarea value={editAlertDesc} onChange={e=>setEditAlertDesc(e.target.value)} placeholder="Desc" className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm h-20"/><div className="flex gap-2 mt-3"><button onClick={()=>setEditingAlert(null)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={handleUpdateAlert} className="flex-1 py-2.5 rounded-full bg-white text-black text-xs font-bold">Update</button></div></div></div>)}
    {showDmDeleteConfirm && (<div className="fixed inset-0 bg-black/70 z-[220] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-5 w-full max-w-sm text-center"><p className="font-bold">Delete DM?</p><div className="flex gap-2 mt-4"><button onClick={()=>setShowDmDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={()=>handleDeleteDmChat(showDmDeleteConfirm.id)} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold">Delete</button></div></div></div>)}
  </div>
  );
      }
