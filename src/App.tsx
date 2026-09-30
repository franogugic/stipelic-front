import { AppRouter } from './app/router/AppRouter'
import { ToastProvider, TooltipProvider } from './shared/ui/ledger'

function App() {
  return (
    <TooltipProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </TooltipProvider>
  )
}

export default App
