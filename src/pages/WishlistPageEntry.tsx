import { useIsMobile } from '@/hooks/use-mobile';
import WishlistPage from './WishlistPage';
import DesktopWorkInProgressPage from './DesktopWorkInProgressPage';

const WishlistPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <WishlistPage /> : <DesktopWorkInProgressPage />;
};

export default WishlistPageEntry;
