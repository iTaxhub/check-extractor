import type { MarketingPage } from '../types';

/**
 * How-to guides. Each one solves the problem by hand in QuickBooks Online first;
 * the last block explains where Kyriq saves time at volume.
 * UI paths checked against Intuit help articles and community threads, Oct 2026.
 */

const UPDATED = '2026-10-26';

export const GUIDE_PAGES: MarketingPage[] = [
  // 1 -------------------------------------------------------------------------
  {
    section: 'guides',
    slug: 'checks-not-showing-as-cleared-quickbooks-online',
    title: 'Checks Not Showing as Cleared in QuickBooks Online',
    description:
      "Checks not showing as cleared in QuickBooks Online? Find the cause: unmatched bank feed items, duplicates, wrong dates or accounts. A fix for each one.",
    keyword: 'checks not showing as cleared in quickbooks online',
    eyebrow: 'QuickBooks Online guide',
    h1: 'Checks not showing as cleared in QuickBooks Online: 8 causes and fixes',
    intro:
      "A check shows as cleared in QuickBooks Online only when it carries a C or R in the account register. If yours is still blank, the usual cause is that the bank's copy of the check was added as a new transaction instead of matched, or the check sits in the wrong account or date range. Find the cause below and fix it before you reconcile.",
    body: [
      {
        heading: 'What cleared means in QuickBooks Online',
        paragraphs: [
          "Every transaction in a bank register has a reconcile status. Blank means QuickBooks has no record that the bank has processed it. C means cleared: the bank has processed it, but it has not yet been included in a finished reconciliation. R means reconciled: it was ticked in a reconciliation that you completed with Finish now.",
          "A check gets a C in one of three ways: you match it to a downloaded bank transaction in Bank transactions, you tick it in the reconcile window, or you set the status by hand in the register. Cleared items are pre-ticked the next time you open Reconcile. A check only becomes R when a reconciliation is finished, so a C that never turns into R usually means the reconciliation was saved for later rather than finished.",
        ],
      },
      {
        heading: 'How to check the status of a check in the register',
        steps: [
          'Open Chart of accounts. Depending on your layout it is under Accounting (go to All apps if it is not pinned), under Transactions, or under Settings (the gear icon).',
          'Find the bank account the check was written from and select View register in the Action column.',
          'Search or filter for the check number, payee or amount.',
          'Look at the reconcile status column (headed with a check mark in most layouts). Blank, C or R tells you where the check stands.',
          'If you cannot see the column, open the register settings (the small gear above the register) and tick the reconcile and banking status option.',
        ],
      },
      {
        heading: 'Why a check is not showing as cleared, and the fix for each cause',
        bullets: [
          "The bank's copy is still waiting for review. If the cleared check is sitting on the For review tab (called Pending in the newer Bank transactions layout), nothing has touched your original check yet. Fix: open Bank transactions, find the item and select Match against your recorded check.",
          "It was added instead of matched. If someone selected Add or Post on the bank's copy, QuickBooks created a second transaction. The new copy is cleared and your original check stays blank, and the account is now overstated by one check. Fix: undo the added copy (steps below) and match it to the original.",
          'The amounts or payees do not agree. QuickBooks only suggests a match when the details line up. A check entered as 1,245.00 that cleared at 1,254.00 will not be offered as a match. Fix: confirm the amount against the check image from your bank, correct the entry if it was a typo, then match.',
          'The check is in the wrong bank account. A check recorded against your savings account, or a bill payment made from a different account, will never appear in the checking account reconciliation. Fix: open the check, change the bank account to the right one, save, and match again.',
          'The check is dated after the statement ending date. The reconcile window shows transactions up to the statement ending date, so a check dated a day later stays hidden. Fix: confirm the date the check was written, correct it if needed, or clear the date filter in the reconcile window to see later items.',
          'The reconciliation was saved for later, not finished. Ticked items show C until you complete the reconciliation. Fix: open Reconcile, resume the saved reconciliation, get the difference to 0.00 and select Finish now.',
          "The bank really has not paid it. Some checks are simply outstanding: the payee has not deposited them. Fix: confirm on your bank statement or in online banking. If it is not there, leave it blank and follow up with the payee if it gets old.",
          'It is a customer check that was never deposited in QuickBooks. Received payments sit in Undeposited Funds (labelled Payments to deposit in some accounts) until you record a bank deposit. Fix: create the bank deposit that includes the payment, then match the deposit to the bank feed.',
        ],
      },
      {
        heading: 'How to fix a check that was added instead of matched',
        steps: [
          'Go to Bank transactions (under Accounting in the current layout, or Banking or Transactions in older ones) and pick the bank account.',
          'Open the Categorized tab (called Posted in the newer layout) and find the bank copy of the check.',
          'Select Undo. The item moves back to For review (or Pending).',
          'Expand the item and match it to your original check instead of adding it.',
          'Open the register and confirm the original check now shows C and the duplicate is gone.',
        ],
        paragraphs: [
          'If the added copy was already reconciled, QuickBooks warns that the change may affect your next reconciliation. Read the section below before you continue.',
        ],
      },
      {
        heading: 'Before you change a check that is already reconciled (R)',
        paragraphs: [
          "Editing the amount, account or date of an R transaction, deleting it, voiding it, or flipping its status back to blank changes the balance of a reconciliation you already finished. QuickBooks warns you when you open such a transaction, and the next time you reconcile the beginning balance will not match your statement. QuickBooks then shows a discrepancy report listing what changed.",
          "Intuit's current help article says the Primary Admin and accountant users can undo a whole reconciliation from Reconcile, then History by account, using Undo in the Action column. Older guidance limited this to accountant users in QuickBooks Online Accountant, so if you do not see the option, ask your accountant. Undoing a reconciliation also undoes every later one and deletes its saved report, so download reports first and change R items only when you know why.",
        ],
      },
      {
        heading: 'A quick checklist before you reconcile',
        bullets: [
          'All bank feed items for the statement period are matched, added or excluded. Nothing is left on For review or Pending.',
          'No check number appears twice in the register for the same account.',
          'The statement ending date and ending balance in the reconcile setup match the paper or PDF statement exactly.',
          'Checks from previous months that are still outstanding are listed on your last reconciliation report, so you know which ones to expect.',
        ],
      },
      {
        heading: 'Clearing hundreds of checks at once',
        paragraphs: [
          'Working through these causes one check at a time is fine for a handful of items. It gets slow when a statement has hundreds of checks. Kyriq reads the bank statement PDF you upload, extracts each check, including handwritten ones, with a confidence score, and compares it with your QuickBooks Online register.',
          'Exact matches are grouped so you can approve them in bulk. Duplicates, amount differences and checks with no register entry go to Needs Attention, which covers most of the causes listed above. Nothing is cleared until an authorized user approves it. Kyriq then clears the approved matches in the QuickBooks Online reconciliation and keeps an audit trail. Kyriq works with QuickBooks Online only. The trial covers 14 days or 250 checks and needs no card.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Why does my check say C but not R in QuickBooks Online?',
        a: 'C means the check has been cleared, by a bank feed match or by ticking it, but it has not been part of a finished reconciliation. It turns into R when you complete a reconciliation that includes it and select Finish now.',
      },
      {
        q: 'Why is a cleared check not in my reconcile window?',
        a: 'The most common reasons are that it was recorded in a different bank account, or it is dated after the statement ending date you entered. Check the account on the transaction and the ending date in the reconcile setup.',
      },
      {
        q: 'Can I mark a check as cleared without the bank feed?',
        a: 'Yes. Tick it in the reconcile window, or open the account register and set its status to C. Only do this when the check appears on your bank statement.',
      },
      {
        q: 'Why does QuickBooks not suggest a match for my check?',
        a: 'Suggested matches rely on the amount and date being close to what the bank sent. If the amount is different, the check was recorded in another account, or it was already matched to something else, no match is offered.',
      },
      {
        q: 'Is it safe to change a reconciled check?',
        a: 'Only with care. Changing an R transaction alters a finished reconciliation, and your next beginning balance will not agree with the statement. Talk to your accountant first if the period is closed.',
      },
    ],
    related: [
      '/guides/mark-check-as-cleared-quickbooks-online',
      '/guides/match-checks-to-bank-feed-quickbooks-online',
      '/guides/clear-outstanding-checks-quickbooks-online',
      '/features/check-reconciliation-quickbooks-online',
      '/tools/outstanding-checks-template',
    ],
    updated: UPDATED,
  },

  // 2 -------------------------------------------------------------------------
  {
    section: 'guides',
    slug: 'clear-outstanding-checks-quickbooks-online',
    title: 'How to Clear Outstanding Checks in QuickBooks Online',
    description:
      'How to clear outstanding checks in QuickBooks Online: tick the ones that hit the bank, then decide whether to keep, void or reverse old stale checks.',
    keyword: 'how to clear outstanding checks in quickbooks online',
    eyebrow: 'QuickBooks Online guide',
    h1: 'How to clear outstanding checks in QuickBooks Online',
    intro:
      "An outstanding check is one you recorded in QuickBooks Online that has not yet cleared your bank. If it has since cleared, tick it in your next reconciliation. If it is old and will never clear, you either keep it, void it, or reverse it with a journal entry, and the right choice depends on whether the period is closed and whether the money is still owed.",
    body: [
      {
        heading: 'Find your outstanding checks',
        paragraphs: [
          "Your last reconciliation report lists them. Open Reconcile (under Accounting in the current layout, reached through All apps if it is not pinned; under Transactions or the Settings gear in older layouts), select History by account, choose the bank account and open the most recent report. The uncleared checks and payments section shows every check that was outstanding as of that statement date.",
          'You can also open the bank account register from Chart of accounts and filter for checks with a blank reconcile status. Sort by date so the oldest ones are at the top.',
          'Copy the list into a spreadsheet with the check number, date, payee and amount, and add a column for what you found out about each one. It keeps the follow-up organized and gives your accountant a clear record if any checks are later voided or reported as unclaimed property.',
        ],
      },
      {
        heading: 'Before you remove an old check from the books',
        bullets: [
          'Confirm it has not cleared. Search online banking by check number and amount. A check that cleared at a slightly different amount, or was added from the bank feed as a separate transaction, can look outstanding when it is not.',
          'Contact the payee. Ask whether they received and deposited it. Many old checks were simply lost in the mail or in a drawer.',
          'Check what the payment was for. If it paid a vendor bill, the vendor may still show the amount as owed. If it was a payroll check, the wages are still owed to the employee.',
          'Decide on a stop payment. If you are going to reissue, place a stop payment on the original first, so both cannot be cashed.',
          'Write down what you did and when. Notes on each contact attempt matter if the amount later has to be reported as unclaimed property.',
        ],
      },
      {
        heading: 'Clear checks that have now hit the bank',
        steps: [
          'Open Reconcile, choose the bank account and enter the statement ending date and ending balance from your new statement.',
          'Select Start reconciling. Outstanding checks from earlier months appear in the list along with this month\'s activity.',
          'Tick every check that appears on the new statement. If a check came through the bank feed and you matched it, it is already ticked.',
          'When the difference is 0.00, select Finish now. The ticked checks change from blank or C to R.',
        ],
        paragraphs: [
          'If a check cleared at a different amount from the one you recorded, do not tick it until you have corrected the entry. Ticking it as is leaves a difference you will chase later.',
        ],
      },
      {
        heading: 'Old outstanding checks: keep, void or reverse',
        paragraphs: [
          'Banks are generally not required to honor checks more than six months old, but they can, so an old check is not automatically dead. Before you remove one from the books, contact the payee. They may have lost it, in which case you stop payment and reissue.',
        ],
        table: {
          head: ['Option', 'When it fits', 'What it changes'],
          rows: [
            ['Keep it outstanding', 'You still owe the money and expect the payee to cash or replace it', 'Nothing. It keeps appearing on reconciliation reports'],
            ['Void the check', 'The check is in an open period and you want it to read as never paid', 'Sets the amount to zero on its original date, so the original period changes'],
            ['Reverse with a journal entry', 'The original period is closed or the books for that year are filed', 'Leaves history intact and puts the reversal in the current period'],
          ],
        },
      },
      {
        heading: 'How to void an outstanding check',
        steps: [
          'Find the check in the bank register, or in the expense transactions list under Expenses (or Expenses and Bills).',
          'Open it, select More at the bottom of the form, then Void, and confirm.',
          'If you set a closing date, QuickBooks warns that you are changing a closed period. Stop and use a journal entry instead if that period has been reported.',
          'If the check paid a bill, voiding it reopens that bill. Decide whether the bill should stay open or be handled separately.',
        ],
        paragraphs: [
          'Because an outstanding check was never reconciled, voiding it does not break a past reconciliation. It does change the bank balance and expenses for the period it was dated in.',
        ],
      },
      {
        heading: 'How to reverse a stale check with a journal entry',
        steps: [
          'Create a journal entry dated in the current period.',
          'Debit the bank account for the amount of the check.',
          'Credit the account your accountant chooses: often the original expense account, or a liability account for unclaimed property if you will have to report and remit the money.',
          'In the memo, note the original check number, payee and date.',
          'In your next reconciliation, tick both the old check and the journal entry. They cancel each other out, so your difference is unaffected and both drop off the outstanding list.',
        ],
      },
      {
        heading: 'Unclaimed property rules for uncashed checks',
        paragraphs: [
          'In the US, uncashed vendor and payroll checks are usually unclaimed property. Most states require businesses to try to reach the payee and then report and remit the money to the state after a dormancy period that varies by state and by type of payment. Writing an old check off to income may not satisfy those rules.',
          'This guide is not legal advice. Ask your accountant which state rules apply to you before you void or reverse checks that were never cashed, and keep a record of your attempts to contact the payee.',
        ],
      },
      {
        heading: 'Clearing hundreds of checks at once',
        paragraphs: [
          'When a statement has hundreds of checks, ticking each one is the slow part. Kyriq reads the bank statement PDF you upload, extracts the checks, including handwritten ones, with a confidence score, and compares them with your QuickBooks Online register. Exact matches are grouped for bulk approval, and anything that does not line up goes to Needs Attention.',
          'An authorized user approves the matches, and only then does Kyriq clear them in the QuickBooks Online reconciliation, with an audit trail of who approved what. Kyriq does not void or write off checks; the outstanding checks that remain are yours to decide on with your accountant. The trial covers 14 days or 250 checks, no card needed.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How long can a check stay outstanding in QuickBooks Online?',
        a: 'QuickBooks has no limit. A check stays outstanding until you clear, void or reverse it. Banks generally may refuse checks older than six months, and state unclaimed property rules may apply after longer periods.',
      },
      {
        q: 'Should I void or delete an old outstanding check?',
        a: 'Void rather than delete. Voiding keeps the check number and an audit trail. Deleting removes the record entirely, which makes the history harder to follow.',
      },
      {
        q: 'Does voiding an outstanding check affect past reconciliations?',
        a: 'No, because an outstanding check was never reconciled. It does change the bank balance and expenses for the period the check was dated in, which matters if that period is closed.',
      },
      {
        q: 'Where do I see outstanding checks in QuickBooks Online?',
        a: 'Open Reconcile, select History by account and view the latest report for the bank account. The uncleared items section lists checks that were outstanding at that statement date.',
      },
      {
        q: 'What do I do if the payee lost the check?',
        a: 'Place a stop payment with your bank, then void the original check (or reverse it if the period is closed) and record a new check for the replacement.',
      },
    ],
    related: [
      '/tools/outstanding-checks-template',
      '/guides/checks-not-showing-as-cleared-quickbooks-online',
      '/guides/mark-check-as-cleared-quickbooks-online',
      '/features/check-reconciliation-quickbooks-online',
      '/guides/outstanding-cheques-quickbooks-online-canada',
    ],
    updated: UPDATED,
  },

  // 3 -------------------------------------------------------------------------
  {
    section: 'guides',
    slug: 'mark-check-as-cleared-quickbooks-online',
    title: 'How to Mark a Check as Cleared in QuickBooks Online',
    description:
      'How to mark a check as cleared in QuickBooks Online three ways: the reconcile window, the account register, or a bank feed match. Plus when to use each.',
    keyword: 'how to mark a check as cleared in quickbooks online',
    eyebrow: 'QuickBooks Online guide',
    h1: 'How to mark a check as cleared in QuickBooks Online',
    intro:
      'The safest way to mark a check as cleared in QuickBooks Online is to tick it in the reconcile window while you reconcile against your bank statement. You can also match it to a bank feed transaction, or set its status to C by hand in the account register. Each method is below, with when to use it.',
    body: [
      {
        heading: 'Cleared versus reconciled',
        paragraphs: [
          'The account register shows one of three statuses next to each transaction. Blank means not cleared. C means cleared: the bank has processed it, but it is not yet in a finished reconciliation. R means reconciled: it was included in a reconciliation you completed.',
          'Marking a check as cleared gives it a C. It turns into R when you finish the reconciliation that includes it. For month-end, R is what you want, because only R items are locked into a reconciliation report.',
        ],
      },
      {
        heading: 'Method 1: tick the check in the reconcile window (recommended)',
        steps: [
          'Open Reconcile. In the current layout it is under Accounting, reached through All apps if it is not pinned. In older layouts look under Transactions or the Settings gear.',
          'Choose the bank account. Enter the ending balance and ending date exactly as they appear on your statement.',
          'Select Start reconciling.',
          'Find the check in the Payments column (sort by check number or amount) and tick the box next to it.',
          'Repeat for every item on the statement until the difference reads 0.00.',
          'Select Finish now. The ticked check is now R. If you need to stop partway, use the Save for later option next to Finish now; ticked items stay C until you finish.',
        ],
        paragraphs: [
          'Work from the statement, not from the list in QuickBooks. Go down the checks on the statement in order and find each one in the reconcile window, rather than ticking what looks familiar on screen. Ticking from the QuickBooks side is how checks that never cleared get marked as cleared.',
        ],
      },
      {
        heading: 'Method 2: set the status in the account register',
        steps: [
          'Open Chart of accounts (under Accounting, Transactions or the Settings gear, depending on your layout).',
          'Select View register on the bank account.',
          'Click the check to open it in the register row.',
          'Click the reconcile status cell until it shows C. If the column is missing, turn on the reconcile and banking status option in the register settings.',
          'Select Save.',
        ],
        paragraphs: [
          'Use this for a one-off correction, such as a check you know cleared that was not ticked. Do not set R by hand: an R that did not come from a finished reconciliation is not on any reconciliation report, and it shifts the beginning balance of your next reconciliation.',
        ],
      },
      {
        heading: 'Method 3: match the check in Bank transactions',
        steps: [
          'Open Bank transactions (under Accounting in the current layout) and select the bank account.',
          'On the For review tab (Pending in the newer layout), find the cleared check that came from your bank.',
          'If QuickBooks shows a suggested match to your recorded check, confirm it with Match.',
          'If not, expand the item and search for the check by amount, date or payee, then match it.',
        ],
        paragraphs: [
          "Matching links the bank's copy to your existing check and sets it to C. Do not select Add or Post on a check you already recorded: that creates a second transaction and leaves the original blank.",
        ],
      },
      {
        heading: 'Which method to use',
        bullets: [
          'You reconcile monthly against a statement: use the reconcile window. It gives you a report and a 0.00 difference as proof.',
          'Your bank account is connected to QuickBooks: match in Bank transactions as items arrive, then confirm in the reconcile window at month-end.',
          'You are fixing one check that should have been ticked: use the register, then reconcile as normal.',
          'You are not sure the check cleared: do not mark it. Check the bank statement or online banking first.',
          'You are catching up several months: reconcile one statement at a time, oldest first, so each reconciliation report matches one statement and the checks cleared in each month are easy to trace later.',
        ],
        paragraphs: [
          'Whichever method you use, the reconciliation report is the record your accountant or auditor will look at. A check marked cleared by any route only appears on that report once a reconciliation that includes it is finished, which is one more reason to end every month in the reconcile window.',
        ],
      },
      {
        heading: 'Common problems when marking checks as cleared',
        bullets: [
          'The check is not in the reconcile window. It is probably recorded in another bank account or dated after the statement ending date. Open the check and confirm both.',
          'Every check is ticked but the difference is not 0.00. Re-read the ending balance you typed, then look for a check ticked twice through a duplicate, or a past reconciled item that was edited. QuickBooks flags a changed beginning balance before you start.',
          'A check was ticked automatically but has not cleared. With recurring checks of the same amount, such as rent, the bank feed can be matched to the wrong month. Compare the check number on the statement with the one in QuickBooks and untick or rematch it.',
          'QuickBooks warns about a closed period. A closing date has been set. Ask whoever closed the books before changing anything dated before it.',
        ],
      },
      {
        heading: 'Unmarking a check you cleared by mistake',
        paragraphs: [
          'If the check is C, untick it in the reconcile window or set it back to blank in the register. If it is R, changing it alters a finished reconciliation, so your next beginning balance will not match. Intuit\'s current help says the Primary Admin and accountant users can undo a whole reconciliation from History by account; older guidance limited undo to accountant users, so ask your accountant if you do not see the option.',
        ],
      },
      {
        heading: 'Clearing hundreds of checks at once',
        paragraphs: [
          'All three methods mean finding and ticking checks one by one. Kyriq does the finding: upload the bank statement PDF and it extracts each check, including handwritten ones, with a confidence score, then compares them with your QuickBooks Online register and scores each match.',
          'Exact matches are grouped so an authorized user can approve them in bulk. Duplicates and discrepancies go to Needs Attention. After approval, Kyriq clears the approved matches in the QuickBooks Online reconciliation, and nothing is cleared without that approval. A Chrome extension shows the same results inside QuickBooks Online. The trial covers 14 days or 250 checks, no card needed.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I mark multiple checks as cleared in QuickBooks Online?',
        a: 'Use the reconcile window. Every item you tick there is cleared, and they all become reconciled when you select Finish now. The register only lets you change one transaction at a time.',
      },
      {
        q: 'What is the difference between C and R in QuickBooks Online?',
        a: 'C means cleared but not yet in a finished reconciliation. R means the transaction was included in a reconciliation you completed. C items are pre-ticked when you next reconcile.',
      },
      {
        q: 'Can I mark a check as reconciled without reconciling?',
        a: 'You can set R in the register, but it is not recommended. The change does not appear on any reconciliation report and it throws off your next beginning balance.',
      },
      {
        q: 'Why did my check become cleared automatically?',
        a: 'Matching a downloaded bank transaction to your check sets it to C. That is expected and saves ticking it later.',
      },
      {
        q: 'Can I mark checks as cleared in the QuickBooks mobile app?',
        a: 'Intuit staff said in 2026 that reconciliation is not supported in the QuickBooks Online mobile app. Use a web browser on a computer.',
      },
    ],
    related: [
      '/guides/checks-not-showing-as-cleared-quickbooks-online',
      '/guides/match-checks-to-bank-feed-quickbooks-online',
      '/guides/clear-outstanding-checks-quickbooks-online',
      '/features/bulk-check-processing',
      '/features/check-reconciliation-quickbooks-online',
    ],
    updated: UPDATED,
  },

  // 4 -------------------------------------------------------------------------
  {
    section: 'guides',
    slug: 'match-checks-to-bank-feed-quickbooks-online',
    title: 'Match Checks to the Bank Feed in QuickBooks Online',
    description:
      'How to match checks to bank feed: QuickBooks Online steps for Match vs Add, fixing duplicate checks, finding missing matches, and bank rules to watch.',
    keyword: 'match checks to bank feed quickbooks online',
    eyebrow: 'QuickBooks Online guide',
    h1: 'How to match checks to the bank feed in QuickBooks Online',
    intro:
      "If you write checks in QuickBooks Online and your bank account is connected, each cleared check arrives in Bank transactions as a downloaded item. Match it to the check you already recorded rather than adding it, so QuickBooks links the two and marks your check as cleared. Adding it instead creates a duplicate.",
    body: [
      {
        heading: 'Match, Add and Categorize: what each does',
        bullets: [
          'Match links the downloaded item to a transaction already in QuickBooks. Nothing new is created. Your recorded check gets a C status in the register.',
          'Add (shown as Post in the newer layout when QuickBooks has a suggested category) creates a new transaction from the downloaded item. Use it for things you never recorded, such as bank fees.',
          'Categorize lets you choose the account before adding. It still creates a new transaction.',
          'Exclude removes the downloaded item from review without recording anything. Use it for true duplicates the bank sent twice.',
        ],
        paragraphs: [
          'For checks you already wrote in QuickBooks, Match is almost always the right action. Add is right only for checks nobody entered, for example a check written from the checkbook while the bookkeeper was away. In that case, add it with the correct payee, expense account and check number rather than accepting a generic suggested category, so the register still reads like a check register.',
        ],
      },
      {
        heading: 'How to match a check',
        steps: [
          'Go to Bank transactions. In the current layout it is under Accounting (use All apps if it is not pinned). Older layouts put it under Banking or Transactions.',
          'Select the bank account tile at the top.',
          'Open the For review tab (called Pending in the newer layout).',
          'Find the check. Many banks include the check number in the description; sort by amount if not.',
          'If QuickBooks shows a match to your recorded check, confirm the payee, number and amount, then select Match.',
          'If it shows Add or Post instead, do not accept it yet. Expand the row and use the option to find a match, then search by amount, date range or payee and select your check.',
          'Confirm. The item moves to the Categorized tab (Posted in the newer layout) and your check shows C in the register.',
        ],
      },
      {
        heading: 'When QuickBooks suggests the wrong match, or none',
        bullets: [
          'Several checks have the same amount. Recurring checks, such as rent or a retainer, look identical to QuickBooks apart from the number and date. A suggested match can pick the wrong month. Always compare the check number in the bank description with the number on the suggested check before you confirm.',
          'The amount is different. A transposed digit means no suggestion. Correct the check if your entry was wrong, then match.',
          'The check is dated well before it cleared. Old checks may fall outside the range QuickBooks looks at for suggestions. Search for it manually by amount.',
          'The check was recorded in another bank account. It will not be offered for this feed. Fix the account on the check first.',
          'The check is already matched or cleared. If it was matched to something else, undo that match first.',
          'The check was never recorded. Then Add is correct: create it with the right payee, account and check number.',
        ],
      },
      {
        heading: 'Fixing checks that were added instead of matched',
        steps: [
          'Open the Categorized tab (Posted in the newer layout) and find the added copy.',
          'Select Undo. The item returns to For review (Pending).',
          'Match it to your original check.',
          'Check the register: the original should show C and there should be one check with that number, not two.',
        ],
        paragraphs: [
          'If the added copy was already reconciled, QuickBooks warns that undoing it may affect your next reconciliation. Talk to your accountant before changing transactions in a reconciled period.',
        ],
      },
      {
        heading: 'Watch your bank rules',
        paragraphs: [
          "Bank rules categorize downloaded items automatically, and a rule set to auto-confirm adds them without review. A broad rule, such as any description containing CHECK, can add every cleared check as a new expense, duplicating the checks you already wrote. Review your rules and turn off auto-confirm on any rule that could catch checks, so those items wait for you to match them.",
          'Rules are listed on the Rules page, found alongside Bank transactions (its exact place in the menu depends on your layout). Sort by the description condition and look for anything containing CHECK, CHK, a check number pattern, or the name of a payee you usually pay by check. Narrow those rules to the exact transactions they were written for, or delete them if the payee is always paid by check you record yourself.',
        ],
      },
      {
        heading: 'Matching is not reconciling',
        paragraphs: [
          'A matched check is cleared (C), not reconciled (R). Reconciling against the bank statement is still the step that proves your balance. At month-end, open Reconcile, enter the statement ending date and ending balance, confirm the pre-ticked items, tick anything that cleared but never came through the feed, and finish when the difference is 0.00.',
          'Bank feeds are not a complete record. Connections drop, banks change their download formats, and accounts are sometimes reconnected with a gap or an overlap in dates. Any of these can mean a cleared check never arrives for matching, or arrives twice. The statement is the record that counts, so treat the feed as a shortcut for most of the work and the reconciliation as the check on it.',
          'If you find a gap, you can fill it by uploading a transaction file for the missing dates from Upload from file in Bank transactions. Pick a date range that does not overlap what the feed already downloaded.',
        ],
      },
      {
        heading: 'Clearing hundreds of checks at once',
        paragraphs: [
          'Matching works one item at a time, and it depends on the bank feed sending clean data. Kyriq works from the statement itself. Upload the bank statement PDF and Kyriq extracts each check, including handwritten ones, with a confidence score, then compares it with your QuickBooks Online register.',
          'Exact matches are grouped for bulk approval, and possible duplicates, such as a check that was added rather than matched, are flagged in Needs Attention. Once an authorized user approves, Kyriq clears the approved matches in the QuickBooks Online reconciliation, with an audit trail. Kyriq supports unlimited companies and users, which suits firms working across many client files.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Should I match or add a check in QuickBooks Online?',
        a: 'Match it if you already recorded the check in QuickBooks. Add it only if the check was never entered. Adding a check you already recorded creates a duplicate.',
      },
      {
        q: 'Why are my checks duplicated in QuickBooks Online?',
        a: 'Usually because the bank copy was added or auto-added by a bank rule instead of matched to the check you wrote. Undo the added copy and match it to the original.',
      },
      {
        q: 'Does matching a check reconcile it?',
        a: 'No. Matching marks the check as cleared (C). It becomes reconciled (R) when you finish a reconciliation that includes it.',
      },
      {
        q: 'Can I match one bank transaction to several checks?',
        a: 'When finding a match manually, QuickBooks lets you select more than one transaction if their total equals the bank amount. This is more common with deposits than checks.',
      },
      {
        q: 'Where did the For review tab go?',
        a: 'In the newer Bank transactions layout the tabs are called Pending, Posted and Excluded. They work like For review, Categorized and Excluded in the older layout.',
      },
    ],
    related: [
      '/guides/checks-not-showing-as-cleared-quickbooks-online',
      '/guides/mark-check-as-cleared-quickbooks-online',
      '/guides/import-checks-into-quickbooks-online',
      '/features/check-reconciliation-quickbooks-online',
      '/features/quickbooks-chrome-extension',
    ],
    updated: UPDATED,
  },

  // 5 -------------------------------------------------------------------------
  {
    section: 'guides',
    slug: 'record-handwritten-checks-quickbooks',
    title: 'How to Record Handwritten Checks in QuickBooks Online',
    description:
      'How to record handwritten checks in QuickBooks Online: Check vs Expense forms, why Print later must stay off, check numbers, and paying bills by hand.',
    keyword: 'how to record handwritten checks in quickbooks online',
    eyebrow: 'QuickBooks Online guide',
    h1: 'How to record handwritten checks in QuickBooks Online',
    intro:
      'Record a handwritten check with the Check form in QuickBooks Online: choose the bank account, enter the payee and the number written on the check, date it the day you wrote it, and leave Print later unticked. If the check pays a bill already in QuickBooks, record it with Pay bills instead so the bill is closed.',
    body: [
      {
        heading: 'Check form or Expense form?',
        paragraphs: [
          'Both forms reduce your bank balance and record the expense, so either will reconcile. The Check form is better for checks: it has a Check no. field, it can hold checks for printing, and it records the transaction as type Check, which makes check reports and register searches cleaner.',
          'The Expense form is designed for card payments, cash and other methods. You can still record a check there by setting Payment method to Check and typing the number in Ref no., but the transaction type is Expense. If your team uses both forms for checks, searches by check number get messy. Pick one, and the Check form is the natural choice.',
          'Whichever form you use, the bank account, amount and check number are what reconciliation depends on. The payee and expense account matter for your reports and for 1099 tracking, so take the extra few seconds to pick the right vendor rather than a catch-all payee.',
        ],
      },
      {
        heading: 'How to record a handwritten check',
        steps: [
          'Select + New (labelled + Create in some layouts) and choose Check.',
          'Choose the payee. If they are new, add them from the payee field.',
          'Choose the bank account the check was drawn on.',
          'Set the payment date to the date written on the check.',
          'Enter the number from the check in Check no.',
          'Leave Print later unticked. That box is only for checks QuickBooks will print.',
          'In the category or item details, choose the expense account and enter the amount. Split across lines if the check covers several things.',
          'Optional: attach a photo or scan of the check in Attachments, so the image sits with the transaction.',
          'Select Save and close.',
        ],
      },
      {
        heading: 'Why Print later must stay off',
        paragraphs: [
          'When Print later is ticked, the Check no. field changes to To print and the check goes into the print queue. QuickBooks assigns a number only when the check is printed. A handwritten check left in that state shows no number in the register, sits in the print queue, and may later be printed by mistake or given a different number.',
          'If you find one, open it, untick Print later, type the real check number, and save. If the number field is greyed out, untick Print later first.',
          'To catch these in bulk, open the print queue from the expense transactions list (Print checks) before each check run. Anything in the queue that was actually written by hand should be taken out of the queue the same way, before someone prints it on check stock.',
        ],
      },
      {
        heading: 'Paying a bill with a handwritten check',
        steps: [
          'Do not create a new Check for a bill already entered in QuickBooks. That records the expense twice and leaves the bill open.',
          'Go to Pay bills (under Expenses or Expenses and Bills, or from + New).',
          'Choose the bank account and payment date, and tick the bill you paid.',
          'Make sure Print later is off, then enter the handwritten check number.',
          'Save. The bill is closed and the payment appears in the register as a bill payment with your check number.',
        ],
        paragraphs: [
          'If you start on the Check form and the payee has open bills, QuickBooks may show them in a side panel so you can add them to the check. Adding the bill there also closes it.',
        ],
      },
      {
        heading: 'Keeping check numbers straight',
        bullets: [
          'QuickBooks suggests the next number after the last one used on that account. If you mix printed and handwritten checks, the suggestion can be wrong. Type the number on the paper check every time.',
          'Turn on the duplicate check number warning in Settings, Account and settings, Advanced, Other preferences. It warns you before you save a number that is already used.',
          'Use separate number ranges for printed check stock and your handwritten checkbook, so the two never collide.',
          'Record the check the day you write it, not when it clears. Entering checks only from the bank feed loses the date written and makes outstanding checks invisible.',
        ],
      },
      {
        heading: 'Recording a spoiled or voided paper check',
        steps: [
          'Create a Check with the payee (or a placeholder payee such as Void), the bank account, the date and the check number from the spoiled check.',
          'Enter any amount and account so the form will save, then select Save.',
          'Open the check again, select More at the bottom of the form, then Void, and confirm.',
          'The check now shows in the register with its number and a zero amount, so the gap in your sequence is explained for anyone reviewing the books.',
        ],
      },
      {
        heading: 'When the handwritten check clears',
        paragraphs: [
          "When the check shows up in Bank transactions, match it to the check you recorded. Do not add it. Matching marks your check as cleared and avoids a duplicate. At month-end, tick it in the reconcile window if it is not already ticked, and finish the reconciliation.",
          'If you forgot to record a handwritten check and it has already arrived in the bank feed, you have two choices. You can create the Check now with the correct date written, payee and number, then match the bank item to it. Or you can add the bank item and edit the payee, account and check number before you confirm. The first keeps the original date written; the second is faster but uses the clearing date.',
        ],
      },
      {
        heading: 'Clearing hundreds of checks at once',
        paragraphs: [
          'Handwritten checks are the hardest to reconcile at volume, because the bank description often says little more than CHECK and a number. Kyriq reads the bank statement PDF you upload, or check images in PDF, JPG or PNG, and extracts the checks, including handwritten amounts and payees, with a confidence score so you can see which readings to verify.',
          'It then compares each check with your QuickBooks Online register, groups exact matches for bulk approval and flags duplicates and discrepancies in Needs Attention. After an authorized user approves, Kyriq clears the approved matches in the reconciliation. The trial covers 14 days or 250 checks, no card needed.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Should I use Check or Expense for a handwritten check?',
        a: 'Use the Check form. It has a check number field and records the transaction as a check. The Expense form works, but the transaction type will be Expense, which makes check searches harder.',
      },
      {
        q: 'Why does my check number say To print?',
        a: 'Print later is ticked, so QuickBooks is waiting to assign the number at printing. Untick Print later and enter the handwritten number.',
      },
      {
        q: 'How do I record a handwritten check for a bill?',
        a: 'Use Pay bills, tick the bill, leave Print later off and enter the check number. Creating a separate Check would leave the bill open and double the expense.',
      },
      {
        q: 'Can I change the next check number in QuickBooks Online?',
        a: 'QuickBooks suggests the next number after the last one used, but you can type over it on any check. When printing, you enter the starting check number in the print window.',
      },
      {
        q: 'Do I need to record a handwritten check before it clears?',
        a: 'Yes. Record it when you write it, so your register balance is right and the check shows as outstanding until it clears.',
      },
    ],
    related: [
      '/features/handwritten-check-ocr',
      '/guides/match-checks-to-bank-feed-quickbooks-online',
      '/guides/import-checks-into-quickbooks-online',
      '/tools/micr-line-decoder',
      '/guides/checks-not-showing-as-cleared-quickbooks-online',
    ],
    updated: UPDATED,
  },

  // 6 -------------------------------------------------------------------------
  {
    section: 'guides',
    slug: 'quickbooks-check-scanner-not-working',
    title: 'QuickBooks Check Scanner Not Working? How to Fix It',
    description:
      'QuickBooks check scanner not working? Fixes for mobile check deposit, receipt capture uploads, and desktop check scanners, plus how to tell which one you use.',
    keyword: 'quickbooks check scanner not working',
    eyebrow: 'QuickBooks troubleshooting',
    h1: 'QuickBooks check scanner not working: how to fix it',
    intro:
      'QuickBooks Online has no single feature called the check scanner. People usually mean mobile check deposit in the QuickBooks app, receipt capture, or a desktop check scanner supplied by their bank. Work out which one you are using, then follow the fixes for it below.',
    body: [
      {
        heading: 'Which check scanner are you using?',
        bullets: [
          'Mobile check deposit: you photograph a received check in the QuickBooks mobile app to deposit it into a QuickBooks Checking account. It is only available for QuickBooks Checking and is subject to eligibility.',
          'Receipt capture: you snap or upload a photo in the app, or upload a file under Receipts in the browser, and QuickBooks reads the details into a transaction for review. It is built for receipts and bills, not checks.',
          "A desktop check scanner: a USB scanner, usually provided by your bank for remote deposit capture. It sends checks to the bank through the bank's software, not through QuickBooks Online.",
          'A regular document scanner used to scan check copies, which you then attach to transactions in QuickBooks.',
        ],
      },
      {
        heading: 'Fix mobile check deposit',
        steps: [
          'Confirm you are eligible. If the deposit option does not appear in the app, Intuit says the account is not eligible yet. Your QuickBooks Checking account must be active and in good standing.',
          'Update the QuickBooks app and your phone operating system.',
          'Retake the photos: front and back, on a dark, well-lit surface, with all four corners of the check in frame and no shadows.',
          'Make sure the amount you type matches the amount on the check exactly, and endorse the back as the app instructs.',
          'Clear the app cache. On Android use Refresh data in the app settings, or clear storage for the app. On iPhone, offload the app in iPhone Storage and reinstall it.',
          'If it still fails, note the exact error message and the step where it appears, then contact QuickBooks support from Help in the app.',
        ],
        paragraphs: [
          'Deposits made this way still need to be in your books. Once the deposit lands, make sure it is recorded against the right customer payment or income account and is not entered a second time from the bank feed.',
        ],
      },
      {
        heading: 'Fix receipt capture uploads',
        steps: [
          'Check the file type. Upload JPEG, PNG, GIF or PDF files. iPhone photos saved as HEIC may fail; set the camera to the most compatible format or convert the image first.',
          'Upload one document per image. A photo with two receipts, or a receipt and a check together, may be rejected.',
          'Check app permissions. After an update the app can lose access to the camera or photo library; turn both back on in phone settings.',
          'Refresh or reinstall the app as above. Your data is stored in QuickBooks, not on the phone.',
          'Try the browser. Go to Receipts (under Accounting or Transactions, depending on your layout) and upload the file from your computer, or try a private browser window.',
        ],
      },
      {
        heading: 'Fix a desktop check scanner',
        paragraphs: [
          "Desktop scanners for depositing checks are almost always tied to your bank's remote deposit service, so the bank's support team owns the fix. Before you call, check these.",
        ],
        bullets: [
          "Reinstall or update the scanner driver from the bank's or the manufacturer's site.",
          'Try a different USB port and cable, and avoid unpowered hubs.',
          'Check that the browser or deposit software is a version your bank supports.',
          'Clean the scanner rollers and image sensors as the manufacturer describes; dirty sensors cause unreadable MICR lines.',
          'If the deposit reaches the bank, record it in QuickBooks Online as a bank deposit, or match it when it comes through the bank feed.',
        ],
      },
      {
        heading: 'What QuickBooks Online does not do with check images',
        paragraphs: [
          'QuickBooks Online does not read a stack of cleared check images and match them to the checks in your register. Receipt capture reads receipts and bills one document at a time, and it creates new transactions for review rather than matching existing checks. If you were hoping the scanner would clear your checks during reconciliation, that is not what these features are for.',
          'To reconcile checks by hand, match each cleared check in Bank transactions, then tick it in the reconcile window and finish when the difference is 0.00.',
          'Check images are still worth keeping. Your bank usually provides images of cleared checks in online banking or with the statement. Attaching an image to the check transaction in QuickBooks, through Attachments on the form, keeps the evidence with the entry for audits and vendor disputes.',
        ],
      },
      {
        heading: 'Before you contact support',
        bullets: [
          'Write down the exact error message, or take a screenshot of it.',
          'Note the step where it fails: taking the photo, entering the amount, submitting, or after submitting.',
          'Note your device, operating system version and QuickBooks app version, or your browser and its version.',
          'List what you already tried, so support does not repeat it.',
          'For deposits, have the check amount, the date you tried, and whether the same check was already deposited elsewhere. Banks generally reject an item that has already been deposited.',
          'For desktop scanners, have the scanner model and the name of the bank service it uses.',
        ],
      },
      {
        heading: 'If the scanner was only a means to an end',
        bullets: [
          'Need to record checks you received? Use mobile deposit, your bank, or a bank deposit entry in QuickBooks.',
          'Need to record checks you wrote by hand? Use the Check form with the check number.',
          'Need to clear checks against a statement? Use Bank transactions and Reconcile, or a reconciliation tool built for checks.',
        ],
      },
      {
        heading: 'Clearing hundreds of checks at once',
        paragraphs: [
          'If what you actually need is to reconcile many checks against QuickBooks Online, Kyriq is built for that job. Upload the bank statement PDF, or check images in PDF, JPG or PNG, and Kyriq extracts each check, including typed and handwritten ones, with a confidence score.',
          'It compares each check with your QuickBooks Online register, groups exact matches for bulk approval, and flags duplicates and discrepancies in Needs Attention. Nothing is cleared until an authorized user approves; then Kyriq clears the approved matches in the reconciliation, with an audit trail. Kyriq does not deposit checks; it reconciles them. The trial covers 14 days or 250 checks, no card needed.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does QuickBooks Online have a check scanner?',
        a: 'Not as a single feature. The QuickBooks mobile app offers mobile check deposit for QuickBooks Checking accounts, and receipt capture reads receipts and bills. Desktop check scanners usually come from your bank.',
      },
      {
        q: 'Why is QuickBooks mobile deposit not showing?',
        a: 'Mobile check deposit is part of QuickBooks Checking and has eligibility criteria. If the option is missing, your account may not be eligible yet. Contact QuickBooks support to confirm.',
      },
      {
        q: 'Why will my receipt photo not upload to QuickBooks?',
        a: 'Common causes are an unsupported file type such as HEIC, several documents in one image, missing camera or photo permissions, or stale app data. Try converting the file, refreshing the app or uploading from a browser.',
      },
      {
        q: 'Can QuickBooks read check images and reconcile them?',
        a: 'Not natively. QuickBooks Online does not match scanned check images to checks in your register. You match bank feed items and tick checks in the reconcile window yourself, or use a third-party tool.',
      },
      {
        q: 'Who supports my desktop check scanner?',
        a: 'Usually your bank, since the scanner sends deposits through its remote deposit service. The manufacturer handles drivers and hardware faults.',
      },
    ],
    related: [
      '/compare/quickbooks-check-scanner-alternative',
      '/features/handwritten-check-ocr',
      '/tools/micr-line-decoder',
      '/guides/import-checks-into-quickbooks-online',
      '/features/bulk-check-processing',
    ],
    updated: UPDATED,
  },

  // 7 -------------------------------------------------------------------------
  {
    section: 'guides',
    slug: 'import-checks-into-quickbooks-online',
    title: 'How to Import Checks into QuickBooks Online',
    description:
      'How to import checks into QuickBooks Online: bank feeds, CSV and QBO file uploads, statement uploads, manual entry and third-party import apps compared.',
    keyword: 'import checks into quickbooks online',
    eyebrow: 'QuickBooks Online guide',
    h1: 'How to import checks into QuickBooks Online',
    intro:
      'You can get checks into QuickBooks Online through a connected bank feed, by uploading a transaction file (CSV, QBO, QFX or OFX) or a statement, by entering them on the Check form, or with a third-party import app. The bank options bring in cleared checks for review; only manual entry and import apps create Check transactions with your own payees and dates.',
    body: [
      {
        heading: 'First decide what you are importing',
        paragraphs: [
          'Checks you wrote and checks that cleared are different data. A check you wrote has a payee, a date written, a number and an expense account. A cleared check from the bank has an amount, a clearing date, a number and often little else. Bank imports bring in the second kind. If you need the first kind in QuickBooks, for example to see outstanding checks, enter or import them as Check transactions before the bank data arrives, then match.',
          'The order matters. If bank data arrives first and is added, then checks are entered later from the checkbook, every check exists twice. If checks are entered first and the bank data is matched to them, each check exists once, with the payee and date written from your records and the cleared status from the bank.',
        ],
      },
      {
        heading: 'Option 1: connect the bank feed',
        steps: [
          'Go to Bank transactions (under Accounting in the current layout, reached through All apps).',
          'Select Link account and follow the prompts to connect your bank.',
          'Choose the account and how far back to download.',
          'Review downloaded items on the For review tab (Pending in the newer layout). Match each check you already recorded; add only the ones you did not.',
        ],
        paragraphs: [
          'QuickBooks tries to update connected accounts automatically about every 24 hours and does not download pending transactions. How far back the first download goes depends on your bank, so older checks may need a file upload instead.',
        ],
      },
      {
        heading: 'Option 2: upload a transaction file',
        steps: [
          'Download transactions from your bank in QBO (Web Connect), QFX, OFX or CSV format. QBO and QFX files usually carry more detail, such as check numbers.',
          'In Bank transactions, open the Link account menu and select Upload from file. If the account is not connected, the option may read Upload transactions manually.',
          'Select the file and choose the QuickBooks bank account it belongs to.',
          'For a CSV, map the columns. Intuit accepts three columns (Date, Description, Amount) or four (Date, Description, Credit, Debit), with one date format throughout.',
          'Select the transactions to import and finish. They land in Bank transactions for review, the same as feed items.',
        ],
        bullets: [
          'Files must be in English and 350 KB or less, with up to 1,000 lines per upload. Split large files by date range.',
          'Start the file at least a day before your oldest QuickBooks transaction in that account, and do not overlap a previous upload, or you will get duplicates.',
        ],
      },
      {
        heading: 'Option 3: upload a statement',
        paragraphs: [
          "Intuit's US help now describes uploading an account statement as a PDF or image instead of a transaction list. QuickBooks reads the transactions, shows them side by side with the statement for review, and adds them to Bank transactions. Some statements need a review by Intuit before they are ready. This option may not be available in every region or account, so check your Upload from file screen.",
          'Like a file upload, a statement upload creates bank transactions for review. It does not create Check transactions with your payees, and it does not mark anything as reconciled. Review the extracted lines against the statement before you save, particularly check numbers and amounts, then match the checks you already recorded.',
        ],
      },
      {
        heading: 'Option 4: enter checks on the Check form',
        paragraphs: [
          'For a few checks, select + New, then Check, and enter the payee, bank account, date, check number and expense account. Leave Print later off for checks already written. This is the only native route that records the payee, number and account exactly as written, and it is slow at volume.',
          'To speed it up, add payees before you start, so you are not stopping to create vendors mid-entry, and enter checks in number order straight from the checkbook stubs. If you pay the same vendor the same amount every month, a recurring transaction template saves retyping, but still check the number on each one.',
        ],
      },
      {
        heading: 'Option 5: third-party import apps',
        paragraphs: [
          'Apps listed in the QuickBooks App Store, such as SaasAnt Transactions and Transaction Pro, import spreadsheets as specific transaction types, including checks, and some can update or delete in bulk. They are useful when you have check registers from another system. Before you buy, check:',
        ],
        bullets: [
          'Whether it creates Check transactions or Expenses, and whether it keeps the check number.',
          'How it handles payees that do not exist yet.',
          'Whether it can undo an import if a mapping was wrong.',
          'What access it asks for, and that it uses the official QuickBooks connection.',
        ],
      },
      {
        heading: 'Avoid duplicates after any import',
        bullets: [
          'If you import Check transactions and also have a bank feed, match the feed items to the imported checks. Do not add them.',
          'Never upload the same date range from a file and a live feed.',
          'After importing, open the register and search a few check numbers to confirm each appears once.',
          'Run a quick total: the sum of imported checks for a month should equal the checks total on your records for that month.',
          'Reconcile the account against the bank statement once the import is matched. A 0.00 difference is the proof the import was clean.',
        ],
      },
      {
        heading: 'Clearing hundreds of checks at once',
        paragraphs: [
          'Importing gets the checks in; clearing them is the second half. Kyriq starts from the bank statement PDF you upload, or check images in PDF, JPG or PNG, and extracts each check, including handwritten ones, with a confidence score. It does not create new checks in QuickBooks; it compares the extracted checks with the ones already in your QuickBooks Online register.',
          'Exact matches are grouped for bulk approval, and duplicates and discrepancies, including checks missing from the register, go to Needs Attention. After an authorized user approves, Kyriq clears the approved matches in the reconciliation, with an audit trail. The trial covers 14 days or 250 checks, no card needed.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I import checks from Excel into QuickBooks Online?',
        a: 'Through Upload from file you can import a CSV of bank transactions for review. To create Check transactions with payees and accounts from a spreadsheet, you need manual entry or a third-party import app.',
      },
      {
        q: 'What file formats does QuickBooks Online accept for bank uploads?',
        a: 'Transaction files in CSV, QBO, QFX or OFX format, up to 350 KB and 1,000 lines each. US accounts can also upload a statement as a PDF or image.',
      },
      {
        q: 'Do imported bank transactions show check numbers?',
        a: 'It depends on what your bank includes. QBO and QFX files usually carry more detail than CSV, including check numbers.',
      },
      {
        q: 'Why did importing create duplicate checks?',
        a: 'The checks were already in QuickBooks and the imported bank items were added instead of matched, or the same dates were uploaded twice. Undo the added items and match them.',
      },
      {
        q: 'Can I import cleared checks as reconciled?',
        a: 'No. Imported items arrive for review. Match or add them, then reconcile against your statement to mark them reconciled.',
      },
    ],
    related: [
      '/guides/match-checks-to-bank-feed-quickbooks-online',
      '/guides/record-handwritten-checks-quickbooks',
      '/features/bulk-check-processing',
      '/features/check-reconciliation-quickbooks-online',
      '/pricing',
    ],
    updated: UPDATED,
  },

  // 8 -------------------------------------------------------------------------
  {
    section: 'guides',
    slug: 'outstanding-cheques-quickbooks-online-canada',
    title: 'Outstanding Cheques in QuickBooks Online (Canada)',
    description:
      'How Canadian businesses handle outstanding cheques: QuickBooks Online steps to find and clear them, plus stale-dated cheques, GST/HST and unclaimed property.',
    keyword: 'outstanding cheques quickbooks online',
    eyebrow: 'QuickBooks Online Canada guide',
    h1: 'Outstanding cheques in QuickBooks Online: a guide for Canadian businesses',
    intro:
      "An outstanding cheque is one you recorded in QuickBooks Online that has not yet cleared your bank. Clear it by ticking it in the reconciliation for the statement it appears on. If it is more than six months old it is probably stale-dated, and you then decide with your accountant whether to keep, void or reverse it.",
    locale: 'en-CA',
    body: [
      {
        heading: 'How to find outstanding cheques',
        steps: [
          'Open Reconcile. In the current layout it is under Accounting, reached through All apps if it is not pinned. Older layouts put it under Transactions or the Settings gear.',
          'Select History by account and choose your chequing account.',
          'Open the report for your most recent reconciliation.',
          'Read the uncleared section. It lists every cheque and payment that was outstanding as of that statement date.',
        ],
        paragraphs: [
          'For a live view, open Chart of accounts, select View register on the chequing account, and look for cheques with a blank reconcile status. C means cleared but not yet reconciled; R means reconciled.',
        ],
      },
      {
        heading: 'Clear cheques that have now cleared the bank',
        steps: [
          'Open Reconcile, choose the chequing account and enter the ending balance and ending date from your bank statement.',
          'Select Start reconciling.',
          'Tick each cheque that appears on the statement. Cheques you already matched in Bank transactions are ticked for you.',
          'When the difference is 0.00, select Finish now.',
        ],
        paragraphs: [
          'If you cannot see a cheque you know has cleared, check that it was recorded against the right account and is not dated after the statement ending date.',
        ],
      },
      {
        heading: 'Record cheques so they can be cleared later',
        bullets: [
          'Use the Cheque form (+ New, then Cheque) for cheques you write, and type the number from the cheque in Cheque no. so it can be compared with the statement.',
          'Leave Print later unticked for handwritten cheques. When it is ticked, the number field reads To print and no number is stored until the cheque is printed.',
          'Pay supplier bills with Pay bills rather than a separate cheque, so the bill closes and the expense is not recorded twice.',
          'If you hold a US-dollar chequing account, record US-dollar cheques in that account and reconcile it against its own statement, in US dollars. A cheque recorded in the Canadian-dollar account by mistake will sit outstanding in one account and be missing from the other.',
          'Enter each cheque the day you write it. A cheque that is not in QuickBooks cannot show as outstanding, so your book balance looks higher than the cash you actually have.',
        ],
      },
      {
        heading: 'Avoid outstanding cheques that are really duplicates',
        paragraphs: [
          "A common source of phantom outstanding cheques is the bank feed. When a cleared cheque downloads into Bank transactions and someone selects Add instead of Match, QuickBooks records it a second time. The added copy is cleared, and your original cheque sits outstanding forever. In the Categorized tab (Posted in the newer layout), undo the added copy and match it to the original cheque.",
        ],
      },
      {
        heading: 'Stale-dated cheques in Canada',
        paragraphs: [
          'Canadian banks generally treat a cheque as stale-dated once it is more than six months past the date written on it, and they may refuse to cash it. That does not cancel the debt. If you still owe the payee, contact them, stop payment on the old cheque if needed, and issue a new one.',
          'Before you treat a cheque as dead, confirm it has not cleared. Search online banking by cheque number and amount, and look at the cheque images your bank provides. A cheque that cleared at a slightly different amount, or was posted from the bank feed as a new transaction, can look outstanding in QuickBooks when the money has already left the account. Keep a note of each step you take and each attempt to reach the payee.',
          'If the money is no longer owed, or you cannot reach the payee, you have three options.',
        ],
        table: {
          head: ['Option', 'When it fits', 'Effect'],
          rows: [
            ['Keep it outstanding', 'You still expect to pay the amount', 'No change; it stays on reconciliation reports'],
            ['Void the cheque', 'The period it was written in is still open', 'Sets it to zero on its original date'],
            ['Reverse with a journal entry', 'The period is closed or your return is filed', 'Records the reversal in the current period'],
          ],
        },
      },
      {
        heading: 'Voiding or reversing a cheque in QuickBooks Online',
        steps: [
          'To void: open the cheque, select More at the bottom of the form, then Void, and confirm. If it paid a bill, the bill reopens.',
          'To reverse: create a journal entry dated in the current period that debits the chequing account and credits the account your accountant chooses, with the original cheque number in the memo.',
          'In your next reconciliation, tick the old cheque and the journal entry together. They offset, so the difference does not change.',
        ],
        paragraphs: [
          'An outstanding cheque was never reconciled, so voiding it does not break a past reconciliation. It does change the balances of the period it was dated in.',
        ],
      },
      {
        heading: 'GST/HST and unclaimed property',
        paragraphs: [
          'If the original cheque included GST/HST that you claimed as an input tax credit, voiding it in a period you have already filed changes the tax figures for that period. Ask your accountant how to treat it before you void or reverse.',
          'Uncashed cheques owed to someone else may also count as unclaimed property. Rules and programs differ by province: Quebec, British Columbia and Alberta, for example, run their own unclaimed property programs, while other provinces have different or no rules. This guide is not legal advice. Your accountant can tell you which rules apply and what records to keep.',
        ],
      },
      {
        heading: 'Clearing hundreds of cheques at once',
        paragraphs: [
          'Ticking cheques one by one is manageable for a few dozen. For a statement with hundreds, Kyriq reads the bank statement PDF you upload, or cheque images in PDF, JPG or PNG, and extracts each cheque, including handwritten ones, with a confidence score. It compares them with your QuickBooks Online register and groups exact matches for bulk approval.',
          'Duplicates and discrepancies go to Needs Attention, which is where the added-instead-of-matched cheques above usually turn up. Nothing is cleared until an authorized user approves; then Kyriq clears the approved matches in the QuickBooks Online reconciliation, with an audit trail. Kyriq works with QuickBooks Online only, and the trial covers 14 days or 250 cheques with no credit card.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How long is a cheque valid in Canada?',
        a: 'Banks generally treat a cheque as stale-dated after six months and may refuse it. The amount can still be owed, so check with the payee before removing it from your books.',
      },
      {
        q: 'Where do I see outstanding cheques in QuickBooks Online?',
        a: 'Open Reconcile, select History by account and view the latest report for your chequing account. The uncleared section lists cheques outstanding at that date.',
      },
      {
        q: 'Should I void a stale-dated cheque in QuickBooks Online?',
        a: 'Only if the period it was written in is still open and the money is not owed. If the period is closed or GST/HST was claimed, a current-period journal entry is usually cleaner. Confirm with your accountant.',
      },
      {
        q: 'Why do I have outstanding cheques that already cleared?',
        a: 'Usually because the bank feed copy was added instead of matched, creating a duplicate. Undo the added copy and match it to the original cheque.',
      },
      {
        q: 'Can I undo a reconciliation in QuickBooks Online?',
        a: "Intuit's help says the Primary Admin and accountant users can undo a reconciliation from History by account. It also undoes every later reconciliation, so download reports first.",
      },
    ],
    related: [
      '/ca/cheque-reconciliation-quickbooks',
      '/guides/clear-outstanding-checks-quickbooks-online',
      '/tools/outstanding-checks-template',
      '/features/handwritten-check-ocr',
      '/pricing',
    ],
    updated: UPDATED,
  },
];
