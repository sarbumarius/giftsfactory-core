import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCategoryContext } from '@/contexts/CategoryContext';
import Index from './Index';
import { getLocale } from '@/utils/locale';

const CategoryLandingPage = () => {
  const { slug } = useParams();
  const { setCurrentSlug } = useCategoryContext();

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

  return <Index />;
};

export default CategoryLandingPage;
