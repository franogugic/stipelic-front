import { useEffect, useState } from 'react'
import { useAuthStore } from './features/auth/model/auth-store'
import { HomePage } from './features/auth/pages/HomePage'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage'

function App() {
  const [locationKey, setLocationKey] = useState(() => window.location.href)
  const currentUser = useAuthStore((state) => state.currentUser)
  const accountStatus = useAuthStore((state) => state.accountStatus)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser)
  const pathname = window.location.pathname
  const token = new URLSearchParams(window.location.search).get('token')

  useEffect(() => {
    if (window.location.pathname !== '/verify-email') {
      void loadCurrentUser()
    }
  }, [loadCurrentUser])

  useEffect(() => {
    const syncLocation = () => {
      setLocationKey(window.location.href)
    }

    window.addEventListener('popstate', syncLocation)

    return () => {
      window.removeEventListener('popstate', syncLocation)
    }
  }, [])

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path)
    setLocationKey(window.location.href)
  }

  if (pathname === '/verify-email') {
    return (
      <VerifyEmailPage
        key={locationKey}
        token={token}
        onContinue={() => {
          window.history.replaceState(null, '', '/')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }}
      />
    )
  }

  if (sessionStatus === 'checking') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f5f7] px-5 text-neutral-950">
        <section className="w-full max-w-sm rounded-[28px] border border-white/70 bg-white/85 p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <p className="text-sm font-semibold text-neutral-500">Creator Platform</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-normal">Preparing workspace</h1>
        </section>
      </main>
    )
  }

  if (currentUser || accountStatus === 'active') {
    return <HomePage user={currentUser} />
  }

  if (pathname === '/register') {
    return <RegisterPage onSignIn={() => navigateTo('/login')} />
  }

  return <LoginPage onCreateAccount={() => navigateTo('/register')} />
}

export default App
