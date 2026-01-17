import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCategoryContext } from '@/contexts/CategoryContext';

const BANNER_DISMISSED_KEY = 'discountBannerDismissed';

const MobileDiscountBanner = () => {
  const { data } = useCategoryContext();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const coupon = data?.info.cupoane_active?.[0];

  // Calculate time left from expiration date
  useEffect(() => {
    if (!coupon?.data_expirare) return;

    const calculateTimeLeft = () => {
      const expirationDate = new Date(coupon.data_expirare.replace(' ', 'T'));
      const now = new Date();
      const diff = expirationDate.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return { days, hours, minutes };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(timer);
  }, [coupon]);

  // Check localStorage and set delay on mount
  useEffect(() => {
    if (!coupon) return;

    const isDismissed = localStorage.getItem(BANNER_DISMISSED_KEY);

    if (isDismissed === 'true') {
      // User dismissed banner before, don't show it
      setShouldShow(false);
      return;
    }

    // Show banner after 10 seconds
    const showTimer = setTimeout(() => {
      setShouldShow(true);
      setIsVisible(true);
    }, 10000);

    return () => clearTimeout(showTimer);
  }, [coupon]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCopyCoupon = async () => {
    if (!coupon?.cod) return;
    try {
      await navigator.clipboard.writeText(coupon.cod.toUpperCase());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };

  if (!isVisible || !shouldShow || !coupon) return null;

  return (
    <>
      <div className="relative mx-2 my-2 overflow-hidden rounded-md gold-gradient p-2 opacity-0 animate-fade-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
        <button
          onClick={handleDismiss}
          data-track-action="A inchis bannerul de reducere."
          className="absolute right-2 top-2 rounded-full bg-foreground/10 p-1 transition-colors hover:bg-foreground/20"
          type="button"
          aria-label="Inchide banner"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        <div className="flex items-center gap-4 text-center">
          <div className="flex flex-col items-center bg-white bg-shadow px-2 rounded-sm text-center pb-1 pt-1">
            <span className="text-xl font-bold text-amber-700 -mb-1">{coupon.amount}%</span>
            <span className="text-[10px] text-muted-foreground">REDUCERE</span>
          </div>

          <div className="flex gap-1">
            <div className="flex flex-col items-center rounded-sm bg-gradient-to-r px-2 py-1 ">
              <span className="text-xs font-bold text-white">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[10px] text-white">ZILE</span>
            </div>
            <div className="flex flex-col items-center rounded-sm bg-gradient-to-r  px-2 py-1">
              <span className="text-xs font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] text-white">ORE</span>
            </div>
            <div className="flex flex-col items-center rounded-sm bg-gradient-to-r  px-2 py-1 ">
              <span className="text-xs font-bold text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] text-white">MIN</span>
            </div>
          </div>

          <button
            className="bg-white border border-2 border-dashed border-amber-500 ml-auto px-4 py-2"
            onClick={handleOpenModal}
            data-track-action="A deschis modalul de cupon."
            type="button"
            aria-label={`Vezi conditiile pentru cuponul ${coupon.cod.toUpperCase()}`}
          >
            <span className="font-bold text-amber-700">{coupon.cod.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Conditii cupon</p>
                <h2 className="text-lg font-semibold text-foreground">{coupon.cod.toUpperCase()}</h2>
              </div>
              <button
                onClick={handleCloseModal}
                data-track-action="A inchis modalul de cupon."
                className="rounded-full bg-foreground/10 p-1 transition-colors hover:bg-foreground/20"
                type="button"
                aria-label="Inchide modal"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-sm text-foreground">
              <div className="flex items-center justify-between gap-3 rounded-md border-2 border-dashed border-amber-500 bg-amber-50 px-3 py-2">
                <span className="text-base font-semibold text-amber-700">{coupon.cod.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={handleCopyCoupon}
                  data-track-action="A copiat cuponul."
                  className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold uppercase text-white transition-colors hover:bg-amber-700"
                  aria-label={`Copiaza cuponul ${coupon.cod.toUpperCase()}`}
                >
                  {isCopied ? 'Copiat' : 'Copiaza'}
                </button>
              </div>
              {coupon.conditii?.length ? (
                <ul className="space-y-1">
                  {coupon.conditii.map((conditie, index) => (
                    <li key={`${conditie}-${index}`} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>{conditie}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nu sunt conditii disponibile pentru acest cupon.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileDiscountBanner;
