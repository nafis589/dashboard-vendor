import { z } from 'zod';

export const productConditionEnum = z.enum(['NEW', 'VERY_GOOD', 'GOOD', 'FAIR']);

export const productFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(300),
  description: z.string().max(5000).optional(),
  category_id: z.string().uuid('Catégorie requise'),
  subcategory_id: z.string().uuid().nullable().optional(),
  brand: z.string().max(100).optional(),
  condition: productConditionEnum,
  size: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  material: z.string().max(100).optional(),
  price: z.coerce.number().int('Prix entier requis').positive('Prix positif requis'),
  stock: z.coerce.number().int().min(1, 'Stock minimum 1'),
  images: z
    .array(z.string().min(1))
    .min(1, 'Au moins une photo est requise')
    .max(8, 'Maximum 8 photos'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const CONDITION_LABELS: Record<z.infer<typeof productConditionEnum>, string> = {
  NEW: 'Neuf',
  VERY_GOOD: 'Très bon',
  GOOD: 'Bon',
  FAIR: 'Satisfaisant',
};

export type ProductStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'SOLD'
  | 'ARCHIVED'
  | 'REJECTED';

export const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En validation',
  ACTIVE: 'Actif',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Refusé',
};

export function statusBadgeClass(status: ProductStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-500/15 text-emerald-700 border-transparent dark:text-emerald-400';
    case 'DRAFT':
      return 'bg-muted text-muted-foreground border-transparent';
    case 'PENDING_REVIEW':
      return 'bg-amber-500/15 text-amber-700 border-transparent dark:text-amber-400';
    case 'ARCHIVED':
      return 'bg-red-500/15 text-red-700 border-transparent dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground border-transparent';
  }
}
