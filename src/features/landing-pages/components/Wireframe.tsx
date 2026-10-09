import type { ReactNode } from 'react'

// Small schematic thumbnails of every section layout (the section picker and the layout switch), the prototype's
// WIREFRAMES. A string is an empty `<span>` with those classes; a tuple is a container: [classes, ...children].
type Node = string | [string, ...Node[]]

const l = 'wf-l'
const xs = 'wf-l wf-l--xs'
const short = 'wf-l wf-l--short'
const t = 'wf-t'
const tShort = 'wf-t wf-t--short'
const navLinks: Node = ['wf-row', xs, xs, xs]
const featureCol: Node = ['wf-col', 'wf-num', l, short]
const checkRow: Node = ['wf-row', 'wf-dot', l]
const bulletRow: Node = ['wf-row', 'wf-dot', short]

const WIREFRAMES: Record<string, Node[]> = {
  'navbar-simple': [['wf-row wf-row--between', 'wf-logo', navLinks], 'wf-ghost'],
  'navbar-centered': [['wf-col wf-col--center', 'wf-logo', navLinks], 'wf-ghost'],
  'hero-split': [['wf-row wf-row--fill', ['wf-col', t, tShort, l, short, 'wf-b'], 'wf-img']],
  'hero-centered': [['wf-col wf-col--center wf-col--fill', t, tShort, short, 'wf-b']],
  'features-numbered': [tShort, ['wf-row wf-row--fill', featureCol, featureCol, featureCol]],
  'features-checklist': [tShort, ['wf-grid2', checkRow, checkRow, checkRow, checkRow]],
  'product-image-left': [['wf-row wf-row--fill', 'wf-img', ['wf-col', t, l, bulletRow, bulletRow, 'wf-b']]],
  'product-card': [['wf-row wf-row--fill', ['wf-col', t, l, l, short], ['wf-card', tShort, 'wf-price', 'wf-b']]],
  'testimonials-cards': [['wf-dark', tShort, ['wf-row wf-row--fill', 'wf-quote', 'wf-quote', 'wf-quote']]],
  'testimonials-single': [['wf-col wf-col--center wf-col--fill', 'wf-mark', t, tShort, xs]],
  'faq-accordion': [tShort, 'wf-acc', 'wf-acc', 'wf-acc', 'wf-acc'],
  'faq-columns': [['wf-row wf-row--fill', ['wf-col', t], ['wf-col', 'wf-acc', 'wf-acc', 'wf-acc']]],
  'gallery-grid': [tShort, ['wf-gallery', 'wf-img', 'wf-img', 'wf-img', 'wf-img', 'wf-img', 'wf-img']],
  'gallery-mosaic': [tShort, ['wf-gallery wf-gallery--mosaic', 'wf-img', 'wf-img', 'wf-img', 'wf-img', 'wf-img']],
  'cta-banner': [['wf-brand', t, short, 'wf-b wf-b--inverted']],
  'cta-card': [['wf-col wf-col--center wf-col--fill', ['wf-card wf-card--center', t, short, 'wf-b']]],
  'footer-simple': ['wf-ghost', ['wf-row wf-row--between wf-foot', xs, xs]],
  'footer-centered': ['wf-ghost', ['wf-col wf-col--center wf-foot', xs, xs]],
}

function render(node: Node, key: number): ReactNode {
  if (typeof node === 'string') {
    return (
      <span className={node} key={key}>
        {node === 'wf-mark' ? '“' : null}
      </span>
    )
  }
  const [className, ...children] = node
  return (
    <span className={className} key={key}>
      {children.map(render)}
    </span>
  )
}

/** `slug` is the section kind's slug (`product`), `variant` the layout id (`card`). */
export function Wireframe({ slug, variant }: { slug: string; variant: string }) {
  return (
    <span className="wf" aria-hidden="true">
      {(WIREFRAMES[`${slug}-${variant}`] ?? []).map(render)}
    </span>
  )
}
