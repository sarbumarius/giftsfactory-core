import { Heart, Menu, Search, ShoppingCart } from 'lucide-react';
import { t } from '@/utils/translations';

interface DesktopTopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchOpen?: () => void;
  onMenuClick?: () => void;
  onWishlistClick: () => void;
  onCartClick: () => void;
  wishlistCount: number;
  cartCount: number;
  placeholder?: string;
}

const DesktopTopBar = ({
  searchQuery,
  onSearchChange,
  onSearchOpen,
  onMenuClick,
  onWishlistClick,
  onCartClick,
  wishlistCount,
  cartCount,
  placeholder,
}: DesktopTopBarProps) => {
  const searchPlaceholder = placeholder ?? t('search.desktopPlaceholder');
  const menuLabel = t('nav.menu');
  const wishlistLabel = t('nav.wishlist');
  const cartLabel = t('nav.cart');

  return (
    <div className="mb-6 flex items-center justify-between gap-3 border-b border-gray-100 py-3 px-2">
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          data-track-action="A deschis meniul desktop."
          className="rounded-full border border-border bg-white p-2 text-foreground transition-transform hover:scale-105"
          aria-label={menuLabel}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => {
            onSearchChange(event.target.value);
            if (onSearchOpen) onSearchOpen();
          }}
          onFocus={() => onSearchOpen?.()}
          onClick={() => onSearchOpen?.()}
          data-track-action="A deschis cautarea din content desktop."
          placeholder={searchPlaceholder}
          className="w-full rounded-full border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onWishlistClick}
          data-track-action="A apasat pe wishlist din content desktop."
          className="relative rounded-full border border-border bg-white p-2 text-foreground transition-transform hover:scale-105"
          aria-label={wishlistLabel}
        >
          <Heart className="h-5 w-5" />
          {wishlistCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#6844c1] text-[11px] font-bold text-white">
              {wishlistCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onCartClick}
          data-track-action="A apasat pe cos din content desktop."
          className="relative rounded-full border border-border bg-white p-2 text-foreground transition-transform hover:scale-105"
          aria-label={cartLabel}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#6844c1] text-[11px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default DesktopTopBar;
