import { useEffect } from "react";

function setMeta(selector: string, attr: string, value: string, create: () => HTMLMetaElement) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) { el = create(); document.head.appendChild(el); }
  el.setAttribute(attr, value);
}

export function useSeo(title: string, description: string, image?: string) {
  useEffect(() => {
    const full = title.includes("Cardify") ? title : `${title} | Cardify.ai`;
    document.title = full;
    const mk = (k: string, v: string) => () => { const m = document.createElement("meta"); m.setAttribute(k, v); return m; };
    setMeta('meta[name="description"]', "content", description, mk("name", "description"));
    setMeta('meta[property="og:title"]', "content", full, mk("property", "og:title"));
    setMeta('meta[property="og:description"]', "content", description, mk("property", "og:description"));
    if (image) setMeta('meta[property="og:image"]', "content", image, mk("property", "og:image"));
  }, [title, description, image]);
}
