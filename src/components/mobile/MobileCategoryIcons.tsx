import { useState } from 'react';
import { X } from 'lucide-react';
import { useCategoryContext } from '@/contexts/CategoryContext';

const baseIconUrl = 'https://darurialese.ro/wp-content/themes/woodmart-child/iconite/';
const iconMap: Record<string, string> = {
  'Trofee': 'trofeu.svg',
  'Led-uri': 'led.svg',
  'Produse Licheni': 'lichean-01.svg',
  'Rame': 'rama.svg',
  'Produse Muzicale': 'rama.svg',
  'Ceasuri': 'ceas.svg',
  'Felicitari': 'felicitari.svg',
  'Plachete': 'placheta-01.svg',
  'Magneti': 'magnet.svg',
};

const getIconImage = (nume: string): string => {
  return baseIconUrl + (iconMap[nume] || 'trofeu.svg');
};

const MobileCategoryIcons = () => {
  const { data, selectedTypeSlug, setSelectedTypeSlug, loading } = useCategoryContext();
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(null);

  const cleanTipName = (name: string) =>
    name.replace(/^Produse\s+/i, '').trim();

  const tipuri = data?.info?.tipuri || [];
  const iconKeys = Object.keys(iconMap);
  const allTipuri = iconKeys
    .map((iconKey) => {
      const match = tipuri.find((tip) => tip.nume === iconKey || tip.slug === iconKey);
      return {
        nume: match?.nume || iconKey,
        slug: match?.slug || `placeholder-${iconKey}`,
        count: match?.count || 0,
        produse_slugs: match?.produse_slugs || [],
        iconKey,
        isPlaceholder: !match,
      };
    })
    .sort((a, b) => {
      if (a.isPlaceholder !== b.isPlaceholder) {
        return a.isPlaceholder ? 1 : -1;
      }
      return 0;
    });

  return (
    <div className="flex gap-2 px-2 py-2">
      <div className="overflow-x-auto pl-2 pt-1 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-1">
          {allTipuri.map((tip) => {
            const disabled = tip.count === 0 || tip.isPlaceholder;
            const label = cleanTipName(tip.nume);
            const isSelected = selectedTypeSlug === tip.slug;

            return (
              <button
                key={tip.slug}
                disabled={disabled}
                onClick={() => {
                  if (tip.isPlaceholder) {
                    setActivePlaceholder(tip.slug);
                    setTimeout(() => setActivePlaceholder(null), 2000);
                    return;
                  }
                  if (disabled) return;
                  setSelectedTypeSlug(isSelected ? null : tip.slug);
                }}
                data-track-action={
                  tip.isPlaceholder
                    ? `A apasat pe tip indisponibil ${label}.`
                    : `A apasat pe tip ${label}.`
                }
                className={`group flex flex-col items-center opacity-0 animate-fade-up flex-shrink-0 relative ${
                  disabled ? 'cursor-not-allowed' : ''
                }`}
                style={{ animationFillMode: 'forwards' }}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white ${
                    disabled ? 'opacity-30' : ''
                  }`}
                  style={{
                    borderImage: isSelected
                      ? 'linear-gradient(to bottom, #f97316, #ffffff) 1'
                      : undefined,
                  }}
                >
                  <img
                    src={getIconImage(tip.iconKey)}
                    alt={label}
                    className={`h-10 w-10 invert ${disabled ? 'grayscale' : ''}`}
                  />

                  {disabled && (
                    <div className="absolute inset-0 flex items-center justify-center -mt-5">
                      <X className="h-8 w-8 text-red-500 stroke-[3]" />
                    </div>
                  )}

                  {tip.count > 0 && (
                    <div className="absolute top-1 right-1 bg-primary text-white text-[8px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                      {tip.count}
                    </div>
                  )}
                </div>

                <span
                  className={`text-xs font-medium ${
                    disabled ? 'text-muted-foreground' : 'text-foreground'
                  } ${isSelected ? 'text-primary' : ''}`}
                >
                  {label}
                </span>
                {tip.isPlaceholder && (
                  <span
                    className={`text-[10px] text-amber-700 ${
                      activePlaceholder === tip.slug ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity`}
                  >
                    In curand
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileCategoryIcons;
