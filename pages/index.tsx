import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

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
  {id:"BITS", label:"BITS", grad:"from-violet-600 to-indigo-600", icon:"⚡"},
  {id:"SRET", label:"SRET", grad:"from-blue-600 to-cyan-600", icon:"🎓"},
  {id:"SVCE", label:"SVCE", grad:"from-emerald-600 to-teal-600", icon:"🚀"},
  {id:"ST.JOHNS", label:"ST.JOHNS", grad:"from-orange-600 to-red-600", icon:"🔥"},
  {id:"ARTS & SCIENCE", label:"ARTS", grad:"from-pink-600 to-rose-600", icon:"🎨"},
  {id:"VEMU", label:"VEMU", grad:"from-yellow-500 to-orange-600", icon:"💎"},
  {id:"OTHER", label:"OTHER", grad:"from-zinc-700 to-zinc-900", icon:"🌍"},
];
const TOPICS = [
  {name:"All", icon:"🌑"},
  {name:"Confessions", icon:"🤫"},
  {name:"Crushes", icon:"💘"},
  {name:"Memes", icon:"😂"},
  {name:"Hostel", icon:"🏠"},
  {name:"Placements", icon:"💼"},
];
// Attractive avatars with bg
const AVATARS = [
  {emoji:"👻", bg:"bg-zinc-900", border:"border-zinc-800"},
  {emoji:"🔥", bg:"bg-orange-950", border:"border-orange-900"},
  {emoji:"😎", bg:"bg-blue-950", border:"border-blue-900"},
  {emoji:"🤫", bg:"bg-violet-950", border:"border-violet-900"},
  {emoji:"💀", bg:"bg-zinc-900", border:"border-zinc-700"},
  {emoji:"👽", bg:"bg-green-950", border:"border-green-900"},
  {emoji:"🦊", bg:"bg-orange-950", border:"border-orange-900"},
  {emoji:"🐼", bg:"bg-zinc-900", border:"border-zinc-800"},
  {emoji:"🦁", bg:"bg-yellow-950", border:"border-yellow-900"},
  {emoji:"👾", bg:"bg-fuchsia-950", border:"border-fuchsia-900"},
  {emoji:"🥷", bg:"bg-zinc-900", border:"border-zinc-800"},
  {emoji:"🧿", bg:"bg-cyan-950", border:"border-cyan-900"},
];

export default function YakApp(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [yaks,setYaks]=useState<any[]>([]);
  const [topic,setTopic]=useState('All');
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
  const [tab,setTab]=useState('home');

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college');
          if(!col ||!isVerified){ setScreen('college'); return; }
          const username='yak_'+Math.floor(Math.random()*9000+1000);
          const avData=JSON.parse(localStorage.getItem('selected_avatar_data')||JSON.stringify(AVATARS[0]));
          await addDoc(collection(db,'users'),{
            uid:u.uid, email:u.email, username,
            avatar:avData.emoji, avatarBg:avData.bg, avatarBorder:avData.border,
            college:col, verifyMethod:localStorage.getItem('verify_method'),
            verificationStatus:'approved', karma:120, totalPosts:0, likedPosts:[], dislikedPosts:[],
            createdAt:serverTimestamp()
          });
          window.location.reload();
        } else {
          setUserData({id:snap.docs[0].id,...snap.docs[0].data()});
          setScreen('feed');
        }
      } else setScreen('college');
    });
  },[isVerified]);

  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')),s=>{
      let data:any[]=s.docs.map(d=>({id:d.id,...d.data()})).filter((y:any)=>y.college===userData.college);
      if(topic!=='All') data=data.filter((y:any)=>y.topic===topic);
      setYaks(data);
    });
  },[userData,topic]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

  const handleCollegeNext=()=>{
    if(!selectedCollege){ alert('Campus select chey!'); return; }
    localStorage.setItem('selected_college', selectedCollege);
    localStorage.setItem('selected_avatar_data', JSON.stringify(selectedAvatar));
    setScreen('verify');
  };
  const handleEmailVerify=()=>{
    if(collegeEmail.indexOf('@')===-1){ alert('Valid email'); return; }
    const code=Math.floor(100000+Math.random()*900000).toString();
    setGeneratedOtp(code); setOtpSent(true);
    alert('OTP: '+code+' (demo)');
  };
  const handleOtpSubmit=()=>{
    if(otp===generatedOtp){
      localStorage.setItem('college_email', collegeEmail);
      localStorage.setItem('verify_method','email');
      setIsVerified(true); setScreen('login');
    } else alert('Wrong OTP');
  };
  const handleRollVerify=()=>{
    localStorage.setItem('roll_number', rollNumber);
    localStorage.setItem('verify_method','roll');
    setIsVerified(true); setScreen('login');
  };
  const handleGoogleLogin=async()=>{
    try{ await signInWithPopup(auth, provider); }
    catch{ await signInWithRedirect(auth, provider); }
  };
  const handleLike=async(y:any, type:string)=>{
    if(navigator.vibrate) navigator.vibrate(10);
    const liked=userData.likedPosts?.includes(y.id);
    const disliked=userData.dislikedPosts?.includes(y.id);
    try{
      if(type==='like'){
        if(liked){
          await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1)});
          await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id)});
          setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)});
        } else if(disliked){
          await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1), likes:increment(1)});
          await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id), likedPosts:arrayUnion(y.id)});
          setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id), likedPosts:[...userData.likedPosts, y.id]});
        } else {
          await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)});
          await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id)});
          setUserData({...userData, likedPosts:[...(userData.likedPosts||[]), y.id]});
        }
      } else {
        if(disliked){
          await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1)});
          await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id)});
          setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id)});
        } else if(liked){
          await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1), dislikes:increment(1)});
          await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id), dislikedPosts:arrayUnion(y.id)});
          setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id), dislikedPosts:[...userData.dislikedPosts, y.id]});
        } else {
          await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)});
          await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayUnion(y.id)});
          setUserData({...userData, dislikedPosts:[...(userData.dislikedPosts||[]), y.id]});
        }
      }
    }catch(e:any){ alert(e.message); }
  };
  const handlePost=async()=>{
    if(!newYak.trim() && images.length===0){ alert('Emanna rayi'); return; }
    setPosting(true);
    try{
      await addDoc(collection(db,'yaks'),{
        text:newYak.trim(), uid:user.uid, username:userData.username, avatar:userData.avatar, avatarBg:userData.avatarBg||'bg-zinc-900', avatarBorder:userData.avatarBorder||'border-zinc-800',
        college:userData.college, topic:topic==='All'?'Confessions':topic,
        likes:0, dislikes:0, commentsCount:0, imageUrls:images.slice(0,1),
        createdAt:serverTimestamp()
      });
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1)});
      setNewYak(''); setImages([]); setScreen('feed'); setTab('home');
    }catch(e:any){ alert(e.message); } finally{ setPosting(false); }
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#050507] text-white flex flex-col selection:bg-white selection:text-black">
        <style>{`body{background:#050507} ::-webkit-scrollbar{display:none}`}</style>
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <div className="mt-10">
            <div className="flex items-center gap-3"><div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center font-black text-black text-xl">Y</div><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div></div>
            <h1 className="text-[44px] font-black mt-8 leading-[0.9] tracking-tighter">Anonymous.<br/>Campus.<br/><span className="text-zinc-600">Only dark.</span></h1>
            <p className="text-zinc-500 text-[13px] mt-4 leading-relaxed">No light mode. OLED black only. Real yak for {COLLEGES.length} colleges. Verified students only 🔒</p>
          </div>
          <p className="font-bold mt-10 text-[11px] tracking-[0.2em] text-zinc-500">CHOOSE YOUR MASK</p>
          <div className="grid grid-cols-4 gap-3 mt-4">{AVATARS.map((av,i)=><button key={i} onClick={()=>setSelectedAvatar(av)} className={`h-[78px] rounded-[20px] border-2 flex flex-col items-center justify-center gap-1 transition-all ${selectedAvatar.emoji===av.emoji? 'bg-white border-white scale-[1.05] shadow-[0_0_30px_rgba(255,255,255,0.25)]' : av.bg+' '+av.border}`}>{selectedAvatar.emoji===av.emoji? <span className="text-3xl">{av.emoji}</span> : <><span className="text-2xl">{av.emoji}</span><span className="text-[9px] font-bold tracking-widest text-zinc-500">MASK</span></>}</button>)}</div>
          <div className="mt-4 bg-[#0a0a0f] border border-zinc-900 rounded-[20px] p-4 flex items-center gap-4"><div className={`w-12 h-12 rounded-full ${selectedAvatar.bg} ${selectedAvatar.border} border-2 flex items-center justify-center text-2xl`}>{selectedAvatar.emoji}</div><div><p className="font-black text-sm">You will be {selectedAvatar.emoji} yak_{Math.floor(Math.random()*900)} </p><p className="text-[11px] text-zinc-500">Attractive • Anonymous • Dark only</p></div><div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div></div>
          <p className="font-bold mt-8 text-[11px] tracking-[0.2em] text-zinc-500">SELECT CAMPUS • ISOLATED FEED 🔒</p>
          <div className="grid grid-cols-2 gap-3 mt-4">{COLLEGES.map(c=>{const active=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`p-4 rounded-[22px] border-2 text-left transition-all relative overflow-hidden ${active?'bg-white text-black border-white scale-[1.02] shadow-[0_10px_30px_rgba(255,255,255,0.15)]':'bg-[#0a0a0f] border-zinc-900 text-white'}`}><div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${c.grad} opacity-20 blur-[20px] rounded-full`}></div><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-white mb-3 relative`}>{c.icon}</div><p className="font-black text-[13px] relative">{c.label}</p><p className="text-[10px] mt-1 relative opacity-60">{active?'Isolated feed ✓':'Only '+c.label+' posts'}</p></button>})}</div>
        </div>
        <div className="p-6 max-w-md mx-auto w-full sticky bottom-0 bg-[#050507]/80 backdrop-blur-2xl border-t border-zinc-900/50"><button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full py-5 rounded-full font-black text-[15px] tracking-tight transition-all ${selectedCollege?'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-[0.98]':'bg-zinc-900 text-zinc-700 border border-zinc-800'}`}>Continue as {selectedAvatar.emoji} →</button></div>
      </div>
    );
  }

  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-[#050507] text-white p-6">
        <div className="max-w-md mx-auto">
          <button onClick={()=>setScreen('college')} className="w-11 h-11 bg-[#0a0a0f] border border-zinc-900 rounded-full flex items-center justify-center">←</button>
          <div className="mt-8 flex items-center gap-4"><div className={`w-14 h-14 rounded-full ${selectedAvatar.bg} ${selectedAvatar.border} border-2 flex items-center justify-center text-2xl`}>{selectedAvatar.emoji}</div><div><h1 className="text-2xl font-black leading-tight">Verify {selectedCollege}</h1><p className="text-xs text-zinc-500">Attractive mask • Dark mode only • {selectedCollege} isolated</p></div></div>
          <div className="flex gap-2 mt-8 p-1 bg-[#0a0a0f] border border-zinc-900 rounded-full w-fit"><button onClick={()=>setVerifyMethod('email')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>Email</button><button onClick={()=>setVerifyMethod('roll')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>Roll</button></div>
          {verifyMethod==='email' && <div className="mt-8"><p className="text-[13px] text-zinc-500">College email with OTP • instant verify</p><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder="name@college.edu.in" className="w-full mt-4 p-5 bg-[#0a0a0f] border border-zinc-900 rounded-2xl text-base outline-none focus:border-zinc-700 placeholder:text-zinc-700"/><button onClick={handleEmailVerify} className="w-full mt-4 bg-[#0a0a0f] border border-zinc-800 py-5 rounded-full font-bold">Send OTP</button>{otpSent && <div className="mt-5 p-6 bg-white text-black rounded-[24px]"><p className="font-black">OTP sent to {collegeEmail}</p><p className="text-xs opacity-60 mt-1">Demo OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="000000" className="w-full mt-4 p-4 bg-zinc-100 rounded-2xl text-center text-xl tracking-[0.5em] font-black outline-none"/><button onClick={handleOtpSubmit} className="w-full mt-4 bg-black text-white py-4 rounded-full font-bold">Verify ✓</button></div>}</div>}
          {verifyMethod==='roll' && <div className="mt-8"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value)} placeholder="Ex: BITS2021001" className="w-full p-5 bg-[#0a0a0f] border border-zinc-900 rounded-2xl text-base outline-none uppercase placeholder:text-zinc-700"/><button onClick={handleRollVerify} className="w-full mt-6 bg-white text-black py-5 rounded-full font-black">Verify →</button></div>}
        </div>
      </div>
    );
  }

  if(screen==='login'){
    return(
      <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center"><div className={`w-28 h-28 ${selectedAvatar.bg} ${selectedAvatar.border} border-2 rounded-[32px] mx-auto flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(255,255,255,0.1)]`}>{selectedAvatar.emoji}</div><h1 className="text-4xl font-black mt-8 tracking-tighter">Verified.<br/>Dark only.</h1><p className="text-zinc-500 mt-3 text-sm">{selectedCollege} • {selectedAvatar.emoji} attractive mask ready</p><button onClick={handleGoogleLogin} className="w-full mt-12 bg-white text-black py-5 rounded-full font-black flex items-center justify-center gap-3 active:scale-95 transition shadow-[0_0_30px_rgba(255,255,255,0.2)]"><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5"/>Continue as {selectedAvatar.emoji}</button></div>
      </div>
    );
    }

  return(
    <div className="min-h-screen bg-[#050507] text-white selection:bg-white selection:text-black">
      <style>{`body{background:#050507} ::-webkit-scrollbar{display:none}`}</style>
      <div className="sticky top-0 z-30 bg-[#050507]/70 backdrop-blur-2xl border-b border-zinc-900/60">
        <div className="max-w-[600px] mx-auto px-5 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black">Y</div><div><p className="font-black text-[14px] tracking-tight">YAK • {userData.college}</p><div className="flex items-center gap-1.5 -mt-0.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><p className="text-[11px] text-zinc-500">{yaks.length} live • dark only • 🔒 isolated</p></div></div></div>
          <button onClick={()=>setShowProfile(true)} className="relative"><div className={`w-10 h-10 rounded-full ${userData.avatarBg||'bg-zinc-900'} ${userData.avatarBorder||'border-zinc-800'} border-2 flex items-center justify-center text-lg`}>{userData.avatar}</div><div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#050507] rounded-full"></div></button>
        </div>
        <div className="max-w-[600px] mx-auto px-5 pb-4 flex gap-2 overflow-x-auto">{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 h-9 rounded-full text-[13px] font-bold whitespace-nowrap border transition-all ${topic===t.name?'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]':'bg-[#0a0a0f] border-zinc-900 text-zinc-500 hover:border-zinc-800'}`}>{t.icon} {t.name}</button>)}</div>
      </div>

      <div className="max-w-[600px] mx-auto pb-[100px]">
        <div className="p-3 space-y-3 mt-2">
          {yaks.map(y=>{
            const liked=userData.likedPosts?.includes(y.id);
            const disliked=userData.dislikedPosts?.includes(y.id);
            const score=(y.likes||0)-(y.dislikes||0);
            const collegeMeta=COLLEGES.find(c=>c.id===y.college);
            return(
              <div key={y.id} className="bg-[#0a0a0f] border border-zinc-900 rounded-[28px] p-5 hover:border-zinc-800 transition-all group">
                {/* User attractive header */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-3.5">
                    <div className="relative"><div className={`w-11 h-11 rounded-full ${y.avatarBg||'bg-zinc-900'} ${y.avatarBorder||'border-zinc-800'} border-2 flex items-center justify-center text-xl group-hover:scale-105 transition`}>{y.avatar}</div><div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a0a0f] rounded-full flex items-center justify-center"><div className="w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f] animate-pulse"></div></div></div>
                    <div><div className="flex items-center gap-2"><p className="font-black text-[14px] tracking-tight">{y.username}</p><div className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${collegeMeta?.grad||'from-zinc-700 to-zinc-900'} text-[9px] font-black text-white`}>{y.college}</div>{(y.likes||0)>5 && <div className="px-2 py-0.5 rounded-full bg-white text-black text-[9px] font-black">🔥 HOT</div>}</div><div className="flex items-center gap-2 mt-0.5"><p className="text-[11px] text-zinc-500">{new Date(y.createdAt?.seconds? y.createdAt.seconds*1000 : Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {y.topic}</p><div className={`w-1 h-1 rounded-full ${score>0?'bg-green-500':score<0?'bg-red-500':'bg-zinc-700'}`}></div><p className={`text-[11px] font-bold ${score>0?'text-green-400':score<0?'text-red-400':'text-zinc-600'}`}>{score>0?'+'+score:score} karma</p></div></div>
                  </div>
                  {user?.uid===y.uid && <button onClick={async()=>{ if(confirm('Delete this yak?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="w-8 h-8 bg-[#111113] border border-zinc-900 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-400 hover:border-red-900/50">✕</button>}
                </div>

                <p className="mt-4 text-[16.5px] leading-[1.55] tracking-[-0.01em] font-[450]">{y.text}</p>
                {y.imageUrls?.length>0 && <img src={y.imageUrls[0]} alt="" className="mt-4 rounded-[20px] w-full max-h-[420px] object-cover border border-zinc-900"/>}

                {/* Attractive like/dislike dark */}
                <div className="mt-5 flex items-center gap-2.5">
                  <div className="flex items-center bg-[#111113] rounded-full border border-zinc-900 p-1">
                    <button onClick={()=>handleLike(y,'like')} className={`px-4 py-2 rounded-full text-[13px] font-black flex items-center gap-1.5 transition-all ${liked?'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]':'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>▲ {y.likes||0}</button>
                    <button onClick={()=>handleLike(y,'dislike')} className={`px-3 py-2 rounded-full text-[13px] font-black transition-all ${disliked?'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]':'text-zinc-600 hover:text-zinc-300'}`}>▼ {y.dislikes||0}</button>
                  </div>
                  <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="flex items-center gap-2 bg-[#111113] border border-zinc-900 px-4 h-[38px] rounded-full text-[13px] font-bold text-zinc-500 hover:text-white hover:border-zinc-800 transition"><span>💬</span> {y.commentsCount||0}</button>
                  <div className="ml-auto flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${liked?'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]':disliked?'bg-red-500':(y.likes||0)>3?'bg-green-500':'bg-zinc-800'}`}></div><span className="text-[10px] font-bold tracking-widest text-zinc-600">{liked?'YOU LIKED':disliked?'YOU DISLIKED':(y.likes||0)>5?'TRENDING':'NEW'}</span></div>
                </div>
                {((y.likes||0)+(y.dislikes||0))>0 && <div className="mt-3.5 h-[2px] bg-[#111113] rounded-full overflow-hidden flex"><div className="h-full bg-white transition-all duration-500" style={{width: ((y.likes||0)/((y.likes||0)+(y.dislikes||0)))*100+'%'}}></div><div className="h-full bg-red-500/60" style={{width: ((y.dislikes||0)/((y.likes||0)+(y.dislikes||0)))*100+'%'}}></div></div>}

                {activePost===y.id && <div className="mt-5 border-t border-zinc-900 pt-5"><div className="space-y-4 max-h-[300px] overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-3"><div className="w-8 h-8 bg-[#111113] border border-zinc-900 rounded-full flex items-center justify-center text-sm shrink-0">{c.avatar}</div><div className="flex-1"><div className="bg-[#111113] border border-zinc-900 rounded-2xl rounded-tl-md px-4 py-3"><p className="text-[13.5px] leading-snug">{c.text}</p></div><p className="text-[10px] text-zinc-600 mt-1.5 ml-1 font-bold tracking-widest">{c.username} • ANON</p></div></div>)}{comments.length===0 && <p className="text-center text-xs text-zinc-700 py-8">No replies yet - be first to roast 👻</p>}</div><div className="flex gap-3 mt-5 items-center"><div className={`w-9 h-9 rounded-full ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center shrink-0`}>{userData.avatar}</div><div className="flex-1 relative"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Reply as anonymous..." className="w-full bg-[#111113] border border-zinc-900 rounded-full pl-5 pr-12 h-11 text-[14px] outline-none focus:border-zinc-700 placeholder:text-zinc-600"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText, uid:user.uid, username:userData.username, avatar:userData.avatar, createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="absolute right-1 top-1 w-9 h-9 bg-white text-black rounded-full flex items-center justify-center font-black">↑</button></div></div></div>}
              </div>
            )
          })}
          {yaks.length===0 && <div className="py-28 text-center px-6"><div className={`w-24 h-24 ${userData.avatarBg} ${userData.avatarBorder} border-2 rounded-[28px] mx-auto flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(255,255,255,0.08)]`}>{userData.avatar}</div><p className="font-black mt-6 text-xl tracking-tighter">Campus is silent</p><p className="text-sm text-zinc-600 mt-2">No yaks in {userData.college} yet.<br/>Break the silence, {userData.avatar}</p><button onClick={()=>setScreen('create')} className="mt-8 bg-white text-black px-8 h-12 rounded-full font-black text-sm shadow-[0_0_30px_rgba(255,255,255,0.2)]">+ Create first yak</button></div>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#050507]/90 backdrop-blur-2xl border-t border-zinc-900/80">
        <div className="max-w-[600px] mx-auto px-10 h-[86px] flex items-center justify-between">
          <button onClick={()=>setTab('home')} className={`flex flex-col items-center gap-1.5 transition ${tab==='home'?'text-white':'text-zinc-600'}`}><span className="text-[22px]">⌂</span><span className="text-[9px] font-black tracking-[0.15em]">HOME</span></button>
          <button className="flex flex-col items-center gap-1.5 text-zinc-700"><span className="text-[20px]">◍</span><span className="text-[9px] font-black tracking-[0.15em]">HOT</span></button>
          <button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[28px] font-light shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-90 transition">+</button>
          <button className="flex flex-col items-center gap-1.5 text-zinc-700"><span className="text-[20px]">◎</span><span className="text-[9px] font-black tracking-[0.15em]">NEAR</span></button>
          <button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1.5"><div className={`w-7 h-7 rounded-full ${userData.avatarBg} ${userData.avatarBorder} border flex items-center justify-center text-sm`}>{userData.avatar}</div><span className="text-[9px] font-black tracking-[0.15em] text-zinc-600">YOU</span></button>
        </div>
      </div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#050507] z-40">
          <div className="max-w-[600px] mx-auto h-full flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-zinc-900"><button onClick={()=>setScreen('feed')} className="w-10 h-10 bg-[#0a0a0f] border border-zinc-900 rounded-full flex items-center justify-center">✕</button><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="font-bold text-xs tracking-widest">POSTING TO {userData.college} • DARK</p></div><button onClick={handlePost} disabled={posting ||!newYak.trim()} className={`px-6 h-10 rounded-full font-black text-sm transition ${!newYak.trim()?'bg-[#0a0a0f] border border-zinc-900 text-zinc-700':'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95'}`}>{posting?'...':'Post'}</button></div>
            <div className="p-6 flex-1 overflow-y-auto"><div className="flex gap-4"><div className={`w-12 h-12 rounded-full ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center text-xl`}>{userData.avatar}</div><div><p className="font-black text-[15px]">{userData.username} • {userData.avatar} mask</p><p className="text-xs text-zinc-500 mt-0.5">Anonymous • {userData.college} isolated • dark mode only</p></div></div><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's really happening in ${userData.college}? No filter, ${userData.avatar}...`} autoFocus className="w-full mt-8 bg-transparent text-[24px] leading-[1.2] tracking-tight outline-none placeholder:text-zinc-800 resize-none min-h-[220px] font-[450]" maxLength={500}/><div className="mt-6 flex justify-between items-center"><p className="text-xs text-zinc-700">{newYak.length}/500 • dark only</p><div className="flex gap-2">{TOPICS.slice(1,4).map(t=><span key={t.name} className="text-[10px] bg-[#0a0a0f] border border-zinc-900 px-3 py-1 rounded-full text-zinc-600">{t.icon} {t.name}</span>)}</div></div><label className="mt-8 border border-dashed border-zinc-800 rounded-[20px] p-6 flex flex-col items-center cursor-pointer hover:border-zinc-700 transition"><span className="text-2xl">◐</span><span className="text-xs text-zinc-600 mt-2 font-bold tracking-widest">ADD PHOTO • DARK MODE ONLY</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setImages([r.result as string]); r.readAsDataURL(f); } }}/></label>{images[0] && <div className="mt-4 relative"><img src={images[0]} alt="" className="rounded-[20px] w-full border border-zinc-900"/><button onClick={()=>setImages([])} className="absolute top-3 right-3 w-9 h-9 bg-black/80 backdrop-blur rounded-full flex items-center justify-center border border-zinc-800">✕</button></div>}</div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-end justify-center">
          <div className="bg-[#0a0a0f] border border-zinc-900 w-full max-w-[600px] rounded-t-[36px] p-7 pb-12">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8"></div>
            <div className="flex gap-5"><div className={`w-20 h-20 rounded-[22px] ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(255,255,255,0.08)]`}>{userData.avatar}</div><div className="flex-1"><h2 className="font-black text-[22px] tracking-tight">{userData.username}</h2><p className="text-[13px] text-zinc-500 mt-1">{userData.college} • {userData.karma} karma • dark verified ✓</p><div className="flex gap-2 mt-3"><div className="bg-[#111113] border border-zinc-900 px-3.5 py-2 rounded-full flex items-center gap-2"><span className="text-xs">❤️</span><span className="text-xs font-black">{userData.likedPosts?.length||0}</span><span className="text-[10px] text-zinc-600">LIKED</span></div><div className="bg-[#111113] border border-zinc-900 px-3.5 py-2 rounded-full flex items-center gap-2"><span className="text-xs">💬</span><span className="text-xs font-black">{userData.totalPosts||0}</span><span className="text-[10px] text-zinc-600">YAKS</span></div></div></div></div>
            <div className="mt-8 bg-white text-black rounded-[20px] p-5 flex items-center justify-between"><div><p className="font-black text-sm">Attractive dark profile</p><p className="text-xs opacity-60 mt-1">{userData.avatar} mask • {userData.college} isolated • 1 like per user</p></div><div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">✓</div></div>
            <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-[#111113] border border-zinc-900 h-[52px] rounded-full font-bold text-sm">Log out & switch campus</button>
            <button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-[52px] rounded-full font-black text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      }
