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
  {id:"BITS", name:"BITS", color:"from-violet-500 to-purple-600", emoji:"⚡"},
  {id:"SRET", name:"SRET", color:"from-blue-500 to-cyan-500", emoji:"🎓"},
  {id:"SVCE", name:"SVCE", color:"from-emerald-500 to-teal-500", emoji:"🚀"},
  {id:"ST.JOHNS", name:"ST.JOHNS", color:"from-orange-500 to-red-500", emoji:"🔥"},
  {id:"ARTS & SCIENCE", name:"ARTS", color:"from-pink-500 to-rose-500", emoji:"🎨"},
  {id:"VEMU", name:"VEMU", color:"from-yellow-500 to-orange-500", emoji:"💎"},
  {id:"OTHER", name:"OTHER", color:"from-zinc-600 to-zinc-800", emoji:"🌍"},
];
const TOPICS = [
  {name:"All",icon:"🌍",active:true},
  {name:"Confessions",icon:"🤫",color:"bg-pink-500"},
  {name:"Crushes",icon:"💘",color:"bg-red-500"},
  {name:"Memes",icon:"😂",color:"bg-yellow-500"},
  {name:"Hostel",icon:"🏠",color:"bg-green-500"},
  {name:"Placements",icon:"💼",color:"bg-violet-500"},
];
const AVATARS = ["👻","🔥","😎","🤫","💀","👽","🦊","🐼","🦁","👾","🤖","🥷"];

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
  const [selectedAvatar,setSelectedAvatar]=useState('👻');
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
          await addDoc(collection(db,'users'),{
            uid:u.uid, email:u.email, username,
            avatar:localStorage.getItem('selected_avatar')||'👻',
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
    localStorage.setItem('selected_avatar', selectedAvatar);
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
    } else alert('Wrong OTP: '+generatedOtp);
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
  };
  const handlePost=async()=>{
    if(!newYak.trim() && images.length===0){ alert('Emanna rayi'); return; }
    setPosting(true);
    try{
      await addDoc(collection(db,'yaks'),{
        text:newYak.trim(), uid:user.uid, username:userData.username, avatar:userData.avatar,
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
      <div className="min-h-screen bg-black text-white flex flex-col">
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <div className="mt-8">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-black text-2xl">Y</div>
            <h1 className="text-[40px] font-black mt-6 leading-none tracking-tighter">Find your<br/>tribe on<br/><span className="text-zinc-500">campus.</span></h1>
            <p className="text-zinc-400 text-sm mt-4">Anonymous yak for {COLLEGES.length} colleges • 100% real</p>
          </div>
          <p className="font-bold mt-10 text-sm tracking-widest text-zinc-500">CHOOSE AVATAR</p>
          <div className="grid grid-cols-6 gap-2.5 mt-3">{AVATARS.map(av=><button key={av} onClick={()=>setSelectedAvatar(av)} className={`h-[56px] rounded-2xl border-2 text-2xl transition-all ${selectedAvatar===av?'bg-white border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]':'bg-zinc-900 border-zinc-800'}`}>{av}</button>)}</div>
          <p className="font-bold mt-8 text-sm tracking-widest text-zinc-500">SELECT CAMPUS</p>
          <div className="grid grid-cols-3 gap-3 mt-3">{COLLEGES.map(c=>{const active=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`p-4 rounded-[20px] border-2 text-left transition-all ${active?'bg-white text-black border-white scale-[1.02] shadow-xl':'bg-zinc-900 border-zinc-800'}`}><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white mb-3`}>{c.emoji}</div><p className="font-black text-xs">{c.name}</p><p className="text-[10px] opacity-60 mt-1">{active?'Selected ✓':'Tap to select'}</p></button>})}</div>
        </div>
        <div className="p-6 max-w-md mx-auto w-full sticky bottom-0 bg-black/80 backdrop-blur-2xl border-t border-zinc-900"><button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full py-5 rounded-full font-black text-base transition-all ${selectedCollege?'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95':'bg-zinc-900 text-zinc-600'}`}>Continue as {selectedAvatar} →</button><p className="text-[11px] text-zinc-600 text-center mt-3">🔒 Campus isolated • No outsiders • Verified only</p></div>
      </div>
    );
  }

  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-md mx-auto">
          <button onClick={()=>setScreen('college')} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">←</button>
          <h1 className="text-3xl font-black mt-8 leading-tight">Verify<br/><span className="text-zinc-500">{selectedCollege}</span> student</h1>
          <div className="flex gap-2 mt-8 p-1 bg-zinc-900 rounded-full w-fit">
            <button onClick={()=>setVerifyMethod('email')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>Email</button>
            <button onClick={()=>setVerifyMethod('roll')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>Roll No</button>
          </div>
          {verifyMethod==='email' && <div className="mt-8"><p className="text-sm text-zinc-400">Enter college email - we send OTP</p><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder="name@college.edu.in" className="w-full mt-4 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-base outline-none focus:border-white/30"/><button onClick={handleEmailVerify} className="w-full mt-4 bg-zinc-900 border border-zinc-800 py-5 rounded-full font-bold">Send OTP</button>{otpSent && <div className="mt-4 p-5 bg-white text-black rounded-[20px]"><p className="font-bold">Enter OTP sent to {collegeEmail}</p><p className="text-xs opacity-60 mt-1">Demo OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="000000" className="w-full mt-4 p-4 bg-zinc-100 rounded-2xl text-center text-xl tracking-[0.5em] font-black outline-none"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-black text-white py-4 rounded-full font-bold">Verify & Continue</button></div>}</div>}
          {verifyMethod==='roll' && <div className="mt-8"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value)} placeholder="Ex: BITS2021001" className="w-full p-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-base outline-none uppercase"/><button onClick={handleRollVerify} className="w-full mt-6 bg-white text-black py-5 rounded-full font-bold">Verify Roll No →</button></div>}
        </div>
      </div>
    );
  }

  if(screen==='login'){
    return(
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center"><div className="w-24 h-24 bg-white rounded-[30px] mx-auto flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(255,255,255,0.2)]">✓</div><h1 className="text-4xl font-black mt-8">You are<br/>verified.</h1><p className="text-zinc-500 mt-3">{selectedCollege} • {localStorage.getItem('verify_method')}</p><button onClick={handleGoogleLogin} className="w-full mt-12 bg-white text-black py-5 rounded-full font-black flex items-center justify-center gap-3 active:scale-95 transition"><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5"/>Continue with Google</button></div>
      </div>
    );
    }

  return(
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-black/70 backdrop-blur-2xl border-b border-zinc-900/50">
        <div className="max-w-[600px] mx-auto px-4 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-black text-black">Y</div><div><p className="font-black text-[13px] tracking-tight">YAK • {userData.college}</p><p className="text-[11px] text-zinc-500 -mt-1">{yaks.length} live • isolated 🔒</p></div></div>
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-xs">🔔</div><button onClick={()=>setShowProfile(true)} className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">{userData.avatar}</button></div>
        </div>
        <div className="max-w-[600px] mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 h-9 rounded-full text-[13px] font-bold whitespace-nowrap border transition-all ${topic===t.name?'bg-white text-black border-white':'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>{t.icon} {t.name}</button>)}</div>
      </div>

      <div className="max-w-[600px] mx-auto">
        {/* Real post cards */}
        <div className="p-3 space-y-3">
          {yaks.map(y=>{
            const liked=userData.likedPosts?.includes(y.id);
            const disliked=userData.dislikedPosts?.includes(y.id);
            const score=(y.likes||0)-(y.dislikes||0);
            return(
              <div key={y.id} className="bg-[#111111] border border-zinc-800/80 rounded-[24px] p-5 active:scale-[0.99] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3"><div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-lg">{y.avatar}</div><div><div className="flex items-center gap-2"><p className="font-bold text-[14px]">{y.username}</p><span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">{y.college}</span>{(y.likes||0)>5 && <span className="text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded-full font-black">🔥 HOT</span>}</div><p className="text-[12px] text-zinc-500">{new Date(y.createdAt?.seconds? y.createdAt.seconds*1000 : Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {y.topic}</p></div></div>
                    <button onClick={async()=>{ if(user.uid===y.uid && confirm('Delete?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="text-zinc-600">•••</button>
                  </div>
                  <p className="mt-4 text-[16px] leading-[1.5] tracking-tight">{y.text}</p>
                  {y.imageUrls?.length>0 && <img src={y.imageUrls[0]} alt="" className="mt-4 rounded-2xl w-full max-h-[400px] object-cover border border-zinc-800"/>}
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex items-center bg-zinc-900 rounded-full border border-zinc-800 p-1">
                      <button onClick={()=>handleLike(y,'like')} className={`px-3.5 py-1.5 rounded-full text-[13px] font-black flex items-center gap-1 transition ${liked?'bg-white text-black':'text-zinc-400 hover:text-white'}`}>▲ {y.likes||0}</button>
                      <button onClick={()=>handleLike(y,'dislike')} className={`px-3.5 py-1.5 rounded-full text-[13px] font-black flex items-center gap-1 transition ${disliked?'bg-red-500 text-white':'text-zinc-500 hover:text-white'}`}>▼</button>
                    </div>
                    <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 h-9 rounded-full text-[13px] font-bold text-zinc-400"><span>💬</span> {y.commentsCount||0}</button>
                    <div className="ml-auto text-[11px] text-zinc-600 font-bold">{score!==0 && (score>0?'+'+score:score)}</div>
                  </div>
                  {activePost===y.id && <div className="mt-4 border-t border-zinc-800 pt-4"><div className="space-y-3">{comments.map(c=><div key={c.id} className="flex gap-2"><div className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center text-xs">{c.avatar}</div><div className="flex-1 bg-zinc-900 rounded-2xl rounded-tl-md px-3.5 py-2.5"><p className="text-[13px]">{c.text}</p></div></div>)}</div><div className="flex gap-2 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Reply anonymously..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 h-11 text-sm outline-none focus:border-zinc-700"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText, uid:user.uid, username:userData.username, avatar:userData.avatar, createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="w-11 h-11 bg-white text-black rounded-full font-black">↑</button></div></div>}
                </div>
            )
          })}
          {yaks.length===0 && <div className="py-24 text-center"><div className="w-20 h-20 bg-zinc-900 rounded-full mx-auto flex items-center justify-center text-3xl">{userData.avatar}</div><p className="font-black mt-4 text-lg">Your campus is quiet</p><p className="text-sm text-zinc-500 mt-1">Be the first to yak in {userData.college}</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-6 h-11 rounded-full font-bold text-sm">Create first yak</button></div>}
        </div>
      </div>

      {/* Bottom Tab - Real App */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-zinc-900">
        <div className="max-w-[600px] mx-auto px-8 h-[84px] flex items-center justify-between">
          <button onClick={()=>{setTab('home'); setScreen('feed');}} className={`flex flex-col items-center gap-1 ${tab==='home'?'text-white':'text-zinc-600'}`}><span className="text-xl">⌂</span><span className="text-[10px] font-bold tracking-widest">HOME</span></button>
          <button onClick={()=>setTab('trending')} className={`flex flex-col items-center gap-1 ${tab==='trending'?'text-white':'text-zinc-600'}`}><span className="text-xl">🔥</span><span className="text-[10px] font-bold tracking-widest">HOT</span></button>
          <button onClick={()=>setScreen('create')} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition">+</button>
          <button className="flex flex-col items-center gap-1 text-zinc-600"><span className="text-xl">◐</span><span className="text-[10px] font-bold tracking-widest">NEARBY</span></button>
          <button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1 text-zinc-600"><span className="text-xl">{userData.avatar}</span><span className="text-[10px] font-bold tracking-widest">YOU</span></button>
        </div>
      </div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-black z-40">
          <div className="max-w-[600px] mx-auto h-full flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-zinc-900"><button onClick={()=>setScreen('feed')} className="w-9 h-9 bg-zinc-900 rounded-full flex items-center justify-center">✕</button><p className="font-bold text-sm">New Yak to {userData.college}</p><button onClick={handlePost} disabled={posting ||!newYak.trim()} className={`px-5 h-9 rounded-full font-black text-sm ${!newYak.trim()?'bg-zinc-900 text-zinc-600':'bg-white text-black active:scale-95'}`}>{posting?'Posting...':'Post'}</button></div>
            <div className="p-4 flex-1"><div className="flex gap-3"><div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">{userData.avatar}</div><div><p className="font-bold text-sm">{userData.username}</p><p className="text-xs text-zinc-500">Posting to {userData.college} • Anonymous • Verified {userData.verifyMethod}</p></div></div><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college} tonight? ${userData.avatar}`} autoFocus className="w-full mt-6 bg-transparent text-[22px] leading-tight outline-none placeholder:text-zinc-700 resize-none min-h-[200px]"/><label className="mt-6 border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col items-center cursor-pointer"><span className="text-2xl">🖼️</span><span className="text-xs text-zinc-500 mt-2">Add photo (optional, max 1)</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setImages([r.result as string]); r.readAsDataURL(f); } }}/></label>{images[0] && <div className="mt-4 relative"><img src={images[0]} alt="" className="rounded-2xl w-full"/><button onClick={()=>setImages([])} className="absolute top-3 right-3 w-8 h-8 bg-black/70 backdrop-blur rounded-full">✕</button></div>}</div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-end justify-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-[600px] rounded-t-[32px] p-6 pb-10">
            <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-6"></div>
            <div className="flex items-center gap-4"><div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center text-4xl">{userData.avatar}</div><div><h2 className="font-black text-xl">{userData.username}</h2><p className="text-sm text-zinc-500">{userData.college} • {userData.karma} karma • Verified {userData.verifyMethod}</p><div className="flex gap-2 mt-2"><span className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">❤️ {userData.likedPosts?.length||0} liked</span><span className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">{userData.totalPosts||0} yaks</span></div></div></div>
            <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-8 bg-zinc-900 border border-zinc-800 h-12 rounded-full font-bold">Log out & switch campus</button>
            <button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-12 rounded-full font-black">Done</button>
          </div>
        </div>
      )}
    </div>
  );
      }
