import { Moon, Sun } from 'lucide-react'
import { useId } from 'react'
import { useThemeStore } from '../../model/theme-store'
import type { Theme } from '../../model/theme-store'

const OPTIONS: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

/** Light / Dark radio group. The new theme grows out of the option that was picked. */
export function ThemeSwitch() {
  const name = useId()
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  return (
    <div className="theme-switch" role="radiogroup" aria-label="Colour theme">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <label className="theme-switch__option" key={value}>
          <input
            type="radio"
            name={`theme-${name}`}
            value={value}
            checked={theme === value}
            onChange={(event) => setTheme(value, event.currentTarget.closest('label'))}
          />
          <span className="theme-switch__label">
            <Icon />
            {label}
          </span>
        </label>
      ))}
    </div>
  )
}
