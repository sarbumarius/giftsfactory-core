import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, Copy, Search, Star } from 'lucide-react';
import DesktopSidebar from '@/components/desktop/DesktopSidebar';
import DesktopTopBar from '@/components/desktop/DesktopTopBar';
import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { fetchSubcategoriesCached } from '@/services/api';
import { ApiProduct, SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';
import { getLocale, withLocalePath } from '@/utils/locale';
import { t } from '@/utils/translations';

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
  const { cart, wishlist } = useShopContext();
  const { setCurrentSlug, searchQuery, setSearchQuery } = useCategoryContext();
  const [data, setData] = useState<DiscountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCoupons, setOpenCoupons] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const locale = getLocale();

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
    document.title = t('discounts.pageTitle');
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
    if (treeData) return;
    let isActive = true;
    setIsLoadingCategories(true);
    setCategoryError(null);
    fetchSubcategoriesCached(87)
      .then((response) => {
        if (!isActive) return;
        setTreeData(response);
        setIsLoadingCategories(false);
      })
      .catch((err) => {
        if (!isActive) return;
        setCategoryError(err instanceof Error ? err.message : 'Nu am putut incarca categoriile.');
        setIsLoadingCategories(false);
      });
    return () => {
      isActive = false;
    };
  }, [treeData]);

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

  const sortCategories = (nodes: SubcategoryTreeNode[]) => {
    return [...nodes].sort((a, b) => {
      const countA = a.subcategorii?.length ?? 0;
      const countB = b.subcategorii?.length ?? 0;
      if (countA !== countB) return countA - countB;
      return a.titlu.localeCompare(b.titlu);
    });
  };

  const renderCategory = (category: SubcategoryTreeNode) => {
    if ((category.nr_produse ?? 0) === 0) {
      return null;
    }
    const title = locale === 'en' ? category.title_en ?? '' : category.titlu;
    const targetSlug = locale === 'en' ? category.slug_en || category.slug : category.slug;
    const hasChildren = category.subcategorii?.length > 0;
    const productLabel =
      (category.nr_produse ?? 0) === 1 ? t('category.product') : t('category.products');

    return (
      <div key={category.id}>
        <button
          className="w-full min-w-0 flex items-center gap-3 p-3 bg-white hover:bg-muted/50 transition-colors"
          data-track-action={`A apasat pe categoria ${category.titlu}.`}
          onClick={() => {
            setCurrentSlug(category.slug);
            const targetPath = locale === 'en' ? `/en/category/${targetSlug}` : `/categorie/${targetSlug}`;
            navigate(targetPath);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img
            src={category.imagine}
            alt={category.titlu}
            className="h-8 w-8 object-contain flex-shrink-0"
          />
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{category.nr_produse} {productLabel}</p>
          </div>
          {hasChildren && (
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0" />
          )}
        </button>

        {hasChildren && (
          <div>
            {sortCategories(category.subcategorii).map((child) => renderCategory(child))}
          </div>
        )}
      </div>
    );
  };

  const searchResults = useMemo(() => {
    if (!categorySearch.trim() || !treeData) {
      return {
        nodes: [] as SubcategoryTreeNode[],
      };
    }

    const query = categorySearch.toLowerCase();
    const allNodes: SubcategoryTreeNode[] = [];

    const walk = (nodes: SubcategoryTreeNode[]) => {
      nodes.forEach((node) => {
        allNodes.push(node);
        if (node.subcategorii?.length) {
          walk(node.subcategorii);
        }
      });
    };

    walk(treeData.subcategorii);

    const matches = allNodes.filter((node) => {
      return node.titlu.toLowerCase().includes(query) || node.slug.toLowerCase().includes(query);
    });

    return {
      nodes: matches,
    };
  }, [categorySearch, treeData]);

  const orderedCategories = useMemo(() => {
    if (!treeData?.subcategorii) return [];
    return sortCategories(treeData.subcategorii);
  }, [treeData]);

  return (
    <div
      className="h-screen overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(90deg, #c7bae8 0%, #c7bae8 calc(60px + 0.15 * (100% - 120px)), #f7e0e8 calc(60px + 0.15 * (100% - 120px)), #f7e0e8 100%)',
      }}
    >
      <main className="mx-auto h-full w-full px-[60px] py-[60px]">
        <div className="grid h-[calc(100vh-120px)] grid-cols-[15%_65%_20%] gap-0 overflow-hidden rounded-2xl">
          <DesktopSidebar />

          <section className="min-h-full border-r border-border bg-white flex flex-col">
            <DesktopTopBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchOpen={() => setIsSearchOpen(true)}
              onMenuClick={() => setIsMenuOpen(true)}
              onWishlistClick={() => navigate(withLocalePath('/wishlist'))}
              onCartClick={() => navigate(withLocalePath('/cos'))}
              wishlistCount={wishlist.length}
              cartCount={cart.length}
            />

            <div className="flex-1 overflow-y-auto pb-6">
              <div className="mx-4 rounded-2xl border border-border bg-amber-50/40 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  {t('discounts.title')}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                  <h1 className="text-3xl font-semibold text-foreground font-serif">
                    {t('discounts.headline')}
                  </h1>
                  {data && (
                    <div className="flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-foreground">
                      <Star className="h-4 w-4 text-amber-500" />
                      {t('discounts.summary', {
                        coupons: data.cupoane.length,
                        products: data.produse_la_reducere.length,
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 mx-4 grid grid-cols-[0.9fr_1.4fr] gap-6">
                <aside className="space-y-6">
                  {loading && (
                    <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
                      {t('discounts.loading')}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                      {t('discounts.error')}
                    </div>
                  )}

                  {!loading && !error && data && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-foreground font-serif">
                          {t('discounts.activeCoupons', { count: data.cupoane.length })}
                        </h2>
                      </div>
                      {data.cupoane.length === 0 ? (
                        <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
                          {t('discounts.noCoupons')}
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
                                      {t('discounts.expiry', { date: coupon.data_expirare.split(' ')[0] })}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3">
                                  <div>
                                    <p className="text-[11px] font-semibold text-amber-800">
                                      {t('discounts.couponCodeLabel')}
                                    </p>
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
                                        {t('discounts.copied')}
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        {t('discounts.copy')}
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
                                  {t('discounts.details')}
                                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isOpen && (
                                  <div className="mt-4 space-y-4 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                                    <div>
                                      <p className="text-xs font-semibold uppercase text-foreground">
                                        {t('discounts.conditions')}
                                      </p>
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
                                        <p className="mt-2">{t('discounts.noConditions')}</p>
                                      )}
                                    </div>

                                    <div>
                                      <p className="text-xs font-semibold uppercase text-foreground">
                                        {t('discounts.includedProducts')}
                                      </p>
                                      <div className="mt-3 grid grid-cols-2 gap-3">
                                        {coupon.produse.map((product) => (
                                          <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => {
                                              setCurrentSlug(product.slug);
                                              navigate(withLocalePath(`/produs/${product.slug}`));
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

                <section className="space-y-6">
                  <div id="discount-products" className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-3">
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
          </section>

          <aside className="min-h-full border-l border-border bg-white">
            <div className="relative flex h-full flex-col">
              <div className="border-b border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('nav.categories')}
                </p>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('search.categoriesPlaceholder')}
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                    data-track-action="A folosit cautarea in categorii."
                    className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div
                ref={categoryScrollRef}
                className="category-scroll flex-1 overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#6844c1]/60 [&::-webkit-scrollbar-thumb]:hover:bg-[#6844c1]"
                style={{ scrollbarColor: '#6844c1 #ffffff', scrollbarWidth: 'thin' }}
              >
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                    {t('category.loadingCategories')}
                  </div>
                ) : categoryError ? (
                  <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                    {categoryError}
                  </div>
                ) : categorySearch.trim() ? (
                  searchResults.nodes.length === 0 ? (
                    <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                      {t('search.noCategories')}
                    </div>
                  ) : (
                    <div>
                      {sortCategories(searchResults.nodes).map((cat) => renderCategory(cat))}
                    </div>
                  )
                ) : (
                  <div>
                    {orderedCategories.map((cat) => renderCategory(cat))}
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#6844c1]/20 via-white/80 to-transparent" />
              <button
                type="button"
                data-track-action="A apasat pe scroll in categorii."
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-[#6844c1] px-3 py-2 text-xs font-semibold text-white shadow-md transition-transform hover:scale-105"
                aria-label="Scroll in jos"
                onClick={() => {
                  categoryScrollRef.current?.scrollBy({ top: 240, behavior: 'smooth' });
                }}
              >
                v
              </button>
            </div>
          </aside>
        </div>
      </main>
      <DesktopSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default DesktopDiscountsPage;
