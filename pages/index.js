import { useState, useEffect } from 'react'

export default function Home() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({})

  // Dummy Data
  const aiMatches = [
    { name: "Priya", goal: "Startup Founder", skill: "Marketing", match: "95%" },
    { name: "Rahul", goal: "Learn React", skill: "UI Design", match: "88%" },
    { name: "Kavya", goal: "Build AI App", skill: "Python", match: "92%" }
  ]
  
  const goalFeed = [
    { type: "Project", user: "Arjun", text: "Looking for co-founder for AgriTech startup" },
    { type: "Learning", user: "Sneha", text: "Anyone teaching Next.js? I can teach Figma" },
    { type: "Opportunity", user: "Vikram", text: "Hackathon team needed - Prize 1L" }
  ]

  useEffect(() => {
    const savedUser = localStorage.getItem('connectAI')
    if (savedUser) {
      const data = JSON.parse(savedUser)
      setUser(data.user)
      setProfile(data.profile)
      setPage('feed')
    }
  }, [])

  const handleSignup = () => {
    const userData = {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value
    }
    const profileData = {
      who: document.getElementById('who').value,
      skills: document.getElementById('skills').value,
      goals: document.getElementById('goals').value,
      learn: document.getElementById('learn').value,
      help: document.getElementById('help').value
    }
    localStorage.setItem('connectAI', JSON.stringify({user: userData, profile: profileData}))
    setUser(userData)
    setProfile(profileData)
    setPage('feed')
  }

  const handleLogout = () => {
    localStorage.removeItem('connectAI')
    setUser(null)
    setPage('home')
  }

  // HOME
  if (page === 'home') return (
    <div style={styles.container}>
      <h1 style={styles.logo}>ConnectAI</h1>
      <p style={styles.tagline}>People ni followers kosam kaadu, future goals kosam</p>
      <button onClick={() => setPage('signup')} style={styles.btn}>Get Started</button>
    </div>
  )

  // SMART PROFILE SIGNUP
  if (page === 'signup') return (
    <div style={styles.container}>
      <h2>Smart Profile Create Chey</h2>
      <input id="name" placeholder="Nee peru" style={styles.input} />
      <input id="phone" placeholder="Phone" style={styles.input} />
      <input id="who" placeholder="Nenu evaru?" style={styles.input} />
      <input id="skills" placeholder="Naa skills: React, Design..." style={styles.input} />
      <input id="goals" placeholder="Naa goals: Startup, Job..." style={styles.input} />
      <input id="learn" placeholder="Nerchukovalanidi" style={styles.input} />
      <input id="help" placeholder="Nenu help cheyagalindi" style={styles.input} />
      <button onClick={handleSignup} style={styles.btn}>Join ConnectAI</button>
    </div>
  )

  // GOAL FEED + AI MATCH
  return (
    <div style={styles.feedContainer}>
      <div style={styles.header}>
        <h2>Welcome {user?.name}</h2>
        <button onClick={handleLogout} style={styles.logout}>Logout</button>
      </div>

      <h3>🤖 Niku Saripoye People</h3>
      {aiMatches.map((m,i) => (
        <div key={i} style={styles.matchCard}>
          <b>{m.name}</b> - {m.match} Match
          <p>Goal: {m.goal}</p>
          <p>Skill: {m.skill}</p>
          <button style={styles.smallBtn}>Connect</button>
        </div>
      ))}

      <h3 style={{marginTop:30}}>🎯 Goal Feed</h3>
      {goalFeed.map((p,i) => (
        <div key={i} style={styles.card}>
          <span style={styles.tag}>{p.type}</span>
          <b>{p.user}</b>
          <p>{p.text}</p>
        </div>
      ))}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 },
  feedContainer: { minHeight: '100vh', background: '#f0f2f5', padding: 20 },
  logo: { fontSize: 48, fontWeight: 'bold' },
  tagline: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  btn: { background: 'white', color: '#764ba2', padding: '14px 28px', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
  input: { padding: 12, borderRadius: 8, border: '1px solid #ddd', width: '80%', marginBottom: 10 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logout: { background: 'red', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6 },
  matchCard: { background: 'white', padding: 15, borderRadius: 12, marginBottom: 15 },
  card: { background: 'white', padding: 15, borderRadius: 12, marginBottom: 15 },
  tag: { background: '#667eea', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12, marginRight: 8 },
  smallBtn: { background: '#667eea', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, marginTop: 8 }
    }
