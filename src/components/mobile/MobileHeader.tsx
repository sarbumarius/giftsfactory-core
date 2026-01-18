import { useEffect, useState } from 'react';
import { User, ShoppingCart, Heart, Sparkles } from 'lucide-react';
import logo from '@/assets/factorygifts.svg';
import MobileCategorySheet from './MobileCategorySheet';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { useNavigate } from 'react-router-dom';
import MobileMenuModal from './MobileMenuModal';
import MobileAssistantModal from './MobileAssistantModal';
import { getLocale, LocaleCode, setLocale, stripLocalePrefix, withLocalePath } from '@/utils/locale';

interface MobileHeaderProps {
  onSearchClick?: () => void;
}

const MobileHeader = ({ onSearchClick }: MobileHeaderProps) => {
  const { data, setCurrentSlug } = useCategoryContext();
  const { cart, wishlist } = useShopContext();
  const navigate = useNavigate();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [locale, setLocaleState] = useState<LocaleCode>(getLocale());

  const categoryTitle = data?.info.titlu || 'Categoria ...';
  const productCount = data?.info.nr_produse || 0;

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

  const headerPadding = isAtTop ? 'px-4 py-1' : 'px-3 py-2';
  const headerCorners = isAtTop ? '' : 'rounded-b-md';
  const logoSize = isAtTop ? 'h-16' : 'h-10';
  const assistantText = isAtTop ? 'text-sm' : 'text-xs';
  const assistantPadding = isAtTop ? 'px-3 py-1' : 'px-2 py-1';
  const iconSize = isAtTop ? 'h-6 w-6' : 'h-6 w-6';
  const sparkleSize = isAtTop ? 'h-4 w-4' : 'h-3 w-3';
  const flagSize = isAtTop ? 'h-5 w-5' : 'h-4 w-4';

  const handleLocaleChange = (nextLocale: LocaleCode) => {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    setLocaleState(nextLocale);
    if (typeof window === 'undefined') return;
    const path = stripLocalePrefix(window.location.pathname);
    const nextPath = nextLocale === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;
    window.location.assign(`${nextPath}${window.location.search}${window.location.hash}`);
  };

  return (
    <>
      {/* Info Bars - Hidden when scrolling */}
      <div data-track-action="A apasat sa vada detalii din bara de informatii." className={`sticky top-0 z-50 hidden transition-all duration-300 ${isAtTop ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
        {/* Bar 1 - Personalizare */}
        <div className="bg-[#6e4514] py-2 px-4 text-center">
          <div className="text-white text-xs font-medium">
            <span>{bannerMessages[bannerIndex]}</span>
          </div>
        </div>


      </div>

      <header className={`gold-gradient sticky top-0 z-50 ${headerPadding} ${headerCorners} relative`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 relative">

            <div className="flex flex-1 flex-col items-start afisareCategorie">
              <div className="flex w-full items-center gap-2">



                  <button
                      type="button"
                      onClick={() => setIsMenuOpen(true)}
                      className="transition-transform hover:scale-105 active:scale-95 mr-2"
                      aria-label="Daruri Alese"
                  >
                    <img src={logo} alt="Daruri Alese" className={`${logoSize} w-auto`} />
                  </button>



              </div>
            </div>

            {/* Triunghi indicator - doar cAЫnd e la top */}
            {isAtTop && (
              <div className="absolute left-1/2 -bottom-1/4 transition-opacity duration-300 z-50">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-[#d9b35e] "></div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="transition-transform hover:scale-110 active:scale-95 hidden">
              <User className="h-6 w-6 text-primary-foreground" />
            </button>

            <button
              type="button"
              onClick={() => setIsAssistantOpen(true)}
              data-track-action="A deschis asistentul AI din header."
              className={`flex items-center gap-2 rounded-full border border-white/40 bg-transparent ${assistantPadding} ${assistantText} font-semibold text-white transition-colors hover:bg-white/10`}
            >
              <Sparkles className={sparkleSize} />
              AI
            </button>

            <div className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-1 py-0.5">
              <button
                type="button"
                onClick={() => handleLocaleChange('ro')}
                data-track-action="A selectat limba RO."
                className={`rounded-full overflow-hidden transition-colors ${locale === 'ro' ? 'bg-white/30' : 'hover:bg-white/20 opacity-20'}`}
                aria-label="Romana"
              >
                <img src="/flags/ro.png" alt="RO" className={`${flagSize} w-auto`} />
              </button>
              <button
                type="button"
                onClick={() => handleLocaleChange('en')}
                data-track-action="A selectat limba EN."
                className={`rounded-full overflow-hidden transition-colors ${locale === 'en' ? 'bg-white/30' : 'hover:bg-white/20 opacity-20'}`}
                aria-label="English"
              >
                <img src="/flags/en.png" alt="EN" className={`${flagSize} w-auto`} />
              </button>
            </div>

            <button
              className="relative transition-transform hover:scale-110 active:scale-95"
              onClick={() => navigate(withLocalePath('/wishlist', locale))}
              aria-label="Wishlist"
              data-track-action="A apasat pe wishlist din header."
            >
              <Heart className={`${iconSize} text-primary-foreground`} />
              {wishlist.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-card text-[10px] font-bold text-primary">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              className="relative transition-transform hover:scale-110 active:scale-95"
              onClick={() => navigate(withLocalePath('/cos', locale))}
              aria-label="Cos"
              data-track-action="A apasat pe cos din header."
            >
              <ShoppingCart className={`${iconSize} text-primary-foreground`} />
              {cart.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-card text-[10px] font-bold text-primary">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Category Sheet Modal */}
      <MobileCategorySheet isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} />
      <MobileMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenCategories={() => {
          setCurrentSlug('gifts-factory');
          setIsCategoryOpen(true);
        }}
      />
      <MobileAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        products={data?.produse || []}
      />
    </>
  );
};

export default MobileHeader;
