import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Send, LogIn, Sun, Moon, Image as ImageIcon, LogOut, Target, Users, Flame, Bell, MessageSquare, Search, Plus, Trash2, Edit, Save, X, Github, Link, Award, UserPlus, UserMinus, Hash, Bookmark, BookmarkCheck } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

import { auth, db, storage, googleProvider } from "../lib/firebaseConfig";
import { signInWithPopup, onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, where, getDocs, deleteDoc, setDoc, getDoc, increment, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// LOCALSTORAGE HELPERS
const saveToStorage = (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value));
const getFromStorage = (key: string, defaultValue: any) => {
  const item = localStorage.getItem(key);
  return item? JSON.parse(item) : defaultValue;
};

export default function NexoraApp() {
  const [tab, setTab] = useState(getFromStorage("nexora_tab", "feed"));
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState(getFromStorage("nexora_theme", "dark"));
  const [usernameSetup, setUsernameSetup] = useState(false);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveToStorage("nexora_theme", theme);
    saveToStorage("nexora_tab", tab);
    
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (!userDoc.exists() ||!userDoc.data().username) {
          setUsernameSetup(true);
        }
        await setDoc(doc(db, "users", u.uid), {
          uid: u.uid, name: u.displayName, email: u.email, photoURL: u.photoURL,
          username: userDoc.data()?.username || "", bio: "", futureGoal: "", growthScore: 0,
          skills: [], projects: [], goals: [], streak: 0, bookmarks: [], createdAt: serverTimestamp()
        }, { merge: true });
      }
    });
  }, [theme, tab]);

  const toggleTheme = () => setTheme(theme === "dark"? "light" : "dark");
  const handleHashtagClick = (tag: string) => { setActiveHashtag(tag); setTab("feed"); toast(`Showing ${tag}`); };

  return (
    <div className={`min-h-screen flex flex-col ${theme === "dark"? "bg-black text-white" : "bg-gray-100 text-black"}`}>
      <Toaster position="bottom-center" />
      <Navbar user={user} theme={theme} toggleTheme={toggleTheme} setTab={setTab} tab={tab} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="max-w-4xl mx-auto p-4 flex-1 w-full">
        {usernameSetup && <UsernameSetup user={user} setUsernameSetup={setUsernameSetup} />}
        {searchQuery && <SearchResults query={searchQuery} setSearchQuery={setSearchQuery} setTab={setTab} />}
        {tab === "feed" && <FeedTab user={user} theme={theme} activeHashtag={activeHashtag} setActiveHashtag={setActiveHashtag} />}
        {tab === "discover" && <DiscoverTab user={user} theme={theme} setTab={setTab} />}
        {tab === "trending" && <TrendingTab user={user} theme={theme} onHashtagClick={handleHashtagClick} />}
        {tab === "messages" && <MessagesTab user={user} theme={theme} />}
        {tab === "profile" && <ProfileTab user={user} theme={theme} />}
        {tab === "bookmarks" && <BookmarksTab user={user} theme={theme} />}
      </div>
      <Footer theme={theme} />
    </div>
  );
}

function Footer({theme}: any) {
  return (
    <footer className={`border-t mt-10 py-6 ${theme === "dark"? "bg-black border-gray-800" : "bg-white border-gray-200"}`}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-xl font-bold text-blue-500 mb-2">NEXORA</h2>
        <p className="text-sm opacity-70 mb-3">Share Goals. Build Skills. Grow Together.</p>
        <p className="text-xs opacity-50 mt-3">© 2026 NEXORA. Built by <span className="font-bold text-blue-500">Anesh Production</span> 🇮🇳</p>
      </div>
    </footer>
  );
}

function UsernameSetup({user, setUsernameSetup}: any) {
  const [username, setUsername] = useState("");
  const handleSave = async () => {
    if(username.length < 3) return toast("Username 3 chars min");
    const q = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);
    if(!snap.empty) return toast("Username already taken");
    await updateDoc(doc(db, "users", user.uid), { username });
    setUsernameSetup(false);
    toast("Welcome to NEXORA! 🎉");
  };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl w-96">
        <h2 className="text-xl font-bold mb-4">Pick your Username</h2>
        <input value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="@yourname" className="w-full bg-gray-800 p-3 rounded mb-4" />
        <button onClick={handleSave} className="w-full bg-blue-500 py-2 rounded font-bold">Continue</button>
      </div>
    </div>
  );
}

function Navbar({user, theme, toggleTheme, setTab, tab, searchQuery, setSearchQuery}: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("to", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setNotifications(snap.docs.map(d => ({ id: d.id,...d.data() }))), (err) => toast("Notification error"));
  }, [user]);
  const unreadCount = notifications.filter(n =>!n.read).length;
  const handleRead = async (id: string) => await updateDoc(doc(db, "notifications", id), { read: true });
  return (
    <header className={`sticky top-0 z-50 p-4 border-b ${theme === "dark"? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-200"} backdrop-blur-md`}>
      <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
        <h1 onClick={() => setTab("feed")} className="text-2xl font-bold text-blue-500 cursor-pointer">NEXORA</h1>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users, #tags" className={`hidden md:block flex-1 max-w-xs bg-gray-800 px-3 py-2 rounded-lg text-sm`} />
        <div className="flex gap-1 md:gap-2 items-center">
          {["feed","discover","trending","messages","bookmarks","profile"].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`p-2 rounded ${tab === t? "bg-blue-500" : "hover:bg-gray-800"}`}>
              {t === "feed" && <Target size={20}/>}
              {t === "discover" && <Users size={20}/>}
              {t === "trending" && <Hash size={20}/>}
              {t === "messages" && <MessageSquare size={20}/>}
              {t === "bookmarks" && <Bookmark size={20}/>}
              {t === "profile" && (user?.photoURL? <img src={user.photoURL} className="w-6 h-6 rounded-full" /> : <Users size={20}/>)}
            </button>
          ))}
          <button onClick={toggleTheme}>{theme === "dark"? <Sun size={20} /> : <Moon size={20} />}</button>
          {user && (
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2">
                <Bell />
                {unreadCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-xs rounded-full w-4 h-4">{unreadCount}</span>}
              </button>
              {showNotifs && (
                <div className={`absolute right-0 mt-2 w-72 border rounded-lg shadow-lg ${theme === "dark"? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
                  {notifications.length === 0 && <p className="p-3 text-sm opacity-70">No notifications</p>}
                  {notifications.slice(0,5).map(n => (
                    <div key={n.id} onClick={() => handleRead(n.id)} className={`p-2 border-b text-sm cursor-pointer ${!n.read? "bg-blue-900/20" : ""}`}>
                      <b>{n.from?.name}</b> {n.type} your {n.postId? "post" : "profile"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {user? <button onClick={() => signOut(auth)}><LogOut size={18} /></button> : <button onClick={() => signInWithPopup(auth, googleProvider)}><LogIn size={18} /></button>}
        </div>
      </div>
    </header>
  );
                                              }

function FeedTab({user, theme, activeHashtag, setActiveHashtag}: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState(getFromStorage("nexora_draft", ""));
  const [image, setImage] = useState<File | null>(null);
  const [isGoalUpdate, setIsGoalUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => saveToStorage("nexora_draft", newPost), [newPost]);
  useEffect(() => {
    if(!user) return;
    getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid))).then(s => setFollowing(s.docs.map(d => d.data().followingId)));
  }, [user]);

  useEffect(() => {
    let q;
    if(following.length > 0) {
      q = query(collection(db, "posts"), where("userId", "in", [...following, user?.uid]), orderBy("createdAt", "desc"), limit(50));
    } else {
      q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
    }
    return onSnapshot(q, (snap) => {
      let allPosts = snap.docs.map((d) => ({ id: d.id,...d.data() }));
      if(activeHashtag) allPosts = allPosts.filter(p => p.text?.includes(activeHashtag));
      setPosts(allPosts);
    }, (err) => toast("Failed to load posts"))
  }, [following, user, activeHashtag]);

  const handlePost = async () => {
    if (!user) return toast("Login cheyi boss");
    if (!newPost.trim() &&!image) return toast("Post or Image add cheyi");
    setLoading(true);
    try {
      let imageUrl = "";
      if (image) {
        const storageRef = ref(storage, `posts/images/${user.uid}/${Date.now()}-${image.name}`);
        const snap = await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(snap.ref);
      }
      await addDoc(collection(db, "posts"), {
        text: newPost, imageUrl, userId: user.uid, userName: user.displayName,
        userPhoto: user.photoURL, likes: [], type: isGoalUpdate? "goal_update" : "post",
        hashtags: newPost.match(/#\w+/g) || [], createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "users", user.uid), { growthScore: increment(5) });
      setNewPost(""); saveToStorage("nexora_draft", ""); setImage(null); setIsGoalUpdate(false); toast("Posted! +5 Growth 🚀");
    } catch (error: any) { toast("Post Failed: " + error.message); }
    setLoading(false);
  };

  const renderTextWithHashtags = (text: string) => {
    return text.split(/(\s+)/).map((word, i) => {
      if (word.startsWith("#")) {
        return <span key={i} onClick={() => setActiveHashtag(word)} className="text-blue-500 font-semibold cursor-pointer hover:underline">{word}</span>
      }
      return word
    })
  }

  return (
    <div>
      {activeHashtag && (
        <div className="mb-4 p-3 bg-blue-500/20 rounded-lg flex justify-between items-center">
          <p>Showing posts for: <span className="font-bold text-blue-500">{activeHashtag}</span></p>
          <button onClick={() => setActiveHashtag(null)} className="text-sm underline">Clear</button>
        </div>
      )}
      {user && (
        <div className={`border rounded-xl p-4 mb-6 ${theme === "dark"? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <div className="flex gap-3">
            <img src={user.photoURL || ""} className="w-10 h-10 rounded-full" />
            <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share your goal progress... use #AI #Startup" className="w-full bg-transparent outline-none resize-none" rows={3} />
          </div>
          {image && (
            <div className="mt-3 relative">
              <img src={URL.createObjectURL(image)} className="rounded-lg max-h-80 w-full object-cover" />
              <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/60 p-1 rounded-full"><X size={16}/></button>
            </div>
          )}
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-blue-500">
                <ImageIcon size={18} /> <span>Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files![0] || null)} />
              </label>
              <button onClick={() => setIsGoalUpdate(!isGoalUpdate)} className={`flex items-center gap-2 ${isGoalUpdate? "text-green-500" : "opacity-70"}`}><Target size={18} /> Goal</button>
            </div>
            <button onClick={handlePost} disabled={loading} className="bg-blue-500 px-6 py-2 rounded-lg font-semibold disabled:opacity-50">
              {loading? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      )}
      {posts.map((post) => <PostCard key={post.id} post={post} user={user} theme={theme} renderText={renderTextWithHashtags} />)}
    </div>
  );
}

function PostCard({post, user, theme, renderText}: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const isOwner = user?.uid === post.userId;
  
  useEffect(() => {
    if(!user) return;
    getDoc(doc(db, "users", user.uid)).then(d => setIsBookmarked(d.data()?.bookmarks?.includes(post.id)));
    const q = query(collection(db, "comments"), where("postId", "==", post.id), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => setComments(snap.docs.map((d) => ({ id: d.id,...d.data() }))));
  }, [post.id, user]);
  
  const handleLike = async () => {
    if (!user) return toast("Login cheyi");
    await updateDoc(doc(db, "posts", post.id), { likes: post.likes.includes(user.uid)? arrayRemove(user.uid) : arrayUnion(user.uid) });
    if (!post.likes.includes(user.uid)) { createNotification(post.userId, "like", user, post.id); await updateDoc(doc(db, "users", post.userId), { growthScore: increment(2) }); }
  };
  const handleBookmark = async () => {
    if(!user) return;
    await updateDoc(doc(db, "users", user.uid), { bookmarks: isBookmarked? arrayRemove(post.id) : arrayUnion(post.id) });
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked? "Removed from bookmarks" : "Saved to bookmarks");
  }
  const handleComment = async () => {
    if (!commentText.trim() ||!user) return;
    await addDoc(collection(db, "comments"), { postId: post.id, userId: user.uid, userName: user.displayName, userPhoto: user.photoURL, text: commentText, createdAt: serverTimestamp() });
    createNotification(post.userId, "comment", user, post.id); await updateDoc(doc(db, "users", post.userId), { growthScore: increment(3) }); setCommentText("");
  };
  const handleDelete = async () => { if(!confirm("Delete this post?")) return; await deleteDoc(doc(db, "posts", post.id)); toast("Post Deleted 🗑️"); };
  const handleEdit = async () => { if(!editText.trim()) return; await updateDoc(doc(db, "posts", post.id), { text: editText, hashtags: editText.match(/#\w+/g) || [] }); setIsEditing(false); toast("Post Updated ✏️"); };
  
  return (
    <div className={`border rounded-xl p-4 mb-6 ${theme === "dark"? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={post.userPhoto} className="w-10 h-10 rounded-full" />
          <div><p className="font-semibold">{post.userName}</p>{post.type === "goal_update" && <p className="text-xs text-green-500"><Target size={12}/> Goal Progress</p>}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleBookmark}>{isBookmarked? <BookmarkCheck size={18} /> : <Bookmark size={18}/>}</button>
          {isOwner &&!isEditing && (<><button onClick={() => setIsEditing(true)}><Edit size={16}/></button><button onClick={handleDelete}><Trash2 size={16}/></button></>)}
        </div>
      </div>
      {isEditing? (<div className="mb-3"><textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-gray-800 p-2 rounded mb-2" rows={3} /><div className="flex gap-2"><button onClick={handleEdit} className="bg-green-500 px-4 py-1 rounded flex items-center gap-1"><Save size={14}/> Save</button><button onClick={() => setIsEditing(false)} className="bg-gray-600 px-4 py-1 rounded flex items-center gap-1"><X size={14}/> Cancel</button></div></div>) : (<p className="mb-3">{renderText(post.text)}</p>)}
      {post.imageUrl && <img src={post.imageUrl} className="rounded-lg w-full mb-3" />}
      <div className="flex gap-6 border-t border-b py-2">
        <button onClick={handleLike} className="flex items-center gap-2"><Heart fill={post.likes.includes(user?.uid)? "red" : "none"} color={post.likes.includes(user?.uid)? "red" : "currentColor"} />{post.likes.length}</button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2"><MessageCircle /> {comments.length}</button>
      </div>
      {showComments && (<div className="mt-3 space-y-2">{comments.map((c) => (<div key={c.id} className="flex gap-2"><img src={c.userPhoto} className="w-8 h-8 rounded-full" /><div className={`p-2 rounded-lg ${theme === "dark"? "bg-gray-800" : "bg-gray-100"}`}><p className="font-semibold text-sm">{c.userName}</p><p className="text-sm">{c.text}</p></div></div>))}{user && (<div className="flex gap-2 mt-3"><input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-transparent border-b outline-none" /><button onClick={handleComment}><Send size={18} /></button></div>)}</div>)}
    </div>
  );
}

function BookmarksTab({user, theme}: any) {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  useEffect(() => {
    if(!user) return;
    getDoc(doc(db, "users", user.uid)).then(async (d) => {
      const bookmarks = d.data()?.bookmarks || [];
      if(bookmarks.length > 0) {
        const q = query(collection(db, "posts"), where("__name__", "in", bookmarks));
        const snap = await getDocs(q);
        setBookmarkedPosts(snap.docs.map(doc => ({ id: doc.id,...doc.data() })));
      }
    })
  }, [user]);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><Bookmark /> My Bookmarks</h1>
      {bookmarkedPosts.length === 0 && <p className="opacity-70">No bookmarks yet</p>}
      {bookmarkedPosts.map((post) => <PostCard key={post.id} post={post} user={user} theme={theme} renderText={(t:string) => t} />)}
    </div>
  );
                        }

// ===== DISCOVER TAB =====
function DiscoverTab({user, theme, setTab}: any) {
  const [users, setUsers] = useState<any[]>([]);
  const skills = ["Coding", "Design", "Marketing", "AI", "Startup", "Fitness"];
  const searchSkill = async (skill: string) => {
    const q = query(collection(db, "users"), where("skills", "array-contains", skill));
    const snap = await getDocs(q);
    setUsers(snap.docs.map(d => ({ id: d.id,...d.data() })));
  };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><Users /> Discover by Skills</h1>
      <div className="flex gap-2 mb-6 flex-wrap">{skills.map(skill => (<button key={skill} onClick={() => searchSkill(skill)} className="px-4 py-2 rounded-full border hover:bg-blue-500">{skill}</button>))}</div>
      <div className="space-y-4">{users.map(u => (<UserCard key={u.id} u={u} user={user} theme={theme} setTab={setTab} />))}</div>
    </div>
  );
}

function UserCard({u, user, theme, setTab}: any) {
  const [isFollowing, setIsFollowing] = useState(false);
  useEffect(() => { if(user) getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid), where("followingId", "==", u.uid))).then(s => setIsFollowing(!s.empty)) },[user,u]);
  const toggleFollow = async () => {
    if(!user) return;
    if(isFollowing) { const snap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid), where("followingId", "==", u.uid))); snap.forEach(d => deleteDoc(d.ref)); await updateDoc(doc(db, "users", u.uid), { growthScore: increment(-5) }); }
    else { await addDoc(collection(db, "follows"), {followerId: user.uid, followingId: u.uid, createdAt: serverTimestamp()}); createNotification(u.uid, "follow", user); await updateDoc(doc(db, "users", u.uid), { growthScore: increment(5) }); }
    setIsFollowing(!isFollowing);
  };
  const startChat = async () => {
    const members = [user.uid, u.uid].sort();
    const snap = await getDocs(query(collection(db, "chats"), where("members", "==", members)));
    snap.empty? await addDoc(collection(db, "chats"), {members, lastMessage: "", updatedAt: serverTimestamp()}) : null;
    setTab("messages");
  };
  return (
    <div className={`border rounded-xl p-4 ${theme === "dark"? "border-gray-800" : "border-gray-200"}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3"><img src={u.photoURL} className="w-12 h-12 rounded-full" /><div><p className="font-bold">@{u.username}</p><p className="text-sm font-semibold text-blue-500">{u.futureGoal}</p><p className="text-sm opacity-70">{u.bio}</p></div></div>
        <div className="flex items-center gap-1 text-yellow-500"><Award size={16} /><span className="font-bold">{u.growthScore || 0}</span></div>
      </div>
      <div className="flex gap-2 flex-wrap mt-2">{u.skills?.map((s:string) => <span key={s} className="text-xs bg-blue-500/20 px-2 py-1 rounded-full">{s}</span>)}</div>
      <div className="flex gap-2 mt-3">{user?.uid!== u.uid && <><button onClick={toggleFollow} className={`px-4 py-2 rounded-lg flex items-center gap-1 ${isFollowing? "bg-gray-600" : "bg-blue-500"}`}>{isFollowing? <UserMinus size={14}/> : <UserPlus size={14}/>}{isFollowing? "Unfollow" : "Follow"}</button><button onClick={startChat} className="bg-green-500 px-4 py-2 rounded-lg"><MessageCircle size={16}/></button></>}</div>
    </div>
  );
}

// ===== TRENDING TAB - REAL =====
function TrendingTab({user, theme, onHashtagClick}: any) {
  const [trending, setTrending] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(200));
    return onSnapshot(q, (snap) => {
      const allPosts = snap.docs.map((d) => d.data());
      const tagCount: any = {};
      allPosts.forEach(p => { if(p.hashtags) p.hashtags.forEach((t: string) => tagCount[t] = (tagCount[t] || 0) + 1); });
      const sorted = Object.entries(tagCount).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));
      setTrending(sorted);
    });
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🔥 Trending Hashtags</h1>
      {trending.length === 0 && <p className="opacity-70">Inka hashtags levu. Post chesi #AI #Startup try cheyi</p>}
      <div className="space-y-3">
        {trending.map((t, i) => (
          <div key={t.tag} onClick={() => onHashtagClick(t.tag)} className={`p-4 border rounded-xl cursor-pointer hover:bg-blue-500/10 ${theme === "dark"? "border-gray-800" : "border-gray-200"}`}>
            <p className="text-sm opacity-70">#{i+1} Trending</p>
            <p className="text-xl font-bold text-blue-500">{t.tag}</p>
            <p className="text-sm">{t.count} posts</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== SEARCH RESULTS =====
function SearchResults({query, setSearchQuery, setTab}: any) {
  const [results, setResults] = useState<any[]>([]);
  useEffect(() => {
    if(!query) return;
    const searchUsers = async () => {
      const q = query(collection(db, "users"), where("username", ">=", query), where("username", "<=", query + '\uf8ff'), limit(5));
      const snap = await getDocs(q);
      setResults(snap.docs.map(d => ({ type: "user",...d.data() })));
    }
    searchUsers();
  }, [query]);

  if(!query) return null;
  return (
    <div className="mb-4 p-4 border rounded-xl bg-gray-900 border-gray-800">
      <div className="flex justify-between mb-2">
        <h3 className="font-bold">Search Results for "{query}"</h3>
        <button onClick={() => setSearchQuery("")} className="text-sm underline">Close</button>
      </div>
      {results.map((r, i) => (
        <div key={i} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded">
          <img src={r.photoURL} className="w-8 h-8 rounded-full" />
          <p>@{r.username}</p>
        </div>
      ))}
    </div>
  );
    }

// ===== MESSAGES TAB =====
function MessagesTab({user, theme}: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  useEffect(() => { if (!user) return; const q = query(collection(db, "chats"), where("members", "array-contains", user.uid), orderBy("updatedAt", "desc")); return onSnapshot(q, (snap) => setChats(snap.docs.map(d => ({ id: d.id,...d.data() })))) }, [user]);
  return (
    <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
      <div className={`md:col-span-1 border rounded-xl p-2 overflow-y-auto ${theme === "dark"? "border-gray-800" : "border-gray-200"}`}>
        {chats.length === 0 && <p className="p-3 opacity-70">No chats yet</p>}
        {chats.map(c => <div key={c.id} onClick={() => setActiveChat(c)} className={`p-3 rounded cursor-pointer ${activeChat?.id === c.id? "bg-blue-500" : "hover:bg-gray-800"}`}>
          <p className="font-semibold">Chat</p>
          <p className="text-xs opacity-70 truncate">{c.lastMessage}</p>
        </div>)}
      </div>
      <div className={`md:col-span-2 border rounded-xl p-3 flex-col ${theme === "dark"? "border-gray-800" : "border-gray-200"}`}>
        {activeChat? <ChatRoom chat={activeChat} user={user} /> : <p className="m-auto opacity-70">Select a chat</p>}
      </div>
    </div>
  );
}

function ChatRoom({chat, user}: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  useEffect(() => {
    const q = query(collection(db, "messages"), where("chatId", "==", chat.id), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({ id: d.id,...d.data() }))))
  }, [chat]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, "messages"), {chatId: chat.id, senderId: user.uid, text, createdAt: serverTimestamp()});
    await updateDoc(doc(db, "chats", chat.id), {lastMessage: text, updatedAt: serverTimestamp()});
    setText("");
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.senderId === user?.uid? "justify-end" : "justify-start"}`}>
            <div className={`p-2 rounded-lg max-w-xs ${m.senderId === user?.uid? "bg-blue-500" : "bg-gray-800"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input value={text} onChange={e => setText(e.target.value)} onKeyPress={e => e.key === "Enter" && sendMessage()} placeholder="Type a message..." className="flex-1 bg-gray-900 p-2 rounded" />
        <button onClick={sendMessage} className="bg-blue-500 p-2 rounded"><Send /></button>
      </div>
    </>
  );
                                                       }

// ===== PROFILE TAB - SAVE FIXED + MY POSTS =====
function ProfileTab({user, theme}: any) {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [futureGoal, setFutureGoal] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({title: "", link: ""});
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  const fetchProfile = async () => {
    if(!user) return;
    setLoading(true);
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if(userDoc.exists()){
      const data = userDoc.data();
      setProfile(data);
      setName(data.name || "");
      setBio(data.bio || "");
      setSkills(data.skills?.join(", ") || "");
      setFutureGoal(data.futureGoal || "");
      setProjects(data.projects || []);
    }
    const followersSnap = await getDocs(query(collection(db, "follows"), where("followingId", "==", user.uid)));
    setFollowers(followersSnap.size);
    const followingSnap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid)));
    setFollowing(followingSnap.size);

    const postsSnap = await getDocs(query(collection(db, "posts"), where("userId", "==", user.uid), orderBy("createdAt", "desc")));
    setMyPosts(postsSnap.docs.map(d => ({ id: d.id,...d.data() })));

    setLoading(false);
  }

  useEffect(() => { fetchProfile() },[user]);

  const handleSave = async () => {
    setLoading(true);
    await updateDoc(doc(db, "users", user.uid), {
      name,
      bio,
      futureGoal,
      skills: skills.split(",").map(s => s.trim()).filter(s => s!== ""),
      projects
    });
    setIsEditing(false);
    toast("Profile Updated! ✅");
    await fetchProfile(); // Save chesina ventane update
  };

  const handleAddProject = () => {
    if(!newProject.title) return;
    setProjects([...projects, {...newProject, id: Date.now()}]);
    setNewProject({title: "", link: ""});
  };
  const handleRemoveProject = (id: number) => {
    setProjects(projects.filter(p => p.id!== id));
  };

  if(loading ||!profile) return <p className="text-center">Loading...</p>;

  return (
    <div className={`border rounded-xl p-6 ${theme === "dark"? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
      <div className="flex justify-between items-start">
        <div>
          <img src={profile.photoURL} className="w-24 h-24 rounded-full" />
          <h1 className="text-2xl font-bold mt-2">{profile.name}</h1>
          <p className="opacity-70">@{profile.username}</p>
        </div>
        {!isEditing?
          <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-gray-800 rounded"><Edit /></button>
          :
          <button onClick={handleSave} disabled={loading} className="p-2 bg-green-500 hover:bg-green-600 rounded"><Save /></button>
        }
      </div>

      <div className="flex gap-4 my-4">
        <div><b>{followers}</b> Followers</div>
        <div><b>{following}</b> Following</div>
        <div className="flex items-center gap-1 text-yellow-500"><Award size={16} /><b>{profile.growthScore || 0} Growth Score</b></div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-gray-800 mb-4">
        <button onClick={() => setActiveTab("about")} className={`px-4 py-2 ${activeTab === "about"? "border-b-2 border-blue-500" : ""}`}>About</button>
        <button onClick={() => setActiveTab("posts")} className={`px-4 py-2 ${activeTab === "posts"? "border-b-2 border-blue-500" : ""}`}>My Posts</button>
      </div>

      {activeTab === "about" && (
        <>
          {isEditing? (
            <div className="space-y-3 mt-4">
              <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 p-2 rounded" placeholder="Name" />
              <input value={futureGoal} onChange={e => setFutureGoal(e.target.value)} className="w-full bg-gray-800 p-2 rounded" placeholder="Future Goal: AI Founder" />
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-gray-800 p-2 rounded" placeholder="Bio" rows={3} />
              <input value={skills} onChange={e => setSkills(e.target.value)} className="w-full bg-gray-800 p-2 rounded" placeholder="Skills: Coding, Design, AI" />
            </div>
          ) : (
            <>
              {profile.futureGoal && <p className="text-blue-500 font-semibold flex items-center gap-1"><Target size={14} /> Future Goal: {profile.futureGoal}</p>}
              {profile.bio && <p className="opacity-70 mt-2">{profile.bio}</p>}
              <div className="flex gap-2 flex-wrap mt-2">{profile.skills?.map((s:string) => s && <span key={s} className="text-sm bg-blue-500/20 px-3 py-1 rounded-full">{s}</span>)}</div>
            </>
          )}

          <div className="border-t border-gray-800 pt-4 mt-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Link /> Project Showcase</h3>
            {isEditing && (
              <div className="flex gap-2 mb-3">
                <input value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="Project Name" className="flex-1 bg-gray-800 p-2 rounded" />
                <input value={newProject.link} onChange={e => setNewProject({...newProject, link: e.target.value})} placeholder="https://github.com/..." className="flex-1 bg-gray-800 p-2 rounded" />
                <button onClick={handleAddProject} className="bg-blue-500 p-2 rounded"><Plus /></button>
              </div>
            )}
            {projects.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-gray-800 p-2 rounded mb-2">
                <a href={p.link} target="_blank" className="flex items-center gap-2 hover:underline"><Github size={14} /> {p.title}</a>
                {isEditing && <button onClick={() => handleRemoveProject(p.id)}><X size={14} /></button>}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-4 mt-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Target /> My Goals</h3>
            <div className="flex items-center gap-2 text-orange-500"><Flame /> <span>{profile.streak || 0} Day Streak</span></div>
          </div>
        </>
      )}

      {activeTab === "posts" && (
        <div className="space-y-4">
          {myPosts.length === 0 && <p className="opacity-70">No posts yet</p>}
          {myPosts.map(post => <PostCard key={post.id} post={post} user={user} theme={theme} renderText={(t:string) => t} />)}
        </div>
      )}
    </div>
  );
}

// ===== NOTIFICATION HELPER =====
const createNotification = async (toUserId: string, type: string, fromUser: any, postId?: string) => {
  if (!toUserId || toUserId === fromUser.uid) return;
  await addDoc(collection(db, "notifications"), {
    to: toUserId,
    type,
    from: { uid: fromUser.uid, name: fromUser.displayName, photo: fromUser.photoURL },
    postId: postId || null,
    read: false,
    createdAt: serverTimestamp()
  });
};

