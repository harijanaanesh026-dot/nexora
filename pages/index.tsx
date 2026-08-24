import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs } from 'firebase/firestore';

// ✅ YOUR FIREBASE CONFIG + measurementId
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
if (typeof window!== 'undefined') { try { getAnalytics(app); } catch(e){} }
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 🇮🇳 INDIAN COLLEGES & TOPICS
const COLLEGES = ["JNTU Anantapur", "RGUKT", "SVU", "JNTUH", "VTU", "SRM", "VIT", "Other"];
const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "AIML", "DS", "IT"];
const INDIAN_TOPICS = [
  { id: "#Placements", icon: "💼", name: "Placements" },
  { id: "#QPapers", icon: "📄", name: "Q-Papers" },
  { id: "#Notes", icon: "📚", name: "Notes" },
  { id: "#Hostel", icon: "🏠", name: "Hostel" },
  { id: "#Canteen", icon: "🍔", name: "Canteen" },
  { id: "#Bus", icon: "🚌", name: "Bus" },
  { id: "#Memes", icon: "😂", name: "Memes" },
  { id: "#Fests", icon: "🎉", name: "Fests" },
  { id: "#LostFound", icon: "🔍", name: "Lost & Found" },
  { id: "#BuySell", icon: "🛒", name: "Buy & Sell" },
  { id: "#AskSeniors", icon: "🎓", name: "Ask Seniors" },
];

export default function YakIndia(){
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [screen, setScreen] = useState(2);
  const [yaks, setYaks] = useState<any[]>([]);
  const [feed, setFeed] = useState('college');
  const [topic, setTopic] = useState('All');
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [showComments, setShowComments] = useState<string|null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [blocked, setBlocked] = useState<string[]>([]);

  const [newYak, setNewYak] = useState('');
  const [postTopic, setPostTopic] = useState('#Memes');
  const [postType, setPostType] = useState('normal');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState(['','']);

  useEffect(()=>{
    const t = localStorage.getItem('yak_theme');
    if(t) setDarkMode(t==='dark');
    onAuthStateChanged(auth, async (u)=>{
      if(u){
        setUser(u);
        const snap = await getDocs(query(collection(db,'users'), where('uid','==',u.uid)));
        if(snap.docs.length>0){ setUserData({id:snap.docs[0].id,...snap.docs[0].data()}); setScreen(3); }
        else setScreen(1);
      } else setScreen(2);
    })
  },[]);

  const toggleTheme = ()=>{ const n=!darkMode; setDarkMode(n); localStorage.setItem('yak_theme', n?'dark':'light'); }

  useEffect(()=>{
    if(!userData) return;
    const q = query(collection(db,'yaks'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, (s)=>{
      let data = s.docs.map(d=>({id:d.id,...d.data()} as any)).filter(y=>!blocked.includes(y.uid));
      if(feed==='college') data = data.filter(y=>!y.college || y.college===userData.college);
      if(feed==='branch') data = data.filter(y=>!y.branch || y.branch===userData.branch);
      if(feed==='hostel') data = data.filter(y=>!y.hostel || y.hostel===userData.hostel);
      if(feed==='trending') data = [...data].sort((a,b)=>(b.likes-b.dislikes)-(a.likes-a.dislikes));
      if(topic!=='All') data = data.filter(y=>y.topic===topic || y.postType===topic.replace('#','').toLowerCase());
      if(search) data = data.filter(y=>y.text.toLowerCase().includes(search.toLowerCase()));
      setYaks(data);
    });
    return ()=>unsub();
  },[feed, topic, search, userData, blocked]);

  useEffect(()=>{
    if(!showComments) return;
    const q = query(collection(db,`yaks/${showComments}/comments`), orderBy('createdAt','asc'));
    return onSnapshot(q, s=> setComments(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[showComments]);

  useEffect(()=>{
    if(!user) return;
    const q = query(collection(db,'notifications'), where('toUid','==',user.uid), orderBy('createdAt','desc'));
    return onSnapshot(q, s=> setNotifications(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[user]);

  const handleImages = (e:any)=>{
    const files = Array.from(e.target.files).slice(0,4) as File[];
    files.forEach(f=>{ const r=new FileReader(); r.onloadend=()=>setImages(p=>[...p, r.result as string].slice(0,4)); r.readAsDataURL(f); })
  }

  const createUser = async()=>{
    const college=(document.getElementById('college') as any).value;
    const branch=(document.getElementById('branch') as any).value;
    const year=(document.getElementById('year') as any).value;
    const username=`Yak_${Math.floor(Math.random()*9000)+1000}`;
    await addDoc(collection(db,'users'),{uid:user.uid, username, college, branch, year, hostel: 'BH-1', karma: 50, totalPosts:0, createdAt:serverTimestamp()});
    window.location.reload();
  }

  const postYak = async()=>{
    if(!newYak.trim() && images.length===0) return;
    const poll = pollQ? {question: pollQ, options: pollOpts.map(t=>({text:t, votes:0}))} : null;
    await addDoc(collection(db,'yaks'),{
      text:newYak, uid:user.uid, username:userData.username, college:userData.college, branch:userData.branch, hostel:userData.hostel,
      topic: postTopic, postType, price: postType==='buysell'? price : '', tags:[postTopic], imageUrls: images, poll,
      likes:0, dislikes:0, loves:0, commentsCount:0, lat:15.63, lng:77.27, createdAt: serverTimestamp()
    });
    await updateDoc(doc(db,'users',userData.id),{totalPosts: increment(1), karma: increment(10)});
    setNewYak(''); setImages([]); setPollQ(''); setPrice(''); setScreen(3);
  }

  const vote = async(y:any, type:'likes'|'dislikes'|'loves')=>{ await updateDoc(doc(db,'yaks',y.id),{[type]: increment(1)}); }
  const addComment = async(y:any)=>{ if(!commentText.trim()) return; await addDoc(collection(db,`yaks/${y.id}/comments`),{text:commentText, uid:user.uid, username:userData.username, likes:0, createdAt: serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount: increment(1)}); setCommentText(''); }

  const th = darkMode? {bg:'bg-black', card:'bg-[#161616]', header:'bg-black', input:'bg-[#1E1E1E]', text:'text-white', sub:'text-zinc-400', border:'border-zinc-800'} : {bg:'bg-[#F7F7F7]', card:'bg-white', header:'bg-white', input:'bg-gray-100', text:'text-black', sub:'text-gray-500', border:'border-gray-200'};

  if(screen===1) return (
    <div className={`min-h-screen ${th.bg} ${th.text} p-6`}>
      <h1 className="text-3xl font-black text-yellow-400">🎓 College Verification</h1><p className={`${th.sub} text-sm mt-1 mb-6`}>India lo fake accounts rakunda verification must bro</p>
      <label className="text-xs">College</label><select id="college" className={`w-full p-3 ${th.input} rounded-xl mb-3 mt-1`}>{COLLEGES.map(c=><option>{c}</option>)}</select>
      <label className="text-xs">Branch</label><select id="branch" className={`w-full p-3 ${th.input} rounded-xl mb-3 mt-1`}>{BRANCHES.map(b=><option>{b}</option>)}</select>
      <label className="text-xs">Year</label><select id="year" className={`w-full p-3 ${th.input} rounded-xl mb-6 mt-1`}><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select>
      <button onClick={createUser} className="w-full bg-[#FFD60A] text-black p-4 rounded-full font-bold text-[15px]">Verify & Enter YAK 🇮🇳</button>
    </div>
  )
  if(screen===2) return <div className={`min-h-screen ${th.bg} ${th.text} flex flex-col items-center justify-center`}><h1 className="text-6xl font-black text-[#FFD60A] tracking-tighter">YAK</h1><p className="text-sm mt-2">INDIA • Anonymous Campus</p><p className={`${th.sub} text-xs mt-1`}>JNTU • RGUKT • SVU</p><button onClick={()=>signInWithPopup(auth,provider)} className="mt-10 bg-[#FFD60A] text-black px-10 py-3.5 rounded-full font-bold">Google Login</button><button onClick={toggleTheme} className="mt-6 text-xs opacity-50">{darkMode?'☀️ Light Mode':'🌙 Dark Mode'}</button></div>

  return (
    <div className={`min-h-screen ${th.bg} ${th.text} pb-24`}>
      <div className={`sticky top-0 ${th.header} z-10 border-b ${th.border} backdrop-blur-xl`}>
        <div className="flex justify-between items-center p-3">
          <h1 className="font-black text-[#FFD60A] text-2xl">YAK 🇮🇳</h1>
          <div className="flex gap-2 items-center">
            <button onClick={toggleTheme} className={`${th.input} w-8 h-8 rounded-full`}>{darkMode?'☀️':'🌙'}</button>
            <button onClick={()=>setShowProfile(true)} className={`${th.input} px-3 py-1 rounded-full text-xs`}>👤 {userData?.username} • {userData?.karma}</button>
            <span>🔔{notifications.length>0 && <sup className="bg-red-500 text-white text-[10px] px-1 rounded-full">{notifications.length}</sup>}</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 pb-3">
          <button onClick={()=>setFeed('college')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${feed==='college'?'bg-[#FFD60A] text-black':'bg-zinc-800 text-white'}`}>🏫 My College</button>
          <button onClick={()=>setFeed('branch')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${feed==='branch'?'bg-[#FFD60A] text-black':'bg-zinc-800 text-white'}`}>🎓 {userData?.branch}</button>
          <button onClick={()=>setFeed('hostel')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${feed==='hostel'?'bg-[#FFD60A] text-black':'bg-zinc-800 text-white'}`}>🏠 Hostel</button>
          <button onClick={()=>setFeed('nearby')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${feed==='nearby'?'bg-[#FFD60A] text-black':'bg-zinc-800 text-white'}`}>📍 Nearby</button>
          <button onClick={()=>setFeed('trending')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${feed==='trending'?'bg-[#FFD60A] text-black':'bg-zinc-800 text-white'}`}>🔥 Trending</button>
        </div>
        <div className="px-3 pb-3"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search #Placements, #QPapers, #Notes..." className={`w-full ${th.input} rounded-full px-4 py-2.5 text-sm outline-none`}/></div>
      </div>

      <div className={`flex gap-2 p-2.5 overflow-x-auto border-b ${th.border} sticky top-[128px] ${th.header} z-10`}>
        <button onClick={()=>setTopic('All')} className={`px-3.5 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${topic==='All'?'bg-yellow-400 text-black border-yellow-400':'border-zinc-700'}`}>All</button>
        {INDIAN_TOPICS.map(t=><button key={t.id} onClick={()=>setTopic(t.id)} className={`px-3.5 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${topic===t.id?'bg-yellow-400 text-black border-yellow-400':`border-zinc-700 ${th.sub}`}`}>{t.icon} {t.name}</button>)}
      </div>

      <div className="p-3 space-y-3">
        {yaks.length===0 && <p className={`text-center mt-20 ${th.sub}`}>No Yaks yet! Be first to post 👻<br/><span className="text-xs">#Placements gurinchi adugu bro</span></p>}
        {yaks.map(y=>(
          <div key={y.id} className={`${th.card} rounded-[18px] p-4 border ${th.border}`}>
            <div className="flex justify-between text-[11px] mb-2"><span className={`${th.sub} font-medium`}>👻 {y.username} • {y.branch} • {y.topic}</span><span className={`${th.sub}`}>{y.postType==='buysell' && y.price? `₹${y.price} • `:''}{y.college}</span></div>
            <p className="text-[15px] leading-6 mb-2 whitespace-pre-wrap">{y.text}</p>
            {y.poll && <div className={`${th.input} rounded-xl p-3 mb-2`}><p className="text-sm font-bold mb-2">📊 {y.poll.question}</p>{y.poll.options.map((o:any,i:number)=><div key={i} className="flex justify-between p-2 bg-black/20 rounded-lg mb-1 text-xs"><span>{o.text}</span><span>{o.votes} votes</span></div>)}</div>}
            {y.imageUrls?.length>0 && <div className={`grid ${y.imageUrls.length>1?'grid-cols-2':''} gap-2 mb-3`}>{y.imageUrls.map((img:string,i:number)=><img key={i} src={img} className="rounded-xl max-h-80 object-cover w-full"/>)}</div>}
            <div className="flex gap-2 items-center mt-2">
              <div className={`flex items-center ${th.input} rounded-full`}>
                <button onClick={()=>vote(y,'likes')} className="px-3 py-1.5 text-sm">⬆️ {y.likes}</button>
                <button onClick={()=>vote(y,'dislikes')} className="px-3 py-1.5 text-sm">⬇️</button>
              </div>
              <button onClick={()=>vote(y,'loves')} className={`${th.input} px-3 py-1.5 rounded-full text-sm`}>❤️ {y.loves}</button>
              <button onClick={()=>setShowComments(showComments===y.id?null:y.id)} className={`${th.input} px-3 py-1.5 rounded-full text-sm`}>💬 {y.commentsCount}</button>
              <span className="ml-auto text-xs opacity-40">🚩</span>
            </div>
            {showComments===y.id && (
              <div className="mt-3 pt-3 border-t border-zinc-800">
                {comments.map(c=><p key={c.id} className="text-xs mb-2"><span className={th.sub}>{c.username}:</span> {c.text}</p>)}
                <div className="flex gap-2 mt-2"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Anonymous comment..." className={`flex-1 ${th.input} rounded-full px-3 py-2 text-xs`}/><button onClick={()=>addComment(y)} className="bg-yellow-400 text-black px-4 rounded-full text-xs font-bold">Post</button></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={()=>setScreen(4)} className="fixed bottom-6 right-6 bg-[#FFD60A] text-black w-14 h-14 rounded-full text-2xl font-bold shadow-[0_8px_24px_rgba(255,214,10,0.4)]">+</button>

      {screen===4 && (
        <div className={`fixed inset-0 ${th.bg} z-20 p-4 overflow-auto`}>
          <h2 className="font-bold text-lg mb-1">👻 New Yak - India Edition</h2><p className={`${th.sub} text-xs mb-4`}>100% Anonymous • {userData?.college}</p>

          <label className="text-xs">Post Type 🇮🇳</label>
          <select value={postType} onChange={e=>setPostType(e.target.value)} className={`w-full p-3 ${th.input} rounded-xl mb-3 mt-1`}>
            <option value="normal">Normal Yak</option>
            <option value="placement">💼 Placement Discussion</option>
            <option value="qpapers">📄 Q-Paper Request</option>
            <option value="notes">📚 Notes Share</option>
            <option value="lostfound">🔍 Lost & Found</option>
            <option value="buysell">🛒 Buy & Sell</option>
            <option value="askseniors">🎓 Ask Seniors (Anonymous)</option>
            <option value="hostel">🏠 Hostel Talk</option>
            <option value="canteen">🍔 Canteen Review</option>
          </select>

          {postType==='buysell' && <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price ₹ (Ex: 500)" className={`w-full p-3 ${th.input} rounded-xl mb-3`}/>}

          <label className="text-xs">Topic</label>
          <select value={postTopic} onChange={e=>setPostTopic(e.target.value)} className={`w-full p-3 ${th.input} rounded-xl mb-3 mt-1`}>{INDIAN_TOPICS.map(t=><option value={t.id}>{t.icon} {t.name}</option>)}</select>

          <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder={
            postType==='placement'? 'TCS package entha? Infosys lo interview ela undi?' :
            postType==='qpapers'? 'CSE 3rd sem DBMS previous papers evadaina pettandi bro...' :
            postType==='notes'? 'Unit 3 notes share chestunna, kavali ante comment cheyandi...' :
            postType==='lostfound'? 'Naa ID card canteen lo poyindi, evarikaina dorikinda?' :
            postType==='buysell'? 'Drafter for sale, 1 year used, good condition...' :
            'Em jarugutundi campus lo? Anonymous ga cheppu...'
          } className={`w-full h-28 p-3 ${th.input} rounded-xl mb-3 text-[15px]`}/>

          <label className={`w-full border border-dashed border-yellow-400 p-3 rounded-xl flex justify-center mb-2 text-sm ${th.input}`}>🖼️ Photos (4 varaku) - Notes, Q-Papers, Lost items <input type="file" multiple hidden accept="image/*" onChange={handleImages}/></label>
          <div className="grid grid-cols-4 gap-1 mb-4">{images.map((img,i)=><img key={i} src={img} className="h-20 object-cover rounded-lg"/> )}</div>

          <div className={`${th.input} p-3 rounded-xl mb-4`}>
            <p className="text-xs mb-2">📊 Poll (Optional)</p>
            <input value={pollQ} onChange={e=>setPollQ(e.target.value)} placeholder="Poll question: Hostel mess food ela undi?" className={`w-full p-2 ${darkMode?'bg-black':'bg-white'} rounded mb-2 text-xs`}/>
            <div className="flex gap-2"><input value={pollOpts[0]} onChange={e=>setPollOpts([e.target.value,pollOpts[1]])} placeholder="Option 1" className={`flex-1 p-2 ${darkMode?'bg-black':'bg-white'} rounded text-xs`}/><input value={pollOpts[1]} onChange={e=>setPollOpts([pollOpts[0],e.target.value])} placeholder="Option 2" className={`flex-1 p-2 ${darkMode?'bg-black':'bg-white'} rounded text-xs`}/></div>
          </div>

          <button onClick={postYak} className="w-full bg-[#FFD60A] text-black p-4 rounded-full font-bold">Yak Anonymously 🚀🇮🇳</button>
          <button onClick={()=>setScreen(3)} className={`w-full p-3 ${th.sub} text-sm mt-2`}>Cancel</button>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 z-30 p-6 flex items-end"><div className={`${th.card} w-full rounded-t-[24px] p-6`}><div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-4"></div><h2 className="font-bold text-xl">👻 {userData?.username}</h2><p className={`${th.sub} text-sm`}>{userData?.college} • {userData?.branch} • {userData?.year}</p><div className="grid grid-cols-3 gap-3 mt-6 text-center"><div className={`${th.input} p-4 rounded-2xl`}><p className="font-black text-xl text-yellow-400">{userData?.karma}</p><p className="text-[10px]">CAMPUS SCORE</p></div><div className={`${th.input} p-4 rounded-2xl`}><p className="font-black text-xl">{userData?.totalPosts}</p><p className="text-[10px]">YAKS</p></div><div className={`${th.input} p-4 rounded-2xl`}><p className="font-black text-xl">{yaks.filter(y=>y.uid===user.uid).length}</p><p className="text-[10px]">MY POSTS</p></div></div><button onClick={()=>setShowProfile(false)} className="w-full mt-6 bg-[#FFD60A] text-black p-3 rounded-full font-bold">Close</button></div></div>
      )}
    </div>
  )
          }
