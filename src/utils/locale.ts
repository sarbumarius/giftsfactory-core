const LOCALE_KEY = 'site_lang';

export type LocaleCode = 'ro' | 'en';

export const getLocale = (): LocaleCode => {
  if (typeof window === 'undefined') return 'ro';
  const stored = window.localStorage.getItem(LOCALE_KEY);
  if (stored === 'en') return 'en';
  if (stored === 'ro') return 'ro';
  return window.location.pathname.startsWith('/en') ? 'en' : 'ro';
};

export const setLocale = (locale: LocaleCode) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCALE_KEY, locale);
};

export const stripLocalePrefix = (path: string) => {
  if (path === '/en') return '/';
  if (path.startsWith('/en/')) return path.slice(3);
  return path;
};

export const withLocalePath = (path: string, locale?: LocaleCode) => {
  const lang = locale || getLocale();
  const normalized = stripLocalePrefix(path);
  if (lang !== 'en') {
    if (normalized === '/create-unique-product') return '/creeaza-produs';
    if (normalized === '/reviews') return '/recenzii';
    if (normalized === '/faq') return '/intrebari-frecvente';
    if (normalized === '/discounts') return '/reduceri';
    if (normalized === '/about-me') return '/despre-noi';
    if (normalized === '/cart') return '/cos';
    if (normalized === '/checkout') return '/plata-cos';
    return normalized;
  }
  const productPrefix = '/produs/';
  const categoryPrefix = '/categorie/';
  let mappedPath = normalized;
  if (normalized === '/produs') {
    mappedPath = '/product';
  } else if (normalized.startsWith(productPrefix)) {
    mappedPath = `/product/${normalized.slice(productPrefix.length)}`;
  } else if (normalized === '/categorie') {
    mappedPath = '/category';
  } else if (normalized.startsWith(categoryPrefix)) {
    mappedPath = `/category/${normalized.slice(categoryPrefix.length)}`;
  } else if (normalized === '/creeaza-produs') {
    mappedPath = '/create-unique-product';
  } else if (normalized === '/recenzii') {
    mappedPath = '/reviews';
  } else if (normalized === '/intrebari-frecvente') {
    mappedPath = '/faq';
  } else if (normalized === '/reduceri') {
    mappedPath = '/discounts';
  } else if (normalized === '/despre-noi') {
    mappedPath = '/about-me';
  } else if (normalized === '/cos') {
    mappedPath = '/cart';
  } else if (normalized === '/plata-cos') {
    mappedPath = '/checkout';
  }
  if (mappedPath === '/') return '/en';
  if (path.startsWith('/en/')) return mappedPath.startsWith('/en/') ? mappedPath : `/en${mappedPath}`;
  return mappedPath.startsWith('/') ? `/en${mappedPath}` : `/en/${mappedPath}`;
};
