import { useIsMobile } from '@/hooks/use-mobile';
import FAQPage from './FAQPage';
import DesktopFAQPage from './DesktopFAQPage';

const FAQPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <FAQPage /> : <DesktopFAQPage />;
};

export default FAQPageEntry;
