import { useState } from 'react';
import { Heart, Menu, Phone, Search, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-daruri.svg';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import DesktopSearchModal from './DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';

const DesktopHeader = () => {
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const { searchQuery, setSearchQuery, setCurrentSlug } = useCategoryContext();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="gold-gradient sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-8 py-4">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            data-track-action="A deschis meniul desktop."
            className="rounded-full border border-primary-foreground/30 p-2 text-primary-foreground transition-transform hover:scale-105"
            aria-label="Meniu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentSlug('cadouri-ziua-indragostitilor');
              navigate('/');
            }}
            data-track-action="A apasat pe logo din header desktop."
            className="flex items-center gap-3"
          >
            <img src={logo} alt="Daruri Alese" className="h-12 w-auto" />
          </button>
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-foreground/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  if (!isSearchOpen) setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onClick={() => setIsSearchOpen(true)}
                data-track-action="A deschis cautarea din header desktop."
                placeholder="Cauta produse, categorii, idei de cadouri..."
                className="w-full rounded-full bg-primary-foreground/20 py-3 pl-12 pr-4 text-sm text-primary-foreground placeholder:text-primary-foreground/70 focus:bg-primary-foreground/30 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => window.open('tel:0748777776', '_self')}
              data-track-action="A apasat pe suna din header desktop."
              className="hidden items-center gap-2 rounded-full bg-primary-foreground/20 px-4 py-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/30 lg:flex"
            >
              <Phone className="h-4 w-4" />
              0748.777.776
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/wishlist')}
              data-track-action="A apasat pe wishlist din header desktop."
              className="relative rounded-full border border-primary-foreground/30 p-2 text-primary-foreground transition-transform hover:scale-105"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-primary">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/cos')}
              data-track-action="A apasat pe cos din header desktop."
              className="relative rounded-full border border-primary-foreground/30 p-2 text-primary-foreground transition-transform hover:scale-105"
              aria-label="Cos"
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-primary">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      <DesktopSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default DesktopHeader;
