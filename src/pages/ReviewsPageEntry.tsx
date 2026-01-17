import { useIsMobile } from '@/hooks/use-mobile';
import ReviewsPage from './ReviewsPage';
import DesktopWorkInProgressPage from './DesktopWorkInProgressPage';

const ReviewsPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <ReviewsPage /> : <DesktopWorkInProgressPage />;
};

export default ReviewsPageEntry;
