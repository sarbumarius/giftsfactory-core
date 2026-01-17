declare global {
  interface Window {
    ttq?: {
      identify: (data: {
        email?: string;
        phone_number?: string;
        external_id?: string;
      }) => void;
      track: (event: string, data?: any) => void;
      page: () => void;
    };
  }
}

async function sha256(message: string): Promise<string> {
  if (!message) return '';
  try {
    const msgBuffer = new TextEncoder().encode(message.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return '';
  }
}

export const tiktokIdentify = async (email?: string, phone?: string, externalId?: string) => {
  if (!window.ttq) return;

  const data: any = {};
  if (email) data.email = await sha256(email);
  if (phone) data.phone_number = await sha256(phone);
  if (externalId) data.external_id = await sha256(externalId);

  if (Object.keys(data).length > 0) {
    window.ttq.identify(data);
  }
};

export const tiktokViewContent = (productId: string, productName: string, value: number, currency = 'RON') => {
  if (!window.ttq) return;

  window.ttq.track('ViewContent', {
    contents: [
      {
        content_id: productId,
        content_type: 'product',
        content_name: productName,
      },
    ],
    value,
    currency,
  });
};

export const tiktokSearch = (query: string) => {
  if (!window.ttq) return;

  window.ttq.track('Search', {
    contents: [],
    search_string: query,
  });
};

export const tiktokAddToCart = (productId: string, productName: string, value: number, currency = 'RON') => {
  if (!window.ttq) return;

  window.ttq.track('AddToCart', {
    contents: [
      {
        content_id: productId,
        content_type: 'product',
        content_name: productName,
      },
    ],
    value,
    currency,
  });
};

export const tiktokInitiateCheckout = (products: Array<{ id: string; name: string }>, value: number, currency = 'RON') => {
  if (!window.ttq) return;

  window.ttq.track('InitiateCheckout', {
    contents: products.map(p => ({
      content_id: p.id,
      content_type: 'product',
      content_name: p.name,
    })),
    value,
    currency,
  });
};

export const tiktokPlaceAnOrder = (products: Array<{ id: string; name: string }>, value: number, currency = 'RON') => {
  if (!window.ttq) return;

  window.ttq.track('PlaceAnOrder', {
    contents: products.map(p => ({
      content_id: p.id,
      content_type: 'product',
      content_name: p.name,
    })),
    value,
    currency,
  });
};
