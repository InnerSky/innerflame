import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface JSONDisplayProps {
  jsonData: Record<string, string> | null;
}

export function JSONDisplay({ jsonData }: JSONDisplayProps) {
  if (!jsonData || Object.keys(jsonData).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No content to display. Add some fields to get started.</p>
      </div>
    );
  }

  // Get all the keys from the JSON data
  const keys = Object.keys(jsonData);
  
  // Check if there's a title and footnote
  const hasTitle = keys.includes('title');
  const hasFootnote = keys.includes('footnote');
  
  // Filter keys to display in the grid (exclude title and footnote if they exist)
  const gridKeys = keys.filter(key => 
    (key !== 'title' || !hasTitle) && 
    (key !== 'footnote' || !hasFootnote)
  );

  return (
    <div className="w-full max-w-full">
      {/* Title - only if the "title" key exists */}
      {hasTitle && (
        <div className="mb-4 text-center animate-in fade-in slide-in-from-bottom-3 duration-500">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{jsonData['title']}</h2>
          <div className="mt-2 h-1 w-16 bg-primary/60 mx-auto rounded-full"></div>
        </div>
      )}

      {/* Canvas Grid - render all fields except title and footnote */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
        {gridKeys.map((key, index) => (
          <Card 
            key={key} 
            className={cn(
              "overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200",
              "group animate-in fade-in slide-in-from-bottom-2",
              "dark:bg-card/95 dark:backdrop-blur-sm"
            )}
            style={{ 
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'backwards'
            }}
          >
            <CardHeader className="bg-muted/30 dark:bg-muted/10 py-2 px-3 md:py-3 md:px-4 border-b group-hover:bg-muted/50 transition-colors duration-200">
              <CardTitle className="text-sm font-medium capitalize text-foreground/90 group-hover:text-foreground transition-colors">
                {key}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 bg-card/50">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{jsonData[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Footnote - only if the "footnote" key exists */}
      {hasFootnote && (
        <div className="text-sm text-muted-foreground mt-4 pt-3 border-t animate-in fade-in slide-in-from-bottom-1 duration-700">
          <p className="whitespace-pre-wrap italic">{jsonData['footnote']}</p>
        </div>
      )}
    </div>
  );
} 