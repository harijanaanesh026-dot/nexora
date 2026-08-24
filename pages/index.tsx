import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs } from 'firebase/firestore';

// YOUR CONFIG WITH measurementId ADDED ✅
const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058",
  measurementId: "G-11Y8XF8MBC"
};

const app = initializeApp(firebaseConfig);
// Analytics only in browser
if (typeof window!== 'undefined') {
  try { getAnalytics(app); } catch(e){}
}
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const COLLEGES = ["BITS ADONI", "RGUKT", "SVU", "JNTUH", "VTU", "Other"];
const TOPICS = ["#Studies", "#Placements", "#Memes", "#Fests", "#Hostel", "#Canteen", "#Help", "#LostFound", "#Events", "#BuySell"];

export default function Home(){
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [screen, setScreen] = useState(2);
  const [yaks, setYaks] = useState<any[]>([]);
  const [feed, setFeed] = useState('college');
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [showComments, setShowComments] = useState<string|null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string|null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(true); // DARK MODE STATE ⭐

  // POST STATES
  const [newYak, setNewYak] = useState('');
  const [topic, setTopic] = useState('#Memes');
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState(['','']);
  const [images, setImages] = useState<string[]>([]);

  useEffect(()=>{
    const savedTheme = localStorage.getItem('yak_theme');
    if(savedTheme) setDarkMode(savedTheme==='dark');
    onAuthStateChanged(auth, async (u)=>{
      if(u){
        setUser(u);
        const snap = await getDocs(query(collection(db,'users'), where('uid','==',u.uid)));
        if(snap.docs.length>0){ setUserData({id: snap.docs[0].id,...snap.docs[0].data()}); setScreen(3); }
        else setScreen(1);
      } else setScreen(2);
    })
  },[]);

  const toggleTheme = ()=>{
    const newMode =!darkMode;
    setDarkMode(newMode);
    localStorage.setItem('yak_theme', newMode?'dark':'light');
  }

  // FEED FETCH
  useEffect(()=>{
    if(!userData) return;
    const q = query(collection(db,'yaks'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, (s)=>{
      let data = s.docs.map(d=>({id:d.id,...d.data()} as any)).filter(y=>!blockedUsers.includes(y.uid));
      if(feed==='college') data = data.filter(y=>!y.college || y.college===userData.college);
      if(feed==='nearby') data = data.filter(y=>!y.lat || getDist(15.63,77.27,y.lat,y.lng)<=10);
      if(feed==='trending') data = [...data].sort((a,b)=>(b.likes-b.dislikes)-(a.likes-a.dislikes));
      if(selectedTopic!=='All') data = data.filter(y=> y.topic===selectedTopic || y.tags?.includes(selectedTopic));
      if(search) data = data.filter(y=> y.text.toLowerCase().includes(search.toLowerCase()));
      setYaks(data);
    });
    return ()=>unsub();
  },[feed, userData, selectedTopic, search, blockedUsers]);

  useEffect(()=>{
    if(!user) return;
    const q = query(collection(db,'notifications'), where('toUid','==',user.uid), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, s=> setNotifications(s.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>unsub();
  },[user]);

  useEffect(()=>{
    if(!showComments) return;
    const q = query(collection(db,`yaks/${showComments}/comments`), orderBy('createdAt','asc'));
    const unsub = onSnapshot(q, s=> setComments(s.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>unsub();
  },[showComments]);

  const getDist = (lat1:number,lon1:number,lat2:number,lon2:number)=>{ const R=6371; const dLat=(lat2-lat1)*Math.PI/180; const dLon=(lon2-lon1)*Math.PI/180; const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2; return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); }

  const handleImages = (e:any)=>{
    const files = Array.from(e.target.files).slice(0,3) as File[];
    files.forEach(f=>{
      const r=new FileReader(); r.onloadend=()=>setImages(p=>[...p, r.result as string].slice(0,3)); r.readAsDataURL(f);
    })
  }

  const createUser = async()=>{
    const c=(document.getElementById('college') as any).value;
    const username=`Yak_${Math.floor(Math.random()*9000)+1000}`;
    await addDoc(collection(db,'users'),{uid:user.uid, username, college:c, karma:10, totalPosts:0, createdAt:serverTimestamp()});
    window.location.reload();
  }

  const postYak = async()=>{
    if(!newYak.trim() && images.length===0 &&!pollQ) return;
    const poll = pollQ? {question: pollQ, options: pollOpts.map(o=>({text:o, votes:0}))} : null;
    await addDoc(collection(db,'yaks'),{ text:newYak, uid:user.uid, username:userData.username, college:userData.college, topic, tags:[topic], imageUrls:images, poll, likes:0, dislikes:0, commentsCount:0, lat:15.6327, lng:77.2768, createdAt:serverTimestamp() });
    await updateDoc(doc(db,'users',userData.id),{totalPosts: increment(1), karma: increment(5)});
    setNewYak(''); setImages([]); setPollQ(''); setPollOpts(['','']); setScreen(3);
  }

  const vote = async (yak:any, type:'likes'|'dislikes', isComment=false, commentId?:string)=>{
    const path = isComment? `yaks/${yak.id}/comments/${commentId}` : `yaks/${yak.id}`;
    await updateDoc(doc(db,path),{[type]: increment(1)});
    if(!isComment && yak.uid!==user.uid){
      await addDoc(collection(db,'notifications'),{toUid: yak.uid, from: userData.username, text:`${type==='likes'?'Upvoted':'Downvoted'} your yak`, createdAt: serverTimestamp(), read:false});
    }
  }

  const addComment = async (yak:any)=>{
    if(!commentText.trim()) return;
    await addDoc(collection(db,`yaks/${yak.id}/comments`),{ text: commentText, uid:user.uid, username:userData.username, parentId: replyTo || null, likes:0, dislikes:0, createdAt: serverTimestamp() });
    await updateDoc(doc(db,'yaks',yak.id),{commentsCount: increment(1)});
    setCommentText(''); setReplyTo(null);
  }

  // THEME COLORS ⭐
  const theme = darkMode? { bg: 'bg-black', card: 'bg-zinc-900', header: 'bg-zinc-950', text: 'text-white', subtext: 'text-gray-400', input: 'bg-zinc-900', border: 'border-zinc-800' } : { bg: 'bg-[#F5F5F5]', card: 'bg-white', header: 'bg-white', text: 'text-black', subtext: 'text-gray-500', input: 'bg-gray-100', border: 'border-gray-200' };

  if(screen===1) return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}><h1 className="text-2xl font-bold text-yellow-500 mb-4">🎓 College Verification</h1><select id="college" className={`w-full p-3 ${theme.input} rounded-xl mb-4`}><option>JNTU Anantapur</option><option>RGUKT</option><option>Other</option></select><button onClick={createUser} className="w-full bg-yellow-400 text-black p-3 rounded-full font-bold">Verify & Enter</button><button onClick={toggleTheme} className="mt-4 w-full p-2 text-sm">Toggle {darkMode?'Light ☀️':'Dark 🌙'}</button></div>
  )
  if(screen===2) return <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center justify-center`}><h1 className="text-5xl font-black text-yellow-400">YAK</h1><p className={`${theme.subtext} mt-2`}>Anonymous Campus</p><button onClick={()=>signInWithPopup(auth,provider)} className="mt-8 bg-yellow-400 text-black px-8 py-3 rounded-full font-bold">Google Login</button><button onClick={toggleTheme} className={`mt-6 ${theme.subtext} text-sm`}>{darkMode?'Switch to Light ☀️':'Switch to Dark 🌙'}</button></div>

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} pb-20 transition-colors`}>
      {/* HEADER */}
      <div className={`sticky top-0 ${theme.header} p-3 z-10 border-b ${theme.border}`}>
        <div className="flex justify-between items-center mb-3">
          <h1 className="font-black text-yellow-400 text-xl">YAK</h1>
          <div className="flex gap-2 items-center">
            <button onClick={toggleTheme} className={`${theme.input} w-8 h-8 rounded-full flex items-center justify-center`}>{darkMode?'☀️':'🌙'}</button>
            <button onClick={()=>setShowProfile(true)} className={`text-xs ${theme.input} px-3 py-1 rounded-full`}>👤 {userData?.username} • {userData?.karma}</button>
            <span className="relative">🔔{notifications.length>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-white">{notifications.length}</span>}</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto mb-2">
          <button onClick={()=>setFeed('college')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${feed==='college'?'bg-yellow-400 text-black':'bg-zinc-800 text-white'}`}>🏫 My College</button>
          <button onClick={()=>setFeed('nearby')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${feed==='nearby'?'bg-yellow-400 text-black':'bg-zinc-800 text-white'}`}>📍 Nearby</button>
          <button onClick={()=>setFeed('trending')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${feed==='trending'?'bg-yellow-400 text-black':'bg-zinc-800 text-white'}`}>🔥 Trending</button>
          <button onClick={()=>setFeed('latest')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${feed==='latest'?'bg-yellow-400 text-black':'bg-zinc-800 text-white'}`}>🕒 Latest</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search posts, topics..." className={`w-full ${theme.input} rounded-full px-4 py-2 text-sm ${theme.text}`}/>
      </div>

      <div className={`flex gap-2 p-2 overflow-x-auto ${darkMode?'bg-zinc-900':'bg-gray-100'} border-b ${theme.border}`}>
        <button onClick={()=>setSelectedTopic('All')} className={`px-3 py-1 rounded-full text-xs border whitespace-nowrap ${selectedTopic==='All'?'bg-yellow-400 text-black':'border-zinc-700'}`}>All</button>
        {TOPICS.map(t=><button key={t} onClick={()=>setSelectedTopic(t)} className={`px-3 py-1 rounded-full text-xs border whitespace-nowrap ${selectedTopic===t?'bg-yellow-400 text-black':'border-zinc-700'}`}>{t}</button>)}
      </div>

      <div className="p-2">
        {yaks.map(y=>(
          <div key={y.id} className={`${theme.card} rounded-2xl p-4 mb-3 shadow-sm border ${theme.border}`}>
            <div className={`flex justify-between text-[11px] ${theme.subtext} mb-1`}><span>👻 {y.username} • {y.college} • {y.topic}</span></div>
            <p className="text-[15px] mb-2">{y.text}</p>
            {y.imageUrls?.length>0 && <div className={`grid ${y.imageUrls.length>1?'grid-cols-2':''} gap-1 mb-3`}>{y.imageUrls.map((img:string,i:number)=><img key={i} src={img} className="rounded-xl w-full max-h-72 object-cover"/> )}</div>}
            <div className="flex gap-5 text-sm items-center">
              <button onClick={()=>vote(y,'likes')}>⬆️ {y.likes}</button>
              <button onClick={()=>vote(y,'dislikes')}>⬇️ {y.dislikes}</button>
              <button onClick={()=>setShowComments(showComments===y.id?null:y.id)}>💬 {y.commentsCount}</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={()=>setScreen(4)} className="fixed bottom-6 right-6 bg-yellow-400 text-black w-14 h-14 rounded-full text-2xl font-bold shadow-xl">+</button>

      {screen===4 && (
        <div className={`fixed inset-0 ${theme.bg} z-20 p-4 overflow-auto`}>
          <h2 className="font-bold mb-3">👻 New Anonymous Post</h2>
          <select value={topic} onChange={e=>setTopic(e.target.value)} className={`w-full p-3 ${theme.input} rounded-xl mb-2`}>{TOPICS.map(t=><option>{t}</option>)}</select>
          <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="What's happening in campus?" className={`w-full h-28 p-3 ${theme.input} rounded-xl mb-2 ${theme.text}`}/>
          <label className="w-full border border-dashed border-yellow-400 p-3 rounded-xl flex justify-center mb-2 text-sm">🖼️ Add Images (max 3) <input type="file" multiple hidden accept="image/*" onChange={handleImages}/></label>
          <div className="grid grid-cols-3 gap-1 mb-3">{images.map((img,i)=><img key={i} src={img} className="h-20 object-cover rounded"/> )}</div>
          <button onClick={postYak} className="w-full bg-yellow-400 text-black p-3 rounded-full font-bold">Yak Anonymously 🚀</button>
          <button onClick={()=>setScreen(3)} className={`w-full p-3 ${theme.subtext} text-sm`}>Cancel</button>
        </div>
      )}
    </div>
  )
    }
