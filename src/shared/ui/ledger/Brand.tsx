import { Link } from 'react-router-dom'

/** The Luma mark and wordmark, linking to `to`. Markup from the prototype's brandMarkup. */
export function Brand({ to }: { to: string }) {
  return (
    <Link className="brand" to={to} aria-label="Luma home">
      <svg className="brand__mark" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <rect className="brand__mark-bg" width="28" height="28" rx="8" />
        <g className="brand__mark-fg" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="14" cy="8.2" r="2.3" />
          <path d="M14 10.5v11" />
          <path d="M7.4 15.6a6.6 6.6 0 0 0 13.2 0" />
          <path d="M10.6 13.4h6.8" />
        </g>
      </svg>
      <span className="brand__word">Luma</span>
    </Link>
  )
}
