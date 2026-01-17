import { useEffect, useState } from 'react';
import DesktopHeader from '@/components/desktop/DesktopHeader';
import { Mail, MapPin, Phone } from 'lucide-react';
import { termsHtml, privacyHtml } from '@/content/legal';

const DesktopContactPage = () => {
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Contact | Daruri Alese Catalog';
  }, []);

  return (
    <div className="min-h-screen bg-white pb-16">
      <DesktopHeader />

      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="grid grid-cols-[1fr_320px] gap-6 rounded-3xl border border-border bg-amber-50/40 p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Contact</p>
            <h1 className="text-3xl font-semibold text-foreground">Suntem aici sa te ajutam rapid.</h1>
            <p className="text-sm text-muted-foreground">
              Scrie-ne, suna-ne sau viziteaza-ne. Raspundem rapid in programul de lucru.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => window.open('tel:0748777776', '_self')}
                data-track-action="A apasat pe suna din contact desktop."
                className="flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white"
              >
                <Phone className="h-4 w-4" />
                0748.777.776
              </button>
              <button
                type="button"
                onClick={() => window.open('mailto:office@darurialese.ro', '_self')}
                data-track-action="A apasat pe email din contact desktop."
                className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground"
              >
                <Mail className="h-4 w-4" />
                office@darurialese.ro
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Program</p>
            <p className="mt-2 text-sm font-semibold text-foreground">Luni-Vineri 10:00 - 18:00</p>
            <p className="mt-1 text-xs text-muted-foreground">Revenim in cel mai scurt timp posibil.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-border bg-white">
              <div className="relative h-[360px] w-full">
                <iframe
                  title="Harta Daruri Alese"
                  src="https://www.google.com/maps?q=Zetarilor%2052B%2C%20Bucuresti&output=embed"
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex items-center gap-2 px-5 py-4 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-amber-700" />
                Zetarilor 52B, sediul Daruri Alese
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6">
              <p className="text-sm font-semibold text-foreground">Formular de contact</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Adresa de email"
                  defaultValue="office@darurialese.ro"
                  data-track-action="A completat emailul in contact desktop."
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <input
                  type="text"
                  placeholder="Subiect"
                  data-track-action="A completat subiectul in contact desktop."
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <textarea
                  placeholder="Mesaj"
                  rows={6}
                  data-track-action="A completat mesajul in contact desktop."
                  className="col-span-2 w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  type="button"
                  data-track-action="A trimis formularul de contact desktop."
                  className="col-span-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
                >
                  Trimite mesajul
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-6 space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Phone className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Contact customer</p>
                    <p className="mt-1 text-sm text-muted-foreground">0748.777.776</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Phone className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Telefon suplimentar</p>
                    <p className="mt-1 text-sm text-muted-foreground">0757.665.555</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Phone className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Contact manager</p>
                    <p className="mt-1 text-sm text-muted-foreground">0799.807.999 - Sarbu Marius</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <MapPin className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Adresa sediului social</p>
                    <p className="mt-1 text-sm text-muted-foreground">Aleea Livezilor nr.23 bl.12 ap.3</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <MapPin className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Punct de lucru</p>
                    <p className="mt-1 text-sm text-muted-foreground">Zetarilor 52B, Sector 5, Bucuresti</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 space-y-2">
              <p className="text-sm font-semibold text-foreground">Date identificare firma</p>
              <p className="text-sm text-muted-foreground">CUI RO37811834</p>
              <p className="text-sm text-muted-foreground">J40/9997/2017</p>
              <p className="text-sm text-muted-foreground">Administrator: Sarbu Marius Dumitru</p>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 space-y-2">
              <p className="text-sm font-semibold text-foreground">Documente legale</p>
              <button
                type="button"
                onClick={() => setActiveLegalModal('terms')}
                data-track-action="A deschis termenii si conditiile din contact desktop."
                className="w-full rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Termeni si conditii
              </button>
              <button
                type="button"
                onClick={() => setActiveLegalModal('privacy')}
                data-track-action="A deschis politica de confidentialitate din contact desktop."
                className="w-full rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Politica de confidentialitate
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeLegalModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveLegalModal(null)}
          />
          <div className="fixed left-1/2 top-16 z-50 h-[80vh] w-[min(920px,90vw)] -translate-x-1/2 rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveLegalModal(null)}
              className="absolute right-5 top-5 rounded-full border border-border bg-white p-2 text-muted-foreground shadow-sm"
              aria-label="Inchide"
            >
              X
            </button>
            <h3 className="text-base font-semibold text-foreground">
              {activeLegalModal === 'privacy' ? 'Politica de confidentialitate' : 'Termeni si conditii'}
            </h3>
            {activeLegalModal === 'terms' ? (
              <div
                className="mt-4 h-[calc(80vh-96px)] overflow-y-auto text-xs text-muted-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:mt-2 [&_ul]:mt-2 [&_ol]:mt-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: termsHtml }}
              />
            ) : privacyHtml ? (
              <div
                className="mt-4 h-[calc(80vh-96px)] overflow-y-auto text-xs text-muted-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:mt-2 [&_ul]:mt-2 [&_ol]:mt-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: privacyHtml }}
              />
            ) : (
              <div className="mt-4 text-sm text-muted-foreground">Continut in lucru.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopContactPage;
