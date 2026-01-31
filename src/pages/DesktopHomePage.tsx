import DesktopSearchModal from '@/components/desktop/DesktopSearchModal';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import { getLocale, LocaleCode, setLocale, stripLocalePrefix, withLocalePath } from '@/utils/locale';
import { t } from '@/utils/translations';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, MessageCircle, Phone as PhoneIcon, Plus, Store, Mail as MailIcon } from 'lucide-react';
import GlobeHero from '@/components/desktop/GlobeHero';
import CategorySlider from '@/components/desktop/CategorySlider';
import logo from '@/assets/factorygifts.svg';
import logoDaruri from '@/assets/logo-daruri.svg';
import { useState } from 'react';

const DesktopHomePage = () => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const locale = getLocale();
  const menuItems = [
    { labelKey: 'menu.categories', href: '/categorie/gifts-factory', icon: Store },
    { labelKey: 'menu.reviews', href: '/recenzii', icon: MessageCircle },
    { labelKey: 'menu.faq', href: '/intrebari-frecvente', icon: HelpCircle },
    { labelKey: 'menu.createProduct', href: '/creeaza-produs', icon: Plus },
    { labelKey: 'menu.contact', href: '/contact', icon: PhoneIcon },
  ];

  const handleLocaleChange = (nextLocale: LocaleCode) => {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    if (typeof window === 'undefined') return;
    const path = stripLocalePrefix(window.location.pathname);
    const nextPath = withLocalePath(path === '/' ? '/' : path, nextLocale);
    window.location.assign(nextPath);
  };

  return (
    <div className="h-screen overflow-hidden">
      <main className="bg-[linear-gradient(0deg,#000,#6844c1)] relative h-full w-full overflow-hidden">
        <div
          className="absolute"
          style={{
            width: '238vw',
            height: '187vh',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '-93vh',
          }}
        >
          <GlobeHero
            className="w-full h-full opacity-75"
            data={[
              { lat: 44.4268, lng: 26.1025, city: 'Bucuresti', count: 32 },
              { lat: 46.7712, lng: 23.6236, city: 'Cluj-Napoca', count: 18 },
              { lat: 45.7489, lng: 21.2087, city: 'Timisoara', count: 14 },
              { lat: 47.1585, lng: 27.6014, city: 'Iasi', count: 12 },
              { lat: 51.5074, lng: -0.1278, city: 'London', count: 10 },
              { lat: 48.8566, lng: 2.3522, city: 'Paris', count: 9 },
              { lat: 40.7128, lng: -74.006, city: 'New York', count: 7 },
              { lat: 37.7749, lng: -122.4194, city: 'San Francisco', count: 6 },
              { lat: 52.52, lng: 13.405, city: 'Berlin', count: 8 },
              { lat: 41.9028, lng: 12.4964, city: 'Rome', count: 5 },
            ]}
          />
        </div>

        <div className="relative z-10 flex h-full w-full max-w-[1500px] flex-col items-center px-6 pt-4 pb-4 mx-auto pointer-events-none">
          {/* Top Menu */}
          <div className="w-full max-w-[1100px] pointer-events-auto mb-4">
            <div className="flex items-center justify-between gap-2 px-4 py-2 text-[11px] font-semibold text-white">
              <button
                type="button"
                onClick={() => (window.location.href = 'mailto:office@darurialese.ro')}
                className="flex items-center gap-2 rounded-full border border-white bg-white text-[#6844c1] px-3 py-1 text-[11px] font-semibold hover:bg-white/90"
              >
                <MailIcon className="h-4 w-4 text-[#6844c1]" />
                office@darurialese.ro
              </button>
              <div className="flex items-center gap-3 text-white">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.labelKey}
                      type="button"
                      onClick={() => navigate(withLocalePath(item.href))}
                      className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold hover:bg-white/20"
                    >
                      <Icon className="h-3 w-3" />
                      {t(item.labelKey)}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap text-white">
                <img src={logoDaruri} alt="Daruri Alese" className="h-4 w-auto" />
                <span className="text-[11px] font-semibold text-white">by Daruri Alese</span>
              </div>
            </div>
          </div>

          {/* Logo & Language */}
          <div className="flex flex-col items-center gap-3 drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)] pointer-events-auto">
            <img src={logo} alt="Gifts Factory" className="h-32 w-auto object-contain" />
            <div className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
              <button
                type="button"
                onClick={() => handleLocaleChange('ro')}
                className={`flex items-center gap-1 rounded-full px-2 py-1 ${locale === "ro" ? "bg-white/30" : ""}`}
              >
                <img src="/flags/ro.png" alt="RO" className="h-4 w-4" />
                RO
              </button>
              <button
                type="button"
                onClick={() => handleLocaleChange('en')}
                className={`flex items-center gap-1 rounded-full px-2 py-1 ${locale === "en" ? "bg-white/30" : ""}`}
              >
                <img src="/flags/en.png" alt="EN" className="h-4 w-4" />
                EN
              </button>
            </div>
          </div>

          {/* Category Slider */}
          <div className="flex-1 flex items-end justify-center w-full pointer-events-auto pb-8">
            <CategorySlider />
          </div>
        </div>
      </main>
      <button
        type="button"
        onClick={() => window.open('tel:0748777776', '_self')}
        className="fixed right-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white text-white bg-transparent hover:bg-white/10"
        aria-label="Suna"
      >
        <PhoneIcon className="h-6 w-6" />
      </button>
      <DesktopSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default DesktopHomePage;
