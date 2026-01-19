import { useIsMobile } from '@/hooks/use-mobile';
import CreateUniqueProductPage from './CreateUniqueProductPage';
import DesktopCreateUniqueProductPage from './DesktopCreateUniqueProductPage';

const CreateUniqueProductPageEntry = () => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <CreateUniqueProductPage /> : <DesktopCreateUniqueProductPage />;
};

export default CreateUniqueProductPageEntry;
