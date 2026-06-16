'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import ProductForm from '@/components/products/ProductForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateProduct, useStoreCategories } from '@/hooks/useProducts';
import type { ProductFormValues } from '@/lib/product-schema';

export default function ProductNew() {
  const router = useRouter();
  const { data: categories = [], isLoading: categoriesLoading } = useStoreCategories();
  const createMutation = useCreateProduct();

  const submit = (values: ProductFormValues, status: 'DRAFT' | 'PENDING_REVIEW') => {
    createMutation.mutate(
      { values, status, categories },
      {
        onSuccess: () => {
          toast.success(
            status === 'DRAFT'
              ? 'Brouillon enregistré'
              : 'Produit soumis pour validation',
          );
          router.push('/products');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  if (categoriesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <ProductForm
      mode="create"
      categories={categories}
      loading={createMutation.isPending}
      onSubmitDraft={(values) => submit(values, 'DRAFT')}
      onSubmitReview={(values) => submit(values, 'PENDING_REVIEW')}
    />
  );
}
