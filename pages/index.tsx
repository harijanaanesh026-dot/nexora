import { useState, useEffect } from 'react'
import { auth, db } from '../firebaseConfig'
import { onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'

// ********** TYPES **********
type UserType = {
  uid: string; 
  coins: number; 
  xp: number; 
  level: number; 
  streak: number;
  timeBank: number; 
  lifeScore: number; 
  scrollTimeToday: number; 
  focusTimeToday: number;
};

// ********** MAIN COMPONENT **********
export default function Home() {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Auth check
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const unsubSnap = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUser(snap.data() as UserType)
          } else {
            // New user - create profile
            const newUser: UserType = {
              uid: firebaseUser.uid,
              coins: 10,
              xp: 0,
              level: 1,
              streak: 0,
              timeBank: 0,
              lifeScore: 100,
              scrollTimeToday: 0,
              focusTimeToday: 0,
            }
            setDoc(userRef, newUser)
            setUser(newUser)
          }
          setLoading(false)
        })
        return () => unsubSnap()
      } else {
        // No user - sign in anonymously for now
        signInAnonymously(auth)
        setLoading(false)
      }
    })
    return () => unsubAuth()
  }, [])

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  if (loading) return <div style={{padding: 20}}>Loading QUITTR 2.0...</div>

  if (!user) return (
    <div style={{padding: 20}}>
      <h1>QUITTR 2.0</h1>
      <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  )

  return (
    <div style={{padding: 20}}>
      <h1>QUITTR 2.0 🔥</h1>
      <p>Welcome, {user.uid.slice(0,6)}!</p>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
        <div>🪙 Coins: {user.coins}</div>
        <div>⭐ XP: {user.xp}</div>
        <div>🏆 Level: {user.level}</div>
        <div>🔥 Streak: {user.streak}</div>
        <div>⏳ TimeBank: {user.timeBank} min</div>
        <div>💚 LifeScore: {user.lifeScore}</div>
      </div>
      <p style={{marginTop: 20}}>Scroll Tax & Focus Timer coming next...</p>
    </div>
  )
}
