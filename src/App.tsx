import { useEffect, useState } from 'react'
import { useAuthStore } from './features/auth/model/auth-store'
import { HomePage } from './features/auth/pages/HomePage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage'

function App() {
  const [locationKey, setLocationKey] = useState(() => window.location.href)
  const currentUser = useAuthStore((state) => state.currentUser)
  const accountStatus = useAuthStore((state) => state.accountStatus)
  const pathname = window.location.pathname
  const token = new URLSearchParams(window.location.search).get('token')

  useEffect(() => {
    const syncLocation = () => {
      setLocationKey(window.location.href)
    }

    window.addEventListener('popstate', syncLocation)

    return () => {
      window.removeEventListener('popstate', syncLocation)
    }
  }, [])

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

  if (currentUser || accountStatus === 'active') {
    return <HomePage user={currentUser} />
  }

  return <RegisterPage />
}

export default App
