import OrderDetail from '@/views/OrderDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
