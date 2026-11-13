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

export default function CampusMain() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [tab, setTab] = useState('login');
  const [toast, setToast] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [market, setMarket] = useState<any[]>([]);
  const [lost, setLost] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [roll, setRoll] = useState('');
  const [postText, setPostText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const t = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u: any) => {
      if (u) { const snap = await getDocs(query(collection(db, 'campus_users'), where('uid', '==', u.uid))); if (snap.empty) setTab('login'); else { const d = snap.docs[0].data() as any; setUserData({ id: snap.docs[0].id, ...d }); setRoll(d.rollNumber); setTab('home'); } setUser(u); } else setTab('login');
    });
  }, []);

  useEffect(() => {
    const u = [
      onSnapshot(query(collection(db, 'campus_posts'), orderBy('createdAt', 'desc')), (s) => setPosts(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(query(collection(db, 'campus_stories'), orderBy('createdAt', 'desc')), (s) => setStories(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)).filter((x: any) => Date.now() - (x.createdAt?.seconds * 1000 || 0) < 86400000))),
      onSnapshot(collection(db, 'clubs_communities'), (s) => setClubs(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'notes_pyqs'), (s) => setNotes(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campus_marketplace'), (s) => setMarket(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'lost_found'), (s) => setLost(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
      onSnapshot(collection(db, 'campus_users'), (s) => setStudents(s.docs.map((d) => ({ id: d.id, ...d.data() } as any)))),
    ]; return () => u.forEach((x) => x());
  }, []);

  const login = async () => { if (!roll.trim()) { t('Enter Roll'); return; } const r = await signInWithPopup(auth, provider); const ex = await getDocs(query(collection(db, 'campus_users'), where('uid', '==', r.user.uid))); if (ex.empty) { await addDoc(collection(db, 'campus_users'), { uid: r.user.uid, email: r.user.email, name: r.user.displayName, photoURL: r.user.photoURL, rollNumber: roll.toUpperCase(), branch: 'CSE', year: '3rd', createdAt: serverTimestamp() }); } window.location.reload(); };
  const post = async () => { if (!postText.trim()) return; await addDoc(collection(db, 'campus_posts'), { uid: user.uid, name: userData.name, photoURL: userData.photoURL, branch: userData.branch, text: postText, likes: 0, createdAt: serverTimestamp() }); setPostText(''); t('Posted'); };
  const like = async (p: any) => { await updateDoc(doc(db, 'campus_posts', p.id), { likes: increment(1) }); };
  const add = async (col: string, data: any) => { await addDoc(collection(db, col), { ...data, uid: user.uid, name: userData.name, photoURL: userData.photoURL, branch: userData.branch, createdAt: serverTimestamp() }); setNewTitle(''); t('Added'); };

  if (tab === 'login') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&display=swap'); *{font-family:Inter}`}</style>
        <div className="w-full max-w-[360px] bg-[#111] border border-white/[0.08] rounded-[32px] p-8">
          <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-black">C</div>
          <h1 className="text-[26px] font-extrabold mt-6 tracking-tight">campus</h1>
          <p className="text-[12px] text-white/40 mt-1">Main 6 features • Simple • Premium</p>
          <input value={roll} onChange={(e) => setRoll(e.target.value.toUpperCase())} placeholder="Roll Number • 21CS101" className="w-full mt-8 h-12 bg-black border border-white/10 rounded-full px-5 text-[13px] uppercase font-semibold outline-none focus:border-white/20" />
          <button onClick={login} className="w-full mt-3 h-12 bg-white text-black rounded-full font-semibold text-[13px]">Continue</button>
        </div>
        {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-[12px] font-semibold">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&display=swap'); *{font-family:Inter} ::-webkit-scrollbar{display:none}`}</style>
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-[12px] font-semibold z-50">{toast}</div>}

      <div className="sticky top-0 bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] z-20">
        <div className="max-w-[560px] mx-auto px-5 h-14 flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center font-black text-[12px]">C</div><p className="font-bold text-[14px] tracking-tight">campus</p></div>
          <div className="flex gap-2 items-center"><img src={userData?.photoURL} className="w-7 h-7 rounded-full" alt="" /><button onClick={async () => { await signOut(auth); window.location.reload(); }} className="w-7 h-7 bg-white/10 rounded-full text-[11px]">↪</button></div>
        </div>
        <div className="max-w-[560px] mx-auto px-5 pb-3 flex gap-2">
          {[
            { id: 'home', l: 'Feed' },
            { id: 'stories', l: 'Stories' },
            { id: 'clubs', l: 'Clubs' },
            { id: 'notes', l: 'Notes' },
            { id: 'market', l: 'Market' },
            { id: 'lost', l: 'Lost' },
          ].map((x) => <button key={x.id} onClick={() => setTab(x.id)} className={`px-4 h-7 rounded-full text-[11px] font-semibold transition ${tab === x.id ? 'bg-white text-black' : 'bg-white/[0.06] text-white/40'}`}>{x.l}</button>)}
        </div>
      </div>

      <div className="max-w-[560px] mx-auto px-4 py-4 pb-24 space-y-4">

        {tab === 'home' && (
          <>
            <div className="bg-[#111] border border-white/[0.06] rounded-[24px] p-4">
              <div className="flex gap-3"><img src={userData?.photoURL} className="w-8 h-8 rounded-full" alt="" /><textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="What's happening on campus?" className="flex-1 bg-black border border-white/[0.06] rounded-[16px] p-3 text-[13px] min-h-[44px] outline-none resize-none" /></div>
              <div className="flex justify-end mt-3"><button onClick={post} className="px-5 h-8 bg-white text-black rounded-full text-[11px] font-semibold">Post</button></div>
            </div>
            {posts.map((p) => <div key={p.id} className="bg-[#111] border border-white/[0.06] rounded-[24px] p-5"><div className="flex gap-2"><img src={p.photoURL} className="w-7 h-7 rounded-full" alt="" /><p className="text-[12px] font-semibold">{p.name} <span className="text-white/30">• {p.branch}</span></p></div><p className="text-[14px] leading-5 mt-3 text-white/90">{p.text}</p><button onClick={() => like(p)} className="mt-4 h-7 px-3 bg-white/[0.06] rounded-full text-[11px]">♥ {p.likes || 0}</button></div>)}
            {posts.length === 0 && <p className="text-center py-16 text-white/20 text-[12px]">No posts yet — Be first to post</p>}
          </>
        )}

        {tab === 'stories' && (
          <div className="space-y-4">
            <div className="bg-[#111] border border-white/[0.06] rounded-[20px] p-4 flex gap-2"><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add 24h campus story..." className="flex-1 h-9 bg-black border border-white/[0.06] rounded-full px-4 text-[12px] outline-none" /><button onClick={() => add('campus_stories', { text: newTitle })} className="h-9 px-4 bg-white text-black rounded-full text-[11px] font-semibold">Add</button></div>
            <div className="flex gap-3 overflow-x-auto pb-2">{stories.map((s) => <div key={s.id} className="min-w-[60px] text-center"><div className="w-14 h-14 rounded-full bg-white p-[2px]"><img src={s.photoURL} className="w-full h-full rounded-full border-2 border-black" alt="" /></div><p className="text-[10px] mt-1 text-white/50 truncate w-[60px]">{s.name?.split(' ')[0]}</p></div>)}{stories.length === 0 && <p className="text-[11px] text-white/20">No stories — Add one</p>}</div>
            {stories.map((s) => <div key={s.id} className="bg-[#111] border border-white/[0.06] rounded-[20px] p-4"><p className="text-[13px]">{s.text}</p><p className="text-[10px] text-white/30 mt-2">{s.name} • 24h</p></div>)}
          </div>
        )}

        {tab === 'clubs' && (
          <div className="space-y-3">
            <div className="bg-[#111] border border-white/[0.06] rounded-[20px] p-4 flex gap-2"><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New club — e.g. CodeX" className="flex-1 h-9 bg-black border border-white/[0.06] rounded-full px-4 text-[12px] outline-none" /><button onClick={() => add('clubs_communities', { name: newTitle, members: 1, lead: userData.name })} className="h-9 px-4 bg-white text-black rounded-full text-[11px] font-semibold">Create</button></div>
            {clubs.map((c) => <div key={c.id} className="bg-[#111] border border-white/[0.06] rounded-[20px] p-4 flex justify-between items-center"><div><p className="text-[13px] font-semibold">{c.name}</p><p className="text-[11px] text-white/30">Members: {c.members} • Lead: {c.lead}</p></div><span className="text-[10px] bg-white/10 px-3 py-1 rounded-full">Joined</span></div>)}
            {clubs.length === 0 && <p className="text-center py-12 text-white/20 text-[12px]">No clubs — Create CSE, ECE, Coding Club</p>}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-3">
            <div className="bg-[#111] border border-white/[0.06] rounded-[20px] p-4 flex gap-2"><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="DBMS Notes / PYQ 2023" className="flex-1 h-9 bg-black border border-white/[0.06] rounded-full px-4 text-[12px] outline-none" /><button onClick={() => add('notes_pyqs', { title: newTitle, subject: 'DBMS', link: 'https://drive.google.com' })} className="h-9 px-4 bg-white text-black rounded-full text-[11px] font-semibold">Upload</button></div>
            {notes.map((n) => <div key={n.id} className="bg-[#111] border border-white/[0.06] rounded-[20px] p-4 flex justify-between"><div><p className="text-[13px] font-medium">{n.title}</p><p className="text-[11px] text-white/30">{n.subject} • by {n.name}</p></div><a href={n.link} target="_blank" className="h-7 px-3 bg-white text-black rounded-full text-[11px] font-semibold flex items-center">Open</a></div>)}
          </div>
        )}

        {tab === 'market' && (
          <div className="space-y-3">
            <div className="bg-[#111] border border-white/[0.06] rounded-[20px] p-4 flex gap-2"><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Book / Calculator for sale" className="flex-1 h-9 bg-black border border-white/[0.06] rounded-full px-4 text-[12px] outline-none" /><button onClick={() => add('campus_marketplace', { title: newTitle, price: '150' })} className="h-9 px-4 bg-white text-black rounded-full text-[11px] font-semibold">Sell</button></div>
            {market.map((m) => <div key={m.id} className="bg-[#111] border border-white/[0.06] rounded-[20px] p-4"><p className="text-[13px]">{m.title}</p><p className="text-[11px] text-white/30 mt-1">by {m.name} • ₹{m.price || 150}</p></div>)}
          </div>
        )}

        {tab === 'lost' && (
          <div className="space-y-3">
            <div className="bg-[#111] border border-white/[0.06] rounded-[20px] p-4 flex gap-2"><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Lost / Found — ID Card, Keys" className="flex-1 h-9 bg-black border border-white/[0.06] rounded-full px-4 text-[12px] outline-none" /><button onClick={() => add('lost_found', { item: newTitle, status: 'Lost' })} className="h-9 px-4 bg-white text-black rounded-full text-[11px] font-semibold">Report</button></div>
            {lost.map((l) => <div key={l.id} className="bg-[#111] border border-white/[0.06] rounded-[20px] p-4"><p className="text-[13px]">{l.status === 'Found' ? '✅' : '❌'} {l.item}</p><p className="text-[11px] text-white/30 mt-1">by {l.name} • Campus</p></div>)}
          </div>
        )}

        <div className="pt-6 flex justify-center"><p className="text-[10px] text-white/15 tracking-widest">CAMPUS • MAIN 6 • PREMIUM BLACK</p></div>
      </div>
    </div>
  );
                           }
