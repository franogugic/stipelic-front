import { Brand } from './ledger'

/** Full-page loading state, shown while the session is checked: the Luma mark above skeleton lines. */
export function LoadingPage() {
  return (
    <main className="solo" aria-busy="true">
      <div className="solo__main">
        <div className="solo__box">
          <Brand />
          <span className="sr-only" role="status">
            Loading…
          </span>
          <span className="skeleton skeleton--title" />
          <span className="skeleton skeleton--mid" />
        </div>
      </div>
    </main>
  )
}
