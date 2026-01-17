import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getIdbValue, setIdbValue } from '@/lib/idb';
import { tiktokAddToCart } from '@/utils/tiktok';
import { fbAddToCart } from '@/utils/facebook';

export interface ShopItem {
  cartItemId?: string;
  id: number;
  slug: string;
  title: string;
  image: string;
  price: string;
  priceReduced?: string | null;
  quantity?: number;
  personalizare?: Array<{
    name: string;
    label: string;
    type: string;
    value?: string | string[];
    file?: string;
    options?: string[];
    maxChars?: number;
  }>;
  giftSelected?: boolean;
  giftMessage?: string;
  packingSelected?: boolean;
}

interface ShopContextType {
  cart: ShopItem[];
  wishlist: ShopItem[];
  addToCart: (item: ShopItem) => void;
  addToWishlist: (item: ShopItem) => void;
  removeFromCart: (cartItemId: string) => void;
  removeFromWishlist: (id: number) => void;
  updateCartItem: (cartItemId: string, updates: Partial<ShopItem>) => void;
  clearCart: () => void;
  isCartLoaded: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<ShopItem[]>([]);
  const [wishlist, setWishlist] = useState<ShopItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getIdbValue<ShopItem[]>('cart')
      .then((items) => {
        if (!isMounted) return;
        if (!items) {
          setCart([]);
          return;
        }
        const normalized = items.map((item) =>
          item.cartItemId
            ? { ...item, quantity: item.quantity ?? 1 }
            : {
                ...item,
                cartItemId: `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                quantity: item.quantity ?? 1,
              }
        );
        setCart(normalized);
      })
      .finally(() => {
        if (isMounted) setIsCartLoaded(true);
      });
    getIdbValue<ShopItem[]>('wishlist').then((items) => items && setWishlist(items));
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setIdbValue('cart', cart).catch(() => undefined);
  }, [cart]);

  useEffect(() => {
    setIdbValue('wishlist', wishlist).catch(() => undefined);
  }, [wishlist]);

  const addToCart = (item: ShopItem) => {
    const cartItemId = item.cartItemId || `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setCart((prev) => [...prev, { ...item, cartItemId, quantity: item.quantity ?? 1 }]);

    const price = parseFloat(item.priceReduced || item.price || '0');
    const quantity = item.quantity || 1;
    const priceWithoutVAT = (price / 1.21) * quantity;
    tiktokAddToCart(String(item.id), item.title, priceWithoutVAT, 'RON');
    fbAddToCart(String(item.id), item.title, priceWithoutVAT, 'RON');

    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/produs/${item.slug}`;
      const personalizareText = (item.personalizare || [])
        .map((entry) => {
          const value = Array.isArray(entry.value) ? entry.value.join(', ') : entry.value || '';
          const label = entry.label || entry.name || 'Optiune';
          return value ? `${label}: ${value}` : `${label}: -`;
        })
        .join('\n');
      const payload = [
        'Produs adaugat in cos',
        `Titlu: ${item.title}`,
        `Link: ${link}`,
        `Pret: ${item.priceReduced || item.price} x${item.quantity || 1}`,
        personalizareText ? `Personalizare:\n${personalizareText}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      fetch('https://ntfy.sarbu.dev/cos_catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-Title': 'Cos catalog',
        },
        body: payload,
      }).catch(() => undefined);
    }
  };

  const addToWishlist = (item: ShopItem) => {
    setWishlist((prev) => (prev.some((existing) => existing.id === item.id) ? prev : [...prev, item]));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const removeFromWishlist = (id: number) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCartItem = (cartItemId: string, updates: Partial<ShopItem>) => {
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, ...updates } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      addToCart,
      addToWishlist,
      removeFromCart,
      removeFromWishlist,
      updateCartItem,
      clearCart,
      isCartLoaded,
    }),
    [cart, wishlist, isCartLoaded]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShopContext = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShopContext must be used within a ShopProvider');
  }
  return context;
};
