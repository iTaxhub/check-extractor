import { Nav, Footer } from '@/components/landing/LandingPage';

/** Public SEO pages share the landing page's nav and footer, so every page links to every other. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-ink-strong overflow-x-hidden">
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
