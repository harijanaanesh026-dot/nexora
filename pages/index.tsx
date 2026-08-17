import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, increment, where, arrayUnion, GeoPoint } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ArrowBigUp, Flame, Bell, User, Trash, Shield, Map, Search } from "lucide-react"; // Downvote teesam

const firebaseConfig = {
  apiKey: "AIzaSyAT91pRDQrvCzxJHzhuzZe21K06xDy0sQ4",
  authDomain: "nexoraai-75ae2.firebaseapp.com",
  projectId: "nexoraai-75ae2",
  storageBucket: "nexoraai-75ae2.firebasestorage.app",
  messagingSenderId: "173122711177",
  appId: "1:173122711177:web:68e373598d110d80c1e058",
};
const app =!getApps().length? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

const ADMIN_EMAILS = ["harijanaanesh026@gmail.com"];
const RADIUS_MILES = 5; // US Yik Yak = 5 miles
const RADIUS_KM = RADIUS_MILES * 1.609; // 8.04 km

export default function YikYakUSA() {
  const [screen, setScreen] = useState(1); // 1.Splash 2.Login 3.Feed 4.Create 5.Notif 6.Profile 7.Herdd 8.Peek 9.Map 10.Admin
  const [user, setUser] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [quickPost, setQuickPost] = useState("");
  const [peekLocation, setPeekLocation] = useState<any>(null); // NEW
  const [yakarma] = useState(Math.floor(Math.random() * 9000 + 1000)); // Anonymous ID = Yakarma
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const login = async () => {
    const res = await signInWithPopup(auth, provider);
    setUser(res.user);
    getLocation();
    setScreen(3);
  }

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Location ON chey bro")
    );
  }

  useEffect(() => {
    if(screen === 3 && location) {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => {
        const allPosts = snap.docs.map(d => ({ id: d.id,...d.data() }))
        const nearbyPosts = allPosts.filter(p => p.location && getDistance(location, p.location) <= RADIUS_KM &&!p.deleted)
        setPosts(nearbyPosts)
      })
    }
  }, [screen, location]);

  const getDistance = (loc1: any, loc2: any) => {
    const R = 6371; const dLat = (loc2.latitude - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const createPost = async (text: string, file: any = null) => {
    if(!text.trim() &&!file) return;
    let imageUrl = "";
    if(file) {
      const storageRef = ref(storage, `posts/${Date.now()}`);
      const snap = await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, "posts"), {
      text, location: new GeoPoint(location.lat, location.lng), image: imageUrl,
      score: 0, yakarma, owner: user.uid, comments: [], reports: 0, deleted: false, createdAt: serverTimestamp()
    });
    setQuickPost("");
  }

  const handleVote = async (postId: string, owner: string) => { // Only Upvote
    await updateDoc(doc(db, "posts", postId), { score: increment(1) });
    if(owner!== user.uid) await addDoc(collection(db, "notifications"), { to: owner, text: `Your yak got upvoted!`, time: serverTimestamp(), read: false });
  }

  //... handleComment, handleReport, handleDelete same

  if(screen === 1) return <Splash onNext={()=>setScreen(2)} />
  if(screen === 2) return <Login onLogin={login} />

  return (
    <div className="pb-20 bg-[#F9F9F9] text-black min-h-screen"> {/* Yik Yak White BG */}
      <h1 className="p-4 text-3xl font-black text-[#FDCB00]">yik yak</h1> {/* YELLOW LOGO */}

      {screen === 3 && <HomeFeed posts={posts} onVote={handleVote}... location={location} />}
      {screen === 4 && <CreatePostScreen onPost={createPost} />}
      {screen === 7 && <HerddScreen posts={posts.filter(p=>p.score >= 5)} onVote={handleVote}... />} {/* 5+ score */}
      {screen === 8 && <PeekScreen setPeekLocation={setPeekLocation} posts={posts} />}
      {screen === 9 && location && <MapScreen posts={posts} userLocation={location} />}

      <BottomNav screen={screen} setScreen={setScreen} isAdmin={isAdmin} />
    </div>
  )
}

// SCREEN 7: HERDD - 5+ UPVOTES
function HerddScreen({posts, onVote, onComment}: any) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Flame/> herdd</h1>
      <p className="opacity-60 text-sm">Most liked yaks in your herd</p>
      {posts.map((p: any) => <PostCard key={p.id} post={p} onVote={onVote} showDownvote={false} />)} {/* No downvote */}
    </div>
  )
}

// SCREEN 8: PEEK - VERE OORU CHUDATAM
function PeekScreen({setPeekLocation, posts}: any) {
  const cities = [{name: "New York, NY", lat: 40.7128, lng: -74.0060}, {name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437}];
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Search/> peek</h1>
      {cities.map(c => <button key={c.name} onClick={()=>setPeekLocation(c)} className="w-full p-3 bg-gray-200 rounded my-1">{c.name}</button>)}
    </div>
  )
}

function PostCard({post, onVote, showDownvote = true}: any) {
  // Yik Yak style: White card, Yellow upvote, No category
  return (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow">
      <p className="whitespace-pre-wrap">{post.text}</p>
      {post.image && <img src={post.image} className="w-full rounded mt-2"/>}
      <div className="flex gap-4 mt-3 text-gray-600">
        <button onClick={() => onVote(post.id, post.owner)} className="flex items-center gap-1 text-[#FDCB00] font-bold"><ArrowBigUp/> {post.score || 0}</button>
        {showDownvote && <button><ArrowBigDown/></button>} {/* Herdd lo undadhu */}
        <button><MessageCircle size={18}/> {post.comments?.length || 0}</button>
      </div>
    </div>
  )
}

function BottomNav({screen, setScreen, isAdmin}: any) {
  const tabs = [
    {id: 3, icon: "🏠"}, {id: 7, icon: "🔥"}, {id: 4, icon: "➕"},
    {id: 8, icon: "🔍"}, {id: 9, icon: "🗺️"}, {id: 6, icon: "👤"}
  ];
  if(isAdmin) tabs.push({id: 10, icon: "👮"});
  return (
    <div className="fixed bottom-0 w-full flex justify-around bg-white p-3 border-t">
      {tabs.map(t => <button key={t.id} onClick={() => setScreen(t.id)} className={`text-2xl ${screen === t.id? "text-[#FDCB00]" : "opacity-40"}`}>{t.icon}</button>)}
    </div>
  )
    }
