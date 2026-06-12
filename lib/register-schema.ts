import { z } from 'zod';

export const accountStepSchema = z
  .object({
    first_name: z.string().min(1, 'Le prénom est requis'),
    last_name: z.string().min(1, 'Le nom est requis'),
    email: z.string().email('Adresse e-mail invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string().min(1, 'Confirmez votre mot de passe'),
    shop_name: z.string().min(1, 'Le nom de la boutique est requis'),
    shop_description: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type AccountStepValues = z.infer<typeof accountStepSchema>;
