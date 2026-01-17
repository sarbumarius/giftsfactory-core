import { useEffect, useMemo, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { ApiProduct } from '@/types/api';
import MobileProductCard from './MobileProductCard';

interface MobileAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ApiProduct[];
}

const MobileAssistantModal = ({ isOpen, onClose, products }: MobileAssistantModalProps) => {
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [statusIndex, setStatusIndex] = useState(0);

  const statusMessages = [
    'Fac o lista cu experientele cadou perfecte...',
    'Ma asigur ca experientele corespund cu cererea ta...',
  ];

  const suggestedProducts = useMemo(() => products.slice(0, 5), [products]);

  useEffect(() => {
    if (!isOpen) return;
    setPrompt('');
    setPhase('idle');
    setStatusIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (phase !== 'loading') return;
    setStatusIndex(0);

    const t1 = window.setTimeout(() => setStatusIndex(1), 1200);
    const t2 = window.setTimeout(() => setPhase('ready'), 2600);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [phase]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 z-50 w-full h-[80vh] rounded-t-3xl bg-card shadow-2xl animate-fade-in flex flex-col pb-20">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Asistent AI</h2>
          </div>
          <button
            onClick={onClose}
            data-track-action="A inchis asistentul AI."
            className="rounded-full p-2 transition-colors hover:bg-muted"
            aria-label="Inchide asistentul"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Gaseste cadoul ideal pentru persoana iubita!
            </h3>
            <p className="text-sm text-muted-foreground">Pentru o persoana draga tie</p>
          </div>

          {phase === 'idle' && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Explica-i asistentului tau AI, cat mai detaliat, ce doresti sa gasesti si apoi apasa
                pe butonul Propune cadoul
              </p>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                placeholder="Ex: cadou aniversar, elegant, buget 200 RON..."
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/60 px-4 py-6 text-center">
              <p className="text-sm text-foreground">{statusMessages[statusIndex]}</p>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 border-t-primary animate-spin" />
                <span className="text-xs text-muted-foreground">Lucrez la recomandari...</span>
              </div>
            </div>
          )}

          {phase === 'ready' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Am gasit aceste produse:</p>
              {suggestedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nu am gasit produse pentru moment.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {suggestedProducts.map((product, index) => (
                    <MobileProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 left-0 w-full border-t border-border bg-card px-4 py-3 pb-6">
          <button
            type="button"
            onClick={() => {
              if (!prompt.trim() || phase === 'loading') return;
              setPhase('loading');
            }}
            disabled={!prompt.trim() || phase === 'loading' || phase === 'ready'}
            data-track-action="A cerut propuneri de cadou in asistentul AI."
            className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {phase === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                Propun cadoul...
              </span>
            ) : (
              'Propune cadoul'
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileAssistantModal;
