import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileProductHeader from '@/components/mobile/MobileProductHeader';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import { ApiProduct } from '@/types/api';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { ArrowLeft, ChevronDown, Copy, Check, ArrowRight } from 'lucide-react';

interface CouponProduct {
  id: number;
  titlu: string;
  slug: string;
  pret: string;
  pret_redus: string | null;
  end_sale: string | null;
  imagine_principala: {
    full: string;
    '300x300': string;
    '100x100': string;
  };
  rating: string;
  vanzari: number;
  dimensiune: {
    lungime: string;
    latime: string;
    inaltime: string;
  };
  nr_recenzii: number;
  average_recenzii: string;
}

interface DiscountCoupon {
  cod: string;
  discount_type: string;
  amount: string;
  discount_text: string;
  descriere: string;
  data_expirare: string;
  usage_limit: number;
  usage_count: number;
  conditii: string[];
  produse: CouponProduct[];
}

interface DiscountsResponse {
  produse_la_reducere: ApiProduct[];
  cupoane: DiscountCoupon[];
}

const DiscountsPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const { setCurrentSlug, searchQuery } = useCategoryContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [data, setData] = useState<DiscountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCoupons, setOpenCoupons] = useState<Record<string, { conditions: boolean; products: boolean }>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const defaultCategorySlug = 'gifts-factory';

  const getCouponCategorySlug = (conditions: string[]) => {
    const match = conditions.find((cond) => cond.toLowerCase().includes('doar pentru'));
    if (!match) return defaultCategorySlug;
    const raw = match.split(':')[1]?.trim() || '';
    if (!raw) return defaultCategorySlug;
    const first = raw.split(',')[0]?.trim() || '';
    if (!first) return defaultCategorySlug;
    return first
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const toggleCouponSection = (code: string, key: 'conditions' | 'products') => {
    setOpenCoupons((prev) => {
      const current = prev[code] ?? { conditions: true, products: false };
      return { ...prev, [code]: { ...current, [key]: !current[key] } };
    });
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((prev) => (prev === code ? null : prev)), 1500);
    } catch {
      setCopiedCode(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    fetch('/cache_app/reduceri.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load discounts');
        }
        return res.json();
      })
      .then((json) => {
        if (!isMounted) return;
        setData(json);
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || loading) return;
    const id = window.requestAnimationFrame(() => {
      const target = document.getElementById('discount-products');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [searchQuery, loading]);

  const filteredDiscountProducts = useMemo(() => {
    if (!data) return [];
    const term = searchQuery.trim().toLowerCase();
    if (!term) return data.produse_la_reducere;
    return data.produse_la_reducere.filter((product) => {
      const titleMatch = product.titlu.toLowerCase().includes(term);
      const descriptionMatch = (product.descriere || '').toLowerCase().includes(term);
      const shortDescriptionMatch = (product.descriere_scurta || '').toLowerCase().includes(term);
      const tagsMatch = (product.taguri || []).some((tag) => tag.nume.toLowerCase().includes(term));
      return titleMatch || descriptionMatch || shortDescriptionMatch || tagsMatch;
    });
  }, [data, searchQuery]);

  return (
    <div className="min-h-screen bg-white pb-24">
      <MobileProductHeader
        title="Reduceri"
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

      <div className="px-4 pt-4 space-y-6">
        {loading && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
              Se incarca reducerile...
            </div>
            <div className="space-y-4">
              {[...Array(2)].map((_, idx) => (
                <div key={`coupon-skel-${idx}`} className="rounded-2xl border border-border bg-white p-4 animate-pulse">
                  <div className="h-4 w-40 rounded-full bg-muted" />
                  <div className="mt-3 h-12 w-full rounded-xl border border-dashed border-muted bg-muted/40" />
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-32 rounded-full bg-muted" />
                    <div className="h-3 w-56 rounded-full bg-muted" />
                    <div className="h-3 w-48 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, idx) => (
                <div key={`product-skel-${idx}`} className="rounded-2xl border border-border bg-white p-3 animate-pulse">
                  <div className="h-32 w-full rounded-xl bg-muted" />
                  <div className="mt-3 h-3 w-24 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            Nu am putut incarca reducerile.
          </div>
        )}

        {!loading && !error && data && (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">

                <h2 className="font-serif text-xl font-semibold text-foreground"> {data.cupoane.length} cupoane active </h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold gold-gradient text-white">
                  {data.produse_la_reducere.length} produse
                </span>
              </div>
              {data.cupoane.length === 0 ? (
                <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
                  Nu sunt cupoane active momentan.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.cupoane.map((coupon) => {
                    const openState = openCoupons[coupon.cod] ?? { conditions: true, products: false };
                    return (
                      <div key={coupon.cod} className="rounded-2xl border border-border bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xl font-semibold text-foreground">{coupon.discount_text}</p>
                          {coupon.data_expirare && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              Exp: {coupon.data_expirare.split(' ')[0]}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3">
                          <div>
                            <p className="text-[11px] font-semibold text-amber-800">Cod cupon</p>
                            <p className="text-xl uppercase font-bold text-foreground">{coupon.cod}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.cod)}
                            data-track-action={`A copiat cuponul ${coupon.cod}.`}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-semibold text-amber-800"
                          >
                            {copiedCode === coupon.cod ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copiat
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copiaza
                              </>
                            )}
                          </button>
                        </div>

                        <div className="mt-3 space-y-2">
                          <button
                            type="button"
                            onClick={() => toggleCouponSection(coupon.cod, 'conditions')}
                            data-track-action={`A deschis conditiile cuponului ${coupon.cod}.`}
                            className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground"
                          >
                            Conditii ({coupon.conditii.length})
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${openState.conditions ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {openState.conditions && (
                            <ul className="space-y-1 pl-2 text-xs text-muted-foreground">
                              {coupon.conditii.map((conditie, idx) => (
                                <li key={`${coupon.cod}-cond-${idx}`} className="flex gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  <span>{conditie}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="mt-3 space-y-2">
                          <button
                            type="button"
                            onClick={() => toggleCouponSection(coupon.cod, 'products')}
                            data-track-action={`A deschis produsele pentru cuponul ${coupon.cod}.`}
                            className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground"
                          >
                            Vezi produse
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${openState.products ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {openState.products && coupon.produse?.length > 0 && (
                            <div className="mt-2 -mx-4">
                              <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                                {coupon.produse.slice(0, 10).map((product) => {
                                  const imageUrl =
                                    product.imagine_principala['300x300'] ||
                                    product.imagine_principala.full ||
                                    product.imagine_principala['100x100'];

                                  return (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => navigate(`/produs/${product.slug}`)}
                                      data-track-action={`A deschis produsul ${product.titlu} din cupon.`}
                                      className="flex w-40 shrink-0 flex-col rounded-xl border border-border bg-white text-left shadow-sm"
                                    >
                                      <div className="w-full overflow-hidden rounded-xl">
                                        <img
                                          src={imageUrl}
                                          alt={product.titlu}
                                          className="h-full w-full object-cover"
                                          loading="lazy"
                                        />
                                      </div>
                                    </button>
                                  );
                                })}
                                {coupon.produse.length >= 10 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const slug = getCouponCategorySlug(coupon.conditii);
                                      setCurrentSlug(slug);
                                      navigate(`/categorie/${slug}`);
                                    }}
                                    data-track-action={`A mers la categoria cuponului ${coupon.cod}.`}
                                    className="flex w-40 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-white text-center text-xs font-semibold text-muted-foreground"
                                  >
                                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                                    <span className="font-serif text-foreground">Vezi mai multe produse</span>
                                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-foreground font-serif">
                                      Mergi la categorie
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-2" id="discount-products">
              <h2 className="text-center font-serif text-base font-semibold text-foreground">PRODUSE LA REDUCERE</h2>
              {filteredDiscountProducts.length === 0 ? (
                <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
                  {searchQuery.trim()
                    ? 'Nu am gasit produse la reducere pentru cautarea ta.'
                    : 'Nu sunt produse la reducere momentan.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredDiscountProducts.map((product, index) => (
                    <MobileProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate(-1)}
        data-track-action="A apasat inapoi din pagina de reduceri."
        className="fixed left-0 top-[75%] z-40 flex h-12 w-10 items-center justify-center rounded-r-md border-r border-border bg-white text-muted-foreground shadow"
        aria-label="Inapoi"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <MobileBottomNav />
    </div>
  );
};

export default DiscountsPage;
