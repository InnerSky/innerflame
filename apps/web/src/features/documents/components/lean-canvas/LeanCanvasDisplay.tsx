import React from 'react';
import { JSONDisplay } from '../JSONDisplay';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

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

export function LeanCanvasDisplay({ jsonData, onDataChange, readOnly = false }: LeanCanvasDisplayProps) {
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

  // Handle data changes 
  const handleDataChange = (updatedData: Record<string, string>) => {
    if (!onDataChange) return;

    // Start with a copy of the original data
    const result = { ...jsonData };

    // For Lean Canvas sections, we're passing uppercase keys but storing lowercase
    // So we need to check both uppercase and original forms
    const isKeyPresent = (originalKey: string, updatedKeys: string[]) => {
      const lowerKey = originalKey.toLowerCase();
      return updatedKeys.some(updatedKey => {
        const lowerUpdatedKey = updatedKey.toLowerCase();
        return lowerKey === lowerUpdatedKey || 
               originalKey === updatedKey ||
               originalKey.toUpperCase() === updatedKey;
      });
    };

    // Get all keys that exist in original data but not in updated data (these were deleted)
    // Only consider keys that aren't part of the Lean Canvas structure
    const updatedKeys = Object.keys(updatedData);
    const deletedKeys = Object.keys(jsonData).filter(k => {
      // Don't delete Lean Canvas keys
      const isLeanCanvasKey = LEAN_CANVAS_KEYS.some(canvasKey => 
        findKey({[k]: ''}, canvasKey)
      );
      
      // Don't delete special keys
      const isSpecialKey = k === titleKey || 
                          k === subtitleKey || 
                          k === notesKey || 
                          k === footnotesKey;

      // Only delete if it's not a special key and not present in updated data
      return !isLeanCanvasKey && 
             !isSpecialKey && 
             !isKeyPresent(k, updatedKeys);
    });

    // Remove deleted keys
    deletedKeys.forEach(key => {
      delete result[key];
    });

    // Update remaining values
    Object.entries(updatedData).forEach(([key, value]) => {
      // Find the original key in jsonData that matches this key when uppercased
      const originalKey = Object.keys(jsonData).find(k => k.toUpperCase() === key) || key;
      result[originalKey] = value;
    });

    onDataChange(result);
  };

  return (
    <div className="w-full max-w-full">
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
      />

      {/* Lean Canvas section */}
      {Object.keys(leanCanvasData).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Lean Canvas</h3>
          
          {/* Lean Canvas Visual Framework */}
          <div className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 mb-6 hidden md:block overflow-hidden [&_.lean-canvas-card]:w-full [&_.lean-canvas-card]:h-full [&_.lean-canvas-card>div]:w-full [&_.lean-canvas-card>div]:h-full [&_.lean-canvas-card>div_.card]:!border-0 [&_.lean-canvas-card>div_.card]:!shadow-none [&_.lean-canvas-card>div_.card]:!bg-transparent [&_.lean-canvas-card>div_.card]:h-full [&_.lean-canvas-card>div_.card]:flex [&_.lean-canvas-card>div_.card]:flex-col [&_.lean-canvas-card>div_.card-header]:!p-3 [&_.lean-canvas-card>div_.card-content]:flex-1 [&_.lean-canvas-card>div_.card-content]:!p-3 [&_.lean-canvas-card>div_.grid]:!grid-cols-1 [&_div.overflow-hidden.border]:!rounded-none [&_div.overflow-hidden.border]:!border-0 [&_div.overflow-hidden]:!border-0 [&_div.overflow-hidden]:!ring-0 [&_div.overflow-hidden.group]:!border-0 [&_div.overflow-hidden.group]:hover:!border-0 [&_.card-title]:!uppercase [&_.card-title]:!normal-case [--divider-color:theme(colors.gray.300)] dark:[--divider-color:theme(colors.gray.600)] [&_*]:!box-border [&_>div>div]:h-full [&_>div>div>div]:h-full">
            <div className="grid grid-cols-5 grid-rows-2 text-sm text-muted-foreground auto-rows-fr min-h-[16rem] divide-y divide-muted relative h-full">
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
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Solution */}
              <div className="col-span-1 bg-muted/5 h-full" style={{ borderRight: '2px solid var(--divider-color)', borderBottom: '2px solid var(--divider-color)' }}>
                {findKey(jsonData, 'solution') && (
                  <div className="lean-canvas-card">
                    <JSONDisplay 
                      jsonData={{ [findKey(jsonData, 'solution')!.toUpperCase()]: jsonData[findKey(jsonData, 'solution')!] }}
                      onDataChange={handleDataChange}
                      readOnly={readOnly}
                      disableAddCard={true}
                      disableKeyEdit={true}
                      disableHoverEffects={true}
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
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Unfair Advantage */}
              <div className="col-span-1 bg-muted/5 h-full" style={{ borderRight: '2px solid var(--divider-color)', borderBottom: '2px solid var(--divider-color)' }}>
                {findKey(jsonData, 'unfair_advantage') && (
                  <div className="lean-canvas-card">
                    <JSONDisplay 
                      jsonData={{ [findKey(jsonData, 'unfair_advantage')!.toUpperCase()]: jsonData[findKey(jsonData, 'unfair_advantage')!] }}
                      onDataChange={handleDataChange}
                      readOnly={readOnly}
                      disableAddCard={true}
                      disableKeyEdit={true}
                      disableHoverEffects={true}
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
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="col-span-1 bg-muted/5 h-full" style={{ borderRight: '2px solid var(--divider-color)' }}>
                {findKey(jsonData, 'key_metrics') && (
                  <div className="lean-canvas-card">
                    <JSONDisplay 
                      jsonData={{ [findKey(jsonData, 'key_metrics')!.toUpperCase()]: jsonData[findKey(jsonData, 'key_metrics')!] }}
                      onDataChange={handleDataChange}
                      readOnly={readOnly}
                      disableAddCard={true}
                      disableKeyEdit={true}
                      disableHoverEffects={true}
                    />
                  </div>
                )}
              </div>
              
              {/* Channels */}
              <div className="col-span-1 bg-muted/5 h-full" style={{ borderRight: '2px solid var(--divider-color)' }}>
                {findKey(jsonData, 'channels') && (
                  <div className="lean-canvas-card">
                    <JSONDisplay 
                      jsonData={{ [findKey(jsonData, 'channels')!.toUpperCase()]: jsonData[findKey(jsonData, 'channels')!] }}
                      onDataChange={handleDataChange}
                      readOnly={readOnly}
                      disableAddCard={true}
                      disableKeyEdit={true}
                      disableHoverEffects={true}
                    />
                  </div>
                )}
              </div>
              
              {/* Bottom row */}
              <div className="col-span-5 grid grid-cols-2 divide-x divide-muted h-full">
                <div className="bg-muted/5 h-full" style={{ borderRight: '2px solid var(--divider-color)', borderTop: '2px solid var(--divider-color)' }}>
                  {findKey(jsonData, 'cost_structure') && (
                    <div className="lean-canvas-card">
                      <JSONDisplay 
                        jsonData={{ [findKey(jsonData, 'cost_structure')!.toUpperCase()]: jsonData[findKey(jsonData, 'cost_structure')!] }}
                        onDataChange={handleDataChange}
                        readOnly={readOnly}
                        disableAddCard={true}
                        disableKeyEdit={true}
                        disableHoverEffects={true}
                      />
                    </div>
                  )}
                </div>
                <div className="bg-muted/5 h-full" style={{ borderTop: '2px solid var(--divider-color)' }}>
                  {findKey(jsonData, 'revenue_streams') && (
                    <div className="lean-canvas-card">
                      <JSONDisplay 
                        jsonData={{ [findKey(jsonData, 'revenue_streams')!.toUpperCase()]: jsonData[findKey(jsonData, 'revenue_streams')!] }}
                        onDataChange={handleDataChange}
                        readOnly={readOnly}
                        disableAddCard={true}
                        disableKeyEdit={true}
                        disableHoverEffects={true}
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