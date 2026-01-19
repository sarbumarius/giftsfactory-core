import { useIsMobile } from '@/hooks/use-mobile';
import ReviewsPage from './ReviewsPage';
import DesktopReviewsPage from './DesktopReviewsPage';

const ReviewsPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <ReviewsPage /> : <DesktopReviewsPage />;
};

export default ReviewsPageEntry;
