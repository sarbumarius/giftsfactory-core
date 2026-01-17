import { useEffect, useState } from 'react';
import { Copy, X } from 'lucide-react';
import { useCategoryContext } from '@/contexts/CategoryContext';

const DesktopDiscountBanner = () => {
  const { data } = useCategoryContext();
  const coupon = data?.info.cupoane_active?.[0];
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isVisible, setIsVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!coupon?.data_expirare) return;

    const calculateTimeLeft = () => {
      const expirationDate = new Date(coupon.data_expirare.replace(' ', 'T'));
      const now = new Date();
      const diff = expirationDate.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [coupon?.data_expirare]);

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

  if (!isVisible || !coupon) return null;

  const couponCode = coupon.cod.toUpperCase();
  const timeItems = [
    { value: timeLeft.days, label: 'ZILE' },
    { value: timeLeft.hours, label: 'ORE' },
    { value: timeLeft.minutes, label: 'MIN' },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <span className="absolute inset-y-0 left-24 w-px border-l border-dashed border-amber-300" />
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-4 rounded-full bg-amber-50 p-2 hover:bg-amber-100"
          data-track-action="A inchis bannerul de reducere desktop."
          type="button"
          aria-label="Inchide banner"
        >
          <X className="h-4 w-4 text-amber-700" />
        </button>
        <div className="flex items-center gap-6">
          <div className="flex w-20 flex-col items-center">
            <div className="text-3xl font-bold text-amber-700">{coupon.amount}%</div>
            <div className="text-[10px] font-semibold text-muted-foreground">Reducere</div>
          </div>
          <div className="flex flex-1 items-center justify-between gap-6">
            <div className="flex gap-2">
              {timeItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-amber-200 px-3 py-2 text-center">
                  <div className="text-lg font-bold text-amber-700">
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Cod cupon</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                data-track-action="A deschis modalul de cupon desktop."
                className="flex items-center gap-2 rounded-full border-2 border-dashed border-amber-500 bg-amber-50 px-6 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                aria-label={`Vezi conditiile pentru cuponul ${couponCode}`}
              >
                <Copy className="h-4 w-4" />
                {couponCode}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Conditii cupon</p>
                <h2 className="text-2xl font-semibold text-foreground">{couponCode}</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                data-track-action="A inchis modalul de cupon desktop."
                className="rounded-full bg-foreground/10 p-2 transition-colors hover:bg-foreground/20"
                type="button"
                aria-label="Inchide modal"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-foreground">
              <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-50 px-4 py-3">
                <span className="text-lg font-semibold text-amber-700">{couponCode}</span>
                <button
                  type="button"
                  onClick={handleCopyCoupon}
                  data-track-action="A copiat cuponul desktop."
                  className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold uppercase text-white transition-colors hover:bg-amber-700"
                  aria-label={`Copiaza cuponul ${coupon.cod.toUpperCase()}`}
                >
                  {isCopied ? 'Copiat' : 'Copiaza'}
                </button>
              </div>
              {coupon.conditii?.length ? (
                <ul className="space-y-2">
                  {coupon.conditii.map((conditie, index) => (
                    <li key={`${conditie}-${index}`} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
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
    </div>
  );
};

export default DesktopDiscountBanner;
