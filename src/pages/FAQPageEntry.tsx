import { useIsMobile } from '@/hooks/use-mobile';
import FAQPage from './FAQPage';
import DesktopWorkInProgressPage from './DesktopWorkInProgressPage';

const FAQPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <FAQPage /> : <DesktopWorkInProgressPage />;
};

export default FAQPageEntry;
