import { useIsMobile } from '@/hooks/use-mobile';
import ContactPage from './ContactPage';
import DesktopWorkInProgressPage from './DesktopWorkInProgressPage';

const ContactPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <ContactPage /> : <DesktopWorkInProgressPage />;
};

export default ContactPageEntry;
