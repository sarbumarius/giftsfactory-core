import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, HelpCircle, Mail, MessageCircle, Phone, Plus, Store, Tag, Users } from 'lucide-react';
import logo from '@/assets/factorygifts.svg';
import logoDaruri from '@/assets/logo-daruri.svg';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { getLocale, LocaleCode, setLocale, stripLocalePrefix, withLocalePath } from '@/utils/locale';
import { t } from '@/utils/translations';

type MenuItem = {
  labelKey: string;
  href: string;
  hrefEn?: string;
  icon: React.ComponentType<{ className?: string }>;
  isDefaultCategory?: boolean;
};

interface DesktopSidebarProps {
  locale?: LocaleCode;
  onLocaleChange?: (nextLocale: LocaleCode) => void;
  onLogoClick?: () => void;
  menuItems?: MenuItem[];
  email?: string;
  phone?: string;
  showPhoneOnEn?: boolean;
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { labelKey: 'menu.categories', href: '/', icon: Store, isDefaultCategory: true },
  { labelKey: 'menu.discounts', href: '/reduceri', icon: Tag },
  { labelKey: 'menu.reviews', href: '/recenzii', icon: MessageCircle },
  { labelKey: 'menu.faq', href: '/intrebari-frecvente', icon: HelpCircle },
  { labelKey: 'menu.about', href: '/despre-mine', hrefEn: '/about-me', icon: Users },
  { labelKey: 'menu.createProduct', href: '/creeaza-produs', hrefEn: '/create-unique-product', icon: Plus },
  { labelKey: 'menu.contact', href: '/contact', icon: Phone },
];

const DesktopSidebar = ({
  locale,
  onLocaleChange,
  onLogoClick,
  menuItems,
  email = 'hello@giftfactory.ro',
  phone = '0748.777.776',
  showPhoneOnEn = false,
}: DesktopSidebarProps) => {
  const navigate = useNavigate();
  const { setCurrentSlug } = useCategoryContext();
  const currentLocale = locale ?? getLocale();
  const flagSize = 'h-5 w-5';
  const items = menuItems ?? DEFAULT_MENU_ITEMS;
  const allowPhone = currentLocale !== 'en' || showPhoneOnEn;
  const [showQuote, setShowQuote] = useState(true);

  useEffect(() => {
    const updateVisibility = () => {
      if (typeof window === 'undefined') return;
      setShowQuote(window.innerHeight >= 971);
    };
    updateVisibility();
    window.addEventListener('resize', updateVisibility);
    return () => window.removeEventListener('resize', updateVisibility);
  }, []);

  const handleLocaleChange = (nextLocale: LocaleCode) => {
    if (nextLocale === currentLocale) return;
    if (onLocaleChange) {
      onLocaleChange(nextLocale);
      return;
    }
    setLocale(nextLocale);
    if (typeof window === 'undefined') return;
    const path = stripLocalePrefix(window.location.pathname);
    const nextPath = withLocalePath(path, nextLocale);
    window.location.assign(`${nextPath}${window.location.search}${window.location.hash}`);
  };

  const quote = useMemo(() => t('sidebar.quote'), [currentLocale]);

  return (
    <aside className="sidebar1 flex min-h-full flex-col border-r border-white/20 bg-[#6844c1]">
      <div className="border-b border-white/20 p-4">
        <button
          type="button"
          onClick={() => {
            setCurrentSlug('gifts-factory');
            if (onLogoClick) {
              onLogoClick();
              return;
            }
            navigate('/');
          }}
          data-track-action="A apasat pe logo din sidebar desktop."
          className="mt-4 flex w-full items-center justify-center"
        >
          <img src={logo} alt="Daruri Alese" className="h-22 w-auto" />
        </button>
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-1 py-0.5">
            <button
              type="button"
              onClick={() => handleLocaleChange('ro')}
              data-track-action="A selectat limba RO."
              className={`overflow-hidden rounded-full transition-colors ${
                currentLocale === 'ro' ? 'bg-white/30' : 'hover:bg-white/20 opacity-20'
              }`}
              aria-label="Romana"
            >
              <img src="/flags/ro.png" alt="RO" className={`${flagSize} w-auto`} />
            </button>
            <button
              type="button"
              onClick={() => handleLocaleChange('en')}
              data-track-action="A selectat limba EN."
              className={`overflow-hidden rounded-full transition-colors ${
                currentLocale === 'en' ? 'bg-white/30' : 'hover:bg-white/20 opacity-20'
              }`}
              aria-label="English"
            >
              <img src="/flags/en.png" alt="EN" className={`${flagSize} w-auto`} />
            </button>
          </div>
        </div>
      </div>

      {showQuote && (
        <div className="px-6 pt-5 text-center text-base italic text-white/90 font-[cursive] quoteZone">
          {quote}
          <div className="mt-3 text-xs uppercase tracking-[0.3em] text-white/70">{t('sidebar.signature')}</div>
        </div>
      )}

      <div className="flex flex-1 items-center">
        <nav className="w-full divide-y divide-white/15">
          {items.map((item) => {
            const Icon = item.icon;
            const label = t(item.labelKey);
            const targetHref = currentLocale === 'en' && item.hrefEn ? item.hrefEn : item.href;
            return (
              <button
                key={item.labelKey}
                type="button"
                onClick={() => {
                  if (item.isDefaultCategory) {
                    setCurrentSlug('gifts-factory');
                  }
                  navigate(withLocalePath(targetHref));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                data-track-action={`A apasat pe ${label} in sidebar desktop.`}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
                <ChevronRight className="h-4 w-4 text-white/70" />
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto flex flex-col border-t border-white/20 p-4">
        <a
          href={`mailto:${email}`}
          data-track-action="A apasat pe email din sidebar desktop."
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
        >
          <Mail className="h-4 w-4" />
          {email}
        </a>
        {allowPhone && (
          <button
            type="button"
            onClick={() => window.open(`tel:${phone.replace(/\s+/g, '')}`, '_self')}
            data-track-action="A apasat pe suna din sidebar desktop."
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            <Phone className="h-4 w-4" />
            {phone}
          </button>
        )}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-white/70">
          <img src={logoDaruri} alt="Daruri Alese" className="h-4 w-auto" />
          by Daruri Alese
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
