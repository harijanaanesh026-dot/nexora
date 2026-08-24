import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, where, getDocs, deleteDoc } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const COLLEGES = ["JNTU Anantapur", "RGUKT", "SVU", "JNTUH", "VTU", "Other"];
const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "AIML", "DS"];
const TOPICS = ["#Placements","#QPapers","#Notes","#Hostel","#Canteen","#Bus","#Memes","#Fests","#LostFound","#BuySell","#AskSeniors"];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [screen, setScreen] = useState<'login'|'verify'|'feed'|'create'>('login');
  const [yaks, setYaks] = useState<any[]>([]);
  const [feedType, setFeedType] = useState('college');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const [newYak, setNewYak] = useState('');
  const [postTopic, setPostTopic] = useState('#Memes');
  const [images, setImages] = useState<string[]>([]);

  const [activeCommentPost, setActiveCommentPost] = useState<string|null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('yak_theme');
    if (saved) setDarkMode(saved === 'dark');
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const snap = await getDocs(query(collection(db, 'users'), where('uid', '==', u.uid)));
        if (snap.docs.length > 0) {
          setUserData({ id: snap.docs[0].id,...snap.docs[0].data() });
          setScreen('feed');
        } else {
          setScreen('verify');
        }
      } else {
        setScreen('login');
      }
    });
  }, []);

  useEffect(() => {
    if (!userData) return;
    const q = query(collection(db, 'yaks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(d => ({ id: d.id,...d.data() } as any));
      if (feedType === 'college') data = data.filter(y =>!y.college || y.college === userData.college);
      if (feedType === 'trending') data = [...data].sort((a,b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
      if (selectedTopic!== 'All') data = data.filter(y => y.topic === selectedTopic);
      if (search) data = data.filter(y => y.text.toLowerCase().includes(search.toLowerCase()));
      setYaks(data);
    });
    return () => unsub();
  }, [userData, feedType, selectedTopic, search]);

  useEffect(() => {
    if (!activeCommentPost) return;
    const q = query(collection(db, `yaks/${activeCommentPost}/comments`), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => setComments(snap.docs.map(d => ({ id: d.id,...d.data() }))));
  }, [activeCommentPost]);

  const toggleTheme = () => {
    const n =!darkMode;
    setDarkMode(n);
    localStorage.setItem('yak_theme', n? 'dark' : 'light');
  };

  const handleImages = (e: any) => {
    const files = Array.from(e.target.files || []).slice(0, 4) as File[];
    files.forEach(f => {
      const r = new FileReader();
      r.onloadend = () => setImages(p => [...p, r.result as string].slice(0, 4));
      r.readAsDataURL(f);
    });
  };

  const createUser = async () => {
    const college = (document.getElementById('college') as any).value;
    const branch = (document.getElementById('branch') as any).value;
    const username = `Yak_${Math.floor(Math.random() * 9000) + 1000}`;
    await addDoc(collection(db, 'users'), { uid: user.uid, username, college, branch, karma: 50, totalPosts: 0, createdAt: serverTimestamp() });
    window.location.reload();
  };

  const handlePost = async () => {
    if (!newYak.trim() && images.length === 0) { alert('Emanna rayi bro!'); return; }
    try {
      await addDoc(collection(db, 'yaks'), {
        text: newYak.trim(),
        uid: user.uid,
        username: userData.username,
        college: userData.college,
        branch: userData.branch,
        topic: postTopic,
        imageUrls: images,
        likes: 0, dislikes: 0, commentsCount: 0,
        createdAt: serverTimestamp()
      });
      if (userData.id) {
        await updateDoc(doc(db, 'users', userData.id), { totalPosts: increment(1), karma: increment(5) }).catch(()=>{});
      }
      setNewYak(''); setImages([]); setScreen('feed');
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const handleVote = async (yak: any, type: 'likes'|'dislikes') => {
    await updateDoc(doc(db, 'yaks', yak.id), { [type]: increment(1) });
  };
  const handleVoteComment = async (yakId: string, c: any, type: 'likes'|'dislikes') => {
    await updateDoc(doc(db, `yaks/${yakId}/comments/${c.id}`), { [type]: increment(1) });
  };
  const handleDeletePost = async (yak: any) => {
    if (!confirm('Ee post delete cheyala?')) return;
    await deleteDoc(doc(db, 'yaks', yak.id));
  };
  const handleDeleteComment = async (yakId: string, cId: string) => {
    if (!confirm('Comment delete cheyala?')) return;
    await deleteDoc(doc(db, `yaks/${yakId}/comments/${cId}`));
    await updateDoc(doc(db, 'yaks', yakId), { commentsCount: increment(-1) });
  };
  const handleAddComment = async (yak: any) => {
    if (!commentText.trim()) return;
    await addDoc(collection(db, `yaks/${yak.id}/comments`), {
      text: commentText.trim(),
      uid: user.uid,
      username: userData.username,
      parentId: replyTo? replyTo.id : null,
      replyToUsername: replyTo? replyTo.username : null,
      likes: 0, dislikes: 0,
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, 'yaks', yak.id), { commentsCount: increment(1) });
    setCommentText(''); setReplyTo(null);
  };

  const th = darkMode
   ? { bg: 'bg-black', card: 'bg-zinc-900', input: 'bg-zinc-800', text: 'text-white', sub: 'text-zinc-500', border: 'border-zinc-800' }
    : { bg: 'bg-zinc-100', card: 'bg-white', input: 'bg-zinc-200', text: 'text-black', sub: 'text-zinc-500', border: 'border-zinc-200' };

  if (screen === 'login') {
    return (
      <div className={`min-h-screen ${th.bg} ${th.text} flex flex-col items-center justify-center p-6`}>
        <h1 className="text-6xl font-black text-yellow-400">YAK</h1>
        <p className={`${th.sub} mt-2`}>India's Anonymous Campus 🇮🇳</p>
        <button onClick={() => signInWithPopup(auth, provider)} className="mt-8 bg-yellow-400 text-black px-8 py-3 rounded-full font-bold">Google Login</button>
      </div>
    );
  }
  if (screen === 'verify') {
    return (
      <div className={`min-h-screen ${th.bg} ${th.text} p-6`}>
        <h1 className="text-2xl font-bold">🎓 College Verification</h1>
        <select id="college" className={`w-full mt-4 p-3 ${th.input} rounded-xl`}>{COLLEGES.map(c => <option key={c}>{c}</option>)}</select>
        <select id="branch" className={`w-full mt-3 p-3 ${th.input} rounded-xl`}>{BRANCHES.map(b => <option key={b}>{b}</option>)}</select>
        <button onClick={createUser} className="w-full mt-6 bg-yellow-400 text-black p-3 rounded-full font-bold">Verify & Enter</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${th.bg} ${th.text} pb-20`}>
      <div className={`sticky top-0 ${darkMode? 'bg-black' : 'bg-white'} border-b ${th.border} p-3 z-10`}>
        <div className="flex justify-between items-center">
          <h1 className="font-black text-yellow-400 text-xl">YAK 🇮🇳</h1>
          <div className="flex gap-2 items-center">
            <button onClick={toggleTheme} className={`${th.input} w-8 h-8 rounded-full`}>{darkMode? '☀️' : '🌙'}</button>
            <button onClick={() => setShowProfile(true)} className={`${th.input} px-3 py-1 rounded-full text-xs font-bold`}>👻 {userData?.username}</button>
          </div>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto">
          <button onClick={() => setFeedType('college')} className={`px-4 py-2 rounded-full text-sm font-bold ${feedType === 'college'? 'bg-yellow-400 text-black' : th.input}`}>🏫 My College</button>
          <button onClick={() => setFeedType('trending')} className={`px-4 py-2 rounded-full text-sm font-bold ${feedType === 'trending'? 'bg-yellow-400 text-black' : th.input}`}>🔥 Trending</button>
          <button onClick={() => setFeedType('latest')} className={`px-4 py-2 rounded-full text-sm font-bold ${feedType === 'latest'? 'bg-yellow-400 text-black' : th.input}`}>🕒 Latest</button>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search" className={`w-full mt-3 ${th.input} rounded-full px-4 py-2 text-sm outline-none`} />
      </div>

      <div className={`flex gap-2 p-2 overflow-x-auto border-b ${th.border}`}>
        <button onClick={() => setSelectedTopic('All')} className={`px-3 py-1 rounded-full text-xs border ${selectedTopic === 'All'? 'bg-yellow-400 text-black' : th.border}`}>All</button>
        {TOPICS.map(t => <button key={t} onClick={() => setSelectedTopic(t)} className={`px-3 py-1 rounded-full text-xs border whitespace-nowrap ${selectedTopic === t? 'bg-yellow-400 text-black' : th.border}`}>{t}</button>)}
      </div>

      <div className="p-3 space-y-3">
        {yaks.map(y => {
          const isOwner = user.uid === y.uid;
          return (
            <div key={y.id} className={`${th.card} rounded-2xl p-4 border ${th.border}`}>
              <div className="flex justify-between text-[11px] mb-2">
                <span className={th.sub}>👻 {y.username} • {y.branch} • {y.topic}</span>
                <div className="flex gap-2 items-center">
                  <span className={th.sub}>{y.college}</span>
                  {isOwner && <button onClick={() => handleDeletePost(y)} className="text-red-400 bg-red-500/10 px-2 py-1 rounded-full text-[10px]">🗑️ Delete</button>}
                </div>
              </div>
              <p className="text-[15px] mb-3 whitespace-pre-wrap">{y.text}</p>
              {y.imageUrls?.length > 0 && <div className="grid grid-cols-2 gap-2 mb-3">{y.imageUrls.map((img: string, i: number) => <img key={i} src={img} className="rounded-xl max-h-64 object-cover w-full" />)}</div>}

              <div className="flex gap-2">
                <div className={`flex ${th.input} rounded-full overflow-hidden`}>
                  <button onClick={() => handleVote(y, 'likes')} className="px-4 py-1.5 text-sm">⬆️ {y.likes}</button>
                  <button onClick={() => handleVote(y, 'dislikes')} className="px-4 py-1.5 text-sm border-l border-zinc-700">⬇️ {y.dislikes}</button>
                </div>
                <button onClick={() => setActiveCommentPost(activeCommentPost === y.id? null : y.id)} className={`${th.input} px-4 py-1.5 rounded-full text-sm`}>💬 {y.commentsCount}</button>
              </div>

              {activeCommentPost === y.id && (
                <div className="mt-4 pt-3 border-t border-zinc-800">
                  {replyTo && <div className={`${th.input} p-2 rounded-lg mb-2 text-xs flex justify-between`}><span>Reply to @{replyTo.username}</span><button onClick={() => setReplyTo(null)}>✕</button></div>}
                  {comments.filter(c =>!c.parentId).map(c => (
                    <div key={c.id} className="mb-3">
                      <div className="flex justify-between"><p className="text-[13px]"><b className={th.sub}>{c.username}</b>: {c.text}</p>{user.uid === c.uid && <button onClick={() => handleDeleteComment(y.id, c.id)} className="text-red-400 text-xs">🗑️</button>}</div>
                      <div className="flex gap-3 mt-1 text-[11px]"><button onClick={() => handleVoteComment(y.id, c, 'likes')}>⬆️ {c.likes||0}</button><button onClick={() => handleVoteComment(y.id, c, 'dislikes')}>⬇️ {c.dislikes||0}</button><button onClick={() => setReplyTo(c)} className="text-yellow-400 font-bold">Reply</button></div>
                      <div className="ml-4 mt-2 border-l border-zinc-700 pl-3 space-y-2">
                        {comments.filter(r => r.parentId === c.id).map(r => (
                          <div key={r.id} className="flex justify-between"><p className="text-[12px]"><span className="text-yellow-400">↳ @{r.replyToUsername}</span> <b>{r.username}</b>: {r.text}</p><div className="flex gap-2"><button onClick={() => handleVoteComment(y.id, r, 'likes')} className="text-[11px]">⬆️ {r.likes||0}</button>{user.uid === r.uid && <button onClick={() => handleDeleteComment(y.id, r.id)} className="text-red-400 text-xs">🗑️</button>}</div></div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3"><input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={replyTo?`Reply...`:'Add comment...'} className={`flex-1 ${th.input} rounded-full px-4 py-2 text-sm outline-none`} /><button onClick={() => handleAddComment(y)} className="bg-yellow-400 text-black px-5 rounded-full font-bold text-sm">Post</button></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => setScreen('create')} className="fixed bottom-6 right-6 bg-yellow-400 text-black w-14 h-14 rounded-full text-2xl font-bold shadow-xl">+</button>

      {screen === 'create' && (
        <div className={`fixed inset-0 ${th.bg} z-20 p-4`}>
          <h2 className="font-bold text-lg">New Yak 👻</h2>
          <select value={postTopic} onChange={e => setPostTopic(e.target.value)} className={`w-full mt-4 p-3 ${th.input} rounded-xl`}>{TOPICS.map(t => <option key={t} value={t}>{t}</option>)}</select>
          <textarea value={newYak} onChange={e => setNewYak(e.target.value)} placeholder="What's happening? Anonymous..." className={`w-full h-32 mt-3 p-3 ${th.input} rounded-xl`} />
          <label className={`w-full mt-3 border border-dashed border-yellow-400 p-3 rounded-xl flex justify-center text-sm ${th.input}`}>🖼️ Add Images (max 4)<input type="file" multiple hidden accept="image/*" onChange={handleImages} /></label>
          <div className="grid grid-cols-4 gap-2 mt-2">{images.map((img, i) => <img key={i} src={img} className="h-20 rounded-lg object-cover" />)}</div>
          <button onClick={handlePost} className="w-full mt-6 bg-yellow-400 text-black p-4 rounded-full font-bold">Post Yak 🚀</button>
          <button onClick={() => setScreen('feed')} className={`w-full mt-3 ${th.sub} text-sm`}>Cancel</button>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/80 z-30 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className={`${th.card} w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] p-6 border ${th.border}`}>
            <div className="flex justify-between items-center mb-6"><h2 className="font-bold text-lg">👻 Anonymous Profile</h2><button onClick={() => setShowProfile(false)} className={`${th.input} w-8 h-8 rounded-full`}>✕</button></div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-3xl font-black text-black">👻</div>
              <h3 className="mt-3 font-bold text-lg">{userData?.username}</h3>
              <p className={`${th.sub} text-xs mt-1`}>Real identity hidden • Anonymous ID</p>
              <div className="grid grid-cols-2 gap-3 w-full mt-6">
                <div className={`${th.input} p-3 rounded-xl text-center`}><p className="text-[11px] text-zinc-400">COLLEGE</p><p className="font-bold text-sm mt-1">{userData?.college}</p></div>
                <div className={`${th.input} p-3 rounded-xl text-center`}><p className="text-[11px] text-zinc-400">BRANCH</p><p className="font-bold text-sm mt-1">{userData?.branch}</p></div>
                <div className={`${th.input} p-3 rounded-xl text-center`}><p className="text-[11px] text-zinc-400">KARMA</p><p className="font-bold text-sm mt-1">🔥 {userData?.karma || 50}</p></div>
                <div className={`${th.input} p-3 rounded-xl text-center`}><p className="text-[11px] text-zinc-400">POSTS</p><p className="font-bold text-sm mt-1">📝 {userData?.totalPosts || 0}</p></div>
              </div>
              <div className="w-full mt-6 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl"><p className="text-[11px] text-yellow-400 font-bold">🔒 PRIVACY:</p><p className="text-[11px] text-zinc-400 mt-1">Nee real name, email, photo evariki kanipinchavu.</p></div>
              <button onClick={() => { auth.signOut(); window.location.reload(); }} className="w-full mt-6 bg-red-500/10 text-red-400 p-3 rounded-full font-bold text-sm border border-red-500/20">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                    }
