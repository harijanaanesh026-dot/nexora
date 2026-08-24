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

const COLLEGES = ["SRET","BITS","Arts&Science","SVCE","Other"];
const TOPICS = [
  {name:"Academics",icon:"📚",color:"bg-blue-500"},
  {name:"Confessions",icon:"🤫",color:"bg-pink-500"},
  {name:"Crushes",icon:"💘",color:"bg-red-500"},
  {name:"Hostel",icon:"🏠",color:"bg-green-500"},
  {name:"Placements",icon:"💼",color:"bg-purple-500"},
  {name:"Memes",icon:"😂",color:"bg-yellow-500"},
  {name:"Canteen",icon:"🍔",color:"bg-orange-500"},
  {name:"Lost & Found",icon:"🔍",color:"bg-teal-500"},
  {name:"Buy & Sell",icon:"🛒",color:"bg-indigo-500"},
  {name:"Events",icon:"🎉",color:"bg-rose-500"},
];

export default function YakApp(){
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState<any>('verify');
  const [yaks,setYaks]=useState<any[]>([]);
  const [feed,setFeed]=useState('college');
  const [topic,setTopic]=useState('All');
  const [search,setSearch]=useState('');
  const [newYak,setNewYak]=useState('');
  const [images,setImages]=useState<string[]>([]);
  const [poll,setPoll]=useState({q1:'',q2:''});
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [notifs,setNotifs]=useState<any[]>([]);
  const [showNotifs,setShowNotifs]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [editYak,setEditYak]=useState<any>(null);
  const [loginError,setLoginError]=useState('');
  const [selectedCollege,setSelectedCollege]=useState('JNTU Anantapur');

  useEffect(()=>{ getRedirectResult(auth).catch(e=>setLoginError(e.message)); },[]);

  useEffect(()=>{
    return onAuthStateChanged(auth, async(u)=>{
      if(u){
        setUser(u);
        const savedCollege = localStorage.getItem('selected_college') || selectedCollege;
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){
          // College already selected, direct create user
          const username=`Yak_${Math.floor(Math.random()*9000)+1000}`;
          await addDoc(collection(db,'users'),{uid:u.uid,username,college:savedCollege,karma:50,totalPosts:0,streak:1,createdAt:serverTimestamp()});
          window.location.reload();
        } else {
          setUserData({id:snap.docs[0].id,...snap.docs[0].data()});
          setScreen('feed');
        }
      } else {
        // No user, show college select first
        const savedUser = localStorage.getItem('yak_user');
        if(savedUser){
          // check if already has firestore user? else stay on verify
          setScreen('verify');
        } else {
          setScreen('verify');
        }
      }
    });
  },[]);

  useEffect(()=>{ if(!userData) return; return onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')),s=>{ let data=s.docs.map(d=>({id:d.id,...d.data()} as any)); if(feed==='college') data=data.filter(y=>!y.college || y.college===userData.college); if(feed==='trending') data=[...data].sort((a,b)=>(b.likes||0)-(a.likes||0)); if(topic!=='All') data=data.filter(y=>y.topic===topic); if(search) data=data.filter(y=> y.text?.toLowerCase().includes(search.toLowerCase())); setYaks(data); }); },[userData,feed,topic,search]);
  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,`yaks/${activePost}/comments`),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

  const handleGoogleLogin = async () => {
    try {
      localStorage.setItem('selected_college', selectedCollege);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if(isMobile) await signInWithRedirect(auth, provider);
      else await signInWithPopup(auth, provider);
    } catch(e:any){ setLoginError(e.message); try{ await signInWithRedirect(auth, provider);}catch{} }
  };

  const handlePost=async()=>{
    if(!newYak.trim() && images.length===0 &&!poll.q1) return alert('Text / Photo / Poll edaina pettu bro!');
    try{
      const payload:any={ text:newYak.trim(), uid:user.uid, username:userData.username, college:userData.college, topic:topic==='All'?'Memes':topic, likes:0, dislikes:0, commentsCount:0, imageUrls:images, poll: poll.q1?{q1:poll.q1,q2:poll.q2,v1:0,v2:0,voters:[]}:null, createdAt:serverTimestamp() };
      if(editYak){ await updateDoc(doc(db,'yaks',editYak.id),{text:newYak.trim(),imageUrls:images}); setEditYak(null); }
      else { await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1),karma:increment(10)}); }
      setNewYak(''); setImages([]); setPoll({q1:'',q2:''}); setScreen('feed');
    }catch(e:any){ alert("Post failed: "+e.message); }
  };

  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col justify-center max-w-md mx-auto">
        <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center font-black text-black text-xl">Y</div>
        <h1 className="text-4xl font-black mt-6 tracking-tighter">Pick your<br/>campus 👻</h1>
        <p className="text-zinc-500 text-sm mt-2">First college select chesko, taruvata Google login</p>
        <div className="mt-8 space-y-2 max-h-[45vh] overflow-y-auto">
          {COLLEGES.map(c=>{
            const active = selectedCollege===c;
            return <button key={c} onClick={()=>setSelectedCollege(c)} className={`w-full p-4 rounded-2xl border text-left font-bold flex justify-between ${active?'bg-white text-black border-white':'bg-[#141414] border-zinc-800 text-zinc-300'}`}>{c} {active?'✓':''}</button>
          })}
        </div>
        <div className="mt-8 bg-[#141414] border border-zinc-800 rounded-[20px] p-4">
          <p className="text-xs text-zinc-500 mb-3">Selected: <span className="text-white font-bold">{selectedCollege}</span></p>
          <button onClick={handleGoogleLogin} className="w-full bg-white text-black px-6 py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5"/> Continue with Google
          </button>
          {loginError && <p className="mt-3 text-xs text-red-400">{loginError}</p>}
          <p className="text-[10px] text-zinc-600 text-center mt-3">College select ayyaka Google login vastundi</p>
        </div>
      </div>
    );
                                                                                                                                                                                                                      }

  return(
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="p-4 flex justify-between items-center max-w-xl mx-auto">
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center font-black text-black">Y</div><h1 className="font-black text-xl">YAK.</h1><span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-full text-zinc-400">{userData?.college}</span></div>
          <div className="flex gap-2">
            <button onClick={()=>setShowNotifs(true)} className="bg-[#1a1a1a] border border-zinc-800 w-9 h-9 rounded-full text-xs">🔔</button>
            <button onClick={()=>setShowProfile(true)} className="bg-[#1a1a1a] border border-zinc-800 px-4 h-9 rounded-full text-xs font-bold">👻 {userData?.username}</button>
          </div>
        </div>
        <div className="px-4 pb-3 max-w-xl mx-auto">
          <div className="flex gap-2 overflow-x-auto">
            <button onClick={()=>setFeed('college')} className={`px-5 h-9 rounded-full text-xs font-bold ${feed==='college'?'bg-white text-black':'bg-[#1a1a1a] text-zinc-400 border border-zinc-800'}`}>🏠 {userData?.college}</button>
            <button onClick={()=>setFeed('trending')} className={`px-5 h-9 rounded-full text-xs font-bold ${feed==='trending'?'bg-white text-black':'bg-[#1a1a1a] text-zinc-400 border border-zinc-800'}`}>🔥 Trending</button>
          </div>
          <div className="relative mt-3"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts..." className="w-full bg-[#141414] border border-zinc-800 rounded-full pl-11 pr-4 py-3 text-sm outline-none"/></div>
        </div>
      </div>

      <div className="p-3 space-y-3 max-w-xl mx-auto mt-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={()=>setTopic('All')} className={`px-4 py-2 rounded-full text-xs font-bold border ${topic==='All'?'bg-yellow-400 text-black':'bg-[#141414] border-zinc-800 text-zinc-400'}`}>All</button>
          {TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-3 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${topic===t.name?'bg-yellow-400 text-black':'bg-[#141414] border-zinc-800 text-zinc-400'}`}>{t.icon} {t.name}</button>)}
        </div>

        {yaks.map(y=>{
          const total = (y.poll?.v1||0)+(y.poll?.v2||0);
          const isOwner = user?.uid===y.uid;
          return(
            <div key={y.id} className="bg-[#141414] border border-zinc-800 rounded-[24px] p-5">
              <div className="flex justify-between items-start">
                <div className="flex gap-2 items-center"><div className="w-8 h-8 bg-[#1f1f1f] rounded-full flex items-center justify-center">👻</div><div><p className="text-xs font-bold">{y.username} {isOwner && <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[9px] ml-1">YOU</span>} <span className={`ml-1 text-[9px] px-2 py-0.5 rounded-full ${TOPICS.find(t=>t.name===y.topic)?.color||'bg-zinc-700'} text-white`}>{y.topic}</span></p><p className="text-[11px] text-zinc-500">{y.college}</p></div></div>
                <div className="flex gap-1">
                  {isOwner && <button onClick={()=>{setEditYak(y); setNewYak(y.text); setImages(y.imageUrls||[]); setScreen('create');}} className="w-8 h-8 bg-[#1f1f1f] border border-zinc-800 rounded-full text-xs">✏️</button>}
                  <button onClick={async()=>{ if(confirm(`Delete "${(y.text||'post').slice(0,20)}"?`)){ await deleteDoc(doc(db,'yaks',y.id)); } }} className="w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-full text-xs">🗑️</button>
                </div>
              </div>
              {y.text && <p className="mt-4 text-[17px] whitespace-pre-wrap">{y.text}</p>}
              {y.imageUrls?.length>0 && <div className="grid grid-cols-2 gap-2 mt-3">{y.imageUrls.map((im:string,i:number)=><img key={i} src={im} className="rounded-2xl w-full max-h-72 object-cover border border-zinc-800"/>)}</div>}
              {y.poll && (
                <div className="mt-3 space-y-2">
                  <button onClick={async()=>{ if(y.poll.voters?.includes(user.uid)) return alert('Already voted'); await updateDoc(doc(db,'yaks',y.id),{'poll.v1':increment(1),'poll.voters':arrayUnion(user.uid)}); }} className="w-full bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-left relative overflow-hidden"><div className="absolute inset-0 bg-yellow-400/10" style={{width:`${total? (y.poll.v1/total)*100:0}%`}}></div><p className="relative font-bold text-sm">{y.poll.q1} - {y.poll.v1||0}</p></button>
                  <button onClick={async()=>{ if(y.poll.voters?.includes(user.uid)) return alert('Already voted'); await updateDoc(doc(db,'yaks',y.id),{'poll.v2':increment(1),'poll.voters':arrayUnion(user.uid)}); }} className="w-full bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-left relative overflow-hidden"><div className="absolute inset-0 bg-yellow-400/10" style={{width:`${total? (y.poll.v2/total)*100:0}%`}}></div><p className="relative font-bold text-sm">{y.poll.q2} - {y.poll.v2||0}</p></button>
                  <p className="text-[11px] text-zinc-500">{total} votes</p>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <div className="flex bg-[#1f1f1f] rounded-full border border-zinc-800 overflow-hidden"><button onClick={()=>updateDoc(doc(db,'yaks',y.id),{likes:increment(1)})} className="px-4 py-2.5 text-sm font-bold">⬆️ {y.likes||0}</button><div className="w-px bg-zinc-800"/><button onClick={()=>updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)})} className="px-4 py-2.5 text-sm font-bold text-zinc-500">⬇️ {y.dislikes||0}</button></div>
                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#1f1f1f] border border-zinc-800 px-4 py-2.5 rounded-full text-sm font-bold">💬 {y.commentsCount||0}</button>
              </div>
              {activePost===y.id && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="space-y-2 max-h-64 overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px]">👻</div><div className="bg-[#1f1f1f] rounded-2xl px-3 py-2 flex-1 text-sm">{c.text}</div><button onClick={async()=>{ await deleteDoc(doc(db,`yaks/${y.id}/comments/${c.id}`)); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(-1)}); }} className="text-[10px]">✕</button></div>)}</div>
                  <div className="flex gap-2 mt-3"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment..." className="flex-1 bg-[#1f1f1f] border border-zinc-800 rounded-full px-4 py-3 text-sm"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,`yaks/${y.id}/comments`),{text:commentText,uid:user.uid,username:userData.username,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="bg-yellow-400 text-black w-11 h-11 rounded-full font-bold">↑</button></div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={()=>setScreen('create')} className="fixed bottom-6 right-6 bg-yellow-400 text-black w-14 h-14 rounded-full text-2xl font-black">+</button>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-30 p-4 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between"><h2 className="font-black text-xl">{editYak?'Edit':'New'} Yak</h2><button onClick={()=>{setScreen('feed'); setEditYak(null); setNewYak(''); setImages([]); setPoll({q1:'',q2:''});}} className="w-9 h-9 bg-[#1a1a1a] border border-zinc-800 rounded-full">✕</button></div>
            <div className="flex gap-2 mt-6 overflow-x-auto">{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${topic===t.name?'bg-yellow-400 text-black':'bg-[#1a1a1a] border-zinc-800 text-zinc-400'}`}>{t.icon} {t.name}</button>)}</div>
            <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="What's on your mind?..." className="w-full h-32 mt-6 p-5 bg-[#141414] border border-zinc-800 rounded-[24px] outline-none text-[18px] resize-none"/>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <input value={poll.q1} onChange={e=>setPoll({...poll,q1:e.target.value})} placeholder="Poll Option A" className="p-4 bg-[#141414] border border-zinc-800 rounded-2xl text-sm"/>
              <input value={poll.q2} onChange={e=>setPoll({...poll,q2:e.target.value})} placeholder="Poll Option B" className="p-4 bg-[#141414] border border-zinc-800 rounded-2xl text-sm"/>
            </div>
            <label className="w-full mt-4 border-2 border-dashed border-zinc-800 p-5 rounded-[20px] flex flex-col items-center text-sm text-zinc-500 bg-[#141414] cursor-pointer">🖼️ Add Photos<input type="file" multiple hidden accept="image/*" onChange={e=>{ Array.from(e.target.files||[]).slice(0,4).forEach((f:any)=>{ const r=new FileReader(); r.onloadend=()=>setImages(p=>[...p,r.result as string].slice(0,4)); r.readAsDataURL(f); }); }}/></label>
            {images.length>0 && <div className="grid grid-cols-4 gap-2 mt-3">{images.map((im,i)=><div key={i} className="relative"><img src={im} className="h-20 rounded-xl object-cover w-full"/><button onClick={()=>setImages(images.filter((_,idx)=>idx!==i))} className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full text-xs">x</button></div>)}</div>}
            <button onClick={handlePost} className="w-full mt-6 bg-white text-black p-4 rounded-full font-black text-lg">POST 🚀</button>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 z-30 flex items-center justify-center p-6">
          <div className="bg-[#141414] border border-zinc-800 w-full max-w-sm rounded-[24px] p-6">
            <div className="flex justify-between"><h2 className="font-black">👻 {userData?.username}</h2><button onClick={()=>setShowProfile(false)} className="w-8 h-8 bg-[#1f1f1f] rounded-full">✕</button></div>
            <p className="text-xs text-zinc-500 mt-1">{userData?.college}</p>
            <button onClick={()=>{auth.signOut(); localStorage.clear(); window.location.reload();}} className="w-full mt-6 bg-[#1f1f1f] border border-zinc-800 p-3 rounded-full text-sm font-bold">Logout</button>
          </div>
        </div>
      )}
    </div>
  );
          }
