import { useIsMobile } from '@/hooks/use-mobile';
import CheckoutPage from './CheckoutPage';
import DesktopWorkInProgressPage from './DesktopWorkInProgressPage';

const CheckoutPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <CheckoutPage /> : <DesktopWorkInProgressPage />;
};

export default CheckoutPageEntry;
