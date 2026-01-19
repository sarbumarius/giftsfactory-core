import { useIsMobile } from '@/hooks/use-mobile';
import ContactPage from './ContactPage';
import DesktopContactPage from './DesktopContactPage';

const ContactPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <ContactPage /> : <DesktopContactPage />;
};

export default ContactPageEntry;
