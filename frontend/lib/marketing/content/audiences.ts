import type { MarketingPage } from '../types';

const UPDATED = '2026-10-26';

const WORKFLOW = [
  'Upload the bank statement PDF. Kyriq extracts every check on it, typed or handwritten.',
  'Kyriq matches each check to the QuickBooks Online register and scores it.',
  'Approve all 100% matches together; review Needs Attention one by one.',
  'Kyriq clears the approved checks in the QuickBooks Online reconciliation and logs every decision.',
];

const CORE_FAQS = [
  {
    q: 'Does Kyriq clear checks without approval?',
    a: 'No. Nothing is cleared without user approval. After an authorized user approves a match, Kyriq clears the corresponding transaction in the QuickBooks reconciliation.',
  },
  {
    q: 'What is included in the free trial?',
    a: 'The trial lasts 14 days or until 250 checks have been processed, whichever comes first. No credit card is required, and the complete reconciliation workflow is available.',
  },
];

export const AUDIENCE_PAGES: MarketingPage[] = [
  {
    section: 'for',
    slug: 'accounting-firms',
    keyword: 'bank reconciliation software for accounting firms',
    title: 'Check Reconciliation Software for Accounting Firms',
    description:
      'Check reconciliation software for accounting firms on QuickBooks Online: unlimited client companies and users, bulk approval of exact matches, audit trail.',
    eyebrow: 'For accounting firms',
    h1: 'Check reconciliation software for accounting firms using QuickBooks Online',
    intro:
      'Kyriq takes the check-by-check part out of client reconciliations. Upload each client’s bank statement, approve the exact matches in one action, and spend review time only on the checks that need judgment.',
    body: [
      {
        heading: 'Where firm time goes at month-end',
        paragraphs: [
          'Clients that still write checks, such as landlords, churches, contractors and medical practices, produce the same work every month: read the statement, find each check in QuickBooks Online, tick it, chase the ones that do not line up. Multiply that across a client list and it is days of staff time that is mostly confirmation.',
        ],
      },
      { heading: 'The Kyriq workflow', steps: WORKFLOW },
      {
        heading: 'Why firms choose it',
        bullets: [
          'Unlimited QuickBooks Online companies and unlimited users on every plan.',
          'Pricing by processed-check volume, not per client or per seat.',
          'An authorized user approves every clearing, and every decision is logged.',
          'Every processed check stays visible, so reviewers can see the whole batch.',
          'The Chrome extension lets staff act on matches inside QuickBooks Online.',
        ],
      },
      {
        heading: 'Plans for firm volume',
        paragraphs: [
          'Starter covers 1,200 checks a month, Professional 4,500 and Firm 10,000, with $0.20 per check above the allowance. Annual plans include one month free.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are companies and team members limited?',
        a: 'No. Kyriq plans include unlimited QuickBooks companies and unlimited users. Pricing is based on the number of checks processed.',
      },
      ...CORE_FAQS,
    ],
    related: ['/for/bookkeepers', '/features/bulk-check-processing', '/features/check-reconciliation-quickbooks-online', '/compare/docuclipper-alternative', '/pricing'],
    updated: UPDATED,
  },
  {
    section: 'for',
    slug: 'bookkeepers',
    keyword: 'quickbooks online reconciliation multiple clients bookkeeper',
    title: 'Check Reconciliation for Bookkeepers on QuickBooks Online',
    description:
      'For bookkeepers reconciling checks across many QuickBooks Online clients: extract checks from bank statements and approve exact matches in bulk.',
    eyebrow: 'For bookkeepers',
    h1: 'Reconcile checks for every QuickBooks Online client without ticking them one by one',
    intro:
      'If you close books for several QuickBooks Online clients, Kyriq turns each statement’s checks into a reviewed, cleared batch. You approve the exact matches together and look closely only at the exceptions.',
    body: [
      {
        heading: 'Built for independent and small-team bookkeepers',
        paragraphs: [
          'You already download the bank statement for each client. Kyriq reads the checks from it, so there is no separate extraction tool and no re-uploading. One login covers all your client companies, and adding a client never changes your price.',
        ],
      },
      { heading: 'How it works', steps: WORKFLOW },
      {
        heading: 'What you get back',
        bullets: [
          'Fewer hours spent confirming checks that already match.',
          'Duplicates and discrepancies flagged before the reconciliation is finished.',
          'An audit trail that shows which checks you approved and when.',
          'Handwritten checks read with confidence scores you can verify.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I use Kyriq for several clients?',
        a: 'Yes. Every plan includes unlimited QuickBooks Online companies and unlimited users.',
      },
      ...CORE_FAQS,
    ],
    related: ['/for/accounting-firms', '/guides/clear-outstanding-checks-quickbooks-online', '/guides/checks-not-showing-as-cleared-quickbooks-online', '/features/handwritten-check-ocr', '/pricing'],
    updated: UPDATED,
  },
  {
    section: 'for',
    slug: 'property-management',
    keyword: 'check reconciliation for property management',
    title: 'Check Reconciliation for Property Management in QBO',
    description:
      'Check reconciliation for property managers on QuickBooks Online: match vendor and owner checks from bank statements and clear exact matches in bulk.',
    eyebrow: 'For property management',
    h1: 'Check reconciliation for property managers on QuickBooks Online',
    intro:
      'Property management runs on checks: vendor payments, owner distributions, deposits returned to tenants. Kyriq reads every check on the statement, matches it in QuickBooks Online and clears the ones you approve.',
    body: [
      {
        heading: 'Why property accounting is check-heavy',
        paragraphs: [
          'Maintenance vendors, utilities, owner draws and security-deposit refunds are still commonly paid by check, often across many properties and bank accounts. Each month the statement has to be tied back to QuickBooks Online before owner reports go out.',
        ],
      },
      { heading: 'How Kyriq handles it', steps: WORKFLOW },
      {
        heading: 'Useful for',
        bullets: [
          'Clearing large batches of vendor checks each month',
          'Spotting duplicate payments before they reach an owner statement',
          'Keeping an approval record of every check cleared',
          'Managing many QuickBooks Online companies without per-company fees',
        ],
      },
    ],
    faqs: CORE_FAQS,
    related: ['/features/bulk-check-processing', '/guides/clear-outstanding-checks-quickbooks-online', '/for/accounting-firms', '/pricing'],
    updated: UPDATED,
  },
  {
    section: 'for',
    slug: 'churches-and-nonprofits',
    keyword: 'check reconciliation for churches and nonprofits',
    title: 'Check Reconciliation for Churches and Nonprofits',
    description:
      'Check reconciliation for churches and nonprofits on QuickBooks Online: read handwritten checks from bank statements, match them in QBO and clear on approval.',
    eyebrow: 'For churches and nonprofits',
    h1: 'Check reconciliation for churches and nonprofits on QuickBooks Online',
    intro:
      'Churches and nonprofits still write and receive a lot of checks, many of them handwritten. Kyriq reads the checks on your bank statement, matches them in QuickBooks Online and keeps a record of every approval for your treasurer or auditor.',
    body: [
      {
        heading: 'Why this matters for nonprofit books',
        paragraphs: [
          'Volunteer treasurers and small finance teams often reconcile by hand, and handwritten checks make it slower. A clear approval trail also matters when the board or an auditor asks who confirmed what.',
        ],
      },
      { heading: 'How Kyriq helps', steps: WORKFLOW },
      {
        heading: 'Controls you keep',
        bullets: [
          'Nothing is cleared without an authorized user’s approval.',
          'Every decision is logged with who made it and when.',
          'Handwritten checks show confidence scores so uncertain reads get checked.',
          'Unlimited users, so treasurer, bookkeeper and accountant can share the work.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can Kyriq read handwritten checks?',
        a: 'Yes. Kyriq can extract information from both typed and handwritten checks. Each result includes a confidence score, and lower-confidence information remains available for your team to review.',
      },
      ...CORE_FAQS,
    ],
    related: ['/features/handwritten-check-ocr', '/guides/record-handwritten-checks-quickbooks', '/guides/clear-outstanding-checks-quickbooks-online', '/pricing'],
    updated: UPDATED,
  },
  {
    section: 'for',
    slug: 'construction',
    keyword: 'check reconciliation for construction companies',
    title: 'Check Reconciliation for Construction Companies in QBO',
    description:
      'Check reconciliation for construction companies on QuickBooks Online: match subcontractor and supplier checks from statements and clear exact matches in bulk.',
    eyebrow: 'For construction',
    h1: 'Check reconciliation for construction companies on QuickBooks Online',
    intro:
      'Subcontractors, suppliers and payroll advances make construction one of the most check-heavy trades. Kyriq reads every check on the statement, matches it in QuickBooks Online and clears the matches you approve.',
    body: [
      {
        heading: 'Where construction reconciliations get stuck',
        paragraphs: [
          'Large numbers of checks to the same suppliers, similar amounts and handwritten field checks make it easy to match the wrong transaction or miss a duplicate. Kyriq scores every pairing and flags the ones that do not line up exactly.',
        ],
      },
      { heading: 'How Kyriq works', steps: WORKFLOW },
      {
        heading: 'What it catches',
        bullets: [
          'Possible duplicate checks to the same vendor',
          'Amount or date differences between the check and QuickBooks',
          'Checks on the statement with no matching QuickBooks transaction',
        ],
      },
    ],
    faqs: CORE_FAQS,
    related: ['/features/bulk-check-processing', '/guides/checks-not-showing-as-cleared-quickbooks-online', '/guides/match-checks-to-bank-feed-quickbooks-online', '/pricing'],
    updated: UPDATED,
  },
];
