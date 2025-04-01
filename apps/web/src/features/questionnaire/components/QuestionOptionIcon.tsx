import React from 'react';
import { 
  User, 
  Search, 
  Rocket, 
  Crown, 
  Youtube, 
  Linkedin, 
  Users, 
  HelpCircle,
  LucideIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon type definition based on the specifications
export interface QuestionOptionIconProps {
  icon: {
    type: 'library' | 'emoji' | 'url';
    value: string;
    backgroundColor?: string | null;
  };
  selected?: boolean;
}

// Map of library icon names to actual Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  user: User,
  users: Users,
  search: Search,
  rocket: Rocket,
  crown: Crown,
  youtube: Youtube,
  linkedin: Linkedin,
  help: HelpCircle,
  // Add more mappings as needed
};

export const QuestionOptionIcon: React.FC<QuestionOptionIconProps> = ({ 
  icon, 
  selected = false 
}) => {
  // Ensure background color is properly applied even if it's a Tailwind class
  // Default to bg-muted if no backgroundColor is provided
  const bgColorClass = icon.backgroundColor || 'bg-muted';
  
  // Base container classes with more explicit safeguards for background colors
  const containerClasses = cn(
    "flex items-center justify-center rounded-full w-16 h-16 mb-2",
    // Apply the background color class directly
    bgColorClass,
    // Add selection effect
    selected ? 'ring-2 ring-primary' : ''
  );

  // Render based on icon type
  if (icon.type === 'library') {
    const IconComponent = ICON_MAP[icon.value.toLowerCase()] || ICON_MAP.help;
    return (
      <div className={containerClasses}>
        <IconComponent className="h-8 w-8 text-foreground" />
      </div>
    );
  }
  
  if (icon.type === 'emoji') {
    return (
      <div className={containerClasses}>
        <span className="text-3xl">{icon.value}</span>
      </div>
    );
  }
  
  if (icon.type === 'url') {
    return (
      <div className={containerClasses}>
        <img 
          src={icon.value} 
          alt="Option icon" 
          className="h-8 w-8 object-contain"
        />
      </div>
    );
  }
  
  // Fallback for unknown icon types
  return null;
}; 