import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, HelpCircle, Loader2, Mail, Menu, MessageCircle, Phone, Plus, Search, ShoppingCart, Star, Store, Tag, Users } from 'lucide-react';
import logo from '@/assets/factorygifts.svg';
import logoDaruri from '@/assets/logo-daruri.svg';
import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { fetchSubcategoriesCached } from '@/services/api';
import { SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';
import { getLocale, LocaleCode, setLocale, stripLocalePrefix, withLocalePath } from '@/utils/locale';

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
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const { searchQuery, setSearchQuery, setCurrentSlug } = useCategoryContext();
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
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [locale, setLocaleState] = useState<LocaleCode>(getLocale());
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);

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

            <div className="flex-1 overflow-y-auto pb-24">
              <div className="mx-4 rounded-2xl border border-border bg-white px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Recenzii clienti</p>
                    <h1 className="text-lg font-semibold text-foreground font-serif -mt-1">Experiente reale, cadouri reale.</h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(['photos', 'text'] as ReviewTab[]).map((tab) => {
                      const count = tab === 'photos' ? data?.recenzii_cu_poza.length ?? 0 : data?.recenzii_text.length ?? 0;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveTab(tab)}
                          data-track-action={`A schimbat tabul de recenzii la ${tab === 'photos' ? 'Poze' : 'Text'}.`}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                            activeTab === tab ? 'text-white' : 'border border-border bg-white text-muted-foreground'
                          }`}
                          style={
                            activeTab === tab ? { backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' } : undefined
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
              </div>

              <div className="mt-8 space-y-4 mx-4">
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

            {bestSellers.length > 0 && (
              <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-border bg-white/95 px-6 py-2 backdrop-blur">
                <div className="relative">
                  {canScrollLeft && (
                    <button
                      type="button"
                      onClick={() => sliderRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                      data-track-action="A derulat sliderul de produse la stanga."
                      className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-white/90 px-2 py-2 text-xs font-semibold text-foreground shadow"
                      aria-label="Deruleaza stanga"
                    >
                      {'<'}
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
                      {'>'}
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
                      {'<'} Prev
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
                      Next {'>'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopReviewsPage;
