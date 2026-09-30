import type { KeyboardEvent, ReactNode } from 'react'
import { useRef } from 'react'
import type { TabItem, TabsState } from './use-tabs'

/**
 * Tab list (`role="tablist"`) with a roving tabindex: ← → move and select, Home / End jump to the ends.
 * Drive it with `useTabs` and spread `tabs.tablistProps`.
 */
export function Tabs({
  label,
  items,
  active,
  select,
  tabId,
  controlsId,
  className,
}: TabsState['tablistProps'] & { className?: string }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = refs.current.findIndex((element) => element === document.activeElement)
    if (index === -1) return
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    }
    if (!(event.key in keys)) return
    event.preventDefault()
    const next = (keys[event.key] + items.length) % items.length
    select(items[next].key)
    refs.current[next]?.focus()
  }

  return (
    <div className={['tabs', className].filter(Boolean).join(' ')} role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {items.map((item: TabItem, index) => {
        const selected = item.key === active
        return (
          <button
            key={item.key}
            ref={(element) => {
              refs.current[index] = element
            }}
            className="tab"
            type="button"
            role="tab"
            id={tabId(item.key)}
            aria-controls={controlsId(item.key)}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            data-tab={item.key}
            onClick={() => select(item.key)}
          >
            {item.label}
            {item.count !== undefined && <span className="tab__count">{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** A tab panel. Give it a key for own-panel tabs, or leave `value` out for a shared panel. */
export function TabPanel({
  tabs,
  value,
  className,
  children,
}: {
  tabs: TabsState
  value?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={['tab-panel', className].filter(Boolean).join(' ')} {...tabs.panelProps(value)}>
      {children}
    </div>
  )
}
