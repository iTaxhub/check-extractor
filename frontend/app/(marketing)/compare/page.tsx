import { SectionIndex } from '@/components/marketing/MarketingArticle';
import { pageMetadata } from '@/components/marketing/sectionRoute';

export const metadata = pageMetadata({
  title: 'Compare Kyriq: Check OCR and QuickBooks Tools',
  description: 'Honest comparisons of Kyriq with DocuClipper, SaasAnt, Dext, Hubdoc and the QuickBooks check scanner for reconciling checks in QuickBooks Online.',
  path: '/compare',
});

export default function CompareIndex() {
  return (
    <SectionIndex
      eyebrow="Compare"
      title="How Kyriq compares"
      intro="Most tools stop at extracting or importing check data. Kyriq matches every check to QuickBooks Online and clears the ones you approve. Here is where each tool fits."
      sections={['compare']}
    />
  );
}
