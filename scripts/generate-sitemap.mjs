import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const baseUrl = (process.env.SITE_URL || 'https://giftsfactory.ro').replace(/\/+$/, '');
const urls = new Set();

const addUrl = (pathname) => {
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }
  urls.add(`${baseUrl}${pathname}`);
};

const staticPages = [
  '/',
  '/reduceri',
  '/intrebari-frecvente',
  '/contact',
  '/recenzii',
  '/despre-mine',
  '/despre-noi',
  '/creeaza-produs',
  '/cos',
  '/plata-cos',
  '/wishlist',
  '/cont',
  '/en',
  '/en/discounts',
  '/en/faq',
  '/en/contact',
  '/en/reviews',
  '/en/about-me',
  '/en/create-unique-product',
  '/en/cart',
  '/en/checkout',
  '/en/wishlist',
  '/en/cont',
];

staticPages.forEach(addUrl);

const safeReadJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`Failed to read ${filePath}: ${error}`);
    return null;
  }
};

const categoriesDir = path.join(root, 'public', 'cache_app', 'categorii');
if (fs.existsSync(categoriesDir)) {
  const categoryFiles = fs.readdirSync(categoriesDir).filter((file) => file.endsWith('.json'));
  for (const file of categoryFiles) {
    const data = safeReadJson(path.join(categoriesDir, file));
    const info = data?.info;
    const slug = info?.slug;
    if (slug) {
      addUrl(`/categorie/${slug}`);
    }
    const slugEn = info?.slug_en || slug;
    if (slugEn) {
      addUrl(`/en/category/${slugEn}`);
    }
  }
}

const productsDir = path.join(root, 'public', 'cache_app', 'produse');
if (fs.existsSync(productsDir)) {
  const productFiles = fs.readdirSync(productsDir).filter((file) => file.endsWith('.json'));
  for (const file of productFiles) {
    const data = safeReadJson(path.join(productsDir, file));
    const slug = data?.slug;
    if (slug) {
      addUrl(`/produs/${slug}`);
    }
    const slugEn = data?.slug_en || slug;
    if (slugEn) {
      addUrl(`/en/product/${slugEn}`);
    }
  }
}

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const sortedUrls = Array.from(urls).sort();

const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sortedUrls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
  '</urlset>',
];

const outputPath = path.join(root, 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.log(`Wrote ${sortedUrls.length} URLs to ${outputPath}`);
