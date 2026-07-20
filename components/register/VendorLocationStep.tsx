'use client';

import { AlertCircle, ArrowRight, Loader2, LocateFixed, MapPin } from 'lucide-react';

import BackCircleButton from '@/components/register/BackCircleButton';
import type { LocationValidationResult } from '@/components/register/RegisterLocationMap';

interface VendorLocationStepProps {
  location: LocationValidationResult | null;
  isValidatingLocation: boolean;
  isGeolocating: boolean;
  onGeolocate: () => void;
  onNext: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}

export default function VendorLocationStep({
  location,
  isValidatingLocation,
  isGeolocating,
  onGeolocate,
  onNext,
  onBack,
  nextDisabled,
  nextLabel = 'Suivant',
}: VendorLocationStepProps) {
  const canContinue =
    nextDisabled !== undefined
      ? !nextDisabled
      : !!location?.isInTogo && !!location.region && !isValidatingLocation;

  return (
    <div className="space-y-4">
      {isValidatingLocation ? (
        <div className="flex items-center gap-2 text-sm text-[#666]">
          <Loader2 size={16} className="animate-spin text-[#1A1A1A]" />
          Vérification de la localisation…
        </div>
      ) : location?.validationError ? (
        <div className="flex items-start gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            Impossible de vérifier la position. Vérifiez que le backend tourne, puis réessayez.
          </span>
        </div>
      ) : location && !location.isInTogo ? (
        <div className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>Vous devez être situé au Togo pour vendre sur cette plateforme.</span>
        </div>
      ) : location?.isInTogo && location.region ? (
        <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
          ✓ Région {location.region.name} détectée, {location.region.capital}
        </div>
      ) : (
        <div className="flex items-start gap-2 text-sm text-[#666]">
          <MapPin size={16} className="mt-0.5 shrink-0 text-[#1A1A1A]" />
          <span>Ou cliquez sur la carte pour repositionner</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onGeolocate}
          disabled={isGeolocating}
          className="flex items-center gap-1.5 rounded-sm border border-[#D5D5D5] px-3 py-2.5 text-xs font-medium text-[#1A1A1A] transition-colors hover:bg-[#F5F5F5] disabled:cursor-wait disabled:opacity-70"
        >
          {isGeolocating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <LocateFixed size={14} strokeWidth={2} />
          )}
          Ma position actuelle
        </button>

        <div className="flex-1" />

        {onBack && <BackCircleButton onClick={onBack} />}
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="flex items-center gap-2 bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#CCC]"
        >
          {nextLabel}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
