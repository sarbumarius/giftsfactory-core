import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DesktopHeader from '@/components/desktop/DesktopHeader';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import { useShopContext } from '@/contexts/ShopContext';
import { fetchProductDetailsCached } from '@/services/api';
import { ProductDetailResponse } from '@/types/api';

const DesktopWishlistPage = () => {
  const navigate = useNavigate();
  const { wishlist, cart, removeFromWishlist } = useShopContext();
  const [products, setProducts] = useState<Record<string, ProductDetailResponse>>({});

  useEffect(() => {
    document.title = 'Wishlist | Daruri Alese Catalog';
  }, []);

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
    <div className="min-h-screen bg-white pb-16">
      <DesktopHeader />
      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Wishlist</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">Produsele salvate</h1>
          </div>
          <div className="rounded-full border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground">
            {wishlist.length} produse
          </div>
        </div>

        <div className="mt-6">
          {wishlist.length === 0 ? (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
              Wishlist-ul este gol.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {wishlist.map((item, index) => {
                const product = products[item.slug];
                if (!product) {
                  return (
                    <div key={item.id} className="rounded-2xl border border-border bg-card/30 p-4 animate-pulse">
                      <div className="aspect-square rounded-xl bg-muted/60" />
                      <div className="mt-3 h-3 w-24 rounded bg-muted/60" />
                      <div className="mt-2 h-3 w-16 rounded bg-muted/60" />
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

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            data-track-action="A apasat inapoi din wishlist desktop."
            className="rounded-full border border-border bg-white px-10 py-3 text-sm font-semibold text-foreground shadow-sm"
          >
            Inapoi
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesktopWishlistPage;
