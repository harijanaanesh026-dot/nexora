import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, getDocs, updateDoc, orderBy, increment } from 'firebase/firestore';

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

export default function CampusSocial() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [tab, setTab] = useState('login');
  const [toast, setToast] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [market, setMarket] = useState<any[]>([]);
  const [lost, setLost] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [memes, setMemes] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [roll, setRoll] = useState('');
  const [postText, setPostText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u: any) => {
      if (u) { setUser(u); const snap = await getDocs(query(collection(db, 'campus_users'), where('uid', '==', u.uid))); if (snap.empty) setTab('login'); else { const d = snap.docs[0].data() as any; setUserData({ id: snap.docs[0].id, ...d }); setRoll(d.rollNumber || ''); setTab('home'); } } else setTab('login');
    });
  }, []);

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, 'campus_posts'), orderBy('createdAt', 'desc')), (s) => setPosts(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(query(collection(db, 'campus_stories'), orderBy('createdAt', 'desc')), (s) => setStories(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)).filter((x: any) => Date.now() - (x.createdAt?.seconds * 1000 || 0) < 86400000))),
      onSnapshot(collection(db, 'clubs_communities'), (s) => setClubs(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campus_events'), (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'notes_pyqs'), (s) => setNotes(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campus_marketplace'), (s) => setMarket(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'lost_found'), (s) => setLost(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campus_polls'), (s) => setPolls(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campus_users'), (s) => setStudents(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campus_chats'), (s) => setChats(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campus_notifications'), (s) => setNotifs(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campus_memes'), (s) => setMemes(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'digital_notice_board'), (s) => setNotices(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'college_leaderboard'), (s) => setLeaderboard(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const handleLogin = async () => {
    const r = await signInWithPopup(auth, provider);
    const u = r.user;
    const ex = await getDocs(query(collection(db, 'campus_users'), where('uid', '==', u.uid)));
    if (ex.empty) {
      await addDoc(collection(db, 'campus_users'), { uid: u.uid, email: u.email, name: u.displayName, photoURL: u.photoURL, rollNumber: roll.toUpperCase() || '21CS101', branch: 'CSE', year: '3rd', interests: 'Coding, AI', skills: 'React, Firebase', bio: 'Campus enthusiast', followers: 0, following: 0, points: 10, createdAt: serverTimestamp() });
    }
    window.location.reload();
  };

  const handlePost = async () => {
    if (!postText.trim()) { showToast('Write something'); return; }
    await addDoc(collection(db, 'campus_posts'), { uid: user.uid, name: userData.name, photoURL: userData.photoURL, rollNumber: userData.rollNumber, branch: userData.branch, text: postText, type: 'text', likes: 0, comments: 0, createdAt: serverTimestamp() });
    setPostText(''); showToast('Posted to Home Feed');
  };

  const handleLike = async (p: any) => {
    await updateDoc(doc(db, 'campus_posts', p.id), { likes: increment(1) });
    await addDoc(collection(db, 'campus_notifications'), { toUid: p.uid, fromName: userData.name, type: 'like', text: `${userData.name} liked your post`, createdAt: serverTimestamp() });
  };

  const menuItems = [
    { id: 'home', icon: '🏠', label: 'Home Feed' },
    { id: 'stories', icon: '📸', label: 'Stories' },
    { id: 'explore', icon: '🔍', label: 'Explore' },
    { id: 'events', icon: '🎉', label: 'Campus Events' },
    { id: 'clubs', icon: '👥', label: 'Clubs & Communities' },
    { id: 'notes', icon: '📚', label: 'Notes & PYQs' },
    { id: 'market', icon: '🛒', label: 'Campus Marketplace' },
    { id: 'lost', icon: '🔎', label: 'Lost & Found' },
    { id: 'polls', icon: '📊', label: 'Campus Polls' },
    { id: 'profiles', icon: '👤', label: 'Student Profiles' },
    { id: 'skills', icon: '💡', label: 'Skill Connect' },
    { id: 'senior', icon: '🎓', label: 'Senior Help' },
    { id: 'leaderboard', icon: '🏆', label: 'College Leaderboard' },
    { id: 'memes', icon: '😂', label: 'Campus Memes' },
    { id: 'notices', icon: '📢', label: 'Digital Notice Board' },
    { id: 'chat', icon: '💬', label: 'DM / Chat' },
    { id: 'notifs', icon: '🔔', label: 'Notifications' },
    { id: 'search', icon: '🔎', label: 'Search' },
  ];

  if (tab === 'login') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[24px] p-8">
          <div className="w-12 h-12 bg-white text-black rounded-[14px] flex items-center justify-center font-black">C</div>
          <h1 className="text-[22px] font-black mt-4">Campus Social</h1>
          <p className="text-[11px] text-white/40 mt-1">Home Feed • Stories • Marketplace • Skills • Memes</p>
          <input value={roll} onChange={(e) => setRoll(e.target.value.toUpperCase())} placeholder="Roll e.g. 21CS101" className="w-full mt-6 p-4 bg-black border border-white/10 rounded-[12px] uppercase font-bold text-[13px]" />
          <button onClick={handleLogin} className="w-full mt-4 py-4 rounded-full bg-white text-black font-bold">Join Campus</button>
          <p className="text-[9px] text-white/20 text-center mt-4">Final Feature Set - 18 Features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-full text-xs font-bold z-50">{toast}</div>}
      <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 z-30">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex justify-between items-center">
          <div className="flex gap-3 items-center"><button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 bg-white/10 rounded-full">☰</button><div className="w-8 h-8 bg-white text-black rounded-[10px] flex items-center justify-center font-black text-[12px]">C</div><p className="font-bold text-[14px]">Campus</p></div>
          <div className="flex gap-2 items-center"><button onClick={() => setTab('search')} className="w-8 h-8 bg-white/10 rounded-full">🔍</button><button onClick={() => setTab('notifs')} className="w-8 h-8 bg-white/10 rounded-full relative">🔔{notifs.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center">{notifs.length}</span>}</button><img src={userData?.photoURL} className="w-8 h-8 rounded-full" alt="" /></div>
        </div>
      </div>
      {showMenu && (
        <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setShowMenu(false)}>
          <div className="w-[300px] h-full bg-[#111] border-r border-white/10 p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-3 items-center pb-4 border-b border-white/10"><img src={userData?.photoURL} className="w-10 h-10 rounded-full" alt="" /><div><p className="font-bold text-[13px]">{userData?.name}</p><p className="text-[11px] text-white/40">{userData?.branch} • {userData?.year} • {userData?.rollNumber}</p></div></div>
            <div className="mt-4 space-y-1">
              {menuItems.map((m) => <button key={m.id} onClick={() => { setTab(m.id); setShowMenu(false); }} className={`w-full text-left px-3 py-2.5 rounded-[12px] text-[12px] flex gap-3 items-center ${tab === m.id ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/60 border border-white/5'}`}><span>{m.icon}</span>{m.label}</button>)}
              <button onClick={async () => { await signOut(auth); window.location.reload(); }} className="w-full text-left px-3 py-3 rounded-[12px] text-[12px] flex gap-3 items-center bg-red-600 text-white font-bold mt-4"><span>🚪</span>Logout</button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-[600px] mx-auto p-3 pb-24 space-y-3">
        {tab === 'home' && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-[20px] p-4">
              <div className="flex gap-3"><img src={userData?.photoURL} className="w-10 h-10 rounded-full" alt="" /><textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="What's happening in campus? Photos, videos, text..." className="flex-1 bg-black border border-white/10 rounded-[14px] p-3 text-[13px] min-h-[60px]" /></div>
              <div className="flex justify-end mt-3"><button onClick={handlePost} className="px-6 py-2 bg-white text-black rounded-full font-bold text-[12px]">Post to Feed</button></div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[16px] p-3 overflow-x-auto">
              <p className="font-bold text-[12px] mb-2">📸 Stories — 24h campus updates</p>
              <div className="flex gap-3">
                {stories.map((s: any) => <div key={s.id} className="min-w-[60px] text-center"><div className="w-14 h-14 rounded-full border-2 border-white p-0.5"><img src={s.photoURL} className="w-full h-full rounded-full" alt="" /></div><p className="text-[9px] mt-1 text-white/60">{s.name?.split(' ')[0]}</p></div>)}
                {stories.length === 0 && <p className="text-[11px] text-white/20">No stories in last 24h - Be first!</p>}
              </div>
            </div>
            {posts.map((p: any) => <div key={p.id} className="bg-white/5 border border-white/10 rounded-[20px] p-4"><div className="flex gap-3"><img src={p.photoURL} className="w-9 h-9 rounded-full" alt="" /><div><p className="font-bold text-[13px]">{p.name} <span className="text-white/40 text-[11px]">• {p.branch} • {p.rollNumber}</span></p><p className="text-[10px] text-white/30">{p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</p></div></div><p className="text-[13px] mt-3 leading-[18px]">{p.text}</p><div className="flex gap-4 mt-4"><button onClick={() => handleLike(p)} className="text-[12px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">❤️ {p.likes || 0} Likes</button><button className="text-[12px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">💬 {p.comments || 0} Comments</button><button className="text-[12px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">↗️ Share</button></div></div>)}
            {posts.length === 0 && <p className="text-center py-16 text-white/20">No posts yet - Home Feed empty</p>}
          </>
        )}
        {tab === 'stories' && <div className="space-y-3"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">📸 Stories — 24h campus updates</p><p className="text-[11px] text-white/40">Stories auto delete after 24h</p></div>{stories.map((s: any) => <div key={s.id} className="bg-white/5 border border-white/10 rounded-[20px] p-0 overflow-hidden"><img src={s.image || s.photoURL} className="w-full h-[400px] object-cover" alt="" /><div className="p-3 flex gap-2 items-center"><img src={s.photoURL} className="w-8 h-8 rounded-full" alt="" /><p className="font-bold text-[12px]">{s.name} • {s.branch}</p></div></div>)}</div>}
        {tab === 'explore' && <div className="space-y-3"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🔍 Explore — Trending posts, students, clubs</p></div><p className="font-bold text-[13px]">🔥 Trending Posts</p>{posts.slice(0, 3).map((p: any) => <div key={p.id} className="bg-white/5 border border-white/10 rounded-[16px] p-3"><p className="text-[12px]">{p.text?.slice(0, 80)}...</p><p className="text-[10px] text-white/30 mt-1">❤️ {p.likes} likes</p></div>)}<p className="font-bold text-[13px] mt-4">👥 Trending Students</p>{students.slice(0, 5).map((s: any) => <div key={s.id} className="bg-white/5 border border-white/10 rounded-[16px] p-3 flex gap-3"><img src={s.photoURL} className="w-10 h-10 rounded-full" alt="" /><div><p className="font-bold text-[12px]">{s.name} • {s.branch}</p><p className="text-[10px] text-white/40">{s.skills}</p></div></div>)}</div>}

                {tab === 'events' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🎉 Campus Events — Fests, workshops, sports, club events</p></div>{events.map((e: any) => <div key={e.id} className="bg-white/5 border border-white/10 rounded-[20px] p-4"><div className="w-full h-32 bg-white/10 rounded-[12px] flex items-center justify-center text-[24px]">🎉</div><p className="font-bold text-[14px] mt-3">{e.title}</p><p className="text-[11px] text-white/40 mt-1">{e.type} • {e.date} • {e.location}</p><p className="text-[11px] mt-2">{e.desc}</p><button className="mt-3 w-full py-2 bg-white text-black rounded-full font-bold text-[12px]">Join Event</button></div>)}{events.length === 0 && <p className="text-center py-16 text-white/20">No events - Add fests, workshops</p>}</div>}

        {tab === 'clubs' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">👥 Clubs & Communities — CSE, ECE, coding club, sports</p></div>{clubs.map((c: any) => <div key={c.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{c.name} • {c.branch || 'All'}</p><p className="text-[11px] text-white/40">Members: {c.members} • Lead: {c.lead}</p><p className="text-[10px] text-white/30 mt-1">{c.desc}</p></div><button className="px-4 py-1.5 bg-white text-black rounded-full text-[11px] font-bold h-fit">Join</button></div>)}{clubs.length === 0 && <div className="space-y-2">{['CSE Club', 'ECE Club', 'Coding Club - CodeX', 'Sports Club', 'Music Club', 'Dance Club'].map((name) => <div key={name} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><p className="font-bold text-[13px]">{name}</p><button className="px-4 py-1.5 bg-white text-black rounded-full text-[11px] font-bold">Join</button></div>)}</div>}</div>}

        {tab === 'notes' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">📚 Notes & PYQs — Subject-wise study material</p></div>{notes.map((n: any) => <div key={n.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><div><p className="font-bold text-[13px]">{n.subject} - {n.title}</p><p className="text-[11px] text-white/40">{n.type} • by {n.uploadedBy} • {n.sem}</p></div><a href={n.link} target="_blank" className="px-4 py-1.5 bg-white text-black rounded-full text-[11px] font-bold">Open</a></div>)}{notes.length === 0 && <div className="space-y-2">{['DBMS - Unit 1 Notes', 'OS - PYQ 2023', 'CN - Important Questions', 'DAA - Handwritten Notes'].map((t) => <div key={t} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><p className="font-bold text-[13px]">{t}</p><button className="px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[11px]">View</button></div>)}</div>}</div>}

        {tab === 'market' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🛒 Campus Marketplace — Books, calculators, used items</p></div>{market.map((m: any) => <div key={m.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><div className="w-full h-28 bg-white/10 rounded-[12px] flex items-center justify-center">📦 {m.item}</div><p className="font-bold text-[13px] mt-2">{m.title} - ₹{m.price}</p><p className="text-[11px] text-white/40">{m.condition} • by {m.sellerName} • {m.branch}</p><button className="mt-2 w-full py-2 bg-white text-black rounded-full font-bold text-[12px]">DM to Buy</button></div>)}{market.length === 0 && <p className="text-center py-16 text-white/20">No items - Sell books, calculators</p>}</div>}

        {tab === 'lost' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🔎 Lost & Found — Campus lo dorikina/missing items</p></div>{lost.map((l: any) => <div key={l.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{l.status === 'Found' ? '✅ Found:' : '❌ Lost:'} {l.item}</p><p className="text-[11px] text-white/40">{l.location} • {l.date} • by {l.reportedBy} • {l.branch}</p><p className="text-[11px] mt-1">{l.desc}</p></div>)}{lost.length === 0 && <p className="text-center py-16 text-white/20">No lost items - Report here</p>}</div>}

        {tab === 'polls' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">📊 Campus Polls — Students voting</p></div>{polls.map((p: any) => <div key={p.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">{p.question}</p><div className="mt-3 space-y-2">{(p.options || []).map((opt: string, i: number) => <button key={i} className="w-full text-left bg-black border border-white/10 rounded-[12px] p-3 text-[12px] flex justify-between"><span>{opt}</span><span className="text-white/40">{p.votes?.[i] || 0} votes</span></button>)}</div></div>)}{polls.length === 0 && <div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold text-[13px]">Best fest theme?</p><div className="mt-3 space-y-2"><button className="w-full text-left bg-black border border-white/10 rounded-[12px] p-3 text-[12px]">Retro - 45 votes</button><button className="w-full text-left bg-black border border-white/10 rounded-[12px] p-3 text-[12px]">Futuristic - 32 votes</button></div></div>}</div>}

        {tab === 'profiles' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">👤 Student Profiles — Branch, year, interests, skills</p></div>{students.map((s: any) => <div key={s.id} className="bg-white/5 border border-white/10 rounded-[20px] p-4"><div className="flex gap-3"><img src={s.photoURL} className="w-14 h-14 rounded-full" alt="" /><div><p className="font-bold text-[14px]">{s.name}</p><p className="text-[11px] text-white/40">{s.branch} • {s.year} • {s.rollNumber}</p><p className="text-[11px] text-white/60 mt-1">Skills: {s.skills}</p><p className="text-[10px] text-white/30">Interests: {s.interests}</p></div></div><p className="text-[11px] mt-3 bg-black border border-white/10 rounded-[10px] p-2">{s.bio}</p></div>)}</div>}

        {tab === 'skills' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">💡 Skill Connect — Similar skills/projects ni connect</p></div>{students.filter((s: any) => s.skills?.includes('React') || s.skills?.includes('AI')).slice(0, 5).map((s: any) => <div key={s.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex justify-between"><div className="flex gap-3"><img src={s.photoURL} className="w-10 h-10 rounded-full" alt="" /><div><p className="font-bold text-[12px]">{s.name} • {s.skills}</p><p className="text-[10px] text-white/40">Looking for project partner</p></div></div><button className="px-4 py-1.5 bg-white text-black rounded-full text-[11px] font-bold h-fit">Connect</button></div>)}</div>}

                {tab === 'senior' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🎓 Senior Help — Juniors questions → seniors answers</p><p className="text-[11px] text-white/40">Ask doubts - Seniors reply</p></div>{posts.filter((p: any) => p.text?.includes('?')).map((p: any) => <div key={p.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="text-[13px]">Q: {p.text}</p><p className="text-[11px] text-white/40 mt-1">by {p.name} • {p.branch} junior</p><div className="mt-3 bg-black border border-white/10 rounded-[12px] p-3"><p className="text-[11px]"><span className="font-bold text-green-400">Senior Answer:</span> Check DBMS notes in Notes section - Unit 3 important</p></div></div>)}{posts.filter((p: any) => p.text?.includes('?')).length === 0 && <div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="text-[13px]">Q: How to prepare for DBMS exam?</p><p className="text-[11px] text-white/40">by CSE 2nd year</p><div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-[12px] p-3"><p className="text-[11px]"><span className="font-bold text-green-400">Senior (4th year) Answer:</span> Focus on Normalization + PYQ 2022,2023 - Easy 40 marks</p></div></div>}</div>}

        {tab === 'leaderboard' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🏆 College Leaderboard — Helpful students / active clubs</p></div>{leaderboard.map((l: any, i: number) => <div key={l.id} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex gap-3"><span className="font-black text-[18px]">{i + 1}</span><img src={l.photoURL} className="w-10 h-10 rounded-full" alt="" /><div><p className="font-bold text-[13px]">{l.name} • {l.points} pts</p><p className="text-[11px] text-white/40">{l.reason} • {l.branch}</p></div></div>)}{leaderboard.length === 0 && <div className="space-y-2">{[{ name: 'Anesh • CSE', points: 245, reason: 'Most helpful in Senior Help' }, { name: 'CodeX Club', points: 180, reason: 'Most active club' }, { name: 'Priya • ECE', points: 150, reason: 'Shared 20 PYQs' }].map((l, i) => <div key={i} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex gap-3"><span className="font-black text-[18px]">{i + 1}</span><div><p className="font-bold text-[13px]">{l.name} • {l.points} pts</p><p className="text-[11px] text-white/40">{l.reason}</p></div></div>)}</div>}</div>}

        {tab === 'memes' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">😂 Campus Memes — College-specific entertainment</p></div>{memes.map((m: any) => <div key={m.id} className="bg-white/5 border border-white/10 rounded-[20px] p-0 overflow-hidden"><div className="w-full h-64 bg-white/10 flex items-center justify-center text-[32px]">😂</div><div className="p-3"><p className="text-[13px]">{m.text || 'When attendance is 74.9% 😭'}</p><p className="text-[10px] text-white/30 mt-1">by {m.name} • {m.likes || 120} likes</p></div></div>)}{memes.length === 0 && <div className="bg-white/5 border border-white/10 rounded-[20px] p-0 overflow-hidden"><div className="w-full h-64 bg-white/5 flex items-center justify-center flex-col"><p className="text-[40px]">😭</p><p className="text-[14px] font-bold mt-2">When professor says attendance is 75% mandatory</p></div><div className="p-3"><p className="text-[12px]">Me in last bench • 234 likes • CSE Memes</p></div></div>}</div>}

        {tab === 'notices' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">📢 Digital Notice Board — Important college updates</p></div>{notices.map((n: any) => <div key={n.id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-[16px] p-4"><p className="font-bold text-[13px]">📌 {n.title}</p><p className="text-[11px] text-white/60 mt-1">{n.desc}</p><p className="text-[10px] text-white/30 mt-2">{n.date} • by {n.postedBy || 'Admin'}</p></div>)}{notices.length === 0 && <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-[16px] p-4"><p className="font-bold text-[13px]">📌 Exam Fee Last Date Extended</p><p className="text-[11px] text-white/60 mt-1">Last date extended to 20th May - Pay before 5PM</p></div>}</div>}

        {tab === 'chat' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">💬 DM / Chat — Students madhya direct messaging</p></div>{students.slice(0, 8).map((s: any) => <div key={s.id} className="bg-white/5 border border-white/10 rounded-[16px] p-3 flex justify-between items-center"><div className="flex gap-3 items-center"><img src={s.photoURL} className="w-10 h-10 rounded-full" alt="" /><div><p className="font-bold text-[12px]">{s.name}</p><p className="text-[10px] text-white/40">{s.branch} • Active now</p></div></div><button className="px-4 py-1.5 bg-white text-black rounded-full text-[11px] font-bold">Message</button></div>)}</div>}

        {tab === 'notifs' && <div className="space-y-2"><div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🔔 Notifications — Likes, comments, follows, events</p></div>{notifs.map((n: any) => <div key={n.id} className="bg-white/5 border border-white/10 rounded-[16px] p-3"><p className="text-[12px]">{n.text}</p><p className="text-[10px] text-white/30 mt-1">Just now • {n.type}</p></div>)}{notifs.length === 0 && <p className="text-center py-16 text-white/20">No notifications</p>}</div>}

        {tab === 'search' && (
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-[16px] p-4"><p className="font-bold">🔎 Search — Students, posts, clubs, events before features thisey</p><input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search students, posts, clubs, events..." className="w-full mt-3 p-3 bg-black border border-white/10 rounded-[12px] text-[12px]" /></div>
            {searchQ && (
              <>
                <p className="font-bold text-[12px]">Results for "{searchQ}"</p>
                {students.filter((s: any) => s.name?.toLowerCase().includes(searchQ.toLowerCase()) || s.branch?.toLowerCase().includes(searchQ.toLowerCase())).map((s: any) => <div key={s.id} className="bg-white/5 border border-white/10 rounded-[16px] p-3 flex gap-3"><img src={s.photoURL} className="w-10 h-10 rounded-full" alt="" /><div><p className="font-bold text-[12px]">{s.name}</p><p className="text-[10px] text-white/40">{s.branch} • {s.skills}</p></div></div>)}
                {posts.filter((p: any) => p.text?.toLowerCase().includes(searchQ.toLowerCase())).map((p: any) => <div key={p.id} className="bg-white/5 border border-white/10 rounded-[16px] p-3"><p className="text-[12px]">{p.text}</p><p className="text-[10px] text-white/30">Post by {p.name}</p></div>)}
              </>
            )}
            {!searchQ && <p className="text-center py-16 text-white/20">Search students, posts, clubs, events - Type above</p>}
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10"><div className="max-w-[600px] mx-auto flex justify-around h-[64px] items-center"><button onClick={() => setTab('home')} className={`flex flex-col items-center ${tab === 'home' ? 'opacity-100' : 'opacity-40'}`}><span>🏠</span><span className="text-[8px] font-bold">Feed</span></button><button onClick={() => setTab('explore')} className={`flex flex-col items-center ${tab === 'explore' ? 'opacity-100' : 'opacity-40'}`}><span>🔍</span><span className="text-[8px]">Explore</span></button><button onClick={() => setTab('clubs')} className="w-10 h-10 bg-white text-black rounded-full font-black">+</button><button onClick={() => setTab('chat')} className={`flex flex-col items-center ${tab === 'chat' ? 'opacity-100' : 'opacity-40'}`}><span>💬</span><span className="text-[8px]">Chat</span></button><button onClick={() => setTab('profiles')} className={`flex flex-col items-center ${tab === 'profiles' ? 'opacity-100' : 'opacity-40'}`}><span>👤</span><span className="text-[8px]">Profile</span></button></div></div>
      <div className="w-full py-6 flex justify-center border-t border-white/10 mt-6"><p className="text-[10px] tracking-widest text-white/20">© 2026 Campus Social • ANESH • Final 18 Features</p></div>
    </div>
  );
}
        
