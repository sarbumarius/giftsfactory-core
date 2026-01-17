import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileProductHeader from '@/components/mobile/MobileProductHeader';
import MobileSearchSheet from '@/components/mobile/MobileSearchSheet';
import { useShopContext } from '@/contexts/ShopContext';
import { useCategoryContext } from '@/contexts/CategoryContext';

const AccountPage = () => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cart, wishlist } = useShopContext();
  const { setCurrentSlug } = useCategoryContext();

  return (
    <div className="min-h-screen bg-white pb-4">
      <MobileProductHeader
        title="Cont"
        onBack={() => navigate(-1)}
        onSearchClick={() => setIsSearchOpen(true)}
        onLogoClick={() => {
          setCurrentSlug('gifts-factory');
          navigate('/');
        }}
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        onCartClick={() => navigate('/cos')}
        onWishlistClick={() => navigate('/wishlist')}
      />
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-sm text-muted-foreground">
        Pagina de cont este in lucru.
      </div>
      <div className="fixed bottom-4 left-4 right-4 z-40">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full rounded-full border border-border bg-white py-3 text-sm font-semibold text-foreground shadow-md"
        >
          Inapoi
        </button>
      </div>
      <MobileSearchSheet isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default AccountPage;
