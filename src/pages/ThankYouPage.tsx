import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import MobileProductHeader from '@/components/mobile/MobileProductHeader';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { tiktokPlaceAnOrder, tiktokIdentify } from '@/utils/tiktok';
import { fbPurchase } from '@/utils/facebook';

type OrderResponse = {
  success?: boolean;
  message?: string;
  order?: {
    id: number;
    number: string;
    key: string;
    status: string;
    date_created: string;
    customer_note?: string;
  };
  customer?: {
    id: number;
    existed: boolean;
    email: string;
    first_name: string;
    last_name: string;
  };
  billing?: {
    first_name: string;
    last_name: string;
    company?: string;
    email?: string;
    phone?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    company?: string;
    phone?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  company?: {
    cui?: string;
    reg_com?: string;
    nume_firma?: string;
  };
  payment_method?: { id: string; title: string };
  shipping_method?: { id: number; title: string };
  products?: Array<{
    product_id: number;
    name: string;
    quantity: number;
    subtotal: string;
    total: string;
    tax: string;
    image_url?: string;
    sku?: string;
    meta_data?: Record<string, string>;
  }>;
  totals?: {
    subtotal?: string;
    discount_total?: string;
    shipping_total?: string;
    total?: string;
    currency?: string;
  };
  coupons?: string[];
  errors?: string[];
  urls?: {
    payment?: string;
    view_order?: string;
    thank_you?: string;
  };
  warnings?: string[];
  timestamp?: string;
};

const ThankYouPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, wishlist, clearCart } = useShopContext();
  const { setCurrentSlug } = useCategoryContext();
  const [data, setData] = useState<OrderResponse | null>(null);
  const [detailsIndex, setDetailsIndex] = useState(0);
  const hasClearedRef = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (location.state) {
      setData(location.state as OrderResponse);
      return;
    }
    try {
      const stored = sessionStorage.getItem('checkout-last-response');
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch {
      setData(null);
    }
  }, [location.state]);

  useEffect(() => {
    const defaultTitle = 'Daruri Alese Catalog';
    document.title = `Comanda primita | ${defaultTitle}`;
  }, []);

  useEffect(() => {
    if (!data?.order?.number || hasClearedRef.current) return;
    hasClearedRef.current = true;
    clearCart();
    localStorage.removeItem('checkout-form');
    sessionStorage.removeItem('checkout-last-response');

    const email = data?.customer?.email || data?.billing?.email;
    const phone = data?.billing?.phone;
    const customerId = data?.customer?.id ? String(data.customer.id) : undefined;
    tiktokIdentify(email, phone, customerId);

    if (data?.products && data?.totals?.total) {
      const products = data.products.map(p => ({
        id: String(p.product_id),
        name: p.name,
      }));
      const total = parseFloat(data.totals.total);
      const shippingTotal = parseFloat(data.totals.shipping_total || '0');
      const totalWithoutShipping = total - shippingTotal;
      const totalWithoutVAT = totalWithoutShipping / 1.21;
      const currency = data.totals.currency || 'RON';
      tiktokPlaceAnOrder(products, totalWithoutVAT, currency);
      fbPurchase(products, totalWithoutVAT, currency);
    }
  }, [data?.order?.number, clearCart, data]);

  const hasData = Boolean(data?.order?.number);
  const totals = data?.totals ?? {};
  const products = data?.products ?? [];

  const formattedTotal = useMemo(() => {
    if (!totals?.total) return '';
    return `${totals.total} ${totals.currency ?? 'RON'}`;
  }, [totals]);

  const formatMoney = (value?: string, fallback = '-') => {
    if (!value) return fallback;
    return `${value} RON`;
  };

  const formatMetaLabel = (value: string) =>
    value
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (match) => match.toUpperCase());

  const isImageMeta = (key: string, value: string) => {
    if (!value) return false;
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.includes('poza') || normalizedKey.includes('image') || normalizedKey.includes('img')) {
      return true;
    }
    if (value.startsWith('data:image/')) {
      return true;
    }
    return /^https?:\/\/.+\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(value);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <MobileProductHeader
        title="Comanda primita"
        onBack={() => navigate(-1)}
        centerTitle
        onLogoClick={() => {
          setCurrentSlug('gifts-factory');
          navigate('/');
        }}
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        onCartClick={() => navigate('/cos')}
        onWishlistClick={() => navigate('/wishlist')}
      />

      <div className="px-4 pt-4 space-y-4">
        {!hasData && (
          <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
            Nu avem date despre aceasta comanda.
          </div>
        )}

        {hasData && (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2 flex w-full items-center justify-center">
                <img src="/thanks.png" alt="Comanda confirmata" className="w-[60%] max-w-[320px] object-contain" />
              </div>
              {data?.order?.number && (
                <button
                  type="button"
                  onClick={() => {
                    const value = `Comanda #${data.order?.number}`;
                    if (navigator?.clipboard?.writeText) {
                      navigator.clipboard.writeText(value).catch(() => {});
                    }
                  }}
                  data-track-action="A copiat numarul comenzii."
                  className="mt-2 mb-3 inline-flex items-center gap-2 rounded-full border border-dashed border-emerald-300 bg-emerald-50 px-4 py-2 text-[13px] font-semibold text-emerald-800"
                >
                  <span>Comanda #{data.order.number}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>

                  </span>
                </button>
              )}
              <p className="text-sm font-semibold text-foreground">
                Draga {data?.billing?.first_name || data?.customer?.first_name || ''},
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">Multumim pentru comanda!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Comanda ta se afla in {data?.order?.status}
              </p>

            </div>



            {products.length > 0 && (
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-sm font-semibold text-foreground">Produse</p>
                <div className="mt-3 space-y-3">
                  {products.map((product) => (
                    <div key={`${product.product_id}-${product.sku || ''}`} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-xl border border-border bg-muted">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Cantitate: {product.quantity}</p>
                          <p className="text-xs text-muted-foreground">Total: {product.total} RON</p>
                        </div>
                      </div>
                      {product.meta_data && (
                        <div className="rounded-lg border border-border bg-muted/20 p-2 text-[11px] text-muted-foreground">
                          {Object.entries(product.meta_data)
                            .filter(([key, value]) => !isImageMeta(key, value))
                            .map(([key, value]) => (
                              <div key={`${product.product_id}-${key}`}>
                                <span className="font-semibold text-foreground">{formatMetaLabel(key)}:</span>{' '}
                                {value}
                              </div>
                            ))}
                          {Object.entries(product.meta_data)
                            .filter(([key, value]) => isImageMeta(key, value))
                            .map(([key, value]) => (
                              <div
                                key={`${product.product_id}-${key}-image`}
                                className="mt-2 overflow-hidden rounded-lg border border-border"
                              >
                                <img src={value} alt={product.name} className="h-32 w-full object-cover" />
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-sm font-semibold text-foreground">Sumar comanda</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatMoney(totals?.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reduceri</span>
                  <span>{formatMoney(totals?.discount_total, '0.00 RON')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Transport</span>
                  <span>{formatMoney(totals?.shipping_total, '0.00 RON')}</span>
                </div>
                {data?.coupons && data.coupons.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Cupon</span>
                    <span>{data.coupons.join(', ')}</span>
                  </div>
                )}
                {data?.errors && data.errors.length > 0 && (
                  <div className="flex items-center justify-between text-rose-600">
                    <span>Erori</span>
                    <span>{data.errors.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formattedTotal || '-'}</span>
                </div>
              </div>
              {totals?.subtotal && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span>
                    Contul tau a fost incarcat cu {Math.round(Number(totals.subtotal ?? 0))} puncte.
                  </span>
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                    💳
                  </span>
                  <p className="text-sm font-semibold text-foreground">Metoda de plata</p>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>{data?.payment_method?.title ?? '-'}</p>
                  {data?.payment_method?.id === 'bacs' && (
                    <div className="mt-2 space-y-1 rounded-lg border border-border bg-muted/20 p-2 text-[11px]">
                      <p className="font-semibold text-foreground">ING BANK ROMANIA</p>
                      <p>RO74INGB0000999906973879</p>
                      <p className="font-semibold text-foreground">Trezorerie operativa Sector5</p>
                      <p>RO65TREZ7055069XXX012556</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    🚚
                  </span>
                  <p className="text-sm font-semibold text-foreground">Metoda de livrare</p>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>{data?.shipping_method?.title ?? '-'}</p>
                </div>
              </div>
            </div>

            {data?.company && (data.company.cui || data.company.nume_firma || data.company.reg_com) && (
                <div className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-sm font-semibold text-foreground">Date firma</p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {data.company.nume_firma && <p>Nume firma: {data.company.nume_firma}</p>}
                    {data.company.cui && <p>CUI: {data.company.cui}</p>}
                    {data.company.reg_com && <p>Reg. com: {data.company.reg_com}</p>}
                  </div>
                </div>
            )}

            {(data?.billing || data?.shipping) && (
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-sm font-semibold text-foreground">Detalii facturare si livrare</p>
                <div className="relative mt-3 overflow-hidden">
                  <div
                    className="flex transition-transform duration-300"
                    style={{ transform: `translateX(-${detailsIndex * 100}%)` }}
                  >
                    {data?.billing && (
                      <div className="relative w-full shrink-0 space-y-3 rounded-xl border border-border bg-white p-3 text-xs text-muted-foreground">
                        <span className="absolute right-2 top-2 text-3xl opacity-10">F</span>
                        <p className="text-xs font-semibold text-foreground">Facturare</p>
                        <p>{data.billing.first_name} {data.billing.last_name}</p>
                        {data.billing.address_1 && <p>{data.billing.address_1}</p>}
                        {data.billing.address_2 && <p>{data.billing.address_2}</p>}
                        <p>{data.billing.city} {data.billing.state}</p>
                        <p>{data.billing.postcode}</p>
                        {data.billing.phone && <p>{data.billing.phone}</p>}
                        <div className="overflow-hidden rounded-lg border border-border">
                          <iframe
                            title="Harta facturare"
                            src={`https://www.google.com/maps?q=${encodeURIComponent(
                              `${data.billing.city || ''} ${data.billing.state || ''}`
                            )}&output=embed`}
                            className="h-40 w-full border-0"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                    {data?.shipping && (
                      <div className="relative w-full shrink-0 space-y-3 rounded-xl border border-border bg-white p-3 text-xs text-muted-foreground">
                        <span className="absolute right-2 top-2 text-3xl opacity-10">L</span>
                        <p className="text-xs font-semibold text-foreground">Livrare</p>
                        <p>{data.shipping.first_name} {data.shipping.last_name}</p>
                        {data.shipping.address_1 && <p>{data.shipping.address_1}</p>}
                        {data.shipping.address_2 && <p>{data.shipping.address_2}</p>}
                        <p>{data.shipping.city} {data.shipping.state}</p>
                        <p>{data.shipping.postcode}</p>
                        {data.shipping.phone && <p>{data.shipping.phone}</p>}
                        <div className="overflow-hidden rounded-lg border border-border">
                          <iframe
                            title="Harta livrare"
                            src={`https://www.google.com/maps?q=${encodeURIComponent(
                              `${data.shipping.city || ''} ${data.shipping.state || ''}`
                            )}&output=embed`}
                            className="h-40 w-full border-0"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {data?.billing && data?.shipping && (
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setDetailsIndex(0)}
                        data-track-action="A vazut detaliile de facturare."
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                          detailsIndex === 0 ? 'border-amber-300 text-amber-700' : 'border-border text-muted-foreground'
                        }`}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Facturare
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailsIndex(1)}
                        data-track-action="A vazut detaliile de livrare."
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                          detailsIndex === 1 ? 'border-amber-300 text-amber-700' : 'border-border text-muted-foreground'
                        }`}
                      >
                        Livrare
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}



            {data?.customer && (
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-sm font-semibold text-foreground">Client</p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>
                    {data.customer.first_name} {data.customer.last_name}
                  </p>
                  <p>{data.customer.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/cont')}
                  data-track-action="A mers la conectare din thank you."
                  className="mt-3 w-full rounded-full px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
                >
                  Conecteaza-te
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate(-1)}
        data-track-action="A apasat inapoi din thank you."
        className="fixed left-0 top-[75%] z-40 flex h-12 w-10 items-center justify-center rounded-r-md border-r border-border bg-white text-muted-foreground shadow"
        aria-label="Inapoi"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ThankYouPage;
