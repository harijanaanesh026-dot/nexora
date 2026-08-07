"use client"
import { useState } from "react";

export default function NexoraApp() {
  const [tab, setTab] = useState("home");

  return (
    <div style={{maxWidth: 600, margin: "0 auto", paddingBottom: 80, fontFamily: "Inter"}}>

      {/* HEADER */}
      <header style={{padding: 16, borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "white", zIndex: 10}}>
        <h1>🌍 NEXORA</h1>
      </header>

      {/* TAB CONTENT */}
      {tab === "home" && <HomeTab />}
      {tab === "discover" && <DiscoverTab />}
      {tab === "collaborate" && <CollaborateTab />}
      {tab === "chat" && <ChatTab />}
      {tab === "profile" && <ProfileTab />}

      {/* BOTTOM NAV */}
      <nav style={styles.nav}>
        <NavBtn icon="🏠" label="Home" active={tab==="home"} onClick={()=>setTab("home")} />
        <NavBtn icon="🔍" label="Discover" active={tab==="discover"} onClick={()=>setTab("discover")} />
        <NavBtn icon="🚀" label="Collaborate" active={tab==="collaborate"} onClick={()=>setTab("collaborate")} />
        <NavBtn icon="💬" label="Chat" active={tab==="chat"} onClick={()=>setTab("chat")} />
        <NavBtn icon="👤" label="Profile" active={tab==="profile"} onClick={()=>setTab("profile")} />
      </nav>
    </div>
  )
}

function NavBtn({icon, label, active, onClick}) {
  return <button onClick={onClick} style={{...styles.navBtn, color: active? "#4F46E5" : "#888"}}>
    <div style={{fontSize: 20}}>{icon}</div><div style={{fontSize: 10}}>{label}</div>
  </button>
}

/* ============ 1. HOME TAB ============ */
function HomeTab() {
  return <div style={{padding: 16}}>
    <Section title="🔥 Discover People" content="Today’s Top Builders in Rayadurg" />
    <Section title="📈 Trending Communities" content="Learn Coding, Startup India, Fitness" />
    <Section title="✨ Success Stories" content="Ravi → Google in 1 year" />
    <Section title="🎯 Goal Rooms Live" content="200 people coding right now" />
    <Section title="📅 Upcoming Events" content="Startup Meetup - Aug 15" />
  </div>
}

/* ============ 2. DISCOVER TAB ============ */
function DiscoverTab() {
  return <div style={{padding: 16}}>
    <input placeholder="Search People..." style={styles.input} />
    <div style={styles.filters}>
      <button style={styles.filter}>Skills</button>
      <button style={styles.filter}>City</button>
      <button style={styles.filter}>Goals</button>
      <button style={styles.filter}>Profession</button>
    </div>
    <h3>🌟 Unique Matches</h3>
    <Card title="Accountability Partner" desc="Find gym/code/study partner" />
    <Card title="Mentor Finder" desc="Get guidance from experts" />
    <Card title="Study Partner" desc="Learn together" />
    <Card title="Skill Exchange" desc="Nenu coding, nuvvu English" />
    <Card title="Travel Buddy" desc="Find travel partners" />
  </div>
}

/* ============ 3. COLLABORATE TAB ============ */
function CollaborateTab() {
  return <div style={{padding: 16}}>
    <button style={styles.btnPrimary}>+ Post a Project</button>
    <button style={styles.btnPrimary}>+ Find Co-Founder</button>
    <h3>💼 Opportunities</h3>
    <Card title="Jobs" desc="Full-time roles" />
    <Card title="Internships" desc="For students" />
    <Card title="Freelance" desc="Quick gigs" />
    <Card title="Competitions" desc="Win prizes" />
    <Card title="Scholarships" desc="Funding" />
    <h3>👥 Communities</h3>
    <Card title="Create Community" desc="Start your own" />
    <Card title="Polls & Announcements" desc="Engage members" />
    <h3>📅 Events</h3>
    <Card title="Online Workshops" desc="Learn new skills" />
    <Card title="Offline Meetups" desc="Network IRL" />
  </div>
}

/* ============ 4. CHAT TAB ============ */
function ChatTab() {
  return <div style={{padding: 16}}>
    <h3>💬 Messages</h3>
    <Card title="One-to-One Chat" desc="DM your connections" />
    <Card title="Group Chat" desc="Community + Project groups" />
    <Card title="Voice Messages" desc="Send voice notes" />
    <Card title="File Sharing" desc="Share resume, portfolio" />
    <h3>🤝 Connections</h3>
    <Card title="Connection Requests" desc="3 pending" />
    <Card title="Mutual Connections" desc="See who you know" />
  </div>
}

/* ============ 5. PROFILE TAB ============ */
function ProfileTab() {
  return <div style={{padding: 16}}>
    <div style={{textAlign: "center"}}>
      <img src="https://i.pravatar.cc/100" style={{borderRadius: "50%"}} />
      <h2>Your Name</h2>
      <p>Builder | Rayadurg</p>
    </div>
    <Section title="📝 Bio" content="Add your bio" />
    <Section title="🛠️ Skills" content="React, Python, Design" />
    <Section title="🎯 Goals" content="Start Startup in 2026" />
    <Section title="📚 Education & Experience" content="Add details" />
    <Section title="🔗 Portfolio" content="github.com/you" />
    <Section title="🏆 Achievements" content="Badges & Trust Score" />
    <h3>⭐ Reputation</h3>
    <Card title="Endorse Skills" desc="Get endorsed by others" />
    <Card title="Reviews" desc="4.8 ★ from 20 people" />
    <h3>🛡️ Safety</h3>
    <button style={styles.btnGhost}>Privacy Controls</button>
    <button style={styles.btnGhost}>Report / Block</button>
  </div>
}

/* ============ UI HELPERS ============ */
function Section({title, content}) {
  return <div style={styles.card}><h3>{title}</h3><p>{content}</p></div>
}
function Card({title, desc}) {
  return <div style={styles.card}><b>{title}</b><p style={{fontSize: 12, color: "#666"}}>{desc}</p></div>
}

const styles = {
  nav: {position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", background: "white", borderTop: "1px solid #eee", padding: 8},
  navBtn: {background: "none", border: "none", cursor: "pointer"},
  card: {border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 12},
  input: {width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", marginBottom: 12},
  btnPrimary: {background: "#4F46E5", color: "white", padding: "12px 16px", borderRadius: 8, border: "none", width: "100%", marginBottom: 10, fontWeight: 600},
  btnGhost: {background: "#f3f4f6", padding: "10px 16px", borderRadius: 8, border: "none", width: "100%", marginBottom: 10},
  filters: {display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap"},
  filter: {padding: "6px 12px", borderRadius: 20, border: "1px solid #ddd", background: "white"}
        }
