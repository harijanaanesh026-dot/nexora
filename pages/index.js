import { useState, useEffect } from 'react'

export default function ConnectAI() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('ideas')
  const [aiGoal, setAiGoal] = useState('')

  // Dummy Data
  const feedData = {
    ideas: [{user: "Rahul", text: "AgriTech lo AI use chesi farmers ki help cheyochu"}, {user: "Priya", text: "Voice to Telugu blog converter idea"} ],
    projects: [{user: "Arjun", text: "Co-founder kavali - EdTech App"}, {user: "Sneha", text: "Open source: Telugu AI Chatbot"}],
    learning: [{user: "Kavya", text: "Next.js nerchukovali - help chestara?"}, {user: "Vikram", text: "System Design free workshop Sunday"}],
    collab: [{user: "Meera", text: "UI Designer kavali - Startup kosam"}, {user: "Aman", text: "Hackathon team - 2 members needed"}]
  }

  const communities = ["AI Builders", "Startup Ideas", "Coding", "Design", "Cricket Fans"]
  
  const getAIMatches = () => {
    if(!aiGoal) return []
    return [
      {type: "Learner", name: "Sita", match: "92%"},
      {type: "Mentor", name: "Dr. Ramesh", match: "88%"},
      {type: "Community", name: "AI Builders", match: "95%"}
    ]
  }

  useEffect(() => {
    const saved = localStorage.getItem('connectAI_v2')
    if (saved) {
      setUser(JSON.parse(saved))
      setPage('feed')
    }
  }, [])

  const handleSignup = () => {
    const userData = {
      name: document.getElementById('name').value,
      skills: document.getElementById('skills').value,
      goals: document.getElementById('goals').value,
      projects: document.getElementById('projects').value,
      help: document.getElementById('help').value,
      points: 120,
      level: "Rising Star"
    }
    localStorage.setItem('connectAI_v2', JSON.stringify(userData))
    setUser(userData)
    setPage('feed')
  }

  if (page === 'home') return (
    <div style={styles.container}>
      <h1 style={styles.logo}>ConnectAI</h1>
      <p>People ni followers kosam kaadu, future kosam</p>
      <button onClick={() => setPage('signup')} style={styles.btn}>Join Now</button>
    </div>
  )

  if (page === 'signup') return (
    <div style={styles.container}>
      <h2>Smart Profile</h2>
      <input id="name" placeholder="Nee peru" style={styles.input} />
      <input id="skills" placeholder="Skills: React, Python, Design" style={styles.input} />
      <input id="goals" placeholder="Goals: Startup, Job, Learn AI" style={styles.input} />
      <input id="projects" placeholder="Projects: 2 apps built" style={styles.input} />
      <input id="help" placeholder="Nenu help cheyagalindi: UI, Marketing" style={styles.input} />
      <button onClick={handleSignup} style={styles.btn}>Create Profile</button>
    </div>
  )

  // MAIN FEED
  return (
    <div style={styles.feedContainer}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2>Hi {user?.name} 👋</h2>
        <div>🏆 {user?.points} pts | {user?.level}</div>
      </div>

      {/* AI MATCH */}
      <div style={styles.aiBox}>
        <h3>🤖 AI Match</h3>
        <input value={aiGoal} onChange={e => setAiGoal(e.target.value)} placeholder="Nenu em nerchukovali? Emi cheyali?" style={styles.input} />
        {getAIMatches().map((m,i) => (
          <div key={i} style={styles.matchCard}>
            {m.type}: <b>{m.name}</b> - {m.match} Match <button style={styles.smallBtn}>Connect</button>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        {['ideas','projects','learning','collab'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab===tab? styles.activeTab : styles.tab}>
            {tab==='ideas' && '💡 Ideas'}
            {tab==='projects' && '🚀 Projects'}
            {tab==='learning' && '📚 Learning'}
            {tab==='collab' && '🤝 Collab'}
          </button>
        ))}
      </div>

      {/* FEED */}
      {feedData[activeTab].map((post,i) => (
        <div key={i} style={styles.card}>
          <b>{post.user}</b>
          <p>{post.text}</p>
          <button>👍 Helpful</button>
        </div>
      ))}

      {/* COMMUNITIES */}
      <h3 style={{marginTop:30}}>🌎 Communities</h3>
      <div style={styles.commGrid}>
        {communities.map(c => <div key={c} style={styles.commCard}>{c}</div>)}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 },
  feedContainer: { minHeight: '100vh', background: '#f0f2f5', padding: 20, paddingBottom: 80 },
  logo: { fontSize: 48, fontWeight: 'bold' },
  btn: { background: 'white', color: '#764ba2', padding: '14px 28px', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
  input: { padding: 12, borderRadius: 8, border: '1px solid #ddd', width: '100%', marginBottom: 10 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  aiBox: { background: 'white', padding: 15, borderRadius: 12, marginBottom: 20 },
  matchCard: { background: '#f0f2f5', padding: 10, borderRadius: 8, marginTop: 8 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' },
  tab: { padding: '8px 16px', border: 'none', background: 'white', borderRadius: 20 },
  activeTab: { padding: '8px 16px', border: 'none', background: '#667eea', color: 'white', borderRadius: 20 },
  card: { background: 'white', padding: 15, borderRadius: 12, marginBottom: 15 },
  commGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  commCard: { background: 'white', padding: 15, borderRadius: 12, textAlign: 'center' },
  smallBtn: { background: '#667eea', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6, marginLeft: 8 }
    }
