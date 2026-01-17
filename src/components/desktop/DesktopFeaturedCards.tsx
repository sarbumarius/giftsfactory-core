import productImage from '@/assets/product-image.jpg';

const featuredCards = [
  { title: "Cel mai vândut", badge: "🔥", subtitle: "Top 10 produse preferate", color: "from-emerald-400 to-emerald-600" },
  { title: "Popular acum", badge: "⭐", subtitle: "Trending în această săptămână", color: "from-orange-400 to-orange-600" },
  { title: "Noutăți", badge: "✨", subtitle: "Produse recent adăugate", color: "from-blue-400 to-blue-600" },
];

const DesktopFeaturedCards = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-4">
      <div className="flex gap-6">
        {featuredCards.map((card, index) => (
          <div
            key={card.title}
            className={`group relative flex-1 overflow-hidden rounded-2xl cursor-pointer opacity-0 animate-scale-in transition-all duration-300 hover:scale-[1.02]`}
            style={{ animationDelay: `${0.5 + index * 0.1}s`, animationFillMode: 'forwards' }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-90`} />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{card.badge}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-foreground">{card.title}</p>
                  <p className="text-xs text-primary-foreground/80">{card.subtitle}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl">
                <img 
                  src={productImage} 
                  alt={card.title}
                  className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="gold-gradient mt-6 w-full rounded-full py-4 text-center text-lg font-bold text-foreground shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]">
        ALEGE O CATEGORIE
      </button>
    </div>
  );
};

export default DesktopFeaturedCards;
