import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MobileProductHeader from '@/components/mobile/MobileProductHeader';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';
import { ArrowLeft } from 'lucide-react';
import { termsHtml, privacyHtml } from '@/content/legal';

const ContactPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const { setCurrentSlug } = useCategoryContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const scheduleVariant: 1 | 2 | 3 = 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white pb-28">
      <MobileProductHeader
        title="Contact"
        onBack={() => navigate(-1)}
        centerTitle
        onMenuClick={() => setIsMenuOpen(true)}
        onLogoClick={() => {
          setCurrentSlug('cadouri-profesii');
          navigate('/');
        }}
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        onCartClick={() => navigate('/cos')}
        onWishlistClick={() => navigate('/wishlist')}
      />

      <div className="px-4 pt-4 space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="relative h-48 w-full">
            <iframe
              title="Harta Daruri Alese"
              src="https://www.google.com/maps?q=Zetarilor%2052B%2C%20Bucuresti&output=embed"
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="px-4 py-3 text-sm font-semibold text-foreground">
            Zetarilor 52b, sediul Perfect Gift SRL
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Program</p>
            <p className="text-sm font-semibold text-foreground">Luni-Vineri 10:00 - 18:00</p>
          </div>
          <button
              type="button"
              onClick={() => window.open('tel:0748777776', '_self')}
              data-track-action="A apasat pe suna din program contact."
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Suna acum
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 space-y-2">




          <div>
            <p className="text-sm font-semibold text-foreground">Contact customer</p>
            <p className="mt-1 text-sm text-muted-foreground">0748.777.776</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Telefon suplimentar</p>
            <p className="mt-1 text-sm text-muted-foreground">0757.665.555</p>
          </div>
        </div>


        <div className="rounded-2xl border border-border bg-white p-4 hidden">
          <p className="text-sm font-semibold text-foreground">Contact manager</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="mr-2">👤</span>
            0799.807.999 - Sarbu Marius
          </p>
        </div>



        <div className="rounded-2xl border border-border bg-white p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Adresa sediului social</p>
            <p className="mt-1 text-sm text-muted-foreground">Aleea Livezilor nr.23 bl.12 ap.3</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Punct de lucru</p>
            <p className="mt-1 text-sm text-muted-foreground">Zetarilor 52b, Sector 5, Bucuresti</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Date identificare firma</p>
          <p className="text-sm text-muted-foreground">CUI RO37811834</p>
          <p className="text-sm text-muted-foreground">J40/9997/2017</p>
          <p className="text-sm text-muted-foreground">Administrator: Sarbu Marius Dumitru</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-sm font-semibold text-foreground">Formular de contact</p>
          <div className="mt-3 space-y-3">
            <input
              type="email"
              placeholder="Adresa de email"
              defaultValue="office@darurialese.ro"
              data-track-action="A completat emailul in contact."
              className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Subiect"
              data-track-action="A completat subiectul in contact."
              className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              placeholder="Mesaj"
              rows={5}
              data-track-action="A completat mesajul in contact."
              className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              data-track-action="A trimis formularul de contact."
              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              Trimite
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Documente legale</p>
          <button
            type="button"
            onClick={() => setActiveLegalModal('terms')}
            data-track-action="A deschis termenii si conditiile din contact."
            className="w-full rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Termeni si conditii
          </button>
          <button
            type="button"
            onClick={() => setActiveLegalModal('privacy')}
            data-track-action="A deschis politica de confidentialitate din contact."
            className="w-full rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Politica de confidentialitate
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => window.open('tel:0748777776', '_self')}
          data-track-action="A apasat pe suna in contact."
          className="w-full rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
        >
          Suna 0748.777.776
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate(-1)}
        data-track-action="A apasat inapoi din contact."
        className="fixed left-0 top-[75%] z-40 flex h-12 w-10 items-center justify-center rounded-r-md border-r border-border bg-white text-muted-foreground shadow"
        aria-label="Inapoi"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {activeLegalModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveLegalModal(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 h-[80vh] rounded-t-2xl bg-white p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveLegalModal(null)}
              className="absolute right-4 top-4 rounded-full border border-border bg-white p-2 text-muted-foreground shadow-sm"
              aria-label="Inchide"
            >
              A-
            </button>
            <h3 className="text-base font-semibold text-foreground">
              {activeLegalModal === 'privacy' ? 'Politica de confidentialitate' : 'Termeni si conditii'}
            </h3>
            {activeLegalModal === 'terms' ? (
              <div
                className="mt-3 h-[calc(80vh-96px)] overflow-y-auto text-xs text-muted-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:mt-2 [&_ul]:mt-2 [&_ol]:mt-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: termsHtml }}
              />
            ) : privacyHtml ? (
              <div
                className="mt-3 h-[calc(80vh-96px)] overflow-y-auto text-xs text-muted-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:mt-2 [&_ul]:mt-2 [&_ol]:mt-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: privacyHtml }}
              />
            ) : (
              <div className="mt-3 text-sm text-muted-foreground">Continut in lucru.</div>
            )}
          </div>
        </>
      )}

      <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default ContactPage;
