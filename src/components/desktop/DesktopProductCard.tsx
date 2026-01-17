import { Star, Heart, ShoppingCart, Eye } from 'lucide-react';
import { Product } from '@/data/products';
import productImage from '@/assets/product-image.jpg';

interface DesktopProductCardProps {
  product: Product;
  index: number;
}

const DesktopProductCard = ({ product, index }: DesktopProductCardProps) => {
  const getBadgeStyles = (badge?: string) => {
    switch (badge) {
      case 'bestseller':
        return 'bg-emerald-500 text-primary-foreground';
      case 'popular':
        return 'bg-orange-500 text-primary-foreground';
      case 'new':
        return 'bg-blue-500 text-primary-foreground';
      default:
        return '';
    }
  };

  const getBadgeText = (badge?: string) => {
    switch (badge) {
      case 'bestseller':
        return '🔥 Best Seller';
      case 'popular':
        return '⭐ Popular';
      case 'new':
        return '✨ Nou';
      default:
        return '';
    }
  };

  return (
    <div 
      className="group overflow-hidden rounded-2xl bg-card shadow-lg opacity-0 animate-fade-up transition-all duration-300 hover:shadow-2xl"
      style={{ 
        animationDelay: `${(index % 12) * 0.05}s`, 
        animationFillMode: 'forwards' 
      }}
    >
      <div className="relative">
        {product.badge && (
          <div className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold ${getBadgeStyles(product.badge)}`}>
            {getBadgeText(product.badge)}
          </div>
        )}
        
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-transform hover:scale-110">
            <Heart className="h-5 w-5 text-muted-foreground hover:text-destructive" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-transform hover:scale-110">
            <Eye className="h-5 w-5 text-muted-foreground hover:text-primary" />
          </button>
        </div>
        
        <div className="relative aspect-square overflow-hidden">
          <img 
            src={productImage} 
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="gold-gradient absolute bottom-3 left-3 rounded-lg px-3 py-1.5 shadow-lg">
            <span className="text-sm font-semibold text-foreground">{product.dimensions}</span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < product.rating ? 'fill-primary text-primary' : 'text-muted'}`}
            />
          ))}
          <span className="ml-1 text-xs text-muted-foreground">({product.rating}.0)</span>
        </div>
        
        <h3 className="line-clamp-2 text-sm font-medium text-foreground leading-tight mb-3 min-h-[40px]">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">{product.price.toFixed(2)} lei</span>
            {product.oldPrice && (
              <span className="text-sm text-muted-foreground line-through">{product.oldPrice.toFixed(2)} lei</span>
            )}
          </div>
          
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:scale-110 hover:shadow-lg">
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesktopProductCard;
