import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

// Nuvvu ichina keys
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

export default function Home() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  // Phone OTP
  const sendOTP = async () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    }
    const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
    setConfirmation(confirmationResult);
    alert("OTP sent!");
  };
  const verifyOTP = async () => {
    await confirmation.confirm(otp);
  };

  // Google Login
  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  // 1. User login aithe Dashboard
  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <h1 className="text-3xl font-bold mb-4">Welcome to ConnectAI 🚀</h1>
        <p className="mb-4">Hello, {user.displayName || user.phoneNumber}</p>
        <button onClick={logout} className="bg-red-600 px-4 py-2 rounded">Logout</button>
      </div>
    )
  }

  // 2. Login button kottithe Login Page
  if (showLogin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Login to ConnectAI</h1>
        
        {!confirmation ? (
          <>
            <input type="text" placeholder="+91 9876543210" value={phone} onChange={(e)=>setPhone(e.target.value)} className="p-2 mb-2 bg-gray-800 rounded w-72"/>
            <button onClick={sendOTP} className="bg-green-600 px-4 py-2 rounded w-72 mb-2">Send OTP</button>
            <button onClick={googleLogin} className="bg-blue-600 px-4 py-2 rounded w-72">Continue with Google</button>
            <div id="recaptcha-container"></div>
            <button onClick={()=>setShowLogin(false)} className="mt-4 text-gray-400">Back to Home</button>
          </>
        ) : (
          <>
            <input type="text" placeholder="Enter OTP" value={otp} onChange={(e)=>setOtp(e.target.value)} className="p-2 mb-2 bg-gray-800 rounded w-72"/>
            <button onClick={verifyOTP} className="bg-green-600 px-4 py-2 rounded w-72">Verify OTP</button>
          </>
        )}
      </div>
    )
  }

  // 3. First Homepage
  return (
    <div className="min-h-screen flex-col items-center justify-center bg-black text-white p-4 text-center">
      <h1 className="text-5xl font-bold mb-4">ConnectAI</h1>
      <p className="text-lg mb-8">Your AI-Powered Social Platform</p>
      <button onClick={()=>setShowLogin(true)} className="bg-green-600 px-8 py-3 rounded-lg text-xl font-semibold">
        Login / Signup
      </button>
    </div>
  )
          }
