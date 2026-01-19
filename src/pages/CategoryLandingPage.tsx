import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileCategoryPage from './MobileCategoryPage';
import DesktopCategoryPage from './DesktopCategoryPage';
import { getLocale } from '@/utils/locale';

const CategoryLandingPage = () => {
  const { slug } = useParams();
  const { setCurrentSlug } = useCategoryContext();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (slug) {
      if (getLocale() === 'en') {
        try {
          const stored = window.localStorage.getItem('slug_en_map');
          const map = stored ? (JSON.parse(stored) as Record<string, string>) : {};
          setCurrentSlug(map[slug] || slug);
          return;
        } catch {
          setCurrentSlug(slug);
          return;
        }
      }
      setCurrentSlug(slug);
    }
  }, [slug, setCurrentSlug]);

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  return isMobile ? <MobileCategoryPage /> : <DesktopCategoryPage />;
};

export default CategoryLandingPage;
