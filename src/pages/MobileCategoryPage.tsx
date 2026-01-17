import { useState, useRef } from 'react';
import MobileHeader from '@/components/mobile/MobileHeader';
import MobileCategoryCards from '@/components/mobile/MobileCategoryCards';
import MobileDiscountBanner from '@/components/mobile/MobileDiscountBanner';
import MobileFeaturedCards from '@/components/mobile/MobileFeaturedCards';
import MobileProductGrid from '@/components/mobile/MobileProductGrid';
import MobileFilterButton from '@/components/mobile/MobileFilterButton';
import MobileFilterSheet from '@/components/mobile/MobileFilterSheet';
import MobileFAQ from '@/components/mobile/MobileFAQ';
import MobileBottomNav, { MobileBottomNavRef } from '@/components/mobile/MobileBottomNav';
import MobileScrollToTop from '@/components/mobile/MobileScrollToTop';
import { useCategoryContext } from '@/contexts/CategoryContext';

const MobileCategoryPage = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const bottomNavRef = useRef<MobileBottomNavRef>(null);
  const { data } = useCategoryContext();
  const floaterImages =
    data?.produse
      ?.map((produs) => produs.imagine_principala?.['300x300'] || produs.imagine_principala?.full)
      .filter(Boolean)
      .slice(0, 12) || [];
  const floaterRows = 1;
  const totalReviews =
    data?.produse?.reduce((sum, produs) => sum + (produs.nr_recenzii || 0), 0) || 0;
  const totalReviewsLabel = totalReviews.toLocaleString('ro-RO');

  const handleSearchClick = () => {
    bottomNavRef.current?.openWheel();
  };

  return (
    <div className="min-h-screen bg-white pb-4">
      <MobileHeader onSearchClick={handleSearchClick} />

        <div className="relative w-full cloud-chaos min-h-[18rem] flex flex-col bg-[linear-gradient(135deg,#fc134f,#780c20)] ">
          {data?.info?.imagine && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-2 -top-12 opacity-20">
              <img
                src={data.info.imagine}
                alt={data.info.titlu}
                className="max-h-[164px] max-w-[220px] object-contain invert"
                loading="lazy"
              />
            </div>
          )}
          {floaterImages.length > 0 && (
            <div className="chaos-floaters">
              {Array.from({ length: floaterRows }).map((_, rowIdx) => {
                const direction = 'left';
                const topOffset = 40;
                const rowImages = floaterImages;
                return (
                  <div
                    key={`chaos-row-${rowIdx}`}
                    className={`chaos-row chaos-row-${direction}`}
                    style={{ top: `${topOffset}%` }}
                  >
                    <div className={`chaos-track chaos-track-${direction}`}>
                      {[...rowImages, ...rowImages].map((src, idx) => (
                        <img
                          key={`float-${rowIdx}-${idx}`}
                          src={src as string}
                          alt="background floater"
                          loading="lazy"
                          className="chaos-img"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="relative z-10 bg-[#d9b35e] py-2 px-4 text-center -ml-3 -mr-3 mb-3 rounded-b-2xl">
              <a
                  href="/recenzii"
                  aria-label={`★★★★★ 5 din 5 din ${totalReviewsLabel} de reviewuri. Vezi recenzii`}
                  data-track-action="A apasat pe linkul catre recenzii."
                  className="block text-xs text-white no-underline whitespace-nowrap overflow-hidden text-ellipsis"
              >
                  <span className="text-yellow-300">★★★★★</span>
                  <span className="mx-2">5 / 5 din {totalReviewsLabel} de reviewuri • Vezi recenzii</span>
              </a>
          </div>
        <div className="relative z-10 ">

          <MobileCategoryCards
            onOpenCategories={() => bottomNavRef.current?.openCategories()}
            onOpenFilters={() => setIsFilterOpen(true)}
          />
        </div>
      </div>

      {/*<MobileFeaturedCards />*/}
      <MobileFilterButton onClick={() => setIsFilterOpen(true)} />
      <MobileDiscountBanner />
      <MobileProductGrid />
      <MobileFilterSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      <MobileFAQ />
      <MobileScrollToTop />
      <MobileBottomNav ref={bottomNavRef} />
    </div>
  );
};

export default MobileCategoryPage;
