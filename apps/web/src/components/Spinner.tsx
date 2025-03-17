import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const Spinner = ({ size = "md", className }: SpinnerProps) => {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex items-center justify-center">
      <Loader2
        className={cn("animate-spin text-primary", sizeClass[size], className)}
      />
    </div>
  );
}; 