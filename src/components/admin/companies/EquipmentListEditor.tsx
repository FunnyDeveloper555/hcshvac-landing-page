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
  suggestions?: string[];
}

const EquipmentListEditor = ({ label, items, onChange, placeholder, suggestions }: EquipmentListEditorProps) => {
  const [value, setValue] = useState("");
  const [showAll, setShowAll] = useState(false);

  const addItem = () => {
    const item = value.trim();
    if (!item || items.includes(item)) {
      setValue("");
      return;
    }
    onChange([...items, item]);
    setValue("");
  };

  const available = (suggestions || []).filter((s) => !items.includes(s));
  const visible = showAll ? available : available.slice(0, 24);
  const listId = `eq-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="space-y-2">
      <Label className="font-semibold">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          list={suggestions ? listId : undefined}
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
      {suggestions && suggestions.length > 0 && (
        <>
          <datalist id={listId}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => onChange(suggestions)}>
              Select All ({suggestions.length})
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
              Clear All
            </Button>
            <span className="text-xs text-muted-foreground">{items.length} selected</span>
          </div>
          {available.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border rounded-lg p-2 bg-muted/30">
              {visible.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange([...items, s])}
                  className="text-xs px-2 py-1 rounded-md border bg-background hover:bg-accent"
                >
                  + {s}
                </button>
              ))}
              {available.length > visible.length && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="text-xs px-2 py-1 rounded-md text-primary underline"
                >
                  Show all {available.length}
                </button>
              )}
            </div>
          )}
        </>
      )}

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
