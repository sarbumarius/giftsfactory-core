declare global {
  interface Window {
    fbq?: (action: string, event: string, data?: any) => void;
  }
}

export const fbViewContent = (productId: string, productName: string, value: number, currency = 'RON') => {
  if (!window.fbq) return;

  window.fbq('track', 'ViewContent', {
    content_ids: [productId],
    content_type: 'product',
    content_name: productName,
    value,
    currency,
  });
};

export const fbSearch = (query: string) => {
  if (!window.fbq) return;

  window.fbq('track', 'Search', {
    search_string: query,
  });
};

export const fbAddToCart = (productId: string, productName: string, value: number, currency = 'RON') => {
  if (!window.fbq) return;

  window.fbq('track', 'AddToCart', {
    content_ids: [productId],
    content_type: 'product',
    content_name: productName,
    value,
    currency,
  });
};

export const fbInitiateCheckout = (products: Array<{ id: string; name: string }>, value: number, currency = 'RON') => {
  if (!window.fbq) return;

  window.fbq('track', 'InitiateCheckout', {
    content_ids: products.map(p => p.id),
    contents: products.map(p => ({
      id: p.id,
      name: p.name,
    })),
    value,
    currency,
  });
};

export const fbPurchase = (products: Array<{ id: string; name: string }>, value: number, currency = 'RON') => {
  if (!window.fbq) return;

  window.fbq('track', 'Purchase', {
    content_ids: products.map(p => p.id),
    contents: products.map(p => ({
      id: p.id,
      name: p.name,
    })),
    value,
    currency,
  });
};
