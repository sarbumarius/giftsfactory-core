import { useEffect, useState } from 'react';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useNavigate } from 'react-router-dom';
import MobileProductCard from './MobileProductCard';
import MobileMeiliProductCard from './MobileMeiliProductCard';
import PromoBanner, {SHOW_PROMO_BANNER} from "@/components/PromoBanner.tsx";
import { withLocalePath } from '@/utils/locale';

const MobileProductGrid = () => {
  const navigate = useNavigate();
  const {
    filteredProducts,
    loading,
    error,
    getBestsellerProduct,
    getPopularProduct,
    selectedTypeSlug,
    searchQuery,
    searchResults,
    searchLoading,
    currentSort,
    priceBounds,
    priceFilterMin,
    priceFilterMax,
    setCurrentSort,
    setPriceFilterMin,
    setPriceFilterMax,
    setCurrentSlug,
    data,
    setSelectedTypeSlug,
  } = useCategoryContext();
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    setShowAllCategories(false);
  }, [searchQuery]);

  const getSlugFromUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || '';
    } catch {
      const parts = url.split('/').filter(Boolean);
      return parts[parts.length - 1] || '';
    }
  };

  if (error) {
    return (
      <div className="px-2 py-4 productGridDaruri">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center text-destructive">
            <p>Eroare la analizarea produselor: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const isFiltersReady = data ? (priceBounds.max === 0 ? true : priceFilterMax > 0) : false;

  if (loading || !data || !isFiltersReady) {
    return (
      <div className="px-2 py-4 productGridDaruri">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex flex-col animate-pulse">
              <div className="relative overflow-hidden rounded-xl bg-card border-4 border-border">
                <div className="aspect-square bg-muted/60" />
                <div className="px-3 py-2">
                  <div className="h-3 w-20 rounded bg-muted/60 mx-auto" />
                </div>
              </div>
              <div className="mt-2 px-1">
                <div className="h-3 w-24 rounded bg-muted/60 mx-auto" />
                <div className="mt-2 h-3 w-16 rounded bg-muted/60 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasSearchQuery = searchQuery.trim().length > 0;
  const bestsellerProduct = getBestsellerProduct();
  const popularProduct = getPopularProduct();
  const activeFilters: { key: string; label: string }[] = [];

  if (currentSort !== 'popularitate') {
    const sortLabels: Record<string, string> = {
      'cele-mai-noi': 'Cele mai noi',
      'pret-crescator': 'Pret crescator',
      'pret-descrescator': 'Pret descrescator',
      reduceri: 'Reduceri primele',
    };
    activeFilters.push({
      key: 'sort',
      label: `Sortare: ${sortLabels[currentSort] || currentSort}`,
    });
  }

  if (priceFilterMin !== priceBounds.min || priceFilterMax !== priceBounds.max) {
    activeFilters.push({
      key: 'price',
      label: `Pret: ${priceFilterMin} - ${priceFilterMax} RON`,
    });
  }

  if (selectedTypeSlug) {
    const typeLabel =
      data?.info.tipuri?.find((tip) => tip.slug === selectedTypeSlug)?.nume || selectedTypeSlug;
    activeFilters.push({
      key: 'type',
      label: `Tip: ${typeLabel}`,
    });
  }

  const suggestedCategories = searchResults.categories.filter(
    (category) => typeof category.count !== 'number' || category.count > 0
  );
  const visibleCategories = showAllCategories ? suggestedCategories : suggestedCategories.slice(0, 3);
  const hasMeiliResults = suggestedCategories.length > 0 || searchResults.products.length > 0;
  const shouldShowEmptyState =
    filteredProducts.length === 0 && (!hasSearchQuery || (!searchLoading && !hasMeiliResults));

  return (
    <div className="px-2 py-4 productGridDaruri">

      {SHOW_PROMO_BANNER && <PromoBanner />}
      {activeFilters.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => {
                if (filter.key === 'sort') {
                  setCurrentSort('popularitate');
                }
                if (filter.key === 'price') {
                  setPriceFilterMin(priceBounds.min);
                  setPriceFilterMax(priceBounds.max);
                }
                if (filter.key === 'type') {
                  setSelectedTypeSlug(null);
                }
              }}
              className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
            >
              {filter.label}
              <span className="rounded-full bg-amber-200 px-1 text-[10px] text-amber-900">x</span>
            </button>
          ))}
        </div>
      )}
      {shouldShowEmptyState ? (
        <div className="flex items-center justify-center min-h-[160px]">
          <p className="text-muted-foreground">
            {selectedTypeSlug ? 'Nu exista produse pentru tipul selectat.' : 'Nu exista produse disponibile.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product, index) => (
            <MobileProductCard
              key={product.id}
              product={product}
              index={index}
              isBestseller={bestsellerProduct?.id === product.id}
              isPopular={popularProduct?.id === product.id}
            />
          ))}
        </div>
      )}

      {hasSearchQuery && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-800">Categorii sugerate</p>
            {searchLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Se cauta...</p>
            ) : suggestedCategories.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nu am gasit categorii.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {visibleCategories.map((category) => (
                  <button
                    key={category.url}
                    type="button"
                    onClick={() => {
                      const slug = getSlugFromUrl(category.url);
                      if (!slug) return;
                      setCurrentSlug(slug);
                      navigate(withLocalePath(`/categorie/${slug}`));
                    }}
                    className="block w-full rounded-md bg-white px-3 py-2 text-left text-sm text-foreground shadow-sm transition-colors hover:bg-amber-100"
                  >
                    <span className="font-medium">{category.name}</span>
                    {typeof category.count === 'number' && (
                      <span className="ml-2 text-xs text-muted-foreground">({category.count})</span>
                    )}
                  </button>
                ))}
                {!showAllCategories && suggestedCategories.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories(true)}
                    className="block w-full rounded-md border border-amber-200 px-3 py-2 text-left text-sm text-amber-800 transition-colors hover:bg-amber-100"
                  >
                    Vezi restul sugestiilor
                  </button>
                )}
              </div>
            )}
          </div>

          {(searchLoading || searchResults.products.length > 0) && (
            <div className="rounded-lg border border-border bg-white p-3">
              <p className="text-sm font-semibold text-foreground">Produse sugerate</p>
              {searchLoading ? (
                <p className="mt-2 text-sm text-muted-foreground">Se cauta...</p>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {searchResults.products.map((product, index) => (
                    <MobileMeiliProductCard
                      key={product.url}
                      product={product}
                      index={index}
                      onClick={() => {
                        const slug = getSlugFromUrl(product.url);
                        if (!slug) return;
                        navigate(withLocalePath(`/produs/${slug}`));
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileProductGrid;
