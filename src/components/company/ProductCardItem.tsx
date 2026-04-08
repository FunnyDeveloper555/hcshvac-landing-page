interface ProductCardItemProps {
  product: any;
  onClick: () => void;
}

const ProductCardItem = ({ product, onClick }: ProductCardItemProps) => {
  const images = product.spot_images as string[] | null;
  const thumbnail = images?.[0];
  const brandName = (product.brands as any)?.name;
  const sku = product.product_variants?.[0]?.sku;
  const modelNumber = product.model_number;
  const seerRating = product.seer_rating;
  const afue = product.afue;
  const tonsBtu = product.tons_btu;

  const specParts: string[] = [];
  if (seerRating) specParts.push(`${seerRating} SEER`);
  if (afue) specParts.push(`${afue} AFUE`);
  if (tonsBtu) specParts.push(tonsBtu);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-border bg-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
    >
      <div className="aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.product_name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <span className="text-sm text-muted-foreground">No Image</span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
          {product.product_name}
        </h3>
        {modelNumber && (
          <p className="text-xs text-muted-foreground font-mono">Model: {modelNumber}</p>
        )}
        {product.spot_text && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.spot_text}</p>
        )}
        {specParts.length > 0 && (
          <p className="text-xs text-primary/80 font-medium">{specParts.join(" · ")}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {product.category && (
            <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-medium">
              {product.category}
            </span>
          )}
          {brandName && (
            <span className="text-xs text-muted-foreground">{brandName}</span>
          )}
        </div>
        {sku && (
          <p className="text-xs text-muted-foreground">Mfg #: {sku}</p>
        )}
      </div>
    </div>
  );
};

export default ProductCardItem;
