import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, Star } from 'lucide-react';
import DesktopHeader from '@/components/desktop/DesktopHeader';

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

const DesktopReviewsPage = () => {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewTab>('photos');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const productScrollTimerRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    document.title = 'Recenzii clienti | Daruri Alese Catalog';
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

  const bestSellers = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    [...data.recenzii_cu_poza, ...data.recenzii_text].forEach((review) => {
      counts.set(review.id_produs, (counts.get(review.id_produs) || 0) + 1);
    });
    return [...data.produse_din_recenzii].sort((a, b) => {
      const aCount = counts.get(String(a.id)) || 0;
      const bCount = counts.get(String(b.id)) || 0;
      return bCount - aCount;
    });
  }, [data]);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft < maxScroll - 2);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [bestSellers.length]);

  const reviewsByProduct = useMemo(() => {
    if (!data) return [];
    const combined = [...data.recenzii_cu_poza, ...data.recenzii_text];
    const counts = new Map<string, number>();
    combined.forEach((review) => {
      counts.set(review.id_produs, (counts.get(review.id_produs) || 0) + 1);
    });

    const base = activeTab === 'photos' ? data.recenzii_cu_poza : data.recenzii_text;

    const grouped = new Map<string, ReviewItem[]>();
    base.forEach((review) => {
      const list = grouped.get(review.id_produs) || [];
      list.push(review);
      grouped.set(review.id_produs, list);
    });

    const products = [...data.produse_din_recenzii].sort((a, b) => {
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
  }, [activeTab, data]);

  const flattenedReviews = useMemo(
    () => reviewsByProduct.flatMap((entry) => entry.reviews),
    [reviewsByProduct]
  );
  const imageReviews = useMemo(
    () =>
      flattenedReviews
        .filter((review) => review.imagini && review.imagini.length > 0)
        .map((review) => ({
          ...review,
          imageUrl: review.imagini![0].full || review.imagini![0].thumbnail,
        })),
    [flattenedReviews]
  );

  const summary = useMemo(() => {
    if (!data) return { total: 0, avg: 0 };
    const allReviews = [...data.recenzii_cu_poza, ...data.recenzii_text];
    if (allReviews.length === 0) return { total: 0, avg: 0 };
    const sum = allReviews.reduce((acc, review) => acc + Number(review.rating || 0), 0);
    return { total: allReviews.length, avg: sum / allReviews.length };
  }, [data]);

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
            className={starIndex < rating ? 'h-3.5 w-3.5 text-amber-500' : 'h-3.5 w-3.5 text-muted-foreground'}
            fill="currentColor"
          >
            <path d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-40">
      <DesktopHeader />

      <div className="w-full px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white px-5 py-3">
          <div className="flex items-center gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Recenzii clienti</p>
            <h1 className="text-lg font-semibold text-foreground font-serif -mt-1">Experiente reale, cadouri reale.</h1>
          </div>
          <div className=" flex flex-wrap items-center gap-2">
            {(['photos', 'text'] as ReviewTab[]).map((tab) => {
              const count =
                  tab === 'photos' ? data?.recenzii_cu_poza.length ?? 0 : data?.recenzii_text.length ?? 0;
              return (
                  <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      data-track-action={`A schimbat tabul de recenzii la ${tab === 'photos' ? 'Poze' : 'Text'}.`}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                          activeTab === tab
                              ? 'text-white'
                              : 'border border-border bg-white text-muted-foreground'
                      }`}
                      style={
                        activeTab === tab
                            ? { backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }
                            : undefined
                      }
                  >
                    {tab === 'photos' ? 'Poze' : 'Text'} ({count})
                  </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-foreground">
            <Star className="h-4 w-4 text-amber-500" />
            {summary.avg ? summary.avg.toFixed(2) : '0.00'} / 5
            <span className="text-xs text-muted-foreground">({summary.total} recenzii)</span>
          </div>
        </div>


        <div className="mt-8 space-y-4">
            {loading && (
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Se incarca recenziile...
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Nu am putut incarca recenziile.
              </div>
            )}

            {!loading && !error && reviewsByProduct.length === 0 && (
              <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
                Nu exista recenzii disponibile.
              </div>
            )}

            {!loading && !error && reviewsByProduct.length > 0 && (
              <div className="space-y-8">
                {reviewsByProduct.map(({ product, reviews }) => (
                  <div
                    key={product.id}
                    id={`review-product-${product.id}`}
                    className="scroll-mt-24"
                  >
                    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
                      <div className="flex gap-4 snap-x snap-mandatory">
                        {reviews.map((review) => {
                          const hasImages = review.imagini && review.imagini.length > 0;
                          const imageUrl = hasImages
                            ? review.imagini![0].full || review.imagini![0].thumbnail
                            : '';

                          return (
                            <div
                              key={review.id_recenzie}
                              className="w-[360px] shrink-0 snap-center rounded-2xl border border-border bg-white p-4 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground font-serif">{review.autor}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.data)}</p>
                                </div>
                                {renderStars(review.rating)}
                              </div>
                              <p className="mt-3 text-sm text-foreground whitespace-pre-line font-serif">
                                {review.continut}
                              </p>
                              {hasImages && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const imageIndex = imageReviews.findIndex(
                                      (item) => item.id_recenzie === review.id_recenzie
                                    );
                                    if (imageIndex >= 0) {
                                      setZoomIndex(imageIndex);
                                    }
                                  }}
                                  data-track-action="A deschis poza din recenzie."
                                  className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/20"
                                  aria-label="Deschide poza recenzie"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={review.autor}
                                    className="w-full object-cover"
                                    loading="lazy"
                                  />
                                </button>
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
        </div>

      {zoomIndex !== null && imageReviews[zoomIndex] && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setZoomIndex(null)}
          />
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="relative w-full max-w-[640px]">
              <div className="grid max-h-[60vh] overflow-hidden rounded-2xl bg-white md:grid-cols-[1fr_1fr]">
                <div className="bg-black/5 flex items-center justify-center p-5">
                  <img
                    src={imageReviews[zoomIndex].imageUrl}
                    alt={imageReviews[zoomIndex].autor}
                    className="max-h-[40vh] w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{imageReviews[zoomIndex].autor}</p>
                    <button
                      type="button"
                      onClick={() => setZoomIndex(null)}
                      data-track-action="A inchis poza recenzie."
                      className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-foreground"
                      aria-label="Inchide"
                    >
                      X
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                    {imageReviews[zoomIndex].continut}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setZoomIndex((prev) => (prev && prev > 0 ? prev - 1 : prev))}
                      disabled={zoomIndex === 0}
                      data-track-action="A mers la poza anterioara din recenzie."
                      className="rounded-full border border-border px-3 py-1 disabled:opacity-40"
                    >
                      &lt; Prev
                    </button>
                    <span>
                      {zoomIndex + 1} / {imageReviews.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setZoomIndex((prev) =>
                          prev !== null && prev < imageReviews.length - 1 ? prev + 1 : prev
                        )
                      }
                      disabled={zoomIndex >= imageReviews.length - 1}
                      data-track-action="A mers la poza urmatoare din recenzie."
                      className="rounded-full border border-border px-3 py-1 disabled:opacity-40"
                    >
                      Next &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {bestSellers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-6 py-2 backdrop-blur">
          <div className="relative">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => sliderRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                data-track-action="A derulat sliderul de produse la stanga."
                className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-white/90 px-2 py-2 text-xs font-semibold text-foreground shadow"
                aria-label="Deruleaza stanga"
              >
                &lt;
              </button>
            )}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => sliderRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                data-track-action="A derulat sliderul de produse la dreapta."
                className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-white/90 px-2 py-2 text-xs font-semibold text-foreground shadow"
                aria-label="Deruleaza dreapta"
              >
                &gt;
              </button>
            )}
            <div
              ref={sliderRef}
              className="flex gap-2 overflow-x-auto pr-2"
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
                  className={`flex w-24 shrink-0 flex-col overflow-hidden rounded-2xl border bg-white text-left transition-transform hover:-translate-y-1 ${
                    isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-border'
                  }`}
                >
                  <img src={imageUrl} alt={product.titlu} className="h-28 w-full object-cover" loading="lazy" />

                </button>
              );
            })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopReviewsPage;
