import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, deleteDoc, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  appId: "1:173122711177:web:68e373598d110d80c1e058",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ⭐ INDIAN COLLEGES & BRANCHES
const COLLEGES = ["JNTU Anantapur", "RGUKT", "SVU", "VTU", "JNTUH", "Other"];
const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "AIML", "DS"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const TAGS = ["#Placements", "#Help", "#Memes", "#Events", "#LostFound", "#Notes", "#QPapers", "#Internship", "#BuySell", "#AskSeniors"];
const COMMUNITIES = [
  {id: 'college', name: 'College Feed', type: 'college'},
  {id: 'branch', name: 'Branch Feed', type: 'branch'},
  {id: 'hostel', name: 'Hostel', type: 'hostel'},
  {id: 'city', name: 'Adoni City', type: 'city'},
  {id: 'placements', name: 'Placements', type: 'interest'},
];

type Yak = any;

export default function Home(){
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [screen, setScreen] = useState(1); // 1=college verify, 2=login, 3=feed
  const [yaks, setYaks] = useState<Yak[]>([]);
  const [feedType, setFeedType] = useState('nearby'); // nearby, college, branch, trending, hostel
  const [distance, setDistance] = useState(5); // 2,5,10 km
  const [language, setLanguage] = useState('en');

  // POST STATES
  const [newYak, setNewYak] = useState('');
  const [selectedTag, setSelectedTag] = useState('#Memes');
  const [selectedCommunity, setSelectedCommunity] = useState('college');
  const [pollOptions, setPollOptions] = useState(['','']);
  const [imagesBase64, setImagesBase64] = useState<string[]>([]);
  const [postType, setPostType] = useState('normal'); // normal, lostfound, notes, placement etc

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if(u){
        setUser(u);
        // check if college verified
        const q = query(collection(db, 'users'), where('uid', '==', u.uid));
        onSnapshot(q, (snap) => {
          if(snap.docs.length > 0){
            setUserData(snap.docs[0].data());
            setScreen(3);
          } else {
            setScreen(1); // college verification
          }
        })
      } else setScreen(2);
    })
  }, []);

  // FEED LOGIC - 2,5,10km + College Priority
  useEffect(() => {
    const q = query(collection(db, 'yaks'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({id: d.id,...d.data()} as any));

      // Location Filter
      if(feedType === 'nearby'){
        data = data.filter(y => getDistance(15.63,77.27,y.lat,y.lng) <= distance);
      }
      if(feedType === 'college' && userData){
        data = data.filter(y => y.college === userData.college);
      }
      if(feedType === 'branch' && userData){
        data = data.filter(y => y.branch === userData.branch);
      }
      if(feedType === 'trending'){
        data = data.sort((a,b) => (b.likes+b.loves) - (a.likes+a.loves)).slice(0,20);
      }
      if(feedType === 'hostel' && userData){
        data = data.filter(y => y.hostel === userData.hostel);
      }
      setYaks(data);
    });
    return () => unsub();
  }, [feedType, distance, userData]);

  const getDistance = (lat1:number, lon1:number, lat2:number, lon2:number) => {
    const R=6371; const dLat=(lat2-lat1)*Math.PI/180; const dLon=(lon2-lon1)*Math.PI/180;
    const a=Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }

  const handleMultiImage = (e:any) => {
    const files = Array.from(e.target.files).slice(0,4) as File[]; // max 4
    files.forEach(file => {
      if(file.size > 500*1024) return;
      const reader = new FileReader();
      reader.onloadend = () => setImagesBase64(prev => [...prev, reader.result as string].slice(0,4));
      reader.readAsDataURL(file);
    })
  }

  const createUserProfile = async (college:string, branch:string, year:string) => {
    const username = `Yak_${Math.floor(Math.random()*9000)+1000}`;
    await addDoc(collection(db, 'users'), {
      uid: user.uid, username, college, branch, year, hostel: 'BH-1',
      karma: 10, ageVerified: true, collegeVerified: true,
      createdAt: serverTimestamp(), language: 'en'
    });
    setScreen(3);
  }

  const postYak = async () => {
    if(!newYak.trim() && imagesBase64.length===0) return;
    const poll = pollOptions[0]? {options: pollOptions, votes: pollOptions.map(()=>0)} : null;
    await addDoc(collection(db, 'yaks'), {
      text: newYak, uid: user.uid, username: userData?.username || 'Anonymous',
      college: userData?.college, branch: userData?.branch, hostel: userData?.hostel,
      tags: [selectedTag], communityId: selectedCommunity, postType,
      imageUrls: imagesBase64, poll,
      likes:0, loves:0, dislikes:0, reports:0, comments:0,
      lat:15.6327, lng:77.2768,
      createdAt: serverTimestamp()
    });
    setNewYak(''); setImagesBase64([]); setPollOptions(['','']);
  }

  const vote = async (id:string, type:'likes'|'loves'|'dislikes') => {
    await updateDoc(doc(db, 'yaks', id), {[type]: increment(1)});
  }

  // --- SCREENS ---

  if(screen === 1){ // COLLEGE VERIFICATION ⭐
    return (
      <div className="min-h-screen p-6 bg-black text-white">
        <h1 className="text-2xl font-bold text-yellow-400 mb-6">College Verification ⭐</h1>
        <p className="text-sm text-gray-400 mb-4">Anonymous identity kosam college verify chey bro</p>
        <select id="college" className="w-full p-3 rounded-xl bg-zinc-900 mb-3">{COLLEGES.map(c=><option key={c}>{c}</option>)}</select>
        <select id="branch" className="w-full p-3 rounded-xl bg-zinc-900 mb-3">{BRANCHES.map(b=><option key={b}>{b}</option>)}</select>
        <select id="year" className="w-full p-3 rounded-xl bg-zinc-900 mb-6">{YEARS.map(y=><option key={y}>{y}</option>)}</select>
        <button onClick={()=>{
          const c=(document.getElementById('college') as any).value;
          const b=(document.getElementById('branch') as any).value;
          const y=(document.getElementById('year') as any).value;
          createUserProfile(c,b,y);
        }} className="w-full bg-yellow-400 text-black p-3 rounded-full font-bold">Verify & Continue</button>
      </div>
    )
  }

  if(screen === 2){
    return <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white"><h1 className="text-5xl font-extrabold text-yellow-400">Yak</h1><p className="mt-2 text-gray-400">India's Anonymous Campus</p><button onClick={()=>signInWithPopup(auth,provider)} className="mt-8 bg-yellow-400 text-black px-8 py-3 rounded-full font-bold">Google Login</button></div>
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* HEADER - SEARCH + NOTIFICATIONS */}
      <div className="sticky top-0 bg-zinc-950 p-3 z-10 border-b border-zinc-800">
        <div className="flex gap-2 overflow-x-auto mb-2">
          <button onClick={()=>setFeedType('nearby')} className={`px-3 py-1 rounded-full text-xs font-bold ${feedType==='nearby'?'bg-yellow-400 text-black':'bg-zinc-800'}`}>Nearby {distance}km</button>
          <button onClick={()=>setFeedType('college')} className={`px-3 py-1 rounded-full text-xs font-bold ${feedType==='college'?'bg-yellow-400 text-black':'bg-zinc-800'}`}>College ⭐</button>
          <button onClick={()=>setFeedType('branch')} className={`px-3 py-1 rounded-full text-xs font-bold ${feedType==='branch'?'bg-yellow-400 text-black':'bg-zinc-800'}`}>Branch {userData?.branch}</button>
          <button onClick={()=>setFeedType('trending')} className={`px-3 py-1 rounded-full text-xs font-bold ${feedType==='trending'?'bg-yellow-400 text-black':'bg-zinc-800'}`}>Trending 🔥</button>
          <button onClick={()=>setFeedType('hostel')} className={`px-3 py-1 rounded-full text-xs font-bold ${feedType==='hostel'?'bg-yellow-400 text-black':'bg-zinc-800'}`}>Hostel</button>
        </div>
        <div className="flex gap-2">
          {[2,5,10].map(d=><button key={d} onClick={()=>setDistance(d)} className={`text-xs px-2 py-1 rounded ${distance===d?'bg-white text-black':'bg-zinc-800'}`}>{d}km</button>)}
          <input placeholder="Search Colleges, Communities" className="ml-auto bg-zinc-900 rounded-full px-3 text-xs w-40" />
        </div>
      </div>

      {/* INDIA FEATURES QUICK BAR */}
      <div className="flex gap-2 p-2 overflow-x-auto bg-zinc-900">
        {TAGS.map(tag=><button key={tag} onClick={()=>setSelectedTag(tag)} className={`text-xs px-3 py-1 rounded-full border ${selectedTag===tag?'bg-yellow-400 text-black':'border-zinc-700'}`}>{tag}</button>)}
      </div>

      {/* FEED */}
      <div className="p-2">
        {yaks.map(y=>(
          <div key={y.id} className="bg-zinc-900 rounded-2xl p-3 mb-2">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>{y.username} • {y.branch} • {y.college}</span><span>{y.tags?.[0]}</span></div>
            <p className="text-sm mb-2">{y.text}</p>
            {y.imageUrls?.length>0 && <div className={`grid ${y.imageUrls.length>1?'grid-cols-2':''} gap-1 mb-2`}>{y.imageUrls.map((img:string,i:number)=><img key={i} src={img} className="rounded-xl max-h-60 object-cover"/>)}</div>}
            {y.poll && <div className="bg-zinc-800 rounded-xl p-2 mb-2">{y.poll.options.map((op:string,i:number)=><button key={i} className="w-full text-left text-xs p-2 border border-zinc-700 rounded-lg mb-1">{op} - {y.poll.votes[i]} votes</button>)}</div>}
            <div className="flex gap-4 text-xs">
              <button onClick={()=>vote(y.id,'loves')}>❤️ {y.loves}</button>
              <button onClick={()=>vote(y.id,'likes')}>👍 {y.likes}</button>
              <button>💬 {y.comments}</button>
              <button className="ml-auto">Save ⭐</button>
              <button>Report</button>
            </div>
          </div>
        ))}
      </div>

      {/* POST MODAL TRIGGER */}
      <div className="fixed bottom-4 right-4">
        <button onClick={()=>setScreen(4)} className="bg-yellow-400 text-black w-14 h-14 rounded-full text-2xl font-bold">+</button>
      </div>

      {screen===4 && (
        <div className="fixed inset-0 bg-black z-20 p-4 overflow-y-auto">
          <h2 className="font-bold mb-3">New Post - {postType}</h2>
          <select value={postType} onChange={e=>setPostType(e.target.value)} className="w-full p-2 bg-zinc-900 rounded-xl mb-2">
            <option value="normal">Normal Post</option>
            <option value="lostfound">Lost & Found</option>
            <option value="notes">Notes & PDF</option>
            <option value="qpapers">Question Paper</option>
            <option value="placement">Placement Discussion</option>
            <option value="internship">Internship Board</option>
            <option value="event">Event Calendar</option>
            <option value="buysell">Buy & Sell</option>
            <option value="askseniors">Ask Seniors (Anonymous)</option>
          </select>
          <select value={selectedCommunity} onChange={e=>setSelectedCommunity(e.target.value)} className="w-full p-2 bg-zinc-900 rounded-xl mb-2">
            {COMMUNITIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <textarea value={newYak} onChange={e=>setNewYak(e.target.value)} placeholder="What's happening in campus?" className="w-full h-24 p-3 bg-zinc-900 rounded-xl mb-2"/>
          <div className="flex gap-2 mb-2">{TAGS.slice(0,5).map(t=><button key={t} onClick={()=>setSelectedTag(t)} className={`text-xs px-2 py-1 rounded-full ${selectedTag===t?'bg-yellow-400 text-black':'bg-zinc-800'}`}>{t}</button>)}</div>

          <label className="w-full border border-dashed border-yellow-400 p-3 rounded-xl flex justify-center mb-2">
            Multiple Images (max 4) ⭐ <input type="file" multiple accept="image/*" hidden onChange={handleMultiImage}/>
          </label>
          <div className="grid grid-cols-4 gap-1 mb-2">{imagesBase64.map((img,i)=><img key={i} src={img} className="h-20 object-cover rounded"/>)}</div>

          <div className="mb-3">
            <p className="text-xs mb-1">Poll Post ⭐</p>
            <input value={pollOptions[0]} onChange={e=>setPollOptions([e.target.value,pollOptions[1]])} placeholder="Option 1" className="w-full p-2 bg-zinc-900 rounded mb-1 text-xs"/>
            <input value={pollOptions[1]} onChange={e=>setPollOptions([pollOptions[0],e.target.value])} placeholder="Option 2" className="w-full p-2 bg-zinc-900 rounded text-xs"/>
          </div>

          <button onClick={postYak} className="w-full bg-yellow-400 text-black p-3 rounded-full font-bold">Yak It 🚀</button>
          <button onClick={()=>setScreen(3)} className="w-full p-3 text-gray-400">Cancel</button>
        </div>
      )}
    </div>
  )
    }
