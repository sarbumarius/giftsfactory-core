import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { Baby, Users, Gift, Heart, Mail, ArrowLeft, Info, Grid } from 'lucide-react';
import MobileCategoryFilterSlide from './MobileCategoryFilterSlide';
import MobileCategoryTypeSlide from './MobileCategoryTypeSlide';

interface MobileCategoryCardsProps {
  onOpenCategories?: () => void;
  onOpenFilters?: () => void;
}

const MobileCategoryCards = ({ onOpenCategories, onOpenFilters }: MobileCategoryCardsProps) => {
  const { data, loading, setCurrentSlug } = useCategoryContext();
  const navigate = useNavigate();
  const [showDescription, setShowDescription] = useState(false);

  const getIcon = (index: number) => {
    const icons = [Baby, Users, Gift, Heart, Mail];
    return icons[index % icons.length];
  };

  if (!data || loading) {
    return (
      <div className="pl-3 py-2">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-40 rounded-md bg-white/20 animate-pulse" />
            <div className="h-6 w-6 rounded-full bg-white/20 animate-pulse" />
          </div>
          <p className="text-white/60 text-sm">Se incarca...</p>
        </div>

        <div className="flex gap-3 pb-2 mb-6">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="w-[45%] flex-shrink-0 overflow-hidden rounded-2xl bg-card/30 border border-white/20 animate-pulse"
            >
              <div className="p-3">
                <div className="h-4 w-24 rounded bg-white/20" />
                <div className="mt-3 h-6 w-16 rounded-full bg-white/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const subcategories = data.info.subcategorii;
  const filteredSubcategories = subcategories.filter(
    (subcategory) => subcategory.count_produse && subcategory.count_produse > 0
  );
  const showOtherCategoriesCard = filteredSubcategories.length > 0 && Boolean(onOpenCategories);
  const categoryTitle = data.info.titlu;
  const parentCategory = data.info.parinte;
  const productCount = data.info.nr_produse;
  const description = data.info.descriere;
  const descriptionText = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const shouldShowParent = parentCategory && parentCategory.titlu !== 'Ocazii speciale';
  const totalCards =
    filteredSubcategories.length + (shouldShowParent ? 1 : 0) + (showOtherCategoriesCard ? 1 : 0);
  const tipuriSection = (
    <div className="tipuri hidden">
      <MobileCategoryFilterSlide onOpenFilters={onOpenFilters} />
      <MobileCategoryTypeSlide />
    </div>
  );

  if (totalCards === 0) {
    return (
      <div className="pl-3 py-2">
        <div className={`mb-3 ${showDescription ? 'mt-8' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-white text-3xl font-serif">{categoryTitle}</h2>

          </div>


          {showDescription && (
            <div className="mt-3 mr-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 animate-fade-in">
              <p className="text-white/90 text-xs leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}
        </div>
        {tipuriSection}
      </div>
    );
  }

  const getCardWidthClass = () => {
    if (totalCards === 1) return 'w-full';
    if (totalCards === 2) return 'w-[calc(50%-6px)]';
    return 'w-[45%]';
  };

  const getContainerClass = () => {
    if (totalCards <= 2) return 'flex gap-3 pb-2 mb-6';
    return 'flex gap-3 overflow-x-auto pb-2 mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]';
  };

  const handleCardClick = (slug: string) => {
    setCurrentSlug(slug);
    navigate(`/categorie/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pl-3 py-2">

      <div className={`mb-3 ${showDescription ? 'mt-8' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-white text-xl font-serif">{categoryTitle}</h2>
          <button
            onClick={() => setShowDescription(!showDescription)}
            data-track-action="A apasat pe informatii categorie."
            className="rounded-full p-1 hover:bg-white/10 transition-colors active:scale-95"
            aria-label="Informatii despre categorie"
          >
            <Info className={`h-5 w-5 text-white transition-transform ${showDescription ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <p className="text-white/80 text-xl font-serif">
          {productCount} {productCount === 1 ? 'produs' : 'produse'}
        </p>

        {showDescription && (
          <div className="mt-3 mr-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 animate-fade-in">
            <div
              className="text-white/90 text-xs leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        )}
      </div>

      {tipuriSection}

      <div className={getContainerClass()}>
        {shouldShowParent && parentCategory && (
          <div
            onClick={() => handleCardClick(parentCategory.slug)}
            data-track-action={`A apasat pe categoria ${parentCategory.titlu}.`}
            className={`relative ${getCardWidthClass()} flex-shrink-0 overflow-hidden rounded-2xl bg-card opacity-0 animate-scale-in transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none border-2 border-primary/30`}
            style={{ animationDelay: '0s', animationFillMode: 'forwards' }}
          >
            <div className="absolute bottom-0 right-0 opacity-60">
              <ArrowLeft className="h-20 w-20 text-primary/30" />
            </div>

            <div className="relative z-10 p-3">
              <div className="flex items-center gap-1 mb-1">
                <ArrowLeft className="h-3 w-3 text-primary" />
                <span className="text-xs text-primary font-medium">Inapoi la</span>
              </div>
              <h3 className="text-sm font-serif text-foreground pointer-events-none">{parentCategory.titlu}</h3>
            </div>
          </div>
        )}

        {filteredSubcategories.map((subcategory, index) => {
          const animationIndex = shouldShowParent ? index + 1 : index;
          const Icon = getIcon(index);
          return (
            <div
              key={subcategory.slug}
              onClick={() => handleCardClick(subcategory.slug)}
              data-track-action={`A apasat pe categoria ${subcategory.titlu}.`}
              className={`relative ${getCardWidthClass()} flex-shrink-0 overflow-hidden rounded-2xl bg-card opacity-0 animate-scale-in transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none`}
              style={{ animationDelay: `${animationIndex * 0.15}s`, animationFillMode: 'forwards' }}
            >
              {subcategory.imagine ? (
                <img
                  src={subcategory.imagine}
                  alt={subcategory.titlu}
                  className="absolute -bottom-4 -right-1 h-20 w-20 object-contain opacity-10"
                  loading="lazy"
                />
              ) : (
                <div className="absolute bottom-0 right-0 opacity-40">
                  <Icon className="h-20 w-20 text-foreground/30" />
                </div>
              )}

              <div className="relative z-10 p-3">
                <h3 className="text-sm font-serif text-foreground pointer-events-none">{subcategory.titlu}</h3>
                <button className="mt-2 rounded-full bg-foreground px-2 py-1 text-[10px] font-medium text-primary-foreground transition-all hover:bg-foreground/80">
                  {subcategory.count_produse} produse
                </button>
              </div>
            </div>
          );
        })}

        {showOtherCategoriesCard && (
          <div
            onClick={() => {
              onOpenCategories?.();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            data-track-action="A apasat pe vezi alte categorii."
            className={`relative ${getCardWidthClass()} flex-shrink-0 overflow-hidden rounded-2xl bg-card opacity-0 animate-scale-in transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none border border-primary/40`}
            style={{
              animationDelay: `${
                (filteredSubcategories.length + (shouldShowParent ? 1 : 0)) * 0.15
              }s`,
              animationFillMode: 'forwards',
            }}
          >
            <div className="absolute bottom-0 right-0 opacity-40">
              <Grid className="h-20 w-20 text-primary/40" />
            </div>

            <div className="relative z-10 p-3">
              <h3 className="text-sm font-serif text-foreground pointer-events-none">Vezi alte categorii</h3>
              <button className="mt-2 rounded-full bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground transition-all hover:bg-primary/90">
                Apasa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCategoryCards;
