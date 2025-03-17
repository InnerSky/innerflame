import { useEffect, useRef, useState } from 'react';

interface UseIntersectionOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersection({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true
}: UseIntersectionOptions = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersecting(entry.isIntersecting);
        
        // If element has intersected and we only want to trigger once, unobserve
        if (entry.isIntersecting && triggerOnce) {
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isIntersecting] as const;
}