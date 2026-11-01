// Terms and Privacy are static pages in the app (placeholder text until the owner supplies it). Help has no page yet:
// its link renders only once HELP_URL is set (TASKS-09 open question 15).
export const TERMS_URL = '/terms'
export const PRIVACY_URL = '/privacy'
export const HELP_URL = '#'

/** TODO(owner): set to true once the real texts are in. Until then the footers hide the Terms and Privacy links; the
 * links next to the sign-up and set-password checkboxes stay (they must lead somewhere). */
export const LEGAL_TEXTS_READY = false

/** A footer link: shown only once the legal texts exist. */
export const isFooterLinked = (url: string) => LEGAL_TEXTS_READY && isLinked(url)

/** A link is shown only once its page exists (until then the URL is the placeholder `#`). */
export const isLinked = (url: string) => url !== '#'
