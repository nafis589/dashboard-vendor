'use client';

import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

import BackCircleButton from '@/components/register/BackCircleButton';
import { TOGO_REGIONS } from '@/lib/togo-regions';
import type { VendorShippingRegionInput } from '@/lib/types';

const inputClass =
  'w-full rounded-sm border border-[#D5D5D5] px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-[#AAA] focus:border-black';
const labelClass = 'mb-1.5 block text-sm font-medium text-[#1A1A1A]';
const errorClass = 'mt-1 text-xs text-red-600';

export interface OtherRegionState {
  enabled: boolean;
  price: string;
}

interface ShippingConfigStepProps {
  homeRegionId: string;
  initialHomePricePerKm?: string;
  initialHomeMinFee?: string;
  initialOtherRegions?: Record<string, OtherRegionState>;
  onSubmit: (regions: VendorShippingRegionInput[]) => void | Promise<void>;
  onCancel?: () => void;
  onBack?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
}

export function buildRegionsPayload(
  homeRegionId: string,
  homePricePerKm: string,
  homeMinFee: string,
  otherRegions: Record<string, OtherRegionState>,
): VendorShippingRegionInput[] {
  const regions: VendorShippingRegionInput[] = [
    {
      region_id: homeRegionId,
      is_home_region: true,
      price_per_km: parseInt(homePricePerKm, 10),
      min_fee: parseInt(homeMinFee, 10),
    },
  ];

  for (const region of TOGO_REGIONS) {
    if (region.id === homeRegionId) continue;
    const state = otherRegions[region.id];
    if (state?.enabled) {
      regions.push({
        region_id: region.id,
        is_home_region: false,
        fixed_price: parseInt(state.price, 10),
      });
    }
  }

  return regions;
}

export function validateShippingConfig(
  homePricePerKm: string,
  homeMinFee: string,
  homeRegionId: string,
  otherRegions: Record<string, OtherRegionState>,
): Record<string, string> {
  const errs: Record<string, string> = {};
  const ppm = parseInt(homePricePerKm, 10);
  const minFee = parseInt(homeMinFee, 10);

  if (!homePricePerKm || Number.isNaN(ppm) || ppm < 50) {
    errs.homePricePerKm = 'Minimum 50 FCFA/km';
  }
  if (!homeMinFee || Number.isNaN(minFee) || minFee < 1) {
    errs.homeMinFee = 'Requis';
  }

  for (const region of TOGO_REGIONS) {
    if (region.id === homeRegionId) continue;
    const state = otherRegions[region.id];
    if (state?.enabled) {
      const price = parseInt(state.price, 10);
      if (!state.price || Number.isNaN(price) || price <= 0) {
        errs[`region_${region.id}`] = 'Prix fixe requis';
      }
    }
  }

  return errs;
}

export default function ShippingConfigStep({
  homeRegionId,
  initialHomePricePerKm = '',
  initialHomeMinFee = '500',
  initialOtherRegions,
  onSubmit,
  onCancel,
  onBack,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  loading = false,
  error = null,
}: ShippingConfigStepProps) {
  const [homePricePerKm, setHomePricePerKm] = useState(initialHomePricePerKm);
  const [homeMinFee, setHomeMinFee] = useState(initialHomeMinFee);
  const [otherRegions, setOtherRegions] = useState<Record<string, OtherRegionState>>(
    () =>
      initialOtherRegions ??
      Object.fromEntries(TOGO_REGIONS.map((r) => [r.id, { enabled: false, price: '' }])),
  );
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});

  const homeRegion = TOGO_REGIONS.find((r) => r.id === homeRegionId);
  const otherRegionList = TOGO_REGIONS.filter((r) => r.id !== homeRegionId);

  const handleSubmit = () => {
    const errs = validateShippingConfig(homePricePerKm, homeMinFee, homeRegionId, otherRegions);
    setShippingErrors(errs);
    if (Object.keys(errs).length > 0) return;
    void onSubmit(buildRegionsPayload(homeRegionId, homePricePerKm, homeMinFee, otherRegions));
  };

  if (!homeRegion) {
    return <p className="text-sm text-red-600">Région domicile introuvable.</p>;
  }

  return (
    <div className="scrollbar-hide max-h-full space-y-4 overflow-y-auto">
      <div className="space-y-4 rounded-lg border border-[#EBEBEB] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[#1A1A1A]">
            ✓ {homeRegion.name}, {homeRegion.capital}
          </span>
          <span className="rounded-full bg-black px-2.5 py-0.5 text-xs font-medium text-white">
            Votre région
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price_per_km" className={labelClass}>
              Tarif par km (FCFA/km)
            </label>
            <input
              id="price_per_km"
              type="number"
              min={50}
              value={homePricePerKm}
              onChange={(e) => setHomePricePerKm(e.target.value)}
              placeholder="Entrez le prix par km"
              className={inputClass}
            />
            {shippingErrors.homePricePerKm && (
              <p className={errorClass}>{shippingErrors.homePricePerKm}</p>
            )}
          </div>
          <div>
            <label htmlFor="min_fee" className={labelClass}>
              Frais minimum (FCFA)
            </label>
            <input
              id="min_fee"
              type="number"
              min={1}
              value={homeMinFee}
              onChange={(e) => setHomeMinFee(e.target.value)}
              className={inputClass}
            />
            {shippingErrors.homeMinFee && <p className={errorClass}>{shippingErrors.homeMinFee}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[#1A1A1A]">Autres régions desservies</p>
        {otherRegionList.map((region) => {
          const state = otherRegions[region.id];
          return (
            <div key={region.id} className="rounded-lg border border-[#EBEBEB] p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={state?.enabled ?? false}
                  onChange={(e) =>
                    setOtherRegions((prev) => ({
                      ...prev,
                      [region.id]: { ...prev[region.id], enabled: e.target.checked },
                    }))
                  }
                  className="size-4 accent-black"
                />
                <span className="text-sm text-[#1A1A1A]">
                  {region.name}, {region.capital}
                </span>
              </label>

              {state?.enabled && (
                <div className="mt-3 pl-7">
                  <label className={labelClass}>Prix fixe (FCFA)</label>
                  <input
                    type="number"
                    min={1}
                    value={state.price}
                    onChange={(e) =>
                      setOtherRegions((prev) => ({
                        ...prev,
                        [region.id]: { ...prev[region.id], price: e.target.value },
                      }))
                    }
                    placeholder="Entrez le prix fixe"
                    className={inputClass}
                  />
                  {shippingErrors[`region_${region.id}`] && (
                    <p className={errorClass}>{shippingErrors[`region_${region.id}`]}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        {onBack && <BackCircleButton onClick={onBack} />}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-sm border border-[#D5D5D5] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F5F5] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="ml-auto flex flex-1 items-center justify-center gap-2 rounded-sm bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#CCC] sm:flex-none sm:px-8"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
