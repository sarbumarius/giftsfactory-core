import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCategoryContext, SortType } from '@/contexts/CategoryContext';
import { getSortLabel, t } from '@/utils/translations';
import MobileCategoryIcons from './MobileCategoryIcons';
import { Slider } from '@/components/ui/slider';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileFilterSheet = ({ isOpen, onClose }: MobileFilterSheetProps) => {
  const {
    currentSort,
    setCurrentSort,
    priceBounds,
    priceFilterMin,
    priceFilterMax,
    setPriceFilterMin,
    setPriceFilterMax,
    filteredProducts,
    selectedTypeSlug,
    setSelectedTypeSlug,
    data,
  } = useCategoryContext();
  const [priceRange, setPriceRange] = useState<[number, number]>([
    priceFilterMin || priceBounds.min,
    priceFilterMax || priceBounds.max,
  ]);

  const sortOptions: SortType[] = [
    'popularitate',
    'cele-mai-noi',
    'pret-crescator',
    'pret-descrescator',
    'reduceri',
  ];

  useEffect(() => {
    const nextMin = priceFilterMin || priceBounds.min;
    const nextMaxRaw = priceFilterMax || priceBounds.max;
    const nextMax = nextMaxRaw < nextMin ? nextMin : nextMaxRaw;
    setPriceRange([nextMin, nextMax]);
  }, [priceBounds.min, priceBounds.max, priceFilterMin, priceFilterMax]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{t('filters.title')}</h2>
          <button
            onClick={onClose}
            data-track-action="A inchis fereastra de filtre."
            className="rounded-full p-2 transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>


        <div className="mb-6">
          <h3 className="mb-3 font-semibold text-foreground">{t('filters.priceRange')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
              <span>
                {t('filters.minPrice')}: {priceRange[0]}
              </span>
              <span>
                {t('filters.maxPrice')}: {priceRange[1]}
              </span>
            </div>
            <Slider
              min={priceBounds.min}
              max={priceBounds.max}
              step={1}
              value={priceRange}
              onValueChange={(value) => {
                if (value.length === 2) {
                  const nextMin = Math.max(priceBounds.min, value[0]);
                  const nextMax = Math.min(priceBounds.max, value[1]);
                  const clamped: [number, number] = [
                    Math.min(nextMin, nextMax),
                    Math.max(nextMin, nextMax),
                  ];
                  setPriceRange(clamped);
                  setPriceFilterMin(clamped[0]);
                  setPriceFilterMax(clamped[1]);
                }
              }}
              data-track-action="A modificat sliderul de pret in filtre."
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            {t('filters.productsShown', { count: filteredProducts.length })}
          </p>
        </div>

        <div className="mb-2">
          <h3 className="mb-3 font-semibold text-foreground">{t('filters.sortTitle')}</h3>
          <div className="space-y-2">
            {sortOptions.map((option) => {
              const optionLabel = getSortLabel(option);
              return (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                onClick={() => setCurrentSort(option)}
                data-track-action={`A ales sortarea ${optionLabel}.`}
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  currentSort === option
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}>
                  {currentSort === option && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <span className="text-foreground">{optionLabel}</span>
              </label>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileFilterSheet;
