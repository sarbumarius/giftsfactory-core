import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Mail, MapPin, Phone, Search } from 'lucide-react';
import DesktopSidebar from '@/components/desktop/DesktopSidebar';
import DesktopTopBar from '@/components/desktop/DesktopTopBar';
import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { fetchSubcategoriesCached } from '@/services/api';
import { SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';
import { getLocale, withLocalePath } from '@/utils/locale';
import { termsHtml, privacyHtml } from '@/content/legal';
import { t } from '@/utils/translations';

const DesktopContactPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const { searchQuery, setSearchQuery, setCurrentSlug } = useCategoryContext();
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const locale = getLocale();

  useEffect(() => {
    document.title = t('contact.pageTitle');
  }, [locale]);

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
              <div className="mx-4 rounded-2xl border border-border bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{t('contact.title')}</p>
                    <h1 className="mt-2 text-3xl font-semibold text-foreground">{t('contact.headline')}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">{t('contact.subheadline')}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('contact.scheduleTitle')}</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{t('contact.scheduleValue')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t('contact.scheduleNote')}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.open('tel:0748777776', '_self')}
                    data-track-action="A apasat pe suna din contact desktop."
                    className="flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    <Phone className="h-4 w-4" />
                    0748.777.776
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open('mailto:office@darurialese.ro', '_self')}
                    data-track-action="A apasat pe email din contact desktop."
                    className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    office@darurialese.ro
                  </button>
                </div>
              </div>

              <div className="mt-8 mx-4 grid grid-cols-[1.2fr_0.8fr] gap-8">
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-3xl border border-border bg-white">
                    <div className="relative h-[360px] w-full">
                      <iframe
                        title="Harta Daruri Alese"
                        src="https://www.google.com/maps?q=Zetarilor%2052B%2C%20Bucuresti&output=embed"
                        className="h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-5 py-4 text-sm font-semibold text-foreground">
                      <MapPin className="h-4 w-4 text-amber-700" />
                      {t('contact.mapLabel')}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border bg-white p-6">
                    <p className="text-sm font-semibold text-foreground">{t('contact.formTitle')}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <input
                        type="email"
                        placeholder={t('contact.formEmailPlaceholder')}
                        defaultValue="office@darurialese.ro"
                        data-track-action="A completat emailul in contact desktop."
                        className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      <input
                        type="text"
                        placeholder={t('contact.formSubjectPlaceholder')}
                        data-track-action="A completat subiectul in contact desktop."
                        className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      <textarea
                        placeholder={t('contact.formMessagePlaceholder')}
                        rows={6}
                        data-track-action="A completat mesajul in contact desktop."
                        className="col-span-2 w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      <button
                        type="button"
                        data-track-action="A trimis formularul de contact desktop."
                        className="col-span-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
                      >
                        {t('contact.formSubmit')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-border bg-white p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Phone className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t('contact.customerContact')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">0748.777.776</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Phone className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t('contact.secondaryPhone')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">0757.665.555</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Phone className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t('contact.managerContact')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">0799.807.999 - Sarbu Marius</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border bg-white p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <MapPin className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t('contact.headOfficeAddress')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Aleea Livezilor nr.23 bl.12 ap.3</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <MapPin className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t('contact.workPoint')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Zetarilor 52B, Sector 5, Bucuresti</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border bg-white p-6 space-y-2">
                    <p className="text-sm font-semibold text-foreground">{t('contact.companyDetails')}</p>
                    <p className="text-sm text-muted-foreground">CUI RO37811834</p>
                    <p className="text-sm text-muted-foreground">J40/9997/2017</p>
                    <p className="text-sm text-muted-foreground">
                      {t('contact.adminLabel', { name: 'Sarbu Marius Dumitru' })}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-border bg-white p-6 space-y-2">
                    <p className="text-sm font-semibold text-foreground">{t('contact.legalDocs')}</p>
                    <button
                      type="button"
                      onClick={() => setActiveLegalModal('terms')}
                      data-track-action="A deschis termenii si conditiile din contact desktop."
                      className="w-full rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      {t('contact.terms')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLegalModal('privacy')}
                      data-track-action="A deschis politica de confidentialitate din contact desktop."
                      className="w-full rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      {t('contact.privacy')}
                    </button>
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

      {activeLegalModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveLegalModal(null)}
          />
          <div className="fixed left-1/2 top-16 z-50 h-[80vh] w-[min(920px,90vw)] -translate-x-1/2 rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveLegalModal(null)}
              className="absolute right-5 top-5 rounded-full border border-border bg-white p-2 text-muted-foreground shadow-sm"
              aria-label="Inchide"
            >
              X
            </button>
            <h3 className="text-base font-semibold text-foreground">
              {activeLegalModal === 'privacy' ? 'Politica de confidentialitate' : 'Termeni si conditii'}
            </h3>
            {activeLegalModal === 'terms' ? (
              <div
                className="mt-4 h-[calc(80vh-96px)] overflow-y-auto text-xs text-muted-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:mt-2 [&_ul]:mt-2 [&_ol]:mt-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: termsHtml }}
              />
            ) : privacyHtml ? (
              <div
                className="mt-4 h-[calc(80vh-96px)] overflow-y-auto text-xs text-muted-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:mt-2 [&_ul]:mt-2 [&_ol]:mt-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: privacyHtml }}
              />
            ) : (
              <div className="mt-4 text-sm text-muted-foreground">Continut in lucru.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopContactPage;
