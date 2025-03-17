import { DocumentType } from '../models/document';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DocumentTypeSelectorProps {
  value: DocumentType;
  onChange: (type: DocumentType) => void;
}

export function DocumentTypeSelector({ value, onChange }: DocumentTypeSelectorProps) {
  // Convert enum keys to readable labels
  const getReadableLabel = (type: string): string => {
    switch (type) {
      case DocumentType.UserDocument:
        return "User Document";
      case DocumentType.Canvas:
        return "Canvas";
      case DocumentType.Project:
        return "Project";
      case DocumentType.JournalEntry:
        return "Journal Entry";
      case DocumentType.FuturePressConference:
        return "Future Press Conference";
      default:
        return type.replace(/([A-Z])/g, ' $1').trim();
    }
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="documentType">Document Type</Label>
      <Select
        value={value}
        onValueChange={(value) => onChange(value as DocumentType)}
      >
        <SelectTrigger id="documentType" className="w-[180px]">
          <SelectValue placeholder="Select document type" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(DocumentType).map((type) => (
            <SelectItem key={type} value={type}>
              {getReadableLabel(type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 