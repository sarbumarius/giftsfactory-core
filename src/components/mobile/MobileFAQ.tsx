import { useState } from 'react';
import { HelpCircle, X, ChevronDown, Search, Phone } from 'lucide-react';
import { faqItems } from '@/data/products';

const MobileFAQ = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
            data-track-action="A inchis FAQ."
          />
          <div className="fixed inset-x-0 bottom-0 top-12 z-50 flex flex-col bg-card shadow-2xl animate-slide-up">
            <button 
              onClick={() => setIsOpen(false)}
              data-track-action="A inchis FAQ."
              className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-muted"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>

            <div className="gold-gradient p-6">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-foreground" />
                <h2 className="text-xl font-bold text-foreground">Întrebări frecvente</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Caută o întrebare..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-track-action="A cautat in FAQ"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                {filteredFaq.map((item, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <button
                      onClick={() => setOpenItem(openItem === index ? null : index)}
                      data-track-action={`A deschis intrebarea: ${item.question}`}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <span className="pr-4 font-medium text-foreground">{item.question}</span>
                      <ChevronDown 
                        className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${
                          openItem === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openItem === index && (
                      <div className="border-t border-border bg-muted/50 p-4 animate-fade-in">
                        <p className="text-sm text-muted-foreground">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border p-4">
              <div className="gold-gradient rounded-xl p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-foreground" />
                  <span className="font-medium text-foreground">Ai nevoie de ajutor?</span>
                </div>
                <a 
                  href="tel:0748777777"
                  data-track-action="A apasat pe telefon din FAQ."
                  className="block rounded-lg bg-foreground py-3 text-center text-lg font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  SUNĂ ✆ 0748.77.77.77
                </a>
                <p className="mt-2 text-center text-xs text-foreground/80">
                  Program de lucru: 10:00 - 18:00, Luni - Vineri
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileFAQ;
