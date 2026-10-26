import { SectionIndex } from '@/components/marketing/MarketingArticle';
import { pageMetadata } from '@/components/marketing/sectionRoute';

export const metadata = pageMetadata({
  title: 'QuickBooks Online Check Reconciliation Guides',
  description: 'Step-by-step QuickBooks Online guides: clear outstanding checks, fix checks not showing as cleared, match checks to the bank feed and record handwritten checks.',
  path: '/guides',
});

export default function GuidesIndex() {
  return (
    <SectionIndex
      eyebrow="Guides"
      title="QuickBooks Online check reconciliation guides"
      intro="Practical, current instructions for the check problems bookkeepers hit most in QuickBooks Online, written to be useful whether or not you use Kyriq."
      sections={['guides']}
    />
  );
}
