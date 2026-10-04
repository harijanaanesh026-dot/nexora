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
const REPORT_REASONS = ["Spam","Abusive","Fake Info","NSFW","Other"];
const BAD_WORDS = ["fuck","sex","porn","xxx","boobs","pussy","dick","cock","nude","slut","bitch","asshole","rape","gaand","gandu","loda","chod","chutiya","lund","randi","bsdk"];
const containsVulgar = (t:string) => BAD_WORDS.some(w=>t?.toLowerCase().includes(w));
const Footer = () => (<div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.3em] font-bold text-white/40">© 2026 Dabean. A production by ANESH</p></div>);

export default function YakFixed(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hot'|'top'|'meme'|'dm'|'crush'|'market'|'pyq'|'night'|'lost'>('new');
  const [yaks,setYaks]=useState<any[]>([]);
  const [hotYaks,setHotYaks]=useState<any[]>([]);
  const [memeYaks,setMemeYaks]=useState<any[]>([]);
  const [marketYaks,setMarketYaks]=useState<any[]>([]);
  const [pyqYaks,setPyqYaks]=useState<any[]>([]);
  const [nightYaks,setNightYaks]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [collegeCounts,setCollegeCounts]=useState<Record<string,number>>({});
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [yakType,setYakType]=useState<'yak'|'poll'|'confession'|'meme'|'market'|'pyq'|'lost'|'ride'>('yak');
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
  // NEW 3 FEATURES
  const [lostItems,setLostItems]=useState<any[]>([]);
  const [lostType,setLostType]=useState<'lost'|'found'|'ride'>('lost');
  const [isNightTime,setIsNightTime]=useState(false);
  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2500); };

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{
    const checkNight=()=>{ const h=new Date().getHours(); setIsNightTime(h>=23 || h<4); };
    checkNight(); const id=setInterval(checkNight,60000); return()=>clearInterval(id);
  },[]);
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
      setNightYaks([...data].filter(d=>d.isNightPost || d.nightOwl).slice(0,30));
      const tagCount:Record<string,number>={}; data.forEach(y=>{ const tags=y.text?.match(/#\w+/g); if(tags) tags.forEach((t:string)=>{ tagCount[t.toLowerCase()]=(tagCount[t.toLowerCase()]||0)+1; }); }); setHashtags(Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([tag,count])=>({tag,count})));
    });
  },[userData]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'users'), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)); const same=all.filter(u=>u.college==="SRET"||!u.college); setLeaderboard(same.sort((a,b)=>b.yakarma-a.yakarma).slice(0,20)); }); },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((c:any)=>!containsVulgar(c.text)))); },[activePost]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'notifications'),where('toUid','==',user.uid),orderBy('createdAt','desc')), s=>{ const nots=s.docs.map(d=>({id:d.id,...d.data()})); setNotifications(nots as any); setUnreadCount((nots as any).filter((n:any)=>!n.read).length); }); },[user]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'dms'),where('participants','array-contains',user.uid)), s=>{ const chats=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((c:any)=> c.participants.length===2); chats.sort((a:any,b:any)=>(b.lastMessageAt?.toMillis?.()||0)-(a.lastMessageAt?.toMillis?.()||0)); setDmChats(chats as any); }); },[user]);
  useEffect(()=>{ if(!activeDm) return; return onSnapshot(query(collection(db,'dms/'+activeDm.id+'/messages'),orderBy('createdAt','asc')), s=>setDmMessages(s.docs.map(d=>({id:d.id,...d.data()})))); },[activeDm]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'crushes'),where('fromUid','==',user.uid)), s=>setCrushMatches(s.docs.map(d=>({id:d.id,...d.data()})))); },[user]);
  useEffect(()=>{ if(!userData) return; return onSnapshot(query(collection(db,'reports'),where('status','==','pending'),orderBy('createdAt','desc')), s=>setAdminReports(s.docs.map(d=>({id:d.id,...d.data()})))); },[userData]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'college_alerts'), s=>{ const all = s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((a:any)=> a.college==="SRET").sort((a:any,b:any)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)); setCollegeAlertsList(all); }); },[userData]);
  // NEW - LOST & FOUND + RIDE
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(query(collection(db,'lost_found'),orderBy('createdAt','desc')), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((a:any)=>a.college==="SRET"||!a.college); setLostItems(all); }); },[userData]);
  useEffect(()=>{
    if(!user?.uid ||!userData) return;
    const setupPush = async()=>{
      try{
        if(!('Notification' in window)) return;
        const perm = await Notification.requestPermission();
        if(perm==='granted'){
          const messaging = getMessaging(app);
          const token = await getToken(messaging, {vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Iev-5oWq-fpYh-3sX9oXq-3sX9o'});
          if(token){ setPushEnabled(true); await updateDoc(doc(db,'users',userData.id),{fcmToken:token}).catch(()=>{}); }
        }
      }catch(e){ console.log(e); }
    };
    setupPush();
  },[user, userData]);

  const getCollegeConfig=()=>COLLEGES.find(c=>c.id==="SRET");
  const handleCollegeNext=()=>{ localStorage.setItem('selected_college',"SRET"); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); const emailLower=collegeEmail.toLowerCase().trim(); if(!config!.domains.some(d=>emailLower.endsWith(d))){ setVerifyError(`Only ${config!.domains.join(' or ')} allowed`); return; } const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower))); if(!dup.empty){ setVerifyError('Email already used'); return; } const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode); await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()}); setOtpSent(true); showToast("OTP: "+otpCode); };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ const rollUpper=rollNumber.trim().toUpperCase(); const config=getCollegeConfig(); if(!config!.pattern.test(rollUpper)){ setVerifyError(`Invalid Roll - Ex: ${config!.ex}`); return; } const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper))); if(!dup.empty){ setVerifyError('Roll already used'); return; } localStorage.setItem('roll_number',rollUpper); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleLogout=async()=>{ await signOut(auth); localStorage.clear(); window.location.reload(); };
  const postCollegeAlert=async()=>{ if(!newAlertTitle.trim()||!newAlertDesc.trim()) return; await addDoc(collection(db,'college_alerts'),{title:newAlertTitle.trim(),desc:newAlertDesc.trim(),type:newAlertType,college:"SRET",createdBy:user.uid,createdAt:serverTimestamp()}); setNewAlertTitle(''); setNewAlertDesc(''); setShowCollegeAlertAdmin(false); };
  const handleDeleteAlert=async(id:string)=>{ if(!confirm("Delete?")) return; await deleteDoc(doc(db,'college_alerts',id)); };
  const handleUpdateAlert=async()=>{ if(!editingAlert) return; await updateDoc(doc(db,'college_alerts',editingAlert.id),{title:editAlertTitle.trim(),desc:editAlertDesc.trim(),type:editAlertType}); setEditingAlert(null); };
  const handleDeleteDmChat=async(chatId:string)=>{ if(!confirm("Delete DM?")) return; const msgsSnap = await getDocs(collection(db,'dms/'+chatId+'/messages')); for(const m of msgsSnap.docs){ await deleteDoc(doc(db,'dms/'+chatId+'/messages',m.id)); } await deleteDoc(doc(db,'dms',chatId)); if(activeDm?.id===chatId) setActiveDm(null); };
  const handleDeleteDmMessage=async(chatId:string, messageId:string)=>{ if(!confirm("Delete?")) return; await deleteDoc(doc(db,'dms/'+chatId+'/messages',messageId)); };
  const handleDeleteComment=async(yakId:string, commentId:string)=>{ if(!confirm("Delete comment?")) return; await deleteDoc(doc(db,'yaks/'+yakId+'/comments',commentId)); await updateDoc(doc(db,'yaks',yakId),{commentsCount:increment(-1)}); };
  // NEW - CRUSH 2-WAY REVEAL LOGIC
  const handleCrushSubmit=async()=>{
    const roll=crushRoll.trim().toUpperCase(); if(!roll) return;
    try{
      // Check if someone already crushes you (2-way)
      const myRoll = userData?.rollNumber || '';
      const reverseSnap = await getDocs(query(collection(db,'crushes'), where('toRoll','==',myRoll), where('fromUid','!=',user.uid)));
      let isMatch = false; let matchedRoll = '';
      for(const docSnap of reverseSnap.docs){
        const data = docSnap.data() as any;
        // Check if that person's roll matches current user's crush? We need user's roll mapping - simplified: if reverse exists with my roll, check if crush roll is in users
        const userSnap = await getDocs(query(collection(db,'users'), where('rollNumber','==',roll)));
        if(!userSnap.empty){
          const targetUid = userSnap.docs[0].data().uid;
          const reciprocal = reverseSnap.docs.find(d=> (d.data() as any).fromUid===targetUid);
          if(reciprocal){
            isMatch = true;
            matchedRoll = roll;
            // Update both to matched
            await updateDoc(doc(db,'crushes',reciprocal.id),{matched:true, matchedAt:serverTimestamp()});
            break;
          }
        }
      }
      // Also check direct same roll crush exists for match
      const existingCrushToMe = await getDocs(query(collection(db,'crushes'), where('fromUid','!=',user.uid), where('toRoll','==',myRoll)));
      const usersWithMyRollAsCrush = existingCrushToMe.docs;
      let directMatch = false;
      for(const d of usersWithMyRollAsCrush){
        const fromUid = (d.data() as any).fromUid;
        const fromUserSnap = await getDocs(query(collection(db,'users'), where('uid','==',fromUid)));
        if(!fromUserSnap.empty && fromUserSnap.docs[0].data().rollNumber===roll){
          directMatch = true; break;
        }
      }
      const finalMatch = isMatch || directMatch;
      await addDoc(collection(db,'crushes'),{fromUid:user.uid, fromRoll:myRoll, toRoll:roll, matched:finalMatch, createdAt:serverTimestamp()});
      if(finalMatch){ showToast("🎉 It's a Match! Both like each other"); } else { showToast("Crush added secretly"); }
      setCrushRoll('');
    }catch(e:any){ showToast(e.message); }
  };
  const handleCancelCrush=async(id:string)=>{ await deleteDoc(doc(db,'crushes',id)); };
  // NEW - LOST & FOUND + RIDE POST
  const handleLostPost=async()=>{
    if(!newYak.trim()){ showToast("Type something"); return; }
    try{
      await addDoc(collection(db,'lost_found'),{
        text:newYak.trim(),
        type:lostType,
        uid:user.uid,
        college:"SRET",
        price: lostType==='ride'? marketPrice : '',
        contact: crushRoll || '',
        createdAt:serverTimestamp(),
        isNightPost: isNightTime
      });
      setNewYak(''); setMarketPrice(''); setCrushRoll(''); setScreen('feed'); setFeedTab('lost'); showToast("Posted");
    }catch(e:any){ showToast(e.message); }
  };

  if(screen==='college'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style>{toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}<div className="max-w-md mx-auto p-6 min-h-screen"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">S</div><p className="font-black text-sm">SRET ANON</p></div><h1 className="text-[36px] font-black mt-8 leading-[0.9]">Talk<br/>Beyond<br/><span className="text-white/30">Identity</span></h1><div className="grid grid-cols-4 gap-2.5 mt-8">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black':'bg-white/[0.05] border-white/10'}`}>{a}</button>)}</div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black bg-white text-black">Enter SRET</button><p className="text-[10px] text-white/30 mt-4 text-center">🌙 Night Owl • 💘 Crush Match • 🔍 Lost & Found</p><Footer/></div></div>);
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><div className="max-w-md mx-auto p-6 min-h-screen"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full">←</button><h2 className="font-black text-[18px] mt-6">Verify SRET</h2><div className="flex p-1 bg-white/5 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll</button></div>{verifyError && <p className="text-xs text-red-400 mt-4">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3 rounded-full font-bold text-sm">Send OTP</button>{otpSent&&<div className="mt-4"><p className="text-xs text-emerald-400">OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" className="w-full mt-2 p-3 bg-white/5 border border-white/10 rounded-xl text-center"/><button onClick={handleOtpSubmit} className="w-full mt-2 bg-white text-black py-3 rounded-full font-bold">Verify</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={config?.ex} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl uppercase font-bold"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3 rounded-full font-bold">Verify</button></div>}<Footer/></div></div>);
  }
  if(screen==='login'){ return (<div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-20 h-20 bg-white/5 rounded-[20px] flex items-center justify-center text-3xl">{selectedAvatar}</div><h1 className="font-black mt-6">Anonymous Ready</h1><p className="text-[10px] text-white/40 mt-1">🌙 Night Owl • 💘 Crush • 🔍 Lost</p><button onClick={handleGoogleLogin} className="w-full mt-6 bg-white text-black py-3 rounded-full font-bold">Continue</button></div></div>); }

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
      const payload:any={ text:newYak.trim(), uid:user.uid, username:"Anonymous", college:"SRET", type: yakType==='lost'||yakType==='ride'? 'yak' : yakType, likes:0, dislikes:0, commentsCount:0, reports:0, hidden:false, isNightPost: isNightTime, nightOwl: isNightTime, createdAt:serverTimestamp() };
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; }
      if(yakType==='market'){ payload.price=marketPrice; }
      if(yakType==='pyq'){ payload.subject=pyqSubject.toUpperCase(); }
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
    await addDoc(collection(db,'yaks/'+yId+'/comments'), { text:commentText.trim(), uid:user.uid, username:"Anonymous", parentId: replyTo? replyTo.id : null, replyToUsername: replyTo? replyTo.username : null, createdAt: serverTimestamp() });
    await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); setCommentText(''); setReplyTo(null);
  };
  const handleStartDm = async (otherUid:string)=>{ if(otherUid===user?.uid) return; const existing=dmChats.find(c=> c.participants.includes(otherUid)); if(existing){ setActiveDm(existing); setFeedTab('dm'); return; } const newChat=await addDoc(collection(db,'dms'),{ participants:[user.uid, otherUid], lastMessage:"Hi", lastMessageAt:serverTimestamp(), createdAt:serverTimestamp() }); setActiveDm({id:newChat.id, participants:[user.uid, otherUid]}); setFeedTab('dm'); };
  const handleSendDm=async()=>{ if(!dmText.trim()||!activeDm) return; await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{ text:dmText.trim(), uid:user.uid, createdAt:serverTimestamp() }); await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:dmText.trim(), lastMessageAt:serverTimestamp()}); setDmText(''); };
  const markNotificationsRead=async()=>{ for(const n of notifications.filter((n:any)=>!n.read)){ await updateDoc(doc(db,'notifications',n.id),{read:true}); } };
  const handleBlockUser=async(uid:string)=>{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(uid)}); };
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
              <p className="text-[13px] mt-1">{c.text}</p>
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
  const displayNightYaks = nightYaks.filter(y=>!blockedUsers.includes(y.uid));

    return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-black text-xs">S</div><p className="font-bold text-[12px]">SRET {isNightTime?'🌙 Night Owl':''}</p></div>
          <div className="flex gap-1.5"><button onClick={()=>setScreen('alerts')} className="w-8 h-8 bg-white/5 rounded-full text-xs">🏫</button><button onClick={()=>{ setShowNotifications(true); markNotificationsRead(); }} className="w-8 h-8 bg-white/5 rounded-full text-xs relative">🔔{unreadCount>0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}</button><button onClick={()=>setShowProfile(true)} className="w-8 h-8 bg-white/5 rounded-full text-xs">👤</button></div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-1.5 overflow-x-auto">
          <button onClick={()=>{setScreen('feed'); setFeedTab('new');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='new' && screen==='feed'?'bg-white text-black':'bg-white/5 text-white/40'}`}>New</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('night');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='night'?'bg-purple-600 text-white':'bg-white/5 text-white/40'} ${isNightTime?'ring-1 ring-purple-500':''}`}>🌙 Night {isNightTime?'Live':''}</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('lost');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='lost'?'bg-white text-black':'bg-white/5 text-white/40'}`}>🔍 Lost {lostItems.length}</button>
          <button onClick={()=>setScreen('alerts')} className={`h-7 px-3 rounded-full text-[11px] font-bold ${screen==='alerts'?'bg-red-600 text-white':'bg-white/5 text-white/40'}`}>Alerts {collegeAlertsList.length}</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('crush');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='crush'?'bg-pink-500 text-white':'bg-white/5 text-white/40'}`}>💘 {crushMatches.filter((c:any)=>c.matched).length? `${crushMatches.filter((c:any)=>c.matched).length} Match`: 'Crush'}</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('hot');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='hot'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Hot</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('dm');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='dm'?'bg-white text-black':'bg-white/5 text-white/40'}`}>DM {dmChats.length}</button>
          <button onClick={()=>{setScreen('feed'); setFeedTab('top');}} className={`h-7 px-3 rounded-full text-[11px] font-bold ${feedTab==='top'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Top</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[80px] space-y-3">
        {screen==='feed' && (
          <>
            {isNightTime && feedTab!=='night' && (
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-[14px] p-3 flex justify-between items-center">
                <div><p className="font-bold text-[12px]">🌙 Night Owl Active - 11PM to 4AM</p><p className="text-[10px] text-white/60">Secret confessions visible only at night - Auto-delete morning</p></div>
                <button onClick={()=>setFeedTab('night')} className="px-3 py-1.5 bg-purple-600 rounded-full text-[10px] font-bold">Go Night</button>
              </div>
            )}
            {collegeAlertsList.length>0 && feedTab==='new' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-[14px] p-3"><div className="flex justify-between"><p className="text-[11px] font-bold">🏫 Alerts</p><button onClick={()=>setScreen('alerts')} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">View</button></div><p className="text-[12px] mt-1 font-bold">{collegeAlertsList[0]?.title}</p></div>
            )}
            {feedTab==='night' && (
              <div className="space-y-3">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-[16px] p-4 text-center">
                  <p className="text-2xl">🌙</p><p className="font-black mt-1">Night Owl - 11PM to 4AM</p><p className="text-[11px] text-white/50 mt-1">Night confessions - Only visible at night - Auto-delete at 6AM - Anonymous secrets</p><p className="text-[10px] text-purple-400 mt-2">{isNightTime? 'Live Now - Post your night secret' : 'Night mode starts at 11PM - Posts saved for night'}</p>
                </div>
                {displayNightYaks.map(y=>(
                  <div key={y.id} className="bg-purple-500/5 border border-purple-500/20 rounded-[16px] p-4">
                    <div className="flex justify-between"><p className="text-[11px] font-bold">Anonymous 🌙 - Night {y.createdAt?.toDate?.()?.toLocaleTimeString?.()}</p><span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Auto-delete 6AM</span></div>
                    <p className="text-[14px] mt-2">{y.text}</p>
                    <div className="flex gap-2 mt-3"><button onClick={()=>handleVote(y,'up')} className="px-3 py-1 rounded-full bg-white/5 text-xs">Up {y.likes||0}</button><button onClick={()=>{ setActivePost(y.id); }} className="px-3 py-1 rounded-full bg-white/5 text-xs">Comment {y.commentsCount||0}</button></div>
                  </div>
                ))}
                {displayNightYaks.length===0 && <p className="text-center text-[11px] text-white/30 py-10">No night posts yet - Be first at 11PM 🌙</p>}
                <Footer/>
              </div>
            )}
            {feedTab==='lost' && (
              <div className="space-y-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-[16px] p-4">
                  <p className="font-bold">🔍 Lost & Found + 🚗 Ride Share</p><p className="text-[11px] text-white/50 mt-1">Lost ID, books, keys, headphones - Ride to Tirupati - SRET only</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={()=>setLostType('lost')} className={`px-3 py-1.5 rounded-full text-xs ${lostType==='lost'?'bg-white text-black':'bg-white/5 text-white/40'}`}>Lost</button>
                    <button onClick={()=>setLostType('found')} className={`px-3 py-1.5 rounded-full text-xs ${lostType==='found'?'bg-green-500 text-white':'bg-white/5 text-white/40'}`}>Found</button>
                    <button onClick={()=>setLostType('ride')} className={`px-3 py-1.5 rounded-full text-xs ${lostType==='ride'?'bg-blue-500 text-white':'bg-white/5 text-white/40'}`}>Ride</button>
                  </div>
                </div>
                {lostItems.map((item:any)=>(
                  <div key={item.id} className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
                    <div className="flex justify-between"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.type==='lost'?'bg-red-500/20 text-red-400': item.type==='found'?'bg-green-500/20 text-green-400':'bg-blue-500/20 text-blue-400'}`}>{item.type.toUpperCase()} {item.type==='ride'?`₹${item.price||''}`:''}</span><span className="text-[10px] text-white/30">{item.createdAt?.toDate?.()?.toLocaleDateString?.()}</span></div>
                    <p className="text-[13px] mt-2 font-bold">{item.text}</p>
                    {item.contact && <p className="text-[11px] text-white/40 mt-1">Contact: {item.contact}</p>}
                    <div className="flex gap-2 mt-2"><button onClick={()=>handleStartDm(item.uid)} className="px-3 py-1 rounded-full bg-white/5 text-xs">DM Owner</button><button onClick={()=>{ if(confirm("Delete?") && item.uid===user?.uid) deleteDoc(doc(db,'lost_found',item.id)); }} className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">{item.uid===user?.uid?'Delete':''}</button></div>
                  </div>
                ))}
                {lostItems.length===0 && <p className="text-center text-[11px] text-white/30 py-10">No lost items - Post first 🔍</p>}
                <Footer/>
              </div>
            )}
            {feedTab==='crush' && (
              <div className="space-y-3">
                <div className="bg-pink-500/10 border border-pink-500/20 rounded-[16px] p-4">
                  <p className="font-bold">💘 Secret Crush - 2-Way Reveal</p><p className="text-[11px] text-white/50 mt-1">Add crush roll - If they add you too, both reveal with 🎉 - Else secret</p>
                  <div className="flex gap-2 mt-3"><input value={crushRoll} onChange={e=>setCrushRoll(e.target.value.toUpperCase())} placeholder="Crush Roll e.g. 21CS101" className="flex-1 bg-black/30 border border-pink-500/20 rounded-full px-4 h-10 text-sm"/><button onClick={handleCrushSubmit} className="px-4 h-10 bg-pink-500 rounded-full text-xs font-bold">Add Secret</button></div>
                </div>
                {crushMatches.filter((c:any)=>c.matched).length>0 && (
                  <div className="bg-pink-500/20 border-2 border-pink-500/30 rounded-[16px] p-4">
                    <p className="text-[11px] font-bold text-pink-400">🎉 MUTUAL MATCHES - {crushMatches.filter((c:any)=>c.matched).length}</p>
                    {crushMatches.filter((c:any)=>c.matched).map((m:any)=>(
                      <div key={m.id} className="mt-2 bg-black/30 border border-pink-500/20 rounded-xl p-3 flex justify-between items-center">
                        <div><p className="font-bold text-[13px]">MATCH! 🎉 {m.toRoll}</p><p className="text-[10px] text-pink-300">Both like each other - Revealed</p></div>
                        <button onClick={()=>handleStartDm(m.toUid||m.fromUid)} className="px-3 py-1.5 bg-pink-500 rounded-full text-xs font-bold">DM 💬</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-3"><p className="text-[10px] font-bold text-white/30">YOUR SECRET CRUSHES - {crushMatches.filter((c:any)=>!c.matched).length} - Waiting for match</p>{crushMatches.filter((c:any)=>!c.matched).map((m:any)=><div key={m.id} className="mt-2 bg-white/[0.02] border border-white/10 rounded-xl p-3 flex justify-between"><p className="text-[12px]">💘 {m.toRoll} - Secret</p><button onClick={()=>handleCancelCrush(m.id)} className="text-[10px] bg-white/5 px-2 py-1 rounded-full">Cancel</button></div>)}{crushMatches.filter((c:any)=>!c.matched).length===0 && crushMatches.filter((c:any)=>c.matched).length===0 && <p className="text-[11px] text-white/30 mt-2">No crushes yet - Add secretly</p>}</div>
                <Footer/>
              </div>
            )}
            {feedTab==='top' && (<div className="space-y-2">{leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-white/[0.03] border border-white/10 rounded-[14px] p-3 flex justify-between"><p className="text-[12px]">#{i+1} Anonymous {i===0?'👑':''}</p><p className="text-[12px] font-bold">{u.yakarma}</p></div>)}<Footer/></div>)}
            {feedTab==='dm' && (
              <div className="space-y-2">
                <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
                  <div className="flex justify-between"><p className="font-bold text-[13px]">DM {dmChats.length}</p><button onClick={()=>setActiveDm(null)} className="text-[10px] bg-white/10 px-2 py-1 rounded-full">All</button></div>
                  {activeDm? (
                    <div className="mt-3"><div className="flex justify-between"><p className="text-[11px] text-white/30">{activeDm.id.slice(0,8)}</p><button onClick={()=>setShowDmDeleteConfirm(activeDm)} className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Delete</button></div><div className="max-h-[300px] overflow-y-auto mt-3 space-y-2">{dmMessages.map((m:any)=><div key={m.id} className={`p-2.5 rounded-[12px] max-w-[80%] text-[12px] ${m.uid===user?.uid?'bg-white text-black ml-auto':'bg-white/5 border border-white/10'}`}><p>{m.text}</p></div>)}</div><div className="flex gap-2 mt-3"><input value={dmText} onChange={e=>setDmText(e.target.value)} placeholder="Message" className="flex-1 h-9 bg-white/5 border border-white/10 rounded-full px-3 text-xs"/><button onClick={handleSendDm} className="w-9 h-9 bg-white text-black rounded-full text-xs">Go</button></div></div>
                  ) : (
                    <div className="mt-3 space-y-2">{dmChats.map((c:any)=><button key={c.id} onClick={()=>setActiveDm(c)} className="w-full text-left bg-white/[0.02] border border-white/10 rounded-[14px] p-3"><p className="text-[12px] font-bold">Chat {c.participants.filter((p:string)=>p!==user?.uid)[0]?.slice(0,6)}</p><p className="text-[11px] text-white/40">{c.lastMessage?.slice(0,30)}</p></button>)}{dmChats.length===0 && <p className="text-[11px] text-white/30 text-center py-6">No DMs</p>}</div>
                  )}
                </div>
                <Footer/>
              </div>
            )}

            {['new','hot','meme','market','pyq'].includes(feedTab) && (
              <>
                {(feedTab==='new'? filteredYaks : feedTab==='hot'? displayHotYaks : feedTab==='meme'? displayMemeYaks : feedTab==='market'? displayMarketYaks : displayPyqYaks).map(y=>{
                  const liked=userData.likedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const hasVoted=userData.pollVoted?.includes(y.id); const nestedTree = activePost===y.id? buildTree(comments) : [];
                  return(
                    <div key={y.id} className={`bg-white/[0.03] border rounded-[16px] p-4 ${isOwn?'border-white/20':'border-white/10'} ${y.isNightPost?'border-purple-500/20':''}`}>
                      <div className="flex justify-between"><div className="flex gap-2"><div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-xs">A</div><div><p className="text-[12px] font-bold">Anonymous {isOwn?'- You':''} {y.isNightPost?'🌙':''}</p><p className="text-[10px] text-white/30">{score} • {y.type}</p></div></div><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-7 h-7 bg-white/5 rounded-full text-white/30">...</button></div>
                      {showMenu===y.id && <div className="mt-2 bg-black border border-white/10 rounded-xl p-2">{isOwn? <><button onClick={()=>{ setEditingPost(y); setEditText(y.text); }} className="w-full text-left px-3 py-2 text-xs bg-white/5 rounded-lg">Edit</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-3 py-2 text-xs bg-red-500/10 text-red-400 rounded-lg mt-1">Delete</button></> : <button onClick={()=>{ setReportingPost(y); }} className="w-full text-left px-3 py-2 text-xs bg-white/5 rounded-lg">Report</button>}</div>}
                      <p className="text-[14px] mt-3 whitespace-pre-wrap">{y.text}</p>
                      {isPoll && y.pollOptions && <div className="mt-3 space-y-2">{[...y.pollOptions].sort((a:any,b:any)=>b.votes-a.votes).map((opt:any,idx:number)=>{ const total=y.totalVotes||1; const pct=Math.round((opt.votes/total)*100)||0; return <button key={idx} onClick={()=>handlePollVote(y,y.pollOptions.indexOf(opt))} disabled={!!hasVoted} className="w-full relative overflow-hidden rounded-xl border border-white/10 p-2.5 text-left"><div className="absolute left-0 top-0 bottom-0 bg-white/10" style={{width:`${hasVoted? pct:0}%`}}></div><div className="relative flex justify-between"><span className="text-xs">#{idx+1} {opt.text} {idx===0 && hasVoted?'👑':''}</span><span className="text-xs font-bold">{hasVoted? `${pct}%` : opt.votes}</span></div></button>; })}</div>}
                      <div className="flex gap-2 mt-3"><button onClick={()=>handleVote(y,'up')} className={`px-3 py-1 rounded-full text-xs ${liked?'bg-white text-black':'bg-white/5 text-white/40'}`}>Up {y.likes||0}</button><button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); }} className="px-3 py-1 rounded-full bg-white/5 text-xs">Cmt {y.commentsCount||0}</button><button onClick={()=>handleStartDm(y.uid)} className="px-3 py-1 rounded-full bg-white/5 text-xs">DM</button></div>
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
            <div className="bg-red-500/10 border border-red-500/20 rounded-[16px] p-4"><div className="flex justify-between"><p className="font-bold text-sm">College Alerts</p><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-white/10 rounded-full">←</button></div><button onClick={()=>setShowCollegeAlertAdmin(true)} className="w-full mt-3 py-2 bg-white text-black rounded-full text-xs font-bold">+ New Alert</button></div>
            {collegeAlertsList.map((a:any)=><div key={a.id} className="bg-white/[0.03] border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{a.title}</p><p className="text-[12px] text-white/60 mt-1">{a.desc}</p><div className="flex gap-2 mt-2"><button onClick={()=>{ setEditingAlert(a); setEditAlertTitle(a.title); setEditAlertDesc(a.desc); setEditAlertType(a.type); }} className="px-2 py-1 bg-white/5 rounded-full text-[10px]">Edit</button><button onClick={()=>handleDeleteAlert(a.id)} className="px-2 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px]">Delete</button></div></div>)}
            <Footer/>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-xl border-t border-white/10"><div className="max-w-[600px] mx-auto px-4 h-[60px] flex items-center justify-between"><button onClick={()=>{ setScreen('feed'); setFeedTab('new'); }} className="flex flex-col items-center"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${screen==='feed' && feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/40'}`}>S</div><span className="text-[8px] text-white/30">Feed</span></button><button onClick={()=>{ setScreen('feed'); setFeedTab('night'); }} className="flex flex-col items-center"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${feedTab==='night'?'bg-purple-600 text-white':'bg-white/5 text-white/40'}`}>🌙</div><span className="text-[8px] text-white/30">{isNightTime?'Live':''} Night</span></button><button onClick={()=>setScreen('create')} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-black">+</button><button onClick={()=>{ setScreen('feed'); setFeedTab('lost'); }} className="flex flex-col items-center"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${feedTab==='lost'?'bg-blue-500 text-white':'bg-white/5 text-white/40'}`}>🔍</div><span className="text-[8px] text-white/30">Lost {lostItems.length}</span></button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center"><div className="w-6 h-6 bg-white/5 rounded-full text-[10px]">👤</div><span className="text-[8px] text-white/30">{crushMatches.filter((c:any)=>c.matched).length? '💘 Match': 'Profile'}</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col">
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full">
            <div className="p-4 flex justify-between border-b border-white/10"><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-white/5 rounded-full">X</button><p className="text-xs font-bold">{isNightTime?'🌙 Night Post - Auto-delete 6AM':'Create'} {lostType==='lost'||lostType==='found'||lostType==='ride'?'🔍 Lost/Ride':''}</p><button onClick={()=>{ if(yakType==='lost'||yakType==='ride'||lostType!=='lost') handleLostPost(); else handlePost(); }} disabled={posting||!newYak.trim()} className="px-4 h-8 rounded-full bg-white text-black text-xs font-bold">Post</button></div>
            <div className="p-3 flex gap-1.5 overflow-x-auto border-b border-white/5">
              <button onClick={()=>{ setYakType('yak'); setLostType('lost'); }} className={`px-3 h-7 rounded-full text-[11px] border ${yakType==='yak' && lostType==='lost'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>Talk</button>
              <button onClick={()=>{ setYakType('poll'); }} className={`px-3 h-7 rounded-full text-[11px] border ${yakType==='poll'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>Poll</button>
              <button onClick={()=>{ setYakType('market'); }} className={`px-3 h-7 rounded-full text-[11px] border ${yakType==='market'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>Sell</button>
              <button onClick={()=>{ setYakType('pyq'); }} className={`px-3 h-7 rounded-full text-[11px] border ${yakType==='pyq'?'bg-white text-black':'bg-white/5 border-white/10 text-white/40'}`}>PYQ</button>
              <button onClick={()=>{ setYakType('lost'); setLostType('lost'); }} className={`px-3 h-7 rounded-full text-[11px] border ${yakType==='lost'?'bg-red-500 text-white':'bg-white/5 border-white/10 text-white/40'}`}>🔍 Lost</button>
              <button onClick={()=>{ setYakType('lost'); setLostType('found'); }} className={`px-3 h-7 rounded-full text-[11px] border ${lostType==='found' && yakType==='lost'?'bg-green-500 text-white':'bg-white/5 border-white/10 text-white/40'}`}>Found</button>
              <button onClick={()=>{ setYakType('ride'); setLostType('ride'); }} className={`px-3 h-7 rounded-full text-[11px] border ${yakType==='ride'?'bg-blue-500 text-white':'bg-white/5 border-white/10 text-white/40'}`}>🚗 Ride</button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {(yakType==='lost'||yakType==='ride') && (
                <div className="flex gap-2 mb-3">
                  <select value={lostType} onChange={e=>setLostType(e.target.value as any)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs"><option value="lost">Lost</option><option value="found">Found</option><option value="ride">Ride</option></select>
                  {lostType==='ride' && <input value={marketPrice} onChange={e=>setMarketPrice(e.target.value)} placeholder="Price ₹" className="w-20 p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs"/>}
                  <input value={crushRoll} onChange={e=>setCrushRoll(e.target.value)} placeholder="Contact / Roll" className="flex-1 p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs"/>
                </div>
              )}
              {yakType==='market' && <input value={marketPrice} onChange={e=>setMarketPrice(e.target.value)} placeholder="Price" className="w-24 p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs mb-3"/>}
              {yakType==='pyq' && <input value={pyqSubject} onChange={e=>setPyqSubject(e.target.value.toUpperCase())} placeholder="Subject" className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs mb-3"/>}
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={isNightTime? '🌙 Night secret - Auto-delete morning...' : lostType==='lost'? 'Lost what? ID card, book, keys...' : lostType==='found'? 'Found what? Where?' : lostType==='ride'? 'Ride share - Tirupati to SRET, time?' : 'What\'s happening in SRET?'} autoFocus className="w-full bg-transparent text-[17px] outline-none placeholder:text-white/20 resize-none min-h-[120px]" maxLength={300}/>
              <p className="text-[10px] text-white/30 mt-2">{newYak.length}/300 {isNightTime?'🌙 Night Owl - Auto-delete 6AM':''}</p>
              {yakType==='poll' && (<div className="mt-4 space-y-2">{pollOptions.map((opt,idx)=><div key={idx} className="flex gap-2"><input value={opt} onChange={e=>{ const n=[...pollOptions]; n[idx]=e.target.value; setPollOptions(n); }} placeholder={`Option ${idx+1}`} className="flex-1 p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs"/>{pollOptions.length>2 && <button onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))} className="w-9 h-9 bg-white/5 rounded-xl text-xs">X</button>}</div>)}{pollOptions.length<4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="w-full p-2 border border-dashed border-white/10 rounded-xl text-xs text-white/30">Add Option</button>}</div>)}
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/70 z-[150] flex items-end justify-center p-4">
          <div className="bg-[#141416] border border-white/10 w-full max-w-[600px] rounded-t-[24px] p-5 pb-8">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5"></div>
            <div className="flex items-center gap-3"><div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">👤</div><div><p className="font-bold">Anonymous</p><p className="text-[11px] text-white/40">{userData?.yakarma||0} karma • {userData?.totalPosts||0} posts • {isNightTime?'🌙 Night Active':''}</p></div></div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-2.5 text-center"><p className="text-[16px] font-bold">{crushMatches.filter((c:any)=>c.matched).length}</p><p className="text-[9px] text-white/40">Matches 💘</p></div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-2.5 text-center"><p className="text-[16px] font-bold">{nightYaks.length}</p><p className="text-[9px] text-purple-300">Night 🌙</p></div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-center"><p className="text-[16px] font-bold">{lostItems.length}</p><p className="text-[9px] text-blue-300">Lost 🔍</p></div>
            </div>
            <div className="mt-4 space-y-2">
              <button onClick={()=>{ setShowProfile(false); setScreen('feed'); setFeedTab('night'); }} className="w-full py-2.5 rounded-full bg-purple-600 text-white text-xs font-bold">🌙 Night Owl {isNightTime?'Live':''} - {nightYaks.length}</button>
              <button onClick={()=>{ setShowProfile(false); setScreen('feed'); setFeedTab('crush'); }} className="w-full py-2.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-400 text-xs font-bold">💘 Crush Matches {crushMatches.filter((c:any)=>c.matched).length}</button>
              <button onClick={()=>{ setShowProfile(false); setScreen('feed'); setFeedTab('lost'); }} className="w-full py-2.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold">🔍 Lost & Found + Ride {lostItems.length}</button>
              <button onClick={()=>setShowLogoutConfirm(true)} className="w-full py-2.5 rounded-full bg-red-600 text-white text-xs font-bold">Logout</button>
              <button onClick={()=>setShowProfile(false)} className="w-full py-2.5 rounded-full bg-white/5 border border-white/10 text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (<div className="fixed inset-0 bg-black/70 z-[160] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-5 w-full max-w-sm text-center"><p className="font-bold">Logout?</p><div className="flex gap-2 mt-4"><button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={handleLogout} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs">Logout</button></div></div></div>)}
      {editingPost && <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4"><div className="bg-[#141416] border border-white/10 w-full max-w-[600px] rounded-t-[24px] p-5"><p className="font-bold">Edit</p><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl p-3 text-sm min-h-[80px]"/><div className="flex gap-2 mt-3"><button onClick={()=>setEditingPost(null)} className="flex-1 h-9 bg-white/5 rounded-full text-xs">Cancel</button><button onClick={handleEdit} className="flex-1 h-9 bg-white text-black rounded-full text-xs font-bold">Save</button></div></div></div>}
      {reportingPost && (<div className="fixed inset-0 bg-black/70 z-[180] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-4 w-full max-w-sm"><p className="font-bold text-sm">Report</p><div className="mt-3 space-y-1">{REPORT_REASONS.map(r=><button key={r} onClick={()=>setReportReason(r)} className={`w-full text-left px-3 py-2 rounded-xl text-xs border ${reportReason===r?'bg-white text-black':'bg-white/5 border-white/10'}`}>{r}</button>)}</div><div className="flex gap-2 mt-3"><button onClick={()=>setReportingPost(null)} className="flex-1 py-2 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={()=>handleReport(reportingPost)} className="flex-1 py-2 rounded-full bg-red-600 text-white text-xs">Report</button></div></div></div>)}
      {showNotifications && (<div className="fixed inset-0 bg-black/70 z-[170] flex items-end justify-center p-4"><div className="bg-[#141416] border border-white/10 w-full max-w-[600px] rounded-t-[24px] p-5 max-h-[80vh] overflow-y-auto"><div className="flex justify-between"><p className="font-bold">Notifications</p><button onClick={()=>setShowNotifications(false)} className="w-8 h-8 bg-white/5 rounded-full">X</button></div><div className="mt-4 space-y-2">{notifications.map((n:any)=><div key={n.id} className="p-3 rounded-xl border border-white/10 bg-white/[0.03]"><p className="text-xs">{n.text}</p></div>)}{notifications.length===0 && <p className="text-[11px] text-white/30 text-center py-8">No notifications</p>}</div></div></div>)}
      {showAdmin && (<div className="fixed inset-0 bg-black/70 z-[175] flex items-end justify-center p-4"><div className="bg-[#141416] border border-white/10 w-full max-w-[600px] rounded-t-[24px] p-5 max-h-[80vh] overflow-y-auto"><div className="flex justify-between"><p className="font-bold">Admin</p><button onClick={()=>setShowAdmin(false)} className="w-8 h-8 bg-white/5 rounded-full">X</button></div><div className="mt-4 space-y-2">{adminReports.map((r:any)=><div key={r.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-3"><p className="text-[11px] text-red-400">{r.reason}</p><p className="text-[11px] mt-1">{r.yakText}</p><div className="flex gap-2 mt-2"><button onClick={()=>handleAdminRestore(r)} className="px-3 h-7 rounded-full bg-green-600 text-white text-[10px]">Restore</button><button onClick={()=>handleAdminDelete(r)} className="px-3 h-7 rounded-full bg-red-600 text-white text-[10px]">Delete</button></div></div>)}{adminReports.length===0 && <p className="text-[11px] text-white/30 text-center py-8">No reports</p>}</div></div></div>)}
      {showCollegeAlertAdmin && (<div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-4 w-full max-w-sm"><p className="font-bold text-sm">New Alert</p><select value={newAlertType} onChange={e=>setNewAlertType(e.target.value)} className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm"><option>ExamAlert</option><option>Holiday</option><option>FeeDue</option><option>Placement</option><option>Official</option></select><input value={newAlertTitle} onChange={e=>setNewAlertTitle(e.target.value)} placeholder="Title" className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm"/><textarea value={newAlertDesc} onChange={e=>setNewAlertDesc(e.target.value)} placeholder="Desc" className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm h-20"/><div className="flex gap-2 mt-3"><button onClick={()=>setShowCollegeAlertAdmin(false)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={postCollegeAlert} className="flex-1 py-2.5 rounded-full bg-white text-black text-xs font-bold">Post</button></div></div></div>)}
      {editingAlert && (<div className="fixed inset-0 bg-black/70 z-[210] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-4 w-full max-w-sm"><p className="font-bold text-sm">Edit Alert</p><input value={editAlertTitle} onChange={e=>setEditAlertTitle(e.target.value)} placeholder="Title" className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm"/><textarea value={editAlertDesc} onChange={e=>setEditAlertDesc(e.target.value)} placeholder="Desc" className="w-full mt-3 p-2.5 bg-black border border-white/10 rounded-xl text-sm h-20"/><div className="flex gap-2 mt-3"><button onClick={()=>setEditingAlert(null)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={handleUpdateAlert} className="flex-1 py-2.5 rounded-full bg-white text-black text-xs font-bold">Update</button></div></div></div>)}
      {showDmDeleteConfirm && (<div className="fixed inset-0 bg-black/70 z-[220] flex items-center justify-center p-4"><div className="bg-[#1a1a1a] border border-white/10 rounded-[16px] p-5 w-full max-w-sm text-center"><p className="font-bold">Delete DM?</p><div className="flex gap-2 mt-4"><button onClick={()=>setShowDmDeleteConfirm(null)} className="flex-1 py-2.5 rounded-full bg-white/10 text-xs">Cancel</button><button onClick={()=>handleDeleteDmChat(showDmDeleteConfirm.id)} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs">Delete</button></div></div></div>)}
    </div>
  );
}
