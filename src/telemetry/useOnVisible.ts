import { useCallback, useRef } from 'react';

/**
 * Fires once when the element first becomes meaningfully visible.
 * Used for impression events (PRODUCT_VIEWED, PROMO_VIEWED) which GA4
 * ecommerce expects and which cannot be expressed as a click handler.
 */
export const useOnVisible = (onVisible: () => void, threshold = 0.5) => {
  const fired = useRef(false);
  const handler = useRef(onVisible);
  handler.current = onVisible;

  return useCallback(
    (node: HTMLElement | null) => {
      if (!node || fired.current) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            fired.current = true;
            handler.current();
            observer.disconnect();
          }
        },
        { threshold },
      );
      observer.observe(node);
    },
    [threshold],
  );
};
