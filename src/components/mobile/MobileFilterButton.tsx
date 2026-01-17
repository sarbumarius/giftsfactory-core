import { useState, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useCategoryContext } from '@/contexts/CategoryContext';

interface MobileFilterButtonProps {
  onClick: () => void;
}

const MobileFilterButton = ({ onClick }: MobileFilterButtonProps) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const {
    currentSort,
    priceBounds,
    priceFilterMin,
    priceFilterMax,
    selectedTypeSlug,
    resetFilters,
  } = useCategoryContext();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!hasScrolled) return null;

  const hasActiveFilters =
    currentSort !== 'popularitate' ||
    priceFilterMin !== priceBounds.min ||
    priceFilterMax !== priceBounds.max ||
    selectedTypeSlug !== null;

  return (
    <button
      onClick={onClick}
      data-track-action="A deschis filtrele din butonul lateral."
      className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-xl bg-card px-2 py-4 shadow-lg transition-all hover:px-3 hover:shadow-xl animate-fade-in"
    >
      <div className="flex flex-col items-center gap-1">
        <SlidersHorizontal className="h-5 w-5 text-primary" />
        <span className="text-xs font-medium text-foreground" style={{ writingMode: 'vertical-rl' }}>
          FILTRE
        </span>
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            resetFilters();
          }}
          data-track-action="A resetat filtrele din butonul lateral."
          className="absolute -left-3 -top-2 rounded-full bg-destructive p-1 shadow-md"
          aria-label="Reseteaza filtrele"
        >
          <X className="h-3 w-3 text-white" />
        </button>
      )}
    </button>
  );
};

export default MobileFilterButton;
