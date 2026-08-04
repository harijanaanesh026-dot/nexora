export default function Home() {
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
      <p style={{fontSize: '1.2rem', margin: '10px 0'}}>AI-Powered Dating for India 🇮🇳</p>
      <p style={{fontSize: '1rem', opacity: 0.9}}>Find your purpose, not just popularity</p>
      <button style={{
        marginTop: '30px',
        padding: '12px 30px',
        fontSize: '1.1rem',
        background: 'white',
        color: '#764ba2',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}>
        Get Started
      </button>
    </main>
  )
}