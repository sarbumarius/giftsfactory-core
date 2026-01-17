import { useState } from 'react';
import { X } from 'lucide-react';
import { useCategoryContext } from '@/contexts/CategoryContext';

const baseIconUrl = 'https://darurialese.ro/wp-content/themes/woodmart-child/iconite/';
const iconMap: Record<string, string> = {
  Trofee: 'trofeu.svg',
  'Led-uri': 'led.svg',
  'Produse Licheni': 'lichean-01.svg',
  Rame: 'rama.svg',
  'Produse Muzicale': 'rama.svg',
  Ceasuri: 'ceas.svg',
  Felicitari: 'felicitari.svg',
  Plachete: 'placheta-01.svg',
  Magneti: 'magnet.svg',
};

const getIconImage = (nume: string): string => {
  return baseIconUrl + (iconMap[nume] || 'trofeu.svg');
};

const MobileCategoryTypeSlide = () => {
  const { data, selectedTypeSlug, setSelectedTypeSlug } = useCategoryContext();
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(null);

  const cleanTipName = (name: string) => name.replace(/^Produse\s+/i, '').trim();

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

  if (allTipuri.length === 0) return null;

  return (
    <div className="overflow-x-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex gap-2">
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
              className={`group flex flex-col items-center gap-1 flex-shrink-0 relative ${
                disabled ? 'cursor-not-allowed' : ''
              }`}
            >
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-xl border-2 border-white/80 bg-white/10 ${
                  disabled ? 'opacity-40' : ''
                }`}
                style={{
                  borderImage: isSelected
                    ? 'linear-gradient(to bottom, #fbbf24, #ffffff) 1'
                    : undefined,
                }}
              >
                <img
                  src={getIconImage(tip.iconKey)}
                  alt={label}
                  className={`h-14 w-14  ${disabled ? 'grayscale' : ''}`}
                />

                {disabled && (
                  <div className="absolute inset-0 flex items-center justify-center -mt-4">
                    <X className="h-6 w-6 text-red-400 stroke-[3]" />
                  </div>
                )}

                {tip.count > 0 && (
                  <div className="absolute top-1 right-1 bg-white text-red-600 text-[10px] font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                    {tip.count}
                  </div>
                )}
              </div>

              <span
                className={`text-[11px] font-medium ${
                  disabled ? 'text-white/40' : 'text-white/90'
                } ${isSelected ? 'text-amber-200' : ''}`}
              >
                {label}
              </span>
              {tip.isPlaceholder && (
                <span
                  className={`text-[10px] text-amber-200 ${
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
  );
};

export default MobileCategoryTypeSlide;
