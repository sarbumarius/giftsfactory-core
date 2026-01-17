import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const MobileScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-14 left-4 z-99999999940 flex h-10 w-10 items-center justify-center rounded-t-md bg-white transition-all hover:scale-110 active:scale-95 animate-fade-in"
    >
      <ChevronUp className="h-6 w-6 text-gray-700" />
    </button>
  );
};

export default MobileScrollToTop;
