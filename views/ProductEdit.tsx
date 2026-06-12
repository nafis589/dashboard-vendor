interface ProductEditProps {
  productId: string;
}

export default function ProductEdit({ productId }: ProductEditProps) {
  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A]">
        Modifier le produit
      </h1>
      <p className="mt-2 text-sm text-[#666]">ID : {productId}</p>
    </div>
  );
}
