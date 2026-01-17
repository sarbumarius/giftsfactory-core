import { useIsMobile } from '@/hooks/use-mobile';
import MobileCategoryPage from './MobileCategoryPage';
import DesktopWorkInProgressPage from './DesktopWorkInProgressPage';

const Index = () => {
  const isMobile = useIsMobile();

  // Return the appropriate version based on screen size
  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  if (isMobile) {
    return <MobileCategoryPage />;
  }

  return <DesktopWorkInProgressPage />;
};

export default Index;
