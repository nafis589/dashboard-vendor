import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  fullPage?: boolean;
  className?: string;
}

export default function Spinner({ fullPage = false, className = '' }: SpinnerProps) {
  const spinner = (
    <Loader2
      className={['animate-spin text-[#1A1A1A]', fullPage ? 'size-8' : 'size-5', className]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    />
  );

  if (fullPage) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-white">
        {spinner}
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  return spinner;
}
