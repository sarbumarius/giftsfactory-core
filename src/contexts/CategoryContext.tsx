import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ApiResponse, ApiProduct, MeiliCategoryHit, MeiliProductHit } from '@/types/api';
import { fetchCategoryDataCached, searchMeili, prefetchSubcategories, prefetchCategoryData } from '@/services/api';
import { tiktokSearch } from '@/utils/tiktok';
import { fbSearch } from '@/utils/facebook';
import { getLocale, stripLocalePrefix } from '@/utils/locale';

export type SortType = 'popularitate' | 'cele-mai-noi' | 'pret-crescator' | 'pret-descrescator' | 'reduceri';

interface CategoryContextType {
  data: ApiResponse | null;
  sortedProducts: ApiProduct[];
  filteredProducts: ApiProduct[];
  loading: boolean;
  error: string | null;
  searchResults: { categories: MeiliCategoryHit[]; products: MeiliProductHit[] };
  searchLoading: boolean;
  searchError: string | null;
  priceBounds: { min: number; max: number };
  priceFilterMin: number;
  priceFilterMax: number;
  currentSlug: string;
  currentSort: SortType;
  selectedTypeSlug: string | null;
  searchQuery: string;
  setCurrentSlug: (slug: string) => void;
  setCurrentSort: (sort: SortType) => void;
  setSelectedTypeSlug: (slug: string | null) => void;
  setSearchQuery: (query: string) => void;
  setPriceFilterMin: (value: number) => void;
  setPriceFilterMax: (value: number) => void;
  resetFilters: () => void;
  refetch: () => void;
  getBestsellerProduct: () => ApiProduct | null;
  getPopularProduct: () => ApiProduct | null;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

interface CategoryProviderProps {
  children: ReactNode;
  initialSlug?: string;
}

export const CategoryProvider = ({ children, initialSlug = 'gifts-factory' }: CategoryProviderProps) => {
  const slugMapKey = 'slug_en_map';
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  const [pathname, setPathname] = useState(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname;
  });
  const resolveInitialSlug = () => {
    if (typeof window === 'undefined') return initialSlug;
    const normalizedPath = stripLocalePrefix(window.location.pathname);
    const match = normalizedPath.match(/^\/categorie\/([^/]+)/);
    if (match?.[1]) {
      const slugFromPath = decodeURIComponent(match[1]);
      if (window.location.pathname.startsWith('/en')) {
        try {
          const stored = window.localStorage.getItem(slugMapKey);
          const map = stored ? (JSON.parse(stored) as Record<string, string>) : {};
          return map[slugFromPath] || slugFromPath;
        } catch {
          return slugFromPath;
        }
      }
      return slugFromPath;
    }
    return initialSlug;
  };
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string>(resolveInitialSlug);
  const [currentSort, setCurrentSort] = useState<SortType>('popularitate');
  const [selectedTypeSlug, setSelectedTypeSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ categories: MeiliCategoryHit[]; products: MeiliProductHit[] }>({
    categories: [],
    products: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [priceFilterMin, setPriceFilterMin] = useState(0);
  const [priceFilterMax, setPriceFilterMax] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCategoryDataCached(currentSlug);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentSlug]);

  useEffect(() => {
    prefetchSubcategories(87);
  }, []);

  useEffect(() => {
    if (!data?.info?.subcategorii?.length) return;
    const subcategoriesWithProducts = data.info.subcategorii.filter(
      (subcategory) => subcategory.count_produse && subcategory.count_produse > 0
    );
    if (!subcategoriesWithProducts.length) return;

    subcategoriesWithProducts.forEach((subcategory, index) => {
      setTimeout(() => {
        prefetchCategoryData(subcategory.slug);
      }, 150 * index);
    });
  }, [data]);

  useEffect(() => {
    setSelectedTypeSlug(null);
  }, [currentSlug]);

  useEffect(() => {
    setSearchQuery('');
  }, [currentSlug]);

  useEffect(() => {
    if (!data || !selectedTypeSlug) return;
    const hasApiType = data.info.tipuri?.some((tip) => tip.slug === selectedTypeSlug);
    if (hasApiType) return;

    const hasAttributeType = (data.produse || []).some((product) =>
      product.attributes?.some(
        (attr) =>
          attr.name?.toLowerCase() === 'tip' &&
          attr.options?.some((opt) => slugify(opt) === selectedTypeSlug)
      )
    );

    if (!hasAttributeType) {
      setSelectedTypeSlug(null);
    }
  }, [data, selectedTypeSlug]);

  useEffect(() => {
    if (!data?.info) return;
    if (data.info.slug_en) {
      try {
        const stored = window.localStorage.getItem(slugMapKey);
        const map = stored ? (JSON.parse(stored) as Record<string, string>) : {};
        map[data.info.slug_en] = data.info.slug;
        window.localStorage.setItem(slugMapKey, JSON.stringify(map));
      } catch {
        // ignore storage errors
      }
    }
    const path = stripLocalePrefix(pathname);
    if (path !== '/' && !path.startsWith('/categorie')) {
      return;
    }
    const defaultTitle = '';
    const locale = getLocale();
    const titleValue =
      locale === 'en' ? data.info.title_en ?? data.title_en : data.info.titlu;
    const descriptionValue =
      locale === 'en'
        ? data.info.desc_en ?? data.desc_en
        : data.info.descriere;
    const title = titleValue;
    document.title = title;

    const rawDescription = descriptionValue || '';
    const cleanDescription = rawDescription
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const description =
      cleanDescription.length > 0 ? cleanDescription.slice(0, 160) : defaultTitle;

    const upsertMeta = (selector: string, attrs: Record<string, string>, content: string) => {
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        Object.entries(attrs).forEach(([key, value]) => {
          meta.setAttribute(key, value);
        });
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');
    if (data.info.imagine) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image' }, data.info.imagine);
    }
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    if (data.info.imagine) {
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, data.info.imagine);
    }
    if (typeof window !== 'undefined') {
      upsertMeta('meta[property="og:url"]', { property: 'og:url' }, window.location.href);
    }
  }, [data, pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePathname = () => {
      setPathname(window.location.pathname);
    };

    const historyAny = window.history as History & { __patched?: boolean };
    if (!historyAny.__patched) {
      historyAny.__patched = true;
      const originalPushState = historyAny.pushState;
      const originalReplaceState = historyAny.replaceState;
      historyAny.pushState = function pushState(...args) {
        const result = originalPushState.apply(this, args);
        window.dispatchEvent(new Event('locationchange'));
        return result;
      };
      historyAny.replaceState = function replaceState(...args) {
        const result = originalReplaceState.apply(this, args);
        window.dispatchEvent(new Event('locationchange'));
        return result;
      };
    }

    window.addEventListener('popstate', updatePathname);
    window.addEventListener('locationchange', updatePathname);

    return () => {
      window.removeEventListener('popstate', updatePathname);
      window.removeEventListener('locationchange', updatePathname);
    };
  }, []);

  const refetch = () => {
    fetchData();
  };

  const resetFilters = () => {
    setCurrentSort('popularitate');
    setSelectedTypeSlug(null);
    setSearchQuery('');
    setPriceFilterMin(priceBounds.min);
    setPriceFilterMax(priceBounds.max);
  };

  const priceBounds = useMemo(() => {
    if (!data || data.produse.length === 0) {
      return { min: 0, max: 0 };
    }
    const prices = data.produse.map((product) => parseFloat(product.pret));
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [data]);

  useEffect(() => {
    setPriceFilterMin(priceBounds.min);
    setPriceFilterMax(priceBounds.max);
  }, [priceBounds.min, priceBounds.max]);

  // Sort products based on current sort type
  const sortedProducts = useMemo(() => {
    if (!data) return [];

    const products = [...data.produse];

    switch (currentSort) {
      case 'popularitate':
        // Sort by sales first, then by rating
        return products.sort((a, b) => {
          const salesDiff = b.vanzari - a.vanzari;
          if (salesDiff !== 0) return salesDiff;
          return parseFloat(b.rating) - parseFloat(a.rating);
        });

      case 'cele-mai-noi':
        // Sort by sales (fewer sales = newer), then by id (higher id = newer)
        return products.sort((a, b) => {
          const salesDiff = a.vanzari - b.vanzari;
          if (salesDiff !== 0) return salesDiff;
          return b.id - a.id;
        });

      case 'pret-crescator':
        return products.sort((a, b) => parseFloat(a.pret) - parseFloat(b.pret));

      case 'pret-descrescator':
        return products.sort((a, b) => parseFloat(b.pret) - parseFloat(a.pret));

      case 'reduceri':
        return products.sort((a, b) => {
          const aPrice = parseFloat(a.pret);
          const bPrice = parseFloat(b.pret);
          const aReduced = a.pret_redus ? parseFloat(a.pret_redus) : null;
          const bReduced = b.pret_redus ? parseFloat(b.pret_redus) : null;
          const aHasDiscount = typeof aReduced === 'number' && aReduced !== aPrice;
          const bHasDiscount = typeof bReduced === 'number' && bReduced !== bPrice;

          if (aHasDiscount !== bHasDiscount) {
            return aHasDiscount ? -1 : 1;
          }

          const aOriginal = aHasDiscount ? Math.max(aPrice, aReduced as number) : aPrice;
          const bOriginal = bHasDiscount ? Math.max(bPrice, bReduced as number) : bPrice;
          const aDiscount = aHasDiscount ? (aOriginal - Math.min(aPrice, aReduced as number)) : 0;
          const bDiscount = bHasDiscount ? (bOriginal - Math.min(bPrice, bReduced as number)) : 0;

          return bDiscount - aDiscount;
        });

      default:
        return products;
    }
  }, [data, currentSort]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    let products = sortedProducts;

    if (selectedTypeSlug) {
      const selectedType = data.info.tipuri?.find((tip) => tip.slug === selectedTypeSlug);
      if (selectedType && selectedType.produse_slugs.length > 0) {
        const allowedSlugs = new Set(selectedType.produse_slugs);
        products = products.filter((product) => allowedSlugs.has(product.slug));
      } else {
        products = products.filter((product) =>
          product.attributes?.some(
            (attr) =>
              attr.name?.toLowerCase() === 'tip' &&
              attr.options?.some((opt) => slugify(opt) === selectedTypeSlug)
          )
        );
      }
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return products;

    return products.filter((product) => {
      const titleMatch = product.titlu.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = (product.descriere || '').toLowerCase().includes(normalizedQuery);
      const shortDescriptionMatch = (product.descriere_scurta || '').toLowerCase().includes(normalizedQuery);
      const tagsMatch = (product.taguri || []).some((tag) =>
        tag.nume.toLowerCase().includes(normalizedQuery)
      );

      return titleMatch || descriptionMatch || shortDescriptionMatch || tagsMatch;
    });
  }, [data, selectedTypeSlug, searchQuery, sortedProducts]);

  const priceFilteredProducts = useMemo(() => {
    if (priceBounds.min === priceBounds.max) return filteredProducts;
    return filteredProducts.filter((product) => {
      const price = parseFloat(product.pret);
      return price >= priceFilterMin && price <= priceFilterMax;
    });
  }, [filteredProducts, priceBounds.min, priceBounds.max, priceFilterMin, priceFilterMax]);

  useEffect(() => {
    const term = searchQuery.trim();

    if (!term) {
      setSearchResults({ categories: [], products: [] });
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    let isActive = true;
    const debounceTimer = setTimeout(() => {
      setSearchLoading(true);
      setSearchError(null);

      searchMeili(term)
        .then((results) => {
          if (!isActive) return;
          setSearchResults({
            categories: results.categories,
            products: results.products,
          });
          setSearchLoading(false);

          tiktokSearch(term);
          fbSearch(term);
        })
        .catch((err) => {
          if (!isActive) return;
          setSearchResults({ categories: [], products: [] });
          setSearchLoading(false);
          setSearchError(err instanceof Error ? err.message : 'Failed to search');
        });
    }, 350);

    return () => {
      isActive = false;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery]);

  const getActiveProducts = () => {
    if (!data) return [];
    return priceFilteredProducts;
  };

  // Get the bestseller product (highest sales)
  const getBestsellerProduct = () => {
    const products = getActiveProducts();
    if (products.length === 0) return null;
    return [...products].sort((a, b) => b.vanzari - a.vanzari)[0];
  };

  // Get the popular product (most reviews)
  // If the bestseller is also the most reviewed, get the second most reviewed product
  const getPopularProduct = () => {
    const products = getActiveProducts();
    if (products.length === 0) return null;

    const bestseller = getBestsellerProduct();
    const sortedByReviews = [...products].sort((a, b) => b.nr_recenzii - a.nr_recenzii);

    // If the most reviewed product is the same as bestseller, return the second one
    if (sortedByReviews.length > 0 && sortedByReviews[0].id === bestseller?.id) {
      return sortedByReviews.length > 1 ? sortedByReviews[1] : null;
    }

    return sortedByReviews[0];
  };

  return (
    <CategoryContext.Provider
      value={{
        data,
        sortedProducts,
        filteredProducts: priceFilteredProducts,
        loading,
        error,
        searchResults,
        searchLoading,
        searchError,
        priceBounds,
        priceFilterMin,
        priceFilterMax,
        currentSlug,
        currentSort,
        selectedTypeSlug,
        searchQuery,
        setCurrentSlug,
        setCurrentSort,
        setSelectedTypeSlug,
        setSearchQuery,
        setPriceFilterMin,
        setPriceFilterMax,
        resetFilters,
        refetch,
        getBestsellerProduct,
        getPopularProduct,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
};
