import { useState, useEffect } from 'react'
import { auth, db } from '../lib/firebaseConfig' // <-- IDHE IMPORTANT
import { onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { motion } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async () => {
    try {
      await signInAnonymously(auth)
      toast.success('Logged in!')
    } catch (err) {
      toast.error('Login failed')
    }
  }

  if (loading) return <div className="bg-black text-white h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="bg-black text-white min-h-screen">
      <Toaster />
      {!user ? (
        <div className="flex items-center justify-center h-screen">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleLogin}
            className="bg-red-600 px-8 py-4 rounded-lg text-xl font-bold"
          >
            QUITTR 2.0 - Login
          </motion.button>
        </div>
      ) : (
        <div className="p-8">
          <h1 className="text-3xl font-bold">Welcome to QUITTR 2.0 🔥</h1>
          <p className="mt-4">You are logged in: {user.uid}</p>
        </div>
      )}
    </div>
  )
}
