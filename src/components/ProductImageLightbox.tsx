import { useState, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  alt?: string;
}

const ProductImageLightbox = ({ images, initialIndex, onClose, alt = "Product" }: ProductImageLightboxProps) => {
  const [current, setCurrent] = useState(initialIndex);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
    setZoom(true);
  }, []);

  const handleMouseLeave = useCallback(() => setZoom(false), []);

  const goPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((p) => (p - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((p) => (p + 1) % images.length);
  }, [images.length]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={goPrev}
          className="absolute left-4 z-50 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {/* Image with zoom */}
      <div
        ref={imgRef}
        className="relative max-w-[85vw] max-h-[85vh] cursor-crosshair overflow-hidden rounded-lg"
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={images[current]}
          alt={`${alt} ${current + 1}`}
          className="block max-w-[85vw] max-h-[85vh] object-contain transition-transform duration-200"
          style={{
            transformOrigin: origin,
            transform: zoom ? "scale(2.5)" : "scale(1)",
          }}
          draggable={false}
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 z-50 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                current === i ? "bg-white w-5" : "bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageLightbox;
