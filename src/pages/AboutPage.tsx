import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileProductHeader from '@/components/mobile/MobileProductHeader';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import { t } from '@/utils/translations';

const AboutPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const { setCurrentSlug } = useCategoryContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white pb-24">
      <MobileProductHeader
        title={t('about.title')}
        onBack={() => navigate(-1)}
        centerTitle
        onMenuClick={() => setIsMenuOpen(true)}
        onLogoClick={() => {
          setCurrentSlug('gifts-factory');
          navigate('/');
        }}
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        onCartClick={() => navigate('/cos')}
        onWishlistClick={() => navigate('/wishlist')}
      />

      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
          {t('about.placeholder')}
        </div>
      </div>

      <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default AboutPage;
