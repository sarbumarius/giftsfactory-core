import { useEffect, useState } from 'react';

export const SHOW_PROMO_BANNER = false;

const getEndOfNight = (date: Date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const formatCountdown = (totalMs: number) => {
  const totalSeconds = Math.floor(Math.max(0, totalMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const PromoBanner = () => {
  const [nightCountdown, setNightCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfNight = getEndOfNight(now);
      const diff = endOfNight.getTime() - now.getTime();
      setNightCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex -mt-3 mb-4  border-1 rounded-md relative max-w-xl border border-gray-200">
      <img
        alt="Lant Army gravat cu poza"
        loading="lazy"
        width="100"
        height="100"
        decoding="async"
        className="mb-1 rounded-md hover:opacity-80 cursor-pointer transition-all"
        src="/dogtag.webp"
      />
      <div className="ml-4 flex flex-col justify-around ">
        <div className="flex -mb-3">
          <div className="text-md font-bold tracking-wide flex items-center !text-base md:!text-lg">
            <span>Cadou</span>
          </div>
          <div
            className="text-white px-3 py-1 !text-[10px] rounded-full ml-2 h-fit place-self-center font-bold gold-gradient"
            style={{ backgroundColor: 'rgb(237, 192, 1)' }}
          >
            Oferta limitata
          </div>
        </div>
        <div className="text-md -mb-3 text-md md:text-base FONT-SERIF">Lant Army gravat cu poza</div>
        <div className="flex items-center">
          <div className="text-red-700 line-through text-sm mr-2">85 RON</div>
          <div className="text-green-500  px-3 py-0.5 rounded-full text-md !text-sm mr-3 tracking-wide font-bold">
            GRATUIT
          </div>
          <div className="text-secondary text-sm tabular-nums absolute right-1 bottom-0">{nightCountdown}</div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
