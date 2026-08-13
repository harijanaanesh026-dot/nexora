import '../styles/globals.css'
import type { AppProps } from 'next/app' // ✅ CORRECT

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
