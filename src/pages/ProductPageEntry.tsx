import { useIsMobile } from '@/hooks/use-mobile';
import ProductPage from './ProductPage';
import DesktopProductPage from './DesktopProductPage';

const ProductPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <ProductPage /> : <DesktopProductPage />;
};

export default ProductPageEntry;
