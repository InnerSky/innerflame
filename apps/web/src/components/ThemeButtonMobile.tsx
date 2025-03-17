import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, Laptop } from "lucide-react";
import { useState, useEffect } from "react";

export function ThemeButtonMobile() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  
  // Avoid hydration mismatch by only rendering after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Function to cycle through themes
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };
  
  // Get the appropriate icon based on current theme
  const getThemeIcon = () => {
    if (!isMounted) return null;
    
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Laptop className="h-4 w-4" />;
    }
  };
  
  // Get the text to display based on current theme
  const getThemeText = () => {
    if (!isMounted) return 'Theme';
    
    switch (theme) {
      case 'light':
        return 'Light Theme';
      case 'dark':
        return 'Dark Theme';
      default:
        return 'System Theme';
    }
  };
  
  if (!isMounted) {
    return <Button variant="ghost" className="w-full justify-start text-sm sm:text-base opacity-0">Theme</Button>;
  }
  
  return (
    <Button 
      variant="ghost"
      className="w-full justify-start text-sm sm:text-base"
      onClick={cycleTheme}
    >
      {getThemeText()}
      <div className="ml-auto">
        {getThemeIcon()}
      </div>
    </Button>
  );
} 