import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface JSONEditorProps {
  jsonData: Record<string, string> | null;
  onChange: (data: Record<string, string>) => void;
}

export function JSONEditor({ jsonData, onChange }: JSONEditorProps) {
  const [fields, setFields] = useState<Array<{ key: string; value: string }>>(
    jsonData 
      ? Object.entries(jsonData).map(([key, value]) => ({ key, value: String(value) }))
      : []
  );

  // Update parent component when fields change
  useEffect(() => {
    const newData = fields.reduce((acc, { key, value }) => {
      if (key.trim()) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    onChange(newData);
  }, [fields, onChange]);

  // Add a new empty field
  const addField = () => {
    setFields([...fields, { key: '', value: '' }]);
  };

  // Remove a field
  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  // Move a field up in the order
  const moveUp = (index: number) => {
    if (index === 0) return; // Can't move up if already at the top
    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[index - 1];
    newFields[index - 1] = temp;
    setFields(newFields);
  };

  // Move a field down in the order
  const moveDown = (index: number) => {
    if (index === fields.length - 1) return; // Can't move down if already at the bottom
    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[index + 1];
    newFields[index + 1] = temp;
    setFields(newFields);
  };

  // Update a field
  const updateField = (index: number, field: 'key' | 'value', newValue: string) => {
    const newFields = [...fields];
    newFields[index][field] = newValue;
    setFields(newFields);
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <Card key={index} className="border border-border">
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <Input 
                  placeholder="Field name" 
                  value={field.key} 
                  onChange={(e) => updateField(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => moveUp(index)}
                    aria-label="Move up"
                    disabled={index === 0}
                    className="h-8 w-8"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => moveDown(index)}
                    aria-label="Move down"
                    disabled={index === fields.length - 1}
                    className="h-8 w-8"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeField(index)}
                    aria-label="Remove field"
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea 
                placeholder="Value" 
                value={field.value} 
                onChange={(e) => updateField(index, 'value', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Button 
        variant="outline" 
        onClick={addField} 
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" /> Add Field
      </Button>
    </div>
  );
} 