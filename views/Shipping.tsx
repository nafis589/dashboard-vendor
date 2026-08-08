'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type L from 'leaflet';
import { Loader2, Minus, Pencil, Plus, Settings, X } from 'lucide-react';
import { toast } from 'sonner';

import ShippingConfigStep, {
  type OtherRegionState,
} from '@/components/register/ShippingConfigStep';
import type { LocationValidationResult } from '@/components/register/RegisterLocationMap';
import VendorLocationStep from '@/components/register/VendorLocationStep';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUpdateVendorShipping, useVendorShipping } from '@/hooks/useVendorShipping';
import { TOGO_REGIONS } from '@/lib/togo-regions';
import type { VendorShippingRegionInput } from '@/lib/types';

const RegisterLocationMap = dynamic(
  () => import('@/components/register/RegisterLocationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#EFEFEF] text-sm text-[#999]">
        <Loader2 className="size-6 animate-spin" />
      </div>
    ),
  },
);

type PanelMode = 'view' | 'edit-address';
type ConfigModal = null | 'from-address' | 'config-only';

async function resolveAddressLabel(
  lat: number,
  lng: number,
  storedLabel: string | null,
): Promise<string> {
  if (storedLabel?.trim()) return storedLabel.trim();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
      { headers: { Accept: 'application/json' } },
    );
    const data = (await res.json()) as {
      address?: Record<string, string>;
      display_name?: string;
    };
    const a = data.address ?? {};
    const neighbourhood = a.neighbourhood || a.suburb || a.quarter || a.village;
    const city = a.city || a.town || a.municipality;
    if (neighbourhood && city) return `${neighbourhood}, ${city}`;
    if (city) return city;
    return data.display_name?.split(',').slice(0, 2).join(',').trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function regionsToFormState(
  regions: Array<{
    region_id: string;
    is_home_region: boolean;
    price_per_km: number | null;
    min_fee: number;
    fixed_price: number | null;
  }>,
): {
  homeRegionId: string;
  homePricePerKm: string;
  homeMinFee: string;
  otherRegions: Record<string, OtherRegionState>;
} {
  const home = regions.find((r) => r.is_home_region);
  const homeRegionId = home?.region_id ?? TOGO_REGIONS[0].id;
  const otherRegions = Object.fromEntries(
    TOGO_REGIONS.map((region) => {
      const cfg = regions.find((r) => r.region_id === region.id && !r.is_home_region);
      return [
        region.id,
        {
          enabled: Boolean(cfg),
          price: cfg?.fixed_price != null ? String(cfg.fixed_price) : '',
        },
      ];
    }),
  );

  return {
    homeRegionId,
    homePricePerKm: home?.price_per_km != null ? String(home.price_per_km) : '',
    homeMinFee: home?.min_fee != null ? String(home.min_fee) : '500',
    otherRegions,
  };
}

function hasValidCoords(
  location: { lat: number; lng: number } | null | undefined,
): location is { lat: number; lng: number; region_id?: string; address_label?: string | null } {
  return (
    location != null &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  );
}

export default function Shipping() {
  const { data: config, isLoading, isError, refetch } = useVendorShipping();
  const updateMutation = useUpdateVendorShipping();

  const [panelMode, setPanelMode] = useState<PanelMode>('view');
  const [configModal, setConfigModal] = useState<ConfigModal>(null);
  const [addressLabel, setAddressLabel] = useState('');
  const [pendingLocation, setPendingLocation] = useState<LocationValidationResult | null>(null);
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geolocateSignal, setGeolocateSignal] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resultPanelBottom, setResultPanelBottom] = useState(20);

  const mapRef = useRef<L.Map | null>(null);
  const configModalRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const lastPanelBottomRef = useRef(20);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  const location = config?.location;
  const formDefaults = useMemo(() => {
    if (config?.regions?.length) return regionsToFormState(config.regions);
    if (location?.region_id) {
      return {
        homeRegionId: location.region_id,
        homePricePerKm: '',
        homeMinFee: '500',
        otherRegions: Object.fromEntries(
          TOGO_REGIONS.map((region) => [region.id, { enabled: false, price: '' }]),
        ),
      };
    }
    return null;
  }, [config?.regions, location?.region_id]);

  const activeHomeRegionId =
    pendingLocation?.region?.id ?? location?.region_id ?? formDefaults?.homeRegionId ?? TOGO_REGIONS[0].id;

  const shippingFormDefaults = useMemo(() => {
    if (!formDefaults) return null;

    const homeRegionChanged =
      configModal === 'from-address' &&
      pendingLocation?.region?.id != null &&
      pendingLocation.region.id !== location?.region_id;

    if (homeRegionChanged) {
      return {
        homeRegionId: pendingLocation.region!.id,
        homePricePerKm: '',
        homeMinFee: '500',
        otherRegions: Object.fromEntries(
          TOGO_REGIONS.map((region) => [region.id, { enabled: false, price: '' }]),
        ),
      };
    }

    return { ...formDefaults, homeRegionId: activeHomeRegionId };
  }, [formDefaults, configModal, pendingLocation?.region?.id, location?.region_id, activeHomeRegionId]);

  const homeRegionName = useMemo(() => {
    const regionId = location?.region_id ?? formDefaults?.homeRegionId;
    return TOGO_REGIONS.find((r) => r.id === regionId)?.name ?? '—';
  }, [location?.region_id, formDefaults?.homeRegionId]);

  useEffect(() => {
    if (!hasValidCoords(location)) return;
    void resolveAddressLabel(location.lat, location.lng, location.address_label ?? null).then(
      setAddressLabel,
    );
  }, [location]);

  useEffect(() => {
    const getModalBaselineBottom = (containerEl: HTMLElement) => {
      const containerHeight = containerEl.getBoundingClientRect().height;
      const modalTop = 12;
      const modalMaxHeight = window.innerHeight - 80;
      const modalHeight = Math.min(modalMaxHeight, containerHeight - modalTop);
      return Math.max(12, containerHeight - modalTop - modalHeight);
    };

    const syncBottom = () => {
      const containerEl = mapContainerRef.current;
      if (!containerEl) return;

      const containerRect = containerEl.getBoundingClientRect();
      const baseline = getModalBaselineBottom(containerEl);

      if (configModal && configModalRef.current) {
        const modalRect = configModalRef.current.getBoundingClientRect();
        const offset = Math.max(baseline, containerRect.bottom - modalRect.bottom);
        lastPanelBottomRef.current = offset;
        setResultPanelBottom(offset);
        return;
      }

      const offset = Math.max(baseline, lastPanelBottomRef.current);
      lastPanelBottomRef.current = offset;
      setResultPanelBottom(offset);
    };

    syncBottom();

    const observer = new ResizeObserver(syncBottom);
    if (mapContainerRef.current) observer.observe(mapContainerRef.current);
    if (configModal && configModalRef.current) observer.observe(configModalRef.current);
    window.addEventListener('resize', syncBottom);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncBottom);
    };
  }, [configModal, shippingFormDefaults]);

  const handleLocationValidated = useCallback((result: LocationValidationResult) => {
    setPendingLocation(result);
  }, []);

  const resetToView = useCallback(() => {
    setPanelMode('view');
    setConfigModal(null);
    setPendingLocation(null);
    setSaveError(null);
    void refetch();
  }, [refetch]);

  const closeModal = useCallback(() => {
    setConfigModal(null);
    setSaveError(null);
  }, []);

  const saveRegions = async (
    regions: VendorShippingRegionInput[],
    includeLocation: boolean,
  ) => {
    setSaveError(null);
    try {
      const payload: {
        location?: { lat: number; lng: number };
        regions: VendorShippingRegionInput[];
      } = { regions };

      if (includeLocation) {
        const loc =
          pendingLocation ??
          (hasValidCoords(location) ? { lat: location.lat, lng: location.lng } : null);
        if (!loc) throw new Error('Position invalide');
        payload.location = { lat: loc.lat, lng: loc.lng };
      }

      await updateMutation.mutateAsync(payload);
      toast.success(
        includeLocation
          ? 'Adresse et livraison mises à jour'
          : 'Configuration de livraison mise à jour',
      );
      resetToView();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  const mapInteractive = panelMode === 'edit-address';
  const mapInitialPosition = hasValidCoords(location)
    ? { lat: location.lat, lng: location.lng }
    : undefined;

  if (isLoading) {
    return (
      <div className="-m-4 flex h-[calc(100dvh-3rem)] overflow-hidden md:-m-6">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="-m-4 flex h-[calc(100dvh-3rem)] items-center justify-center md:-m-6">
        <p className="text-destructive">Impossible de charger la configuration livraison.</p>
      </div>
    );
  }

  return (
    <div className="-m-4 flex h-[calc(100dvh-3rem)] min-h-0 overflow-hidden md:-m-6">
      <div ref={mapContainerRef} className="relative min-h-0 flex-1 overflow-hidden">
        <RegisterLocationMap
          initialPosition={mapInitialPosition}
          interactive={mapInteractive}
          disableDefaultZoom
          searchBarInsetClassName="left-3 right-3"
          onMapReady={handleMapReady}
          onLocationValidated={handleLocationValidated}
          onValidatingChange={setIsValidatingLocation}
          onGeolocatingChange={setIsGeolocating}
          geolocateSignal={geolocateSignal}
        />

        {/* Icône paramètres + modal config livraison (modal à gauche de l'icône) */}
        <div className="absolute right-3 top-3 z-[1200] flex items-start gap-2">
          {configModal && shippingFormDefaults && (
            <div
              ref={configModalRef}
              className="pointer-events-auto flex max-h-[calc(100dvh-5rem)] w-[420px] max-w-[calc(100vw-5rem)] flex-col overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.14)]"
            >
              <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1A1A1A]">
                    Tarifs de livraison
                  </p>
                  
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#666] transition-colors hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <ShippingConfigStep
                  key={`${configModal}-${shippingFormDefaults.homeRegionId}`}
                  homeRegionId={shippingFormDefaults.homeRegionId}
                  initialHomePricePerKm={shippingFormDefaults.homePricePerKm}
                  initialHomeMinFee={shippingFormDefaults.homeMinFee}
                  initialOtherRegions={shippingFormDefaults.otherRegions}
                  loading={updateMutation.isPending}
                  error={saveError}
                  submitLabel="Enregistrer"
                  cancelLabel="Annuler"
                  onCancel={configModal === 'config-only' ? closeModal : undefined}
                  onBack={configModal === 'from-address' ? closeModal : undefined}
                  onSubmit={(regions) =>
                    void saveRegions(regions, configModal === 'from-address')
                  }
                />
              </div>
            </div>
          )}

          <div className="flex shrink-0 flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      setSaveError(null);
                      setConfigModal('config-only');
                    }}
                    className="flex size-10 items-center justify-center rounded-sm border border-[#D5D5D5] bg-white text-[#1A1A1A] shadow-sm transition-colors hover:bg-[#F5F5F5]"
                    aria-label="Configurer les tarifs de livraison"
                  >
                    <Settings className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Configurer les tarifs de livraison</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex flex-col overflow-hidden rounded-sm border border-[#D5D5D5] bg-white shadow-sm">
              <button
                type="button"
                onClick={() => mapRef.current?.zoomIn()}
                className="flex size-10 items-center justify-center text-[#1A1A1A] transition-colors hover:bg-[#F5F5F5]"
                aria-label="Zoom avant"
              >
                <Plus className="size-4" />
              </button>
              <div className="h-px bg-[#E5E5E5]" />
              <button
                type="button"
                onClick={() => mapRef.current?.zoomOut()}
                className="flex size-10 items-center justify-center text-[#1A1A1A] transition-colors hover:bg-[#F5F5F5]"
                aria-label="Zoom arrière"
              >
                <Minus className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Panneau de résultat — même largeur que la barre de recherche */}
        <div
          className="pointer-events-none absolute left-3 right-3 z-[1000] flex transition-[bottom] duration-200"
          style={{ bottom: resultPanelBottom }}
        >
          <div className="pointer-events-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
            {panelMode === 'view' ? (
              location ? (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {addressLabel || 'Chargement de l\'adresse…'}
                    </p>
                    <p className="mt-1 text-sm text-[#666]">Région : {homeRegionName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPanelMode('edit-address');
                      setPendingLocation(null);
                      setSaveError(null);
                    }}
                    className="shrink-0 rounded-sm p-1.5 text-[#666] transition-colors hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
                    aria-label="Modifier l'adresse"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[#666]">
                    Aucune adresse configurée. Cliquez pour définir votre position.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPanelMode('edit-address')}
                    className="rounded-sm bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#333]"
                  >
                    Configurer mon adresse
                  </button>
                </div>
              )
            ) : (
              <VendorLocationStep
                location={pendingLocation}
                isValidatingLocation={isValidatingLocation}
                isGeolocating={isGeolocating}
                onGeolocate={() => setGeolocateSignal((n) => n + 1)}
                onNext={() => {
                  setSaveError(null);
                  setConfigModal('from-address');
                }}
                onBack={location ? resetToView : undefined}
                nextLabel="Suivant"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
