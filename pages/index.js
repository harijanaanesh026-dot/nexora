import { useState, useEffect } from 'react'

export default function Home() {
  const [page, setPage] = useState('home') // home, signup, swipe
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [user, setUser] = useState(null)

  // App load ayinappudu login check chey
  useEffect(() => {
    const savedUser = localStorage.getItem('nexora_user')
    if(savedUser) {
      setUser(JSON.parse(savedUser))
      setPage('swipe') // Already login unte direct swipe ki
    }
  }, [])

  const handleLogin = () => {
    if(name && phone) {
      const newUser = {name, phone}
      localStorage.setItem('nexora_user', JSON.stringify(newUser))
      setUser(newUser)
      setPage('swipe')
    } else {
      alert('Name and Phone ivvali')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('nexora_user')
    setUser(null)
    setPage('home')
  }

  // 1. HOME PAGE
  if(page === 'home') {
    return (
      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{fontSize: '3rem', margin: '0'}}>Nexora</h1>
        <p style={{fontSize: '1.2rem', margin: '10px 0 30px 0', opacity: 0.9}}>
          AI-Powered Dating for India 🇮🇳
        </p>
        <button 
          onClick={() => setPage('signup')}
          style={{
            padding: '16px 30px',
            fontSize: '1.1rem',
            background: 'white',
            color: '#764ba2',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Get Started
        </button>
      </main>
    )
  }

  // 2. SIGNUP PAGE - Action chesetappudu idhi vastundi
  if(page === 'signup') {
    return (
      <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px'}}>
        <div style={{background: 'rgba(255,255,255,0.1)', padding: '40px', borderRadius: '20px', width: '90%', maxWidth: '400px', backdropFilter: 'blur(10px)'}}>
          <h1 style={{textAlign: 'center'}}>Join Nexora 🚀</h1>
          <p style={{textAlign: 'center', opacity: 0.8, marginBottom: '30px'}}>Continue to start swiping</p>
          <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} style={{width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: 'none', fontSize: '16px'}}/>
          <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} style={{width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '10px', border: 'none', fontSize: '16px'}}/>
          <button onClick={handleLogin} style={{width: '100%', padding: '14px', background: 'white', color: '#764ba2', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'}}>Continue</button>
          <button onClick={() => setPage('home')} style={{width: '100%', padding: '12px', background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '10px', marginTop: '10px', cursor: 'pointer'}}>Back</button>
        </div>
      </div>
    )
  }

  // 3. SWIPE PAGE - Protected
  if(page === 'swipe') {
    return (
      <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '30px', textAlign: 'center'}}>
        <h1>Welcome {user?.name} 👋</h1>
        <p>Idhi Nexora AI Swipe Page</p>
        <p style={{opacity: 0.7}}>Phone: {user?.phone}</p>
        
        <div style={{marginTop: '50px'}}>
          <h2>AI Matching Soon 🔥</h2>
        </div>

        <button onClick={handleLogout} style={{marginTop: '50px', padding: '12px 24px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid white', borderRadius: '10px', cursor: 'pointer'}}>Logout</button>
      </div>
    )
  }
                  }
