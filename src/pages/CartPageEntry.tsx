import { useIsMobile } from '@/hooks/use-mobile';
import CartPage from './CartPage';
import DesktopCartPage from './DesktopCartPage';

const CartPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <CartPage /> : <DesktopCartPage />;
};

export default CartPageEntry;
