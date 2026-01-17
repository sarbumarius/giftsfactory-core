import { categoryCards } from '@/data/products';
import productImage from '@/assets/product-image.jpg';

const DesktopCategoryCards = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="flex gap-6">
        {categoryCards.map((card, index) => (
          <div
            key={card.id}
            className={`group relative flex-1 overflow-hidden rounded-3xl bg-card shadow-lg opacity-0 animate-scale-in cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
            style={{ animationDelay: `${index * 0.15}s`, animationFillMode: 'forwards' }}
          >
            <div className="relative h-40 overflow-hidden bg-secondary/50">
              <img 
                src={productImage} 
                alt={card.title}
                className="h-full w-full object-cover opacity-30 transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-xl font-bold text-foreground mb-3">{card.title}</h3>
              <button className="rounded-full bg-foreground px-6 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-foreground/80 hover:scale-105">
                {card.count} produse
              </button>
            </div>
          </div>
        ))}
        
        {/* Extra promotional cards for desktop */}
        <div className="group relative flex-1 overflow-hidden rounded-3xl gold-gradient shadow-lg opacity-0 animate-scale-in cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
          <div className="p-6 h-40 flex flex-col justify-between">
            <span className="text-3xl">🎁</span>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Oferte Speciale</h3>
              <p className="text-sm text-foreground/80">Descoperă reducerile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopCategoryCards;
