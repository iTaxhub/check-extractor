import Link from 'next/link';
import Image from 'next/image';
import { Upload, Settings, List, BarChart3, Download, Receipt, GitCompare, LayoutDashboard, Scale, ArrowLeftRight } from 'lucide-react';
import UserProfile from '@/components/UserProfile';
import QBProviderWrapper from '@/components/QBProviderWrapper';
import SidebarCompanySwitcher from '@/components/SidebarCompanySwitcher';
import SuperAdminLink from '@/components/SuperAdminLink';
import AccountSwitcher from '@/components/AccountSwitcher';

const NAV_ITEMS = [
  { href: '/firm-dashboard', icon: LayoutDashboard, label: 'Firm Dashboard' },
  { href: '/upload', icon: Upload, label: 'Upload' },
  { href: '/dashboard', icon: List, label: 'Documents' },
  // { href: '/reconciliation', icon: Scale, label: 'Reconciliation' }, 
  { href: '/qb-comparisons', icon: GitCompare, label: 'QB Comparisons' },
  { href: '/qb-match', icon: ArrowLeftRight, label: 'QB Match' },
  { href: '/export', icon: Download, label: 'Export' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/billing', icon: Receipt, label: 'Billing' },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Route protection is handled by proxy.ts
  return (
    <QBProviderWrapper>
      <div className="min-h-screen bg-[#f4f6fb] flex">
        {/* Sidebar - Fixed - Kyriq Dark Purple */}
        <aside className="w-[220px] bg-[#1e2235] hidden md:flex flex-col fixed left-0 top-0 h-screen">
          <div className="px-5 py-5 border-b border-white/[0.06] flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-[15px] text-white">
              <Image src="/Kyriq_Logo_Files/kyriq-icon.svg" alt="Kyriq" width={28} height={28} className="rounded-md" />
              <span className="font-extrabold tracking-tight">kyriq</span>
            </Link>
          </div>

          <SidebarCompanySwitcher />
          <AccountSwitcher />

          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="sidebar-item flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] font-medium text-white/55 hover:text-white/80 hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                <item.icon className="w-[16px] h-[16px]" />
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="my-2 border-t border-white/[0.06]" />

            <Link
              href="/settings"
              className="sidebar-item flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] font-medium text-white/55 hover:text-white/80 hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              <Settings className="w-[16px] h-[16px]" />
              <span>Settings</span>
            </Link>

            <SuperAdminLink />
          </nav>

          <div className="border-t border-white/[0.06] flex-shrink-0">
            <div className="px-2 py-3">
              <UserProfile />
            </div>
            <div className="px-5 py-2 text-[11px] text-white/35 text-center">
              Kyriq v1.0.0
            </div>
          </div>
        </aside>

        {/* Main Content - Add left margin to account for fixed sidebar */}
        <main className="flex-1 overflow-auto md:ml-[220px]">
          {/* Mobile Header */}
          <div className="md:hidden px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex justify-between items-center">
            <Link href="/dashboard" className="font-semibold text-[15px] text-gray-900 flex items-center gap-2">
              <Image src="/Kyriq_Logo_Files/kyriq-icon.svg" alt="Kyriq" width={24} height={24} className="rounded-md" />
              Kyriq
            </Link>
            <Link href="/upload" className="p-1.5 bg-blue-50 rounded-lg">
              <Upload className="w-4 h-4 text-blue-600" />
            </Link>
          </div>

          {children}
        </main>
      </div>
    </QBProviderWrapper>
  );
}
