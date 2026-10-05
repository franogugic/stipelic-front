import { Link } from 'react-router-dom'

/** The Luma mark and wordmark, linking to `to`. Markup from the prototype's brandMarkup. */
export function Brand({ to }: { to: string }) {
  return (
    <Link className="brand" to={to} aria-label="Luma home">
      <svg className="brand__mark" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <rect className="brand__mark-bg" width="28" height="28" rx="8" />
        <g className="brand__mark-fg">
          <path d="M6.5 16.6a7.5 7.5 0 0 1 15 0z" />
          <rect x="4.5" y="18.4" width="19" height="2.1" rx="1.05" />
          <rect x="8.5" y="22" width="11" height="2.1" rx="1.05" />
        </g>
      </svg>
      <span className="brand__word">Luma</span>
    </Link>
  )
}
