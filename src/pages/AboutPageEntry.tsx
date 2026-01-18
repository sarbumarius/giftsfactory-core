import { useIsMobile } from '@/hooks/use-mobile';
import AboutPage from './AboutPage';
import DesktopWorkInProgressPage from './DesktopWorkInProgressPage';

const AboutPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <AboutPage /> : <DesktopWorkInProgressPage />;
};

export default AboutPageEntry;
