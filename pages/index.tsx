import { useState, useEffect } from 'react'
import { auth, db } from './firebaseConfig'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { toast, Toaster } from 'react-hot-toast'
import { Clock } from 'lucide-react'

// ========== TYPES ==========
type UserType = {
  uid: string; coins: number; xp: number; level: number; streak: number;
  uid: string; coins: number; xp: number; level: number; streak: number;
  timeBank: number; lifeScore: number; scrollTimeToday: number; focusTimeToday: number;
};

type MissionType = { id: string; title: string; target: number; progress: number; reward: number; completed: boolean };


// ========== MAIN APP ==========
export default function QUITTR() {
  const [user, setUser] = useState<UserType | null>(null);
  const [tab, setTab] = useState('Home');
  const [missions, setMissions] = useState<MissionType[]>([]);

  useEffect(() => {
    signInAnonymously(auth);
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userDocRef = doc(db, 'users', u.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: u.uid, coins: 500, xp: 0, level: 1, streak: 0, timeBank: 0, lifeScore: 65,
            scrollTimeToday: 0, focusTimeToday: 0
          });
        }
        setUser(userDoc.exists()? userDoc.data() as UserType : { uid: u.uid, coins: 500, xp: 0, level: 1, streak: 0, timeBank: 0, lifeScore: 65, scrollTimeToday: 0, focusTimeToday: 0 });
      }
    });
    return () => unsub();
  }, []);

  if (!user) return <div className="h-screen flex items-center justify-center">Loading QUITTR 2.0...</div>;

  const tabs: any = {
    Home: <HomePage user={user} />,
    Focus: <FocusPage user={user} />,
    Learn: <LearnPage />,
    LifeScore: <LifeScorePage user={user} />,
    Challenges: <ChallengesPage />,
    Profile: <ProfilePage user={user} />
  }

  return (
    <div className="max-w-[500px] mx-auto bg-gray-50 min-h-screen pb-20">
      <Header user={user} />
      {tabs[tab]}
      <BottomNav tab={tab} setTab={setTab} />
      <Toaster />
    </div>
  )
}

function Header({ user }: { user: UserType }) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur p-4 border-b">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-600">QUITTR</h1>
        <div className="flex gap-3 items-center">
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">🪙 {user.coins}</span>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">Lv {user.level}</span>
        </div>
      </div>
    </div>
  )
}

// ========== PAGES ==========
function HomePage({ user }: { user: UserType }) {
  return (
    <div className="p-4">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-2xl mb-4">
        <h2 className="text-xl font-bold">Welcome back, Warrior!</h2>
        <p>Streak: {user.streak} days 🔥 | LifeScore: {user.lifeScore}</p>
      </div>
      <button onClick={() => toast("Scroll Tax feature coming soon!")} className="w-full bg-red-500 text-white p-4 rounded-xl font-bold">
        Start Focus Session
      </button>
    </div>
  )
}

function FocusPage({ user }: { user: UserType }) { return <div className="p-4">Focus Timer Page</div> }
function LearnPage() { return <div className="p-4">Learn Page</div> }
function LifeScorePage({ user }: { user: UserType }) { return <div className="p-4">LifeScore: {user.lifeScore}</div> }
function ChallengesPage() { return <div className="p-4">Challenges Page</div> }
function ProfilePage({ user }: { user: UserType }) { return <div className="p-4">Profile Page</div> }

function BottomNav({ tab, setTab }: { tab: string, setTab: any }) {
  const items = ['Home', 'Focus', 'Learn', 'LifeScore', 'Profile']
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2">
      {items.map(i => <button key={i} onClick={() => setTab(i)} className={tab === i? 'text-purple-600 font-bold' : 'text-gray-500'}>{i}</button>)}
    </div>
  )
      }
