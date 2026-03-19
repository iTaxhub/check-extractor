import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Minimal nav */}
      <div className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <Image src="/Kyriq_Logo_Files/kyriq-icon.svg" alt="Kyriq" width={32} height={32} className="rounded-lg shadow-sm" />
          <span className="text-base font-extrabold text-gray-900">Kyriq</span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}