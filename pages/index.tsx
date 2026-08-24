import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc } from 'firebase/firestore';

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

const COLLEGES = ["JNTU Anantapur","RGUKT","SVU","JNTUH","VTU","Other"];
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
  const [screen,setScreen]=useState<any>('login');
  const [yaks,setYaks]=useState<any[]>([]);
  const [feed,setFeed]=useState('college');
  const [topic,setTopic]=useState('All');
  const [search,setSearch]=useState('');
  const [tab,setTab]=useState('feed');
  const [newYak,setNewYak]=useState('');
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [notifs,setNotifs]=useState<any[]>([]);
  const [showNotifs,setShowNotifs]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [editYak,setEditYak]=useState<any>(null);
  const [loginError,setLoginError]=useState('');
  const [selectedCollege,setSelectedCollege]=useState(COLLEGES[0]);

  useEffect(()=>{ getRedirectResult(auth).catch(e=>setLoginError(e.message)); },[]);
  useEffect(()=>{
    return onAuthStateChanged(auth, async(u)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty) setScreen('verify');
        else { setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen('feed'); }
      } else setScreen('login');
    });
  },[]);

  useEffect(()=>{
    if(!userData) return;
    const q=query(collection(db,'yaks'),orderBy('createdAt','desc'));
    return onSnapshot(q,s=>{
      let data=s.docs.map(d=>({id:d.id,...d.data()} as any));
      if(feed==='college') data=data.filter(y=>!y.college || y.college===userData.college);
      if(feed==='trending') data=[...data].sort((a,b)=>(b.likes-b.dislikes)-(a.likes-a.dislikes));
      if(topic!=='All') data=data.filter(y=>y.topic===topic);
      if(search) data=data.filter(y=> y.text?.toLowerCase().includes(search.toLowerCase()));
      setYaks(data);
    });
  },[userData,feed,topic,search]);

  useEffect(()=>{
    if(!activePost) return;
    return onSnapshot(query(collection(db,`yaks/${activePost}/comments`),orderBy('createdAt','asc')),s=>setComments(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[activePost]);

  useEffect(()=>{
    if(!userData) return;
    return onSnapshot(query(collection(db,'notifications'),where('toUid','==',userData.uid),orderBy('createdAt','desc')),s=>setNotifs(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[userData]);

  const handleGoogleLogin = async () => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if(isMobile) await signInWithRedirect(auth, provider);
      else await signInWithPopup(auth, provider);
    } catch(e:any){ setLoginError(e.message); try{ await signInWithRedirect(auth, provider);}catch{} }
  };

  const handlePost=async()=>{
    if(!newYak.trim()) return alert('Emanna rayi bro!');
    const payload:any={ text:newYak.trim(), uid:user.uid, username:userData.username, college:userData.college, topic:topic==='All'?'Confessions':topic, likes:0, dislikes:0, commentsCount:0, createdAt:serverTimestamp() };
    if(editYak){ await updateDoc(doc(db,'yaks',editYak.id),{text:newYak.trim()}); setEditYak(null); }
    else { await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1),karma:increment(10)}); }
    setNewYak(''); setScreen('feed');
  };

  if(screen==='login'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
        <div className="z-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[24px] mx-auto flex items-center justify-center text-3xl font-black text-black shadow-2xl">Y</div>
          <h1 className="text-6xl font-black mt-6 tracking-tighter">YAK<span className="text-yellow-400">.</span></h1>
          <p className="text-zinc-400 mt-2">India's anonymous campus confessions</p>
          <p className="text-[11px] text-zinc-600 mt-1">100% Anonymous • College Only • Text Only</p>
          <button onClick={handleGoogleLogin} className="mt-10 bg-white text-black px-10 py-4 rounded-full font-bold flex items-center gap-3 mx-auto hover:scale-105 transition">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5"/> Continue with Google
          </button>
          {loginError && <p className="mt-4 text-xs text-red-400">{loginError}</p>}
        </div>
      </div>
    );
  }

  if(screen==='verify'){
    return(
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col justify-center max-w-md mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-yellow-400/10 rounded-full blur-[100px]"></div>
        <div className="z-10">
          <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center font-black text-black text-xl">Y</div>
          <h1 className="text-4xl font-black mt-6 tracking-tighter leading-none">Pick your<br/>campus 👻</h1>
          <p className="text-zinc-500 text-sm mt-3">Login ayyaka college select cheskoni enter avvali. Me campus yaks matrame chustav.</p>
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
          <button onClick={async()=>{
            const username=`Yak_${Math.floor(Math.random()*9000)+1000}`;
            await addDoc(collection(db,'users'),{uid:user.uid,username,college:selectedCollege,karma:50,totalPosts:0,streak:1,following:[],badges:['Newbie'],lastLogin:serverTimestamp(),createdAt:serverTimestamp()});
            window.location.reload();
          }} className="w-full mt-8 bg-yellow-400 text-black p-4 rounded-full font-black text-lg shadow-lg">Enter {selectedCollege} 🚀</button>
        </div>
      </div>
    );
    }

  return(
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* HEADER - ATTRACTIVE */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="p-4 flex justify-between items-center max-w-xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center font-black text-black">Y</div>
            <h1 className="font-black text-xl tracking-tighter">YAK<span className="text-yellow-400">.</span></h1>
            <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-full text-zinc-400">{userData.college}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setShowNotifs(true)} className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center relative border border-zinc-800">🔔{notifs.filter(n=>!n.read).length>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{notifs.filter(n=>!n.read).length}</span>}</button>
            <button onClick={()=>setShowProfile(true)} className="bg-[#1a1a1a] border border-zinc-800 px-4 h-9 rounded-full text-xs font-bold flex items-center gap-2"><span className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-[10px] text-black">👻</span>{userData.username}</button>
          </div>
        </div>
        <div className="px-4 pb-3 max-w-xl mx-auto">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {['college','trending','latest'].map(f=><button key={f} onClick={()=>setFeed(f)} className={`px-5 h-9 rounded-full text-xs font-bold capitalize whitespace-nowrap transition ${feed===f?'bg-white text-black':'bg-[#1a1a1a] text-zinc-400 border border-zinc-800'}`}>{f==='college'?'🏠 '+userData.college:f==='trending'?'🔥 Trending':'✨ Latest'}</button>)}
          </div>
          <div className="relative mt-3"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search confessions, topics, #hashtags" className="w-full bg-[#141414] border border-zinc-800 rounded-full pl-11 pr-4 py-3 text-sm outline-none focus:border-yellow-400/50 transition"/></div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-2 bg-[#111] mx-auto max-w-xl mt-2 rounded-full w-fit border border-zinc-900">
        {[
          {id:'feed',label:'Feed',icon:'🏠'},
          {id:'communities',label:'Communities',icon:'👥'},
          {id:'utilities',label:'Campus',icon:'🎓'},
          {id:'leaderboard',label:'Top',icon:'🏆'},
        ].map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${tab===t.id?'bg-yellow-400 text-black':'text-zinc-500 hover:text-white'}`}>{t.icon} {t.label}</button>)}
      </div>

      {tab==='communities' && (
        <div className="p-4 max-w-xl mx-auto grid grid-cols-2 gap-3">
          <button onClick={()=>{setTopic('All'); setTab('feed');}} className={`p-4 rounded-[20px] border text-left transition ${topic==='All'?'bg-white text-black border-white':'bg-[#141414] border-zinc-800'}`}><span className="text-xl">🌍</span><p className="font-bold text-sm mt-2">All Topics</p></button>
          {TOPICS.map(tp=><button key={tp.name} onClick={()=>{setTopic(tp.name); setTab('feed');}} className={`p-4 rounded-[20px] border text-left transition hover:scale-[1.02] ${topic===tp.name?'bg-yellow-400 text-black border-yellow-400':'bg-[#141414] border-zinc-800'}`}><div className={`w-8 h-8 ${tp.color} rounded-xl flex items-center justify-center text-sm`}>{tp.icon}</div><p className="font-bold text-sm mt-2">{tp.name}</p></button>)}
        </div>
      )}

      {tab==='utilities' && (
        <div className="p-4 max-w-xl mx-auto grid grid-cols-2 gap-3">
          {[{n:'Notes',i:'📝'},{n:'QPapers',i:'📄'},{n:'Timetable',i:'🕒'},{n:'Bus',i:'🚌'},{n:'Placements',i:'💼'},{n:'Hostel',i:'🏠'}].map(u=><div key={u.n} className="bg-[#141414] border border-zinc-800 p-5 rounded-[20px]"><div className="text-2xl">{u.i}</div><p className="font-bold text-sm mt-3">{u.n}</p><p className="text-[11px] text-zinc-500 mt-1">For {userData.college}</p></div>)}
        </div>
      )}

      {tab==='leaderboard' && (
        <div className="p-4 max-w-xl mx-auto">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[24px] p-6 text-black">
            <h2 className="font-black text-xl">Your Stats 👻</h2>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-black/10 rounded-2xl p-3 text-center"><p className="text-2xl font-black">{userData.karma}</p><p className="text-[10px] font-bold uppercase">Karma</p></div>
              <div className="bg-black/10 rounded-2xl p-3 text-center"><p className="text-2xl font-black">{userData.totalPosts||0}</p><p className="text-[10px] font-bold uppercase">Yaks</p></div>
              <div className="bg-black/10 rounded-2xl p-3 text-center"><p className="text-2xl font-black">🔥{userData.streak||1}</p><p className="text-[10px] font-bold uppercase">Streak</p></div>
            </div>
            <p className="text-xs mt-4 font-bold">Badge: {userData.badges?.join(', ')} • Level: {userData.karma>100?'🔥 Popular':'✨ Rising'}</p>
          </div>
        </div>
      )}

      {tab==='feed' && (
        <div className="p-3 space-y-4 max-w-xl mx-auto">
          <div className="bg-[#141414] border border-zinc-800 rounded-[20px] p-4 flex gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black font-black">?</div>
            <div><p className="text-xs text-yellow-400 font-bold">DAILY QUESTION</p><p className="text-sm font-medium mt-1">What's the most overrated thing in your college?</p></div>
          </div>

          {yaks.map(y=>{
            const isOwner=user.uid===y.uid;
            const topicMeta=TOPICS.find(t=>t.name===y.topic);
            return(
            <div key={y.id} className="bg-[#141414] border border-zinc-800 rounded-[24px] p-5 hover:border-zinc-700 transition group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#1f1f1f] rounded-full flex items-center justify-center text-sm">👻</div>
                  <div>
                    <p className="text-xs font-bold flex items-center gap-1.5">{y.username||'Anonymous'} <span className={`text-[9px] px-2 py-0.5 rounded-full ${topicMeta?.color||'bg-zinc-800'} text-white`}>{y.topic||'General'}</span> {isOwner && <span className="text-[9px] bg-yellow-400 text-black px-2 py-0.5 rounded-full font-black">YOU</span>}</p>
                    <p className="text-[11px] text-zinc-500">{y.college} • {y.createdAt?.toDate? new Date(y.createdAt.toDate()).toLocaleTimeString(): 'now'}</p>
                  </div>
                </div>
                {isOwner && <div className="flex gap-2"><button onClick={()=>{setEditYak(y); setNewYak(y.text); setScreen('create');}} className="text-[11px] bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">Edit</button><button onClick={async()=>{ if(confirm('Delete this yak?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="text-[11px] bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full border border-red-500/20">Delete</button></div>}
              </div>

              <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-wrap">{y.text}</p>

              <div className="flex items-center gap-2 mt-5">
                <div className="flex items-center bg-[#1f1f1f] rounded-full border border-zinc-800 overflow-hidden">
                  <button onClick={async()=>{ await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)}); if(y.uid!==user.uid) await addDoc(collection(db,'notifications'),{toUid:y.uid,text:`${userData.username} liked your yak`,yakId:y.id,read:false,createdAt:serverTimestamp()}); }} className="px-4 py-2.5 text-sm font-bold flex items-center gap-1.5 hover:bg-zinc-800 transition">⬆️ {y.likes||0}</button>
                  <div className="w-px h-6 bg-zinc-800"></div>
                  <button onClick={()=>updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)})} className="px-4 py-2.5 text-sm font-bold flex items-center gap-1.5 hover:bg-zinc-800 transition text-zinc-500">⬇️ {y.dislikes||0}</button>
                </div>
                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className="bg-[#1f1f1f] border border-zinc-800 px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-1.5 hover:bg-zinc-800 transition">💬 {y.commentsCount||0}</button>
                <button onClick={()=>{ if(navigator.share) navigator.share({title:'YAK',text:y.text}); else { navigator.clipboard.writeText(y.text); alert('Copied link!'); } }} className="ml-auto w-9 h-9 bg-[#1f1f1f] border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 transition">↗️</button>
              </div>

              {activePost===y.id && (
                <div className="mt-5 pt-5 border-t border-zinc-800">
                  <p className="text-xs font-bold text-zinc-400 mb-3">{comments.length} Comments</p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {comments.map(c=><div key={c.id} className="flex gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px]">👻</div><div className="bg-[#1f1f1f] rounded-2xl rounded-tl-none px-3 py-2 flex-1"><p className="text-xs font-bold">{c.username}</p><p className="text-[13px] mt-0.5">{c.text}</p></div>{user.uid===c.uid && <button onClick={async()=>{ await deleteDoc(doc(db,`yaks/${y.id}/comments/${c.id}`)); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(-1)}); }} className="text-[10px] text-zinc-600">✕</button>}</div>)}
                  </div>
                  <div className="flex gap-2 mt-4"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add anonymous comment..." className="flex-1 bg-[#1f1f1f] border border-zinc-800 rounded-full px-4 py-3 text-sm outline-none focus:border-yellow-400/50"/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,`yaks/${y.id}/comments`),{text:commentText,uid:user.uid,username:userData.username,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); if(y.uid!==user.uid) await addDoc(collection(db,'notifications'),{toUid:y.uid,text:`${userData.username} commented`,yakId:y.id,read:false,createdAt:serverTimestamp()}); setCommentText(''); }} className="bg-yellow-400 text-black w-11 h-11 rounded-full font-bold flex items-center justify-center">↑</button></div>
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      <button onClick={()=>setScreen('create')} className="fixed bottom-6 right-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-black w-14 h-14 rounded-full text-2xl font-black shadow-2xl shadow-yellow-400/20 flex items-center justify-center hover:scale-110 transition">+</button>

      {screen==='create' && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-30 p-4 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between items-center"><h2 className="font-black text-xl">{editYak?'Edit Yak':'New Yak'} <span className="text-zinc-500 text-sm font-normal">• Text Only</span></h2><button onClick={()=>{setScreen('feed'); setEditYak(null); setNewYak('');}} className="w-9 h-9 bg-[#1a1a1a] border border-zinc-800 rounded-full">✕</button></div>
            <div className="flex gap-2 mt-6 overflow-x-auto">{TOPICS.map(t=><button key={t.name} onClick={()=>setTopic(t.name)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition ${topic===t.name?'bg-yellow-400 text-black border-yellow-400':'bg-[#1a1a1a] border-zinc-800 text-zinc-400'}`}>{t.icon} {t.name}</button>)}</div>
            <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="What's happening on campus? Be anonymous... (Only text)" className="w-full h-48 mt-6 p-5 bg-[#141414] border border-zinc-800 rounded-[20px] outline-none focus:border-yellow-400/50 text-[18px] resize-none" maxLength={500}/>
            <p className="text-right text-xs text-zinc-600 mt-2">{newYak.length}/500 - Text only posts</p>
            <button onClick={handlePost} disabled={!newYak.trim()} className="w-full mt-8 bg-white text-black p-4 rounded-full font-black text-lg hover:scale-[1.02] transition disabled:opacity-30">{editYak?'Update Yak':'Post Anonymously 🚀'}</button>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-end sm:items-center justify-center">
          <div className="bg-[#141414] border border-zinc-800 w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6">
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="flex justify-between"><div className="flex gap-3"><div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center font-black text-black text-xl">👻</div><div><h2 className="font-black">{userData.username}</h2><p className="text-xs text-zinc-500">{userData.college} • Anonymous Mode ON</p></div></div><button onClick={()=>setShowProfile(false)} className="w-8 h-8 bg-[#1f1f1f] rounded-full">✕</button></div>
            <div className="grid grid-cols-3 gap-3 mt-6"><div className="bg-[#1f1f1f] border border-zinc-800 p-4 rounded-2xl text-center"><p className="text-xl font-black">{userData.karma}</p><p className="text-[10px] text-zinc-500 uppercase font-bold">Karma</p></div><div className="bg-[#1f1f1f] border border-zinc-800 p-4 rounded-2xl text-center"><p className="text-xl font-black">{userData.totalPosts||0}</p><p className="text-[10px] text-zinc-500 uppercase font-bold">Yaks</p></div><div className="bg-[#1f1f1f] border border-zinc-800 p-4 rounded-2xl text-center"><p className="text-xl font-black">🔥{userData.streak||1}</p><p className="text-[10px] text-zinc-500 uppercase font-bold">Streak</p></div></div>
            <button onClick={()=>{auth.signOut(); window.location.reload();}} className="w-full mt-6 bg-[#1f1f1f] border border-zinc-800 p-3 rounded-full text-sm font-bold">Logout</button>
          </div>
        </div>
      )}

      {showNotifs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-start justify-center pt-20 p-4">
          <div className="bg-[#141414] border border-zinc-800 w-full max-w-sm rounded-[24px] p-5">
            <div className="flex justify-between"><h2 className="font-black">🔔 Notifications</h2><button onClick={()=>setShowNotifs(false)} className="w-8 h-8 bg-[#1f1f1f] rounded-full">✕</button></div>
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">{notifs.length===0?<p className="text-xs text-zinc-500 text-center py-10">No notifications yet<br/>When someone likes your yak you'll see it here</p>:notifs.map(n=><div key={n.id} className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-2xl text-xs flex justify-between"><span>{n.text}</span><button onClick={async()=>await updateDoc(doc(db,'notifications',n.id),{read:true})} className="text-yellow-400">✓</button></div>)}</div>
          </div>
        </div>
      )}
    </div>
  );
                    }
