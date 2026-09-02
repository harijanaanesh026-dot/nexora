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

// ONLY SRET COLLEGE - ONLY COLLEGE TALK - NO OTHER TOPIC
const COLLEGE = {id:"SRET", label:"SRET", city:"Tirupati"};
const COLLEGE_TOPICS = [
  {id:"faculty", label:"Faculty", emoji:"👨‍🏫", desc:"Faculty gurinchi"},
  {id:"hostel", label:"Hostel", emoji:"🏠", desc:"Hostel scene"},
  {id:"bunk", label:"Bunk", emoji:"🏃", desc:"Bunk story"},
  {id:"canteen", label:"Canteen", emoji:"🍔", desc:"Canteen gossip"},
  {id:"exam", label:"Exam", emoji:"📚", desc:"Exam talk"},
  {id:"crush", label:"Crush", emoji:"💘", desc:"Crush confession"},
  {id:"confession", label:"Confession", emoji:"🤫", desc:"Anonymous confession"},
  {id:"gossip", label:"Gossip", emoji:"💬", desc:"College gossip"},
];
const Footer = () => (
  <div className="w-full py-8 flex flex-col items-center gap-1 border-t border-white/[0.06] mt-8">
    <p className="text-[10px] tracking-[0.3em] font-bold text-white/40">SRET ONLY • COLLEGE TALK ONLY</p>
    <p className="text-[9px] text-white/20">Only SRET college gurinchi anonymous ga • Faculty • Hostel • Bunk • Canteen • Exam</p>
  </div>
);

export default function SretCollegeOnly(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState('college');
  const [feedTab,setFeedTab]=useState('all');
  const [yaks,setYaks]=useState<any[]>([]);
  const [filteredYaks,setFilteredYaks]=useState<any[]>([]);
  const [leaderboard,setLeaderboard]=useState<any[]>([]);
  const [totalUsers,setTotalUsers]=useState(0);
  const [newYak,setNewYak]=useState('');
  const [selectedTopic,setSelectedTopic]=useState('all');
  const [postTopic,setPostTopic]=useState('gossip');
  const [yakImage,setYakImage]=useState<string>('');
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [replyTo,setReplyTo]=useState<any>(null);
  const [showProfile,setShowProfile]=useState(false);
  const [selectedAvatar,setSelectedAvatar]=useState("👻");
  const [isVerified,setIsVerified]=useState(false);
  const [posting,setPosting]=useState(false);
  const [toast,setToast]=useState('');
  const [likedAnim,setLikedAnim]=useState<Record<string,boolean>>({});
  const lastTapRef = useRef<Record<string,number>>({});
  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2500); };

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{
    return onSnapshot(collection(db,'users'), snap=>{
      const sretOnly = snap.docs.filter(d=> (d.data() as any).college==="SRET" ||!(d.data() as any).college);
      setTotalUsers(sretOnly.length);
    });
  },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u:any)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          if(!isVerified &&!localStorage.getItem('sret_verified')){ setScreen('college'); return; }
          await addDoc(collection(db,'users'),{
            uid:u.uid,
            username:`SRET Anon ${Math.floor(Math.random()*9000)+1000}`,
            avatar:selectedAvatar,
            college:"SRET",
            yakarma:100,
            totalPosts:0,
            likedPosts:[],
            createdAt:serverTimestamp()
          });
          window.location.reload();
        }else{
          const data = {id:snap.docs[0].id,...snap.docs[0].data()} as any;
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

  // ONLY SRET COLLEGE POSTS - COLLEGE GURINCHI MATHRAME - ANONYMOUS
  useEffect(()=>{
    if(!userData) return;
    return onSnapshot(query(collection(db,'yaks'), orderBy('createdAt','desc')), s=>{
      const all=s.docs.map(d=>({id:d.id,...d.data()} as any));
      // ONLY SRET COLLEGE - COLLEGE ONLY - COLLEGE GURINCHI MATHRAME
      const sretOnly = all.filter(d=>!d.college || d.college==="SRET");
      setYaks(sretOnly);
    });
  },[userData]);

  useEffect(()=>{
    if(feedTab==='all') setFilteredYaks(yaks);
    else setFilteredYaks(yaks.filter(y=>y.collegeTopic===feedTab));
  },[yaks, feedTab]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,'yaks/'+activePost+'/comments'),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

    const handleCollegeNext=()=>{
    localStorage.setItem('sret_verified','true');
    localStorage.setItem('sret_avatar',selectedAvatar);
    setIsVerified(true);
    setScreen('verify');
  };

  const handleSretVerify=async()=>{
    localStorage.setItem('sret_verified','true');
    setIsVerified(true);
    setScreen('login');
    showToast("SRET Verified - College only SRET - Anonymous 💯");
  };

  const handleGoogleLogin=async()=>{ try{ await signInWithPopup(auth,provider);}catch{ await signInWithRedirect(auth,provider);} };
  const handleImageUpload=(e:any)=>{
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size>800*1024){ showToast("Image <800KB - SRET wifi slow?"); return; }
    const r=new FileReader(); r.onloadend=()=>setYakImage(r.result as string); r.readAsDataURL(file);
  };

  // ONLY COLLEGE GURINCHI - LIKING - FR FR SAME BRO - COLLEGE SLANG
  const handleLike=async(y:any)=>{
    if(!userData) return;
    const liked=userData.likedPosts?.includes(y.id);
    setLikedAnim(prev=>({...prev, [y.id]: true}));
    setTimeout(()=> setLikedAnim(prev=>({...prev, [y.id]: false})), 300);
    try{
      if(liked){
        await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1)});
        await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id)});
        setUserData({...userData, likedPosts:userData.likedPosts.filter((i:string)=>i!==y.id)});
      } else {
        await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)});
        await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id)});
        setUserData({...userData, likedPosts:[...(userData.likedPosts||[]), y.id]});
        showToast("FR FR - SRET college talk ki agree 💯");
      }
    }catch(e:any){ showToast(e.message); }
  };

  const handleDoubleTap=(y:any)=>{
    const now=Date.now(); const last=lastTapRef.current[y.id]||0;
    if(now-last<300){ handleLike(y); }
    lastTapRef.current[y.id]=now;
  };

  const handlePost=async()=>{
    const txt=newYak.trim();
    if(!txt &&!yakImage) return showToast("College gurinchi emanna rayi bro - SRET gossip!");
    if(posting) return; setPosting(true);
    try{
      // ONLY COLLEGE GURINCHI - COLLEGE TOPIC - SRET ONLY
      const payload:any={
        text:txt,
        uid:user.uid,
        username:"Anonymous SRET Student",
        college:"SRET",
        collegeTopic:postTopic,
        likes:0,
        commentsCount:0,
        createdAt:serverTimestamp()
      };
      if(yakImage) payload.image=yakImage;
      await addDoc(collection(db,'yaks'),payload);
      await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1), yakarma:increment(5)});
      setNewYak(''); setYakImage(''); setScreen('feed');
      showToast("Posted to SRET College Only - Anonymous - All SRET students chustaru 💯");
    }catch(e:any){ showToast(e.message); }finally{ setPosting(false); }
  };

  const buildTree=(flat:any[])=>{
    const map:Record<string,any>={}; const roots:any[]=[];
    flat.forEach(c=>{ map[c.id]={...c, replies:[]}; });
    flat.forEach(c=>{ if(c.parentId && map[c.parentId]) map[c.parentId].replies.push(map[c.id]); else roots.push(map[c.id]); });
    return roots;
  };

  const handleCommentPost=async(yId:string)=>{
    if(!commentText.trim()) return;
    const payload:any={
      text:commentText.trim(),
      uid:user.uid,
      username:"Anonymous SRET",
      parentId:replyTo? replyTo.id:null,
      createdAt:serverTimestamp()
    };
    setCommentText(''); setReplyTo(null);
    await addDoc(collection(db,'yaks/'+yId+'/comments'), payload);
    await updateDoc(doc(db,'yaks', yId), {commentsCount: increment(1)});
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#0a0a0b] text-white">
        <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none}`}</style>
        {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-[100]">{toast}</div>}
        <div className="max-w-md mx-auto p-6 min-h-screen">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">S</div>
            <div><p className="font-black text-sm">SRET COLLEGE ONLY</p><p className="text-[10px] text-white/40">Only college gurinchi anonymous • {totalUsers} SRET students</p></div>
          </div>
          <h1 className="text-[38px] font-black mt-8 leading-[0.9]">Only<br/>College<br/><span className="text-white/30">Anonymous</span></h1>
          <p className="text-[13px] text-white/50 mt-3">SRET college gurinchi mathrame anonymous ga matladu - Faculty, Hostel, Bunk, Canteen, Exam, Crush - Evaru telidu - College only</p>

          <div className="mt-8 p-5 rounded-[20px] border-2 bg-white text-black border-white">
            <p className="font-black text-[16px]">SRET - Tirupati - College Only</p>
            <p className="text-[12px] mt-1 opacity-70">Only SRET college gurinchi anonymous talk • {totalUsers} SRET students anonymous • College only</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {COLLEGE_TOPICS.slice(0,4).map(t=><span key={t.id} className="px-3 py-1 bg-black/10 rounded-full text-[10px] font-bold">{t.emoji} {t.label}</span>)}
            </div>
          </div>

          <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 mt-8">AVATAR - ANONYMOUS - COLLEGE ONLY</p>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {["👻","🤫","💀","😎"].map(a=><button key={a} onClick={()=>setSelectedAvatar(a)} className={`h-16 rounded-[18px] text-xl border-2 ${selectedAvatar===a?'bg-white text-black border-white':'bg-white/[0.05] border-white/10'}`}>{a}</button>)}
          </div>

          <button onClick={handleCollegeNext} className="w-full mt-8 py-4 rounded-full font-black bg-white text-black">Enter SRET College Only - Anonymous 💯</button>

          <div className="mt-6 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5">
            <p className="text-[11px] font-bold">Only college gurinchi anonymous ga matladataniki - SRET ONLY:</p>
            <p className="text-[11px] text-white/40 mt-3 leading-[1.7]">
              • Only SRET college gurinchi mathrame - Faculty, Hostel, Bunk, Canteen, Exam, Crush, Confession<br/>
              • Anonymous - Evaru telidu - SRET lo evaru anukoru<br/>
              • College only SRET - Vere colleges leru - SRET students mathrame<br/>
              • SRET students enter avvagane vere SRET vallu post chesina college gossip anni kanipistayi<br/>
              • No other topics - Only college talk - SRET college life gurinchi mathrame
            </p>
          </div>
          <Footer/>
        </div>
      </div>
    );
  }

  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-[#0a0a0b] text-white p-6">
        <div className="max-w-md mx-auto">
          <button onClick={()=>setScreen('college')} className="w-9 h-9 bg-white/5 border border-white/10 rounded-full">←</button>
          <h2 className="font-black text-[22px] mt-6 leading-[0.9]">SRET College Only<br/><span className="text-white/40">Anonymous Verify</span></h2>
          <p className="text-xs text-white/40 mt-2">Only SRET college gurinchi anonymous ga matladataniki - College only SRET - {totalUsers} SRET students</p>
          <div className="mt-8 bg-white/[0.05] border-2 border-white/10 rounded-[20px] p-5">
            <p className="font-bold text-[14px]">SRET Student Verification - College Only</p>
            <p className="text-[11px] text-white/40 mt-2">SRET ID card or Roll number - College only SRET - Anonymous safe - Evaru telidu</p>
            <button onClick={handleSretVerify} className="w-full mt-6 bg-white text-black py-4 rounded-full font-bold">Verify SRET - Enter College Only Talk 💯</button>
            <p className="text-[10px] text-white/30 mt-3 text-center">One tap verify - SRET college only - Only college gurinchi anonymous talk</p>
          </div>
          <Footer/>
        </div>
      </div>
    );
  }

  if(screen==='login'){
    return(
      <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/[0.05] border-2 border-white/10 p-8 rounded-[24px] flex flex-col items-center">
          <div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] flex items-center justify-center text-4xl">🎓</div>
          <h1 className="font-black mt-6 text-xl text-center leading-[0.9]">SRET College Only<br/><span className="text-white/40">Anonymous Talk</span></h1>
          <p className="text-[11px] text-white/30 mt-3 text-center">Only SRET college gurinchi anonymous ga - Faculty, Hostel, Bunk, Canteen, Exam, Crush - Evaru telidu</p>
          <button onClick={handleGoogleLogin} className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold">Continue - SRET College Only 💯</button>
        </div>
        <Footer/>
      </div>
    );
        }

    const renderComment = (c:any, depth=0) => {
    return (
      <div key={c.id} className={`${depth>0? 'ml-6 border-l-2 border-white/15 pl-3' : ''} mt-3`}>
        <div className="flex gap-2.5">
          <div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs">👻</div>
          <div className="flex-1">
            <div className="bg-white/[0.05] border border-white/10 rounded-[14px] px-4 py-2.5">
              <p className="text-[10px] font-bold text-white/40">Anonymous SRET Student • College Only</p>
              <p className="text-[13px] text-white mt-1 leading-[1.4]">{c.text}</p>
            </div>
            <button onClick={()=>setReplyTo(c)} className="text-[11px] font-bold text-white/30 mt-1 ml-1">Reply - SRET Only</button>
            {c.replies && c.replies.map((rep:any)=>renderComment(rep, depth+1))}
          </div>
        </div>
      </div>
    );
  };

  return(
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      <style>{`body{background:#0a0a0b} ::-webkit-scrollbar{display:none} @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}.pop{animation:pop 0.3s ease-out}`}</style>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-2xl">{toast}</div>}

      <div className="sticky top-0 z-20 bg-[#0a0a0b]/90 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">S</div>
            <div>
              <p className="font-bold text-[13px] leading-none">SRET COLLEGE ONLY • {yaks.length} GOSSIPS</p>
              <p className="text-[10px] text-white/40">Only college gurinchi anonymous • {totalUsers} SRET students • SRET Only</p>
            </div>
          </div>
          <button onClick={()=>setShowProfile(true)} className="w-9 h-9 bg-white/10 border border-white/10 rounded-full">👻</button>
        </div>
        <div className="max-w-[600px] mx-auto px-3 pb-3 flex gap-2 overflow-x-auto">
          <button onClick={()=>setFeedTab('all')} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab==='all'?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>ALL COLLEGE 💯 {yaks.length}</button>
          {COLLEGE_TOPICS.map(t=>(
            <button key={t.id} onClick={()=>setFeedTab(t.id)} className={`h-9 px-4 rounded-full text-xs font-bold border-2 whitespace-nowrap ${feedTab===t.id?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>{t.emoji} {t.label.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="max-w-[600px] mx-auto w-full flex-1 p-3 pb-[84px] space-y-3">
        <div className="bg-white/[0.03] border-2 border-white/10 rounded-[18px] p-4">
          <p className="font-black text-[13px]">Only SRET College Gurinchi Anonymous Ga Matladataniki 💯</p>
          <p className="text-[11px] text-white/50 mt-1 leading-[1.4]">SRET college gurinchi mathrame - Faculty, Hostel, Bunk, Canteen, Exam, Crush, Confession - Vere topic ledu - Only college talk - Evaru telidu - Anonymous - SRET students mathrame - Vere SRET vallu post chesina posts anni kanipistayi</p>
        </div>

        {filteredYaks.map(y=>{
          const liked=userData.likedPosts?.includes(y.id);
          const isOwn=user?.uid===y.uid;
          const nestedTree = activePost===y.id? buildTree(comments) : [];
          const topicInfo = COLLEGE_TOPICS.find(t=>t.id===y.collegeTopic);
          return(
            <div key={y.id} className={`bg-white/[0.04] border-2 rounded-[20px] p-5 ${isOwn?'border-white/20 bg-white/[0.06]':'border-white/10'}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm">👻</div>
                  <div>
                    <p className="font-bold text-[13px]">Anonymous SRET Student {isOwn? '(YOU)' : ''} • SRET ONLY</p>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white text-black">{topicInfo?.emoji} {topicInfo?.label.toUpperCase()} • COLLEGE ONLY</span>
                      <span className="text-[10px] text-white/30">SRET Only • Anonymous</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 select-none" onDoubleClick={()=>handleDoubleTap(y)} onClick={()=>handleDoubleTap(y)}>
                <p className="text-[15px] leading-[1.5] text-white whitespace-pre-wrap break-words">{y.text}</p>
                {y.image && <img src={y.image} className="mt-4 rounded-[16px] border-2 border-white/10 w-full max-h-[380px] object-cover"/>}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={()=>handleLike(y)} className={`flex items-center gap-2 px-4 h-9 rounded-full border-2 text-xs font-black ${liked? 'bg-white text-black border-white pop' : 'bg-white/5 border-white/10 text-white/40'}`}>
                    <span>{liked? '💯' : '🤍'}</span> <span>{liked? 'FR FR' : 'FR FR'} {y.likes||0}</span>
                  </button>
                  <button onClick={()=>{ setActivePost(activePost===y.id?null:y.id); }} className="px-4 h-9 rounded-full text-xs font-bold bg-white/5 border-2 border-white/10 text-white/40">💬 {y.commentsCount||0} • SRET ONLY</button>
                </div>
                <span className="text-[9px] text-white/20 uppercase tracking-widest">College Only • SRET</span>
              </div>

              {y.likes>0 && <p className="text-[11px] text-white/50 mt-3"><span className="text-white font-bold">{y.likes} SRET students</span> said FR FR - College only SRET - Anonymous</p>}

              {activePost===y.id && (
                <div className="mt-5 border-t-2 border-white/10 pt-4">
                  <p className="text-[10px] font-bold tracking-widest text-white/30 mb-3">SRET COLLEGE COMMENTS - {comments.length} - COLLEGE ONLY 💯</p>
                  {replyTo && <div className="bg-white/10 border-2 border-white/20 rounded-xl px-4 py-2.5 flex justify-between items-center mb-3"><p className="text-[11px] text-white">Replying to {replyTo.username}: {replyTo.text.slice(0,30)}</p><button onClick={()=>setReplyTo(null)} className="w-6 h-6 bg-white/10 rounded-full text-xs">X</button></div>}
                  <div className="max-h-[400px] overflow-y-auto pr-1">{nestedTree.length===0? <p className="text-xs text-white/20 text-center py-8">No comments - Be first SRET student - College gurinchi cheppu 💯</p> : nestedTree.map((c:any)=>renderComment(c,0))}</div>
                  <div className="flex gap-2.5 mt-4">
                    <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment about SRET college - Anonymous - College only" className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-5 h-11 text-[13px] outline-none text-white placeholder:text-white/30 focus:border-white"/>
                    <button onClick={()=>handleCommentPost(y.id)} disabled={!commentText.trim()} className={`w-11 h-11 rounded-full font-bold ${!commentText.trim()?'bg-white/5 text-white/20':'bg-white text-black'}`}>💯</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredYaks.length===0 && (
          <div className="py-24 text-center bg-white/[0.03] border-2 border-white/10 rounded-[24px]">
            <div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-[24px] mx-auto flex items-center justify-center text-4xl">🎓</div>
            <p className="font-black mt-6 text-[18px]">No SRET college gossip yet</p>
            <p className="text-xs text-white/30 mt-1 max-w-[280px] mx-auto">Only SRET college gurinchi anonymous ga - Faculty, Hostel, Bunk, Canteen, Exam, Crush - Be first SRET student to post - College only - Anonymous</p>
            <button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-8 h-11 rounded-full text-[13px] font-bold">First SRET College Post - College Only 💯</button>
          </div>
        )}
        <Footer/>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-2xl border-t-2 border-white/10">
        <div className="max-w-[600px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <button className="flex flex-col items-center gap-1"><div className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center text-[12px] font-bold">S</div><span className="text-[8px] font-bold text-white/30">SRET ONLY {yaks.length}</span></button>
          <button onClick={()=>setScreen('create')} className="w-[56px] h-[56px] bg-white text-black rounded-full flex items-center justify-center text-[24px] font-black">+</button>
          <button onClick={()=>setShowProfile(true)} className="w-7 h-7 bg-white/5 border border-white/10 rounded-full text-[10px]">👻</button>
        </div>
      </div>

            {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-40 flex flex-col overflow-hidden">
          <div className="max-w-[600px] mx-auto w-full flex flex-col h-full bg-[#0a0a0b]">
            <div className="p-5 flex items-center justify-between border-b-2 border-white/10">
              <button onClick={()=>setScreen('feed')} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full text-white">X</button>
              <div className="text-center"><p className="text-[11px] font-bold tracking-widest">NEW SRET COLLEGE POST - COLLEGE ONLY</p><p className="text-[10px] text-white/30">Only college gurinchi anonymous</p></div>
              <button onClick={handlePost} disabled={posting||(!newYak.trim()&&!yakImage)} className={`px-6 h-10 rounded-full font-bold text-[13px] ${posting||(!newYak.trim()&&!yakImage)?'bg-white/5 text-white/20':'bg-white text-black'}`}>{posting?'Posting...':'Post SRET 💯'}</button>
            </div>

            <div className="p-3 flex gap-2 border-b-2 border-white/5 overflow-x-auto bg-white/[0.02]">
              {COLLEGE_TOPICS.map(t=>(
                <button key={t.id} onClick={()=>setPostTopic(t.id)} className={`px-4 h-9 rounded-full text-xs font-bold border-2 whitespace-nowrap ${postTopic===t.id?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/40'}`}>{t.emoji} {t.label}</button>
              ))}
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex gap-3 mb-6"><div className="w-11 h-11 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center text-white">🎓</div><div><p className="font-bold text-[14px]">Anonymous SRET Student - College Only SRET</p><p className="text-[11px] text-white/40">Only SRET college gurinchi anonymous ga - Evaru telidu - College only</p></div></div>

              <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`SRET college gurinchi anonymous ga cheppu... Only college gurinchi...\n\n• Faculty ela? 👨‍🏫\n• Hostel scene enti? 🏠\n• Bunk story? 🏃\n• Canteen food? 🍔\n• Exam pressure? 📚\n• Crush SRET lo? 💘\n• Confession? 🤫\n• Gossip? 💬\n\nOnly college gurinchi - SRET only - Evaru telidu - Anonymous - FR FR 💯\n\nNuvvu post cheste vere SRET students enter avvagane kanipistundi - College only SRET`} autoFocus className="w-full bg-transparent text-[19px] leading-[1.45] outline-none placeholder:text-white/20 resize-none min-h-[220px] text-white" maxLength={400}/>

              <div className="mt-6">
                {yakImage? <div className="relative"><img src={yakImage} className="w-full rounded-[16px] border-2 border-white/10 max-h-[300px] object-cover"/><button onClick={()=>setYakImage('')} className="absolute top-3 right-3 w-8 h-8 bg-black/80 rounded-full text-white">X</button></div> : <label className="w-full border-2 border-dashed border-white/10 rounded-[16px] p-8 flex flex-col items-center justify-center cursor-pointer bg-white/[0.02] hover:border-white/20"><span className="text-2xl">📷</span><span className="text-xs font-bold text-white/60 mt-2">Upload SRET College Photo - College Only</span><span className="text-[10px] text-white/30 mt-1">Only SRET college gurinchi - Anonymous</span><input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e)}/></label>}
              </div>

              <div className="mt-6 bg-white/[0.05] border-2 border-white/10 rounded-xl p-4">
                <p className="text-[11px] font-bold">Only college gurinchi anonymous ga - SRET ONLY - College Only:</p>
                <p className="text-[11px] text-white/40 mt-2 leading-[1.5]">
                  • Topic: {COLLEGE_TOPICS.find(t=>t.id===postTopic)?.emoji} {COLLEGE_TOPICS.find(t=>t.id===postTopic)?.label} - {COLLEGE_TOPICS.find(t=>t.id===postTopic)?.desc} - Only SRET college gurinchi<br/>
                  • Anonymous - Evaru telidu - SRET lo evaru anukoru - Safe<br/>
                  • College only SRET - SRET students mathrame chustaru - Vere colleges leru<br/>
                  • Nuvvu post cheste vere SRET students enter avvagane kanipistundi - All SRET posts kanipistayi<br/>
                  • Only college talk - Vere topic ledu - Only SRET college life gurinchi mathrame
                </p>
              </div>
            </div>

            <div className="p-5 border-t-2 border-white/5 bg-white/[0.02]"><Footer/></div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-end justify-center">
          <div className="bg-[#141416] border-2 border-white/10 w-full max-w-[600px] rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div>
            <div className="flex gap-4">
              <div className="w-[72px] h-[72px] bg-white/5 border-2 border-white/10 rounded-[20px] flex items-center justify-center text-3xl">🎓</div>
              <div className="flex-1">
                <h2 className="font-black text-[16px] leading-none">SRET College Only - Anonymous 💯</h2>
                <p className="text-[11px] text-white/40 mt-2">Only SRET college gurinchi anonymous ga matladataniki - Faculty, Hostel, Bunk, Canteen, Exam, Crush, Confession, Gossip - Evaru telidu - College only SRET</p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  <span className="px-3 py-1.5 bg-white text-black rounded-full text-[10px] font-bold">{userData.yakarma} karma • SRET</span>
                  <span className="px-3 py-1.5 bg-yellow-400 text-black rounded-full text-[9px] font-bold">SRET ONLY • {totalUsers} STUDENTS • COLLEGE ONLY</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl">{userData.totalPosts||0}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">SRET POSTS</p></div>
              <div className="bg-white/[0.05] border-2 border-white/10 rounded-[18px] p-4 text-center"><p className="font-black text-xl">{yaks.length}</p><p className="text-[9px] font-bold tracking-widest text-white/30 mt-1">SRET FEED</p></div>
              <div className="bg-white text-black rounded-[18px] p-4 text-center"><p className="font-black text-xl">{totalUsers}</p><p className="text-[9px] font-bold tracking-widest mt-1">SRET STUDENTS</p></div>
            </div>
            <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-[16px] p-4">
              <p className="text-[11px] font-bold">Only college gurinchi anonymous ga matladataniki - SRET ONLY 💯:</p>
              <p className="text-[11px] text-white/40 mt-2 leading-[1.6]">
                • Only SRET college gurinchi mathrame - Faculty, Hostel, Bunk, Canteen, Exam, Crush, Confession, Gossip - Vere topic ledu<br/>
                • Anonymous - Evaru telidu - SRET lo evaru anukoru - Safe - Faculty gurinchi kuda cheppachu<br/>
                • College only SRET - SRET students mathrame - Vere colleges leru - SRET ONLY<br/>
                • SRET students enter avvagane vere SRET vallu post chesina college gossip anni kanipistayi - All SRET posts visible<br/>
                • Nuvvu post cheste vere SRET students enter avvagane kanipistundi - College only SRET feed<br/>
                • {totalUsers} SRET students already - Only college gurinchi anonymous ga matladataniki - SRET ONLY community
              </p>
            </div>
            <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-white/5 border-2 border-white/10 h-12 rounded-full text-xs font-bold text-white/60">Logout - SRET ONLY safe - Anonymous</button>
            <button onClick={()=>setShowProfile(false)} className="w-full mt-3 bg-white text-black h-12 rounded-full font-bold text-xs">Close - Continue SRET College Talk 💯 College Only</button>
            <div className="mt-4"><Footer/></div>
          </div>
        </div>
      )}
    </div>
  );
            }
