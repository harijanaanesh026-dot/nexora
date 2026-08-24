"use client";
import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLEGES = ["JNTU Anantapur","RGUKT","SVU","JNTUH","VTU","Sri Venkateswara University","Other"];
const TOPICS = [
  {name:"Confessions",icon:"🤫",color:"bg-pink-500"},
  {name:"Crushes",icon:"💘",color:"bg-red-500"},
  {name:"Hostel",icon:"🏠",color:"bg-green-500"},
  {name:"Academics",icon:"📚",color:"bg-blue-500"},
  {name:"Memes",icon:"😂",color:"bg-yellow-500"},
  {name:"Placements",icon:"💼",color:"bg-purple-500"},
  {name:"Canteen",icon:"🍔",color:"bg-orange-500"},
  {name:"Events",icon:"🎉",color:"bg-rose-500"},
];

export default function YakApp(){
  const [userData,setUserData]=useState<any>(null);
  const [screen,setScreen]=useState<any>('verify');
  const [yaks,setYaks]=useState<any[]>([]);
  const [feed,setFeed]=useState('college');
  const [topic,setTopic]=useState('All');
  const [search,setSearch]=useState('');
  const [newYak,setNewYak]=useState('');
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [showProfile,setShowProfile]=useState(false);
  const [editYak,setEditYak]=useState<any>(null);
  const [selectedCollege,setSelectedCollege]=useState(COLLEGES[0]);

  useEffect(()=>{
    const saved = localStorage.getItem('yak_user');
    if(saved){
      setUserData(JSON.parse(saved));
      setScreen('feed');
    }
  },[]);

  useEffect(()=>{
    if(!userData) return;
    return onSnapshot(query(collection(db,'yaks'),orderBy('createdAt','desc')),s=>{
      let data=s.docs.map(d=>({id:d.id,...d.data()} as any));
      if(feed==='college') data=data.filter(y=>!y.college || y.college===userData.college);
      if(feed==='trending') data=[...data].sort((a,b)=>(b.likes||0)-(a.likes||0));
      if(topic!=='All') data=data.filter(y=>y.topic===topic);
      if(search) data=data.filter(y=> y.text?.toLowerCase().includes(search.toLowerCase()));
      setYaks(data);
    });
  },[userData,feed,topic,search]);

  useEffect(()=>{ if(!activePost) return; return onSnapshot(query(collection(db,`yaks/${activePost}/comments`),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()})))); },[activePost]);

  const handlePost=async()=>{
    if(!newYak.trim()) return alert('Emanna rayi bro!');
    const payload:any={ text:newYak.trim(), uid:userData.uid, username:userData.username, college:userData.college, topic:topic==='All'?'Confessions':topic, likes:0, dislikes:0, commentsCount:0, createdAt:serverTimestamp() };
    if(editYak){ await updateDoc(doc(db,'yaks',editYak.id),{text:newYak.trim()}); setEditYak(null); }
    else { await addDoc(collection(db,'yaks'),payload); }
    setNewYak(''); setScreen('feed');
  };

  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col justify-center max-w-md mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-yellow-400/10 rounded-full blur-[100px]"></div>
        <div className="z-10">
          <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center font-black text-black text-xl">Y</div>
          <h1 className="text-5xl font-black mt-6 tracking-tighter leading-none">YAK<span className="text-yellow-400">.</span><br/>campus 👻</h1>
          <p className="text-zinc-500 text-sm mt-3">No login needed. Pick campus and start yaking - 100% anonymous</p>
          <div className="mt-8 space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {COLLEGES.map(c=>{
              const active = selectedCollege===c;
              return(
                <button key={c} onClick={()=>setSelectedCollege(c)} className={`w-full p-4 rounded-[18px] border flex justify-between items-center text-left transition ${active?'bg-white text-black border-white scale-[1.02]':'bg-[#141414] border-zinc-800 text-zinc-300'}`}>
                  <div className="flex gap-3 items-center">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${active?'bg-black text-white':'bg-[#1f1f1f]'}`}>{c.slice(0,2).toUpperCase()}</div>
                    <span className="font-bold text-sm">{c}</span>
                  </div>
                  {active && <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs">✓</span>}
                </button>
              )
            })}
          </div>
          <button onClick={()=>{
            const username=`Yak_${Math.floor(Math.random()*9000)+1000}`;
            const uid = `uid_${Date.now()}`;
            const data = {uid, username, college:selectedCollege};
            localStorage.setItem('yak_user', JSON.stringify(data));
            setUserData(data);
            setScreen('feed');
          }} className="w-full mt-8 bg-yellow-400 text-black p-4 rounded-full font-black text-lg shadow-lg">Enter {selectedCollege} 🚀</button>
          <p className="text-[10px] text-zinc-600 text-center mt-4">No Google login • 100% Anonymous • Text only</p>
        </div>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="p-4 flex justify-between items-center max-w-xl mx-auto">
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center font-black text-black">Y</div><h1 className="font-black text-xl">YAK.</h1><span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-full text-zinc-400">{userData.college}</span></div>
          <button onClick={()=>setShowProfile(true)} className="bg-[#1a1a1a] border border-zinc-800 px-4 h-9 rounded-full text-xs font-bold">👻 {userData.username}</button>
        </div>
        <div className="px-4 pb-3 max-w-xl mx-auto">
          <div className="flex gap-2 overflow-x-auto">
            <button onClick={()=>setFeed('college')} className={`px-5 h-9 rounded-full text-xs font-bold whitespace-nowrap ${feed==='college'?'bg-white text-black':'bg-[#1a1a1a] text-zinc-400 border border-zinc-800'}`}>🏠 {userData.college}</button>
            <button onClick={()=>setFeed('trending')} className={`px-5 h-9 rounded-full text-xs font-bold ${feed==='trending'?'bg-white text-black':'bg-[#1a1a1a] text-zinc-400 border border-zinc-800'}`}>🔥 Trending</button>
            <button onClick={()=>setFeed('latest')} className={`px-5 h-9 rounded-full text-xs font-bold ${feed==='latest'?'bg-white text-black':'bg-[#1a1a1a] text-zinc-400 border border-zinc-800'}`}>✨ Latest</button>
          </div>
          <div className="relative mt-3"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search text posts..." className="w-full bg-[#141414] border border-zinc-800 rounded-full pl-11 pr-4 py-3 text-sm outline-none focus:border-yellow-400/50"/></div>
        </div>
      </div>

      <div className="p-3 space-y-3 max-w-xl mx-auto mt-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={()=>setTopic('All')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${topic==='All'?'bg-yellow-400 text-black border-yellow-400':'bg-[#141414] border-zinc-800 text-zinc-400'}`}>🌍 All</button>
          {TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border flex gap-1 ${topic===t.name?'bg-yellow-400 text-black border-yellow-400':'bg-[#141414] border-zinc-800 text-zinc-400'}`}><span>{t.icon}</span>{t.name}</button>)}
        </div>

        {yaks.map(y=>{
          const meta=TOPICS.find(t=>t.name===y.topic);
          const isOwner=userData.uid===y.uid;
          return(
            <div key={y.id} className="bg-[#141414] border border-zinc-800 rounded-[24px] p-5">
              <div className="flex justify-between items-start">
                <div className="flex gap-2 items-center"><div className="w-8 h-8 bg-[#1f1f1f] rounded-full flex items-center justify-center">👻</div><div><p className="text-xs font-bold flex gap-1.5">{y.username||'Anonymous'} <span className={`text-[9px] px-2 py-0.5 rounded-full ${meta?.color||'bg-zinc-800'} text-white`}>{y.topic||'General'}</span> {isOwner && <span className="text-[9px] bg-yellow-400 text-black px-2 py-0.5 rounded-full">YOU</span>}</p><p className="text-[11px] text-zinc-500">{y.college}</p></div></div>
                {isOwner && <div className="flex gap-1"><button onClick={()=>{setEditYak(y); setNewYak(y.text); setScreen('create');}} className="w-8 h-8 bg-[#1f1f1f] border border-zinc-800 rounded-full text-xs">✏️</button><button onClick={async()=>{ if(confirm('Delete?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-full text-xs">🗑️</button></div>}
              </div>
              <p className="mt-4 text-[17px] leading-[1.5] whitespace-pre-wrap">{y.text}</p>
              <div className="flex gap-2 mt-5">
                <div className="flex bg-[#1f1f1f] rounded-full border border-zinc-800 overflow-hidden"><button onClick={()=>updateDoc(doc(db,'yaks',y.id),{likes:increment(1)})} className="px-4 py-2.5 text-sm font-bold">⬆️ {y.likes||0}</button><div className="w-px bg-zinc-800"/><button onClick={()=>updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)})} className="px-4 py-2.5 text-sm font-bold text-zinc-500">⬇️ {y.dislikes||0}</button></div>
                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#1f1f1f] border border-zinc-800 px-4 py-2.5 rounded-full text-sm font-bold">💬 {y.commentsCount||0}</button>
              </div>
              {activePost===y.id && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="space-y-2 max-h-64 overflow-y-auto">{comments.map(c=><div key={c.id} className="flex gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px]">👻</div><div className="bg-[#1f1f1f] rounded-2xl rounded-tl-none px-3 py-2 flex-1"><p className="text-xs font-bold">{c.username}</p><p className="text-[13px]">{c.text}</p></div>{userData.uid===c.uid && <button onClick={async()=>{ await deleteDoc(doc(db,`yaks/${y.id}/comments/${c.id}`)); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(-1)}); }} className="text-[10px]">✕</button>}</div>)}</div>
                  <div className="flex gap-2 mt-3"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment..." className="flex-1 bg-[#1f1f1f] border border-zinc-800 rounded-full px-4 py-3 text-sm outline-none"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,`yaks/${y.id}/comments`),{text:commentText,uid:userData.uid,username:userData.username,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); setCommentText(''); }} className="bg-yellow-400 text-black w-11 h-11 rounded-full font-bold">↑</button></div>
                </div>
              )}
            </div>
          )
        })}
        {yaks.length===0 && <p className="text-center text-zinc-500 py-20 text-sm">No posts yet in {userData.college}<br/>Be first 👻</p>}
      </div>

      <button onClick={()=>setScreen('create')} className="fixed bottom-6 right-6 bg-yellow-400 text-black w-14 h-14 rounded-full text-2xl font-black shadow-xl">+</button>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-30 p-4">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between items-center"><h2 className="font-black text-xl">{editYak?'Edit':'New'} Yak - Text Only</h2><button onClick={()=>{setScreen('feed'); setEditYak(null); setNewYak('');}} className="w-9 h-9 bg-[#1a1a1a] border border-zinc-800 rounded-full">✕</button></div>
            <div className="flex gap-2 mt-6 overflow-x-auto">{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${topic===t.name?'bg-yellow-400 text-black':'bg-[#1a1a1a] border-zinc-800 text-zinc-400'}`}>{t.icon} {t.name}</button>)}</div>
            <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} autoFocus placeholder="What's on your mind? Anonymous ga cheppu..." className="w-full h-48 mt-6 p-5 bg-[#141414] border border-zinc-800 rounded-[24px] outline-none text-[18px] resize-none" maxLength={500}/>
            <p className="text-right text-xs text-zinc-600 mt-2">{newYak.length}/500</p>
            <button onClick={handlePost} className="w-full mt-6 bg-white text-black p-4 rounded-full font-black text-lg">Post Anonymously 🚀</button>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-6">
          <div className="bg-[#141414] border border-zinc-800 w-full max-w-sm rounded-[24px] p-6">
            <div className="flex justify-between"><div className="flex gap-3"><div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center font-black text-black">👻</div><div><h2 className="font-black">{userData.username}</h2><p className="text-xs text-zinc-500">{userData.college}</p></div></div><button onClick={()=>setShowProfile(false)} className="w-8 h-8 bg-[#1f1f1f] rounded-full">✕</button></div>
            <button onClick={()=>{ localStorage.removeItem('yak_user'); window.location.reload(); }} className="w-full mt-6 bg-[#1f1f1f] border border-zinc-800 p-3 rounded-full text-sm font-bold">Change College / Logout</button>
          </div>
        </div>
      )}
    </div>
  );
    }
