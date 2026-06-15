interface OrderDetailProps {
  orderId: string;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        Détail commande
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">ID : {orderId}</p>
    </div>
  );
}
