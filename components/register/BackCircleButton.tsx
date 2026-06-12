'use client';

import { ArrowLeft } from 'lucide-react';

interface BackCircleButtonProps {
  onClick: () => void;
  label?: string;
}

/** Bouton retour circulaire bordé — style onboarding (flèche fine). */
export default function BackCircleButton({
  onClick,
  label = 'Retour',
}: BackCircleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#E0E0E0] bg-white text-[#1A1A1A] transition-colors hover:bg-[#F5F5F5] active:scale-[0.98]"
    >
      <ArrowLeft size={20} strokeWidth={1.5} />
    </button>
  );
}
