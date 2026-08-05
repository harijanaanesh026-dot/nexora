import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
const storage = getStorage(app);

const styles = {
  body: {background:"#0a0a0a", color:"white", fontFamily:"Arial", margin:0, padding:0},
  nav: {display:"flex", justifyContent:"space-around", padding:15, borderBottom:"1px solid #333"},
  btn: {background:"#22c55e", color:"white", border:"none", padding:"10px 20px", borderRadius:8, cursor:"pointer"},
  card: {background:"#1a1a1a", padding:15, margin:15, borderRadius:10},
  input: {width:"95%", padding:10, margin:"5px 0", background:"#333", border:"none", color:"white", borderRadius:5}
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState({});

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u) {
        const docSnap = await getDoc(doc(db, "users", u.uid));
        if(docSnap.exists()) setProfile(docSnap.data());
        else setDoc(doc(db, "users", u.uid), {name: u.displayName, photo: u.photoURL, bio: "", skills: "", goals: ""});

        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        onSnapshot(q, (snap) => setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))));
      }
    });
  }, []);

  const googleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  if (!user) {
    return (
      <div style={{...styles.body, textAlign:"center", paddingTop:100}}>
        <h1 style={{fontSize:40}}>ConnectAI</h1>
        <p>AI-Powered Social Platform</p>
        <button style={styles.btn} onClick={googleLogin}>Continue with Google</button>
      </div>
    )
  }

  return (
    <div style={styles.body}>
      <div style={styles.nav}>
        <button onClick={()=>setTab("home")} style={{background:"none", border:"none", color:tab==="home"?"#22c55e":"white"}}>Home</button>
        <button onClick={()=>setTab("profile")} style={{background:"none", border:"none", color:tab==="profile"?"#22c55e":"white"}}>Profile</button>
        <button onClick={logout} style={{background:"none", border:"none", color:"red"}}>Logout</button>
      </div>

      {tab === "home" && (
        <div>
          <div style={styles.card}>
            <textarea style={styles.input} placeholder="What's on your mind?" id="postText"/>
            <button style={styles.btn} onClick={async()=>{
              const text = document.getElementById("postText").value;
              await addDoc(collection(db, "posts"), {uid:user.uid, name:user.displayName, photo:user.photoURL, text, likes:[], createdAt:serverTimestamp()});
              document.getElementById("postText").value="";
            }}>Post</button>
          </div>
          {posts.map(post => (
            <div key={post.id} style={styles.card}>
              <p><b>{post.name}</b></p>
              <p>{post.text}</p>
              <button onClick={async()=>{
                const postRef = doc(db, "posts", post.id);
                post.likes.includes(user.uid)? updateDoc(postRef,{likes:arrayRemove(user.uid)}) : updateDoc(postRef,{likes:arrayUnion(user.uid)});
              }}>❤️ {post.likes?.length || 0}</button>
            </div>
          ))}
        </div>
      )}

      {tab === "profile" && (
        <div style={styles.card}>
          <img src={profile.photo} style={{width:80, height:80, borderRadius:"50%"}}/>
          <input style={styles.input} placeholder="Bio" value={profile.bio||""} onChange={e=>setProfile({...profile,bio:e.target.value})}/>
          <input style={styles.input} placeholder="Skills" value={profile.skills||""} onChange={e=>setProfile({...profile,skills:e.target.value})}/>
          <button style={styles.btn} onClick={()=>setDoc(doc(db,"users",user.uid), profile, {merge:true})}>Save</button>
        </div>
      )}
    </div>
  )
    }
