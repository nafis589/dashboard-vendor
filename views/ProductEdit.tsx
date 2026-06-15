interface ProductEditProps {
  productId: string;
}

export default function ProductEdit({ productId }: ProductEditProps) {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        Modifier le produit
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">ID : {productId}</p>
    </div>
  );
}
