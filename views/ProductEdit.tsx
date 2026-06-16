'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import ProductForm from '@/components/products/ProductForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useProduct, useStoreCategories, useUpdateProduct } from '@/hooks/useProducts';
import { splitCategoryForForm } from '@/lib/categories';
import type { ProductFormValues } from '@/lib/product-schema';

interface ProductEditProps {
  productId: string;
}

export default function ProductEdit({ productId }: ProductEditProps) {
  const router = useRouter();
  const { data: categories = [], isLoading: categoriesLoading } = useStoreCategories();
  const { data: productRes, isLoading: productLoading, isError } = useProduct(productId);
  const updateMutation = useUpdateProduct(productId);

  const product = productRes?.data;

  const defaultValues = useMemo<Partial<ProductFormValues> | undefined>(() => {
    if (!product) return undefined;
    const { category_id, subcategory_id } = splitCategoryForForm(categories, product.category_id);
    const images = [...(product.images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((img) => img.url);

    return {
      title: product.title,
      description: product.description ?? '',
      category_id,
      subcategory_id,
      brand: product.brand ?? '',
      condition: (product.condition as ProductFormValues['condition']) ?? 'NEW',
      size: product.size ?? '',
      color: product.color ?? '',
      material: product.material ?? '',
      price: product.price,
      stock: product.stock,
      images,
    };
  }, [product, categories]);

  const submit = (values: ProductFormValues, status: 'DRAFT' | 'PENDING_REVIEW') => {
    updateMutation.mutate(
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

  if (categoriesLoading || productLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !product || !defaultValues) {
    return (
      <p className="text-destructive">Produit introuvable ou accès refusé.</p>
    );
  }

  return (
    <ProductForm
      mode="edit"
      categories={categories}
      defaultValues={defaultValues}
      loading={updateMutation.isPending}
      onSubmitDraft={(values) => submit(values, 'DRAFT')}
      onSubmitReview={(values) => submit(values, 'PENDING_REVIEW')}
    />
  );
}
