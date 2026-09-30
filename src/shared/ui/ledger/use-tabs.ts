import { useCallback, useId, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export type TabItem = { key: string; label: string; count?: number }

/**
 * State for `Tabs` + `TabPanel`. With `paramName` the active tab is read from and written to that URL
 * search param (replacing history), so a tab can be linked to.
 *
 * `panelId` makes every tab control one shared panel (filter-style tabs); without it each tab has its own.
 */
export function useTabs({
  items,
  label,
  defaultValue,
  paramName,
  panelId,
  onChange,
}: {
  items: TabItem[]
  /** Accessible name of the tablist. */
  label: string
  defaultValue?: string
  paramName?: string
  panelId?: string
  onChange?: (key: string) => void
}) {
  const idPrefix = useId()
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState(defaultValue ?? items[0]?.key)

  const fromUrl = paramName ? items.find((item) => item.key === searchParams.get(paramName))?.key : undefined
  const active = fromUrl ?? (paramName ? (defaultValue ?? items[0]?.key) : state)

  const select = useCallback(
    (key: string) => {
      if (paramName) {
        setSearchParams(
          (current) => {
            const next = new URLSearchParams(current)
            next.set(paramName, key)
            return next
          },
          { replace: true },
        )
      } else {
        setState(key)
      }
      onChange?.(key)
    },
    [paramName, setSearchParams, onChange],
  )

  const tabId = (key: string) => `${idPrefix}-tab-${key}`
  const controlsId = (key: string) => panelId ?? `${idPrefix}-panel-${key}`

  return {
    active,
    select,
    tabId,
    controlsId,
    tablistProps: { label, items, active, select, tabId, controlsId },
    /** Props for a panel `<div>`; pass the tab key, or nothing for a shared panel. */
    panelProps: (key?: string) => ({
      role: 'tabpanel' as const,
      id: key === undefined ? panelId : controlsId(key),
      'aria-labelledby': tabId(key ?? active),
      hidden: key !== undefined && key !== active,
    }),
  }
}

export type TabsState = ReturnType<typeof useTabs>
