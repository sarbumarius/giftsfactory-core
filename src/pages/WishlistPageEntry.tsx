import { useIsMobile } from '@/hooks/use-mobile';
import WishlistPage from './WishlistPage';
import DesktopWishlistPage from './DesktopWishlistPage';

const WishlistPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <WishlistPage /> : <DesktopWishlistPage />;
};

export default WishlistPageEntry;
