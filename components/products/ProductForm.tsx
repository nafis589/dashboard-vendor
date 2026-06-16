'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import ImageUpload from '@/components/products/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getSubcategories } from '@/lib/categories';
import type { StoreCategory } from '@/lib/categories';
import {
  CONDITION_LABELS,
  productFormSchema,
  type ProductFormValues,
} from '@/lib/product-schema';

interface ProductFormProps {
  mode: 'create' | 'edit';
  categories: StoreCategory[];
  defaultValues?: Partial<ProductFormValues>;
  loading?: boolean;
  onSubmitDraft: (values: ProductFormValues) => void;
  onSubmitReview: (values: ProductFormValues) => void;
  backHref?: string;
}

const sectionClass = 'bg-card p-6 border rounded-xl shadow-none';

const EMPTY_VALUES: ProductFormValues = {
  title: '',
  description: '',
  category_id: '',
  subcategory_id: null,
  brand: '',
  condition: 'NEW',
  size: '',
  color: '',
  material: '',
  price: 0,
  stock: 1,
  images: [],
};

export default function ProductForm({
  mode,
  categories,
  defaultValues,
  loading = false,
  onSubmitDraft,
  onSubmitReview,
  backHref = '/products',
}: ProductFormProps) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as import('react-hook-form').Resolver<ProductFormValues>,
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({ ...EMPTY_VALUES, ...defaultValues });
    }
  }, [defaultValues, reset]);

  const categoryId = watch('category_id');
  const subcategories = useMemo(
    () => (categoryId ? getSubcategories(categories, categoryId) : []),
    [categories, categoryId],
  );

  useEffect(() => {
    if (!categoryId) {
      setValue('subcategory_id', null);
      return;
    }
    const subs = getSubcategories(categories, categoryId);
    if (subs.length === 0) {
      setValue('subcategory_id', null);
    }
  }, [categoryId, categories, setValue]);

  const onDraft = handleSubmit(onSubmitDraft);
  const onReview = handleSubmit(onSubmitReview);

  return (
    <form className="mx-auto max-w-[72rem] pb-12" onSubmit={(e) => e.preventDefault()}>
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="icon" className="size-9 shrink-0" asChild>
            <Link href={backHref} aria-label="Retour">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              {mode === 'create' ? 'Nouveau produit' : 'Modifier le produit'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Renseignez les informations de votre article à vendre.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => router.push(backHref)}
          >
            Annuler
          </Button>
          
          <Button type="button" disabled={loading} onClick={() => void onReview()}>
            Soumettre pour validation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* COLONNE GAUCHE */}
        <div className="space-y-6 lg:col-span-2">
          {/* Détails produit */}
          <div className={sectionClass}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Détails du produit</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Robe wax pagne traditionnelle"
                  disabled={loading}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">
                  Description{' '}
                  <span className="font-normal text-muted-foreground">(Optionnel)</span>
                </Label>
                <Textarea
                  id="description"
                  rows={5}
                  className="min-h-[120px] resize-y"
                  {...register('description')}
                  placeholder="Détails sur le produit…"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Photos du produit</h2>
              
            </div>
            <Controller
              name="images"
              control={control}
              render={({ field }) => (
                <ImageUpload value={field.value} onChange={field.onChange} disabled={loading} />
              )}
            />
            {errors.images && (
              <p className="mt-2 text-xs text-destructive">{errors.images.message}</p>
            )}
          </div>

          {/* Caractéristiques */}
          <div className={sectionClass}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Caractéristiques</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="size">
                  Taille <span className="font-normal text-muted-foreground">(Optionnel)</span>
                </Label>
                <Input id="size" {...register('size')} placeholder="M, 42, etc." disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color">
                  Couleur <span className="font-normal text-muted-foreground">(Optionnel)</span>
                </Label>
                <Input id="color" {...register('color')} placeholder="Noir, Rouge…" disabled={loading} />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label>État</Label>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="État du produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CONDITION_LABELS) as Array<keyof typeof CONDITION_LABELS>).map(
                        (key) => (
                          <SelectItem key={key} value={key}>
                            {CONDITION_LABELS[key]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="material">
                Matière <span className="font-normal text-muted-foreground">(Optionnel)</span>
              </Label>
              <Input id="material" {...register('material')} placeholder="Coton, Cuir…" disabled={loading} />
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="brand">
                Marque <span className="font-normal text-muted-foreground">(Optionnel)</span>
              </Label>
              <Input id="brand" {...register('brand')} placeholder="Nom de la marque" disabled={loading} />
            </div>
          </div>
        </div>

        {/* COLONNE DROITE */}
        <div className="space-y-6 lg:col-span-1">
          {/* Prix */}
          <div className={sectionClass}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Prix</h2>
            <div className="space-y-1.5">
              <Label htmlFor="price">Prix de vente (FCFA)</Label>
              <Input
                id="price"
                type="number"
                min={1}
                step={1}
                {...register('price')}
                placeholder="0"
                disabled={loading}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>

          {/* Stock */}
          <div className={sectionClass}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Stock</h2>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Quantité</Label>
              <Input
                id="stock"
                type="number"
                min={1}
                step={1}
                {...register('stock')}
                placeholder="1"
                disabled={loading}
              />
              {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
            </div>
          </div>

          {/* Catégories */}
          <div className={sectionClass}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Catégories</h2>

            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && (
                <p className="text-xs text-destructive">{errors.category_id.message}</p>
              )}
            </div>

            {subcategories.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <Label>Sous-catégorie</Label>
                <Controller
                  name="subcategory_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v || null)}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Choisir une sous-catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
