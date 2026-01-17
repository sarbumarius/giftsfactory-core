import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const DesktopSidebar = () => {
  const [priceRange, setPriceRange] = useState([95, 165]);
  const [sortOption, setSortOption] = useState('popularity');
  const [isOpen, setIsOpen] = useState(true);

  const sortOptions = [
    { value: 'popularity', label: 'După popularitate' },
    { value: 'newest', label: 'Cele mai noi' },
    { value: 'price-asc', label: 'Preț crescător' },
    { value: 'price-desc', label: 'Preț descrescător' },
  ];

  const categories = [
    { name: 'Trofee personalizate', count: 24 },
    { name: 'Rame foto', count: 18 },
    { name: 'Cadouri nași', count: 15 },
    { name: 'Plachete', count: 12 },
    { name: 'Decorațiuni', count: 8 },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-xl bg-card px-3 py-6 shadow-lg transition-all hover:px-4 hover:shadow-xl"
      >
        <div className="flex flex-col items-center gap-2">
          {isOpen ? (
            <X className="h-5 w-5 text-primary" />
          ) : (
            <SlidersHorizontal className="h-5 w-5 text-primary" />
          )}
          <span className="text-xs font-medium text-foreground" style={{ writingMode: 'vertical-rl' }}>
            {isOpen ? 'ÎNCHIDE' : 'FILTRE'}
          </span>
        </div>
      </button>

      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 z-30 h-full w-80 transform bg-card shadow-2xl transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex h-full flex-col overflow-y-auto pt-24 pb-8">
          <div className="px-6">
            <h2 className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Filtre și Sortare
            </h2>

            {/* Price Range */}
            <div className="mb-8">
              <h3 className="mb-4 font-semibold text-foreground">Interval Preț</h3>
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-lg bg-muted px-4 py-2">
                  <span className="text-primary font-bold">{priceRange[0]}</span>
                  <span className="text-muted-foreground"> RON</span>
                </div>
                <span className="text-muted-foreground">—</span>
                <div className="rounded-lg bg-muted px-4 py-2">
                  <span className="font-bold text-foreground">{priceRange[1]}</span>
                  <span className="text-muted-foreground"> RON</span>
                </div>
              </div>
              <input
                type="range"
                min="50"
                max="250"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full accent-primary h-2 rounded-full"
              />
            </div>

            {/* Categories */}
            <div className="mb-8">
              <h3 className="mb-4 font-semibold text-foreground">Categorii</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label
                    key={cat.name}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
                      <span className="text-foreground">{cat.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">({cat.count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="mb-8">
              <h3 className="mb-4 font-semibold text-foreground">Sortare Produse</h3>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                      sortOption === option.value 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {sortOption === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <span className="text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto px-6 space-y-3">
            <button className="w-full rounded-full border-2 border-border py-3 font-semibold text-foreground transition-colors hover:bg-muted">
              RESETEAZĂ
            </button>
            <button className="gold-gradient w-full rounded-full py-3 font-semibold text-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]">
              APLICĂ FILTRELE
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DesktopSidebar;
