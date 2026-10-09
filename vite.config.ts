import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Fills %VITE_PUBLIC_SITE_URL% in index.html (the site's public origin, decided at deploy). Vite leaves an unset
// placeholder as literal text, so an empty value is applied here, and the og:url tag is dropped when there is none.
function publicSiteUrl(): Plugin {
  let siteUrl = ''
  return {
    name: 'public-site-url',
    configResolved(config) {
      siteUrl = (loadEnv(config.mode, config.envDir || config.root, 'VITE_').VITE_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '')
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const withUrl = siteUrl ? html : html.replace(/^[ \t]*<meta property="og:url"[^>]*>\r?\n/m, '')
        return withUrl.replaceAll('%VITE_PUBLIC_SITE_URL%', siteUrl)
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), publicSiteUrl()],
  server: {
    host: 'localhost',
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
