import { useIntersection } from "@/hooks/use-intersection";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  immediate?: boolean; // New prop to disable animation
}

export function AnimatedSection({ 
  children, 
  delay = 0,
  className,
  immediate = false, // Default to false to maintain existing behavior
  ...props 
}: AnimatedSectionProps) {
  const [ref, isIntersecting] = useIntersection({
    threshold: 0.2,
    triggerOnce: true
  });

  // If immediate is true, we don't use the intersection observer
  const shouldAnimate = immediate || isIntersecting;

  return (
    <div
      ref={immediate ? undefined : ref}
      className={cn(
        "transition-all duration-1000",
        shouldAnimate
          ? "translate-y-0 opacity-100"
          : "translate-y-10 opacity-0",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}