import React from 'react';
import { ContentFormat } from '../models/document';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ContentFormatSelectorProps {
  value: ContentFormat;
  onChange: (value: ContentFormat) => void;
}

export function ContentFormatSelector({ value, onChange }: ContentFormatSelectorProps) {
  return (
    <RadioGroup value={value} onValueChange={(val) => onChange(val as ContentFormat)}>
      <div className="flex items-center space-x-2 mb-2">
        <RadioGroupItem value={ContentFormat.Markdown} id="markdown" />
        <Label htmlFor="markdown" className="cursor-pointer">Markdown</Label>
      </div>
      <div className="flex items-center space-x-2 mb-2">
        <RadioGroupItem value={ContentFormat.JSON} id="json" />
        <Label htmlFor="json" className="cursor-pointer">JSON</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value={ContentFormat.HTML} id="html" />
        <Label htmlFor="html" className="cursor-pointer">HTML</Label>
      </div>
    </RadioGroup>
  );
} 