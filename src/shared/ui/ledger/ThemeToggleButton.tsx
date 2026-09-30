import { SunMoon } from 'lucide-react'
import { useThemeStore } from '../../model/theme-store'
import { Button } from './Button'

/** Icon-only button that flips the theme, growing the new one out of the button. */
export function ThemeToggleButton() {
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  return (
    <Button
      variant="ghost"
      iconOnly
      icon={SunMoon}
      aria-label="Switch colour theme"
      onClick={(event) => toggleTheme(event.currentTarget)}
    />
  )
}
