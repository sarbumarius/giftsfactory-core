import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { withLocalePath } from '@/utils/locale';

type Product = {
  id: number;
  titlu: string;
  slug: string;
  imagine_principala: {
    full: string;
    '300x300': string;
    '100x100': string;
  };
};

type Subcategory = {
  id: number;
  titlu: string;
  slug: string;
  imagine: string;
  nr_produse: number;
  subcategorii?: Subcategory[];
};

type CategoryData = {
  subcategorii: Subcategory[];
};

type CategoryProducts = {
  produse: Product[];
};

const CategorySlider = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Subcategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<Subcategory | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<Subcategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load categories
  useEffect(() => {
    fetch('/cache_app/subcategorii.json')
      .then((res) => res.json())
      .then((data: CategoryData) => {
        setCategories(data.subcategorii);
      })
      .catch((err) => console.error('Error loading categories:', err));
  }, []);

  // Load products when category/subcategory changes
  useEffect(() => {
    const slug = activeSubcategory?.slug || activeCategory?.slug;
    if (!slug) {
      setProducts([]);
      return;
    }

    setLoadingProducts(true);
    fetch(`/cache_app/categorii/${slug}.json`)
      .then((res) => res.json())
      .then((data: CategoryProducts) => {
        setProducts(data.produse?.slice(0, 5) || []);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, [activeCategory, activeSubcategory]);

  const handleCategoryClick = (cat: Subcategory) => {
    if (activeCategory?.id === cat.id) {
      // Deselect
      setActiveCategory(null);
      setActiveSubcategory(null);
    } else {
      setActiveCategory(cat);
      setActiveSubcategory(null);
    }
  };

  const handleSubcategoryClick = (sub: Subcategory) => {
    if (activeSubcategory?.id === sub.id) {
      setActiveSubcategory(null);
    } else {
      setActiveSubcategory(sub);
    }
  };

  const currentSlug = activeSubcategory?.slug || activeCategory?.slug;

  // Purple gradient colors for categories (dark to light)
  const categoryColors = [
    'bg-[#4a2c91]',
    'bg-[#5533a1]',
    'bg-[#6844c1]',
    'bg-[#7a55d1]',
    'bg-[#8c66e1]',
    'bg-[#9e77f1]',
  ];

  if (categories.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center gap-5 mt-auto mb-8">
      {/* Categories */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {categories.map((cat, index) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium transition-all text-white hover:opacity-90 ${
              activeCategory?.id === cat.id
                ? 'bg-gradient-to-r from-[#c9a962] to-[#e8d5a3]'
                : categoryColors[index % categoryColors.length]
            }`}
          >
            <img
              src={cat.imagine}
              alt=""
              className={`w-6 h-6 object-contain ${activeCategory?.id === cat.id ? '' : 'filter brightness-0 invert'}`}
            />
            {cat.titlu}
          </button>
        ))}
      </div>

      {/* Subcategories */}
      {activeCategory?.subcategorii && activeCategory.subcategorii.length > 0 && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {activeCategory.subcategorii.map((sub) => (
            <button
              key={sub.id}
              onClick={() => handleSubcategoryClick(sub)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeSubcategory?.id === sub.id
                  ? 'border border-[#6844c1] text-white'
                  : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              <img
                src={sub.imagine}
                alt=""
                className="w-5 h-5 object-contain filter brightness-0 invert"
              />
              {sub.titlu}
            </button>
          ))}
        </div>
      )}

      {/* Product Circles Slider */}
      {(activeCategory || activeSubcategory) && (
        <div className="flex items-center justify-center gap-5 mt-2">
          {loadingProducts ? (
            // Loading skeleton circles
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-36 h-36 rounded-full bg-white/10 animate-pulse"
              />
            ))
          ) : (
            <>
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigate(withLocalePath(`/produs/${product.slug}`))}
                  className="w-36 h-36 rounded-full overflow-hidden bg-white shadow-lg hover:scale-110 transition-transform ring-4 ring-[#6844c1]"
                >
                  <img
                    src={product.imagine_principala['300x300']}
                    alt={product.titlu}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {/* View All Circle */}
              {currentSlug && (
                <button
                  onClick={() => navigate(withLocalePath(`/categorie/${currentSlug}`))}
                  className="w-36 h-36 rounded-full border-4 border-[#6844c1] hover:bg-[#6844c1]/20 flex flex-col items-center justify-center gap-1 transition-all hover:scale-110"
                >
                  <ArrowRight className="w-8 h-8 text-white" />
                  <span className="text-white text-xs font-medium">Vezi toate</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySlider;
