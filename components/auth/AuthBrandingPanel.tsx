import { Tag } from 'lucide-react';

const DEFAULT_TAGLINE = 'Gérez. Suivez. Vendez vos articles.';

interface AuthBrandingPanelProps {
  tagline?: string;
  className?: string;
}

export default function AuthBrandingPanel({
  tagline = DEFAULT_TAGLINE,
  className = '',
}: AuthBrandingPanelProps) {
  return (
    <div
      className={[
        'relative h-full overflow-hidden rounded-3xl bg-[#1A1A1A]',
        className,
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,transparent_0%,rgba(255,255,255,0.06)_100%)]" />

      <div className="relative z-10 flex h-full w-full flex-col justify-between p-12 text-white">
        <div className="space-y-4">
          <div className="space-y-2">
            <Tag className="size-10 text-white" strokeWidth={1.5} />
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Marketplace</h1>
          </div>
          <p className="text-lg font-medium text-white/80">{tagline}</p>
        </div>

        <div className="flex w-full items-end justify-between gap-6">
          <div className="flex-1 space-y-1.5">
            <h2 className="text-lg font-semibold">Espace vendeur</h2>
            <p className="text-sm leading-relaxed text-white/70">
              Connectez-vous pour gérer votre boutique, vos produits et suivre vos
              commandes en temps réel.
            </p>
          </div>
          <div className="hidden h-12 w-px bg-white/20 sm:block" />
          <div className="flex-1 space-y-1.5">
            <h2 className="text-lg font-semibold">Besoin d&apos;aide ?</h2>
            <p className="text-sm leading-relaxed text-white/70">
              Contactez le support si vous rencontrez un problème avec votre compte
              vendeur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const REGISTER_STEP_TAGLINES: Record<1 | 2 | 3, string> = {
  1: 'Créez. Configurez. Lancez votre boutique.',
  2: 'Placez. Validez. Ancrez votre activité.',
  3: 'Tarifez. Livrez. Desservez tout le Togo.',
};
