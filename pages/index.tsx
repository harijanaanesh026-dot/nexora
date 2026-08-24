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
  {name:"Canteen",icon:"🍔",color:"bg-orange-500"},
  {name:"Events",icon:"🎉",color:"bg-rose-500"},
  {name:"Academics",icon:"📚",color:"bg-blue-500"},
];

const AVATARS = ["👻","🔥","😎","🤫","💀","👽","🦊","🐼","🦁","👾","🤖","😈"];

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
  const [selectedAvatar,setSelectedAvatar]=useState('👻');

  useEffect(()=>{ getRedirectResult(auth).catch(()=>{}); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col = localStorage.getItem('selected_college');
          const av = localStorage.getItem('selected_avatar')||'👻';
          if(!col){ setScreen('college'); return; }
          const username=`Yak_${Math.floor(Math.random()*9000)+1000}`;
          await addDoc(collection(db,'users'),{uid:u.uid,email:u.email,username,avatar:av,college:col,karma:100,totalPosts:0,likedPosts:[],dislikedPosts:[],createdAt:serverTimestamp()});
          window.location.reload();
        } else {
          setUserData({id:snap.docs[0].id,...snap.docs[0].data()} as any);
          setScreen('feed');
        }
      } else setScreen('college');
    });
  },[]);

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
    if(!selectedCollege) return alert('College select chey!');
    if(!selectedAvatar) return alert('Avatar select chey!');
    localStorage.setItem('selected_college', selectedCollege);
    localStorage.setItem('selected_avatar', selectedAvatar);
    setScreen('login');
  };

  const handleGoogleLogin = async () => {
    try{ await signInWithPopup(auth, provider); }
    catch(e:any){ try{ await signInWithRedirect(auth, provider); }catch(err:any){ setLoginError(err.message); } }
  };

  const handleLike = async(y:any, type:'like'|'dislike')=>{
    if(!userData) return;
    const alreadyLiked = userData.likedPosts?.includes(y.id);
    const alreadyDisliked = userData.dislikedPosts?.includes(y.id);

    if(type==='like'){
      if(alreadyLiked){
        // Unlike
        await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1)});
        await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id),karma:increment(-1)});
        setUserData({...userData, likedPosts:userData.likedPosts.filter((id:string)=>id!==y.id)});
      } else {
        if(alreadyDisliked){
          await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1), likes:increment(1)});
          await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id), likedPosts:arrayUnion(y.id),karma:increment(2)});
          setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((id:string)=>id!==y.id), likedPosts:[...userData.likedPosts, y.id]});
        } else {
          await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)});
          await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayUnion(y.id),karma:increment(1)});
          setUserData({...userData, likedPosts:[...(userData.likedPosts||[]), y.id]});
        }
      }
    } else {
      if(alreadyDisliked){
        await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(-1)});
        await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayRemove(y.id)});
        setUserData({...userData, dislikedPosts:userData.dislikedPosts.filter((id:string)=>id!==y.id)});
      } else {
        if(alreadyLiked){
          await updateDoc(doc(db,'yaks',y.id),{likes:increment(-1), dislikes:increment(1)});
          await updateDoc(doc(db,'users',userData.id),{likedPosts:arrayRemove(y.id), dislikedPosts:arrayUnion(y.id),karma:increment(-2)});
          setUserData({...userData, likedPosts:userData.likedPosts.filter((id:string)=>id!==y.id), dislikedPosts:[...userData.dislikedPosts, y.id]});
        } else {
          await updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)});
          await updateDoc(doc(db,'users',userData.id),{dislikedPosts:arrayUnion(y.id),karma:increment(-1)});
          setUserData({...userData, dislikedPosts:[...(userData.dislikedPosts||[]), y.id]});
        }
      }
    }
  };

  const handlePost=async()=>{
    if(!newYak.trim() && images.length===0 &&!poll.q1) return alert('Emanna rayi bro!');
    try{
      const payload:any={ text:newYak.trim(), uid:user.uid, username:userData.username, avatar:userData.avatar||'👻', college:userData.college, topic:topic==='All'?'Memes':topic, likes:0, dislikes:0, commentsCount:0, imageUrls:images, poll: poll.q1?{q1:poll.q1,q2:poll.q2,v1:0,v2:0,voters:[]}:null, createdAt:serverTimestamp() };
      if(editYak){ await updateDoc(doc(db,'yaks',editYak.id),{text:newYak.trim(),imageUrls:images}); setEditYak(null); }
      else { await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1),karma:increment(5)}); }
      setNewYak(''); setImages([]); setPoll({q1:'',q2:''}); setScreen('feed');
    }catch(e:any){ alert(e.message); }
  };

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-yellow-400/20 rounded-full blur-[100px]"></div>
        <div className="z-10 w-full max-w-md">
          <div className="text-center"><div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[24px] mx-auto flex items-center justify-center font-black text-black text-3xl shadow-2xl">Y</div><h1 className="text-5xl font-black mt-6 tracking-tighter">YAK<span className="text-yellow-400">.</span></h1><p className="text-zinc-400 text-sm mt-2">Anonymous • Verified • {COLLEGES.length} campuses</p></div>

          <h2 className="font-bold text-lg mt-8">Pick your avatar 👇</h2>
          <div className="grid grid-cols-6 gap-2 mt-3">
            {AVATARS.map(av=>{
              const active=selectedAvatar===av;
              return <button key={av} onClick={()=>setSelectedAvatar(av)} className={`h-12 rounded-2xl border text-xl flex items-center justify-center transition-all ${active?'bg-white border-white scale-110 shadow-xl':'bg-[#141414] border-zinc-800 hover:border-zinc-700'}`}>{av}</button>
            })}
          </div>

          <h2 className="font-bold text-lg mt-8">Select your campus 🎓</h2>
          <div className="grid grid-cols-1 gap-2.5 mt-3">
            {COLLEGES.map(c=>{
              const active=selectedCollege===c;
              return <button key={c} onClick={()=>setSelectedCollege(c)} className={`w-full p-4 rounded-2xl border text-left font-bold flex justify-between items-center transition-all ${active?'bg-white text-black border-white scale-[1.02] shadow-xl':'bg-[#141414] border-zinc-800 text-zinc-300'}`}><span className="flex items-center gap-3"><span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${active?'bg-black text-white':'bg-zinc-800 text-yellow-400'}`}>{c[0]}</span>{c}</span>{active?'✓':''}</button>
            })}
          </div>
          <button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full mt-6 py-4 rounded-full font-black text-base ${selectedCollege?'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20':'bg-zinc-800 text-zinc-500'}`}>Continue as {selectedAvatar} →</button>
        </div>
      </div>
    );
  }

  if(screen==='login'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-[#141414] border border-zinc-800 rounded-[24px] mx-auto flex items-center justify-center text-3xl">{selectedAvatar||'👻'}</div>
          <h1 className="text-4xl font-black mt-6">Welcome to<br/><span className="text-yellow-400">{selectedCollege || localStorage.getItem('selected_college')}</span></h1>
          <p className="text-zinc-500 text-sm mt-3">You are {selectedAvatar} • Anonymous forever</p>
          <div className="mt-10 bg-[#141414] border border-zinc-800 rounded-[24px] p-6">
            <button onClick={handleGoogleLogin} className="w-full bg-white text-black py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition shadow-xl"><img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5"/> Continue with Google</button>
            {loginError && <p className="mt-4 text-xs text-red-400">{loginError}</p>}
          </div>
        </div>
      </div>
    );
                      }

  return(
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="p-4 flex justify-between items-center max-w-xl mx-auto">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center font-black text-black">Y</div><div><h1 className="font-black text-[14px]">YAK. {userData.college}</h1><p className="text-[10px] text-green-400">● {yaks.length} yaks • Live</p></div></div>
          <button onClick={()=>setShowProfile(true)} className="bg-[#141414] border border-zinc-800 px-3 h-10 rounded-full text-xs font-bold flex items-center gap-2"><div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-sm">{userData.avatar}</div>{userData.username}<span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-[10px]">✦</span></button>
        </div>
        <div className="px-4 pb-3 max-w-xl mx-auto">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide"><button onClick={()=>setTopic('All')} className={`px-5 py-2.5 rounded-full text-xs font-bold border ${topic==='All'?'bg-white text-black':'bg-[#141414] border-zinc-800 text-zinc-400'}`}>🌍 All</button>{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap ${topic===t.name?'bg-yellow-400 text-black':'bg-[#141414] border-zinc-800 text-zinc-500'}`}>{t.icon} {t.name}</button>)}</div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-3 space-y-4 mt-2">
        {yaks.map(y=>{
          const total=(y.poll?.v1||0)+(y.poll?.v2||0);
          const isOwner=user?.uid===y.uid;
          const liked = userData.likedPosts?.includes(y.id);
          const disliked = userData.dislikedPosts?.includes(y.id);
          const score = (y.likes||0) - (y.dislikes||0);
          return(
            <div key={y.id} className="bg-[#141414] border border-zinc-800 rounded-[28px] p-5 hover:border-zinc-700 transition-all">
              {/* User header attractive */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  <div className="relative"><div className="w-10 h-10 bg-[#1f1f1f] border border-zinc-800 rounded-full flex items-center justify-center text-lg">{y.avatar||'👻'}</div><div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#141414] rounded-full"></div></div>
                  <div><p className="text-[13px] font-black flex items-center gap-2">{y.username} {isOwner && <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[9px] font-black">YOU</span>} <span className={`text-[9px] px-2.5 py-1 rounded-full ${TOPICS.find(t=>t.name===y.topic)?.color||'bg-zinc-700'} text-white font-bold`}>{y.topic}</span></p><p className="text-[11px] text-zinc-500 flex items-center gap-1">{y.college} • {y.createdAt?.toDate? new Date(y.createdAt.toDate()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'now'} • <span className={`font-bold ${score>0?'text-green-400':score<0?'text-red-400':'text-zinc-500'}`}>{score>0?`+${score}`:score} karma</span></p></div>
                </div>
                <button onClick={async()=>{ if(confirm('Delete?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="w-8 h-8 bg-[#1f1f1f] border border-zinc-800 rounded-full text-xs hover:bg-red-500/20 hover:border-red-500/30">🗑️</button>
              </div>

              {y.text && <p className="mt-4 text-[16.5px] leading-[1.6] whitespace-pre-wrap font-medium">{y.text}</p>}
              {y.imageUrls?.length>0 && <div className="grid grid-cols-2 gap-2 mt-4">{y.imageUrls.map((im:string,i:number)=><img key={i} src={im} className="rounded-[20px] w-full max-h-80 object-cover border border-zinc-800"/>)}</div>}

              {/* Attractive Poll */}
              {y.poll && <div className="mt-4 space-y-2.5">{[{q:y.poll.q1,v:y.poll.v1},{q:y.poll.q2,v:y.poll.v2}].map((opt,idx)=><button key={idx} onClick={async()=>{ if(y.poll.voters?.includes(user.uid)) return; await updateDoc(doc(db,'yaks',y.id),{[idx===0?'poll.v1':'poll.v2']:increment(1),'poll.voters':arrayUnion(user.uid)}); }} className="w-full bg-[#1f1f1f] border border-zinc-800 p-4 rounded-2xl text-left relative overflow-hidden group hover:border-zinc-700"><div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 transition-all" style={{width:`${total? (opt.v/total)*100:0}%`}}></div><div className="relative flex justify-between items-center"><p className="font-bold text-sm">{opt.q}</p><span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs font-black">{opt.v||0} • {total?Math.round((opt.v/total)*100):0}%</span></div></button>)}<p className="text-[11px] text-zinc-500">{total} votes</p></div>}

              {/* 🔥 ATTRACTIVE LIKE / DISLIKE */}
              <div className="flex items-center gap-2 mt-5">
                {/* Like Dislike attractive pill */}
                <div className="flex bg-[#1f1f1f] rounded-full border border-zinc-800 overflow-hidden">
                  <button onClick={()=>handleLike(y,'like')} className={`px-4 py-2.5 text-sm font-black flex items-center gap-1.5 transition-all ${liked?'bg-green-500 text-black':'hover:bg-zinc-800 text-zinc-300'}`}>
                    <span className={`${liked?'animate-bounce':''}`}>⬆️</span> {y.likes||0}
                  </button>
                  <div className="w-px bg-zinc-800 my-2"></div>
                  <button onClick={()=>handleLike(y,'dislike')} className={`px-4 py-2.5 text-sm font-black flex items-center gap-1.5 transition-all ${disliked?'bg-red-500 text-white':'hover:bg-zinc-800 text-zinc-400'}`}>
                    <span className={`${disliked?'animate-bounce':''}`}>⬇️</span> {y.dislikes||0}
                  </button>
                </div>

                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#1f1f1f] border border-zinc-800 px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-1.5 hover:bg-zinc-800 transition">
                  💬 {y.commentsCount||0}
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-full text-[11px] font-black border ${score>5?'bg-green-500/10 border-green-500/20 text-green-400':score<-2?'bg-red-500/10 border-red-500/20 text-red-400':'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                    {score>5?'🔥 Hot':score<-2?'💀 Controversial':'✨ New'}
                  </div>
                </div>
              </div>

              {/* Progress bar for like ratio */}
              {(y.likes||0)+(y.dislikes||0)>0 && (
                <div className="mt-3 h-1 bg-[#1f1f1f] rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500 transition-all" style={{width:`${((y.likes||0)/((y.likes||0)+(y.dislikes||0)))*100}%`}}></div>
                  <div className="h-full bg-red-500/60" style={{width:`${((y.dislikes||0)/((y.likes||0)+(y.dislikes||0)))*100}%`}}></div>
                </div>
              )}

              {activePost===y.id && <div className="mt-4 pt-4 border-t border-zinc-800"><div className="space-y-3 max-h-64 overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-2.5"><div className="w-8 h-8 bg-[#1f1f1f] border border-zinc-800 rounded-full flex items-center justify-center text-sm shrink-0">{c.avatar||'👻'}</div><div className="bg-[#1f1f1f] border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2.5 flex-1"><p className="text-[13px] leading-snug">{c.text}</p><p className="text-[10px] text-zinc-500 mt-1">{c.username} • {c.createdAt?.toDate? new Date(c.createdAt.toDate()).toLocaleTimeString():''}</p></div><button onClick={async()=>{ await deleteDoc(doc(db,`yaks/${y.id}/comments/${c.id}`)); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(-1)}); }} className="text-[11px] text-zinc-600">✕</button></div>)}{comments.length===0 && <p className="text-xs text-zinc-600 text-center py-6">No comments - Be first to roast 😂</p>}</div><div className="flex gap-2 mt-4"><div className="w-8 h-8 bg-[#1f1f1f] border border-zinc-800 rounded-full flex items-center justify-center shrink-0">{userData.avatar}</div><div className="flex-1 relative"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add anonymous comment..." className="w-full bg-[#1f1f1f] border border-zinc-800 rounded-full pl-4 pr-12 py-3 text-sm outline-none focus:border-yellow-400/30"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,`yaks/${y.id}/comments`),{text:commentText,uid:user.uid,username:userData.username,avatar:userData.avatar,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="absolute right-1 top-1 bg-yellow-400 text-black w-9 h-9 rounded-full font-black flex items-center justify-center">↑</button></div></div></div>}
            </div>
          )
        })}
        {yaks.length===0 && <div className="text-center py-20 bg-[#141414] border border-dashed border-zinc-800 rounded-[28px]"><p className="text-5xl">{userData.avatar}</p><p className="font-black mt-4">No yaks yet in {userData.college}</p><p className="text-xs text-zinc-500 mt-2">Be the first to post!</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-6 py-3 rounded-full font-bold text-sm">+ Create First Yak</button></div>}
      </div>

      <button onClick={()=>setScreen('create')} className="fixed bottom-6 right-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-black w-14 h-14 rounded-full text-2xl font-black shadow-2xl shadow-yellow-400/20 flex items-center justify-center hover:scale-110 transition">+</button>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-30 p-4 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-[#1f1f1f] border border-zinc-800 rounded-full flex items-center justify-center">{userData.avatar}</div><div><h2 className="font-black text-lg leading-none">New Yak</h2><p className="text-xs text-zinc-500">{userData.college} • {userData.username}</p></div></div><button onClick={()=>setScreen('feed')} className="w-10 h-10 bg-[#1a1a1a] border border-zinc-800 rounded-full">✕</button></div>
            <div className="flex gap-2 mt-6 overflow-x-auto">{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2.5 rounded-full text-xs font-bold border ${topic===t.name?'bg-yellow-400 text-black':'bg-[#1a1a1a] border-zinc-800 text-zinc-500'}`}>{t.icon} {t.name}</button>)}</div>
            <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}? ${userData.avatar}`} className="w-full h-36 mt-6 p-5 bg-[#141414] border border-zinc-800 rounded-[24px] outline-none text-[16px] resize-none"/>
            <div className="grid grid-cols-2 gap-3 mt-4"><input value={poll.q1} onChange={e=>setPoll({...poll,q1:e.target.value})} placeholder="Poll Option A" className="p-4 bg-[#141414] border border-zinc-800 rounded-2xl text-sm"/><input value={poll.q2} onChange={e=>setPoll({...poll,q2:e.target.value})} placeholder="Poll Option B" className="p-4 bg-[#141414] border border-zinc-800 rounded-2xl text-sm"/></div>
            <label className="w-full mt-4 border-2 border-dashed border-zinc-800 p-5 rounded-[24px] flex flex-col items-center text-sm text-zinc-500 bg-[#141414] cursor-pointer">🖼️ Add Photos<input type="file" multiple hidden accept="image/*" onChange={e=>{ Array.from(e.target.files||[]).slice(0,4).forEach((f:any)=>{ const r=new FileReader(); r.onloadend=()=>setImages(p=>[...p,r.result as string].slice(0,4)); r.readAsDataURL(f); }); }}/></label>
            {images.length>0 && <div className="grid grid-cols-4 gap-2 mt-3">{images.map((im,i)=><div key={i} className="relative"><img src={im} className="h-20 rounded-xl object-cover w-full border border-zinc-800"/><button onClick={()=>setImages(images.filter((_,idx)=>idx!==i))} className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full text-xs">x</button></div>)}</div>}
            <button onClick={handlePost} className="w-full mt-8 bg-white text-black p-4 rounded-full font-black text-lg">Post as {userData.avatar} {userData.username} 🚀</button>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#141414] border border-zinc-800 w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6">
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="flex items-center gap-4"><div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[20px] flex items-center justify-center text-3xl">{userData.avatar}</div><div><h2 className="font-black text-lg">{userData.username}</h2><p className="text-xs text-zinc-500">{userData.college}</p><div className="flex gap-2 mt-1"><span className="text-[10px] bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">🔥 {userData.karma||0} karma</span><span className="text-[10px] bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">{userData.totalPosts||0} yaks</span></div></div></div>
            <div className="grid grid-cols-3 gap-2 mt-6"><div className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-center"><p className="text-xl font-black text-green-400">{userData.likedPosts?.length||0}</p><p className="text-[9px] text-zinc-500 font-bold uppercase">Liked</p></div><div className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-center"><p className="text-xl font-black">{userData.totalPosts||0}</p><p className="text-[9px] text-zinc-500 font-bold uppercase">Posts</p></div><div className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-center"><p className="text-xl font-black text-red-400">{userData.dislikedPosts?.length||0}</p><p className="text-[9px] text-zinc-500 font-bold uppercase">Disliked</p></div></div>
            <div className="mt-6 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-4"><p className="text-xs font-bold text-yellow-400">🏆 Your Stats</p><div className="mt-2 space-y-1"><div className="flex justify-between text-[11px]"><span className="text-zinc-500">Karma score</span><span className="font-bold">{userData.karma} pts</span></div><div className="flex justify-between text-[11px]"><span className="text-zinc-500">Campus</span><span className="font-bold">{userData.college} only 🔒</span></div></div></div>
            <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-[#1f1f1f] border border-zinc-800 p-3.5 rounded-full text-sm font-bold">Logout & Switch Campus</button>
          </div>
        </div>
      )}
    </div>
  );
                  }
