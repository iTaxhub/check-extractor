'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full disabled:opacity-50"
    >
      <LogOut className="w-[16px] h-[16px]" />
      <span>{loading ? 'Logging out...' : 'Logout'}</span>
    </button>
  );
}
