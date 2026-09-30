import { LayoutGrid, SunMoon } from 'lucide-react'
import { useThemeStore } from '../../shared/model/theme-store'
import { Button } from '../../shared/ui/ledger'
import { ButtonsSection, FormsSection } from './ButtonsAndForms'
import { DataSection } from './DataSection'
import { FeedbackSection, StatesSection } from './FeedbackAndStates'
import { FoundationsSections } from './FoundationsSections'
import './styleguide.css'

/**
 * Development-only catalogue of the Ledger foundations and components, mirroring
 * designer-prototype/pages/styleguide.html. Registered only when `import.meta.env.DEV`.
 */
export default function StyleguidePage() {
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="app">
        {/* Stand-in for the sidebar: the real one arrives with the app shell (Unit 3). */}
        <aside className="app-sidebar" aria-label="Sidebar" />

        <div className="app-canvas">
          <main className="page" id="main" tabIndex={-1}>
            <header className="page-header">
              <div className="page-header__text">
                <p className="eyebrow">Ledger · v0.1</p>
                <h1 className="page-title">
                  Design <em>system</em>
                </h1>
                <p className="page-header__subtitle">
                  The foundations and shared components every Luma screen is built from. Switch the theme with the button — every
                  value on this page updates live.
                </p>
              </div>
              <div className="page-header__actions">
                <Button
                  variant="secondary"
                  iconOnly
                  icon={SunMoon}
                  aria-label="Switch colour theme"
                  onClick={(event) => toggleTheme(event.currentTarget)}
                />
                <Button variant="secondary" icon={LayoutGrid} href="/">
                  All screens
                </Button>
              </div>
            </header>

            <nav className="sg-toc" aria-label="On this page">
              <a href="#principles">Principles</a>
              <a href="#colour">Colour</a>
              <a href="#type">Typography</a>
              <a href="#shape">Space &amp; shape</a>
              <a href="#buttons">Buttons</a>
              <a href="#forms">Forms</a>
              <a href="#data">Data display</a>
              <a href="#feedback">Feedback</a>
              <a href="#states">Screen states</a>
            </nav>

            <FoundationsSections />
            <ButtonsSection />
            <FormsSection />
            <DataSection />
            <FeedbackSection />
            <StatesSection />
          </main>
        </div>
      </div>
    </>
  )
}
