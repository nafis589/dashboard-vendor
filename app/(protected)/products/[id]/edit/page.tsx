import ProductEdit from '@/views/ProductEdit';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params;
  return <ProductEdit productId={id} />;
}
