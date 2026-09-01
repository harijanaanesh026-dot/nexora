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

const COLLEGES = [
  {id:"SRET", label:"SRET", city:"Tirupati", domains:["sret.edu.in","sret.ac.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21CS101"},
  {id:"SVCE", label:"SVCE", city:"Tirupati", domains:["svce.edu.in"], pattern:/^(19|20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"20CS123"},
  {id:"BITS", label:"BITS", city:"Pilani", domains:["bits-pilani.ac.in"], pattern:/^20[0-9]{2}[A-Z]{2,4}[0-9]{4}$/i, ex:"2021CS1234"},
  {id:"VEMU", label:"VEMU", city:"Chittoor", domains:["vemu.edu.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21IT089"},
  {id:"OTHER", label:"OTHER", city:"India", domains:["edu.in","ac.in"], pattern:/^[A-Z0-9]{6,15}$/i, ex:"COL12345"},
];
const AVATARS = ["👻","🔥","😎","🤫","💀","👽","🦊","🐼"];
const Footer = () => <div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8"><p className="text-[10px] tracking-[0.3em] font-bold text-white/40">A PRODUCTION BY ANESH</p><p className="text-[9px] text-white/20">Dark BG • White Letters • Real App • College Only</p></div>;

export default function YakDarkReal(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hot'|'top'|'meme'>('new');
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
  const [isAnonymous,setIsAnonymous]=useState(false);
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [showProfile,setShowProfile]=useState(false);
  const [selectedCollege,setSelectedCollege]=useState('');
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
  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2500); };

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{ return onSnapshot(collection(db,'users'), snap=>{ const c:Record<string,number>={}; snap.docs.forEach(d=>{ const col=(d.data() as any).college; if(col) c[col]=(c[col]||0)+1; }); setCollegeCounts(c); setTotalUsers(snap.size); }); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college'); if(!col ||!isVerified){ setScreen('college'); return; }
          await addDoc(collection(db,'users'),{ uid:u.uid, email:u.email||'', username:'Yak_'+Math.floor(Math.random()*9000+1000), avatar:localStorage.getItem('selected_avatar')||'👻', college:String(col), collegeEmail:String(localStorage.getItem('college_email')||''), rollNumber:String(localStorage.getItem('roll_number')||''), idVerified: localStorage.getItem('verify_method')==='id'? false : true, yakarma:100, totalPosts:0, likedPosts:[], dislikedPosts:[], pollVoted:[], reportedPosts:[], createdAt:serverTimestamp() });
          window.location.reload();
        }else{ setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen('feed'); }
      }else setScreen('college');
    });
  },[isVerified]);

  // DARK BG - SAME COLLEGE ONLY - 100% KANIPISTHUNDI
  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(collection(db,'yaks'), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any));
      const data=all.filter(d=>d.college===userData.college);
      data.sort((a,b)=> (b.createdAt?.toMillis?.()||b.createdAt?.seconds*1000||0) - (a.createdAt?.toMillis?.()||a.createdAt?.seconds*1000||0));
      setYaks(data);
      setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
      setMemeYaks([...data].filter(d=>d.type==='meme'||d.image).sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
    });
  },[userData]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(collection(db,'users'), s=>{ const all=s.docs.map(d=>({id:d.id,...d.data()} as any)); const same=all.filter(u=>u.college===userData.college); setLeaderboard(same.sort((a,b)=>b.yakarma-a.yakarma).slice(0,20)); }); },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

    const getCollegeConfig=()=>COLLEGES.find(c=>c.id===selectedCollege);
  const handleCollegeNext=()=>{ if(!selectedCollege) return; localStorage.setItem('selected_college',selectedCollege); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{
    setVerifyError(''); const config=getCollegeConfig(); if(!config) return;
    const emailLower=collegeEmail.toLowerCase().trim();
    if(!config.domains.some(d=>emailLower.endsWith(d))){ setVerifyError(`Only ${config.domains.join(' or ')}`); return; }
    const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower)));
    if(!dup.empty){ setVerifyError('Mail already used'); return; }
    const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode);
    await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()}); setOtpSent(true); showToast("OTP: "+otpCode);
  };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const rollUpper=rollNumber.trim().toUpperCase(); if(!config.pattern.test(rollUpper)){ setVerifyError(`Invalid Ex: ${config.ex}`); return; } const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper))); if(!dup.empty){ setVerifyError('Roll already used'); return; } localStorage.setItem('roll_number',rollUpper); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login'); };
  const handleIdVerify=async()=>{ if(!idImage ||!idName.trim()){ setVerifyError('Upload ID + Name'); return; } localStorage.setItem('id_image',idImage); localStorage.setItem('id_name',idName.trim().toUpperCase()); localStorage.setItem('verify_method','id'); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleImageUpload=(e:any,setter:any)=>{ const file=e.target.files?.[0]; if(!file) return; if(file.size>800*1024){ showToast("Image <800KB"); return; } const reader=new FileReader(); reader.onloadend=()=>setter(reader.result as string); reader.readAsDataURL(file); };

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
  const handlePollVote=async(y:any, idx:number)=>{
    if(!userData) return; if(userData.pollVoted?.includes(y.id)){ showToast("Already voted"); return; }
    try{ const n=[...y.pollOptions]; n[idx].votes=(n[idx].votes||0)+1; await updateDoc(doc(db,'yaks',y.id),{pollOptions:n, totalVotes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{pollVoted:arrayUnion(y.id)}); setUserData({...userData, pollVoted:[...(userData.pollVoted||[]), y.id]}); showToast("Voted"); }catch(e:any){ showToast(e.message); }
  };
  const handlePost=async()=>{
    const txt=newYak.trim(); if(!txt &&!yakImage){ showToast("Type or upload"); return; } if(yakType==='poll' && pollOptions.filter(o=>o.trim()).length<2){ showToast("Need 2 options"); return; } if(!userData||!user) return; if(posting) return; setPosting(true);
    try{
      const payload:any={ text:txt, uid:user.uid, username: isAnonymous || yakType==='confession'? 'Anonymous' : userData.username, realUsername: userData.username, avatar: isAnonymous || yakType==='confession'? '🤫' : userData.avatar, college:userData.college, type:yakType, isAnonymous: isAnonymous || yakType==='confession', likes:0, dislikes:0, commentsCount:0, reports:0, createdAt:serverTimestamp() };
      if(yakImage) payload.image=yakImage;
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; }
      if(yakType==='meme') payload.isMemeBattle=true;
      await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(yakType==='meme'?10:5)}); setNewYak(''); setYakImage(''); setPollOptions(['','']); setIsAnonymous(false); setYakType('yak'); setScreen('feed'); showToast("Posted to "+userData.college+" only 🔒");
    }catch(e:any){ showToast(e.message); }finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(user?.uid!==y.uid) return; if(!confirm('Delete?')) return; try{ await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1)}); showToast("Deleted"); }catch(e:any){ showToast(e.message); } setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost) return; if(!editText.trim()) return; try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); showToast("Edited"); }catch(e:any){ showToast(e.message); } setEditingPost(null); setEditText(''); setShowMenu(null); };
  const handleReport=async(y:any)=>{ if(userData.reportedPosts?.includes(y.id)) return; try{ await updateDoc(doc(db,'yaks',y.id),{reports:increment(1)}); await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)}); if((y.reports||0)+1>=5) await deleteDoc(doc(db,'yaks',y.id)); showToast("Reported "+((y.reports||0)+1)+"/5"); }catch(e:any){ showToast(e.message); } setShowMenu(null); };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#0a0a0b] text-white"><style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
        <div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">Y</div><div><p className="font-black text-sm tracking-wide">YAK • DARK • WHITE LETTERS</p><p className="text-[10px] text-white/40">{totalUsers} real • College only • Dark bg</p></div></div>
          <h1 className="text-[38px] font-black mt-8 leading-[0.9] tracking-tight">Dark.<br/>White Letters.<br/><span className="text-white/30">Real App.</span></h1><p className="text-[13px] text-white/50 mt-3">Background dark • Letters white • Real app premium feel</p>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">AVATAR</p><div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/[0.05] border-white/10 text-white'}`}>{a}</button>)}</div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">COLLEGE • {collegeCounts[selectedCollege]||0} IN {selectedCollege}</p><div className="space-y-2.5 mt-3">{COLLEGES.map(c=>{ const act=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`w-full p-4 rounded-[18px] border-2 text-left flex justify-between ${act?'bg-white text-black border-white':'bg-white/[0.05] border-white/10 text-white'}`}><div><p className="font-bold text-[13px]">{c.label} • {c.city}</p><p className={`text-[11px] ${act?'text-black/60':'text-white/40'}`}>{collegeCounts[c.id]||0} real • {c.id} only 🔒</p></div><div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${act?'bg-black text-white border-black':'border-white/10'}`}>{act?'✓':''}</div></button>})}</div>
          <button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full mt-8 py-4 rounded-full font-black text-[14px] ${selectedCollege?'bg-white text-black':'bg-white/[0.06] text-white/30 border-2 border-white/10'}`}>Enter {selectedCollege||'College'} →</button><Footer/></div></div>
    );
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(<div className="min-h-screen bg-[#0a0a0b] text-white"><div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full text-white">←</button><div className="mt-6 bg-white/[0.05] border border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-widest text-white/30">{collegeCounts[selectedCollege]||0} REAL • {selectedCollege} ONLY • DARK</p><h2 className="font-black text-[18px] mt-1 text-white">Verify {selectedCollege} • White Letters</h2></div>
      <div className="flex p-1 bg-white/5 border border-white/10 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>Roll</button><button onClick={()=>setVerifyMethod('id')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='id'?'bg-white text-black':'text-white/40'}`}>ID</button></div>
      {verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3.5 rounded-xl border border-red-500/20">{verifyError}</p>}
      {verifyMethod==='email' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl text-sm outline-none text-white placeholder:text-white/30 focus:border-white"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Send OTP</button>{otpSent&&<div className="mt-4 bg-black/30 border-2 border-white/10 rounded-xl p-4"><p className="text-xs text-emerald-400 font-bold">OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" className="w-full mt-3 p-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-center tracking-[0.3em] text-white"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify ✓</button></div>}</div>}
      {verifyMethod==='roll' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={config?.ex} className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase font-bold tracking-widest text-white"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify Roll</button></div>}
      {verifyMethod==='id' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={idName} onChange={e=>setIdName(e.target.value.toUpperCase())} placeholder="NAME" className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase font-bold text-white"/><label className="mt-4 border-2 border-dashed border-white/10 rounded-xl p-6 flex justify-center cursor-pointer text-xs text-white/40">Upload ID<input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setIdImage(r.result as string); r.readAsDataURL(f); } }}/></label>{idImage && <img src={idImage} className="mt-4 rounded-xl"/>}<button onClick={handleIdVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Submit</button></div>}
      <Footer/></div></div>);
  }
  if(screen==='login'){ return <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border-2 border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] flex items-center justify-center text-4xl">{selectedAvatar}</div><h1 className="font-black mt-6 text-center text-xl text-white">Verified ✓<br/><span className="text-white/40">{selectedCollege} Only • White Letters</span></h1><button onClick={handleGoogleLogin} className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold text-sm">Continue →</button></div><Footer/></div>; }

    return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-2xl">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">Y</div><div><p className="font-bold text-[13px] leading-none text-white">{userData.college} ONLY • {yaks.length} POSTS • DARK • WHITE</p><p className="text-[10px] text-white/40">Real app • Dark bg • White letters • {collegeCounts[userData.college]||0} real</p></div></div><button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">{userData.avatar}</button></div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2 overflow-x-auto">
          <button onClick={()=>setFeedTab('new')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='new'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>NEW • {yaks.length}</button>
          <button onClick={()=>setFeedTab('meme')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🔥 MEME • {memeYaks.length}</button>
          <button onClick={()=>setFeedTab('hot')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='hot'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>HOT</button>
          <button onClick={()=>setFeedTab('top')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='top'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>TOP</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        {feedTab==='top'? (
          <div className="space-y-3"><div className="bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">{userData.college} TOP • DARK • WHITE LETTERS</p><p className="font-black mt-1 text-white">Top in {userData.college} • Dark bg • White</p></div>
            {leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">{i+1}</span><span className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">{u.avatar}</span><div><p className="font-bold text-[13px] text-white">{u.username} {u.id===userData.id&&'• YOU'}</p><p className="text-[10px] text-white/40">{u.college} • {u.totalPosts||0} posts • White letters</p></div></div><p className="font-black text-sm text-white">{u.yakarma}</p></div>)}<Footer/></div>
        ) : (
          <>
            <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 flex justify-between items-center"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white">{userData.avatar}</div><div><p className="font-bold text-[13px] text-white">{userData.username} • {userData.college} ONLY • DARK • WHITE</p><p className="text-[11px] text-white/40">Background dark • Letters white • Real app 🔒</p></div></div><span className="px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold">{collegeCounts[userData.college]||0} • {userData.college}</span></div>

            {(feedTab==='new'? yaks : feedTab==='meme'? memeYaks : hotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isPoll=y.type==='poll'; const isConfess=y.type==='confession' || y.isAnonymous; const isMeme=y.type==='meme' || y.isMemeBattle; const hasVoted=userData.pollVoted?.includes(y.id);
              return(
                <div key={y.id} className={`bg-white/[0.04] border-2 rounded-[20px] p-5 ${isOwn?'border-white/20 bg-white/[0.06]':'border-white/10'} ${isConfess?'border-purple-500/20 bg-purple-500/[0.05]':''} ${isMeme?'border-orange-500/20 bg-orange-500/[0.05]':''} ${isPoll?'border-blue-500/20 bg-blue-500/[0.05]':''}`}>
                  <div className="flex justify-between items-start"><div className="flex gap-3"><div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm relative text-white">{isConfess?'🤫':y.avatar}{isOwn && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border-2 border-[#0a0a0b]"></div>}</div>
                      <div><div className="flex gap-2 items-center flex-wrap"><p className="font-bold text-[13px] text-white">{isConfess?'Anonymous':y.username} {isOwn&&!isConfess&&'• YOU'}</p><span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-white text-black">{y.college} ONLY</span><span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${isPoll?'bg-blue-500 text-white':isConfess?'bg-purple-500 text-white':isMeme?'bg-orange-500 text-white':'bg-white/10 text-white/40 border border-white/10'}`}>{isPoll?'POLL':isConfess?'CONFESSION':isMeme?'MEME':'YAK'}</span></div><p className="text-[10px] text-white/30 mt-0.5">{y.college} ONLY • {score} • Dark bg • White letters</p></div></div>
                    <div className="relative"><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40">⋯</button>
                      {showMenu===y.id && <div className="absolute right-0 top-10 w-[200px] bg-black border-2 border-white/10 rounded-2xl p-2 z-20 shadow-2xl">{isOwn? (<><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 hover:bg-white hover:text-black text-white">✏️ Edit White</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white mt-2">🗑️ Delete Owner Only</button></>) : (<button onClick={()=>handleReport(y)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60">🚨 Report {y.reports||0}/5</button>)}<button onClick={()=>setShowMenu(null)} className="w-full mt-2 py-2 rounded-xl text-[11px] text-white/30">Cancel</button></div>}
                    </div>
                  </div>
                  <p className="text-[15px] mt-4 leading-[1.5] text-white whitespace-pre-wrap break-words">{y.text}</p>
                  {y.image && <img src={y.image} className="mt-4 rounded-[16px] border-2 border-white/10 w-full max-h-[380px] object-cover" />}
                  {isPoll && y.pollOptions && (<div className="mt-4 space-y-2">{y.pollOptions.map((opt:any,idx:number)=>{ const total=y.totalVotes||1; const percent=Math.round((opt.votes/total)*100); const voted=hasVoted; return <button key={idx} onClick={()=>handlePollVote(y,idx)} disabled={!!hasVoted} className={`w-full p-3 rounded-xl border-2 text-left flex justify-between items-center ${voted?'bg-white/5 border-white/10':'bg-white/[0.02] border-white/10 hover:border-white/20'} text-white`}><span className="text-[13px] font-bold">{opt.text}</span><span className="flex items-center gap-2"><span className="text-[11px] text-white/40">{voted? `${percent}% (${opt.votes})` : `${opt.votes||0}`}</span>{voted && <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-white" style={{width:`${percent}%`}}></div></div>}</span></button>})}<p className="text-[10px] text-white/30">{y.totalVotes||0} votes • 1 vote • White letters</p></div>)}
                  {isMeme && <div className="mt-3 flex items-center gap-2"><span className="px-2.5 py-1 bg-white text-black rounded-full text-[9px] font-bold">🔥 MEME BATTLE • {y.college} • WHITE</span></div>}
                  <div className="flex gap-2.5 mt-5 items-center"><div className="flex bg-white/5 border border-white/10 rounded-full p-1"><button onClick={()=>handleVote(y,'up')} className={`px-4 py-2 rounded-full text-xs font-bold ${liked?'bg-white text-black':'text-white/40 hover:text-white'}`}>▲ {y.likes||0}</button><span className={`px-3 py-2 text-[11px] font-black min-w-[36px] text-center ${score>0?'text-emerald-400':score<0?'text-red-400':'text-white/20'}`}>{score>0?`+${score}`:score}</span><button onClick={()=>handleVote(y,'down')} className={`px-4 py-2 rounded-full text-xs font-bold ${disliked?'bg-red-500 text-white':'text-white/30'}`}>▼ {y.dislikes||0}</button></div><button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="px-4 h-9 rounded-full text-xs bg-white/5 border border-white/10 text-white/40">💬 {y.commentsCount||0}</button><div className="ml-auto">{liked&&<span className="text-[9px] bg-white text-black px-2.5 py-1 rounded-full font-bold">LIKED</span>}{isOwn&&<span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full font-bold text-white/30">OWNER • WHITE</span>}</div></div>
                  {activePost===y.id && <div className="mt-5 border-t border-white/10 pt-4 space-y-3"><div className="space-y-3 max-h-[280px] overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-2.5"><div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs text-white">{c.avatar}</div><div className="bg-white/5 border border-white/10 rounded-[16px] px-4 py-3 flex-1"><p className="text-[13px] text-white">{c.text}</p></div></div>)}{comments.length===0 && <p className="text-xs text-white/20 text-center py-6">No comments • White letters</p>}</div><div className="flex gap-2.5 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment in white..." className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-10 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white"/><button onClick={async()=>{ if(!commentText.trim()) return; const t=commentText; setCommentText(''); try{ await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:t,uid:user.uid,username:userData.username,avatar:userData.avatar,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); }catch(e:any){ showToast(e.message); setCommentText(t); } }} className="w-10 h-10 bg-white text-black rounded-full font-bold">↑</button></div></div>}
                </div>
              );
            })}
            {(feedTab==='new'? yaks : feedTab==='meme'? memeYaks : hotYaks).length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] mx-auto flex items-center justify-center text-4xl">🔒</div><p className="font-black mt-6 text-[18px] text-white">No posts in {userData.college} yet • White Letters</p><p className="text-xs text-white/30 mt-2">Dark bg • White letters • Be first</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full text-[13px] font-bold">+ First Post in {userData.college} 🔒</button></div>}
            <Footer/>
          </>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-2xl border-t-2 border-white/10"><div className="max-w-[600px] mx-auto px-6 h-[72px] flex items-center justify-between"><button onClick={()=>setFeedTab('new')} className="flex flex-col items-center gap-1.5"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${feedTab==='new'?'bg-white text-black':'bg-white/5 text-white/30 border border-white/10'}`}>⌂</div><span className="text-[8px] font-bold tracking-widest text-white/30">{userData.college} ONLY • WHITE</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[24px] font-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1.5"><div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs text-white">{userData.avatar}</div><span className="text-[8px] font-bold tracking-widest text-white/30">YOU • {userData.yakarma}</span></button></div></div>

            {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col overflow-hidden">
          {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100]">{toast}</div>}
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full bg-[#0a0a0b]">
            <div className="p-5 flex items-center justify-between border-b-2 border-white/10"><button onClick={()=>{ if(!posting) { setScreen('feed'); setYakImage(''); } }} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white">✕</button><div className="text-center"><p className="text-[11px] font-bold tracking-widest text-white">{userData.college} ONLY • DARK • WHITE LETTERS</p><p className="text-[10px] text-white/30">Real app • Dark bg • White text</p></div><button onClick={handlePost} disabled={posting||(!newYak.trim()&&!yakImage)} className={`px-6 h-10 rounded-full font-bold text-[13px] ${posting||(!newYak.trim()&&!yakImage)?'bg-white/5 text-white/20 border-2 border-white/5':'bg-white text-black'}`}>{posting?'Posting...':'Post'}</button></div>
            <div className="p-3 flex gap-2 border-b-2 border-white/5 overflow-x-auto bg-white/[0.02]">
              <button onClick={()=>setYakType('yak')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='yak'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>💬 Yak</button>
              <button onClick={()=>setYakType('poll')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='poll'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>📊 Poll</button>
              <button onClick={()=>setYakType('confession')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='confession'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🤫 Confession</button>
              <button onClick={()=>setYakType('meme')} className={`px-5 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${yakType==='meme'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>🔥 Meme</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto bg-[#0a0a0b]">
              <div className="flex gap-3 mb-6"><div className="w-11 h-11 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center text-white">{yakType==='confession'?'🤫':userData.avatar}</div><div><p className="font-bold text-[14px] text-white">{yakType==='confession'?'Anonymous • '+userData.college+' ONLY • WHITE':userData.username+' • '+userData.college+' ONLY • WHITE'}</p><p className="text-[11px] text-white/40">Dark bg • White letters • Real app</p></div></div>
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={yakType==='poll'?`Poll for ${userData.college} only? White letters`:yakType==='confession'?`Confess in ${userData.college} only... White letters`:yakType==='meme'?`Meme for ${userData.college} only 🔥 White letters`:`What's happening in ${userData.college}? White letters on dark bg`} autoFocus className="w-full bg-transparent text-[19px] leading-[1.45] outline-none placeholder:text-white/20 resize-none min-h-[120px] text-white" maxLength={300}/>
              {yakType==='poll' && (<div className="mt-6 space-y-3">{pollOptions.map((opt,idx)=><div key={idx} className="flex gap-2"><input value={opt} onChange={e=>{ const n=[...pollOptions]; n[idx]=e.target.value; setPollOptions(n); }} placeholder={`Option ${idx+1}`} className="flex-1 p-4 bg-white/[0.03] border-2 border-white/10 rounded-xl text-sm outline-none focus:border-white text-white placeholder:text-white/30"/>{pollOptions.length>2 && <button onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))} className="w-12 h-12 bg-white/5 border-2 border-white/10 rounded-xl flex items-center justify-center text-white/40">✕</button>}</div>)}{pollOptions.length<4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="w-full p-3 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-xl text-xs font-bold text-white/40">+ Add Option White</button>}</div>)}
              <div className="mt-6">{!yakImage? (<label className="w-full border-2 border-dashed border-white/10 rounded-[16px] p-8 flex flex-col items-center justify-center cursor-pointer hover:border-white/20 bg-white/[0.02]"><span className="text-2xl mb-2">📸</span><span className="text-xs font-bold text-white/60">Upload Image • White Letters</span><span className="text-[10px] text-white/30 mt-1">Max 800KB • Dark bg</span><input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,setYakImage)} /></label>) : (<div className="relative"><img src={yakImage} className="w-full rounded-[16px] border-2 border-white/10 max-h-[300px] object-cover"/><button onClick={()=>setYakImage('')} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full flex items-center justify-center text-white">✕</button></div>)}</div>
              {(yakType==='yak' || yakType==='meme') && (<div className="mt-6 flex items-center justify-between bg-white/[0.03] border-2 border-white/10 rounded-xl p-4"><div><p className="text-[13px] font-bold text-white">Anonymous? 🤫 • White Letters</p><p className="text-[11px] text-white/40">Dark bg • White text</p></div><button onClick={()=>setIsAnonymous(!isAnonymous)} className={`w-12 h-7 rounded-full p-1 transition-all ${isAnonymous?'bg-white':'bg-white/10'}`}><div className={`w-5 h-5 rounded-full transition-all ${isAnonymous?'bg-black translate-x-5':'bg-white translate-x-0'}`}></div></button></div>)}
            </div>
            <div className="p-5 border-t-2 border-white/5 bg-white/[0.02]"><div className="bg-white/[0.05] border-2 border-white/10 rounded-xl p-4 flex gap-3 items-center"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div><p className="text-[11px] text-white/50"><span className="font-bold text-white">DARK BG • WHITE LETTERS:</span> Background dark #0a0a0b • Letters white • Real app premium • {userData.college} only • White text everywhere</p></div><Footer/></div>
          </div>
        </div>
      )}

      {editingPost && <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center p-4"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8 shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><h3 className="font-black text-[16px] text-white">Edit • White Letters • Dark BG</h3><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-5 bg-white/[0.05] border-2 border-white/10 rounded-xl p-4 text-[15px] outline-none min-h-[120px] resize-none text-white placeholder:text-white/20 focus:border-white"/><div className="flex gap-3 mt-6"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-12 bg-white/5 border-2 border-white/10 rounded-full font-bold text-xs text-white">Cancel</button><button onClick={handleEdit} disabled={!editText.trim()} className={`flex-1 h-12 rounded-full font-bold text-xs ${!editText.trim()?'bg-white/5 text-white/20 border-2 border-white/5':'bg-white text-black'}`}>Save • White</button></div></div></div>}

      {showProfile && (<div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><div className="flex gap-4"><div className="w-[72px] h-[72px] bg-white/5 border-2 border-white/10 rounded-[20px] flex items-center justify-center text-3xl text-white">{userData.avatar}</div><div className="flex-1"><h2 className="font-black text-[16px] leading-none text-white">{userData.username} • {userData.college} ONLY • WHITE</h2><p className="text-[11px] text-white/40 mt-2">Dark bg • White letters • Real app • {userData.college} only • {collegeCounts[userData.college]||0} real • White text</p><div className="flex gap-2 mt-4"><span className="px-3 py-1.5 bg-white text-black rounded-full text-[10px] font-bold">{userData.yakarma} karma</span><span className="px-3 py-1.5 bg-white/10 border border-white/10 text-white rounded-full text-[9px] font-bold">{userData.college} ONLY • WHITE</span></div></div></div><div className="grid grid-cols-3 gap-3 mt-6"><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">POSTS • WHITE</p></div><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl text-white">{collegeCounts[userData.college]||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">REAL • WHITE</p></div><div className="bg-white text-black rounded-[18px] p-4 text-center"><p className="font-black text-xl">{userData.yakarma}</p><p className="text-[9px] font-bold tracking-widest mt-1">KARMA • WHITE</p></div></div><button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-white/5 border-2 border-white/10 h-12 rounded-full text-xs font-bold text-white/60">Logout • White</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-12 rounded-full font-bold text-xs">Close ✓ • Dark BG • White Letters</button><div className="mt-4"><Footer/></div></div></div>)}
    </div>
  );
                                                                                                                                                                                                                                                                                                                                                                                                                                                         }
