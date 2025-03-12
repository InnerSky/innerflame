import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, Laptop } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full relative overflow-hidden transition-colors"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-in fade-in-50 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="cursor-pointer flex items-center gap-2"
        >
          <Sun className="h-4 w-4 text-orange-500" />
          <span>Light</span>
          {theme === "light" && <span className="ml-auto text-xs opacity-60">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="cursor-pointer flex items-center gap-2"
        >
          <Moon className="h-4 w-4 text-blue-500" />
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto text-xs opacity-60">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="cursor-pointer flex items-center gap-2"
        >
          <Laptop className="h-4 w-4 text-gray-500" />
          <span>System</span>
          {theme === "system" && <span className="ml-auto text-xs opacity-60">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 