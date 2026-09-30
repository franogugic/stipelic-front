import { AppRouter } from './app/router/AppRouter'
import { TooltipProvider } from './shared/ui/ledger'

function App() {
  return (
    <TooltipProvider>
      <AppRouter />
    </TooltipProvider>
  )
}

export default App
