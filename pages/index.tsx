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
const TOPICS = [{name:"All",icon:"🌑"},{name:"Confessions",icon:"🤫"},{name:"Crushes",icon:"💘"},{name:"Memes",icon:"😂"},{name:"Hostel",icon:"🏠"},{name:"Placements",icon:"💼"}];
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

  useEffect(()=>{
    const old=localStorage.getItem('selected_college');
    if(old && old.includes('JNTU')){ localStorage.clear(); }
    getRedirectResult(auth).catch(()=>{});
  },[]);

  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college');
          if(!col ||!isVerified){ setScreen('college'); return; }
          if(col.includes('JNTU')){ localStorage.clear(); setScreen('college'); return; }
          const username='Yak_'+Math.floor(Math.random()*9000+1000);
          let avData:any=AVATARS[0];
          try{ const s=localStorage.getItem('selected_avatar_data'); if(s) avData=JSON.parse(s); }catch{ avData=AVATARS[0]; }
          if(!avData ||!avData.emoji) avData=AVATARS[0];
          await addDoc(collection(db,'users'),{
            uid:u.uid, email:u.email, username,
            avatar: avData.emoji,
            avatarBg: avData.bg,
            avatarBorder: avData.border,
            college: col,
            verifyMethod: localStorage.getItem('verify_method')||'email',
            verificationStatus:'approved',
            karma:120, totalPosts:0, likedPosts:[], dislikedPosts:[],
            createdAt:serverTimestamp()
          });
          window.location.reload();
        } else {
          let raw:any={id:snap.docs[0].id,...snap.docs[0].data()};
          if(!raw.avatar || raw.college?.includes('JNTU')){
            if(raw.college?.includes('JNTU')){ await deleteDoc(doc(db,'users',raw.id)); localStorage.clear(); window.location.reload(); return; }
            raw.avatar='👻'; raw.avatarBg='bg-zinc-900'; raw.avatarBorder='border-zinc-800';
            await updateDoc(doc(db,'users',raw.id),{avatar:'👻',avatarBg:'bg-zinc-900',avatarBorder:'border-zinc-800'});
          }
          setUserData(raw);
          setScreen('feed');
        }
      } else setScreen('college');
    });
  },[isVerified]);

  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')),s=>{
      let data:any[]=s.docs.map(d=>({id:d.id,...d.data()}));
      data=data.filter((y:any)=> y.college===userData.college &&!y.college?.includes('JNTU'));
      if(topic!=='All') data=data.filter((y:any)=>y.topic===topic);
      setYaks(data);
    });
  },[userData,topic]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

  const handleCollegeNext=()=>{
    if(!selectedCollege) return alert('Campus select chey');
    localStorage.setItem('selected_college', selectedCollege);
    localStorage.setItem('selected_avatar_data', JSON.stringify(selectedAvatar));
    setScreen('verify');
  };
  const handleEmailVerify=()=>{
    if(collegeEmail.indexOf('@')===-1) return alert('Valid email');
    const code=Math.floor(100000+Math.random()*900000).toString();
    setGeneratedOtp(code); setOtpSent(true); alert('OTP: '+code);
  };
  const handleOtpSubmit=()=>{
    if(otp===generatedOtp){
      localStorage.setItem('college_email', collegeEmail);
      localStorage.setItem('verify_method','email');
      setIsVerified(true); setScreen('login');
    } else alert('Wrong OTP: '+generatedOtp);
  };
  const handleRollVerify=()=>{
    if(!rollNumber) return alert('Roll enter chey');
    localStorage.setItem('roll_number', rollNumber);
    localStorage.setItem('verify_method','roll');
    setIsVerified(true); setScreen('login');
  };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth, provider);}catch{ await signInWithRedirect(auth, provider);} };

  const handleLike=async(y:any, type:string)=>{
    if(navigator.vibrate) navigator.vibrate(10);
    const liked=userData.likedPosts?.includes(y.id);
    const disliked=userData.dislikedPosts?.includes(y.id);
    try{
      if(type==='like'){
        if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id)}); setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)}); }
        else if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1), likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id), likedPosts:arrayUnion(y.id)}); setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id), likedPosts:[...userData.likedPosts, y.id]}); }
        else{ await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id)}); setUserData({...userData, likedPosts:[...(userData.likedPosts||[]), y.id]}); }
      }else{
        if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id)}); setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id)}); }
        else if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1), dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id), dislikedPosts:arrayUnion(y.id)}); setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id), dislikedPosts:[...userData.dislikedPosts, y.id]}); }
        else{ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayUnion(y.id)}); setUserData({...userData, dislikedPosts:[...(userData.dislikedPosts||[]), y.id]}); }
      }
    }catch(e:any){ alert(e.message); }
  };

  const handlePost=async()=>{
    if(!user ||!userData) return alert('Refresh chey');
    if(!newYak.trim() && images.length===0) return alert('Emanna rayi');
    setPosting(true);
    try{
      const payload={
        text: String(newYak.trim()),
        uid: String(user.uid),
        username: String(userData.username || 'Yak'),
        avatar: String(userData.avatar || selectedAvatar.emoji || '👻'),
        avatarBg: String(userData.avatarBg || selectedAvatar.bg || 'bg-zinc-900'),
        avatarBorder: String(userData.avatarBorder || selectedAvatar.border || 'border-zinc-800'),
        college: String(userData.college || selectedCollege),
        topic: String(topic==='All'?'Confessions':topic),
        likes: 0, dislikes: 0, commentsCount: 0,
        imageUrls: images.length>0 && images[0]? [String(images[0])] : [],
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db,'yaks'), payload as any);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1)});
      setNewYak(''); setImages([]); setScreen('feed');
    }catch(e:any){ alert('Post failed: '+e.message); }
    finally{ setPosting(false); }
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#050507] text-white flex flex-col">
        <style>{`body{background:#050507} ::-webkit-scrollbar{display:none}`}</style>
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <div className="mt-10"><div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center font-black text-black text-xl">Y</div><h1 className="text-[44px] font-black mt-8 leading-[0.9] tracking-tighter">Anonymous.<br/>Campus.<br/><span className="text-zinc-600">Dark only.</span></h1><p className="text-zinc-500 text-[13px] mt-4">BITS • SRET • SVCE • ST.JOHNS • VEMU • OTHER</p></div>
          <p className="font-bold mt-10 text-[11px] tracking-[0.2em] text-zinc-500">CHOOSE MASK</p>
          <div className="grid grid-cols-4 gap-3 mt-4">{AVATARS.map((av,i)=><button key={i} onClick={()=>setSelectedAvatar(av)} className={`h-[78px] rounded-[20px] border-2 flex items-center justify-center text-2xl ${selectedAvatar.emoji===av.emoji?'bg-white border-white scale-105':'bg-zinc-900 border-zinc-800'}`}>{av.emoji}</button>)}</div>
          <p className="font-bold mt-8 text-[11px] tracking-[0.2em] text-zinc-500">SELECT CAMPUS</p>
          <div className="grid grid-cols-2 gap-3 mt-4">{COLLEGES.map(c=>{const a=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`p-4 rounded-[22px] border-2 text-left ${a?'bg-white text-black border-white':'bg-[#0a0a0f] border-zinc-900'}`}><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center mb-3`}>{c.icon}</div><p className="font-black text-[13px]">{c.label}</p></button>})}</div>
        </div>
        <div className="p-6 max-w-md mx-auto w-full sticky bottom-0 bg-[#050507]/80 backdrop-blur-2xl border-t border-zinc-900"><button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full py-5 rounded-full font-black ${selectedCollege?'bg-white text-black':'bg-zinc-900 text-zinc-700'}`}>Continue as {selectedAvatar.emoji} →</button></div>
      </div>
    );
  }

  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-[#050507] text-white p-6">
        <div className="max-w-md mx-auto">
          <button onClick={()=>setScreen('college')} className="w-11 h-11 bg-zinc-900 rounded-full flex items-center justify-center">←</button>
          <h1 className="text-3xl font-black mt-8">Verify {selectedCollege}</h1>
          <div className="flex gap-2 mt-6 p-1 bg-zinc-900 rounded-full w-fit"><button onClick={()=>setVerifyMethod('email')} className={`px-6 py-2.5 rounded-full text-sm font-bold ${verifyMethod==='email'?'bg-white text-black':'text-zinc-500'}`}>Email</button><button onClick={()=>setVerifyMethod('roll')} className={`px-6 py-2.5 rounded-full text-sm font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-zinc-500'}`}>Roll</button></div>
          {verifyMethod==='email'? <div className="mt-8"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder="college email" className="w-full p-5 bg-zinc-900 border border-zinc-800 rounded-2xl"/><button onClick={handleEmailVerify} className="w-full mt-4 bg-zinc-900 border border-zinc-800 py-5 rounded-full font-bold">Send OTP</button>{otpSent && <div className="mt-4 p-6 bg-white text-black rounded-[24px]"><p className="font-black">OTP: {generatedOtp}</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="000000" className="w-full mt-4 p-4 bg-zinc-100 rounded-2xl text-center tracking-[0.5em] font-black"/><button onClick={handleOtpSubmit} className="w-full mt-4 bg-black text-white py-4 rounded-full font-bold">Verify</button></div>}</div> : <div className="mt-8"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value)} placeholder="BITS2021001" className="w-full p-5 bg-zinc-900 border border-zinc-800 rounded-2xl uppercase"/><button onClick={handleRollVerify} className="w-full mt-6 bg-white text-black py-5 rounded-full font-black">Verify →</button></div>}
        </div>
      </div>
    );
  }

  if(screen==='login'){
    return <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6"><div className={`w-28 h-28 ${selectedAvatar.bg} ${selectedAvatar.border} border-2 rounded-[32px] flex items-center justify-center text-5xl`}>{selectedAvatar.emoji}</div><h1 className="text-4xl font-black mt-8">Verified</h1><button onClick={handleGoogleLogin} className="w-full max-w-sm mt-12 bg-white text-black py-5 rounded-full font-black flex items-center justify-center gap-3"><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5"/>Continue with Google</button></div>;
            }

  return(
    <div className="min-h-screen bg-[#050507] text-white">
      <style>{`body{background:#050507} ::-webkit-scrollbar{display:none}`}</style>
      <div className="sticky top-0 z-30 bg-[#050507]/80 backdrop-blur-2xl border-b border-zinc-900">
        <div className="max-w-[600px] mx-auto px-5 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black">Y</div><div><p className="font-black text-[14px]">YAK • {userData.college}</p><p className="text-[11px] text-zinc-500">{yaks.length} live • {userData.college} only 🔒</p></div></div>
          <button onClick={()=>setShowProfile(true)}><div className={`w-10 h-10 rounded-full ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center text-lg`}>{userData.avatar}</div></button>
        </div>
        <div className="max-w-[600px] mx-auto px-5 pb-4 flex gap-2 overflow-x-auto">{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 h-9 rounded-full text-[13px] font-bold border ${topic===t.name?'bg-white text-black border-white':'bg-[#0a0a0f] border-zinc-900 text-zinc-500'}`}>{t.icon} {t.name}</button>)}</div>
      </div>

      <div className="max-w-[600px] mx-auto pb-[100px] p-3 space-y-3 mt-2">
        {yaks.map(y=>{
          const liked=userData.likedPosts?.includes(y.id);
          const disliked=userData.dislikedPosts?.includes(y.id);
          const score=(y.likes||0)-(y.dislikes||0);
          return(
            <div key={y.id} className="bg-[#0a0a0f] border border-zinc-900 rounded-[28px] p-5">
              <div className="flex justify-between"><div className="flex gap-3"><div className={`w-11 h-11 rounded-full ${y.avatarBg||'bg-zinc-900'} ${y.avatarBorder||'border-zinc-800'} border-2 flex items-center justify-center text-xl`}>{y.avatar||'👻'}</div><div><p className="font-black text-[14px] flex items-center gap-2">{y.username}<span className="px-2 py-0.5 rounded-full bg-white text-black text-[9px] font-black">{y.college}</span></p><p className="text-[11px] text-zinc-500">{y.topic} • {score>0?'+'+score:score}</p></div></div>{user?.uid===y.uid && <button onClick={async()=>{ if(confirm('Delete?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="w-8 h-8 bg-zinc-900 rounded-full">✕</button>}</div>
              <p className="mt-4 text-[16px] leading-[1.5]">{y.text}</p>
              {y.imageUrls?.[0] && <img src={y.imageUrls[0]} alt="" className="mt-4 rounded-[20px] w-full border border-zinc-900"/>}
              <div className="mt-5 flex items-center gap-2">
                <div className="flex bg-[#111113] rounded-full border border-zinc-900 p-1"><button onClick={()=>handleLike(y,'like')} className={`px-4 py-2 rounded-full text-[13px] font-black ${liked?'bg-white text-black':'text-zinc-500'}`}>▲ {y.likes||0}</button><button onClick={()=>handleLike(y,'dislike')} className={`px-3 py-2 rounded-full text-[13px] font-black ${disliked?'bg-red-500 text-white':'text-zinc-600'}`}>▼ {y.dislikes||0}</button></div>
                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#111113] border border-zinc-900 px-4 h-[38px] rounded-full text-[13px] font-bold text-zinc-500">💬 {y.commentsCount||0}</button>
              </div>
              {activePost===y.id && <div className="mt-5 border-t border-zinc-900 pt-5"><div className="space-y-3 max-h-[300px] overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-3"><div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-sm">{c.avatar||'👻'}</div><div className="flex-1 bg-[#111113] border border-zinc-900 rounded-2xl px-4 py-3"><p className="text-[13px]">{c.text}</p></div></div>)}</div><div className="flex gap-2 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Reply..." className="flex-1 bg-[#111113] border border-zinc-900 rounded-full px-5 h-11 text-sm outline-none"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText, uid:user.uid, username:userData.username, avatar:userData.avatar, createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="w-11 h-11 bg-white text-black rounded-full font-black">↑</button></div></div>}
            </div>
          )
        })}
        {yaks.length===0 && <div className="py-28 text-center"><div className={`w-24 h-24 ${userData.avatarBg} border-2 rounded-[28px] mx-auto flex items-center justify-center text-4xl`}>{userData.avatar}</div><p className="font-black mt-6 text-xl">No yaks in {userData.college}</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-12 rounded-full font-black">+ Create</button></div>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#050507]/90 backdrop-blur-2xl border-t border-zinc-900"><div className="max-w-[600px] mx-auto px-10 h-[86px] flex items-center justify-between"><button className="flex flex-col items-center gap-1 text-white"><span className="text-[22px]">⌂</span><span className="text-[9px] font-black">HOME</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[28px]">+</button><button onClick={()=>setShowProfile(true)}><div className={`w-7 h-7 rounded-full ${userData.avatarBg} border flex items-center justify-center text-sm`}>{userData.avatar}</div></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#050507] z-40"><div className="max-w-[600px] mx-auto h-full flex flex-col"><div className="p-5 flex items-center justify-between border-b border-zinc-900"><button onClick={()=>setScreen('feed')} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">✕</button><p className="font-bold text-xs">POSTING TO {userData.college} • DARK</p><button onClick={handlePost} disabled={posting ||!newYak.trim()} className={`px-6 h-10 rounded-full font-black text-sm ${!newYak.trim()?'bg-zinc-900 text-zinc-700':'bg-white text-black'}`}>{posting?'Posting...':'Post'}</button></div><div className="p-6 flex-1"><div className="flex gap-4"><div className={`w-12 h-12 rounded-full ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center text-xl`}>{userData.avatar}</div><div><p className="font-black text-[15px]">{userData.username}</p><p className="text-xs text-zinc-500">{userData.college} isolated • dark</p></div></div><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}?`} autoFocus className="w-full mt-8 bg-transparent text-[24px] outline-none placeholder:text-zinc-800 resize-none min-h-[220px]" maxLength={500}/><label className="mt-8 border border-dashed border-zinc-800 rounded-[20px] p-6 flex flex-col items-center cursor-pointer"><span className="text-xs text-zinc-600 font-bold">ADD PHOTO</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setImages([r.result as string]); r.readAsDataURL(f); } }}/></label>{images[0] && <div className="mt-4 relative"><img src={images[0]} alt="" className="rounded-[20px] w-full border border-zinc-900"/><button onClick={()=>setImages([])} className="absolute top-3 right-3 w-9 h-9 bg-black/80 rounded-full">✕</button></div>}</div></div></div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-end justify-center"><div className="bg-[#0a0a0f] border border-zinc-900 w-full max-w-[600px] rounded-t-[36px] p-7 pb-12"><div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8"></div><div className="flex gap-5"><div className={`w-20 h-20 rounded-[22px] ${userData.avatarBg} ${userData.avatarBorder} border-2 flex items-center justify-center text-4xl`}>{userData.avatar}</div><div><h2 className="font-black text-[22px]">{userData.username}</h2><p className="text-[13px] text-zinc-500">{userData.college} • {userData.karma} karma</p></div></div><button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-8 bg-zinc-900 border border-zinc-800 h-[52px] rounded-full font-bold">Log out & clear JNTU</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-[52px] rounded-full font-black">Close</button></div></div>
      )}
    </div>
  );
}
