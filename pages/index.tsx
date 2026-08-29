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

// FOREIGN YIKYAK ORIGINAL COLLEGES - Location based like US
const COLLEGES = [
  {id:"BITS", label:"BITS Pilani", herd:"BITS Herd", color:"bg-[#FFD60A]", text:"text-black", icon:"⚡"},
  {id:"SRET", label:"SRET Tirupati", herd:"SRET Herd", color:"bg-[#FFD60A]", text:"text-black", icon:"🎓"},
  {id:"SVCE", label:"SVCE Tirupati", herd:"SVCE Herd", color:"bg-[#FFD60A]", text:"text-black", icon:"🚀"},
  {id:"ST.JOHNS", label:"ST.JOHNS", herd:"Johns Herd", color:"bg-[#FFD60A]", text:"text-black", icon:"🔥"},
  {id:"VEMU", label:"VEMU Chittoor", herd:"VEMU Herd", color:"bg-[#FFD60A]", text:"text-black", icon:"💎"},
  {id:"OTHER", label:"Other Campus", herd:"Global Herd", color:"bg-[#FFD60A]", text:"text-black", icon:"🌍"},
];

const FOOTER = () => (
  <div className="w-full py-6 flex flex-col items-center gap-2 border-t border-zinc-200 mt-6 bg-white">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-[#FFD60A] rounded-full flex items-center justify-center font-black text-black text-[14px]">Y</div>
      <p className="text-[11px] tracking-[0.3em] font-black text-black">A PRODUCTION BY ANESH</p>
    </div>
    <p className="text-[9px] text-zinc-500 font-bold tracking-widest">YIK YAK FOREIGN CLONE • REAL HERD • YAKARMA</p>
  </div>
);

export default function YikYakForeign(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [yaks,setYaks]=useState<any[]>([]);
  const [newYak,setNewYak]=useState('');
  const [images,setImages]=useState<string[]>([]);
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [replyTo,setReplyTo]=useState<any>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [selectedCollege,setSelectedCollege]=useState('');
  const [verifyMethod,setVerifyMethod]=useState('email');
  const [collegeEmail,setCollegeEmail]=useState('');
  const [rollNumber,setRollNumber]=useState('');
  const [otp,setOtp]=useState('');
  const [generatedOtp,setGeneratedOtp]=useState('');
  const [otpSent,setOtpSent]=useState(false);
  const [isVerified,setIsVerified]=useState(false);
  const [posting,setPosting]=useState(false);
  const [sortBy,setSortBy]=useState('New');

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);

  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college'); if(!col ||!isVerified){ setScreen('college'); return; }
          const yakarma=Math.floor(Math.random()*200+50);
          await addDoc(collection(db,'users'),{
            uid:u.uid,
            email:u.email||'',
            username:'Yakker',
            college:String(col),
            herd:COLLEGES.find(c=>c.id===col)?.herd||'Global Herd',
            yakarma:Number(yakarma),
            collegeEmail:String(localStorage.getItem('college_email')||''),
            rollNumber:String(localStorage.getItem('roll_number')||''),
            verifyMethod:String(localStorage.getItem('verify_method')||'email'),
            likedPosts:[], dislikedPosts:[], totalPosts:0,
            createdAt:serverTimestamp()
          });
          window.location.reload();
        }else{
          const raw:any={id:snap.docs[0].id,...snap.docs[0].data()};
          setUserData(raw); setScreen('feed');
        }
      }else setScreen('college');
    });
  },[isVerified]);

  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')),s=>{
      let data:any[]=s.docs.map(d=>({id:d.id,...d.data()}));
      data=data.filter((y:any)=>y.college===userData.college);
      if(sortBy==='Hot') data=data.sort((a,b)=>(b.likes||0)-(a.likes||0));
      setYaks(data);
    });
  },[userData,sortBy]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

  const handleCollegeNext=()=>{ if(!selectedCollege) return; localStorage.setItem('selected_college',selectedCollege); setScreen('verify'); };

  const handleEmailVerify=async()=>{
    if(!collegeEmail.includes('@')) return alert('Enter valid email');
    const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',collegeEmail.toLowerCase())));
    if(!dup.empty) return alert('Already used!');
    const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode);
    await setDoc(doc(db,'email_otps',collegeEmail.toLowerCase()),{email:collegeEmail.toLowerCase(),otp:otpCode,college:selectedCollege,createdAt:serverTimestamp()});
    setOtpSent(true);
  };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()) return alert('Wrong OTP: '+d.otp); await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase())); localStorage.setItem('college_email',collegeEmail.toLowerCase()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ if(rollNumber.trim().length<4) return alert('Invalid'); const snap=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollNumber.trim().toUpperCase()))); if(!snap.empty) return alert('Used!'); localStorage.setItem('roll_number',rollNumber.trim().toUpperCase()); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };

  const handleVote=async(y:any,type:string)=>{
    const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
    if(navigator.vibrate) navigator.vibrate(10);
    if(type==='up'){
      if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id),yakarma:increment(-1)}); setUserData({...userData,likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)}); }
      else if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1),likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id),likedPosts:arrayUnion(y.id),yakarma:increment(2)}); setUserData({...userData,dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id),likedPosts:[...userData.likedPosts,y.id]}); }
      else{ await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id),yakarma:increment(1)}); setUserData({...userData,likedPosts:[...(userData.likedPosts||[]),y.id]}); }
    }else{
      if(disliked){ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id),yakarma:increment(1)}); setUserData({...userData,dislikedPosts:userData.dislikedPosts.filter((i:string)=>i!==y.id)}); }
      else if(liked){ await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1),dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id),dislikedPosts:arrayUnion(y.id),yakarma:increment(-2)}); setUserData({...userData,likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id),dislikedPosts:[...userData.dislikedPosts,y.id]}); }
      else{ await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)}); await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayUnion(y.id),yakarma:increment(-1)}); setUserData({...userData,dislikedPosts:[...(userData.dislikedPosts||[]),y.id]}); }
    }
  };

  const handlePost=async()=>{
    if(!userData) return;
    if(!newYak.trim() && images.length===0) return alert('Write something');
    setPosting(true);
    try{
      const payload:any = {
        text:String(newYak.trim()),
        uid:String(user.uid),
        username:String('Yakker'),
        college:String(userData.college),
        herd:String(userData.herd||'Global Herd'),
        collegeEmail:String(userData.collegeEmail||''),
        rollNumber:String(userData.rollNumber||''),
        likes:0, dislikes:0, commentsCount:0,
        imageUrls:(images||[]).filter(Boolean).map(String),
        createdAt:serverTimestamp()
      };
      Object.keys(payload).forEach(k=>{ if(payload[k]===undefined) delete payload[k]; });
      await addDoc(collection(db,'yaks'), payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setImages([]); setScreen('feed');
    }catch(e:any){ alert('Failed: '+e.message); } finally{ setPosting(false); }
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-white text-black flex flex-col">
        <style>{`body{background:white} ::-webkit-scrollbar{display:none} button{transition:all 0.2s} button:active{transform:scale(0.96)}`}</style>
        <div className="bg-[#FFD60A] h-[64px] flex items-center px-5 sticky top-0 z-20">
          <div className="flex items-center gap-2"><div className="w-10 h-10 bg-black rounded-full flex items-center justify-center font-black text-[#FFD60A] text-[20px]">Y</div><p className="font-black text-[20px] tracking-tighter">YIK YAK</p></div>
          <p className="ml-auto text-[10px] font-black tracking-widest">FOREIGN EDITION</p>
        </div>
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <h1 className="text-[36px] font-black leading-[0.9] tracking-tighter mt-6">Find your<br/>herd.</h1>
          <p className="text-[14px] text-zinc-600 mt-3 leading-[1.4]">Join your college's anonymous herd. See what's happening around you right now. Like original YikYak.</p>
          <p className="font-black mt-8 text-[11px] tracking-[0.2em] text-zinc-400">SELECT YOUR HERD</p>
          <div className="grid grid-cols-1 gap-3 mt-4">{COLLEGES.map(c=>{const a=selectedCollege===c.id; return <button key={c.id} onClick={()=>setSelectedCollege(c.id)} className={`p-4 rounded-[18px] border-2 text-left flex items-center justify-between transition-all ${a?'bg-black text-white border-black scale-[1.02]':'bg-white border-zinc-200 hover:border-black'}`}><div className="flex items-center gap-3"><div className="w-12 h-12 bg-[#FFD60A] rounded-full flex items-center justify-center text-xl">{c.icon}</div><div><p className="font-black text-[15px]">{c.label}</p><p className="text-[11px] opacity-60">{c.herd} • 5mi radius • Real students</p></div></div><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${a?'bg-[#FFD60A] border-[#FFD60A]':'border-zinc-300'}`}>{a&&'✓'}</div></button>})}</div>
        </div>
        <div className="p-6 max-w-md mx-auto w-full sticky bottom-0 bg-white border-t border-zinc-100"><button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full py-4 rounded-full font-black text-[15px] ${selectedCollege?'bg-black text-white':'bg-zinc-100 text-zinc-400'}`}>Next → Join Herd</button></div>
        <FOOTER/>
      </div>
    );
  }

  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-white text-black"><div className="bg-[#FFD60A] h-[64px] flex items-center px-5"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-black text-[#FFD60A] rounded-full">←</button><p className="ml-4 font-black text-[16px]">Verify Herd Member</p></div>
      <div className="max-w-md mx-auto p-6"><div className="bg-zinc-50 border border-zinc-200 rounded-[20px] p-5"><p className="font-black">Prove you're {selectedCollege} student</p><p className="text-xs text-zinc-500 mt-1">Real student only - YikYak style verification</p></div>
      <div className="flex p-1 bg-zinc-100 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-[13px] font-black ${verifyMethod==='email'?'bg-black text-white':'text-zinc-500'}`}>College Email</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-[13px] font-black ${verifyMethod==='roll'?'bg-black text-white':'text-zinc-500'}`}>Roll No</button></div>
      {verifyMethod==='email'?<div className="mt-5"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder="you@college.edu" className="w-full p-4 bg-white border-2 border-zinc-200 rounded-2xl outline-none focus:border-black font-bold"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-[#FFD60A] text-black py-4 rounded-full font-black">Send Code</button>{otpSent&&<div className="mt-4 p-4 bg-black text-white rounded-2xl"><p className="text-xs font-bold text-[#FFD60A]">CODE: {generatedOtp} (dev mode)</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter code" className="w-full mt-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center tracking-[0.3em] font-black text-white outline-none"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-[#FFD60A] text-black py-3 rounded-full font-black">Verify</button></div>}</div>:<div className="mt-5"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value)} placeholder="Roll number" className="w-full p-4 bg-white border-2 border-zinc-200 rounded-2xl outline-none focus:border-black font-bold uppercase"/><button onClick={handleRollVerify} className="w-full mt-3 bg-black text-white py-4 rounded-full font-black">Verify Roll</button></div>}
      </div><FOOTER/></div>
    );
  }

  if(screen==='login'){ return <div className="min-h-screen bg-[#FFD60A] text-black flex flex-col items-center justify-center p-6"><div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-4xl">🤫</div><h1 className="text-[28px] font-black mt-6 tracking-tighter">You're in the herd!</h1><p className="text-sm font-bold mt-2">Real student verified</p><button onClick={handleGoogleLogin} className="w-full max-w-sm mt-8 bg-black text-white py-4 rounded-full font-black flex items-center justify-center gap-2"><span>G</span> Continue with Google</button><div className="mt-16 w-full max-w-md"><FOOTER/></div></div>; }

  return(
    <div className="min-h-screen bg-[#F6F6] text-black flex flex-col">
      <style>{`body{background:#F6F6F6} ::-webkit-scrollbar{display:none} button{transition:all 0.15s} button:active{transform:scale(0.96)}`}</style>

      <div className="sticky top-0 z-30 bg-[#FFD60A] border-b border-black/10">
        <div className="max-w-[600px] mx-auto px-4 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-9 h-9 bg-black rounded-full flex items-center justify-center font-black text-[#FFD60A]">Y</div><div><p className="font-black text-[16px] tracking-tighter leading-none">YIK YAK</p><p className="text-[10px] font-bold tracking-widest">{userData.herd} • {yaks.length} yaks</p></div></div>
          <div className="flex items-center gap-2">
            <div className="flex bg-black rounded-full p-1"><button onClick={()=>setSortBy('New')} className={`px-3 py-1 rounded-full text-[11px] font-black ${sortBy==='New'?'bg-[#FFD60A] text-black':'text-white'}`}>New</button><button onClick={()=>setSortBy('Hot')} className={`px-3 py-1 rounded-full text-[11px] font-black ${sortBy==='Hot'?'bg-[#FFD60A] text-black':'text-white'}`}>Hot</button></div>
            <button onClick={()=>setShowProfile(true)} className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-black text-xs">{userData.yakarma}</button>
          </div>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 pb-[90px]">
        <div className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-[11px] font-bold tracking-widest text-zinc-600">{userData.college} HERD • {userData.herd} • ANONYMOUS • 5mi RADIUS • YAKARMA {userData.yakarma}</p>
        </div>

        <div className="p-2 space-y-2 mt-1">
          {yaks.map((y,i)=>{
            const liked=userData.likedPosts?.includes(y.id); const disliked=userData.dislikedPosts?.includes(y.id);
            const score=(y.likes||0)-(y.dislikes||0);
            return(
              <div key={y.id} className="bg-white rounded-[18px] border border-zinc-200 p-4 hover:border-zinc-300 transition-all">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={()=>handleVote(y,'up')} className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-all ${liked?'bg-[#FFD60A] text-black':'bg-zinc-100 hover:bg-zinc-200'}`}>↑</button>
                    <span className={`text-[13px] font-black ${score>0?'text-green-600':score<0?'text-red-600':'text-black'}`}>{score}</span>
                    <button onClick={()=>handleVote(y,'down')} className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-all ${disliked?'bg-black text-white':'bg-zinc-100 hover:bg-zinc-200'}`}>↓</button>
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] leading-[1.45] font-medium">{y.text}</p>
                    {y.imageUrls?.[0] && <img src={y.imageUrls[0]} alt="" className="mt-3 rounded-[14px] w-full border border-zinc-200"/>}
                    <div className="mt-3 flex items-center gap-3">
                      <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="flex items-center gap-1.5 text-[12px] font-bold text-zinc-500 hover:text-black"><span>💬</span> {y.commentsCount||0} comments</button>
                      <span className="text-[11px] text-zinc-400">• {y.herd} • {y.college}</span>
                      {user?.uid===y.uid && <button onClick={async()=>{ if(confirm('Delete yak?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="ml-auto text-[11px] text-zinc-400 hover:text-red-500">delete</button>}
                    </div>

                    {activePost===y.id && (
                      <div className="mt-4 border-t border-zinc-100 pt-3">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {comments.map(c=>(
                            <div key={c.id} className={`${c.replyTo?'ml-6 border-l-2 border-zinc-200 pl-3':''} py-2`}>
                              <p className="text-[13px]"><span className="font-black text-[11px] text-zinc-500">{c.username}: </span>{c.replyTo && <span className="text-[#FFD60A] bg-black px-1.5 py-0.5 rounded-full text-[10px] font-black">@{c.replyTo}</span>} {c.text}</p>
                              <div className="flex gap-2 mt-1"><button onClick={()=>setReplyTo(c)} className="text-[10px] font-bold text-zinc-500">Reply</button></div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={replyTo?`Reply to ${replyTo.username}...`:"Add a comment..."} className="flex-1 bg-zinc-100 rounded-full px-4 h-10 text-[13px] outline-none focus:bg-zinc-200"/>
                          <button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,'yaks/'+y.id+'/comments'),{text:commentText,uid:user.uid,username:'Yakker',replyTo:replyTo?.username||null,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); setReplyTo(null); }} className="w-10 h-10 bg-black text-white rounded-full font-black">↑</button>
                        </div>
                        {replyTo && <button onClick={()=>setReplyTo(null)} className="mt-2 text-[11px] bg-zinc-100 px-2 py-1 rounded-full">✕ Cancel reply to {replyTo.username}</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {yaks.length===0 && <div className="py-20 text-center bg-white rounded-[18px] border border-zinc-200 m-2"><div className="w-16 h-16 bg-[#FFD60A] rounded-full mx-auto flex items-center justify-center text-2xl">🤫</div><p className="font-black mt-4 text-[18px] tracking-tighter">Your herd is quiet</p><p className="text-sm text-zinc-500 mt-1">Be the first to yak in {userData.college}!</p><button onClick={()=>setScreen('create')} className="mt-4 bg-black text-white px-6 h-10 rounded-full font-black text-sm">Post first yak</button><div className="mt-10"><FOOTER/></div></div>}
          {yaks.length>0 && <FOOTER/>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200"><div className="max-w-[600px] mx-auto px-6 h-[76px] flex items-center justify-between"><button className="flex flex-col items-center gap-1"><span className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-[#FFD60A] text-xs">⌂</span><span className="text-[9px] font-black tracking-widest">HOME</span></button><button onClick={()=>setScreen('create')} className="w-14 h-14 bg-[#FFD60A] rounded-full flex items-center justify-center text-[28px] font-black text-black shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:scale-105 transition-all">+</button><button onClick={()=>setShowProfile(true)} className="flex flex-col items-center gap-1"><div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-black">{userData.yakarma}</div><span className="text-[9px] font-black tracking-widest">YOU</span></button></div></div>

      {screen==='create' && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col"><div className="bg-[#FFD60A] h-[56px] flex items-center justify-between px-4"><button onClick={()=>setScreen('feed')} className="w-9 h-9 bg-black text-[#FFD60A] rounded-full flex items-center justify-center">✕</button><p className="font-black tracking-tighter">NEW YAK • {userData.herd}</p><button onClick={handlePost} disabled={posting ||!newYak.trim()} className={`px-5 h-9 rounded-full font-black text-sm ${!newYak.trim()?'bg-zinc-200 text-zinc-400':'bg-black text-white'}`}>{posting?'Posting...':'Yak'}</button></div><div className="flex-1 p-5"><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}? Say it anonymously...`} autoFocus className="w-full bg-transparent text-[22px] outline-none placeholder:text-zinc-400 resize-none min-h-[160px] font-medium" maxLength={300}/><div className="mt-2 text-right"><span className={`text-[12px] font-bold ${newYak.length>250?'text-red-500':'text-zinc-400'}`}>{newYak.length}/300</span></div><label className="mt-6 border-2 border-dashed border-zinc-200 rounded-[18px] p-6 flex flex-col items-center cursor-pointer hover:border-black"><span className="text-[12px] font-black tracking-widest">ADD PHOTO</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setImages([r.result as string]); r.readAsDataURL(f); } }}/></label>{images[0] && <div className="mt-4 relative"><img src={images[0]} alt="" className="rounded-[18px] w-full border border-zinc-200"/><button onClick={()=>setImages([])} className="absolute top-3 right-3 w-8 h-8 bg-black text-white rounded-full">✕</button></div>}<div className="mt-6 bg-[#FFD60A]/30 border border-[#FFD60A] rounded-[14px] p-3"><p className="text-[11px] font-bold">⚠️ YIKYAK RULES: Be kind • No bullying • No personal info • Stay anonymous • Real herd only</p></div></div><FOOTER/></div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center"><div className="bg-white w-full max-w-[600px] rounded-t-[28px] p-6 pb-8 max-h-[85vh] overflow-y-auto"><div className="w-10 h-1.5 bg-zinc-200 rounded-full mx-auto mb-6"></div><div className="flex items-center gap-4"><div className="w-16 h-16 bg-[#FFD60A] rounded-full flex items-center justify-center text-2xl font-black">Y</div><div><h2 className="font-black text-[20px] tracking-tighter">Yakker • {userData.herd}</h2><p className="text-[12px] text-zinc-500 font-bold">Yakarma: {userData.yakarma} • {userData.college} • Real student ✓</p></div></div><div className="mt-6 bg-[#FFD60A] rounded-[18px] p-4"><p className="font-black text-sm">🔥 YAKARMA: {userData.yakarma}</p><p className="text-[11px] font-bold mt-1">Upvote = +1 • Post = +5 • Your herd reputation</p></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="bg-zinc-50 border border-zinc-200 rounded-[14px] p-3 text-center"><p className="text-[10px] font-bold text-zinc-500">HERD</p><p className="font-black text-sm mt-1">{userData.college}</p></div><div className="bg-zinc-50 border border-zinc-200 rounded-[14px] p-3 text-center"><p className="text-[10px] font-bold text-zinc-500">POSTS</p><p className="font-black text-sm mt-1">{userData.totalPosts||0}</p></div></div><button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-zinc-100 border border-zinc-200 h-11 rounded-full font-black text-sm">Log out of herd</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-black text-white h-11 rounded-full font-black">Close</button><div className="mt-4"><FOOTER/></div></div></div>
      )}
    </div>
  );
                          }
