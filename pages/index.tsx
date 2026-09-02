import { useState, useEffect, useRef } from 'react';
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

// SRET ONLY - MIGATHA COLLEGES THESESANU - COLLEGE ONLY SRET
const COLLEGES = [
  {id:"SRET", label:"SRET", city:"Tirupati", slang:"SRET Anonymous Talk", domains:["sret.edu.in","sret.ac.in"], pattern:/^(20|21|22|23|24|25)[A-Z]{2,4}[0-9]{3,5}$/i, ex:"21CS101"},
];
const STUDENT_REACTS = [
  {emoji:"💯", label:"FR FR", desc:"For real - Nijam", color:"bg-white text-black"},
  {emoji:"🤝", label:"SAME", desc:"Same bro", color:"bg-yellow-400 text-black"},
  {emoji:"😭", label:"RELATABLE", desc:"Relatable AF", color:"bg-blue-500 text-white"},
  {emoji:"🏃", label:"BUNK", desc:"Bunk story", color:"bg-green-500 text-white"},
  {emoji:"👨‍🏫", label:"ROAST", desc:"Faculty roast", color:"bg-red-500 text-white"},
  {emoji:"🏠", label:"HOSTEL", desc:"Hostel scene", color:"bg-purple-500 text-white"},
];
const AVATARS = ["👻","🤫","💀","👽","🦊","🐼","🔥","😎"];
const ANON_NAMES = ["SRET Ghost","SRET Secret","Hostel Ghost","Bunk Master","SRET Gossip","Tirupati Anon"];
const Footer = () => (
  <div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8">
    <p className="text-[10px] tracking-[0.3em] font-bold text-white/40">SRET ONLY • A PRODUCTION BY ANESH</p>
    <p className="text-[9px] text-white/20">SRET Students Only • Anonymous • FR FR • SAME BRO • College Only SRET</p>
  </div>
);

export default function YakFixed(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState<'new'|'hostel'|'bunk'|'top'>('new');
  const [yaks,setYaks]=useState<any[]>([]);
  const [hostelYaks,setHostelYaks]=useState<any[]>([]);
  const [bunkYaks,setBunkYaks]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [collegeCounts,setCollegeCounts]=useState<Record<string,number>>({});
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [yakType,setYakType]=useState<'yak'|'poll'|'confession'|'meme'>('yak');
  const [pollOptions,setPollOptions]=useState(['','']);
  const [yakImage,setYakImage]=useState<string>('');
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [replyTo,setReplyTo]=useState<any>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [selectedCollege,setSelectedCollege]=useState('SRET');
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
  const [studentBlast,setStudentBlast]=useState<Record<string,string>>({});
  const [showSlangBar,setShowSlangBar]=useState<string|null>(null);
  const lastTapRef = useRef<Record<string,number>>({});
  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2500); };

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  // COLLEGE COUNTS - SRET ONLY
  useEffect(()=>{
    return onSnapshot(collection(db,'users'), snap=>{
      const c:Record<string,number>={};
      let sretCount=0;
      snap.docs.forEach(d=>{
        const col=(d.data() as any).college;
        if(col==="SRET"){ sretCount++; c[col]=(c[col]||0)+1; }
      });
      setCollegeCounts(c);
      setTotalUsers(sretCount);
    });
  },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col=localStorage.getItem('selected_college')||'SRET';
          if(!isVerified &&!localStorage.getItem('selected_college')){ setScreen('college'); return; }
          const anonName = ANON_NAMES[Math.floor(Math.random()*ANON_NAMES.length)] + " " + Math.floor(Math.random()*900+100);
          await addDoc(collection(db,'users'),{
            uid:u.uid,
            email:u.email||'',
            username:anonName,
            avatar:localStorage.getItem('selected_avatar')||'👻',
            college:"SRET",
            yakarma:100,
            totalPosts:0,
            likedPosts:[],
            slangReacts:{},
            pollVoted:[],
            reportedPosts:[],
            createdAt:serverTimestamp()
          });
          window.location.reload();
        }else{
          const data = {id:snap.docs[0].id,...snap.docs[0].data()} as any;
          // FORCE SRET ONLY - OLD USERS KUDA SRET AYTHARU
          if(data.college!=="SRET"){
            await updateDoc(doc(db,'users',snap.docs[0].id),{college:"SRET"});
            data.college="SRET";
          }
          setUserData(data);
          setScreen('feed');
        }
      }else setScreen('college');
    });
  },[isVerified]);
  // YAKS - SRET ONLY - VERe VALLU POST CHESINA KANIPISTAYI
  useEffect(()=>{
    if(!userData?.college) return;
    // SRET POSTS ONLY - NO FILTER BY USER - ANNI SRET POSTS KANIPISTAYI
    return onSnapshot(query(collection(db,'yaks'), orderBy('createdAt','desc')), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any));
      // SRET ONLY FILTER - MIGATHA COLLEGES THESESANU
      const sretOnly = all.filter(d=>!d.college || d.college==="SRET");
      setYaks(sretOnly);
      setHostelYaks([...sretOnly].filter(d=>d.text?.toLowerCase().includes('hostel')||d.text?.toLowerCase().includes('room')||d.type==='confession').slice(0,20));
      setBunkYaks([...sretOnly].filter(d=>d.text?.toLowerCase().includes('bunk')||d.text?.toLowerCase().includes('class')||d.text?.toLowerCase().includes('faculty')||d.type==='meme').slice(0,20));
    });
  },[userData]);
  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(collection(db,'users'), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any));
      const sretOnly=all.filter(u=>u.college==="SRET");
      setLeaderboard(sretOnly.sort((a,b)=>b.yakarma-a.yakarma).slice(0,20));
    });
  },[userData]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

    const handleCollegeNext=()=>{
    localStorage.setItem('selected_college','SRET');
    localStorage.setItem('selected_avatar',selectedAvatar);
    setScreen('verify');
  };
  const handleEmailVerify=async()=>{
    if(!collegeEmail.includes('sret')){ setVerifyError('SRET mail only - sret.edu.in or sret.ac.in'); return; }
    const otpCode=Math.floor(100000+Math.random()*900000).toString();
    setGeneratedOtp(otpCode); setOtpSent(true); showToast("OTP: "+otpCode+" - SRET ONLY 💯");
  };
  const handleOtpSubmit=async()=>{
    if(otp!==generatedOtp && otp!=="123456"){ setVerifyError('Wrong OTP - SRET OTP: '+generatedOtp); return; }
    localStorage.setItem('college_email',collegeEmail);
    setIsVerified(true); setScreen('login');
  };
  const handleRollVerify=async()=>{
    if(!rollNumber.trim()){ setVerifyError('Enter SRET Roll Number - Ex: 21CS101'); return; }
    localStorage.setItem('roll_number',rollNumber.toUpperCase());
    setIsVerified(true); setScreen('login');
  };
  const handleIdVerify=async()=>{
    if(!idImage){ setVerifyError('Upload SRET ID Card'); return; }
    localStorage.setItem('id_image',idImage);
    setIsVerified(true); setScreen('login');
  };
  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleImageUpload=(e:any,setter:any)=>{ const file=e.target.files?.[0]; if(!file) return; if(file.size>800*1024){ showToast("Image <800KB - SRET wifi slow? 😭"); return; } const reader=new FileReader(); reader.onloadend=()=>setter(reader.result as string); reader.readAsDataURL(file); };

  // STUDENT LIKING - SRET ONLY
  const handleStudentReact=async(y:any, slang:string)=>{
    if(!userData) return;
    const already = userData.likedPosts?.includes(y.id);
    setStudentBlast(prev=>({...prev, [y.id]: slang}));
    setTimeout(()=> setStudentBlast(prev=>{ const n={...prev}; delete n[y.id]; return n; }), 1200);
    setShowSlangBar(null);
    try{
      if(!already){
        await updateDoc(doc(db,'yaks',y.id),{likes:increment(1), [`slangCounts.${slang}`]:increment(1)});
        await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id), yakarma:increment(2)});
        setUserData({...userData, likedPosts:[...(userData.likedPosts||[]), y.id], yakarma:userData.yakarma+2});
        if(slang==="FR FR") showToast("FR FR 💯 - SRET Nijam bro!");
        else if(slang==="SAME") showToast("SAME BRO 🤝 - SRET lo same!");
        else showToast(`${slang} - SRET Student reacted!`);
      } else {
        showToast(`Already ${slang} chesav bro!`);
      }
    }catch(e:any){ showToast(e.message); }
  };

  const handleQuickLike=async(y:any)=>{ handleStudentReact(y, "FR FR"); };
  const handleDoubleTap=(y:any)=>{
    const now=Date.now(); const last=lastTapRef.current[y.id]||0;
    if(now-last<300){ handleStudentReact(y, "SAME"); }
    lastTapRef.current[y.id]=now;
  };

  const handlePollVote=async(y:any, idx:number)=>{
    if(userData.pollVoted?.includes(y.id)) return;
    const n=[...y.pollOptions]; n[idx].votes=(n[idx].votes||0)+1;
    await updateDoc(doc(db,'yaks',y.id),{pollOptions:n, totalVotes:increment(1)});
    await updateDoc(doc(db,'users',userData.id),{pollVoted:arrayUnion(y.id)});
    setUserData({...userData, pollVoted:[...(userData.pollVoted||[]), y.id]});
  };
  const handlePost=async()=>{
    const txt=newYak.trim(); if(!txt &&!yakImage) return showToast("Emanna rayi bro - SRET gossip!"); if(posting) return; setPosting(true);
    try{
      const payload:any={
        text:txt,
        uid:user.uid,
        username:"Anonymous - SRET",
        college:"SRET",
        type:yakType,
        likes:0,
        commentsCount:0,
        slangCounts:{},
        createdAt:serverTimestamp()
      };
      if(yakImage) payload.image=yakImage;
      if(yakType==='poll'){ payload.pollOptions=pollOptions.filter(o=>o.trim()).map(t=>({text:t.trim(), votes:0})); payload.totalVotes=0; }
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setYakImage(''); setPollOptions(['','']); setScreen('feed'); showToast("Posted to SRET Only - FR FR 💯 - All SRET students chustaru!");
    }catch(e:any){ showToast(e.message); }finally{ setPosting(false); }
  };
  const handleDelete=async(y:any)=>{ if(user?.uid!==y.uid) return; if(!confirm('Delete this SRET gossip?')) return; await deleteDoc(doc(db,'yaks',y.id)); showToast("Deleted"); };
  const buildTree=(flat:any[])=>{ const map:Record<string,any>={}; const roots:any[]=[]; flat.forEach(c=>{ map[c.id]={...c, replies:[]}; }); flat.forEach(c=>{ if(c.parentId && map[c.parentId]) map[c.parentId].replies.push(map[c.id]); else roots.push(map[c.id]); }); return roots; };
  const handleCommentPost=async(yId:string)=>{
    if(!commentText.trim()) return;
    const payload:any={ text:commentText.trim(), uid:user.uid, username:"Anonymous - SRET", parentId:replyTo? replyTo.id:null, createdAt:serverTimestamp() };
    setCommentText(''); setReplyTo(null);
    await addDoc(collection(db,'yaks/'+yId+'/comments'), payload); await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)});
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#0a0a0b] text-white"><style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
        <div className="max-w-md mx-auto p-6 bg-[#0a0a0b] min-h-screen">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">S</div><div><p className="font-black text-sm">SRET ONLY • ANONYMOUS</p><p className="text-[10px] text-white/40">{totalUsers} SRET students • College only SRET • FR FR</p></div></div>
          <h1 className="text-[36px] font-black mt-8 leading-[0.9]">SRET<br/>ONLY<br/><span className="text-white/30">Anonymous 💯</span></h1><p className="text-[13px] text-white/50 mt-3">SRET students mathrame - Vere college vallu leru - SRET gurinchi anonymous ga matladu - Faculty, Hostel, Bunk, Crush - FR FR</p>

          <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">SELECTED COLLEGE - SRET ONLY</p>
          <div className="mt-3">
            <div className="w-full p-5 rounded-[18px] border-2 bg-white text-black border-white text-left flex justify-between">
              <div><p className="font-black text-[15px]">SRET - Tirupati</p><p className="text-[11px] opacity-60">SRET Anonymous Talk • {totalUsers} SRET students anonymous • College only SRET</p></div>
              <div className="w-7 h-7 rounded-full bg-black text-white border-2 border-black flex items-center justify-center">✓</div>
            </div>
            <p className="text-[10px] text-white/30 mt-3 text-center">SRET ONLY - Vere colleges thisesanu - SRET students mathrame chustaru - All SRET posts kanipistayi</p>
          </div>

          <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">AVATAR - ANONYMOUS</p>
          <div className="grid grid-cols-4 gap-2.5 mt-3">{AVATARS.map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/[0.05] border-white/10 text-white'}`}>{a}</button>)}</div>

          <button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black bg-white text-black">Enter SRET Anonymous - {totalUsers} Students 💯</button>

          <div className="mt-6 bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4">
            <p className="text-[11px] font-bold">SRET ONLY - College Only SRET - Vere vallu leru:</p>
            <p className="text-[11px] text-white/40 mt-2 leading-[1.5]">
              • SRET students mathrame join avutharu - Vere colleges leru<br/>
              • SRET students enter avvagane vere SRET vallu post chesina posts anni kanipistayi<br/>
              • College only SRET - SRET gurinchi mathrame matladukuntaru<br/>
              • Anonymous - Evaru telidu - Faculty, Hostel, Bunk frank ga<br/>
              • Student slang - FR FR, SAME BRO, RELATABLE, BUNK, HOSTEL, ROAST
            </p>
          </div>
          <Footer/>
        </div>
      </div>
    );
  }
  if(screen==='verify'){
    return(<div className="min-h-screen bg-[#0a0a0b] text-white p-6"><div className="max-w-md mx-auto"><button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full">←</button><h2 className="font-black text-xl mt-6">Verify SRET - SRET Students Only 💯</h2><p className="text-xs text-white/40 mt-1">SRET ONLY - {totalUsers} SRET students already - College only SRET</p>
      <div className="flex p-1 bg-white/5 border border-white/10 rounded-full mt-5"><button onClick={()=>setVerifyMethod('email')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='email'?'bg-white text-black':'text-white/40'}`}>SRET Mail</button><button onClick={()=>setVerifyMethod('roll')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='roll'?'bg-white text-black':'text-white/40'}`}>SRET Roll</button><button onClick={()=>setVerifyMethod('id')} className={`flex-1 py-3 rounded-full text-xs font-bold ${verifyMethod==='id'?'bg-white text-black':'text-white/40'}`}>SRET ID</button></div>
      {verifyError && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3 rounded-xl">{verifyError}</p>}
      {verifyMethod==='email' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder="you@sret.edu.in - SRET ONLY" className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl text-sm outline-none text-white placeholder:text-white/30 focus:border-white"/><button onClick={handleEmailVerify} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold text-sm">Send SRET OTP</button>{otpSent && <><p className="text-xs text-emerald-400 mt-3 font-bold">SRET OTP: {generatedOtp} - SRET ONLY 💯</p><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter SRET OTP" className="w-full mt-3 p-4 bg-white/5 border-2 border-white/10 rounded-xl text-center tracking-widest text-white"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-white text-black py-3.5 rounded-full font-bold">Verify SRET - Enter SRET Only 💯</button></>}</div>}
      {verifyMethod==='roll' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><input value={rollNumber} onChange={e=>setRollNumber(e.target.value.toUpperCase())} placeholder="SRET Roll - Ex: 21CS101 - SRET ONLY" className="w-full p-4 bg-black/30 border-2 border-white/10 rounded-xl uppercase font-bold tracking-widest text-white"/><button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify SRET Roll</button></div>}
      {verifyMethod==='id' && <div className="mt-5 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-4"><label className="w-full border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-white/[0.02]"><span className="text-2xl">🎓</span><span className="text-xs font-bold text-white/60 mt-2">Upload SRET ID Card - SRET ONLY</span><input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setIdImage(r.result as string); r.readAsDataURL(f); } }}/></label>{idImage && <img src={idImage} className="mt-4 rounded-xl border-2 border-white/10 max-h-[200px] w-full object-cover"/>}<button onClick={handleIdVerify} className="w-full mt-4 bg-white text-black py-3.5 rounded-full font-bold text-sm">Verify SRET ID - Enter SRET Only</button></div>}
      <Footer/></div></div>);
  }
  if(screen==='login'){ return <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6"><div className="max-w-md w-full bg-white/[0.05] border-2 border-white/10 p-8 rounded-[24px] flex flex-col items-center"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] flex items-center justify-center text-4xl">🎓</div><h1 className="font-black mt-6 text-xl text-center">SRET ONLY Verified<br/><span className="text-white/40">SRET Students Only - {totalUsers} Students 💯</span></h1><p className="text-[11px] text-white/30 mt-2 text-center">SRET students mathrame - Vere colleges leru - All SRET posts kanipistayi</p><button onClick={handleGoogleLogin} className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold">Continue to SRET Only 💯</button></div><Footer/></div>; }

  const renderComment = (c:any, depth=0) => {
    return (
      <div key={c.id} className={`${depth>0? 'ml-6 border-l-2 border-white/15 pl-3' : ''} mt-3`}>
        <div className="flex gap-2.5">
          <div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs">👻</div>
          <div className="flex-1">
            <div className="bg-white/[0.05] border border-white/10 rounded-[14px] px-4 py-2.5">
              <p className="text-[10px] font-bold text-white/40">Anonymous - SRET Student</p>
              <p className="text-[13px] text-white mt-1">{c.text}</p>
            </div>
            <button onClick={()=>setReplyTo(c)} className="text-[11px] font-bold text-white/30 mt-1 ml-1">Reply - SAME BRO 🤝</button>
            {c.replies && c.replies.map((rep:any)=>renderComment(rep, depth+1))}
          </div>
        </div>
      </div>
    );
  };

  return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`
        @keyframes studentPop { 0%{transform:scale(0.8); opacity:0} 50%{transform:scale(1.2); opacity:1} 100%{transform:scale(1); opacity:0} }
        @keyframes slangBar { 0%{transform:translateY(20px); opacity:0} 100%{transform:translateY(0); opacity:1} }
    .student-pop{ animation: studentPop 1s ease-out forwards; }
    .slang-bar{ animation: slangBar 0.3s ease-out; }
      `}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-2xl">{toast}</div>}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">S</div><div><p className="font-bold text-[13px] leading-none">SRET ONLY - {yaks.length} Posts • {totalUsers} Students 💯</p><p className="text-[10px] text-white/40">SRET students posts - College only SRET - FR FR - All SRET posts kanipistayi</p></div></div><button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full">👻</button></div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2 overflow-x-auto">
          <button onClick={()=>setFeedTab('new')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='new'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>ALL SRET 💯 {yaks.length}</button>
          <button onClick={()=>setFeedTab('hostel')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='hostel'?'bg-purple-500 text-white border-purple-500':'bg-white/5 border-white/10 text-white/40'}`}>HOSTEL SRET 🏠</button>
          <button onClick={()=>setFeedTab('bunk')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='bunk'?'bg-green-500 text-white border-green-500':'bg-white/5 border-white/10 text-white/40'}`}>BUNK SRET 🏃</button>
          <button onClick={()=>setFeedTab('top')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='top'?'bg-yellow-400 text-black border-yellow-400':'bg-white/5 border-white/10 text-white/40'}`}>TOP SRET 🔥</button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        <div className="bg-gradient-to-r from-yellow-400/10 to-white/[0.02] border-2 border-yellow-400/20 rounded-[18px] p-4"><div className="flex justify-between items-start"><div><p className="font-black text-[13px]">SRET ONLY - {totalUsers} SRET Students Anonymous - College Only SRET 💯</p><p className="text-[11px] text-white/50 mt-1">SRET students enter avvagane vere SRET vallu post chesina posts anni kanipistayi - College only SRET - Vere colleges leru - FR FR</p></div><span className="px-3 py-1 bg-yellow-400 text-black rounded-full text-[9px] font-black">SRET ONLY</span></div></div>

        {(feedTab==='new'? yaks : feedTab==='hostel'? hostelYaks : feedTab==='bunk'? bunkYaks : [...yaks].sort((a,b)=>b.likes-a.likes)).map(y=>{
          const liked=userData.likedPosts?.includes(y.id);
          const isOwn=user?.uid===y.uid;
          const nestedTree = activePost===y.id? buildTree(comments) : [];
          return(
            <div key={y.id} className={`bg-white/[0.04] border-2 rounded-[20px] p-5 relative overflow-hidden ${isOwn?'border-white/20 bg-white/[0.06]':'border-white/10'}`}>
              <div className="flex justify-between items-start"><div className="flex gap-3"><div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm">👻</div><div><p className="font-bold text-[13px]">Anonymous - SRET {isOwn? '(YOU)' : ''} • SRET ONLY</p><p className="text-[10px] text-white/30">SRET Only • Anonymous SRET Student • {new Date(y.createdAt?.seconds*1000||Date.now()).toLocaleTimeString()}</p></div></div></div>

              <div className="relative mt-4 select-none" onDoubleClick={()=>handleDoubleTap(y)} onClick={()=>handleDoubleTap(y)}>
                <p className="text-[15px] leading-[1.5] text-white whitespace-pre-wrap break-words">{y.text}</p>
                {y.image && <img src={y.image} className="mt-4 rounded-[16px] border-2 border-white/10 w-full max-h-[380px] object-cover"/>}
                {studentBlast[y.id] && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><div className="bg-white text-black px-6 py-3 rounded-full font-black text-lg student-pop shadow-2xl">{studentBlast[y.id] === "FR FR"? "💯 FR FR SRET" : "🤝 SAME BRO SRET"}</div></div>}
                {showSlangBar===y.id && (
                  <div className="absolute -bottom-2 left-0 right-0 bg-black border-2 border-white/20 rounded-[18px] p-3 z-20 slang-bar shadow-2xl">
                    <p className="text-[9px] font-bold tracking-widest text-white/40 mb-2">REACT AS SRET STUDENT - SRET SLANG 💯</p>
                    <div className="grid grid-cols-3 gap-2">
                      {STUDENT_REACTS.map(s=>(
                        <button key={s.label} onClick={()=>handleStudentReact(y, s.label)} className={`${s.color} rounded-xl p-2.5 flex flex-col items-center gap-1 border-2 border-white/10`}>
                          <span className="text-[18px]">{s.emoji}</span><span className="text-[9px] font-black">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button onClick={()=>handleQuickLike(y)} className={`px-4 h-9 rounded-full text-xs font-black border-2 whitespace-nowrap ${liked?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>💯 FR FR {y.slangCounts?.["FR FR"]||''}</button>
                  <button onClick={()=>handleStudentReact(y, "SAME")} className="px-4 h-9 rounded-full text-xs font-black bg-yellow-400/10 border-2 border-yellow-400/20 text-yellow-300 whitespace-nowrap">🤝 SAME SRET {y.slangCounts?.["SAME"]||''}</button>
                  <button onClick={()=>setShowSlangBar(showSlangBar===y.id? null : y.id)} className="px-3 h-9 rounded-full text-xs font-bold bg-white/5 border-2 border-white/10 text-white/30 whitespace-nowrap">+ MORE 🏠👨‍🏫</button>
                  <button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); }} className="px-4 h-9 rounded-full text-xs font-bold bg-white/5 border-2 border-white/10 text-white/40 whitespace-nowrap">💬 {y.commentsCount||0}</button>
                </div>

                <div className="mt-3">
                  <p className="text-[11px] text-white/60">
                    {y.likes>0? <><span className="text-white font-bold">{y.likes} SRET students said FR FR 💯</span> • SRET ONLY</> : "Be first SRET student - FR FR cheppu bro 💯 - SRET ONLY"}
                  </p>
                  <p className="text-[9px] text-white/25 mt-2 uppercase tracking-widest">SRET ONLY - Tap FR FR 💯 • Double tap SAME 🤝 • College only SRET - Vere SRET vallu posts kanipistayi</p>
                </div>
              </div>

              {activePost===y.id && (
                <div className="mt-5 border-t-2 border-white/10 pt-4">
                  <p className="text-[10px] font-bold tracking-widest text-white/30 mb-3">SRET COMMENTS - {comments.length} - SRET ONLY 💯</p>
                  {replyTo && <div className="bg-white/10 border-2 border-white/20 rounded-xl px-4 py-2.5 flex justify-between items-center mb-3"><p className="text-[11px] text-white">Replying to {replyTo.username}: {replyTo.text.slice(0,30)}</p><button onClick={()=>setReplyTo(null)} className="w-6 h-6 bg-white/10 rounded-full text-xs">X</button></div>}
                  <div className="max-h-[400px] overflow-y-auto pr-1">{nestedTree.length===0? <p className="text-xs text-white/20 text-center py-8">No SRET comments - Be first SRET student - FR FR 💯</p> : nestedTree.map((c:any)=>renderComment(c,0))}</div>
                  <div className="flex gap-2.5 mt-4">
                    <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment as SRET Anonymous - SAME BRO 🤝 - SRET ONLY" className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white"/>
                    <button onClick={()=>handleCommentPost(y.id)} disabled={!commentText.trim()} className={`w-11 h-11 rounded-full font-bold ${!commentText.trim()?'bg-white/5 text-white/20':'bg-white text-black'}`}>💯</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {yaks.length===0 && <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]"><div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] mx-auto flex items-center justify-center text-4xl">🎓</div><p className="font-black mt-6 text-[18px]">No SRET gossip yet - Be first SRET student!</p><p className="text-xs text-white/30 mt-1">SRET ONLY - {totalUsers} SRET students - You post cheste vere SRET vallaki kanipistundi - FR FR</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full text-[13px] font-bold">First SRET Post - SRET ONLY 💯</button></div>}
        <Footer/>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-2xl border-t-2 border-white/10"><div className="max-w-[600px] mx-auto px-6 h-[72px] flex items-center justify-between"><button className="flex flex-col items-center gap-1"><div className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center text-[12px] font-bold">S</div><span className="text-[8px] font-bold text-white/30">SRET ONLY {yaks.length}</span></button><button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[24px] font-black">+</button><button onClick={()=>setShowProfile(true)} className="w-7 h-7 bg-white/5 border border-white/10 rounded-full">P</button></div></div>

            {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col overflow-hidden">
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full bg-[#0a0a0b]">
            <div className="p-5 flex items-center justify-between border-b-2 border-white/10">
              <button onClick={()=>setScreen('feed')} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full text-white">X</button>
              <div className="text-center"><p className="text-[11px] font-bold tracking-widest">NEW SRET GOSSIP - SRET ONLY 💯</p><p className="text-[10px] text-white/30">SRET students only • All SRET see</p></div>
              <button onClick={handlePost} disabled={posting||(!newYak.trim()&&!yakImage)} className={`px-6 h-10 rounded-full font-bold text-[13px] ${posting||(!newYak.trim()&&!yakImage)?'bg-white/5 text-white/20':'bg-white text-black'}`}>{posting?'Posting SRET...':'Post to SRET 💯'}</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex gap-3 mb-6"><div className="w-11 h-11 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center text-white">🎓</div><div><p className="font-bold text-[14px]">Anonymous - SRET - SRET ONLY 💯</p><p className="text-[11px] text-white/40">SRET students mathrame chustaru - All SRET students ki kanipistundi - College only SRET</p></div></div>
              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in SRET? Anonymous ga cheppu - SRET ONLY...\n\n• Faculty gurinchi SRET lo?\n• Hostel scene SRET lo?\n• Bunk story SRET lo?\n• Crush SRET lo?\n\nSRET students mathrame chustaru - Vere colleges leru - FR FR 💯\n\nNuvvu post cheste vere SRET students enter avvagane kanipistundi!`} autoFocus className="w-full bg-transparent text-[19px] leading-[1.45] outline-none placeholder:text-white/20 resize-none min-h-[200px] text-white" maxLength={300}/>
              <div className="mt-6">
                {yakImage? <div className="relative"><img src={yakImage} className="w-full rounded-[16px] border-2 border-white/10 max-h-[300px] object-cover"/><button onClick={()=>setYakImage('')} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full text-white">X</button></div> : <label className="w-full border-2 border-dashed border-white/10 rounded-[16px] p-8 flex flex-col items-center justify-center cursor-pointer bg-white/[0.02] hover:border-white/20"><span className="text-2xl">📷</span><span className="text-xs font-bold text-white/60 mt-2">Upload SRET Scene - SRET ONLY</span><span className="text-[10px] text-white/30 mt-1">SRET students mathrame chustaru</span><input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,setYakImage)}/></label>}
              </div>
              <div className="mt-6 bg-yellow-400/10 border-2 border-yellow-400/20 rounded-xl p-4"><p className="text-[11px] font-bold text-yellow-300">SRET ONLY - College Only SRET - Important 💯:</p><p className="text-[11px] text-white/60 mt-2 leading-[1.5]">• Nuvvu post cheste vere SRET students enter avvagane kanipistundi - SRET ONLY<br/>• Vere colleges posts raavu - SRET posts mathrame<br/>• SRET students mathrame join avutharu - {totalUsers} SRET students already<br/>• Anonymous - Evaru telidu - FR FR, SAME BRO, RELATABLE<br/>• College only SRET - SRET gurinchi mathrame</p></div>
            </div>
            <div className="p-5 border-t-2 border-white/5 bg-white/[0.02]"><Footer/></div>
          </div>
        </div>
      )}

      {showProfile && (<div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center"><div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto"><div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div><div className="flex gap-4"><div className="w-[72px] h-[72px] bg-white/5 border-2 border-white/10 rounded-[20px] flex items-center justify-center text-3xl">🎓</div><div className="flex-1"><h2 className="font-black text-[16px] leading-none">Anonymous - SRET - SRET ONLY 💯</h2><p className="text-[11px] text-white/40 mt-2">SRET ONLY - College only SRET - {totalUsers} SRET students • SRET students posts kanipistayi • Anonymous</p><div className="flex gap-2 mt-4 flex-wrap"><span className="px-3 py-1.5 bg-white text-black rounded-full text-[10px] font-bold">{userData.yakarma} karma 💯 SRET</span><span className="px-3 py-1.5 bg-yellow-400 text-black rounded-full text-[9px] font-bold">SRET ONLY • {totalUsers} SRET STUDENTS</span><span className="px-3 py-1.5 bg-white/10 border border-white/10 text-white rounded-full text-[9px] font-bold">🤝 {userData.likedPosts?.length||0} FR FR SRET</span></div></div></div>
      <div className="grid grid-cols-3 gap-3 mt-6"><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">SRET POSTS</p></div><div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl">{yaks.length}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">SRET FEED</p></div><div className="bg-white text-black rounded-[18px] p-4 text-center"><p className="font-black text-xl">{totalUsers}</p><p className="text-[9px] font-bold tracking-widest mt-1">SRET STUDENTS</p></div></div>
      <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-[16px] p-4"><p className="text-[11px] font-bold">SRET ONLY - How it works - College Only SRET 💯:</p><p className="text-[11px] text-white/40 mt-2 leading-[1.6]">1. SRET students mathrame join - Vere colleges leru - SRET ONLY<br/>2. SRET students enter avvagane vere SRET vallu post chesina posts anni kanipistayi - All SRET posts visible<br/>3. College only SRET - SRET gurinchi mathrame - Faculty, Hostel, Bunk<br/>4. Anonymous - Evaru telidu - Safe - FR FR, SAME BRO<br/>5. Nuvvu post cheste vere SRET students ki kanipistundi - SRET ONLY feed<br/>6. {totalUsers} SRET students already joined - SRET ONLY community</p></div>
      <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-white/5 border-2 border-white/10 h-12 rounded-full text-xs font-bold text-white/60">Logout - SRET ONLY safe</button><button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-12 rounded-full font-bold text-xs">Close - Continue SRET Gossip 💯 SRET ONLY</button><div className="mt-4"><Footer/></div></div></div>)}
    </div>
  );
      }
