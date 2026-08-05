import { useState, useEffect } from 'react'
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// NEE FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyA1f6g5AT9qRDUvycsM7huz7Ex",
  authDomain: "nexoraai-75aw2.firebaseapp.com",
  projectId: "nexoraai-75aw2",
  storageBucket: "nexoraai-75aw2.appspot.com",
  messagingSenderId: "173122711117",
  appId: "1:173122711117:web:e8b37359d1d18bdc1e488",
  measurementId: "G-11Y8F8BDC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const styles = {
  container: { padding: '20px', maxWidth: '500px', margin: '0 auto', background: '#111', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' },
  input: { width: '100%', padding: '12px', margin: '10px 0', borderRadius: '8px', border: '1px solid #333', background: '#222', color: 'white', fontSize: '16px', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '12px', margin: '10px 0', borderRadius: '8px', border: 'none', background: '#00ff88', color: 'black', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  card: { background: '#1a1a1a', padding: '15px', borderRadius: '10px', margin: '10px 0' }
}

export default function ConnectAI(){
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState(null)

  const feedData = {
    feed: [
      {user: 'Rahul', text: 'AgriTech lo AI use chesi farmers ki help cheyochu'},
      {user: 'Priya', text: 'Voice to Text projects kosam team kavali'},
      {user: 'Arjun', text: 'Co-founder kavali - EdTech App'},
      {user: 'Sneha', text: 'Open source: Telugu AI Chat'},
    ]
  }

  const getMatches = () => [
    {type: "Learner", name: "Sita", match: "92%"},
    {type: "Mentor", name: "Dr. Ramesh", match: "89%"},
    {type: "Community", name: "AI Builders", match: "95%"}
  ]

  useEffect(() => {
    const saved = localStorage.getItem('connectAI_user')
    if(saved) setUser(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if(page === 'signup' && typeof window !== 'undefined' && !window.recaptchaVerifier){
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 
        size: 'normal',
        callback: () => {}
      });
    }
  }, [page, auth])

  const sendOTP = () => {
    const phone = document.getElementById('phone').value;
    if(!phone.startsWith('+91')){
      alert('Please enter with +91. Ex: +91 9876543210')
      return
    }
    signInWithPhoneNumber(auth, phone, window.recaptchaVerifier)
   .then((result) => {
      setConfirmationResult(result);
      setOtpSent(true);
      alert('OTP sent to ' + phone)
    }).catch((error) => { alert(error.message); });
  }

  const verifyOTP = () => {
    const otp = document.getElementById('otp').value;
    confirmationResult.confirm(otp).then((result) => {
      const userData = { phone: result.user.phoneNumber, level: "Rising Star", points: 100 }
      localStorage.setItem('connectAI_user', JSON.stringify(userData))
      setUser(userData);
      setPage('feed');
    }).catch((error) => { alert('Wrong OTP'); });
  }

  if (page === 'home') return (
    <div style={styles.container}>
      <h1 style={{textAlign: 'center'}}>ConnectAI</h1>
      <p style={{textAlign: 'center'}}>People ni followers kosam kaadu, future kosam</p>
      <button onClick={() => setPage('signup')} style={styles.btn}>Join Now</button>
    </div>
  )

  if (page === 'signup') return (
    <div style={styles.container}>
      <h2>Login with Phone</h2>
      <input id="phone" placeholder="+91 9876543210" style={styles.input} />
      <div id="recaptcha-container"></div>
      <button onClick={sendOTP} style={styles.btn}>Send OTP</button>
      {otpSent && (
        <>
          <input id="otp" placeholder="Enter 6 digit OTP" style={styles.input} />
          <button onClick={verifyOTP} style={styles.btn}>Verify & Login</button>
        </>
      )}
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>{user?.phone}</h2>
        <p>PTS: {user?.points} | {user?.level}</p>
      </div>
      <h3>AI Match</h3>
      {getMatches().map((m,i) => (
        <div key={i} style={styles.card}><b>{m.type}</b>: {m.name} - Match: {m.match}</div>
      ))}
      <h3>Feed</h3>
      {feedData.feed.map((item,i) => (
        <div key={i} style={styles.card}><b>{item.user}</b>: {item.text}</div>
      ))}
      <button onClick={() => {localStorage.clear(); setUser(null); setPage('home')}} style={{...styles.btn, background: '#ff4444'}}>Logout</button>
    </div>
  )
  }
