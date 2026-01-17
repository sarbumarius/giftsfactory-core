import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, ChevronRight } from 'lucide-react';
import { fetchSubcategoriesCached } from '@/services/api';
import { SubcategoriesResponse, SubcategoryTreeNode } from '@/types/api';
import { useCategoryContext } from '@/contexts/CategoryContext';

interface MobileCategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileCategorySheet = ({ isOpen, onClose }: MobileCategorySheetProps) => {
  const { data, setCurrentSlug } = useCategoryContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [treeData, setTreeData] = useState<SubcategoriesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen || treeData) return;

    let isActive = true;
    setIsLoading(true);
    setError(null);

    fetchSubcategoriesCached(87)
      .then((response) => {
        if (!isActive) return;
        setTreeData(response);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'Failed to load categories');
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isOpen, treeData]);

  useEffect(() => {
    if (!treeData) return;
    const allExpanded = new Set<number>();

    const walk = (nodes: SubcategoryTreeNode[]) => {
      nodes.forEach((node) => {
        if (node.subcategorii?.length) {
          allExpanded.add(node.id);
          walk(node.subcategorii);
        }
      });
    };

    walk(treeData.subcategorii);
    setExpandedIds(allExpanded);
  }, [treeData]);

  const getLevelBgClass = (level: number) => {
    if (level === 0) return 'bg-white';
    if (level === 1) return 'bg-muted/50';
    return 'bg-muted/80';
  };

  const shouldHideChristmasCategory = (category: SubcategoryTreeNode): boolean => {
    const hasCraciun = category.titlu.toLowerCase().includes('craciun') || category.slug.toLowerCase().includes('craciun');
    if (!hasCraciun) return false;

    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    if (month === 1 && day >= 5) return true;
    if (month >= 2 && month <= 9) return true;
    if (month === 10 && day <= 15) return true;

    return false;
  };

  const renderCategory = (
    category: SubcategoryTreeNode,
    level: number = 0,
    highlightSlugs?: Set<string>
  ) => {
    if ((category.nr_produse ?? 0) === 0) {
      return null;
    }
    if (shouldHideChristmasCategory(category)) {
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
          className={`w-full flex items-center gap-3 p-3 ${getLevelBgClass(level)} hover:bg-muted/50 transition-colors ${indentClass}`}
          data-track-action={`A apasat pe categoria ${category.titlu}.`}
          onClick={() => {
            setCurrentSlug(category.slug);
            navigate(`/categorie/${category.slug}`);
            onClose();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img
            src={category.imagine}
            alt={category.titlu}
            className="h-8 w-8 object-contain flex-shrink-0"
          /> 
          <div className="flex-1 text-left ">
            <h3
              className={`text-sm text-foreground ${
                isHighlighted || isCurrent ? 'font-bold' : 'font-medium'
              }`}
            >
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
    if (!searchQuery.trim() || !treeData) {
      return {
        nodes: [] as SubcategoryTreeNode[],
        highlightedSlugs: new Set<string>(),
        expandedIds: new Set<number>(),
      };
    }

    const query = searchQuery.toLowerCase();
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
  }, [searchQuery, treeData]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    setExpandedIds(searchResults.expandedIds);
  }, [searchQuery, searchResults.expandedIds]);

  useEffect(() => {
    if (!treeData || !data?.info?.slug || searchQuery.trim()) return;
    const currentNode = treeData.subcategorii.find((node) => node.slug === data.info.slug);
    if (!currentNode || !currentNode.subcategorii?.length) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(currentNode.id);
      return next;
    });
  }, [treeData, data?.info?.slug, searchQuery]);

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

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 top-16 bg-background z-50 rounded-t-2xl animate-slide-up overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {treeData?.parent?.titlu || 'Categorii'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cauta categorii..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-track-action="A folosit cautarea in categorii."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Se incarca categoriile...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Nu am putut incarca categoriile.
            </div>
          ) : searchQuery.trim() ? (
            searchResults.nodes.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Nu am gasit categorii
              </div>
            ) : (
              <div>
                {searchResults.nodes.map((cat) =>
                  renderCategory(cat, 0, searchResults.highlightedSlugs)
                )}
              </div>
            )
          ) : (
            <div>
              {orderedCategories.map((cat) => renderCategory(cat))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileCategorySheet;
