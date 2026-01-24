import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import DesktopDiscountBanner from '@/components/desktop/DesktopDiscountBanner';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { fetchSubcategoriesCached } from '@/services/api';
import { SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';
import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import DesktopSidebar from '@/components/desktop/DesktopSidebar';
import DesktopTopBar from '@/components/desktop/DesktopTopBar';
import { Slider } from '@/components/ui/slider';
import { getLocale, LocaleCode, setLocale, stripLocalePrefix, withLocalePath } from '@/utils/locale';
import { getSortLabel, t } from '@/utils/translations';

const DesktopCategoryPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const {
    data,
    loading,
    filteredProducts,
    currentSort,
    setCurrentSort,
    priceBounds,
    priceFilterMin,
    priceFilterMax,
    setPriceFilterMin,
    setPriceFilterMax,
    searchQuery,
    setSearchQuery,
    setCurrentSlug,
  } = useCategoryContext();
  const [priceRange, setPriceRange] = useState<[number, number]>([
    priceFilterMin || priceBounds.min,
    priceFilterMax || priceBounds.max,
  ]);
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [layoutPadding, setLayoutPadding] = useState(60);
  const layoutMaxWidth = 1500;
  const layoutMaxHeight = 1081;
  const [locale, setLocaleState] = useState<LocaleCode>(getLocale());
  const subcategoryScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const categoryTitle = data?.info?.titlu ?? 'Categoria';
  const categoryDescription = (data?.info?.descriere || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const localeCategoryTitle = locale === 'en' ? data?.info?.title_en ?? data?.title_en ?? '' : categoryTitle;
  const parentCategory = data?.info?.parinte;
  const subcategories =
    data?.info?.subcategorii?.filter((subcategory) => subcategory.count_produse && subcategory.count_produse > 0) ||
    [];
  const getCategoryTitle = (category: SubcategoryTreeNode) =>
    locale === 'en' ? category.title_en ?? category.titlu : category.titlu;
  const getCategorySlug = (category: SubcategoryTreeNode) =>
    locale === 'en' ? category.slug_en ?? category.slug : category.slug;

  const displayProducts = useMemo(() => filteredProducts, [filteredProducts]);
  const sortCategories = (nodes: SubcategoryTreeNode[]) => {
    return [...nodes].sort((a, b) => {
      const countA = a.subcategorii?.length ?? 0;
      const countB = b.subcategorii?.length ?? 0;
      if (countA !== countB) return countA - countB;
      return a.titlu.localeCompare(b.titlu);
    });
  };

  const handleLocaleChange = (nextLocale: LocaleCode) => {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    setLocaleState(nextLocale);
    if (typeof window === 'undefined') return;
    const path = stripLocalePrefix(window.location.pathname);
    const isCategoryPath = path.startsWith('/categorie/') || path.startsWith('/category/');
    let nextPath = withLocalePath(path, nextLocale);
    if (isCategoryPath && data?.info?.slug) {
      if (nextLocale === 'en') {
        const slugEn = data.info.slug_en || data.info.slug;
        nextPath = `/en/category/${slugEn}`;
      } else {
        nextPath = `/categorie/${data.info.slug}`;
      }
    }
    window.location.assign(`${nextPath}${window.location.search}${window.location.hash}`);
  };

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
    const container = subcategoryScrollRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    };

    updateScrollState();
    container.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [subcategories.length]);

  useEffect(() => {
    const nextMin = priceFilterMin || priceBounds.min;
    const nextMaxRaw = priceFilterMax || priceBounds.max;
    const nextMax = nextMaxRaw < nextMin ? nextMin : nextMaxRaw;
    setPriceRange([nextMin, nextMax]);
  }, [priceBounds.min, priceBounds.max, priceFilterMin, priceFilterMax]);

  useEffect(() => {
    const updatePadding = () => {
      if (typeof window === 'undefined') return;
      setLayoutPadding(window.innerHeight < 1000 ? 30 : 60);
    };
    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);

  const getLevelBgClass = (level: number) => {
    if (level === 0) return 'bg-white';
    if (level === 1) return 'bg-[#f6f5fc]';
    return 'bg-[#ece8f7]';
  };

  const renderCategory = (category: SubcategoryTreeNode, level: number = 0, highlightSlugs?: Set<string>) => {
    if ((category.nr_produse ?? 0) === 0) {
      return null;
    }
    const hasChildren = category.subcategorii?.length > 0;
    const indentClass = '';
    const isCurrent = category.slug === data?.info?.slug;
    const displaySlug = getCategorySlug(category);
    const displayTitle = getCategoryTitle(category);
    const isHighlighted = highlightSlugs?.has(displaySlug);

    return (
      <div key={category.id}>
        <button
          className={`w-full min-w-0 flex items-center gap-3 p-3 ${getLevelBgClass(level)} hover:bg-[#d2c8ec] transition-colors ${indentClass}`}
          data-track-action={`A apasat pe categoria ${displayTitle}.`}
          onClick={() => {
            setCurrentSlug(category.slug);
            const targetPath = locale === 'en' ? `/en/category/${displaySlug}` : `/categorie/${displaySlug}`;
            navigate(targetPath);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img
            src={category.imagine}
            alt={displayTitle}
            className="h-8 w-8 object-contain flex-shrink-0"
          />
          <div className="min-w-0 flex-1 text-left">
            <h3 className={`text-sm ${isHighlighted || isCurrent ? 'font-bold' : 'font-medium'} text-foreground`}>
              {displayTitle}
            </h3>
            <p className="text-xs text-muted-foreground">{category.nr_produse} {t('category.products')}</p>
          </div>
          {hasChildren && (
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0" />
          )}
        </button>

        {hasChildren && (
          <div>
            {sortCategories(category.subcategorii).map((child) =>
              renderCategory(child, level + 1, highlightSlugs)
            )}
          </div>
        )}
      </div>
    );
  };

  const searchResults = useMemo(() => {
    if (!categorySearch.trim() || !treeData) {
      return {
        nodes: [] as SubcategoryTreeNode[],
        highlightedSlugs: new Set<string>(),
      };
    }

    const query = categorySearch.toLowerCase();
    const parentById = new Map<number, SubcategoryTreeNode>();
    const allNodes: SubcategoryTreeNode[] = [];

    const walk = (nodes: SubcategoryTreeNode[], parent?: SubcategoryTreeNode) => {
      nodes.forEach((node) => {
        allNodes.push(node);
        if (parent) {
          parentById.set(node.id, parent);
        }
        if (node.subcategorii?.length) {
          walk(node.subcategorii, node);
        }
      });
    };

    walk(treeData.subcategorii);

    const matches = allNodes.filter((node) => {
      const title = getCategoryTitle(node).toLowerCase();
      const slug = getCategorySlug(node).toLowerCase();
      return title.includes(query) || slug.includes(query);
    });

    const highlightedSlugs = new Set(matches.map((node) => getCategorySlug(node)));
    const resultMap = new Map<number, SubcategoryTreeNode>();

    matches.forEach((node) => {
      const parent = parentById.get(node.id);
      if (parent) {
        resultMap.set(parent.id, parent);
      } else {
        resultMap.set(node.id, node);
      }
    });

    const reorderNode = (node: SubcategoryTreeNode): SubcategoryTreeNode => {
      if (!node.subcategorii?.length) {
        return node;
      }

      const reorderedChildren = [...node.subcategorii].sort((a, b) => {
        const aMatch = highlightedSlugs.has(a.slug) ? 1 : 0;
        const bMatch = highlightedSlugs.has(b.slug) ? 1 : 0;
        return bMatch - aMatch;
      });

      return {
        ...node,
        subcategorii: reorderedChildren.map(reorderNode),
      };
    };

    return {
      nodes: Array.from(resultMap.values()).map(reorderNode),
      highlightedSlugs,
    };
  }, [categorySearch, treeData]);

  const orderedCategories = useMemo(() => {
    if (!treeData?.subcategorii || !data?.info?.slug) {
      return treeData?.subcategorii || [];
    }

    let found: SubcategoryTreeNode | null = null;

    const removeAndCollect = (nodes: SubcategoryTreeNode[]): SubcategoryTreeNode[] => {
      return nodes.reduce<SubcategoryTreeNode[]>((acc, node) => {
        if (node.slug === data.info.slug) {
          found = node;
          return acc;
        }

        if (node.subcategorii?.length) {
          const nextChildren = removeAndCollect(node.subcategorii);
          if (nextChildren !== node.subcategorii) {
            acc.push({ ...node, subcategorii: nextChildren });
            return acc;
          }
        }

        acc.push(node);
        return acc;
      }, []);
    };

    const pruned = removeAndCollect(treeData.subcategorii);

    return found ? [found, ...pruned] : treeData.subcategorii;
  }, [treeData, data?.info?.slug]);

  return (
    <div
      className="h-screen overflow-hidden"
      style={{ backgroundColor: '#c7bae8' }}
    >
      <main
        className="mx-auto h-full w-full flex items-center justify-center"
        style={{
          padding: `${layoutPadding}px`,
          maxWidth: `${layoutMaxWidth}px`,
          backgroundImage: `linear-gradient(90deg, #c7bae8 0%, #c7bae8 calc(${layoutPadding}px + 0.15 * (100% - ${
            layoutPadding * 2
          }px)), #f7e0e8 calc(${layoutPadding}px + 0.15 * (100% - ${
            layoutPadding * 2
          }px)), #f7e0e8 100%)`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100%',
        }}
      >
        <div
          className="grid grid-cols-[15%_65%_20%] gap-0 overflow-hidden rounded-2xl "
          style={{
            height: `min(calc(100vh - ${layoutPadding * 2}px), ${layoutMaxHeight}px)`,
          }}
        >
          <DesktopSidebar
            locale={locale}
            onLocaleChange={handleLocaleChange}
            onLogoClick={() => {
              setCurrentSlug('gifts-factory');
              navigate(withLocalePath('/'));
            }}
          />

          <section className="contentmijloc min-h-full border-r border-border bg-white flex flex-col">
            <DesktopTopBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchOpen={() => setIsSearchOpen(true)}
              onMenuClick={() => setIsMenuOpen(true)}
              onWishlistClick={() => navigate('/wishlist')}
              onCartClick={() => navigate('/cos')}
              wishlistCount={wishlist.length}
              cartCount={cart.length}
            />


            <div className="relative mb-6 -mt-6  bg-white p-6 pt-2 pb-2 overflow-hidden ">
            {data?.info?.imagine && (
              <img
                src={data.info.imagine}
                alt={localeCategoryTitle}
                className="pointer-events-none absolute right-6 top-1/2 h-32 w-32 -translate-y-1/2 object-contain opacity-10"
                loading="lazy"
              />
            )}
            <div className="flex items-start justify-between gap-6 ">
              <div>
                <h1 className="text-3xl font-semibold text-foreground font-serif">{localeCategoryTitle}</h1>
                {parentCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetSlug = locale === 'en' ? parentCategory.slug_en || parentCategory.slug : parentCategory.slug;
                      setCurrentSlug(parentCategory.slug);
                      const targetPath = locale === 'en' ? `/en/category/${targetSlug}` : `/categorie/${targetSlug}`;
                      navigate(targetPath);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    data-track-action={`A apasat pe parintele categoriei ${parentCategory.titlu}.`}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {locale === 'en' ? parentCategory.title_en ?? '' : parentCategory.titlu}
                  </button>
                )}
              </div>
            </div>
          </div>
          {subcategories.length > 0 && (
            <div className="mb-6 mx-4">
              <div className="relative">
                <div
                  ref={subcategoryScrollRef}
                  className="subcategory-scroll flex gap-3 overflow-x-auto pb-3 pr-16 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#f3edf9] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#6844c1]/70 [&::-webkit-scrollbar-thumb]:hover:bg-[#6844c1]"
                  style={{ scrollbarColor: '#6844c1 #f3edf9', scrollbarWidth: 'thin' }}
                >
                {subcategories.map((subcategory) => {
                  const title = locale === 'en' ? subcategory.title_en ?? '' : subcategory.titlu;
                  const targetSlug = locale === 'en' ? subcategory.slug_en || subcategory.slug : subcategory.slug;
                  return (
                    <button
                      key={subcategory.slug}
                      type="button"
                      onClick={() => {
                        setCurrentSlug(subcategory.slug);
                        const targetPath = locale === 'en' ? `/en/category/${targetSlug}` : `/categorie/${targetSlug}`;
                        navigate(targetPath);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      data-track-action={`A apasat pe subcategoria ${subcategory.titlu}.`}
                      className="relative w-[220px] flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-white p-4 text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {subcategory.imagine && (
                        <img
                          src={subcategory.imagine}
                          alt={subcategory.titlu}
                          className="absolute -bottom-4 -right-2 h-20 w-20 object-contain opacity-10"
                          loading="lazy"
                        />
                      )}
                      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                      <div className="mt-2 inline-flex rounded-full bg-[#f1f1f1] px-2 py-1 text-[11px] font-semibold text-[#6844c1]">
                        {subcategory.count_produse} {t('category.products')}
                      </div>
                    </button>
                  );
                })}
                </div>
                {canScrollRight && (
                  <>
                    <div className="pointer-events-none absolute bottom-0 right-0 h-10 w-16 bg-gradient-to-l from-white via-white/80 to-transparent" />
                    <button
                      type="button"
                      data-track-action="A apasat pe scroll in subcategorii."
                      className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-[#6844c1] px-3 py-2 text-xs font-semibold text-white shadow-md transition-transform hover:scale-105"
                      aria-label="Scroll la dreapta"
                      onClick={() => {
                        subcategoryScrollRef.current?.scrollBy({ left: 260, behavior: 'smooth' });
                      }}
                    >
                      {'>'}
                    </button>
                  </>
                )}
                {canScrollLeft && (
                  <>
                    <div className="pointer-events-none absolute bottom-0 left-0 h-10 w-16 bg-gradient-to-r from-white via-white/80 to-transparent" />
                    <button
                      type="button"
                      data-track-action="A apasat pe scroll in subcategorii."
                      className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-[#6844c1] px-3 py-2 text-xs font-semibold text-white shadow-md transition-transform hover:scale-105"
                      aria-label="Scroll la stanga"
                      onClick={() => {
                        subcategoryScrollRef.current?.scrollBy({ left: -260, behavior: 'smooth' });
                      }}
                    >
                      {'<'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}



          <div className="flex-1 overflow-y-auto pb-20">
            {loading && (
              <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground mx-4">
                {t('category.loadingProducts')}
              </div>
            )}

            {!loading && displayProducts.length === 0 && (
              <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground mx-4">
                {t('category.noProductsInCategory')}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 mx-4">
              {displayProducts.map((product, index) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  desktopSequence={displayProducts}
                />
              ))}
            </div>

            {categoryDescription && (
              <div className="mt-10 rounded-2xl border border-border bg-white p-6 mx-4">
                <p className="text-sm text-muted-foreground">{categoryDescription}</p>
              </div>
            )}
          </div>

          <div className="w-full border-t border-border bg-white px-4 py-3 filtrare">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
              <select
                value={currentSort}
                onChange={(event) => setCurrentSort(event.target.value as typeof currentSort)}
                data-track-action="Sortare desktop."
                className="rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground"
              >
                <option value="popularitate">{getSortLabel('popularitate')}</option>
                <option value="cele-mai-noi">{getSortLabel('cele-mai-noi')}</option>
                <option value="pret-crescator">{getSortLabel('pret-crescator')}</option>
                <option value="pret-descrescator">{getSortLabel('pret-descrescator')}</option>
                <option value="reduceri">{getSortLabel('reduceri')}</option>
              </select>
              <div className="flex flex-col gap-2 min-w-[260px] max-w-sm">
                <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                  <span>
                    {t('filters.minPlaceholder')}: {priceRange[0]}
                  </span>
                  <span>
                    {t('filters.maxPlaceholder')}: {priceRange[1]}
                  </span>
                </div>
                <Slider
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={1}
                  value={priceRange}
                  onValueChange={(value) => {
                    if (value.length === 2) {
                      const nextMin = Math.max(priceBounds.min, value[0]);
                      const nextMax = Math.min(priceBounds.max, value[1]);
                      const clamped: [number, number] = [
                        Math.min(nextMin, nextMax),
                        Math.max(nextMin, nextMax),
                      ];
                      setPriceRange(clamped);
                      setPriceFilterMin(clamped[0]);
                      setPriceFilterMax(clamped[1]);
                    }
                  }}
                  data-track-action="Filtru pret slider desktop."
                />
              </div>
            </div>
          </div>

          </section>
          <aside className="sidebar2 min-h-full border-l border-border bg-white">
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
                className="category-scroll flex-1 overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#6844c1]/60 [&::-webkit-scrollbar-thumb]:hover:bg-[#6844c1]/80"
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
                      {sortCategories(searchResults.nodes).map((cat) =>
                        renderCategory(cat, 0, searchResults.highlightedSlugs)
                      )}
                    </div>
                  )
                ) : (
                  <div>
                    {sortCategories(orderedCategories).map((cat) => renderCategory(cat))}
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#6844c1]/20 via-white/80 to-transparent" />
              <button
                type="button"
                data-track-action="A apasat pe scroll in categorii."
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-[#6844c1] px-3 py-2 text-xs font-semibold text-white shadow-md transition-transform hover:scale-105"
                aria-label="Scroll in jos"
                onClick={(event) => {
                  const container = (event.currentTarget.parentElement?.querySelector('.category-scroll') as HTMLElement | null);
                  if (container) {
                    container.scrollBy({ top: 240, behavior: 'smooth' });
                  }
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

export default DesktopCategoryPage;
