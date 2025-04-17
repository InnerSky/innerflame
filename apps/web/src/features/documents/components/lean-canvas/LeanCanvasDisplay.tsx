import React, { useRef, useEffect } from 'react';
import { JSONDisplay } from '../JSONDisplay';
import { Card } from '@/components/ui/card';
import { Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeanCanvasDisplayProps {
  jsonData: Record<string, string> | null;
  onDataChange?: (updatedData: Record<string, string>) => void;
  readOnly?: boolean;
}

// Define Lean Canvas keys 
const LEAN_CANVAS_KEYS = [
  'problem',
  'existing_alternatives',
  'solution',
  'key_metrics',
  'unique_value_proposition',
  'high_level_concept',
  'unfair_advantage',
  'channels',
  'customer_segments',
  'early_adopters',
  'cost_structure',
  'revenue_streams'
];

// Define custom prompts for each Lean Canvas section
const sectionPrompts: Record<string, string> = {
  problem: "**What customer problems are you solving?**\n\nList the top 1-3 specific, high-value problems your target customers face.",
  existing_alternatives: "**How are these problems solved today?**\n\nList how your early adopters currently address the problems you've identified (this is your real competition).",
  solution: "**What are the key features of your solution?**\n\nOutline the top 3-5 key features or capabilities that directly address the customer problems.",
  key_metrics: "**How will you measure success?**\n\nList the key activities/numbers you will measure to track progress and business health.",
  unique_value_proposition: "**Why should customers choose you?**\n\nState the single, clear, compelling benefit that makes you different and worth their attention.",
  high_level_concept: "**Can you explain it simply?**\n\nProvide a very short, easy-to-understand analogy (e.g., X for Y).",
  unfair_advantage: "**What is your secret sauce or sustainable advantage?**\n\nDefine what makes your business difficult for competitors to copy or buy long-term.",
  channels: "**How will you reach your customers?**\n\nList the primary pathways you will use to reach and acquire your customer segments.",
  customer_segments: "**Who are your target customers?**\n\nDefine the specific group(s) of people or organizations you aim to create value for.",
  early_adopters: "**Who are your ideal first customers?**\n\nDescribe the characteristics of the specific subset of customers you will target first.",
  cost_structure: "**What are your major costs?**\n\nList the most significant costs incurred to operate your business model.",
  revenue_streams: "**How will you make money?**\n\nDescribe how your business will earn money from each customer segment."
};

// Define display names for the navigation buttons
const sectionDisplayNames: Record<string, string> = {
  customer_segments: "Customers",
  early_adopters: "Adopters",
  problem: "Problem",
  existing_alternatives: "Alternatives",
  unique_value_proposition: "Value Prop",
  high_level_concept: "Concept",
  solution: "Solution",
  channels: "Channels",
  revenue_streams: "Revenue",
  cost_structure: "Costs",
  key_metrics: "Metrics",
  unfair_advantage: "Advantage"
};

export function LeanCanvasDisplay({ jsonData, onDataChange, readOnly = false }: LeanCanvasDisplayProps) {
  // Create refs for each section
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = React.useState(0);
  
  // Measure the header height when component mounts and on window resize
  useEffect(() => {
    const measureHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
        
        // Set the CSS variable with the measured height plus some padding
        const scrollMargin = height + 16; // Add 16px padding (4px rem)
        document.documentElement.style.setProperty('--header-scroll-margin', `${scrollMargin}px`);
      }
    };
    
    // Measure immediately
    measureHeaderHeight();
    
    // Also measure on resize
    window.addEventListener('resize', measureHeaderHeight);
    
    return () => {
      window.removeEventListener('resize', measureHeaderHeight);
    };
  }, []);
  
  // Function to scroll to a section with correct offset
  const scrollToSection = (sectionName: string) => {
    const element = document.getElementById(`section-${sectionName}`);
    
    if (element) {
      // Apply the calculated header height plus padding as scroll-margin-top
      element.style.scrollMarginTop = `${headerHeight + 16}px`;
      
      // Scroll to the element
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Apply highlight animation classes
      element.classList.add('highlight-animation');
      
      // Remove the highlight classes after animation completes
      setTimeout(() => {
        element.classList.remove('highlight-animation');
      }, 1500);
    }
  };
  
  if (!jsonData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Add fields to begin your Lean Canvas.</p>
      </div>
    );
  }

  // Helper function to find a key case-insensitively and format-insensitively
  const findKey = (obj: Record<string, string>, keyToFind: string): string | null => {
    // Convert search key to lowercase and create normalized versions
    const lowerKeyToFind = keyToFind.toLowerCase();
    const withUnderscores = lowerKeyToFind.replace(/\s+/g, '_');
    const withSpaces = lowerKeyToFind.replace(/_+/g, ' ');
    
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const keyWithUnderscores = lowerKey.replace(/\s+/g, '_');
      const keyWithSpaces = lowerKey.replace(/_+/g, ' ');
      
      // Check all possible format combinations
      if (
        lowerKey === lowerKeyToFind ||
        lowerKey === withUnderscores || 
        lowerKey === withSpaces ||
        keyWithUnderscores === lowerKeyToFind ||
        keyWithSpaces === lowerKeyToFind
      ) {
        return key;
      }
    }
    return null;
  };

  // Extract title, subtitle, notes and footnotes keys
  const titleKey = findKey(jsonData, 'title');
  const subtitleKey = findKey(jsonData, 'subtitle');
  const notesKey = findKey(jsonData, 'notes');
  const footnotesKey = findKey(jsonData, 'footnotes');

  // Filter for Lean Canvas keys and other keys
  const leanCanvasData: Record<string, string> = {};
  const otherData: Record<string, string> = {};
  
  // Process all keys in the data
  Object.keys(jsonData).forEach(key => {
    // Skip title, subtitle, notes and footnotes
    if ((titleKey && key === titleKey) || 
        (subtitleKey && key === subtitleKey) || 
        (notesKey && key === notesKey) || 
        (footnotesKey && key === footnotesKey)) {
      return;
    }
    
    // Check if this is a Lean Canvas key
    let isLeanCanvasKey = false;
    for (const canvasKey of LEAN_CANVAS_KEYS) {
      if (findKey({[key]: ''}, canvasKey)) {
        isLeanCanvasKey = true;
        break;
      }
    }
    
    // Add to appropriate data object
    if (isLeanCanvasKey) {
      leanCanvasData[key] = jsonData[key];
    } else {
      otherData[key] = jsonData[key];
    }
  });

  // Helper function to ensure all Lean Canvas sections exist
  const ensureAllSectionsExist = () => {
    if (!onDataChange || !jsonData) return;
    
    let hasAddedSections = false;
    const updatedData = { ...jsonData };
    
    // Check if title exists, if not add it
    if (!findKey(jsonData, 'title')) {
      updatedData['title'] = 'My Lean Canvas';
      hasAddedSections = true;
    }
    
    // Check if all required sections exist
    LEAN_CANVAS_KEYS.forEach(key => {
      if (!findKey(jsonData, key)) {
        // Create normalized key with underscores
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
        updatedData[normalizedKey] = '';
        hasAddedSections = true;
      }
    });
    
    // If we've added any sections, update the data
    if (hasAddedSections) {
      onDataChange(updatedData);
    }
  };
  
  // Run once when component mounts to ensure all sections exist
  React.useEffect(() => {
    ensureAllSectionsExist();
    // We only want to run this once on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle changes to the data from child components
  const handleDataChange = (updatedData: Record<string, string>) => {
    // If we have an onDataChange function, pass the updated data to it
    if (onDataChange) {
      // Check if this is a deletion operation from JSONDisplay
      const isFromJSONDisplay = updatedData.__source === 'JSONDisplay';
      if (isFromJSONDisplay) {
        delete updatedData.__source;
      }
      
      // Check if data was modified
      if (JSON.stringify(updatedData) !== JSON.stringify(jsonData)) {
        const updatedKeys = Object.keys(updatedData);
        const originalKeys = Object.keys(jsonData);
        
        // IMPORTANT: Detect if this is a single field update from a Lean Canvas section
        // A single field update will have exactly one key that matches a Lean Canvas key
        // or will be a special field (title, subtitle, notes, footnotes)
        const specialKeys = ['title', 'subtitle', 'notes', 'footnotes'];
        const isSingleFieldUpdate = updatedKeys.length === 1 && 
          (LEAN_CANVAS_KEYS.some(key => 
            findKey(updatedData, key) !== null) || 
            specialKeys.some(key => 
              findKey(updatedData, key) !== null));
        
        if (isSingleFieldUpdate) {
          // This is a single field update from a Lean Canvas section
          // We need to merge it with the existing data
          const singleKey = updatedKeys[0];
          const singleValue = updatedData[singleKey];
          
          // Create a merged object with all original data
          const mergedData = { ...jsonData };
          
          // Find the equivalent key in the original data (case-insensitive)
          const originalKey = findKey(jsonData, singleKey) || singleKey;
          
          // Update the value
          mergedData[originalKey] = singleValue;
          
          // Pass the fully merged data to the parent
          onDataChange(mergedData);
        } else if (isFromJSONDisplay) {
          // This is a deletion operation, just pass it through
          onDataChange(updatedData);
        } else {
          // This could be from the Additional Cards section or another source
          // Handle the general case, preserving essential keys
          
          // Find keys that were deleted (in original but not in updated)
          const deletedKeys = originalKeys.filter(key => !updatedKeys.includes(key));
          
          // Get special keys we should never delete
          const keysToPreserve = [...specialKeys, ...LEAN_CANVAS_KEYS];
          
          // Start with a copy of the original data
          const updatedOtherData: Record<string, string> = { ...jsonData };
          
          // Update any changed keys
          updatedKeys.forEach(key => {
            updatedOtherData[key] = updatedData[key];
          });
          
          // Remove any keys that were deleted, unless they're in keysToPreserve
          deletedKeys.forEach(key => {
            const isPreserved = keysToPreserve.some(
              preserveKey => key.toLowerCase() === preserveKey.toLowerCase() ||
                findKey({ [key]: '' }, preserveKey) !== null
            );
            
            if (!isPreserved) {
              delete updatedOtherData[key];
            }
          });
          
          onDataChange(updatedOtherData);
        }
      }
    }
  };

  // Helper function to get the appropriate prompt for a given key
  const getPromptForKey = (key: string): string => {
    // First normalize the key to match our prompt keys format
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
    
    // Try to find a matching prompt
    for (const promptKey of Object.keys(sectionPrompts)) {
      if (normalizedKey.includes(promptKey) || promptKey.includes(normalizedKey)) {
        return sectionPrompts[promptKey];
      }
    }
    
    // If no specific prompt is found, return a generic one
    return "Add details here...";
  };

  // Create a list of all lean canvas sections for mobile view
  const renderMobileCards = () => {
    // Define the exact order of sections to display
    const orderedSections = [
      'customer_segments',
      'early_adopters',
      'problem',
      'existing_alternatives',
      'unique_value_proposition',
      'high_level_concept',
      'solution',
      'channels',
      'revenue_streams',
      'cost_structure',
      'key_metrics',
      'unfair_advantage'
    ];
    
    return (
      <div className="md:hidden">
        {/* Navigation Panel */}
        <div 
          ref={headerRef}
          className="sticky top-0 z-10 bg-background/95 backdrop-blur shadow-sm border-b pb-2 pt-2" 
        >
          <div className="flex flex-wrap gap-1 justify-center px-2">
            {orderedSections.map(sectionName => {
              const key = findKey(jsonData, sectionName);
              if (key) {
                return (
                  <Button 
                    key={`nav-${sectionName}`} 
                    variant="outline" 
                    size="sm" 
                    className="text-xs py-1 h-7"
                    onClick={() => scrollToSection(sectionName)}
                  >
                    {sectionDisplayNames[sectionName]}
                  </Button>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Cards with scroll-margin-top to prevent header overlap */}
        <div className="pt-4">
          <div className="grid grid-cols-1 gap-4">
            {orderedSections.map((sectionName, index) => {
              const key = findKey(jsonData, sectionName);
              if (key) {
                // Use different styling for main vs secondary sections
                const isSecondary = ['existing_alternatives', 'high_level_concept', 'early_adopters'].includes(sectionName);
                
                return (
                  <div 
                    key={key} 
                    className={`rounded-xl ${isSecondary ? 'bg-muted/5' : ''}`}
                    id={`section-${sectionName}`}
                    style={{ scrollMarginTop: `${headerHeight + 16}px` }}
                  >
                    <JSONDisplay 
                      jsonData={{ [key.toUpperCase()]: jsonData[key] }}
                      onDataChange={handleDataChange}
                      readOnly={readOnly}
                      disableAddCard={true}
                      disableKeyEdit={true}
                      disableHoverEffects={false}
                      emptyPlaceholder={getPromptForKey(key)}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-full py-5">
      {/* Title and subtitle section */}
      <JSONDisplay 
        jsonData={{ 
          ...(titleKey ? { [titleKey]: jsonData[titleKey] } : {}),
          ...(subtitleKey ? { [subtitleKey]: jsonData[subtitleKey] } : {})
        }}
        onDataChange={handleDataChange}
        readOnly={readOnly}
        disableAddCard={true}
        disableHoverEffects={true}
        emptyPlaceholder={titleKey && !subtitleKey ? "Your startup" : 
                         subtitleKey && !titleKey ? "Your mission" : 
                         "Your startup\n\nYour mission"}
      />

      {/* Lean Canvas section */}
      {Object.keys(leanCanvasData).length > 0 && (
        <div className="mb-6">
          {/* Mobile Cards View */}
          {renderMobileCards()}
          
          {/* Desktop Lean Canvas Visual Framework */}
          <div className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 mb-6 hidden md:block overflow-hidden [&_.lean-canvas-card]:w-full [&_.lean-canvas-card>div]:w-full [&_.lean-canvas-card>div_.card]:!border-0 [&_.lean-canvas-card>div_.card]:!shadow-none [&_.lean-canvas-card>div_.card]:!bg-transparent [&_.lean-canvas-card>div_.card]:flex [&_.lean-canvas-card>div_.card]:flex-col [&_.lean-canvas-card>div_.card-header]:!p-3 [&_.lean-canvas-card>div_.card-content]:flex-1 [&_.lean-canvas-card>div_.card-content]:!p-3 [&_.lean-canvas-card>div_.grid]:!grid-cols-1 [&_div.overflow-hidden.border]:!rounded-none [&_div.overflow-hidden.border]:!border-0 [&_div.overflow-hidden]:!border-0 [&_div.overflow-hidden]:!ring-0 [&_div.overflow-hidden.group]:!border-0 [&_div.overflow-hidden.group]:hover:!border-0 [&_.card-title]:!uppercase [&_.card-title]:!normal-case [--divider-color:theme(colors.gray.300)] dark:[--divider-color:theme(colors.gray.600)] [&_*]:!box-border">
            <div className="grid grid-cols-5 text-sm text-muted-foreground min-h-[16rem] divide-y divide-muted relative">
              {/* Problem cell spans two rows */}
              <div className="col-span-1 row-span-2 flex flex-col bg-muted/5" style={{ borderRight: '2px solid var(--divider-color)' }}>
                <div className="flex-1 h-full">
                  {findKey(jsonData, 'problem') && (
                    <div className="lean-canvas-card">
                      <JSONDisplay 
                        jsonData={{ [findKey(jsonData, 'problem')!.toUpperCase()]: jsonData[findKey(jsonData, 'problem')!] }}
                        onDataChange={handleDataChange}
                        readOnly={readOnly}
                        disableAddCard={true}
                        disableKeyEdit={true}
                        disableHoverEffects={true}
                        emptyPlaceholder={getPromptForKey('problem')}
                      />
                    </div>
                  )}
                </div>
                <div className="border-t border-muted h-full">
                  {findKey(jsonData, 'existing_alternatives') && (
                    <div className="lean-canvas-card" style={{ opacity: 0.7 }}>
                      <JSONDisplay 
                        jsonData={{ ["Existing Alternatives"]: jsonData[findKey(jsonData, 'existing_alternatives')!] }}
                        onDataChange={handleDataChange}
                        readOnly={readOnly}
                        disableAddCard={true}
                        disableKeyEdit={true}
                        disableHoverEffects={true}
                        emptyPlaceholder={getPromptForKey('existing_alternatives')}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Solution */}
              <div className="col-span-1 bg-muted/5" style={{ borderRight: '2px solid var(--divider-color)', borderBottom: '2px solid var(--divider-color)' }}>
                {findKey(jsonData, 'solution') && (
                  <div className="lean-canvas-card">
                    <JSONDisplay 
                      jsonData={{ [findKey(jsonData, 'solution')!.toUpperCase()]: jsonData[findKey(jsonData, 'solution')!] }}
                      onDataChange={handleDataChange}
                      readOnly={readOnly}
                      disableAddCard={true}
                      disableKeyEdit={true}
                      disableHoverEffects={true}
                      emptyPlaceholder={getPromptForKey('solution')}
                    />
                  </div>
                )}
              </div>
              
              {/* UVP cell spans two rows */}
              <div className="col-span-1 row-span-2 flex flex-col bg-muted/5" style={{ borderRight: '2px solid var(--divider-color)' }}>
                <div className="flex-1 h-full">
                  {findKey(jsonData, 'unique_value_proposition') && (
                    <div className="lean-canvas-card">
                      <JSONDisplay 
                        jsonData={{ [findKey(jsonData, 'unique_value_proposition')!.toUpperCase()]: jsonData[findKey(jsonData, 'unique_value_proposition')!] }}
                        onDataChange={handleDataChange}
                        readOnly={readOnly}
                        disableAddCard={true}
                        disableKeyEdit={true}
                        disableHoverEffects={true}
                        emptyPlaceholder={getPromptForKey('unique_value_proposition')}
                      />
                    </div>
                  )}
                </div>
                <div className="border-t border-muted h-full">
                  {findKey(jsonData, 'high_level_concept') && (
                    <div className="lean-canvas-card" style={{ opacity: 0.7 }}>
                      <JSONDisplay 
                        jsonData={{ ["High Level Concept"]: jsonData[findKey(jsonData, 'high_level_concept')!] }}
                        onDataChange={handleDataChange}
                        readOnly={readOnly}
                        disableAddCard={true}
                        disableKeyEdit={true}
                        disableHoverEffects={true}
                        emptyPlaceholder={getPromptForKey('high_level_concept')}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Unfair Advantage */}
              <div className="col-span-1 bg-muted/5" style={{ borderRight: '2px solid var(--divider-color)', borderBottom: '2px solid var(--divider-color)' }}>
                {findKey(jsonData, 'unfair_advantage') && (
                  <div className="lean-canvas-card">
                    <JSONDisplay 
                      jsonData={{ [findKey(jsonData, 'unfair_advantage')!.toUpperCase()]: jsonData[findKey(jsonData, 'unfair_advantage')!] }}
                      onDataChange={handleDataChange}
                      readOnly={readOnly}
                      disableAddCard={true}
                      disableKeyEdit={true}
                      disableHoverEffects={true}
                      emptyPlaceholder={getPromptForKey('unfair_advantage')}
                    />
                  </div>
                )}
              </div>
              
              {/* Customer Segments cell spans two rows */}
              <div className="col-span-1 row-span-2 flex flex-col bg-muted/5">
                <div className="flex-1 h-full">
                  {findKey(jsonData, 'customer_segments') && (
                    <div className="lean-canvas-card">
                      <JSONDisplay 
                        jsonData={{ [findKey(jsonData, 'customer_segments')!.toUpperCase()]: jsonData[findKey(jsonData, 'customer_segments')!] }}
                        onDataChange={handleDataChange}
                        readOnly={readOnly}
                        disableAddCard={true}
                        disableKeyEdit={true}
                        disableHoverEffects={true}
                        emptyPlaceholder={getPromptForKey('customer_segments')}
                      />
                    </div>
                  )}
                </div>
                <div className="border-t border-muted h-full">
                  {findKey(jsonData, 'early_adopters') && (
                    <div className="lean-canvas-card" style={{ opacity: 0.7 }}>
                      <JSONDisplay 
                        jsonData={{ ["Early Adopters"]: jsonData[findKey(jsonData, 'early_adopters')!] }}
                        onDataChange={handleDataChange}
                        readOnly={readOnly}
                        disableAddCard={true}
                        disableKeyEdit={true}
                        disableHoverEffects={true}
                        emptyPlaceholder={getPromptForKey('early_adopters')}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="col-span-1 bg-muted/5" style={{ borderRight: '2px solid var(--divider-color)' }}>
                {findKey(jsonData, 'key_metrics') && (
                  <div className="lean-canvas-card">
                    <JSONDisplay 
                      jsonData={{ [findKey(jsonData, 'key_metrics')!.toUpperCase()]: jsonData[findKey(jsonData, 'key_metrics')!] }}
                      onDataChange={handleDataChange}
                      readOnly={readOnly}
                      disableAddCard={true}
                      disableKeyEdit={true}
                      disableHoverEffects={true}
                      emptyPlaceholder={getPromptForKey('key_metrics')}
                    />
                  </div>
                )}
              </div>
              
              {/* Channels */}
              <div className="col-span-1 bg-muted/5" style={{ borderRight: '2px solid var(--divider-color)' }}>
                {findKey(jsonData, 'channels') && (
                  <div className="lean-canvas-card">
                    <JSONDisplay 
                      jsonData={{ [findKey(jsonData, 'channels')!.toUpperCase()]: jsonData[findKey(jsonData, 'channels')!] }}
                      onDataChange={handleDataChange}
                      readOnly={readOnly}
                      disableAddCard={true}
                      disableKeyEdit={true}
                      disableHoverEffects={true}
                      emptyPlaceholder={getPromptForKey('channels')}
                    />
                  </div>
                )}
              </div>
              
              {/* Bottom row */}
              <div className="col-span-5 grid grid-cols-2 divide-x divide-muted">
                <div className="bg-muted/5" style={{ borderRight: '2px solid var(--divider-color)', borderTop: '2px solid var(--divider-color)' }}>
                  {findKey(jsonData, 'cost_structure') && (
                    <div className="lean-canvas-card">
                      <JSONDisplay 
                        jsonData={{ [findKey(jsonData, 'cost_structure')!.toUpperCase()]: jsonData[findKey(jsonData, 'cost_structure')!] }}
                        onDataChange={handleDataChange}
                        readOnly={readOnly}
                        disableAddCard={true}
                        disableKeyEdit={true}
                        disableHoverEffects={true}
                        emptyPlaceholder={getPromptForKey('cost_structure')}
                      />
                    </div>
                  )}
                </div>
                <div className="bg-muted/5" style={{ borderTop: '2px solid var(--divider-color)' }}>
                  {findKey(jsonData, 'revenue_streams') && (
                    <div className="lean-canvas-card">
                      <JSONDisplay 
                        jsonData={{ [findKey(jsonData, 'revenue_streams')!.toUpperCase()]: jsonData[findKey(jsonData, 'revenue_streams')!] }}
                        onDataChange={handleDataChange}
                        readOnly={readOnly}
                        disableAddCard={true}
                        disableKeyEdit={true}
                        disableHoverEffects={true}
                        emptyPlaceholder={getPromptForKey('revenue_streams')}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Hide all Lean Canvas fields from the card view since they're now in the visual framework */}
          <JSONDisplay 
            jsonData={{}}
            onDataChange={handleDataChange}
            readOnly={readOnly}
            disableAddCard={true}
            disableHoverEffects={true}
          />
        </div>
      )}

      {/* Other cards section */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Additional Cards</h3>
        {Object.keys(otherData).length > 0 ? (
          <JSONDisplay 
            jsonData={otherData}
            onDataChange={handleDataChange}
            readOnly={readOnly}
            editableKeys={Object.keys(otherData)}
            hideHeaderFields={true}
          />
        ) : !readOnly && (
          <Card 
            className="overflow-hidden border border-dashed border-primary/30 shadow-sm hover:shadow-md hover:border-primary/60 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[200px] animate-in fade-in"
            onClick={() => {
              // Simply add a new empty card to otherData
              handleDataChange({
                ...jsonData,
                "New Card": ""
              });
            }}
          >
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Add new card</p>
            </div>
          </Card>
        )}
      </div>

      {/* Notes and footnotes section */}
      <JSONDisplay 
        jsonData={{ 
          ...(notesKey ? { [notesKey]: jsonData[notesKey] } : {}),
          ...(footnotesKey ? { [footnotesKey]: jsonData[footnotesKey] } : {})
        }}
        onDataChange={handleDataChange}
        readOnly={readOnly}
        disableAddCard={true}
        disableHoverEffects={true}
      />
    </div>
  );
} 