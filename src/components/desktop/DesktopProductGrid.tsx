import { products } from '@/data/products';
import DesktopProductCard from './DesktopProductCard';

const DesktopProductGrid = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Toate Produsele</h2>
        <span className="text-muted-foreground">{products.length} produse găsite</span>
      </div>
      
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <DesktopProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </div>
  );
};

export default DesktopProductGrid;
