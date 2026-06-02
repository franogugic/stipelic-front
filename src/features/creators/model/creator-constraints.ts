export const creatorConstraints = {
  name: {
    minLength: 2,
    maxLength: 50,
  },
  slug: {
    minLength: 3,
    maxLength: 50,
  },
  planCode: {
    maxLength: 20,
  },
  defaultCurrency: {
    maxLength: 5,
  },
  supportEmail: {
    maxLength: 100,
  },
  brandName: {
    maxLength: 50,
  },
  logoUrl: {
    maxLength: 500,
  },
  primaryColor: {
    maxLength: 7,
  },
  timezone: {
    maxLength: 50,
  },
  language: {
    maxLength: 10,
  },
} as const
