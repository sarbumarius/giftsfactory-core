import { Star, Trophy, Lightbulb, Frame, Leaf, Gift, Sparkles, Heart } from 'lucide-react';

const categoryIcons = [
  { name: "Meniu", Icon: Star, active: true },
  { name: "Trofee", Icon: Trophy },
  { name: "Leduri", Icon: Lightbulb },
  { name: "Rame", Icon: Frame },
  { name: "Licheni", Icon: Leaf },
  { name: "Cadouri", Icon: Gift },
  { name: "Noutăți", Icon: Sparkles },
  { name: "Favorite", Icon: Heart },
];

const DesktopCategoryNav = () => {
  return (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-center gap-8">
          {categoryIcons.map((category, index) => (
            <button
              key={category.name}
              className={`group flex flex-col items-center gap-2 opacity-0 animate-fade-up`}
              style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${
                category.active 
                  ? 'border-foreground bg-card shadow-md' 
                  : 'border-border bg-card group-hover:border-primary'
              }`}>
                <category.Icon className={`h-7 w-7 transition-colors ${
                  category.active ? 'text-foreground' : 'text-primary group-hover:text-primary'
                }`} />
              </div>
              <span className={`text-sm font-medium transition-colors ${
                category.active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              }`}>{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesktopCategoryNav;
