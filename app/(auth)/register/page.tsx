'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LocateFixed,
  MapPin,
} from 'lucide-react';
import AuthBrandingPanel, {
  REGISTER_STEP_TAGLINES,
} from '@/components/auth/AuthBrandingPanel';
import BackCircleButton from '@/components/register/BackCircleButton';
import type { LocationValidationResult } from '@/components/register/RegisterLocationMap';
import { accountStepSchema, type AccountStepValues } from '@/lib/register-schema';
import { getPasswordStrength, STRENGTH_COLORS } from '@/lib/password-strength';
import { TOGO_REGIONS } from '@/lib/togo-regions';
import { api, clearToken, setToken } from '@/lib/api-client';
import { REGISTER_SUCCESS_KEY } from '@/lib/register-constants';
import type { RegisterResponse, VendorShippingRegionInput } from '@/lib/types';

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

const inputClass =
  'w-full rounded-sm border border-[#D5D5D5] px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-[#AAA] focus:border-black';
const labelClass = 'mb-1.5 block text-sm font-medium text-[#1A1A1A]';
const errorClass = 'mt-1 text-xs text-red-600';

const STRENGTH_WIDTH: Record<string, string> = {
  faible: '33%',
  moyen: '66%',
  fort: '100%',
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [accountData, setAccountData] = useState<AccountStepValues | null>(null);
  const [location, setLocation] = useState<LocationValidationResult | null>(null);
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geolocateSignal, setGeolocateSignal] = useState(0);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [homePricePerKm, setHomePricePerKm] = useState('');
  const [homeMinFee, setHomeMinFee] = useState('500');
  const [otherRegions, setOtherRegions] = useState<
    Record<string, { enabled: boolean; price: string }>
  >(() =>
    Object.fromEntries(TOGO_REGIONS.map((r) => [r.id, { enabled: false, price: '' }])),
  );
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AccountStepValues>({
    resolver: zodResolver(accountStepSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      shop_name: '',
      shop_description: '',
    },
  });

  const password = watch('password');
  const strength = getPasswordStrength(password ?? '');

  const onStep1Submit = (data: AccountStepValues) => {
    setAccountData(data);
    setStep(2);
  };

  const handleLocationValidated = useCallback((result: LocationValidationResult) => {
    setLocation(result);
  }, []);

  const canContinueLocation =
    !!location?.isInTogo && !!location.region && !isValidatingLocation;

  const validateShipping = (): boolean => {
    const errs: Record<string, string> = {};
    const ppm = parseInt(homePricePerKm, 10);
    const minFee = parseInt(homeMinFee, 10);

    if (!homePricePerKm || Number.isNaN(ppm) || ppm < 50) {
      errs.homePricePerKm = 'Minimum 50 FCFA/km';
    }
    if (!homeMinFee || Number.isNaN(minFee) || minFee < 1) {
      errs.homeMinFee = 'Requis';
    }

    if (location?.region) {
      for (const region of TOGO_REGIONS) {
        if (region.id === location.region.id) continue;
        const state = otherRegions[region.id];
        if (state?.enabled) {
          const price = parseInt(state.price, 10);
          if (!state.price || Number.isNaN(price) || price <= 0) {
            errs[`region_${region.id}`] = 'Prix fixe requis';
          }
        }
      }
    }

    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFinalSubmit = async () => {
    if (!accountData || !location?.region || !location.isInTogo) return;
    if (!validateShipping()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const regions: VendorShippingRegionInput[] = [
      {
        region_id: location.region.id,
        is_home_region: true,
        price_per_km: parseInt(homePricePerKm, 10),
        min_fee: parseInt(homeMinFee, 10),
      },
    ];

    for (const region of TOGO_REGIONS) {
      if (region.id === location.region.id) continue;
      const state = otherRegions[region.id];
      if (state?.enabled) {
        regions.push({
          region_id: region.id,
          is_home_region: false,
          fixed_price: parseInt(state.price, 10),
        });
      }
    }

    try {
      const { data } = await api.post<RegisterResponse>(
        '/api/vendor/auth/register',
        {
          email: accountData.email,
          password: accountData.password,
          first_name: accountData.first_name,
          last_name: accountData.last_name,
          shop_name: accountData.shop_name,
          shop_description: accountData.shop_description || undefined,
        },
        { skipUnauthorizedRedirect: true },
      );

      setToken(data.accessToken);

      await api.patch('/api/vendor/shipping', {
        location: { lat: location.lat, lng: location.lng },
        regions,
      });

      clearToken();
      sessionStorage.setItem(
        REGISTER_SUCCESS_KEY,
        "Votre compte a été créé avec succès. Il est en attente de validation par l'administrateur avant que vous puissiez commencer à vendre.",
      );
      router.push('/login');
    } catch (err) {
      clearToken();
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'inscription.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const homeRegion = location?.region
    ? TOGO_REGIONS.find((r) => r.id === location.region!.id)
    : null;
  const otherRegionList = location?.region
    ? TOGO_REGIONS.filter((r) => r.id !== location.region!.id)
    : TOGO_REGIONS;

  return (
    <main className="h-dvh bg-white">
      <div className="grid h-full p-2 lg:grid-cols-2">
        {/* ════════ COLONNE GAUCHE — Branding (identique au login) ════════ */}
        <AuthBrandingPanel
          tagline={REGISTER_STEP_TAGLINES[step as 1 | 2 | 3]}
          className="relative order-1 hidden min-h-0 lg:flex lg:w-full"
        />

        {/* ════════ COLONNE DROITE — Formulaire / carte ════════ */}
        <div className="order-2 flex h-full min-h-0 flex-col">
          {/* ÉTAPE 2 — Carte plein écran */}
          {step === 2 ? (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl">
              <RegisterLocationMap
                onLocationValidated={handleLocationValidated}
                onValidatingChange={setIsValidatingLocation}
                onGeolocatingChange={setIsGeolocating}
                geolocateSignal={geolocateSignal}
              />

              {/* Modal flottant bas — statut + actions, posé sur la carte */}
              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1000]">
                <div className="pointer-events-auto space-y-4 rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                  {/* Statut de validation */}
                  {isValidatingLocation ? (
                    <div className="flex items-center gap-2 text-sm text-[#666]">
                      <Loader2 size={16} className="animate-spin text-[#1A1A1A]" />
                      Vérification de la localisation…
                    </div>
                  ) : location?.validationError ? (
                    <div className="flex items-start gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>
                        Impossible de vérifier la position. Vérifiez que le backend tourne sur le
                        port 9000, puis réessayez.
                      </span>
                    </div>
                  ) : location && !location.isInTogo ? (
                    <div className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>
                        Vous devez être situé au Togo pour vendre sur cette plateforme.
                      </span>
                    </div>
                  ) : location?.isInTogo && location.region ? (
                    <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
                      ✓ Région {location.region.name} détectée, {location.region.capital}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-sm text-[#666]">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-[#1A1A1A]" />
                      <span>
                        Recherchez votre adresse, cliquez sur la carte ou utilisez votre
                        position actuelle.
                      </span>
                    </div>
                  )}

                  {/* Ligne d'actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGeolocateSignal((n) => n + 1)}
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

                    <BackCircleButton onClick={() => setStep(1)} />
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!canContinueLocation}
                      className="flex items-center gap-2 bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#CCC]"
                    >
                      Suivant
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ÉTAPES 1 & 3 — Formulaire (scroll masqué) */
            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-6 py-10">
                <div className="mb-8 space-y-2">
                  <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#1A1A1A]">
                    Marketplace
                  </h1>
                  <p className="text-sm text-[#777]">
                    {step === 1
                      ? 'Créez votre compte vendeur'
                      : 'Configurez vos tarifs de livraison'}
                  </p>
                </div>

                {/* ÉTAPE 1 — Compte */}
                {step === 1 && (
                  <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="first_name" className={labelClass}>
                          Prénom
                        </label>
                        <input
                          id="first_name"
                          {...register('first_name')}
                          className={inputClass}
                          autoComplete="given-name"
                          placeholder="Kossi"
                        />
                        {errors.first_name && (
                          <p className={errorClass}>{errors.first_name.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="last_name" className={labelClass}>
                          Nom
                        </label>
                        <input
                          id="last_name"
                          {...register('last_name')}
                          className={inputClass}
                          autoComplete="family-name"
                          placeholder="Adjo"
                        />
                        {errors.last_name && (
                          <p className={errorClass}>{errors.last_name.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className={labelClass}>
                        Adresse email
                      </label>
                      <input
                        id="email"
                        type="email"
                        {...register('email')}
                        className={inputClass}
                        autoComplete="email"
                        placeholder="vous@exemple.com"
                      />
                      {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                    </div>

                    <div className="relative">
                      <label htmlFor="password" className={labelClass}>
                        Mot de passe
                      </label>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        className={`${inputClass} pr-10`}
                        autoComplete="new-password"
                        placeholder="Min. 8 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-[38px] text-[#999] transition-colors hover:text-[#1A1A1A]"
                        aria-label={showPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {errors.password && (
                        <p className={errorClass}>{errors.password.message}</p>
                      )}
                      {strength && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#EBEBEB]">
                            <div
                              className={`h-full rounded-full transition-all ${STRENGTH_COLORS[strength]}`}
                              style={{ width: STRENGTH_WIDTH[strength] }}
                            />
                          </div>
                          <span className="text-xs capitalize text-[#777]">{strength}</span>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label htmlFor="confirmPassword" className={labelClass}>
                        Confirmation du mot de passe
                      </label>
                      <input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        {...register('confirmPassword')}
                        className={`${inputClass} pr-10`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-[38px] text-[#999] transition-colors hover:text-[#1A1A1A]"
                        aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {errors.confirmPassword && (
                        <p className={errorClass}>{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="shop_name" className={labelClass}>
                        Nom de la boutique
                      </label>
                      <input
                        id="shop_name"
                        {...register('shop_name')}
                        className={inputClass}
                        placeholder="Ma boutique"
                      />
                      {errors.shop_name && (
                        <p className={errorClass}>{errors.shop_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="shop_description" className={labelClass}>
                        Description de la boutique{' '}
                        <span className="font-normal text-[#999]">(optionnel)</span>
                      </label>
                      <textarea
                        id="shop_description"
                        {...register('shop_description')}
                        rows={3}
                        className={`${inputClass} resize-none`}
                        placeholder="Décrivez votre boutique en quelques mots…"
                      />
                    </div>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-[#333]"
                    >
                      Suivant
                      <ArrowRight size={16} />
                    </button>
                  </form>
                )}

                {/* ÉTAPE 3 — Livraison */}
                {step === 3 && homeRegion && (
                  <div className="space-y-5">
                    <div className="space-y-4 rounded-lg border border-[#EBEBEB] p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#1A1A1A]">
                          ✓ {homeRegion.name} — {homeRegion.capital}
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
                          {shippingErrors.homeMinFee && (
                            <p className={errorClass}>{shippingErrors.homeMinFee}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        Autres régions desservies
                      </p>
                      {otherRegionList.map((region) => {
                        const state = otherRegions[region.id];
                        return (
                          <div
                            key={region.id}
                            className="rounded-lg border border-[#EBEBEB] p-4"
                          >
                            <label className="flex cursor-pointer items-center gap-3">
                              <input
                                type="checkbox"
                                checked={state?.enabled ?? false}
                                onChange={(e) =>
                                  setOtherRegions((prev) => ({
                                    ...prev,
                                    [region.id]: {
                                      ...prev[region.id],
                                      enabled: e.target.checked,
                                    },
                                  }))
                                }
                                className="size-4 accent-black"
                              />
                              <span className="text-sm text-[#1A1A1A]">
                                {region.name} — {region.capital}
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
                                      [region.id]: {
                                        ...prev[region.id],
                                        price: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Entrez le prix fixe"
                                  className={inputClass}
                                />
                                {shippingErrors[`region_${region.id}`] && (
                                  <p className={errorClass}>
                                    {shippingErrors[`region_${region.id}`]}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {submitError && (
                      <div className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <BackCircleButton onClick={() => setStep(2)} />
                      <button
                        type="button"
                        onClick={() => void handleFinalSubmit()}
                        disabled={isSubmitting}
                        className="flex flex-1 items-center justify-center gap-2 bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#CCC]"
                      >
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        Créer mon compte
                      </button>
                    </div>
                  </div>
                )}

                <hr className="mt-8 border-[#E8E8E8]" />
                <p className="mt-4 text-center text-sm">
                  <Link
                    href="/login"
                    className="text-[#1A1A1A] underline underline-offset-2 transition-opacity hover:opacity-70"
                  >
                    Déjà vendeur ? Se connecter
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
