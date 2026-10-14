import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/providers/ToastProvider'
import { AmbientBackground } from '@/components/ui/ambient-background'

// One face, loaded once, at the root. A font imported inside a single screen
// is why that screen reads as designed and the rest does not.
// `-apple-system` leads the stack (see --font-sans in globals.css); Inter is
// the fallback that carries non-Apple platforms, so it is exposed as a
// variable rather than applied as a class.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://kyriq.com'),
  title: 'Kyriq — Check Reconciliation for QuickBooks Online',
  description: 'See every processed check, approve exact matches together, and review discrepancies before anything is cleared in QuickBooks Online.',
  icons: {
    icon: '/brand/kyriq-app-icon.svg',
    apple: '/brand/kyriq-app-icon.svg',
  },
  openGraph: {
    title: 'Kyriq — Check Reconciliation for QuickBooks Online',
    description: 'Reconcile checks with confidence while your team stays in control of every approval.',
    images: ['/landing/match-review-dashboard-4k-v1.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* Glass needs something behind it to refract. Mounted once, here. */}
        <AmbientBackground />
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
