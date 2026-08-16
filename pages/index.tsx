import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut, getRedirectResult } from "firebase/auth";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, doc, getDoc, setDoc, updateDoc, where, getDocs, serverTimestamp, increment, deleteDoc, limit, arrayUnion, arrayRemove } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Home, Search, Bell, User, Plus, Flame, Star, Award, Edit, Save, MessageCircle, Heart, Share2, BookOpen, Rocket, Users, LogOut, Bookmark, Trophy, Camera, Trash2, Users2, X, Video, Calendar } from "lucide-react";
import { toast, Toaster } from "sonner";

// ===== FIREBASE CONFIG =====
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ===== HELPERS =====
export const updateStreak = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if(!userSnap.exists()) return;
  const data = userSnap.data() as any;
  const today = new Date().toDateString();
  const lastActive = data.lastActive?.toDate().toDateString();
  if(lastActive!== today) {
    const newStreak = lastActive === new Date(Date.now() - 86400000).toDateString()? (data.streak || 0) + 1 : 1;
    await updateDoc(userRef, { streak: newStreak, lastActive: serverTimestamp(), growthScore: increment(3) });
    checkAchievements(uid, {...data, streak: newStreak});
  }
}

export const checkAchievements = async (uid: string, data: any) => {
  let newBadges = data.achievements || [];
  if(!newBadges.includes("First Post") && data.postsCount > 0) newBadges.push("First Post");
  if(!newBadges.includes("100 Followers") && data.followersCount >= 100) newBadges.push("100 Followers");
  if(!newBadges.includes("7-Day Streak") && data.streak >= 7) newBadges.push("7-Day Streak");
  if(!newBadges.includes("Top Contributor") && data.growthScore >= 500) newBadges.push("Top Contributor");
  if(newBadges.length > (data.achievements || []).length) {
    await updateDoc(doc(db, "users", uid), { achievements: newBadges });
    toast(`🏆 New Badge: ${newBadges[newBadges.length-1]}`);
  }
}

// ===== MAIN APP =====
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState("feed");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).then(() => {});
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if(currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid, name: currentUser.displayName || "User", username: currentUser.email?.split("@")[0] || currentUser.uid,
            photoURL: currentUser.photoURL, bio: "", goal: "", learning: "", skills: [], endorsements: {}, projects: [],
            growthScore: 0, futureScore: 0, streak: 0, followersCount: 0, followingCount: 0, postsCount: 0,
            achievements: [], savedPosts: [], lastActive: serverTimestamp()
          });
        }
        updateStreak(currentUser.uid);
        const q = query(collection(db, "notifications"), where("toUserId", "==", currentUser.uid), orderBy("createdAt", "desc"), limit(20));
        onSnapshot(q, (snap) => { setNotifications(snap.docs.map(d => ({ id: d.id,...d.data() as any }))) });
        const q2 = query(collection(db, "users"), orderBy("growthScore", "desc"), limit(10));
        onSnapshot(q2, (snap) => setLeaderboard(snap.docs.map(d => ({ id: d.id,...d.data() as any }))));
      }
    });
    return () => unsubAuth();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      toast("Login Successful!")
    } catch (error: any) {
      if(error.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, new GoogleAuthProvider())
      } else {
        toast("Login Failed: " + error.message)
      }
    }
  };
  const handleLogout = async () => { await signOut(auth); setUser(null) };
  const markRead = async (id: string) => { await updateDoc(doc(db, "notifications", id), { read: true }) };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <Toaster position="top-right" />
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-500">NEXORA</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowLeaderboard(true)} className="p-2 hover:bg-gray-800 rounded-full"><Trophy /></button>
            <div className="relative">
              {user && <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-gray-800 rounded-full"><Bell /></button>}
              {user && notifications.filter(n =>!n.read).length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">{notifications.filter(n =>!n.read).length}</span>}
              {showNotifications && <div className="absolute right-0 mt-2 w-80 bg-gray-900 border-gray-800 rounded-lg p-2 max-h-96 overflow-y-auto">{notifications.map(n => <div key={n.id} onClick={() => {markRead(n.id); setShowNotifications(false)}} className="p-2 hover:bg-gray-800 rounded cursor-pointer"><p className="text-sm">{n.text}</p></div>)}</div>}
            </div>
          </div>
        </div>
      </header>

      {showLeaderboard && <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"><div className="bg-gray-900 p-6 rounded-xl w-96"><div className="flex justify-between"><h2 className="text-xl font-bold">🏆 Weekly Leaderboard</h2><X onClick={() => setShowLeaderboard(false)} className="cursor-pointer"/></div>{leaderboard.map((u, i) => <div key={u.id} className="flex items-center gap-3 mt-3"><span className="font-bold">{i+1}</span><img src={u.photoURL} className="w-8 h-8 rounded-full"/><span>{u.name}</span><span className="ml-auto text-yellow-400">{u.growthScore}</span></div>)}</div></div>}

      {user && <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-gray-800"><div className="max-w-6xl mx-auto px-4 flex justify-around"><button onClick={() => setTab("feed")} className={`py-3 ${tab === "feed"? "text-blue-500" : "text-gray-400"}`}><Home size={24} /></button><button onClick={() => setTab("reels")} className={`py-3 ${tab === "reels"? "text-blue-500" : "text-gray-400"}`}><Video size={24} /></button><button onClick={() => setTab("search")} className={`py-3 ${tab === "search"? "text-blue-500" : "text-gray-400"}`}><Search size={24} /></button><button onClick={() => setTab("events")} className={`py-3 ${tab === "events"? "text-blue-500" : "text-gray-400"}`}><Calendar size={24} /></button><button onClick={() => setTab("collab")} className={`py-3 ${tab === "collab"? "text-blue-500" : "text-gray-400"}`}><Users2 size={24} /></button><button onClick={() => setTab("messages")} className={`py-3 ${tab === "messages"? "text-blue-500" : "text-gray-400"}`}><MessageCircle size={24} /></button><button onClick={() => setTab("profile")} className={`py-3 ${tab === "profile"? "text-blue-500" : "text-gray-400"}`}><User size={24} /></button></div></nav>}

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!user && <div className="text-center py-20"><h2 className="text-4xl font-bold">Welcome to NEXORA</h2><p className="opacity-70 mt-2">Build. Learn. Grow Together.</p><button onClick={handleLogin} className="mt-6 bg-blue-500 px-6 py-3 rounded-lg">Login with Google</button></div>}
        {user && tab === "feed" && <FeedTab user={user} />}
        {user && tab === "reels" && <ReelsTab user={user} />}
        {user && tab === "search" && <SearchTab user={user} />}
        {user && tab === "events" && <EventsTab user={user} />}
        {user && tab === "collab" && <CollabTab user={user} />}
        {user && tab === "messages" && <MessagesTab user={user} />}
        {user && tab === "profile" && <ProfileTab user={user} onLogout={handleLogout} />}
      </main>
    </div>
  );
}

// ===== FEED TAB =====
function FeedTab({user}: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [feedType, setFeedType] = useState<"growth" | "personalized" | "latest" | "trending">("growth");
  const [following, setFollowing] = useState<string[]>([]);
  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postVideo, setPostVideo] = useState<File | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const storyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const q = query(collection(db, "follows"), where("followerId", "==", user.uid)); return onSnapshot(q, (snap) => setFollowing(snap.docs.map(d => d.data().followingId))); }, [user]);
  useEffect(() => { const q = query(collection(db, "stories"), where("createdAt", ">", new Date(Date.now() - 86400000))); return onSnapshot(q, (snap) => setStories(snap.docs.map(d => ({ id: d.id,...d.data() as any })))); }, []);
  useEffect(() => { let q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50)); return onSnapshot(q, (snap) => { let allPosts: any[] = snap.docs.map((d) => ({ id: d.id,...d.data() as any })); if(feedType === "personalized" && following.length > 0) allPosts = allPosts.filter(p => [...following, user?.uid].includes(p.userId)); if(feedType === "trending") allPosts = allPosts.sort((a, b) => (b.likes?.length || 0) + (b.shares || 0)*2 - (a.likes?.length || 0) - (a.shares || 0)*2).slice(0, 20); if(feedType === "growth") allPosts = allPosts.filter(p => p.text?.includes("#Learning") || p.text?.includes("#Startup")); setPosts(allPosts); }) }, [following, user, feedType]);

  const handleCreatePost = async () => {
    if(!newPost.trim() &&!postImage &&!postVideo) return;
    let mediaUrl = ""; let mediaType = "image";
    if(postVideo) { const storageRef = ref(storage, `videos/${Date.now()}-${postVideo.name}`); const snap = await uploadBytes(storageRef, postVideo); mediaUrl = await getDownloadURL(snap.ref); mediaType = "video"; }
    else if(postImage) { const storageRef = ref(storage, `posts/${Date.now()}-${postImage.name}`); const snap = await uploadBytes(storageRef, postImage); mediaUrl = await getDownloadURL(snap.ref); }
    await addDoc(collection(db, "posts"), { userId: user.uid, userName: user.displayName, userPhoto: user.photoURL, text: newPost, media: mediaUrl, mediaType, likes: [], comments: [], shares: 0, createdAt: serverTimestamp() });
    await updateDoc(doc(db, "users", user.uid), { postsCount: increment(1), growthScore: increment(10) });
    setNewPost(""); setPostImage(null); setPostVideo(null); toast("Posted!");
  };

  const handleAddStory = async (e: any) => { const file = e.target.files[0]; if(!file) return; const storageRef = ref(storage, `stories/${Date.now()}-${file.name}`); const snap = await uploadBytes(storageRef, file); const url = await getDownloadURL(snap.ref); await addDoc(collection(db, "stories"), { userId: user.uid, userName: user.displayName, userPhoto: user.photoURL, image: url, createdAt: serverTimestamp() }); toast("Story added!") };

  return (
    <div>
      <div className="flex gap-3 mb-4 overflow-x-auto pb-2"><div onClick={() => storyInputRef.current?.click()} className="w-16 h-20 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer"><Plus /></div><input ref={storyInputRef} type="file" accept="image/*" onChange={handleAddStory} className="hidden"/>{stories.map(s => <div key={s.id} className="w-16 h-20 rounded-lg overflow-hidden"><img src={s.image} className="w-full h-full object-cover"/></div>)}</div>
      <div className="flex gap-2 mb-6 bg-gray-900 p-1 rounded-lg overflow-x-auto"><button onClick={() => setFeedType("growth")} className={`px-4 py-2 rounded ${feedType === "growth"? "bg-green-500 font-bold" : "opacity-70"}`}>📈 Growth</button><button onClick={() => setFeedType("personalized")} className={`px-4 py-2 rounded ${feedType === "personalized"? "bg-blue-500 font-bold" : "opacity-70"}`}>Personalized</button><button onClick={() => setFeedType("latest")} className={`px-4 py-2 rounded ${feedType === "latest"? "bg-blue-500 font-bold" : "opacity-70"}`}>Latest</button><button onClick={() => setFeedType("trending")} className={`px-4 py-2 rounded ${feedType === "trending"? "bg-blue-500 font-bold" : "opacity-70"}`}>Trending 🔥</button></div>
      <div className="border rounded-xl p-4 mb-6 bg-gray-900 border-gray-800"><textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share your #Learning #Achievement..." className="w-full bg-gray-800 p-3 rounded-lg outline-none" rows={3} /><div className="flex justify-between mt-3 gap-2"><input type="file" onChange={e => setPostImage(e.target.files?.[0] || null)} accept="image/*" /><input type="file" onChange={e => setPostVideo(e.target.files?.[0] || null)} accept="video/*" /><button onClick={handleCreatePost} className="bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2"><Plus /> Post</button></div></div>
      {posts.map(post => <PostCard key={post.id} post={post} user={user} />)}
    </div>
  );
}

// ===== REELS TAB =====
// ===== REELS TAB WITH AUTO-PLAY FIXED =====
// ===== REELS TAB WITH AUTO-PLAY FIXED =====
function ReelsTab({user}: any) {
  const [reels, setReels] = useState<any[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => { 
    const q = query(collection(db, "posts"), where("mediaType", "==", "video"), orderBy("createdAt", "desc"), limit(20)); 
    return onSnapshot(q, (snap) => setReels(snap.docs.map(d => ({ id: d.id,...d.data() as any })))) 
  }, []);

  const handleScroll = () => { 
    videoRefs.current.forEach((video) => { 
      if(!video) return;
      const rect = video.getBoundingClientRect(); 
      const inView = rect.top >= -100 && rect.bottom <= window.innerHeight + 100; 
      if(inView) {
        video.play().catch(() => {}); 
      } else {
        video.pause(); 
      }
    }) 
  }

  const handleLike = async (postId: string, likes: string[]) => { 
    const isLiked = likes?.includes(user.uid); 
    const newLikes = isLiked? likes.filter((id: string) => id!== user.uid) : [...(likes || []), user.uid]; 
    await updateDoc(doc(db, "posts", postId), { likes: newLikes }); 
  };

  return (
    <div className="h-[80vh] overflow-y-scroll snap-y snap-mandatory" onScroll={handleScroll}>
      {reels.map((reel, index) => (
        <div key={reel.id} className="h-[80vh] w-full flex items-center justify-center snap-start relative bg-black">
          <video 
            ref={(el: HTMLVideoElement | null) => { videoRefs.current[index] = el }}
            src={reel.media} 
            loop 
            muted 
            playsInline 
            className="h-full w-full object-contain" 
          />
          <div className="absolute bottom-20 left-4 flex items-center gap-3">
            <img src={reel.userPhoto} className="w-10 h-10 rounded-full border-2 border-white"/>
            <div><p className="font-bold">{reel.userName}</p><p className="text-sm">{reel.text}</p></div>
          </div>
          <div className="absolute bottom-20 right-4 flex-col gap-4 text-white">
            <button onClick={() => handleLike(reel.id, reel.likes)} className="flex flex-col items-center">
              <Heart size={28} className={reel.likes?.includes(user.uid)? "fill-red-500 text-red-500" : ""}/>
              <span>{reel.likes?.length || 0}</span>
            </button>
            <button className="flex flex-col items-center"><MessageCircle size={28}/></button>
            <button className="flex flex-col items-center"><Share2 size={28}/></button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ===== POST CARD WITH EDIT + REPLY =====
function PostCard({post, user}: any) {
  const [likes, setLikes] = useState(post.likes || []);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);

  useEffect(() => { getDoc(doc(db, "users", user.uid)).then(d => setSaved(d.data()?.savedPosts?.includes(post.id))) }, [user, post.id]);

  const handleLike = async () => { const isLiked = likes.includes(user.uid); const newLikes = isLiked? likes.filter((id: string) => id!== user.uid) : [...likes, user.uid]; setLikes(newLikes); await updateDoc(doc(db, "posts", post.id), { likes: newLikes }); };
  const handleSave = async () => { await updateDoc(doc(db, "users", user.uid), { savedPosts: saved? arrayRemove(post.id) : arrayUnion(post.id) }); setSaved(!saved); toast(saved? "Removed from bookmarks" : "Saved!") };
  const handleDelete = async () => { if(confirm("Delete this post?")) { await deleteDoc(doc(db, "posts", post.id)); toast("Deleted") } };
  const handleEditSave = async () => { await updateDoc(doc(db, "posts", post.id), { text: editText }); setIsEditing(false); toast("Post updated!") };

  const handleComment = async () => { if(!commentText.trim()) return; const newComment = { id: Date.now().toString(), userId: user.uid, userName: user.displayName, userPhoto: user.photoURL, text: commentText, replies: [], createdAt: new Date() }; await updateDoc(doc(db, "posts", post.id), { comments: arrayUnion(newComment) }); setCommentText(""); };
  const handleReply = async (commentId: string) => { if(!replyText.trim()) return; const updatedComments = (post.comments || []).map((c: any) => c.id === commentId? {...c, replies: [...(c.replies || []), { userId: user.uid, userName: user.displayName, text: replyText, createdAt: new Date() }]} : c); await updateDoc(doc(db, "posts", post.id), { comments: updatedComments }); setReplyText(""); setReplyingTo(null); };

  return (
    <div className="border rounded-xl p-4 mb-4 bg-gray-900 border-gray-800">
      <div className="flex items-center gap-3"><img src={post.userPhoto} className="w-10 h-10 rounded-full" /><p className="font-bold">{post.userName}</p>{post.userId === user.uid && <div className="ml-auto flex gap-2"><button onClick={() => setIsEditing(!isEditing)} className="text-blue-400"><Edit size={16}/></button><button onClick={handleDelete} className="text-red-500"><Trash2 size={16}/></button></div>}</div>
      {isEditing? (<div className="mt-3"><textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-gray-800 p-2 rounded" rows={3}/><div className="flex gap-2 mt-2"><button onClick={handleEditSave} className="bg-green-500 px-3 py-1 rounded">Save</button><button onClick={() => setIsEditing(false)} className="bg-gray-700 px-3 py-1 rounded">Cancel</button></div></div>) : (<p className="mt-3 whitespace-pre-wrap">{post.text}</p>)}
      {post.media && post.mediaType === "image" && <img src={post.media} className="mt-3 rounded-lg w-full" />}
      {post.media && post.mediaType === "video" && <video src={post.media} controls className="mt-3 rounded-lg w-full" />}
      <div className="flex gap-4 mt-3 border-t border-gray-800 pt-3"><button onClick={handleLike} className="flex items-center gap-1"><Heart className={likes.includes(user.uid)? "fill-red-500 text-red-500" : ""} /> {likes.length}</button><button onClick={handleSave} className="flex items-center gap-1"><Bookmark className={saved? "fill-blue-500 text-blue-500" : ""} /></button><button className="flex items-center gap-1"><Share2 /> {post.shares || 0}</button></div>
      <div className="mt-3 space-y-3">{post.comments?.map((c: any) => (<div key={c.id} className="bg-gray-800 p-3 rounded"><div className="flex gap-2"><img src={c.userPhoto} className="w-8 h-8 rounded-full"/><div className="flex-1"><b>{c.userName}:</b> {c.text}<button onClick={() => setReplyingTo(c.id)} className="text-xs text-blue-400 ml-2">Reply</button><div className="ml-4 mt-2 space-y-1">{c.replies?.map((r: any, i: number) => <div key={i} className="text-sm bg-gray-900 p-2 rounded"><b>{r.userName}:</b> {r.text}</div>)}</div>{replyingTo === c.id && <div className="flex gap-2 mt-2"><input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write reply..." className="flex-1 bg-gray-900 p-2 rounded text-sm" /><button onClick={() => handleReply(c.id)} className="bg-blue-500 px-3 rounded text-sm">Reply</button></div>}</div></div></div>))}<div className="flex gap-2"><input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add comment..." className="flex-1 bg-gray-800 p-2 rounded" /><button onClick={handleComment} className="bg-blue-500 px-3 rounded">Send</button></div></div>
    </div>
  )
}

// ===== SEARCH TAB =====
function SearchTab({user}: any) {
  const [users, setUsers] = useState<any[]>([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { const fetchUsers = async () => { try { setLoading(true); const snapshot = await getDocs(collection(db, "users")); let allUsers = snapshot.docs.map((doc) => ({ id: doc.id,...doc.data() as any })).filter(u => u.uid!== user?.uid); if(search) { allUsers = allUsers.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || (u.skills || []).join(" ").toLowerCase().includes(search.toLowerCase()) || u.goal?.toLowerCase().includes(search.toLowerCase())); } setUsers(allUsers); } catch(e) { toast("Users load cheyaleka poyam"); } finally { setLoading(false); } }; fetchUsers(); }, [user, search]); if(loading) return <p className="text-center mt-10">Loading users...</p>;
  return (<div><h1 className="text-2xl font-bold mb-4">🔍 Search Friends</h1><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Name, Skill, Goal..." className="w-full bg-gray-900 p-3 rounded-lg mb-4 border-gray-800" />{users.length === 0 && <p className="text-center opacity-70 mt-10">No users found yet</p>}<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{users.map((u) => <UserCard key={u.id} u={u} user={user} />)}</div></div>);
}

function UserCard({u, user}: any) {
  const [isFollowing, setIsFollowing] = useState(false); const [myProfile, setMyProfile] = useState<any>(null);
  useEffect(() => { getDoc(doc(db, "users", user.uid)).then(d => setMyProfile(d.data())); const q = query(collection(db, "follows"), where("followerId", "==", user.uid), where("followingId", "==", u.uid)); const unsub = onSnapshot(q, snap => setIsFollowing(!snap.empty)); return () => unsub(); }, [user, u.uid]);
  const isGoalMatch = myProfile?.goal && u.goal && myProfile.goal === u.goal;
  const toggleFollow = async () => { const followRef = doc(db, "follows", `${user.uid}_${u.uid}`); if(isFollowing) {await deleteDoc(followRef)} else {await setDoc(followRef, { followerId: user.uid, followingId: u.uid, createdAt: serverTimestamp() })} setIsFollowing(!isFollowing); };
  const handleDM = async () => { const roomId = [user.uid, u.uid].sort().join("_"); await setDoc(doc(db, "dm_rooms", roomId), { participants: [user.uid, u.uid], lastMessage: "", updatedAt: serverTimestamp() }, {merge: true}); toast(`Chat with ${u.name}`); };
  const handleEndorse = async (skill: string) => { await updateDoc(doc(db, "users", u.uid), { [`endorsements.${skill}`]: increment(1) }); toast(`Endorsed ${skill}`) };
  return <div className="border p-4 rounded-lg bg-gray-900 border-gray-800"><div className="flex items-center gap-3"><img src={u.photoURL || "/default.png"} className="w-12 h-12 rounded-full" /><div className="flex-1"><p className="font-bold">{u.name || "No Name"}</p><p className="text-xs opacity-70">⭐ {u.futureScore || 0}</p>{u.goal && <p className="text-xs text-blue-400">🎯 {u.goal}</p>}{isGoalMatch && <span className="text-xs bg-green-500/20 text-green-400 px-2 rounded-full">🤝 Goal Match</span>}</div><div className="flex gap-2"><button onClick={toggleFollow} className={`px-4 py-2 rounded-lg ${isFollowing? "bg-gray-700" : "bg-blue-500"}`}>{isFollowing? "Following" : "Follow"}</button>{isGoalMatch && <button onClick={handleDM} className="px-4 py-2 rounded-lg bg-green-500">DM</button>}</div></div><div className="flex gap-2 flex-wrap mt-3">{u.skills?.map((s: string) => <button key={s} onClick={() => handleEndorse(s)} className="bg-blue-500/20 px-3 py-1 rounded-full text-sm">🏷️ {s} {u.endorsements?.[s] || 0}</button>)}</div></div>
      }

// ===== COLLAB TAB =====
function CollabTab({user}: any) {
  const [collabs, setCollabs] = useState<any[]>([]); const [newCollab, setNewCollab] = useState("");
  useEffect(() => { const q = query(collection(db, "collabs"), orderBy("createdAt", "desc")); return onSnapshot(q, snap => setCollabs(snap.docs.map(d => ({ id: d.id,...d.data() as any })))); }, []);
  const postCollab = async () => { if(!newCollab.trim()) return; await addDoc(collection(db, "collabs"), { userId: user.uid, userName: user.displayName, text: newCollab, createdAt: serverTimestamp() }); setNewCollab(""); toast("Collab posted!") };
  return (<div><h1 className="text-2xl font-bold mb-4">🤝 Collab Finder</h1><div className="border p-4 rounded bg-gray-900 mb-4"><textarea value={newCollab} onChange={e => setNewCollab(e.target.value)} placeholder="I need a React dev for my AI startup..." className="w-full bg-gray-800 p-2 rounded" /><button onClick={postCollab} className="mt-2 bg-blue-500 px-4 py-2 rounded">Post</button></div>{collabs.map(c => <div key={c.id} className="border p-4 rounded bg-gray-900 mb-2"><b>{c.userName}</b><p>{c.text}</p></div>)}</div>);
}

// ===== EVENTS TAB =====
function EventsTab({user}: any) {
  const [events, setEvents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({title: "", desc: "", date: "", location: ""});

  useEffect(() => { const q = query(collection(db, "events"), orderBy("date", "asc")); return onSnapshot(q, snap => setEvents(snap.docs.map(d => ({ id: d.id,...d.data() as any })))) }, []);

  const createEvent = async () => { await addDoc(collection(db, "events"), {...newEvent, createdBy: user.uid, attendees: [user.uid], createdAt: serverTimestamp()}); setShowForm(false); setNewEvent({title: "", desc: "", date: "", location: ""}); toast("Event Created!") }
  const joinEvent = async (eventId: string) => { await updateDoc(doc(db, "events", eventId), { attendees: arrayUnion(user.uid) }); toast("Joined Event!") }

  return (
    <div>
      <div className="flex justify-between mb-4"><h1 className="text-2xl font-bold">📅 Events & Meetups</h1><button onClick={() => setShowForm(true)} className="bg-blue-500 px-4 py-2 rounded">+ Create Event</button></div>
      {showForm && <div className="border p-4 rounded bg-gray-900 mb-4 space-y-2"><input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Event Title" className="w-full bg-gray-800 p-2 rounded" /><input value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} placeholder="Location - Ex: Adoni, AP" className="w-full bg-gray-800 p-2 rounded" /><input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full bg-gray-800 p-2 rounded" /><textarea value={newEvent.desc} onChange={e => setNewEvent({...newEvent, desc: e.target.value})} placeholder="Description" className="w-full bg-gray-800 p-2 rounded" /><button onClick={createEvent} className="bg-green-500 px-4 py-2 rounded">Create</button></div>}
      {events.map(e => (<div key={e.id} className="border p-4 rounded bg-gray-900 mb-3"><h2 className="font-bold text-xl">{e.title}</h2><p className="opacity-70">{e.location} | {e.date}</p><p className="mt-2">{e.desc}</p><div className="flex justify-between mt-3"><span>{e.attendees?.length || 0} Attending</span><button onClick={() => joinEvent(e.id)} className="bg-blue-500 px-3 py-1 rounded">Join</button></div></div>))}
    </div>
  )
}

// ===== LIVE MESSAGES TAB =====
function MessagesTab({user}: any) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "dm_rooms"), where("participants", "array-contains", user.uid), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snap) => setRooms(snap.docs.map(d => ({ id: d.id,...d.data() as any }))))
  }, [user]);

  useEffect(() => {
    if(!activeRoom) return;
    const q = query(collection(db, "dm_messages"), where("roomId", "==", activeRoom.id), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({ id: d.id,...d.data() as any }))))
  }, [activeRoom]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages]);

  const sendMessage = async () => {
    if(!newMessage.trim()) return;
    await addDoc(collection(db, "dm_messages"), { roomId: activeRoom.id, senderId: user.uid, text: newMessage, createdAt: serverTimestamp() });
    await updateDoc(doc(db, "dm_rooms", activeRoom.id), { lastMessage: newMessage, updatedAt: serverTimestamp() });
    setNewMessage("")
  };

  const handleTyping = async (e: any) => {
    setNewMessage(e.target.value);
    await updateDoc(doc(db, "dm_rooms", activeRoom.id), { [`typing.${user.uid}`]: true });
    setTimeout(() => updateDoc(doc(db, "dm_rooms", activeRoom.id), { [`typing.${user.uid}`]: false }), 2000);
  }

  return (
    <div className="flex h-[70vh] border rounded-xl bg-gray-900">
      <div className="w-1/3 border-r overflow-y-auto">
        <h2 className="p-4 font-bold">Messages</h2>
        {rooms.length === 0 && <p className="p-4 opacity-70">No chats yet. Go to Search and DM someone</p>}
        {rooms.map(room =>
          <div key={room.id} onClick={() => setActiveRoom(room)} className={`p-4 cursor-pointer hover:bg-gray-800 ${activeRoom?.id === room.id? "bg-blue-500/20" : ""}`}>
            <p className="truncate">{room.lastMessage || "New Chat"}</p>
            {room.typing && Object.values(room.typing).includes(true) && <p className="text-xs text-green-400">typing...</p>}
          </div>
        )}
      </div>
      <div className="flex-1 flex-col">
        {activeRoom?
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map(m =>
                <div key={m.id} className={`mb-2 ${m.senderId === user.uid? "text-right" : ""}`}>
                  <span className={`inline-block p-2 rounded max-w-xs ${m.senderId === user.uid? "bg-blue-500" : "bg-gray-800"}`}>
                    {m.text}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 flex gap-2 border-t border-gray-800">
              <input value={newMessage} onChange={handleTyping} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type message..." className="flex-1 bg-gray-800 p-2 rounded outline-none" />
              <button onClick={sendMessage} className="bg-blue-500 px-4 rounded">Send</button>
            </div>
          </>
          :
          <div className="flex-1 flex items-center justify-center opacity-70">Select a chat to start</div>
        }
      </div>
    </div>
  )
}

// ===== PROFILE TAB =====
function ProfileTab({user, onLogout}: any) {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(""); const [username, setUsername] = useState(""); const [bio, setBio] = useState(""); const [goal, setGoal] = useState(""); const [learning, setLearning] = useState(""); const [skills, setSkills] = useState(""); const [projects, setProjects] = useState<any[]>([]); const [newProject, setNewProject] = useState({title: "", link: "", type: ""});

  useEffect(() => { getDoc(doc(db, "users", user.uid)).then(d => { if(d.exists()) { const data = d.data() as any; setProfile(data); setName(data.name); setUsername(data.username); setBio(data.bio); setGoal(data.goal); setLearning(data.learning); setSkills(data.skills?.join(", ")); setProjects(data.projects || [])} }) }, [user]);

  const handlePhotoUpload = async (e: any) => { const file = e.target.files[0]; if(!file) return; const storageRef = ref(storage, `profile/${user.uid}`); const snap = await uploadBytes(storageRef, file); const url = await getDownloadURL(snap.ref); await updateDoc(doc(db, "users", user.uid), { photoURL: url }); toast("Photo updated!") };
  const handleSave = async () => { const futureScore = (profile.growthScore || 0) + (projects.length * 10) + (profile.streak || 0) * 5; await setDoc(doc(db, "users", user.uid), { name, username, bio, goal, learning, skills: skills.split(",").map(s => s.trim()).filter(s => s), projects, futureScore }, { merge: true }); setIsEditing(false); toast("Profile Saved!") };

  return (
    <div className="border rounded-xl p-6 bg-gray-900">
      <div className="flex justify-between items-start"><div className="relative"><img src={profile?.photoURL} className="w-24 h-24 rounded-full" /><button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full"><Camera size={14}/></button><input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden"/></div><div className="flex gap-2"><button onClick={() => isEditing? handleSave() : setIsEditing(true)} className="p-2 bg-blue-500 rounded">{isEditing? <Save /> : <Edit />}</button><button onClick={onLogout} className="p-2 bg-red-500 rounded"><LogOut /></button></div></div>

      <div className="flex gap-4 my-4 flex-wrap"><div className="flex items-center gap-1 text-yellow-500"><Award size={16} /><b>{profile?.growthScore || 0}</b></div><div className="flex items-center gap-1 text-purple-500"><Star size={16} /><b>{profile?.futureScore || 0}</b></div><div className="flex items-center gap-1 text-orange-500"><Flame size={16} /><b>{profile?.streak || 0}</b></div><div className="flex items-center gap-1"><Users size={16} /><b>{profile?.followersCount || 0}</b></div></div>

      {profile?.achievements?.length > 0 && <div className="mb-4"><h3 className="font-bold mb-2">🏆 Achievements</h3><div className="flex gap-2 flex-wrap">{profile.achievements.map((b: string) => <span key={b} className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">{b}</span>)}</div></div>}

      {isEditing? (
        <div className="space-y-3 mt-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" className="w-full bg-gray-800 p-2 rounded" />
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full bg-gray-800 p-2 rounded" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" className="w-full bg-gray-800 p-2 rounded" />
          <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Your Future Goal" className="w-full bg-gray-800 p-2 rounded" />
          <input value={learning} onChange={e => setLearning(e.target.value)} placeholder="What are you learning?" className="w-full bg-gray-800 p-2 rounded" />
          <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Skills - comma separated" className="w-full bg-gray-800 p-2 rounded" />
          <div>
            <h3 className="font-bold mb-2">🚀 Projects</h3>
            <div className="flex gap-2 mb-2"><input value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="Project Name" className="flex-1 bg-gray-800 p-2 rounded" /><input value={newProject.type} onChange={e => setNewProject({...newProject, type: e.target.value})} placeholder="Type" className="w-32 bg-gray-800 p-2 rounded" /><input value={newProject.link} onChange={e => setNewProject({...newProject, link: e.target.value})} placeholder="Link" className="flex-1 bg-gray-800 p-2 rounded" /><button onClick={() => {setProjects([...projects, {...newProject, id: Date.now()}]); setNewProject({title: "", link: "", type: ""})}} className="bg-blue-500 px-3 rounded"><Plus /></button></div>
            {projects.map(p => <div key={p.id} className="bg-gray-800 p-2 rounded mb-1">{p.title} - {p.type}</div>)}
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4">{profile?.bio}</p>
          {profile?.goal && <p className="text-blue-400 font-semibold mt-2">🎯 {profile.goal}</p>}
          {profile?.learning && <p className="text-cyan-400 font-semibold flex items-center gap-1 mt-2"><BookOpen size={14}/> {profile.learning}</p>}
          <div className="flex gap-2 flex-wrap mt-3">{profile?.skills?.map((s: string) => <span key={s} className="bg-blue-500/20 px-3 py-1 rounded-full text-sm">🏷️ {s}</span>)}</div>
          <div className="mt-4">
            <h3 className="font-bold mb-2">🚀 Projects</h3>
            {projects.map(p => <a key={p.id} href={p.link} target="_blank" className="block bg-gray-800 p-2 rounded mb-1">{p.title} - {p.type}</a>)}
          </div>
        </>
      )}
    </div>
  )
                                                                                                                                                                                                                                                                                                                                                           }
