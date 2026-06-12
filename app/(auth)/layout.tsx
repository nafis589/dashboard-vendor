'use client';

import { usePathname } from 'next/navigation';
import AuthBrandingPanel from '@/components/auth/AuthBrandingPanel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // La page register gère son propre layout
  if (pathname?.startsWith('/register')) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <AuthBrandingPanel className="relative order-2 hidden lg:flex" />

        <div className="relative order-1 flex h-full items-center justify-center">
          <div className="w-full max-w-md px-6 py-12">{children}</div>
        </div>
      </div>
    </main>
  );
}
