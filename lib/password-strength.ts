export type PasswordStrength = 'faible' | 'moyen' | 'fort';

export function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return 'faible';
  if (score <= 4) return 'moyen';
  return 'fort';
}

export const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  faible: 'bg-red-500',
  moyen: 'bg-orange-400',
  fort: 'bg-emerald-500',
};
