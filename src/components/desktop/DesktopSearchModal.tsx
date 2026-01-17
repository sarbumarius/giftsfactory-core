import { useEffect, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCategoryContext } from '@/contexts/CategoryContext';
import productImage from '@/assets/product-image.jpg';

interface DesktopSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DesktopSearchModal = ({ isOpen, onClose }: DesktopSearchModalProps) => {
  const { searchQuery, setSearchQuery, searchResults, searchLoading, setCurrentSlug } = useCategoryContext();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  const categoryCount = searchResults.categories.length;
  const productCount = searchResults.products.length;
  const hasQuery = searchQuery.trim().length > 0;

  const getAttributeValues = (product: typeof searchResults.products[number], key: string) => {
    if (!product.attributes) return null;
    const values = product.attributes[key];
    if (!values || !Array.isArray(values) || values.length === 0) return null;
    const cleaned = values.map((value) => String(value).trim()).filter(Boolean);
    return cleaned.length ? cleaned.join(', ') : null;
  };

  const products = useMemo(
    () =>
      searchResults.products.map((product) => ({
        ...product,
        image: product.image || productImage,
      })),
    [searchResults.products]
  );

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          setSearchQuery('');
          onClose();
        }}
      />
      <div className="fixed left-1/2 top-16 z-50 w-[min(1100px,92vw)] -translate-x-1/2 rounded-3xl border border-border bg-white shadow-2xl">
        <div className="flex items-center gap-4 border-b border-border px-6 py-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cauta produse sau categorii..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              data-track-action="A cautat in search desktop."
              className="w-full rounded-full border border-border bg-muted/40 py-3 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              onClose();
            }}
            data-track-action="A inchis search desktop."
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Inchide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-[320px_1fr] gap-6 px-6 py-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-900">Categorii</p>
              {hasQuery && (
                <span className="text-xs text-amber-700">
                  {searchLoading ? 'Se cauta...' : `${categoryCount} gasite`}
                </span>
              )}
            </div>
            {!hasQuery ? (
              <p className="mt-4 text-sm text-amber-900/70">Introdu un termen pentru cautare.</p>
            ) : searchLoading ? (
              <p className="mt-4 text-sm text-amber-900/70">Se cauta...</p>
            ) : categoryCount === 0 ? (
              <p className="mt-4 text-sm text-amber-900/70">Nu am gasit categorii.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {searchResults.categories.map((category) => (
                  <button
                    key={category.url}
                    type="button"
                    onClick={() => {
                      const slug = getSlugFromUrl(category.url);
                      if (!slug) return;
                      setCurrentSlug(slug);
                      setSearchQuery('');
                      onClose();
                      navigate(`/categorie/${slug}`);
                    }}
                    data-track-action={`A deschis categoria ${category.name} din cautare desktop.`}
                    className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm text-foreground shadow-sm transition-colors hover:bg-amber-100"
                  >
                    <span className="font-medium">{category.name}</span>
                    {typeof category.count === 'number' && (
                      <span className="text-xs text-muted-foreground">{category.count}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 pt-1 listProducts">

            {!hasQuery ? (
              <p className="mt-4 text-sm text-muted-foreground">Cauta un produs pentru a vedea rezultate.</p>
            ) : searchLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">Se cauta...</p>
            ) : productCount === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Nu am gasit produse.</p>
            ) : (
              <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  {products.map((product) => {
                    const tipText = getAttributeValues(product, 'pa_tip');
                    return (
                    <button
                      key={product.url}
                      type="button"
                      onClick={() => {
                        const slug = getSlugFromUrl(product.url);
                        if (!slug) return;
                        setSearchQuery('');
                        onClose();
                        navigate(`/produs/${slug}`);
                      }}
                      data-track-action={`A deschis produsul ${product.title} din cautare desktop.`}
                      className="group grid grid-cols-[1fr_1fr] items-center gap-3 rounded-2xl border border-border bg-white p-3 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="aspect-square overflow-hidden rounded-xl">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col justify-center gap-1">
                        <p className="text-sm font-semibold text-foreground group-hover:text-amber-700">
                          {product.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Tip: {tipText || '-'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          SKU: {product.sku || '-'}
                        </p>
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DesktopSearchModal;
