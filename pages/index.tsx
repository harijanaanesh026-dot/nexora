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
const Footer = () => (<div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.3em] font-bold text-white/40">SRET ONLY • A PRODUCTION BY ANESH</p><p className="text-[9px] text-white/20">SRET Only • Verified • Anonymous • DM + Hashtag + Awards</p></div>);

export default function YakFixed(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hot'|'top'|'meme'|'dm'>('new');
  const [yaks,setYaks]=useState<any[]>([]);
  const [hotYaks,setHotYaks]=useState<any[]>([]);
  const [memeYaks,setMemeYaks]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [collegeCounts,setCollegeCounts]=useState<Record<string,number>>({});
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [yakType,setYakType]=useState<'yak'|'poll'|'confession'|'meme'>('yak');
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
  const [idImage,setIdImage]=useState<string>('');
  const [idName,setIdName]=useState('');
  const [verifyMethod,setVerifyMethod]=useState<'email'|'roll'|'id'>('email');
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
  // NEW FEATURES STATES
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
          await addDoc(collection(db,'users'),{uid:u.uid,email:u.email||'',username:anonName,avatar:localStorage.getItem('selected_avatar')||'👻',college:"SRET",collegeEmail:String(localStorage.getItem('college_email')||''),rollNumber:String(localStorage.getItem('roll_number')||''),idVerified: localStorage.getItem('verify_method')==='id'? false : true,yakarma:100,totalPosts:0,likedPosts:[],dislikedPosts:[],pollVoted:[],reportedPosts:[],createdAt:serverTimestamp()});
          window.location.reload();
        }else{ setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen('feed'); }
      }else setScreen('college');
    });
  },[isVerified]);

  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(collection(db,'yaks'), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any));
      const data=all.filter(d=>d.college==="SRET" ||!d.college);
      data.sort((a,b)=> (b.createdAt?.toMillis?.()||b.createdAt?.seconds*1000||0) - (a.createdAt?.toMillis?.()||a.createdAt?.seconds*1000||0));
      setYaks(data); setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20)); setMemeYaks([...data].filter(d=>d.type==='meme'||d.image).sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
      const tagCount:Record<string,number>={}; data.forEach(y=>{ const tags=y.text?.match(/#\w+/g); if(tags) tags.forEach((t:string)=>{ tagCount[t.toLowerCase()]=(tagCount[t.toLowerCase()]||0)+1; }); }); setHashtags(Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([tag,count])=>({tag,count})));
      const now=Date.now(); const weekAgo=now-7*24*60*60*1000; const weekPosts=data.filter(d=>(d.createdAt?.toMillis?.()||0)>weekAgo); if(weekPosts.length>0){ const topPost=[...weekPosts].sort((a,b)=>(b.likes||0)-(a.likes||0))[0]; const topMeme=weekPosts.filter(d=>d.type==='meme').sort((a,b)=>(b.likes||0)-(a.likes||0))[0]; const topConf=weekPosts.filter(d=>d.type==='confession').sort((a,b)=>(b.commentsCount||0)-(a.commentsCount||0))[0]; setWeeklyAwards({topPost, topMeme, topConf}); }
    });
  },[userData]);

  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'users'), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)); const same=all.filter(u=>u.college==="SRET"||!u.college); setLeaderboard(same.sort((a,b)=>b.yakarma-a.yakarma).slice(0,20)); }); },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);
  // NOTIFICATIONS + DM LISTENERS
  useEffect(()=>{
    if(!user?.uid) return;
    return onSnapshot(query(collection(db,'notifications'),where('toUid','==',user.uid),orderBy('createdAt','desc')), s=>{
      const nots=s.docs.map(d=>({id:d.id,...d.data()})); setNotifications(nots as any); setUnreadCount((nots as any).filter((n:any)=>!n.read).length);
    });
  },[user]);
  useEffect(()=>{
    if(!user?.uid) return;
    return onSnapshot(query(collection(db,'dms'),where('participants','array-contains',user.uid)), s=>{
      const chats=s.docs.map(d=>({id:d.id,...d.data()})); chats.sort((a:any,b:any)=>(b.lastMessageAt?.toMillis?.()||0)-(a.lastMessageAt?.toMillis?.()||0)); setDmChats(chats as any);
    });
  },[user]);
  useEffect(()=>{
    if(!activeDm) return;
    return onSnapshot(query(collection(db,'dms/'+activeDm.id+'/messages'),orderBy('createdAt','asc')), s=>setDmMessages(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[activeDm]);

    const getCollegeConfig=()=>COLLEGES.find(c=>c.id==="SRET");
  const handleCollegeNext=()=>{ localStorage.setItem('selected_college',"SRET"); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const emailLower=collegeEmail.toLowerCase().trim(); if(!config.domains.some(d=>emailLower.endsWith(d))){ setVerifyError(`Only ${config.domains.join(' or ')} allowed - SRET ONLY`); return; } const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower))); if(!dup.empty){ setVerifyError('Email already used - SRET ONLY'); return; } const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode); await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()}); setOtpSent(true); showToast("OTP: "+otpCode+" - SRET ONLY"); };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp+' - SRET ONLY'); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const rollUpper=rollNumber.trim().toUpperCase(); if(!config.pattern.test(rollUpper)){ setVerifyError(`Invalid Roll - Example: ${config.ex} - SRET ONLY`); return; } const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper))); if(!dup.empty){ setVerifyError('Roll number already used - SRET ONLY'); return; } localStorage.setItem('roll_number',rollUpper); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login'); };
  const handleIdVerify=async()=>{ if(!idImage ||!idName.trim()){ setVerifyError('Upload ID card + Enter Name - SRET ONLY'); return; } localStorage.setItem('id_image',idImage); localStorage.setItem('id_name',idName.trim().toUpperCase()); localStorage.setItem('verify_method','id'); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleImageUpload=(e:any,setter:any)=>{ const file=e.target.files?.[0]; if(!file) return; if(file.size>800*1024){ showToast("Image must be less than 800KB"); return; } const reader=new FileReader(); reader.onloadend=()=>setter(reader.result as string); reader.readAsDataURL(file); };

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
  const handlePost=async()=>{ const txt=newYak.trim(); if(!txt &&!yakImage){ showToast("Type something"); return; } if(yakType==='poll' && pollOptions.filter(o=>o.trim()).length<2){ showToast("Need at least 2 options"); return; } if(!userData||!user) return; if(posting) return; setPosting(true);
    try{ const anonAvatar = AVATARS[Math.floor(Math.random()*AVATARS.length)]; const payload:any={ text:txt, uid:user.uid, username:"Anonymous - SRET", realUsername:userData.username, avatar:anonAvatar, college:"SRET", type:yakType, isAnonymous:true, likes:0, dislikes:0, commentsCount:0, reports:0, createdAt:serverTimestamp() }; if(yakImage) payload.image=yakImage; if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; } if(yakType==='meme') payload.isMemeBattle=true; if(yakType==='confession') payload.isConfession=true; const hashtagsInText=txt.match(/#\w+/g); if(hashtagsInText) payload.hashtags=hashtagsInText.map((h:string)=>h.toLowerCase()); await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)}); setNewYak(''); setYakImage(''); setPollOptions(['','']); setYakType('yak'); setScreen('feed'); showToast("Posted Anonymously - SRET ONLY"); }catch(e:any){ showToast(e.message); }finally{ setPosting(false); } };
  const handleDelete=async(y:any)=>{ if(user?.uid!==y.uid) return; if(!confirm('Delete this post?')) return; try{ await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1)}); showToast("Deleted"); }catch(e:any){ showToast(e.message); } setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost) return; if(!editText.trim()) return; try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); showToast("Edited"); }catch(e:any){ showToast(e.message); } setEditingPost(null); setEditText(''); setShowMenu(null); };
  const handleReport=async(y:any)=>{ if(userData.reportedPosts?.includes(y.id)) return; try{ await updateDoc(doc(db,'yaks',y.id),{reports:increment(1)}); await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)}); if((y.reports||0)+1>=5) await deleteDoc(doc(db,'yaks',y.id)); showToast("Reported"); }catch(e:any){ showToast(e.message); } setShowMenu(null); };
  const buildTree = (flat:any[]) => { const map:Record<string, any> = {}; const roots:any[] = []; flat.forEach(c => { map[c.id] = {...c, replies: []}; }); flat.forEach(c => { if(c.parentId && map[c.parentId]){ map[c.parentId].replies.push(map[c.id]); } else { roots.push(map[c.id]); } }); return roots; };
  const handleCommentPost = async (yId:string) => {
    if(!commentText.trim() ||!user ||!userData) return; const text = commentText.trim(); const payload:any = { text, uid: user.uid, username: "Anonymous - SRET", avatar: "👻", parentId: replyTo? replyTo.id : null, replyToUsername: replyTo? replyTo.username : null, createdAt: serverTimestamp() }; setCommentText(''); const temp = replyTo; setReplyTo(null);
    try{ await addDoc(collection(db,'yaks/'+yId+'/comments'), payload); await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); const yak=yaks.find(d=>d.id===yId); if(yak && yak.uid!==user.uid) await createNotification(yak.uid, 'comment', `Someone commented: ${text.slice(0,30)}`, yId); if(temp && temp.uid!==user.uid) await createNotification(temp.uid, 'reply', `Someone replied to you: ${text.slice(0,30)}`, yId); }catch(e:any){ showToast(e.message); setCommentText(text); setReplyTo(temp); }
  };
  const handleStartDm = async (otherUid:string, yakId?:string)=>{
    if(otherUid===user?.uid){ showToast("Can't DM yourself - SRET"); return; }
    const existing=dmChats.find(c=>c.participants.includes(otherUid) && c.participants.length===2);
    if(existing){ setActiveDm(existing); setFeedTab('dm'); return; }
    try{ const newChat=await addDoc(collection(db,'dms'),{participants:[user.uid, otherUid], participantNames:["Anonymous","Anonymous"], lastMessage:"Started chat - SRET ONLY", lastMessageAt:serverTimestamp(), createdAt:serverTimestamp(), relatedYakId:yakId||null}); setActiveDm({id:newChat.id, participants:[user.uid, otherUid]}); setFeedTab('dm'); showToast("DM Started - Anonymous - SRET ONLY"); }catch(e:any){ showToast(e.message); }
  };
  const handleSendDm=async()=>{
    if(!dmText.trim()||!activeDm||!user) return; const txt=dmText.trim(); setDmText('');
    try{ await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{text:txt, uid:user.uid, username:"Anonymous - SRET", createdAt:serverTimestamp()}); await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:txt, lastMessageAt:serverTimestamp()}); const otherUid=activeDm.participants.find((p:string)=>p!==user.uid); await createNotification(otherUid, 'dm', `New anonymous DM: ${txt.slice(0,30)}`); }catch(e:any){ showToast(e.message); setDmText(txt); }
  };
  const markNotificationsRead=async()=>{ try{ const batch=notifications.filter((n:any)=>!n.read); for(const n of batch){ await updateDoc(doc(db,'notifications',n.id),{read:true}); } }catch{} };

  if(screen==='college'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>{toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}<div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">S</div><div><p className="font-black text-sm tracking-wide">SRET ONLY ANONYMOUS</p><p className="text-[10px] text-white/40">{totalUsers} SRET anonymous • DM + Hashtag + Awards</p></div></div><h1 className="text-[36px] font-black mt-8 leading-[0.9] tracking-tight">SRET<br/>Only<br/><span className="text-white/30">Anonymous Talk</span></h1><p className="text-[13px] text-white/50 mt-3">DM + Hashtag + Notification + Weekly Awards • SRET ONLY</p><p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">SELECT AVATAR - ANONYMOUS</p><div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/[0.05] border-white/10 text-white'}`}>{a}</button>)}</div><p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">COLLEGE - SRET ONLY</p><div className="mt-3"><div className="w-full p-4 rounded-[18px] border-2 bg-white text-black border-white flex justify-between"><div><p className="font-bold text-[13px]">SRET - Tirupati - Verified Only</p><p className="text-[11px] text-black/60">{collegeCounts["SRET"]||0} anonymous • DM + Awards</p></div><div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">✓</div></div></div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black text-[14px] bg-white text-black">Enter SRET - Verification Required</button><Footer/></div></div>);
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full text-white">←</button><div className="mt-6 bg-white/[0.05] border border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-widest text-white/30">{collegeCounts["SRET"]||0} ANONYMOUS IN SRET</p><h2 className="font-black text-[18px] mt-1 text-white">Verify SRET Student - SRET ONLY</h2><p className="text-[11px] text-white/40 mt-1">DM + Hashtag + Notification + Awards - SRET ONLY</p></div><div className="flex p-1 bg-white/5 border border-white/10 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>College Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll Number</button><button onClick={()=>setVerifyMethod('id')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='id'?'bg-white text-black':'text-white/40'}`}>ID Card</button></div>{verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3.5 rounded-xl border border-red-500/20">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl text-sm outline-none text-white placeholder:text-white/30 focus:border-white"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Send OTP - SRET ONLY</button>{otpSent&&<div className="mt-4 bg-black/30 border-2 border-white/10 rounded-xl p-4"><p className="text-xs text-emerald-400 font-bold">OTP: {generatedOtp} - SRET ONLY</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full mt-3 p-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-center tracking-[0.3em] text-white"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify OTP - SRET ONLY</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={`${config?.ex}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase font-bold tracking-widest text-white placeholder:text-white/30"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify Roll Number - SRET ONLY</button></div>}{verifyMethod==='id' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={idName} onChange={e=>setIdName(e.target.value.toUpperCase())} placeholder="NAME ON ID CARD" className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase font-bold text-white placeholder:text-white/30"/><label className="mt-4 border-2 border-dashed border-white/10 rounded-xl p-6 flex justify-center cursor-pointer text-xs text-white/40">Upload ID Card<input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setIdImage(r.result as string); r.readAsDataURL(f); } }}/></label>{idImage && <img src={idImage} className="mt-4 rounded-xl"/>}<button onClick={handleIdVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Submit ID Card - SRET ONLY</button></div>}<Footer/></div></div>);
  }
  if(screen==='login'){
    return (<div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border-2 border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] flex items-center justify-center text-4xl">{selectedAvatar}</div><h1 className="font-black mt-6 text-center text-xl text-white">SRET Verified<br/><span className="text-white/40">DM + Awards - SRET ONLY</span></h1><p className="text-[11px] text-white/30 mt-2 text-center">DM Chat + Hashtag + Notification + Weekly Awards</p><button onClick={handleGoogleLogin} className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold text-sm">Continue with Google - SRET ONLY</button></div><Footer/></div>);
    }

    const renderComment = (c:any, depth=0) => {
    const isReply = depth > 0;
    return (<div key={c.id} className={`${isReply? 'ml-6 border-l-2 border-white/15 pl-3' : ''} mt-3`}><div className="flex gap-2.5"><div className={`bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white shrink-0 ${isReply? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'}`}>👻</div><div className="flex-1"><div className="bg-white/[0.05] border border-white/10 rounded-[14px] px-4 py-2.5"><div className="flex gap-2 items-center"><p className="text-[10px] font-bold text-white/40">Anonymous - SRET</p>{isReply && <span className="px-2 py-0.5 bg-white/10 rounded-full text-[7px] text-white/50 font-bold">REPLY</span>}</div>{isReply && c.replyToUsername && <p className="text-[10px] text-white/30 mt-1">Reply to {c.replyToUsername}</p>}<p className="text-[13px] text-white mt-1 leading-[1.4] whitespace-pre-wrap break-words">{c.text}</p></div><div className="flex gap-3 mt-1.5 ml-1 items-center"><button onClick={()=>setReplyTo(c)} className="text-[11px] font-bold text-white/30 hover:text-white">Reply</button><button onClick={()=>handleStartDm(c.uid)} className="text-[11px] font-bold text-white/30 hover:text-white">DM 👻</button></div>{c.replies && c.replies.length > 0 && (<div className="mt-1">{c.replies.map((rep:any)=>renderComment(rep, depth+1))}</div>)}</div></div></div>);
  };

  const filteredYaks = searchQuery? yaks.filter(y=> y.text.toLowerCase().includes(searchQuery.toLowerCase()) || y.hashtags?.some((h:string)=>h.includes(searchQuery.toLowerCase())) ) : yaks;

  return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-2xl">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">S</div><div><p className="font-bold text-[13px] leading-none text-white">SRET ANON - VERIFIED - {yaks.length}</p><p className="text-[10px] text-white/40">DM • Hashtag • Awards • {totalUsers} verified</p></div></div>
          <div className="flex gap-2 items-center">
            <button onClick={()=>{ setShowNotifications(true); markNotificationsRead(); }} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white relative">🔔{unreadCount>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white">{unreadCount}</span>}</button>
            <button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">👻</button>
          </div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-2">
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search #hashtag or text - SRET ONLY" className="flex-1 h-9 bg-white/5 border border-white/10 rounded-full px-4 text-xs outline-none text-white placeholder:text-white/30 focus:border-white" />
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2 overflow-x-auto">
          <button onClick={()=>setFeedTab('new')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='new'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>NEW {filteredYaks.length}</button>
          <button onClick={()=>setFeedTab('meme')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>MEME</button>
          <button onClick={()=>setFeedTab('hot')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='hot'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>HOT</button>
          <button onClick={()=>setFeedTab('top')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='top'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>TOP</button>
          <button onClick={()=>setFeedTab('dm')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='dm'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>DM {dmChats.length}</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        {hashtags.length>0 && feedTab!=='dm' && feedTab!=='top' && (
          <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">TRENDING HASHTAGS - SRET ONLY</p><div className="flex gap-2 mt-3 flex-wrap">{hashtags.map((h:any)=><button key={h.tag} onClick={()=>setSearchQuery(h.tag)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/60 hover:bg-white hover:text-black">{h.tag} {h.count}</button>)}</div></div>
        )}
        {weeklyAwards.topPost && feedTab==='top' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-yellow-400">WEEKLY SRET AWARDS - VERIFIED</p><h3 className="font-black mt-2 text-white">SRET King & Queen - This Week</h3></div>
            {weeklyAwards.topPost && <div className="bg-white/[0.05] border-2 border-yellow-500/30 rounded-[18px] p-4"><p className="text-[10px] font-bold text-yellow-400">🏆 TOP POST OF WEEK - {weeklyAwards.topPost.likes} likes</p><p className="text-[13px] text-white mt-2">{weeklyAwards.topPost.text.slice(0,100)}</p></div>}
            {weeklyAwards.topMeme && <div className="bg-white/[0.05] border-2 border-purple-500/30 rounded-[18px] p-4"><p className="text-[10px] font-bold text-purple-400">😂 FUNNIEST MEME OF WEEK</p><p className="text-[13px] text-white mt-2">{weeklyAwards.topMeme.text.slice(0,100)}</p></div>}
            {weeklyAwards.topConf && <div className="bg-white/[0.05] border-2 border-pink-500/30 rounded-[18px] p-4"><p className="text-[10px] font-bold text-pink-400">💜 BEST CONFESSION OF WEEK</p><p className="text-[13px] text-white mt-2">{weeklyAwards.topConf.text.slice(0,100)}</p></div>}
          </div>
        )}
        {feedTab==='dm'? (
          <div className="space-y-3">
            {!activeDm? (
              <><div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">ANONYMOUS DM - SRET ONLY</p><p className="font-black mt-1 text-white">Ghost Chats - {dmChats.length}</p><p className="text-[11px] text-white/40 mt-1">Chat anonymously with SRET verified students - No names</p></div>
              {dmChats.map((chat:any)=><button key={chat.id} onClick={()=>setActiveDm(chat)} className="w-full bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center text-left"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">👻</div><div><p className="font-bold text-[13px] text-white">Anonymous SRET Student</p><p className="text-[11px] text-white/40 truncate max-w-[200px]">{chat.lastMessage}</p></div></div><span className="text-[10px] text-white/20">›</span></button>)}
              {dmChats.length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><p className="font-black text-[18px] text-white">No DMs yet</p><p className="text-[11px] text-white/30 mt-1">Start DM from any post - Click DM on comment</p></div>}<Footer/></>
            ) : (
              <div className="bg-white/[0.03] border-2 border-white/10 rounded-[24px] flex flex-col h-[70vh]">
                <div className="p-4 border-b-2 border-white/10 flex justify-between items-center"><div className="flex gap-3 items-center"><button onClick={()=>setActiveDm(null)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">←</button><p className="font-bold text-[13px] text-white">Anonymous Chat - SRET ONLY</p></div><span className="px-2 py-1 bg-white text-black rounded-full text-[8px] font-bold">VERIFIED SRET</span></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">{dmMessages.map((m:any)=><div key={m.id} className={`flex ${m.uid===user?.uid?'justify-end':'justify-start'}`}><div className={`max-w-[70%] rounded-[16px] px-4 py-2.5 ${m.uid===user?.uid?'bg-white text-black':'bg-white/10 border border-white/10 text-white'}`}><p className="text-[13px] leading-[1.4]">{m.text}</p></div></div>)}</div>
                <div className="p-3 border-t-2 border-white/10 flex gap-2"><input value={dmText} onChange={e=>setDmText(e.target.value)} placeholder="Anonymous message - SRET ONLY" className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white" onKeyDown={e=>{ if(e.key==='Enter') handleSendDm(); }}/><button onClick={handleSendDm} disabled={!dmText.trim()} className={`w-11 h-11 rounded-full font-bold ${!dmText.trim()?'bg-white/5 text-white/20':'bg-white text-black'}`}>Go</button></div>
              </div>
            )}
          </div>
        ) : feedTab==='top'? (
          <div className="space-y-3">
            {!weeklyAwards.topPost && <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">SRET TOP ANONYMOUS - VERIFIED</p><p className="font-black mt-1 text-white">Top Anonymous - Verified SRET Only</p></div>}
            {leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">{i+1}</span><span className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">👻</span><div><p className="font-bold text-[13px] text-white">Anonymous Student {i+1} {i===0?'👑':''}</p><p className="text-[10px] text-white/40">{u.totalPosts||0} posts • SRET Verified</p></div></div><p className="font-black text-sm text-white">{u.yakarma}</p></div>)}<Footer/></div>
        ) : (
          <>
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">👻</div><div><p className="font-bold text-[13px] text-white">Anonymous + Verified - SRET ONLY</p><p className="text-[11px] text-white/40">DM • Hashtag • Notification • Weekly Awards</p></div></div><span className="px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold">VERIFIED SRET</span></div>
            {(feedTab==='new'? filteredYaks : feedTab==='meme'? memeYaks : hotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const hasVoted=userData.pollVoted?.includes(y.id); const nestedTree = activePost===y.id? buildTree(comments) : [];
              return(
                <div key={y.id} className={`bg-white/[0.04] border-2 rounded-[20px] p-5 ${isOwn?'border-white/20 bg-white/[0.06]':'border-white/10'}`}>
                  <div className="flex justify-between items-start"><div className="flex gap-3"><div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm relative text-white">👻</div><div><div className="flex gap-2 items-center flex-wrap"><p className="font-bold text-[13px] text-white">Anonymous - SRET {isOwn? '- YOU' : ''}</p><span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-white text-black">SRET ONLY VERIFIED</span></div><p className="text-[10px] text-white/30 mt-0.5">Anonymous - Verified SRET - {score} • {y.hashtags?.join(' ')||''}</p></div></div><div className="relative flex gap-2"><button onClick={()=>handleStartDm(y.uid, y.id)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[12px]">💬</button><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40">...</button>{showMenu===y.id && <div className="absolute right-0 top-10 w-[200px] bg-black border-2 border-white/10 rounded-2xl p-2 z-20 shadow-2xl">{isOwn? (<><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 text-white">Edit</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 mt-2">Delete</button></>) : (<><button onClick={()=>handleStartDm(y.uid, y.id)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 text-white">DM Anonymously 💬</button><button onClick={()=>handleReport(y)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60 mt-2">Report {y.reports||0}/5</button></>)}<button onClick={()=>setShowMenu(null)} className="w-full mt-2 py-2 rounded-xl text-[11px] text-white/30">Cancel</button></div>}</div></div>
                  <p className="text-[15px] mt-4 leading-[1.5] text-white whitespace-pre-wrap break-words">{y.text}</p>
                  {y.image && <img src={y.image} className="mt-4 rounded-[16px] border-2 border-white/10 w-full max-h-[380px] object-cover" alt="yak" />}
                  {isPoll && y.pollOptions && (<div className="mt-4 space-y-2">{y.pollOptions.map((opt:any,idx:number)=>{ const total=y.totalVotes||1; const percent=Math.round((opt.votes/total)*100); const voted=hasVoted; return <button key={idx} onClick={()=>handlePollVote(y,idx)} disabled={!!hasVoted} className={`w-full p-3 rounded-xl border-2 text-left flex justify-between items-center ${voted?'bg-white/5 border-white/10':'bg-white/[0.02] border-white/10'} text-white`}><span className="text-[13px] font-bold">{opt.text}</span><span className="text-[11px] text-white/40">{voted? `${percent}% (${opt.votes})` : `${opt.votes||0}`}</span></button>})}<p className="text-[10px] text-white/30">{y.totalVotes||0} votes - SRET Verified</p></div>)}
                  <div className="flex gap-2.5 mt-5 items-center flex-wrap"><div className="flex bg-white/5 border border-white/10 rounded-full p-1"><button onClick={()=>handleVote(y,'up')} className={`px-4 py-2 rounded-full text-xs font-bold ${liked?'bg-white text-black':'text-white/40'}`}>Up {y.likes||0}</button><span className="px-3 py-2 text-[11px] font-black min-w-[36px] text-center text-white/20">{score}</span><button onClick={()=>handleVote(y,'down')} className={`px-4 py-2 rounded-full text-xs font-bold ${disliked?'bg-red-500 text-white':'text-white/30'}`}>Down {y.dislikes||0}</button></div><button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); setReplyTo(null); }} className="px-4 h-9 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">Comments {y.commentsCount||0}</button><button onClick={()=>handleStartDm(y.uid, y.id)} className="px-4 h-9 rounded-full text-xs bg-white text-black font-bold">DM 👻</button></div>
                  {activePost===y.id && (<div className="mt-5 border-t-2 border-white/10 pt-4 space-y-1"><p className="text-[10px] font-bold tracking-widest text-white/30 mb-3">NESTED REPLIES - {comments.length} - SRET VERIFIED</p>{replyTo && (<div className="bg-white/10 border-2 border-white/20 rounded-xl px-4 py-2.5 flex justify-between items-center mb-3"><p className="text-[11px] text-white">Replying to {replyTo.username}: {replyTo.text.slice(0,30)}</p><button onClick={()=>setReplyTo(null)} className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white text-xs">X</button></div>)}<div className="max-h-[420px] overflow-y-auto pr-1">{nestedTree.length===0 && <p className="text-xs text-white/20 text-center py-8">No comments yet - Be first - SRET Verified</p>}{nestedTree.map((c:any)=>renderComment(c,0))}</div><div className="flex gap-2.5 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={replyTo? `Reply to ${replyTo.username} anonymously` : "Anonymous comment + #hashtag - SRET ONLY"} className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white" onKeyDown={e=>{ if(e.key==='Enter'){ handleCommentPost(y.id); } }}/><button onClick={()=>handleCommentPost(y.id)} disabled={!commentText.trim()} className={`w-11 h-11 rounded-full font-bold flex items-center justify-center ${!commentText.trim()?'bg-white/5 text-white/20 border border-white/5':'bg-white text-black'}`}>Go</button></div></div>)}</div>
              );
            })}
            {(feedTab==='new'? filteredYaks : feedTab==='meme'? memeYaks : hotYaks).length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] mx-auto flex items-center justify-center text-4xl">S</div><p className="font-black mt-6 text-[18px] text-white">No posts yet - SRET ONLY</p><p className="text-[11px] text-white/30 mt-1">Use #hashtag to make trending - Try #SRET #Exams</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full text-[13px] font-bold">Create First Post - With Hashtag</button></div>}
            <Footer/>
          </>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-2xl border-t-2 border-white/10"><div className="max-w-[600px] mx-auto px-6 h-[72px] flex items-center justify-between"><button onClick={()=>{ setFeedTab('new'); setActiveDm(null); }} className="flex flex-col items-center gap-1.5"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/30 border border-white/10'}`}>S</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {yaks.length}</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[24px] font-black">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1.5"><div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs text-white relative">P{unreadCount>0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {userData?.yakarma||0}</span></button></div></div>

            {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col overflow-hidden">
          {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100]">{toast}</div>}
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full bg-[#0a0a0b]">
            <div className="p-5 flex items-center justify-between border-b-2 border-white/10"><button onClick={()=>{ if(!posting) { setScreen('feed'); setYakImage(''); } }} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">X</button><div className="text-center"><p className="text-[11px] font-bold tracking-widest text-white">SRET ONLY - VERIFIED + DM</p><p className="text-[10px] text-white/30">Use #hashtag - e.g. #SRET #Exams #Hostel</p></div><button onClick={handlePost} disabled={posting||(!newYak.trim()&&!yakImage)} className={`px-6 h-10 rounded-full font-bold text-[13px] ${posting||(!newYak.trim()&&!yakImage)?'bg-white/5 text-white/20 border-2 border-white/5':'bg-white text-black'}`}>{posting?'Posting...':'Post'}</button></div>
            <div className="p-3 flex gap-2 border-b-2 border-white/5 overflow-x-auto bg-white/[0.02]"><button onClick={()=>setYakType('yak')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='yak'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Talk #tag</button><button onClick={()=>setYakType('poll')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='poll'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Poll</button><button onClick={()=>setYakType('confession')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='confession'?'bg-purple-500 text-white border-purple-500':'bg-white/5 border-white/10 text-white/40'}`}>Confession</button><button onClick={()=>setYakType('meme')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Meme</button></div>
            <div className="p-6 flex-1 overflow-y-auto bg-[#0a0a0b]">
              <div className="flex gap-3 mb-6"><div className="w-11 h-11 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center text-white">S</div><div><p className="font-bold text-[14px] text-white">Anonymous - SRET - DM Enabled</p><p className="text-[11px] text-white/40">Others can DM you anonymously + Use #hashtag</p></div></div>
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`Talk about SRET... Use #hashtag like #SRET #Exams #Hostel #Faculty\n\nAdd #tag to make trending - Others can search\n\nExample: Exams ela #SRET #Exams 😭\n\nOnly verified SRET students - Anonymous + DM + Awards - SRET ONLY`} autoFocus className="w-full bg-transparent text-[19px] leading-[1.45] outline-none placeholder:text-white/20 resize-none min-h-[140px] text-white" maxLength={300}/>
              {yakType==='poll' && (<div className="mt-6 space-y-3"><p className="text-[10px] text-white/30 font-bold">POLL OPTIONS - SRET ONLY</p>{pollOptions.map((opt,idx)=><div key={idx} className="flex gap-2"><input value={opt} onChange={e=>{ const n=[...pollOptions]; n[idx]=e.target.value; setPollOptions(n); }} placeholder={`Option ${idx+1} - SRET ONLY`} className="flex-1 p-4 bg-white/[0.03] border-2 border-white/10 rounded-xl text-sm outline-none focus:border-white text-white placeholder:text-white/30"/>{pollOptions.length>2 && <button onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))} className="w-12 h-12 bg-white/5 border-2 border-white/10 rounded-xl flex items-center justify-center text-white/40">X</button>}</div>)}{pollOptions.length<4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="w-full p-3 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-xl text-xs font-bold text-white/40">Add Option</button>}</div>)}
              <div className="mt-6">{yakImage? (<div className="relative"><img src={yakImage} className="w-full rounded-[16px] border-2 border-white/10 max-h-[300px] object-cover" alt="upload"/><button onClick={()=>setYakImage('')} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full flex items-center justify-center text-white">X</button></div>) : (<label className="w-full border-2 border-dashed border-white/10 rounded-[16px] p-8 flex flex-col items-center justify-center cursor-pointer hover:border-white/20 bg-white/[0.02]"><span className="text-2xl mb-2">📷</span><span className="text-xs font-bold text-white/60">Upload Image + Use #hashtag</span><span className="text-[10px] text-white/30 mt-1">Max 800KB - SRET ONLY</span><input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,setYakImage)} /></label>)}</div>
            </div>
            <div className="p-5 border-t-2 border-white/5 bg-white/[0.02]"><div className="bg-white/[0.05] border-2 border-white/10 rounded-xl p-4 flex gap-3 items-center"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div><p className="text-[11px] text-white/50"><span className="font-bold text-white">NEW:</span> DM + Hashtag search + Notifications + Weekly Awards - SRET ONLY</p></div><Footer/></div>
          </div>
        </div>
      )}

      {editingPost && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center p-4"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8 shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><h3 className="font-black text-[16px] text-white">Edit Post - SRET ONLY</h3><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-5 bg-white/[0.05] border-2 border-white/10 rounded-xl p-4 text-[15px] outline-none min-h-[120px] resize-none text-white focus:border-white"/><div className="flex gap-3 mt-6"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs text-white">Cancel</button><button onClick={handleEdit} disabled={!editText.trim()} className={`flex-1 h-12 rounded-full font-bold text-xs ${!editText.trim()?'bg-white/5 text-white/20 border-2 border-white/5':'bg-white text-black'}`}>Save</button></div></div></div>}

      {showNotifications && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><div className="flex justify-between items-center"><h3 className="font-black text-[16px] text-white">Notifications - SRET ONLY 🔔 {unreadCount>0? `(${unreadCount} new)` : ''}</h3><button onClick={()=>setShowNotifications(false)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">X</button></div><div className="mt-6 space-y-3">{notifications.map((n:any)=><div key={n.id} className={`p-4 rounded-[16px] border-2 ${!n.read?'bg-white/10 border-white/20':'bg-white/[0.03] border-white/10'}`}><p className="text-[10px] font-bold text-white/40">{n.type.toUpperCase()} • Anonymous</p><p className="text-[13px] text-white mt-1">{n.text}</p><p className="text-[10px] text-white/20 mt-2">{n.createdAt?.toDate?.().toLocaleString?.()||'Just now'}</p></div>)}{notifications.length===0 && <div className="py-16 text-center"><p className="font-bold text-white/40">No notifications yet</p><p className="text-[11px] text-white/20 mt-1">When someone comments, replies, upvotes or DMs you - You get notified - SRET ONLY</p></div>}<button onClick={()=>setShowNotifications(false)} className="w-full mt-6 bg-white text-black h-12 rounded-full font-bold text-xs">Close</button></div></div></div>}

      {showProfile && (<div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><div className="flex gap-4"><div className="w-[72px] h-[72px] bg-white/5 border-2 border-white/10 rounded-[20px] flex items-center justify-center text-3xl text-white">S</div><div className="flex-1"><h2 className="font-black text-[16px] leading-none text-white">SRET ONLY - VERIFIED + DM + Awards</h2><p className="text-[11px] text-white/40 mt-2 leading-[1.4]">DM Chat + Hashtag + Notifications + Weekly Awards - SRET ONLY - {totalUsers} verified - {dmChats.length} chats - {unreadCount} unread</p><div className="flex gap-2 mt-4 flex-wrap"><span className="px-3 py-1.5 bg-white text-black rounded-full text-[10px] font-bold">{userData.yakarma} karma</span><span className="px-3 py-1.5 bg-white/10 border border-white/10 text-white rounded-full text-[9px] font-bold">DM {dmChats.length} • NOTIF {notifications.length}</span></div></div></div>
      <div className="grid grid-cols-3 gap-3 mt-6"><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">POSTS</p></div><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{totalUsers}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">VERIFIED</p></div><div className="bg-white text-black rounded-[18px] p-4 text-center"><p className="font-black text-xl">{userData.yakarma}</p><p className="text-[9px] font-bold tracking-widest mt-1">KARMA</p></div></div>
      {weeklyAwards.topPost && <div className="mt-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20 rounded-[16px] p-4"><p className="text-[10px] font-bold text-yellow-400">🏆 THIS WEEK - SRET AWARDS</p><p className="text-[11px] text-white/60 mt-2">Top Post: {weeklyAwards.topPost?.text?.slice(0,50)}... ({weeklyAwards.topPost?.likes} likes)</p><p className="text-[11px] text-white/60 mt-1">Funniest Meme: {weeklyAwards.topMeme? 'Yes' : 'No meme yet'} | Best Confession: {weeklyAwards.topConf? 'Yes' : 'No confession yet'}</p></div>}
      <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-[16px] p-4"><p className="text-[11px] font-bold text-white">NEW FEATURES - SRET ONLY:</p><p className="text-[11px] text-white/40 mt-2 leading-[1.6]">1. DM Chat - Anonymous chat - Post nundi DM button - Ghost chat - Crush ki DM 💬<br/>2. Hashtag - #SRET #Exams #Hostel use chey - Search bar lo #tag search - Trending tags<br/>3. Notifications - Comment, reply, upvote, DM vasthe bell icon - Red dot - 🔔<br/>4. Weekly Awards - Top post, funniest meme, best confession of week - TOP tab lo - 🏆<br/>5. Search - Text + hashtag search - SRET only posts filter</p></div>
      <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-white/5 border-2 border-white/10 h-12 rounded-full text-xs font-bold text-white/60">Logout - SRET ONLY</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-12 rounded-full font-bold text-xs">Close</button><div className="mt-4"><Footer/></div></div></div>)}
    </div>
  );
}
