import { ApiResponse, MeiliCategoryHit, MeiliProductHit, SubcategoriesResponse, ProductDetailResponse } from '@/types/api';

const API_BASE_URL = 'https://darurialese.com/wp-json/sarbu/api-landing';
const MEILI_HOST = 'https://meilisearch-y0cgow4w4k044ksw8w0sooco.darurialese.ro';
const MEILI_API_KEY = '4ijKcmnULxLNaoJV3RSxIDdoY0kgl7Ug';

const CATEGORY_TTL_MS = 5 * 60 * 1000;
const categoryCache = new Map<
  string,
  { data: ApiResponse; expiresAt: number; inflight?: Promise<ApiResponse> }
>();

const parseJsonResponse = async <T>(response: Response, source: string): Promise<T> => {
  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    const preview = raw.slice(0, 120).replace(/\s+/g, ' ').trim();
    throw new Error(`Invalid JSON from ${source}: ${preview || 'empty response'}`);
  }
};

export const fetchCategoryData = async (slug: string): Promise<ApiResponse> => {
  const cacheUrl = `/cache_app/categorii/${slug}.json`;
  const apiUrl = `${API_BASE_URL}/categorii/${slug}`;

  const fetchWithValidation = async (url: string, source: string) => {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    return parseJsonResponse<ApiResponse>(response, source);
  };

  try {
    return await fetchWithValidation(cacheUrl, 'category cache');
  } catch (cacheError) {
    console.warn(`Cache fetch failed for ${slug}, falling back to API.`, cacheError);
    return fetchWithValidation(apiUrl, 'category API');
  }
};

export const fetchCategoryDataCached = async (slug: string): Promise<ApiResponse> => {
  const cached = categoryCache.get(slug);
  const now = Date.now();

  if (cached?.data && cached.expiresAt > now) {
    return cached.data;
  }

  if (cached?.inflight) {
    return cached.inflight;
  }

  const inflight = fetchCategoryData(slug)
    .then((data) => {
      categoryCache.set(slug, { data, expiresAt: now + CATEGORY_TTL_MS });
      return data;
    })
    .catch((error) => {
      categoryCache.delete(slug);
      throw error;
    });

  categoryCache.set(slug, { data: cached?.data as ApiResponse, expiresAt: 0, inflight });
  return inflight;
};

export const prefetchCategoryData = (slug: string) => {
  fetchCategoryDataCached(slug).catch(() => undefined);
};

const SUBCATEGORIES_TTL_MS = 5 * 60 * 1000;
const subcategoriesCache = new Map<
  number,
  { data: SubcategoriesResponse; expiresAt: number; inflight?: Promise<SubcategoriesResponse> }
>();

export const fetchSubcategories = async (parentId: number): Promise<SubcategoriesResponse> => {
  try {
    const response = await fetch(`/cache_app/subcategorii.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch subcategories: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    throw error;
  }
};

export const fetchSubcategoriesCached = async (parentId: number): Promise<SubcategoriesResponse> => {
  const cached = subcategoriesCache.get(parentId);
  const now = Date.now();

  if (cached?.data && cached.expiresAt > now) {
    return cached.data;
  }

  if (cached?.inflight) {
    return cached.inflight;
  }

  const inflight = fetchSubcategories(parentId)
    .then((data) => {
      subcategoriesCache.set(parentId, { data, expiresAt: now + SUBCATEGORIES_TTL_MS });
      return data;
    })
    .catch((error) => {
      subcategoriesCache.delete(parentId);
      throw error;
    });

  subcategoriesCache.set(parentId, { data: cached?.data as SubcategoriesResponse, expiresAt: 0, inflight });
  return inflight;
};

export const prefetchSubcategories = (parentId: number) => {
  fetchSubcategoriesCached(parentId).catch(() => undefined);
};

export const fetchProductDetails = async (slug: string): Promise<ProductDetailResponse> => {
  try {
    const response = await fetch(`/cache_app/produse/${slug}.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch product details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching product details:', error);
    throw error;
  }
};

const PRODUCT_TTL_MS = 5 * 60 * 1000;
const productCache = new Map<
  string,
  { data: ProductDetailResponse; expiresAt: number; inflight?: Promise<ProductDetailResponse> }
>();

export const fetchProductDetailsCached = async (slug: string): Promise<ProductDetailResponse> => {
  const cached = productCache.get(slug);
  const now = Date.now();

  if (cached?.data && cached.expiresAt > now) {
    return cached.data;
  }

  if (cached?.inflight) {
    return cached.inflight;
  }

  const inflight = fetchProductDetails(slug)
    .then((data) => {
      productCache.set(slug, { data, expiresAt: now + PRODUCT_TTL_MS });
      return data;
    })
    .catch((error) => {
      productCache.delete(slug);
      throw error;
    });

  productCache.set(slug, { data: cached?.data as ProductDetailResponse, expiresAt: 0, inflight });
  return inflight;
};

export const prefetchProductDetails = (slug: string) => {
  fetchProductDetailsCached(slug).catch(() => undefined);
};

export const searchMeili = async (
  term: string,
  categoriesLimit = 10,
  productsLimit = 100
): Promise<{ categories: MeiliCategoryHit[]; products: MeiliProductHit[] }> => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${MEILI_API_KEY}`,
  };

  try {
    const [categoriesResponse, productsResponse] = await Promise.all([
      fetch(`${MEILI_HOST}/indexes/categories/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ q: term, limit: categoriesLimit }),
      }),
      fetch(`${MEILI_HOST}/indexes/products/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ q: term, limit: productsLimit }),
      }),
    ]);

    const categoriesJson = categoriesResponse.ok ? await categoriesResponse.json() : { hits: [] };
    const productsJson = productsResponse.ok ? await productsResponse.json() : { hits: [] };

    return {
      categories: Array.isArray(categoriesJson.hits) ? categoriesJson.hits : [],
      products: Array.isArray(productsJson.hits) ? productsJson.hits : [],
    };
  } catch (error) {
    console.error('Error searching Meilisearch:', error);
    return { categories: [], products: [] };
  }
};
