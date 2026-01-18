import { Menu, MessageSquare, Phone, Search, LayoutGrid } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileMenuModal from './MobileMenuModal';
import MobileCategorySheet from './MobileCategorySheet';
import MobileSearchSheet from './MobileSearchSheet';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { stripLocalePrefix, withLocalePath } from '@/utils/locale';
const navItems = [
  { icon: Menu, label: 'Meniu' },
  { icon: LayoutGrid, label: 'Categorii' },
  { icon: Search, label: 'Cauta' },
  { icon: MessageSquare, label: 'Recenzii' },
  { icon: Phone, label: 'Suna' },
];

export interface MobileBottomNavRef {
  openWheel: () => void;
  openMenu: () => void;
  openCategories: () => void;
}

const MobileBottomNav = forwardRef<MobileBottomNavRef>((props, ref) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { setCurrentSlug } = useCategoryContext();
  const navigate = useNavigate();
  const location = useLocation();

  const openMenu = () => {
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openCategories = () => {
    setCurrentSlug('gifts-factory');
    setIsCategoryOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openWheel: openCategories,
    openMenu,
    openCategories,
  }));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="flex items-center justify-around">
          {navItems.map((item, index) => {
            const isReviewsPage = stripLocalePrefix(location.pathname) === '/recenzii';
            const label = index === 3 && isReviewsPage ? 'Categorii' : item.label;

            return (
              <button
                key={item.label}
                onClick={() => {
                  if (index === 0) openMenu();
                  if (index === 1) openCategories();
                  if (index === 2) setIsSearchOpen(true);
                  if (index === 3) {
                    if (isReviewsPage) {
                      setCurrentSlug('gifts-factory');
                      setIsCategoryOpen(true);
                    } else {
                      setCurrentSlug('gifts-factory');
                      navigate(withLocalePath('/recenzii'));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }
                  if (index === 4) window.open('tel:0748777776', '_self');
                }}
                data-track-action={`A apasat pe ${label} din bottom nav.`}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all hover:scale-110 active:scale-95 ${
                  index === 2 ? 'relative -mt-5' : ''
                }`}
              >
                {index === 2 ? (
                  <div className="gold-gradient flex h-12 w-12 items-center justify-center rounded-full shadow-lg">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  item.icon && <item.icon className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-[10px] ${index === 2 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <MobileMenuModal
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onOpenCategories={() => {
          setCurrentSlug('gifts-factory');
          setIsCategoryOpen(true);
        }}
      />
      <MobileCategorySheet isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} />
      <MobileSearchSheet isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';

export default MobileBottomNav;
