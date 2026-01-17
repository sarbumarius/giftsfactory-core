import { X, Search } from 'lucide-react';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useNavigate } from 'react-router-dom';
import MobileMeiliProductCard from './MobileMeiliProductCard';

interface MobileSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSearchSheet = ({ isOpen, onClose }: MobileSearchSheetProps) => {
  const { searchQuery, setSearchQuery, searchResults, searchLoading, setCurrentSlug } = useCategoryContext();
  const navigate = useNavigate();

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

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 h-[75vh] rounded-t-2xl bg-white shadow-2xl animate-slide-up flex flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cauta produse sau categorii..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              data-track-action="A cautat in search sheet"
              className="w-full rounded-lg bg-muted py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              onClose();
            }}
            data-track-action="A inchis search sheet."
            className="rounded-full p-2 transition-colors hover:bg-muted"
            aria-label="Inchide"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!searchQuery.trim() ? (
            <p className="text-sm text-muted-foreground">Introdu un termen pentru cautare.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Categorii gasite</p>
                {searchLoading ? (
                  <p className="mt-2 text-sm text-muted-foreground">Se cauta...</p>
                ) : searchResults.categories.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Nu am gasit categorii.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {searchResults.categories.map((category) => (
                      <button
                        key={category.url}
                        type="button"
                        onClick={() => {
                          const slug = getSlugFromUrl(category.url);
                          if (slug) {
                            setCurrentSlug(slug);
                            onClose();
                            navigate(`/categorie/${slug}`);
                          }
                        }}
                        data-track-action={`A deschis categoria ${category.name} din cautare.`}
                        className="block w-full rounded-md bg-white px-3 py-2 text-left text-sm text-foreground shadow-sm transition-colors hover:bg-amber-100"
                      >
                        <span className="font-medium">{category.name}</span>
                        {typeof category.count === 'number' && (
                          <span className="ml-2 text-xs text-muted-foreground">({category.count})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {(searchLoading || searchResults.products.length > 0) && (
                <div className="rounded-lg border border-border bg-white p-3">
                  <p className="text-sm font-semibold text-foreground">Produse gasite</p>
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
                            if (slug) {
                              onClose();
                              navigate(`/produs/${slug}`);
                            }
                          }}
                          trackAction={`A deschis produsul ${product.title} din cautare.`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileSearchSheet;
