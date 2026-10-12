import { useEffect, useLayoutEffect } from 'react'

function hashTargetId() {
  try {
    return decodeURIComponent(window.location.hash.slice(1))
  } catch {
    return ''
  }
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Page-level setup for the homepage, undone on unmount:
 * - the `mk` class on `<body>` (the canvas background of the marketing page, from home.css)
 * - smooth scrolling for the anchor links (the global reduced-motion rule switches it off again)
 * - a jump to the `#section` in the URL: the page renders after the session check, so the browser's own jump has missed it
 * - `has-reveal` on `<html>`, which hides the `[data-reveal]` blocks until they scroll into view
 */
export function usePageChrome() {
  useLayoutEffect(() => {
    const { body, documentElement } = document
    body.classList.add('mk')
    document.getElementById(hashTargetId())?.scrollIntoView()
    documentElement.style.scrollBehavior = 'smooth'
    return () => {
      body.classList.remove('mk')
      documentElement.style.scrollBehavior = ''
    }
  }, [])

  useLayoutEffect(() => {
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) return
    document.documentElement.classList.add('has-reveal')
    return () => document.documentElement.classList.remove('has-reveal')
  }, [])
}

/**
 * Fades the `[data-reveal]` blocks in as they scroll into view. Pass a value that changes whenever blocks are added
 * after the first render (the pricing cards arrive from the API), so the new ones are observed too.
 */
export function useScrollReveal(revision: unknown) {
  useEffect(() => {
    if (!document.documentElement.classList.contains('has-reveal')) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [revision])
}
