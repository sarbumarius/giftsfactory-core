import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Phone, Search, Sparkles } from 'lucide-react';
import DesktopHeader from '@/components/desktop/DesktopHeader';

interface FaqItem {
  intrebare: string;
  raspuns: string;
}

type AiState =
  | { status: 'idle' }
  | { status: 'loading'; question: string }
  | { status: 'done'; question: string; answer: string }
  | { status: 'error'; question: string };

const DesktopFAQPage = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [aiState, setAiState] = useState<AiState>({ status: 'idle' });

  useEffect(() => {
    document.title = 'Intrebari frecvente | Daruri Alese Catalog';
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
    <div className="min-h-screen bg-white pb-16">
      <DesktopHeader />

      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="grid grid-cols-[1.3fr_0.7fr] gap-8">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-amber-50/40 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Intrebari frecvente</p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">Gaseste rapid raspunsul potrivit.</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Cauta in baza noastra de intrebari sau intreaba direct.
              </p>
              <div className="relative mt-4">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
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
                  className="w-full rounded-full border border-border bg-white py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>

            {loading && (
              <div className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
                Se incarca intrebarile...
              </div>
            )}

            {!loading && aiState.status === 'idle' && filteredFaqs.length === 0 && query.trim().length === 0 && (
              <div className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
                Nu s-au gasit intrebari.
              </div>
            )}

            {aiState.status !== 'idle' && (
              <div className="rounded-2xl border border-border bg-white p-5">
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
                      className="mt-4 rounded-full px-4 py-2 text-sm font-semibold text-white"
                      style={{ backgroundImage: 'linear-gradient(90deg,#faca8c 0%,#e0a35c 50%,#cf843b 100%)' }}
                    >
                      Inapoi la intrebari
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
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <span className="text-sm font-semibold text-foreground">{faq.intrebare}</span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <div className={`overflow-hidden transition-all ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div
                          className="px-5 pb-4 text-sm text-muted-foreground prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: faq.raspuns }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {showNoResults && (
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="text-sm text-muted-foreground">Nu am gasit rezultate pentru cautarea ta.</p>
                <button
                  type="button"
                  onClick={askAi}
                  data-track-action="A cautat cu AI in FAQ."
                  className="mt-4 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundImage: 'linear-gradient(90deg,#faca8c 0%,#e0a35c 50%,#cf843b 100%)' }}
                >
                  <Sparkles className="h-4 w-4" />
                  Cauta cu AI
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-6">
              <p className="text-sm font-semibold text-foreground">Nu ai gasit raspunsul?</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Trimite-ne intrebarea ta si te ajutam in cel mai scurt timp.
              </p>
              <button
                type="button"
                onClick={askAi}
                data-track-action="A cautat cu AI in FAQ."
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundImage: 'linear-gradient(90deg,#faca8c 0%,#e0a35c 50%,#cf843b 100%)' }}
              >
                <Sparkles className="h-4 w-4" />
                Intreaba seful
              </button>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact rapid</p>
              <button
                type="button"
                onClick={() => window.open('tel:0748777776', '_self')}
                data-track-action="A apasat pe contact telefonic in FAQ."
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white"
                style={{ backgroundImage: 'linear-gradient(135deg, #c89b59, #f5d5a8)' }}
              >
                <Phone className="h-4 w-4" />
                Contact telefonic: 0748.777.776
              </button>
              <p className="mt-2 text-xs text-muted-foreground">Program: 10:00 - 18:00, Luni - Vineri</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopFAQPage;
