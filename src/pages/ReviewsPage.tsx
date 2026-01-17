import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Star } from 'lucide-react';
import MobileProductHeader from '@/components/mobile/MobileProductHeader';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import { removeJsonLd, upsertJsonLd } from '@/utils/structuredData';

interface ReviewImage {
  thumbnail: string;
  full: string;
}

interface ReviewItem {
  id_recenzie: string;
  id_produs: string;
  autor: string;
  data: string;
  rating: string;
  continut: string;
  verified: boolean;
  imagini?: ReviewImage[];
}

interface ProductSummary {
  id: number;
  titlu: string;
  slug: string;
  descriere?: string;
  descriere_scurta?: string;
  taguri?: { nume?: string; slug?: string }[];
  imagine_principala: {
    full: string;
    '300x300': string;
    '100x100': string;
  };
}

interface ReviewsResponse {
  recenzii_cu_poza: ReviewItem[];
  recenzii_text: ReviewItem[];
  produse_din_recenzii: ProductSummary[];
}

type ReviewTab = 'photos' | 'text';

const ReviewsPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const { data: categoryData, setCurrentSlug, loading: categoryLoading } = useCategoryContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewTab>('photos');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; author: string } | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const productScrollTimerRef = useRef<number | null>(null);
  const isLoading = loading || categoryLoading;

  useEffect(() => {
    let isMounted = true;

    fetch('/cache_app/recenzii.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load reviews');
        }
        return res.json();
      })
      .then((json) => {
        if (!isMounted) return;
        setData(json);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(true);
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
    setCurrentSlug('gifts-factory');
  }, [setCurrentSlug]);

  const allowedProductIds = useMemo(
    () => new Set((categoryData?.produse || []).map((product) => String(product.id))),
    [categoryData?.produse]
  );

  useEffect(() => {
    if (!data) return;
    const origin = window.location.origin;
    const allReviews = [...data.recenzii_cu_poza, ...data.recenzii_text];
    const filteredReviews = allowedProductIds.size
      ? allReviews.filter((review) => allowedProductIds.has(review.id_produs))
      : allReviews;
    const productsById = new Map(data.produse_din_recenzii.map((product) => [String(product.id), product]));

    const reviewItems = filteredReviews.slice(0, 20).map((review) => {
      const product = productsById.get(review.id_produs);
      const productUrl = product?.slug ? `${origin}/produs/${product.slug}` : undefined;
      const reviewItem: Record<string, unknown> = {
        '@type': 'Review',
        author: { '@type': 'Person', name: review.autor },
        datePublished: review.data,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: '5',
          worstRating: '1',
        },
        reviewBody: review.continut,
      };
      if (product) {
        reviewItem.itemReviewed = {
          '@type': 'Product',
          name: product.titlu,
          url: productUrl,
        };
      }
      return reviewItem;
    });

    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: 'Recenzii clienti',
          url: `${origin}/recenzii`,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: reviewItems.map((review, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: review,
            })),
          },
        },
        ...reviewItems,
      ],
    };

    upsertJsonLd('reviews', graph);

    return () => {
      removeJsonLd('reviews');
    };
  }, [data, allowedProductIds]);

  const reviewsByProduct = useMemo(() => {
    if (!data) return [];
    const combinedAll = [...data.recenzii_cu_poza, ...data.recenzii_text];
    const combined = allowedProductIds.size
      ? combinedAll.filter((review) => allowedProductIds.has(review.id_produs))
      : combinedAll;
    const counts = new Map<string, number>();
    combined.forEach((review) => {
      counts.set(review.id_produs, (counts.get(review.id_produs) || 0) + 1);
    });

    const baseAll = activeTab === 'photos' ? data.recenzii_cu_poza : data.recenzii_text;
    const base = allowedProductIds.size
      ? baseAll.filter((review) => allowedProductIds.has(review.id_produs))
      : baseAll;

    const grouped = new Map<string, ReviewItem[]>();
    base.forEach((review) => {
      const list = grouped.get(review.id_produs) || [];
      list.push(review);
      grouped.set(review.id_produs, list);
    });

    const productsAll = allowedProductIds.size
      ? data.produse_din_recenzii.filter((product) => allowedProductIds.has(String(product.id)))
      : data.produse_din_recenzii;

    const products = [...productsAll].sort((a, b) => {
      const aCount = counts.get(String(a.id)) || 0;
      const bCount = counts.get(String(b.id)) || 0;
      return bCount - aCount;
    });

    return products
      .map((product) => ({
        product,
        reviews: grouped.get(String(product.id)) || [],
      }))
      .filter((entry) => entry.reviews.length > 0);
  }, [activeTab, data, allowedProductIds, selectedProductId]);

  const summary = useMemo(() => {
    if (!data) return { total: 0, avg: 0 };
    const allReviewsAll = [...data.recenzii_cu_poza, ...data.recenzii_text];
    const allReviews = allowedProductIds.size
      ? allReviewsAll.filter((review) => allowedProductIds.has(review.id_produs))
      : allReviewsAll;
    if (allReviews.length === 0) return { total: 0, avg: 0 };
    const sum = allReviews.reduce((acc, review) => acc + Number(review.rating || 0), 0);
    return { total: allReviews.length, avg: sum / allReviews.length };
  }, [data, allowedProductIds]);

  const bestSellers = useMemo(() => {
    if (!data) return [];
    const allReviews = [...data.recenzii_cu_poza, ...data.recenzii_text];
    const filteredReviews = allowedProductIds.size
      ? allReviews.filter((review) => allowedProductIds.has(review.id_produs))
      : allReviews;
    const counts = new Map<string, number>();
    filteredReviews.forEach((review) => {
      counts.set(review.id_produs, (counts.get(review.id_produs) || 0) + 1);
    });
    const products = allowedProductIds.size
      ? data.produse_din_recenzii.filter((product) => allowedProductIds.has(String(product.id)))
      : data.produse_din_recenzii;
    return [...products].sort((a, b) => {
      const aCount = counts.get(String(a.id)) || 0;
      const bCount = counts.get(String(b.id)) || 0;
      return bCount - aCount;
    });
  }, [data, allowedProductIds]);

  const formatDate = (value: string) => {
    const [datePart] = value.split(' ');
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return value;
    return `${day}.${month}.${year}`;
  };

  const renderStars = (value: string) => {
    const rating = Math.round(parseFloat(value || '0'));
    return (
      <div className="flex items-center gap-[2px]">
        {[...Array(5)].map((_, starIndex) => (
          <svg
            key={starIndex}
            viewBox="0 0 24 24"
            className={starIndex < rating ? 'h-3 w-3 text-amber-500' : 'h-3 w-3 text-muted-foreground'}
            fill="currentColor"
          >
            <path d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-28">
      <MobileProductHeader
        title="Recenzii clienti"
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

      <div className="px-0 pt-2 space-y-5">


        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Se incarca recenziile...
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={`review-skel-${index}`}
                  className="rounded-2xl border border-border bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="h-3 w-24 rounded-full bg-muted" />
                      <div className="h-2 w-16 rounded-full bg-muted" />
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((__, starIndex) => (
                        <div key={starIndex} className="h-3 w-3 rounded-full bg-muted" />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-full rounded-full bg-muted" />
                    <div className="h-2 w-5/6 rounded-full bg-muted" />
                  </div>
                  <div className="mt-3 h-32 w-full rounded-xl bg-muted" />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            Nu am putut incarca recenziile.
          </div>
        )}

        {!isLoading && !error && reviewsByProduct.length === 0 && (
          <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
            Nu exista recenzii disponibile.
          </div>
        )}

        {!isLoading && !error && reviewsByProduct.length > 0 && (
          <div className="space-y-2">
            {reviewsByProduct.map(({ product, reviews }) => (
              <div
                key={product.id}
                id={`review-product-${product.id}`}
                className={`scroll-mt-28 pt-4 pb-4  ${selectedProductId === String(product.id) ? 'bg-muted/40' : ''}`}
              >
                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-3 snap-x snap-mandatory pl-4">
                    {[...reviews]
                      .filter((review) => (review.imagini?.length || 0) > 0)
                      .sort((a, b) => (b.continut?.length || 0) - (a.continut?.length || 0))
                      .map((review) => {
                      const hasImages = review.imagini && review.imagini.length > 0;
                      const imageUrl = hasImages
                        ? review.imagini![0].full || review.imagini![0].thumbnail
                        : '';
                      const content = review.continut?.trim();
                      const isExpanded = Boolean(expandedReviews[review.id_recenzie]);
                      const isLong = Boolean(content && content.length > 140);

                      return (
                        <div
                          key={review.id_recenzie}
                          className="min-w-[55%] w-[55%] p-0 flex-shrink-0 snap-center  overflow-hidden p-0 shadow-sm "
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {review.autor.split(/\s+/).slice(0, 2).join(' ')}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.data)}</p>
                            </div>

                          </div>     {renderStars(review.rating)}
                          {hasImages && (
                            <button
                              type="button"
                              onClick={() => setZoomImage({ url: imageUrl, author: review.autor })}
                              data-track-action="A deschis poza din recenzie."
                              className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/20"
                              aria-label="Deschide poza recenzie"
                            >
                              <img
                                src={imageUrl}
                                alt={review.autor}
                                className="aspect-square w-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          )}
                          {content && (
                            <div className="mt-3 text-sm text-foreground">
                              <p className={isExpanded ? '' : 'line-clamp-3'}>{content}</p>
                              {isLong && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedReviews((prev) => ({
                                      ...prev,
                                      [review.id_recenzie]: !prev[review.id_recenzie],
                                    }))
                                  }
                                  className="mt-1 text-xs font-semibold text-primary"
                                >
                                  {isExpanded ? 'Vezi mai putin' : 'Vezi mai mult'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {bestSellers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 gold-gradient px-2 py-2 backdrop-blur">
          <div
            className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
            onScroll={() => {
              if (productScrollTimerRef.current) {
                window.clearTimeout(productScrollTimerRef.current);
              }
              productScrollTimerRef.current = window.setTimeout(() => {
                if (window.rybbit?.event) {
                  window.rybbit.event('A derulat lista cu produse din recenzii.');
                }
              }, 400);
            }}
          >
            {bestSellers.map((product) => {
              const imageUrl =
                product.imagine_principala['300x300'] ||
                product.imagine_principala.full ||
                product.imagine_principala['100x100'];
              const isSelected = selectedProductId === String(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    const productId = String(product.id);
                    setSelectedProductId(productId);
                    const target = document.getElementById(`review-product-${productId}`);
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  data-track-action={`A selectat produsul ${product.titlu} din recenzii.`}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ${
                    isSelected ? 'ring-2 ring-emerald-300' : ''
                  }`}
                  aria-label={`Recenzii pentru ${product.titlu}`}
                >
                  <img src={imageUrl} alt={product.titlu} className="h-full w-full object-cover" loading="lazy" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate(-1)}
        data-track-action="A apasat inapoi din pagina de recenzii."
        className="fixed left-0 top-[75%] z-40 flex h-12 w-10 items-center justify-center rounded-r-md border-r border-border bg-white text-muted-foreground shadow"
        aria-label="Inapoi"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      {zoomImage && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setZoomImage(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="relative w-full max-w-[520px]">
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                data-track-action="A inchis poza recenzie."
                className="absolute -top-10 right-0 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow"
              >
                Inchide
              </button>
              <div className="overflow-hidden rounded-2xl bg-white">
                <img src={zoomImage.url} alt={zoomImage.author} className="h-full w-full object-contain" />
                <div className="px-4 py-3 text-sm font-semibold text-foreground">{zoomImage.author}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewsPage;
