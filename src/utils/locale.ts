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
  if (lang !== 'en') {
    return stripLocalePrefix(path);
  }
  const normalized = stripLocalePrefix(path);
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
  }
  if (mappedPath === '/') return '/en';
  if (path.startsWith('/en/')) return mappedPath.startsWith('/en/') ? mappedPath : `/en${mappedPath}`;
  return mappedPath.startsWith('/') ? `/en${mappedPath}` : `/en/${mappedPath}`;
};
