import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronUp, CreditCard, Mail, Phone, Search, Truck } from 'lucide-react';
import DesktopSidebar from '@/components/desktop/DesktopSidebar';
import DesktopTopBar from '@/components/desktop/DesktopTopBar';
import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import { useShopContext } from '@/contexts/ShopContext';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { toast } from '@/hooks/use-toast';
import { termsHtml, privacyHtml } from '@/content/legal';
import { tiktokInitiateCheckout, tiktokIdentify } from '@/utils/tiktok';
import { fbInitiateCheckout } from '@/utils/facebook';
import { fetchSubcategoriesCached } from '@/services/api';
import { SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';
import { getLocale, withLocalePath } from '@/utils/locale';
import { t } from '@/utils/translations';

type DeliveryMethod = 'sameday' | 'dpd' | 'fan' | 'easybox' | 'pickup';
type PaymentMethod = 'ramburs' | 'transfer';
type CustomerType = 'individual' | 'company';
type ShippingFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  county: string;
  locality: string;
  address1: string;
  address2: string;
  postcode: string;
  country: string;
};
type BillingFormData = {
  billing_first_name: string;
  billing_last_name: string;
  billing_email: string;
  billing_phone: string;
  billing_county: string;
  billing_locality: string;
  billing_address_1: string;
  billing_address_2: string;
  billing_postcode: string;
  billing_country: string;
};
type SamedayRow = {
  Judet?: string;
  Localitate?: string;
  Comuna?: string;
  Cerc?: string;
  'Km aditionali'?: string | number;
};
type LockerRow = {
  id?: string | number;
  locker_id?: string;
  name?: string;
  county?: string;
  city?: string;
  address?: string;
  lat?: string | number;
  lng?: string | number;
  postal_code?: string;
  boxes?: string | number;
};

declare global {
  interface Window {
    L?: any;
  }
}

const loadLeaflet = (() => {
  let promise: Promise<any> | null = null;
  return () => {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('leaflet-unavailable'));
    }
    if (window.L) {
      return Promise.resolve(window.L);
    }
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      const existing = document.getElementById('leaflet-script');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.L));
        return;
      }
      const linkId = 'leaflet-style';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const script = document.createElement('script');
      script.id = 'leaflet-script';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error('leaflet-load-failed'));
      document.body.appendChild(script);
    });
    return promise;
  };
})();

const SHOW_SURPRISE_GIFT = false;
const SHOW_PROMO_CODE = false;
const CHECKOUT_STORAGE_KEY = 'checkout-form';
const CHECKOUT_ENCRYPTION_KEY = 'daruri-alese-checkout-v1';
const SHOW_SAMEDAY = true;
const SHOW_DPD = true;
const SHOW_EASYBOX = true;
const EMPTY_SHIPPING_DATA: ShippingFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  county: '',
  locality: '',
  address1: '',
  address2: '',
  postcode: '',
  country: 'Romania',
};

const buildShippingFromBilling = (billing: BillingFormData): ShippingFormData => ({
  firstName: billing.billing_first_name,
  lastName: billing.billing_last_name,
  email: billing.billing_email,
  phone: billing.billing_phone,
  county: billing.billing_county,
  locality: billing.billing_locality,
  address1: billing.billing_address_1,
  address2: billing.billing_address_2,
  postcode: billing.billing_postcode,
  country: billing.billing_country || 'Romania',
});

const isShippingSyncedWithBilling = (shipping: ShippingFormData, billing: BillingFormData) => {
  const synced = buildShippingFromBilling(billing);
  return (Object.keys(synced) as Array<keyof ShippingFormData>).every((key) => shipping[key] === synced[key]);
};

const isShippingEmpty = (shipping: ShippingFormData) =>
  !shipping.firstName.trim() &&
  !shipping.lastName.trim() &&
  !shipping.email.trim() &&
  !shipping.phone.trim() &&
  !shipping.county.trim() &&
  !shipping.locality.trim() &&
  !shipping.address1.trim() &&
  !shipping.address2.trim() &&
  !shipping.postcode.trim();

type CustomerCheckResponse = {
  success?: boolean;
  customer_exists?: boolean;
  found_by?: string[];
  verificari?: {
    email?: { searched?: string; found?: boolean };
    telefon?: { searched?: string; found?: boolean };
  };
};

const DesktopCheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const { searchQuery, setSearchQuery, setCurrentSlug } = useCategoryContext();
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('sameday');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ramburs');
  const [customerType, setCustomerType] = useState<CustomerType>('individual');
  const [openPersonalizareId, setOpenPersonalizareId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponStatus, setCouponStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [couponTotals, setCouponTotals] = useState<{ totalDiscount: number } | null>(null);
  const [couponDetails, setCouponDetails] = useState<{
    conditions: string[];
    hasApplicableProducts: boolean;
    invalidProducts: Array<{ title: string; reason: string }>;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const lastValidatedSignatureRef = useRef<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [isSurpriseGift, setIsSurpriseGift] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const isHydratedRef = useRef(false);
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerCheck, setCustomerCheck] = useState<{
    loading: boolean;
    response: CustomerCheckResponse | null;
  }>({ loading: false, response: null });
  const customerCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [billingCountyOpen, setBillingCountyOpen] = useState(false);
  const [shippingCountyOpen, setShippingCountyOpen] = useState(false);
  const [billingCountyQuery, setBillingCountyQuery] = useState('');
  const [shippingCountyQuery, setShippingCountyQuery] = useState('');
  const [billingLocalityOpen, setBillingLocalityOpen] = useState(false);
  const [shippingLocalityOpen, setShippingLocalityOpen] = useState(false);
  const [lockerOpen, setLockerOpen] = useState(false);
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const locale = getLocale();

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
        setCategoryError(err instanceof Error ? err.message : t('category.loadError'));
        setIsLoadingCategories(false);
      });
    return () => {
      isActive = false;
    };
  }, [treeData]);

  const toBase64 = (value: Uint8Array) => {
    let binary = '';
    value.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const fromBase64 = (value: string) => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const getCryptoKey = async () => {
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(CHECKOUT_ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
  };

  const encryptPayload = async (payload: unknown) => {
    const encoder = new TextEncoder();
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = encoder.encode(JSON.stringify(payload));
    const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
    return JSON.stringify({ iv: toBase64(iv), data: toBase64(cipher) });
  };

  const decryptPayload = async (raw: string) => {
    const parsed = JSON.parse(raw);
    if (!parsed?.iv || !parsed?.data) return null;
    const key = await getCryptoKey();
    const iv = fromBase64(parsed.iv);
    const data = fromBase64(parsed.data);
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data));
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plain));
  };
  
  const [useDifferentShipping, setUseDifferentShipping] = useState(false);
  const [shippingData, setShippingData] = useState<ShippingFormData>(() => ({ ...EMPTY_SHIPPING_DATA }));
  const [billingData, setBillingData] = useState<BillingFormData>({
    billing_first_name: '',
    billing_last_name: '',
    billing_email: '',
    billing_phone: '',
    billing_county: '',
    billing_locality: '',
    billing_address_1: '',
    billing_address_2: '',
    billing_postcode: '',
    billing_country: 'Romania',
  });
  const [companyData, setCompanyData] = useState({
    companyName: '',
    cui: '',
    registry: '',
  });
  const [samedayRows, setSamedayRows] = useState<SamedayRow[]>([]);
  const [isSamedayLoading, setIsSamedayLoading] = useState(true);
  const [billingComuna, setBillingComuna] = useState('');
  const [shippingComuna, setShippingComuna] = useState('');
  const [lockerRows, setLockerRows] = useState<LockerRow[]>([]);
  const [isLockerLoading, setIsLockerLoading] = useState(true);
  const [selectedLockerId, setSelectedLockerId] = useState('');
  const [lockerQuery, setLockerQuery] = useState('');
  const lastLockerContextRef = useRef('');
  const lockerMapRef = useRef<HTMLDivElement | null>(null);
  const lockerMapInstanceRef = useRef<any>(null);
  const lockerMarkersRef = useRef<any>(null);
  const counties = useMemo(
    () => [
      { name: 'Alba', code: 'AB' },
      { name: 'Arad', code: 'AR' },
      { name: 'Arges', code: 'AG' },
      { name: 'Bacau', code: 'BC' },
      { name: 'Bihor', code: 'BH' },
      { name: 'Bistrita-Nasaud', code: 'BN' },
      { name: 'Botosani', code: 'BT' },
      { name: 'Braila', code: 'BR' },
      { name: 'Brasov', code: 'BV' },
      { name: 'Bucuresti', code: 'B' },
      { name: 'Buzau', code: 'BZ' },
      { name: 'Calarasi', code: 'CL' },
      { name: 'Caras-Severin', code: 'CS' },
      { name: 'Cluj', code: 'CJ' },
      { name: 'Constanta', code: 'CT' },
      { name: 'Covasna', code: 'CV' },
      { name: 'Dambovita', code: 'DB' },
      { name: 'Dolj', code: 'DJ' },
      { name: 'Galati', code: 'GL' },
      { name: 'Giurgiu', code: 'GR' },
      { name: 'Gorj', code: 'GJ' },
      { name: 'Harghita', code: 'HR' },
      { name: 'Hunedoara', code: 'HD' },
      { name: 'Ialomita', code: 'IL' },
      { name: 'Iasi', code: 'IS' },
      { name: 'Ilfov', code: 'IF' },
      { name: 'Maramures', code: 'MM' },
      { name: 'Mehedinti', code: 'MH' },
      { name: 'Mures', code: 'MS' },
      { name: 'Neamt', code: 'NT' },
      { name: 'Olt', code: 'OT' },
      { name: 'Prahova', code: 'PH' },
      { name: 'Salaj', code: 'SJ' },
      { name: 'Satu Mare', code: 'SM' },
      { name: 'Sibiu', code: 'SB' },
      { name: 'Suceava', code: 'SV' },
      { name: 'Teleorman', code: 'TR' },
      { name: 'Timis', code: 'TM' },
      { name: 'Tulcea', code: 'TL' },
      { name: 'Valcea', code: 'VL' },
      { name: 'Vaslui', code: 'VS' },
      { name: 'Vrancea', code: 'VN' },
    ],
    []
  );
  const countyNameByCode = useMemo(() => new Map(counties.map((county) => [county.code, county.name])), [counties]);

  const normalizeText = useCallback((value: string) => {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  const filterLocalities = useCallback(
    (localities: string[], query: string) => {
      if (!query) return localities;
      const normalized = normalizeText(query);
      return localities.filter((item) => normalizeText(item).includes(normalized));
    },
    [normalizeText]
  );

  const isExactLocality = useCallback(
    (localities: string[], value: string) => {
      if (!value) return false;
      const normalized = normalizeText(value);
      return localities.some((item) => normalizeText(item) === normalized);
    },
    [normalizeText]
  );

  const countyCodeByName = useMemo(
    () => new Map(counties.map((county) => [normalizeText(county.name), county.code])),
    [counties, normalizeText]
  );

  const getLockerLabel = useCallback((row: LockerRow) => {
    const name = String(row.name ?? 'Locker').trim();
    const address = String(row.address ?? '').trim();
    return address ? `${name} - ${address}` : name;
  }, []);

  const parseLockerBoxes = useCallback((value?: string | number) => {
    if (typeof value === 'number') return { total: value, sizes: [] as Array<{ size: string; count: number }> };
    if (!value) return { total: 0, sizes: [] as Array<{ size: string; count: number }> };
    const raw = String(value);
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) return { total: numeric, sizes: [] as Array<{ size: string; count: number }> };
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { total: parsed.length, sizes: [] as Array<{ size: string; count: number }> };
      if (parsed && typeof parsed === 'object') {
        return { total: Object.keys(parsed).length, sizes: [] as Array<{ size: string; count: number }> };
      }
    } catch {
      // fall through to serialized format parsing
    }

    const sizes: Array<{ size: string; count: number }> = [];
    const sizeMatches = raw.matchAll(/\*size\";s:\d+:\"([A-Za-z]+)\"/g);
    const countMatches = raw.matchAll(/\*number\";i:(\d+)/g);
    const sizeList = Array.from(sizeMatches, (match) => match[1]);
    const countList = Array.from(countMatches, (match) => Number(match[1]));
    const len = Math.min(sizeList.length, countList.length);
    for (let i = 0; i < len; i += 1) {
      sizes.push({ size: sizeList[i], count: countList[i] });
    }
    const total = sizes.reduce((sum, item) => sum + item.count, 0);
    if (total > 0) return { total, sizes };

    if (raw.includes('BoxObject')) {
      const matches = raw.match(/BoxObject/g);
      if (matches) return { total: matches.length, sizes: [] as Array<{ size: string; count: number }> };
    }
    return { total: 0, sizes: [] as Array<{ size: string; count: number }> };
  }, []);

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
    const productLabel =
      (category.nr_produse ?? 0) === 1 ? t('category.product') : t('category.products');

    return (
      <div key={category.id}>
        <button
          className="w-full min-w-0 flex items-center gap-3 p-3 bg-white hover:bg-muted/50 transition-colors"
          data-track-action={`A apasat pe categoria ${category.titlu}.`}
          onClick={() => {
            setCurrentSlug(category.slug);
            const targetPath = locale === 'en' ? `/en/category/${targetSlug}` : `/categorie/${targetSlug}`;
            navigate(targetPath);
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
            <p className="text-xs text-muted-foreground">{category.nr_produse} {productLabel}</p>
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

  useEffect(() => {
    let active = true;
    setIsSamedayLoading(true);
    fetch('/curier/retea-sameday.json')
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        setSamedayRows(Array.isArray(json) ? json : []);
      })
      .catch(() => {
        if (!active) return;
        setSamedayRows([]);
      })
      .finally(() => {
        if (!active) return;
        setIsSamedayLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLockerLoading(true);
    fetch('/curier/dar_sameday_locker.json')
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        setLockerRows(Array.isArray(json) ? json : []);
      })
      .catch(() => {
        if (!active) return;
        setLockerRows([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLockerLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const samedayByCounty = useMemo(() => {
    const map = new Map<string, SamedayRow[]>();
    samedayRows.forEach((row) => {
      const county = normalizeText(String(row.Judet ?? ''));
      if (!county) return;
      if (!map.has(county)) {
        map.set(county, []);
      }
      map.get(county)?.push(row);
    });
    return map;
  }, [samedayRows, normalizeText]);

  const billingLocalities = useMemo(() => {
    const countyName = countyNameByCode.get(billingData.billing_county);
    if (!countyName) return [];
    const rows = samedayByCounty.get(normalizeText(countyName)) ?? [];
    const set = new Set<string>();
    rows.forEach((row) => {
      const value = String(row.Localitate ?? '').trim();
      if (value) set.add(value);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ro'));
  }, [billingData.billing_county, countyNameByCode, samedayByCounty, normalizeText]);

  const shippingLocalities = useMemo(() => {
    if (!useDifferentShipping) return [];
    const countyName = countyNameByCode.get(shippingData.county);
    if (!countyName) return [];
    const rows = samedayByCounty.get(normalizeText(countyName)) ?? [];
    const set = new Set<string>();
    rows.forEach((row) => {
      const value = String(row.Localitate ?? '').trim();
      if (value) set.add(value);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ro'));
  }, [shippingData.county, useDifferentShipping, countyNameByCode, samedayByCounty, normalizeText]);

  const billingComunas = useMemo(() => {
    const countyName = countyNameByCode.get(billingData.billing_county);
    if (!countyName || !billingData.billing_locality) return [];
    const rows = samedayByCounty.get(normalizeText(countyName)) ?? [];
    const target = normalizeText(billingData.billing_locality);
    const set = new Set<string>();
    rows.forEach((row) => {
      if (normalizeText(String(row.Localitate ?? '')) !== target) return;
      const comuna = String(row.Comuna ?? '').trim();
      if (!comuna) return;
      if (normalizeText(comuna) === target) return;
      set.add(comuna);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ro'));
  }, [billingData.billing_county, billingData.billing_locality, countyNameByCode, samedayByCounty, normalizeText]);

  const shippingComunas = useMemo(() => {
    if (!useDifferentShipping) return [];
    const countyName = countyNameByCode.get(shippingData.county);
    if (!countyName || !shippingData.locality) return [];
    const rows = samedayByCounty.get(normalizeText(countyName)) ?? [];
    const target = normalizeText(shippingData.locality);
    const set = new Set<string>();
    rows.forEach((row) => {
      if (normalizeText(String(row.Localitate ?? '')) !== target) return;
      const comuna = String(row.Comuna ?? '').trim();
      if (!comuna) return;
      if (normalizeText(comuna) === target) return;
      set.add(comuna);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ro'));
  }, [shippingData.county, shippingData.locality, useDifferentShipping, countyNameByCode, samedayByCounty, normalizeText]);

  useEffect(() => {
    if (!billingComunas.length) {
      setBillingComuna('');
      return;
    }
    if (billingComunas.length === 1 && billingComuna !== billingComunas[0]) {
      setBillingComuna(billingComunas[0]);
    }
  }, [billingComunas, billingComuna]);

  useEffect(() => {
    if (!useDifferentShipping) return;
    if (!shippingComunas.length) {
      setShippingComuna('');
      return;
    }
    if (shippingComunas.length === 1 && shippingComuna !== shippingComunas[0]) {
      setShippingComuna(shippingComunas[0]);
    }
  }, [shippingComunas, shippingComuna, useDifferentShipping]);

  const billingKm = useMemo(() => {
    const countyName = countyNameByCode.get(billingData.billing_county);
    if (!countyName || !billingData.billing_locality) return 0;
    const rows = samedayByCounty.get(normalizeText(countyName)) ?? [];
    const target = normalizeText(billingData.billing_locality);
    const matching = rows.filter((row) => normalizeText(String(row.Localitate ?? '')) === target);
    let row = matching[0];
    if (billingComuna) {
      const comunaTarget = normalizeText(billingComuna);
      row = matching.find((item) => normalizeText(String(item.Comuna ?? '')) === comunaTarget) ?? row;
    }
    const value = row?.['Km aditionali'];
    const num = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
  }, [billingData.billing_county, billingData.billing_locality, billingComuna, countyNameByCode, samedayByCounty, normalizeText]);

  const shippingKm = useMemo(() => {
    const countyName = countyNameByCode.get(shippingData.county);
    if (!useDifferentShipping || !countyName || !shippingData.locality) return 0;
    const rows = samedayByCounty.get(normalizeText(countyName)) ?? [];
    const target = normalizeText(shippingData.locality);
    const matching = rows.filter((row) => normalizeText(String(row.Localitate ?? '')) === target);
    let row = matching[0];
    if (shippingComuna) {
      const comunaTarget = normalizeText(shippingComuna);
      row = matching.find((item) => normalizeText(String(item.Comuna ?? '')) === comunaTarget) ?? row;
    }
    const value = row?.['Km aditionali'];
    const num = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
  }, [shippingData.county, shippingData.locality, shippingComuna, useDifferentShipping, countyNameByCode, samedayByCounty, normalizeText]);

  useEffect(() => {
    if (useDifferentShipping) return;
    setShippingData(buildShippingFromBilling(billingData));
    setShippingComuna(billingComuna);
  }, [billingData, useDifferentShipping, billingComuna]);

  useEffect(() => {
    if (isHydratedRef.current) return;
    const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) {
      isHydratedRef.current = true;
      return;
    }
    (async () => {
      try {
        const parsed = await decryptPayload(raw);
        if (parsed?.billingData) setBillingData(parsed.billingData);
        if (parsed?.shippingData) setShippingData(parsed.shippingData);
        if (parsed?.companyData) setCompanyData(parsed.companyData);
        if (parsed?.deliveryMethod) setDeliveryMethod(parsed.deliveryMethod);
        if (parsed?.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed?.customerType) setCustomerType(parsed.customerType);
        if (typeof parsed?.useDifferentShipping === 'boolean') setUseDifferentShipping(parsed.useDifferentShipping);
        if (parsed?.selectedLockerId) setSelectedLockerId(parsed.selectedLockerId);
        if (parsed?.lockerQuery) setLockerQuery(parsed.lockerQuery);
      } catch {
        // Ignore storage errors.
      } finally {
        isHydratedRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    const payload = {
      billingData,
      shippingData,
      companyData,
      deliveryMethod,
      paymentMethod,
      customerType,
      useDifferentShipping,
      selectedLockerId,
      lockerQuery,
    };
    (async () => {
      try {
        const encrypted = await encryptPayload(payload);
        localStorage.setItem(CHECKOUT_STORAGE_KEY, encrypted);
      } catch {
        // Ignore storage errors.
      }
    })();
  }, [
    billingData,
    shippingData,
    companyData,
    deliveryMethod,
    paymentMethod,
    customerType,
    useDifferentShipping,
    selectedLockerId,
    lockerQuery,
  ]);

  useEffect(() => {
    if (isSurpriseGift) {
      setUseDifferentShipping(true);
    }
  }, [isSurpriseGift]);


  useEffect(() => {
    const email = billingData.billing_email.trim();

    if (!email) {
      setCustomerCheck({ loading: false, response: null });
      return;
    }

    if (customerCheckTimer.current) {
      clearTimeout(customerCheckTimer.current);
    }

    const controller = new AbortController();

    customerCheckTimer.current = setTimeout(() => {
      setCustomerCheck((prev) => ({ ...prev, loading: true }));
      fetch('https://darurialese.com/wp-json/sarbu/api-verificare-customer/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((response: CustomerCheckResponse) => {
          setCustomerCheck({ loading: false, response });
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setCustomerCheck({ loading: false, response: null });
        });
    }, 500);

    return () => {
      controller.abort();
      if (customerCheckTimer.current) {
        clearTimeout(customerCheckTimer.current);
      }
    };
  }, [billingData.billing_email]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const defaultTitle = 'Daruri Alese Catalog';
    document.title = `${t('checkout.pageTitle')} | ${defaultTitle}`;
  }, []);

  const totals = useMemo(() => {
    const cost = cart.reduce((sum, item) => {
      const unit = parseFloat(item.priceReduced ?? item.price);
      const qty = item.quantity ?? 1;
      return sum + unit * qty;
    }, 0);
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
    const shippingRates: Record<DeliveryMethod, number> = {
      sameday: 17,
      dpd: 20,
      fan: 21,
      easybox: 13,
      pickup: 0,
    };
    const shippingBase = shippingRates[deliveryMethod] ?? 0;
    const couponDiscount = couponTotals ? Math.max(0, Number(couponTotals.totalDiscount) || 0) : 0;
    const discountedCost = Math.max(0, cost - couponDiscount);
    const shipping = deliveryMethod === 'pickup' ? 0 : discountedCost >= 200 ? 0 : shippingBase;
    return { cost, couponDiscount, discountedCost, totalItems, shipping, total: discountedCost + shipping };
  }, [cart, deliveryMethod, couponTotals]);

  const mapCountyCode = useDifferentShipping ? shippingData.county : billingData.billing_county;
  const mapLocality = useDifferentShipping ? shippingData.locality : billingData.billing_locality;
  const mapCountyName = mapCountyCode ? countyNameByCode.get(mapCountyCode) ?? mapCountyCode : '';
  const mapComuna = useDifferentShipping ? shippingComuna : billingComuna;
  const lockerLocality = mapCountyCode === 'B' && mapLocality ? 'Bucuresti' : mapLocality;
  const mapQuery = mapLocality
    ? `${mapComuna || mapLocality}, ${mapCountyName}`
    : mapCountyName;
  const mapZoom = mapLocality ? 14 : 10;

  const lockerOptions = useMemo(() => {
    if (deliveryMethod !== 'easybox') return [];
    const county = normalizeText(mapCountyName);
    const city = normalizeText(lockerLocality);
    const isBucharest = mapCountyCode === 'B';
    if (!county) return [];
    return lockerRows.filter((row) => {
      const rowCounty = normalizeText(String(row.county ?? ''));
      if (isBucharest) {
        if (!rowCounty.includes('bucuresti')) return false;
        return true;
      } else if (rowCounty !== county) {
        return false;
      }
      if (!city) return true;
      const rowCity = normalizeText(String(row.city ?? ''));
      return rowCity === city;
    });
  }, [deliveryMethod, lockerRows, mapCountyName, mapLocality, mapCountyCode, normalizeText]);

  const lockerOptionItems = useMemo(
    () =>
      lockerOptions.map((row) => ({
        id: String(row.locker_id ?? row.id ?? ''),
        label: getLockerLabel(row),
      })),
    [lockerOptions, getLockerLabel]
  );

  const selectedLocker = useMemo(() => {
    if (!selectedLockerId) return null;
    return (
      lockerOptions.find((row) => String(row.locker_id ?? row.id ?? '') === selectedLockerId) ?? null
    );
  }, [lockerOptions, selectedLockerId]);

  const shouldShowMap = Boolean(
    (deliveryMethod === 'easybox' && (selectedLocker || mapQuery.trim().length > 0)) ||
      mapQuery.trim().length > 0
  );
  const mapKm = useDifferentShipping ? shippingKm : billingKm;
  const mapEmbedUrl = useMemo(() => {
    if (deliveryMethod === 'easybox' && selectedLocker?.lat && selectedLocker?.lng) {
      return `https://www.google.com/maps?q=${encodeURIComponent(
        `${selectedLocker.lat},${selectedLocker.lng}`
      )}&z=15&output=embed`;
    }
    return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${mapZoom}&output=embed`;
  }, [deliveryMethod, mapQuery, mapZoom, selectedLocker]);

  useEffect(() => {
    if (deliveryMethod !== 'easybox') {
      setSelectedLockerId('');
      setLockerQuery('');
      lastLockerContextRef.current = '';
      return;
    }
    const nextKey = `${mapCountyName}|${lockerLocality}`;
    if (!lastLockerContextRef.current) {
      lastLockerContextRef.current = nextKey;
      return;
    }
    if (lastLockerContextRef.current !== nextKey) {
      lastLockerContextRef.current = nextKey;
      setSelectedLockerId('');
      setLockerQuery('');
    }
  }, [deliveryMethod, mapCountyName, lockerLocality]);

  useEffect(() => {
    if (deliveryMethod !== 'easybox') {
      setSelectedLockerId('');
      setLockerQuery('');
      return;
    }
    if (isLockerLoading) {
      return;
    }
    const hasSelected = Boolean(
      selectedLockerId &&
        lockerOptions.some((row) => String(row.locker_id ?? row.id ?? '') === selectedLockerId)
    );
    if (hasSelected) {
      return;
    }
    if (lockerOptions.length === 1) {
      const only = lockerOptions[0];
      const nextId = String(only.locker_id ?? only.id ?? '');
      setSelectedLockerId(nextId);
    } else if (lockerOptions.length === 0) {
      setSelectedLockerId('');
      setLockerQuery('');
    }
  }, [deliveryMethod, lockerOptions, isLockerLoading, selectedLockerId]);

  useEffect(() => {
    if (!selectedLocker) return;
    setLockerQuery(getLockerLabel(selectedLocker));
  }, [selectedLocker, getLockerLabel]);

  useEffect(() => {
    if (deliveryMethod !== 'easybox') {
      if (lockerMapInstanceRef.current) {
        lockerMapInstanceRef.current.remove();
        lockerMapInstanceRef.current = null;
        lockerMarkersRef.current = null;
      }
      return;
    }
    if (!lockerMapRef.current) return;

    let active = true;
    loadLeaflet()
      .then((L) => {
        if (!active || !lockerMapRef.current) return;

        const mapEl = lockerMapRef.current;
        if (lockerMapInstanceRef.current && lockerMapInstanceRef.current._container !== mapEl) {
          lockerMapInstanceRef.current.remove();
          lockerMapInstanceRef.current = null;
          lockerMarkersRef.current = null;
        }

        if (!lockerMapInstanceRef.current) {
          lockerMapInstanceRef.current = L.map(mapEl, {
            center: [45.9432, 24.9668],
            zoom: 6,
          });
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(lockerMapInstanceRef.current);
          lockerMarkersRef.current = L.layerGroup().addTo(lockerMapInstanceRef.current);
        }

        const map = lockerMapInstanceRef.current;
        const markersLayer = lockerMarkersRef.current;
        markersLayer.clearLayers();

        const markers = lockerOptions
          .map((row) => {
            const lat = Number(row.lat);
            const lng = Number(row.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            const isSelected =
              selectedLocker && (row.locker_id === selectedLocker.locker_id || row.id === selectedLocker.id);
            const marker = L.marker([lat, lng], {
              icon: L.divIcon({
                className: '',
                html: `<span style="display:block;width:14px;height:14px;background:${
                  isSelected ? '#e11d48' : '#2563eb'
                };border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,0.25);"></span>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
                popupAnchor: [0, -9],
              }),
            });
            marker.bindPopup(getLockerLabel(row));
            marker.on('click', () => {
              const nextId = String(row.locker_id ?? row.id ?? '');
              setSelectedLockerId(nextId);
            });
            if (isSelected) {
              marker.openPopup();
            }
            markersLayer.addLayer(marker);
            return { lat, lng };
          })
          .filter(Boolean);

        if (selectedLocker?.lat && selectedLocker?.lng) {
          map.setView([Number(selectedLocker.lat), Number(selectedLocker.lng)], 15);
        } else if (markers.length > 0) {
          const bounds = L.latLngBounds(markers.map((item) => [item.lat, item.lng]));
          map.fitBounds(bounds, { padding: [20, 20] });
        }

        setTimeout(() => {
          if (map) {
            map.invalidateSize();
          }
        }, 50);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [deliveryMethod, lockerOptions, selectedLocker, getLockerLabel]);

  useEffect(() => {
    if (deliveryMethod !== 'easybox') return;
    if (!useDifferentShipping) {
      setUseDifferentShipping(true);
    }
    if (isShippingEmpty(shippingData)) {
      setShippingData(buildShippingFromBilling(billingData));
      setShippingComuna('');
    }
  }, [deliveryMethod, useDifferentShipping, shippingData, billingData]);

  useEffect(() => {
    if (deliveryMethod !== 'easybox' || !selectedLocker) return;
    const lockerCountyRaw = String(selectedLocker.county ?? '').trim();
    const mappedCountyCode = lockerCountyRaw
      ? countyCodeByName.get(normalizeText(lockerCountyRaw)) ??
        counties.find((county) => county.code.toLowerCase() === lockerCountyRaw.toLowerCase())?.code
      : '';
    const rawLocality = String(selectedLocker.city ?? '').trim();
    const nextLocality = mappedCountyCode === 'B' ? '' : rawLocality;
    const nextAddress = String(selectedLocker.address ?? '').trim();
    const nextPostcode = String(selectedLocker.postal_code ?? '').trim();
    setShippingData((prev) => {
      const updated = {
        ...prev,
        county: mappedCountyCode || prev.county,
        locality: prev.locality,
        address1: nextAddress || prev.address1,
        postcode: nextPostcode || prev.postcode,
      };
      if (
        updated.county === prev.county &&
        updated.address1 === prev.address1 &&
        updated.postcode === prev.postcode
      ) {
        return prev;
      }
      return updated;
    });
    if (mappedCountyCode || nextLocality) {
      setShippingComuna('');
    }
  }, [deliveryMethod, selectedLocker, countyCodeByName, counties, normalizeText]);

  useEffect(() => {
    if (deliveryMethod !== 'easybox') return;
    const lockerPostcode = String(selectedLocker?.postal_code ?? '').trim();
    if (!lockerPostcode) return;
    const isEmptyOrUnknown = (value: string) => !value.trim() || value.trim() === '0000';
    if (isEmptyOrUnknown(billingData.billing_postcode)) {
      setBillingData((prev) => ({ ...prev, billing_postcode: lockerPostcode }));
    }
    if (useDifferentShipping && isEmptyOrUnknown(shippingData.postcode)) {
      setShippingData((prev) => ({ ...prev, postcode: lockerPostcode }));
    }
  }, [
    deliveryMethod,
    selectedLocker,
    billingData.billing_postcode,
    shippingData.postcode,
    useDifferentShipping,
    setBillingData,
    setShippingData,
  ]);

  useEffect(() => {
    const currentAddress2 = shippingData.address2;
    const easyboxPattern = /^\s*\d+\s*-\s*.+/;
    if (deliveryMethod !== 'easybox') {
      if (easyboxPattern.test(currentAddress2)) {
        setShippingData((prev) => ({ ...prev, address2: '' }));
      }
      return;
    }
    if (!selectedLocker) return;
    const nextAddress2 = `${String(selectedLocker.locker_id ?? selectedLocker.id ?? '')} - ${String(
      selectedLocker.name ?? ''
    )}`.trim();
    if (!nextAddress2) return;
    if (shippingData.address2 !== nextAddress2) {
      setShippingData((prev) => ({ ...prev, address2: nextAddress2 }));
    }
  }, [deliveryMethod, selectedLocker, shippingData.address2]);

  const isNonEmpty = useCallback((value: string) => value.trim().length > 0, []);
  const isBillingComplete = useMemo(
    () =>
      isNonEmpty(billingData.billing_first_name) &&
      isNonEmpty(billingData.billing_last_name) &&
      isNonEmpty(billingData.billing_email) &&
      isNonEmpty(billingData.billing_phone) &&
      isNonEmpty(billingData.billing_address_1) &&
      isNonEmpty(billingData.billing_county) &&
      isNonEmpty(billingData.billing_locality) &&
      isNonEmpty(billingData.billing_postcode) &&
      isNonEmpty(billingData.billing_country),
    [billingData, isNonEmpty]
  );
  const isCompanyComplete =
    customerType === 'company'
      ? isNonEmpty(companyData.companyName) && isNonEmpty(companyData.cui)
      : true;
  const isShippingComplete = !useDifferentShipping
    ? true
    : isNonEmpty(shippingData.firstName) &&
      isNonEmpty(shippingData.lastName) &&
      isNonEmpty(shippingData.phone) &&
      isNonEmpty(shippingData.address1) &&
      isNonEmpty(shippingData.county) &&
      isNonEmpty(shippingData.locality) &&
      isNonEmpty(shippingData.postcode) &&
      isNonEmpty(shippingData.country);
  const canSubmit =
    termsAccepted && isBillingComplete && isCompanyComplete && isShippingComplete && Boolean(deliveryMethod) && Boolean(paymentMethod);

  const inputClass = (isInvalid: boolean) =>
    `h-10 w-full rounded-lg border px-3 text-sm ${isInvalid ? 'border-red-400' : 'border-border'}`;

  const paymentMethodId = paymentMethod === 'ramburs' ? 'cod' : 'bacs';
  const deliveryInstanceId = (() => {
    switch (deliveryMethod) {
      case 'dpd':
        return 2;
      case 'pickup':
        return 1;
      case 'sameday':
        return 4;
      case 'easybox':
        return 4;
      default:
        return null;
    }
  })();

  const slugifyMetaKey = (value: string) =>
    value
      .toLowerCase()
      .replace(/ă/g, 'a')
      .replace(/â/g, 'a')
      .replace(/î/g, 'i')
      .replace(/ș/g, 's')
      .replace(/ş/g, 's')
      .replace(/ț/g, 't')
      .replace(/ţ/g, 't')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const handleSubmitClick = () => {
    setAttemptedSubmit(true);
    window.setTimeout(() => {
      const firstInvalid = document.querySelector('[data-invalid="true"]') as HTMLElement | null;
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof (firstInvalid as HTMLInputElement).focus === 'function') {
          (firstInvalid as HTMLInputElement).focus();
        }
      }
    }, 0);

    if (!canSubmit || isSubmitting) {
      const billingPrefix = `${t('checkout.billingTitle')}: `;
      const shippingPrefix = `${t('checkout.shippingTitle')}: `;
      const missing: string[] = [];
      if (!isNonEmpty(billingData.billing_first_name)) missing.push(`${billingPrefix}${t('checkout.firstName')}`);
      if (!isNonEmpty(billingData.billing_last_name)) missing.push(`${billingPrefix}${t('checkout.lastName')}`);
      if (!isNonEmpty(billingData.billing_email)) missing.push(`${billingPrefix}${t('checkout.email')}`);
      if (!isNonEmpty(billingData.billing_phone)) missing.push(`${billingPrefix}${t('checkout.phone')}`);
      if (!isNonEmpty(billingData.billing_county)) missing.push(`${billingPrefix}${t('checkout.county')}`);
      if (!isNonEmpty(billingData.billing_locality)) missing.push(`${billingPrefix}${t('checkout.locality')}`);
      if (!isNonEmpty(billingData.billing_address_1)) missing.push(`${billingPrefix}${t('checkout.address')}`);
      if (!isNonEmpty(billingData.billing_postcode)) missing.push(`${billingPrefix}${t('checkout.postcode')}`);
      if (!isNonEmpty(billingData.billing_country)) missing.push(`${billingPrefix}${t('checkout.country')}`);
      if (customerType === 'company') {
        if (!isNonEmpty(companyData.companyName)) missing.push(t('checkout.companyName'));
        if (!isNonEmpty(companyData.cui)) missing.push(t('checkout.companyCui'));
      }
      if (useDifferentShipping) {
        if (!isNonEmpty(shippingData.firstName)) missing.push(`${shippingPrefix}${t('checkout.firstName')}`);
        if (!isNonEmpty(shippingData.lastName)) missing.push(`${shippingPrefix}${t('checkout.lastName')}`);
        if (!isNonEmpty(shippingData.phone)) missing.push(`${shippingPrefix}${t('checkout.phone')}`);
        if (!isNonEmpty(shippingData.county)) missing.push(`${shippingPrefix}${t('checkout.county')}`);
        if (!isNonEmpty(shippingData.locality)) missing.push(`${shippingPrefix}${t('checkout.locality')}`);
        if (!isNonEmpty(shippingData.address1)) missing.push(`${shippingPrefix}${t('checkout.address')}`);
        if (!isNonEmpty(shippingData.postcode)) missing.push(`${shippingPrefix}${t('checkout.postcode')}`);
        if (!isNonEmpty(shippingData.country)) missing.push(`${shippingPrefix}${t('checkout.country')}`);
      }
      if (!termsAccepted) missing.push(t('checkout.termsLink'));
      if (missing.length > 0 && window.rybbit?.event) {
        missing.forEach((item) => window.rybbit?.event?.(t('checkout.missingField', { field: item })));
      }
      return;
    }

    const payload: Record<string, unknown> = {
      billing: {
        first_name: billingData.billing_first_name,
        last_name: billingData.billing_last_name,
        email: billingData.billing_email,
        phone: billingData.billing_phone,
        address_1: billingData.billing_address_1,
        address_2: billingData.billing_address_2,
        city: billingData.billing_locality,
        state: billingData.billing_county,
        postcode: billingData.billing_postcode,
      },
      shipping_identic: !useDifferentShipping,
      produse: cart.map((item) => {
        const metaData: Record<string, unknown> = {};
        item.personalizare?.forEach((entry) => {
          const label = entry.label?.trim() || entry.name;
          if (!label) return;
          const key = label;
          if (!key.trim()) return;
          if (entry.type === 'upload' && entry.file) {
            metaData[key] = entry.file;
            return;
          }
          if (Array.isArray(entry.value)) {
            metaData[key] = entry.value.join(', ');
            return;
          }
          metaData[key] = entry.value ?? '';
        });

        return {
          product_id: item.id,
          quantity: item.quantity ?? 1,
          ...(Object.keys(metaData).length > 0 ? { meta_data: metaData } : {}),
        };
      }),
      payment_method: paymentMethodId,
      ...(deliveryInstanceId !== null ? { shipping_method: String(deliveryInstanceId) } : {}),
      ...(orderNote.trim().length ? { customer_note: orderNote.trim() } : {}),
    };

    if (useDifferentShipping) {
      payload.shipping = {
        first_name: shippingData.firstName,
        last_name: shippingData.lastName,
        phone: shippingData.phone,
        address_1: shippingData.address1,
        address_2:
          deliveryMethod === 'easybox' && selectedLocker
            ? `${String(selectedLocker.locker_id ?? selectedLocker.id ?? '')} - ${String(
                selectedLocker.name ?? ''
              )}`
            : shippingData.address2,
        city: shippingData.locality,
        state: shippingData.county,
        postcode: shippingData.postcode,
      };
    }

    if (customerType === 'company') {
      payload.este_firma = true;
      payload.cui = companyData.cui;
      payload.reg_com = companyData.registry;
      payload.nume_firma = companyData.companyName;
    }

    if (appliedCouponCode) {
      payload.cupon = appliedCouponCode;
    }

    if (deliveryMethod === 'easybox' && selectedLocker) {
      payload.service_id = 15;
      payload.service_code = 'LN';
      const lockerIdValue = String(selectedLocker.locker_id ?? selectedLocker.id ?? '');
      const lockerName = String(selectedLocker.name ?? '');
      payload._sameday_shipping_locker_id = {
        lockerId: lockerIdValue,
        oohType: '0',
        name: lockerName,
        address: String(selectedLocker.address ?? ''),
        cityId: '',
        city: String(selectedLocker.city ?? ''),
        countyId: '',
        county: String(selectedLocker.county ?? ''),
        supportedPayment: '1',
        postalCode: String(selectedLocker.postal_code ?? ''),
      };
      payload._sameday_shipping_hd_address = {
        _shipping_first_name: '',
        _shipping_last_name: '',
        _shipping_phone: '',
        _shipping_country: 'RO',
        _shipping_state: '',
        _shipping_city: '',
        _shipping_address_1: '',
        _shipping_address_2: lockerIdValue && lockerName ? `${lockerIdValue} - ${lockerName}` : '',
        _shipping_postcode: '',
        _shipping_method: ['samedaycourier:15:LN'],
      };
    }

    if (deliveryMethod === 'sameday') {
      payload.service_id = 7;
      payload.service_code = '24';
    }

    setIsSubmitting(true);

    tiktokIdentify(billingData.billing_email, billingData.billing_phone);

    const products = cart.map(item => ({
      id: String(item.id),
      name: item.titlu || '',
    }));
    const totalValue = cart.reduce((sum, item) => {
      const price = parseFloat(item.pret_redus || item.pret || '0');
      const qty = item.quantity || 1;
      return sum + (price * qty);
    }, 0);
    const totalWithoutVAT = totalValue / 1.21;
    tiktokInitiateCheckout(products, totalWithoutVAT, 'RON');
    fbInitiateCheckout(products, totalWithoutVAT, 'RON');

    fetch('https://darurialese.com/wp-json/sarbu/api-comanda/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((response) => {
        if (response?.success) {
          toast({ title: t('checkout.orderSuccess') });
          try {
            sessionStorage.setItem('checkout-last-response', JSON.stringify(response));
          } catch {
            // ignore storage errors
          }
          const orderNumber = response?.order?.number || '';
          const orderKey = response?.order?.key || '';
          const thankYouPath = orderNumber ? `/plata-cos/order-received/${orderNumber}` : '/plata-cos/order-received';
          const thankYouUrl = orderKey ? `${thankYouPath}/?key=${encodeURIComponent(orderKey)}` : thankYouPath;
          navigate(thankYouUrl, { state: response });
          return;
        } else {
          toast({ title: response?.message || 'Eroare la crearea comenzii.', variant: 'destructive' });
        }
      })
      .catch(() => {
        toast({ title: 'Eroare la trimiterea comenzii.', variant: 'destructive' });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const normalizedCounty = shippingData.county.trim().toLowerCase();
  const isLocalPickupEligible = normalizedCounty === 'ilfov' || normalizedCounty === 'bucuresti';

  const cartSignature = useMemo(
    () =>
      cart
        .map((item) => {
          const key = item.cartItemId ?? `${item.id}`;
          const qty = item.quantity ?? 1;
          return `${item.id}:${key}:${qty}`;
        })
        .join('|'),
    [cart]
  );

  const applyCoupon = useCallback(
    async (code: string, { showSuccess }: { showSuccess: boolean }) => {
      const trimmed = code.trim();
      if (!trimmed) {
        setCouponStatus({ type: 'error', message: 'Introdu un cod de cupon.' });
        return;
      }

      setAppliedCouponCode(trimmed);
      setIsApplyingCoupon(true);
      setCouponStatus(null);
      setCouponTotals(null);
      setCouponDetails(null);

      const payload = {
        cod_cupon: trimmed,
        produse: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity ?? 1,
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
          setCouponDetails({ conditions, hasApplicableProducts, invalidProducts });
          setCouponStatus({ type: 'error', message: data?.cupon?.reason || 'Cupon invalid.' });
          return;
        }
        if (!hasApplicableProducts) {
          setCouponTotals(null);
          setCouponDetails({ conditions, hasApplicableProducts, invalidProducts });
          setCouponStatus({ type: 'error', message: 'Cuponul nu este valabil pentru niciun produs din cos.' });
          return;
        }
        const totalDiscount = Number(data?.totals?.total_discount ?? 0);
        setCouponTotals({ totalDiscount });
        setCouponDetails({ conditions, hasApplicableProducts, invalidProducts });
        if (showSuccess) {
          setCouponStatus({ type: 'success', message: data?.cupon?.discount_text || 'Cupon aplicat.' });
        }
      } catch {
        setCouponTotals(null);
        setCouponDetails(null);
        setCouponStatus({ type: 'error', message: t('cart.couponCheckFail') });
      } finally {
        setIsApplyingCoupon(false);
      }
    },
    [cart]
  );

  const handleApplyCoupon = () => {
    lastValidatedSignatureRef.current = cartSignature;
    applyCoupon(promoCode, { showSuccess: true });
  };

  useEffect(() => {
    if (!appliedCouponCode) return;
    if (cartSignature === lastValidatedSignatureRef.current) return;
    const timer = setTimeout(() => {
      lastValidatedSignatureRef.current = cartSignature;
      applyCoupon(appliedCouponCode, { showSuccess: false });
    }, 450);
    return () => clearTimeout(timer);
  }, [appliedCouponCode, applyCoupon, cartSignature]);

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
          <DesktopSidebar />

          <section className="min-h-full border-r border-border bg-white flex flex-col">
            <DesktopTopBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchOpen={() => setIsSearchOpen(true)}
              onMenuClick={() => setIsMenuOpen(true)}
              onWishlistClick={() => navigate(withLocalePath('/wishlist'))}
              onCartClick={() => navigate(withLocalePath('/cos'))}
              wishlistCount={wishlist.length}
              cartCount={cart.length}
            />

            <div className="flex-1 overflow-y-auto pb-6">
              <div className="px-4 pb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="fixed left-0 top-[70%] z-40 flex h-12 w-10 items-center justify-center rounded-r-md border-r border-border bg-white text-muted-foreground shadow"
          aria-label="Inapoi"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="mt-6 grid grid-cols-[1fr_360px] gap-8">
          <div className="space-y-4">
            <div className="mt-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/cos')}
                  className="flex flex-1 items-center gap-2 rounded-xl px-3 py-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-[11px] font-semibold text-muted-foreground">
                    1
                  </span>
                  <div className="text-[11px] font-semibold text-muted-foreground text-left">
                    <div>{t('checkout.step', { step: 1 })}</div>
                    <div className="text-[10px] font-medium text-muted-foreground">{t('checkout.stepCart')}</div>
                  </div>
                </button>

                <div
                  className="flex flex-1 items-center gap-2 rounded-xl px-3 py-3 text-white"
                  style={{ backgroundImage: 'linear-gradient(45deg, #fae3ca, #fff)' }}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#c89b59]">
                    2
                  </span>
                  <div className="text-[11px] font-semibold text-amber-900">
                    <div>{t('checkout.step', { step: 2 })}</div>
                    <div className="text-[10px] font-medium text-amber-900/60">{t('checkout.stepBilling')}</div>
                  </div>
                </div>
              </div>
            </div>
          <div className="rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold font-serif text-foreground">{t('checkout.companyQuestion')}</span>
              <button
                type="button"
                role="switch"
                aria-checked={customerType === 'company'}
                onClick={() =>
                  setCustomerType((prev) => {
                    const next = prev === 'individual' ? 'company' : 'individual';
                    if (next === 'individual') {
                      setCompanyData({ companyName: '', cui: '', registry: '' });
                    }
                    return next;
                  })
                }
                data-track-action="A schimbat tipul de client."
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border border-border transition-colors ${
                  customerType === 'company' ? 'bg-amber-500' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    customerType === 'company' ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {customerType === 'company' && (
              <>

                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Nume firma</label>
                    <input
                      type="text"
                      value={companyData.companyName}
                      onChange={(event) => setCompanyData((prev) => ({ ...prev, companyName: event.target.value }))}
                    data-track-action={`${t('checkout.companyName')}`}
                      required={customerType === 'company'}
                      data-invalid={attemptedSubmit && customerType === 'company' && !isNonEmpty(companyData.companyName)}
                      className={inputClass(attemptedSubmit && customerType === 'company' && !isNonEmpty(companyData.companyName))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">CUI</label>
                    <input
                      type="text"
                      value={companyData.cui}
                      onChange={(event) => setCompanyData((prev) => ({ ...prev, cui: event.target.value }))}
                      data-track-action={`${t('checkout.companyCui')}`}
                      required={customerType === 'company'}
                      data-invalid={attemptedSubmit && customerType === 'company' && !isNonEmpty(companyData.cui)}
                      className={inputClass(attemptedSubmit && customerType === 'company' && !isNonEmpty(companyData.cui))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Nr. registru</label>
                    <input
                      type="text"
                      value={companyData.registry}
                      onChange={(event) => setCompanyData((prev) => ({ ...prev, registry: event.target.value }))}
                      data-track-action={`${t('checkout.companyReg')}`}
                      className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border p-4">
            <p className="text-sm font-semibold text-foreground">{t('checkout.billingTitle')}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('checkout.firstName')}</label>
                <input
                  type="text"
                  value={billingData.billing_first_name}
                  onChange={(event) =>
                    setBillingData((prev) => ({ ...prev, billing_first_name: event.target.value }))
                  }
                  data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.firstName')}`}
                  required
                  data-invalid={attemptedSubmit && !isNonEmpty(billingData.billing_first_name)}
                  className={inputClass(attemptedSubmit && !isNonEmpty(billingData.billing_first_name))}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('checkout.lastName')}</label>
                <input
                  type="text"
                  value={billingData.billing_last_name}
                  onChange={(event) =>
                    setBillingData((prev) => ({ ...prev, billing_last_name: event.target.value }))
                  }
                  data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.lastName')}`}
                  required
                  data-invalid={attemptedSubmit && !isNonEmpty(billingData.billing_last_name)}
                  className={inputClass(attemptedSubmit && !isNonEmpty(billingData.billing_last_name))}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('checkout.email')}</label>
                <input
                  type="email"
                  value={billingData.billing_email}
                  onChange={(event) =>
                    setBillingData((prev) => ({ ...prev, billing_email: event.target.value }))
                  }
                  data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.email')}`}
                  required
                  data-invalid={attemptedSubmit && !isNonEmpty(billingData.billing_email)}
                  className={inputClass(attemptedSubmit && !isNonEmpty(billingData.billing_email))}
                />
                {customerCheck.response?.verificari?.email?.found && (
                  <p className="text-[11px] font-semibold text-emerald-600">{t('checkout.emailExists')}</p>
                )}
              </div>
              {customerCheck.response?.verificari?.email?.found && (
                  <div className="col-span-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                    {t('checkout.emailAttached')}
                  </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('checkout.phone')}</label>
                <input
                  type="tel"
                  value={billingData.billing_phone}
                  onChange={(event) =>
                    setBillingData((prev) => ({ ...prev, billing_phone: event.target.value }))
                  }
                  data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.phone')}`}
                  required
                  data-invalid={attemptedSubmit && !isNonEmpty(billingData.billing_phone)}
                  className={inputClass(attemptedSubmit && !isNonEmpty(billingData.billing_phone))}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('checkout.county')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={billingCountyQuery || (billingData.billing_county ? countyNameByCode.get(billingData.billing_county) ?? '' : '')}
                    placeholder={t('checkout.selectCounty')}
                    onFocus={() => {
                      setBillingCountyOpen(true);
                      if (!billingCountyQuery && billingData.billing_county) {
                        const name = countyNameByCode.get(billingData.billing_county) ?? '';
                        setBillingCountyQuery(name);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setBillingCountyOpen(false), 120);
                      const names = counties.map((county) => county.name);
                      if (!isExactLocality(names, billingCountyQuery)) {
                        setBillingCountyQuery('');
                        setBillingData((prev) => ({
                          ...prev,
                          billing_county: '',
                          billing_locality: '',
                          billing_address_1: '',
                          billing_address_2: '',
                        }));
                        setBillingComuna('');
                      }
                    }}
                    onChange={(event) => {
                      const value = event.target.value;
                      setBillingCountyQuery(value);
                      setBillingData((prev) => ({
                        ...prev,
                        billing_county: '',
                        billing_locality: '',
                        billing_address_1: '',
                        billing_address_2: '',
                      }));
                      setBillingComuna('');
                    }}
                    data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.county')}`}
                    required
                    data-invalid={attemptedSubmit && !isNonEmpty(billingData.billing_county)}
                    className={inputClass(attemptedSubmit && !isNonEmpty(billingData.billing_county))}
                  />
                  {billingCountyOpen && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-white text-xs shadow-lg">
                      {filterLocalities(
                        counties.map((county) => county.name),
                        billingCountyQuery
                      ).map((name) => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            const code = countyCodeByName.get(normalizeText(name)) ?? '';
                            setBillingCountyQuery(name);
                            setBillingData((prev) => ({
                              ...prev,
                              billing_county: code,
                              billing_locality: '',
                              billing_address_1: '',
                              billing_address_2: '',
                            }));
                            setBillingComuna('');
                            setBillingCountyOpen(false);
                          }}
                          className="block w-full px-3 py-2 text-left hover:bg-amber-50"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('checkout.locality')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={billingData.billing_locality}
                    placeholder={t('checkout.selectLocality')}
                    onFocus={() => setBillingLocalityOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setBillingLocalityOpen(false), 120);
                      if (billingLocalities.length > 0 && !isExactLocality(billingLocalities, billingData.billing_locality)) {
                        setBillingData((prev) => ({ ...prev, billing_locality: '' }));
                        setBillingComuna('');
                      }
                    }}
                    onChange={(event) => {
                      setBillingData((prev) => ({
                        ...prev,
                        billing_locality: event.target.value,
                        billing_address_1: '',
                        billing_address_2: '',
                      }));
                      setBillingComuna('');
                    }}
                    data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.locality')}`}
                    required
                    data-invalid={attemptedSubmit && !isNonEmpty(billingData.billing_locality)}
                    className={inputClass(attemptedSubmit && !isNonEmpty(billingData.billing_locality))}
                  />
                  {billingLocalities.length > 0 && billingLocalityOpen && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-white text-xs shadow-lg">
                      {filterLocalities(billingLocalities, billingData.billing_locality).map((locality) => (
                        <button
                          key={locality}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setBillingData((prev) => ({
                              ...prev,
                              billing_locality: locality,
                              billing_address_1: '',
                              billing_address_2: '',
                            }));
                            setBillingComuna('');
                            setBillingLocalityOpen(false);
                          }}
                          className="block w-full px-3 py-2 text-left hover:bg-amber-50"
                        >
                          {locality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isSamedayLoading && (
                  <p className="text-[11px] text-muted-foreground">{t('checkout.localitiesLoading')}</p>
                )}

              </div>
              {billingComunas.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">{t('checkout.commune')}</label>
                    <select
                        value={billingComuna}
                        onChange={(event) => setBillingComuna(event.target.value)}
                        data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.commune')}`}
                        className="h-9 w-full rounded-lg border border-border px-2 text-xs"
                    >
                      <option value="">{t('checkout.selectCommune')}</option>
                      {billingComunas.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                      ))}
                    </select>
                  </div>
              )}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('checkout.address')}</label>
                <input
                    type="text"
                    value={billingData.billing_address_1}
                    onChange={(event) =>
                        setBillingData((prev) => ({ ...prev, billing_address_1: event.target.value }))
                    }
                    data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.address')}`}
                    required
                    data-invalid={attemptedSubmit && !isNonEmpty(billingData.billing_address_1)}
                    className={inputClass(attemptedSubmit && !isNonEmpty(billingData.billing_address_1))}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('checkout.address2')}</label>
                <input
                  type="text"
                  value={billingData.billing_address_2}
                  onChange={(event) =>
                    setBillingData((prev) => ({ ...prev, billing_address_2: event.target.value }))
                  }
                  data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.address2')}`}
                  className={inputClass(false)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('checkout.postcode')}</label>
                <input
                  type="text"
                  value={billingData.billing_postcode}
                  onChange={(event) =>
                    setBillingData((prev) => ({ ...prev, billing_postcode: event.target.value }))
                  }
                  data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.postcode')}`}
                  required
                  data-invalid={attemptedSubmit && !isNonEmpty(billingData.billing_postcode)}
                  className={inputClass(attemptedSubmit && !isNonEmpty(billingData.billing_postcode))}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('checkout.country')}</label>
                <input
                  type="text"
                  value={billingData.billing_country}
                  data-track-action={`${t('checkout.billingTitle')}: ${t('checkout.country')}`}
                  readOnly
                  className="h-10 w-full rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{t('checkout.shipToDifferent')}</p>
              <button
                type="button"
                role="switch"
                aria-checked={useDifferentShipping}
                onClick={() => {
                  if (isSurpriseGift) return;
                  setUseDifferentShipping((prev) => {
                    const next = !prev;
                    if (next && isShippingSyncedWithBilling(shippingData, billingData)) {
                      setShippingData({ ...EMPTY_SHIPPING_DATA });
                      setShippingComuna('');
                    }
                    return next;
                  });
                }}
                disabled={isSurpriseGift}
                data-track-action="A schimbat adresa de livrare diferita."
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border border-border transition-colors ${
                  useDifferentShipping ? 'bg-amber-500' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    useDifferentShipping ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {isSurpriseGift && (
              <p className="mt-2 text-xs font-semibold text-amber-800">
                {t('checkout.surpriseAddressHint')}
              </p>
            )}

                <div className="rounded-2xl mt-4">


                  <div
                    className={`mt-3 grid grid-cols-2 gap-3 text-xs ${
                      useDifferentShipping ? '' : 'pointer-events-none opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">{t('checkout.firstName')}</label>
                  <input
                    type="text"
                    value={shippingData.firstName}
                    onChange={(event) => setShippingData((prev) => ({ ...prev, firstName: event.target.value }))}
                    data-track-action={`${t('checkout.shippingTitle')}: ${t('checkout.firstName')}`}
                    required={useDifferentShipping}
                    data-invalid={attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.firstName)}
                    className={inputClass(attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.firstName))}
                  />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">{t('checkout.lastName')}</label>
                  <input
                    type="text"
                    value={shippingData.lastName}
                    onChange={(event) => setShippingData((prev) => ({ ...prev, lastName: event.target.value }))}
                    data-track-action={`${t('checkout.shippingTitle')}: ${t('checkout.lastName')}`}
                    required={useDifferentShipping}
                    data-invalid={attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.lastName)}
                    className={inputClass(attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.lastName))}
                  />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">{t('checkout.phone')}</label>
                  <input
                    type="tel"
                    value={shippingData.phone}
                    onChange={(event) => setShippingData((prev) => ({ ...prev, phone: event.target.value }))}
                    data-track-action={`${t('checkout.shippingTitle')}: ${t('checkout.phone')}`}
                    required={useDifferentShipping}
                    data-invalid={attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.phone)}
                    className={inputClass(attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.phone))}
                  />
                    </div>
                    <div className="space-y-1" aria-hidden="true" />
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">{t('checkout.county')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shippingCountyQuery || (shippingData.county ? countyNameByCode.get(shippingData.county) ?? '' : '')}
                      placeholder={t('checkout.selectCounty')}
                      onFocus={() => {
                        setShippingCountyOpen(true);
                        if (!shippingCountyQuery && shippingData.county) {
                          const name = countyNameByCode.get(shippingData.county) ?? '';
                          setShippingCountyQuery(name);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShippingCountyOpen(false), 120);
                        const names = counties.map((county) => county.name);
                        if (!isExactLocality(names, shippingCountyQuery)) {
                          setShippingCountyQuery('');
                          setShippingData((prev) => ({
                            ...prev,
                            county: '',
                            locality: '',
                            address1: '',
                            address2: '',
                          }));
                          setShippingComuna('');
                        }
                      }}
                      onChange={(event) => {
                        const value = event.target.value;
                        setShippingCountyQuery(value);
                        setShippingData((prev) => ({
                          ...prev,
                          county: '',
                          locality: '',
                          address1: '',
                          address2: '',
                        }));
                        setShippingComuna('');
                      }}
                      data-track-action={`${t('checkout.shippingTitle')}: ${t('checkout.county')}`}
                      required={useDifferentShipping}
                      data-invalid={attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.county)}
                      className={inputClass(
                        attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.county)
                      )}
                    />
                    {shippingCountyOpen && (
                      <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-white text-xs shadow-lg">
                        {filterLocalities(
                          counties.map((county) => county.name),
                          shippingCountyQuery
                        ).map((name) => (
                          <button
                            key={name}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              const code = countyCodeByName.get(normalizeText(name)) ?? '';
                              setShippingCountyQuery(name);
                              setShippingData((prev) => ({
                                ...prev,
                                county: code,
                                locality: '',
                                address1: '',
                              }));
                              setShippingComuna('');
                              setShippingCountyOpen(false);
                            }}
                            className="block w-full px-3 py-2 text-left hover:bg-amber-50"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">{t('checkout.locality')}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={shippingData.locality}
                          placeholder={t('checkout.selectLocality')}
                          onFocus={() => setShippingLocalityOpen(true)}
                          onBlur={() => {
                            setTimeout(() => setShippingLocalityOpen(false), 120);
                            if (shippingLocalities.length > 0 && !isExactLocality(shippingLocalities, shippingData.locality)) {
                              setShippingData((prev) => ({ ...prev, locality: '' }));
                              setShippingComuna('');
                            }
                          }}
                          onChange={(event) => {
                            setShippingData((prev) => ({
                              ...prev,
                              locality: event.target.value,
                              address1: '',
                              address2: '',
                            }));
                            setShippingComuna('');
                          }}
                          data-track-action={`${t('checkout.shippingTitle')}: ${t('checkout.locality')}`}
                          required={useDifferentShipping}
                          data-invalid={attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.locality)}
                          className={inputClass(
                            attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.locality)
                          )}
                        />
                        {shippingLocalities.length > 0 && shippingLocalityOpen && (
                          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-white text-xs shadow-lg">
                            {filterLocalities(shippingLocalities, shippingData.locality).map((locality) => (
                              <button
                                key={locality}
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setShippingData((prev) => ({
                                    ...prev,
                                    locality,
                                    address1: '',
                                    address2: '',
                                  }));
                                  setShippingComuna('');
                                  setShippingLocalityOpen(false);
                                }}
                                className="block w-full px-3 py-2 text-left hover:bg-amber-50"
                              >
                                {locality}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {isSamedayLoading && (
                        <p className="text-[11px] text-muted-foreground">{t('checkout.localitiesLoading')}</p>
                      )}

                    </div>

                    {shippingComunas.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">{t('checkout.commune')}</label>
                          <select
                              value={shippingComuna}
                              onChange={(event) => setShippingComuna(event.target.value)}
                              data-track-action={`${t('checkout.shippingTitle')}: ${t('checkout.commune')}`}
                              className="h-9 w-full rounded-lg border border-border px-2 text-xs"
                          >
                            <option value="">{t('checkout.selectCommune')}</option>
                            {shippingComunas.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                            ))}
                          </select>
                        </div>
                    )}
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">{t('checkout.address')}</label>
                  <input
                    type="text"
                    value={shippingData.address1}
                    onChange={(event) => setShippingData((prev) => ({ ...prev, address1: event.target.value }))}
                    data-track-action={`${t('checkout.shippingTitle')}: ${t('checkout.address')}`}
                    required={useDifferentShipping}
                    data-invalid={attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.address1)}
                    className={inputClass(attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.address1))}
                  />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">{t('checkout.address2')}</label>
                      <input
                        type="text"
                        value={shippingData.address2}
                        onChange={(event) => setShippingData((prev) => ({ ...prev, address2: event.target.value }))}
                        data-track-action={`${t('checkout.shippingTitle')}: ${t('checkout.address2')}`}
                        className={inputClass(false)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">{t('checkout.postcode')}</label>
                  <input
                    type="text"
                    value={shippingData.postcode}
                    onChange={(event) => setShippingData((prev) => ({ ...prev, postcode: event.target.value }))}
                    data-track-action={`${t('checkout.shippingTitle')}: ${t('checkout.postcode')}`}
                    required={useDifferentShipping}
                    data-invalid={attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.postcode)}
                    className={inputClass(attemptedSubmit && useDifferentShipping && !isNonEmpty(shippingData.postcode))}
                  />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">{t('checkout.country')}</label>
                      <input
                          type="text"
                          value={shippingData.country}
                          readOnly
                          data-track-action={`${t('checkout.shippingTitle')}: ${t('checkout.country')}`}
                          className="h-10 w-full rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
          </div>
          </div>

          {SHOW_SURPRISE_GIFT && (
            <div className="cadoucomanda rounded-2xl border border-border p-4">
              <p className="text-xl text-center font-semibold font-serif text-foreground">{t('checkout.surpriseQuestion')}</p>
              <div className="mt-3 flex items-center justify-center gap-3 text-sm font-semibold text-foreground">
                <span className={`${!isSurpriseGift ? 'text-foreground' : 'text-muted-foreground'} text-base font-bold`}>
                  {t('checkout.no')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isSurpriseGift}
                  onClick={() => setIsSurpriseGift((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border border-border transition-colors ${
                    isSurpriseGift ? 'bg-amber-500' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isSurpriseGift ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`${isSurpriseGift ? 'text-foreground' : 'text-muted-foreground'} text-base font-bold`}>
                  {t('checkout.yes')}
                </span>
              </div>
              <div className="mt-3 text-center">
                {isSurpriseGift ? (
                  <div className="cadou-status-message status-da" id="cadouStatusMessage">
                    {t('checkout.surpriseYesPrefix')}{' '}
                    <strong>{t('checkout.surpriseYesStrong')}</strong>. {t('checkout.surpriseYesBody')}
                  </div>
                ) : (
                  <div className="cadou-status-message status-nu" id="cadouStatusMessage">
                    {t('checkout.surpriseNoPrefix')}{' '}
                    <strong>{t('checkout.surpriseNoStrong')}</strong>. {t('checkout.surpriseNoBody')}
                  </div>
                )}
              </div>
              <img src="/client-vizual.png" alt={t('checkout.surpriseAlt')} className="mt-3 w-full rounded-xl object-cover" />
            </div>
          )}

          <div className="rounded-2xl p-2 hidden">
            <p className="text-sm font-semibold text-foreground">{t('checkout.sourceQuestion')}</p>
            <div className="mt-3">
              <select
                name="wc_customer_source_checkout_field"
                id="wc_customer_source_checkout_field"
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                data-allow_clear="true"
                data-placeholder={t('checkout.sourcePlaceholder')}
                defaultValue=""
              >
                <option value="">{t('checkout.sourcePlaceholder')}</option>
                <option value="Facebook">{t('checkout.sourceFacebook')}</option>
                <option value="Grupuri Facebook">{t('checkout.sourceFacebookGroups')}</option>
                <option value="Google">{t('checkout.sourceGoogle')}</option>
                <option value="Instagram">{t('checkout.sourceInstagram')}</option>
                <option value="Tik Tok">{t('checkout.sourceTikTok')}</option>
                <option value="Recomandari">{t('checkout.sourceRecommendations')}</option>
                <option value="Sunt client fidel">{t('checkout.sourceLoyalCustomer')}</option>
                <option value="Altceva">{t('checkout.sourceOther')}</option>
              </select>
            </div>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {mapLocality ? t('checkout.shippingMethodFor', { locality: mapLocality }) : t('checkout.shippingMethod')}
              </p>

              <p className="text-[11px] text-muted-foreground">
                {t('checkout.selectedCounty', { county: mapCountyName || '-' })}
              </p>
            </div>
            {deliveryInstanceId !== null && (
              <input type="hidden" name="shipping_instance_id" value={deliveryInstanceId} />
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ...(SHOW_SAMEDAY
                  ? [{ key: 'sameday', label: t('checkout.shippingSameday'), logo: '/sameday.jpg', price: 17, instanceId: 4 }]
                  : []),
                ...(SHOW_DPD
                  ? [{ key: 'dpd', label: t('checkout.shippingDpd'), logo: '/dpd.jpg', price: 20, instanceId: 2 }]
                  : []),
                ...(SHOW_EASYBOX
                  ? [{ key: 'easybox', label: t('checkout.shippingEasybox'), logo: '/sameday.jpg', price: 13, instanceId: 3 }]
                  : []),
                ...(isLocalPickupEligible
                  ? [{ key: 'pickup', label: t('checkout.shippingPickup'), logo: '/logo-gold.svg', price: 0, instanceId: 1 }]
                  : []),
              ].map((method) => {
                const active = deliveryMethod === method.key;
                return (
                  <button
                    key={method.key}
                    type="button"
                    onClick={() => setDeliveryMethod(method.key as DeliveryMethod)}
                    data-track-action={`${t('checkout.shippingMethod')}: ${method.label}`}
                    data-instance-id={method.instanceId ?? undefined}
                    className={`flex w-full items-center justify-between rounded-xl border px-2 py-3 text-left text-xs font-semibold ${
                      active ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-border bg-white text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={method.logo} alt={method.label} className="h-12 w-24 object-contain" />
                      <div>
                        <div>{method.label}</div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {method.key === 'pickup' ? t('checkout.pickupSchedule') : t('checkout.shippingDays')}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {method.key === 'pickup'
                        ? t('cart.free')
                        : totals.discountedCost >= 200
                          ? t('cart.free')
                          : `${method.price} lei`}
                    </span>
                  </button>
                );
              })}
            </div>
            {deliveryMethod === 'easybox' && (
              <div className="mt-3 rounded-xl border border-border bg-white p-3 text-xs">
                <p className="font-semibold text-foreground">{t('checkout.selectLocker')}</p>
                {!mapCountyName || !mapLocality ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t('checkout.selectLockerHint')}
                  </p>
                ) : (
                  <>
                    {isLockerLoading ? (
                      <p className="mt-2 text-[11px] text-muted-foreground">{t('checkout.lockersLoading')}</p>
                    ) : (
                      <>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {t('checkout.lockersFound', { count: lockerOptions.length })}
                        </p>
                        {lockerOptions.length > 0 ? (
                          <>
                            <input
                              type="text"
                              value={lockerQuery}
                              data-track-action="Locker Sameday"
                              onFocus={() => setLockerOpen(true)}
                              onBlur={() => {
                                setTimeout(() => setLockerOpen(false), 120);
                                const labels = lockerOptionItems.map((item) => item.label);
                                if (!isExactLocality(labels, lockerQuery)) {
                                  setSelectedLockerId('');
                                  setLockerQuery('');
                                }
                              }}
                              onChange={(event) => {
                                const value = event.target.value;
                                setLockerQuery(value);
                                if (!value) {
                                  setSelectedLockerId('');
                                  return;
                                }
                                setSelectedLockerId('');
                              }}
                              placeholder={t('checkout.searchLocker')}
                              className="mt-2 h-9 w-full rounded-lg border border-border px-2 text-xs"
                            />
                            {lockerOpen && (
                              <div className="relative">
                                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-white text-xs shadow-lg">
                                  {filterLocalities(
                                    lockerOptionItems.map((item) => item.label),
                                    lockerQuery
                                  ).map((label) => {
                                    const item = lockerOptionItems.find((option) => option.label === label);
                                    if (!item) return null;
                                    return (
                                      <button
                                        key={item.id}
                                        type="button"
                                        onMouseDown={(event) => {
                                          event.preventDefault();
                                          setLockerQuery(item.label);
                                          setSelectedLockerId(item.id);
                                          setLockerOpen(false);
                                        }}
                                        className="block w-full px-3 py-2 text-left hover:bg-amber-50"
                                      >
                                        {item.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {t('checkout.lockersUnavailable')}
                          </p>
                        )}
                        {selectedLocker ? (
                          <div className="mt-3 rounded-lg border border-border bg-muted/20 p-2 text-[11px] text-muted-foreground">
                            <p className="font-semibold text-foreground">{selectedLocker.name}</p>
                            {selectedLocker.address && <p>{selectedLocker.address}</p>}
                            {selectedLocker.postal_code && <p>{t('checkout.postalCode')}: {selectedLocker.postal_code}</p>}
                            {(() => {
                              const boxes = parseLockerBoxes(selectedLocker.boxes);
                              if (!boxes.total) return null;
                              if (boxes.sizes.length === 0) {
                                return <p>{t('checkout.boxes')}: {boxes.total}</p>;
                              }
                              return (
                                <p>
                                  {t('checkout.boxes')}:{' '}
                                  {boxes.sizes.map((item) => `${item.size}: ${item.count}`).join(', ')}
                                </p>
                              );
                            })()}
                          </div>
                        ) : (
                          lockerOptions.length > 0 && (
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {t('checkout.selectLockerPin')}
                            </p>
                          )
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
            {shouldShowMap && (
              <div className="mt-3 space-y-2">
                {mapKm > 0 && deliveryMethod === 'sameday' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    {t('checkout.extraKm', { km: mapKm })}
                  </div>
                )}
                {deliveryMethod === 'easybox' && lockerOptions.length > 0 ? (
                  <div className="relative z-0 overflow-hidden rounded-xl border border-border">
                    <div ref={lockerMapRef} className="h-[28rem] w-full" />
                  </div>
                ) : (
                  <div className="relative z-0 overflow-hidden rounded-xl border border-border">
                    <iframe
                      title={t('checkout.mapTitle')}
                      src={mapEmbedUrl}
                      className="h-[22rem] w-full border-0"
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                )}
                {mapComuna ? (
                  <p className="text-[11px] text-muted-foreground">{t('checkout.communeLabel', { name: mapComuna })}</p>
                ) : !mapLocality && mapCountyName ? (
                  <p className="text-[11px] text-muted-foreground">{t('checkout.countyLabel', { name: mapCountyName })}</p>
                ) : null}
              </div>
            )}
          </div>

          </div>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border p-4">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{t('checkout.productsTitle')}</span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('checkout.productsCount', { count: totals.totalItems })}
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {cart.map((item) => {
                  const hasPersonalizare = item.personalizare && item.personalizare.length > 0;
                  const itemKey = item.cartItemId ?? `${item.id}`;
                  const showPersonalizare = openPersonalizareId === itemKey;
                  return (
                    <div key={itemKey} className="rounded-xl border border-border p-3">
                      <div className="flex gap-3">
                        <img src={item.image} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">{item.title}</p>
                          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t('checkout.quantity')}: {item.quantity ?? 1}</span>
                            <span>
                              {parseFloat(item.priceReduced ?? item.price).toFixed(2)} lei
                            </span>
                          </div>
                          {hasPersonalizare && (
                            <button
                              type="button"
                              onClick={() =>
                                setOpenPersonalizareId((prev) => (prev === itemKey ? null : itemKey))
                              }
                              className="mt-2 text-[11px] font-semibold text-primary"
                            >
                              {showPersonalizare ? 'Ascunde personalizare' : 'Vezi personalizare'}
                            </button>
                          )}
                        </div>
                      </div>
                      {hasPersonalizare && showPersonalizare && (
                        <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
                          {item.personalizare?.map((entry) => (
                            <div key={`${itemKey}-${entry.name}`}>
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
                    </div>
                  );
                })}
              </div>
              {SHOW_PROMO_CODE && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-foreground">Cod promotional</p>
                  <div className="bg-white">
                    <div className="flex items-center gap-2 rounded-md mt-2 bg-muted/20 px-3 py-2 border border-1 border-[#ccc]">

                      <input
                        type="text"
                        value={promoCode}
                        onChange={(event) => setPromoCode(event.target.value)}
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
                          disabled={!appliedCouponCode || isApplyingCoupon}
                          className="w-full rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground disabled:opacity-50"
                      >
                        {t('cart.reset')}
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
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
            </div>

            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-foreground">{t('checkout.paymentMethod')}</p>
              <input type="hidden" name="payment_method" value={paymentMethodId} />
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  data-payment-id="cod"
                  onClick={() => setPaymentMethod('ramburs')}
                  data-track-action={`${t('checkout.paymentMethod')}: ${t('checkout.paymentCod')}`}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-xs font-semibold ${
                    paymentMethod === 'ramburs'
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : 'border-border bg-white text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <div>
                      <div>{t('checkout.paymentCod')}</div>
                      <div className="text-[11px] font-medium text-muted-foreground">{t('checkout.paymentCodHint')}</div>
                    </div>
                  </div>
                  <span className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border border-border transition-colors ${
                    paymentMethod === 'ramburs' ? 'bg-amber-500' : 'bg-muted'
                  }`}>
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      paymentMethod === 'ramburs' ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </span>
                </button>

                <button
                  type="button"
                  data-payment-id="bacs"
                  onClick={() => setPaymentMethod('transfer')}
                  data-track-action={`${t('checkout.paymentMethod')}: ${t('checkout.paymentBank')}`}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-xs font-semibold ${
                    paymentMethod === 'transfer'
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : 'border-border bg-white text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <div>
                      <div>{t('checkout.paymentBank')}</div>
                      <div className="text-[11px] font-medium text-muted-foreground">{t('checkout.paymentBankHint')}</div>
                    </div>
                  </div>
                  <span className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border border-border transition-colors ${
                    paymentMethod === 'transfer' ? 'bg-amber-500' : 'bg-muted'
                  }`}>
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      paymentMethod === 'transfer' ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </span>
                </button>
              </div>
              {paymentMethod === 'transfer' && (
                <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">{t('checkout.paymentBankPrimary')}</p>
                  <p>RO74INGB0000999906973879</p>
                  <p className="font-semibold text-foreground">{t('checkout.paymentBankSecondary')}</p>
                  <p>RO65TREZ7055069XXX012556</p>
                  <p>{t('checkout.paymentBankInfo')}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border p-4">
              <div className="rounded-2xl mb-3" id="checkout-summary">
                <p className="text-sm font-semibold text-foreground">{t('checkout.orderNotes')}</p>
                <div className="mt-3">
                <textarea
                    value={orderNote}
                    onChange={(event) => setOrderNote(event.target.value)}
                    data-track-action={t('checkout.orderNotes')}
                    className="min-h-[120px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                    placeholder={t('checkout.orderNotesPlaceholder')}
                />
                </div>
              </div>
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-900">
                {t('checkout.pointsInfo', { points: Math.round(totals.total) })}
              </div>
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                {t('cart.advanceIntroPrefix')} <b>30%</b> {t('cart.advanceIntroSuffix')} {t('cart.advanceMore')}.
              </div>
              <p className="text-sm font-semibold text-foreground">{t('cart.summaryTitle')}</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>{t('cart.productsCost', { count: totals.totalItems })}</span>
                  <span>{totals.cost.toFixed(2)} lei</span>
                </div>
                {totals.couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>{t('cart.couponDiscount')}</span>
                    <span>-{totals.couponDiscount.toFixed(2)} lei</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>{t('cart.shipping')}</span>
                  {totals.shipping === 0 ? (
                    <span className="font-semibold text-emerald-600">{t('cart.free')}</span>
                  ) : (
                    <span>{totals.shipping.toFixed(2)} lei</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span>{totals.discountedCost.toFixed(2)} lei</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-foreground">
                  <span>{t('cart.totalVat')}</span>
                  <span>{totals.total.toFixed(2)} lei</span>
                </div>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 text-xs text-muted-foreground ${
                attemptedSubmit && !termsAccepted ? 'border-red-400' : 'border-border'
              }`}
              data-invalid={attemptedSubmit && !termsAccepted}
            >
              <p>
                {t('checkout.privacyIntro')}{' '}
                <a
                  href="https://darurialese.ro/politica-de-confidentialitate/"
                  className="text-primary underline"
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveLegalModal('privacy');
                  }}
                >
                  {t('checkout.privacyLink')}
                </a>
                .
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
                <span className="text-xs font-semibold text-foreground">
                  {t('checkout.termsAccept')}{' '}
                  <a
                    href="https://darurialese.ro/termeni-si-conditii-daruri-alese/"
                    className="text-primary underline"
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveLegalModal('terms');
                    }}
                  >
                    {t('checkout.termsLink')}
                  </a>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={termsAccepted}
                  onClick={() => setTermsAccepted((prev) => !prev)}
                  data-track-action="A bifat termenii si conditiile."
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border border-border transition-colors ${
                    termsAccepted ? 'bg-amber-500' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      termsAccepted ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {attemptedSubmit && !termsAccepted && (
                <p className="mt-2 text-xs font-semibold text-red-500">{t('checkout.termsRequired')}</p>
              )}
              <button
                type="button"
                onClick={handleSubmitClick}
                disabled={isSubmitting}
                data-track-action="A trimis comanda."
                className="mt-4 w-full rounded-full py-3 text-xs font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
              >
                {isSubmitting ? t('checkout.submitting') : t('checkout.submit')}
              </button>
            </div>
          </aside>
        </div>
              </div>
            </div>
          </section>

          <aside className="min-h-full border-l border-border bg-white">
            <div className="relative flex h-full flex-col">
              <div className="border-b border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('nav.categories')}
                </p>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('search.categoriesPlaceholder')}
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
                    {t('category.loadingCategories')}
                  </div>
                ) : categoryError ? (
                  <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                    {categoryError}
                  </div>
                ) : categorySearch.trim() ? (
                  searchResults.nodes.length === 0 ? (
                    <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                      {t('search.noCategories')}
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
                aria-label={t('common.scrollDown')}
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
      {activeLegalModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveLegalModal(null)}
          />
            <div className="fixed inset-x-0 bottom-0 z-50 h-[80vh] rounded-t-2xl bg-white p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveLegalModal(null)}
              className="absolute right-4 top-4 rounded-full border border-border bg-white p-2 text-muted-foreground shadow-sm"
              aria-label={t('common.close')}
            >
              {t('common.close')}
            </button>
            <h3 className="text-base font-semibold text-foreground">
              {activeLegalModal === 'privacy' ? t('checkout.privacyTitle') : t('checkout.termsTitle')}
            </h3>
            {activeLegalModal === 'terms' ? (
              <div
                className="mt-3 h-[calc(80vh-96px)] overflow-y-auto text-xs text-muted-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:mt-2 [&_ul]:mt-2 [&_ol]:mt-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: termsHtml }}
              />
            ) : privacyHtml ? (
              <div
                className="mt-3 h-[calc(80vh-96px)] overflow-y-auto text-xs text-muted-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:mt-2 [&_ul]:mt-2 [&_ol]:mt-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: privacyHtml }}
              />
            ) : (
              <div className="mt-3 text-sm text-muted-foreground">{t('checkout.contentPending')}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopCheckoutPage;


