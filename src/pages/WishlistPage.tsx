import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileProductHeader from '@/components/mobile/MobileProductHeader';
import { useShopContext } from '@/contexts/ShopContext';
import { fetchProductDetailsCached } from '@/services/api';
import { ProductDetailResponse } from '@/types/api';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import MobileSearchSheet from '@/components/mobile/MobileSearchSheet';
import { useCategoryContext } from '@/contexts/CategoryContext';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlist, cart, removeFromWishlist } = useShopContext();
  const { setCurrentSlug } = useCategoryContext();
  const [products, setProducts] = useState<Record<string, ProductDetailResponse>>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    let isActive = true;
    const loadDetails = async () => {
      await Promise.all(
        wishlist.map(async (item) => {
          if (products[item.slug]) return;
          const details = await fetchProductDetailsCached(item.slug);
          if (!isActive) return;
          setProducts((prev) => ({ ...prev, [item.slug]: details }));
        })
      );
    };
    if (wishlist.length > 0) {
      loadDetails().catch(() => undefined);
    }
    return () => {
      isActive = false;
    };
  }, [wishlist, products]);

  return (
    <div className="min-h-screen bg-white pb-4">
      <MobileProductHeader
        title="Wishlist"
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
      <div className="px-4 pt-6 pb-20">
        {wishlist.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
            Wishlist-ul este gol.
          </div>
        ) : (
          <div className={`grid gap-3 ${wishlist.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {wishlist.map((item, index) => {
              const product = products[item.slug];
              if (!product) {
                return (
                  <div key={item.id} className="rounded-xl border border-border bg-card/30 animate-pulse">
                    <div className="aspect-square bg-muted/60 rounded-xl" />
                    <div className="p-3">
                      <div className="h-3 w-24 rounded bg-muted/60" />
                      <div className="mt-2 h-3 w-16 rounded bg-muted/60" />
                    </div>
                  </div>
                );
              }
              return (
                <MobileProductCard
                  key={item.id}
                  product={product}
                  index={index}
                  overlayAction={
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeFromWishlist(item.id);
                      }}
                      data-track-action={`A sters produsul ${item.title} din wishlist.`}
                      className="w-full rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur"
                    >
                      Sterge
                    </button>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
      <div className="fixed bottom-4 left-4 right-4 z-40">
        <button
          type="button"
          onClick={() => navigate(-1)}
          data-track-action="A apasat inapoi din wishlist."
          className="w-full rounded-full border border-border bg-white py-3 text-sm font-semibold text-foreground shadow-md"
        >
          Inapoi
        </button>
      </div>
      <MobileSearchSheet isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default WishlistPage;
