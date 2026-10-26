import { SectionIndex } from '@/components/marketing/MarketingArticle';
import { pageMetadata } from '@/components/marketing/sectionRoute';

export const metadata = pageMetadata({
  title: 'Check Reconciliation Features for QuickBooks Online',
  description: 'How Kyriq extracts checks from bank statements, reads handwritten checks, matches them to QuickBooks Online and clears approved checks in bulk.',
  path: '/features',
});

export default function FeaturesIndex() {
  return (
    <SectionIndex
      eyebrow="Features"
      title="Check reconciliation features for QuickBooks Online"
      intro="Everything Kyriq does between your bank statement and a finished QuickBooks Online reconciliation, and the firms it is built for."
      sections={['features', 'for', 'ca', 'uk']}
    />
  );
}
