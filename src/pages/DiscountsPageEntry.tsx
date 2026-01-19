import { useIsMobile } from '@/hooks/use-mobile';
import DiscountsPage from './DiscountsPage';
import DesktopDiscountsPage from './DesktopDiscountsPage';

const DiscountsPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <DiscountsPage /> : <DesktopDiscountsPage />;
};

export default DiscountsPageEntry;
