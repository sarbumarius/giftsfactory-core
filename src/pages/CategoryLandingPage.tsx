import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCategoryContext } from '@/contexts/CategoryContext';
import Index from './Index';

const CategoryLandingPage = () => {
  const { slug } = useParams();
  const { setCurrentSlug } = useCategoryContext();

  useEffect(() => {
    if (slug) {
      setCurrentSlug(slug);
    }
  }, [slug, setCurrentSlug]);

  return <Index />;
};

export default CategoryLandingPage;
