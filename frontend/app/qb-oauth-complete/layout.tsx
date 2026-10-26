import type { Metadata } from 'next';

// Signed-out utility page: reachable without a session, never worth indexing.
export const metadata: Metadata = { title: 'Account', robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
