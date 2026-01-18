import { useEffect, useState } from 'react';
import { ShoppingCart, Heart, ArrowLeft, Menu, Sparkles } from 'lucide-react';
import logo from '@/assets/factorygifts.svg';
import { withLocalePath } from '@/utils/locale';

interface MobileProductHeaderProps {
  title: string;
  onBack: () => void;
  onSearchClick?: () => void;
  categoryTitle?: string;
  onCategoryClick?: () => void;
  cartCount?: number;
  wishlistCount?: number;
  onCartClick?: () => void;
  onWishlistClick?: () => void;
  onLogoClick?: () => void;
  onBackInlineClick?: () => void;
  centerTitle?: boolean;
  onMenuClick?: () => void;
  showTopBanners?: boolean;
  onAssistantClick?: () => void;
}

const MobileProductHeader = ({
  title,
  onBack,
  onSearchClick,
  categoryTitle,
  onCategoryClick,
  cartCount = 0,
  wishlistCount = 0,
  onCartClick,
  onWishlistClick,
  onLogoClick,
  onBackInlineClick,
  centerTitle = false,
  onMenuClick,
  showTopBanners = false,
  onAssistantClick,
}: MobileProductHeaderProps) => {
  const [isAtTop, setIsAtTop] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % 5);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const bannerMessages = [
    'Peste 80.000+ clienti multumiti',
    '⚡ Livrare rapida 1–3 zile lucratoare',
    '⭐ Livrare in toata Romania',
    'Livrare gratuita peste 200 RON',
    'Personalizare inclusa in pret!',
  ];

  return (
    <>
      {showTopBanners && (
      <div className={`sticky top-0 z-50 transition-all duration-300 ${isAtTop ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
        <div className="bg-[#6e4514] py-2 px-4 text-center">
          <div className="text-white text-xs font-medium">
            <span>{bannerMessages[bannerIndex]}</span>
          </div>
        </div>

        <div className="bg-[#ce843b] py-2 px-4 text-center">
          <a
            href={withLocalePath('/recenzii')}
            aria-label="★★★★★ 5 din 5 din 5.094 de reviewuri. Vezi recenzii"
            data-track-action="A apasat pe linkul catre recenzii."
            className="block text-xs text-white no-underline whitespace-nowrap overflow-hidden text-ellipsis"
          >
            <span className="text-yellow-300">★★★★★</span>
            <span className="mx-2">5 / 5 din 5.094 de reviewuri • Vezi recenzii</span>
          </a>
        </div>
      </div>
      )}

      <header className="gold-gradient sticky top-0 z-50 px-4 py-1  relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {onBackInlineClick && (
              <button
                type="button"
                onClick={onBackInlineClick}
                data-track-action="A apasat pe inapoi din header."
                className="rounded-md border border-amber-900/20 p-2 transition-transform hover:scale-110 active:scale-95"
                aria-label="Inapoi"
              >
                <ArrowLeft className="h-4 w-4 text-primary-foreground" />
              </button>
            )}
            {onMenuClick && (
              <button
                type="button"
                onClick={onMenuClick}
                data-track-action="A deschis meniul din header."
                className="rounded-md border border-amber-900/20 p-2 transition-transform hover:scale-110 active:scale-95 hidden"
                aria-label="Meniu"
              >
                <Menu className="h-4 w-4 text-primary-foreground" />
              </button>
            )}





            <button
              type="button"
              onClick={onLogoClick}
              data-track-action="A apasat pe logo din header."
              className="transition-transform hover:scale-105 active:scale-95"
              aria-label="Daruri Alese"
            >
              <img src={logo} alt="Daruri Alese" className="h-16 w-auto" />
            </button>


          </div>
          <div className="flex items-center gap-3">
            {onAssistantClick && (
              <button
                type="button"
                onClick={onAssistantClick}
                data-track-action="A deschis asistentul AI din header."
                className="flex items-center gap-1 rounded-full border border-white/40 bg-transparent px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-white/10"
                aria-label="Asistent AI"
              >
                <Sparkles className="h-3 w-3" />
                Asistent AI
              </button>
            )}
            <button
              type="button"
              className="relative transition-transform hover:scale-110 active:scale-95"
              aria-label="Wishlist"
              onClick={onWishlistClick}
              data-track-action="A apasat pe wishlist din header."
            >
              <Heart className="h-6 w-6  text-primary-foreground" />
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-card text-[10px] font-bold text-primary">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className="relative transition-transform hover:scale-110 active:scale-95"
              aria-label="Cos"
              onClick={onCartClick}
              data-track-action="A apasat pe cos din header."
            >
              <ShoppingCart className="h-6 w-6  text-primary-foreground" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-card text-[10px] font-bold text-primary">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        {centerTitle && !categoryTitle && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <h1 className="line-clamp-1 font-serif text-base font-semibold text-primary-foreground">{title}</h1>
          </div>
        )}
      </header>
    </>
  );
};

export default MobileProductHeader;
