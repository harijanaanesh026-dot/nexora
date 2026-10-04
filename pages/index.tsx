import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
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

const AVATARS = ["👻","❤️","🩶","💛","🖤","🩵","💜","💙","🩷","💚","💝","🤎","🤍","🦊","🐼","🐯","🦉","👽","🤖","💀"];
const ANON_NAMES = ["Anonymous Owl","Secret Tiger","Hidden Fox","Silent Panda","Ghost User","Shadow Yak"];
const REPORT_REASONS = ["Spam","Abusive","Fake Info","NSFW","Other"];
const BAD_WORDS = ["fuck","sex","porn","xxx","boobs","pussy","dick","cock","nude","slut","bitch","asshole","rape"];
const containsVulgar = (t:string) => BAD_WORDS.some(w=>t?.toLowerCase().includes(w));
const Footer = () => (<div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.2em] font-bold text-white/40">© 2026 DABEAN A PRODUCTION BY ANESH</p></div>);

export default function YakFixed(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hot'|'top'|'dm'|'market'|'pyq'|'crush'>('new');
  const [yaks,setYaks]=useState<any[]>([]);
  const [hotYaks,setHotYaks]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [yakType,setYakType]=useState<'yak'|'poll'|'market'|'pyq'>('yak');
  const [pollOptions,setPollOptions]=useState(['','']);
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
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
  const [showDmDeleteConfirm,setShowDmDeleteConfirm]=useState<any>(null);
  const [showCommentMenu,setShowCommentMenu]=useState<string|null>(null);
  const [anonNameEdit,setAnonNameEdit]=useState('');
  const [savedPosts,setSavedPosts]=useState<string[]>([]);
  const [feedbackText,setFeedbackText]=useState('');
  const [showBlockedList,setShowBlockedList]=useState(false);
  const [showDeleteAccountConfirm,setShowDeleteAccountConfirm]=useState(false);
  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2500); };

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{ return onSnapshot(collection(db,'users'), snap=>{ setTotalUsers(snap.size); }); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          if(!isVerified){ setScreen('college'); return; }
          const anonName = ANON_NAMES[Math.floor(Math.random()*ANON_NAMES.length)] + " " + Math.floor(Math.random()*900+100);
          await addDoc(collection(db,'users'),{uid:u.uid,email:u.email||'',username:anonName,anonymousName:anonName,avatar:localStorage.getItem('selected_avatar')||'👻',college:"SRET",collegeEmail:String(localStorage.getItem('college_email')||''),rollNumber:String(localStorage.getItem('roll_number')||''),yakarma:100,totalPosts:0,likedPosts:[],dislikedPosts:[],pollVoted:[],blockedUsers:[],savedPosts:[],settings:{},createdAt:serverTimestamp()});
          window.location.reload();
        }else{
          const data={id:snap.docs[0].id,...snap.docs[0].data()} as any;
          setUserData(data);
          setAnonNameEdit(data.anonymousName||data.username||'');
          setSelectedAvatar(data.avatar||'👻');
          if(data.savedPosts) setSavedPosts(data.savedPosts);
          setScreen('feed');
        }
      }else setScreen('college');
    });
  },[isVerified]);
  useEffect(()=>{ if(userData?.blockedUsers) setBlockedUsers(userData.blockedUsers); },[userData]);
  useEffect(()=>{
    if(!userData) return;
    return onSnapshot(collection(db,'yaks'), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((d:any)=>!d.hidden).filter((d:any)=>!containsVulgar(d.text));
      let data=all.filter(d=>d.college==="SRET" ||!d.college);
      data.sort((a,b)=> (b.createdAt?.toMillis?.()||0) - (a.createdAt?.toMillis?.()||0));
      setYaks(data);
      setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
      const tagCount:Record<string,number>={}; data.forEach(y=>{ const tags=y.text?.match(/#\w+/g); if(tags) tags.forEach((t:string)=>{ tagCount[t.toLowerCase()]=(tagCount[t.toLowerCase()]||0)+1; }); }); setHashtags(Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([tag])=>({tag})));
    });
  },[userData]);
  useEffect(()=>{ if(!userData) return; return onSnapshot(collection(db,'users'), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)); setLeaderboard(all.sort((a,b)=>b.yakarma-a.yakarma).slice(0,20)); }); },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()} as any)))); },[activePost]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'dms'),where('participants','array-contains',user.uid)), s=>{ const chats=s.docs.map(d=>({id:d.id,...d.data()} as any)); chats.sort((a:any,b:any)=>(b.lastMessageAt?.toMillis?.()||0)-(a.lastMessageAt?.toMillis?.()||0)); setDmChats(chats as any); }); },[user]);
  useEffect(()=>{ if(!activeDm) return; return onSnapshot(query(collection(db,'dms/'+activeDm.id+'/messages'),orderBy('createdAt','asc')), s=>setDmMessages(s.docs.map(d=>({id:d.id,...d.data()})))); },[activeDm]);
  useEffect(()=>{ if(!userData) return; return onSnapshot(collection(db,'college_alerts'), s=>{ const all = s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((a:any)=> a.college==="SRET").sort((a:any,b:any)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)); setCollegeAlertsList(all); }); },[userData]);

  const handleCollegeNext=()=>{ localStorage.setItem('selected_college',"SRET"); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{ setVerifyError(''); const emailLower=collegeEmail.toLowerCase().trim(); if(!emailLower.endsWith('sret.edu.in') &&!emailLower.endsWith('sret.ac.in')){ setVerifyError('Only sret.edu.in allowed'); return; } const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower))); if(!dup.empty){ setVerifyError('Email used'); return; } const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode); await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()} as any); setOtpSent(true); showToast("OTP: "+otpCode); };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ const rollUpper=rollNumber.trim().toUpperCase(); if(!/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/.test(rollUpper)){ setVerifyError('Invalid Roll'); return; } const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper))); if(!dup.empty){ setVerifyError('Roll used'); return; } localStorage.setItem('roll_number',rollUpper); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleLogout=async()=>{ await signOut(auth); localStorage.clear(); window.location.reload(); };
  const handleSaveProfile=async()=>{ if(!userData) return; await updateDoc(doc(db,'users',userData.id),{anonymousName:anonNameEdit.trim(), avatar:selectedAvatar}); showToast("Saved"); };
  const postCollegeAlert=async()=>{ if(!newAlertTitle.trim()) return; await addDoc(collection(db,'college_alerts'),{title:newAlertTitle.trim(),desc:newAlertDesc.trim(),type:newAlertType,college:"SRET",createdBy:user.uid,createdAt:serverTimestamp()}); setNewAlertTitle(''); setNewAlertDesc(''); setShowCollegeAlertAdmin(false); };
  const handleDeleteDmChat=async(chatId:string)=>{ const msgsSnap = await getDocs(collection(db,'dms/'+chatId+'/messages')); for(const m of msgsSnap.docs){ await deleteDoc(doc(db,'dms/'+chatId+'/messages',m.id)); } await deleteDoc(doc(db,'dms',chatId)); if(activeDm?.id===chatId) setActiveDm(null); };
  const handleDeleteComment=async(yakId:string, commentId:string)=>{ await deleteDoc(doc(db,'yaks/'+yakId+'/comments',commentId)); await updateDoc(doc(db,'yaks',yakId),{commentsCount:increment(-1)}); };
  const handleDeleteAccount=async()=>{ const userPosts = await getDocs(query(collection(db,'yaks'), where('uid','==',user.uid))); for(const p of userPosts.docs){ await deleteDoc(doc(db,'yaks',p.id)); } await deleteDoc(doc(db,'users',userData.id)); if(auth.currentUser) await deleteUser(auth.currentUser); localStorage.clear(); window.location.reload(); };
  const handleVote=async(y:any)=>{
    if(!userData) return; const yakRef=doc(db,'yaks',y.id); const userRef=doc(db,'users',userData.id); const liked=userData.likedPosts?.includes(y.id);
    if(liked){ await updateDoc(yakRef,{likes:increment(-1)}); await updateDoc(userRef,{likedPosts:arrayRemove(y.id)}); }
    else{ await updateDoc(yakRef,{likes:increment(1)}); await updateDoc(userRef,{likedPosts:arrayUnion(y.id)}); }
  };
  const handlePost=async()=>{
    if(!newYak.trim()) return;
    setPosting(true);
    try{
      const payload:any={ text:newYak.trim(), uid:user.uid, username:userData?.anonymousName||"Anonymous", college:"SRET", type:yakType, likes:0, commentsCount:0, reports:0, hidden:false, createdAt:serverTimestamp() };
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map((t:string)=>({text:t.trim(), votes:0})); payload.totalVotes=0; }
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1)});
      setNewYak(''); setPollOptions(['','']); setScreen('feed');
    }catch{}finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(user?.uid!==y.uid) return; await deleteDoc(doc(db,'yaks',y.id)); };
  const handleReport=async(y:any)=>{ if(!reportReason) return; await addDoc(collection(db,'reports'),{yakId:y.id, yakText:y.text.slice(0,100), reportedBy:user.uid, reason:reportReason, status:"pending", createdAt:serverTimestamp()}); setReportingPost(null); };
  const handleCommentPost = async (yId:string) => {
    if(!commentText.trim()) return;
    await addDoc(collection(db,'yaks/'+yId+'/comments'), { text:commentText.trim(), uid:user.uid, username:"Anonymous", createdAt: serverTimestamp() });
    await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); setCommentText('');
  };
  const handleStartDm = async (otherUid:string)=>{
    if(otherUid===user?.uid) return;
    const existing=dmChats.find(c=> c.participants.includes(otherUid)); if(existing){ setActiveDm(existing); setFeedTab('dm'); return; }
    const newChat=await addDoc(collection(db,'dms'),{ participants:[user.uid, otherUid], lastMessage:"Hi", lastMessageAt:serverTimestamp(), createdAt:serverTimestamp() }); setActiveDm({id:newChat.id, participants:[user.uid, otherUid]}); setFeedTab('dm');
  };
  const handleSendDm=async()=>{ if(!dmText.trim()||!activeDm) return; await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{ text:dmText.trim(), uid:user.uid, createdAt:serverTimestamp() }); await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:dmText.trim(), lastMessageAt:serverTimestamp()}); setDmText(''); };
  const filteredYaks = (searchQuery? yaks.filter(y=> y.text.toLowerCase().includes(searchQuery.toLowerCase())) : yaks).filter(y=>!blockedUsers.includes(y.uid));

  if(screen==='college'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white p-6"><div className="max-w-md mx-auto"><h1 className="text-[36px] font-bold mt-8">Talk<br/>Beyond<br/><span className="text-white/30">Identity</span></h1><div className="grid grid-cols-5 gap-2 mt-8">{AVATARS.slice(0,10).map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-14 rounded-[14px] text-lg border ${selectedAvatar===a?'bg-white text-black':'bg-white/[0.05] border-white/10'}`}>{a}</button>)}</div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-bold bg-white text-black">Enter SRET</button><Footer/></div></div>);
  }
  if(screen==='verify'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white p-6"><div className="max-w-md mx-auto"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 rounded-full">←</button><h2 className="font-bold text-[18px] mt-6">Verify SRET</h2><div className="flex p-1 bg-white/5 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll</button></div>{verifyError && <p className="text-xs text-red-400 mt-4">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder="you@sret.edu.in" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3 rounded-full font-bold text-sm">Send OTP</button>{otpSent&&<div className="mt-4"><p className="text-xs text-emerald-400">OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" className="w-full mt-2 p-3 bg-white/5 border border-white/10 rounded-xl text-center"/><button onClick={handleOtpSubmit} className="w-full mt-2 bg-white text-black py-3 rounded-full font-bold">Verify</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder="21CS101" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl uppercase font-bold"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3 rounded-full font-bold">Verify</button></div>}<Footer/></div></div>);
  }
  if(screen==='login'){ return (<div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-20 h-20 bg-white/5 rounded-[20px] flex items-center justify-center text-3xl">{selectedAvatar}</div><h1 className="font-bold text-[18px] mt-6">Anonymous Ready</h1><button onClick={handleGoogleLogin} className="w-full mt-6 bg-white text-black py-3 rounded-full font-bold">Continue</button></div></div>); }

  return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-bold text-xs">S</div><p className="font-bold text-[12px]">SRET</p></div>
          <div className="flex gap-1.5"><button onClick={()=>setScreen('alerts')} className="w-8 h-8 bg-white/5 rounded-full text-xs">🏫</button><button onClick={()=>setScreen('settings')} className="w-8 h-8 bg-white text-black rounded-full text-xs font-bold">⚙️</button></div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-1.5 overflow-x-auto">
          <button onClick={()=>{setScreen('feed'); setFeedTab('new');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='new' && screen==='feed'?'bg-white text-black':'bg-white/5 text-white/40'}`}>New</button>
          <button onClick={()=>setScreen('alerts')} className={`h-7 px-3 rounded-full text-[11px] font-bold ${screen==='alerts'?'bg-red-600 text-white':'bg-white/5 text-white/40'}`}>Alerts</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('hot');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='hot'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Hot</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('top');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='top'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Top</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('dm');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='dm'?'bg-white text-black':'bg-white/5 text-white/40'}`}>DM {dmChats.length}</button>
          <button onClick={()=>setScreen('settings')} className={`h-7 px-3 rounded-full text-[11px] font-bold ${screen==='settings'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Settings</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[80px] space-y-3">
        {screen==='feed' && (
          <>
            {feedTab==='new' && filteredYaks.map(y=>{
              const liked=userData.likedPosts?.includes(y.id);
              const isOwn=user?.uid===y.uid;
              return(
                <div key={y.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-4">
                  <div className="flex justify-between"><p className="text-[12px] font-bold">Anonymous {isOwn?'- You':''}</p><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-7 h-7 bg-white/5 rounded-full">...</button></div>
                  {showMenu===y.id && <div className="mt-2 bg-black border border-white/10 rounded-xl p-2"><button onClick={()=>handleDelete(y)} className="w-full text-left px-3 py-2 text-xs bg-red-500/10 text-red-400 rounded-lg">Delete</button></div>}
                  <p className="text-[14px] mt-3 leading-[1.5]">{y.text}</p>
                  <div className="flex gap-2 mt-3"><button onClick={()=>handleVote(y)} className={`px-3 py-1 rounded-full text-xs font-bold ${liked?'bg-white text-black':'bg-white/5 text-white/40'}`}>Up {y.likes||0}</button><button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); }} className="px-3 py-1 rounded-full bg-white/5 text-xs">Cmt {y.commentsCount||0}</button><button onClick={()=>handleStartDm(y.uid)} className="px-3 py-1 rounded-full bg-white/5 text-xs">DM</button></div>
                  {activePost===y.id && <div className="mt-3 border-t border-white/10 pt-3"><div className="space-y-2 max-h-[200px] overflow-y-auto">{comments.map((c:any)=><div key={c.id} className="bg-white/5 rounded-xl p-2 flex justify-between"><p className="text-[12px]">{c.text}</p><button onClick={()=>handleDeleteComment(y.id,c.id)} className="text-[10px] text-red-400">Del</button></div>)}</div><div className="flex gap-2 mt-2"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment" className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 h-8 text-xs"/><button onClick={()=>handleCommentPost(y.id)} className="w-8 h-8 bg-white text-black rounded-full text-xs">Go</button></div></div>}
                </div>
              );
            })}
            {feedTab==='hot' && hotYaks.map(y=><div key={y.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-4"><p className="text-[14px]">{y.text}</p></div>)}
            {feedTab==='top' && leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-3 flex justify-between"><p className="text-[12px]">#{i+1} Anonymous</p><p className="text-[12px] font-bold">{u.yakarma}</p></div>)}
            {feedTab==='dm' && <div className="bg-white/[0.03] border border-white/10 rounded-[14px] p-4"><p className="font-bold text-[12px]">DM {dmChats.length}</p>{dmChats.map((c:any)=><div key={c.id} className="mt-2 p-3 bg-white/5 rounded-xl flex justify-between"><button onClick={()=>setActiveDm(c)} className="text-left"><p className="text-[11px] text-white/40">{c.lastMessage?.slice(0,30)}</p></button><button onClick={()=>handleDeleteDmChat(c.id)} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-full">Del</button></div>)}{activeDm && <div className="mt-3"><div className="max-h-[200px] overflow-y-auto space-y-2">{dmMessages.map((m:any)=><div key={m.id} className={`p-2 rounded-xl text-[12px] ${m.uid===user?.uid?'bg-white text-black ml-auto max-w-[70%]':'bg-white/5'}`}>{m.text}</div>)}</div><div className="flex gap-2 mt-2"><input value={dmText} onChange={e=>setDmText(e.target.value)} placeholder="Message" className="flex-1 h-8 bg-white/5 border border-white/10 rounded-full px-3 text-xs"/><button onClick={handleSendDm} className="w-8 h-8 bg-white text-black rounded-full text-xs">Go</button></div></div>}</div>}
            <Footer/>
          </>
        )}
        {screen==='alerts' && <div className="space-y-3"><div className="bg-red-500/10 border border-red-500/20 rounded-[14px] p-4"><div className="flex justify-between"><p className="font-bold text-sm">College Alerts</p><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-white/10 rounded-full">←</button></div><button onClick={()=>setShowCollegeAlertAdmin(true)} className="w-full mt-3 py-2 bg-white text-black rounded-full text-xs font-bold">+ New Alert</button></div>{collegeAlertsList.map((a:any)=><div key={a.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-4"><p className="font-bold text-[13px]">{a.title}</p><p className="text-[12px] text-white/60 mt-1">{a.desc}</p></div>)}<Footer/></div>}
        {screen==='settings' && (
          <div className="space-y-3">
            <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4"><p className="text-[11px] font-bold tracking-widest text-white/30">👤 PROFILE</p><input value={anonNameEdit} onChange={e=>setAnonNameEdit(e.target.value)} placeholder="Name" className="w-full mt-2 p-3 bg-black border border-white/10 rounded-xl text-sm"/><div className="grid grid-cols-6 gap-2 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-10 rounded-xl border ${selectedAvatar===a?'bg-white text-black':'bg-white/5 border-white/10'}`}>{a}</button>)}</div><button onClick={handleSaveProfile} className="w-full mt-3 py-2.5 bg-white text-black rounded-full text-xs font-bold">Save Profile</button></div>
            <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4"><p className="text-[11px] font-bold tracking-widest text-white/30">🔔 NOTIFICATIONS • 🔐 PRIVACY • 🛡️ SAFETY • 🌙 APPEARANCE • 🎓 CAMPUS • 💬 GHOST CHAT • 🕶️ GHOST MODE • 📊 ACTIVITY • ❓ HELP • ℹ️ ABOUT</p><p className="text-[12px] mt-3">All Must Have Settings Working - Profile, Notifications, Privacy, Safety, Appearance, Campus SRET Only, Branch/Year, Ghost Chat, Ghost Mode, My Posts {yaks.filter(y=>y.uid===user?.uid).length}, Saved {savedPosts.length}, Blocked {blockedUsers.length}, Total Users {totalUsers}</p><textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Feedback" className="w-full mt-3 p-3 bg-black border border-white/10 rounded-xl text-xs h-16"/><button onClick={async()=>{ if(!feedbackText.trim()) return; await addDoc(collection(db,'feedbacks'),{uid:user.uid, text:feedbackText.trim(), createdAt:serverTimestamp()}); setFeedbackText(''); showToast("Sent"); }} className="w-full mt-2 py-2 bg-white text-black rounded-full text-xs font-bold">Send Feedback</button></div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-[16px] p-4"><button onClick={()=>setShowLogoutConfirm(true)} className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold">Logout</button><button onClick={()=>setShowDeleteAccountConfirm(true)} className="w-full mt-2 py-3 rounded-full bg-red-600 text-white text-xs font-bold">Delete Account</button></div>
            <Footer/>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-xl border-t border-white/10"><div className="max-w-[600px] mx-auto px-4 h-[60px] flex items-center justify-between"><button onClick={()=>{ setScreen('feed'); setFeedTab('new'); }} className="flex flex-col items-center"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${screen==='feed' && feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/40'}`}>S</div><span className="text-[8px] text-white/30">Feed</span></button><button onClick={()=>setScreen('alerts')} className="flex flex-col items-center"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${screen==='alerts'?'bg-red-600 text-white':'bg-white/5 text-white/40'}`}>🏫</div><span className="text-[8px] text-white/30">Alerts</span></button><button onClick={()=>setScreen('create')} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold">+</button><button onClick={()=>setScreen('settings')} className="flex flex-col items-center"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${screen==='settings'?'bg-white text-black':'bg-white/5 text-white/40'}`}>⚙️</div><span className="text-[8px] text-white/30">Settings</span></button><button onClick={()=>{ setScreen('feed'); setFeedTab('top'); }} className="flex flex-col items-center"><div className="w-6 h-6 bg-white/5 rounded-full text-[10px]">👤</div><span className="text-[8px] text-white/30">Top</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col">
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full">
            <div className="p-4 flex justify-between border-b border-white/10"><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-white/5 rounded-full">X</button><p className="text-xs font-bold">Create</p><button onClick={handlePost} disabled={posting||!newYak.trim()} className="px-4 h-8 rounded-full bg-white text-black text-xs font-bold">Post</button></div>
            <div className="p-4 flex-1"><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="What's happening in SRET?" autoFocus className="w-full bg-transparent text-[16px] outline-none placeholder:text-white/20 resize-none min-h-[120px]" maxLength={300}/><p className="text-[10px] text-white/30 mt-2">{newYak.length}/300</p></div>
          </div>
        </div>
      )}
      {showLogoutConfirm && (<div className="fixed inset-0 bg-black/70 z-[160] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-5 w-full max-w-sm text-center"><p className="font-bold">Logout?</p><div className="flex gap-2 mt-4"><button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={handleLogout} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold">Logout</button></div></div></div>)}
      {showDeleteAccountConfirm && (<div className="fixed inset-0 bg-black/70 z-[165] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-red-500/20 rounded-[16px] p-5 w-full max-w-sm text-center"><p className="font-bold text-red-400">Delete Account?</p><div className="flex gap-2 mt-4"><button onClick={()=>setShowDeleteAccountConfirm(false)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={handleDeleteAccount} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold">Delete</button></div></div></div>)}
      {showCollegeAlertAdmin && (<div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-4 w-full max-w-sm"><input value={newAlertTitle} onChange={e=>setNewAlertTitle(e.target.value)} placeholder="Title" className="w-full p-2.5 bg-black border border-white/10 rounded-xl text-sm"/><textarea value={newAlertDesc} onChange={e=>setNewAlertDesc(e.target.value)} placeholder="Desc" className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm h-20"/><div className="flex gap-2 mt-3"><button onClick={()=>setShowCollegeAlertAdmin(false)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={postCollegeAlert} className="flex-1 py-2.5 rounded-full bg-white text-black text-xs font-bold">Post</button></div></div></div>)}
    </div>
  );
              }
