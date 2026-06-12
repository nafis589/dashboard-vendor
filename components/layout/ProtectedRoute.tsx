'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function PendingPage({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-[#F5F5F5]">
        <Clock className="size-8 text-[#1A1A1A]" strokeWidth={1.5} />
      </div>
      <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A]">
        Compte en cours de validation
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[#666]">
        L&apos;équipe de la plateforme examine votre dossier.
        <br />
        Vous recevrez une notification dès la validation de votre compte.
      </p>
      <button
        type="button"
        onClick={onLogout}
        className="mt-8 bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#333]"
      >
        Se déconnecter
      </button>
    </div>
  );
}

function SuspendedPage({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="size-8 text-red-600" strokeWidth={1.5} />
      </div>
      <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A]">
        Compte suspendu
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[#666]">
        Votre compte a été suspendu. Contactez le support.
      </p>
      <button
        type="button"
        onClick={onLogout}
        className="mt-8 border border-[#D5D5D5] px-6 py-3 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F5F5F5]"
      >
        Se déconnecter
      </button>
    </div>
  );
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { vendor, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace('/login');
    }
  }, [isLoading, vendor, router]);

  if (isLoading) {
    return <Spinner fullPage />;
  }

  if (!vendor) {
    return <Spinner fullPage />;
  }

  if (vendor.status === 'PENDING') {
    return <PendingPage onLogout={logout} />;
  }

  if (vendor.status === 'SUSPENDED') {
    return <SuspendedPage onLogout={logout} />;
  }

  if (vendor.status === 'ACTIVE') {
    return <>{children}</>;
  }

  return <Spinner fullPage />;
}
