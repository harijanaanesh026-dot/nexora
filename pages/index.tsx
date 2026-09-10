import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc, arrayUnion, arrayRemove, setDoc, Timestamp } from 'firebase/firestore';

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

// TYPES - IDHI ADD CHESAKA BUILD ERROR POVUDHI
type YakType = {
  id: string;
  text: string;
  uid: string;
  avatar?: string;
  college?: string;
  likes?: number;
  commentsCount?: number;
  createdAt?: Timestamp;
  image?: string;
  hashtags?: string[];
  type?: string;
}

type UserType = {
  id: string;
  uid: string;
  avatar?: string;
  college?: string;
  yakarma?: number;
  likedPosts?: string[];
  totalPosts?: number;
  createdAt?: Timestamp;
}

const COLLEGES = [{id:"SRET", label:"SRET", city:"Tirupati", domains:["sret.edu.in","sret.ac.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21CS101"}];
const AVATARS = ["👻","🤫","💀","👽","🦊","🐼","🔥","😎"];

const Footer = () => (
  <div className="w-full py-8 flex flex-col items-center gap-1 border-t border-zinc-800 mt-8">
    <p className="text-[10px] tracking-[0.3em] font-bold text-white/40">SRET ONLY • A PRODUCTION BY ANESH</p>
  </div>
);

export default function YakFixed(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<UserType|null>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hot'|'dm'>('new');
  const [yaks,setYaks]=useState<YakType[]>([]);
  const [hotYaks,setHotYaks]=useState<YakType[]>([]);
  const [leaderboard,setLeaderboard]=useState<UserType[]>([]);
  const [collegeCounts,setCollegeCounts]=useState<Record<string,number>>({});
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [yakType,setYakType]=useState<'yak'|'poll'|'confession'|'meme'>('yak');
  const [pollOptions,setPollOptions]=useState(['','']);
  const [yakImage,setYakImage]=useState<string>('');
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
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
  const [verifyError,setVerifyError]=useState('');
  const [toast,setToast]=useState('');
  const [notifications,setNotifications]=useState<any[]>([]);
  const [unreadCount,setUnreadCount]=useState(0);
  const [dmChats,setDmChats]=useState<any[]>([]);
  const [activeDm,setActiveDm]=useState<any>(null);
  const [dmMessages,setDmMessages]=useState<any[]>([]);
  const [dmText,setDmText]=useState('');
  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2500); };

    const getCollegeConfig=()=>COLLEGES.find(c=>c.id==="SRET");
  const handleCollegeNext=()=>{ localStorage.setItem('selected_college',"SRET"); localStorage.setItem('selected_avatar',selectedAvatar); setScreen('verify'); };
  const handleEmailVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const emailLower=collegeEmail.toLowerCase().trim(); if(!config.domains.some(d=>emailLower.endsWith(d))){ setVerifyError(`Only ${config.domains.join(' or ')} allowed`); return; } const dup=await getDocs(query(collection(db,'users'),where('collegeEmail','==',emailLower))); if(!dup.empty){ setVerifyError('Email already used'); return; } const otpCode=Math.floor(100000+Math.random()*900000).toString(); setGeneratedOtp(otpCode); await setDoc(doc(db,'email_otps',emailLower),{email:emailLower,otp:otpCode,createdAt:serverTimestamp()}); setOtpSent(true); showToast("OTP: "+otpCode); };
  const handleOtpSubmit=async()=>{ const snap=await getDocs(query(collection(db,'email_otps'),where('email','==',collegeEmail.toLowerCase().trim()))); if(snap.empty) return; const d=snap.docs[0].data() as any; if(d.otp!==otp.trim()){ setVerifyError('Wrong OTP'); return; } await deleteDoc(doc(db,'email_otps',collegeEmail.toLowerCase().trim())); localStorage.setItem('college_email',collegeEmail.toLowerCase().trim()); localStorage.setItem('verify_method','email'); setIsVerified(true); setScreen('login'); };
  const handleRollVerify=async()=>{ setVerifyError(''); const config=getCollegeConfig(); if(!config) return; const rollUpper=rollNumber.trim().toUpperCase(); if(!config.pattern.test(rollUpper)){ setVerifyError(`Invalid Roll - Example: ${config.ex}`); return; } const dup=await getDocs(query(collection(db,'users'),where('rollNumber','==',rollUpper))); if(!dup.empty){ setVerifyError('Roll number already used'); return; } localStorage.setItem('roll_number',rollUpper); localStorage.setItem('verify_method','roll'); setIsVerified(true); setScreen('login'); };
  const handleIdVerify=async()=>{ if(!idImage ||!idName.trim()){ setVerifyError('Upload ID card + Enter Name'); return; } localStorage.setItem('id_image',idImage); localStorage.setItem('id_name',idName.trim().toUpperCase()); localStorage.setItem('verify_method','id'); setIsVerified(true); setScreen('login'); };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleImageUpload=(e:any,setter:any)=>{ const file=e.target.files?.[0]; if(!file) return; if(file.size>800*1024){ showToast("Image < 800KB"); return; } const reader=new FileReader(); reader.onloadend=()=>setter(reader.result as string); reader.readAsDataURL(file); };

  const createNotification=async(toUid:string, type:string, text:string, yakId?:string)=>{
    if(toUid===user?.uid) return; await addDoc(collection(db,'notifications'),{toUid, fromUid:user?.uid, fromUsername:"Anonymous", type, text, yakId:yakId||null, read:false, createdAt:serverTimestamp()});
  };

  const handleVote=async(y:YakType,type:'up'|'down')=>{
    if(!userData) return; const yakRef=doc(db,'yaks',y.id); const userRef=doc(db,'users',userData.id); const liked=userData.likedPosts?.includes(y.id);
    try{
      if(type==='up'){
        if(liked){ await updateDoc(yakRef,{likes:increment(-1)}); await updateDoc(userRef,{likedPosts:arrayRemove(y.id)}); setUserData({...userData, likedPosts:userData.likedPosts?.filter((i:string)=>i!==y.id)}); }
        else{ await updateDoc(yakRef,{likes:increment(1)}); await updateDoc(userRef,{likedPosts:arrayUnion(y.id)}); setUserData({...userData, likedPosts:[...(userData.likedPosts||[]), y.id]}); await createNotification(y.uid, 'upvote', `Someone liked: ${y.text.slice(0,30)}`, y.id); }
      }
    }catch(e:any){ showToast(e.message); }
  };

  const handlePost=async()=>{ const txt=newYak.trim(); if(!txt &&!yakImage){ showToast("Type something"); return; } if(!userData||!user) return; setPosting(true);
    try{ const anonAvatar = AVATARS[Math.floor(Math.random()*AVATARS.length)]; const payload:any={ text:txt, uid:user.uid, username:"Anonymous", avatar:anonAvatar, college:"SRET", type:yakType, likes:0, commentsCount:0, createdAt:serverTimestamp() }; if(yakImage) payload.image=yakImage; const hashtagsInText=txt.match(/#\w+/g); if(hashtagsInText) payload.hashtags=hashtagsInText.map((h:string)=>h.toLowerCase()); await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)}); setNewYak(''); setYakImage(''); setScreen('feed'); showToast("Posted"); }catch(e:any){ showToast(e.message); }finally{ setPosting(false); } };
  const handleCommentPost = async (yId:string) => { if(!commentText.trim() ||!user ||!userData) return; await addDoc(collection(db,'yaks/'+yId+'/comments'), { text:commentText.trim(), uid: user.uid, username: "Anonymous", avatar: "👻", createdAt: serverTimestamp() }); setCommentText(''); await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)}); };
  const handleStartDm = async (otherUid:string)=>{ if(otherUid===user?.uid){ showToast("Can't DM yourself"); return; } const existing=dmChats.find(c=>c.participants.includes(otherUid)); if(existing){ setActiveDm(existing); setFeedTab('dm'); return; } const newChat=await addDoc(collection(db,'dms'),{participants:[user.uid, otherUid], lastMessage:"Started chat", lastMessageAt:serverTimestamp()}); setActiveDm({id:newChat.id, participants:[user.uid, otherUid]}); setFeedTab('dm'); };
  const handleSendDm=async()=>{ if(!dmText.trim()||!activeDm||!user) return; await addDoc(collection(db,'dms/'+activeDm.id+'/messages'),{text:dmText.trim(), uid:user.uid, createdAt:serverTimestamp()}); setDmText(''); };

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{ return onSnapshot(collection(db,'users'), snap=>{ const c:Record<string,number>={}; snap.docs.forEach(d=>{ const col=(d.data() as any).college; if(col) c[col]=(c[col]||0)+1; }); setCollegeCounts(c); setTotalUsers(snap.size); }); },[]);

  useEffect(()=>{ return onAuthStateChanged(auth, async(u:any)=>{ if(u){ setUser(u); const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid))); if(snap.empty){ if(!isVerified){ setScreen('college'); return; } await addDoc(collection(db,'users'),{uid:u.uid,avatar:selectedAvatar,college:"SRET",yakarma:100,likedPosts:[],totalPosts:0,createdAt:serverTimestamp()}); window.location.reload(); }else{ setUserData({id:snap.docs[0].id,...snap.docs[0].data()} as UserType); setScreen('feed'); } }else setScreen('college'); }); },[isVerified]);

  useEffect(()=>{ if(!userData) return; return onSnapshot(collection(db,'yaks'), s=>{ const data = s.docs.map(d=>({id:d.id,...d.data()}) as YakType); data.sort((a,b)=> (b.createdAt?.toMillis?.()||0) - (a.createdAt?.toMillis?.()||0)); setYaks(data); setHotYaks([...data].sort((a,b)=> (b.likes||0)-(a.likes||0))); }); },[userData]);

  useEffect(()=>{ if(!userData) return; return onSnapshot(collection(db,'users'), s=>{ const all = s.docs.map(d=>({id:d.id,...d.data()}) as UserType); setLeaderboard(all.sort((a,b)=> (b.yakarma||0)-(a.yakarma||0)).slice(0,20)); }); },[userData]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'notifications'),where('toUid','==',user.uid),orderBy('createdAt','desc')), s=>{ const nots=s.docs.map(d=>({id:d.id,...d.data()})); setNotifications(nots as any); setUnreadCount((nots as any).filter((n:any)=>!n.read).length); }); },[user]);
  useEffect(()=>{ if(!user?.uid) return; return onSnapshot(query(collection(db,'dms'),where('participants','array-contains',user.uid)), s=>{ const chats=s.docs.map(d=>({id:d.id,...d.data()})); setDmChats(chats as any); }); },[user]);
  useEffect(()=>{ if(!activeDm) return; return onSnapshot(query(collection(db,'dms/'+activeDm.id+'/messages'),orderBy('createdAt','asc')), s=>setDmMessages(s.docs.map(d=>({id:d.id,...d.data()})))); },[activeDm]);

  // SCREENS
  if(screen==='college'){
    return(<div className="min-h-screen bg-black text-white flex items-center justify-center p-4"><style>{`body{background:#000}`}</style>{toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-yellow-500 text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}<div className="max-w-md w-full bg-zinc-900 border-zinc-800 rounded-[20px] p-6"><div className="text-center mb-6"><div className="text-[48px] mb-2">👻</div><h1 className="text-[28px] font-black bg-gradient-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent">SRET GHOST</h1><p className="text-[13px] text-white/50">Nee Peru Evariki Teliyadu</p></div><p className="text-[10px] font-bold tracking-[0.2em] text-white/40">SELECT AVATAR</p><div className="grid grid-cols-4 gap-3 mt-4">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[16px] text-2xl border-2 ${selectedAvatar===a?'bg-gradient-to-br from-pink-500 to-yellow-500 border-pink-500':'bg-zinc-800 border-zinc-700'}`}>{a}</button>)}</div><button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black bg-gradient-to-r from-pink-500 to-yellow-500 text-black">Enter SRET</button><Footer/></div></div>);
  }
  if(screen==='verify'){
    const config=getCollegeConfig();
    return(<div className="min-h-screen bg-black text-white p-6"><button onClick={()=>setScreen('college')} className="w-10 h-10 bg-zinc-800 rounded-full">←</button><div className="mt-6 bg-zinc-900 border-zinc-800 rounded-[20px] p-5"><h2 className="font-black text-[18px]">Verify SRET Student</h2></div><div className="flex p-1 bg-zinc-800 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-gradient-to-r from-pink-500 to-yellow-500 text-black':'text-white/50'}`}>College Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-gradient-to-r from-pink-500 to-yellow-500 text-black':'text-white/50'}`}>Roll</button><button onClick={()=>setVerifyMethod('id')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='id'?'bg-gradient-to-r from-pink-500 to-yellow-500 text-black':'text-white/50'}`}>ID Card</button></div>{verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3 rounded-xl">{verifyError}</p>}{verifyMethod==='email' && <div className="mt-5 bg-zinc-900 border-zinc-800 rounded-[20px] p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`you@${config?.domains[0]}`} className="w-full p-4 bg-black border-zinc-800 rounded-xl"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-gradient-to-r from-pink-500 to-yellow-500 py-3.5 rounded-full font-bold text-black">Send OTP</button>{otpSent&&<div className="mt-4"><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full p-3 bg-zinc-800 border-zinc-700 rounded-xl text-center"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-gradient-to-r from-pink-500 to-yellow-500 py-3.5 rounded-full font-bold text-black">Verify</button></div>}</div>}{verifyMethod==='roll' && <div className="mt-5 bg-zinc-900 border-zinc-800 rounded-[20px] p-4"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder={`${config?.ex}`} className="w-full p-4 bg-black border-zinc-800 rounded-xl uppercase font-bold"/><button onClick={handleRollVerify} className="w-full mt-4 bg-gradient-to-r from-pink-500 to-yellow-500 py-3.5 rounded-full font-bold text-black">Verify Roll</button></div>}{verifyMethod==='id' && <div className="mt-5 bg-zinc-900 border-zinc-800 rounded-[20px] p-4"><input value={idName} onChange={e=>setIdName(e.target.value.toUpperCase())} placeholder="NAME ON ID CARD" className="w-full p-4 bg-black border-zinc-800 rounded-xl uppercase font-bold"/><label className="mt-4 border-2 border-dashed border-zinc-800 rounded-xl p-6 flex justify-center cursor-pointer text-xs">Upload ID Card<input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,setIdImage)}/></label>{idImage && <img src={idImage} className="mt-4 rounded-xl"/>}<button onClick={handleIdVerify} className="w-full mt-4 bg-gradient-to-r from-pink-500 to-yellow-500 py-3.5 rounded-full font-bold text-black">Submit ID</button></div>}<Footer/></div>);
  }
  if(screen==='login'){
    return (<div className="min-h-screen bg-black text-white flex items-center justify-center p-6"><div className="max-w-md w-full bg-zinc-900 border-zinc-800 p-8 rounded-[20px] flex-col items-center"><div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-yellow-500 rounded-[20px] flex items-center justify-center text-4xl">{selectedAvatar}</div><h1 className="font-black mt-6 text-center text-xl">SRET Verified</h1><button onClick={handleGoogleLogin} className="w-full mt-8 bg-gradient-to-r from-pink-500 to-yellow-500 py-4 rounded-full font-bold text-black">Continue with Google</button></div><Footer/></div>);
  }
  if(screen==='create'){
    return(<div className="fixed inset-0 bg-black z-40 flex-col"><div className="max-w-[600px] mx-auto w-full flex items-center justify-between p-4 border-b border-zinc-800"><button onClick={()=>{ if(!posting) { setScreen('feed'); setYakImage(''); } }} className="text-[16px] font-bold text-white">Cancel</button><p className="text-[16px] font-bold">New Post</p><button onClick={handlePost} disabled={posting||(!newYak.trim()&&!yakImage)} className={`text-[16px] font-bold ${posting||(!newYak.trim()&&!yakImage)?'text-white/20':'text-blue-500'}`}>{posting?'Posting...':'Share'}</button></div><div className="max-w-[600px] mx-auto w-full flex-1 overflow-y-auto p-4"><div className="flex gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-yellow-500 p-[2px]"><div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xl">{userData?.avatar || "👻"}</div></div><div><p className="font-bold text-[14px]">Ghost</p><p className="text-[11px] text-white/50">SRET</p></div></div><textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's on your mind?\n\nUse #hashtag`} autoFocus className="w-full bg-transparent text-[16px] outline-none placeholder:text-white/40 resize-none min-h-[250px] text-white" maxLength={300}/>{yakImage? (<div className="relative mt-4"><img src={yakImage} className="w-full rounded-[12px]" alt="upload"/><button onClick={()=>setYakImage('')} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full flex items-center justify-center text-white">X</button></div>) : (<label className="w-full border-dashed border-zinc-800 rounded-[12px] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 bg-zinc-900 mt-4"><span className="text-[32px] mb-2">📷</span><span className="text-[13px] font-bold">Upload Image</span><input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,setYakImage)} /></label>)}</div></div>);
                                                                                                                                                                                                                                                                                      }

    const PostCard = ({yak}:{yak:YakType}) => {
    const liked = userData?.likedPosts?.includes(yak.id);
    return (
      <div className="bg-zinc-900 border-zinc-800 rounded-[12px] mb-4">
        <div className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xl">{yak.avatar || "👻"}</div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-[13px]">Ghost <span className="text-blue-500">✓</span></p>
            <p className="text-[11px] text-white/50">SRET, Tirupati</p>
          </div>
          <button className="text-white/60 text-xl">•••</button>
        </div>

        {yak.image && <img src={yak.image} className="w-full" />}

        <div className="flex items-center gap-4 p-3">
          <button onClick={()=>handleVote(yak,'up')} className="flex items-center gap-1">
            <span className={`text-[24px] ${liked? 'text-red-500' : 'text-white'}`}>❤️</span>
          </button>
          <button onClick={()=>setActivePost(yak.id)} className="text-[24px]">💬</button>
          <button onClick={()=>handleStartDm(yak.uid)} className="text-[24px]">📤</button>
          <button className="ml-auto text-[20px]">🔖</button>
        </div>

        <div className="px-3 pb-3">
          <p className="text-[13px] font-bold mb-1">{yak.likes || 0} likes</p>
          <p className="text-[14px] leading-[1.5]"><span className="font-bold">Ghost</span> {yak.text}</p>
          {yak.hashtags && <p className="text-[13px] text-blue-400 mt-1">{yak.hashtags?.join(' ')}</p>}
          <p className="text-[11px] text-white/40 mt-2">View all {yak.commentsCount || 0} comments</p>
        </div>

        {activePost===yak.id && (
          <div className="border-t border-zinc-800 p-3">
            {comments.map(c=><div key={c.id} className="flex gap-2 mb-2"><b className="text-[13px]">Ghost:</b><p className="text-[13px]">{c.text}</p></div>)}
            <div className="flex gap-2 mt-2">
              <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-transparent outline-none text-[13px]"/>
              <button onClick={()=>handleCommentPost(yak.id)} className="px-3 text-blue-500 font-bold text-[13px]">Post</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-20 bg-black border-b border-zinc-800">
        <div className="max-w-[600px] mx-auto flex items-center justify-between p-4">
          <h1 className="text-[24px] font-black bg-gradient-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent">SRET</h1>
          <div className="flex gap-5">
            <button className="text-[24px] relative">❤️{unreadCount>0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}</button>
            <button onClick={()=>setFeedTab('dm')} className="text-[24px]">✈️</button>
          </div>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto p-4 overflow-x-auto border-b border-zinc-800">
        <div className="flex gap-4">
          {leaderboard.slice(0,8).map((u,i)=>(
            <div key={i} className="flex flex-col items-center gap-1 min-w-[70px]">
              <div className="w-[66px] h-[66px] rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[26px]">{u.avatar}</div>
              </div>
              <p className="text-[11px] truncate w-[66px] text-center">Ghost</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[600px] mx-auto">
        <div className="bg-zinc-900 border-zinc-800 rounded-[12px] p-3 m-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-yellow-500 p-[2px]"><div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xl">{userData?.avatar || "👻"}</div></div>
            <input value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="What's your secret SRET?" className="flex-1 bg-transparent outline-none text-[14px]"/>
          </div>
          <button onClick={handlePost} className="mt-3 w-full py-2 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-[8px] font-bold text-[14px] text-black">Post</button>
        </div>

        {(feedTab==='new'? yaks : hotYaks).map(yak=>(<PostCard key={yak.id} yak={yak} />))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800">
        <div className="max-w-[600px] mx-auto px-6 h-[60px] flex items-center justify-between">
          <button onClick={()=>setFeedTab('new')} className="text-[26px]">🏠</button>
          <button onClick={()=>setScreen('create')} className="text-[26px]">➕</button>
          <button className="text-[26px]">🔍</button>
          <button className="text-[26px]">❤️</button>
          <button className="text-[26px]">👤</button>
        </div>
      </div>
      {toast && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-yellow-500 text-black px-4 py-2 rounded-full text-[12px] font-bold">{toast}</div>}
    </div>
  );
}
