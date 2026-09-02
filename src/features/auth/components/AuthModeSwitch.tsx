import { useNavigate } from 'react-router-dom'

type AuthModeSwitchProps = {
  mode: 'login' | 'register'
}

export function AuthModeSwitch({ mode }: AuthModeSwitchProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-6 flex gap-1 rounded-lg bg-white/5 p-1">
      <button
        type="button"
        onClick={() => navigate('/login')}
        className={`flex-1 rounded-md py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
          mode === 'login' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => navigate('/register')}
        className={`flex-1 rounded-md py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
          mode === 'register' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Register
      </button>
    </div>
  )
}
