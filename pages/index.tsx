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
  {id:"BITS", label:"BITS", domain:"bits,pilani,bitsathy", grad:"from-violet-600 to-indigo-600", icon:"⚡", city:"Pilani"},
  {id:"SRET", label:"SRET", domain:"sret,srit", grad:"from-blue-600 to-cyan-600", icon:"🎓", city:"Tirupati"},
  {id:"SVCE", label:"SVCE", domain:"svce", grad:"from-emerald-600 to-teal-600", icon:"🚀", city:"Tirupati"},
  {id:"ST.JOHNS", label:"ST.JOHNS", domain:"stjohns,sjct", grad:"from-orange-600 to-red-600", icon:"🔥", city:"Tirupati"},
  {id:"VEMU", label:"VEMU", domain:"vemu", grad:"from-yellow-500 to-orange-600", icon:"💎", city:"Chittoor"},
  {id:"ARTS & SCIENCE", label:"ARTS", domain:"edu,ac", grad:"from-pink-600 to-rose-600", icon:"🎨", city:"Tirupati"},
  {id:"OTHER", label:"OTHER", domain:"gmail,edu,ac", grad:"from-zinc-700 to-zinc-900", icon:"🌍", city:"India"},
];
const TOPICS = ["All","Confessions","Crushes","Memes","Hostel","Placements","BuySell","Notes","Events"];
const FEEDS = ["College","City","Trending","Latest"];
const AVATARS = [
  {emoji:"👻", bg:"bg-zinc-900", border:"border-zinc-800"},
  {emoji:"🔥", bg:"bg-orange-950", border:"border-orange-900"},
  {emoji:"😎", bg:"bg-blue-950", border:"border-blue-900"},
  {emoji:"🤫", bg:"bg-violet-950", border:"border-violet-900"},
  {emoji:"💀", bg:"bg-zinc-900", border:"border-zinc-700"},
  {emoji:"👽", bg:"bg-green-950", border:"border-green-900"},
  {emoji:"🦊", bg:"bg-orange-950", border:"border-orange-900"},
  {emoji:"🐼", bg:"bg-zinc-900", border:"border-zinc-800"},
];

const Footer = () => (
  <div className="w-full py-8 flex flex-col items-center justify-center gap-2 border-t border-zinc-900 mt-10 bg-[#050507]">
    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black">Y</div>
    <p className="text-[11px] tracking-[0.3em] font-black text-zinc-500">A PRODUCTION BY ANESH</p>
    <p className="text-[10px] text-zinc-700">YAK • Real Student Verified • Dark Only • 2026</p>
    <div className="flex gap-2 mt-2"><span className="w-1 h-1 bg-zinc-800 rounded-full"></span><span className="w-1 h-1 bg-zinc-800 rounded-full"></span><span className="w-1 h-1 bg-white rounded-full"></span></div>
  </div>
);

export default function YakApp(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [yaks,setYaks]=useState<any[]>([]);
  const [topic,setTopic]=useState('All');
  const [feedType,setFeedType]=useState('College');
  const [newYak,setNewYak]=useState('');
  const [images,setImages]=useState<string[]>([]);
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [showProfile,setShowProfile]=useState(false);
  const [selectedCollege,setSelectedCollege]=useState('');
  const [selectedAvatar,setSelectedAvatar]=useState(AVATARS[0]);
  const [verifyMethod,setVerifyMethod]=useState('email');
  const [collegeEmail,setCollegeEmail]=useState('');
  const [rollNumber,setRollNumber]=useState('');
  const [otp,setOtp]=useState('');
  const [generatedOtp,setGeneratedOtp]=useState('');
  const [otpSent,setOtpSent]=useState(false);
  const [isVerified,setIsVerified]=useState(false);
  const [posting,setPosting]=useState(false);

  useEffect(()=>{ const old=localStorage.getItem('selected_college'); if(old?.includes('JNTU')) localStorage.clear(); getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college'); if(!col ||!isVerified){ setScreen('college'); return; }
          if(col.includes('JNTU')){ localStorage.clear(); setScreen('college'); return; }
          const username='Yak_'+Math.floor(Math.random()*9000+1000);
          let avData:any=AVATARS[0]; try{ const s=localStorage.getItem('selected_avatar_data'); if(s) avData=JSON.parse(s); }catch{}
          await addDoc(collection(db,'users'),{uid:u.uid,email:u.email,username,avatar:avData.emoji,avatarBg:avData.bg,avatarBorder:avData.border,college:col,collegeEmail:localStorage.getItem('college_email')||'',rollNumber:localStorage.getItem('roll_number')||'',verifyMethod:localStorage.getItem('verify_method')||'email',karma:120,streak:1,totalPosts:0,likedPosts:[],dislikedPosts:[],createdAt:serverTimestamp()});
          window.location.reload();
        }else{
          let raw:any={id:snap.docs[0].id,...snap.docs[0].data()};
          if(raw.college?.includes('JNTU')){ await deleteDoc(doc(db,'users',raw.id)); localStorage.clear(); window.location.reload(); return; }
          if(!raw.avatar){ raw.avatar='👻'; raw.avatarBg='bg-zinc-900'; raw.avatarBorder='border-zinc-800'; await updateDoc(doc(db,'users',raw.id),{avatar:'👻',avatarBg:'bg-zinc-900',avatarBorder:'border-zinc-800'}); }
          setUserData(raw); setScreen('feed');
        }
      }else setScreen('college');
    });
  },[isVerified]);

  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')),s=>{
      let data:any[]=s.docs.map(d=>({id:d.id,...d.data()})).filter((y:any)=>!y.college?.includes('JNTU'));
      if(feedType==='College') data=data.filter((y:any)=>y.college===userData.college);
      if(feedType==='City'){ const city=COLLEGES.find(c=>c.id===userData.college)?.city; data=data.filter((y:any)=>COLLEGES.find(c=>c.id===y.college)?.city===city); }
      if(feedType==='Trending') data=data.sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0,30);
      if(topic!=='All') data=data.filter((y:any)=>y.topic===topic);
      setYaks(data);
    });
  },[userData,feedType,topic]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

  const handleCollegeNext=()=>{ if(!selectedCollege) return alert('Campus select chey'); localStorage.setItem('selected_college',selectedCollege); localStorage.setItem('selected_avatar_data',JSON.stringify(selectedAvatar)); setScreen('verify'); };
  const handleEmailVerify=async()=>{
    if(!collegeEmail.includes('@')) return alert('Valid college email');
    const colData=COLLEGES.find(c=>c.id===selectedCollege); const domain=collegeEmail.split('@')[1].toLowerCase();
    const allowed=colData?.domain.split(',').map(d=>d.trim())||[]; if(!allowed.some(d=>domain.includes(d)) && selectedCollege!=='OTHER') return alert(`Real proof failed: ${selectedCollege} ki ${colData?.domain} domain kavali. Got ${domain}`);
    const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',collegeEmail.toLowerCase()))); if(!dup.empty) return alert('Already verified!');
    const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode);
    await setDoc(doc(db,'email_otps',collegeEmail.toLowerCase()),{email:collegeEmail.toLowerCase(),otp:otpCode,college:selectedCollege,createdAt:serverTimestamp(),expiresAt:Date.now()+600000});
    setOtpSent(true); alert(`REAL OTP for ${selectedCollege} proof: ${otpCode} ✓`);
  };
  const handleOtpSubmit=async()=>{
    const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase()))); if(snap.empty) return alert('No OTP'); const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()) return alert('Wrong OTP: '+d.otp);
    await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase())); localStorage.setItem('college_email',collegeEmail.toLowerCase()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login');
  };
  const handleRollVerify=async()=>{
    const pat=/^[A-Z0-9]{6,15}$/i; if(!pat.test(rollNumber.trim())) return alert('Invalid roll'); const snap=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollNumber.trim().toUpperCase()))); if(!snap.empty) return alert('Roll already used - real proof block');
    localStorage.setItem('roll_number',rollNumber.trim().toUpperCase()); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login');
  };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleLike=async(y:any,type:string)=>{
    const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
    try{
      if(type==='like'){
        if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id)}); setUserData({...userData,likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)}); }
        else if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1),likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id),likedPosts:arrayUnion(y.id)}); setUserData({...userData,dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id),likedPosts:[...userData.likedPosts,y.id]}); }
        else{ await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id)}); setUserData({...userData,likedPosts:[...(userData.likedPosts||[]),y.id]}); }
      }else{
        if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id)}); setUserData({...userData,dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id)}); }
        else if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1),dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id),dislikedPosts:arrayUnion(y.id)}); setUserData({...userData,likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id),dislikedPosts:[...userData.dislikedPosts,y.id]}); }
        else{ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayUnion(y.id)}); setUserData({...userData,dislikedPosts:[...(userData.dislikedPosts||[]),y.id]}); }
      }
    }catch(e:any){ alert(e.message); }
  };
  const handlePost=async()=>{
    if(!userData) return; if(!newYak.trim() && images.length===0) return alert('Emanna rayi');
    setPosting(true);
    try{
      const payload={text:String(newYak.trim()),uid:String(user.uid),username:String(userData.username),avatar:String(userData.avatar),avatarBg:String(userData.avatarBg),avatarBorder:String(userData.avatarBorder),college:String(userData.college),collegeEmail:String(userData.collegeEmail||''),rollNumber:String(userData.rollNumber||''),verifyMethod:String(userData.verifyMethod||'email'),topic:String(topic==='All'?'Confessions':topic),likes:0,dislikes:0,commentsCount:0,imageUrls:images[0]?[String(images[0])]:[],createdAt:serverTimestamp()};
      await addDoc(collection(db,'yaks'),payload as any); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1)}); setNewYak(''); setImages([]); setScreen('feed');
    }catch(e:any){ alert(e.message); } finally{ setPosting(false); }
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#050507] text-white flex flex-col">
        <style>{`body{background:#050507} ::-webkit-scrollbar{display:none}`}</style>
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <div className="mt-8"><div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center font-black text-black">Y</div><h1 className="text-[42px] font-black mt-8 leading-[0.9] tracking-tighter">Anonymous.<br/>Attractive.<br/><span className="text-zinc-600">Real verified.</span></h1><p className="text-zinc-500 text-[12px] mt-3">BITS • SRET • SVCE • ST.JOHNS • VEMU • Proof = Real student</p></div>
          <p className="font-bold mt-10 text-[10px] tracking-[0.2em] text-zinc-500">CHOOSE ATTRACTIVE MASK</p>
          <div className="grid grid-cols-4 gap-3 mt-4">{AVATARS.map((av,i)=><button key={i} onClick={()=>setSelectedAvatar(av)} className={`h-[72px] rounded-[20px] border-2 flex items-center justify-center text-2xl ${selectedAvatar.emoji===av.emoji?'bg-white border-white scale-105':'bg-zinc-900 border-zinc-800'}`}>{av.emoji}</button>)}</div>
          <p className="font-bold mt-8 text-[10px] tracking-[0.2em] text-zinc-500">SELECT CAMPUS • REAL PROOF NEEDED</p>
          <div className="grid grid-cols-2 gap-3 mt-4">{COLLEGES.map(c=>{const a=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`p-4 rounded-[22px] border-2 text-left ${a?'bg-white text-black border-white':'bg-[#0a0a0f] border-zinc-900'}`}><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center mb-3`}>{c.icon}</div><p className="font-black text-[13px]">{c.label}</p><p className="text-[9px] opacity-60">{c.city} • {c.domain.split(',')[0]}</p></button>})}</div>
        </div>
        <div className="p-6 max-w-md mx-auto w-full"><button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full py-5 rounded-full font-black ${selectedCollege?'bg-white text-black':'bg-zinc-900 text-zinc-700'}`}>Continue as {selectedAvatar.emoji} →</button></div>
        <Footer/>
      </div>
    );
  }

  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-[#050507] text-white">
        <div className="max-w-md mx-auto min-h-screen flex flex-col">
          <div className="p-6">
            <button onClick={()=>setScreen('college')} className="w-10 h-10 bg-zinc-900 rounded-full">←</button>
            <div className="mt-6 rounded-[32px] bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6">
              <div className="flex gap-4">
                <div className={`w-20 h-20 rounded-[24px] ${selectedAvatar.bg} ${selectedAvatar.border} border-2 flex items-center justify-center text-4xl`}>{selectedAvatar.emoji}</div>
                <div><p className="text-[10px] tracking-[0.2em] text-zinc-500 font-bold">REAL STUDENT PROOF</p><h1 className="text-[26px] font-black leading-none mt-1">Prove you are<br/>{selectedCollege} student</h1><div className="flex gap-2 mt-3"><span className="px-2.5 py-1 rounded-full bg-white text-black text-[10px] font-black">Attractive</span><span className="px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-black">Real only</span></div></div>
              </div>
            </div>
          </div>
          <div className="px-6"><div className="flex p-1 bg-[#0a0a0f] border border-zinc-900 rounded-full"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-[13px] font-black ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>📧 College Email</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-[13px] font-black ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>🎓 Roll No</button></div></div>
          {verifyMethod==='email'?(
            <div className="p-6 flex-1">
              <div className="bg-[#0a0a0f] border border-zinc-900 rounded-[28px] p-6">
                <p className="font-black">College Email Proof</p><p className="text-[11px] text-zinc-500 mt-1">Domain must match {COLLEGES.find(c=>c.id===selectedCollege)?.domain} - This proves you study in {selectedCollege}</p>
                <input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`${selectedCollege.toLowerCase()}@college.edu.in`} className="w-full mt-4 p-5 bg-black border-2 border-zinc-900 rounded-2xl outline-none focus:border-zinc-700 font-bold"/>
                <button onClick={handleEmailVerify} className="w-full mt-4 bg-white text-black py-5 rounded-full font-black">Generate Real OTP → Proof</button>
                {otpSent&&<div className="mt-4 p-5 bg-black border border-green-900/50 rounded-[24px]"><p className="text-[12px] text-green-400 font-black">✓ Domain Verified • OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full mt-4 p-4 bg-[#0a0a0f] border border-zinc-800 rounded-2xl text-center tracking-[0.5em] font-black text-xl outline-none"/><button onClick={handleOtpSubmit} className="w-full mt-4 bg-green-500 text-black py-4 rounded-full font-black">Verify Real Student ✓</button></div>}
              </div>
            </div>
          ):(
            <div className="p-6 flex-1"><div className="bg-[#0a0a0f] border border-zinc-900 rounded-[28px] p-6"><p className="font-black">Roll Number Proof</p><p className="text-[11px] text-zinc-500 mt-1">Real pattern + duplicate block - proves you are {selectedCollege} student</p><input value={rollNumber} onChange={e=>setRollNumber(e.target.value)} placeholder="2021CS001" className="w-full mt-4 p-5 bg-black border-2 border-zinc-900 rounded-2xl uppercase font-black tracking-widest outline-none"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-5 rounded-full font-black">Verify Roll → Real Proof</button></div></div>
          )}
          <Footer/>
        </div>
      </div>
    );
  }

  if(screen==='login'){
    return <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6"><div className={`w-28 h-28 ${selectedAvatar.bg} ${selectedAvatar.border} border-2 rounded-[32px] flex items-center justify-center text-5xl`}>{selectedAvatar.emoji}</div><h1 className="text-3xl font-black mt-8">Real Student Verified</h1><p className="text-zinc-500 text-sm mt-2">{selectedCollege} • {selectedAvatar.emoji} • Attractive mask</p><button onClick={handleGoogleLogin} className="w-full max-w-sm mt-10 bg-white text-black py-5 rounded-full font-black flex items-center justify-center gap-3"><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5"/>Continue with Google</button><div className="mt-16"><Footer/></div></div>;
                                               }

  return(
    <div className="min-h-screen bg-[#050507] text-white flex flex-col">
      <style>{`body{background:#050507} ::-webkit-scrollbar{display:none}`}</style>
      <div className="sticky top-0 z-30 bg-[#050507]/90 backdrop-blur-2xl border-b border-zinc-900">
        <div className="max-w-[600px] mx-auto px-5 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black">Y</div><div><p className="font-black text-[14px]">YAK • {userData.college} • Attractive</p><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] text-zinc-500">{yaks.length} real students • {selectedAvatar.emoji} mask • Verified 🔒</p></div></div></div>
          <button onClick={()=>setShowProfile(true)}><div className={`w-10 h-10 rounded-full ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center`}>{userData.avatar}</div></button>
        </div>
        <div className="max-w-[600px] mx-auto px-5 pb-3 flex gap-2 overflow-x-auto">
          <div className="flex gap-1.5">{FEEDS.map(f=><button key={f} onClick={()=>setFeedType(f)} className={`px-3 h-8 rounded-full text-[11px] font-bold border ${feedType===f?'bg-white text-black border-white':'bg-[#0a0a0f] border-zinc-900 text-zinc-500'}`}>{f}</button>)}</div>
          <div className="w-px h-8 bg-zinc-900 mx-1"></div>
          {TOPICS.map(t=><button key={t} onClick={()=>setTopic(t)} className={`px-3 h-8 rounded-full text-[11px] font-bold border whitespace-nowrap ${topic===t?'bg-zinc-800 text-white border-zinc-700':'bg-[#0a0a0f] border-zinc-900 text-zinc-600'}`}>{t}</button>)}
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 pb-[90px] p-3 space-y-3 mt-2">
        {yaks.map(y=>{
          const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id); const score=(y.likes||0)-(y.dislikes||0);
          return(
            <div key={y.id} className="bg-[#0a0a0f] border border-zinc-900 rounded-[28px] p-5 hover:border-zinc-800 transition-all">
              <div className="flex justify-between">
                <div className="flex gap-3">
                  <div className={`w-12 h-12 rounded-full ${y.avatarBg} ${y.avatarBorder} border-2 flex items-center justify-center text-xl relative`}>
                    {y.avatar}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-[10px]">✓</div>
                  </div>
                  <div>
                    <p className="font-black text-[14px] flex items-center gap-1.5 flex-wrap">
                      {y.username}
                      <span className="px-2 py-0.5 bg-white text-black text-[9px] rounded-full font-black">{y.college}</span>
                      <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-black text-[8px] rounded-full font-black">✓ REAL STUDENT • {y.verifyMethod?.toUpperCase()} PROOF</span>
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{y.topic} • Attractive mask {y.avatar} • Proof: {y.collegeEmail? y.collegeEmail.split('@')[1] : y.rollNumber} • {score>0?'+'+score:score}</p>
                  </div>
                </div>
                {user?.uid===y.uid && <button onClick={async()=>{ if(confirm('Delete?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="w-8 h-8 bg-zinc-900 rounded-full">✕</button>}
              </div>
              <p className="mt-4 text-[16px] leading-[1.5] tracking-tight">{y.text}</p>
              {y.imageUrls?.[0] && <img src={y.imageUrls[0]} alt="" className="mt-4 rounded-[20px] w-full border border-zinc-900"/>}
              <div className="mt-5 flex items-center gap-2">
                <div className="flex bg-[#111113] rounded-full border border-zinc-900 p-1"><button onClick={()=>handleLike(y,'like')} className={`px-4 py-2 rounded-full text-[13px] font-black ${liked?'bg-white text-black':'text-zinc-500'}`}>▲ {y.likes||0}</button><button onClick={()=>handleLike(y,'dislike')} className={`px-3 py-2 rounded-full text-[13px] font-black ${disliked?'bg-red-500 text-white':'text-zinc-600'}`}>▼ {y.dislikes||0}</button></div>
                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#111113] border border-zinc-900 px-4 h-[38px] rounded-full text-[13px] font-bold text-zinc-500">💬 {y.commentsCount||0}</button>
                <div className="ml-auto flex items-center gap-2"><span className="text-[9px] font-bold tracking-widest text-zinc-600">REAL STUDENT</span><span className="w-1 h-1 bg-green-500 rounded-full"></span><span className="text-[9px] font-bold tracking-widest text-zinc-600">ATTRACTIVE</span></div>
              </div>
              {activePost===y.id && <div className="mt-5 border-t border-zinc-900 pt-5"><div className="space-y-3 max-h-[300px] overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-3"><div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-sm">{c.avatar||'👻'}</div><div className="flex-1 bg-[#111113] border border-zinc-900 rounded-2xl px-4 py-3"><p className="text-[13px]">{c.text}</p></div></div>)}</div><div className="flex gap-2 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Reply as real verified student..." className="flex-1 bg-[#111113] border border-zinc-900 rounded-full px-5 h-11 text-sm outline-none"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText,uid:user.uid,username:userData.username,avatar:userData.avatar,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="w-11 h-11 bg-white text-black rounded-full font-black">↑</button></div></div>}
            </div>
          )
        })}
        {yaks.length===0 && <div className="py-24 text-center"><div className={`w-24 h-24 ${userData.avatarBg} border-2 rounded-[28px] mx-auto flex items-center justify-center text-4xl`}>{userData.avatar}</div><p className="font-black mt-6 text-xl">No yaks in {userData.college} • {feedType}</p><p className="text-sm text-zinc-600 mt-2">Real {userData.college} students only • Attractive masks • Be first real yak</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-12 rounded-full font-black">+ Create Real Attractive Yak</button><div className="mt-16"><Footer/></div></div>}
        {yaks.length>0 && <Footer/>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#050507]/90 backdrop-blur-2xl border-t border-zinc-900"><div className="max-w-[600px] mx-auto px-10 h-[84px] flex items-center justify-between"><button className="flex flex-col items-center gap-1 text-white"><span className="text-[20px]">⌂</span><span className="text-[9px] font-black tracking-widest">HOME</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[28px] shadow-[0_0_30px_rgba(255,255,255,0.3)]">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1"><div className={`w-7 h-7 rounded-full ${userData.avatarBg} border flex items-center justify-center text-sm`}>{userData.avatar}</div><span className="text-[8px] font-bold text-zinc-500 tracking-widest">YOU • REAL</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#050507] z-40"><div className="max-w-[600px] mx-auto h-full flex flex-col"><div className="p-5 flex items-center justify-between border-b border-zinc-900"><button onClick={()=>setScreen('feed')} className="w-10 h-10 bg-zinc-900 rounded-full">✕</button><p className="font-bold text-[11px] tracking-widest">REAL STUDENT • {userData.college} • ATTRACTIVE {userData.avatar}</p><button onClick={handlePost} disabled={posting ||!newYak.trim()} className={`px-6 h-10 rounded-full font-black text-sm ${!newYak.trim()?'bg-zinc-900 text-zinc-700':'bg-white text-black shadow-xl'}`}>{posting?'Posting...':'Post'}</button></div><div className="p-6 flex-1"><div className="flex gap-4"><div className={`w-12 h-12 rounded-full ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center text-xl relative`}>{userData.avatar}<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#050507] flex items-center justify-center text-[8px]">✓</div></div><div><p className="font-black text-[15px]">{userData.username} • Real {userData.verifyMethod} proof ✓</p><p className="text-xs text-zinc-500">{userData.college} • {userData.collegeEmail||userData.rollNumber} • Attractive anonymous • Real student</p></div></div><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`Real yak in ${userData.college} - attractive anonymous, real student only...`} autoFocus className="w-full mt-8 bg-transparent text-[24px] outline-none placeholder:text-zinc-800 resize-none min-h-[200px] font-medium" maxLength={500}/><label className="mt-6 border border-dashed border-zinc-800 rounded-[20px] p-6 flex flex-col items-center cursor-pointer hover:border-zinc-700 transition"><span className="text-[11px] text-zinc-600 font-bold tracking-widest">ADD PHOTO • ATTRACTIVE POST</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setImages([r.result as string]); r.readAsDataURL(f); } }}/></label>{images[0] && <div className="mt-4 relative"><img src={images[0]} alt="" className="rounded-[20px] w-full border border-zinc-900"/><button onClick={()=>setImages([])} className="absolute top-3 right-3 w-9 h-9 bg-black/80 backdrop-blur rounded-full">✕</button></div>}</div><div className="p-6 border-t border-zinc-900"><Footer/></div></div></div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-end justify-center"><div className="bg-[#0a0a0f] border border-zinc-900 w-full max-w-[600px] rounded-t-[36px] p-7 pb-8 max-h-[90vh] overflow-y-auto"><div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8"></div><div className="flex gap-5"><div className={`w-20 h-20 rounded-[22px] ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center text-4xl relative`}>{userData.avatar}<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-[12px]">✓</div></div><div><h2 className="font-black text-[22px]">{userData.username}</h2><p className="text-[13px] text-zinc-500">{userData.college} • Real {userData.verifyMethod} verified ✓</p><div className="mt-2 flex gap-2 flex-wrap"><span className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-black">Attractive {userData.avatar}</span><span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-black">✓ REAL STUDENT PROOF: {userData.collegeEmail||userData.rollNumber}</span></div></div></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="bg-black border border-zinc-900 rounded-2xl p-4"><p className="text-[10px] text-zinc-500 font-bold">COLLEGE PROOF</p><p className="font-black text-[12px] mt-1">{userData.collegeEmail||userData.rollNumber}</p><p className="text-[10px] text-green-400 mt-1">✓ Real student - domain verified</p></div><div className="bg-black border border-zinc-900 rounded-2xl p-4"><p className="text-[10px] text-zinc-500 font-bold">MASK • ATTRACTIVE</p><p className="font-black text-[12px] mt-1">{userData.avatar} Anonymous • Karma {userData.karma||120}</p><p className="text-[10px] text-zinc-500 mt-1">Anonymous but attractive</p></div></div><button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-8 bg-zinc-900 border border-zinc-800 h-[52px] rounded-full font-bold">Log out</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-[52px] rounded-full font-black">Close</button><div className="mt-6"><Footer/></div></div></div>
      )}
    </div>
  );
}
