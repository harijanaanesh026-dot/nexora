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
provider.setCustomParameters({ prompt: 'select_account' });

// ✅ UPDATED COLLEGES
const COLLEGES = ["BITS","SRET","SVCE","ST.JOHNS","ARTS & SCIENCE","VEMU","OTHER"];

const TOPICS = [
  {name:"Confessions",icon:"🤫",color:"bg-pink-500"},
  {name:"Crushes",icon:"💘",color:"bg-red-500"},
  {name:"Hostel",icon:"🏠",color:"bg-green-500"},
  {name:"Placements",icon:"💼",color:"bg-purple-500"},
  {name:"Memes",icon:"😂",color:"bg-yellow-500"},
  {name:"Canteen",icon:"🍔",color:"bg-orange-500"},
  {name:"Events",icon:"🎉",color:"bg-rose-500"},
  {name:"Academics",icon:"📚",color:"bg-blue-500"},
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
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ getRedirectResult(auth).catch(e=>setLoginError(e.message)); setLoading(false); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          const col = localStorage.getItem('selected_college');
          if(!col){ setScreen('college'); return; }
          const username=`Yak_${Math.floor(Math.random()*9000)+1000}`;
          await addDoc(collection(db,'users'),{uid:u.uid,email:u.email,username,college:col,karma:100,totalPosts:0,createdAt:serverTimestamp()});
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
    if(!selectedCollege) return alert('College select chey bro!');
    localStorage.setItem('selected_college', selectedCollege);
    setScreen('login');
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    try{ await signInWithPopup(auth, provider); }
    catch(e:any){ try{ await signInWithRedirect(auth, provider); }catch(err:any){ setLoginError(err.message); } }
  };

  const handlePost=async()=>{
    if(!newYak.trim() && images.length===0 &&!poll.q1) return alert('Emanna rayi bro!');
    try{
      const payload:any={ text:newYak.trim(), uid:user.uid, username:userData.username, college:userData.college, topic:topic==='All'?'Memes':topic, likes:0, dislikes:0, commentsCount:0, imageUrls:images, poll: poll.q1?{q1:poll.q1,q2:poll.q2,v1:0,v2:0,voters:[]}:null, createdAt:serverTimestamp() };
      if(editYak){ await updateDoc(doc(db,'yaks',editYak.id),{text:newYak.trim(),imageUrls:images}); setEditYak(null); }
      else { await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1)}); }
      setNewYak(''); setImages([]); setPoll({q1:'',q2:''}); setScreen('feed');
    }catch(e:any){ alert(e.message); }
  };

  if(loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading YAK...</div>;

  if(screen==='college'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-yellow-400/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px]"></div>
        <div className="z-10 w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[20px] mx-auto flex items-center justify-center font-black text-black text-2xl shadow-xl">Y</div>
            <h1 className="text-5xl font-black mt-6 tracking-tighter">YAK<span className="text-yellow-400">.</span></h1>
            <p className="text-zinc-400 text-sm mt-2">Anonymous campus confessions</p>
            <div className="mt-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full text-[11px] text-zinc-400 inline-flex items-center gap-2">🔒 BITS • SRET • SVCE • ST.JOHNS • VEMU</div>
          </div>
          <div className="mt-10">
            <h2 className="font-bold text-lg">Select your campus 👇</h2>
            <p className="text-xs text-zinc-500 mt-1">Oka campus post inkoka campus lo kanipinchadu</p>
            <div className="grid grid-cols-1 gap-2.5 mt-5">
              {COLLEGES.map(c=>{
                const active = selectedCollege===c;
                return(
                  <button key={c} onClick={()=>setSelectedCollege(c)} className={`w-full p-4 rounded-2xl border text-left font-bold flex justify-between items-center transition-all ${active?'bg-white text-black border-white scale-[1.02] shadow-xl':'bg-[#141414] border-zinc-800 text-zinc-300 hover:border-zinc-700'}`}>
                    <span className="flex items-center gap-3"><span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${active?'bg-black text-white':'bg-zinc-800 text-yellow-400'}`}>{c[0]}</span>{c}</span>
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${active?'bg-black border-black text-white':'border-zinc-700'}`}>{active?'✓':''}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={handleCollegeNext} disabled={!selectedCollege} className={`w-full mt-6 py-4 rounded-full font-black text-base transition-all ${selectedCollege?'bg-yellow-400 text-black hover:scale-[1.02] shadow-lg shadow-yellow-400/20':'bg-zinc-800 text-zinc-500'}`}>Continue to {selectedCollege||'Campus'} →</button>
          </div>
        </div>
      </div>
    );
  }

  if(screen==='login'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <div className="z-10 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-white rounded-[20px] mx-auto flex items-center justify-center font-black text-black text-2xl">Y</div>
          <h1 className="text-4xl font-black mt-6">Welcome to<br/><span className="text-yellow-400">{selectedCollege || localStorage.getItem('selected_college')}</span></h1>
          <p className="text-zinc-500 text-sm mt-3">Login to see anonymous confessions<br/>only from {selectedCollege} 🔒</p>
          <div className="mt-10 bg-[#141414] border border-zinc-800 rounded-[24px] p-6">
            <button onClick={handleGoogleLogin} className="w-full bg-white text-black py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition shadow-xl">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5"/> Continue with Google
            </button>
            {loginError && <p className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{loginError}</p>}
            <button onClick={()=>{localStorage.removeItem('selected_college'); setScreen('college');}} className="w-full mt-4 bg-[#1f1f1f] border border-zinc-800 py-3 rounded-full text-xs font-bold">← Change Campus</button>
          </div>
        </div>
      </div>
    );
                                                                                                                                                          }

  return(
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="p-4 flex justify-between items-center max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center font-black text-black">Y</div>
            <div><h1 className="font-black text-[14px] leading-none">YAK. {userData.college}</h1><p className="text-[10px] text-green-400 font-bold">● {yaks.length} yaks • {userData.college} only</p></div>
          </div>
          <button onClick={()=>setShowProfile(true)} className="bg-[#1a1a1a] border border-zinc-800 px-4 h-9 rounded-full text-xs font-bold">👻 {userData.username}</button>
        </div>
        <div className="px-4 pb-4 max-w-xl mx-auto">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={()=>setTopic('All')} className={`px-5 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap ${topic==='All'?'bg-white text-black':'bg-[#141414] border-zinc-800 text-zinc-400'}`}>🌍 All</button>
            {TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap ${topic===t.name?'bg-yellow-400 text-black border-yellow-400':'bg-[#141414] border-zinc-800 text-zinc-500'}`}>{t.icon} {t.name}</button>)}
          </div>
          <div className="relative mt-3"><span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search in ${userData.college}...`} className="w-full bg-[#141414] border border-zinc-800 rounded-full pl-11 pr-4 py-3 text-sm outline-none focus:border-yellow-400/50"/></div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-3 space-y-3 mt-2">
        <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-3 flex items-center gap-3"><span className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-black font-black">🔒</span><div><p className="text-xs font-bold text-yellow-400">{userData.college} Isolated Feed</p><p className="text-[11px] text-zinc-400">BITS/SRET/SVCE vallaki kanipinchadu • Only {userData.college}</p></div></div>

        {yaks.map(y=>{
          const total=(y.poll?.v1||0)+(y.poll?.v2||0);
          const isOwner=user?.uid===y.uid;
          return(
            <div key={y.id} className="bg-[#141414] border border-zinc-800 rounded-[24px] p-5 hover:border-zinc-700 transition">
              <div className="flex justify-between items-start">
                <div className="flex gap-2.5 items-center"><div className="w-9 h-9 bg-[#1f1f1f] border border-zinc-800 rounded-full flex items-center justify-center">👻</div><div><p className="text-xs font-bold flex items-center gap-1.5">{y.username} {isOwner && <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[9px] font-black">YOU</span>} <span className={`text-[9px] px-2 py-0.5 rounded-full ${TOPICS.find(t=>t.name===y.topic)?.color||'bg-zinc-700'} text-white`}>{y.topic}</span></p><p className="text-[11px] text-zinc-500">{y.college} • {y.createdAt?.toDate? new Date(y.createdAt.toDate()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'now'}</p></div></div>
                <div className="flex gap-1.5">
                  {isOwner && <button onClick={()=>{setEditYak(y); setNewYak(y.text); setImages(y.imageUrls||[]); setScreen('create');}} className="w-8 h-8 bg-[#1f1f1f] border border-zinc-800 rounded-full text-xs">✏️</button>}
                  <button onClick={async()=>{ if(confirm('Delete?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-full text-xs">🗑️</button>
                </div>
              </div>
              {y.text && <p className="mt-4 text-[16px] leading-[1.5] whitespace-pre-wrap">{y.text}</p>}
              {y.imageUrls?.length>0 && <div className="grid grid-cols-2 gap-2 mt-4">{y.imageUrls.map((im:string,i:number)=><img key={i} src={im} className="rounded-2xl w-full max-h-80 object-cover border border-zinc-800"/>)}</div>}
              {y.poll && (
                <div className="mt-4 space-y-2">
                  <button onClick={async()=>{ if(y.poll.voters?.includes(user.uid)) return alert('Already voted'); await updateDoc(doc(db,'yaks',y.id),{'poll.v1':increment(1),'poll.voters':arrayUnion(user.uid)}); }} className="w-full bg-[#1f1f1f] border border-zinc-800 p-4 rounded-2xl text-left relative overflow-hidden"><div className="absolute inset-0 bg-yellow-400/10" style={{width:`${total? (y.poll.v1/total)*100:0}%`}}></div><p className="relative font-bold text-sm flex justify-between">{y.poll.q1} <span className="bg-zinc-800 px-2 py-0.5 rounded-full text-xs">{y.poll.v1||0}</span></p></button>
                  <button onClick={async()=>{ if(y.poll.voters?.includes(user.uid)) return alert('Already voted'); await updateDoc(doc(db,'yaks',y.id),{'poll.v2':increment(1),'poll.voters':arrayUnion(user.uid)}); }} className="w-full bg-[#1f1f1f] border border-zinc-800 p-4 rounded-2xl text-left relative overflow-hidden"><div className="absolute inset-0 bg-yellow-400/10" style={{width:`${total? (y.poll.v2/total)*100:0}%`}}></div><p className="relative font-bold text-sm flex justify-between">{y.poll.q2} <span className="bg-zinc-800 px-2 py-0.5 rounded-full text-xs">{y.poll.v2||0}</span></p></button>
                  <p className="text-[11px] text-zinc-500">{total} votes • {userData.college} only</p>
                </div>
              )}
              <div className="flex items-center gap-2 mt-5">
                <div className="flex bg-[#1f1f1f] rounded-full border border-zinc-800 overflow-hidden"><button onClick={()=>updateDoc(doc(db,'yaks',y.id),{likes:increment(1)})} className="px-4 py-2.5 text-sm font-bold hover:bg-zinc-800">⬆️ {y.likes||0}</button><div className="w-px bg-zinc-800"/><button onClick={()=>updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)})} className="px-4 py-2.5 text-sm font-bold text-zinc-500 hover:bg-zinc-800">⬇️ {y.dislikes||0}</button></div>
                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#1f1f1f] border border-zinc-800 px-4 py-2.5 rounded-full text-sm font-bold">💬 {y.commentsCount||0}</button>
              </div>
              {activePost===y.id && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-2"><div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center text-[11px] shrink-0">👻</div><div className="bg-[#1f1f1f] border border-zinc-800 rounded-2xl px-3.5 py-2.5 flex-1 text-[13px]">{c.text}</div><button onClick={async()=>{ await deleteDoc(doc(db,`yaks/${y.id}/comments/${c.id}`)); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(-1)}); }} className="text-[10px] text-zinc-600">✕</button></div>)}</div>
                  <div className="flex gap-2 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Anonymous comment..." className="flex-1 bg-[#1f1f1f] border border-zinc-800 rounded-full px-4 py-3 text-sm outline-none"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,`yaks/${y.id}/comments`),{text:commentText,uid:user.uid,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="bg-yellow-400 text-black w-11 h-11 rounded-full font-black">↑</button></div>
                </div>
              )}
            </div>
          )
        })}
        {yaks.length===0 && <div className="text-center py-20 bg-[#141414] border border-dashed border-zinc-800 rounded-[24px]"><p className="text-5xl">👻</p><p className="font-bold mt-4">No yaks yet in {userData.college}</p><p className="text-xs text-zinc-500 mt-2">Be the first to post!</p><button onClick={()=>setScreen('create')} className="mt-6 bg-white text-black px-6 py-3 rounded-full font-bold text-sm">+ Create First Yak</button></div>}
      </div>

      <button onClick={()=>setScreen('create')} className="fixed bottom-6 right-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-black w-14 h-14 rounded-full text-2xl font-black shadow-2xl flex items-center justify-center">+</button>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-30 p-4 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between items-center"><div><h2 className="font-black text-xl">New Yak</h2><p className="text-xs text-zinc-500">Posting to {userData.college} only 🔒</p></div><button onClick={()=>setScreen('feed')} className="w-10 h-10 bg-[#1a1a1a] border border-zinc-800 rounded-full">✕</button></div>
            <div className="flex gap-2 mt-6 overflow-x-auto scrollbar-hide">{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap ${topic===t.name?'bg-yellow-400 text-black border-yellow-400':'bg-[#1a1a1a] border-zinc-800 text-zinc-500'}`}>{t.icon} {t.name}</button>)}</div>
            <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={`What's happening in ${userData.college}?`} className="w-full h-36 mt-6 p-5 bg-[#141414] border border-zinc-800 rounded-[24px] outline-none text-[16px] resize-none" maxLength={500}/>
            <div className="grid grid-cols-2 gap-3 mt-4"><input value={poll.q1} onChange={e=>setPoll({...poll,q1:e.target.value})} placeholder="Poll Option A" className="p-4 bg-[#141414] border border-zinc-800 rounded-2xl text-sm"/><input value={poll.q2} onChange={e=>setPoll({...poll,q2:e.target.value})} placeholder="Poll Option B" className="p-4 bg-[#141414] border border-zinc-800 rounded-2xl text-sm"/></div>
            <label className="w-full mt-4 border-2 border-dashed border-zinc-800 p-5 rounded-[24px] flex flex-col items-center text-sm text-zinc-500 bg-[#141414] cursor-pointer">🖼️ Add Photos<input type="file" multiple hidden accept="image/*" onChange={e=>{ Array.from(e.target.files||[]).slice(0,4).forEach((f:any)=>{ const r=new FileReader(); r.onloadend=()=>setImages(p=>[...p,r.result as string].slice(0,4)); r.readAsDataURL(f); }); }}/></label>
            {images.length>0 && <div className="grid grid-cols-4 gap-2 mt-3">{images.map((im,i)=><div key={i} className="relative"><img src={im} className="h-20 rounded-xl object-cover w-full border border-zinc-800"/><button onClick={()=>setImages(images.filter((_,idx)=>idx!==i))} className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full text-xs">x</button></div>)}</div>}
            <button onClick={handlePost} className="w-full mt-8 bg-white text-black p-4 rounded-full font-black text-lg">Post to {userData.college} 🚀</button>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#141414] border border-zinc-800 w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6">
            <div className="flex justify-between items-center"><div className="flex gap-3"><div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center font-black text-black">👻</div><div><h2 className="font-black">{userData.username}</h2><p className="text-xs text-zinc-500">{userData.college} • Isolated</p></div></div><button onClick={()=>setShowProfile(false)} className="w-9 h-9 bg-[#1f1f1f] border border-zinc-800 rounded-full">✕</button></div>
            <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-[#1f1f1f] border border-zinc-800 p-3.5 rounded-full text-sm font-bold">Logout & Switch Campus</button>
          </div>
        </div>
      )}
    </div>
  );
                  }
