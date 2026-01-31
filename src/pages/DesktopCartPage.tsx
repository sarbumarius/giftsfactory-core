import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Info, Sparkles, TicketPercent, X } from 'lucide-react';
import productImage from '@/assets/product-image.jpg';
import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import DesktopSidebar from '@/components/desktop/DesktopSidebar';
import DesktopTopBar from '@/components/desktop/DesktopTopBar';
import { useShopContext, ShopItem } from '@/contexts/ShopContext';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { getLocale, withLocalePath } from '@/utils/locale';
import { t } from '@/utils/translations';

const SHOW_GIFT_OPTION = false;
const SHOW_PACKING_OPTION = false;

const DesktopCartPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist, removeFromCart, updateCartItem, isCartLoaded } = useShopContext();
  const { setCurrentSlug, searchQuery, setSearchQuery } = useCategoryContext();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState('');
  const [activeGiftId, setActiveGiftId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [activePersonalizareId, setActivePersonalizareId] = useState<string | null>(null);
  const [draftPersonalizare, setDraftPersonalizare] = useState<ShopItem['personalizare']>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [showAdvanceInfo, setShowAdvanceInfo] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponStatus, setCouponStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [couponTotals, setCouponTotals] = useState<{ totalDiscount: number } | null>(null);
  const [couponDetails, setCouponDetails] = useState<{
    conditions: string[];
    hasApplicableProducts: boolean;
    invalidProducts: Array<{ title: string; reason: string }>;
  } | null>(null);
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [showOrderDateModal, setShowOrderDateModal] = useState(false);
  const [isGraphicOpen, setIsGraphicOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [layoutPadding, setLayoutPadding] = useState(60);
  const layoutMaxWidth = 1800;
  const layoutMaxHeight = 1081;
  const locale = getLocale();
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const hasItems = cart.length > 0;
  const skipNextRevalidateRef = useRef(false);
  const lastValidatedSignatureRef = useRef<string | null>(null);
  const showCouponOverlay = isApplyingCoupon && Boolean(appliedCouponCode);
  const cartSignature = useMemo(
    () =>
      cart
        .map((item) => {
          const key = item.cartItemId ?? `${item.id}`;
          const qty = quantities[key] ?? item.quantity ?? 1;
          return `${item.id}:${key}:${qty}`;
        })
        .join('|'),
    [cart, quantities]
  );
  const formatRoDate = (date: Date) =>
    date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(date.getDate() + days);
    return next;
  };
  const nextBusinessDay = (date: Date) => {
    let next = addDays(date, 1);
    while (next.getDay() === 0 || next.getDay() === 6) {
      next = addDays(next, 1);
    }
    return next;
  };
  const addBusinessDays = (date: Date, days: number) => {
    let added = 0;
    let next = new Date(date);
    while (added < days) {
      next = addDays(next, 1);
      if (next.getDay() !== 0 && next.getDay() !== 6) {
        added += 1;
      }
    }
    return next;
  };
  const hasWeekendBetween = (from: Date, to: Date) => {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);
    let cursor = addDays(start, 1);
    while (cursor < end) {
      if (cursor.getDay() === 0 || cursor.getDay() === 6) {
        return true;
      }
      cursor = addDays(cursor, 1);
    }
    return false;
  };
  const productionDate = nextBusinessDay(orderDate);
  const deliveryStart = addBusinessDays(productionDate, 1);
  const deliveryEnd = addBusinessDays(productionDate, 2);
  const weekendBetweenOrderAndProduction = hasWeekendBetween(orderDate, productionDate);
  const weekendBetweenProductionAndDelivery = hasWeekendBetween(productionDate, deliveryStart);
  const todayDate = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const orderDateLabel = isSameDay(orderDate, todayDate) ? t('cart.orderDateToday') : t('cart.orderDateCustom');

  useEffect(() => {
    const defaultTitle = 'Gifts Factory Catalog';
    document.title = `${t('cart.title')} | ${defaultTitle}`;
  }, []);

  useEffect(() => {
    const updatePadding = () => {
      if (typeof window === 'undefined') return;
      setLayoutPadding(window.innerHeight < 1000 ? 30 : 60);
    };
    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);


  const updateQuantity = useCallback(
    (cartKey: string, nextQty: number) => {
      setQuantities((prev) => ({
        ...prev,
        [cartKey]: nextQty,
      }));
      updateCartItem(cartKey, { quantity: nextQty });
      if (appliedCouponCode) {
        lastValidatedSignatureRef.current = null;
      }
    },
    [appliedCouponCode, updateCartItem]
  );

  const applyCoupon = useCallback(
    async (code: string, { showSuccess }: { showSuccess: boolean }) => {
      if (!code) {
        setCouponStatus({ type: 'error', message: t('cart.couponEnter') });
        return;
      }

      setAppliedCouponCode(code);
      setIsApplyingCoupon(true);
      setCouponStatus(null);
      setCouponTotals(null);
      setCouponDetails(null);

      const payload = {
        cod_cupon: code,
        produse: cart.map((item) => ({
          id: item.id,
          quantity: item.cartItemId ? quantities[item.cartItemId] ?? 1 : 1,
        })),
      };

      try {
        const response = await fetch('https://darurialese.com/wp-json/sarbu/api-verificare-cupon/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        const isValid = Boolean(data?.cupon?.valid);
        const conditions = Array.isArray(data?.cupon?.conditii) ? data.cupon.conditii : [];
        const products = Array.isArray(data?.produse) ? data.produse : [];
        const hasApplicableProducts = products.some((prod: { valabil_cupon?: boolean }) => Boolean(prod?.valabil_cupon));
        const invalidProducts = products
          .filter((prod: { valabil_cupon?: boolean }) => !prod?.valabil_cupon)
          .map((prod: { titlu?: string; reason?: string }) => ({
            title: prod?.titlu || t('cart.productFallback'),
            reason: prod?.reason || t('cart.couponInvalidProduct'),
          }));
        if (!response.ok || !isValid) {
          setCouponTotals(null);
          setAppliedCouponCode(null);
          setPromoCode('');
          setCouponDetails({ conditions, hasApplicableProducts, invalidProducts });
          setCouponStatus({ type: 'error', message: data?.cupon?.reason || t('cart.couponInvalid') });
          if (window.rybbit?.event && code) {
            window.rybbit.event(`Raspuns cupon: ${code} | ${data?.cupon?.reason || t('cart.couponInvalid')}`);
          }
          return;
        }
        if (!hasApplicableProducts) {
          setCouponTotals(null);
          setAppliedCouponCode(null);
          setPromoCode('');
          setCouponDetails({ conditions, hasApplicableProducts, invalidProducts });
          setCouponStatus({ type: 'error', message: t('cart.couponNoProducts') });
          if (window.rybbit?.event && code) {
            window.rybbit.event(`Raspuns cupon: ${code} | ${t('cart.couponNoProducts')}`);
          }
          return;
        }
        const totalDiscount = Number(data?.totals?.total_discount ?? 0);
        setCouponTotals({ totalDiscount });
        setCouponDetails({ conditions, hasApplicableProducts, invalidProducts });
        if (showSuccess) {
          const successMessage = data?.cupon?.discount_text || t('cart.couponApplied');
          setCouponStatus({ type: 'success', message: successMessage });
          if (window.rybbit?.event && code) {
            window.rybbit.event(`Raspuns cupon: ${code} | ${successMessage}`);
          }
        }
      } catch {
        setCouponTotals(null);
        setAppliedCouponCode(null);
        setPromoCode('');
        setCouponDetails(null);
        setCouponStatus({ type: 'error', message: t('cart.couponCheckFail') });
        if (window.rybbit?.event && code) {
          window.rybbit.event(`Raspuns cupon: ${code} | ${t('cart.couponCheckFail')}`);
        }
      } finally {
        setIsApplyingCoupon(false);
      }
    },
    [cart, quantities]
  );

  const handleApplyCoupon = () => {
    const code = promoCode.trim();
    skipNextRevalidateRef.current = true;
    lastValidatedSignatureRef.current = cartSignature;
    applyCoupon(code, { showSuccess: true });
  };

  useEffect(() => {
    if (!appliedCouponCode || !hasItems) return;
    if (skipNextRevalidateRef.current) {
      skipNextRevalidateRef.current = false;
      return;
    }
    if (cartSignature === lastValidatedSignatureRef.current) return;
    const timer = setTimeout(() => {
      lastValidatedSignatureRef.current = cartSignature;
      applyCoupon(appliedCouponCode, { showSuccess: false });
    }, 450);
    return () => clearTimeout(timer);
  }, [appliedCouponCode, applyCoupon, cartSignature, hasItems]);

  useEffect(() => {
    setQuantities((prev) => {
      const next: Record<string, number> = {};
      cart.forEach((item) => {
        if (!item.cartItemId) return;
        next[item.cartItemId] = item.quantity ?? prev[item.cartItemId] ?? 1;
      });
      return next;
    });
  }, [cart]);


  const totals = useMemo(() => {
    const cost = cart.reduce((sum, item) => {
      const unit = parseFloat(item.priceReduced ?? item.price);
      const qty = item.cartItemId ? quantities[item.cartItemId] ?? 1 : 1;
      return sum + unit * qty;
    }, 0);
    const totalItems = cart.reduce((sum, item) => {
      const qty = item.cartItemId ? quantities[item.cartItemId] ?? 1 : 1;
      return sum + qty;
    }, 0);
    const couponDiscount = couponTotals ? Math.max(0, Number(couponTotals.totalDiscount) || 0) : 0;
    const discountedProducts = Math.max(0, cost - couponDiscount);
    const shipping = discountedProducts >= 200 ? 0 : 17;
    const original = cart.reduce((sum, item) => {
      const unit = parseFloat(item.price);
      const qty = item.cartItemId ? quantities[item.cartItemId] ?? 1 : 1;
      return sum + unit * qty;
    }, 0);
    const discount = Math.max(0, original - cost);
    const giftTotal = cart.reduce((sum, item) => {
      if (!item.giftSelected) return sum;
      return sum + 10;
    }, 0);
    const packingTotal = cart.reduce((sum, item) => {
      if (!item.packingSelected) return sum;
      return sum + 20;
    }, 0);
    const total = discountedProducts + giftTotal + packingTotal + shipping;
    return { cost, couponDiscount, discountedProducts, discount, giftTotal, packingTotal, shipping, total, totalItems };
  }, [cart, quantities, couponTotals]);

  useEffect(() => {
    const hasShippingBanner = totals.discountedProducts < 200;
    const hasPointsBanner = true;
    if (!hasShippingBanner || !hasPointsBanner) {
      setBannerIndex(hasShippingBanner ? 0 : 1);
      return;
    }
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % 2);
    }, 3500);
    return () => clearInterval(timer);
  }, [totals.discountedProducts]);

  useEffect(() => {
    try {
      const storedCode = localStorage.getItem('cartCouponCode');
      if (storedCode) {
        setPromoCode(storedCode);
        setAppliedCouponCode(storedCode);
      }
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    try {
      if (appliedCouponCode) {
        localStorage.setItem('cartCouponCode', appliedCouponCode);
      } else {
        localStorage.removeItem('cartCouponCode');
      }
    } catch {
      // Ignore storage errors.
    }
  }, [appliedCouponCode]);

  return (
    <div
      className="h-screen overflow-hidden"

    >
      <main
        className="mx-auto h-full w-full flex items-center justify-center gold-gradient"

      >
        <div
          className="grid grid-cols-[25%_75%] max-w-[1300px] gap-0  "
          style={{
            height: `min(calc(100vh - ${layoutPadding * 2}px), ${layoutMaxHeight}px)`,
          }}
        >
          <DesktopSidebar />

          <section className="min-h-full border-r border-border bg-white flex flex-col relative rounded-2xl overflow-hidden">


            <div className="flex-1 -mt-0 ">
              {hasItems && (
                <div className=" mb-3 ">
                  {bannerIndex === 0 && totals.discountedProducts < 200 && (
                    <div className="bg-gradient-to-r from-[#f7e6c8] to-[#f1d3a3] px-8 py-3 text-center">
                      <p className="text-sm font-semibold text-amber-900">
                        {t('cart.freeShippingPrefix')}{' '}
                        <span className="font-bold text-amber-950">
                          {Math.max(0, 200 - totals.discountedProducts).toFixed(2)} lei
                        </span>{' '}
                        {t('cart.freeShippingSuffix')}
                      </p>
                    </div>
                  )}
                  {bannerIndex === 1 && (
                    <div className="bg-gradient-to-r from-[#f7e6c8] to-[#f1d3a3] px-8 py-3 text-center">
                      <p className="text-sm font-semibold text-amber-900">
                        {t('cart.pointsPrefix')}{' '}
                        <span className="font-bold text-amber-950">{Math.round(totals.total)}</span>{' '}
                        {t('cart.pointsSuffix')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="px-4 pb-6">
        {!isCartLoaded ? (
          <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
            {t('cart.loading')}
          </div>
        ) : cart.length === 0 ? (
          <div className=" flex min-h-[60vh] pb-24 flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{t('cart.empty')}</span>
            <img
              src="/no-results.png"
              alt={t('cart.emptyAlt')}
              className="h-56 w-56 rounded-2xl object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setCurrentSlug('gifts-factory');
                navigate('/');
              }}
              data-track-action="A mers la categorii din cos gol."
              className="rounded-full px-5 py-2 text-xs font-semibold text-white"
              style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
            >
              {t('cart.viewCategories')}
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-white p-5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('cart.title')}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {t('cart.itemsInCart', { count: totals.totalItems })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                data-track-action="A mers la categorii din cos."
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground"
              >
                <span className="flex items-center gap-2">
                  {t('cart.continueShopping')}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>

            <div className="flex overflow-y-auto w-full flex-col max-h-[calc(100vh-350px)] pb-56 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <section className="space-y-6">
                {cart.map((item) => {
                const unitPrice = parseFloat(item.price);
                const reducedPrice = item.priceReduced ? parseFloat(item.priceReduced) : null;
                const cartKey = item.cartItemId || `${item.id}`;
                const qty = quantities[cartKey] ?? 1;
                const giftEnabled = item.giftSelected;
                const packingEnabled = item.packingSelected;
                return (
                  <div key={cartKey} className="rounded-2xl border border-border bg-white p-5 ">
                    <div className="flex gap-5">
                      <button
                        type="button"
                        onClick={() => navigate(`/produs/${item.slug}`)}
                        data-track-action={`A deschis produsul ${item.title} din cos.`}
                        className="h-28 w-28 overflow-hidden rounded-xl"
                        aria-label={t('cart.viewProductAria', { title: item.title })}
                      >
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      </button>
                      <div className="flex flex-1 flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-sm font-bold text-primary">{(reducedPrice ?? unitPrice).toFixed(2)} lei</span>
                              {reducedPrice && (
                                <span className="text-xs text-muted-foreground line-through">{unitPrice.toFixed(2)} lei</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(cartKey)}
                            data-track-action={`A sters produsul ${item.title} din cos.`}
                            className="rounded-full border border-border p-2 text-muted-foreground hover:text-rose-600"
                            aria-label={t('cart.removeProduct')}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="inline-flex items-center overflow-hidden rounded-full border border-border">
                            <button
                              type="button"
                              onClick={() => updateQuantity(cartKey, Math.max(1, qty - 1))}
                              data-track-action={`A scazut cantitatea pentru ${item.title}.`}
                              className="flex h-8 w-8 items-center justify-center text-sm"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              value={qty}
                              readOnly
                              className="h-8 w-10 text-center text-xs font-semibold text-foreground focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(cartKey, qty + 1)}
                              data-track-action={`A crescut cantitatea pentru ${item.title}.`}
                              className="flex h-8 w-8 items-center justify-center text-sm"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {t('cart.subtotal')}: {(qty * (reducedPrice ?? unitPrice)).toFixed(2)} lei
                          </span>
                        </div>
                      </div>
                    </div>

                    {item.personalizare && item.personalizare.length > 0 && (
                      <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground">{t('cart.customization')}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setActivePersonalizareId(cartKey);
                              setDraftPersonalizare(item.personalizare ?? []);
                            }}
                            data-track-action={`A deschis personalizarea pentru ${item.title}.`}
                            className="text-[11px] font-semibold text-primary"
                          >
                            {t('cart.edit')}
                          </button>
                        </div>
                        {item.personalizare.map((entry) => (
                          <div key={`${cartKey}-${entry.name}`} className="text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">{entry.label}:</span>{' '}
                            {entry.type === 'upload' && entry.file ? (
                              <div className="mt-2 overflow-hidden rounded-lg border border-border">
                                <img src={entry.file} alt={entry.label} className="h-24 w-full object-cover" />
                              </div>
                            ) : Array.isArray(entry.value) ? (
                              entry.value.join(', ')
                            ) : (
                              entry.value || '-'
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(SHOW_GIFT_OPTION || SHOW_PACKING_OPTION) && (
                      <div className="mt-4 grid gap-3">
                        {SHOW_GIFT_OPTION && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGiftId(cartKey);
                              setDraftMessage(item.giftMessage ?? '');
                            }}
                            data-track-action={`A deschis felicitarea pentru ${item.title}.`}
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-semibold ${
                              giftEnabled ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-border bg-white text-foreground'
                            }`}
                          >
                            <span>{t('cart.giftPersonalized')}</span>
                            <span>{giftEnabled ? t('cart.addedShort') : t('cart.giftPriceShort')}</span>
                          </button>
                        )}
                        {SHOW_PACKING_OPTION && (
                          <button
                            type="button"
                            onClick={() =>
                              updateCartItem(cartKey, { packingSelected: !packingEnabled })
                            }
                            data-track-action={`A schimbat impachetarea pentru ${item.title}.`}
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-semibold ${
                              packingEnabled ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-border bg-white text-foreground'
                            }`}
                          >
                            <span>{t('cart.packingPremiumSummary')}</span>
                            <span>{packingEnabled ? t('cart.addedShort') : t('cart.packingPriceShort')}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            </section>

            <div className="mt-6 space-y-6">
              {totals.cost >= 400 && (
                <div className="rounded-2xl border border-border bg-amber-50/60 p-5">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Info className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-xs text-amber-900">
                      {t('cart.advanceIntroPrefix')}{' '}
                      <span className="font-semibold">30%</span> {t('cart.advanceIntroSuffix')}
                      <button
                        type="button"
                        onClick={() => setShowAdvanceInfo((prev) => !prev)}
                        data-track-action="A afisat detaliile avansului."
                        className="ml-2 text-[11px] font-semibold text-amber-800"
                      >
                        {showAdvanceInfo ? t('cart.advanceHide') : t('cart.advanceMore')}
                      </button>
                      {showAdvanceInfo && (
                        <div className="mt-3 space-y-2 text-[11px] text-amber-900/90">
                          <p>
                            {t('cart.advanceDetailEmail')}
                          </p>
                          <p>
                            {t('cart.advanceDetailContact')}
                          </p>
                          <p>
                            {t('cart.advanceDetailPayment')}
                          </p>
                          <p>
                            <span className="font-semibold">{t('cart.advanceAttentionLabel')}</span> {t('cart.advanceDetailAttention')}
                          </p>
                          <p>
                            {t('cart.advanceDetailMethods')}
                            <br />- {t('cart.advanceMethodCard')};
                            <br />- {t('cart.advanceMethodBank')};
                          </p>
                          <p>
                            {t('cart.advanceDetailBank')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
        )}
                <div className="absolute bottom-0 left-0 right-0 mt-auto border border-l-0 border-r-0 border-b-0 border-t-1 bg-white p-4 shadow-lg" id="cart-summary">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{t('cart.summaryTitle')}</p>
                    <div className="flex flex-1 items-center justify-end gap-3">
                      <span className="text-[11px] font-semibold text-muted-foreground">{t('cart.promoCodeTitle')}</span>
                      <div className="flex min-w-[240px] max-w-[360px] flex-1 items-stretch overflow-hidden rounded-full border border-border bg-white shadow-sm">
                        <div className="relative flex-1">
                          <TicketPercent className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(event) => setPromoCode(event.target.value)}
                            data-track-action="A completat cuponul in cos."
                            placeholder={t('cart.promoCodePlaceholder')}
                            className="h-full w-full rounded-none border-0 bg-transparent pl-9 pr-3 text-xs focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          data-track-action="A aplicat cuponul in cos."
                          className="flex items-center gap-2 bg-amber-600 px-4 text-[11px] font-semibold text-white transition-colors hover:bg-amber-700"
                        >
                          <Sparkles className="h-4 w-4" />
                          {t('cart.applyCoupon')}
                        </button>
                      </div>
                    </div>
                  </div>
                  {couponStatus && (
                      <div
                          className={`mt-2 rounded-lg px-3 py-2 text-[11px] font-semibold ${
                              couponStatus.type === 'success'
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                      >
                        {couponStatus.message}
                      </div>
                  )}
                  {couponDetails && (
                      <div className="mt-2 space-y-2 rounded-lg border border-border bg-white/80 p-2 text-[11px] text-muted-foreground">
                        {couponDetails.invalidProducts.length > 0 && (
                            <ul className="space-y-1 text-left font-medium text-muted-foreground">
                              {couponDetails.invalidProducts.map((item) => (
                                  <li key={`${item.title}-${item.reason}`} className="flex gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span>
                            {item.title}: {item.reason}
                          </span>
                                  </li>
                              ))}
                            </ul>
                        )}
                        {couponDetails.conditions.length > 0 && (
                            <ul className="space-y-1 text-left font-medium text-muted-foreground">
                              {couponDetails.conditions.map((item) => (
                                  <li key={item} className="flex gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span>{item}</span>
                                  </li>
                              ))}
                            </ul>
                        )}
                      </div>
                  )}

                  <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                    {(() => {
                      const productsCost = totals.cost;
                      const discountedProducts = totals.discountedProducts;
                      const subtotal = discountedProducts + totals.giftTotal + totals.packingTotal;
                      const total = subtotal + totals.shipping;

                      const shippingLabel =
                          totals.shipping === 0 ? t('cart.free') : `${totals.shipping.toFixed(2)} lei`;

                      return (
                          <div className="rounded-xl border border-border/60 bg-white px-3 py-2">
                            <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold text-muted-foreground">
                              <span>{t('cart.productsCost', { count: totals.totalItems })}</span>
                              <span>{t('cart.subtotal')}</span>
                              <span>{t('cart.shipping')}</span>
                              <span>{t('cart.totalVat')}</span>
                            </div>
                            <div className="mt-1 grid grid-cols-4 gap-2 text-xs font-semibold text-foreground">
                              <span>{productsCost.toFixed(2)} lei</span>
                              <span>{subtotal.toFixed(2)} lei</span>
                              <span className={totals.shipping === 0 ? 'text-emerald-600' : undefined}>
                          {shippingLabel}
                        </span>
                              <span>{total.toFixed(2)} lei</span>
                            </div>
                          </div>
                      );
                    })()}
                  </div>
                  <button
                      type="button"
                      onClick={() => navigate('/plata-cos')}
                      data-track-action="A mers la finalizare comanda din cos."
                      className="mt-4 w-full rounded-full py-3 text-sm font-semibold text-white shadow-lg"
                      style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {t('cart.continue')}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                </div>

              </div>
            </div>
          </section>


        </div>
      </main>
      <DesktopSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      {showOrderDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-4 shadow-lg">
            <p className="text-base font-semibold text-foreground">{t('product.chooseOrderDate')}</p>
            <input
              type="date"
              className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={orderDate.toISOString().slice(0, 10)}
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                const parsed = new Date(`${value}T12:00:00`);
                if (!Number.isNaN(parsed.getTime())) {
                  setOrderDate(parsed);
                }
              }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1 text-sm font-semibold text-muted-foreground"
                onClick={() => setShowOrderDateModal(false)}
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                className="rounded-full bg-[#6e4514] px-3 py-1 text-sm font-semibold text-white"
                onClick={() => setShowOrderDateModal(false)}
              >
                {t('filters.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
      {activePersonalizareId !== null && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setActivePersonalizareId(null)}
            data-track-action="A inchis personalizarea din cos."
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-foreground">{t('cart.editCustomization')}</h3>
            <div className="mt-4 max-h-[55vh] space-y-4 overflow-y-auto pr-1">
              {draftPersonalizare?.map((entry, index) => (
                <div key={`${entry.name}-${index}`} className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">{entry.label}</label>

                  {entry.type === 'textfield' && (
                    <input
                      type="text"
                      value={typeof entry.value === 'string' ? entry.value : ''}
                      onChange={(event) =>
                        setDraftPersonalizare((prev) =>
                          (prev ?? []).map((item, idx) =>
                            idx === index ? { ...item, value: event.target.value } : item
                          )
                        )
                      }
                      className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                    />
                  )}

                  {entry.type === 'textarea' && (
                    <textarea
                      value={typeof entry.value === 'string' ? entry.value : ''}
                      onChange={(event) =>
                        setDraftPersonalizare((prev) =>
                          (prev ?? []).map((item, idx) =>
                            idx === index ? { ...item, value: event.target.value } : item
                          )
                        )
                      }
                      className="min-h-[100px] w-full resize-y rounded-lg border border-border px-3 py-2 text-sm"
                    />
                  )}

                  {entry.type === 'checkboxes' && entry.options?.length ? (
                    <div className="space-y-2">
                      {entry.options.map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={Array.isArray(entry.value) ? entry.value.includes(option) : false}
                            onChange={(event) =>
                              setDraftPersonalizare((prev) =>
                                (prev ?? []).map((item, idx) => {
                                  if (idx !== index) return item;
                                  const current = Array.isArray(item.value) ? item.value : [];
                                  const next = event.target.checked
                                    ? [...current, option]
                                    : current.filter((opt) => opt !== option);
                                  return { ...item, value: next };
                                })
                              )
                            }
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : entry.type === 'checkboxes' ? (
                    <input
                      type="text"
                      value={Array.isArray(entry.value) ? entry.value.join(', ') : ''}
                      onChange={(event) =>
                        setDraftPersonalizare((prev) =>
                          (prev ?? []).map((item, idx) =>
                            idx === index ? { ...item, value: event.target.value.split(',').map((v) => v.trim()) } : item
                          )
                        )
                      }
                      className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                      placeholder={t('cart.optionsComma')}
                    />
                  ) : null}

                  {entry.type === 'upload' && (
                    <div>
                      <label
                        htmlFor={`cart-upload-${entry.name}`}
                        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d7d2cc] bg-[#faf8f5] px-3 py-5 text-center text-xs text-muted-foreground"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                          📷
                        </span>
                        <span>{t('cart.uploadNewPhoto')}</span>
                      </label>
                      <input
                        id={`cart-upload-${entry.name}`}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setDraftPersonalizare((prev) =>
                              (prev ?? []).map((item, idx) =>
                                idx === index ? { ...item, file: String(reader.result || '') } : item
                              )
                            );
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      {entry.file && (
                        <div className="mt-3 overflow-hidden rounded-lg border border-border">
                          <img src={entry.file} alt={entry.label} className="h-24 w-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setActivePersonalizareId(null)}
                data-track-action="A anulat personalizarea din cos."
                className="flex-1 rounded-full border border-border py-2 text-xs font-semibold text-foreground"
              >
                {t('cart.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activePersonalizareId === null) return;
                  updateCartItem(activePersonalizareId, { personalizare: draftPersonalizare ?? [] });
                  setActivePersonalizareId(null);
                }}
                data-track-action="A salvat personalizarea din cos."
                className="flex-1 rounded-full bg-primary py-2 text-xs font-semibold text-white"
              >
                {t('cart.save')}
              </button>
            </div>
          </div>
        </>
      )}
      {activeGiftId !== null && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveGiftId(null)}
            data-track-action="A inchis felicitarea din cos."
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-foreground">{t('cart.giftModalTitle')}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('cart.giftModalHint')}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[0, 1].map((index) => (
                <div key={`gift-${index}`} className="overflow-hidden rounded-xl border border-border">
                  <img src={productImage} alt={t('cart.giftTitle')} className="h-32 w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold text-foreground">{t('cart.giftMessageLabel')}</label>
              <textarea
                value={draftMessage}
                maxLength={250}
                onChange={(event) => setDraftMessage(event.target.value)}
                data-track-action="A completat mesajul de felicitare."
                className="mt-2 h-28 w-full rounded-xl border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('cart.giftMessagePlaceholder')}
              />
              <div className="mt-1 text-right text-[11px] text-muted-foreground">
                {t('cart.giftCharacters', { count: draftMessage.length })}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveGiftId(null)}
                data-track-action="A anulat felicitarea din cos."
                className="flex-1 rounded-full border border-border py-2 text-xs font-semibold text-foreground"
              >
                {t('cart.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeGiftId === null) return;
                  updateCartItem(activeGiftId, { giftSelected: true, giftMessage: draftMessage });
                  setActiveGiftId(null);
                }}
                data-track-action="A salvat felicitarea din cos."
                className="flex-1 rounded-full bg-primary py-2 text-xs font-semibold text-white"
              >
                {t('cart.giftSave')}
              </button>
            </div>
          </div>
        </>
      )}
      {showCouponOverlay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground shadow">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#c89b59] border-t-transparent" />
            {t('cart.couponOverlay')}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopCartPage;

