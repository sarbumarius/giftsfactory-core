import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { withLocalePath } from '@/utils/locale';

type Subcategory = {
  id: number;
  titlu: string;
  slug: string;
  imagine: string;
  nr_produse: number;
  subcategorii?: Subcategory[];
};

type CategoryData = {
  parent: {
    id: number;
    titlu: string;
    slug: string;
  };
  subcategorii: Subcategory[];
};

const CategorySlider = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Subcategory | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/cache_app/subcategorii.json')
      .then((res) => res.json())
      .then((data: CategoryData) => {
        setCategories(data.subcategorii);
      })
      .catch((err) => console.error('Error loading categories:', err));
  }, []);

  const visibleCount = 4;
  const maxIndex = Math.max(0, categories.length - visibleCount);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleCategoryClick = (category: Subcategory) => {
    if (category.subcategorii && category.subcategorii.length > 0) {
      setSelectedCategory(category);
    } else {
      navigate(withLocalePath(`/categorie/${category.slug}`));
    }
  };

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    navigate(withLocalePath(`/categorie/${subcategory.slug}`));
  };

  if (categories.length === 0) return null;

  return (
    <div className="w-full">
      {/* Main Categories Slider */}
      <div className="relative">
        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur border border-white/30 text-white hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {currentIndex < maxIndex && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur border border-white/30 text-white hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Slider Container */}
        <div className="overflow-hidden">
          <div
            ref={sliderRef}
            className="flex transition-transform duration-300 ease-out gap-1"
            style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 ${
                  selectedCategory?.id === category.id ? 'bg-white/15' : ''
                }`}
                style={{ width: `calc(${100 / visibleCount}% - 4px)` }}
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center p-2">
                  <img
                    src={category.imagine}
                    alt={category.titlu}
                    className="w-7 h-7 object-contain filter brightness-0 invert"
                  />
                </div>
                <span className="text-white text-[11px] font-medium text-center leading-tight line-clamp-2">
                  {category.titlu}
                </span>
                <span className="text-white/50 text-[9px]">
                  {category.nr_produse} produse
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subcategories Panel */}
      {selectedCategory && selectedCategory.subcategorii && selectedCategory.subcategorii.length > 0 && (
        <div className="mt-2 rounded-xl bg-white/10 backdrop-blur p-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white text-xs font-semibold">{selectedCategory.titlu}</h3>
            <button
              onClick={() => setSelectedCategory(null)}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {selectedCategory.subcategorii.slice(0, 8).map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSubcategoryClick(sub)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
                style={{ width: '80px' }}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center p-1">
                  <img
                    src={sub.imagine}
                    alt={sub.titlu}
                    className="w-5 h-5 object-contain filter brightness-0 invert"
                  />
                </div>
                <span className="text-white text-[9px] font-medium text-center leading-tight line-clamp-2">
                  {sub.titlu}
                </span>
              </button>
            ))}
          </div>
          {selectedCategory.subcategorii.length > 8 && (
            <button
              onClick={() => navigate(withLocalePath(`/categorie/${selectedCategory.slug}`))}
              className="w-full mt-2 py-1 text-white/70 text-[10px] hover:text-white transition-colors"
            >
              Vezi toate ({selectedCategory.subcategorii.length}) →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySlider;
