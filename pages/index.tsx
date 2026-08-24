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

const COLLEGES = ["BITS","SRET","SVCE","ST.JOHNS","ARTS & SCIENCE","VEMU","OTHER"];
const TOPICS = [
  {name:"Confessions",icon:"🤫",color:"bg-pink-500"},
  {name:"Crushes",icon:"💘",color:"bg-red-500"},
  {name:"Memes",icon:"😂",color:"bg-yellow-500"},
  {name:"Hostel",icon:"🏠",color:"bg-green-500"},
  {name:"Placements",icon:"💼",color:"bg-purple-500"},
  {name:"Academics",icon:"📚",color:"bg-blue-500"},
];
const AVATARS = ["👻","🔥","😎","🤫","💀","👽","🦊","🐼","🦁","👾","🤖","😈"];

export default function YakApp(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [yaks,setYaks]=useState<any[]>([]);
  const [topic,setTopic]=useState('All');
  const [search,setSearch]=useState('');
  const [newYak,setNewYak]=useState('');
  const [images,setImages]=useState<string[]>([]);
  const [poll,setPoll]=useState({q1:'',q2:''});
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [showProfile,setShowProfile]=useState(false);
  const [selectedCollege,setSelectedCollege]=useState('');
  const [selectedAvatar,setSelectedAvatar]=useState('👻');
  const [verifyMethod,setVerifyMethod]=useState('email');
  const [collegeEmail,setCollegeEmail]=useState('');
  const [rollNumber,setRollNumber]=useState('');
  const [idCardImage,setIdCardImage]=useState('');
  const [otp,setOtp]=useState('');
  const [generatedOtp,setGeneratedOtp]=useState('');
  const [otpSent,setOtpSent]=useState(false);
  const [isVerified,setIsVerified]=useState(false);
  const [loginError,setLoginError]=useState('');
  const [posting,setPosting]=useState(false);

  useEffect(()=>{
    const old=localStorage.getItem('selected_college');
    if(old && COLLEGES.indexOf(old)===-1) localStorage.clear();
    getRedirectResult(auth).catch((e:any)=>setLoginError(e.message));
  },[]);

  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college');
          if(!col ||!isVerified){ setScreen('college'); return; }
          const username='Yak_'+Math.floor(Math.random()*9000+1000);
          await addDoc(collection(db,'users'),{
            uid:u.uid, email:u.email, username,
            avatar:localStorage.getItem('selected_avatar')||'👻',
            college:col,
            collegeEmail:localStorage.getItem('college_email')||'',
            rollNumber:localStorage.getItem('roll_number')||'',
            idCardImage:localStorage.getItem('idcard_image')||'',
            verifyMethod:localStorage.getItem('verify_method'),
            verificationStatus: localStorage.getItem('verify_method')==='idcard'?'pending':'approved',
            karma:100, totalPosts:0, likedPosts:[], dislikedPosts:[],
            createdAt:serverTimestamp()
          });
          window.location.reload();
        } else {
          const data:any={id:snap.docs[0].id,...snap.docs[0].data()};
          if(data.verificationStatus==='pending'){ setUserData(data); setScreen('pending'); }
          else { setUserData(data); setScreen('feed'); }
        }
      } else setScreen('college');
    });
  },[isVerified]);

  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')),s=>{
      let data:any[]=s.docs.map(d=>({id:d.id,...d.data()})).filter((y:any)=>y.college===userData.college);
      if(topic!=='All') data=data.filter((y:any)=>y.topic===topic);
      if(search) data=data.filter((y:any)=> y.text?.toLowerCase().includes(search.toLowerCase()));
      setYaks(data);
    });
  },[userData,topic,search]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

  const handleCollegeNext=()=>{
    if(!selectedCollege){ alert('College select chey bro!'); return; }
    localStorage.setItem('selected_college', selectedCollege);
    localStorage.setItem('selected_avatar', selectedAvatar);
    setScreen('verify');
  };

  const handleEmailVerify=()=>{
    if(collegeEmail.indexOf('@')===-1){ alert('Valid email pettu!'); return; }
    const code=Math.floor(100000+Math.random()*900000).toString();
    setGeneratedOtp(code); setOtpSent(true);
    alert('DEMO OTP for '+collegeEmail+': '+code);
  };
  const handleOtpSubmit=()=>{
    if(otp===generatedOtp){
      localStorage.setItem('college_email', collegeEmail);
      localStorage.setItem('verify_method','email');
      setIsVerified(true); setScreen('login');
    } else alert('Wrong OTP! Demo: '+generatedOtp);
  };
  const handleRollVerify=()=>{
    if(rollNumber.length<4){ alert('Valid Roll Number pettu!'); return; }
    localStorage.setItem('roll_number', rollNumber);
    localStorage.setItem('verify_method','roll');
    setIsVerified(true); setScreen('login');
  };
  const handleIdCardVerify=()=>{
    if(!idCardImage){ alert('ID Card upload chey!'); return; }
    localStorage.setItem('idcard_image', idCardImage);
    localStorage.setItem('verify_method','idcard');
    setIsVerified(true); setScreen('login');
  };
  const handleGoogleLogin=async()=>{
    try{ await signInWithPopup(auth, provider); }
    catch(e:any){ try{ await signInWithRedirect(auth, provider); }catch(err:any){ setLoginError(err.message); } }
  };

  const handleLike=async(y:any, type:string)=>{
    if(!userData?.id) return;
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
    if(!user ||!userData?.id){ alert('Login ayyaledu - refresh chey!'); return; }
    if(!newYak.trim() && images.length===0 &&!poll.q1.trim()){ alert('Emanna rayi bro!'); return; }
    setPosting(true);
    try{
      const payload:any={
        text:newYak.trim(),
        uid:user.uid,
        username:userData.username,
        avatar:userData.avatar||'👻',
        college:userData.college,
        topic:topic==='All'?'Memes':topic,
        likes:0, dislikes:0, commentsCount:0,
        imageUrls: images.slice(0,2),
        poll: poll.q1.trim()?{q1:poll.q1.trim(),q2:poll.q2.trim()||'No',v1:0,v2:0,voters:[]}:null,
        createdAt:serverTimestamp()
      };
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), karma:increment(5)});
      setNewYak(''); setImages([]); setPoll({q1:'',q2:''}); setScreen('feed');
    }catch(e:any){ alert('Post failed: '+e.message); }
    finally{ setPosting(false); }
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center"><div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[24px] mx-auto flex items-center justify-center font-black text-black text-3xl">Y</div><h1 className="text-5xl font-black mt-6">YAK<span className="text-yellow-400">.</span></h1><p className="text-zinc-400 text-xs mt-2">BITS • SRET • SVCE • ST.JOHNS • VEMU • Verified</p></div>
          <h2 className="font-bold mt-8">Pick avatar 👇</h2>
          <div className="grid grid-cols-6 gap-2 mt-3">{AVATARS.map(av=><button key={av} onClick={()=>setSelectedAvatar(av)} className={`h-12 rounded-2xl border text-xl flex items-center justify-center ${selectedAvatar===av?'bg-white border-white scale-110':'bg-[#141414] border-zinc-800'}`}>{av}</button>)}</div>
          <h2 className="font-bold mt-6">Select campus 🎓</h2>
          <div className="grid gap-2.5 mt-3">{COLLEGES.map(c=>{const a=selectedCollege===c; return <button key={c} onClick={()=>setSelectedCollege(c)} className={`w-full p-4 rounded-2xl border text-left font-bold flex justify-between ${a?'bg-white text-black':'bg-[#141414] border-zinc-800 text-zinc-300'}`}><span className="flex gap-3"><span className={`w-9 h-9 rounded-xl flex items-center justify-center ${a?'bg-black text-white':'bg-zinc-800'}`}>{c[0]}</span>{c}</span>{a?'✓':''}</button>})}</div>
          <button onClick={handleCollegeNext} className={`w-full mt-6 py-4 rounded-full font-black ${selectedCollege?'bg-yellow-400 text-black':'bg-zinc-800 text-zinc-500'}`}>Verify {selectedCollege||'Campus'} →</button>
        </div>
      </div>
    );
  }

  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <button onClick={()=>setScreen('college')} className="text-zinc-500 text-sm mb-4">← Back</button>
          <h1 className="text-3xl font-black">Verify you are from<br/><span className="text-yellow-400">{selectedCollege}</span> 🎓</h1>
          <div className="flex gap-2 mt-6 p-1.5 bg-[#141414] border border-zinc-800 rounded-full w-fit">
            <button onClick={()=>setVerifyMethod('email')} className={`px-4 py-2 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>📧 Email</button>
            <button onClick={()=>setVerifyMethod('roll')} className={`px-4 py-2 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>🎫 Roll</button>
            <button onClick={()=>setVerifyMethod('idcard')} className={`px-4 py-2 rounded-full text-xs font-bold ${verifyMethod==='idcard'?'bg-white text-black':'text-zinc-500'}`}>🪪 ID Card</button>
          </div>

          {verifyMethod==='email' && (
            <div className="mt-6 bg-[#141414] border border-zinc-800 rounded-[24px] p-5">
              <p className="font-bold text-sm">College Email Verify <span className="ml-2 text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Instant</span></p>
              <input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder="yourname@college.edu.in" className="w-full mt-4 p-4 bg-[#0a0a0a] border border-zinc-800 rounded-2xl text-sm outline-none"/>
              {!otpSent? (
                <button onClick={handleEmailVerify} className="w-full mt-4 bg-white text-black py-4 rounded-full font-bold">Send OTP →</button>
              ) : (
                <div className="mt-4">
                  <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter 6-digit OTP" className="w-full p-4 bg-[#0a0a0a] border border-zinc-800 rounded-2xl text-center tracking-widest"/>
                  <button onClick={handleOtpSubmit} className="w-full mt-3 bg-yellow-400 text-black py-4 rounded-full font-bold">Verify OTP ✓</button>
                  <p className="text-[10px] text-zinc-500 text-center mt-2">Demo OTP: {generatedOtp}</p>
                </div>
              )}
            </div>
          )}

          {verifyMethod==='roll' && (
            <div className="mt-6 bg-[#141414] border border-zinc-800 rounded-[24px] p-5">
              <p className="font-bold text-sm">Roll Number Verify</p>
              <input value={rollNumber} onChange={e=>setRollNumber(e.target.value)} placeholder="Ex: BITS2021001" className="w-full mt-4 p-4 bg-[#0a0a0a] border border-zinc-800 rounded-2xl text-sm uppercase"/>
              <button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-4 rounded-full font-bold">Verify Roll No →</button>
            </div>
          )}

          {verifyMethod==='idcard' && (
            <div className="mt-6 bg-[#141414] border border-zinc-800 rounded-[24px] p-5">
              <p className="font-bold text-sm">ID Card Upload</p>
              <label className="w-full mt-4 border-2 border-dashed border-zinc-800 p-6 rounded-2xl flex flex-col items-center cursor-pointer">
                {idCardImage? <img src={idCardImage} alt="id" className="h-32 rounded-xl"/> : <><span className="text-3xl">📸</span><p className="text-sm text-zinc-400 mt-2">Upload ID Card</p></>}
                <input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setIdCardImage(r.result as string); r.readAsDataURL(f); } }}/>
              </label>
              <button onClick={handleIdCardVerify} disabled={!idCardImage} className={`w-full mt-4 py-4 rounded-full font-bold ${idCardImage?'bg-white text-black':'bg-zinc-800 text-zinc-500'}`}>Submit →</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if(screen==='login'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center"><div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center text-3xl">✓</div><h1 className="text-3xl font-black mt-6">Verified! {selectedCollege}</h1><p className="text-zinc-500 text-sm mt-2">Method: {localStorage.getItem('verify_method')} • Now Google login</p>
          <div className="mt-8 bg-[#141414] border border-zinc-800 rounded-[24px] p-6"><button onClick={handleGoogleLogin} className="w-full bg-white text-black py-4 rounded-full font-bold flex items-center justify-center gap-3"><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="g" className="w-5 h-5"/> Continue with Google</button>{loginError && <p className="text-xs text-red-400 mt-3">{loginError}</p>}</div>
        </div>
      </div>
    );
  }

  if(screen==='pending'){
    return <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center"><div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center text-3xl">⏳</div><h1 className="text-3xl font-black mt-6">Pending Approval</h1><button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="mt-6 bg-zinc-800 px-6 py-3 rounded-full text-sm">Logout</button></div>;
                                }

  return(
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="p-4 flex justify-between items-center max-w-xl mx-auto">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center font-black text-black">Y</div><div><h1 className="font-black text-[14px]">YAK. {userData.college}</h1><p className="text-[10px] text-green-400">✓ {userData.verifyMethod} verified • {yaks.length} yaks • 🔒</p></div></div>
          <button onClick={()=>setShowProfile(true)} className="bg-[#141414] border border-zinc-800 px-3 h-10 rounded-full text-xs font-bold flex items-center gap-2"><div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">{userData.avatar}</div>{userData.username}</button>
        </div>
        <div className="px-4 pb-3 max-w-xl mx-auto"><div className="flex gap-2 overflow-x-auto"><button onClick={()=>setTopic('All')} className={`px-5 py-2.5 rounded-full text-xs font-bold border ${topic==='All'?'bg-white text-black':'bg-[#141414] border-zinc-800 text-zinc-400'}`}>All ({yaks.length})</button>{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap ${topic===t.name?'bg-yellow-400 text-black':'bg-[#141414] border-zinc-800 text-zinc-500'}`}>{t.icon} {t.name}</button>)}</div><div className="relative mt-3"><span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search in ${userData.college}...`} className="w-full bg-[#141414] border border-zinc-800 rounded-full pl-11 pr-4 py-3 text-sm outline-none"/></div></div>
      </div>

      <div className="max-w-xl mx-auto p-3 space-y-4 mt-2">
        {yaks.map(y=>{
          const liked=userData.likedPosts?.includes(y.id);
          const disliked=userData.dislikedPosts?.includes(y.id);
          const score=(y.likes||0)-(y.dislikes||0);
          const total=(y.poll?.v1||0)+(y.poll?.v2||0);
          const isOwner=user?.uid===y.uid;
          return(
            <div key={y.id} className="bg-[#141414] border border-zinc-800 rounded-[28px] p-5">
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center"><div className="w-10 h-10 bg-[#1f1f1f] border border-zinc-800 rounded-full flex items-center justify-center text-lg">{y.avatar||'👻'}</div><div><p className="text-[13px] font-black flex items-center gap-2">{y.username} {isOwner && <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[9px]">YOU</span>} <span className={`text-[9px] px-2.5 py-1 rounded-full ${TOPICS.find(t=>t.name===y.topic)?.color||'bg-zinc-700'} text-white font-bold`}>{y.topic}</span></p><p className="text-[11px] text-zinc-500">{y.college} • {score>0?'+'+score:score} karma</p></div></div>
                {isOwner && <button onClick={async()=>{ if(confirm('Delete?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-full text-xs">🗑️</button>}
              </div>
              {y.text && <p className="mt-4 text-[16px] leading-[1.6] whitespace-pre-wrap">{y.text}</p>}
              {y.imageUrls?.length>0 && <div className="grid grid-cols-2 gap-2 mt-4">{y.imageUrls.map((im:string,i:number)=><img key={i} src={im} alt="yak" className="rounded-[20px] w-full max-h-80 object-cover border border-zinc-800"/>)}</div>}
              {y.poll && <div className="mt-4 space-y-2">{[{q:y.poll.q1,v:y.poll.v1},{q:y.poll.q2,v:y.poll.v2}].map((opt,idx)=><button key={idx} onClick={async()=>{ if(y.poll.voters?.includes(user.uid)) return; await updateDoc(doc(db,'yaks',y.id),{[idx===0?'poll.v1':'poll.v2']:increment(1),'poll.voters':arrayUnion(user.uid)}); }} className="w-full bg-[#1f1f1f] border border-zinc-800 p-4 rounded-2xl text-left relative overflow-hidden"><div className="absolute inset-0 bg-yellow-400/10" style={{width: total? (opt.v/total)*100+'%' : '0%'}}></div><div className="relative flex justify-between"><p className="font-bold text-sm">{opt.q}</p><span className="bg-zinc-800 px-3 py-1 rounded-full text-xs font-black">{opt.v||0}</span></div></button>)}<p className="text-[11px] text-zinc-500">{total} votes</p></div>}

              <div className="flex items-center gap-2 mt-5">
                <div className="flex bg-[#1f1f1f] rounded-full border border-zinc-800 overflow-hidden">
                  <button onClick={()=>handleLike(y,'like')} className={`px-5 py-2.5 text-sm font-black flex items-center gap-1.5 ${liked?'bg-white text-black':'hover:bg-zinc-800 text-zinc-300'}`}>❤️ {y.likes||0}</button>
                  <div className="w-px bg-zinc-800"></div>
                  <button onClick={()=>handleLike(y,'dislike')} className={`px-5 py-2.5 text-sm font-black flex items-center gap-1.5 ${disliked?'bg-red-500 text-white':'hover:bg-zinc-800 text-zinc-400'}`}>💔 {y.dislikes||0}</button>
                </div>
                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#1f1f1f] border border-zinc-800 px-4 py-2.5 rounded-full text-sm font-bold">💬 {y.commentsCount||0}</button>
              </div>
              {activePost===y.id && <div className="mt-4 pt-4 border-t border-zinc-800"><div className="space-y-3 max-h-64 overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-2.5"><div className="w-8 h-8 bg-[#1f1f1f] border border-zinc-800 rounded-full flex items-center justify-center text-sm">{c.avatar||'👻'}</div><div className="bg-[#1f1f1f] border border-zinc-800 rounded-2xl px-4 py-2.5 flex-1"><p className="text-[13px]">{c.text}</p></div><button onClick={async()=>{ await deleteDoc(doc(db,'yaks/'+y.id+'/comments/'+c.id)); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(-1)}); }} className="text-[11px]">✕</button></div>)}</div><div className="flex gap-2 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment..." className="flex-1 bg-[#1f1f1f] border border-zinc-800 rounded-full px-4 py-3 text-sm outline-none"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText,uid:user.uid,username:userData.username,avatar:userData.avatar,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="bg-yellow-400 text-black w-11 h-11 rounded-full font-black">↑</button></div></div>}
            </div>
          )
        })}
        {yaks.length===0 && <div className="text-center py-20 bg-[#141414] border border-dashed border-zinc-800 rounded-[28px]"><p className="text-5xl">{userData.avatar}</p><p className="font-black mt-4">No yaks yet in {userData.college}</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-6 py-3 rounded-full font-bold text-sm">+ Create First Yak</button></div>}
      </div>

      <button onClick={()=>setScreen('create')} className="fixed bottom-6 right-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-black w-14 h-14 rounded-full text-2xl font-black shadow-2xl">+</button>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-30 p-4 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-[#1f1f1f] border border-zinc-800 rounded-full flex items-center justify-center">{userData.avatar}</div><div><h2 className="font-black">New Yak</h2><p className="text-xs text-zinc-500">{userData.college} • Verified {userData.verifyMethod} 🔒</p></div></div><button onClick={()=>{setScreen('feed'); setNewYak(''); setImages([]);}} className="w-10 h-10 bg-[#1a1a1a] border border-zinc-800 rounded-full">✕</button></div>
            <div className="flex gap-2 mt-6 overflow-x-auto">{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap ${topic===t.name?'bg-yellow-400 text-black':'bg-[#1a1a1a] border-zinc-800 text-zinc-500'}`}>{t.icon} {t.name}</button>)}</div>
            <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}?`} className="w-full h-36 mt-6 p-5 bg-[#141414] border border-zinc-800 rounded-[24px] outline-none text-[16px] resize-none" maxLength={500}/>
            <div className="grid grid-cols-2 gap-3 mt-4"><input value={poll.q1} onChange={e=>setPoll({...poll,q1:e.target.value})} placeholder="Poll A" className="p-4 bg-[#141414] border border-zinc-800 rounded-2xl text-sm"/><input value={poll.q2} onChange={e=>setPoll({...poll,q2:e.target.value})} placeholder="Poll B" className="p-4 bg-[#141414] border border-zinc-800 rounded-2xl text-sm"/></div>
            <label className="w-full mt-4 border-2 border-dashed border-zinc-800 p-5 rounded-[24px] flex flex-col items-center text-sm text-zinc-500 bg-[#141414] cursor-pointer">🖼️ Add Photos (max 2)<input type="file" multiple hidden accept="image/*" onChange={e=>{ const files=Array.from(e.target.files||[]).slice(0,2); files.forEach((f:any)=>{ const r=new FileReader(); r.onloadend=()=>setImages(p=>[...p,r.result as string].slice(0,2)); r.readAsDataURL(f); }); }}/></label>
            {images.length>0 && <div className="grid grid-cols-2 gap-2 mt-3">{images.map((im,i)=><div key={i} className="relative"><img src={im} alt="up" className="h-32 rounded-xl object-cover w-full border border-zinc-800"/><button onClick={()=>setImages(images.filter((_,idx)=>idx!==i))} className="absolute -top-2 -right-2 bg-red-500 w-7 h-7 rounded-full text-xs font-bold">x</button></div>)}</div>}
            <button onClick={handlePost} disabled={posting} className={`w-full mt-8 p-4 rounded-full font-black text-lg ${posting?'bg-zinc-800 text-zinc-500':'bg-white text-black'}`}>{posting?'Posting...':'Post to '+userData.college+' 🚀'}</button>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#141414] border border-zinc-800 w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6">
            <div className="flex items-center gap-4"><div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[20px] flex items-center justify-center text-3xl">{userData.avatar}</div><div><h2 className="font-black text-lg">{userData.username}</h2><p className="text-xs text-zinc-500">{userData.college} • {userData.verifyMethod} ✓</p></div></div>
            <div className="grid grid-cols-3 gap-2 mt-6"><div className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-center"><p className="text-xl font-black">{userData.likedPosts?.length||0}</p><p className="text-[9px] text-zinc-500 font-bold">LIKED</p></div><div className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-center"><p className="text-xl font-black">{userData.totalPosts||0}</p><p className="text-[9px] text-zinc-500 font-bold">YAKS</p></div><div className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-center"><p className="text-xl font-black text-red-400">{userData.dislikedPosts?.length||0}</p><p className="text-[9px] text-zinc-500 font-bold">DISLIKED</p></div></div>
            <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-[#1f1f1f] border border-zinc-800 p-3.5 rounded-full text-sm font-bold">Logout & Switch Campus</button>
          </div>
        </div>
      )}
    </div>
  );
                                                                                                                                                                        }
