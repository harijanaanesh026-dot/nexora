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
const ADMIN_EMAILS = ["anesh@gmail.com"];

const COLLEGES = [
  {id:"SRET", label:"SRET", city:"Tirupati", color:"from-violet-500 to-purple-500", domains:["sret.edu.in","sret.ac.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21CS101"},
  {id:"SVCE", label:"SVCE", city:"Tirupati", color:"from-blue-500 to-cyan-500", domains:["svce.edu.in"], pattern:/^(19|20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"20CS123"},
  {id:"BITS", label:"BITS", city:"Pilani", color:"from-orange-500 to-red-500", domains:["bits-pilani.ac.in"], pattern:/^20[0-9]{2}[A-Z]{2,4}[0-9]{4}$/i, ex:"2021CS1234"},
  {id:"VEMU", label:"VEMU", city:"Chittoor", color:"from-emerald-500 to-teal-500", domains:["vemu.edu.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21IT089"},
  {id:"OTHER", label:"OTHER", city:"India", color:"from-zinc-600 to-zinc-800", domains:["edu.in","ac.in"], pattern:/^[A-Z0-9]{6,15}$/i, ex:"COL12345"},
];
const AVATARS = ["👻","🔥","😎","🤫","💀","👽","🦊","🐼"];
const Footer = () => (
  <div className="w-full py-8 flex flex-col items-center gap-2 border-t border-white/[0.06] mt-10">
    <div className="flex items-center gap-2"><div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center font-black text-black text-xs">Y</div><p className="text-[10px] tracking-[0.3em] font-bold text-white/60">A PRODUCTION BY ANESH</p></div>
    <p className="text-[9px] text-white/30">College Only • Smooth • Unique • Realistic</p>
  </div>
);

export default function YakUnique(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hot'|'top'>('new');
  const [yaks,setYaks]=useState<any[]>([]);
  const [hotYaks,setHotYaks]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [collegeCounts,setCollegeCounts]=useState<Record<string,number>>({});
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
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
          await addDoc(collection(db,'users'),{ uid:u.uid, email:u.email||'', username:'Yak_'+Math.floor(Math.random()*9000+1000), avatar:localStorage.getItem('selected_avatar')||'👻', college:String(col), collegeEmail:String(localStorage.getItem('college_email')||''), rollNumber:String(localStorage.getItem('roll_number')||''), idVerified: localStorage.getItem('verify_method')==='id'? false : true, yakarma:100, totalPosts:0, likedPosts:[], dislikedPosts:[], reportedPosts:[], createdAt:serverTimestamp() });
          window.location.reload();
        }else{ setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen('feed'); }
      }else setScreen('college');
    });
  },[isVerified]);
  // NO INDEX NEEDED - SIMPLE SMOOTH - COLLEGE ONLY
  useEffect(()=>{
    if(!userData?.college) return;
    const q = query(collection(db,'yaks'), where('college','==', userData.college));
    const unsub = onSnapshot(q, s=>{
      const data=s.docs.map(d=>({id:d.id,...d.data()} as any));
      data.sort((a,b)=> (b.createdAt?.toMillis?.()||b.createdAt?.seconds*1000||0) - (a.createdAt?.toMillis?.()||a.createdAt?.seconds*1000||0));
      setYaks(data);
      setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
    });
    return ()=>unsub();
  },[userData]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(query(collection(db,'users'), where('college','==', userData.college)), s=>{ const d=s.docs.map(doc=>({id:doc.id,...doc.data()} as any)).sort((a,b)=>b.yakarma-a.yakarma).slice(0,10); setLeaderboard(d); }); },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

    const getCollegeConfig=()=>COLLEGES.find(c=>c.id===selectedCollege);
  const handleCollegeNext=()=>{ if(!selectedCollege) return; localStorage.setItem('selected_college',selectedCollege); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{
    setVerifyError(''); const config=getCollegeConfig(); if(!config) return;
    const emailLower=collegeEmail.toLowerCase().trim();
    if(!config.domains.some(d=>emailLower.endsWith(d))){ setVerifyError(`Only ${config.domains.join(' or ')} allowed`); return; }
    const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower)));
    if(!dup.empty){ setVerifyError('Mail already used'); return; }
    const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode);
    await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()}); setOtpSent(true); showToast("OTP: "+otpCode);
  };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP: '+d.otp); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{
    setVerifyError(''); const config=getCollegeConfig(); if(!config) return;
    const rollUpper=rollNumber.trim().toUpperCase();
    if(!config.pattern.test(rollUpper)){ setVerifyError(`Invalid roll Ex: ${config.ex}`); return; }
    const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper)));
    if(!dup.empty){ setVerifyError('Roll already used'); return; }
    localStorage.setItem('roll_number',rollUpper); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login');
  };
  const handleIdVerify=async()=>{ if(!idImage ||!idName.trim()){ setVerifyError('Upload ID + Name'); return; } localStorage.setItem('id_image',idImage); localStorage.setItem('id_name',idName.trim().toUpperCase()); localStorage.setItem('verify_method','id'); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };

  // 1 USER 1 LIKE OR DISLIKE ONLY - UNIQUE SMOOTH LOGIC
  const handleVote = async (y: any, type: 'up' | 'down') => {
    if (!userData ||!user) return;
    const yakRef = doc(db, 'yaks', y.id);
    const userRef = doc(db, 'users', userData.id);
    const liked = userData.likedPosts?.includes(y.id);
    const disliked = userData.dislikedPosts?.includes(y.id);
    try {
      if (type === 'up') {
        if (liked) {
          await updateDoc(yakRef, { likes: increment(-1) });
          await updateDoc(userRef, { likedPosts: arrayRemove(y.id) });
          setUserData({...userData, likedPosts: userData.likedPosts.filter((id: string) => id!== y.id) });
        } else if (disliked) {
          await updateDoc(yakRef, { likes: increment(1), dislikes: increment(-1) });
          await updateDoc(userRef, { dislikedPosts: arrayRemove(y.id), likedPosts: arrayUnion(y.id) });
          setUserData({...userData, dislikedPosts: userData.dislikedPosts.filter((id: string) => id!== y.id), likedPosts: [...(userData.likedPosts||[]), y.id] });
        } else {
          await updateDoc(yakRef, { likes: increment(1) });
          await updateDoc(userRef, { likedPosts: arrayUnion(y.id) });
          setUserData({...userData, likedPosts: [...(userData.likedPosts||[]), y.id] });
        }
      } else {
        if (disliked) {
          await updateDoc(yakRef, { dislikes: increment(-1) });
          await updateDoc(userRef, { dislikedPosts: arrayRemove(y.id) });
          setUserData({...userData, dislikedPosts: userData.dislikedPosts.filter((id: string) => id!== y.id) });
        } else if (liked) {
          await updateDoc(yakRef, { likes: increment(-1), dislikes: increment(1) });
          await updateDoc(userRef, { likedPosts: arrayRemove(y.id), dislikedPosts: arrayUnion(y.id) });
          setUserData({...userData, likedPosts: userData.likedPosts.filter((id: string) => id!== y.id), dislikedPosts: [...(userData.dislikedPosts||[]), y.id] });
        } else {
          await updateDoc(yakRef, { dislikes: increment(1) });
          await updateDoc(userRef, { dislikedPosts: arrayUnion(y.id) });
          setUserData({...userData, dislikedPosts: [...(userData.dislikedPosts||[]), y.id] });
        }
      }
    } catch (e: any) { showToast(e.message); }
  };

  // POST 100% WORKING - SIMPLE - COLLEGE ONLY - SMOOTH UNIQUE
  const handlePost = async () => {
    const txt = newYak.trim();
    if (!txt) { showToast("Type something"); return; }
    if (!userData ||!user) { showToast("Login again"); return; }
    if (posting) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'yaks'), {
        text: txt,
        uid: user.uid,
        username: userData.username,
        avatar: userData.avatar,
        college: userData.college,
        likes: 0,
        dislikes: 0,
        commentsCount: 0,
        reports: 0,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', userData.id), { totalPosts: increment(1), yakarma: increment(5) });
      setNewYak(''); setScreen('feed'); showToast("Posted to "+userData.college+" 🔒");
    } catch (e: any) {
      alert("POST ERROR: "+e.message+"\n\nRules Publish chesava? Screenshot lo Publish click chey");
      showToast("Fail: "+e.message);
    } finally { setPosting(false); }
  };

  const handleDelete=async(y:any)=>{ if(!confirm('Delete?')) return; try{ await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1)}); }catch(e:any){ showToast(e.message); } setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost ||!editText.trim()) return; try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); }catch(e:any){ showToast(e.message); } setEditingPost(null); setEditText(''); setShowMenu(null); };
  const handleReport=async(y:any)=>{ if(userData.reportedPosts?.includes(y.id)){ showToast("Already reported"); return; } try{ await updateDoc(doc(db,'yaks',y.id),{reports:increment(1)}); await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)}); if((y.reports||0)+1>=5) await deleteDoc(doc(db,'yaks',y.id)); showToast("Reported "+((y.reports||0)+1)+"/5"); }catch(e:any){ showToast(e.message); } setShowMenu(null); };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#050507] text-white">
        <style>{`body{background:#050507} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent} button{transition: all 0.18s cubic-bezier(0.16,1,0.3,1)} button:active{transform:scale(0.96)}`}</style>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-[0_10px_40px_rgba(0,0,0,0.4)]">{toast}</div>}
        <div className="max-w-md mx-auto p-6">
          <div className="flex items-center justify-between mt-2"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">Y</div><div><p className="font-black text-sm tracking-tight">YAK • UNIQUE</p><p className="text-[10px] text-white/40">{totalUsers} real • College only 🔒 • Smooth</p></div></div><div className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] font-bold">{totalUsers} REAL</div></div>
          <h1 className="text-[38px] font-black mt-8 leading-[0.85] tracking-[-0.03em]">Unique.<br/>Smooth.<br/><span className="text-white/30">College only.</span></h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">CHOOSE YOUR VIBE</p>
          <div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border backdrop-blur-xl ${selectedAvatar===a?'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-[1.05]':'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]'}`}>{a}</button>)}</div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">SELECT HERD • {collegeCounts[selectedCollege]||0} IN {selectedCollege||'...'}</p>
          <div className="space-y-2.5 mt-3">{COLLEGES.map(c=>{ const cnt=collegeCounts[c.id]||0; const act=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`w-full p-4 rounded-[18px] border text-left flex justify-between items-center group ${act?'bg-white text-black border-white shadow-[0_10px_40px_rgba(255,255,255,0.2)]':'bg-white/[0.04] border-white/[0.06] backdrop-blur-xl hover:bg-white/[0.07] hover:border-white/[0.1]'}`}><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full bg-gradient-to-r ${c.color} ${act?'':'opacity-60'}`}></div><div><p className="font-bold text-[13px] tracking-tight">{c.label} • {c.city}</p><p className={`text-[11px] ${act?'text-black/60':'text-white/40'}`}>{cnt} real • only {c.id} herd can see</p></div></div><div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs ${act?'bg-black text-white border-black':'border-white/10 text-white/30 group-hover:border-white/20'}`}>{act?'✓':''}</div></button>})}</div>
          <button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full mt-8 py-4 rounded-full font-black text-[14px] tracking-tight ${selectedCollege?'bg-white text-black shadow-[0_10px_40px_rgba(255,255,255,0.2)]':'bg-white/[0.06] text-white/30 border border-white/[0.08]'}`}>{selectedAvatar} Enter {selectedCollege||'College'} • College Only 🔒 →</button>
          <Footer/>
        </div>
      </div>
    );
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(
      <div className="min-h-screen bg-[#050507] text-white"><div className="max-w-md mx-auto p-6"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/[0.06] border border-white/[0.08] rounded-full flex items-center justify-center">←</button><div className="mt-6 bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-widest text-white/30">{collegeCounts[selectedCollege]||0} REAL IN {selectedCollege} • COLLEGE ONLY 🔒</p><h2 className="font-black text-[18px] mt-1 tracking-tight">Prove real • {selectedCollege} only</h2><p className="text-[11px] text-white/40 mt-1">Smooth unique verification • Real only</p></div>
        <div className="flex p-1 bg-white/[0.04] border border-white/[0.06] rounded-full mt-5 backdrop-blur-xl"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black shadow-lg':'text-white/40'}`}>📧 Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black shadow-lg':'text-white/40'}`}>🎓 Roll</button><button onClick={()=>setVerifyMethod('id')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='id'?'bg-white text-black shadow-lg':'text-white/40'}`}>🪪 ID</button></div>
        {verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3.5 rounded-xl border border-red-500/20">{verifyError}</p>}
        {verifyMethod==='email' && <div className="mt-5 bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl rounded-[20px] p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-black/50 border border-white/[0.08] rounded-xl text-sm outline-none focus:border-white/20 focus:bg-black/70 transition-all"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Send OTP • Unique</button>{otpSent&&<div className="mt-4 bg-black/50 border border-white/[0.08] rounded-xl p-4"><p className="text-xs text-emerald-400 font-bold">OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full mt-3 p-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center tracking-[0.3em]"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-emerald-500 text-black py-3.5 rounded-full font-bold text-sm">Verify ✓</button></div>}</div>}
        {verifyMethod==='roll' && <div className="mt-5 bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl rounded-[20px] p-4"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={config?.ex} className="w-full p-4 bg-black/50 border border-white/[0.08] rounded-xl uppercase font-bold tracking-widest text-sm outline-none focus:border-white/20"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify Real Roll ✓</button></div>}
        {verifyMethod==='id' && <div className="mt-5 bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl rounded-[20px] p-4"><input value={idName} onChange={e=>setIdName(e.target.value.toUpperCase())} placeholder="NAME ON ID" className="w-full p-4 bg-black/50 border border-white/[0.08] rounded-xl uppercase font-bold text-sm"/><label className="mt-4 border border-dashed border-white/10 rounded-xl p-6 flex justify-center cursor-pointer text-xs text-white/40 hover:border-white/20 hover:bg-white/[0.02] transition-all">📸 Upload Real ID Card<input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setIdImage(r.result as string); r.readAsDataURL(f); } }}/></label>{idImage && <img src={idImage} className="mt-4 rounded-xl border border-white/10"/>}<button onClick={handleIdVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Submit Real ID ✓</button></div>}
        <Footer/></div></div>
    );
  }
  if(screen==='login'){ return <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6"><div className="w-24 h-24 bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-[24px] flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(255,255,255,0.1)]">{selectedAvatar}</div><h1 className="font-black mt-6 text-center text-xl tracking-tight">Verified ✓<br/><span className="text-white/40">{selectedCollege} Only 🔒</span></h1><p className="text-xs text-white/30 mt-2">{collegeCounts[selectedCollege]||0} real • Unique smooth</p><button onClick={handleGoogleLogin} className="w-full max-w-sm mt-8 bg-white text-black py-4 rounded-full font-bold text-sm shadow-[0_10px_40px_rgba(255,255,255,0.2)]">Continue to {selectedCollege} Feed 🔒 →</button><div className="mt-10 w-full max-w-md"><Footer/></div></div>; }

    return(
    <div className="min-h-screen bg-[#050507] text-white flex flex-col">
      <style>{`body{background:#050507} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent} button{transition:all 0.18s cubic-bezier(0.16,1,0.3,1)} button:active{transform:scale(0.96)}.glass{background:rgba(255,255,255,0.04); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.06)}.glass-hover:hover{background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.1)}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">{toast}</div>}

      <div className="sticky top-0 z-20 bg-[#050507]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm shadow-[0_0_20px_rgba(255,255,255,0.15)]">Y</div><div><p className="font-bold text-[13px] tracking-tight leading-none">{userData.college} • {collegeCounts[userData.college]||0} REAL • UNIQUE</p><p className="text-[10px] text-white/40 mt-0.5">{yaks.length} yaks • Only {userData.college} • Smooth</p></div></div>
          <button onClick={()=>setShowProfile(true)} className="w-9 h-9 glass rounded-full flex items-center justify-center glass-hover">{userData.avatar}</button>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2">
          <button onClick={()=>setFeedTab('new')} className={`flex-1 h-9 rounded-full text-xs font-bold border backdrop-blur-xl ${feedTab==='new'?'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]':'glass text-white/40 glass-hover'}`}>NEW • {yaks.length}</button>
          <button onClick={()=>setFeedTab('hot')} className={`flex-1 h-9 rounded-full text-xs font-bold border backdrop-blur-xl ${feedTab==='hot'?'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]':'glass text-white/40 glass-hover'}`}>🔥 HOT • {hotYaks.length}</button>
          <button onClick={()=>setFeedTab('top')} className={`flex-1 h-9 rounded-full text-xs font-bold border backdrop-blur-xl ${feedTab==='top'?'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]':'glass text-white/40 glass-hover'}`}>🏆 TOP</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        {feedTab==='top'? (
          <div className="space-y-3">
            <div className="glass rounded-[20px] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/30">{userData.college} LEADERBOARD • UNIQUE</p><p className="font-black mt-1 tracking-tight">Top in {userData.college} • 1 vote each • Smooth</p></div>
            {leaderboard.map((u:any,i:number)=><div key={u.id} className={`glass rounded-[18px] p-4 flex justify-between items-center glass-hover ${i===0?'border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.08)]':''}`}><div className="flex gap-3 items-center"><span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i===0?'bg-white text-black':i===1?'bg-white/20 text-white':i===2?'bg-white/10 text-white/60':'bg-white/[0.04] text-white/30'}`}>{i+1}</span><span className="w-9 h-9 glass rounded-full flex items-center justify-center">{u.avatar}</span><div><p className="font-bold text-[13px] tracking-tight">{u.username} {u.id===userData.id&&'• YOU'} {i===0&&'👑'}</p><p className="text-[10px] text-white/40">{u.college} ONLY • {u.totalPosts||0} yaks • 1 vote system</p></div></div><p className="font-black text-sm">{u.yakarma}</p></div>)}
            <Footer/>
          </div>
        ) : (
          <>
            <div className="glass rounded-[18px] p-4 flex justify-between items-center glass-hover">
              <div className="flex gap-3 items-center"><div className="w-10 h-10 glass rounded-full flex items-center justify-center">{userData.avatar}</div><div><p className="font-bold text-[13px] tracking-tight">{userData.username} • {userData.college} ONLY 🔒</p><p className="text-[11px] text-white/40">1 user = 1 like/dislike only • Unique smooth • College only</p></div></div>
              <div className="px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold">{collegeCounts[userData.college]||0} REAL</div>
            </div>

            {(feedTab==='new'? yaks : hotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid; const isHot=(y.likes||0)>=5;
              return(
                <div key={y.id} className={`glass rounded-[20px] p-5 relative glass-hover group ${isHot?'border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.1)]':isOwn?'border-white/15':''}`}>
                  {isHot && <div className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-[9px] font-bold shadow-lg">🔥 HOT • {y.likes} likes</div>}
                  <div className="flex justify-between items-start"><div className="flex gap-3"><div className="w-9 h-9 glass rounded-full flex items-center justify-center text-sm relative shrink-0 group-hover:border-white/20 transition-all">{y.avatar}{isOwn && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border-2 border-[#050507] shadow-sm"></div>}</div><div><div className="flex gap-2 items-center flex-wrap"><p className="font-bold text-[13px] tracking-tight">{y.username} {isOwn&&'• YOU'}</p><span className={`px-2.5 py-1 rounded-full text-[8px] font-bold tracking-widest backdrop-blur-xl ${isOwn?'bg-white text-black':'glass text-white/50 border-white/10'}`}>{y.college} ONLY 🔒</span>{y.reports>0 && <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/20 rounded-full text-[8px] font-bold">{y.reports}/5</span>}</div><p className="text-[10px] text-white/30 mt-1 flex items-center gap-2"><span className={`${score>0?'text-emerald-400':score<0?'text-red-400':'text-white/30'}`}>{score>0?`+${score}`:score} score</span> • <span>{y.college} only</span> • <span>1 vote/user</span></p></div></div>
                  <button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-8 h-8 glass rounded-full flex items-center justify-center text-white/40 hover:text-white/80 text-xs">⋯</button></div>
                  {showMenu===y.id && <div className="mt-3 bg-black/80 backdrop-blur-2xl border border-white/[0.08] rounded-xl p-2 flex gap-2 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">{isOwn? <><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="flex-1 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-full text-xs font-bold hover:bg-white hover:text-black">Edit</button><button onClick={()=>handleDelete(y)} className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white">Delete</button></> : <button onClick={()=>handleReport(y)} className="flex-1 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-full text-xs font-bold text-white/60 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20">🚨 Report {y.reports||0}/5</button>}</div>}
                  <p className="text-[15px] mt-4 leading-[1.5] tracking-[-0.01em] text-white/90 whitespace-pre-wrap break-words">{y.text}</p>
                  {/* UNIQUE 1 USER 1 VOTE UI */}
                  <div className="flex gap-2.5 mt-5 items-center">
                    <div className="flex glass rounded-full p-1 border-white/[0.08]">
                      <button onClick={()=>handleVote(y,'up')} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${liked?'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-[1.05]':'text-white/40 hover:text-white hover:bg-white/[0.06]'}`}>
                        ▲ {y.likes||0}
                      </button>
                      <span className={`px-3 py-2 text-[11px] font-black min-w-[36px] text-center ${score>0?'text-emerald-400':score<0?'text-red-400':'text-white/20'}`}>{score>0?`+${score}`:score}</span>
                      <button onClick={()=>handleVote(y,'down')} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${disliked?'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] scale-[1.05]':'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'}`}>
                        ▼ {y.dislikes||0}
                      </button>
                    </div>
                    <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="px-4 h-9 rounded-full text-xs glass border-white/[0.08] text-white/40 hover:text-white/80 hover:border-white/15 flex items-center gap-1.5">💬 {y.commentsCount||0}</button>
                    <div className="ml-auto flex items-center gap-2">
                      {liked && <span className="text-[9px] bg-white text-black px-2.5 py-1 rounded-full font-bold">YOU LIKED</span>}
                      {disliked && <span className="text-[9px] bg-red-500 text-white px-2.5 py-1 rounded-full font-bold">YOU DISLIKED</span>}
                      {isOwn &&!liked&&!disliked && <span className="text-[9px] glass px-2.5 py-1 rounded-full font-bold text-white/40">{userData.college} ONLY 🔒</span>}
                    </div>
                  </div>
                  {activePost===y.id && <div className="mt-5 border-t border-white/[0.06] pt-4 space-y-3"><div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">{comments.map(c=><div key={c.id} className="flex gap-2.5"><div className="w-7 h-7 glass rounded-full flex items-center justify-center text-xs shrink-0">{c.avatar}</div><div className="glass rounded-[16px] px-4 py-3 flex-1 border-white/[0.04]"><p className="text-[13px] leading-[1.4] text-white/80">{c.text}</p><p className="text-[9px] text-white/20 mt-1.5">{c.username}</p></div></div>)}{comments.length===0 && <p className="text-xs text-white/20 text-center py-6">No comments yet • Be first • 1 vote each</p>}</div><div className="flex gap-2.5 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={`Comment in ${userData.college} only...`} className="flex-1 glass rounded-full px-5 h-10 text-[13px] outline-none focus:border-white/20 placeholder:text-white/20"/><button onClick={async()=>{ if(!commentText.trim()) return; const t=commentText; setCommentText(''); try{ await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:t,uid:user.uid,username:userData.username,avatar:userData.avatar,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); }catch(e:any){ showToast(e.message); setCommentText(t); } }} className="w-10 h-10 bg-white text-black rounded-full font-bold text-sm hover:scale-[1.05] shadow-[0_0_20px_rgba(255,255,255,0.2)]">↑</button></div></div>}
                </div>
              );
            })}
            {(feedTab==='new'? yaks : hotYaks).length===0 && <div className="py-24 text-center"><div className="w-24 h-24 glass rounded-[24px] mx-auto flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(255,255,255,0.05)]">{userData.avatar}</div><p className="font-black mt-6 text-[18px] tracking-tight">No yaks in {userData.college} yet 🔒</p><p className="text-xs text-white/30 mt-2">Only {collegeCounts[userData.college]||0} real students • Be first • Unique smooth • 1 vote/user</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full text-[13px] font-bold shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:scale-[1.02]">+ First Yak in {userData.college} 🔒</button></div>}
            <Footer/>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#050507]/90 backdrop-blur-2xl border-t border-white/[0.06]"><div className="max-w-[600px] mx-auto px-6 h-[72px] flex items-center justify-between"><button onClick={()=>setFeedTab('new')} className="flex flex-col items-center gap-1.5 group"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${feedTab==='new'?'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]':'glass text-white/30 group-hover:text-white/60'}`}>⌂</div><span className="text-[8px] font-bold tracking-widest text-white/30">{userData.college} ONLY • {collegeCounts[userData.college]||0}</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[24px] font-black shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:scale-[1.05] hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] active:scale-[0.95]">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1.5 group"><div className="w-7 h-7 glass rounded-full flex items-center justify-center text-xs group-hover:border-white/20">{userData.avatar}</div><span className="text-[8px] font-bold tracking-widest text-white/30">YOU • {userData.yakarma}</span></button></div></div>

            {screen==='create' && (
        <div className="fixed inset-0 bg-[#050507] z-40 flex flex-col">
          {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-xl">{toast}</div>}
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full">
            <div className="p-5 flex items-center justify-between border-b border-white/[0.06]"><button onClick={()=>{ if(!posting) setScreen('feed'); }} className="w-10 h-10 glass rounded-full flex items-center justify-center hover:border-white/20">✕</button><div className="text-center"><p className="text-[11px] font-bold tracking-widest">{userData.college} ONLY 🔒 • UNIQUE</p><p className="text-[10px] text-white/30">Only {collegeCounts[userData.college]||0} real will see • 1 vote/user</p></div><button onClick={handlePost} disabled={posting||!newYak.trim()} className={`px-6 h-10 rounded-full font-bold text-[13px] transition-all ${posting||!newYak.trim()?'glass text-white/20 border-white/[0.06]':'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.97]'}`}>{posting?'Posting...':'Post 🔒'}</button></div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex gap-3 mb-6"><div className="w-11 h-11 glass rounded-full flex items-center justify-center">{userData.avatar}</div><div><p className="font-bold text-[14px] tracking-tight">{userData.username}</p><p className="text-[11px] text-white/40">Posting to {userData.college} only 🔒 • Unique smooth • 1 user 1 vote • Realistic</p></div></div>
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}? Only ${collegeCounts[userData.college]||0} students in ${userData.college} will see this 🔒 - unique smooth realistic...`} autoFocus className="w-full bg-transparent text-[19px] leading-[1.45] tracking-[-0.01em] outline-none placeholder:text-white/15 resize-none min-h-[180px]" maxLength={300}/>
              <div className="flex justify-between items-center mt-4"><span className="text-[11px] text-white/20">{newYak.length}/300 • {userData.college} only • 1 vote/user</span>{newYak.trim() && <button onClick={()=>setNewYak('')} className="text-[11px] text-white/30 hover:text-white/60">Clear</button>}</div>
              {posting && <div className="mt-8 flex items-center gap-3 text-xs text-white/30"><div className="w-4 h-4 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>Posting to {userData.college} only 🔒... Unique smooth</div>}
            </div>
            <div className="p-5 border-t border-white/[0.06] bg-[#050507]"><div className="glass rounded-xl p-4 flex gap-3 items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div><p className="text-[11px] text-white/50"><span className="font-bold text-white">Unique:</span> 1 user = 1 like/dislike only • No double vote • Smooth toggle • {userData.college} only 🔒</p></div><Footer/></div>
          </div>
        </div>
      )}

      {editingPost && <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-end justify-center p-4"><div className="glass bg-[#0a0a0f]/90 w-full max-w-[600px] rounded-t-[28px] p-6 pb-8 border-white/10"><div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6"></div><h3 className="font-black text-[16px] tracking-tight">Edit Yak • {userData.college} Only 🔒</h3><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-5 glass bg-black/50 rounded-xl p-4 text-[15px] outline-none min-h-[120px] resize-none focus:border-white/20 border-white/10"/><div className="flex gap-3 mt-6"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-12 glass rounded-full font-bold text-xs hover:border-white/20">Cancel</button><button onClick={handleEdit} disabled={!editText.trim()} className={`flex-1 h-12 rounded-full font-bold text-xs ${!editText.trim()?'glass text-white/20':'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)]'}`}>Save • Unique</button></div></div></div>}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-end justify-center"><div className="glass bg-[#0a0a0f]/90 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto border-white/10"><div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
        <div className="flex gap-4"><div className="w-[72px] h-[72px] glass rounded-[20px] flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(255,255,255,0.08)]">{userData.avatar}</div><div className="flex-1"><h2 className="font-black text-[16px] tracking-tight leading-none">{userData.username} • {userData.college} ONLY 🔒</h2><p className="text-[11px] text-white/40 mt-2 leading-[1.4]">{userData.college} • {collegeCounts[userData.college]||0} real only in your college • {userData.yakarma} karma • Unique smooth • 1 vote per user • Only your herd sees</p><div className="flex gap-2 mt-4"><span className="px-4 py-2 bg-white text-black rounded-full text-[11px] font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)]">{userData.yakarma} karma</span><span className="px-4 py-2 glass rounded-full text-[10px] font-bold text-white/50">{userData.college} ONLY 🔒 • 1 VOTE</span></div></div></div>
        <div className="grid grid-cols-3 gap-3 mt-6"><div className="glass rounded-[18px] p-4 text-center"><p className="font-black text-xl tracking-tight">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">YAKS • {userData.college}</p></div><div className="glass rounded-[18px] p-4 text-center"><p className="font-black text-xl tracking-tight">{collegeCounts[userData.college]||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">REAL • {userData.college}</p></div><div className="bg-white text-black rounded-[18px] p-4 text-center shadow-[0_0_30px_rgba(255,255,255,0.15)]"><p className="font-black text-xl tracking-tight">{userData.yakarma}</p><p className="text-[9px] font-bold tracking-widest mt-1">KARMA • 1 VOTE</p></div></div>
        <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 glass h-12 rounded-full text-xs font-bold hover:border-white/20 text-white/60">Logout • {userData.college} Only</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-12 rounded-full font-bold text-xs shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-[1.01]">Close • Unique Smooth ✓</button><div className="mt-4"><Footer/></div></div></div>
      )}
    </div>
  );
}
