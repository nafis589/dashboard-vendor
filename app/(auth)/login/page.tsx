'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { REGISTER_SUCCESS_KEY } from '@/lib/register-constants';

const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';

export default function LoginPage() {
  const { login, vendor, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && vendor) {
      router.replace('/dashboard');
    }
  }, [authLoading, vendor, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const msg = sessionStorage.getItem(REGISTER_SUCCESS_KEY);
    if (msg) {
      setSuccessMessage(msg);
      sessionStorage.removeItem(REGISTER_SUCCESS_KEY);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  const inputClass =
    'w-full border border-[#D5D5D5] rounded-sm px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-colors focus:border-black';
  const labelClass = 'block text-sm text-[#333] mb-1.5';

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#1A1A1A]">
          Marketplace
        </h1>
        <p className="mx-auto max-w-[300px] text-sm text-[#777]">
          Connectez-vous à votre espace vendeur
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className={labelClass}>
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
            required
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className={labelClass}>
            Mot de passe
          </label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-10`}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-[42px] text-[#999] transition-colors hover:text-[#1A1A1A]"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !email.trim() || !password}
          className={`flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            isSubmitting || !email.trim() || !password
              ? 'cursor-not-allowed bg-[#CCCCCC] text-white'
              : 'bg-black text-white hover:bg-[#333]'
          }`}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Se connecter
        </button>

        {successMessage && (
          <div className="flex items-start gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <hr className="border-[#E8E8E8]" />

        <div className="space-y-3 text-center text-sm">
          <p>
            <Link
              href="/register"
              className="text-[#1A1A1A] underline underline-offset-2 transition-opacity hover:opacity-70"
            >
              Créer un compte vendeur
            </Link>
          </p>
          <p>
            <a
              href={STOREFRONT_URL}
              className="text-[#777] underline underline-offset-2 transition-colors hover:text-[#1A1A1A]"
            >
              Retour à la boutique
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
