import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Sparkles, Phone } from 'lucide-react';
import MobileProductHeader from '@/components/mobile/MobileProductHeader';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import MobileMenuModal from '@/components/mobile/MobileMenuModal';

interface FaqItem {
  intrebare: string;
  raspuns: string;
}

type AiState =
  | { status: 'idle' }
  | { status: 'loading'; question: string }
  | { status: 'done'; question: string; answer: string }
  | { status: 'error'; question: string };

const FAQPage = () => {
  const navigate = useNavigate();
  const { cart, wishlist } = useShopContext();
  const { setCurrentSlug } = useCategoryContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [aiState, setAiState] = useState<AiState>({ status: 'idle' });

  useEffect(() => {
    let isMounted = true;

    fetch('https://crm.actium.ro/api/intrebari-frecvente')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setFaqs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setFaqs([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFaqs = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return faqs;
    return faqs.filter((faq) => {
      const question = faq.intrebare?.toLowerCase() || '';
      const answer = faq.raspuns?.toLowerCase() || '';
      return question.includes(trimmed) || answer.includes(trimmed);
    });
  }, [faqs, query]);

  const showNoResults = !loading && query.trim().length > 0 && filteredFaqs.length === 0 && aiState.status === 'idle';

  const askAi = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setAiState({ status: 'loading', question: trimmed });

    fetch('https://crm.actium.ro/api/intreb-seful', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intrebare: trimmed }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.raspuns) {
          setAiState({ status: 'done', question: trimmed, answer: data.raspuns });
          if (window.rybbit?.event) {
            window.rybbit.event(`Seful a raspuns: ${data.raspuns}`);
          }
          return;
        }
        setAiState({ status: 'error', question: trimmed });
      })
      .catch(() => {
        setAiState({ status: 'error', question: trimmed });
      });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (aiState.status !== 'idle') {
      setAiState({ status: 'idle' });
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <MobileProductHeader
        title="Intrebari frecvente"
        onBack={() => navigate(-1)}
        centerTitle
        onMenuClick={() => setIsMenuOpen(true)}
        onLogoClick={() => {
          setCurrentSlug('gifts-factory');
          navigate('/');
        }}
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        onCartClick={() => navigate('/cos')}
        onWishlistClick={() => navigate('/wishlist')}
      />

      <div className="px-4 pt-4">
        {loading && (
          <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
            Se incarca intrebarile...
          </div>
        )}

        {!loading && aiState.status === 'idle' && filteredFaqs.length === 0 && query.trim().length === 0 && (
          <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
            Nu s-au gasit Intrebari...
          </div>
        )}

        {aiState.status !== 'idle' && (
          <div className="rounded-2xl border border-border bg-white p-4">
            <p className="text-sm font-semibold text-foreground">Ai intrebat:</p>
            <p className="mt-1 text-sm text-muted-foreground">{aiState.question}</p>
            {aiState.status === 'loading' && (
              <p className="mt-4 text-sm font-semibold text-amber-600">Cautam raspunsul...</p>
            )}
            {aiState.status === 'error' && (
              <p className="mt-4 text-sm font-semibold text-red-500">Eroare de retea. Incearca mai tarziu.</p>
            )}
        {aiState.status === 'done' && (
          <>
            <p className="mt-4 text-sm font-semibold text-emerald-600">Daruri Alese raspunde:</p>
            <div
              className="mt-2 text-sm text-foreground whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: aiState.answer }}
            />
            <button
              type="button"
              onClick={() => setAiState({ status: 'idle' })}
              data-track-action="A revenit la lista de intrebari."
              className="mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundImage: 'linear-gradient(90deg,#faca8c 0%,#e0a35c 50%,#cf843b 100%)' }}
            >
              Inapoi la Intrebari
            </button>
          </>
        )}
          </div>
        )}

        {aiState.status === 'idle' && filteredFaqs.length > 0 && (
          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={`${faq.intrebare}-${index}`} className="rounded-2xl border border-border bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    data-track-action={`A apasat pe intrebarea: ${faq.intrebare}`}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                  >
                    <span className="text-sm font-semibold text-foreground">{faq.intrebare}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={`overflow-hidden transition-all ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div
                      className="px-4 pb-4 text-sm text-muted-foreground prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: faq.raspuns }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showNoResults && (
          <div className="mt-6 flex flex-col items-center justify-center gap-4">
            <img
              src="https://cdn-icons-gif.flaticon.com/12544/12544447.gif"
              alt="Nu s-au gasit intrebari"
              className="h-40 w-auto"
            />
            <button
              type="button"
              onClick={askAi}
              data-track-action="A cautat cu AI in FAQ."
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundImage: 'linear-gradient(90deg,#faca8c 0%,#e0a35c 50%,#cf843b 100%)' }}
            >
              <Sparkles className="h-4 w-4" />
              Cauta cu AI
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => window.open('tel:0748777776', '_self')}
          data-track-action="A apasat pe contact telefonic in FAQ."
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold text-white"
          style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
        >
          <Phone className="h-4 w-4" />
          Contact telefonic: 0748.777.776
        </button>
        <input
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && showNoResults) {
              event.preventDefault();
              askAi();
            }
          }}
          data-track-action="A cautat in FAQ"
          placeholder="Cauta in intrebari..."
          className="w-full rounded-full border border-border bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        type="button"
        onClick={() => navigate(-1)}
        data-track-action="A apasat inapoi din FAQ."
        className="fixed left-0 top-[75%] z-40 flex h-12 w-10 items-center justify-center rounded-r-md border-r border-border bg-white text-muted-foreground shadow"
        aria-label="Inapoi"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <MobileMenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default FAQPage;
