import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Heart, Info, MessageCircle, Plus, Star, X } from 'lucide-react';
import DesktopHeader from '@/components/desktop/DesktopHeader';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useShopContext } from '@/contexts/ShopContext';
import { fetchProductDetailsCached } from '@/services/api';
import { ProductDetailResponse } from '@/types/api';
import { formatDimensions } from '@/utils/formatDimensions';
import { tiktokViewContent } from '@/utils/tiktok';
import { fbViewContent } from '@/utils/facebook';

const DesktopProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setCurrentSlug } = useCategoryContext();
  const { cart, wishlist, addToCart, addToWishlist, removeFromWishlist } = useShopContext();
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showPersonalizare, setShowPersonalizare] = useState(false);
  const [personalizareValues, setPersonalizareValues] = useState<Record<string, string | string[]>>({});
  const [personalizareFiles, setPersonalizareFiles] = useState<Record<string, string>>({});
  const [openSection, setOpenSection] = useState<'personalizare' | 'descriere' | 'detalii' | 'recenzii'>('personalizare');
  const [zoomReviewIndex, setZoomReviewIndex] = useState<number | null>(null);
  const reviewScrollRef = useRef<HTMLDivElement | null>(null);
  const [reviewNav, setReviewNav] = useState({ canPrev: false, canNext: false });

  useEffect(() => {
    if (!slug) return;
    let isActive = true;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'auto' });

    fetchProductDetailsCached(slug)
      .then((response) => {
        if (!isActive) return;
        setData(response);
        setLoading(false);

        const price = parseFloat(response.pret_redus || response.pret || '0');
        const priceWithoutVAT = price / 1.21;
        tiktokViewContent(String(response.id), response.titlu, priceWithoutVAT, 'RON');
        fbViewContent(String(response.id), response.titlu, priceWithoutVAT, 'RON');
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'Failed to load product');
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    const defaultTitle = 'Daruri Alese Catalog';
    const title = data.titlu ? `${data.titlu} | ${defaultTitle}` : defaultTitle;
    document.title = title;

    const rawDescription = data.descriere_scurta || data.descriere || '';
    const cleanDescription = rawDescription
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const description = cleanDescription.length > 0 ? cleanDescription.slice(0, 160) : defaultTitle;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [data]);

  const personalizareFields = useMemo(() => {
    if (!data?.personalizare?.length) return [];
    return data.personalizare.filter((field) => field.enabled !== false);
  }, [data]);

  useEffect(() => {
    if (!data?.slug) return;
    const stored = sessionStorage.getItem(`personalizare:${data.slug}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Record<string, string | string[]>;
      setPersonalizareValues(parsed);
      const hasValues = Object.values(parsed).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value)
      );
      if (hasValues) {
        setShowPersonalizare(true);
      }
    } catch {
      setPersonalizareValues({});
    }
  }, [data?.slug]);

  useEffect(() => {
    if (!data?.slug) return;
    const stored = sessionStorage.getItem(`personalizare-files:${data.slug}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Record<string, string>;
      setPersonalizareFiles(parsed);
    } catch {
      setPersonalizareFiles({});
    }
  }, [data?.slug]);

  useEffect(() => {
    if (!data?.slug) return;
    sessionStorage.setItem(`personalizare:${data.slug}`, JSON.stringify(personalizareValues));
  }, [data?.slug, personalizareValues]);

  useEffect(() => {
    if (!data?.slug) return;
    sessionStorage.setItem(`personalizare-files:${data.slug}`, JSON.stringify(personalizareFiles));
  }, [data?.slug, personalizareFiles]);

  useEffect(() => {
    if (!data?.slug) return;
    setActiveImageIndex(0);
    setShowPersonalizare(false);
    setPersonalizareValues({});
    setPersonalizareFiles({});
  }, [data?.slug]);

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('read-failed'));
      reader.readAsDataURL(file);
    });

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image-load-failed'));
      img.src = src;
    });

  const compressImage = async (file: File) => {
    const src = await readAsDataUrl(file);
    const img = await loadImage(src);
    const maxSize = 1600;
    const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const buildPersonalizarePayload = () =>
    personalizareFields
      .map((field) => {
        const value = personalizareValues[field.name];
        const file = personalizareFiles[field.name];
        if (!value && !file) return null;
        return {
          name: field.name,
          label: field.label || 'Optiune',
          type: field.type,
          value,
          file,
          options: field.options || [],
          maxChars: field.max_chars ? Number(field.max_chars) : undefined,
        };
      })
      .filter(Boolean) as Array<{
      name: string;
      label: string;
      type: string;
      value?: string | string[];
      file?: string;
      options?: string[];
      maxChars?: number;
    }>;

  const handleAddToCart = () => {
    if (!data) return;
    if (!showPersonalizare && personalizareFields.length > 0) {
      setShowPersonalizare(true);
      setOpenSection('personalizare');
      requestAnimationFrame(() => {
        const block = document.getElementById('personalizare-desktop');
        if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    const personalizarePayload = buildPersonalizarePayload();
    if (window.rybbit?.event) {
      const selections = personalizarePayload
        .map((entry) => {
          if (entry.type === 'upload' && entry.file) {
            return `${entry.label}=confidential`;
          }
          if (Array.isArray(entry.value)) {
            return `${entry.label}=${entry.value.join(', ')}`;
          }
          if (typeof entry.value === 'string' && entry.value.trim().length > 0) {
            return `${entry.label}=${entry.value.trim()}`;
          }
          return null;
        })
        .filter(Boolean)
        .join(' | ');

      window.rybbit.event('AddToCart', {
        url: window.location.href,
        product: data.titlu || 'Produs necunoscut',
        productId: data.id ?? null,
        customizations: selections.length ? selections : 'fara personalizari',
      });
    }

    addToCart({
      id: data.id,
      slug: data.slug,
      title: data.titlu,
      image: data.imagine_principala['300x300'] || data.imagine_principala.full,
      price: data.pret,
      priceReduced: data.pret_redus,
      personalizare: personalizarePayload,
    });

    sessionStorage.removeItem(`personalizare:${data.slug}`);
    sessionStorage.removeItem(`personalizare-files:${data.slug}`);
    setPersonalizareValues({});
    setPersonalizareFiles({});
    setShowPersonalizare(false);
  };

  const updateReviewNav = () => {
    const el = reviewScrollRef.current;
    if (!el) return;
    setReviewNav({
      canPrev: el.scrollLeft > 5,
      canNext: el.scrollLeft + el.clientWidth < el.scrollWidth - 5,
    });
  };

  useEffect(() => {
    updateReviewNav();
  }, [data?.recenzii]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <DesktopHeader />
        <div className="mx-auto max-w-7xl px-8 py-10">
          <div className="grid grid-cols-[1.1fr_0.9fr] gap-8 animate-pulse">
            <div className="aspect-square rounded-3xl bg-muted/60" />
            <div className="space-y-4">
              <div className="h-6 w-3/4 rounded bg-muted/60" />
              <div className="h-4 w-40 rounded bg-muted/60" />
              <div className="h-10 w-1/2 rounded bg-muted/60" />
              <div className="h-12 w-full rounded bg-muted/60" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white">
        <DesktopHeader />
        <div className="mx-auto max-w-7xl px-8 py-10">
          <p className="text-sm text-destructive">Nu am putut incarca produsul.</p>
        </div>
      </div>
    );
  }

  const price = parseFloat(data.pret);
  const reducedPrice = data.pret_redus ? parseFloat(data.pret_redus) : null;
  const hasDiscount = typeof reducedPrice === 'number' && reducedPrice !== price;
  const originalPrice = hasDiscount ? Math.max(price, reducedPrice as number) : price;
  const discountedPrice = hasDiscount ? Math.min(price, reducedPrice as number) : price;
  const discountPercent = hasDiscount
    ? Math.max(1, Math.round(((originalPrice - discountedPrice) / originalPrice) * 100))
    : 0;
  const isInWishlist = wishlist.some((item) => item.id === data.id);
  const galleryImages = (() => {
    const images: string[] = [];
    if (data.imagine_principala?.full) {
      images.push(data.imagine_principala.full);
    } else if (data.imagine_principala?.['300x300']) {
      images.push(data.imagine_principala['300x300']);
    }
    if (Array.isArray(data.galerie)) {
      data.galerie.forEach((item) => {
        if (!item) return;
        if (typeof item === 'string') {
          images.push(item);
        } else if (typeof item === 'object') {
          images.push(item.full || item['300x300'] || item['100x100']);
        }
      });
    }
    return images.filter(Boolean);
  })();

  const attributes = data.attributes
    .filter((attr) => attr.visible && attr.name !== 'Debitare nume')
    .map((attr) => ({ label: attr.name, value: attr.options?.join(', ') || '-' }));

  const dimensionValue = formatDimensions(data.dimensiune);
  if (dimensionValue) {
    attributes.unshift({ label: 'Dimensiuni', value: dimensionValue });
  }

  const reviewPhotos = data.recenzii
    .filter((review) => review.imagini?.length)
    .flatMap((review) =>
      (review.imagini || []).map((img) => ({
        url: img.full || img.thumbnail,
        author: review.autor,
      }))
    );

  return (
    <div className="min-h-screen bg-white pb-16">
      <DesktopHeader />

      <main className="mx-auto max-w-7xl px-8 py-8">
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-muted">
              {hasDiscount && (
                <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                  -{discountPercent}%
                </span>
              )}
              <img
                src={galleryImages[activeImageIndex]}
                alt={data.titlu}
                className="h-full w-full object-cover"
              />
            </div>
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    data-track-action={`A selectat imaginea ${idx + 1} din produs.`}
                    className={`relative overflow-hidden rounded-2xl border ${
                      activeImageIndex === idx ? 'border-amber-500' : 'border-border'
                    }`}
                  >
                    <img src={img} alt={data.titlu} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                {data.categorii?.[0]?.titlu || 'Categorie'}
              </div>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">{data.titlu}</h1>

              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={`star-${index}`}
                      className={`h-4 w-4 ${index < Math.round(parseFloat(data.average_recenzii || '0')) ? 'fill-amber-500' : ''}`}
                    />
                  ))}
                </div>
                <span>
                  {Number(data.average_recenzii || 0).toFixed(1)} ({data.nr_recenzii} recenzii)
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <span className="text-3xl font-semibold text-amber-700">
                  {discountedPrice.toFixed(2)} lei
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    {originalPrice.toFixed(2)} lei
                  </span>
                )}
                {dimensionValue && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {dimensionValue}
                  </span>
                )}
              </div>

              {data.descriere_scurta && (
                <div
                  className="mt-4 text-sm text-muted-foreground prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.descriere_scurta }}
                />
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  data-track-action={showPersonalizare || personalizareFields.length === 0 ? 'A adaugat produsul in cos.' : 'A deschis personalizarea produsului.'}
                  className="flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4" />
                  {showPersonalizare || personalizareFields.length === 0 ? 'Adauga in cos' : 'Personalizeaza'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isInWishlist) {
                      removeFromWishlist(data.id);
                    } else {
                      addToWishlist({
                        id: data.id,
                        slug: data.slug,
                        title: data.titlu,
                        image: data.imagine_principala['300x300'] || data.imagine_principala.full,
                      });
                    }
                  }}
                  data-track-action={`A apasat pe wishlist pentru ${data.titlu}.`}
                  className={`flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold ${
                    isInWishlist ? 'border-red-300 bg-red-50 text-red-600' : 'border-border text-foreground'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                  {isInWishlist ? 'In wishlist' : 'Adauga la wishlist'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSlug(data.categorii?.[0]?.slug || 'cadouri-ziua-indragostitilor');
                    navigate('/cos');
                    window.setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 50);
                  }}
                  data-track-action="A mers la cos din produs."
                  className="rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground"
                >
                  Vezi cos ({cart.length})
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Informatii rapide
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <Check className="h-4 w-4 text-amber-600" />
                  Productie rapida 2-3 zile
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <Check className="h-4 w-4 text-amber-600" />
                  Retur 14 zile
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <Check className="h-4 w-4 text-amber-600" />
                  Plata securizata
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <Check className="h-4 w-4 text-amber-600" />
                  Livrare rapida
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            <div id="personalizare-desktop" className="rounded-2xl border border-border bg-white p-6">
              <button
                type="button"
                onClick={() => {
                  setOpenSection('personalizare');
                  setShowPersonalizare((prev) => !prev);
                }}
                data-track-action="A deschis personalizarea produsului desktop."
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                    Personalizare
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">Personalizeaza produsul</h2>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground">
                  {showPersonalizare ? 'Ascunde' : 'Afiseaza'}
                </span>
              </button>

              {showPersonalizare && personalizareFields.length > 0 && (
                <div className="mt-5 space-y-4">
                  {personalizareFields
                    .filter((field) => !(field.type === 'checkboxes' && !field.label))
                    .map((field) => (
                      <div key={field.name} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{field.label || 'Optiune'}</span>
                          {field.required && <span className="text-xs font-semibold text-red-500">*</span>}
                        </div>
                        {field.description && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}

                        {field.type === 'textfield' && (
                          <input
                            type="text"
                            placeholder={field.placeholder || ''}
                            value={typeof personalizareValues[field.name] === 'string' ? personalizareValues[field.name] : ''}
                            onChange={(event) =>
                              setPersonalizareValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                            }
                            className="h-11 w-full rounded-xl border border-border px-4 text-sm"
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            placeholder={field.placeholder || ''}
                            maxLength={field.max_chars ? Number(field.max_chars) : undefined}
                            value={typeof personalizareValues[field.name] === 'string' ? personalizareValues[field.name] : ''}
                            onChange={(event) =>
                              setPersonalizareValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                            }
                            className="min-h-[120px] w-full resize-y rounded-xl border border-border px-4 py-3 text-sm"
                          />
                        )}

                        {field.type === 'select' && (
                          <select
                            value={typeof personalizareValues[field.name] === 'string' ? personalizareValues[field.name] : ''}
                            onChange={(event) =>
                              setPersonalizareValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                            }
                            className="h-11 w-full rounded-xl border border-border px-4 text-sm"
                          >
                            <option value="">Selecteaza</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}

                        {field.type === 'upload' && (
                          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-5">
                            <label
                              htmlFor={`upload-${field.name}`}
                              className="flex cursor-pointer flex-col items-center gap-2 text-sm font-semibold text-amber-700"
                            >
                              <Info className="h-6 w-6" />
                              Trage aici poza sau apasa pentru incarcare
                            </label>
                            <input
                              id={`upload-${field.name}`}
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;
                                compressImage(file)
                                  .then((result) => {
                                    setPersonalizareFiles((prev) => ({
                                      ...prev,
                                      [field.name]: result,
                                    }));
                                  })
                                  .catch(() => {
                                    readAsDataUrl(file).then((result) => {
                                      setPersonalizareFiles((prev) => ({
                                        ...prev,
                                        [field.name]: result,
                                      }));
                                    });
                                  });
                              }}
                            />
                            {personalizareFiles[field.name] && (
                              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-white">
                                <img src={personalizareFiles[field.name]} alt="Preview" className="w-full" />
                              </div>
                            )}
                          </div>
                        )}

                        {field.type === 'checkboxes' && (
                          <div className="grid grid-cols-2 gap-2">
                            {field.options?.map((option) => (
                              <label key={option} className="flex items-center gap-2 text-sm text-foreground">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={
                                    Array.isArray(personalizareValues[field.name])
                                      ? personalizareValues[field.name].includes(option)
                                      : false
                                  }
                                  onChange={(event) => {
                                    setPersonalizareValues((prev) => {
                                      const current = Array.isArray(prev[field.name]) ? prev[field.name] : [];
                                      const next = event.target.checked
                                        ? [...current, option]
                                        : current.filter((item) => item !== option);
                                      return { ...prev, [field.name]: next };
                                    });
                                  }}
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'descriere' ? 'personalizare' : 'descriere')}
                className="flex w-full items-center justify-between"
              >
                <h2 className="text-lg font-semibold text-foreground">Descriere produs</h2>
                <ArrowRight className={`h-4 w-4 transition-transform ${openSection === 'descriere' ? 'rotate-90' : ''}`} />
              </button>
              {openSection === 'descriere' && (
                <div
                  className="mt-4 text-sm text-muted-foreground prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.descriere }}
                />
              )}
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'detalii' ? 'personalizare' : 'detalii')}
                className="flex w-full items-center justify-between"
              >
                <h2 className="text-lg font-semibold text-foreground">Detalii tehnice</h2>
                <ArrowRight className={`h-4 w-4 transition-transform ${openSection === 'detalii' ? 'rotate-90' : ''}`} />
              </button>
              {openSection === 'detalii' && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-foreground">
                  {attributes.map((attr) => (
                    <div key={attr.label} className="rounded-xl border border-border px-3 py-2">
                      <p className="text-xs text-muted-foreground">{attr.label}</p>
                      <p className="text-sm font-semibold text-foreground">{attr.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Rezumat rapid
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pret</span>
                  <span className="font-semibold text-foreground">{discountedPrice.toFixed(2)} lei</span>
                </div>
                {hasDiscount && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Pret intreg</span>
                    <span className="line-through">{originalPrice.toFixed(2)} lei</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  data-track-action="A adaugat produsul in cos din sidebar desktop."
                  className="mt-2 w-full rounded-full bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
                >
                  Adauga in cos
                </button>
              </div>
            </div>

            {data.categorii?.length > 0 && (
              <div className="rounded-2xl border border-border bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Categorii
                </p>
                <div className="mt-4 space-y-2">
                  {data.categorii.slice(0, 4).map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setCurrentSlug(category.slug);
                        navigate(`/categorie/${category.slug}`);
                      }}
                      data-track-action={`A deschis categoria ${category.titlu} din produs.`}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 text-left text-sm font-semibold text-foreground"
                    >
                      <img src={category.imagine} alt={category.titlu} className="h-8 w-8 object-contain" />
                      <span>{category.titlu}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
        <div className="mt-10 rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Recenzii clienti</h2>
            <button
              type="button"
              onClick={() => setOpenSection('recenzii')}
              className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground"
            >
              {data.nr_recenzii} recenzii
            </button>
          </div>

          {reviewPhotos.length > 0 && (
            <div className="mt-4">
              <div className="relative">
                {reviewNav.canPrev && (
                  <button
                    type="button"
                    onClick={() => reviewScrollRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}
                    className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-white p-2 shadow"
                    aria-label="Poze precedente"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                {reviewNav.canNext && (
                  <button
                    type="button"
                    onClick={() => reviewScrollRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}
                    className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-white p-2 shadow"
                    aria-label="Poze urmatoare"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <div
                  ref={reviewScrollRef}
                  onScroll={updateReviewNav}
                  className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {reviewPhotos.map((photo, idx) => (
                    <button
                      key={`${photo.url}-${idx}`}
                      type="button"
                      onClick={() => setZoomReviewIndex(idx)}
                      className="h-32 w-40 flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-muted"
                    >
                      <img src={photo.url} alt="Recenzie" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4">
            {data.recenzii.slice(0, 6).map((review) => (
              <div key={review.id_recenzie} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{review.autor}</p>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, idx) => (
                      <Star
                        key={`${review.id_recenzie}-star-${idx}`}
                        className={`h-3 w-3 ${idx < Math.round(parseFloat(review.rating || '0')) ? 'fill-amber-500' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-4">{review.continut}</p>
                {review.imagini?.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      const index = reviewPhotos.findIndex((photo) => photo.url === (review.imagini?.[0]?.full || review.imagini?.[0]?.thumbnail));
                      setZoomReviewIndex(index >= 0 ? index : 0);
                    }}
                    data-track-action="A deschis poza din recenzie desktop."
                    className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Vezi poza
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {data.categorii?.[0]?.produse?.length ? (
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Produse recomandate</h2>
              <button
                type="button"
                onClick={() => navigate(`/categorie/${data.categorii?.[0]?.slug}`)}
                data-track-action="A deschis categoria recomandata din produs."
                className="text-sm font-semibold text-amber-700"
              >
                Vezi categoria
              </button>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
              {data.categorii[0].produse.slice(0, 8).map((produs, index) => (
                <MobileProductCard
                  key={produs.id}
                  product={produs}
                  index={index}
                  desktopSequence={data.categorii?.[0]?.produse || []}
                />
              ))}
            </div>
          </div>
        ) : null}
      </main>

      {zoomReviewIndex !== null && reviewPhotos[zoomReviewIndex] && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setZoomReviewIndex(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-black">
              <img
                src={reviewPhotos[zoomReviewIndex].url}
                alt="Recenzie"
                className="max-h-[80vh] w-full object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-3 text-sm text-white">
                {reviewPhotos[zoomReviewIndex].author}
              </div>
              <button
                type="button"
                onClick={() => setZoomReviewIndex(null)}
                className="absolute right-3 top-3 rounded-full bg-white/20 p-2 text-white"
                aria-label="Inchide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopProductPage;
