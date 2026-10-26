import type { MarketingPage } from '../types';

/**
 * Comparison pages (/compare/*). Competitor facts were checked on each
 * competitor's own site in October 2026; the URLs are in each page's
 * "Sources" block. Re-verify before changing any competitor claim or price.
 */
export const COMPARE_PAGES: MarketingPage[] = [
  {
    section: 'compare',
    slug: 'docuclipper-alternative',
    title: 'DocuClipper Alternative for QuickBooks Check Reconciliation',
    description:
      'Looking for a DocuClipper alternative for checks? Kyriq extracts checks from bank statements, matches them in QuickBooks Online and clears them after approval.',
    keyword: 'docuclipper alternative',
    eyebrow: 'DocuClipper alternative',
    h1: 'A DocuClipper alternative built for check reconciliation in QuickBooks Online',
    intro:
      'DocuClipper turns bank statements, invoices, receipts and checks into data you can export to Excel, CSV, QuickBooks or Xero. Kyriq starts from the same bank statement PDF but does one job end to end: it extracts every check, matches it to your QuickBooks Online register and, once you approve, clears it in the reconciliation.',
    body: [
      {
        heading: 'What DocuClipper does',
        paragraphs: [
          'As of October 2026, DocuClipper describes itself as a financial document extraction platform. It converts scanned or digital bank and credit card statements into Excel, CSV, QBO, QFX, OFX, QIF and Xero formats without templates, and it extracts data from invoices, receipts, tax forms and checks. Its check OCR page lists the MICR line, payee, numeric and written amounts, date and memo, and it says it cross-checks the written amount against the numeric one.',
          'DocuClipper also compares the totals it extracts with the opening and closing balances printed on a statement, and when check images and a statement are processed in the same project it writes the payee and memo onto the matching "Check #N" rows. Those are useful checks on the extraction itself. What its site does not describe is the next step: finding each check in QuickBooks Online, confirming it, and marking it cleared in the reconciliation.',
        ],
      },
      {
        heading: 'How Kyriq handles checks differently',
        paragraphs: [
          'Kyriq is not a general converter. It is built around the part of the month-end close that takes bookkeepers the longest when a client writes a lot of checks.',
        ],
        bullets: [
          'Upload the bank statement PDF you already download and Kyriq extracts the checks from it. Individual check images in PDF, JPG or PNG work too, and several checks on one page are detected.',
          'Typed and handwritten checks are read, with a confidence score on every field so you know what to look at.',
          'Every processed check is compared with the QuickBooks Online register you select, and each match gets a score.',
          'Results are sorted into All Checks, 100% Matches and Needs Attention. Possible duplicates and discrepancies are flagged.',
          'An authorized user approves matches, and 100% matches can be approved together in bulk. Nothing is cleared without approval.',
          'Approved matches are cleared in the QuickBooks Online reconciliation, and every decision is logged in an audit trail.',
        ],
      },
      {
        heading: 'Kyriq vs DocuClipper at a glance',
        table: {
          head: ['', 'Kyriq', 'DocuClipper'],
          rows: [
            ['Bank statement to Excel, CSV or QBO file', 'No', 'Yes'],
            ['Check data extraction', 'Yes, from statements or check images', 'Yes'],
            ['Handwritten checks', 'Yes, with per-field confidence', 'Handwritten amounts, per its site'],
            ['Matches checks to the QBO register', 'Yes, scored', 'Not described'],
            ['Clears checks in the QBO reconciliation', 'Yes, after approval', 'No'],
            ['Invoices and receipts', 'No', 'Yes'],
            ['Accounting platforms', 'QuickBooks Online only', 'QuickBooks, Xero, Sage, NetSuite and others'],
            ['Users and companies', 'Unlimited on every plan', 'Unlimited users on every plan'],
            ['Pricing basis', 'Processed checks per month', 'Pages per month'],
          ],
        },
      },
      {
        heading: 'When DocuClipper is the better choice',
        paragraphs: [
          'Pick DocuClipper, or keep it, if your problem is getting statement data out of PDFs rather than reconciling checks in QuickBooks Online. A quick test: if the hours go on typing statement lines into a spreadsheet, a converter helps. If they go on ticking off checks in the Reconcile screen, Kyriq is aimed at that step.',
          'The two tools also work side by side. A firm with clients on several ledgers can keep a converter for statement data in Xero or spreadsheets, and use Kyriq only for the QuickBooks Online clients who write a lot of checks. Kyriq is priced by processed checks, not pages, so a long statement with a few checks does not use up a page allowance.',
        ],
        bullets: [
          'You need bank or credit card statements converted to Excel, CSV, QBO or QFX files.',
          'Your clients are on Xero, Sage or NetSuite. Kyriq works only with QuickBooks Online.',
          'You process invoices and receipts as well as checks.',
          'Your volume is small. As of October 2026, DocuClipper lists plans from $29 per month for 60 pages, and its 14-day trial needs no credit card.',
        ],
      },
      {
        heading: 'How to switch from DocuClipper to Kyriq',
        steps: [
          'Start a Kyriq trial: 14 days or 250 checks, with no credit card.',
          'Connect the QuickBooks Online companies you reconcile. Every plan includes unlimited companies and users.',
          'Upload the same bank statement PDF you would have sent to DocuClipper, or the individual check images.',
          'Select the register to match against and work through All Checks, 100% Matches and Needs Attention.',
          'Approve the 100% matches in bulk, resolve the flagged checks, then clear the approved matches in QuickBooks Online from the web app or the Chrome extension.',
        ],
      },
      {
        heading: 'Sources',
        bullets: [
          'https://www.docuclipper.com/',
          'https://www.docuclipper.com/pricing/',
          'https://www.docuclipper.com/features/check-image-ocr/',
          'https://www.docuclipper.com/document-types/checks/',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Kyriq a bank statement converter like DocuClipper?',
        a: 'No. Kyriq reads bank statements to find the checks in them, then matches and clears those checks in QuickBooks Online. It does not export statement transactions to Excel, CSV or QBO files.',
      },
      {
        q: 'Does Kyriq work with Xero or QuickBooks Desktop?',
        a: 'No. Kyriq works only with QuickBooks Online. If you reconcile in Xero or QuickBooks Desktop, a converter such as DocuClipper is the better fit.',
      },
      {
        q: 'Can Kyriq read handwritten checks?',
        a: 'Yes. Kyriq reads typed and handwritten checks and shows a confidence score for each field, so low-confidence fields are easy to review before you approve a match.',
      },
      {
        q: 'How does Kyriq pricing compare with DocuClipper?',
        a: 'Kyriq is priced by processed checks: Starter is $249 per month for 1,200 checks, Professional $649 for 4,500 and Firm $1,299 for 10,000, with $0.20 per extra check. DocuClipper prices by pages; as of October 2026 its plans start at $29 per month for 60 pages.',
      },
    ],
    related: [
      '/features/check-reconciliation-quickbooks-online',
      '/features/handwritten-check-ocr',
      '/guides/clear-outstanding-checks-quickbooks-online',
      '/compare/saasant-alternative',
      '/pricing',
    ],
    updated: '2026-10-26',
  },
  {
    section: 'compare',
    slug: 'saasant-alternative',
    title: 'SaasAnt Alternative for Clearing Checks in QuickBooks Online',
    description:
      'Need a SaasAnt alternative for checks? SaasAnt imports transactions into QuickBooks. Kyriq matches checks to your QBO register and clears them after approval.',
    keyword: 'saasant alternative',
    eyebrow: 'SaasAnt alternative',
    h1: 'A SaasAnt alternative for matching and clearing checks in QuickBooks Online',
    intro:
      'SaasAnt Transactions moves data into and out of QuickBooks in bulk. Kyriq solves a different problem: proving that the checks on a bank statement are the checks already in your QuickBooks Online register, then clearing them once someone approves.',
    body: [
      {
        heading: 'What SaasAnt Transactions does',
        paragraphs: [
          'As of October 2026, SaasAnt Transactions imports, exports, edits and deletes QuickBooks transactions in bulk from Excel, CSV, TXT and IIF files. It is available for QuickBooks Online, QuickBooks Desktop and Xero. You can also scan and upload receipts, invoices, bills, checks and bank statements as PDFs or images to create transactions. To import checks, you pick "Checks" as the QuickBooks entity, upload a file and map its columns to QuickBooks fields.',
          'SaasAnt also sells PayTraQer, which syncs sales and payment data from e-commerce platforms and payment gateways into QuickBooks Online and Xero.',
          'In short, SaasAnt is about getting transactions into QuickBooks, or changing many of them at once. Its site mentions workflow rules for categorization and matching, but it does not describe a check-by-check review that ends with checks cleared in the QuickBooks Online reconciliation.',
        ],
      },
      {
        heading: 'What Kyriq does instead',
        paragraphs: [
          'Most firms already have the checks in QuickBooks Online: they were written there, or entered from a check register. The slow part is tying each one to the bank statement. Kyriq does that work.',
        ],
        bullets: [
          'Upload the bank statement PDF you already download, or check images in PDF, JPG or PNG. Kyriq extracts the checks, including several on one page.',
          'Typed and handwritten checks are read, with a confidence score on each field.',
          'Each check is compared with the QuickBooks Online register you select and given a match score.',
          'All Checks, 100% Matches and Needs Attention views separate the clean matches from the ones that need a person. Possible duplicates and discrepancies are flagged.',
          'An authorized user approves; 100% matches can be approved in bulk. Approved matches are cleared in the reconciliation, and every decision is logged.',
        ],
      },
      {
        heading: 'Kyriq vs SaasAnt at a glance',
        table: {
          head: ['', 'Kyriq', 'SaasAnt'],
          rows: [
            ['Bulk import from Excel, CSV or IIF', 'No', 'Yes'],
            ['Bulk edit or delete QuickBooks transactions', 'No', 'Yes'],
            ['Reads checks from PDFs or images', 'Yes, including bank statements', 'Yes, to create transactions'],
            ['Handwritten checks with per-field confidence', 'Yes', 'Not described'],
            ['Scores each check against the QBO register', 'Yes', 'Not described'],
            ['Clears approved checks in the QBO reconciliation', 'Yes', 'Not described'],
            ['QuickBooks Desktop and Xero', 'No', 'Yes'],
            ['Companies per plan', 'Unlimited', '1, or up to 30 on multi-company plans'],
            ['Users per plan', 'Unlimited', '3 to 15, depending on plan'],
          ],
        },
      },
      {
        heading: 'When SaasAnt is the better choice',
        paragraphs: [
          'SaasAnt is a strong tool for data movement, and Kyriq does not replace it there. The question to ask is whether your checks are missing from QuickBooks Online or already there and waiting to be reconciled. If they are missing, you need an import tool. If they are already in the register and the work is proving each one cleared the bank, that is what Kyriq is for.',
          'Firms that manage many clients should also compare plan limits. As of October 2026, SaasAnt\'s multi-company plans cover up to 30 companies, with larger firms quoted on request. Every Kyriq plan includes unlimited QuickBooks Online companies and users and is priced by processed checks.',
        ],
        bullets: [
          'You need to import invoices, bills, journal entries or checks from spreadsheets into QuickBooks.',
          'You need to export, bulk edit or bulk delete transactions.',
          'You work in QuickBooks Desktop or Xero.',
          'You want e-commerce or payment gateway sales synced into your books through PayTraQer.',
          'You have a single company and low volume. As of October 2026, SaasAnt lists its single-company Transactions Online plans from $25 per month, with a 30-day trial.',
        ],
      },
      {
        heading: 'How to switch from SaasAnt to Kyriq for check reconciliation',
        steps: [
          'Keep SaasAnt for imports if you still need them; Kyriq does not have to replace it.',
          'Start a Kyriq trial: 14 days or 250 checks, with no credit card.',
          'Connect each QuickBooks Online company. There is no company or user limit on any plan.',
          'Upload the month\'s bank statement PDF and select the register to match against.',
          'Approve the 100% matches in bulk, review the Needs Attention list, and clear approved checks in QuickBooks Online from the web app or the Chrome extension.',
        ],
      },
      {
        heading: 'Sources',
        bullets: [
          'https://www.saasant.com/',
          'https://www.saasant.com/app-saasant-transactions-quickbooks-automation',
          'https://support.saasant.com/support/solutions/articles/14000067369-pricing-for-saasant-transactions-online-/',
          'https://support.saasant.com/support/solutions/articles/14000053137-how-to-import-checks-into-quickbooks-online-u-s-/',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I use Kyriq and SaasAnt together?',
        a: 'Yes. SaasAnt can import transactions into QuickBooks Online, and Kyriq can then match the checks on the bank statement to the register and clear them after approval. They do different jobs.',
      },
      {
        q: 'Does Kyriq import checks into QuickBooks Online?',
        a: 'Kyriq is built to match checks against the transactions already in your QuickBooks Online register and clear them in the reconciliation. If you need to bulk import checks from a spreadsheet, an import tool such as SaasAnt is the right fit.',
      },
      {
        q: 'How many QuickBooks companies can I connect to Kyriq?',
        a: 'Unlimited, on every plan, with unlimited users. Plans are priced by processed checks: Starter $249 per month for 1,200 checks, Professional $649 for 4,500 and Firm $1,299 for 10,000.',
      },
      {
        q: 'Does Kyriq clear checks automatically?',
        a: 'No. An authorized user approves every match first. 100% matches can be approved together in bulk, and every decision is recorded in the audit trail.',
      },
    ],
    related: [
      '/features/check-reconciliation-quickbooks-online',
      '/features/bulk-check-processing',
      '/guides/import-checks-into-quickbooks-online',
      '/compare/docuclipper-alternative',
      '/for/accounting-firms',
    ],
    updated: '2026-10-26',
  },
  {
    section: 'compare',
    slug: 'quickbooks-check-scanner-alternative',
    title: 'QuickBooks Check Scanner Alternative for Reconciliation',
    description:
      'Searching for a QuickBooks check scanner alternative? Kyriq reads checks from bank statements, matches them in QuickBooks Online and clears approved checks.',
    keyword: 'quickbooks check scanner alternative',
    eyebrow: 'QuickBooks check scanner alternative',
    h1: 'A QuickBooks check scanner alternative for reconciling the checks you write',
    intro:
      'QuickBooks does not have a single feature called a check scanner. When people search for one they usually mean mobile check deposit, receipt capture, or a third-party scanner app. None of those reconcile the checks you wrote against your bank statement, which is the job Kyriq does in QuickBooks Online.',
    body: [
      {
        heading: 'What people mean by a QuickBooks check scanner',
        paragraphs: [
          'As of October 2026, three different things go by this name:',
        ],
        bullets: [
          'Mobile check deposit. In the QuickBooks mobile app you photograph the front and back of a check made out to you and deposit it. Intuit says you need QuickBooks Payments and QuickBooks Checking, or QuickBooks Money, and must be approved; if you do not see "Deposit checks", the account is not eligible yet.',
          'Receipt capture. In QuickBooks Online you upload receipts and bills from the Receipts page, the mobile app or a custom email address. QuickBooks reads the document, creates a transaction for review and shows any existing transactions that match. Intuit asks for one receipt per file, and its help article does not mention checks.',
          'Third-party scanners and apps. Desktop check scanners and OCR apps read check images and export the data as files or transactions. They capture data; matching it to QuickBooks is still a separate step.',
        ],
      },
      {
        heading: 'The gap: reconciling checks you have already written',
        paragraphs: [
          'At month end the work is not depositing or capturing. It is going down the bank statement, finding each cleared check in the QuickBooks Online register, confirming the amount and payee, and ticking it off in the Reconcile screen. With hundreds of checks across several clients, that is hours of manual comparison.',
          'Kyriq starts from the bank statement PDF you already download and extracts the checks from it. Individual check images in PDF, JPG or PNG work too, and several checks on one page are detected. Typed and handwritten checks are read with a confidence score per field. Every check is compared with the register you select and scored, then sorted into All Checks, 100% Matches and Needs Attention, with possible duplicates and discrepancies flagged. An authorized user approves, 100% matches can be approved in bulk, and approved matches are cleared in the reconciliation with each decision logged.',
        ],
      },
      {
        heading: 'Kyriq vs QuickBooks built-in check tools',
        table: {
          head: ['', 'Kyriq', 'QuickBooks built-in tools'],
          rows: [
            ['Deposits a check you received', 'No', 'Yes, mobile deposit for eligible accounts'],
            ['Reads checks from a bank statement PDF', 'Yes', 'Not described'],
            ['Several checks on one page', 'Yes', 'No, one receipt per file'],
            ['Handwritten checks with per-field confidence', 'Yes', 'Not described'],
            ['Matches each check to the register with a score', 'Yes', 'Suggested matches for receipts'],
            ['Bulk approval of 100% check matches', 'Yes', 'Not described'],
            ['Clears approved checks in the reconciliation', 'Yes', 'Manual in the Reconcile screen'],
            ['Cost', 'From $249 per month', 'Part of QuickBooks Online and its app'],
          ],
        },
      },
      {
        heading: 'When QuickBooks\' own tools are the better choice',
        paragraphs: [
          'Kyriq does not replace mobile deposit or receipt capture. They solve different problems, and many firms use all three: mobile deposit for incoming checks, receipt capture for expenses, and Kyriq for the outgoing checks that pile up on the bank statement.',
          'If you landed here because the QuickBooks mobile deposit option is missing or a receipt will not match, the cause may be account eligibility or the file itself rather than the need for a new tool. Intuit notes that the "Deposit checks" option only appears for eligible accounts and that each receipt file should hold one receipt. Our guide to a QuickBooks check scanner that is not working covers those fixes.',
        ],
        bullets: [
          'You want to deposit customer checks without visiting the bank. Use mobile check deposit if your account is eligible.',
          'You need to capture receipts and bills and attach them to expenses. Receipt capture is built for that.',
          'You write only a few checks a month. Ticking them off in the Reconcile screen takes minutes and a separate tool is not worth paying for.',
        ],
      },
      {
        heading: 'How to start reconciling checks with Kyriq',
        steps: [
          'Start a trial: 14 days or 250 checks, with no credit card.',
          'Connect your QuickBooks Online companies. Every plan includes unlimited companies and users.',
          'Upload the bank statement PDF, or the check images, for the period you are reconciling.',
          'Select the register and review the scored matches, starting with Needs Attention.',
          'Approve the 100% matches in bulk and clear approved checks in QuickBooks Online, from the web app or the Chrome extension.',
        ],
      },
      {
        heading: 'Sources',
        bullets: [
          'https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/mobile-deposit-of-checks/00/1356154',
          'https://quickbooks.intuit.com/learn-support/en-us/help-article/import-transactions/upload-receipts-bills-quickbooks-online/L862MmZHn_US_en_US',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does QuickBooks Online have a check scanner?',
        a: 'Not as one feature. The QuickBooks mobile app offers mobile check deposit for eligible QuickBooks Checking accounts, and QuickBooks Online has receipt capture for receipts and bills. Neither reconciles the checks you wrote against your bank statement.',
      },
      {
        q: 'Can Kyriq deposit checks?',
        a: 'No. Kyriq does not move money. It reads checks from bank statements or check images, matches them to your QuickBooks Online register and clears approved matches in the reconciliation.',
      },
      {
        q: 'Do I need a check scanner to use Kyriq?',
        a: 'No. Kyriq reads the bank statement PDF you already download from your bank. If you do have scanned check images, you can upload them as PDF, JPG or PNG.',
      },
      {
        q: 'Does Kyriq work with QuickBooks Desktop?',
        a: 'No. Kyriq works only with QuickBooks Online.',
      },
    ],
    related: [
      '/guides/quickbooks-check-scanner-not-working',
      '/features/check-reconciliation-quickbooks-online',
      '/features/quickbooks-chrome-extension',
      '/guides/clear-outstanding-checks-quickbooks-online',
      '/for/bookkeepers',
    ],
    updated: '2026-10-26',
  },
  {
    section: 'compare',
    slug: 'dext-alternative',
    title: 'Dext Alternative for Check Reconciliation in QuickBooks',
    description:
      'Comparing a Dext alternative for checks? Dext captures receipts and invoices. Kyriq reads checks from bank statements, matches them in QBO and clears them.',
    keyword: 'dext alternative',
    eyebrow: 'Dext alternative',
    h1: 'A Dext alternative for check-heavy QuickBooks Online clients',
    intro:
      'Dext is built to capture receipts, invoices and expenses and push them into your accounting software. Kyriq is built for the checks: it reads them from the bank statement, matches each one to the QuickBooks Online register and clears it after you approve. For many firms the two sit side by side.',
    body: [
      {
        heading: 'What Dext does',
        paragraphs: [
          'As of October 2026, Dext describes itself as bookkeeping automation for small businesses and accounting firms. It captures receipts, invoices and expenses, extracts and categorizes the data, and syncs it to accounting software including QuickBooks Online, Xero, Sage and Zoho. It has a mobile app for receipts, expenses and mileage, connects to bank feeds, and offers document storage, supplier statement extraction and bank statement extraction.',
          'Dext says it handles data entry, categorization, reconciliation and approvals for the documents it captures. Its site does not mention checks, and it does not describe reading checks or clearing them in the QuickBooks Online reconciliation.',
        ],
      },
      {
        heading: 'Where Kyriq fits',
        paragraphs: [
          'Clients who pay vendors, payroll or rent by check leave a different kind of month-end work: a stack of checks on the statement that each need to be found and cleared in QuickBooks Online. Kyriq handles that, and leaves receipt and invoice capture to tools like Dext.',
        ],
        bullets: [
          'Upload the bank statement PDF you already download, or check images in PDF, JPG or PNG. Several checks on one page are detected.',
          'Typed and handwritten checks are read, with a confidence score on every field.',
          'Each check is scored against the QuickBooks Online register you select and sorted into All Checks, 100% Matches and Needs Attention. Possible duplicates and discrepancies are flagged.',
          'An authorized user approves; 100% matches can be approved together. Approved matches are cleared in the reconciliation and every decision is logged.',
          'The Chrome extension shows the matches inside QuickBooks Online so you can approve and clear there.',
        ],
      },
      {
        heading: 'Kyriq vs Dext at a glance',
        table: {
          head: ['', 'Kyriq', 'Dext'],
          rows: [
            ['Receipt and invoice capture', 'No', 'Yes'],
            ['Expenses and mileage app', 'No', 'Yes'],
            ['Bank statement extraction', 'Yes, to find checks', 'Yes, as an add-on'],
            ['Check extraction, typed and handwritten', 'Yes', 'Not listed'],
            ['Scores checks against the QBO register', 'Yes', 'Not listed'],
            ['Clears approved checks in the QBO reconciliation', 'Yes', 'Not listed'],
            ['Accounting platforms', 'QuickBooks Online only', 'QuickBooks Online, Xero, Sage, Zoho and more'],
            ['Pricing basis', 'Processed checks, unlimited users', 'Documents per month and users'],
          ],
        },
      },
      {
        heading: 'When Dext is the better choice',
        paragraphs: [
          'Receipts and checks create different work. A receipt has to be captured, coded and attached before it reaches the books. A check is usually in QuickBooks Online already, because it was written there or entered from the check stub; what remains is proving it cleared the bank for the amount and payee on record. Dext is built around the first job and Kyriq around the second.',
          'So the deciding factor is the mix of paper your clients send you. A retail or hospitality client with a shoebox of receipts gets more from Dext. A property manager, contractor or nonprofit that pays most bills by check gets more from Kyriq, and some firms run both on the same client.',
        ],
        bullets: [
          'Your clients\' paperwork is mostly receipts, bills and supplier invoices, not checks.',
          'You want staff or clients to submit expenses and mileage from a phone.',
          'You work across Xero, Sage or other platforms, not only QuickBooks Online.',
          'You need a lower entry price. As of October 2026, Dext\'s US pricing page shows a base setup of 250 documents a month and 5 users at $302.50 billed annually, with a 14-day trial that needs no card.',
        ],
      },
      {
        heading: 'How to add Kyriq alongside or instead of Dext',
        steps: [
          'Keep Dext for receipts and invoices if it already works for you.',
          'Start a Kyriq trial: 14 days or 250 checks, with no credit card.',
          'Connect your check-heavy QuickBooks Online clients. Every plan includes unlimited companies and users.',
          'Upload each client\'s bank statement PDF and select the register to match against.',
          'Approve the 100% matches in bulk, work through Needs Attention, and clear approved checks from the web app or the Chrome extension.',
        ],
      },
      {
        heading: 'Sources',
        bullets: [
          'https://dext.com/',
          'https://dext.com/us',
          'https://www.dext.com/us/pricing/prepare-direct/',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Kyriq capture receipts like Dext?',
        a: 'No. Kyriq only handles checks: it reads them from bank statements or check images, matches them to QuickBooks Online and clears approved matches.',
      },
      {
        q: 'Can I use Kyriq and Dext on the same QuickBooks Online company?',
        a: 'Yes. Dext covers receipts, invoices and expenses, and Kyriq covers check matching and clearing. They work on different transactions.',
      },
      {
        q: 'How much does Kyriq cost?',
        a: 'Plans are priced by processed checks: Starter $249 per month for 1,200 checks, Professional $649 for 4,500 and Firm $1,299 for 10,000, with $0.20 per extra check. Annual billing gives one month free. Every plan has unlimited companies and users.',
      },
    ],
    related: [
      '/features/check-reconciliation-quickbooks-online',
      '/features/bulk-check-processing',
      '/for/accounting-firms',
      '/compare/hubdoc-alternative',
      '/pricing',
    ],
    updated: '2026-10-26',
  },
  {
    section: 'compare',
    slug: 'hubdoc-alternative',
    title: 'Hubdoc Alternative for Checks in QuickBooks Online',
    description:
      'Need a Hubdoc alternative for checks? Hubdoc captures bills and receipts. Kyriq reads checks from bank statements, matches them in QBO and clears on approval.',
    keyword: 'hubdoc alternative',
    eyebrow: 'Hubdoc alternative',
    h1: 'A Hubdoc alternative for reconciling checks in QuickBooks Online',
    intro:
      'Hubdoc collects bills, receipts and statements and turns them into transactions with the source document attached. Kyriq picks up where document capture stops for checks: it finds every check on the bank statement, matches it to your QuickBooks Online register and clears it after approval.',
    body: [
      {
        heading: 'What Hubdoc does',
        paragraphs: [
          'As of October 2026, Hubdoc, which carries the "from Xero" brand, describes itself as document and data capture. You add bills, receipts and statements by mobile photo, email forwarding, scanning or desktop upload. Hubdoc extracts supplier names, amounts, invoice numbers and due dates, and creates transactions in Xero or QuickBooks Online with the document attached. It also connects to Bill.com and cloud storage such as Box. Its help content says it does not integrate with QuickBooks Desktop.',
          'Hubdoc\'s site does not mention checks or bank reconciliation. Its job ends when the bill or receipt is in the ledger.',
        ],
      },
      {
        heading: 'What Kyriq adds for check reconciliation',
        paragraphs: [
          'Getting a bill into the ledger is half the job when the bill is paid by check. At month end someone still has to match each check on the bank statement to the payment in QuickBooks Online and mark it cleared. For clients who write dozens or hundreds of checks a month, that comparison is where the close stalls. Kyriq is built for that step and nothing else.',
        ],
        bullets: [
          'Upload the bank statement PDF you already download, or check images in PDF, JPG or PNG. Kyriq extracts the checks, including several on one page.',
          'Typed and handwritten checks are read with a confidence score per field.',
          'Every check is compared with the QuickBooks Online register you select and scored.',
          'All Checks, 100% Matches and Needs Attention views show what can be approved now and what needs a closer look. Possible duplicates and discrepancies are flagged.',
          'An authorized user approves; 100% matches can be approved in bulk. Nothing is cleared without approval.',
          'Approved matches are cleared in the QuickBooks Online reconciliation, with an audit trail of every decision. The Chrome extension lets you do this inside QuickBooks Online.',
        ],
      },
      {
        heading: 'Kyriq vs Hubdoc at a glance',
        table: {
          head: ['', 'Kyriq', 'Hubdoc'],
          rows: [
            ['Bill and receipt capture', 'No', 'Yes'],
            ['Check extraction from bank statements', 'Yes', 'Not listed'],
            ['Handwritten checks with per-field confidence', 'Yes', 'Not listed'],
            ['Scores checks against the QBO register', 'Yes', 'Not listed'],
            ['Clears approved checks in the QBO reconciliation', 'Yes', 'Not listed'],
            ['Xero', 'No', 'Yes'],
            ['QuickBooks Online', 'Yes', 'Yes'],
            ['Pricing', 'From $249 per month, by checks', '$12 per month, per its pricing page'],
          ],
        },
      },
      {
        heading: 'When Hubdoc is the better choice',
        paragraphs: [
          'Hubdoc and Kyriq are rarely either-or. Hubdoc gets documents into the ledger; Kyriq confirms that the checks in the ledger match the bank. If your clients send you mostly bills and receipts, Hubdoc covers the bulk of the work. If they pay vendors, payroll or rent by check, the statement will still be full of checks to tie out at month end, and that is the part Kyriq takes over. You can run both on the same QuickBooks Online company.',
        ],
        bullets: [
          'You or your clients are on Xero. Hubdoc is branded as part of Xero, and Kyriq does not support Xero.',
          'You need bills and receipts captured with the original document attached to each transaction.',
          'You want a low-cost capture tool. As of October 2026, Hubdoc\'s pricing page lists $12 per month after a 30-day free trial that needs no credit card.',
          'Your clients rarely write checks, so reconciliation is quick to do by hand.',
        ],
      },
      {
        heading: 'How to switch from Hubdoc to Kyriq for checks',
        steps: [
          'Keep Hubdoc for bills and receipts if your clients rely on it.',
          'Start a Kyriq trial: 14 days or 250 checks, with no credit card.',
          'Connect your QuickBooks Online companies. There is no limit on companies or users on any plan.',
          'Upload the bank statement PDF for the period and select the register to match against.',
          'Approve the 100% matches in bulk, resolve anything in Needs Attention, and clear approved checks from the web app or the Chrome extension.',
        ],
      },
      {
        heading: 'Sources',
        bullets: [
          'https://www.hubdoc.com/',
          'https://www.hubdoc.com/pricing',
          'https://content.hubdoc.com/getstarted/sync-your-documents-and-data-to-connected-integrations',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Kyriq work with Xero like Hubdoc?',
        a: 'No. Kyriq works only with QuickBooks Online. If you reconcile in Xero, Hubdoc and Xero\'s own tools are the better fit.',
      },
      {
        q: 'Can Kyriq replace Hubdoc completely?',
        a: 'Only if checks are your main document. Kyriq does not capture bills or receipts. Many firms keep a capture tool for bills and use Kyriq to match and clear checks.',
      },
      {
        q: 'What does Kyriq need from my bank?',
        a: 'Just the bank statement PDF you already download. Kyriq extracts the checks from it. You can also upload individual check images as PDF, JPG or PNG.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes. The Kyriq trial runs for 14 days or 250 checks, needs no credit card, and includes the Chrome extension.',
      },
    ],
    related: [
      '/features/check-reconciliation-quickbooks-online',
      '/features/quickbooks-chrome-extension',
      '/for/bookkeepers',
      '/compare/dext-alternative',
      '/pricing',
    ],
    updated: '2026-10-26',
  },
];
