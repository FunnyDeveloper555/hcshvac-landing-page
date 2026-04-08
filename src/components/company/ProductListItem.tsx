import { ChevronRight } from "lucide-react";

interface ProductListItemProps {
  product: any;
  onClick: () => void;
}

const ProductListItem = ({ product, onClick }: ProductListItemProps) => {
  const images = product.spot_images as string[] | null;
  const thumbnail = images?.[0];
  const brandName = (product.brands as any)?.name;
  const sku = product.product_variants?.[0]?.sku;
  const modelNumber = product.model_number;
  const seerRating = product.seer_rating;
  const afue = product.afue;
  const tonsBtu = product.tons_btu;

  // Build a compact spec line
  const specParts: string[] = [];
  if (seerRating) specParts.push(`${seerRating} SEER`);
  if (afue) specParts.push(`${afue} AFUE`);
  if (tonsBtu) specParts.push(tonsBtu);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex gap-5 border border-border bg-card rounded-lg p-4 hover:shadow-lg hover:border-primary/30 transition-all duration-200"
    >
      {/* Image */}
      <div className="w-36 h-36 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.product_name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-muted-foreground">No Image</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {product.product_name}
          </h3>
          {product.spot_text && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {product.spot_text}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {brandName && (
            <span className="text-sm text-muted-foreground">
              Brand: <span className="text-foreground font-medium">{brandName}</span>
            </span>
          )}
          {modelNumber && (
            <span className="text-sm text-muted-foreground">
              Model: <span className="text-foreground font-medium font-mono">{modelNumber}</span>
            </span>
          )}
          {sku && (
            <span className="text-sm text-muted-foreground">
              Mfg #: <span className="text-foreground font-medium">{sku}</span>
            </span>
          )}
          {product.category && (
            <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-medium">
              {product.category}
            </span>
          )}
        </div>
        {specParts.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {specParts.join(" · ")}
          </p>
        )}
      </div>

      {/* Arrow */}
      <div className="flex items-center shrink-0">
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
};

export default ProductListItem;
