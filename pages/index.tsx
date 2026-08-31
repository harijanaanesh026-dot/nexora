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
  {id:"SRET", label:"SRET", city:"Tirupati", domains:["sret.edu.in","sret.ac.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21CS101"},
  {id:"SVCE", label:"SVCE", city:"Tirupati", domains:["svce.edu.in"], pattern:/^(19|20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"20CS123"},
  {id:"BITS", label:"BITS", city:"Pilani", domains:["bits-pilani.ac.in"], pattern:/^20[0-9]{2}[A-Z]{2,4}[0-9]{4}$/i, ex:"2021CS1234"},
  {id:"VEMU", label:"VEMU", city:"Chittoor", domains:["vemu.edu.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21IT089"},
  {id:"OTHER", label:"OTHER", city:"India", domains:["edu.in","ac.in"], pattern:/^[A-Z0-9]{6,15}$/i, ex:"COL12345"},
];
const AVATARS = ["👻","🔥","😎","🤫","💀","👽","🦊","🐼"];
const Footer = () => (
  <div className="w-full py-6 flex flex-col items-center gap-1 border-t border-zinc-800 mt-8">
    <p className="text-[10px] tracking-[0.3em] font-bold text-zinc-500">A PRODUCTION BY ANESH</p>
    <p className="text-[9px] text-zinc-600">College Only • Simple • Realistic • Smooth</p>
  </div>
);

export default function YakFinal(){
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
          await addDoc(collection(db,'users'),{ uid:u.uid, email:u.email||'', username:'Yak_'+Math.floor(Math.random()*9000+1000), avatar:localStorage.getItem('selected_avatar')||'👻', college:String(col), collegeEmail:String(localStorage.getItem('college_email')||''), rollNumber:String(localStorage.getItem('roll_number')||''), idImage:String(localStorage.getItem('id_image')||''), idName:String(localStorage.getItem('id_name')||''), verifyMethod:String(localStorage.getItem('verify_method')||'email'), idVerified: localStorage.getItem('verify_method')==='id'? false : true, yakarma:100, totalPosts:0, likedPosts:[], dislikedPosts:[], reportedPosts:[], createdAt:serverTimestamp() });
          window.location.reload();
        }else{ setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen('feed'); }
      }else setScreen('college');
    });
  },[isVerified]);
  // FEED - NO INDEX NEEDED - CLIENT SORT - 100% WORKING COLLEGE ONLY
  useEffect(()=>{
    if(!userData?.college) return;
    const q = query(collection(db,'yaks'), where('college','==', userData.college));
    const unsub = onSnapshot(q, s=>{
      const data=s.docs.map(d=>({id:d.id,...d.data()} as any));
      data.sort((a,b)=> (b.createdAt?.toMillis?.()||b.createdAt?.seconds*1000||0) - (a.createdAt?.toMillis?.()||a.createdAt?.seconds*1000||0));
      setYaks(data);
      setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0)).slice(0,20));
    }, err=>{ console.log("FEED ERR", err); });
    return ()=>unsub();
  },[userData]);
  useEffect(()=>{ if(!userData?.college) return; return onSnapshot(query(collection(db,'users'), where('college','==', userData.college)), s=>{ const d=s.docs.map(doc=>({id:doc.id,...doc.data()} as any)).sort((a,b)=>b.yakarma-a.yakarma).slice(0,10); setLeaderboard(d); }); },[userData]);
  useEffect(()=>{ if(!user ||!ADMIN_EMAILS.includes(user.email||'')) return; return onSnapshot(query(collection(db,'users'), where('idVerified','==', false)), s=>{ setPendingIDs(s.docs.map(d=>({id:d.id,...d.data()}))); }); },[user]);
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

  const handleVote=async(y:any,type:string)=>{
    try{
      const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
      if(type==='up'){
        if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id)}); }
        else if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1),likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id),likedPosts:arrayUnion(y.id)}); }
        else{ await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id)}); }
      }else{
        if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id)}); }
        else if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1),dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id),dislikedPosts:arrayUnion(y.id)}); }
        else{ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayUnion(y.id)}); }
      }
    }catch(e:any){ showToast(e.message); }
  };

  // POST 100% WORKING - SUPER SIMPLE - NO IMAGE ISSUE - COLLEGE ONLY
  const handlePost=async()=>{
    const txt = newYak.trim();
    if(!txt){ showToast("Type something"); return; }
    if(!userData ||!user){ showToast("Login again"); return; }
    if(posting) return;
    setPosting(true);
    console.log("Posting to", userData.college, txt);
    try{
      // MINIMAL - WILL WORK WITH YOUR RULES
      await addDoc(collection(db,'yaks'),{
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
      await updateDoc(doc(db,'users',userData.id),{ totalPosts:increment(1), yakarma:increment(5) });
      setNewYak('');
      setImages([]);
      setScreen('feed');
      showToast("Posted to "+userData.college+" 🔒");
    }catch(e:any){
      console.error("POST FAIL", e);
      alert("POST ERROR: "+e.message+"\nCode: "+e.code+"\n\nFirestore Rules lo email_otps add chesava?");
      showToast("Fail: "+e.message);
    }finally{ setPosting(false); }
  };

  const handleDelete=async(y:any)=>{ if(!confirm('Delete?')) return; try{ await deleteDoc(doc(db,'yaks',y.id)); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(-1)}); }catch(e:any){ showToast(e.message); } setShowMenu(null); };
  const handleEdit=async()=>{ if(!editingPost ||!editText.trim()) return; try{ await updateDoc(doc(db,'yaks',editingPost.id),{text:editText.trim(), edited:true}); }catch(e:any){ showToast(e.message); } setEditingPost(null); setEditText(''); setShowMenu(null); };
  const handleReport=async(y:any)=>{ if(userData.reportedPosts?.includes(y.id)){ showToast("Already reported"); return; } try{ await updateDoc(doc(db,'yaks',y.id),{reports:increment(1)}); await updateDoc(doc(db,'users',userData.id),{reportedPosts:arrayUnion(y.id)}); if((y.reports||0)+1>=5) await deleteDoc(doc(db,'yaks',y.id)); showToast("Reported "+((y.reports||0)+1)+"/5"); }catch(e:any){ showToast(e.message); } setShowMenu(null); };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-black text-white">
        <style>{`body{background:black} ::-webkit-scrollbar{display:none} button:active{transform:scale(0.97)} *{-webkit-tap-highlight-color:transparent}`}</style>
        {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
        <div className="max-w-md mx-auto p-5">
          <div className="flex items-center gap-2.5 mt-3"><div className="w-9 h-9 bg-white text-black rounded-xl flex items-center justify-center font-black">Y</div><div><p className="font-black text-sm">YAK • COLLEGE ONLY 🔒</p><p className="text-[10px] text-zinc-500">{totalUsers} real • Smooth realistic</p></div></div>
          <h1 className="text-[34px] font-black mt-7 leading-[0.9]">Simple.<br/>Real.<br/><span className="text-zinc-600">College only.</span></h1>
          <p className="text-[10px] font-bold tracking-widest text-zinc-500 mt-6">AVATAR</p>
          <div className="grid grid-cols-4 gap-2 mt-2">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-14 rounded-2xl text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800'}`}>{a}</button>)}</div>
          <p className="text-[10px] font-bold tracking-widest text-zinc-500 mt-6">COLLEGE • {collegeCounts[selectedCollege]||0} REAL</p>
          <div className="space-y-2 mt-2">{COLLEGES.map(c=>{ const cnt=collegeCounts[c.id]||0; const act=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`w-full p-3.5 rounded-2xl border text-left flex justify-between ${act?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800'}`}><div><p className="font-bold text-[13px]">{c.label} • {c.city}</p><p className={`text-[11px] ${act?'text-black/60':'text-zinc-500'}`}>{cnt} real • only {c.id} can see</p></div><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${act?'bg-black text-white border-black':'border-zinc-700'}`}>{act?'✓':''}</span></button>})}</div>
          <button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full mt-6 py-4 rounded-full font-black text-sm ${selectedCollege?'bg-white text-black':'bg-zinc-900 text-zinc-600'}`}>Continue to {selectedCollege||'College'} 🔒 →</button>
          <Footer/>
        </div>
      </div>
    );
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(
      <div className="min-h-screen bg-black text-white"><div className="max-w-md mx-auto p-5"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-zinc-900 rounded-full">←</button><div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><p className="text-[10px] font-bold tracking-widest text-zinc-500">{collegeCounts[selectedCollege]||0} REAL IN {selectedCollege} • COLLEGE ONLY 🔒</p><h2 className="font-black mt-1">Verify • {selectedCollege} only can see</h2></div>
        <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-full mt-4"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-2.5 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-2.5 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>Roll</button><button onClick={()=>setVerifyMethod('id')} className={`flex-1 py-2.5 rounded-full text-xs font-bold ${verifyMethod==='id'?'bg-white text-black':'text-zinc-500'}`}>ID</button></div>
        {verifyError && <p className="text-xs text-red-400 mt-3 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{verifyError}</p>}
        {verifyMethod==='email' && <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-sm outline-none"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3 rounded-full font-bold text-sm">Send OTP</button>{otpSent&&<div className="mt-3 bg-black border border-zinc-800 rounded-xl p-3"><p className="text-xs text-green-400">OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" className="w-full mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center tracking-widest"/><button onClick={handleOtpSubmit} className="w-full mt-2 bg-green-500 text-black py-3 rounded-full font-bold text-sm">Verify</button></div>}</div>}
        {verifyMethod==='roll' && <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={config?.ex} className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl uppercase font-bold tracking-widest"/><button onClick={handleRollVerify} className="w-full mt-3 bg-white text-black py-3 rounded-full font-bold text-sm">Verify Roll</button></div>}
        {verifyMethod==='id' && <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><input value={idName} onChange={e=>setIdName(e.target.value.toUpperCase())} placeholder="NAME ON ID" className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl uppercase font-bold"/><label className="mt-3 border border-dashed border-zinc-700 rounded-xl p-5 flex justify-center cursor-pointer text-xs text-zinc-500">Upload ID<input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setIdImage(r.result as string); r.readAsDataURL(f); } }}/></label>{idImage && <img src={idImage} className="mt-3 rounded-xl"/>}<button onClick={handleIdVerify} className="w-full mt-3 bg-white text-black py-3 rounded-full font-bold text-sm">Submit ID</button></div>}
        <Footer/></div></div>
    );
  }
  if(screen==='login'){ return <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6"><div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-3xl">{selectedAvatar}</div><h1 className="font-black mt-4 text-center">Verified ✓<br/>{selectedCollege} Only 🔒</h1><button onClick={handleGoogleLogin} className="w-full max-w-sm mt-6 bg-white text-black py-3.5 rounded-full font-bold text-sm">Continue to Feed →</button><Footer/></div>; }

    return(
    <div className="min-h-screen bg-black text-white flex flex-col">
      <style>{`body{background:black} ::-webkit-scrollbar{display:none} button{transition:all 0.12s} button:active{transform:scale(0.97)}`}</style>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold z-[100] shadow-xl">{toast}</div>}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">Y</div><div><p className="font-bold text-[13px] leading-none">{userData.college} • {collegeCounts[userData.college]||0} real • COLLEGE ONLY 🔒</p><p className="text-[10px] text-zinc-500">{yaks.length} yaks • Only {userData.college} can see • Smooth</p></div></div>
          <button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">{userData.avatar}</button>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2">
          <button onClick={()=>setFeedTab('new')} className={`flex-1 h-9 rounded-full text-xs font-bold border ${feedTab==='new'?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>NEW • {yaks.length}</button>
          <button onClick={()=>setFeedTab('hot')} className={`flex-1 h-9 rounded-full text-xs font-bold border ${feedTab==='hot'?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>HOT • {hotYaks.length}</button>
          <button onClick={()=>setFeedTab('top')} className={`flex-1 h-9 rounded-full text-xs font-bold border ${feedTab==='top'?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>TOP</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[80px] space-y-2.5">
        {feedTab==='top'? (
          <div className="space-y-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><p className="text-[10px] font-bold tracking-widest text-zinc-500">{userData.college} TOP • COLLEGE ONLY 🔒</p><p className="font-black text-sm">Leaderboard • Realistic</p></div>
            {leaderboard.map((u:any,i:number)=><div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex justify-between items-center"><div className="flex gap-3 items-center"><span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span><span className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">{u.avatar}</span><div><p className="font-bold text-[13px]">{u.username} {u.id===userData.id&&'• YOU'}</p><p className="text-[10px] text-zinc-500">{u.college} ONLY</p></div></div><p className="font-black text-sm">{u.yakarma}</p></div>)}
            <Footer/>
          </div>
        ) : (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex justify-between items-center">
              <div className="flex gap-2.5 items-center"><div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center">{userData.avatar}</div><div><p className="font-bold text-[13px]">{userData.username} • {userData.college} ONLY 🔒</p><p className="text-[11px] text-zinc-500">Only {collegeCounts[userData.college]||0} real in {userData.college} can see • Smooth</p></div></div>
              <span className="text-[10px] bg-white text-black px-2.5 py-1 rounded-full font-bold">{collegeCounts[userData.college]||0} REAL</span>
            </div>

            {(feedTab==='new'? yaks : hotYaks).map(y=>{
              const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0); const isOwn=user?.uid===y.uid;
              return(
                <div key={y.id} className={`bg-zinc-900 border rounded-2xl p-4 ${isOwn?'border-zinc-700':'border-zinc-800'}`}>
                  <div className="flex justify-between"><div className="flex gap-2.5"><div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-sm">{y.avatar}</div><div><p className="font-bold text-[12px]">{y.username} {isOwn&&'• YOU'}</p><p className="text-[10px] text-zinc-500">{y.college} ONLY 🔒 • {score} score • Smooth</p></div></div>
                  <button onClick={()=>setShowMenu(showMenu===y.id?null:y.id)} className="w-7 h-7 bg-black border border-zinc-800 rounded-full text-zinc-500 text-xs">⋯</button></div>
                  {showMenu===y.id && <div className="mt-2 bg-black border border-zinc-800 rounded-xl p-2 flex gap-2">{isOwn? <><button onClick={()=>{ setEditingPost(y); setEditText(y.text); setShowMenu(null); }} className="flex-1 py-2 bg-zinc-900 rounded-full text-xs">Edit</button><button onClick={()=>handleDelete(y)} className="flex-1 py-2 bg-red-900/30 text-red-400 rounded-full text-xs">Delete</button></> : <button onClick={()=>handleReport(y)} className="flex-1 py-2 bg-zinc-900 rounded-full text-xs">Report {y.reports||0}/5</button>}</div>}
                  <p className="text-[14px] mt-3 leading-[1.45] whitespace-pre-wrap break-words">{y.text}</p>
                  <div className="flex gap-2 mt-3.5 items-center"><div className="flex bg-black border border-zinc-800 rounded-full p-1"><button onClick={()=>handleVote(y,'up')} className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${liked?'bg-white text-black':'text-zinc-500'}`}>▲ {y.likes||0}</button><span className={`px-2 py-1.5 text-[11px] font-bold min-w-[28px] text-center ${score>0?'text-green-400':score<0?'text-red-400':'text-zinc-600'}`}>{score>0?`+${score}`:score}</span><button onClick={()=>handleVote(y,'down')} className={`px-3 py-1.5 rounded-full text-xs font-bold ${disliked?'bg-red-500 text-white':'text-zinc-600'}`}>▼</button></div><button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="px-4 h-8 rounded-full text-xs bg-black border border-zinc-800 text-zinc-400">💬 {y.commentsCount||0}</button>{isOwn && <span className="ml-auto text-[9px] bg-white text-black px-2.5 py-1 rounded-full font-bold">{userData.college} ONLY 🔒</span>}</div>
                  {activePost===y.id && <div className="mt-4 border-t border-zinc-800 pt-3 space-y-2.5"><div className="space-y-2 max-h-[260px] overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-2"><div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center text-xs">{c.avatar}</div><div className="bg-black border border-zinc-800 rounded-2xl px-3.5 py-2.5 flex-1"><p className="text-[13px]">{c.text}</p></div></div>)}{comments.length===0 && <p className="text-xs text-zinc-600 text-center py-3">No comments • Be first</p>}</div><div className="flex gap-2 mt-3"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment..." className="flex-1 bg-black border border-zinc-800 rounded-full px-4 h-9 text-[13px] outline-none"/><button onClick={async()=>{ if(!commentText.trim()) return; const t=commentText; setCommentText(''); try{ await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:t,uid:user.uid,username:userData.username,avatar:userData.avatar,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); }catch(e:any){ showToast(e.message); setCommentText(t); } }} className="w-9 h-9 bg-white text-black rounded-full font-bold text-sm">↑</button></div></div>}
                </div>
              );
            })}
            {(feedTab==='new'? yaks : hotYaks).length===0 && <div className="py-20 text-center"><div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-[20px] mx-auto flex items-center justify-center text-3xl">{userData.avatar}</div><p className="font-black mt-5 text-[16px]">No yaks in {userData.college} yet 🔒</p><p className="text-xs text-zinc-500 mt-1">Only {collegeCounts[userData.college]||0} real • Be first • Simple smooth</p><button onClick={()=>setScreen('create')} className="mt-5 bg-white text-black px-7 h-10 rounded-full text-[13px] font-bold">+ First Yak in {userData.college} 🔒</button></div>}
            <Footer/>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-zinc-900"><div className="max-w-[600px] mx-auto px-5 h-[64px] flex items-center justify-between"><button onClick={()=>setFeedTab('new')} className="flex flex-col items-center gap-1"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${feedTab==='new'?'bg-white text-black':'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>⌂</div><span className="text-[8px] font-bold tracking-widest text-zinc-500">{userData.college} ONLY • {collegeCounts[userData.college]||0}</span></button><button onClick={()=>setScreen('create')} className="w-[52px] h-[52px] bg-white text-black rounded-full flex items-center justify-center text-[22px] font-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1"><div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-xs">{userData.avatar}</div><span className="text-[8px] font-bold tracking-widest text-zinc-500">YOU • {userData.yakarma}</span></button></div></div>

            {screen==='create' && (
        <div className="fixed inset-0 bg-black z-40 flex flex-col">
          {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full">
            <div className="p-4 flex items-center justify-between border-b border-zinc-900"><button onClick={()=>{ if(!posting){ setScreen('feed'); }}} className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">✕</button><div className="text-center"><p className="text-[11px] font-bold tracking-widest">{userData.college} ONLY 🔒</p><p className="text-[10px] text-zinc-500">Only {collegeCounts[userData.college]||0} real will see • Simple realistic</p></div><button onClick={handlePost} disabled={posting||!newYak.trim()} className={`px-5 h-9 rounded-full font-bold text-[13px] ${posting||!newYak.trim()?'bg-zinc-900 text-zinc-600 border border-zinc-800':'bg-white text-black'}`}>{posting?'Posting...':'Post 🔒'}</button></div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="flex gap-3 mb-4"><div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">{userData.avatar}</div><div><p className="font-bold text-sm">{userData.username}</p><p className="text-[11px] text-zinc-500">Posting to {userData.college} only 🔒 • Simple • Smooth • Realistic</p></div></div>
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}? Only ${collegeCounts[userData.college]||0} students in ${userData.college} will see this 🔒`} autoFocus className="w-full bg-transparent text-[18px] leading-[1.4] outline-none placeholder:text-zinc-700 resize-none min-h-[160px]" maxLength={300}/>
              <div className="flex justify-between items-center mt-2"><span className="text-[11px] text-zinc-600">{newYak.length}/300 • {userData.college} only</span><span className="text-[10px] text-zinc-500">Text only = 100% works</span></div>
              {posting && <div className="mt-6 flex items-center gap-3 text-xs text-zinc-500"><div className="w-4 h-4 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>Posting to {userData.college} only 🔒...</div>}
            </div>
            <div className="p-4 border-t border-zinc-900 bg-black"><div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex gap-2.5 items-center"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] text-zinc-400"><span className="font-bold text-white">Tip:</span> Text only post = 100% working • College only • Simple realistic • Smooth</p></div><Footer/></div>
          </div>
        </div>
      )}

      {editingPost && <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-end justify-center p-3"><div className="bg-zinc-900 border border-zinc-800 w-full max-w-[600px] rounded-t-[24px] p-5 pb-6"><div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4"></div><h3 className="font-black text-sm">Edit Yak • {userData.college} Only 🔒</h3><textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full mt-4 bg-black border border-zinc-800 rounded-xl p-4 text-[15px] outline-none min-h-[110px] resize-none"/><div className="flex gap-2.5 mt-4"><button onClick={()=>{ setEditingPost(null); setEditText(''); }} className="flex-1 h-11 bg-zinc-800 border border-zinc-700 rounded-full font-bold text-xs">Cancel</button><button onClick={handleEdit} disabled={!editText.trim()} className={`flex-1 h-11 rounded-full font-bold text-xs ${!editText.trim()?'bg-zinc-800 text-zinc-600':'bg-white text-black'}`}>Save</button></div></div></div>}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-zinc-900 border border-zinc-800 w-full max-w-[600px] rounded-t-[24px] p-5 max-h-[85vh] overflow-y-auto"><div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"></div>
        <div className="flex gap-4"><div className="w-[64px] h-[64px] bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-2xl">{userData.avatar}</div><div className="flex-1"><h2 className="font-black text-[15px]">{userData.username} • {userData.college} ONLY 🔒</h2><p className="text-[11px] text-zinc-500 mt-1">{userData.college} • {collegeCounts[userData.college]||0} real only • {userData.yakarma} karma • Smooth realistic</p><div className="flex gap-2 mt-3"><span className="px-3 py-1.5 bg-white text-black rounded-full text-[11px] font-bold">{userData.yakarma} karma</span><span className="px-3 py-1.5 bg-black border border-zinc-800 text-zinc-400 rounded-full text-[10px] font-bold">{userData.college} ONLY 🔒</span></div></div></div>
        <div className="grid grid-cols-3 gap-2.5 mt-5"><div className="bg-black border border-zinc-800 rounded-2xl p-3.5 text-center"><p className="font-black text-lg">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-zinc-500 mt-1">YAKS</p></div><div className="bg-black border border-zinc-800 rounded-2xl p-3.5 text-center"><p className="font-black text-lg">{collegeCounts[userData.college]||0}</p><p className="text-[9px] font-bold tracking-widest text-zinc-500 mt-1">REAL</p></div><div className="bg-white text-black rounded-2xl p-3.5 text-center"><p className="font-black text-lg">{userData.yakarma}</p><p className="text-[9px] font-bold tracking-widest mt-1">KARMA</p></div></div>
        <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-4 bg-zinc-800 border border-zinc-700 h-11 rounded-full text-xs">Logout</button><button onClick={()=>setShowProfile(false)} className="w-full mt-2.5 bg-white text-black h-11 rounded-full font-bold text-xs">Close • Smooth ✓</button><div className="mt-4"><Footer/></div></div></div>
      )}

      {showAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-end justify-center"><div className="bg-zinc-900 border border-zinc-800 w-full max-w-[600px] rounded-t-[24px] p-5 max-h-[85vh] overflow-y-auto"><div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4"></div><h2 className="font-black text-sm">🛡️ Admin • {pendingIDs.length} pending</h2><div className="mt-4 space-y-3">{pendingIDs.map((u:any)=><div key={u.id} className="bg-black border border-zinc-800 rounded-2xl p-3.5"><p className="font-bold text-xs">{u.username} • {u.idName} • {u.college} ONLY 🔒</p><p className="text-[10px] text-zinc-500">{u.rollNumber||u.collegeEmail}</p>{u.idImage && <img src={u.idImage} className="mt-3 rounded-xl w-full border border-zinc-800"/>}<div className="flex gap-2 mt-3"><button onClick={async()=>{ await updateDoc(doc(db,'users',u.id),{idVerified:true}); showToast("Approved"); }} className="flex-1 h-9 bg-white text-black rounded-full text-xs font-bold">Approve</button><button onClick={async()=>{ await deleteDoc(doc(db,'users',u.id)); }} className="flex-1 h-9 bg-zinc-800 border border-zinc-700 text-red-400 rounded-full text-xs">Reject</button></div></div>)}{pendingIDs.length===0 && <p className="text-xs text-zinc-500 py-12 text-center">No pending ✓</p>}</div><button onClick={()=>setShowAdmin(false)} className="w-full mt-4 bg-white text-black h-10 rounded-full font-bold text-xs">Close</button><Footer/></div></div>
      )}
    </div>
  );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }

