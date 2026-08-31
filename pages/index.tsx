import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc, arrayUnion, arrayRemove, setDoc, limit } from 'firebase/firestore';

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
const ADMIN_EMAILS = ["anesh@gmail.com","aneshproductions@gmail.com"];

const COLLEGES = [
  {id:"SRET", label:"SRET", city:"Tirupati", domains:["sret.edu.in","sret.ac.in","srit.ac.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21CS101"},
  {id:"SVCE", label:"SVCE", city:"Tirupati", domains:["svce.edu.in","svce.ac.in"], pattern:/^(19|20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"20CS123"},
  {id:"BITS", label:"BITS", city:"Pilani", domains:["bits-pilani.ac.in"], pattern:/^20[0-9]{2}[A-Z]{2,4}[0-9]{4}$/i, ex:"2021CS1234"},
  {id:"ST.JOHNS", label:"ST.JOHNS", city:"Tirupati", domains:["stjohns.edu.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"22CS045"},
  {id:"VEMU", label:"VEMU", city:"Chittoor", domains:["vemu.edu.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21IT089"},
  {id:"OTHER", label:"OTHER", city:"India", domains:["edu.in","ac.in"], pattern:/^[A-Z0-9]{6,15}$/i, ex:"COL12345"},
];
const AVATARS = ["👻","🔥","😎","🤫","💀","👽","🦊","🐼"];
const Footer = () => (
  <div className="w-full py-6 flex flex-col items-center gap-1 border-t border-zinc-800 mt-8 bg-black">
    <div className="flex items-center gap-2"><div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center font-black text-black text-xs">Y</div><p className="text-[10px] tracking-[0.3em] font-bold text-white">A PRODUCTION BY ANESH</p></div>
    <p className="text-[9px] text-zinc-600">College Only • Real • Hot • Report • Leaderboard • Push • Admin</p>
  </div>
);

export default function YakApp(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hot'|'top'>('new');
  const [yaks,setYaks]=useState<any[]>([]);
  const [hotYaks,setHotYaks]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [pendingIDs,setPendingIDs]=useState<any[]>([]);
  const [collegeCounts,setCollegeCounts]=useState<Record<string,number>>({});
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [images,setImages]=useState<string[]>([]);
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [showProfile,setShowProfile]=useState(false);
  const [showAdmin,setShowAdmin]=useState(false);
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
  const [pushEnabled,setPushEnabled]=useState(false);

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{ if("Notification" in window && Notification.permission==="granted") setPushEnabled(true); },[]);
  const requestPush=async()=>{ if(!("Notification" in window)) return; const p=await Notification.requestPermission(); if(p==="granted"){ setPushEnabled(true); try{ new Notification("YAK 🔒",{body:`${userData?.college||selectedCollege} herd push ON`}); }catch{} } };

  useEffect(()=>{ return onSnapshot(collection(db,'users'), snap=>{ const counts:Record<string,number>={}; snap.docs.forEach(d=>{ const col=(d.data() as any).college; if(col) counts[col]=(counts[col]||0)+1; }); setCollegeCounts(counts); setTotalUsers(snap.size); }); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college'); if(!col ||!isVerified){ setScreen('college'); return; }
          await addDoc(collection(db,'users'),{ uid:u.uid, email:u.email||'', username:'Yak_'+Math.floor(Math.random()*9000+1000), avatar:localStorage.getItem('selected_avatar')||'👻', college:String(col), collegeEmail:String(localStorage.getItem('college_email')||''), rollNumber:String(localStorage.getItem('roll_number')||''), idImage:String(localStorage.getItem('id_image')||''), idName:String(localStorage.getItem('id_name')||''), verifyMethod:String(localStorage.getItem('verify_method')||'email'), idVerified: localStorage.getItem('verify_method')==='id'? false : true, yakarma:100, totalPosts:0, likedPosts:[], dislikedPosts:[], reportedPosts:[], createdAt:serverTimestamp() });
          window.location.reload();
        }else{ setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen('feed'); }
      }else setScreen('college');
    });
  },[isVerified]);
  useEffect(()=>{
    if(!userData?.college) return;
    const q = query(collection(db,'yaks'), where('college','==', userData.college), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, s=>{
      const data=s.docs.map(d=>({id:d.id,...d.data()} as any));
      setYaks(data); setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
      if(pushEnabled && data.length>0){ const latest=data[0]; if(latest.uid!==user?.uid && Date.now() - (latest.createdAt?.toMillis?.()||0) < 12000){ try{ new Notification(`🔥 New Yak in ${userData.college} 🔒`,{body: latest.text.slice(0,60)}); }catch{} } }
    });
    return ()=>unsub();
  },[userData, pushEnabled, user]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(query(collection(db,'users'), where('college','==', userData.college), orderBy('yakarma','desc'), limit(10)), s=>{ setLeaderboard(s.docs.map(d=>({id:d.id,...d.data()}))); }); },[userData]);
  useEffect(()=>{ if(!user ||!ADMIN_EMAILS.includes(user.email||'')) return; return onSnapshot(query(collection(db,'users'), where('idVerified','==', false)), s=>{ setPendingIDs(s.docs.map(d=>({id:d.id,...d.data()}))); }); },[user]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

   const getCollegeConfig=()=>COLLEGES.find(c=>c.id===selectedCollege);
  const handleCollegeNext=()=>{ if(!selectedCollege) return; localStorage.setItem('selected_college',selectedCollege); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{
    setVerifyError(''); const config=getCollegeConfig(); if(!config) return;
    const emailLower=collegeEmail.toLowerCase().trim();
    if(!config.domains.some(d=>emailLower.endsWith(d))){ setVerifyError(`Only ${config.domains.join(' or ')} allowed - real mail`); return; }
    const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower)));
    if(!dup.empty){ setVerifyError('Mail already used - real only'); return; }
    const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode);
    await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()}); setOtpSent(true);
  };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{
    setVerifyError(''); const config=getCollegeConfig(); if(!config) return;
    const rollUpper=rollNumber.trim().toUpperCase();
    if(!config.pattern.test(rollUpper)){ setVerifyError(`Invalid roll. Ex: ${config.ex} - real roll`); return; }
    const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper)));
    if(!dup.empty){ setVerifyError('Roll already used'); return; }
    localStorage.setItem('roll_number',rollUpper); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login');
  };
  const handleIdVerify=async()=>{ if(!idImage ||!idName.trim()){ setVerifyError('Upload ID + Name - real ID'); return; } localStorage.setItem('id_image',idImage); localStorage.setItem('id_name',idName.trim().toUpperCase()); localStorage.setItem('verify_method','id'); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleVote=async(y:any,type:string)=>{
    const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
    if(type==='up'){
      if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id), yakarma:increment(-1)}); setUserData({...userData,likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)}); }
      else if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1),likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id),likedPosts:arrayUnion(y.id), yakarma:increment(2)}); setUserData({...userData,dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id),likedPosts:[...userData.likedPosts,y.id]}); }
      else{ await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id), yakarma:increment(1)}); setUserData({...userData,likedPosts:[...(userData.likedPosts||[]),y.id]}); }
    }else{
      if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id), yakarma:increment(1)}); setUserData({...userData,dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id)}); }
      else if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1),dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id),dislikedPosts:arrayUnion(y.id), yakarma:increment(-2)}); setUserData({...userData,likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id),dislikedPosts:[...userData.dislikedPosts,y.id]}); }
      else{ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayUnion(y.id), yakarma:increment(-1)}); setUserData({...userData,dislikedPosts:[...(userData.dislikedPosts||[]),y.id]}); }
    }
  };
  const handleReport=async(y:any)=>{
    if(userData.reportedPosts?.includes(y.id)) return alert('Already reported');
    if(!confirm(`Report? 5 reports = auto delete`)) return;
    await updateDoc(doc(db,'yaks',y.id),{reports:increment(1), reportedBy:arrayUnion(userData.uid)});
    await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)});
    const updated= (y.reports||0)+1;
    if(updated>=5){ await deleteDoc(doc(db,'yaks',y.id)); alert('🚨 5 reports - deleted'); }
    else alert(`Reported ${updated}/5`);
    setShowMenu(null);
  };
  const handlePost=async()=>{
    if(!userData ||!newYak.trim()) return;
    setPosting(true);
    try{
      await addDoc(collection(db,'yaks'),{text:newYak.trim(), uid:user.uid, username:userData.username, avatar:userData.avatar, college:userData.college, likes:0, dislikes:0, commentsCount:0, reports:0, reportedBy:[], imageUrls:images.filter(Boolean), createdAt:serverTimestamp()});
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setImages([]); setScreen('feed');
    }catch(e:any){ alert(e.message); } finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(!confirm('Delete?')) return; await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1), yakarma:increment(-5)}); setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost ||!editText.trim()) return; await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); setEditingPost(null); setEditText(''); setShowMenu(null); };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-black text-white flex flex-col">
        <style>{`body{background:black} ::-webkit-scrollbar{display:none} button{transition:all 0.2s} button:active{transform:scale(0.96)}`}</style>
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <div className="mt-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">Y</div><div><p className="font-black text-[16px]">YAK • COLLEGE ONLY 🔒</p><p className="text-[10px] text-zinc-500">{totalUsers} real students</p></div></div><div className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] font-bold">{totalUsers} REAL</p></div></div>
          <h1 className="text-[36px] font-black mt-8 leading-[0.9]">College only.<br/>Real only.<br/><span className="text-zinc-600">Simple.</span></h1>
          <p className="text-[11px] text-zinc-500 mt-6 font-bold tracking-widest">CHOOSE AVATAR</p>
          <div className="grid grid-cols-4 gap-2 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-14 rounded-xl text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800'}`}>{a}</button>)}</div>
          <p className="text-[11px] text-zinc-500 mt-6 font-bold tracking-widest">SELECT COLLEGE • LIVE COUNT</p>
          <div className="space-y-2 mt-3">{COLLEGES.map(c=>{ const count=collegeCounts[c.id]||0; const active=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`w-full p-3 rounded-xl border-2 text-left flex justify-between items-center ${active?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800 text-white'}`}><span className="font-bold text-sm">{c.label} • {c.city}</span><span className={`text-xs px-2 py-1 rounded-full font-bold ${active?'bg-black text-white':'bg-zinc-800 text-zinc-400'}`}>{count} real</span></button>})}</div>
        </div>
        <div className="p-6 max-w-md mx-auto w-full sticky bottom-0 bg-black/80 backdrop-blur border-t border-zinc-900"><button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full py-4 rounded-full font-black text-sm ${selectedCollege?'bg-white text-black':'bg-zinc-900 text-zinc-600'}`}>Enter {selectedCollege||'College'} • College Only 🔒 →</button></div>
        <Footer/>
      </div>
    );
  }
  if(screen==='verify'){
    const config=getCollegeConfig(); const count=collegeCounts[selectedCollege]||0;
    return(
      <div className="min-h-screen bg-black text-white"><div className="max-w-md mx-auto min-h-screen flex flex-col"><div className="p-6"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-zinc-900 rounded-full">←</button><div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5"><p className="text-[10px] tracking-widest text-zinc-500 font-bold">{count} REAL IN {selectedCollege} • COLLEGE ONLY 🔒</p><h2 className="font-black text-lg mt-1">Prove Real Student • {selectedCollege} Only</h2><p className="text-[11px] text-zinc-500 mt-1">Only {selectedCollege} students can see your yaks • {config?.domains.join(', ')}</p></div></div>
      <div className="px-6"><div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-full"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-2.5 rounded-full text-[11px] font-bold ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>📧 Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-2.5 rounded-full text-[11px] font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>🎓 Roll</button><button onClick={()=>setVerifyMethod('id')} className={`flex-1 py-2.5 rounded-full text-[11px] font-bold ${verifyMethod==='id'?'bg-white text-black':'text-zinc-500'}`}>🪪 ID</button></div></div>
      {verifyError && <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3"><p className="text-xs text-red-400 font-bold">{verifyError}</p></div>}
      {verifyMethod==='email' && <div className="p-6 flex-1"><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-3 bg-black border border-zinc-800 rounded-xl outline-none text-sm"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3 rounded-full font-bold text-sm">Send Code • {selectedCollege} Only</button>{otpSent&&<div className="mt-3 p-3 bg-black border border-green-900/30 rounded-xl"><p className="text-xs text-green-400">CODE: {generatedOtp} (testing)</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" className="w-full mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center tracking-widest text-sm"/><button onClick={handleOtpSubmit} className="w-full mt-2 bg-green-500 text-black py-3 rounded-full font-bold text-sm">Verify • {selectedCollege} Only ✓</button></div>}</div></div>}
      {verifyMethod==='roll' && <div className="p-6 flex-1"><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><p className="text-[10px] font-bold tracking-widest text-zinc-500">REAL ROLL • {config?.ex}</p><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={config?.ex} className="w-full mt-3 p-3 bg-black border border-zinc-800 rounded-xl uppercase font-bold tracking-widest text-sm"/><button onClick={handleRollVerify} className="w-full mt-3 bg-white text-black py-3 rounded-full font-bold text-sm">Verify Roll • {selectedCollege} Only ✓</button></div></div>}
      {verifyMethod==='id' && <div className="p-6 flex-1"><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><input value={idName} onChange={e=>setIdName(e.target.value.toUpperCase())} placeholder="NAME AS ON ID" className="w-full p-3 bg-black border border-zinc-800 rounded-xl uppercase font-bold tracking-widest text-sm"/><label className="mt-3 border border-dashed border-zinc-700 rounded-xl p-4 flex justify-center cursor-pointer text-xs text-zinc-500">📸 UPLOAD ID CARD - {selectedCollege} Only<input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setIdImage(r.result as string); r.readAsDataURL(f); } }}/></label>{idImage && <img src={idImage} className="mt-3 rounded-xl border border-zinc-800"/>}<button onClick={handleIdVerify} disabled={!idImage||!idName.trim()} className={`w-full mt-3 py-3 rounded-full font-bold text-sm ${!idImage||!idName.trim()?'bg-zinc-900 text-zinc-600':'bg-white text-black'}`}>Submit ID • {selectedCollege} Only ✓</button></div></div>}
      <Footer/></div></div>
    );
  }
  if(screen==='login'){ const count=collegeCounts[selectedCollege]||0; return <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6"><div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-3xl">{selectedAvatar}</div><h1 className="text-xl font-black mt-4 text-center">Verified ✓<br/>{selectedCollege} College Only 🔒</h1><p className="text-xs text-zinc-500 mt-2">{count} real in {selectedCollege} • You #{count+1} • Only your college can see</p><button onClick={handleGoogleLogin} className="w-full max-w-sm mt-6 bg-white text-black py-3 rounded-full font-bold">Continue to {selectedCollege} Feed 🔒</button><div className="mt-10 w-full max-w-md"><Footer/></div></div>; }

    return(
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-zinc-900">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-black text-sm">Y</div><div><p className="font-bold text-sm leading-none">{userData.college} • {collegeCounts[userData.college]||0} real • COLLEGE ONLY 🔒</p><p className="text-[10px] text-zinc-500">{yaks.length} yaks • Only {userData.college} herd can see</p></div></div>
          <div className="flex gap-2"><button onClick={requestPush} className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs ${pushEnabled?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>🔔</button><button onClick={()=>setShowAdmin(true)} className={`${ADMIN_EMAILS.includes(user?.email||'')?'flex':'hidden'} w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center text-xs`}>🛡️</button><button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">{userData.avatar}</button></div>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-2 flex gap-2">
          <button onClick={()=>setFeedTab('new')} className={`flex-1 h-8 rounded-full text-xs font-bold border ${feedTab==='new'?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>NEW • {yaks.length}</button>
          <button onClick={()=>setFeedTab('hot')} className={`flex-1 h-8 rounded-full text-xs font-bold border ${feedTab==='hot'?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>🔥 HOT • {hotYaks.length}</button>
          <button onClick={()=>setFeedTab('top')} className={`flex-1 h-8 rounded-full text-xs font-bold border ${feedTab==='top'?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>🏆 TOP</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[80px] space-y-3">
        {feedTab==='top'? (
          <div className="space-y-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><p className="text-[10px] font-bold tracking-widest text-zinc-500">{userData.college} LEADERBOARD • COLLEGE ONLY 🔒</p><p className="font-black mt-1">Top in {userData.college} • Only your herd</p></div>
            {leaderboard.map((u:any,i:number)=><div key={u.id} className={`bg-zinc-900 border rounded-xl p-3 flex justify-between items-center ${i===0?'border-yellow-500/30':i===1?'border-zinc-700':'border-zinc-800'}`}><div className="flex gap-3 items-center"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i===0?'bg-yellow-500 text-black':i===1?'bg-zinc-300 text-black':i===2?'bg-orange-500 text-black':'bg-zinc-800 text-zinc-400'}`}>{i+1}</span><span className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">{u.avatar}</span><div><p className="font-bold text-sm">{u.username} {u.id===userData.id&&'• YOU'} {i===0&&'👑'}</p><p className="text-[10px] text-zinc-500">{u.college} ONLY • {u.totalPosts||0} yaks</p></div></div><div className="text-right"><p className="font-black text-sm">{u.yakarma}</p><p className="text-[9px] text-zinc-500">KARMA</p></div></div>)}
            <Footer/>
          </div>
        ) : (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
              <div className="flex gap-3 items-center"><div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-lg">{userData.avatar}</div><div><p className="font-bold text-sm">{userData.username} • {userData.college} ONLY 🔒</p><p className="text-[11px] text-zinc-500">Only {collegeCounts[userData.college]||0} real in {userData.college} can see • Push {pushEnabled?'ON':'OFF'}</p></div></div>
              <div className="text-right"><p className="font-black text-lg leading-none">{collegeCounts[userData.college]||0}</p><p className="text-[8px] text-zinc-500 font-bold tracking-widest">REAL<br/>ONLY</p></div>
            </div>

            {(feedTab==='new'? yaks : hotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isHot=(y.likes||0)>=5;
              return(
                <div key={y.id} className={`bg-zinc-900 border rounded-xl p-4 relative ${isHot?'border-orange-500/30':isOwn?'border-zinc-700':'border-zinc-800'}`}>
                  {isHot && <div className="absolute -top-2 -right-2 bg-orange-500 text-black px-2 py-0.5 rounded-full text-[9px] font-bold">🔥 HOT</div>}
                  <div className="flex justify-between"><div className="flex gap-2"><div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-sm relative">{y.avatar}{isOwn && <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></div>}</div><div><div className="flex gap-1.5 items-center flex-wrap"><p className="font-bold text-xs">{y.username} {isOwn&&'• YOU'}</p><span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${isOwn?'bg-white text-black':'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>{y.college} ONLY 🔒</span>{y.reports>0 && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[8px] font-bold">{y.reports}/5</span>}</div><p className="text-[10px] text-zinc-500">{score} score • {y.college} only herd</p></div></div>
                  <div className="relative"><button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 text-xs">⋯</button>{showMenu===y.id && <div className="absolute right-0 top-8 w-[160px] bg-black border border-zinc-800 rounded-xl p-2 z-10">{isOwn? <><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-zinc-900 hover:bg-white hover:text-black">✏️ Edit</button><button onClick={()=>handleDelete(y)} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-zinc-900 hover:bg-red-500 hover:text-white text-red-400 mt-1">🗑️ Delete</button></> : <button onClick={()=>handleReport(y)} className="w-full text-left px-3 py-2 rounded-lg text-xs bg-zinc-900 hover:bg-red-500 hover:text-white text-red-400">🚨 Report {y.reports||0}/5</button>}<button onClick={()=>setShowMenu(null)} className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] text-zinc-500 mt-1">Cancel</button></div>}</div>
                  </div>
                  <p className="text-sm mt-3 leading-[1.45]">{y.text}</p>{y.imageUrls?.[0] && <img src={y.imageUrls[0]} className="mt-3 rounded-xl w-full border border-zinc-800"/>}
                  <div className="flex gap-2 mt-3 items-center"><div className="flex bg-black border border-zinc-800 rounded-full p-1"><button onClick={()=>handleVote(y,'up')} className={`px-3 py-1 rounded-full text-xs font-bold ${liked?'bg-white text-black':'text-zinc-500'}`}>▲ {y.likes||0}</button><span className="px-2 py-1 text-xs font-bold text-zinc-500">{score}</span><button onClick={()=>handleVote(y,'down')} className={`px-2.5 py-1 rounded-full text-xs font-bold ${disliked?'bg-red-500 text-white':'text-zinc-600'}`}>▼</button></div><button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="px-3 h-7 rounded-full text-xs bg-black border border-zinc-800 text-zinc-400">💬 {y.commentsCount||0}</button>{isOwn && <span className="ml-auto text-[9px] bg-white text-black px-2 py-1 rounded-full font-bold">YOUR COLLEGE ONLY 🔒</span>}</div>
                  {activePost===y.id && <div className="mt-3 border-t border-zinc-800 pt-3 space-y-2 max-h-[280px] overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px]">{c.avatar}</div><div className="bg-black border border-zinc-800 rounded-xl px-3 py-2"><p className="text-xs">{c.text}</p></div></div>)}<div className="flex gap-2 mt-2"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment - only your college can see..." className="flex-1 bg-black border border-zinc-800 rounded-full px-4 h-8 text-xs outline-none"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText,uid:user.uid,username:userData.username,avatar:userData.avatar,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="w-8 h-8 bg-white text-black rounded-full text-xs font-bold">↑</button></div></div>}
                </div>
              );
            })}
            {(feedTab==='new'? yaks : hotYaks).length===0 && <div className="py-16 text-center"><div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl mx-auto flex items-center justify-center text-3xl">{userData.avatar}</div><p className="font-bold mt-4 text-sm">No yaks in {userData.college} yet 🔒</p><p className="text-xs text-zinc-500 mt-1">Only {userData.college} students can post & see</p><button onClick={()=>setScreen('create')} className="mt-4 bg-white text-black px-6 h-9 rounded-full text-xs font-bold">+ First Yak in {userData.college} 🔒</button><div className="mt-10"><Footer/></div></div>}
            <Footer/>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur border-t border-zinc-900"><div className="max-w-[600px] mx-auto px-6 h-14 flex items-center justify-between"><button className="flex flex-col items-center gap-0.5"><div className="w-6 h-6 bg-white text-black rounded-full flex items-center justify-center text-[10px] font-bold">⌂</div><span className="text-[8px] font-bold tracking-widest">{userData.college} ONLY 🔒 • {collegeCounts[userData.college]||0} REAL</span></button><button onClick={()=>setScreen('create')} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center text-xl font-black">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-0.5"><div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-xs">{userData.avatar}</div><span className="text-[8px] font-bold tracking-widest">YOU • {userData.yakarma}</span></button></div></div>

            {screen==='create' && (
        <div className="fixed inset-0 bg-black z-30"><div className="max-w-[600px] mx-auto h-full flex flex-col"><div className="p-4 flex items-center justify-between border-b border-zinc-900"><button onClick={()=>setScreen('feed')} className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center">✕</button><p className="text-[11px] font-bold tracking-widest text-center flex-1 px-2">{userData.college} ONLY 🔒 • Only {collegeCounts[userData.college]||0} real in your college will see</p><button onClick={handlePost} disabled={posting||!newYak.trim()} className={`px-4 h-8 rounded-full font-bold text-xs ${!newYak.trim()?'bg-zinc-900 text-zinc-600':'bg-white text-black'}`}>{posting?'Posting...':'Post 🔒'}</button></div>
        <div className="p-4 flex-1 overflow-y-auto"><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}? Only ${collegeCounts[userData.college]||0} students in ${userData.college} will see this yak 🔒`} autoFocus className="w-full bg-transparent text-[18px] outline-none placeholder:text-zinc-700 resize-none min-h-[140px]" maxLength={300}/><label className="mt-4 border border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center cursor-pointer"><span className="text-[10px] font-bold tracking-widest text-zinc-500">ADD PHOTO • {userData.college} ONLY 🔒</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setImages([r.result as string]); r.readAsDataURL(f); } }}/></label>{images[0] && <div className="mt-3 relative"><img src={images[0]} className="rounded-xl w-full border border-zinc-800"/><button onClick={()=>setImages([])} className="absolute top-2 right-2 w-7 h-7 bg-black/80 rounded-full text-xs">✕</button></div>}</div><div className="p-4 border-t border-zinc-900"><Footer/></div></div></div>
      )}

      {editingPost && <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-end justify-center p-3"><div className="bg-zinc-900 border border-zinc-800 w-full max-w-[600px] rounded-t-2xl p-5"><h3 className="font-bold text-sm">Edit Yak • {userData.college} Only 🔒</h3><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-3 bg-black border border-zinc-800 rounded-xl p-3 text-sm outline-none min-h-[90px] resize-none"/><div className="flex gap-2 mt-4"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-10 bg-zinc-800 rounded-full text-xs">Cancel</button><button onClick={handleEdit} disabled={!editText.trim()} className={`flex-1 h-10 rounded-full font-bold text-xs ${!editText.trim()?'bg-zinc-800 text-zinc-600':'bg-white text-black'}`}>Save • {userData.college} Only</button></div></div></div>}

      {showAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-[60] flex items-end justify-center"><div className="bg-zinc-900 border border-zinc-800 w-full max-w-[600px] rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto"><div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto mb-4"></div><h2 className="font-black">🛡️ Admin • ID Verify • College Only</h2><p className="text-[11px] text-zinc-500 mt-1">{pendingIDs.length} pending real IDs • Only {pendingIDs.filter((u:any)=>u.college===userData.college).length} in your college</p><div className="mt-4 space-y-3">{pendingIDs.map((u:any)=><div key={u.id} className="bg-black border border-zinc-800 rounded-xl p-3"><div className="flex gap-2"><div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">{u.avatar}</div><div className="flex-1"><p className="font-bold text-xs">{u.username} • {u.idName} • {u.college} ONLY 🔒</p><p className="text-[10px] text-zinc-500">{u.rollNumber||u.collegeEmail} • {u.verifyMethod}</p></div></div>{u.idImage && <img src={u.idImage} className="mt-2 rounded-xl w-full border border-zinc-800"/>}<div className="flex gap-2 mt-3"><button onClick={async()=>{ await updateDoc(doc(db,'users',u.id),{idVerified:true}); }} className="flex-1 h-9 bg-white text-black rounded-full text-xs font-bold">✓ Approve • {u.college} Only</button><button onClick={async()=>{ if(!confirm('Reject & delete?')) return; await deleteDoc(doc(db,'users',u.id)); }} className="flex-1 h-9 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full text-xs">✕ Reject</button></div></div>)}{pendingIDs.length===0 && <div className="py-12 text-center"><p className="font-bold text-sm">No pending IDs ✓</p><p className="text-xs text-zinc-500 mt-1">All {userData.college} students verified</p></div>}</div><button onClick={()=>setShowAdmin(false)} className="w-full mt-4 bg-white text-black h-10 rounded-full font-bold text-xs">Close Admin • {userData.college} Only</button><div className="mt-4"><Footer/></div></div></div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-end justify-center"><div className="bg-zinc-900 border border-zinc-800 w-full max-w-[600px] rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto"><div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto mb-4"></div>
        <div className="flex gap-4"><div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-2xl">{userData.avatar}</div><div className="flex-1"><h2 className="font-black leading-none">{userData.username} • {userData.college} ONLY 🔒</h2><p className="text-xs text-zinc-500 mt-1">{userData.college} • {collegeCounts[userData.college]||0} real only in your college • {userData.yakarma} karma • #{totalUsers} total</p><div className="flex gap-2 mt-2"><span className="px-3 py-1 bg-white text-black rounded-full text-[11px] font-bold">{userData.yakarma} karma</span><span className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-full text-[10px] font-bold">{userData.college} ONLY 🔒</span></div></div></div>
        <div className="grid grid-cols-3 gap-2 mt-5"><div className="bg-black border border-zinc-800 rounded-xl p-3 text-center"><p className="font-black text-lg">{userData.totalPosts||0}</p><p className="text-[9px] text-zinc-500 font-bold tracking-widest">YAKS • {userData.college} ONLY</p></div><div className="bg-black border border-zinc-800 rounded-xl p-3 text-center"><p className="font-black text-lg">{collegeCounts[userData.college]||0}</p><p className="text-[9px] text-zinc-500 font-bold tracking-widest">REAL • {userData.college} ONLY</p></div><div className="bg-white text-black rounded-xl p-3 text-center"><p className="font-black text-lg">{userData.yakarma}</p><p className="text-[9px] font-bold tracking-widest">KARMA</p></div></div>
        <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={requestPush} className={`h-10 rounded-full font-bold text-xs border ${pushEnabled?'bg-white text-black border-white':'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>{pushEnabled?'🔔 Push ON • '+userData.college+' Only':'🔕 Enable Push • '+userData.college+' Only'}</button><button onClick={()=>{ setShowProfile(false); setFeedTab('top'); }} className="h-10 bg-zinc-800 border border-zinc-700 rounded-full font-bold text-xs">🏆 Top in {userData.college} Only</button></div>
        <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-3 bg-zinc-800 border border-zinc-700 h-10 rounded-full text-xs">Logout • {userData.college} Only</button><button onClick={()=>setShowProfile(false)} className="w-full mt-2 bg-white text-black h-10 rounded-full font-bold text-xs">Close • {userData.college} Only 🔒</button><div className="mt-4"><Footer/></div></div></div>
      )}
    </div>
  );
          }
