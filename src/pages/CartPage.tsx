import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileProductHeader from '@/components/mobile/MobileProductHeader';
import { useShopContext, ShopItem } from '@/contexts/ShopContext';
import MobileSearchSheet from '@/components/mobile/MobileSearchSheet';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { ArrowLeft, ChevronRight, X, Info, Phone, ChevronUp } from 'lucide-react';
import productImage from '@/assets/product-image.jpg';
import PromoBanner, { SHOW_PROMO_BANNER } from '@/components/PromoBanner';
import { getLocale, withLocalePath } from '@/utils/locale';
import { t } from '@/utils/translations';

const SHOW_GIFT_OPTION = false;
const SHOW_PACKING_OPTION = false;

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist, removeFromCart, updateCartItem, isCartLoaded } = useShopContext();
  const { setCurrentSlug } = useCategoryContext();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState('');
  const [activeGiftId, setActiveGiftId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [activePersonalizareId, setActivePersonalizareId] = useState<string | null>(null);
  const [draftPersonalizare, setDraftPersonalizare] = useState<ShopItem['personalizare']>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [showAdvanceInfo, setShowAdvanceInfo] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponStatus, setCouponStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [couponTotals, setCouponTotals] = useState<{ totalDiscount: number } | null>(null);
  const [couponDetails, setCouponDetails] = useState<{
    conditions: string[];
    hasApplicableProducts: boolean;
    invalidProducts: Array<{ title: string; reason: string }>;
  } | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const locale = getLocale();
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

  useEffect(() => {
    const defaultTitle = 'Gifts Factory Catalog';
    document.title = `${t('cart.title')} | ${defaultTitle}`;
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

  return (
    <div className="min-h-screen bg-white pb-4">
      <MobileProductHeader
        title={t('cart.title')}
        onSearchClick={() => setIsSearchOpen(true)}
        onLogoClick={() => {
          setCurrentSlug('gifts-factory');
          navigate(withLocalePath('/'));
        }}
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        onCartClick={() => navigate(withLocalePath('/cos'))}
        onWishlistClick={() => navigate(withLocalePath('/wishlist'))}
        centerTitle
        showTopBanners={false}
      />

        {hasItems && (
          <div className=" mt-0">
            {bannerIndex === 0 && totals.discountedProducts < 200 && (
              <div className="bg-gradient-to-r from-[#f7e6c8] to-[#f1d3a3] px-4 py-3 text-center">
                <p className="text-xs font-semibold text-amber-900">
                  {t('cart.freeShippingPrefix')}{' '}
                  <span className="font-bold text-amber-950">
                    {Math.max(0, 200 - totals.discountedProducts).toFixed(2)} lei
                  </span>{' '}
                  {t('cart.freeShippingSuffix')}
                </p>
              </div>
            )}
            {bannerIndex === 1 && (
              <div className="bg-gradient-to-r from-[#f7e6c8] to-[#f1d3a3] px-4 py-3 text-center">
                <p className="text-xs font-semibold text-amber-900">
                  {t('cart.pointsPrefix')}{' '}
                  <span className="font-bold text-amber-950">{Math.round(totals.total)}</span>{' '}
                  {t('cart.pointsSuffix')}
                </p>
              </div>
            )}
          </div>
        )}

      <div className="px-2 pt-2">
        {hasItems && (
          <div className="mt-0">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-3 text-white" style={{ backgroundImage: 'linear-gradient(45deg, #fae3ca, #fff)' }}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#c89b59]">
                  1
                </span>
                <div className="text-[11px] font-semibold text-amber-900"> 
                  <div>{t('cart.step', { step: 1 })}</div>
                  <div className="text-[10px] font-medium text-amber-900/60">{t('cart.stepCart')}</div>
                </div>
              </div>

              <div className="flex flex-1 items-center gap-2 rounded-xl  px-3 py-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-[11px] font-semibold text-muted-foreground">
                  2
                </span>
                <div className="text-[11px] font-semibold text-muted-foreground">
                  <div>{t('cart.step', { step: 2 })}</div>
                  <div className="text-[10px] font-medium text-muted-foreground">{t('cart.stepBilling')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(-1)}
          data-track-action="A apasat inapoi din cos."
          className="fixed left-0 top-[70%] z-40 flex h-12 w-10 items-center rounded-r-md  justify-center border-r border-border bg-white text-muted-foreground shadow"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {!isCartLoaded ? (
          <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
            {t('cart.loading')}
          </div>
        ) : cart.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{t('cart.empty')}</span>
            <img
              src="/no-results.png"
              alt={t('cart.emptyAlt')}
              className="h-100 w-100 rounded-2xl object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setCurrentSlug('gifts-factory');
                navigate(withLocalePath('/'));
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
            <div className="mt-4 space-y-4">
              {cart.map((item) => {
                const unitPrice = parseFloat(item.price);
                const reducedPrice = item.priceReduced ? parseFloat(item.priceReduced) : null;
                const cartKey = item.cartItemId || `${item.id}`;
                const qty = quantities[cartKey] ?? 1;
                const giftEnabled = item.giftSelected;
                const packingEnabled = item.packingSelected;
                return (
                  <div key={cartKey} className="rounded-2xl border border-border p-3">
                    <div className="flex gap-3">
                      <div className="relative w-[134px]">
                        <button
                          type="button"
                          onClick={() => navigate(withLocalePath(`/produs/${item.slug}`))}
                          data-track-action={`A deschis produsul ${item.title} din cos.`}
                          className="block"
                          aria-label={t('cart.viewProductAria', { title: item.title })}
                        >
                          <img src={item.image} alt={item.title} className="h-[134px] w-[134px] rounded-xl object-cover" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(cartKey)}
                          data-track-action={`A sters produsul ${item.title} din cos.`}
                          className="absolute right-2 top-2 rounded-md bg-red-500 p-1.5 text-white shadow-sm"
                          aria-label={t('cart.removeProduct')}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">{(reducedPrice ?? unitPrice).toFixed(2)} lei</span>
                          {reducedPrice && (
                            <span className="text-xs text-muted-foreground line-through">{unitPrice.toFixed(2)} lei</span>
                          )}
                        </div>
                        <div className="mt-3 inline-flex items-center overflow-hidden rounded-full border border-border">
                          <button
                            type="button"
                            onClick={() => updateQuantity(cartKey, Math.max(1, qty - 1))}
                            data-track-action={`A scazut cantitatea pentru ${item.title}.`}
                            className="flex h-7 w-7 items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            value={qty}
                            readOnly
                            className="h-7 w-10 text-center text-xs font-semibold text-foreground focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(cartKey, qty + 1)}
                            data-track-action={`A crescut cantitatea pentru ${item.title}.`}
                            className="flex h-7 w-7 items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    {item.personalizare && item.personalizare.length > 0 && (
                      <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
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
                              entry.value || t('cart.notAvailable')
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {SHOW_GIFT_OPTION && (
                      <button
                        type="button"
                        onClick={() => {
                          if (giftEnabled) {
                            const shouldRemove = window.confirm(t('cart.giftRemoveConfirm'));
                            if (shouldRemove) {
                                  updateCartItem(cartKey, { giftSelected: false, giftMessage: '' });
                            }
                            return;
                          }
                          setActiveGiftId(cartKey);
                          setDraftMessage(item.giftMessage ?? '');
                        }}
                        data-track-action={`A deschis felicitarea pentru ${item.title}.`}
                        className={`mt-4 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${
                          giftEnabled ? 'border-amber-300 text-white' : 'border-border bg-muted/40'
                        }`}
                        style={giftEnabled ? { backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' } : undefined}
                      >
                        <div>
                          <p className={`font-semibold ${giftEnabled ? 'text-white' : 'text-foreground'}`}>{t('cart.giftTitle')}</p>
                          <p className={`text-[11px] ${giftEnabled ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {t('cart.giftSubtitle')}
                          </p>
                          <p className={`text-[11px] font-semibold ${giftEnabled ? 'text-white' : 'text-primary'}`}>
                            {t('cart.giftPrice')}
                          </p>
                          {giftEnabled && (
                            <span className="mt-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {t('cart.giftAdded')}
                            </span>
                          )}
                        </div>
                        <img
                          src={productImage}
                          alt={t('cart.giftTitle')}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      </button>
                    )}
                    {SHOW_PACKING_OPTION && (
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItem(cartKey, { packingSelected: !packingEnabled })
                        }
                        data-track-action={`A schimbat impachetarea pentru ${item.title}.`}
                        className={`mt-3 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${
                          packingEnabled ? 'border-amber-300 text-white' : 'border-border bg-white'
                        }`}
                        style={packingEnabled ? { backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' } : undefined}
                      >
                        <div>
                          <p className={`font-semibold ${packingEnabled ? 'text-white' : 'text-foreground'}`}>{t('cart.packingTitle')}</p>
                          <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                            packingEnabled ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                          }`}>
                            {packingEnabled ? t('cart.packingPremiumLabel') : t('cart.packingStandard')}
                          </span>
                          {packingEnabled ? (
                            <span className="mt-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {t('cart.packingSelected')}
                            </span>
                          ) : (
                            <p className="mt-2 text-[11px] text-muted-foreground">{t('cart.packingPrice')}</p>
                          )}
                        </div>
                        <img
                          src={productImage}
                          alt={packingEnabled ? t('cart.packingPremiumAlt') : t('cart.packingTitle')}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {locale !== 'en' && (
              <div className="mt-6 space-y-3 rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">{t('cart.promoCodeTitle')}</p>
                <div className="rounded-2xl bg-white ">
                  <div className="flex items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(event) => setPromoCode(event.target.value)}
                      data-track-action="A introdus cod de cupon in cos"
                      placeholder={t('cart.promoCodePlaceholder')}
                      className="flex-1 bg-transparent text-sm focus:outline-none"
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => {
                          setPromoCode('');
                          setAppliedCouponCode(null);
                          setCouponTotals(null);
                          setCouponStatus(null);
                          setCouponDetails(null);
                        }}
                        data-track-action="A resetat cuponul in cos."
                        disabled={!appliedCouponCode || isApplyingCoupon}
                        className="w-full rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground disabled:opacity-50"
                    >
                      {t('cart.reset')}
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      data-track-action="A aplicat cupon in cos."
                      disabled={isApplyingCoupon}
                      className="w-full rounded-full bg-muted px-4 py-2 text-xs font-semibold text-foreground"
                    >
                      {isApplyingCoupon ? t('cart.couponChecking') : t('cart.applyCoupon')}
                    </button>
                  </div>
                  {couponStatus && (
                    <div className="mt-2 space-y-2 text-xs font-semibold">
                      {couponStatus.type === 'success' ? (
                        <p className="text-center text-emerald-600">{couponStatus.message}</p>
                      ) : (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-red-600">
                          <p className="font-semibold">{couponStatus.message}</p>
                          {couponDetails && !couponDetails.hasApplicableProducts && (
                            <p className="mt-1 text-[11px] font-semibold text-red-500">
                              {t('cart.couponNoProducts')}
                            </p>
                          )}
                        </div>
                      )}
                      {couponDetails?.invalidProducts?.length > 0 && (
                        <ul className="space-y-1 text-left text-[11px] font-medium text-muted-foreground">
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
                      {couponDetails?.conditions?.length > 0 && (
                        <ul className="space-y-1 text-left text-[11px] font-medium text-muted-foreground">
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
                </div>
              </div>
            )}

            {totals.cost >= 400 && (
              <div className="mt-6 rounded-2xl border border-border bg-amber-50/60 p-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-xs text-amber-900">
                    {t('cart.advanceIntroPrefix')}{' '}
                    <span className="font-semibold">30%</span>{' '}
                    {t('cart.advanceIntroSuffix')}
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

            {SHOW_PROMO_BANNER && <PromoBanner />}
            <div className="mt-4 rounded-2xl border border-border p-4" id="cart-summary">
              <p className="text-sm font-semibold text-foreground">{t('cart.summaryTitle')}</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                {(() => {
                  const productsCost = totals.cost;
                  const couponDiscount = totals.couponDiscount;
                  const discountedProducts = totals.discountedProducts;
                  const subtotal = discountedProducts + totals.giftTotal + totals.packingTotal;
                  const total = subtotal + totals.shipping;

                  return (
                    <>
                <div className="flex items-center justify-between">
                  <span>{t('cart.productsCost', { count: totals.totalItems })}</span>
                  <span>{productsCost.toFixed(2)} lei</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>{t('cart.couponDiscount')}</span>
                    <span>-{couponDiscount.toFixed(2)} lei</span>
                  </div>
                )}
                {totals.giftTotal > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>{t('cart.gifts')}</span>
                    <span>{totals.giftTotal.toFixed(2)} lei</span>
                  </div>
                )}
                {totals.packingTotal > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>{t('cart.packingPremiumSummary')}</span>
                    <span>{totals.packingTotal.toFixed(2)} lei</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span>{subtotal.toFixed(2)} lei</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('cart.shipping')}</span>
                  {totals.shipping === 0 ? (
                    <span className="font-semibold text-emerald-600">{t('cart.free')}</span>
                  ) : (
                    <span>{totals.shipping.toFixed(2)} lei</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-foreground">
                  <span>{t('cart.totalVat')}</span>
                  <span>{total.toFixed(2)} lei</span>
                </div>
                    </>
                  );
                })()}
              </div>
            </div>

          </>
        )}
      </div>
      {hasItems && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-3 pb-1 pt-1 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.open('tel:0748777776', '_self')}
              data-track-action="A apasat pe suna din cos."
              className="flex h-11 w-11 items-center justify-center rounded-full  text-foreground"
              aria-label={t('nav.call')}
            >
              <Phone className="h-4 w-4" />
            </button>
            <div className="grid flex-1 grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('cart-summary');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                data-track-action="A deschis sumarul cosului."
                className="relative flex flex-col items-center justify-center gap-1 rounded-full border border-border bg-white px-6 py-2 text-[11px] font-semibold text-foreground shadow"
              >
                <ChevronUp className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <span className="rounded-full  px-2 py-0.5 text-[11px] font-semibold text-foreground">
                  {(
                    totals.discountedProducts +
                    totals.giftTotal +
                    totals.packingTotal +
                    totals.shipping
                  ).toFixed(2)} lei
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate(withLocalePath('/plata-cos'))}
                data-track-action="A mers la finalizare comanda din cos."
                className="flex flex-col items-center justify-center gap-1 rounded-full py-2 text-xs font-semibold text-white shadow-lg"
                style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
              >
                <span className="flex items-center gap-2">
                  {t('cart.continue')}
                  <ChevronRight className="h-4 w-4 text-white" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      <MobileSearchSheet isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
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

export default CartPage;

