import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Heart, HelpCircle, Mail, Menu, MessageCircle, Phone, Plus, Search, ShoppingCart, Store, Tag, Users } from 'lucide-react';
import logo from '@/assets/factorygifts.svg';
import logoDaruri from '@/assets/logo-daruri.svg';
import DesktopDiscountBanner from '@/components/desktop/DesktopDiscountBanner';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { fetchSubcategoriesCached } from '@/services/api';
import { SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';
import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import { getLocale, LocaleCode, setLocale, stripLocalePrefix, withLocalePath } from '@/utils/locale';

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
  const [minInput, setMinInput] = useState(priceFilterMin.toString());
  const [maxInput, setMaxInput] = useState(priceFilterMax.toString());
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const displayProducts = useMemo(() => filteredProducts, [filteredProducts]);
  const menuItems = [
    { label: 'Categorii', href: '/', icon: Store, isDefaultCategory: true },

    { label: 'Recenzii', href: '/recenzii', icon: MessageCircle },
    { label: 'Intrebari frecvente', href: '/intrebari-frecvente', icon: HelpCircle },
    { label: 'Despre mine', href: '/despre-mine', icon: Users },
    { label: 'Creeaza produs', href: '/creeaza-produs', icon: Plus },
    { label: 'Contact', href: '/contact', icon: Phone },
  ];
  const flagSize = 'h-5 w-5';

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
    const nextPath = withLocalePath(path, nextLocale);
    window.location.assign(`${nextPath}${window.location.search}${window.location.hash}`);
  };

  const applyPriceFilters = () => {
    const nextMin = Number(minInput);
    const nextMax = Number(maxInput);
    if (!Number.isNaN(nextMin)) setPriceFilterMin(nextMin);
    if (!Number.isNaN(nextMax)) setPriceFilterMax(nextMax);
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
    if (priceFilterMin === 0 && priceBounds.min > 0) {
      setMinInput(priceBounds.min.toString());
    }
    if (priceFilterMax === 0 && priceBounds.max > 0) {
      setMaxInput(priceBounds.max.toString());
    }
  }, [priceBounds.min, priceBounds.max, priceFilterMin, priceFilterMax]);

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
    const isHighlighted = highlightSlugs?.has(category.slug);

    return (
      <div key={category.id}>
        <button
          className={`w-full min-w-0 flex items-center gap-3 p-3 ${getLevelBgClass(level)} hover:bg-[#d2c8ec] transition-colors ${indentClass}`}
          data-track-action={`A apasat pe categoria ${category.titlu}.`}
          onClick={() => {
            setCurrentSlug(category.slug);
            navigate(`/categorie/${category.slug}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img
            src={category.imagine}
            alt={category.titlu}
            className="h-8 w-8 object-contain flex-shrink-0"
          />
          <div className="min-w-0 flex-1 text-left">
            <h3 className={`text-sm ${isHighlighted || isCurrent ? 'font-bold' : 'font-medium'} text-foreground`}>
              {category.titlu}
            </h3>
            <p className="text-xs text-muted-foreground">{category.nr_produse} produse</p>
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
      return node.titlu.toLowerCase().includes(query) || node.slug.toLowerCase().includes(query);
    });

    const highlightedSlugs = new Set(matches.map((node) => node.slug));
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
      style={{
        backgroundImage:
          'linear-gradient(90deg, #c7bae8 0%, #c7bae8 calc(60px + 0.15 * (100% - 120px)), #f7e0e8 calc(60px + 0.15 * (100% - 120px)), #f7e0e8 100%)',
      }}
    >
      <main className="mx-auto h-full w-full px-[60px] py-[60px]">
        <div className="grid h-[calc(100vh-120px)] grid-cols-[15%_65%_20%] gap-0 overflow-hidden rounded-2xl ">
          <aside className="flex min-h-full flex-col border-r border-white/20 bg-[#6844c1]">
            <div className="border-b border-white/20 p-4">
              <button
                type="button"
                onClick={() => {
                  setCurrentSlug('gifts-factory');
                  navigate('/');
                }}
                data-track-action="A apasat pe logo din sidebar desktop."
                className="mt-4 flex w-full items-center justify-center"
              >
                <img src={logo} alt="Daruri Alese" className="h-22 w-auto" />
              </button>
              <div className="mt-4 flex items-center justify-center">
                <div className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => handleLocaleChange('ro')}
                    data-track-action="A selectat limba RO."
                    className={`overflow-hidden rounded-full transition-colors ${locale === 'ro' ? 'bg-white/30' : 'hover:bg-white/20 opacity-20'}`}
                    aria-label="Romana"
                  >
                    <img src="/flags/ro.png" alt="RO" className={`${flagSize} w-auto`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLocaleChange('en')}
                    data-track-action="A selectat limba EN."
                    className={`overflow-hidden rounded-full transition-colors ${locale === 'en' ? 'bg-white/30' : 'hover:bg-white/20 opacity-20'}`}
                    aria-label="English"
                  >
                    <img src="/flags/en.png" alt="EN" className={`${flagSize} w-auto`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pt-5 text-center text-base italic text-white/90 font-[cursive]">
              Arta transforma amintirile in obiecte care vorbesc despre oameni, momente si emotii.
              <div className="mt-3 text-xs uppercase tracking-[0.3em] text-white/70">
                - Daruri Alese
              </div>
            </div>

            <div className="flex flex-1 items-center">
              <nav className="w-full divide-y divide-white/15">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.isDefaultCategory) {
                          setCurrentSlug('gifts-factory');
                        }
                        navigate(item.href);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      data-track-action={`A apasat pe ${item.label} in sidebar desktop.`}
                      className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/70" />
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto flex flex-col border-t border-white/20 p-4">
              <a
                href="mailto:hello@sweetgifts.ro"
                data-track-action="A apasat pe email din sidebar desktop."
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
              >
                <Mail className="h-4 w-4" />
                hello@sweetgifts.ro
              </a>
                <button
                  type="button"
                  onClick={() => window.open('tel:0748777776', '_self')}
                  data-track-action="A apasat pe suna din sidebar desktop."
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <Phone className="h-4 w-4" />
                  0748.777.776
                </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-white/70">
                <img src={logoDaruri} alt="Daruri Alese" className="h-4 w-auto" />
                by Daruri Alese
              </div>
            </div>
          </aside>

          <section className="min-h-full border-r border-border bg-white flex flex-col">
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-gray-100 py-3 px-2">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                data-track-action="A deschis meniul desktop."
                className="rounded-full border border-border bg-white p-2 text-foreground transition-transform hover:scale-105"
                aria-label="Meniu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      if (!isSearchOpen) setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onClick={() => setIsSearchOpen(true)}
                    data-track-action="A deschis cautarea din content desktop."
                    placeholder="Cauta produse, categorii, idei de cadouri..."
                    className="w-full rounded-full border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => navigate('/wishlist')}
                    data-track-action="A apasat pe wishlist din content desktop."
                    className="relative rounded-full border border-border bg-white p-2 text-foreground transition-transform hover:scale-105"
                    aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                  {wishlist.length > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#6844c1] text-[11px] font-bold text-white">
                      {wishlist.length}
                    </span>
                  )}
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/cos')}
                    data-track-action="A apasat pe cos din content desktop."
                    className="relative rounded-full border border-border bg-white p-2 text-foreground transition-transform hover:scale-105"
                    aria-label="Cos"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cart.length > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#6844c1] text-[11px] font-bold text-white">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </div>


            <div className="mb-6 rounded-2xl border border-border bg-white p-6 mx-4">
            <div className="flex items-start justify-between gap-6 ">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categorie</p>
                  {parentCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetSlug = locale === 'en' ? parentCategory.slug_en || parentCategory.slug : parentCategory.slug;
                        setCurrentSlug(parentCategory.slug);
                        navigate(withLocalePath(`/categorie/${targetSlug}`));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      data-track-action={`A apasat pe parintele categoriei ${parentCategory.titlu}.`}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      {locale === 'en' ? parentCategory.title_en ?? '' : parentCategory.titlu}
                    </button>
                  )}
                </div>
                <h1 className="mt-2 text-3xl font-semibold text-foreground font-serif">{localeCategoryTitle}</h1>
              </div>
              <div className="rounded-full border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground">
                {displayProducts.length} produse
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
                        navigate(withLocalePath(`/categorie/${targetSlug}`));
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
                      <div className="mt-2 inline-flex rounded-full bg-[#f7e0e8] px-2 py-1 text-[11px] font-semibold text-[#6844c1]">
                        {subcategory.count_produse} {locale === 'en' ? 'products' : 'produse'}
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
                Se incarca produsele...
              </div>
            )}

            {!loading && displayProducts.length === 0 && (
              <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground mx-4">
                Nu am gasit produse in aceasta categorie.
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

          <div className="w-full border-t border-border bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
              <select
                value={currentSort}
                onChange={(event) => setCurrentSort(event.target.value as typeof currentSort)}
                data-track-action="Sortare desktop."
                className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground"
              >
                <option value="popularitate">Popularitate</option>
                <option value="cele-mai-noi">Cele mai noi</option>
                <option value="pret-crescator">Pret crescator</option>
                <option value="pret-descrescator">Pret descrescator</option>
                <option value="reduceri">Reduceri</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={minInput}
                  onChange={(event) => setMinInput(event.target.value)}
                  data-track-action="Filtru pret minim desktop."
                  className="w-20 rounded-full border border-border px-2 py-2 text-xs text-foreground"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  type="number"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={maxInput}
                  onChange={(event) => setMaxInput(event.target.value)}
                  data-track-action="Filtru pret maxim desktop."
                  className="w-20 rounded-full border border-border px-2 py-2 text-xs text-foreground"
                  placeholder="Max"
                />
              </div>
              <button
                type="button"
                onClick={applyPriceFilters}
                data-track-action="A aplicat filtrul de pret desktop."
                className="rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white"
              >
                Aplica
              </button>
            </div>
          </div>

          </section>
          <aside className="min-h-full border-l border-border bg-white">
            <div className="relative flex h-full flex-col">
              <div className="border-b border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categorii</p>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cauta categorii..."
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
                    Se incarca categoriile...
                  </div>
                ) : categoryError ? (
                  <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                    {categoryError}
                  </div>
                ) : categorySearch.trim() ? (
                  searchResults.nodes.length === 0 ? (
                    <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                      Nu am gasit categorii
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
