import productImage from '@/assets/product-image.jpg';
import { MeiliProductHit } from '@/types/api';

interface MobileMeiliProductCardProps {
  product: MeiliProductHit;
  index: number;
  onClick?: () => void;
  trackAction?: string;
}

const MobileMeiliProductCard = ({ product, index, onClick, trackAction }: MobileMeiliProductCardProps) => {
  const imageUrl = product.image || productImage;

  const Wrapper = onClick ? 'button' : 'a';
  const wrapperProps = onClick
    ? { type: 'button', onClick, 'data-track-action': trackAction }
    : { href: product.url, 'data-track-action': trackAction };

  return (
    <Wrapper
      {...wrapperProps}
      className="opacity-0 animate-fade-up flex flex-col text-left"
      style={{
        animationDelay: `${(index % 10) * 0.05}s`,
        animationFillMode: 'forwards',
      }}
    >
      <div className="relative overflow-hidden rounded-xl bg-card border-4 border-border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center backdrop-blur blur-md scale-110 "
          style={{ backgroundImage: `url(${imageUrl})` }}
        />

        <div className="relative z-10 aspect-square overflow-hidden">
          <div className="relative h-full w-full flex items-center justify-center rounded-md overflow-hidden border border-1 border-gray-600">
            <img
              src={imageUrl}
              alt={product.title}
              className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-110 "
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 px-1">
        <h3 className="line-clamp-2 text-center text-sm font-serif text-foreground leading-tight">
          {product.title}
        </h3>
        {product.price_html ? (
          <div
            className="mt-1 text-center text-sm font-semibold text-primary"
            dangerouslySetInnerHTML={{ __html: product.price_html }}
          />
        ) : null}
        {product.sku ? (
          <p className="mt-1 text-center text-[11px] text-muted-foreground">SKU: {product.sku}</p>
        ) : null}
      </div>
    </Wrapper>
  );
};

export default MobileMeiliProductCard;
