// Terms and Privacy are static pages in the app (placeholder text until the owner supplies it). Help has no page yet:
// its link renders only once HELP_URL is set (TASKS-09 open question 15).
export const TERMS_URL = '/terms'
export const PRIVACY_URL = '/privacy'
export const HELP_URL = '#'

/** A link is shown only once its page exists (until then the URL is the placeholder `#`). */
export const isLinked = (url: string) => url !== '#'
