import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchProductDetailsCached } from '@/services/api';
import { ProductDetailResponse } from '@/types/api';
import MobileProductHeader from '@/components/mobile/MobileProductHeader';
import { ArrowLeft, ArrowRight, Heart, ChevronDown, FileText, ListChecks, MessageCircle, Layers, ShoppingCart, Image as ImageIcon, X } from 'lucide-react';
import MobileCategorySheet from '@/components/mobile/MobileCategorySheet';
import MobileSearchSheet from '@/components/mobile/MobileSearchSheet';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { formatDimensions } from '@/utils/formatDimensions';
import { tiktokViewContent } from '@/utils/tiktok';
import { fbViewContent } from '@/utils/facebook';
import PromoBanner, { SHOW_PROMO_BANNER } from '@/components/PromoBanner';

const SHOW_PREVIEW_TOGGLE = false;

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentSlug, currentSlug } = useCategoryContext();
  const { cart, wishlist, addToCart, addToWishlist, removeFromWishlist } = useShopContext();
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoPage, setPhotoPage] = useState(0);
  const [areTagsCollapsed, setAreTagsCollapsed] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showCartConfirm, setShowCartConfirm] = useState(false);
  const [openSection, setOpenSection] = useState<'descriere' | 'detalii' | 'simulare' | 'livrare' | 'led' | 'boxa' | null>('detalii');
  const [reviewPage, setReviewPage] = useState(1);
  const [shouldScrollToReviews, setShouldScrollToReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [zoomReviewIndex, setZoomReviewIndex] = useState<number | null>(null);
  const [showPersonalizare, setShowPersonalizare] = useState(false);
  const [personalizareValues, setPersonalizareValues] = useState<Record<string, string | string[]>>({});
  const [personalizareFiles, setPersonalizareFiles] = useState<Record<string, string>>({});
  const [showFullShortDesc, setShowFullShortDesc] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loadingDots, setLoadingDots] = useState('');
  const [showAllConfirmCategories, setShowAllConfirmCategories] = useState(false);
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [showOrderDateModal, setShowOrderDateModal] = useState(false);
  const photoTouchStartX = useRef<number | null>(null);
  const photoTouchEndX = useRef<number | null>(null);
  const templateSliderRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [templateNavState, setTemplateNavState] = useState<Record<string, { canPrev: boolean; canNext: boolean }>>({});
  const categorySectionRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const prefetchedProductSlugs = useRef<Set<string>>(new Set());
  const categorySliderRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const titleThresholdRef = useRef(0);
  const formatRoDate = (date: Date) =>
    date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
  const todayDate = new Date();
  const saturdayDate = new Date(todayDate);
  saturdayDate.setDate(todayDate.getDate() + ((6 - todayDate.getDay() + 7) % 7));
  const sundayDate = new Date(todayDate);
  sundayDate.setDate(todayDate.getDate() + ((7 - todayDate.getDay()) % 7));
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
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const orderDateLabel = isSameDay(orderDate, todayDate) ? 'Astazi' : 'Diferita';

  useEffect(() => {
    if (!slug) return;
    let isActive = true;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'auto' });

    fetchProductDetailsCached(slug)
      .then((response) => {
        if (!isActive) return;
        setData(response);
        setLoading(false);

        const price = parseFloat(response.pret_redus || response.pret || '0');
        const priceWithoutVAT = price / 1.21;
        tiktokViewContent(String(response.id), response.titlu, priceWithoutVAT, 'RON');
        fbViewContent(String(response.id), response.titlu, priceWithoutVAT, 'RON');
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'Failed to load product');
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    const defaultTitle = 'Daruri Alese Catalog';
    const title = data.titlu ? `${data.titlu} | ${defaultTitle}` : defaultTitle;
    document.title = title;

    const rawDescription = data.descriere_scurta || data.descriere || '';
    const cleanDescription = rawDescription
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const description =
      cleanDescription.length > 0 ? cleanDescription.slice(0, 160) : defaultTitle;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [data]);

  useEffect(() => {
    if (!loading) {
      setLoadingDots('');
      return;
    }
    const dots = ['', '.', '..', '...'];
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % dots.length;
      setLoadingDots(dots[index]);
    }, 500);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setAreTagsCollapsed(false);
      }
    };

    if (window.innerWidth <= 768) {
      setAreTagsCollapsed(true);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const highlight = searchParams.get('tab');

  const personalizareFields = useMemo(() => {
    if (!data?.personalizare?.length) return [];
    return data.personalizare.filter((field) => field.enabled !== false);
  }, [data]);

  const buildPersonalizarePayload = () =>
    personalizareFields
      .map((field) => {
        const value = personalizareValues[field.name];
        const file = personalizareFiles[field.name];
        if (!value && !file) return null;
        return {
          name: field.name,
          label: field.label || 'Optiune',
          type: field.type,
          value,
          file,
          options: field.options || [],
          maxChars: field.max_chars ? Number(field.max_chars) : undefined,
        };
      })
      .filter(Boolean) as Array<{
      name: string;
      label: string;
      type: string;
      value?: string | string[];
      file?: string;
      options?: string[];
      maxChars?: number;
    }>;

  useEffect(() => {
    if (!data?.slug) return;
    const stored = sessionStorage.getItem(`personalizare:${data.slug}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Record<string, string | string[]>;
      setPersonalizareValues(parsed);
      const hasValues = Object.values(parsed).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value)
      );
      if (hasValues) {
        setShowPersonalizare(true);
      }
    } catch {
      setPersonalizareValues({});
    }
  }, [data?.slug]);

  useEffect(() => {
    if (!data?.slug) return;
    const stored = sessionStorage.getItem(`personalizare-files:${data.slug}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Record<string, string>;
      setPersonalizareFiles(parsed);
    } catch {
      setPersonalizareFiles({});
    }
  }, [data?.slug]);

  useEffect(() => {
    if (!data?.slug) return;
    sessionStorage.setItem(`personalizare:${data.slug}`, JSON.stringify(personalizareValues));
  }, [data?.slug, personalizareValues]);

  useEffect(() => {
    if (!data?.slug) return;
    sessionStorage.setItem(`personalizare-files:${data.slug}`, JSON.stringify(personalizareFiles));
  }, [data?.slug, personalizareFiles]);

  const updateTemplateNav = (fieldName: string, container: HTMLDivElement | null) => {
    if (!container) return;
    const canPrev = container.scrollLeft > 4;
    const canNext = container.scrollLeft + container.clientWidth < container.scrollWidth - 4;
    setTemplateNavState((prev) => ({
      ...prev,
      [fieldName]: { canPrev, canNext },
    }));
  };

  useEffect(() => {
    if (!showPersonalizare) return;
    personalizareFields.forEach((field) => {
      if (!field.label?.toLowerCase().includes('mesaj')) return;
      const node = templateSliderRefs.current.get(field.name);
      if (node) {
        updateTemplateNav(field.name, node);
      }
    });
  }, [personalizareFields, showPersonalizare]);

  useEffect(() => {
    if (highlight === 'informatii') {
      setOpenSection('descriere');
    }
    if (highlight === 'personalizeaza') {
      setOpenSection('detalii');
    }
  }, [highlight]);

  const orderedAttributes = useMemo(() => {
    if (!data) return [];
    const dimensionValue = formatDimensions(data.dimensiune);
    const dimensionRow = dimensionValue
      ? {
          name: 'Dimensiuni',
          slug: 'dimensiuni',
          visible: true,
          variation: false,
          options: [dimensionValue],
        }
      : null;

    const sorted = data.attributes
      .filter((attr) => attr.visible && attr.name !== 'Debitare nume')
      .sort((a, b) => {
        const priorityOrder = ['Tip', 'Material', 'Relatie'];
        const aIndex = priorityOrder.indexOf(a.name);
        const bIndex = priorityOrder.indexOf(b.name);
        if (aIndex !== -1 || bIndex !== -1) {
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        }
        return a.name.localeCompare(b.name);
      });
    return dimensionRow ? [dimensionRow, ...sorted] : sorted;
  }, [data]);

  const isLedProduct = useMemo(() => {
    if (!data?.attributes?.length) return false;
    return data.attributes.some((attr) =>
      attr.options?.some((option) => option.toLowerCase().includes('led'))
    );
  }, [data]);

  const isMusicProduct = useMemo(() => {
    if (!data?.attributes?.length) return false;
    return data.attributes.some((attr) =>
      attr.options?.some((option) => option.toLowerCase().includes('muzical'))
    );
  }, [data]);

  const photoItems = useMemo(() => {
    if (!data) return [];
    return data.recenzii.flatMap((review) =>
      (review.imagini || []).map((img) => ({
        url: img.full || img.thumbnail,
        author: review.autor,
      }))
    );
  }, [data]);

  const galleryImages = useMemo(() => {
    if (!data) return [];
    const images: string[] = [];
    if (data.imagine_principala?.full) {
      images.push(data.imagine_principala.full);
    } else if (data.imagine_principala?.['300x300']) {
      images.push(data.imagine_principala['300x300']);
    }
    if (Array.isArray(data.galerie)) {
      data.galerie.forEach((item) => {
        if (!item) return;
        if (typeof item === 'string') {
          images.push(item);
        } else if (typeof item === 'object') {
          images.push(item.full || item['300x300'] || item['100x100']);
        }
      });
    }
    return images.filter(Boolean);
  }, [data]);

  useEffect(() => {
    setPhotoPage(0);
  }, [data?.slug]);

  useEffect(() => {
    setReviewPage(1);
  }, [data?.slug]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [data?.slug]);

  useEffect(() => {
    if (!shouldScrollToReviews) return;
    const target = document.getElementById('review-write-card');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShouldScrollToReviews(false);
  }, [shouldScrollToReviews]);

  useEffect(() => {
    if (!data) return;
    const titleEl = document.getElementById('product-title');
    if (titleEl) {
      titleThresholdRef.current = titleEl.offsetTop + titleEl.offsetHeight;
    }
    const handleScroll = () => {
      setShowQuickNav(window.scrollY > titleThresholdRef.current);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data]);

  const handleAddOrOpenPersonalizare = () => {
    if (!showPersonalizare && personalizareFields.length > 0) {
      setShowPersonalizare(true);
      requestAnimationFrame(() => {
        const block = document.getElementById('personalizare-block');
        if (!block) return;
        const header = document.querySelector('header');
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        const top = block.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      });
      return;
    }
    const personalizarePayload = buildPersonalizarePayload();
    if (window.rybbit?.event) {
      const selections = personalizarePayload
        .map((entry) => {
          if (entry.type === 'upload' && entry.file) {
            return `${entry.label}=confidential`;
          }
          if (Array.isArray(entry.value)) {
            return `${entry.label}=${entry.value.join(', ')}`;
          }
          if (typeof entry.value === 'string' && entry.value.trim().length > 0) {
            return `${entry.label}=${entry.value.trim()}`;
          }
          return null;
        })
        .filter(Boolean)
        .join(' | ');

      window.rybbit.event('AddToCart', {
        url: window.location.href,
        product: data.titlu || 'Produs necunoscut',
        productId: data.id ?? null,
        customizations: selections.length ? selections : 'fara personalizari',
      });
    }
    addToCart({
      id: data.id,
      slug: data.slug,
      title: data.titlu,
      image: data.imagine_principala['300x300'] || data.imagine_principala.full,
      price: data.pret,
      priceReduced: data.pret_redus,
      personalizare: personalizarePayload,
    });
    if (data.slug) {
      sessionStorage.removeItem(`personalizare:${data.slug}`);
      sessionStorage.removeItem(`personalizare-files:${data.slug}`);
    }
    setPersonalizareValues({});
    setPersonalizareFiles({});
    setShowPersonalizare(false);
    setShowCartConfirm(true);
  };

  useEffect(() => {
    if (!data?.categorii?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const categoryId = Number((entry.target as HTMLElement).dataset.categoryId || 0);
          const category = data.categorii?.find((item) => item.id === categoryId);
          const produse = category?.produse || [];
          produse.slice(0, 3).forEach((produs) => {
            if (!produs.slug || prefetchedProductSlugs.current.has(produs.slug)) return;
            prefetchedProductSlugs.current.add(produs.slug);
            fetchProductDetailsCached(produs.slug).catch(() => undefined);
          });
        });
      },
      { rootMargin: '200px 0px', threshold: 0.2 }
    );

    categorySectionRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [data]);

  const prefetchByIndex = (produse: typeof data.categorii[number]['produse'], startIndex: number, count: number) => {
    if (!produse?.length) return;
    const end = Math.min(startIndex + count, produse.length);
    for (let i = startIndex; i < end; i += 1) {
      const produs = produse[i];
      if (!produs?.slug || prefetchedProductSlugs.current.has(produs.slug)) continue;
      prefetchedProductSlugs.current.add(produs.slug);
      fetchProductDetailsCached(produs.slug).catch(() => undefined);
    }
  };


  useEffect(() => {
    const firstCategorySlug = data?.categorii?.[0]?.slug;
    if (!firstCategorySlug) return;
    if (currentSlug !== firstCategorySlug) {
      setCurrentSlug(firstCategorySlug);
    }
  }, [data?.categorii, currentSlug, setCurrentSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
      <MobileProductHeader
        title={`Se incarca${loadingDots}`}
        onBack={() => navigate(-1)}
        onSearchClick={() => setIsSearchOpen(true)}
        onLogoClick={() => {
          setCurrentSlug('cadouri-ziua-indragostitilor');
          navigate('/');
        }}
        categoryTitle={data?.categorii?.[0]?.titlu}
        onCategoryClick={() => setIsCategoryOpen(true)}
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        onCartClick={() => navigate('/cos')}
        onWishlistClick={() => navigate('/wishlist')}
      />
        <div className="animate-pulse">
          <div className="h-[45vh] w-full bg-muted/60" />
          <div className="px-4 pt-4">
            <div className="h-5 w-3/4 rounded bg-muted/60" />
            <div className="mt-3 h-4 w-32 rounded bg-muted/60" />
          <div className="mt-4 flex gap-2">
              <div className="h-9 flex-1 rounded-full bg-muted/60" />
              <div className="h-9 w-24 rounded-full bg-muted/60" />
            </div>
          </div>
          <div className="mt-6 px-4">
            <div className="h-4 w-56 rounded bg-muted/60" />
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, index) => (
                <div key={`review-skeleton-${index}`} className="aspect-square rounded-xl bg-muted/60" />
              ))}
            </div>
          </div>
          <div className="mt-6 px-4">
            <div className="h-4 w-32 rounded bg-muted/60" />
            <div className="mt-3 space-y-2">
              {[...Array(4)].map((_, index) => (
                <div key={`attr-skeleton-${index}`} className="h-8 rounded bg-muted/60" />
              ))}
            </div>
          </div>
          <div className="mt-6 space-y-4 px-4 pb-10">
            <div className="h-24 rounded-2xl bg-muted/60" />
            <div className="h-28 rounded-2xl bg-muted/60" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white px-4 py-10">
      <MobileProductHeader
        title="Produs"
        onBack={() => navigate(-1)}
        onSearchClick={() => setIsSearchOpen(true)}
        onLogoClick={() => {
          setCurrentSlug('cadouri-ziua-indragostitilor');
          navigate('/');
        }}
        categoryTitle={data?.categorii?.[0]?.titlu}
        onCategoryClick={() => setIsCategoryOpen(true)}
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        onCartClick={() => navigate('/cos')}
        onWishlistClick={() => navigate('/wishlist')}
      />
        <p className="text-destructive">Nu am putut incarca produsul.</p>
      </div>
    );
  }

  const price = parseFloat(data.pret);
  const reducedPrice = data.pret_redus ? parseFloat(data.pret_redus) : null;
  const hasDiscount = typeof reducedPrice === 'number' && reducedPrice !== price;
  const originalPrice = hasDiscount ? Math.max(price, reducedPrice as number) : price;
  const discountedPrice = hasDiscount ? Math.min(price, reducedPrice as number) : price;
  const isInWishlist = wishlist.some((item) => item.id === data.id);
  const averageRating = Number(data.average_recenzii) || 0;
  const imageReviewCount = data.recenzii.filter((review) => (review.imagini?.length || 0) > 0).length;
  const rewardPoints = Math.max(1, Math.round(discountedPrice));
  const discountPercent = hasDiscount
    ? Math.max(1, Math.round(((originalPrice - discountedPrice) / originalPrice) * 100))
    : 0;

  const pageSize = 3;
  const totalPhotoPages = Math.max(1, Math.ceil(photoItems.length / pageSize));
  const currentPhotoItems = photoItems.slice(photoPage * pageSize, (photoPage + 1) * pageSize);
  const handlePhotoTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    photoTouchStartX.current = event.touches[0]?.clientX ?? null;
    photoTouchEndX.current = null;
  };
  const handlePhotoTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    photoTouchEndX.current = event.touches[0]?.clientX ?? null;
  };
  const handlePhotoTouchEnd = () => {
    if (photoTouchStartX.current == null || photoTouchEndX.current == null) return;
    const delta = photoTouchStartX.current - photoTouchEndX.current;
    const threshold = 40;
    if (Math.abs(delta) < threshold) return;
    if (delta > 0) {
      setPhotoPage((prev) => Math.min(prev + 1, totalPhotoPages - 1));
    } else {
      setPhotoPage((prev) => Math.max(prev - 1, 0));
    }
  };
  const scrollToTopSmooth = () => {
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };
  const goToCategory = (slug: string) => {
    setCurrentSlug(slug);
    navigate(`/categorie/${slug}`);
    scrollToTopSmooth();
  };

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('read-failed'));
      reader.readAsDataURL(file);
    });

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image-load-failed'));
      img.src = src;
    });

  const compressImage = async (file: File) => {
    const src = await readAsDataUrl(file);
    const img = await loadImage(src);
    const maxSize = 1600;
    const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const heroDiscountPercent = data
    ? (() => {
        const price = parseFloat(data.pret);
        const reduced = data.pret_redus ? parseFloat(data.pret_redus) : null;
        if (typeof reduced === 'number' && reduced !== price) {
          const original = Math.max(price, reduced);
          const current = Math.min(price, reduced);
          return Math.max(1, Math.round(((original - current) / original) * 100));
        }
        return null;
      })()
    : null;

  return (
      <div className="min-h-screen bg-white pb-4">
          <MobileProductHeader
              title={data.titlu}
              onBack={() => navigate(-1)}
              onSearchClick={() => setIsSearchOpen(true)}
              onLogoClick={() => {
                  setCurrentSlug('cadouri-ziua-indragostitilor');
                  navigate('/');
              }}
              categoryTitle={data.categorii?.[0]?.titlu}
              onCategoryClick={() => setIsCategoryOpen(true)}
              cartCount={cart.length}
              wishlistCount={wishlist.length}
              onCartClick={() => navigate('/cos')}
              onWishlistClick={() => navigate('/wishlist')}
          />

          <div id="product-photo" className="-mt-3 relative ">
              <img
                  src={galleryImages[activeImageIndex] || data.imagine_principala.full || data.imagine_principala['300x300']}
                  alt={data.titlu}
                  className="w-full object-cover rounded-br-3xl "
                  loading="lazy"
              />
              {heroDiscountPercent && (
                <span
                  className="absolute right-3 top-6 z-10 rounded-full px-3 py-1 text-xs font-bold text-white shadow-md"
                  style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
                >
                  -{heroDiscountPercent}%
                </span>
              )}
              {galleryImages.length > 1 && (
                <>
                  {activeImageIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => Math.max(prev - 1, 0))}
                      data-track-action="A schimbat poza produsului la anterioara."
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-md bg-white/55 px-1 py-4 text-foreground shadow"
                      aria-label="Imagine anterioara"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  )}
                  {activeImageIndex < galleryImages.length - 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((prev) => Math.min(prev + 1, galleryImages.length - 1))
                      }
                      data-track-action="A schimbat poza produsului la urmatoarea."
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md bg-white/55 px-1 py-4 text-foreground shadow"
                      aria-label="Imagine urmatoare"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
              <button
                  type="button"
                  onClick={() => {
                      if (isInWishlist) {
                          removeFromWishlist(data.id);
                          return;
                      }
                      addToWishlist({
                          id: data.id,
                          slug: data.slug,
                          title: data.titlu,
                          image: data.imagine_principala['300x300'] || data.imagine_principala.full,
                          price: data.pret,
                          priceReduced: data.pret_redus,
                      });
                  }}
                  data-track-action={`A apasat pe wishlist pentru ${data.titlu}.`}
                  className="absolute bottom-4 right-4 z-10 rounded-full bg-black/70 p-2"
                  aria-label="Wishlist"
              >
                  <Heart className={`h-6 w-6 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-white'}`}/>
              </button>
              <button
                  type="button"
                  onClick={() => navigate(-1)}
                  data-track-action="A apasat inapoi din pagina produsului."
                  className="absolute left-1 top-4 rounded-md bg-amber-900/20 p-3 text-white"
                  aria-label="Inapoi"
              >
                  <ArrowLeft className="h-6 w-6"/>
              </button>
          </div>

          {photoItems.length > 0 && (
              <div
                className="mt-2 px-4 relative"
                onTouchStart={handlePhotoTouchStart}
                onTouchMove={handlePhotoTouchMove}
                onTouchEnd={handlePhotoTouchEnd}
              >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                        {photoItems.length} poze reale de la clientii nostri
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {photoPage + 1}/{totalPhotoPages}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                      {currentPhotoItems.map((item, index) => (
                            <button
                                key={`${item.url}-${index}`}
                                type="button"
                                onClick={() => {
                                  const zoomIndex = photoItems.findIndex((entry) => entry.url === item.url);
                                  setZoomReviewIndex(zoomIndex >= 0 ? zoomIndex : 0);
                                }}
                                 data-track-action="A deschis poza din recenziile produsului."
                                 className="overflow-hidden rounded-xl border border-border bg-muted"
                            >
                                <img
                                    src={item.url}
                                    alt={item.author}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </button>
                        ))}
                    </div>
                    {totalPhotoPages > 1 && (
                      <>
                        <button
                            type="button"
                            onClick={() => setPhotoPage((prev) => Math.max(prev - 1, 0))}
                            data-track-action="A navigat la pagina anterioara de poze recenzie."
                            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-tr-lg rounded-br-lg bg-white/85 p-2 shadow"
                            aria-label="Recenzie anterioara"
                        >
                            <ArrowLeft className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setPhotoPage((prev) => Math.min(prev + 1, totalPhotoPages - 1))}
                            data-track-action="A navigat la pagina urmatoare de poze recenzie."
                            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-tl-lg rounded-bl-lg bg-white/85 p-2 shadow"
                            aria-label="Recenzie urmatoare"
                        >
                            <ArrowRight className="h-4 w-4 text-foreground" />
                        </button>
                      </>
                    )}
              </div>
          )}

          <div className="px-4 pt-4">
          <h1 id="product-title" className="text-3xl font-serif font-bold text-foreground">{data.titlu}</h1>
          <div className="mt-2 flex items-center gap-2">
            {hasDiscount && (
              <span className="text-sm text-amber-700 line-through">{originalPrice.toFixed(2)} lei</span>
            )}
              <span className="text-lg font-bold text-black">{discountedPrice.toFixed(2)} lei</span>
            {hasDiscount && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                -{discountPercent}%
              </span>
            )}

          </div>
          {data.descriere_scurta && (
            <div className="mt-2">
              <div
                className={`text-xs text-muted-foreground prose max-w-none ${
                  showFullShortDesc ? '' : 'line-clamp-3'
                }`}
                dangerouslySetInnerHTML={{ __html: data.descriere_scurta }}
              />
              <button
                type="button"
                onClick={() => setShowFullShortDesc((prev) => !prev)}
                data-track-action="A extins descrierea scurta."
                className="mt-1 text-[11px] font-semibold text-[#6e4514]"
              >
                {showFullShortDesc ? 'Vezi mai putin' : 'Vezi mai mult'}
              </button>
            </div>
          )}

          <div id="personalizare-block" className="mb-6 mt-4 space-y-3">
            {SHOW_PREVIEW_TOGGLE && (
              <label htmlFor="preview-toggle" className="grid cursor-pointer grid-cols-7 items-start gap-3 rounded-xl border border-[#e9e6e3] bg-white p-3 shadow-sm">
                <input id="preview-toggle" type="checkbox" className="sr-only peer" />
                <span className="relative col-span-2 mt-0.5 h-11 w-[86px] rounded-full border border-neutral-300 bg-neutral-200 shadow-inner transition-colors peer-checked:border-[#6e4514] peer-checked:bg-[#6e4514] after:absolute after:left-1 after:top-1 after:h-9 after:w-9 after:rounded-full after:bg-white after:shadow-md after:transition-transform after:content-[''] peer-checked:after:translate-x-[38px]" />
                <span className="col-span-5 flex flex-col">
                  <span className="mb-1 font-semibold leading-tight">
                    Doresc previzualizare <span className="text-sm font-normal text-darker-gray">(+15 lei)</span>
                  </span>
                  <span className="text-xs leading-snug text-darker-gray">
                    Vei primi o previzualizare digitală a comenzii pe Whatsapp. Include modificări nelimitate.
                  </span>
                </span>
              </label>
            )}

            {showPersonalizare && personalizareFields.length > 0 && (
              <div className="space-y-4 rounded-xl border border-border bg-white p-4">
      {personalizareFields.filter((field) => !(field.type === 'checkboxes' && !field.label)).map((field) => (
        <div key={field.name} className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-foreground">
                        {field.label || 'Optiune'}
                      </span>
                      {field.required && <span className="text-xs font-semibold text-red-500">*</span>}
                    </div>
                    {field.description && <p className="text-[11px] text-muted-foreground">{field.description}</p>}

                    {field.type === 'textfield' && (
                      <input
                        type="text"
                        placeholder={field.placeholder || ''}
                        value={typeof personalizareValues[field.name] === 'string' ? personalizareValues[field.name] : ''}
                        onChange={(event) =>
                          setPersonalizareValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                        }
                        className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <div>
                        <textarea
                          placeholder={field.placeholder || ''}
                          maxLength={field.max_chars ? Number(field.max_chars) : undefined}
                          value={typeof personalizareValues[field.name] === 'string' ? personalizareValues[field.name] : ''}
                          onChange={(event) =>
                            setPersonalizareValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                          }
                          className="min-h-[100px] w-full resize-y rounded-lg border border-border px-3 py-2 text-sm"
                        />
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                            {field.label?.toLowerCase().includes('mesaj') && data['texte-produs']?.length ? (
                              <span>Variante de text ({data['texte-produs'].length})</span>
                            ) : (
                              <span>&nbsp;</span>
                            )}
                            {field.max_chars && (
                              <span>
                                {(typeof personalizareValues[field.name] === 'string'
                                  ? personalizareValues[field.name].length
                                  : 0)}{' '}
                                / {field.max_chars} caractere
                              </span>
                            )}
                          </div>

                          {field.label?.toLowerCase().includes('mesaj') && data['texte-produs']?.length ? (
                            <div className="relative">
                              <div
                                className="flex snap-x snap-mandatory overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                                ref={(node) => {
                                  templateSliderRefs.current.set(field.name, node);
                                }}
                                onScroll={(event) => updateTemplateNav(field.name, event.currentTarget)}
                              >
                              {data['texte-produs'].map((template, templateIndex) => (
                                <button
                                  key={`${field.name}-template-${templateIndex}`}
                                  type="button"
                                  onClick={() =>
                                    setPersonalizareValues((prev) => ({ ...prev, [field.name]: template }))
                                  }
                                  className={`w-full shrink-0 snap-start rounded-lg border px-3 py-2 text-left text-xs shadow-sm ${
                                    personalizareValues[field.name] === template
                                      ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-700'
                                      : 'border-border bg-white text-foreground'
                                  }`}
                                >
                                  {template}
                                </button>
                              ))}
                              </div>
                              {templateNavState[field.name]?.canPrev && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const container = templateSliderRefs.current.get(field.name);
                                    if (!container) return;
                                    const card = container.firstElementChild as HTMLElement | null;
                                    const step = (card?.getBoundingClientRect().width || 0) + 12;
                                    container.scrollBy({ left: -step, behavior: 'smooth' });
                                  }}
                                  className="absolute left-0 top-1/2 -translate-x-2/3 -translate-y-1/2 rounded-full border border-border bg-white px-2 py-1 text-xs font-semibold text-foreground shadow"
                                  aria-label="Anterior"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {templateNavState[field.name]?.canNext && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const container = templateSliderRefs.current.get(field.name);
                                    if (!container) return;
                                    const card = container.firstElementChild as HTMLElement | null;
                                    const step = (card?.getBoundingClientRect().width || 0) + 12;
                                    container.scrollBy({ left: step, behavior: 'smooth' });
                                  }}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2/3 rounded-full border border-border bg-white px-2 py-1 text-xs font-semibold text-foreground shadow"
                                  aria-label="Urmator"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {field.type === 'upload' && (
                      <div>
                        <label
                          htmlFor={`upload-${field.name}`}
                          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d7d2cc] bg-[#faf8f5] px-3 py-5 text-center text-xs text-muted-foreground"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            const file = event.dataTransfer.files?.[0];
                            if (!file) return;
                            compressImage(file)
                              .then((result) => {
                                setPersonalizareFiles((prev) => ({
                                  ...prev,
                                  [field.name]: result,
                                }));
                              })
                              .catch(() => {
                                readAsDataUrl(file).then((result) => {
                                  setPersonalizareFiles((prev) => ({
                                    ...prev,
                                    [field.name]: result,
                                  }));
                                });
                              });
                          }}
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                            📷
                          </span>
                          <span>Trage aici poza sau apasa pentru incarcare</span>
                        </label>
                        <input
                          id={`upload-${field.name}`}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            compressImage(file)
                              .then((result) => {
                                setPersonalizareFiles((prev) => ({
                                  ...prev,
                                  [field.name]: result,
                                }));
                              })
                              .catch(() => {
                                readAsDataUrl(file).then((result) => {
                                  setPersonalizareFiles((prev) => ({
                                    ...prev,
                                    [field.name]: result,
                                  }));
                                });
                              });
                          }}
                        />
                        {personalizareFiles[field.name] && (
                          <div className="mt-3 overflow-hidden rounded-lg border border-border">
                            <img
                              src={personalizareFiles[field.name]}
                              alt="Preview"
                              className=" w-full "
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {field.type === 'checkboxes' && (
                      <div className="space-y-2">
                        {field.options?.length ? (
                          field.options.map((option) => (
                            <label key={option} className="flex items-center gap-2 text-sm text-foreground">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={Array.isArray(personalizareValues[field.name]) ? personalizareValues[field.name].includes(option) : false}
                                onChange={(event) => {
                                  setPersonalizareValues((prev) => {
                                    const current = Array.isArray(prev[field.name]) ? prev[field.name] : [];
                                    const next = event.target.checked
                                      ? [...current, option]
                                      : current.filter((item) => item !== option);
                                    return { ...prev, [field.name]: next };
                                  });
                                }}
                              />
                              <span>{option}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">Nu exista optiuni.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>


          {SHOW_PROMO_BANNER && <PromoBanner />}

          {personalizareFields.length > 0 && (
            <div className="-mt-2 rounded-t-2xl border border-b-0 border-[#d69149] bg-white px-2 py-2">
              <div className="grid grid-cols-[30%_70%] items-center">
                <div className="flex items-center justify-center ">
                  <img src="/design.png" alt="Design" className="h-14 w-auto" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Produsul poate fi adaptat pentru orice ocazie!</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Scrie in campul de observatii ce iti doresti, iar detaliile le stabilim telefonic!
                  </p>
                </div>
              </div>
            </div>
          )}

              <div className="flex gap-2">
                  <button
                      type="button"
                      onClick={handleAddOrOpenPersonalizare}
                      data-track-action={showPersonalizare || personalizareFields.length === 0 ? 'A adaugat produsul in cos.' : 'A deschis personalizarea produsului.'}
                      className="gold-gradient flex-1 rounded-b-2xl py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                      {showPersonalizare || personalizareFields.length === 0 ? 'Adauga in cos' : (
                        <span className="flex items-center justify-center gap-2">
                          Incepe personalizarea
                          <ArrowRight className="h-4 w-4 text-white" />
                        </span>
                      )}
                    </button>
                </div>
            </div>





      <section className="relative isolate mt-6">
        <span
          aria-hidden="true"
          className="pointer-events-none text-[#473420] absolute inset-y-0 left-[calc(50%-50vw)] right-[calc(50%-50vw)] -z-10 bg-[#fff3e8]"
        />
        <div className="space-y-2 px-4 py-4">
            <div className="rounded-md">
                <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md py-2"
                    id="btn-detalii"
                    aria-expanded={openSection === 'detalii'}
                    aria-controls="panel-detalii"
                    onClick={() => setOpenSection(openSection === 'detalii' ? null : 'detalii')}
                    data-track-action="A deschis detaliile produsului."
                >
                    <span className="text-lg font-semibold text-[#5e4b37]">Detalii produs</span>
                    <div className="rounded-full p-1 transition-all">
                        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${openSection === 'detalii' ? 'rotate-180' : ''}`} />
                    </div>
                </button>
                <div
                    id="panel-detalii"
                    role="region"
                    aria-labelledby="btn-detalii"
                    style={{
                        maxHeight: openSection === 'detalii' ? '1200px' : '0',
                        opacity: openSection === 'detalii' ? 1 : 0,
                        transition: 'max-height 0.35s, opacity 0.25s',
                        overflow: 'hidden',
                    }}
                >
                    <div className="py-2 text-sm">
                        {orderedAttributes.length > 0 ? (
                            <div className="overflow-hidden rounded-lg bg-white">
                                {orderedAttributes.map((attr) => (
                                    <div key={attr.slug} className="flex border-[#e6c5ae] border-b border-border last:border-b-0">
                                        <div className="w-1/3 bg-[#fcddc8] px-3 py-2 text-xs font-medium text-foreground">
                                            {attr.name}
                                        </div>
                                        <div className="w-2/3 px-3 py-2 text-xs text-muted-foreground">
                                            {attr.options.join(', ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Detalii indisponibile momentan.</p>
                        )}
                    </div>
                </div>
            </div>

            <hr className="border-t border-[#f5e3d2]" />
          {isLedProduct && (
            <>
              <div className="rounded-md">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md py-2"
                  id="btn-led"
                  aria-expanded={openSection === 'led'}
                  aria-controls="panel-led"
                  onClick={() => setOpenSection(openSection === 'led' ? null : 'led')}
                  data-track-action="A deschis informatii baza led."
                >
                  <span className="text-lg font-semibold text-[#5e4b37]">Informatii baza led</span>
                  <div className="rounded-full p-1 transition-all">
                    <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${openSection === 'led' ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <div
                  id="panel-led"
                  role="region"
                  aria-labelledby="btn-led"
                  style={{
                    maxHeight: openSection === 'led' ? '800px' : '0',
                    opacity: openSection === 'led' ? 1 : 0,
                    transition: 'max-height 0.35s, opacity 0.25s',
                    overflow: 'hidden',
                  }}
                >
                  <div className="py-2">
                    <img
                      src="/baza-neagra-01-01.svg"
                      alt="Informatii baza led"
                      className="w-full rounded-lg border border-border object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
              <hr className="border-t border-[#e6e6e6]" />
            </>
          )}

          {isMusicProduct && (
            <>
              <div className="rounded-md">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md py-2"
                  id="btn-boxa"
                  aria-expanded={openSection === 'boxa'}
                  aria-controls="panel-boxa"
                  onClick={() => setOpenSection(openSection === 'boxa' ? null : 'boxa')}
                  data-track-action="A deschis informatii boxa."
                >
                  <span className="text-lg font-semibold text-[#5e4b37]">Informatii boxa</span>
                  <div className="rounded-full p-1 transition-all">
                    <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${openSection === 'boxa' ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <div
                  id="panel-boxa"
                  role="region"
                  aria-labelledby="btn-boxa"
                  style={{
                    maxHeight: openSection === 'boxa' ? '800px' : '0',
                    opacity: openSection === 'boxa' ? 1 : 0,
                    transition: 'max-height 0.35s, opacity 0.25s',
                    overflow: 'hidden',
                  }}
                >
                  <div className="py-2">
                    <img
                      src="/template-boxa-previzualizare-1.jpg"
                      alt="Informatii boxa"
                      className="w-full rounded-lg border border-border object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
              <hr className="border-t border-[#e6e6e6]" />
            </>
          )}

          <div className="rounded-md">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md py-2"
              id="btn-descriere"
              aria-expanded={openSection === 'descriere'}
              aria-controls="panel-descriere"
              onClick={() => setOpenSection(openSection === 'descriere' ? null : 'descriere')}
              data-track-action="A deschis descrierea produsului."
            >
              <span className="text-lg font-semibold text-[#5e4b37]">Descriere</span>
              <div className="rounded-full p-1 transition-all">
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${openSection === 'descriere' ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <div
              id="panel-descriere"
              role="region"
              aria-labelledby="btn-descriere"
              style={{
                maxHeight: openSection === 'descriere' ? '1200px' : '0',
                opacity: openSection === 'descriere' ? 1 : 0,
                transition: 'max-height 0.35s, opacity 0.25s',
                overflow: 'hidden',
              }}
            >
              <div className="py-2 text-sm text-muted-foreground prose max-w-none">
                {data.descriere ? (
                  <div dangerouslySetInnerHTML={{ __html: data.descriere }} />
                ) : (
                  <p>Descriere indisponibila momentan.</p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-t border-[#f5e3d2]" />

          <div className="rounded-md">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md py-2"
              id="btn-simulare"
              aria-expanded={openSection === 'simulare'}
              aria-controls="panel-simulare"
              onClick={() => setOpenSection(openSection === 'simulare' ? null : 'simulare')}
              data-track-action="A deschis simularea grafica."
            >
              <span className="text-lg font-semibold text-[#5e4b37]">Simulare Grafica</span>
              <div className="rounded-full p-1 transition-all">
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${openSection === 'simulare' ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <div
              id="panel-simulare"
              role="region"
              aria-labelledby="btn-simulare"
              style={{
                maxHeight: openSection === 'simulare' ? '1000px' : '0',
                opacity: openSection === 'simulare' ? 1 : 0,
                transition: 'max-height 0.35s, opacity 0.25s',
                overflow: 'hidden',
              }}
            >
              <div className="py-2">
                <img
                  src="https://darurialese.ro/wp-content/themes/woodmart-child/img/simulare_grafica-01.png"
                  alt="Simulare grafica"
                    className="w-full rounded-lg border border-border border-[#f5e3d2] object-contain"
                    loading="lazy"
                  />
              </div>
            </div>
          </div>

          <hr className="border-t border-[#f5e3d2]" />



          <div className="rounded-md">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md py-2"
              id="btn-livrare"
              aria-expanded={openSection === 'livrare'}
              aria-controls="panel-livrare"
              onClick={() => setOpenSection(openSection === 'livrare' ? null : 'livrare')}
              data-track-action="A deschis informatii livrare si retur."
            >
              <span className="text-lg font-semibold text-[#5e4b37]">Livrare & Retur</span>
              <div className="rounded-full p-1 transition-all">
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${openSection === 'livrare' ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <div
              id="panel-livrare"
              role="region"
              aria-labelledby="btn-livrare"
              style={{
                maxHeight: openSection === 'livrare' ? '1200px' : '0',
                opacity: openSection === 'livrare' ? 1 : 0,
                transition: 'max-height 0.35s, opacity 0.25s',
                overflow: 'hidden',
              }}
            >
              <div className="py-2 text-sm text-muted-foreground space-y-2">
                <p>Livrare rapida 1-3 zile lucratoare oriunde in Romania.</p>
                <p>Pentru suport, ne poti contacta telefonic sau pe WhatsApp.</p>
                <img
                  src="https://darurialese.ro/wp-content/themes/woodmart-child/img/popup_expediere.svg"
                  alt="Livrare si retur"
                  className="h-auto w-full rounded-lg border border-border border-[#f5e3d2] "
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
          <span className="font-bold mb-2 w-full justify-center flex font-serif text-xl mt-4">Beneficii incluse</span>
          <div className="bg-card shadow-md m-4 mb-0 rounded-t-2xl ">
              <div className="rounded-t-lg  px-4 py-2 text-sm md:text-base shadow-card grid grid-cols-2  border-b-0 gap-4 border-[#ded0c3] border">
            <span className="flex items-center font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" data-name="Layer 2" viewBox="0 0 202.63 222.09"
                     className="mr-2 h-6 w-6 md:h-8 md:w-8"><g data-name="Layer 1"><path
                    d="m142.24 89.83-40.68 132.26L60.39 89.83zM51.66 89.83 90.33 213.6.5 89.83zM202.14 89.83l-27.2 37.42-6.49-10.97c-3.67 4.88-5.62 11.19-9.72 15.73-4.42 4.89-11.66 7.17-16.98 10.97 2.41 1.78 13.69 6.79 14.75 8.73.21.38.31.71.14 1.13L112.3 213.6l38.68-123.77zM78.86 41.91 52.65 82.34H0l26.2-40.43zM202.63 82.34h-52.65l-26.2-40.43h52.65zM140.75 82.34H61.89L87.6 42.42l1.46-.54 25.73.29z"></path><path
                    d="M179.67 143.22c-4.76 1.83-8.23 6.48-11.23 10.48-3.14-4.2-6.52-8.21-11.23-10.72 4.53-2.9 8.28-6.73 11.23-11.22 2.75 4.98 6.79 8.14 11.23 11.46M69.87 10.48l-.31 1.02c-4.77 2.11-7.76 6.54-10.92 10.44-2.78-4.2-6-8.41-10.73-10.48l.31-1.03C52.76 8.11 55.93 4.17 58.64 0c3.2 3.89 6.34 8.7 11.23 10.48"></path></g></svg>Materiale premium</span>
                  <span className="flex items-center font-bold"><svg xmlns="http://www.w3.org/2000/svg"
                                                                     data-name="Layer 2" viewBox="0 0 345.58 435.16"
                                                                     className="mr-2 h-6 w-6 md:h-8 md:w-8"><g
                      data-name="Layer 2"><path
                      d="M169.55.2c4.33-.7 7.71.53 11.77 1.74 49.56 14.77 100.27 42.85 150.18 58.44 7.21 2.52 12.29 8.21 13.04 15.9-2.67 50.59 3.41 104.55-.06 154.74-5.17 74.9-73.3 141.68-131.44 181.97-8.24 5.71-30.84 21.97-39.79 22.17-3.38.07-8.66-1.73-11.76-3.2-9.7-4.6-25.69-16.37-34.93-22.96C71.46 369.7 5.89 303.66 1.07 232.06c-3.41-50.54 2.67-104.84 0-155.78.13-6.68 4.46-12.03 10.34-14.61zm2.02 23.91L24.56 81.81l-.54 147.27c7.78 70.83 66.01 126.38 121.52 164.95 3.83 2.66 25.05 17.41 27.7 17.18 38.43-23.6 76.69-52.32 105.36-87.39 20.33-24.88 40.52-60.1 42.94-92.81 3.51-47.42-2.64-98.91.07-146.76l-1.04-2.95c-45.35-17.04-89.98-36.57-135.52-53.13-3.57-1.3-10.14-4.45-13.46-4.06Z"></path><path
                      d="m172.47 33.14 139.6 54.64.54 2.46c-2.57 45.24 3.26 93.94-.07 138.77-5.38 72.55-82.54 136.66-140.06 172.02C111.14 361.06 43.94 307.33 33.07 230l.46-142.23 138.94-54.64Zm77.92 90.82c-2.15.44-5.91 2.83-7.74 4.24L137.36 228.51l-34.05-42.79C85.73 171 62.79 190.47 75.53 210.5s33.23 38.56 46.31 58.49c15.78 13.18 26.5.58 37.98-10 36.99-34.11 72.11-70.38 109.2-104.4 11.83-14.59 0-34.46-18.65-30.63Z"></path></g></svg>Simulare grafica</span><span
                  className="flex items-center font-bold"><svg xmlns="http://www.w3.org/2000/svg" data-name="Layer 2"
                                                               viewBox="0 0 215.85 224.11"
                                                               className="mr-2 h-6 w-6 md:h-8 md:w-8"><g
                  data-name="Layer 1"><path
                  d="M78.47 43.94v46.17c0 .15.45.85.52 1.48.71 6.76 2.23 12.23 7.2 17.26 2.95 2.98 11.37 7.97 15.49 7.97h50.16v34.19c0 11.33-12.88 23.81-24.19 24.22l-58.15.24-47.92 47.91-1.5.75v-49.91C7.87 170.68 1.38 160.35.6 148.04c-1.7-26.56.81-55.56.65-82.24.93-9.56 12.94-21.84 22.58-21.84h54.65Z"></path><path
                  d="M195.75 102.33v28.45l-28.8-28.35-62.28-.11c-5.8-.59-10.98-5.28-11.25-11.21l.36-82.52c1.01-4.16 6.21-8.1 10.39-8.57L203.51 0c7.14.65 11.18 5.83 11.73 12.73 1.96 24.85-1.49 52.25-.03 77.37-.39 4.3-2.7 8.82-6.63 10.84-.43.22-3.4 1.39-3.6 1.39z"></path></g></svg>Suport clienți</span><span
                  className="flex items-center font-bold"><svg xmlns="http://www.w3.org/2000/svg" data-name="Layer 2"
                                                               viewBox="0 0 449.29 433.53"
                                                               className="mr-2 h-6 w-6 md:h-8 md:w-8"><g
                  data-name="Layer 2"><path
                  d="M389.36 104.66v162.72c10.07-7.6 20.62-15.1 32.27-20.14 9.17-3.96 21.38-8.94 26.53 3.76 5.26 12.99-9.15 17.86-16.89 24.85-6.78 6.13-12.72 13.3-19.49 19.46 53.75 109.98-96.56 194.43-162.68 91.99l-43.45 21.83V190l183.7-85.35Zm43.92 152.75c-12.61 3.76-24.31 11.71-34.83 19.56-24.36 18.16-45.82 41.24-65.5 64.27l-15.42-22.44-27.99 7.98 39.88 52.94 2.09-.15c26.05-40.13 54.52-79.15 89.27-112.21zm-110.01 3.28c-79.96 6.62-100.5 115.88-29.8 150.99 70.66 35.08 144.1-41.36 105.88-109.87l-14.51 16.38c17.68 47.37-26.97 95.01-75.34 77.46-18.34-6.65-35.66-26.32-37.84-46.01-6.06-54.55 51.21-87.52 95.1-55.37l14.53-13.55c.38-2.18-9.83-8.55-11.98-9.76-13.32-7.52-30.78-11.53-46.04-10.26ZM184.7 409.14 0 314.8V104.66l184.7 85.36zM273.55 134.63c.51 2.33-.31 1.6-1.28 2.22-1.87 1.21-5.15 2.54-7.34 3.61-23.17 11.37-47.06 21.73-70.67 32.08L8.99 85.71l85.1-38.76zM380.37 85.71l-85.12 39.75L117.1 38.01l-1.29-2.22L192.67.27l3.26-.27z"></path></g></svg>Asigurare colet</span>
              </div>
          </div>


          <div className="mx-4  overflow-hidden rounded-b-2xl border border-[#dfb695] bg-gradient-to-r from-[#fff3e8] to-[#fcddc8] px-4 py-3 shadow-card">
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <div className="rounded-lg bg-[#6e4514] px-3 py-1 text-xs font-semibold text-white">
                          +{rewardPoints} puncte
                      </div>
                      <span className="absolute -bottom-2 left-4 h-0 w-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#6e4514]" />
                  </div>
                  <p className="text-sm text-amber-900">
                      Achiziționează acum acest produs și primești <strong>{rewardPoints}</strong> puncte ce pot fi folosite la următoarea comandă!
                  </p>
              </div>
          </div>

        <div className="mt-2 text-center  font-serif">
          <p className="text-xl font-semibold text-foreground">Scenariu livrare</p>

        </div>


        <div className="mt-3 border border-border bg-[#fff7ef] px-3 py-3">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowOrderDateModal(true)}
              className="w-full text-center rounded-full border border-[#dfb695] bg-white px-3 py-1 text-[13px] font-semibold text-[#5e4b37] shadow-sm"
            >
              Comanda plasata &bull; {formatRoDate(orderDate)} ({orderDateLabel})
            </button>
          </div>

          <div className="relative mt-4 flex items-start text-[11px] font-semibold text-muted-foreground">
            <div className="absolute left-0 right-0 top-[40px] h-[2px] bg-[#dfb695]/70" />

            <div className="flex flex-1 flex-col items-center text-center">
              <span className="mt-1 leading-tight">Confirmare</span>
              <span className="text-[10px] text-[#5e4b37] leading-tight">telefonica</span>
              <div className="relative z-10 mt-1">
                <div className="h-2 w-2 rounded-full bg-[#e45757]" />
              </div>
              <span className="mt-2 text-[10px] text-[#5e4b37] leading-tight">{formatRoDate(orderDate)}</span>
            </div>

            {weekendBetweenOrderAndProduction && (
              <div className="absolute left-1/3 top-[32px] -translate-x-1/2 text-[9px] font-semibold">
                <div className="rounded-full bg-[#e45757] px-2 py-[2px] text-white shadow-sm">Liber</div>
              </div>
            )}

            <div className="flex flex-1 flex-col items-center text-center">
              <span className="mt-1 leading-tight">Productie</span>
              <span className="text-[10px] text-[#5e4b37] leading-tight">Legatorie</span>
              <div className="relative z-10 mt-1">
                <div className="h-2 w-2 rounded-full bg-[#8b5a2b]" />
              </div>
              <span className="mt-2 text-[10px] text-[#5e4b37] leading-tight">{formatRoDate(productionDate)}</span>
            </div>

            {weekendBetweenProductionAndDelivery && (
              <div className="absolute left-2/3 top-[32px] -translate-x-1/2 text-[9px] font-semibold">
                <div className="rounded-full bg-[#e45757] px-2 py-[2px] text-white shadow-sm">Liber</div>
              </div>
            )}

            <div className="flex flex-1 flex-col items-center text-center">
              <span className="mt-1 leading-tight">Livrare estimata la adresa</span>

              <div className="relative z-10 mt-1">
                <div className="h-2 w-2 rounded-full bg-[#2e9e5b]" />
              </div>
              <span className="mt-2 text-[10px] text-[#5e4b37] leading-tight text-center">
                <span className="font-semibold text-[#2e9e5b]">24h: {formatRoDate(deliveryStart)}</span>
                <br />
                <span className="font-semibold text-[#e45757]">48h: {formatRoDate(deliveryEnd)}</span>
              </span>
            </div>
          </div>
        </div>

        {showOrderDateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-4 shadow-lg">
              <p className="text-base font-semibold text-foreground">Alege data comenzii</p>
              <input
                type="date"
                className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={orderDate.toISOString().slice(0, 10)}
                onChange={(e) => {
                  const value = e.target.value;
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
                  Inchide
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[#6e4514] px-3 py-1 text-sm font-semibold text-white"
                  onClick={() => setShowOrderDateModal(false)}
                >
                  Aplica
                </button>
              </div>
            </div>
          </div>
        )}


        {data.recenzii.length > 0 && (
        <div className="mt-6 px-4">
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="text-center">
              <p className="text-lg font-semibold font-serif text-foreground">Recenzii de la clienti ({data.recenzii.length})</p>


              <p className="mt-1 text-sm font-semibold text-foreground">{averageRating.toFixed(2)} / 5</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, starIndex) => {
                  const diff = averageRating - starIndex;
                  if (diff >= 1) {
                    return (
                      <svg key={starIndex} viewBox="0 0 24 24" className="h-4 w-4 text-amber-500" fill="currentColor">
                        <path d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z" />
                      </svg>
                    );
                  }
                  if (diff >= 0.25) {
                    return (
                      <span key={starIndex} className="relative inline-block h-4 w-4">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="currentColor">
                          <path d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z" />
                        </svg>
                        <span className="absolute left-0 top-0 h-4 w-2 overflow-hidden">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-500" fill="currentColor">
                            <path d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z" />
                          </svg>
                        </span>
                      </span>
                    );
                  }
                  return (
                    <svg key={starIndex} viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="currentColor">
                      <path d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z" />
                    </svg>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Bazat pe {data.recenzii.length} recenzii - {imageReviewCount} cu imagini
              </p>
            </div>

            <div id="review-write-card" className="mt-4 rounded-xl border border-[#e9e6e3] bg-[#f9f6f2] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Scrie parerea ta si primesti 20 puncte!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Impartaseste experienta ta cu produsul.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewForm((prev) => !prev)}
                  data-track-action="A deschis formularul de recenzie."
                  className="rounded-full border border-[#6e4514] px-3 py-1 text-xs font-semibold text-[#6e4514]"
                >
                  {showReviewForm ? 'Inchide' : 'Scrie'}
                </button>
              </div>

              {showReviewForm && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Nume"
                    className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  />
                  <textarea
                    placeholder="Mesajul tau"
                    className="min-h-[110px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    data-track-action="A trimis o recenzie."
                    className="w-full rounded-full py-2 text-xs font-semibold text-white"
                    style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
                  >
                    Trimite parerea
                  </button>
                </div>
              )}
            </div>

            
            {(() => {
              const orderedReviews = [...data.recenzii].sort(
                (a, b) => (b.imagini?.length ? 1 : 0) - (a.imagini?.length ? 1 : 0)
              );
              const reviewsPerPage = 15;
              const totalPages = Math.max(1, Math.ceil(orderedReviews.length / reviewsPerPage));
              const clampedPage = Math.min(reviewPage, totalPages);
              const startIndex = (clampedPage - 1) * reviewsPerPage;
              const pageReviews = orderedReviews.slice(startIndex, startIndex + reviewsPerPage);
              const pages = [] as Array<number | 'ellipsis'>;
              if (totalPages > 0) {
                pages.push(1);
                const startPage = Math.max(2, clampedPage - 1);
                const endPage = Math.min(totalPages - 1, clampedPage + 1);
                if (startPage > 2) pages.push('ellipsis');
                for (let p = startPage; p <= endPage; p += 1) {
                  pages.push(p);
                }
                if (endPage < totalPages - 1) pages.push('ellipsis');
                if (totalPages > 1) pages.push(totalPages);
              }

              const formatDate = (value: string) => {
                const [datePart] = value.split(' ');
                const [year, month, day] = datePart.split('-');
                if (!year || !month || !day) return value;
                const date = new Date(Number(year), Number(month) - 1, Number(day));
                return date.toLocaleDateString('ro-RO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
              };

              return (
                <>
                  <div className="mt-4 space-y-3" id="review-list">
                    {pageReviews.map((review, index) => {
                      const rating = Math.round(Number(review.rating));
                      const hasImage = (review.imagini?.length || 0) > 0;
                      const imageUrl = hasImage
                        ? review.imagini?.[0]?.full || review.imagini?.[0]?.thumbnail
                        : '';
                      return (
                        <div
                          key={`${review.autor}-${index}`}
                          className="w-full overflow-hidden   bg-white shadow-card md:transition md:duration-200 md:hover:-translate-y-0.5 md:hover:shadow-lg"
                        >
                          {hasImage ? (
                            <div className="relative aspect-[16/8] lg:aspect-[16/9]">
                              <div className="absolute inset-0 grid grid-cols-6">
                                <div className="relative col-span-3 overflow-hidden px-1 py-3 pr-4">
                                  <div className="h-full overflow-y-auto pr-1 no-scrollbar">
                                    <div className="flex min-h-full flex-col">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-sm font-semibold" title={review.autor}>
                                          {review.autor}
                                        </p>
                                      </div>
                                      <div className="mt-2 flex items-center gap-[2px]">
                                        {[...Array(5)].map((_, starIndex) => (
                                          <svg
                                            key={starIndex}
                                            viewBox="0 0 24 24"
                                            className={`h-3 w-3 ${starIndex < rating ? 'text-amber-500' : 'text-muted-foreground'}`}
                                            fill="currentColor"
                                            aria-hidden="true"
                                          >
                                            <path d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z" />
                                          </svg>
                                        ))}
                                      </div>

                                      <p className="mt-2 whitespace-pre-line text-xs leading-snug text-muted-foreground">
                                        {review.continut}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-6 bg-gradient-to-b from-white to-transparent opacity-0" />
                                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-6 bg-gradient-to-t from-white to-transparent opacity-0" />
                                </div>
                                <div className="col-span-3">
                                  <button
                                    type="button"
                                    className="relative h-full w-full overflow-hidden"
                                    aria-label="Deschide imagine din recenzie"
                                    onClick={() => {
                                      if (imageUrl) {
                                        const index = photoItems.findIndex((item) => item.url === imageUrl);
                                        setZoomReviewIndex(index >= 0 ? index : 0);
                                      }
                                    }}
                                    data-track-action="A deschis poza din recenzie."
                                  >
                                      <img
                                        alt="imagine din recenzie"
                                        loading="lazy"
                                        className="h-full w-full object-cover object-center"
                                        src={imageUrl}
                                      />
                                    <span className="absolute bottom-2 right-2 z-10 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground backdrop-blur">
                                      {formatDate(review.data)}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="px-4 py-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-base font-semibold text-foreground" title={review.autor}>
                                  {review.autor}
                                </p>
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                  {formatDate(review.data)}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-[3px]">
                                {[...Array(5)].map((_, starIndex) => (
                                  <svg
                                    key={starIndex}
                                    viewBox="0 0 24 24"
                                    className={`h-4 w-4 ${starIndex < rating ? 'text-amber-500' : 'text-muted-foreground'}`}
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z" />
                                  </svg>
                                ))}
                              </div>
                              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                                {review.continut}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewPage((prev) => Math.max(prev - 1, 1));
                          setShouldScrollToReviews(true);
                        }}
                        data-track-action="A navigat la pagina anterioara de recenzii."
                        className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground disabled:opacity-40"
                        disabled={clampedPage == 1}
                        aria-label="Pagina anterioara"
                      >
                        &lt;
                      </button>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {pages.map((page, index) =>
                          page === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="text-xs text-muted-foreground">
                              ...
                            </span>
                          ) : (
                            <button
                              key={`page-${page}`}
                              type="button"
                              onClick={() => {
                                setReviewPage(page);
                                setShouldScrollToReviews(true);
                              }}
                              data-track-action={`A navigat la pagina ${page} de recenzii.`}
                              className={`h-7 w-7 rounded-full text-xs font-semibold ${
                                page === clampedPage ? 'bg-primary text-white' : 'bg-muted text-foreground'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewPage((prev) => Math.min(prev + 1, totalPages));
                          setShouldScrollToReviews(true);
                        }}
                        data-track-action="A navigat la pagina urmatoare de recenzii."
                        className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground disabled:opacity-40"
                        disabled={clampedPage == totalPages}
                        aria-label="Pagina urmatoare"
                      >
                        &gt;
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {data.categorii?.length > 0 && (
        <div className="mt-6 pl-4" id="product-categories">
          <p className="text-xl font-serif text-foreground">E posibil sa te intereseze</p>
          <div className="mt-2 space-y-5">
            {data.categorii.map((category, index) => (
              <div
                key={category.id}
                className="space-y-3"
                data-category-id={category.id}
                ref={(node) => {
                  categorySectionRefs.current.set(category.id, node);
                }}
              >
                <button
                  type="button"
                  onClick={() => goToCategory(category.slug)}
                  data-track-action={`A deschis categoria ${category.titlu} din pagina produs.`}
                  className={`relative flex min-h-[64px] w-full items-center justify-between font-serif overflow-hidden rounded-l-2xl px-4 py-3 text-left ${
                    index === 0
                      ? 'border border-transparent bg-gradient-to-r from-[#c89b59] to-[#f5d5a8]'
                      : 'border-1 border-[#f1f1f1]  border bg-white'
                  }`}
                >
                  <span className={`relative z-10 text-xl font-semibold ${index === 0 ? 'text-white' : 'text-foreground'}`}>
                    {category.titlu}
                  </span>
                  <span className="relative z-10 flex items-center gap-2 text-xs font-semibold">
                    {typeof category.nr_produse === 'number' && (
                      <span className={index === 0 ? 'text-white/90' : 'text-muted-foreground'}>
                        {category.nr_produse}
                      </span>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 rotate-[-90deg] ${index === 0 ? 'text-white' : 'text-muted-foreground'}`}
                    />
                  </span>
                  <img
                    src={category.imagine}
                    alt={category.titlu}
                    className="absolute right-12 top-1/2 h-24 w-24 -translate-y-1/2 object-contain opacity-10"
                    loading="lazy"
                  />
                </button>

                {category.produse?.length > 0 && (
                  <div className="relative">
                    <div
                      className="flex gap-3 overflow-x-auto pb-2 pr-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                      ref={(node) => {
                        categorySliderRefs.current.set(category.id, node);
                      }}
                      onScroll={(event) => {
                        const container = event.currentTarget;
                        const firstChild = container.firstElementChild as HTMLElement | null;
                        const cardWidth = firstChild?.getBoundingClientRect().width || 0;
                        const gap = 12;
                        const step = cardWidth + gap;
                        if (!step) return;
                        const index = Math.max(0, Math.floor(container.scrollLeft / step));
                        prefetchByIndex(category.produse, index, 3);
                      }}
                    >
                      {category.produse.map((produs) => {
                        const price = parseFloat(produs.pret);
                        const reduced = produs.pret_redus ? parseFloat(produs.pret_redus) : null;
                        const hasDiscount = typeof reduced === 'number' && reduced !== price;
                        const original = hasDiscount ? Math.max(price, reduced as number) : price;
                        const current = hasDiscount ? Math.min(price, reduced as number) : price;
                        const discountPercent = hasDiscount
                          ? Math.max(1, Math.round(((original - current) / original) * 100))
                          : 0;

                        return (
                        <button
                          key={produs.id}
                          type="button"
                          onClick={() => navigate(`/produs/${produs.slug}`)}
                          data-track-action={`A deschis produsul ${produs.titlu} din carusel categorie.`}
                          className="w-[46%] shrink-0 snap-start rounded-2xl border border-border bg-white text-left shadow-sm"
                        >
                          <div className="relative aspect-[4/5] overflow-hidden rounded-t-2xl bg-muted">
                            {hasDiscount && (
                              <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                -{discountPercent}%
                              </span>
                            )}
                            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                              <span className="text-amber-500">★</span>
                              <span>{Number(produs.average_recenzii || 0).toFixed(1)}</span>
                              <span>({produs.nr_recenzii || 0})</span>
                            </div>
                            {(() => {
                              const productDimensions = formatDimensions(produs.dimensiune, '');
                              if (!productDimensions) return null;
                              return (
                              <span className="absolute bottom-2 right-2 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                                {productDimensions}
                              </span>
                              );
                            })()}
                            <img
                              src={produs.imagine_principala?.['300x300'] || produs.imagine_principala?.full}
                              alt={produs.titlu}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="px-3 pb-3 pt-3">
                            <p className="line-clamp-2 text-sm font-serif text-foreground">{produs.titlu}</p>
                          </div>
                        </button>
                      );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
          showQuickNav ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <div className="relative flex w-full items-center justify-between gap-1 border-t border-[#e6dfd8] bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('product-photo');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              data-track-action="A navigat rapid la foto produs."
              className="flex flex-col items-center text-[9px] font-semibold text-[#6e4514]"
            >
              <ImageIcon className="h-4 w-4" />
              Foto
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenSection('detalii');
                const el = document.getElementById('btn-detalii');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              data-track-action="A navigat rapid la detalii produs."
              className="flex flex-col items-center text-[9px] font-semibold text-[#6e4514]"
            >
              <ListChecks className="h-4 w-4" />
              Detalii
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenSection('descriere');
                const el = document.getElementById('btn-descriere');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              data-track-action="A navigat rapid la descriere produs."
              className="flex flex-col items-center text-[9px] font-semibold text-[#6e4514]"
            >
              <FileText className="h-4 w-4" />
              Descriere
            </button>
            {data.recenzii.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('review-write-card');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                data-track-action="A navigat rapid la recenzii."
                className="flex flex-col items-center text-[9px] font-semibold text-[#6e4514]"
              >
                <MessageCircle className="h-4 w-4" />
                Recenzii
              </button>
            )}
            {data.categorii?.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('product-categories');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                data-track-action="A navigat rapid la categorii recomandate."
                className="flex flex-col items-center text-[9px] font-semibold text-[#6e4514]"
              >
                <Layers className="h-4 w-4" />
                Categorii
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddOrOpenPersonalizare}
            data-track-action={showPersonalizare || personalizareFields.length === 0 ? 'A adaugat produsul in cos din quick nav.' : 'A deschis personalizarea din quick nav.'}
            className="absolute bottom-2 right-3 flex flex-col items-center gap-1"
            aria-label={showPersonalizare || personalizareFields.length === 0 ? 'Adauga in cos' : 'Personalizeaza'}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full gold-gradient text-white shadow-md">
              <ShoppingCart className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-foreground">{discountedPrice.toFixed(2)} lei</span>
          </button>
        </div>
      </div>

      {zoomReviewIndex !== null && photoItems[zoomReviewIndex] && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setZoomReviewIndex(null)}
            data-track-action="A inchis poza recenzie."
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
              <button
                type="button"
                onClick={() => setZoomReviewIndex(null)}
                data-track-action="A inchis poza recenzie."
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-foreground shadow"
                aria-label="Inchide"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => setZoomReviewIndex((prev) => (prev !== null ? Math.max(prev - 1, 0) : prev))}
                data-track-action="A navigat la poza anterioara din recenzii."
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-foreground shadow"
                disabled={zoomReviewIndex <= 0}
                aria-label="Imagine anterioara"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoomReviewIndex((prev) =>
                    prev !== null ? Math.min(prev + 1, photoItems.length - 1) : prev
                  )
                }
                data-track-action="A navigat la poza urmatoare din recenzii."
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-foreground shadow"
                disabled={zoomReviewIndex >= photoItems.length - 1}
                aria-label="Imagine urmatoare"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="relative max-h-[90vh] w-full overflow-hidden rounded-2xl bg-black"
                onClick={() => setZoomReviewIndex(null)}
                data-track-action="A inchis poza recenzie."
              >
                <img
                  src={photoItems[zoomReviewIndex].url}
                  alt="Imagine recenzie"
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2 text-xs font-semibold text-white">
                  {photoItems[zoomReviewIndex].author}
                </div>
              </button>
            </div>
          </div>
        </>
      )}


          <MobileCategorySheet isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)}/>
          <MobileSearchSheet isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}/>
          {showCartConfirm && (
              <>
                  <div
                      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
                      onClick={() => setShowCartConfirm(false)}
                      data-track-action="A inchis confirmarea adaugarii in cos."
                  />
                  <div
                      className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-4rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl animate-fade-in">
                      <button
                          type="button"
                          onClick={() => setShowCartConfirm(false)}
                          data-track-action="A inchis confirmarea adaugarii in cos."
                          className="absolute right-3 top-3 rounded-full border border-border bg-white p-1.5 text-muted-foreground shadow-sm"
                          aria-label="Inchide"
                      >
                          <X className="h-4 w-4" />
                      </button>
                      <h3 className="text-xl font-semibold font-serif text-center text-foreground">
                          Adaugat cu succes!
                      </h3>
                      <img
                          src="/added.jpg"
                          alt="Produs adaugat in cos"
                          className="mt-3  w-40 m-auto rounded-xl"
                          loading="lazy"
                      />
                      <div className="mt-4 flex w-full justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                setShowCartConfirm(false);
                                navigate('/cos');
                                window.setTimeout(() => {
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }, 50);
                            }}
                            data-track-action="A mers la cos dupa adaugare."
                            className="flex min-w-[180px] items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm"
                        >
                            Mergi la Cos
                            <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                        </button>
                      </div>

                      <p className="mt-4 text-center text-xl font-semibold text-foreground font-serif">
                          Vrei sa continui cumparaturile?
                      </p>

                      {data.categorii?.length > 0 && (
                          <div className="mt-4">
                              <div className="mt-2 space-y-2">
                                  {(showAllConfirmCategories ? data.categorii : data.categorii.slice(0, 3)).map((category) => (
                                      <button
                                          key={category.id}
                                          type="button"
                                          onClick={() => {
                                              setShowCartConfirm(false);
                                              goToCategory(category.slug);
                                          }}
                                          data-track-action={`A mers la categoria ${category.titlu} din confirmarea cosului.`}
                                          className="relative flex w-full items-center gap-3 rounded-xl border border-[#dfb695] bg-gradient-to-r from-[#fff3e8] to-[#fcddc8] px-3 py-1.5 text-left text-xs font-semibold text-[#5e4b37] shadow-card"
                                      >
                                          <span className="w-full text-center">{category.titlu}</span>
                                          <img
                                               src={category.imagine}
                                               alt={category.titlu}
                                               className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 object-contain opacity-20"
                                               loading="lazy"
                                          />
                                      </button>
                                  ))}
                              </div>
                              {data.categorii.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllConfirmCategories((prev) => !prev)}
                                  data-track-action="A afisat mai multe categorii in confirmarea cosului."
                                  className="mt-2 w-full text-center text-xs font-semibold text-primary"
                                >
                                  {showAllConfirmCategories ? 'Vezi mai putine' : 'Vezi altele'}
                                </button>
                              )}
                          </div>
                      )}
                  </div>
              </>
          )}
      </div>
  );
};

export default ProductPage;
