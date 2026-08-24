import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
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

const COLLEGES = ["JNTU Anantapur","RGUKT","SVU","JNTUH","VTU","Other"];
const TOPICS = ["Academics","Confessions","Crushes","Hostel","Placements","Internships","Events","Clubs","Sports","Memes","Canteen","Lost & Found","Buy & Sell","Study Groups","QPapers","Notes"];

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
  const [images,setImages]=useState<string[]>([]);
  const [poll,setPoll]=useState({q1:'',q2:''});
  const [drafts,setDrafts]=useState<any[]>([]);
  const [activePost,setActivePost]=useState<string|null>(null);
  const [comments,setComments]=useState<any[]>([]);
  const [commentText,setCommentText]=useState('');
  const [notifs,setNotifs]=useState<any[]>([]);
  const [showNotifs,setShowNotifs]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [editYak,setEditYak]=useState<any>(null);
  const [keywordFilter,setKeywordFilter]=useState('');

  useEffect(()=>{
    onAuthStateChanged(auth, async(u)=>{
      if(u){
        setUser(u);
        const snap=await getDocs(query(collection(db,'users'),where('uid','==',u.uid)));
        if(snap.empty){ setScreen('verify'); }
        else{
          const d={id:snap.docs[0].id,...snap.docs[0].data() as any};
          setUserData(d); setScreen('feed');
          if(d.lastLogin){
            const last = d.lastLogin.toDate?d.lastLogin.toDate():new Date(0);
            if(new Date().getDate()!==last.getDate()){
              await updateDoc(doc(db,'users',d.id),{streak:increment(1),lastLogin:serverTimestamp(),karma:increment(5)});
            }
          }
          const dr=localStorage.getItem('yak_drafts');
          if(dr) setDrafts(JSON.parse(dr));
        }
      } else setScreen('login');
    });
  },[]);

  useEffect(()=>{
    if(!userData) return;
    const q=query(collection(db,'yaks'),orderBy('createdAt','desc'));
    return onSnapshot(q,s=>{
      let data=s.docs.map(d=>({id:d.id,...d.data()} as any));
      if(userData.blockedUsers?.length) data=data.filter(y=>!userData.blockedUsers.includes(y.uid));
      if(feed==='college') data=data.filter(y=>!y.college || y.college===userData.college);
      if(feed==='trending') data=[...data].sort((a,b)=>(b.likes-b.dislikes)-(a.likes-a.dislikes));
      if(feed==='following') data=data.filter(y=>userData.following?.includes(y.uid));
      if(topic!=='All') data=data.filter(y=>y.topic===topic);
      if(search) data=data.filter(y=> y.text?.toLowerCase().includes(search.toLowerCase()) || y.topic?.toLowerCase().includes(search.toLowerCase()));
      if(keywordFilter) data=data.filter(y=>!y.text?.toLowerCase().includes(keywordFilter.toLowerCase()));
      setYaks(data);
    });
  },[userData,feed,topic,search,keywordFilter]);

  useEffect(()=>{
    if(!activePost) return;
    const q=query(collection(db,`yaks/${activePost}/comments`),orderBy('createdAt','asc'));
    return onSnapshot(q,s=>setComments(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[activePost]);

  useEffect(()=>{
    if(!userData) return;
    const q=query(collection(db,'notifications'),where('toUid','==',userData.uid),orderBy('createdAt','desc'));
    return onSnapshot(q,s=>setNotifs(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[userData]);

  const createUser=async()=>{
    const college=(document.getElementById('college') as any).value;
    const username=`Yak_${Math.floor(Math.random()*9000)+1000}`;
    await addDoc(collection(db,'users'),{uid:user.uid,username,college,karma:50,totalPosts:0,streak:1,following:[],blockedUsers:[],blockedKeywords:[],badges:['Newbie'],lastLogin:serverTimestamp(),createdAt:serverTimestamp()});
    window.location.reload();
  };

  const handlePost=async()=>{
    if(!newYak.trim() && images.length===0 &&!poll.q1) return alert('Emanna rayi bro');
    const payload:any={
      text:newYak, uid:user.uid, username:userData.username, college:userData.college,
      topic: topic==='All'?'Memes':topic, likes:0, dislikes:0, commentsCount:0, saves:[], shares:0,
      imageUrls:images, poll: poll.q1?{q1:poll.q1,q2:poll.q2,v1:0,v2:0,voters:[]}:null,
      createdAt:serverTimestamp()
    };
    if(editYak){ await updateDoc(doc(db,'yaks',editYak.id),{text:newYak,imageUrls:images}); setEditYak(null); }
    else { await addDoc(collection(db,'yaks'),payload); await updateDoc(doc(db,'users',userData.id),{totalPosts:increment(1),karma:increment(10)}); }
    setNewYak(''); setImages([]); setPoll({q1:'',q2:''}); setScreen('feed');
  };

  const saveDraft=()=>{
    if(!newYak.trim()) return;
    const nd=[...drafts,{text:newYak,date:Date.now()}];
    setDrafts(nd); localStorage.setItem('yak_drafts',JSON.stringify(nd)); alert('Draft saved');
  };

  const th={bg:'bg-black',card:'bg-[#121212]',input:'bg-[#232323]',text:'text-white',sub:'text-zinc-500',border:'border-zinc-800'};

  if(screen==='login') return <div className={`min-h-screen ${th.bg} ${th.text} flex flex-col items-center justify-center`}><h1 className="text-6xl font-black text-yellow-400">YAK 🇮🇳</h1><button onClick={()=>signInWithPopup(auth,provider)} className="mt-6 bg-yellow-400 text-black px-8 py-3 rounded-full font-bold">Google Login</button></div>;
  if(screen==='verify') return <div className={`min-h-screen ${th.bg} ${th.text} p-6`}><h1 className="text-xl font-bold">🎓 Verify</h1><select id="college" className={`w-full mt-4 p-3 ${th.input} rounded-xl`}>{COLLEGES.map(c=><option key={c}>{c}</option>)}</select><button onClick={createUser} className="w-full mt-6 bg-yellow-400 text-black p-3 rounded-full font-bold">Continue</button></div>;
    return(
    <div className={`min-h-screen ${th.bg} ${th.text} pb-24`}>
      <div className={`sticky top-0 bg-black border-b ${th.border} p-3 z-20`}>
        <div className="flex justify-between items-center">
          <h1 className="font-black text-yellow-400">YAK 🇮🇳</h1>
          <div className="flex gap-2 items-center">
            <button onClick={()=>setShowNotifs(true)} className={`${th.input} w-8 h-8 rounded-full relative`}>🔔{notifs.filter(n=>!n.read).length>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{notifs.filter(n=>!n.read).length}</span>}</button>
            <button onClick={()=>setShowProfile(true)} className={`${th.input} px-3 py-1 rounded-full text-xs`}>👻 {userData?.username} • 🔥{userData?.karma}</button>
          </div>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {['college','nearby','trending','latest','following'].map(f=><button key={f} onClick={()=>setFeed(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize ${feed===f?'bg-yellow-400 text-black':th.input}`}>{f}</button>)}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search Colleges, Posts, #tags" className={`w-full mt-3 ${th.input} rounded-full px-4 py-2 text-sm outline-none`}/>
      </div>

      <div className={`flex border-b ${th.border} text-xs`}>
        {['feed','communities','utilities','leaderboard'].map(t=><button key={t} onClick={()=>setTab(t)} className={`flex-1 py-3 font-bold capitalize ${tab===t?'text-yellow-400 border-b-2 border-yellow-400':th.sub}`}>{t}</button>)}
      </div>

      {tab==='communities' && <div className="p-3 flex flex-wrap gap-2"><button onClick={()=>setTopic('All')} className={`px-3 py-1 rounded-full text-xs border ${topic==='All'?'bg-yellow-400 text-black':''}`}>All</button>{TOPICS.map(tp=><button key={tp} onClick={()=>{setTopic(tp); setTab('feed');}} className={`px-3 py-1 rounded-full text-xs border ${topic===tp?'bg-yellow-400 text-black':''}`}>{tp}</button>)}</div>}
      {tab==='utilities' && <div className="p-3 grid grid-cols-2 gap-3">{['Notes','QPapers','Timetable','Exam Updates','Assignments','Placements','Internships','Bus','Hostel'].map(u=><div key={u} className={`${th.card} p-4 rounded-xl border ${th.border} text-sm font-bold`}>{u}</div>)}</div>}
      {tab==='leaderboard' && <div className="p-3"><div className={`${th.card} p-4 rounded-xl border ${th.border}`}><h2 className="font-bold">🏆 Top - {userData.college}</h2><p className="text-xs text-zinc-500 mt-2">Karma: {userData.karma} • Streak: {userData.streak} days • Badges: {userData.badges?.join(', ')}</p></div></div>}

      {tab==='feed' && (
        <div className="p-3 space-y-3">
          {yaks.map(y=>{
            const isOwner=user.uid===y.uid;
            return(
            <div key={y.id} className={`${th.card} rounded-[16px] p-4 border ${th.border}`}>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-400">👻 {y.username||'Anonymous'} • {y.topic} • {y.college}</span>
                <div className="flex gap-2">{isOwner && <><button onClick={()=>{setEditYak(y); setNewYak(y.text); setImages(y.imageUrls||[]); setScreen('create');}} className="text-[11px] text-yellow-400">✏️ Edit</button><button onClick={async()=>{ if(confirm('Delete?')) await deleteDoc(doc(db,'yaks',y.id)); }} className="text-[11px] text-red-400">🗑️ Delete</button></>}<button onClick={async()=>{ await addDoc(collection(db,'reports'),{yakId:y.id,byUid:user.uid}); alert('Reported'); }} className="text-[11px] text-zinc-500">🚩</button></div>
              </div>
              <p className="mt-2 text-[15px] whitespace-pre-wrap">{y.text}</p>
              {y.imageUrls?.length>0 && <div className="grid grid-cols-2 gap-2 mt-3">{y.imageUrls.map((im:string,i:number)=><img key={i} src={im} className="rounded-xl max-h-60 object-cover w-full"/>)}</div>}
              {y.poll && <div className="mt-3 flex gap-2"><button onClick={async()=>{ if(y.poll.voters?.includes(user.uid)) return alert('Already voted'); await updateDoc(doc(db,'yaks',y.id),{'poll.v1':increment(1),'poll.voters':arrayUnion(user.uid)}); }} className={`${th.input} flex-1 py-2 rounded-full text-xs`}>{y.poll.q1} {y.poll.v1||0}</button><button onClick={async()=>{ if(y.poll.voters?.includes(user.uid)) return alert('Already voted'); await updateDoc(doc(db,'yaks',y.id),{'poll.v2':increment(1),'poll.voters':arrayUnion(user.uid)}); }} className={`${th.input} flex-1 py-2 rounded-full text-xs`}>{y.poll.q2} {y.poll.v2||0}</button></div>}
              <div className="flex gap-2 mt-3 flex-wrap">
                <div className={`flex ${th.input} rounded-full overflow-hidden`}><button onClick={async()=>{ await updateDoc(doc(db,'yaks',y.id),{likes:increment(1)}); if(y.uid!==user.uid) await addDoc(collection(db,'notifications'),{toUid:y.uid,text:`${userData.username} upvoted`,yakId:y.id,read:false,createdAt:serverTimestamp()}); }} className="px-4 py-2 text-xs">⬆️ {y.likes||0}</button><button onClick={()=>updateDoc(doc(db,'yaks',y.id),{dislikes:increment(1)})} className="px-4 py-2 text-xs border-l border-zinc-700">⬇️ {y.dislikes||0}</button></div>
                <button onClick={()=>setActivePost(activePost===y.id?null:y.id)} className={`${th.input} px-4 py-2 rounded-full text-xs`}>💬 {y.commentsCount||0}</button>
                <button onClick={async()=>{ await updateDoc(doc(db,'yaks',y.id),{saves:arrayUnion(user.uid)}); alert('Saved 🔖'); }} className={`${th.input} px-3 py-2 rounded-full text-xs`}>🔖</button>
                <button onClick={async()=>{ if(navigator.share){ await navigator.share({title:'YAK',text:y.text}); } else { navigator.clipboard.writeText(y.text); alert('Copied'); } }} className={`${th.input} px-3 py-2 rounded-full text-xs`}>↗️ Share</button>
                <button onClick={async()=>{ await updateDoc(doc(db,'users',userData.id),{blockedUsers:arrayUnion(y.uid)}); }} className={`${th.input} px-3 py-2 rounded-full text-xs`}>🚫 Block</button>
              </div>
              {activePost===y.id && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  {comments.map(c=><div key={c.id} className="flex justify-between py-1.5"><span className="text-[13px]"><b>{c.username}:</b> {c.text}</span>{user.uid===c.uid && <button onClick={async()=>{ await deleteDoc(doc(db,`yaks/${y.id}/comments/${c.id}`)); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(-1)}); }} className="text-[10px] text-red-400">Del</button>}</div>)}
                  <div className="flex gap-2 mt-2"><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment..." className={`flex-1 ${th.input} rounded-full px-4 py-2 text-sm outline-none`}/><button onClick={async()=>{ if(!commentText.trim()) return; await addDoc(collection(db,`yaks/${y.id}/comments`),{text:commentText,uid:user.uid,username:userData.username,createdAt:serverTimestamp()}); await updateDoc(doc(db,'yaks',y.id),{commentsCount:increment(1)}); if(y.uid!==user.uid) await addDoc(collection(db,'notifications'),{toUid:y.uid,text:`${userData.username} commented`,yakId:y.id,read:false,createdAt:serverTimestamp()}); setCommentText(''); }} className="bg-yellow-400 text-black px-5 rounded-full text-sm font-bold">Post</button></div>
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      <button onClick={()=>setScreen('create')} className="fixed bottom-20 right-5 bg-yellow-400 text-black w-14 h-14 rounded-full text-2xl font-bold shadow-xl">+</button>

      {screen==='create' && (
        <div className={`fixed inset-0 ${th.bg} z-30 p-4 overflow-y-auto`}>
          <div className="flex justify-between"><h2 className="font-bold">{editYak?'Edit Yak':'New Yak'} 👻 Anonymous</h2><button onClick={()=>{setScreen('feed'); setEditYak(null);}} className={`${th.input} w-8 h-8 rounded-full`}>✕</button></div>
          <select value={topic} onChange={e=>setTopic(e.target.value)} className={`w-full mt-4 p-3 ${th.input} rounded-xl`}><option value="All">Community</option>{TOPICS.map(t=><option key={t} value={t}>{t}</option>)}</select>
          <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="Text Post... #hashtag" className={`w-full h-28 mt-3 p-3 ${th.input} rounded-xl outline-none`}/>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <input value={poll.q1} onChange={e=>setPoll({...poll,q1:e.target.value})} placeholder="Poll Option 1" className={`p-3 ${th.input} rounded-xl text-sm`}/>
            <input value={poll.q2} onChange={e=>setPoll({...poll,q2:e.target.value})} placeholder="Poll Option 2" className={`p-3 ${th.input} rounded-xl text-sm`}/>
          </div>
          <label className={`w-full mt-3 border border-dashed border-yellow-400 p-3 rounded-xl flex justify-center text-sm ${th.input}`}>🖼️ Image (max 4)<input type="file" multiple hidden accept="image/*" onChange={e=>{ const files=Array.from(e.target.files||[]).slice(0,4) as File[]; files.forEach(f=>{ const r=new FileReader(); r.onloadend=()=>setImages(p=>[...p,r.result as string].slice(0,4)); r.readAsDataURL(f); }); }}/></label>
          {images.length>0 && <div className="grid grid-cols-4 gap-2 mt-2">{images.map((im,i)=><div key={i} className="relative"><img src={im} className="h-20 rounded-lg object-cover w-full"/><button onClick={()=>setImages(images.filter((_,idx)=>idx!==i))} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs">x</button></div>)}</div>}
          <div className="flex gap-2 mt-4"><button onClick={saveDraft} className={`${th.input} flex-1 p-3 rounded-full text-sm`}>💾 Draft</button><button onClick={handlePost} className="flex-1 bg-yellow-400 text-black p-3 rounded-full font-bold">{editYak?'Update':'Post 🚀'}</button></div>
          {drafts.length>0 && <div className="mt-4">{drafts.map((d,i)=><div key={i} className={`${th.input} p-2 rounded-lg mt-1 flex justify-between text-xs`}><span>{d.text.slice(0,30)}</span><button onClick={()=>{setNewYak(d.text);}} className="text-yellow-400">Load</button></div>)}</div>}
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 z-30 flex items-end sm:items-center justify-center">
          <div className={`${th.card} w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] p-6 border ${th.border}`}>
            <div className="flex justify-between"><h2 className="font-bold">👻 {userData.username}</h2><button onClick={()=>setShowProfile(false)} className={`${th.input} w-8 h-8 rounded-full`}>✕</button></div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className={`${th.input} p-3 rounded-xl text-center`}>Karma<br/><b>{userData.karma}</b></div><div className={`${th.input} p-3 rounded-xl text-center`}>Streak<br/><b>🔥 {userData.streak}</b></div><div className={`${th.input} p-3 rounded-xl text-center`}>Posts<br/><b>{userData.totalPosts}</b></div><div className={`${th.input} p-3 rounded-xl text-center`}>Level<br/><b>{userData.karma>200?'Gold':userData.karma>100?'Silver':'Bronze'}</b></div></div>
            <div className="mt-4"><input value={keywordFilter} onChange={e=>setKeywordFilter(e.target.value)} placeholder="Block Keyword" className={`w-full p-2 ${th.input} rounded-full text-xs`}/><button onClick={async()=>{ if(!keywordFilter) return; await updateDoc(doc(db,'users',userData.id),{blockedKeywords:arrayUnion(keywordFilter)}); alert('Blocked'); }} className="mt-2 text-xs text-yellow-400">+ Block</button></div>
            <button onClick={()=>{auth.signOut(); window.location.reload();}} className="w-full mt-6 bg-red-500/10 text-red-400 p-3 rounded-full text-sm">Logout</button>
          </div>
        </div>
      )}

      {showNotifs && (
        <div className="fixed inset-0 bg-black/80 z-30 flex items-start justify-center pt-20 p-4">
          <div className={`${th.card} w-full max-w-sm rounded-2xl p-4 border ${th.border}`}>
            <div className="flex justify-between"><h2 className="font-bold">🔔 Notifications</h2><button onClick={()=>setShowNotifs(false)}>✕</button></div>
            <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
              {notifs.length===0 && <p className="text-xs text-zinc-500">No notifications</p>}
              {notifs.map(n=><div key={n.id} className={`${th.input} p-3 rounded-xl text-xs flex justify-between`}><span>{n.text}</span><button onClick={async()=>await updateDoc(doc(db,'notifications',n.id),{read:true})} className="text-yellow-400 ml-2">Read</button></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
                    }
