import type { MarketingPage } from '../types';

const UPDATED = '2026-10-26';

export const FEATURE_PAGES: MarketingPage[] = [
  {
    section: 'features',
    slug: 'check-reconciliation-quickbooks-online',
    keyword: 'check reconciliation quickbooks online',
    title: 'Check Reconciliation Software for QuickBooks Online',
    description:
      'Check reconciliation for QuickBooks Online: upload a bank statement, match every check to your QBO register, approve exact matches in bulk and clear them.',
    eyebrow: 'Check reconciliation',
    h1: 'Check reconciliation for QuickBooks Online, from bank statement to cleared',
    intro:
      'Kyriq reads the checks on the bank statement you already download, matches each one to the transaction in your QuickBooks Online register, and clears the matches your team approves. Every check stays visible, and nothing is cleared without a person saying yes.',
    alternates: {
      'en-US': '/features/check-reconciliation-quickbooks-online',
      'en-CA': '/ca/cheque-reconciliation-quickbooks',
      'en-GB': '/uk/cheque-reconciliation-quickbooks',
    },
    body: [
      {
        heading: 'Why check reconciliation in QuickBooks Online takes so long',
        paragraphs: [
          'The bank feed tells QuickBooks that a check cleared for an amount. It does not tell you which payee it went to, so a check written in QuickBooks and the bank line that pays it often sit side by side without being matched. Bookkeepers end up opening the statement, reading each check number and amount, and ticking transactions one at a time in the Reconcile window.',
          'For a client that writes a few checks a month that is fine. For a property manager, a church or a contractor writing hundreds, it is the slowest part of month-end close, and it is where duplicates and uncleared checks pile up.',
        ],
      },
      {
        heading: 'How Kyriq reconciles checks',
        steps: [
          'Upload the bank statement PDF. Kyriq finds the check images on it and reads the check number, date, payee and amount. Individual check images in PDF, JPG or PNG work too, including several checks on one page.',
          'Kyriq compares every processed check with the QuickBooks Online register you select and gives each pairing a match score.',
          'Results land in three views: 100% Matches, Needs Attention and All Checks. Possible duplicates and amount or payee discrepancies are flagged for review.',
          'An authorized user approves the exact matches together, or reviews any check individually.',
          'Kyriq clears the approved checks in your QuickBooks Online reconciliation. Every approval is recorded in the audit trail.',
        ],
      },
      {
        heading: 'What stays under your control',
        bullets: [
          'Nothing is cleared automatically. An authorized user approves every match first.',
          'Every processed check remains visible, including the ones that did not match.',
          'Extracted fields show confidence scores, so low-confidence reads get a second look.',
          'Each decision is logged with who made it and when.',
        ],
      },
      {
        heading: 'Built for firms with many QuickBooks companies',
        paragraphs: [
          'Plans include unlimited QuickBooks Online companies and unlimited users, and pricing is based on processed-check volume. A firm reconciling twenty clients pays for the checks it processes, not for twenty seats or twenty company connections.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Kyriq work with QuickBooks Desktop?',
        a: 'No. Kyriq connects to QuickBooks Online for transaction comparison and reconciliation clearing.',
      },
      {
        q: 'Do I need separate software to pull checks off my bank statement?',
        a: 'No. Upload the statement PDF you already download and Kyriq extracts the checks from it, so there is no separate extraction step or re-upload.',
      },
      {
        q: 'Will Kyriq clear a check I have not approved?',
        a: 'No. Kyriq clears a transaction in QuickBooks Online only after an authorized user approves the match.',
      },
      {
        q: 'How is the check matched to the QuickBooks transaction?',
        a: 'Kyriq compares the details read from the check, such as check number, amount, date and payee, with the transactions in the register you select, and scores each pairing. Exact matches score 100%; anything lower goes to Needs Attention.',
      },
    ],
    related: [
      '/features/bulk-check-processing',
      '/features/handwritten-check-ocr',
      '/features/quickbooks-chrome-extension',
      '/guides/clear-outstanding-checks-quickbooks-online',
      '/guides/checks-not-showing-as-cleared-quickbooks-online',
      '/pricing',
    ],
    updated: UPDATED,
  },
  {
    section: 'features',
    slug: 'handwritten-check-ocr',
    keyword: 'handwritten check OCR',
    title: 'Handwritten Check OCR for QuickBooks Reconciliation',
    description:
      'Handwritten check OCR that reads payee, amount, date and check number from bank statement images, shows a confidence score and matches it in QuickBooks.',
    eyebrow: 'Check OCR',
    h1: 'Handwritten check OCR that feeds straight into reconciliation',
    intro:
      'Kyriq reads typed and handwritten checks from your bank statement or from check images, shows how confident it is in every field, and uses the result to match the check in QuickBooks Online. Low-confidence reads are flagged for a person to confirm.',
    body: [
      {
        heading: 'Why handwritten checks are hard to read automatically',
        paragraphs: [
          'Printed checks follow a layout. Handwritten ones do not: payees are abbreviated, amounts are written twice in different forms, dates use every format, and statement images are small and compressed. Generic OCR tools return text, but they do not tell you which characters they guessed at.',
        ],
      },
      {
        heading: 'What Kyriq extracts from each check',
        bullets: [
          'Check number',
          'Date',
          'Payee',
          'Amount',
          'A confidence score for the extracted details, so you can see which reads need checking',
        ],
      },
      {
        heading: 'Where the images come from',
        paragraphs: [
          'Most banks include check images on the monthly statement PDF. Upload that file and Kyriq finds each check on the page. You can also upload check images directly as PDF, JPG or PNG, and Kyriq detects several checks on one page.',
        ],
      },
      {
        heading: 'OCR is only the first step',
        paragraphs: [
          'Reading a check is useful; knowing whether QuickBooks already has it is what closes the books. Kyriq passes every read straight into matching against your QuickBooks Online register, so a handwritten check either lines up with its transaction or lands in Needs Attention with the discrepancy shown.',
        ],
      },
      {
        heading: 'Review before anything changes',
        paragraphs: [
          'Extracted details and confidence scores stay visible next to the match. Nothing is cleared in QuickBooks until an authorized user approves it.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can Kyriq read handwritten checks?',
        a: 'Yes. Kyriq extracts information from both typed and handwritten checks. Each result includes a confidence score, and lower-confidence information stays available for your team to review before anything is cleared in QuickBooks.',
      },
      {
        q: 'Which file types can I upload?',
        a: 'Bank statement PDFs, and check images in PDF, JPG or PNG. Kyriq can identify and process multiple checks on the same page.',
      },
      {
        q: 'Can I export the extracted check data?',
        a: 'Kyriq is built around reconciling checks in QuickBooks Online. If you need the data in another format, contact support@kyriq.com and tell us what you need.',
      },
    ],
    related: [
      '/features/check-reconciliation-quickbooks-online',
      '/guides/record-handwritten-checks-quickbooks',
      '/tools/micr-line-decoder',
      '/compare/docuclipper-alternative',
      '/pricing',
    ],
    updated: UPDATED,
  },
  {
    section: 'features',
    slug: 'bulk-check-processing',
    keyword: 'bulk check processing quickbooks',
    title: 'Bulk Check Processing and Approval for QuickBooks Online',
    description:
      'Bulk check processing for QuickBooks Online: process a full statement of checks, approve every 100% match at once and keep exceptions for review.',
    eyebrow: 'Bulk processing',
    h1: 'Bulk check processing for QuickBooks Online: approve every exact match at once',
    intro:
      'Kyriq processes every check on a statement in one upload, groups the ones that match QuickBooks Online exactly, and lets an authorized user approve the whole group in one action. Everything else waits in Needs Attention.',
    body: [
      {
        heading: 'The month-end problem with high check volume',
        paragraphs: [
          'Clearing checks one at a time in the QuickBooks Online Reconcile window scales badly. At a few hundred checks a month, the work is mostly confirming things that already match, and the few real problems get the same attention as the routine ones.',
        ],
      },
      {
        heading: 'How bulk approval works',
        steps: [
          'Upload the statement. Kyriq extracts and processes every check on it.',
          'Each check is compared with the selected QuickBooks Online register and scored.',
          'Checks that match with 100% confidence are grouped in 100% Matches.',
          'An authorized user reviews the group and approves it in one action, or opens any check individually.',
          'Kyriq clears the approved checks in the QuickBooks Online reconciliation.',
        ],
      },
      {
        heading: 'Exceptions stay visible',
        bullets: [
          'Lower-confidence matches go to Needs Attention for an individual decision.',
          'Possible duplicates are flagged, so the same check is not cleared twice.',
          'Amount, date or payee differences are shown side by side.',
          'All Checks keeps the complete batch in view.',
        ],
      },
      {
        heading: 'Pricing that suits volume',
        paragraphs: [
          'Plans include 1,200, 4,500 or 10,000 processed checks a month, with unlimited QuickBooks companies and users. Checks above the allowance are billed at $0.20 each.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How does bulk approval work?',
        a: 'Kyriq groups checks that match their QuickBooks transactions with 100% confidence. An authorized user can review those checks individually or approve the entire group at once. Lower-confidence matches and discrepancies remain available for individual review.',
      },
      {
        q: 'What counts toward my monthly check allowance?',
        a: 'A check counts when it is successfully processed from an upload. If the same check is uploaded and processed again, it counts again.',
      },
      {
        q: 'Can several people work on the same batch?',
        a: 'Yes. Every plan includes unlimited users, and every approval is recorded in the audit trail.',
      },
    ],
    related: [
      '/features/check-reconciliation-quickbooks-online',
      '/for/accounting-firms',
      '/guides/clear-outstanding-checks-quickbooks-online',
      '/guides/import-checks-into-quickbooks-online',
      '/pricing',
    ],
    updated: UPDATED,
  },
  {
    section: 'features',
    slug: 'quickbooks-chrome-extension',
    keyword: 'clear checks in quickbooks chrome extension',
    title: 'Kyriq Chrome Extension: Clear Checks Inside QuickBooks',
    description:
      'The Kyriq Chrome extension shows check matches inside QuickBooks Online so you can approve and clear checks without leaving QBO. Included in all plans.',
    eyebrow: 'Chrome extension',
    h1: 'Approve and clear checks without leaving QuickBooks Online',
    intro:
      'The Kyriq Chrome extension brings your check matches into QuickBooks Online. Open a register or the reconcile page, see Kyriq’s suggestions in a side panel, and approve or flag each one in place. It is included with every plan and during the trial.',
    body: [
      {
        heading: 'What the extension does',
        bullets: [
          'Shows Kyriq’s match suggestions in context while you work in QuickBooks Online',
          'Lets you approve or flag each result yourself',
          'Clears approved checks in the reconciliation',
          'Records every approval in the Kyriq audit trail',
        ],
      },
      {
        heading: 'How to use it',
        steps: [
          'Install the Kyriq extension in Google Chrome and sign in with your Kyriq account.',
          'Connect your QuickBooks Online company.',
          'Open a QuickBooks Online register or reconcile page. Matched checks appear in the side panel.',
          'Review each suggestion and approve or flag it.',
        ],
      },
      {
        heading: 'Web app and extension, one workflow',
        paragraphs: [
          'Uploads, bulk approval and the full batch review live in the Kyriq web app. The extension is for the moment you are already inside QuickBooks and want to act on a match without switching tabs. Both use the same matches and the same audit trail.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is the Kyriq Chrome extension included?',
        a: 'Yes. The Kyriq Chrome extension and web app are included with every paid plan and during the free trial. No separate extension purchase is required.',
      },
      {
        q: 'Does the extension clear checks automatically?',
        a: 'No. You approve or flag each result yourself. Nothing is cleared without approval.',
      },
      {
        q: 'Which browsers are supported?',
        a: 'The extension runs in Google Chrome. The Kyriq web app works in any modern browser.',
      },
    ],
    related: [
      '/features/check-reconciliation-quickbooks-online',
      '/guides/mark-check-as-cleared-quickbooks-online',
      '/guides/match-checks-to-bank-feed-quickbooks-online',
      '/pricing',
    ],
    updated: UPDATED,
  },
];
