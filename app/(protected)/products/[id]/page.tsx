import ProductDetail from '@/views/ProductDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ProductDetail productId={id} />;
}
