import { ProductDimension } from '@/types/api';

const normalizeDimensionValue = (value?: string | number | null) => {
  const raw = String(value ?? '').trim();
  return raw.length ? raw : null;
};

export const formatDimensions = (dimension?: Partial<ProductDimension> | null, unit = 'cm') => {
  if (!dimension) return '';
  const parts = [dimension.lungime, dimension.latime, dimension.inaltime]
    .map(normalizeDimensionValue)
    .filter((value): value is string => Boolean(value));

  if (!parts.length) return '';

  return `${parts.join(' x ')}${unit ? ` ${unit}` : ''}`;
};
