// Static illustration content for the homepage, taken from the prototype's mock data (designer-prototype/js/mock-data.js).
// It is never real user data: the hero mock, the bento visuals and the creators strip only show what Luma looks like.

export const MOCK_CREATORS: Array<[name: string, city: string]> = [
  ['MH Studio', 'Split'],
  ['Lejla Writes', 'Sarajevo'],
  ['Kotor Guide', 'Kotor'],
  ['Ana Illustrates', 'Skopje'],
  ['Nikolić Fitness', 'Novi Sad'],
  ['Emina Yoga', 'Mostar'],
  ['Prishtina Code', 'Prishtina'],
  ['Golob Ceramics', 'Ljubljana'],
  ['Radić Sound', 'Zagreb'],
  ['Petek Botanicals', 'Maribor'],
]

export const MOCK_COUNTRIES: Array<{ code: string; name: string; payout: 'stripe' | 'iban' }> = [
  { code: 'HR', name: 'Croatia', payout: 'stripe' },
  { code: 'SI', name: 'Slovenia', payout: 'stripe' },
  { code: 'RS', name: 'Serbia', payout: 'iban' },
  { code: 'BA', name: 'Bosnia and Herzegovina', payout: 'iban' },
  { code: 'ME', name: 'Montenegro', payout: 'iban' },
  { code: 'MK', name: 'North Macedonia', payout: 'iban' },
  { code: 'AL', name: 'Albania', payout: 'iban' },
  { code: 'XK', name: 'Kosovo', payout: 'iban' },
  { code: 'BG', name: 'Bulgaria', payout: 'stripe' },
  { code: 'RO', name: 'Romania', payout: 'stripe' },
  { code: 'GR', name: 'Greece', payout: 'stripe' },
]

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
    question: 'I live in Serbia or Bosnia. Can I get paid?',
    answer:
      'Yes. In countries Stripe doesn’t support, Luma collects your sales and you request a payout to your bank account (IBAN) whenever you like.',
  },
  {
    question: 'How do buyers get my product?',
    answer: 'Every product is a link — a download, a course, a booking page. The buyer receives it by email right after paying.',
  },
  {
    question: 'Can I cancel any time?',
    answer: 'Yes. Your plan stays active until the end of the paid period, then your workspace moves to the Free plan.',
  },
]

/** Support address, set per deployment; empty until there is a real one (the contact links are then hidden). */
export const SUPPORT_EMAIL = ((import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? '').trim()
