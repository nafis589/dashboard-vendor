interface OrderDetailProps {
  orderId: string;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A]">
        Détail commande
      </h1>
      <p className="mt-2 text-sm text-[#666]">ID : {orderId}</p>
    </div>
  );
}
