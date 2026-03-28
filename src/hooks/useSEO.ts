import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

const DEFAULT = {
  title:       'CricClash — Predictions Decide Pride',
  description: 'Challenge your friends with cricket predictions. No money, no fantasy — pure bragging rights. Create a challenge in 60 seconds!',
  image:       '/og-image.png',
  type:        'website' as const,
};

export function useSEO({ title, description, image, url, type }: SEOProps = {}) {
  const location = useLocation();
  const pageUrl  = url ?? `${import.meta.env.VITE_APP_URL ?? 'http://localhost:3000'}${location.pathname}`;

  const finalTitle = title ? `${title} | CricClash` : DEFAULT.title;
  const finalDesc  = description ?? DEFAULT.description;
  const finalImg   = image ?? DEFAULT.image;
  const finalType  = type  ?? DEFAULT.type;

  useEffect(() => {
    // Title
    document.title = finalTitle;

    // Helper to set or create a meta tag
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr.split('=')[0], attr.split('=')[1] ?? attr);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    // Standard
    setMeta('meta[name="description"]',     'name=description',     finalDesc);

    // Open Graph
    setMeta('meta[property="og:title"]',       'property=og:title',       finalTitle);
    setMeta('meta[property="og:description"]', 'property=og:description', finalDesc);
    setMeta('meta[property="og:image"]',       'property=og:image',       finalImg);
    setMeta('meta[property="og:url"]',         'property=og:url',         pageUrl);
    setMeta('meta[property="og:type"]',        'property=og:type',        finalType);
    setMeta('meta[property="og:site_name"]',   'property=og:site_name',   'CricClash');

    // Twitter Card
    setMeta('meta[name="twitter:card"]',        'name=twitter:card',        'summary_large_image');
    setMeta('meta[name="twitter:title"]',       'name=twitter:title',       finalTitle);
    setMeta('meta[name="twitter:description"]', 'name=twitter:description', finalDesc);
    setMeta('meta[name="twitter:image"]',       'name=twitter:image',       finalImg);
  }, [finalTitle, finalDesc, finalImg, pageUrl, finalType]);
}
