import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface EquipmentListEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

const EquipmentListEditor = ({ label, items, onChange, placeholder }: EquipmentListEditorProps) => {
  const [value, setValue] = useState("");

  const addItem = () => {
    const item = value.trim();
    if (!item || items.includes(item)) {
      setValue("");
      return;
    }
    onChange([...items, item]);
    setValue("");
  };

  return (
    <div className="space-y-2">
      <Label className="font-semibold">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder={placeholder || "Add an item and press Enter"}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 border rounded-lg p-3">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1">
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((i) => i !== item))}
                aria-label={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default EquipmentListEditor;
