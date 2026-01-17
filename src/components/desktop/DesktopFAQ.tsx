import { useState } from 'react';
import { HelpCircle, X, ChevronDown, Search, Phone, MessageCircle } from 'lucide-react';
import { faqItems } from '@/data/products';

const DesktopFAQ = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-3 rounded-full bg-primary px-6 py-4 shadow-lg transition-all hover:scale-105 hover:shadow-xl animate-bounce-soft"
      >
        <MessageCircle className="h-6 w-6 text-primary-foreground" />
        <span className="font-semibold text-primary-foreground">Ajutor</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-primary-foreground">
          3
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-8 bottom-8 z-50 w-[420px] max-h-[600px] flex flex-col rounded-2xl bg-card shadow-2xl animate-scale-in overflow-hidden">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-foreground/10 z-10"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>

            <div className="gold-gradient p-6">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-7 w-7 text-foreground" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">Întrebări frecvente</h2>
                  <p className="text-sm text-foreground/80">Găsește răspunsuri rapid</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Caută o întrebare..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-3">
                {filteredFaq.map((item, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                  >
                    <button
                      onClick={() => setOpenItem(openItem === index ? null : index)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <span className="pr-4 font-medium text-foreground">{item.question}</span>
                      <ChevronDown 
                        className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${
                          openItem === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${
                      openItem === index ? 'max-h-40' : 'max-h-0'
                    }`}>
                      <div className="border-t border-border bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border p-4">
              <div className="gold-gradient rounded-xl p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-foreground" />
                  <span className="font-semibold text-foreground">Ai nevoie de ajutor?</span>
                </div>
                <a 
                  href="tel:0748777777"
                  className="block rounded-lg bg-foreground py-3 text-center text-lg font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  SUNĂ ✆ 0748.77.77.77
                </a>
                <p className="mt-2 text-center text-xs text-foreground/80">
                  Program: 10:00 - 18:00, Luni - Vineri
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DesktopFAQ;
