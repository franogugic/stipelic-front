// Static illustration content for the homepage, taken from the prototype's mock data (designer-prototype/js/mock-data.js).
// It is never real user data: the hero mock and the bento visuals only show what Luma looks like, with sample data.

/** A few of the countries creators can sell from (the API's payout-countries list has them all: every EU country,
 * Norway, Liechtenstein, Switzerland, the UK, the US and Canada). Every one of them is paid out through Stripe. */
export const MOCK_COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'HR', name: 'Croatia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'AT', name: 'Austria' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'GR', name: 'Greece' },
]

/** The number of EU member states; creators can sell from every one of them. */
export const EU_COUNTRY_COUNT = 27

/** Revenue per month, oldest first (Oct 2025 – Sep 2026), in cents. */
export const MOCK_MONTHLY_REVENUE_CENTS = [
  10800, 40200, 10800, 33700, 36600, 42700, 35800, 39500, 50300, 57200, 56500, 54400,
]
export const MOCK_MONTH_LABELS = ['O', 'N', 'D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S']
export const MOCK_TOTAL_REVENUE_CENTS = 468500
export const MOCK_AVERAGE_ORDER_CENTS = 7437
export const MOCK_REVENUE_GROWTH_PERCENT = 33.8
export const MOCK_DATE = '29 Sep 2026'

export const MOCK_ORDERS = [
  { name: 'Borna Rakić', initials: 'BR', amountCents: 14900 },
  { name: 'Klara Mitrović', initials: 'KM', amountCents: 2900 },
  { name: 'Stefan Jovanović', initials: 'SJ', amountCents: 2900 },
  { name: 'Borna Tomić', initials: 'BT', amountCents: 14900 },
]

export const MOCK_OPEN_RATES = { labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], values: [52, 71, 55, 59, 49, 54] }

export const MOCK_SUBSCRIBERS = {
  initials: ['BG', 'MB', 'MB', 'DM', 'JR', 'MN'],
  more: 133,
  recent: [
    { email: 'borna.golob3@outlook.com', source: 'Free Color Grading Guide' },
    { email: 'maja.begic7@gmail.com', source: 'Free Color Grading Guide' },
    { email: 'maja.bozic1@mts.rs', source: 'Free Color Grading Guide' },
  ],
}

export type FaqItem = { question: string; answer: string }

export const faqItems = (): FaqItem[] => [
  {
    question: 'Do I need to know how to code?',
    answer:
      'No. You build pages from ready-made sections, fill in your text and images, and publish. Your logo and colour are applied everywhere automatically.',
  },
  {
    question: 'Which countries can I sell from?',
    answer:
      'Luma is built for creators in Croatia and across the EU. You’re paid through your own Stripe account, so you can sell from any EU country — and from Norway, Liechtenstein, Switzerland, the UK, the US and Canada.',
  },
  {
    question: 'How do buyers get my product?',
    answer:
      'Every product is a document — a PDF, EPUB or ZIP. It downloads the moment they pay, and they get a personal link by email to download it again any time.',
  },
  {
    question: 'Can I cancel any time?',
    answer: 'Yes. Your plan stays active until the end of the paid period, then your workspace moves to the Free plan.',
  },
]

/** Support address, set per deployment; empty until there is a real one (the contact links are then hidden). */
export const SUPPORT_EMAIL = ((import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? '').trim()
