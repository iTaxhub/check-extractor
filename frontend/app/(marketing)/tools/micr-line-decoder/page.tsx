import Link from 'next/link';
import { JsonLd } from '@/components/marketing/JsonLd';
import { MicrDecoder } from '@/components/marketing/MicrDecoder';
import { pageMetadata } from '@/components/marketing/sectionRoute';
import { PROSE } from '@/components/landing/LegalShell';
import { breadcrumbs, faqPage } from '@/lib/marketing/schema';

export const metadata = pageMetadata({
  title: 'Free MICR Line Decoder: Routing, Account and Check Number',
  description:
    'Free MICR line decoder for US checks and Canadian cheques. Paste the numbers along the bottom of a check to split out routing, account and check number.',
  path: '/tools/micr-line-decoder',
});

const FAQS = [
  {
    q: 'What is a MICR line?',
    a: 'The line of magnetic-ink characters printed along the bottom of a check. It holds the routing number, the account number and usually the check number, separated by special E-13B symbols.',
  },
  {
    q: 'What do the MICR symbols mean?',
    a: 'The transit symbol (⑆) surrounds the routing number, the on-us symbol (⑈) ends the account number field, the amount symbol (⑇) surrounds an amount encoded by the bank, and the dash symbol (⑉) separates parts of a number, such as the Canadian transit and institution numbers.',
  },
  {
    q: 'How is a routing number validated?',
    a: 'US routing numbers carry a check digit. Multiply the digits by 3, 7, 1, 3, 7, 1, 3, 7, 1 and add them up; a valid routing number gives a total divisible by 10.',
  },
  {
    q: 'Is my check data sent anywhere?',
    a: 'No. The decoder runs entirely in your browser. Nothing you type is uploaded or stored.',
  },
];

export default function MicrLineDecoderPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
      <JsonLd
        data={[
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'MICR line decoder', path: '/tools/micr-line-decoder' },
          ]),
          faqPage(FAQS),
        ]}
      />
      <span className="text-eyebrow text-brand mb-3 block">Free tool</span>
      <h1 className="text-3xl sm:text-[2.6rem] font-extrabold text-ink-strong tracking-[-0.025em] leading-[1.1] mb-4">
        MICR line decoder for checks and cheques
      </h1>
      <p className="text-[17px] text-ink-soft leading-relaxed mb-8">
        Paste or type the numbers printed along the bottom of a check. The decoder splits out the routing number, account
        number and check number, and validates US routing numbers with the ABA checksum.
      </p>

      <MicrDecoder />

      <div className={`${PROSE} mt-10`}>
        <h2>How to read the bottom of a check</h2>
        <p>
          A US check usually reads, left to right: an optional check number between on-us symbols (business checks), the
          9-digit routing number between transit symbols, then the account number followed by an on-us symbol and, on
          personal checks, the check number. Canadian cheques use the same layout, but the routing field is a 5-digit
          branch transit number and a 3-digit institution number separated by a dash symbol.
        </p>
        <h2>Frequently asked questions</h2>
        {FAQS.map((f) => (
          <section key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </section>
        ))}
        <h2>Reading hundreds of checks instead of one?</h2>
        <p>
          Kyriq reads every check on your bank statement, typed or handwritten, matches each one to QuickBooks Online and
          clears the ones you approve. See <Link href="/features/handwritten-check-ocr">handwritten check OCR</Link> or{' '}
          <Link href="/signup">start a free trial</Link>.
        </p>
      </div>
    </main>
  );
}
