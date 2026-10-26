import type { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';
import { JsonLd } from '@/components/marketing/JsonLd';
import { FAQS } from '@/lib/marketing/faqs';
import { faqPage, organization, softwareApplication, website } from '@/lib/marketing/schema';

// Only the canonical: an `openGraph` key here would replace the root one
// wholesale (metadata merges shallowly) and drop the share image.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <>
      <JsonLd data={[organization(), website(), softwareApplication(), faqPage(FAQS)]} />
      <LandingPage />
    </>
  );
}
