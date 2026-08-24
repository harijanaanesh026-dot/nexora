import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc, arrayUnion } from 'firebase/firestore';

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

// ✅ COLLEGES WITH VERIFICATION RULES
const COLLEGES_DATA:any = {
  "BITS": { domains: ["bits", "bits-pilani"], rollPattern: /^BITS\d{4,6}$/i, example: "BITS2021001" },
  "SRET": { domains: ["sret", "sret.edu"], rollPattern: /^SRET\d{4,6}$/i, example: "SRET21001" },
  "SVCE": { domains: ["svce", "svce.edu"], rollPattern: /^SVCE\d{4,6}$/i, example: "SVCE21001" },
  "ST.JOHNS": { domains: ["stjohns", "stjohns.edu"], rollPattern: /^SJ\d{4,6}$/i, example: "SJ21001" },
  "ARTS & SCIENCE": { domains: ["arts", "science"], rollPattern: /^ARTS\d{4,6}$/i, example: "ARTS21001" },
  "VEMU": { domains: ["vemu", "vemu.edu"], rollPattern: /^VEMU\d{4,6}$/i, example: "VEMU21001" },
  "OTHER": { domains: [], rollPattern: /.*/, example: "OTHER001" },
};

const COLLEGES = Object.keys(COLLEGES_DATA);
const TOPICS = [
  {name:"Confessions",icon:"🤫",color:"bg-pink-500"},
  {name:"Crushes",icon:"💘",color:"bg-red-500"},
  {name:"Memes",icon:"😂",color:"bg-yellow-500"},
  {name:"Academics",icon:"📚",color:"bg-blue-500"},
  {name:"Hostel",icon:"🏠",color:"bg-green-500"},
];

export default function YakApp(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState<any>('college');
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
  const [editYak,setEditYak]=useState<any>(null);
  const [loginError,setLoginError]=useState('');
  const [selectedCollege,setSelectedCollege]=useState('');
  const [verifyMethod,setVerifyMethod]=useState<'email'|'roll'|'idcard'>('email');
  const [collegeEmail,setCollegeEmail]=useState('');
  const [rollNumber,setRollNumber]=useState('');
  const [idCardImage,setIdCardImage]=useState('');
  const [otpSent,setOtpSent]=useState(false);
  const [otp,setOtp]=useState('');
  const [generatedOtp,setGeneratedOtp]=useState('');
  const [isVerified,setIsVerified]=useState(false);

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          if(!isVerified){ setScreen('college'); return; }
          const username=`Yak_${Math.floor(Math.random()*9000)+1000}`;
          await addDoc(collection(db,'users'),{
            uid:u.uid,email:u.email,username,
            college:localStorage.getItem('selected_college'),
            collegeEmail:localStorage.getItem('college_email')||'',
            rollNumber:localStorage.getItem('roll_number')||'',
            idCardImage:localStorage.getItem('idcard_image')||'',
            verifyMethod:localStorage.getItem('verify_method'),
            verified:true, verificationStatus: localStorage.getItem('verify_method')==='idcard'?'pending':'approved',
            karma:100,totalPosts:0,createdAt:serverTimestamp()
          });
          window.location.reload();
        } else {
          const data=snap.docs[0].data() as any;
          if(data.verificationStatus==='pending'){
            setScreen('pending');
            setUserData({id:snap.docs[0].id,...data});
          } else {
            setUserData({id:snap.docs[0].id,...data});
            setScreen('feed');
          }
        }
      } else setScreen('college');
    });
  },[isVerified]);

  useEffect(()=>{
    if(!userData?.college) return;
    return onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')),s=>{
      let data=s.docs.map(d=>({id:d.id,...d.data()} as any)).filter(y=>y.college===userData.college);
      if(topic!=='All') data=data.filter(y=>y.topic===topic);
      if(search) data=data.filter(y=> y.text?.toLowerCase().includes(search.toLowerCase()));
      setYaks(data);
    });
  },[userData,topic,search]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,`yaks/${activePost}/comments`),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

  const handleCollegeNext = () => {
    if(!selectedCollege) return alert('College select chey bro!');
    localStorage.setItem('selected_college', selectedCollege);
    setScreen('verify');
  };

  // TIER 1: College Email Verify
  const handleEmailVerify = () => {
    if(!collegeEmail.includes('@')) return alert('Valid college email pettu bro!');
    const collegeData = COLLEGES_DATA[selectedCollege];
    const emailLower = collegeEmail.toLowerCase();
    const domainMatch = collegeData.domains.some((d:string)=> emailLower.includes(d)) || selectedCollege==="OTHER" || emailLower.includes('edu');

    if(!domainMatch && selectedCollege!=="OTHER"){
      return alert(`Email lo ${collegeData.domains.join(' or ')} undali bro! Ex: 20XX@${collegeData.domains[0]}.ac.in`);
    }
    // Generate OTP (in real app, send via email API - here demo OTP)
    const otpCode = Math.floor(100000 + Math.random()*900000).toString();
    setGeneratedOtp(otpCode);
    setOtpSent(true);
    alert(`DEMO OTP for ${collegeEmail}: ${otpCode} \n(Real app lo email ki velthundi)`);
  };

  const handleOtpSubmit = () => {
    if(otp===generatedOtp){
      localStorage.setItem('college_email', collegeEmail);
      localStorage.setItem('verify_method', 'email');
      setIsVerified(true);
      setScreen('login');
    } else alert('Wrong OTP bro! Demo OTP: '+generatedOtp);
  };

  // TIER 2: Roll Number Verify
  const handleRollVerify = () => {
    const collegeData = COLLEGES_DATA[selectedCollege];
    if(!collegeData.rollPattern.test(rollNumber) && selectedCollege!=="OTHER" && rollNumber.length<4){
      return alert(`Roll number format wrong! Ex: ${collegeData.example} la pettu`);
    }
    if(rollNumber.length<4) return alert('Valid Roll Number pettu bro!');
    localStorage.setItem('roll_number', rollNumber);
    localStorage.setItem('verify_method', 'roll');
    setIsVerified(true);
    setScreen('login');
  };

  // TIER 3: ID Card Upload
  const handleIdCardVerify = () => {
    if(!idCardImage) return alert('ID Card photo upload chey bro!');
    localStorage.setItem('idcard_image', idCardImage);
    localStorage.setItem('verify_method', 'idcard');
    setIsVerified(true);
    setScreen('login');
  };

  const handleGoogleLogin = async () => {
    try{ await signInWithPopup(auth, provider); }
    catch(e:any){ try{ await signInWithRedirect(auth, provider); }catch(err:any){ setLoginError(err.message); } }
  };

  const handlePost=async()=>{
    if(!newYak.trim() && images.length===0 &&!poll.q1) return alert('Emanna rayi bro!');
    try{
      const payload:any={ text:newYak.trim(), uid:user.uid, username:userData.username, college:userData.college, topic:topic==='All'?'Memes':topic, likes:0, dislikes:0, commentsCount:0, imageUrls:images, poll: poll.q1?{q1:poll.q1,q2:poll.q2,v1:0,v2:0,voters:[]}:null, createdAt:serverTimestamp() };
      if(editYak){ await updateDoc(doc(db,'yaks',editYak.id),{text:newYak.trim()}); setEditYak(null); }
      else { await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1)}); }
      setNewYak(''); setImages([]); setPoll({q1:'',q2:''}); setScreen('feed');
    }catch(e:any){ alert(e.message); }
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-yellow-400/20 rounded-full blur-[100px]"></div>
        <div className="z-10 w-full max-w-md">
          <div className="text-center"><div className="w-16 h-16 bg-yellow-400 rounded-[20px] mx-auto flex items-center justify-center font-black text-black text-2xl">Y</div><h1 className="text-5xl font-black mt-6">YAK<span className="text-yellow-400">.</span></h1><p className="text-zinc-400 text-sm mt-2">Campus verified only 🔒</p></div>
          <h2 className="font-bold text-lg mt-10">Select your campus 👇</h2>
          <div className="grid grid-cols-1 gap-2.5 mt-4">
            {COLLEGES.map(c=>{
              const active=selectedCollege===c;
              return <button key={c} onClick={()=>setSelectedCollege(c)} className={`w-full p-4 rounded-2xl border text-left font-bold flex justify-between items-center ${active?'bg-white text-black scale-[1.02]':'bg-[#141414] border-zinc-800 text-zinc-300'}`}><span className="flex gap-3"><span className={`w-9 h-9 rounded-xl flex items-center justify-center ${active?'bg-black text-white':'bg-zinc-800'}`}>{c[0]}</span>{c}</span>{active?'✓':''}</button>
            })}
          </div>
          <button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full mt-6 py-4 rounded-full font-black ${selectedCollege?'bg-yellow-400 text-black':'bg-zinc-800 text-zinc-500'}`}>Verify {selectedCollege} →</button>
        </div>
      </div>
    );
  }

  if(screen==='verify'){
    const collegeData = COLLEGES_DATA[selectedCollege];
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <button onClick={()=>setScreen('college')} className="text-zinc-500 text-sm mb-6">← Back</button>
          <h1 className="text-3xl font-black">Verify you are from<br/><span className="text-yellow-400">{selectedCollege}</span> 🎓</h1>
          <p className="text-zinc-500 text-xs mt-2">3 methods lo edaina okati - fake users block cheyadaniki</p>

          <div className="flex gap-2 mt-6 p-1.5 bg-[#141414] border border-zinc-800 rounded-full w-fit">
            {[
              {id:'email',label:'📧 Email',desc:'Instant'},
              {id:'roll',label:'🎫 Roll No',desc:'Instant'},
              {id:'idcard',label:'🪪 ID Card',desc:'Manual'},
            ].map(m=><button key={m.id} onClick={()=>setVerifyMethod(m.id as any)} className={`px-4 py-2 rounded-full text-xs font-bold ${verifyMethod===m.id?'bg-white text-black':'text-zinc-500'}`}>{m.label}</button>)}
          </div>

          {verifyMethod==='email' && (
            <div className="mt-6 bg-[#141414] border border-zinc-800 rounded-[24px] p-5">
              <div className="flex items-center gap-2"><span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">📧</span><div><p className="font-bold text-sm">College Email Verify</p><p className="text-[11px] text-zinc-500">Fastest - 10 seconds</p></div><span className="ml-auto text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Recommended</span></div>
              <p className="text-[11px] text-zinc-500 mt-4">Enter your college email. Ex: <span className="text-white">{collegeData?.domains[0]}.ac.in</span></p>
              <input value={collegeEmail} onChange={e=>setCollegeEmail(e.target.value)} placeholder={`yourname@${collegeData?.domains[0]||'college'}.ac.in`} className="w-full mt-3 p-4 bg-[#0a0a0a] border border-zinc-800 rounded-2xl text-sm outline-none focus:border-yellow-400/50"/>
              {!otpSent? <button onClick={handleEmailVerify} className="w-full mt-4 bg-white text-black py-4 rounded-full font-bold">Send OTP to Email →</button> :
                <div className="mt-4"><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter 6-digit OTP" className="w-full p-4 bg-[#0a0a0a] border border-zinc-800 rounded-2xl text-sm text-center tracking-[0.5em]"/><button onClick={handleOtpSubmit} className="w-full mt-3 bg-yellow-400 text-black py-4 rounded-full font-bold">Verify OTP ✓</button><p className="text-[10px] text-zinc-500 text-center mt-2">Demo OTP: {generatedOtp} (real app lo email ki velthundi)</p></div>
              }
            </div>
          )}

          {verifyMethod==='roll' && (
            <div className="mt-6 bg-[#141414] border border-zinc-800 rounded-[24px] p-5">
              <div className="flex items-center gap-2"><span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">🎫</span><div><p className="font-bold text-sm">Roll Number Verify</p><p className="text-[11px] text-zinc-500">Ex: {collegeData?.example}</p></div></div>
              <input value={rollNumber} onChange={e=>setRollNumber(e.target.value)} placeholder={collegeData?.example} className="w-full mt-4 p-4 bg-[#0a0a0a] border border-zinc-800 rounded-2xl text-sm outline-none uppercase"/>
              <p className="text-[10px] text-zinc-500 mt-2">Pattern: {collegeData?.rollPattern.toString()} - {selectedCollege} roll number la undali</p>
              <button onClick={handleRollVerify} className="w-full mt-4 bg-white text-black py-4 rounded-full font-bold">Verify Roll Number →</button>
            </div>
          )}

          {verifyMethod==='idcard' && (
            <div className="mt-6 bg-[#141414] border border-zinc-800 rounded-[24px] p-5">
              <div className="flex items-center gap-2"><span className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">🪪</span><div><p className="font-bold text-sm">ID Card Upload</p><p className="text-[11px] text-zinc-500">Admin will approve in 24h</p></div></div>
              <label className="w-full mt-4 border-2 border-dashed border-zinc-800 p-6 rounded-2xl flex flex-col items-center cursor-pointer hover:border-yellow-400/30">
                {idCardImage? <img src={idCardImage} className="h-32 rounded-xl object-cover"/> : <><span className="text-3xl">📸</span><p className="text-sm text-zinc-400 mt-2">Upload College ID Card</p><p className="text-[10px] text-zinc-600">Name, College, Photo kanipinchali</p></>}
                <input type="file" hidden accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setIdCardImage(r.result as string); r.readAsDataURL(f); } }}/>
              </label>
              <button onClick={handleIdCardVerify} disabled={!idCardImage} className={`w-full mt-4 py-4 rounded-full font-bold ${idCardImage?'bg-white text-black':'bg-zinc-800 text-zinc-500'}`}>Submit for Verification →</button>
            </div>
          )}

          <div className="mt-6 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-3"><p className="text-[11px] text-yellow-400 font-bold">🔒 Why verify? BITS vaadu SRET lo ki raakudadu - campus isolation kosam</p></div>
        </div>
      </div>
    );
  }

  if(screen==='login'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center text-2xl">✓</div>
          <h1 className="text-3xl font-black mt-4">Verified! You are from<br/><span className="text-yellow-400">{selectedCollege || localStorage.getItem('selected_college')}</span></h1>
          <p className="text-zinc-500 text-sm mt-2">Method: {localStorage.getItem('verify_method')} • Now login with Google</p>
          <div className="mt-8 bg-[#141414] border border-zinc-800 rounded-[24px] p-6">
            <button onClick={handleGoogleLogin} className="w-full bg-white text-black py-4 rounded-full font-bold flex items-center justify-center gap-3"><img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5"/> Continue with Google</button>
            {loginError && <p className="text-xs text-red-400 mt-3">{loginError}</p>}
          </div>
        </div>
      </div>
    );
  }

  if(screen==='pending'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-orange-500/20 border border-orange-500/30 rounded-full mx-auto flex items-center justify-center text-3xl">⏳</div>
        <h1 className="text-3xl font-black mt-6">Verification Pending</h1>
        <p className="text-zinc-500 text-sm mt-2">Your ID card is under review for {userData?.college}<br/>Admin will approve in 24 hours</p>
        <div className="mt-6 bg-[#141414] border border-zinc-800 rounded-2xl p-4 text-left w-full max-w-md"><p className="text-xs text-zinc-500">Submitted:</p><p className="text-sm font-bold mt-1">{userData?.college} • {userData?.verifyMethod} • {userData?.rollNumber||userData?.collegeEmail}</p>{userData?.idCardImage && <img src={userData.idCardImage} className="mt-3 h-32 rounded-xl object-cover"/>}</div>
        <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="mt-8 bg-zinc-800 px-6 py-3 rounded-full text-sm">Logout</button>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="p-4 flex justify-between items-center max-w-xl mx-auto">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center font-black text-black">Y</div><div><h1 className="font-black text-[14px]">YAK. {userData.college}</h1><p className="text-[10px] text-green-400">✓ Verified • {userData.verifyMethod} • Isolated</p></div></div>
          <button onClick={()=>setShowProfile(true)} className="bg-[#1a1a1a] border border-zinc-800 px-4 h-9 rounded-full text-xs font-bold">👻 {userData.username}</button>
        </div>
        <div className="px-4 pb-3 max-w-xl mx-auto">
          <div className="flex gap-2 overflow-x-auto"><button onClick={()=>setTopic('All')} className={`px-5 py-2.5 rounded-full text-xs font-bold border ${topic==='All'?'bg-white text-black':'bg-[#141414] border-zinc-800 text-zinc-400'}`}>All</button>{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2.5 rounded-full text-xs font-bold border ${topic===t.name?'bg-yellow-400 text-black':'bg-[#141414] border-zinc-800 text-zinc-500'}`}>{t.icon} {t.name}</button>)}</div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-3 space-y-3 mt-2">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 flex items-center gap-3"><span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-black">✓</span><div><p className="text-xs font-bold text-green-400">Verified {userData.college} Student</p><p className="text-[11px] text-zinc-400">Method: {userData.verifyMethod} • ID: {userData.rollNumber||userData.collegeEmail?.slice(0,15)}...</p></div></div>

        {yaks.map(y=>{
          const total=(y.poll?.v1||0)+(y.poll?.v2||0);
          const isOwner=user?.uid===y.uid;
          return(
            <div key={y.id} className="bg-[#141414] border border-zinc-800 rounded-[24px] p-5">
              <div className="flex justify-between"><p className="text-xs font-bold">👻 {y.username} • {y.college} {isOwner && <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[9px]">YOU</span>}</p>
                <div className="flex gap-1"><button onClick={async()=>{ if(confirm('Delete?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-full text-xs">🗑️</button></div>
              </div>
              {y.text && <p className="mt-3 text-[16px] whitespace-pre-wrap">{y.text}</p>}
              {y.imageUrls?.length>0 && <div className="grid grid-cols-2 gap-2 mt-3">{y.imageUrls.map((im:string,i:number)=><img key={i} src={im} className="rounded-2xl w-full max-h-80 object-cover border border-zinc-800"/>)}</div>}
              {y.poll && <div className="mt-3 space-y-2"><button onClick={async()=>{ if(y.poll.voters?.includes(user.uid)) return; await updateDoc(doc(db,'yaks',y.id),{'poll.v1':increment(1),'poll.voters':arrayUnion(user.uid)}); }} className="w-full bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-left"><p className="text-sm font-bold">{y.poll.q1} - {y.poll.v1||0}</p></button><button onClick={async()=>{ if(y.poll.voters?.includes(user.uid)) return; await updateDoc(doc(db,'yaks',y.id),{'poll.v2':increment(1),'poll.voters':arrayUnion(user.uid)}); }} className="w-full bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-left"><p className="text-sm font-bold">{y.poll.q2} - {y.poll.v2||0}</p></button></div>}
              <div className="flex gap-2 mt-4"><button onClick={()=>updateDoc(doc(db,'yaks',y.id),{likes:increment(1)})} className="bg-[#1f1f1f] border border-zinc-800 px-4 py-2 rounded-full text-sm">⬆️ {y.likes||0}</button><button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#1f1f1f] border border-zinc-800 px-4 py-2 rounded-full text-sm">💬 {y.commentsCount||0}</button></div>
              {activePost===y.id && <div className="mt-4 border-t border-zinc-800 pt-3"><div className="space-y-2 max-h-40 overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-2"><div className="bg-[#1f1f1f] px-3 py-2 rounded-2xl text-sm flex-1">{c.text}</div><button onClick={async()=>{ await deleteDoc(doc(db,`yaks/${y.id}/comments/${c.id}`)); }} className="text-xs">✕</button></div>)}</div><div className="flex gap-2 mt-2"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment..." className="flex-1 bg-[#1f1f1f] border border-zinc-800 rounded-full px-4 py-2 text-sm"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,`yaks/${y.id}/comments`),{text:commentText,uid:user.uid,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="bg-yellow-400 text-black w-9 h-9 rounded-full">↑</button></div></div>}
            </div>
          )
        })}
        {yaks.length===0 && <div className="text-center py-20 bg-[#141414] border border-dashed border-zinc-800 rounded-[24px]"><p className="text-5xl">👻</p><p className="font-bold mt-4">No yaks yet in {userData.college}</p></div>}
      </div>

      <button onClick={()=>setScreen('create')} className="fixed bottom-6 right-6 bg-yellow-400 text-black w-14 h-14 rounded-full text-2xl font-black shadow-2xl">+</button>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-30 p-4 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between"><h2 className="font-black text-xl">New Yak - {userData.college} Verified</h2><button onClick={()=>setScreen('feed')} className="w-10 h-10 bg-[#1a1a1a] border border-zinc-800 rounded-full">✕</button></div>
            <div className="flex gap-2 mt-6 overflow-x-auto">{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2.5 rounded-full text-xs font-bold border ${topic===t.name?'bg-yellow-400 text-black':'bg-[#1a1a1a] border-zinc-800 text-zinc-500'}`}>{t.icon} {t.name}</button>)}</div>
            <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}?`} className="w-full h-36 mt-6 p-5 bg-[#141414] border border-zinc-800 rounded-[24px] outline-none text-[16px] resize-none"/>
            <div className="grid grid-cols-2 gap-3 mt-4"><input value={poll.q1} onChange={e=>setPoll({...poll,q1:e.target.value})} placeholder="Poll A" className="p-4 bg-[#141414] border border-zinc-800 rounded-2xl text-sm"/><input value={poll.q2} onChange={e=>setPoll({...poll,q2:e.target.value})} placeholder="Poll B" className="p-4 bg-[#141414] border border-zinc-800 rounded-2xl text-sm"/></div>
            <label className="w-full mt-4 border-2 border-dashed border-zinc-800 p-5 rounded-[24px] flex flex-col items-center text-sm text-zinc-500 bg-[#141414] cursor-pointer">🖼️ Add Photos<input type="file" multiple hidden accept="image/*" onChange={e=>{ Array.from(e.target.files||[]).slice(0,4).forEach((f:any)=>{ const r=new FileReader(); r.onloadend=()=>setImages(p=>[...p,r.result as string].slice(0,4)); r.readAsDataURL(f); }); }}/></label>
            {images.length>0 && <div className="grid grid-cols-4 gap-2 mt-3">{images.map((im,i)=><div key={i} className="relative"><img src={im} className="h-20 rounded-xl object-cover w-full"/><button onClick={()=>setImages(images.filter((_,idx)=>idx!==i))} className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full text-xs">x</button></div>)}</div>}
            <button onClick={handlePost} className="w-full mt-8 bg-white text-black p-4 rounded-full font-black">Post to {userData.college} 🚀</button>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#141414] border border-zinc-800 w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6">
            <div className="flex gap-3"><div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center font-black text-black">✓</div><div><h2 className="font-black">{userData.username}</h2><p className="text-xs text-zinc-500">{userData.college} • Verified {userData.verifyMethod}</p><p className="text-[10px] text-green-400">✓ {userData.rollNumber||userData.collegeEmail}</p></div></div>
            <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-2xl p-3"><p className="text-xs text-green-400 font-bold">✓ Verified Student of {userData.college}</p><p className="text-[11px] text-zinc-400 mt-1">Method: {userData.verifyMethod} • Status: {userData.verificationStatus}</p></div>
            <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-[#1f1f1f] border border-zinc-800 p-3.5 rounded-full text-sm font-bold">Logout & Switch Campus</button>
          </div>
        </div>
      )}
    </div>
  );
              }
