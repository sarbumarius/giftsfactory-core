import { Star, TrendingUp, X, ChevronLeft, ChevronRight, ArrowRight, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiProduct } from '@/types/api';
import productImage from '@/assets/product-image.jpg';
import { prefetchProductDetails } from '@/services/api';
import { useShopContext } from '@/contexts/ShopContext';
import { Heart } from 'lucide-react';
import { formatDimensions } from '@/utils/formatDimensions';

interface MobileProductCardProps {
  product: ApiProduct;
  index: number;
  isBestseller?: boolean;
  isPopular?: boolean;
  overlayAction?: React.ReactNode;
  desktopSequence?: ApiProduct[];
}

const MobileProductCard = ({
  product,
  index,
  isBestseller,
  isPopular,
  overlayAction,
  desktopSequence,
}: MobileProductCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [isProductZoomOpen, setIsProductZoomOpen] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const reviewsScrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(index);
  const navigate = useNavigate();
  const { wishlist, addToWishlist, removeFromWishlist } = useShopContext();

  const hasSequence = Boolean(desktopSequence && desktopSequence.length > 1);
  const activeProduct = hasSequence
    ? desktopSequence?.[activeIndex] || product
    : product;
  const prevProduct = hasSequence && activeIndex > 0 ? desktopSequence?.[activeIndex - 1] : null;
  const nextProduct =
    hasSequence && desktopSequence && activeIndex < desktopSequence.length - 1
      ? desktopSequence[activeIndex + 1]
      : null;

  useEffect(() => {
    if (!isModalOpen) return;
    prefetchProductDetails(activeProduct.slug);
  }, [isModalOpen, activeProduct.slug]);
  useEffect(() => {
    if (!isModalOpen) {
      setShowReviews(false);
      return;
    }
    const timer = setTimeout(() => setShowReviews(true), 250);
    return () => clearTimeout(timer);
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    setActiveIndex(index);
  }, [isModalOpen, index]);

  useEffect(() => {
    if (!hasSequence || !desktopSequence) return;
    if (activeIndex > desktopSequence.length - 1) {
      setActiveIndex(desktopSequence.length - 1);
    }
  }, [activeIndex, desktopSequence, hasSequence]);
  const [showAllAttributes, setShowAllAttributes] = useState(false);

  const getBadge = (): string | undefined => {
    if (isBestseller) return 'bestseller';
    if (isPopular) return 'popular';
    return undefined;
  };

  const badge = getBadge();
  const rating = Math.round(parseFloat(product.rating));
  const price = parseFloat(product.pret);
  const reducedPrice = product.pret_redus ? parseFloat(product.pret_redus) : undefined;
  const hasDiscount = typeof reducedPrice === 'number' && reducedPrice !== price;
  const originalPrice = hasDiscount ? Math.max(price, reducedPrice) : price;
  const discountedPrice = hasDiscount ? Math.min(price, reducedPrice) : price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0;
  const hasReviewsBadge = !badge && product.nr_recenzii > 0;
  const dimensions = formatDimensions(product.dimensiune);
  const imageUrl = product.imagine_principala['300x300'] || product.imagine_principala.full || productImage;
  const isInWishlist = wishlist.some((item) => item.id === product.id);


  const getBorderColor = (badge?: string) => {
    switch (badge) {
      case 'bestseller':
        return 'border-purple-500';
      case 'popular':
        return 'border-primary';
      default:
        return 'border-border';
    }
  };

  const getBadgeStyles = (badge?: string) => {
    switch (badge) {
      case 'bestseller':
        return 'bg-purple-500 text-white';
      case 'popular':
        return 'bg-primary text-white';
      case 'new':
        return 'bg-blue-500 text-white';
      default:
        return '';
    }
  };

  const renderBadge = (badge?: string) => {
    switch (badge) {
      case 'bestseller':
        return 'Cel mai vandut';
      case 'popular':
        return (
          <>
            <TrendingUp className="h-3 w-3" />
            Popular
          </>
        );
      case 'new':
        return 'Nou';
      default:
        return '';
    }
  };

  const formatReviewDate = (value: string) => {
    const [datePart] = value.split(' ');
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return value;
    return { top: `${day}-${month}`, bottom: year };
  };

  return (
    <>
      <div
        className="opacity-0 animate-fade-up flex flex-col"
        style={{
          animationDelay: `${(index % 10) * 0.05}s`,
          animationFillMode: 'forwards'
        }}
      >
        <div
          className={`relative overflow-hidden rounded-xl bg-card ${
            badge || hasDiscount ? 'border-4' : 'border'
          } ${hasDiscount ? 'border-transparent' : getBorderColor(badge)} ${!badge && !hasDiscount ? 'border-border' : ''} transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
          style={
            hasDiscount
              ? {
                  backgroundImage:
                    'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(62, 39, 35, 0.4)), linear-gradient(90deg, #faca8c 0%, #e0a35c 15%, #cf843b 30%, #f1bd81 45%, #f8ca95 60%, #fae3ca 75%, #faca8c 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }
              : undefined
          }
          onClick={() => setIsModalOpen(true)}
          data-track-action={`A deschis cardul produsului ${product.titlu}.`}
        >
          <div
            className="absolute inset-0 z-0 bg-cover bg-center backdrop-blur blur-md scale-110 "
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          {badge ? (
            <div className={`absolute top-1 left-1 z-10 inline-flex items-center gap-1 rounded-2xl px-3 py-1 text-[9px] font-medium ${getBadgeStyles(badge)}`}>
              {renderBadge(badge)}
            </div>
          ) : (
            hasReviewsBadge && (
              <div className="absolute top-1 left-1 z-10 inline-flex items-center gap-1 rounded-2xl bg-foreground/20 px-3 py-1 text-[11px] font-medium text-white">
                {product.nr_recenzii} recenzii
              </div>
            )
          )}

          <div className="relative z-10 px-3 py-3 flex items-center justify-end">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-2 w-2 ${i < rating ? 'fill-white text-[#faca8c]' : 'text-muted'}`}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 aspect-square overflow-hidden">
            <div className="relative h-full w-full flex items-center justify-center rounded-md overflow-hidden ">
              <img
                src={imageUrl}
                alt={product.titlu}
                className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-110 "
                loading="lazy"
              />
              {overlayAction && (
                <div className="absolute inset-x-0 bottom-0 z-10 p-2">
                  {overlayAction}
                </div>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (isInWishlist) {
                    removeFromWishlist(product.id);
                    return;
                  }
                  addToWishlist({
                    id: product.id,
                    slug: product.slug,
                    title: product.titlu,
                    image: imageUrl,
                    price: product.pret,
                    priceReduced: product.pret_redus,
                  });
                }}
                data-track-action={`A apasat pe wishlist pentru ${product.titlu}.`}
                className="absolute left-2 top-2 z-10 rounded-full bg-black/40 p-2"
                aria-label="Adauga in wishlist"
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </button>
              {hasDiscount && (
                <div
                  className="absolute right-2 top-2 z-10 rounded-full px-3 py-1 text-[14px] font-bold text-white"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, #faca8c 0%, #e0a35c 15%, #cf843b 30%, #f1bd81 45%, #f8ca95 60%, #fae3ca 75%, #faca8c 100%)',
                  }}
                >
                  -{discountPercent}%
                </div>
              )}
            </div>
          </div>

          {dimensions && (
            <div className="relative z-10 px-3 py-2">
              <p className="text-center text-[14px] font-bold text-white font-serif">
                {dimensions}
              </p>
            </div>
          )}
        </div>

      <div className="mt-2 px-1">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          data-track-action={`A deschis cardul produsului ${product.titlu}.`}
          className="w-full text-center text-sm font-serif text-foreground leading-tight"
        >
          <span className="line-clamp-2">{product.titlu}</span>
        </button>

        </div>
      </div>
      {isModalOpen && (() => {
        const product = activeProduct;
        const rating = Math.round(parseFloat(product.rating));
        const price = parseFloat(product.pret);
        const reducedPrice = product.pret_redus ? parseFloat(product.pret_redus) : undefined;
        const hasDiscount = typeof reducedPrice === 'number' && reducedPrice !== price;
        const originalPrice = hasDiscount ? Math.max(price, reducedPrice) : price;
        const discountedPrice = hasDiscount ? Math.min(price, reducedPrice) : price;
        const discountPercent = hasDiscount ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0;
        const hasReviewsBadge = !badge && product.nr_recenzii > 0;
        const dimensions = formatDimensions(product.dimensiune);
        const imageUrl = product.imagine_principala['300x300'] || product.imagine_principala.full || productImage;
        const isInWishlist = wishlist.some((item) => item.id === product.id);
        const reviews = product.recenzii ?? [];
        const zoomItems = reviews.flatMap((recenzie) =>
          (recenzie.imagini || []).map((img) => ({
            url: img.full || img.thumbnail,
            author: recenzie.autor,
          }))
        );

        return (
          <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in "
            onClick={() => setIsModalOpen(false)}
            data-track-action={`A inchis modalul produsului ${product.titlu}.`}
          />
          <div
            className={`fixed inset-x-0 bottom-0 z-50 ${
              reviews.length > 0 ? 'h-[80vh]' : 'h-[55vh]'
            } rounded-t-2xl bg-white shadow-2xl animate-slide-up flex flex-col sm:mx-auto sm:max-w-xl sm:w-full `}
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              data-track-action={`A inchis modalul produsului ${product.titlu}.`}
              className="absolute left-1/2 -top-10 -translate-x-1/2 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-lg md:-top-16 md:border-white md:bg-white/20 md:text-white"
              aria-label="Inchide"
            >
              <X className="h-4 w-4" />
            </button>
            <div
              key={product.id}
              className="flex-1 overflow-y-auto px-4 pt-4 md:[&::-webkit-scrollbar]:hidden md:[-ms-overflow-style:none] md:[scrollbar-width:none] animate-fade-in"
            >
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-1/2 max-w-[180px] aspect-square overflow-hidden rounded-md border border-border bg-muted relative">
                    <button
                      type="button"
                      onClick={() => setIsProductZoomOpen(true)}
                      data-track-action={`A deschis zoom pentru ${product.titlu}.`}
                      className="h-full w-full"
                      aria-label="Zoom produs"
                    >
                      <img
                        key={imageUrl}
                        src={imageUrl}
                        alt={product.titlu}
                        className="h-full w-full object-cover transition-opacity duration-300"
                        loading="lazy"
                      />
                    </button>
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {product.nr_recenzii > 0 ? product.nr_recenzii : null}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      {product.titlu}
                      {(() => {
                        const tip = product.attributes?.find((attr) => attr.name === 'Tip' && attr.options.length > 0);

                      })()}
                    </h3>
                    <div className="mt-0 flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-red-700">{discountedPrice.toFixed(2)} lei</span>
                      {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">{originalPrice.toFixed(2)} lei</span>
                      )}
                    </div>
                    <div className="mt-0">
                      <span className="text-xs text-muted-foreground">Dimensiune</span>
                      <p className="text-sm font-semibold text-foreground">
                        {dimensions || '-'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        navigate(`/produs/${product.slug}`);
                      }}
                      data-track-action={`A deschis produsul ${product.titlu}.`}
                      className="gold-gradient mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Personalizeaza
                      <ArrowRight className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {product.recenzii.length > 0 && (
                  <div>
                    {!showReviews ? (
                      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {[...Array(3)].map((_, idx) => (
                          <div
                            key={`review-skeleton-${idx}`}
                            className="min-w-[45%] w-[45%] flex-shrink-0 rounded-2xl border border-border bg-card overflow-hidden animate-pulse"
                          >
                            <div className="h-32 w-full bg-muted/60" />
                            <div className="px-3 py-3">
                              <div className="h-3 w-24 rounded bg-muted/60" />
                              <div className="mt-2 h-3 w-16 rounded bg-muted/60" />
                              <div className="mt-2 h-3 w-full rounded bg-muted/60" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          {zoomItems.length > 0
                            ? `${zoomItems.length}/${product.recenzii.length} poze reale de la clientii nostri`
                            : `${product.recenzii.length} ${product.recenzii.length === 1 ? 'recenzie' : 'recenzii'} de la clienti`}
                        </p>
                        <div className="relative">
                          <div
                            ref={reviewsScrollRef}
                            className="mt-3 flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                          >
                          {[...product.recenzii]
                          .sort((a, b) => (b.imagini?.length ? 1 : 0) - (a.imagini?.length ? 1 : 0))
                          .map((recenzie, reviewIndex) => (
                            <div
                              key={`${recenzie.autor}-${reviewIndex}`}
                              className="min-w-[45%] w-[45%] flex-shrink-0 rounded-2xl border border-border bg-card overflow-hidden"
                            >
                              {recenzie.imagini?.length ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetUrl = recenzie.imagini[0].full || recenzie.imagini[0].thumbnail;
                                    const index = zoomItems.findIndex((item) => item.url === targetUrl);
                                    setZoomIndex(index >= 0 ? index : 0);
                                  }}
                                  data-track-action="A deschis poza din recenzie."
                                  className="relative h-32 md:h-64 w-full overflow-hidden bg-muted"
                                  aria-label="Vezi poza recenzie"
                                >
                                  <img
                                    src={recenzie.imagini[0].thumbnail || recenzie.imagini[0].full}
                                    alt={`Recenzie ${recenzie.autor}`}
                                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                                    loading="lazy"
                                  />
                                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
                                    {(() => {
                                      const formatted = formatReviewDate(recenzie.data);
                                      if (typeof formatted === 'string') {
                                        return formatted;
                                      }
                                      return `${formatted.top} ${formatted.bottom}`;
                                    })()}
                                  </span>
                                </button>
                              ) : null}
                              <div className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">{recenzie.autor}</span>
                                </div>
                                <div className="mt-1 flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${i < Math.round(parseFloat(recenzie.rating)) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                                    />
                                  ))}
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground line-clamp-4">
                                  {recenzie.continut}
                                </p>
                              </div>
                            </div>
                          ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => reviewsScrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                            data-track-action="A derulat pozele recenziilor la stanga."
                            className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white px-2 py-2 text-xs font-semibold text-foreground shadow"
                            aria-label="Deruleaza stanga"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewsScrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                            data-track-action="A derulat pozele recenziilor la dreapta."
                            className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white px-2 py-2 text-xs font-semibold text-foreground shadow"
                            aria-label="Deruleaza dreapta"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {(product.attributes?.some((attr) => attr.visible) || dimensions) && (
                  <div className="mt-4">
                    {(() => {
                      const visibleAttributes: { name: string; slug: string; options: string[] }[] = [];
                      if (dimensions) {
                        visibleAttributes.push({
                          name: 'Dimensiune',
                          slug: 'dimensiune',
                          options: [dimensions],
                        });
                      }
                      product.attributes
                        ?.filter((attr) => attr.visible)
                        .forEach((attr) => {
                          visibleAttributes.push({
                            name: attr.name,
                            slug: attr.slug,
                            options: attr.options,
                          });
                        });

                      return (
                        <div className="overflow-hidden rounded-lg border border-border">
                          {visibleAttributes.map((attr) => (
                            <div key={attr.slug} className="flex border-b border-border last:border-b-0">
                              <div className="w-1/3 bg-muted/50 px-3 py-2 text-xs font-medium text-foreground">
                                {attr.name}
                              </div>
                              <div className="w-2/3 px-3 py-2 text-xs text-muted-foreground">
                                {attr.options.join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border p-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  navigate(`/produs/${product.slug}`);
                }}
                data-track-action={`A deschis informatii suplimentare pentru ${product.titlu}.`}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-border py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Info className="h-4 w-4" />
                Informatii Suplimentare
              </button>
            </div>

          </div>

          {prevProduct && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setZoomIndex(null);
                setIsProductZoomOpen(false);
                setActiveIndex((prev) => Math.max(prev - 1, 0));
              }}
              data-track-action={`A deschis produsul anterior ${prevProduct.titlu}.`}
              className="hidden md:flex fixed left-6 top-1/2 z-[55] -translate-y-1/2 w-40 flex-col items-center gap-3 text-center"
              aria-label="Produs anterior"
            >
              {formatDimensions(prevProduct.dimensiune) && (
                <span className="w-full px-2 py-1 text-[10px] font-semibold text-white">
                  {formatDimensions(prevProduct.dimensiune)}
                </span>
              )}
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10 bg-black/30">
                <img
                  src={
                    prevProduct.imagine_principala['300x300'] ||
                    prevProduct.imagine_principala.full
                  }
                  alt={prevProduct.titlu}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-black/35" />
              </div>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white/90 p-2 shadow-lg">
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-white">Precedent</span>
            </button>
          )}

          {nextProduct && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setZoomIndex(null);
                setIsProductZoomOpen(false);
                setActiveIndex((prev) =>
                  desktopSequence ? Math.min(prev + 1, desktopSequence.length - 1) : prev
                );
              }}
              data-track-action={`A deschis produsul urmator ${nextProduct.titlu}.`}
              className="hidden md:flex fixed right-6 top-1/2 z-[55] -translate-y-1/2 w-40 flex-col items-center gap-3 text-center"
              aria-label="Produs urmator"
            >
              {formatDimensions(nextProduct.dimensiune) && (
                <span className="w-full px-2 py-1 text-[10px] font-semibold text-white">
                  {formatDimensions(nextProduct.dimensiune)}
                </span>
              )}
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10 bg-black/30">
                <img
                  src={
                    nextProduct.imagine_principala['300x300'] ||
                    nextProduct.imagine_principala.full
                  }
                  alt={nextProduct.titlu}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-black/35" />
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white/90 p-2 shadow-lg">
                <ChevronRight className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-white">Urmatorul</span>
            </button>
          )}

          {zoomIndex !== null && zoomItems[zoomIndex] && (
            <div
              className="fixed inset-0 z-[60] bg-black/80 p-4 flex items-center justify-center"
              onClick={() => setZoomIndex(null)}
              data-track-action="A inchis poza recenzie."
            >
              <div className="relative max-h-full max-w-full sm:max-w-sm md:max-w-md">
                <img
                  key={zoomItems[zoomIndex].url}
                  src={zoomItems[zoomIndex].url}
                  alt="Recenzie"
                  className="max-h-[75vh] max-w-full rounded-lg object-contain transition-opacity duration-300"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/60 px-4 py-3 text-sm text-white">
                  {zoomItems[zoomIndex].author}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setZoomIndex((prev) => (prev === null ? prev : Math.max(prev - 1, 0)));
                  }}
                  data-track-action="A navigat la poza anterioara din recenzie."
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white disabled:opacity-40"
                  disabled={zoomIndex <= 0}
                  aria-label="Anterioara"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setZoomIndex((prev) => {
                      if (prev === null) return prev;
                      return Math.min(prev + 1, zoomItems.length - 1);
                    });
                  }}
                  data-track-action="A navigat la poza urmatoare din recenzie."
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white disabled:opacity-40"
                  disabled={zoomIndex >= zoomItems.length - 1}
                  aria-label="Urmatoarea"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setZoomIndex(null);
                  }}
                  data-track-action="A inchis poza recenzie."
                  className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white"
                  aria-label="Inchide"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {isProductZoomOpen && (
            <div
              className="fixed inset-0 z-[60] bg-black/80 p-4 flex items-center justify-center"
              onClick={() => setIsProductZoomOpen(false)}
              data-track-action={`A inchis zoomul produsului ${product.titlu}.`}
            >
              <div className="relative max-h-full max-w-full">
                <img
                  src={product.imagine_principala.full || imageUrl}
                  alt={product.titlu}
                  className="max-h-full max-w-full rounded-lg object-contain"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsProductZoomOpen(false);
                  }}
                  data-track-action={`A inchis zoomul produsului ${product.titlu}.`}
                  className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white"
                  aria-label="Inchide"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
        );
      })()}
    </>
  );
};

export default MobileProductCard;
