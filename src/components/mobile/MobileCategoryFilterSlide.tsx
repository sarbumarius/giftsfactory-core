import { SlidersHorizontal } from 'lucide-react';
import { useCategoryContext } from '@/contexts/CategoryContext';

interface MobileCategoryFilterSlideProps {
  onOpenFilters?: () => void;
}

const MobileCategoryFilterSlide = ({ onOpenFilters }: MobileCategoryFilterSlideProps) => {
  const {
    currentSort,
    setCurrentSort,
    priceBounds,
    priceFilterMin,
    priceFilterMax,
    setPriceFilterMin,
    setPriceFilterMax,
    selectedTypeSlug,
    setSelectedTypeSlug,
    data,
  } = useCategoryContext();

  const sortLabels: Record<string, string> = {
    popularitate: 'Popularitate',
    'cele-mai-noi': 'Cele mai noi',
    'pret-crescator': 'Pret crescator',
    'pret-descrescator': 'Pret descrescator',
    reduceri: 'Reduceri primele',
  };

  const activeFilters: { key: string; label: string; onClear: () => void }[] = [];

  if (currentSort !== 'popularitate') {
    activeFilters.push({
      key: 'sort',
      label: `Sortare: ${sortLabels[currentSort] || currentSort}`,
      onClear: () => setCurrentSort('popularitate'),
    });
  }

  if (priceFilterMin !== priceBounds.min || priceFilterMax !== priceBounds.max) {
    activeFilters.push({
      key: 'price',
      label: `Pret: ${priceFilterMin} - ${priceFilterMax} RON`,
      onClear: () => {
        setPriceFilterMin(priceBounds.min);
        setPriceFilterMax(priceBounds.max);
      },
    });
  }

  if (selectedTypeSlug) {
    const typeLabel =
      data?.info.tipuri?.find((tip) => tip.slug === selectedTypeSlug)?.nume || selectedTypeSlug;
    activeFilters.push({
      key: 'type',
      label: `Tip: ${typeLabel}`,
      onClear: () => setSelectedTypeSlug(null),
    });
  }

  if (!onOpenFilters && activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

    </div>
  );
};

export default MobileCategoryFilterSlide;
