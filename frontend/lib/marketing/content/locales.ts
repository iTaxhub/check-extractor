import type { MarketingPage } from '../types';

const UPDATED = '2026-10-26';

/** One hreflang set: the US check page and its Canadian and UK cheque versions. */
const ALTERNATES = {
  'en-US': '/features/check-reconciliation-quickbooks-online',
  'en-CA': '/ca/cheque-reconciliation-quickbooks',
  'en-GB': '/uk/cheque-reconciliation-quickbooks',
};

const STEPS = [
  'Upload the bank statement PDF you download from your bank. Kyriq finds the cheque images and reads the cheque number, date, payee and amount, including handwritten cheques.',
  'Kyriq compares each cheque with the QuickBooks Online register you choose and scores the match.',
  'Exact matches are grouped for approval in one action. Possible duplicates and discrepancies go to Needs Attention.',
  'Once an authorised user approves, Kyriq clears the cheques in the QuickBooks Online reconciliation and records the decision.',
];

export const LOCALE_PAGES: MarketingPage[] = [
  {
    section: 'ca',
    slug: 'cheque-reconciliation-quickbooks',
    locale: 'en-CA',
    alternates: ALTERNATES,
    keyword: 'cheque reconciliation quickbooks',
    title: 'Cheque Reconciliation for QuickBooks Online in Canada',
    description:
      'Cheque reconciliation for QuickBooks Online in Canada: read cheques from your bank statement, match them to QBO and clear approved cheques in one batch.',
    eyebrow: 'Canada',
    h1: 'Cheque reconciliation for QuickBooks Online in Canada',
    intro:
      'Kyriq reads the cheques on the statement you download from your Canadian bank, matches each one to QuickBooks Online and clears the cheques your team approves. Nothing is cleared without a person saying yes.',
    body: [
      {
        heading: 'Why cheques still slow down Canadian month-end',
        paragraphs: [
          'Cheques remain common in Canada for rent, contractors, payroll advances and supplier payments. The bank feed shows that a cheque cleared, but not who it was written to, so matching the statement against QuickBooks Online is still done cheque by cheque in many firms.',
        ],
      },
      { heading: 'How Kyriq reconciles cheques', steps: STEPS },
      {
        heading: 'What Canadian firms should know',
        bullets: [
          'Kyriq works with QuickBooks Online. QuickBooks Desktop is not supported.',
          'Plans are priced and billed in US dollars.',
          'Every plan includes unlimited QuickBooks Online companies and users, so one subscription covers your whole client list.',
          'The trial covers 14 days or 250 cheques, whichever comes first, with no credit card required.',
        ],
      },
      {
        heading: 'Stale-dated and outstanding cheques',
        paragraphs: [
          'Canadian banks generally treat a cheque as stale-dated after six months. Kyriq keeps every processed cheque visible, so cheques that never matched a statement line are easy to find and follow up before they go stale.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Kyriq work with QuickBooks Online Canada?',
        a: 'Kyriq connects to QuickBooks Online through Intuit’s API. If you want to confirm your company setup before starting the trial, email support@kyriq.com.',
      },
      {
        q: 'Can Kyriq read handwritten cheques?',
        a: 'Yes. Kyriq reads typed and handwritten cheques and shows a confidence score, so uncertain reads can be checked before anything is cleared.',
      },
      {
        q: 'What currency are Kyriq plans billed in?',
        a: 'Plans are billed in US dollars: Starter $249, Professional $649 and Firm $1,299 per month.',
      },
    ],
    related: [
      '/guides/outstanding-cheques-quickbooks-online-canada',
      '/uk/cheque-reconciliation-quickbooks',
      '/features/handwritten-check-ocr',
      '/features/bulk-check-processing',
      '/pricing',
    ],
    updated: UPDATED,
  },
  {
    section: 'uk',
    slug: 'cheque-reconciliation-quickbooks',
    locale: 'en-GB',
    alternates: ALTERNATES,
    keyword: 'cheque reconciliation quickbooks uk',
    title: 'Cheque Reconciliation for QuickBooks Online (UK)',
    description:
      'Cheque reconciliation for QuickBooks Online in the UK: read cheques from bank statements, match them to QBO and clear approved cheques together.',
    eyebrow: 'United Kingdom',
    h1: 'Cheque reconciliation for QuickBooks Online in the UK',
    intro:
      'Fewer UK businesses write cheques than a decade ago, but the ones that do (landlords, charities, schools, trades) still reconcile them by hand. Kyriq reads the cheques on your bank statement, matches them in QuickBooks Online and clears the ones you approve.',
    body: [
      {
        heading: 'Where cheques still matter in the UK',
        paragraphs: [
          'Charities, churches, parish councils, letting agents and construction firms still issue and receive cheques. Because they are a minority of transactions, they are often the items left uncleared at month-end.',
        ],
      },
      { heading: 'How Kyriq reconciles cheques', steps: STEPS },
      {
        heading: 'What UK firms should know',
        bullets: [
          'Kyriq works with QuickBooks Online, not QuickBooks Desktop.',
          'Plans are priced and billed in US dollars.',
          'Unlimited QuickBooks Online companies and users on every plan.',
          'An authorised user approves every cheque before it is cleared, and every decision is logged.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Kyriq work with QuickBooks Online UK?',
        a: 'Kyriq connects to QuickBooks Online through Intuit’s API. If you want to confirm your company setup before starting the trial, email support@kyriq.com.',
      },
      {
        q: 'Is anything cleared automatically?',
        a: 'No. An authorised user approves each match first; only then does Kyriq clear the cheque in the QuickBooks reconciliation.',
      },
      {
        q: 'What currency are Kyriq plans billed in?',
        a: 'Plans are billed in US dollars: Starter $249, Professional $649 and Firm $1,299 per month.',
      },
    ],
    related: [
      '/ca/cheque-reconciliation-quickbooks',
      '/features/check-reconciliation-quickbooks-online',
      '/features/handwritten-check-ocr',
      '/for/churches-and-nonprofits',
      '/pricing',
    ],
    updated: UPDATED,
  },
];
