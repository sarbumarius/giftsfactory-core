import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Copy, Star } from 'lucide-react';
import DesktopHeader from '@/components/desktop/DesktopHeader';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { ApiProduct } from '@/types/api';

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

const DesktopDiscountsPage = () => {
  const navigate = useNavigate();
  const { setCurrentSlug, searchQuery } = useCategoryContext();
  const [data, setData] = useState<DiscountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCoupons, setOpenCoupons] = useState<Record<string, boolean>>({});
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
      .replace(/[^a-z0-9\\s-]/g, '')
      .trim()
      .replace(/\\s+/g, '-');
  };

  const toggleCoupon = (code: string) => {
    setOpenCoupons((prev) => ({ ...prev, [code]: !prev[code] }));
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
    document.title = 'Reduceri | Daruri Alese Catalog';
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
    <div className="min-h-screen bg-white pb-16 ">
      <DesktopHeader />

      <div className="  px-8 py-8 ">

        <div className="mt-8 grid grid-cols-10 gap-8  max-w-7xl m-auto ">
          <aside className="space-y-6 col-span-3">
            {loading && (
              <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
                Se incarca reducerile...
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Nu am putut incarca reducerile.
              </div>
            )}

            {!loading && !error && data && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground font-serif">{data.cupoane.length} cupoane active</h2>

                </div>
                {data.cupoane.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
                    Nu sunt cupoane active momentan.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.cupoane.map((coupon) => {
                      const isOpen = Boolean(openCoupons[coupon.cod]);
                      return (
                        <div key={coupon.cod} className="rounded-2xl border border-border bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xl font-semibold text-foreground">{coupon.discount_text}</p>
                            {coupon.data_expirare && (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                                Exp: {coupon.data_expirare.split(' ')[0]}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3">
                            <div>
                              <p className="text-[11px] font-semibold text-amber-800">Cod cupon</p>
                              <p className="text-2xl uppercase font-bold text-foreground">{coupon.cod}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(coupon.cod)}
                              data-track-action={`A copiat cuponul ${coupon.cod}.`}
                              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-800"
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

                          <button
                            type="button"
                            onClick={() => toggleCoupon(coupon.cod)}
                            data-track-action={`A deschis detaliile cuponului ${coupon.cod}.`}
                            className="mt-4 flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground"
                          >
                            Detalii cupon
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isOpen && (
                            <div className="mt-4 space-y-4 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                              <div>
                                <p className="text-xs font-semibold uppercase text-foreground">Conditii</p>
                                {coupon.conditii.length > 0 ? (
                                  <ul className="mt-2 space-y-2">
                                    {coupon.conditii.map((item) => (
                                      <li key={item} className="flex gap-2">
                                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-2">Nu exista conditii speciale.</p>
                                )}
                              </div>

                              <div>
                                <p className="text-xs font-semibold uppercase text-foreground">Produse incluse</p>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                  {coupon.produse.map((product) => (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => {
                                        setCurrentSlug(product.slug);
                                        window.location.href = `/produs/${product.slug}`;
                                      }}
                                      data-track-action={`A deschis produsul ${product.titlu} din cupon.`}
                                      className="flex items-center gap-3 rounded-xl bg-white p-3 text-left"
                                    >
                                      <img
                                        src={
                                          product.imagine_principala['300x300'] ||
                                          product.imagine_principala.full ||
                                          product.imagine_principala['100x100']
                                        }
                                        alt={product.titlu}
                                        className="h-16 w-16 rounded-xl object-cover"
                                        loading="lazy"
                                      />
                                      <div>
                                        <p className="text-xs font-semibold text-foreground">{product.titlu}</p>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                          {product.pret_redus || product.pret} lei
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </aside>

          <section className="space-y-6 col-span-7">
            <div className="rounded-3xl border border-border bg-amber-50/40 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Reduceri</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-semibold text-foreground font-serif">Cupoane si produse la reducere.</h1>
                {data && (
                    <div className="flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-foreground">
                      <Star className="h-4 w-4 text-amber-500" />
                      {data.cupoane.length} cupoane active · {data.produse_la_reducere.length} produse
                    </div>
                )}
              </div>
            </div>




            <div id="discount-products" className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-4">
              {filteredDiscountProducts.map((product, index) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  desktopSequence={filteredDiscountProducts}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DesktopDiscountsPage;
