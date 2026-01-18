import { X, Phone, Mail, Home, Store, Tag, Users, Calendar, BookOpen, MessageCircle, HelpCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/factorygifts.svg';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { withLocalePath } from '@/utils/locale';
import { t } from '@/utils/translations';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCategories?: () => void;
}

const menuItems = [
  { labelKey: 'menu.categories', href: '#', icon: Store, isDefaultCategory: true },
  { labelKey: 'menu.discounts', href: '/reduceri', icon: Tag },
  // { labelKey: 'menu.calendar', href: '#', icon: Calendar },
  { labelKey: 'menu.reviews', href: '/recenzii', icon: MessageCircle },
  { labelKey: 'menu.faq', href: '/intrebari-frecvente', icon: HelpCircle },
  { labelKey: 'menu.contact', href: '/contact', icon: Phone },
];

const MobileMenuModal = ({ isOpen, onClose, onOpenCategories }: MobileMenuModalProps) => {
  const navigate = useNavigate();
  const { setCurrentSlug } = useCategoryContext();

  if (!isOpen) return null;

  return (
    <>
      {/* Blur Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="gold-gradient rounded-2xl shadow-2xl w-full max-w-[280px] pointer-events-auto animate-scale-in overflow-hidden">
          {/* Header cu Close Button */}
          <div className="flex justify-end p-4 pb-0">
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center px-6 pb-6">
            <img
              src={logo}
              alt="Daruri Alese"
              className="h-28 w-auto"
            />
          </div>

          {/* Menu Items */}
          <div className="px-2 pb-4">
            <nav className="flex flex-col gap-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const label = t(item.labelKey);
                const handleClick = () => {
                  if (item.isDefaultCategory) {
                    if (onOpenCategories) {
                      onOpenCategories();
                      onClose();
                      return;
                    }
                    setCurrentSlug('gifts-factory');
                    navigate(withLocalePath('/'));
                    onClose();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }

                  if (item.href.startsWith('/')) {
                    navigate(withLocalePath(item.href));
                    onClose();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                };
                const isButton = Boolean(item.isDefaultCategory) || item.href.startsWith('/');

                return (
                  isButton ? (
                    <button
                      key={label}
                      type="button"
                      onClick={handleClick}
                      data-track-action={`A apasat pe ${label} in meniu.`}
                      className="py-2 px-5 border border-t-1 border-b-0  border-[#000]/10 border-l-0 border-r-0 flex items-center justify-between gap-2 text-left text-white hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                      <ChevronRight className="h-4 w-4 text-white" />
                    </button>
                  ) : (
                    <a
                      key={label}
                      href={item.href}
                      data-track-action={`A apasat pe ${label} in meniu.`}
                      className="py-2 px-5 border border-t-1 border-b-0 border-l-0 border-r-0 flex items-center justify-between gap-2 text-left text-foreground hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )
                );
              })}
            </nav>
          </div>

          {/* Separator */}
          <div className="px-6 pb-4">
            <div className=" my-2"></div>

            {/* Conecteaza-te */}
            <a
              href="tel:0748777776"
              data-track-action="A apasat pe telefon in meniu."
              className="mb-3 flex items-center gap-2 py-3 px-4 text-left bg-white text-[#6844c1] font-semibold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
            >
              <Phone className="h-4 w-4" />
              {t('menu.call')}
            </a>

            <a
              href="mailto:hello@sweetgifts.ro"
              data-track-action="A apasat pe email in meniu."
              className="flex items-center gap-2 py-2.5 px-4 text-left rounded-lg bg-muted/40 text-xs font-semibold text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mail className="h-4 w-4" />
              {t('menu.email')}
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenuModal;
