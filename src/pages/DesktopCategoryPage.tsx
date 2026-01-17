import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import DesktopHeader from '@/components/desktop/DesktopHeader';
import DesktopDiscountBanner from '@/components/desktop/DesktopDiscountBanner';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { fetchSubcategoriesCached } from '@/services/api';
import { SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';

const DesktopCategoryPage = () => {
  const navigate = useNavigate();
  const {
    data,
    loading,
    filteredProducts,
    currentSort,
    setCurrentSort,
    priceBounds,
    priceFilterMin,
    priceFilterMax,
    setPriceFilterMin,
    setPriceFilterMax,
    setCurrentSlug,
  } = useCategoryContext();
  const [minInput, setMinInput] = useState(priceFilterMin.toString());
  const [maxInput, setMaxInput] = useState(priceFilterMax.toString());
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const categoryTitle = data?.info?.titlu ?? 'Categoria';
  const categoryDescription = (data?.info?.descriere || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const displayProducts = useMemo(() => filteredProducts, [filteredProducts]);

  const applyPriceFilters = () => {
    const nextMin = Number(minInput);
    const nextMax = Number(maxInput);
    if (!Number.isNaN(nextMin)) setPriceFilterMin(nextMin);
    if (!Number.isNaN(nextMax)) setPriceFilterMax(nextMax);
  };

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
    if (priceFilterMin === 0 && priceBounds.min > 0) {
      setMinInput(priceBounds.min.toString());
    }
    if (priceFilterMax === 0 && priceBounds.max > 0) {
      setMaxInput(priceBounds.max.toString());
    }
  }, [priceBounds.min, priceBounds.max, priceFilterMin, priceFilterMax]);

  const getLevelBgClass = (level: number) => {
    if (level === 0) return 'bg-white';
    if (level === 1) return 'bg-muted/50';
    return 'bg-muted/80';
  };

  const renderCategory = (category: SubcategoryTreeNode, level: number = 0, highlightSlugs?: Set<string>) => {
    if ((category.nr_produse ?? 0) === 0) {
      return null;
    }
    const hasChildren = category.subcategorii?.length > 0;
    const indentClass = level === 1 ? 'ml-6' : level === 2 ? 'ml-12' : '';
    const isCurrent = category.slug === data?.info?.slug;
    const isHighlighted = highlightSlugs?.has(category.slug);
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id}>
        <button
          className={`w-full min-w-0 flex items-center gap-3 p-3 ${getLevelBgClass(level)} hover:bg-muted/50 transition-colors ${indentClass}`}
          data-track-action={`A apasat pe categoria ${category.titlu}.`}
          onClick={() => {
            setCurrentSlug(category.slug);
            navigate(`/categorie/${category.slug}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img
            src={category.imagine}
            alt={category.titlu}
            className="h-8 w-8 object-contain flex-shrink-0"
          />
          <div className="min-w-0 flex-1 text-left">
            <h3 className={`text-sm ${isHighlighted || isCurrent ? 'font-bold' : 'font-medium'} text-foreground`}>
              {category.titlu}
            </h3>
            <p className="text-xs text-muted-foreground">{category.nr_produse} produse</p>
          </div>
          {hasChildren && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setExpandedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(category.id)) {
                    next.delete(category.id);
                  } else {
                    next.add(category.id);
                  }
                  return next;
                });
              }}
              className="rounded-full p-1 transition-colors hover:bg-muted"
              aria-label={isExpanded ? 'Restrange subcategorii' : 'Extinde subcategorii'}
            >
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div>
            {category.subcategorii.map((child) => renderCategory(child, level + 1, highlightSlugs))}
          </div>
        )}
      </div>
    );
  };

  const searchResults = useMemo(() => {
    if (!categorySearch.trim() || !treeData) {
      return {
        nodes: [] as SubcategoryTreeNode[],
        highlightedSlugs: new Set<string>(),
        expandedIds: new Set<number>(),
      };
    }

    const query = categorySearch.toLowerCase();
    const parentById = new Map<number, SubcategoryTreeNode>();
    const allNodes: SubcategoryTreeNode[] = [];

    const walk = (nodes: SubcategoryTreeNode[], parent?: SubcategoryTreeNode) => {
      nodes.forEach((node) => {
        allNodes.push(node);
        if (parent) {
          parentById.set(node.id, parent);
        }
        if (node.subcategorii?.length) {
          walk(node.subcategorii, node);
        }
      });
    };

    walk(treeData.subcategorii);

    const matches = allNodes.filter((node) => {
      return node.titlu.toLowerCase().includes(query) || node.slug.toLowerCase().includes(query);
    });

    const highlightedSlugs = new Set(matches.map((node) => node.slug));
    const resultMap = new Map<number, SubcategoryTreeNode>();
    const expandedIds = new Set<number>();

    matches.forEach((node) => {
      const parent = parentById.get(node.id);
      if (parent) {
        resultMap.set(parent.id, parent);
        expandedIds.add(parent.id);
      } else {
        resultMap.set(node.id, node);
      }
    });

    const reorderNode = (node: SubcategoryTreeNode): SubcategoryTreeNode => {
      if (!node.subcategorii?.length) {
        return node;
      }

      const reorderedChildren = [...node.subcategorii].sort((a, b) => {
        const aMatch = highlightedSlugs.has(a.slug) ? 1 : 0;
        const bMatch = highlightedSlugs.has(b.slug) ? 1 : 0;
        return bMatch - aMatch;
      });

      return {
        ...node,
        subcategorii: reorderedChildren.map(reorderNode),
      };
    };

    return {
      nodes: Array.from(resultMap.values()).map(reorderNode),
      highlightedSlugs,
      expandedIds,
    };
  }, [categorySearch, treeData]);

  useEffect(() => {
    if (!categorySearch.trim()) return;
    setExpandedIds(searchResults.expandedIds);
  }, [categorySearch, searchResults.expandedIds]);

  useEffect(() => {
    if (!treeData || !data?.info?.slug || categorySearch.trim()) return;
    const currentNode = treeData.subcategorii.find((node) => node.slug === data.info.slug);
    if (!currentNode || !currentNode.subcategorii?.length) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(currentNode.id);
      return next;
    });
  }, [treeData, data?.info?.slug, categorySearch]);

  const orderedCategories = useMemo(() => {
    if (!treeData?.subcategorii || !data?.info?.slug) {
      return treeData?.subcategorii || [];
    }

    let found: SubcategoryTreeNode | null = null;

    const removeAndCollect = (nodes: SubcategoryTreeNode[]): SubcategoryTreeNode[] => {
      return nodes.reduce<SubcategoryTreeNode[]>((acc, node) => {
        if (node.slug === data.info.slug) {
          found = node;
          return acc;
        }

        if (node.subcategorii?.length) {
          const nextChildren = removeAndCollect(node.subcategorii);
          if (nextChildren !== node.subcategorii) {
            acc.push({ ...node, subcategorii: nextChildren });
            return acc;
          }
        }

        acc.push(node);
        return acc;
      }, []);
    };

    const pruned = removeAndCollect(treeData.subcategorii);

    return found ? [found, ...pruned] : treeData.subcategorii;
  }, [treeData, data?.info?.slug]);

  return (
    <div className="min-h-screen bg-white">
      <DesktopHeader />

      <main className="mx-auto grid max-w-7xl grid-cols-[320px_1fr] gap-8 px-8 py-8">
        <aside className="sticky top-24 h-fit self-start overflow-hidden rounded-2xl border border-border bg-white">
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
                className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>
          <div className="max-h-[70vh] overflow-x-hidden overflow-y-auto">
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
                  {searchResults.nodes.map((cat) => renderCategory(cat, 0, searchResults.highlightedSlugs))}
                </div>
              )
            ) : (
              <div>
                {orderedCategories.map((cat) => renderCategory(cat))}
              </div>
            )}
          </div>
        </aside>

        <section>
          <div className="mb-6 rounded-2xl border border-border bg-white p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categorie</p>
                <h1 className="mt-2 text-3xl font-semibold text-foreground font-serif">{categoryTitle}</h1>
              </div>
              <div className="rounded-full border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground">
                {displayProducts.length} produse
              </div>
            </div>
          </div>

          <div className="mb-6">
            <DesktopDiscountBanner />
          </div>

          <div className="mb-4 ">
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-muted-foreground">
              <select
                value={currentSort}
                onChange={(event) => setCurrentSort(event.target.value as typeof currentSort)}
                data-track-action="Sortare desktop."
                className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground"
              >
                <option value="popularitate">Popularitate</option>
                <option value="cele-mai-noi">Cele mai noi</option>
                <option value="pret-crescator">Pret crescator</option>
                <option value="pret-descrescator">Pret descrescator</option>
                <option value="reduceri">Reduceri</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={minInput}
                  onChange={(event) => setMinInput(event.target.value)}
                  data-track-action="Filtru pret minim desktop."
                  className="w-20 rounded-full border border-border px-2 py-2 text-xs text-foreground"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  type="number"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={maxInput}
                  onChange={(event) => setMaxInput(event.target.value)}
                  data-track-action="Filtru pret maxim desktop."
                  className="w-20 rounded-full border border-border px-2 py-2 text-xs text-foreground"
                  placeholder="Max"
                />
              </div>
              <button
                type="button"
                onClick={applyPriceFilters}
                data-track-action="A aplicat filtrul de pret desktop."
                className="rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white"
              >
                Aplica
              </button>
            </div>
          </div>

          {loading && (
            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
              Se incarca produsele...
            </div>
          )}

          {!loading && displayProducts.length === 0 && (
            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
              Nu am gasit produse in aceasta categorie.
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {displayProducts.map((product, index) => (
              <MobileProductCard
                key={product.id}
                product={product}
                index={index}
                desktopSequence={displayProducts}
              />
            ))}
          </div>

          {categoryDescription && (
            <div className="mt-10 rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted-foreground">{categoryDescription}</p>
            </div>
          )}

        </section>
      </main>
    </div>
  );
};

export default DesktopCategoryPage;
