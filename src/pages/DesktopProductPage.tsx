import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Heart, Info, Plus, Search, Star, X } from 'lucide-react';
import DesktopSidebar from '@/components/desktop/DesktopSidebar';
import DesktopTopBar from '@/components/desktop/DesktopTopBar';
import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { fetchProductDetailsCached, fetchSubcategoriesCached } from '@/services/api';
import { ProductDetailResponse, SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';
import { formatDimensions } from '@/utils/formatDimensions';
import { tiktokViewContent } from '@/utils/tiktok';
import { fbViewContent } from '@/utils/facebook';
import { getLocale, LocaleCode, setLocale, stripLocalePrefix, withLocalePath } from '@/utils/locale';
import { t } from '@/utils/translations';

const DesktopProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setCurrentSlug, searchQuery, setSearchQuery } = useCategoryContext();
  const { cart, wishlist, addToCart, addToWishlist, removeFromWishlist } = useShopContext();
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [compareValue, setCompareValue] = useState(50);
  const [showPersonalizare, setShowPersonalizare] = useState(true);
  const [personalizareValues, setPersonalizareValues] = useState<Record<string, string | string[]>>({});
  const [personalizareFiles, setPersonalizareFiles] = useState<Record<string, string>>({});
  const [openSection, setOpenSection] = useState<'personalizare' | 'descriere' | 'detalii'>('descriere');
  const [zoomReviewIndex, setZoomReviewIndex] = useState<number | null>(null);
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [layoutPadding, setLayoutPadding] = useState(60);
  const layoutMaxWidth = 1800;
  const layoutMaxHeight = 1081;
  const locale = getLocale();
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const personalizareRef = useRef<HTMLDivElement | null>(null);
  const getCategoryTitle = (category?: { titlu?: string; title_en?: string }) =>
    locale === 'en' ? category?.title_en ?? category?.titlu ?? '' : category?.titlu ?? '';
  const getProductTitle = (product?: { titlu?: string; title_en?: string }) =>
    locale === 'en' ? product?.title_en ?? product?.titlu ?? '' : product?.titlu ?? '';

  const handleLocaleChange = (nextLocale: LocaleCode) => {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    if (typeof window === 'undefined') return;
    const path = stripLocalePrefix(window.location.pathname);
    const isProductPath = path.startsWith('/produs/') || path.startsWith('/product/');
    let nextPath = withLocalePath(path, nextLocale);
    if (isProductPath && data?.slug) {
      if (nextLocale === 'en') {
        const slugEn = data.slug_en || data.slug;
        nextPath = `/en/product/${slugEn}`;
      } else {
        nextPath = `/produs/${data.slug}`;
      }
    }
    window.location.assign(`${nextPath}${window.location.search}${window.location.hash}`);
  };

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
        const currentLocale = getLocale();
        const viewTitle =
          currentLocale === 'en' ? response.title_en ?? response.titlu ?? '' : response.titlu ?? '';
        tiktokViewContent(String(response.id), viewTitle, priceWithoutVAT, 'RON');
        fbViewContent(String(response.id), viewTitle, priceWithoutVAT, 'RON');
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

  useEffect(() => {
    const updatePadding = () => {
      if (typeof window === 'undefined') return;
      setLayoutPadding(window.innerHeight < 1000 ? 30 : 60);
    };
    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);

  useEffect(() => {
    if (!data) return;
    const defaultTitle = 'Gifts Factory Catalog';
    const localizedTitle = locale === 'en' ? data.title_en ?? data.titlu ?? '' : data.titlu;
    const title = localizedTitle ? `${localizedTitle} | ${defaultTitle}` : defaultTitle;
    document.title = title;

    const rawDescription =
      locale === 'en'
        ? data.descriere_en || data.descriere_scurta || data.descriere || ''
        : data.descriere_scurta || data.descriere || '';
    const cleanDescription = rawDescription
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const description = cleanDescription.length > 0 ? cleanDescription.slice(0, 160) : defaultTitle;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [data]);

  const personalizareFields = useMemo(() => {
    if (!data?.personalizare?.length) return [];
    return data.personalizare.filter((field) => field.enabled !== false);
  }, [data]);

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

  useEffect(() => {
    if (!data?.slug) return;
    setActiveImageIndex(0);
    setShowPersonalizare(false);
    setPersonalizareValues({});
    setPersonalizareFiles({});
  }, [data?.slug]);

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

  const handleAddToCart = () => {
    if (!data) return;
    if (!showPersonalizare && personalizareFields.length > 0) {
      setShowPersonalizare(true);
      setOpenSection('personalizare');
      requestAnimationFrame(() => {
        const block = document.getElementById('personalizare-desktop');
        if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        product: getProductTitle(data) || 'Produs necunoscut',
        productId: data.id ?? null,
        customizations: selections.length ? selections : 'fara personalizari',
      });
    }

    addToCart({
      id: data.id,
      slug: data.slug,
      title: getProductTitle(data),
      image: data.imagine_principala['300x300'] || data.imagine_principala.full,
      price: data.pret,
      priceReduced: data.pret_redus,
      personalizare: personalizarePayload,
    });

    sessionStorage.removeItem(`personalizare:${data.slug}`);
    sessionStorage.removeItem(`personalizare-files:${data.slug}`);
    setPersonalizareValues({});
    setPersonalizareFiles({});
    setShowPersonalizare(false);
  };

  const product = data;
  const productTitle = getProductTitle(product);
  const price = product ? parseFloat(product.pret) : 0;
  const reducedPrice = product?.pret_redus ? parseFloat(product.pret_redus) : null;
  const hasDiscount = typeof reducedPrice === 'number' && reducedPrice !== price;
  const originalPrice = hasDiscount ? Math.max(price, reducedPrice as number) : price;
  const discountedPrice = hasDiscount ? Math.min(price, reducedPrice as number) : price;
  const discountPercent = hasDiscount
    ? Math.max(1, Math.round(((originalPrice - discountedPrice) / originalPrice) * 100))
    : 0;
  const isInWishlist = product ? wishlist.some((item) => item.id === product.id) : false;
  const galleryImages = (() => {
    if (!product) return [];
    const images: string[] = [];
    if (product.imagine_principala?.full) {
      images.push(product.imagine_principala.full);
    } else if (product.imagine_principala?.['300x300']) {
      images.push(product.imagine_principala['300x300']);
    }
    if (Array.isArray(product.galerie)) {
      product.galerie.forEach((item) => {
        if (!item) return;
        if (typeof item === 'string') {
          images.push(item);
        } else if (typeof item === 'object') {
          images.push(item.full || item['300x300'] || item['100x100']);
        }
      });
    }
    return images.filter(Boolean);
  })();

  const attributes = data
    ? data.attributes
        .filter((attr) => attr.visible && attr.name !== 'Debitare nume')
        .map((attr) => ({ label: attr.name, value: attr.options?.join(', ') || '-' }))
    : [];

  const dimensionValue = data ? formatDimensions(data.dimensiune) : '';
  if (dimensionValue) {
    attributes.unshift({ label: 'Dimensiuni', value: dimensionValue });
  }

  const reviewPhotos = (data?.recenzii || [])
    .filter((review) => review.imagini?.length)
    .flatMap((review) =>
      (review.imagini || []).map((img) => ({
        url: img.full || img.thumbnail,
        author: review.autor,
      }))
    );
  const formatReviewDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const sortCategories = (nodes: SubcategoryTreeNode[]) => {
    return [...nodes].sort((a, b) => {
      const countA = a.subcategorii?.length ?? 0;
      const countB = b.subcategorii?.length ?? 0;
      if (countA !== countB) return countA - countB;
      return getCategoryTitle(a).localeCompare(getCategoryTitle(b));
    });
  };

  const renderCategory = (category: SubcategoryTreeNode) => {
    if ((category.nr_produse ?? 0) === 0) {
      return null;
    }
    const title = getCategoryTitle(category);
    const targetSlug = locale === 'en' ? category.slug_en || category.slug : category.slug;
    const hasChildren = category.subcategorii?.length > 0;
    const productLabel =
      (category.nr_produse ?? 0) === 1 ? t('category.product') : t('category.products');

    return (
      <div key={category.id}>
        <button
          className="w-full min-w-0 flex items-center gap-3 p-3 bg-white hover:bg-muted/50 transition-colors"
          data-track-action={`A apasat pe categoria ${title}.`}
          onClick={() => {
            setCurrentSlug(category.slug);
            const targetPath = locale === 'en' ? `/en/category/${targetSlug}` : `/categorie/${targetSlug}`;
            navigate(targetPath);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img
            src={category.imagine}
            alt={title}
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

  const handleTogglePersonalizare = (forceOpen?: boolean) => {
    setOpenSection('personalizare');
    setShowPersonalizare((prev) => {
      const next = forceOpen ?? !prev;
      if (!prev && next) {
        requestAnimationFrame(() => {
          personalizareRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return next;
    });
  };

  return (
      <div
          className="h-screen overflow-hidden"

      >
        <main className="mx-auto h-full w-full flex items-center justify-center gold-gradient">
          <div className=" grid h-[calc(100vh-120px)] px-12 max-w-[1800px]  grid-cols-[15%_65%_20%] gap-0 overflow-hidden ">
          <DesktopSidebar locale={locale} onLocaleChange={handleLocaleChange} />

          <section className="overflow-hidden min-h-full border-r border-border bg-white flex flex-col rounded-l-2xl">
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

            <div className="flex-1 overflow-hidden px-2 pb-0">
              <div className="h-full overflow-hidden pr-2">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Se incarca produsul...
                  </div>
                ) : error || !product ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {error || 'Nu am putut incarca produsul.'}
                  </div>
                ) : (
                  <div className="flex h-full flex-col gap-8 pb-0">
        <div className="grid h-full min-h-0 flex-1 grid-cols-2 gap-8">


          <div className="flex min-h-0 flex-col gap-4">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-3xl border border-border bg-muted pozaRecenzii [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="relative">
                {hasDiscount && (
                  <span className="absolute left-4 top-4 z-20 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                    -{discountPercent}%
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isInWishlist) {
                      removeFromWishlist(product.id);
                    } else {
                      addToWishlist({
                        id: product.id,
                        slug: product.slug,
                        title: productTitle,
                        image: product.imagine_principala['300x300'] || product.imagine_principala.full,
                      });
                    }
                  }}
                  data-track-action={`A apasat pe wishlist pentru ${productTitle}.`}
                  aria-label={isInWishlist ? 'Scoate din wishlist' : 'Adauga in wishlist'}
                  className={`absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border bg-white/90 shadow-sm ${
                    isInWishlist ? 'border-red-300 text-red-600' : 'border-border text-foreground'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                {dimensionValue && (
                  <span className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {dimensionValue}
                  </span>
                )}
                {galleryImages[activeImageIndex] ? (
                  product.clean_image ? (
                    <div className="relative w-full overflow-hidden rounded-br-3xl">
                      <img
                        src={galleryImages[activeImageIndex]}
                        alt={productTitle}
                        className="w-full object-cover"
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0"
                        style={{ clipPath: `inset(0 ${100 - compareValue}% 0 0)` }}
                      >
                        <img
                          src={product.clean_image}
                          alt={productTitle}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div
                        className="pointer-events-none absolute inset-y-0 z-10"
                        style={{ left: `calc(${compareValue}% - 1px)` }}
                      >
                        <div className="h-full w-[2px] bg-white/80 shadow" />
                        <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/90 shadow" />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={compareValue}
                        onChange={(event) => setCompareValue(Number(event.target.value))}
                        aria-label="Before after slider"
                        className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
                      />
                    </div>
                  ) : (
                    <img
                      src={galleryImages[activeImageIndex]}
                      alt={productTitle}
                      className="h-auto w-full object-contain rounded-br-3xl"
                      loading="lazy"
                    />
                  )
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
                    Fara imagine
                  </div>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      data-track-action={`A selectat imaginea ${idx + 1} din produs.`}
                      className={`relative overflow-hidden rounded-2xl border ${
                        activeImageIndex === idx ? 'border-amber-500' : 'border-border'
                      }`}
                    >
                      <img src={img} alt={productTitle} className="h-20 w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {reviewPhotos.map((photo, idx) => (
                <button
                  key={`${photo.url}-${idx}`}
                  type="button"
                  onClick={() => setZoomReviewIndex(idx)}
                  className="relative text-left"
                >
                  <img src={photo.url} alt={`Recenzie ${idx + 1}`} className="h-auto w-full object-contain" />
                </button>
              ))}
            </div>
          </div>

          <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground font-serif">
                {getCategoryTitle(product.categorii?.[0]) || t('product.category')}
              </div>
              <h1 className="mt-2 text-3xl font-semibold text-foreground font-serif">{productTitle}</h1>

              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={`star-${index}`}
                      className={`h-4 w-4 ${index < Math.round(parseFloat(product.average_recenzii || '0')) ? 'fill-amber-500' : ''}`}
                    />
                  ))}
                </div>
                <span>
                  {Number(product.average_recenzii || 0).toFixed(1)} ({product.nr_recenzii} recenzii)
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3 font-serif">
                <span className="text-3xl font-semibold text-amber-700">
                  {discountedPrice.toFixed(2)} lei
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    {originalPrice.toFixed(2)} lei
                  </span>
                )}
              </div>

              {product.descriere_scurta && locale !== 'en' && (
                <ShortDescription content={product.descriere_scurta} locale={locale} />
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3" />
            </div>

            <div className="rounded-2xl  bg-white ">
              <h2 className="text-lg font-semibold text-foreground font-serif">{t('product.details')}</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {attributes.map((attr) => (
                      <tr key={attr.label}>
                        <th className="w-1/2 px-3 py-2 text-left text-xs font-semibold text-muted-foreground font-serif">
                          {attr.label}
                        </th>
                        <td className="px-3 py-2 text-sm font-semibold text-foreground">{attr.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              id="personalizare-desktop"
              ref={personalizareRef}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <button
                type="button"
                onClick={() => {
                  handleTogglePersonalizare();
                }}
                data-track-action="A deschis personalizarea produsului desktop."
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 font-serif">
                    {t('attr.personalization')}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground  font-serif">{t('product.startPersonalization')}</h2>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTogglePersonalizare(true);
                  }}
                  className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  {t('product.customize')}
                </button>
              </button>

              {showPersonalizare && personalizareFields.length > 0 && (
                <div className="mt-5 space-y-4">
                  {personalizareFields
                    .filter((field) => !(field.type === 'checkboxes' && !field.label))
                    .map((field) => (
                      <div key={field.name} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{field.label || 'Optiune'}</span>
                          {field.required && <span className="text-xs font-semibold text-red-500">*</span>}
                        </div>
                        {field.description && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}

                        {field.type === 'textfield' && (
                          <input
                            type="text"
                            placeholder={field.placeholder || ''}
                            value={typeof personalizareValues[field.name] === 'string' ? personalizareValues[field.name] : ''}
                            onChange={(event) =>
                              setPersonalizareValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                            }
                            className="h-11 w-full rounded-xl border border-border px-4 text-sm"
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            placeholder={field.placeholder || ''}
                            maxLength={field.max_chars ? Number(field.max_chars) : undefined}
                            value={typeof personalizareValues[field.name] === 'string' ? personalizareValues[field.name] : ''}
                            onChange={(event) =>
                              setPersonalizareValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                            }
                            className="min-h-[120px] w-full resize-y rounded-xl border border-border px-4 py-3 text-sm"
                          />
                        )}

                        {field.type === 'select' && (
                          <select
                            value={typeof personalizareValues[field.name] === 'string' ? personalizareValues[field.name] : ''}
                            onChange={(event) =>
                              setPersonalizareValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                            }
                            className="h-11 w-full rounded-xl border border-border px-4 text-sm"
                          >
                            <option value="">Selecteaza</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}

                        {field.type === 'upload' && (
                          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-5">
                            <label
                              htmlFor={`upload-${field.name}`}
                              className="flex cursor-pointer flex-col items-center gap-2 text-sm font-semibold text-amber-700"
                            >
                              <Info className="h-6 w-6" />
                              Trage aici poza sau apasa pentru incarcare
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
                              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-white">
                                <img src={personalizareFiles[field.name]} alt="Preview" className="w-full" />
                              </div>
                            )}
                          </div>
                        )}

                        {field.type === 'checkboxes' && (
                          <div className="grid grid-cols-2 gap-2">
                            {field.options?.map((option) => (
                              <label key={option} className="flex items-center gap-2 text-sm text-foreground">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={
                                    Array.isArray(personalizareValues[field.name])
                                      ? personalizareValues[field.name].includes(option)
                                      : false
                                  }
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
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {showPersonalizare && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  data-track-action="A adaugat produsul in cos."
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4" />
                  {t('product.addToCart')}
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-white p-6">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'descriere' ? 'personalizare' : 'descriere')}
                className="flex w-full items-center justify-between"
              >
                <h2 className="text-lg font-semibold text-foreground  font-serif">{t('product.description')}</h2>
                <ArrowRight className={`h-4 w-4 transition-transform ${openSection === 'descriere' ? 'rotate-90' : ''}`} />
              </button>
              {openSection === 'descriere' && (
                <div
                  className="mt-4 text-sm text-muted-foreground prose max-w-none  font-serif"
                  dangerouslySetInnerHTML={{
                    __html: locale === 'en' ? product.descriere_en || product.descriere : product.descriere,
                  }}
                />
              )}
            </div>

            <div className="rounded-2xl border border-border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Informatii rapide
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <Check className="h-4 w-4 text-amber-600" />
                  Productie rapida 2-3 zile
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <Check className="h-4 w-4 text-amber-600" />
                  {t('product.securePayment')}
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <Check className="h-4 w-4 text-amber-600" />
                  {t('product.fastDeliveryLabel')}
                </div>
              </div>
            </div>

            {product.recenzii?.length > 0 && (
              <div className="rounded-2xl border border-border bg-white p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t('product.reviews')}
                  </p>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {product.nr_recenzii} {t('product.reviewsShort') ?? 'recenzii'}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {product.recenzii.map((review, index) => {
                    const rating = Math.round(Number(review.rating));
                    const content = review.continut?.trim() || '';
                    const isLong = content.length > 220;
                    const display = isLong ? `${content.slice(0, 220)}...` : content;
                    const firstImage = review.imagini?.[0]?.full || review.imagini?.[0]?.thumbnail;
                    return (
                      <div
                        key={`${review.autor}-${index}`}
                        className="rounded-xl border border-border bg-white px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{review.autor}</p>
                            <span className="text-[11px] text-muted-foreground">{formatReviewDate(review.data)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(5)].map((_, starIdx) => (
                              <Star
                                key={`review-star-${index}-${starIdx}`}
                                className={`h-3.5 w-3.5 ${starIdx < rating ? 'fill-amber-500' : ''}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 flex items-start gap-3">
                          {display && (
                            <p className="flex-1 text-sm text-muted-foreground leading-snug">{display}</p>
                          )}
                          {firstImage && (
                            <button
                              type="button"
                              onClick={() => {
                                const idx = reviewPhotos.findIndex((photo) => photo.url === firstImage);
                                if (idx >= 0) setZoomReviewIndex(idx);
                              }}
                              className="group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                              aria-label={`Zoom recenzie ${review.autor}`}
                            >
                              <img
                                src={firstImage}
                                alt={`Recenzie ${review.autor}`}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                loading="lazy"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {product.categorii?.length > 0 && (
              <div className="rounded-2xl border border-border bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('nav.categories')}
                </p>
                <div className="mt-4 space-y-2">
                  {product.categorii.slice(0, 4).map((category) => {
                    const categoryTitle = getCategoryTitle(category);
                    const categorySlug = locale === 'en' ? category.slug_en || category.slug : category.slug;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setCurrentSlug(category.slug);
                          const targetPath =
                            locale === 'en' ? `/en/category/${categorySlug}` : `/categorie/${categorySlug}`;
                          navigate(targetPath);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        data-track-action={`A deschis categoria ${categoryTitle} din produs (tags).`}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 text-left text-sm font-semibold text-foreground"
                      >
                        <img src={category.imagine} alt={categoryTitle} className="h-8 w-8 object-contain" />
                        <span className="line-clamp-1">{categoryTitle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* categories repeated lower removed in favor of section above Informatii rapide */}
          </aside>
        </div>
        {product.categorii?.[0]?.produse?.length ? (
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">{t('product.recommendedProducts')}</h2>
              <button
                type="button"
                onClick={() => {
                  const baseSlug = product.categorii?.[0]?.slug;
                  const localizedSlug = locale === 'en' ? product.categorii?.[0]?.slug_en || baseSlug : baseSlug;
                  if (!localizedSlug) return;
                  const targetPath = locale === 'en' ? `/en/category/${localizedSlug}` : `/categorie/${localizedSlug}`;
                  navigate(targetPath);
                }}
                data-track-action="A deschis categoria recomandata din produs."
                className="text-sm font-semibold text-amber-700"
              >
                {t('product.viewCategory')}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
              {product.categorii[0].produse.slice(0, 8).map((produs, index) => (
                <MobileProductCard
                  key={produs.id}
                  product={produs}
                  index={index}
                  desktopSequence={product.categorii?.[0]?.produse || []}
                />
              ))}
            </div>
          </div>
        ) : null}
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className=" overflow-hidden min-h-full border-l border-border bg-white rounded-r-2xl">
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
                className="category-scroll flex-1 overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#6844c1]/60 [&::-webkit-scrollbar-thumb]:hover:bg-[#6844c1]/80"
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
                    {sortCategories(orderedCategories).map((cat) => renderCategory(cat))}
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#6844c1]/20 via-white/80 to-transparent" />
              <button
                type="button"
                data-track-action="A apasat pe scroll in categorii."
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-[#6844c1] px-3 py-2 text-xs font-semibold text-white shadow-md transition-transform hover:scale-105"
                aria-label="Scroll in jos"
                onClick={(event) => {
                  const container = (event.currentTarget.parentElement?.querySelector('.category-scroll') as HTMLElement | null);
                  if (container) {
                    container.scrollBy({ top: 240, behavior: 'smooth' });
                  }
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

      {zoomReviewIndex !== null && reviewPhotos[zoomReviewIndex] && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setZoomReviewIndex(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-black">
              <img
                src={reviewPhotos[zoomReviewIndex].url}
                alt="Recenzie"
                className="max-h-[80vh] w-full object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-3 text-sm text-white">
                {reviewPhotos[zoomReviewIndex].author}
              </div>
              <button
                type="button"
                onClick={() => setZoomReviewIndex(null)}
                className="absolute right-3 top-3 rounded-full bg-white/20 p-2 text-white"
                aria-label="Inchide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopProductPage;

interface ShortDescriptionProps {
  content: string;
  locale: LocaleCode;
}

const ShortDescription = ({ content, locale }: ShortDescriptionProps) => {
  const [expanded, setExpanded] = useState(false);
  const MAX_LENGTH = 200;

  const plainText = content.replace(/<[^>]+>/g, '').trim();
  const isLong = plainText.length > MAX_LENGTH;
  const displayContent = expanded || !isLong ? plainText : `${plainText.slice(0, MAX_LENGTH)}...`;

  return (
    <div className="mt-4 text-sm text-muted-foreground prose max-w-none">
      <p>{displayContent}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-xs font-semibold text-amber-700"
        >
          {expanded ? t('product.showLess') : locale === 'en' ? 'View more' : 'Vezi mai mult'}
        </button>
      )}
    </div>
  );
};
