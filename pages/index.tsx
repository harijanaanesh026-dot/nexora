import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';

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
const Footer = () => (<div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.3em] font-bold text-white/40">SRET ONLY • A PRODUCTION BY ANESH • Share 3in1 Fixed 🔗</p></div>);

export default function YakFixed(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<any>('new');
  const [yaks,setYaks]=useState<any[]>([]);
  const [hotYaks,setHotYaks]=useState<any[]>([]);
  const [memeYaks,setMemeYaks]=useState<any[]>([]);
  const [marketYaks,setMarketYaks]=useState<any[]>([]);
  const [pyqYaks,setPyqYaks]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [yakType,setYakType]=useState<any>('yak');
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
  useEffect(()=>{ return onSnapshot(collection(db,'users'), snap=>{ setTotalUsers(snap.size); }, ()=>{}); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        try{
          const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
          if(snap.empty){
            if(!isVerified){ setScreen('college'); return; }
            const anonName = ANON_NAMES[Math.floor(Math.random()*ANON_NAMES.length)] + " " + Math.floor(Math.random()*900+100);
            await addDoc(collection(db,'users'),{uid:u.uid,email:u.email||'',username:anonName,avatar:localStorage.getItem('selected_avatar')||'👻',college:"SRET",collegeEmail:String(localStorage.getItem('college_email')||''),rollNumber:String(localStorage.getItem('roll_number')||''),yakarma:100,totalPosts:0,likedPosts:[],dislikedPosts:[],pollVoted:[],reportedPosts:[],blockedUsers:[],createdAt:serverTimestamp()});
            window.location.reload();
          }else{ setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen('feed'); }
        }catch{ setScreen('college'); }
      }else setScreen('college');
    });
  },[isVerified]);
  useEffect(()=>{ if(userData?.blockedUsers) setBlockedUsers(userData.blockedUsers||[]); },[userData]);
  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(collection(db,'yaks'), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any));
      const data=all.filter(d=>!d.college || d.college==="SRET");
      data.sort((a,b)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      setYaks(data as any);
      setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20) as any);
      setMemeYaks([...data].filter(d=>d.type==='meme'||d.image).slice(0,20) as any);
      setMarketYaks([...data].filter(d=>d.type==='market').slice(0,30) as any);
      setPyqYaks([...data].filter(d=>d.type==='pyq').slice(0,30) as any);
      const tagCount:Record<string,number>={}; data.forEach(y=>{ const tags=y.text?.match(/#\w+/g); if(tags) tags.forEach((t:string)=>{ tagCount[t.toLowerCase()]=(tagCount[t.toLowerCase()]||0)+1; }); }); setHashtags(Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([tag,count])=>({tag,count})));
    }, ()=>{});
  },[userData]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'users'), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)); setLeaderboard(all.sort((a,b)=>b.yakarma-a.yakarma).slice(0,20)); }, ()=>{}); },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(collection(db,'yaks/'+activePost+'/comments'), s=>{ const arr=s.docs.map(d=>({id:d.id,...d.data()} as any)); arr.sort((a,b)=> (a.createdAt?.seconds||0)-(b.createdAt?.seconds||0)); setComments(arr); }, ()=>{}); },[activePost]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'notifications'),where('toUid','==',user.uid)), s=>{ const nots=s.docs.map(d=>({id:d.id,...d.data()} as any)); nots.sort((a,b)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)); setNotifications(nots); setUnreadCount(nots.filter((n:any)=>!n.read).length); }, ()=>{}); },[user]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'dms'),where('participants','array-contains',user.uid)), s=>{ const chats=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter((c:any)=> c.participants.length===2); chats.sort((a:any,b:any)=>(b.lastMessageAt?.seconds||0)-(a.lastMessageAt?.seconds||0)); setDmChats(chats as any); }, ()=>{}); },[user]);
  useEffect(()=>{ if(!activeDm) return; return onSnapshot(collection(db,'dms/'+activeDm.id+'/messages'), s=>{ const arr=s.docs.map(d=>({id:d.id,...d.data()} as any)); arr.sort((a,b)=> (a.createdAt?.seconds||0)-(b.createdAt?.seconds||0)); setDmMessages(arr); }, ()=>{}); },[activeDm]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'crushes'),where('fromUid','==',user.uid)), s=>setCrushMatches(s.docs.map(d=>({id:d.id,...d.data()}))), ()=>{}); },[user]);
  useEffect(()=>{ if(!userData) return; return onSnapshot(query(collection(db,'reports'),where('status','==','pending')), s=>setAdminReports(s.docs.map(d=>({id:d.id,...d.data()}))), ()=>{}); },[userData]);

  const getCollegeConfig=()=>COLLEGES[0];
  const handleCollegeNext=()=>{ localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{ setVerifyError(''); const emailLower=collegeEmail.toLowerCase().trim(); if(!emailLower.includes('sret')){ setVerifyError('Only sret.edu.in allowed'); return; } const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode); await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()}); setOtpSent(true); showToast("OTP: "+otpCode); };
  const handleOtpSubmit=async()=>{ try{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); setIsVerified(true); setScreen('login'); }catch(e:any){ setVerifyError(e.message); } };
  const handleRollVerify=async()=>{ const rollUpper=rollNumber.trim().toUpperCase(); if(rollUpper.length<5){ setVerifyError('Invalid Roll'); return; } localStorage.setItem('roll_number',rollUpper); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleImageUpload=(e:any,setter:any)=>{ const file=e.target.files?.[0]; if(!file) return; if(file.size>800*1024){ showToast("Image < 800KB"); return; } const reader=new FileReader(); reader.onloadend=()=>setter(reader.result as string); reader.readAsDataURL(file); };

  if(screen==='college'){ return(<div className="min-h-screen bg-[#0a0a0b] text-white p-6"><div className="max-w-md mx-auto"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">S</div><p className="font-black text-sm">SRET ONLY - {totalUsers} - Share 3in1 Fixed 🔗</p></div><p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">SELECT AVATAR - Share Fixed 🔗</p><div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/[0.05] border-white/10 text-white'}`}>{a}</button>)}</div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black text-[14px] bg-white text-black">Enter SRET - Share 3in1 Fixed {selectedAvatar}</button><Footer/></div></div>); }
  if(screen==='verify'){ return(<div className="min-h-screen bg-[#0a0a0b] text-white p-6"><div className="max-w-md mx-auto"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full text-white">←</button><div className="flex p-1 bg-white/5 border border-white/10 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>College Mail OTP</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll Number</button></div>{verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3.5 rounded-xl">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder="you@sret.edu.in" className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl text-sm text-white"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Send OTP - Share Fixed 🔗</button>{otpSent&&<div className="mt-4"><p className="text-xs text-emerald-400">OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full mt-3 p-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-center text-white"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify OTP</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder="21CS101" className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase text-white"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify Roll - Share Fixed 🔗</button></div>}<Footer/></div></div>); }
  if(screen==='login'){ return (<div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border-2 border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] flex items-center justify-center text-4xl">{selectedAvatar}</div><h1 className="font-black mt-6 text-center text-xl text-white">SRET Verified - Share 3in1 Fixed 🔗</h1><button onClick={handleGoogleLogin} className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold text-sm">Continue with Google - Share Fixed 🔗</button></div><Footer/></div>); }

// SHARE 3in1 HANDLERS - ADDED IN YOUR CODE - NO CRASH - FIXED
  const handleSharePost = async (yy:any) => {
    const url = `${window.location.origin}/?post=${yy.id}`;
    const txt = `${yy.text}\n\nFrom SRET ONLY ANONYMOUS - Share 3in1 🔗`;
    if ((navigator as any).share) { try { await (navigator as any).share({ title: "SRET ONLY", text: txt, url }); showToast("Shared 🔗 Fixed"); return; } catch {} }
    try { await navigator.clipboard.writeText(url); showToast("Link copied 🔗?post=ID Fixed"); } catch { showToast(url); }
  };
  const handleWhatsAppShare = (yy:any) => {
    const t = encodeURIComponent(`${yy.text}\n${window.location.origin}/?post=${yy.id}\nSRET ONLY - Share 3in1 🔗 Fixed`);
    window.open(`https://wa.me/?text=${t}`, '_blank');
  };
  const handleCopyLink = async (yy:any) => {
    const url = `${window.location.origin}/?post=${yy.id}`;
    try { await navigator.clipboard.writeText(url); showToast("Link copied 🔗 Fixed"); } catch { showToast(url); }
  };

  const createNotification=async(toUid:string, type:string, text:string, yakId?:string)=>{
    if(toUid===user?.uid) return; try{ await addDoc(collection(db,'notifications'),{toUid, fromUid:user?.uid, fromUsername:"Anonymous - SRET", type, text, yakId:yakId||null, read:false, createdAt:serverTimestamp()}); }catch{}
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
  const handlePollVote=async(y:any, idx:number)=>{ if(!userData) return; if(userData.pollVoted?.includes(y.id)){ showToast("Already voted"); return; } try{ const n=[...y.pollOptions]; n[idx].votes=(n[idx].votes||0)+1; await updateDoc(doc(db,'yaks',y.id),{pollOptions:n, totalVotes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{pollVoted:arrayUnion(y.id)}); setUserData({...userData, pollVoted:[...(userData.pollVoted||[]), y.id]}); showToast("Voted - SRET ONLY - Fixed"); }catch(e:any){ showToast(e.message); } };
  const handlePost=async()=>{
    const txt=newYak.trim(); if(!txt &&!yakImage){ showToast("Type something"); return; }
    if(yakType==='poll' && pollOptions.filter(o=>o.trim()).length<2){ showToast("Need at least 2 options"); return; }
    if(yakType==='market' &&!marketPrice.trim()){ showToast("Enter price - SRET Market - Fixed"); return; }
    if(yakType==='pyq' &&!pyqSubject.trim()){ showToast("Enter subject - SRET PYQ - Fixed"); return; }
    if(!userData||!user) return; if(posting) return; setPosting(true);
    try{
      const anonAvatar = AVATARS[Math.floor(Math.random()*AVATARS.length)];
      const payload:any={ text:txt, uid:user.uid, username:"Anonymous - SRET", realUsername:userData.username, avatar:anonAvatar, college:"SRET", type:yakType, isAnonymous:true, likes:0, dislikes:0, commentsCount:0, reports:0, hidden:false, createdAt:serverTimestamp() };
      if(yakImage) payload.image=yakImage;
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; }
      if(yakType==='market'){ payload.price=marketPrice; }
      if(yakType==='pyq'){ payload.subject=pyqSubject.toUpperCase(); }
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setYakImage(''); setPollOptions(['','']); setMarketPrice(''); setPyqSubject(''); setYakType('yak'); setScreen('feed'); showToast("Posted - Share Ready 🔗 Fixed");
    }catch(e:any){ showToast(e.message); }finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(user?.uid!==y.uid) return; if(!confirm('Delete this post?')) return; try{ await deleteDoc(doc(db,'yaks',y.id)); showToast("Deleted - Fixed"); }catch(e:any){ showToast(e.message); } setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost) return; if(!editText.trim()) return; try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); showToast("Edited - Fixed"); }catch(e:any){ showToast(e.message); } setEditingPost(null); setEditText(''); setShowMenu(null); };
  const handleReport=async(y:any)=>{
    if(!userData) return; if(userData.reportedPosts?.includes(y.id)){ showToast("Already reported"); setReportingPost(null); setShowMenu(null); return; }
    if(!reportReason){ showToast("Select reason"); return; }
    try{
      await addDoc(collection(db,'reports'),{yakId:y.id, yakText:y.text.slice(0,200), yakUid:y.uid, reportedBy:user.uid, reason:reportReason, status:"pending", createdAt:serverTimestamp(), yakData:y});
      await updateDoc(doc(db,'yaks',y.id),{reports:increment(1), reportReasons:arrayUnion(reportReason)});
      await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)});
      setUserData({...userData, reportedPosts:[...(userData.reportedPosts||[]), y.id]});
      const newReportCount=(y.reports||0)+1;
      if(newReportCount>=5){ await updateDoc(doc(db,'yaks',y.id),{hidden:true}); showToast("Post hidden - Admin will review - Fixed"); }
      else showToast(`Reported (${newReportCount}/5) - Fixed`);
      setReportingPost(null); setReportReason(''); setShowMenu(null);
    }catch(e:any){ showToast(e.message); }
  };
  const handleAdminRestore=async(report:any)=>{ try{ await updateDoc(doc(db,'yaks',report.yakId),{hidden:false, reports:0}); await updateDoc(doc(db,'reports',report.id),{status:"dismissed"}); showToast("Post restored - Fixed"); }catch(e:any){ showToast(e.message); } };
  const handleAdminDelete=async(report:any)=>{ if(!confirm('Permanently delete?')) return; try{ await deleteDoc(doc(db,'yaks',report.yakId)); await updateDoc(doc(db,'reports',report.id),{status:"deleted"}); showToast("Post deleted by Admin - Fixed"); }catch(e:any){ showToast(e.message); } };
  const handleAdminDismiss=async(report:any)=>{ try{ await updateDoc(doc(db,'reports',report.id),{status:"dismissed"}); showToast("Report dismissed - Fixed"); }catch(e:any){ showToast(e.message); } };
  const buildTree = (flat:any[]) => { const map:Record<string, any> = {}; const roots:any[] = []; flat.forEach(c => { map[c.id] = {...c, replies: []}; }); flat.forEach(c => { if(c.parentId && map[c.parentId]){ map[c.parentId].replies.push(map[c.id]); } else { roots.push(map[c.id]); } }); return roots; };
  const handleCommentPost = async (yId:string) => {
    if(!commentText.trim() ||!user ||!userData) return; const text = commentText.trim(); const payload:any = { text, uid: user.uid, username: "Anonymous - SRET", avatar: "👻", parentId: replyTo? replyTo.id : null, replyToUsername: replyTo? replyTo.username : null, createdAt: serverTimestamp() }; setCommentText(''); const temp = replyTo; setReplyTo(null);
    try{ await addDoc(collection(db,'yaks/'+yId+'/comments'), payload); await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); }catch(e:any){ showToast(e.message); setCommentText(text); setReplyTo(temp); }
  };
  const handleStartDm = async (otherUid:string, yakId?:string)=>{
    if(otherUid===user?.uid){ showToast("Can't DM yourself"); return; }
    if(blockedUsers.includes(otherUid)){ showToast("You blocked this user"); return; }
    const existing=dmChats.find(c=> c.participants.includes(otherUid));
    if(existing){ setActiveDm(existing); setFeedTab('dm'); return; }
    try{
      const newChat=await addDoc(collection(db,'dms'),{ participants:[user.uid, otherUid], lastMessage:"Started private chat - SRET ONLY - Share Fixed 🔗", lastMessageAt:serverTimestamp(), createdAt:serverTimestamp(), relatedYakId:yakId||null });
      setActiveDm({id:newChat.id, participants:[user.uid, otherUid]});
      setFeedTab('dm');
      showToast("Private DM 🔒 - Share Fixed 🔗");
    }catch(e:any){ showToast(e.message); }
  };
  const handleSendDm=async()=>{
    if(!dmText.trim()||!activeDm||!user) return;
    const txt=dmText.trim(); setDmText('');
    try{ await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{ text:txt, uid:user.uid, createdAt:serverTimestamp() }); await updateDoc(doc(db,'dms',activeDm.id),{lastMessage:txt, lastMessageAt:serverTimestamp()}); }catch(e:any){ showToast(e.message); setDmText(txt); }
  };
  const markNotificationsRead=async()=>{ try{ const batch=notifications.filter((n:any)=>!n.read); for(const n of batch){ await updateDoc(doc(db,'notifications',n.id),{read:true}); } }catch{} };
  const handleBlockUser=async(targetUid:string)=>{ if(!confirm('Block this user?')) return; try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(targetUid)}); setBlockedUsers([...blockedUsers, targetUid]); setShowMenu(null); showToast("User blocked - Fixed"); }catch(e:any){ showToast(e.message); } };
  const handleUnblockUser=async(targetUid:string)=>{ try{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayRemove(targetUid)}); setBlockedUsers(blockedUsers.filter(id=>id!==targetUid)); showToast("User unblocked - Fixed"); }catch(e:any){ showToast(e.message); } };
  const handleCrushSubmit=async()=>{
    const roll=crushRoll.trim().toUpperCase(); if(!roll) { showToast("Enter roll number"); return; }
    if(roll===userData.rollNumber){ showToast("Can't crush yourself 😂"); return; }
    try{
      const snap=await getDocs(query(collection(db,'users'),where('rollNumber','==',roll)));
      if(snap.empty){
        await addDoc(collection(db,'crushes'),{fromUid:user.uid, toRoll:roll, toRollMasked: roll.slice(0,2)+"***"+roll.slice(-2), matched:false, createdAt:serverTimestamp(), blocked:false});
        showToast("Secretly saved 💜 - Share Fixed 🔗"); setCrushRoll(''); return;
      }
      const other=snap.docs[0].data() as any;
      const mutualSnap=await getDocs(query(collection(db,'crushes'),where('fromUid','==',other.uid), where('toRoll','==',userData.rollNumber)));
      if(!mutualSnap.empty){
        await addDoc(collection(db,'crushes'),{fromUid:user.uid, toRoll:roll, toRollMasked: roll.slice(0,2)+"***"+roll.slice(-2), toUid:other.uid, matched:true, createdAt:serverTimestamp(), blocked:false});
        await updateDoc(doc(db,'crushes',mutualSnap.docs[0].id),{matched:true});
        showToast("💘 IT'S A MATCH! - Share Fixed 🔗");
      }else{
        await addDoc(collection(db,'crushes'),{fromUid:user.uid, toRoll:roll, toRollMasked: roll.slice(0,2)+"***"+roll.slice(-2), toUid:other.uid, matched:false, createdAt:serverTimestamp(), blocked:false});
        showToast("Secretly saved 🤫 - Share Fixed 🔗");
      }
      setCrushRoll('');
    }catch(e:any){ showToast(e.message); }
  };
  const handleCancelCrush=async(crushId:string)=>{ if(!confirm('Cancel this secret crush?')) return; try{ await deleteDoc(doc(db,'crushes',crushId)); showToast("Secret crush cancelled - Fixed"); }catch(e:any){ showToast(e.message); } };
  const handleBlockFromCrush=async(crush:any)=>{ try{ await updateDoc(doc(db,'crushes',crush.id),{blocked:true}); showToast("Blocked from Crush - Fixed"); }catch(e:any){ showToast(e.message); } };
  const handleReportCrushAbuse=async(crush:any)=>{ const reason = prompt('Report reason?'); if(!reason) return; try{ await addDoc(collection(db,'reports'),{type:'crush_abuse', crushId:crush.id, reportedBy:user.uid, reason, createdAt:serverTimestamp(), status:'pending'}); showToast("Crush abuse reported - Fixed"); }catch(e:any){ showToast(e.message); } };
  const handleDeleteAccount=async()=>{
    if(!confirm('DELETE ACCOUNT?')) return; const c2 = prompt('Type "DELETE"'); if(c2!=='DELETE') return;
    try{
      const uid=user.uid; const userDocId=userData.id;
      const yaksSnap = await getDocs(query(collection(db,'yaks'),where('uid','==',uid))); for(const d of yaksSnap.docs){ await deleteDoc(doc(db,'yaks',d.id)); }
      const crushFromSnap = await getDocs(query(collection(db,'crushes'),where('fromUid','==',uid))); for(const d of crushFromSnap.docs){ await deleteDoc(doc(db,'crushes',d.id)); }
      await deleteDoc(doc(db,'users',userDocId)); localStorage.clear(); window.location.reload();
    }catch(e:any){ showToast("Error: "+e.message); }
  };
  const handleDeleteDataOnly=async()=>{
    if(!confirm('Delete ONLY posts + crushes?')) return;
    try{ const uid=user.uid; const yaksSnap = await getDocs(query(collection(db,'yaks'),where('uid','==',uid))); for(const d of yaksSnap.docs){ await deleteDoc(doc(db,'yaks',d.id)); } await updateDoc(doc(db,'users',userData.id),{totalPosts:0, yakarma:100}); showToast("Posts deleted - Fixed"); }catch(e:any){ showToast(e.message); }
  };

const renderComment = (c:any, depth=0) => {
    const isReply = depth > 0;
    return (<div key={c.id} className={`${isReply? 'ml-6 border-l-2 border-white/15 pl-3' : ''} mt-3`}><div className="flex gap-2.5"><div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white text-xs">👻</div><div className="flex-1"><div className="bg-white/[0.05] border border-white/10 rounded-[14px] px-4 py-2.5"><p className="text-[13px] text-white leading-[1.4] whitespace-pre-wrap break-words">{c.text}</p></div><div className="flex gap-3 mt-1.5 ml-1 items-center"><button onClick={()=>setReplyTo(c)} className="text-[11px] font-bold text-white/30">Reply - Share Fixed 🔗</button><button onClick={()=>handleStartDm(c.uid)} className="text-[11px] font-bold text-white/30">DM 🔒 Share Fixed 🔗</button></div>{c.replies && c.replies.length > 0 && (<div className="mt-1">{c.replies.map((rep:any)=>renderComment(rep, depth+1))}</div>)}</div></div></div>);
  };
  const filteredYaks = (searchQuery? yaks.filter(y=> y.text?.toLowerCase().includes(searchQuery.toLowerCase())) : yaks).filter(y=>!blockedUsers.includes(y.uid));
  const displayHotYaks = hotYaks.filter(y=>!blockedUsers.includes(y.uid));
  const displayMemeYaks = memeYaks.filter(y=>!blockedUsers.includes(y.uid));
  const displayMarketYaks = marketYaks.filter(y=>!blockedUsers.includes(y.uid));
  const displayPyqYaks = pyqYaks.filter(y=>!blockedUsers.includes(y.uid));

  useEffect(()=>{
    if(yaks.length===0) return;
    try{
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('post');
      if(postId){ setActivePost(postId); showToast("Shared post opened 🔗 Fixed"); }
    }catch{}
  },[yaks]);

  return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100]">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">S</div><div><p className="font-bold text-[13px] text-white">SRET ANON - {yaks.length} • Share 3in1 Fixed 🔗</p><p className="text-[10px] text-white/40">{totalUsers} verified • Share Fixed 🔗</p></div></div>
          <div className="flex gap-2 items-center">
            <button onClick={()=>{ setShowNotifications(true); markNotificationsRead(); }} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white relative">🔔{unreadCount>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white">{unreadCount}</span>}</button>
            <button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">👻</button>
          </div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-2"><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search #hashtag - Share Fixed 🔗" className="flex-1 h-9 bg-white/5 border border-white/10 rounded-full px-4 text-xs outline-none text-white" /></div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2 overflow-x-auto">
          <button onClick={()=>setFeedTab('new')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 ${feedTab==='new'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>NEW {filteredYaks.length}</button>
          <button onClick={()=>setFeedTab('meme')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 ${feedTab==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>MEME</button>
          <button onClick={()=>setFeedTab('hot')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 ${feedTab==='hot'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>HOT</button>
          <button onClick={()=>setFeedTab('top')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 ${feedTab==='top'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>TOP</button>
          <button onClick={()=>setFeedTab('crush')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 ${feedTab==='crush'?'bg-pink-500 text-white border-pink-500':'bg-white/5 border-white/10 text-white/40'}`}>💘 {crushMatches.filter((c:any)=>c.matched &&!c.blocked).length}</button>
          <button onClick={()=>setFeedTab('market')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 ${feedTab==='market'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🛒 {displayMarketYaks.length}</button>
          <button onClick={()=>setFeedTab('pyq')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 ${feedTab==='pyq'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>📚 {displayPyqYaks.length}</button>
          <button onClick={()=>setFeedTab('dm')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 ${feedTab==='dm'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🔒 DM {dmChats.length}</button>
        </div>
      </div>
      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        {hashtags.length>0 &&!['dm','top','crush','market','pyq'].includes(feedTab) && (
          <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">TRENDING HASHTAGS - Share Fixed 🔗</p><div className="flex gap-2 mt-3 flex-wrap">{hashtags.map((h:any)=><button key={h.tag} onClick={()=>setSearchQuery(h.tag)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/60">{h.tag} {h.count} • Fixed 🔗</button>)}</div></div>
        )}
        {feedTab==='crush' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-2 border-pink-500/20 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-pink-400">CRUSH MATCHER 💘 • Share Fixed 🔗</p><h3 className="font-black mt-2 text-white">Secret Crush - Share Fixed 🔗</h3><div className="flex gap-2 mt-4"><input value={crushRoll} onChange={e=>setCrushRoll(e.target.value.toUpperCase())} placeholder="Crush Roll - Share Fixed 🔗" className="flex-1 bg-black/30 border-2 border-pink-500/20 rounded-full px-5 h-11 text-[13px] text-white"/><button onClick={handleCrushSubmit} className="px-6 h-11 bg-pink-500 text-white rounded-full font-bold text-xs">Add Secret 💜 Fixed 🔗</button></div></div>
            {crushMatches.filter((c:any)=>c.matched &&!c.blocked).map((m:any)=><div key={m.id} className="mt-3 bg-white/5 p-3 rounded-xl flex justify-between items-center"><div><p className="font-bold text-[13px] text-white">MATCH! {m.toRollMasked} • Share Fixed 🔗</p></div><button onClick={()=>handleStartDm(m.toUid)} className="px-4 py-2 bg-white text-black rounded-full text-[11px] font-bold">DM 🔒 Share Fixed 🔗</button></div>)}
            <Footer/>
          </div>
        )}
        {feedTab==='market' && (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="font-black mt-1 text-white">Market - Share 3in1 Fixed 🔗</p><button onClick={()=>{setYakType('market'); setScreen('create');}} className="mt-3 bg-white text-black px-5 h-9 rounded-full text-xs font-bold">Sell Item + Share Fixed 🔗</button></div>
            {displayMarketYaks.map((y:any)=><div key={y.id} className="bg-white/[0.04] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[14px] text-white">{y.text} • Share Fixed 🔗</p>{y.image && <img src={y.image} className="mt-3 rounded-[16px] border-2 border-white/10 w-full max-h-[300px] object-cover"/>}<div className="flex gap-2 mt-4"><button onClick={()=>handleStartDm(y.uid)} className="flex-1 h-10 bg-white text-black rounded-full font-bold text-xs">DM 🔒 Share Fixed 🔗</button><button onClick={()=>handleSharePost(y)} className="px-4 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full font-bold text-xs">↗ Share Fixed 🔗</button><button onClick={()=>handleWhatsAppShare(y)} className="px-3 h-10 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full font-bold text-xs">💬 WA Fixed 🔗</button></div></div>)}
            <Footer/>
          </div>
        )}
        {feedTab==='pyq' && (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="font-black mt-1 text-white">PYQ Vault - Share Fixed 🔗</p><button onClick={()=>{setYakType('pyq'); setScreen('create');}} className="mt-3 bg-white text-black px-5 h-9 rounded-full text-xs font-bold">Upload PYQ + Share Fixed 🔗</button></div>
            {displayPyqYaks.map((y:any)=><div key={y.id} className="bg-white/[0.04] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[14px] text-white">{y.text} • Share Fixed 🔗</p>{y.image && <img src={y.image} className="mt-3 rounded-[16px] border-2 border-white/10 w-full max-h-[400px] object-contain"/>}<div className="flex gap-2 mt-4"><button onClick={()=>handleVote(y,'up')} className="px-4 h-8 bg-white/5 border border-white/10 rounded-full text-xs text-white/40">Up {y.likes||0}</button><button onClick={()=>handleSharePost(y)} className="px-3 h-8 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold">↗ Share Fixed 🔗</button><button onClick={()=>handleCopyLink(y)} className="px-2 h-8 bg-white/5 border border-white/10 rounded-full text-xs text-white/40">🔗 Link Fixed 🔗</button></div></div>)}
            <Footer/>
          </div>
        )}

        {feedTab==='dm'? (
          <div className="space-y-3">
            {!activeDm? (
              <><div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="font-black mt-1 text-white">Private Chats - {dmChats.length} • Share Fixed 🔗</p></div>
              {dmChats.map((chat:any)=><button key={chat.id} onClick={()=>setActiveDm(chat)} className="w-full bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center text-left"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">🔒</div><div><p className="font-bold text-[13px] text-white">🔒 Private Chat - Share Fixed 🔗</p><p className="text-[11px] text-white/40 truncate max-w-[200px]">{chat.lastMessage}</p></div></div></button>)}
              {dmChats.length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><p className="font-black text-[18px] text-white">No DMs yet - Share Fixed 🔗</p></div>}<Footer/></>
            ) : (
              <div className="bg-white/[0.03] border-2 border-white/10 rounded-[24px] flex flex-col h-[70vh]">
                <div className="p-4 border-b-2 border-white/10 flex justify-between items-center"><div className="flex gap-3 items-center"><button onClick={()=>setActiveDm(null)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full text-white">←</button><div><p className="font-bold text-[13px] text-white">🔒 Private - Share Fixed 🔗</p></div></div></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">{dmMessages.map((m:any)=><div key={m.id} className={`flex ${m.uid===user?.uid?'justify-end':'justify-start'}`}><div className={`max-w-[70%] rounded-[16px] px-4 py-2.5 ${m.uid===user?.uid?'bg-white text-black':'bg-white/10 border border-white/10 text-white'}`}><p className="text-[13px]">{m.text} • Share Fixed 🔗</p></div></div>)}</div>
                <div className="p-3 border-t-2 border-white/10 flex gap-2"><input value={dmText} onChange={e=>setDmText(e.target.value)} placeholder="Private message - Share Fixed 🔗" className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] text-white" onKeyDown={e=>{ if(e.key==='Enter') handleSendDm(); }}/><button onClick={handleSendDm} className="w-11 h-11 rounded-full bg-white text-black font-bold">Go Fixed 🔗</button></div>
              </div>
            )}
          </div>
        ) : feedTab==='top'? (
          <div className="space-y-3">
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="font-black mt-1 text-white">Top - Share Fixed 🔗</p></div>
            {leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">{i+1}</span><p className="font-bold text-[13px] text-white">Anonymous {i+1} - Share Fixed 🔗</p></div><p className="font-black text-sm text-white">{u.yakarma} Fixed 🔗</p></div>)}<Footer/></div>
        ) :!['crush','market','pyq','dm','top'].includes(feedTab) && (
          <>
            {(feedTab==='new'? filteredYaks : feedTab==='meme'? displayMemeYaks : displayHotYaks).map(y=>{
              const liked=userData?.likedPosts?.includes(y.id); const disliked=userData?.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const hasVoted=userData?.pollVoted?.includes(y.id); const nestedTree = activePost===y.id? buildTree(comments) : [];
              return(
                <div key={y.id} className="bg-white/[0.04] border-2 border-white/10 rounded-[20px] p-5">
                  <div className="flex justify-between items-start"><div className="flex gap-3"><div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm text-white">👻</div><div><p className="font-bold text-[13px] text-white">Anonymous - SRET {isOwn?'- YOU':''} • Share Fixed 🔗</p><p className="text-[10px] text-white/30">{score} • Share Fixed 🔗</p></div></div><div className="relative flex gap-2"><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40">...</button>{showMenu===y.id && <div className="absolute right-0 top-10 w-[260px] bg-black border-2 border-white/10 rounded-2xl p-2 z-20 shadow-2xl"><p className="text-[9px] font-bold tracking-widest text-white/30 px-3 py-2">SHARE 3in1 FIXED 🔗</p><button onClick={()=>{ handleSharePost(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">↗ Native Share Fixed 🔗</button><button onClick={()=>{ handleWhatsAppShare(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 mt-2">💬 WhatsApp Fixed 🔗</button><button onClick={()=>{ handleCopyLink(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60 mt-2">🔗 Copy Link?post=ID Fixed 🔗</button><div className="h-[1px] bg-white/10 my-2"></div>{isOwn? (<button onClick={()=>handleDelete(y)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400">Delete Fixed 🔗</button>) : (<><button onClick={()=>{ setReportingPost(y); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60">Report {y.reports||0}/5 Fixed 🔗</button><button onClick={()=>handleBlockUser(y.uid)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 mt-2">🚫 Block Fixed 🔗</button></>)}<button onClick={()=>setShowMenu(null)} className="w-full mt-2 py-2 rounded-xl text-[11px] text-white/30">Cancel Fixed 🔗</button></div>}</div></div>
                  <p className="text-[15px] mt-4 leading-[1.5] text-white whitespace-pre-wrap break-words">{y.text} • Share Fixed 🔗</p>
                  {y.image && <img src={y.image} className="mt-4 rounded-[16px] border-2 border-white/10 w-full max-h-[380px] object-cover" />}
                  {isPoll && y.pollOptions && (<div className="mt-4 bg-white/[0.03] border-2 border-white/10 rounded-[16px] p-4"><div className="space-y-2.5">{[...y.pollOptions].sort((a:any,b:any)=> (b.votes||0)-(a.votes||0)).map((opt:any,idx:number)=>{ const total=y.totalVotes||1; const percent=Math.round((opt.votes/total)*100)||0; return (<button key={idx} onClick={()=>handlePollVote(y,y.pollOptions.indexOf(opt))} disabled={!!hasVoted} className="w-full relative overflow-hidden rounded-xl border-2 border-white/10 text-left p-0"><div className="absolute left-0 top-0 bottom-0 bg-white/10" style={{width:`${hasVoted? percent: 0}%`}}></div><div className="relative flex justify-between items-center p-3"><span className="text-[13px] font-bold">{opt.text} • Share Fixed 🔗</span><p className="text-[12px] font-black">{hasVoted? `${percent}%` : `${opt.votes||0} votes`}</p></div></button> )})}</div></div>)}
                  <div className="flex gap-2.5 mt-5 items-center flex-wrap"><div className="flex bg-white/5 border border-white/10 rounded-full p-1"><button onClick={()=>handleVote(y,'up')} className={`px-4 py-2 rounded-full text-xs font-bold ${liked?'bg-white text-black':'text-white/40'}`}>Up {y.likes||0} Fixed 🔗</button><span className="px-3 py-2 text-[11px] font-black text-white/20">{score}</span><button onClick={()=>handleVote(y,'down')} className={`px-4 py-2 rounded-full text-xs font-bold ${disliked?'bg-red-500 text-white':'text-white/30'}`}>Down {y.dislikes||0} Fixed 🔗</button></div><button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); }} className="px-4 h-9 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">Comments {y.commentsCount||0} Fixed 🔗</button><button onClick={()=>handleSharePost(y)} className="px-4 h-9 rounded-full text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold">↗ Share Fixed 🔗</button><button onClick={()=>handleStartDm(y.uid)} className="px-4 h-9 rounded-full text-xs bg-green-500/10 border border-green-500/20 text-green-400 font-bold">🔒 DM Fixed 🔗</button></div>
                  {activePost===y.id && (<div className="mt-5 border-t-2 border-white/10 pt-4"><div className="max-h-[420px] overflow-y-auto pr-1">{nestedTree.map((c:any)=>renderComment(c,0))}</div><div className="flex gap-2.5 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment - Share Fixed 🔗" className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] text-white" onKeyDown={e=>{ if(e.key==='Enter'){ handleCommentPost(y.id); } }}/><button onClick={()=>handleCommentPost(y.id)} className="w-11 h-11 rounded-full bg-white text-black font-bold">Go Fixed 🔗</button></div></div>)}</div>
              );
            })}
            {filteredYaks.length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><p className="font-black mt-3 text-white">No posts yet - Share Fixed 🔗</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full text-[13px] font-bold">Create First Post - Share Fixed 🔗</button></div>}
            <Footer/>
          </>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-2xl border-t-2 border-white/10"><div className="max-w-[600px] mx-auto px-6 h-[72px] flex items-center justify-between"><button onClick={()=>setFeedTab('new')} className="flex flex-col items-center gap-1.5"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/30 border border-white/10'}`}>S</div><span className="text-[8px] font-bold tracking-widest text-white/30">SRET {yaks.length} Fixed 🔗</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[24px] font-black">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1.5"><div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs text-white">{selectedAvatar}</div><span className="text-[8px] font-bold tracking-widest text-white/30">KARMA {userData?.yakarma||0} Fixed 🔗</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col overflow-hidden">
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full bg-[#0a0a0b]">
            <div className="p-5 flex items-center justify-between border-b-2 border-white/10"><button onClick={()=>setScreen('feed')} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full text-white">X</button><p className="text-[11px] font-bold tracking-widest text-white">SRET ONLY - Share 3in1 Fixed 🔗</p><button onClick={handlePost} disabled={posting||(!newYak.trim()&&!yakImage)} className={`px-6 h-10 rounded-full font-bold text-[13px] ${posting||(!newYak.trim()&&!yakImage)?'bg-white/5 text-white/20':'bg-white text-black'}`}>{posting?'Posting...':'Post Fixed 🔗'}</button></div>
            <div className="p-3 flex gap-2 border-b-2 border-white/5 overflow-x-auto">
              <button onClick={()=>setYakType('yak')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 ${yakType==='yak'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Talk Fixed 🔗</button>
              <button onClick={()=>setYakType('poll')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 ${yakType==='poll'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Poll Fixed 🔗</button>
              <button onClick={()=>setYakType('meme')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 ${yakType==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>Meme Fixed 🔗</button>
              <button onClick={()=>setYakType('market')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 ${yakType==='market'?'bg-green-500 text-white border-green-500':'bg-white/5 border-white/10 text-white/40'}`}>🛒 Sell Fixed 🔗</button>
              <button onClick={()=>setYakType('pyq')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 ${yakType==='pyq'?'bg-blue-500 text-white border-blue-500':'bg-white/5 border-white/10 text-white/40'}`}>📚 PYQ Fixed 🔗</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="Talk about SRET... Share 3in1 Fixed 🔗" autoFocus className="w-full bg-transparent text-[19px] outline-none placeholder:text-white/20 resize-none min-h-[140px] text-white" maxLength={500}/>
              {yakType==='poll' && (<div className="mt-6 space-y-3">{pollOptions.map((opt,idx)=><div key={idx} className="flex gap-2"><input value={opt} onChange={e=>{ const n=[...pollOptions]; n[idx]=e.target.value; setPollOptions(n); }} placeholder={`Option ${idx+1} - Share Fixed 🔗`} className="flex-1 p-4 bg-white/[0.03] border-2 border-white/10 rounded-xl text-sm text-white"/><input type="file" hidden /></div>)}{pollOptions.length<4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="w-full p-3 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-xl text-xs font-bold text-white/40">Add Option Fixed 🔗</button>}</div>)}
              <div className="mt-6">{yakImage? (<div className="relative"><img src={yakImage} className="w-full rounded-[16px] border-2 border-white/10 max-h-[300px] object-cover"/><button onClick={()=>setYakImage('')} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full text-white">X</button></div>) : (<label className="w-full border-2 border-dashed border-white/10 rounded-[16px] p-8 flex flex-col items-center justify-center cursor-pointer bg-white/[0.02]"><span className="text-xs font-bold text-white/60">Upload Image - Share Fixed 🔗</span><input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,setYakImage)} /></label>)}</div>
            </div>
            <div className="p-5 border-t-2 border-white/5 bg-white/[0.02]"><div className="bg-green-500/5 border-2 border-green-500/10 rounded-xl p-4 flex gap-3 items-center"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] text-white/50"><span className="font-bold text-green-400">Share 3in1 Fixed 🔗:</span> ↗ Native + 💬 WA + 🔗 Link?post=ID - Fixed</p></div><Footer/></div>
          </div>
        </div>
      )}

      {editingPost && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center p-4"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8"><h3 className="font-black text-[16px] text-white">Edit Post - Share Fixed 🔗</h3><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-5 bg-white/[0.05] border-2 border-white/10 rounded-xl p-4 text-[15px] outline-none min-h-[120px] resize-none text-white"/><div className="flex gap-3 mt-6"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs text-white">Cancel Fixed 🔗</button><button onClick={handleEdit} className="flex-1 h-12 bg-white text-black rounded-full font-bold text-xs">Save Fixed 🔗</button></div></div></div>}

      {showNotifications && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto"><div className="flex justify-between items-center"><h3 className="font-black text-[16px] text-white">Notifications - Share Fixed 🔗</h3><button onClick={()=>setShowNotifications(false)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full text-white">X</button></div><div className="mt-6 space-y-3">{notifications.map((n:any)=><div key={n.id} className={`p-4 rounded-[16px] border-2 ${!n.read?'bg-white/10 border-white/20':'bg-white/[0.03] border-white/10'}`}><p className="text-[13px] text-white">{n.text} - Share Fixed 🔗</p></div>)}{notifications.length===0 && <div className="py-16 text-center"><p className="font-bold text-white/40">No notifications - Share Fixed 🔗</p></div>}<button onClick={()=>setShowNotifications(false)} className="w-full mt-6 bg-white text-black h-12 rounded-full font-bold text-xs">Close Fixed 🔗</button></div></div></div>}

      {reportingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[60] flex items-end justify-center p-4">
          <div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8">
            <h3 className="font-black text-[16px] text-white">Report Post - Share Safe Fixed 🔗</h3>
            <p className="text-[11px] text-white/40 mt-1">{reportingPost.text?.slice(0,60)}... - Share Safe Fixed 🔗</p>
            <div className="grid grid-cols-1 gap-2 mt-3">
              {REPORT_REASONS.map((r:any)=><button key={r} onClick={()=>setReportReason(r)} className={`p-3.5 rounded-xl text-left text-[12px] font-bold border-2 ${reportReason===r?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/60'}`}>{r} {reportReason===r?'✓ Fixed 🔗':''}</button>)}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>{ setReportingPost(null); setReportReason(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs text-white">Cancel Fixed 🔗</button>
              <button onClick={()=>handleReport(reportingPost)} disabled={!reportReason} className={`flex-1 h-12 rounded-full font-bold text-xs ${!reportReason?'bg-white/5 text-white/20':'bg-red-500 text-white'}`}>Submit Fixed 🔗</button>
            </div>
          </div>
        </div>
      )}

      {showAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex flex-col">
          <div className="max-w-[600px] mx-auto w-full flex-1 flex flex-col bg-[#0a0a0b] p-4 overflow-y-auto">
            <div className="flex justify-between items-center"><h2 className="font-black text-white">ADMIN - {adminReports.length} Pending - Share Safe Fixed 🔗</h2><button onClick={()=>setShowAdmin(false)} className="w-8 h-8 bg-white/10 rounded-full text-white">X</button></div>
            <div className="mt-6 space-y-4">
              {adminReports.map((rep:any)=><div key={rep.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4">
                <p className="text-[13px] text-white mt-3">{rep.yakText} - Share Safe Fixed 🔗</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={()=>handleAdminRestore(rep)} className="flex-1 h-10 bg-white text-black rounded-full text-[11px] font-bold">Restore ✅ Fixed 🔗</button>
                  <button onClick={()=>handleAdminDismiss(rep)} className="flex-1 h-10 bg-white/10 border border-white/10 rounded-full text-[11px] font-bold text-white">Dismiss Fixed 🔗</button>
                  <button onClick={()=>handleAdminDelete(rep)} className="flex-1 h-10 bg-red-500 text-white rounded-full text-[11px] font-bold">Delete Fixed 🔗</button>
                </div>
              </div>)}
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
          <div className="bg-[#141416] border-2 border-white/10 w-full max-w-[360px] rounded-[24px] p-6 shadow-2xl">
            <div className="w-14 h-14 bg-white/5 border-2 border-white/10 rounded-full mx-auto flex items-center justify-center text-2xl">👋</div>
            <h3 className="font-black text-[18px] text-white text-center mt-4">Are you sure you want to logout? Share Safe Fixed 🔗</h3>
            <p className="text-[11px] text-white/40 text-center mt-2 leading-[1.5]">Your data stays safe<br/>Share 3in1 Safe 🔗<br/>SRET ONLY - Private DM secure 🔒 Fixed</p>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 h-12 bg-white text-black rounded-full font-bold text-xs">Cancel - Share 3in1 Fixed 🔗</button>
              <button onClick={()=>{ auth.signOut(); localStorage.clear(); window.location.reload(); }} className="flex-1 h-12 bg-red-500 text-white rounded-full font-bold text-xs">Yes, Logout - Share Fixed 🔗</button>
            </div>
          </div>
        </div>
      )}

      {showProfile && (<div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><div className="flex gap-4"><div className="w-[72px] h-[72px] bg-white/5 border-2 border-white/10 rounded-[20px] flex items-center justify-center text-3xl text-white">🔒</div><div className="flex-1"><h2 className="font-black text-[16px] leading-none text-white">SRET ONLY - 1to1 PRIVATE 🔒 • Share 3in1 Fixed 🔗</h2><p className="text-[11px] text-white/40 mt-2 leading-[1.4]">No crash • {totalUsers} verified • {dmChats.length} private chats • Share 3in1 Fixed 🔗 • No crash</p><div className="flex gap-2 mt-4 flex-wrap"><span className="px-3 py-1.5 bg-white text-black rounded-full text-[10px] font-bold">{userData?.yakarma||0} karma • Share Fixed 🔗</span><span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[9px] font-bold">🔒 {dmChats.length} PRIVATE • Share Fixed 🔗</span><span className="px-3 py-1.5 bg-pink-500 text-white rounded-full text-[9px] font-bold">💘 {crushMatches.filter((c:any)=>c.matched &&!c.blocked).length} MATCHES • Share Fixed 🔗</span><span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[9px] font-bold">🔗 Share 3in1 Fixed • No Crash</span></div></div></div>
      <div className="grid grid-cols-4 gap-3 mt-6"><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{userData?.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">POSTS • Share Fixed 🔗</p></div><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{totalUsers}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">VERIFIED • Share Fixed 🔗</p></div><div className="bg-green-500/10 border-2 border-green-500/20 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-green-400">{dmChats.length}</p><p className="text-[9px] font-bold tracking-widest text-green-400/60 mt-1">PRIVATE DM • Share Fixed 🔗</p></div><div className="bg-white text-black rounded-[18px] p-4 text-center"><p className="font-black text-xl">{userData?.yakarma||0}</p><p className="text-[9px] font-bold tracking-widest mt-1">KARMA • Share Fixed 🔗</p></div></div>
      <div className="mt-6 bg-green-500/5 border-2 border-green-500/10 rounded-[16px] p-4"><p className="text-[11px] font-bold text-green-400">🔒 PRIVATE DM + SHARE 3in1 FIXED 🔗 - FINAL:</p><p className="text-[11px] text-white/40 mt-2 leading-[1.6]">✅ 1to1 only - 2 participants<br/>✅ No one can see other's chat - Only you 2<br/>✅ No orderBy crash - Fixed - No client-side exception<br/>✅ Share 3in1: ↗ Native + 💬 WhatsApp + 🔗 Copy?post=ID<br/>✅?post=ID link open cheste post auto open - Fixed 🔗</p></div>
      <button onClick={()=>setShowAdmin(true)} className="w-full mt-4 bg-yellow-500/10 border-2 border-yellow-500/20 h-12 rounded-full text-xs font-bold text-yellow-400">Admin Review - {adminReports.length} Pending - Share Fixed 🔗 {adminReports.length>0?'🔴':''}</button>
      {blockedUsers.length>0 && (
        <div className="mt-6 bg-red-500/5 border-2 border-red-500/10 rounded-[16px] p-4">
          <p className="text-[11px] font-bold text-red-400">🚫 BLOCKED USERS - {blockedUsers.length} - Share Safe Fixed 🔗</p>
          <div className="mt-3 space-y-2">
            {blockedUsers.map((uid:string)=><div key={uid} className="flex justify-between items-center bg-white/[0.03] p-3 rounded-xl">
              <p className="text-[11px] text-white/60 font-mono">{uid.slice(0,8)}... (Anonymous) - Share Safe Fixed 🔗</p>
              <button onClick={()=>handleUnblockUser(uid)} className="px-3 py-1 bg-white text-black rounded-full text-[10px] font-bold">Unblock - Share Safe Fixed 🔗</button>
            </div>)}
          </div>
        </div>
      )}
      <div className="mt-6 bg-red-500/5 border-2 border-red-500/10 rounded-[16px] p-4">
        <p className="text-[11px] font-bold text-red-400">🗑️ DANGER ZONE - Share Safe Fixed 🔗</p>
        <div className="mt-4 space-y-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
            <p className="text-[11px] font-bold text-white">Delete Only Posts + Crushes - Share Safe Fixed 🔗</p>
            <button onClick={handleDeleteDataOnly} className="w-full mt-3 h-10 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-white/60">Delete My Posts + Crushes Only Fixed 🔗</button>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
            <p className="text-[11px] font-bold text-red-400">Delete Account + All Data Permanently - Share Safe Fixed 🔗</p>
            <button onClick={handleDeleteAccount} className="w-full mt-3 h-10 bg-red-500 text-white rounded-full text-[11px] font-bold">🗑️ Delete Account + All Data Forever Fixed 🔗</button>
          </div>
        </div>
      </div>
      <button onClick={()=>setShowLogoutConfirm(true)} className="w-full mt-6 bg-white/5 border-2 border-white/10 h-12 rounded-full text-xs font-bold text-white/60">Logout - SRET ONLY - Share Safe Fixed 🔗</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-12 rounded-full font-bold text-xs">Close - Share 3in1 Done Fixed 🔗</button><div className="mt-4"><Footer/></div></div></div>)}
    </div>
  );
}
