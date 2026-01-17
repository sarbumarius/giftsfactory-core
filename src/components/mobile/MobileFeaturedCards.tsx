import { Star } from 'lucide-react';
import productImage from '@/assets/product-image.jpg';

const featuredCards = [
  { title: "Cel mai vândut", badge: "🔥", color: "from-emerald-400 to-emerald-600" },
  { title: "Popular", badge: "⭐⭐⭐", color: "from-orange-400 to-orange-600" },
];

const MobileFeaturedCards = () => {
  return (
    <div className="px-2 py-2">
      <div className="flex gap-3">
        {featuredCards.map((card, index) => (
          <div
            key={card.title}
            className={`relative flex-1 overflow-hidden rounded-2xl opacity-0 animate-scale-in transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]`}
            style={{ animationDelay: `${0.4 + index * 0.15}s`, animationFillMode: 'forwards' }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-90`} />
            <div className="relative p-3">
              <div className="flex items-center justify-between">
                <span className="text-lg">{card.badge}</span>
                <span className="text-xs font-semibold text-primary-foreground">{card.title}</span>
              </div>
              <div className="mt-2 overflow-hidden rounded-xl">
                <img 
                  src={productImage} 
                  alt={card.title}
                  className="h-24 w-full object-cover"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="gold-gradient mt-4 w-full rounded-full py-3 text-center font-semibold text-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]">
        ALEGE O CATEGORIE
      </button>
    </div>
  );
};

export default MobileFeaturedCards;
