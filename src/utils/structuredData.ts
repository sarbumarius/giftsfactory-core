export const upsertJsonLd = (id: string, data: unknown) => {
  if (typeof document === 'undefined') return;
  const scriptId = `jsonld-${id}`;
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = scriptId;
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(data);
};

export const removeJsonLd = (id: string) => {
  if (typeof document === 'undefined') return;
  const script = document.getElementById(`jsonld-${id}`);
  if (script && script.parentNode) {
    script.parentNode.removeChild(script);
  }
};
