export default function Home() {
  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(to bottom right, #581c87, #831843, #000)',color:'white',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'16px',textAlign:'center',fontFamily:'system-ui'}}>
      <h1 style={{fontSize:'56px',fontWeight:'bold',marginBottom:'16px'}}>Nexora</h1>
      <p style={{fontSize:'20px',marginBottom:'32px',opacity:'0.9'}}>AI-Powered Dating for India 🇮🇳</p>
      <div style={{background:'rgba(255,255,255,0.1)',padding:'32px',borderRadius:'16px',maxWidth:'400px'}}>
        <p style={{fontSize:'18px'}}>Find your purpose, not just popularity</p>
        <button style={{marginTop:'24px',background:'#ec4899',padding:'14px 32px',borderRadius:'9999px',fontSize:'18px',fontWeight:'600',border:'none',color:'white',cursor:'pointer'}}>
          Get Started
        </button>
      </div>
    </main>
  )
}