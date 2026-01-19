import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Phone, Search, Sparkles } from 'lucide-react';
import DesktopSidebar from '@/components/desktop/DesktopSidebar';
import DesktopTopBar from '@/components/desktop/DesktopTopBar';
import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { fetchSubcategoriesCached } from '@/services/api';
import { SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';
import { getLocale, withLocalePath } from '@/utils/locale';
import { t } from '@/utils/translations';

interface FaqItem {
  intrebare: string;
  raspuns: string;
}

type AiState =
  | { status: 'idle' }
  | { status: 'loading'; question: string }
  | { status: 'done'; question: string; answer: string }
  | { status: 'error'; question: string };

const DesktopFAQPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const { searchQuery, setSearchQuery, setCurrentSlug } = useCategoryContext();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [aiState, setAiState] = useState<AiState>({ status: 'idle' });
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const locale = getLocale();

  useEffect(() => {
    document.title = t('faq.pageTitle');
    let isMounted = true;

    fetch('https://crm.actium.ro/api/intrebari-frecvente')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setFaqs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setFaqs([]);
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

  const filteredFaqs = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return faqs;
    return faqs.filter((faq) => {
      const question = faq.intrebare?.toLowerCase() || '';
      const answer = faq.raspuns?.toLowerCase() || '';
      return question.includes(trimmed) || answer.includes(trimmed);
    });
  }, [faqs, query]);

  const showNoResults = !loading && query.trim().length > 0 && filteredFaqs.length === 0 && aiState.status === 'idle';

  const askAi = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setAiState({ status: 'loading', question: trimmed });

    fetch('https://crm.actium.ro/api/intreb-seful', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intrebare: trimmed }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.raspuns) {
          setAiState({ status: 'done', question: trimmed, answer: data.raspuns });
          if (window.rybbit?.event) {
            window.rybbit.event(`Seful a raspuns: ${data.raspuns}`);
          }
          return;
        }
        setAiState({ status: 'error', question: trimmed });
      })
      .catch(() => {
        setAiState({ status: 'error', question: trimmed });
      });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (aiState.status !== 'idle') {
      setAiState({ status: 'idle' });
    }
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

    const queryValue = categorySearch.toLowerCase();
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
      return node.titlu.toLowerCase().includes(queryValue) || node.slug.toLowerCase().includes(queryValue);
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
              <div className="mx-4 grid grid-cols-[1.3fr_0.7fr] gap-8">
                <div className="space-y-6">
                  <div className="rounded-3xl border border-border bg-amber-50/40 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                      {t('faq.title')}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-foreground">{t('faq.headline')}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('faq.subheadline')}
                    </p>
                    <div className="relative mt-4">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={query}
                        onChange={(event) => handleQueryChange(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && showNoResults) {
                            event.preventDefault();
                            askAi();
                          }
                        }}
                        data-track-action="A cautat in FAQ"
                        placeholder={t('faq.searchPlaceholder')}
                        className="w-full rounded-full border border-border bg-white py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                    </div>
                  </div>

                  {loading && (
                    <div className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
                      {t('faq.loading')}
                    </div>
                  )}

                  {!loading && aiState.status === 'idle' && filteredFaqs.length === 0 && query.trim().length === 0 && (
                    <div className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
                      {t('faq.empty')}
                    </div>
                  )}

                  {aiState.status !== 'idle' && (
                    <div className="rounded-2xl border border-border bg-white p-5">
                      <p className="text-sm font-semibold text-foreground">{t('faq.youAsked')}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{aiState.question}</p>
                      {aiState.status === 'loading' && (
                        <p className="mt-4 text-sm font-semibold text-amber-600">{t('faq.searchingAnswer')}</p>
                      )}
                      {aiState.status === 'error' && (
                        <p className="mt-4 text-sm font-semibold text-red-500">{t('faq.networkError')}</p>
                      )}
                      {aiState.status === 'done' && (
                        <>
                          <p className="mt-4 text-sm font-semibold text-emerald-600">{t('faq.answerFrom')}</p>
                          <div
                            className="mt-2 text-sm text-foreground whitespace-pre-line"
                            dangerouslySetInnerHTML={{ __html: aiState.answer }}
                          />
                          <button
                            type="button"
                            onClick={() => setAiState({ status: 'idle' })}
                            data-track-action="A revenit la lista de intrebari."
                            className="mt-4 rounded-full px-4 py-2 text-sm font-semibold text-white"
                            style={{ backgroundImage: 'linear-gradient(90deg,#faca8c 0%,#e0a35c 50%,#cf843b 100%)' }}
                          >
                            {t('faq.backToQuestions')}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {aiState.status === 'idle' && filteredFaqs.length > 0 && (
                    <div className="space-y-3">
                      {filteredFaqs.map((faq, index) => {
                        const isOpen = openIndex === index;

                        return (
                          <div key={`${faq.intrebare}-${index}`} className="rounded-2xl border border-border bg-white">
                            <button
                              type="button"
                              onClick={() => setOpenIndex(isOpen ? null : index)}
                              data-track-action={`A apasat pe intrebarea: ${faq.intrebare}`}
                              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                            >
                              <span className="text-sm font-semibold text-foreground">{faq.intrebare}</span>
                              <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              />
                            </button>
                            <div className={`overflow-hidden transition-all ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                              <div
                                className="px-5 pb-4 text-sm text-muted-foreground prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: faq.raspuns }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showNoResults && (
                    <div className="rounded-2xl border border-border bg-white p-5">
                      <p className="text-sm text-muted-foreground">{t('faq.noResults')}</p>
                      <button
                        type="button"
                        onClick={askAi}
                        data-track-action="A cautat cu AI in FAQ."
                        className="mt-4 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundImage: 'linear-gradient(90deg,#faca8c 0%,#e0a35c 50%,#cf843b 100%)' }}
                      >
                        <Sparkles className="h-4 w-4" />
                        {t('faq.askAi')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-border bg-white p-6">
                    <p className="text-sm font-semibold text-foreground">{t('faq.noAnswerTitle')}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('faq.noAnswerBody')}
                    </p>
                    <button
                      type="button"
                      onClick={askAi}
                      data-track-action="A cautat cu AI in FAQ."
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                      style={{ backgroundImage: 'linear-gradient(90deg,#faca8c 0%,#e0a35c 50%,#cf843b 100%)' }}
                    >
                      <Sparkles className="h-4 w-4" />
                      {t('faq.askBoss')}
                    </button>
                  </div>

                  <div className="rounded-3xl border border-border bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('faq.quickContact')}
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open('tel:0748777776', '_self')}
                      data-track-action="A apasat pe contact telefonic in FAQ."
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white"
                      style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
                    >
                      <Phone className="h-4 w-4" />
                      {t('faq.phoneCta', { phone: '0748.777.776' })}
                    </button>
                    <p className="mt-2 text-xs text-muted-foreground">{t('faq.hours')}</p>
                  </div>
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
    </div>
  );
};

export default DesktopFAQPage;
