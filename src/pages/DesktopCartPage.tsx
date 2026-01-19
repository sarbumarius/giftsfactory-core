import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, HelpCircle, Info, Mail, Menu, MessageCircle, Phone, Plus, Search, ShoppingCart, Store, Tag, Users, X } from 'lucide-react';
import logo from '@/assets/factorygifts.svg';
import logoDaruri from '@/assets/logo-daruri.svg';
import productImage from '@/assets/product-image.jpg';
import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import { useShopContext, ShopItem } from '@/contexts/ShopContext';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { fetchSubcategoriesCached } from '@/services/api';
import { SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';
import { getLocale, LocaleCode, setLocale, stripLocalePrefix, withLocalePath } from '@/utils/locale';

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
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponStatus, setCouponStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [couponTotals, setCouponTotals] = useState<{ totalDiscount: number } | null>(null);
  const [couponDetails, setCouponDetails] = useState<{
    conditions: string[];
    hasApplicableProducts: boolean;
    invalidProducts: Array<{ title: string; reason: string }>;
  } | null>(null);
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [locale, setLocaleState] = useState<LocaleCode>(getLocale());
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const hasItems = cart.length > 0;
  const menuItems = [
    { label: 'Categorii', href: '/', icon: Store, isDefaultCategory: true },
    { label: 'Reduceri', href: '/reduceri', icon: Tag },
    { label: 'Recenzii', href: '/recenzii', icon: MessageCircle },
    { label: 'Intrebari frecvente', href: '/intrebari-frecvente', icon: HelpCircle },
    { label: 'Despre mine', href: '/despre-mine', icon: Users },
    { label: 'Creeaza produs', href: '/creeaza-produs', icon: Plus },
    { label: 'Contact', href: '/contact', icon: Phone },
  ];
  const flagSize = 'h-5 w-5';
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
    const defaultTitle = 'Daruri Alese Catalog';
    document.title = `Cos | ${defaultTitle}`;
  }, []);

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

  const handleLocaleChange = (nextLocale: LocaleCode) => {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    setLocaleState(nextLocale);
    if (typeof window === 'undefined') return;
    const path = stripLocalePrefix(window.location.pathname);
    const nextPath = withLocalePath(path, nextLocale);
    window.location.assign(`${nextPath}${window.location.search}${window.location.hash}`);
  };

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
        setCouponStatus({ type: 'error', message: 'Introdu un cod de cupon.' });
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
            title: prod?.titlu || 'Produs',
            reason: prod?.reason || 'Cuponul nu este valabil pentru acest produs.',
          }));
        if (!response.ok || !isValid) {
          setCouponTotals(null);
          setAppliedCouponCode(null);
          setPromoCode('');
          setCouponDetails({ conditions, hasApplicableProducts, invalidProducts });
          setCouponStatus({ type: 'error', message: data?.cupon?.reason || 'Cupon invalid.' });
          if (window.rybbit?.event && code) {
            window.rybbit.event(`Raspuns cupon: ${code} | ${data?.cupon?.reason || 'Cupon invalid.'}`);
          }
          return;
        }
        if (!hasApplicableProducts) {
          setCouponTotals(null);
          setAppliedCouponCode(null);
          setPromoCode('');
          setCouponDetails({ conditions, hasApplicableProducts, invalidProducts });
          setCouponStatus({ type: 'error', message: 'Cuponul nu este valabil pentru niciun produs din cos.' });
          if (window.rybbit?.event && code) {
            window.rybbit.event(`Raspuns cupon: ${code} | Cuponul nu este valabil pentru niciun produs din cos.`);
          }
          return;
        }
        const totalDiscount = Number(data?.totals?.total_discount ?? 0);
        setCouponTotals({ totalDiscount });
        setCouponDetails({ conditions, hasApplicableProducts, invalidProducts });
        if (showSuccess) {
          const successMessage = data?.cupon?.discount_text || 'Cupon aplicat.';
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
        setCouponStatus({ type: 'error', message: 'Nu am putut verifica cuponul.' });
        if (window.rybbit?.event && code) {
          window.rybbit.event(`Raspuns cupon: ${code} | Nu am putut verifica cuponul.`);
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

  const sortCategories = (nodes: SubcategoryTreeNode[]) => {
    return [...nodes].sort((a, b) => {
      const countA = a.subcategorii?.length ?? 0;
      const countB = b.subcategorii?.length ?? 0;
      if (countA !== countB) return countA - countB;
      return a.titlu.localeCompare(b.titlu);
    });
  };

  const renderCategory = (category: SubcategoryTreeNode) => {
    if ((category.nr_produse ?? 0) === 0) {
      return null;
    }
    const title = locale === 'en' ? category.title_en ?? '' : category.titlu;
    const targetSlug = locale === 'en' ? category.slug_en || category.slug : category.slug;
    const hasChildren = category.subcategorii?.length > 0;

    return (
      <div key={category.id}>
        <button
          className="w-full min-w-0 flex items-center gap-3 p-3 bg-white hover:bg-muted/50 transition-colors"
          data-track-action={`A apasat pe categoria ${category.titlu}.`}
          onClick={() => {
            setCurrentSlug(category.slug);
            navigate(withLocalePath(`/categorie/${targetSlug}`));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img
            src={category.imagine}
            alt={category.titlu}
            className="h-8 w-8 object-contain flex-shrink-0"
          />
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{category.nr_produse} produse</p>
          </div>
          {hasChildren && (
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0" />
          )}
        </button>

        {hasChildren && (
          <div>
            {sortCategories(category.subcategorii).map((child) => renderCategory(child))}
          </div>
        )}
      </div>
    );
  };

  const searchResults = useMemo(() => {
    if (!categorySearch.trim() || !treeData) {
      return {
        nodes: [] as SubcategoryTreeNode[],
      };
    }

    const query = categorySearch.toLowerCase();
    const allNodes: SubcategoryTreeNode[] = [];

    const walk = (nodes: SubcategoryTreeNode[]) => {
      nodes.forEach((node) => {
        allNodes.push(node);
        if (node.subcategorii?.length) {
          walk(node.subcategorii);
        }
      });
    };

    walk(treeData.subcategorii);

    const matches = allNodes.filter((node) => {
      return node.titlu.toLowerCase().includes(query) || node.slug.toLowerCase().includes(query);
    });

    return {
      nodes: matches,
    };
  }, [categorySearch, treeData]);

  const orderedCategories = useMemo(() => {
    if (!treeData?.subcategorii) return [];
    return sortCategories(treeData.subcategorii);
  }, [treeData]);

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
      style={{
        backgroundImage:
          'linear-gradient(90deg, #c7bae8 0%, #c7bae8 calc(60px + 0.15 * (100% - 120px)), #f7e0e8 calc(60px + 0.15 * (100% - 120px)), #f7e0e8 100%)',
      }}
    >
      <main className="mx-auto h-full w-full px-[60px] py-[60px]">
        <div className="grid h-[calc(100vh-120px)] grid-cols-[15%_65%_20%] gap-0 overflow-hidden rounded-2xl">
          <aside className="flex min-h-full flex-col border-r border-white/20 bg-[#6844c1]">
            <div className="border-b border-white/20 p-4">
              <button
                type="button"
                onClick={() => {
                  setCurrentSlug('gifts-factory');
                  navigate(withLocalePath('/'));
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
                        navigate(withLocalePath(item.href));
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
                  onClick={() => navigate(withLocalePath('/wishlist'))}
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
                  onClick={() => navigate(withLocalePath('/cos'))}
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

            <div className="flex-1 overflow-y-auto pb-6">
              {hasItems && (
                <div className="mt-0 px-4">
                  {bannerIndex === 0 && totals.discountedProducts < 200 && (
                    <div className="bg-gradient-to-r from-[#f7e6c8] to-[#f1d3a3] px-8 py-3 text-center">
                      <p className="text-sm font-semibold text-amber-900">
                        Mai adauga{' '}
                        <span className="font-bold text-amber-950">
                          {Math.max(0, 200 - totals.discountedProducts).toFixed(2)} lei
                        </span>{' '}
                        in cos si ai transport gratuit.
                      </p>
                    </div>
                  )}
                  {bannerIndex === 1 && (
                    <div className="bg-gradient-to-r from-[#f7e6c8] to-[#f1d3a3] px-8 py-3 text-center">
                      <p className="text-sm font-semibold text-amber-900">
                        Comanda si primesti{' '}
                        <span className="font-bold text-amber-950">{Math.round(totals.total)}</span> pct la urmatoarele comenzi.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="px-4 pb-6">
        {!isCartLoaded ? (
          <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
            Se incarca...
          </div>
        ) : cart.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Cosul este gol.</span>
            <img
              src="/no-results.png"
              alt="Cos gol"
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
              Vezi categorii
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_360px] gap-8">
            <section className="space-y-6">
              <div className="rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cos de cumparaturi</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">Ai {totals.totalItems} produse in cos</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    data-track-action="A mers la categorii din cos."
                    className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground"
                  >
                    Continua cumparaturile
                  </button>
                </div>
              </div>

              {cart.map((item) => {
                const unitPrice = parseFloat(item.price);
                const reducedPrice = item.priceReduced ? parseFloat(item.priceReduced) : null;
                const cartKey = item.cartItemId || `${item.id}`;
                const qty = quantities[cartKey] ?? 1;
                const giftEnabled = item.giftSelected;
                const packingEnabled = item.packingSelected;
                return (
                  <div key={cartKey} className="rounded-2xl border border-border bg-white p-5">
                    <div className="flex gap-5">
                      <button
                        type="button"
                        onClick={() => navigate(`/produs/${item.slug}`)}
                        data-track-action={`A deschis produsul ${item.title} din cos.`}
                        className="h-28 w-28 overflow-hidden rounded-xl"
                        aria-label={`Vezi produsul ${item.title}`}
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
                            aria-label="Sterge produs"
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
                          <span className="text-xs text-muted-foreground">Subtotal: {(qty * (reducedPrice ?? unitPrice)).toFixed(2)} lei</span>
                        </div>
                      </div>
                    </div>

                    {item.personalizare && item.personalizare.length > 0 && (
                      <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground">Personalizare</p>
                          <button
                            type="button"
                            onClick={() => {
                              setActivePersonalizareId(cartKey);
                              setDraftPersonalizare(item.personalizare ?? []);
                            }}
                            data-track-action={`A deschis personalizarea pentru ${item.title}.`}
                            className="text-[11px] font-semibold text-primary"
                          >
                            Editeaza
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
                            <span>Felicitare personalizata</span>
                            <span>{giftEnabled ? 'Adaugata' : '10 lei'}</span>
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
                            <span>Impachetare premium</span>
                            <span>{packingEnabled ? 'Adaugata' : '20 lei'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            </section>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="text-sm font-semibold text-foreground">Cupon de reducere</p>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value)}
                    data-track-action="A completat cuponul in cos."
                    placeholder="Introdu codul"
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    data-track-action="A aplicat cuponul in cos."
                    className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Aplica
                  </button>
                </div>
                {couponStatus && (
                  <div
                    className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${
                      couponStatus.type === 'success'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    {couponStatus.message}
                  </div>
                )}
                {couponDetails && (
                  <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                    {couponDetails.invalidProducts.length > 0 && (
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
                    {couponDetails.conditions.length > 0 && (
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

              {totals.cost >= 400 && (
                <div className="rounded-2xl border border-border bg-amber-50/60 p-5">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Info className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-xs text-amber-900">
                      Pentru realizarea produselor indicate va fi necesara achitarea unui avans de minim{' '}
                      <span className="font-semibold">30%</span> din valoarea acestora dupa confirmarea telefonica.
                      <button
                        type="button"
                        onClick={() => setShowAdvanceInfo((prev) => !prev)}
                        data-track-action="A afisat detaliile avansului."
                        className="ml-2 text-[11px] font-semibold text-amber-800"
                      >
                        {showAdvanceInfo ? 'Ascunde detalii' : 'Mai multe detalii'}
                      </button>
                      {showAdvanceInfo && (
                        <div className="mt-3 space-y-2 text-[11px] text-amber-900/90">
                          <p>
                            Dupa transmiterea comenzii vei primi un email automat de confirmare cu produsele si datele de personalizare completate.
                          </p>
                          <p>
                            Cel tarziu, in urmatoarea zi lucratoare un reprezentat Daruri Alese te va contacta pentru confirmarea datelor.
                          </p>
                          <p>
                            Pentru procesarea comenzii cu produsele selectate personalizate conform cerintelor, va fi necesara plata unui avans de minim 30% din valoarea acestora dupa confirmarea telefonica.
                          </p>
                          <p>
                            <span className="font-semibold">ATENTIE:</span> Grafica personalizata va fi realizata doar dupa achitarea avansului.
                          </p>
                          <p>
                            Plata poate fi realizata prin urmatoarele metode:
                            <br />- Online cu cardul;
                            <br />- Transfer bancar;
                          </p>
                          <p>
                            Informatiile bancare pentru realizarea platii vor fi transmise pe email dupa confirmarea telefonica a comenzii.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-white p-5" id="cart-summary">
                <p className="text-sm font-semibold text-foreground">Sumar comanda</p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {(() => {
                    const productsCost = totals.cost;
                    const couponDiscount = totals.couponDiscount;
                    const discountedProducts = totals.discountedProducts;
                    const subtotal = discountedProducts + totals.giftTotal + totals.packingTotal;
                    const total = subtotal + totals.shipping;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span>Cost produse ({totals.totalItems})</span>
                          <span>{productsCost.toFixed(2)} lei</span>
                        </div>
                        {couponDiscount > 0 && (
                          <div className="flex items-center justify-between text-emerald-600">
                            <span>Reducere cupon</span>
                            <span>-{couponDiscount.toFixed(2)} lei</span>
                          </div>
                        )}
                        {totals.giftTotal > 0 && (
                          <div className="flex items-center justify-between text-emerald-600">
                            <span>Felicitari</span>
                            <span>{totals.giftTotal.toFixed(2)} lei</span>
                          </div>
                        )}
                        {totals.packingTotal > 0 && (
                          <div className="flex items-center justify-between text-emerald-600">
                            <span>Impachetare premium</span>
                            <span>{totals.packingTotal.toFixed(2)} lei</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>Subtotal</span>
                          <span>{subtotal.toFixed(2)} lei</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Transport curier</span>
                          {totals.shipping === 0 ? (
                            <span className="font-semibold text-emerald-600">Gratuit</span>
                          ) : (
                            <span>{totals.shipping.toFixed(2)} lei</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-base font-semibold text-foreground">
                          <span>Total (TVA inclus)</span>
                          <span>{total.toFixed(2)} lei</span>
                        </div>
                      </>
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
                  Continua spre plata
                </button>
                <button
                  type="button"
                  onClick={() => window.open('tel:0748777776', '_self')}
                  data-track-action="A apasat pe suna din cos."
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border py-2 text-xs font-semibold text-foreground"
                >
                  <Phone className="h-4 w-4" />
                  Suna acum
                </button>
              </div>
            </aside>
          </div>
        )}
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
                ref={categoryScrollRef}
                className="category-scroll flex-1 overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#6844c1]/60 [&::-webkit-scrollbar-thumb]:hover:bg-[#6844c1]"
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
                      {sortCategories(searchResults.nodes).map((cat) => renderCategory(cat))}
                    </div>
                  )
                ) : (
                  <div>
                    {orderedCategories.map((cat) => renderCategory(cat))}
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#6844c1]/20 via-white/80 to-transparent" />
              <button
                type="button"
                data-track-action="A apasat pe scroll in categorii."
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-[#6844c1] px-3 py-2 text-xs font-semibold text-white shadow-md transition-transform hover:scale-105"
                aria-label="Scroll in jos"
                onClick={() => {
                  categoryScrollRef.current?.scrollBy({ top: 240, behavior: 'smooth' });
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
      {activePersonalizareId !== null && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setActivePersonalizareId(null)}
            data-track-action="A inchis personalizarea din cos."
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-foreground">Editeaza personalizare</h3>
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
                      placeholder="Optiuni separate prin virgula"
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
                        <span>Incarca o poza noua</span>
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
                Anuleaza
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
                Salveaza
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
            <h3 className="text-sm font-semibold text-foreground">Felicitare cu mesaj personalizat</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Scrie un mesaj scurt si noi il imprimam pe felicitare, langa cadoul tau.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[0, 1].map((index) => (
                <div key={`gift-${index}`} className="overflow-hidden rounded-xl border border-border">
                  <img src={productImage} alt="Felicitare" className="h-32 w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold text-foreground">Mesajul tau (max 250 de caractere)</label>
              <textarea
                value={draftMessage}
                maxLength={250}
                onChange={(event) => setDraftMessage(event.target.value)}
                data-track-action="A completat mesajul de felicitare."
                className="mt-2 h-28 w-full rounded-xl border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Scrie mesajul aici..."
              />
              <div className="mt-1 text-right text-[11px] text-muted-foreground">
                {draftMessage.length}/250 caractere
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveGiftId(null)}
                data-track-action="A anulat felicitarea din cos."
                className="flex-1 rounded-full border border-border py-2 text-xs font-semibold text-foreground"
              >
                Anuleaza
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
                Salveaza felicitare
              </button>
            </div>
          </div>
        </>
      )}
      {showCouponOverlay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground shadow">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#c89b59] border-t-transparent" />
            Verificam cuponul...
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopCartPage;

