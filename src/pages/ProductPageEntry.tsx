import { useIsMobile } from '@/hooks/use-mobile';
import ProductPage from './ProductPage';
import DesktopWorkInProgressPage from './DesktopWorkInProgressPage';

const ProductPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <ProductPage /> : <DesktopWorkInProgressPage />;
};

export default ProductPageEntry;
