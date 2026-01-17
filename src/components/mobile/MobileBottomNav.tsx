import { Menu, MessageSquare, Phone, X, Flame } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileMenuModal from './MobileMenuModal';
import MobileCategorySheet from './MobileCategorySheet';
import { useCategoryContext } from '@/contexts/CategoryContext';
import fortuneWheel from '@/assets/fortune-wheel.png';

const navItems = [
  { icon: Menu, label: 'Meniu' },
  { icon: Flame, label: 'Reduceri' },
  { icon: null, label: 'Roteste' },
  { icon: MessageSquare, label: 'Recenzii' },
  { icon: Phone, label: 'Suna' },
];

const wheelSegments = [
  { label: '1%' },
  { label: '2%' },
  { label: '3%' },
  { label: '4%' },
  { label: '5%' },
  { label: '10%' },
  { label: '15%' },
  { label: '20%' },
  { label: '25%' },
  { label: '30%' },
  { label: '35%' },
  { label: 'Livrare gratuita' },
  { label: 'Incearca iar' },
  { label: 'Nimic' },
];

export interface MobileBottomNavRef {
  openWheel: () => void;
  openMenu: () => void;
  openCategories: () => void;
}

const MobileBottomNav = forwardRef<MobileBottomNavRef>((props, ref) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const { setCurrentSort, setCurrentSlug } = useCategoryContext();
  const navigate = useNavigate();
  const location = useLocation();

  const openMenu = () => {
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openCategories = () => {
    setCurrentSlug('gifts-factory');
    setIsCategoryOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openWheel: () => setIsWheelOpen(true),
    openMenu,
    openCategories,
  }));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="flex items-center justify-around">
          {navItems.map((item, index) => {
            const isReviewsPage = location.pathname === '/recenzii';
            const label = index === 3 && isReviewsPage ? 'Categorii' : item.label;

            return (
              <button
                key={item.label}
                onClick={() => {
                  if (index === 0) openMenu();
                  if (index === 1) {
                    setCurrentSort('reduceri');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                  if (index === 2) setIsWheelOpen(true);
                  if (index === 3) {
                    if (isReviewsPage) {
                      setCurrentSlug('gifts-factory');
                      setIsCategoryOpen(true);
                    } else {
                      navigate('/recenzii');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }
                  if (index === 4) window.open('tel:0748777776', '_self');
                }}
                data-track-action={`A apasat pe ${label} din bottom nav.`}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all hover:scale-110 active:scale-95 ${
                  index === 2 ? 'relative -mt-5' : ''
                }`}
              >
                {index === 2 ? (
                  <div className="gold-gradient flex h-12 w-12 items-center justify-center rounded-full shadow-lg">
                    <img
                      src={fortuneWheel}
                      alt="Roata Norocului"
                      className="h-11 -mt-1 invert"
                    />
                  </div>
                ) : (
                  item.icon && <item.icon className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-[10px] ${index === 2 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <MobileMenuModal
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onOpenCategories={() => {
          setCurrentSlug('gifts-factory');
          setIsCategoryOpen(true);
        }}
      />
      <MobileCategorySheet isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} />
      <MobileWheelModal
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
      />
    </>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';

export default MobileBottomNav;

interface MobileWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileWheelModal = ({ isOpen, onClose }: MobileWheelModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelWrapRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const angRef = useRef(0);
  const angVelRef = useRef(0);
  const spinningRef = useRef(false);
  const [spinsLeft, setSpinsLeft] = useState(2);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sectors = useMemo(
    () =>
      wheelSegments.map((segment, index) => ({
        ...segment,
        color: [
          '#f97316',
          '#f59e0b',
          '#84cc16',
          '#22c55e',
          '#14b8a6',
          '#0ea5e9',
          '#6366f1',
          '#a855f7',
          '#ec4899',
          '#f43f5e',
          '#8b5cf6',
        ][index % 11],
        text: '#ffffff',
      })),
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    setSpinsLeft(2);
    setSpinning(false);
    setResult(null);
    angRef.current = 0;
    angVelRef.current = 0;
    spinningRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = wheelWrapRef.current?.clientWidth || canvas.width;
    canvas.width = size;
    canvas.height = size;
    const rad = size / 2;
    const arc = (Math.PI * 2) / sectors.length;

    const drawSector = (sector: { color: string; text: string; label: string }, index: number) => {
      const ang = arc * index;
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = sector.color;
      ctx.moveTo(rad, rad);
      ctx.arc(rad, rad, rad, ang, ang + arc);
      ctx.lineTo(rad, rad);
      ctx.fill();

      ctx.translate(rad, rad);
      ctx.rotate(ang + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = sector.text;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(sector.label, rad - 10, 6);
      ctx.restore();
    };

    ctx.clearRect(0, 0, size, size);
    sectors.forEach(drawSector);

    const rotate = () => {
      canvas.style.transform = `rotate(${angRef.current - Math.PI / 2}rad)`;
    };

    const frame = () => {
      if (!angVelRef.current && spinningRef.current) {
        const index = Math.floor(sectors.length - (angRef.current / (Math.PI * 2)) * sectors.length) % sectors.length;
        setResult(sectors[index].label);
        setSpinning(false);
        spinningRef.current = false;
      }

      angVelRef.current *= 0.991;
      if (angVelRef.current < 0.002) angVelRef.current = 0;
      angRef.current = (angRef.current + angVelRef.current) % (Math.PI * 2);
      rotate();
      animationRef.current = window.requestAnimationFrame(frame);
    };

    rotate();
    animationRef.current = window.requestAnimationFrame(frame);

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, sectors]);

  const handleSpin = () => {
    if (spinning || spinsLeft <= 0) return;
    if (angVelRef.current) return;
    setSpinning(true);
    setResult(null);
    setSpinsLeft((prev) => Math.max(0, prev - 1));
    angVelRef.current = Math.random() * (0.45 - 0.25) + 0.25;
    spinningRef.current = true;
  };
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 text-white">
        <div className="w-full max-w-[360px] p-1">
          <div className="w-full text-center text-2xl font-serif mb-2">
            Roata Norocului
          </div>
          <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-white/10 absolute top-4 right-4"
              aria-label="Inchide"
          >
            <X className="h-8 w-8 text-white" />
          </button>

          <div className="relative mt-2 flex items-center justify-center">
            <div className="absolute -top-3 h-0 w-0 border-l-[12px] border-r-[12px] border-b-[18px] border-l-transparent border-r-transparent border-b-white" />
            <div ref={wheelWrapRef} className="relative w-[90vw] aspect-square overflow-hidden rounded-full">
              <canvas ref={canvasRef} className="block h-full w-full" />
              <button
                type="button"
                onClick={handleSpin}
                disabled={spinning || spinsLeft <= 0}
                className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-foreground shadow-[0_0_0_6px_rgba(255,255,255,0.35)] disabled:opacity-60"
              >
                ROTESTE
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-white">
            {result ? `Ai primit: ${result}` : 'Apasa pentru a roti roata.'}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-center text-[11px] text-white/80">
              Maxim 2 rotiri.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
