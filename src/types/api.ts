export interface ParentCategory {
  titlu: string;
  slug: string;
  count_produse: number;
  imagine: string;
}

export interface CategoryInfo {
  titlu: string;
  title_en?: string;
  slug: string;
  descriere: string;
  descriere_en?: string;
  imagine: string;
  nr_produse: number;
  parinte?: ParentCategory;
  is_parent: boolean;
  cupoane_active: Coupon[];
  subcategorii: Subcategory[];
  tipuri: ProductType[];
}

export interface Coupon {
  cod: string;
  discount_type: string;
  amount: string;
  discount_text: string;
  descriere: string;
  data_expirare: string;
  usage_limit: number;
  usage_count: number;
  individual_use: boolean;
  minimum_amount: string;
  maximum_amount: number;
  exclude_sale_items: boolean;
  conditii: string[];
  categorii_incluse: CategoryReference[];
  produse_incluse: ProductReference[];
  produse_excluse: ProductReference[];
  categorii_excluse: CategoryReference[];
}

export interface CategoryReference {
  id: number;
  nume: string;
  url: string;
}

export interface ProductTag {
  nume: string;
  slug: string;
}

export interface ProductCategory {
  id: number;
  titlu: string;
  slug: string;
  imagine: string;
}

export interface ProductReference {
  id: number;
  nume: string;
  url: string;
}

export interface Subcategory {
  titlu: string;
  slug: string;
  count_produse: number;
  imagine: string;
}

export interface ProductType {
  nume: string;
  slug: string;
  count: number;
  produse_slugs: string[];
}

export interface SubcategoryTreeNode {
  id: number;
  titlu: string;
  slug: string;
  imagine: string;
  nr_produse: number;
  nivel: number;
  parinte?: {
    id: number;
    titlu: string;
    slug: string;
    imagine: string;
    nr_produse: number;
  };
  subcategorii: SubcategoryTreeNode[];
}

export interface SubcategoriesResponse {
  parent: {
    id: number;
    titlu: string;
    slug: string;
    imagine: string;
    nr_produse: number;
  };
  subcategorii: SubcategoryTreeNode[];
}

export interface ProductImage {
  full: string;
  '300x300': string;
  '100x100': string;
}

export interface ProductDimension {
  lungime: string;
  latime: string;
  inaltime: string;
}

export interface ProductAttribute {
  name: string;
  slug: string;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface ProductReview {
  autor: string;
  data: string;
  rating: string;
  continut: string;
  verified: boolean;
  imagini: { thumbnail: string; full: string }[];
}

export interface ApiProduct {
  id: number;
  titlu: string;
  title_en?: string;
  clean_image?: string;
  slug: string;
  descriere?: string;
  descriere_scurta?: string;
  descriere_en?: string;
  personalizare?: ProductPersonalizareField[];
  ['texte-produs']?: string[];
  pret: string;
  pret_redus: string | null;
  end_sale: string | null;
  imagine_principala: ProductImage;
  galerie: Array<ProductImage | string>;
  rating: string;
  vanzari: number;
  dimensiune: ProductDimension;
  nr_recenzii: number;
  average_recenzii: string;
  taguri?: ProductTag[];
  attributes: ProductAttribute[];
  recenzii: ProductReview[];
}

export interface ProductPersonalizareField {
  type: 'textfield' | 'textarea' | 'checkboxes' | 'upload' | string;
  label: string;
  required: boolean;
  enabled: boolean;
  placeholder?: string;
  options?: string[];
  name: string;
  price?: string;
  price_type?: string;
  min_chars?: string;
  max_chars?: string;
  description?: string;
}

export interface ProductDetailResponse extends ApiProduct {
  descriere: string;
  descriere_scurta: string;
  categorii: ProductCategory[];
}

export interface ApiResponse {
  info: CategoryInfo;
  produse: ApiProduct[];
}

export interface MeiliCategoryHit {
  name: string;
  url: string;
  description?: string;
  count?: number;
}

export interface MeiliProductHit {
  id: number;
  title: string;
  url: string;
  tags?: string[];
  categories?: string[];
  attributes?: Record<string, string[]>;
  short_description?: string;
  description?: string;
  image?: string;
  price_html?: string;
  sku?: string;
}
