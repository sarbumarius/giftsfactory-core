import { X } from 'lucide-react';
import { useCategoryContext, SortType } from '@/contexts/CategoryContext';
import MobileCategoryIcons from './MobileCategoryIcons';

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

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'popularitate', label: 'Dupa popularitate' },
    { value: 'cele-mai-noi', label: 'Cele mai noi' },
    { value: 'pret-crescator', label: 'Pret crescator' },
    { value: 'pret-descrescator', label: 'Pret descrescator' },
    { value: 'reduceri', label: 'Reduceri primele' },
  ];

  const handleMinChange = (value: number) => {
    const nextValue = Math.min(value, priceFilterMax);
    setPriceFilterMin(nextValue);
  };

  const handleMaxChange = (value: number) => {
    const nextValue = Math.max(value, priceFilterMin);
    setPriceFilterMax(nextValue);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Filtre si Sortare</h2>
          <button
            onClick={onClose}
            data-track-action="A inchis fereastra de filtre."
            className="rounded-full p-2 transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="mb-6">
          <MobileCategoryIcons />
        </div>

        <div className="mb-6">
          <h3 className="mb-3 font-semibold text-foreground">Interval Pret</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Min (RON)
              <input
                type="number"
                min={priceBounds.min}
                max={priceBounds.max}
                value={priceFilterMin}
                onChange={(event) => handleMinChange(Number(event.target.value))}
                data-track-action="A modificat pretul minim in filtre."
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Max (RON)
              <input
                type="number"
                min={priceBounds.min}
                max={priceBounds.max}
                value={priceFilterMax}
                onChange={(event) => handleMaxChange(Number(event.target.value))}
                data-track-action="A modificat pretul maxim in filtre."
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Produse afisate acum: <span className="font-semibold text-foreground">{filteredProducts.length}</span>
          </p>
        </div>

        <div className="mb-2">
          <h3 className="mb-3 font-semibold text-foreground">Sortare Produse</h3>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                onClick={() => setCurrentSort(option.value)}
                data-track-action={`A ales sortarea ${option.label}.`}
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  currentSort === option.value
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}>
                  {currentSort === option.value && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <span className="text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileFilterSheet;
