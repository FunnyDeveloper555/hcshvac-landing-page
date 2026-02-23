import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";

interface Item {
  id: string;
  name: string;
}

interface DualListSelectorProps {
  availableItems: Item[];
  selectedItems: Item[];
  onSelectionChange: (selectedIds: string[]) => void;
  availableTitle?: string;
  selectedTitle?: string;
}

export default function DualListSelector({
  availableItems,
  selectedItems,
  onSelectionChange,
  availableTitle = "Available Groups",
  selectedTitle = "Selected Groups",
}: DualListSelectorProps) {
  const [leftSelected, setLeftSelected] = useState<Set<string>>(new Set());
  const [rightSelected, setRightSelected] = useState<Set<string>>(new Set());

  const selectedIds = new Set(selectedItems.map((i) => i.id));
  const available = availableItems.filter((i) => !selectedIds.has(i.id));

  const toggleLeft = (id: string) => {
    setLeftSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleRight = (id: string) => {
    setRightSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const moveRight = () => {
    const newIds = [...selectedIds, ...leftSelected];
    onSelectionChange(newIds);
    setLeftSelected(new Set());
  };

  const moveLeft = () => {
    const newIds = [...selectedIds].filter((id) => !rightSelected.has(id));
    onSelectionChange(newIds);
    setRightSelected(new Set());
  };

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
      {/* Left panel */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">{availableTitle} ({available.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-56 overflow-y-auto border-t">
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No groups available</p>
            ) : (
              available.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleLeft(item.id)}
                  className={`px-4 py-2 text-sm cursor-pointer border-b last:border-b-0 transition-colors ${
                    leftSelected.has(item.id)
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  {item.name}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Move buttons */}
      <div className="flex flex-col gap-2 pt-12">
        <Button
          variant="outline"
          size="icon"
          onClick={moveRight}
          disabled={leftSelected.size === 0}
          title="Add selected"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={moveLeft}
          disabled={rightSelected.size === 0}
          title="Remove selected"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Right panel */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">{selectedTitle} ({selectedItems.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-56 overflow-y-auto border-t">
            {selectedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No groups selected</p>
            ) : (
              selectedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleRight(item.id)}
                  className={`px-4 py-2 text-sm cursor-pointer border-b last:border-b-0 transition-colors ${
                    rightSelected.has(item.id)
                      ? "bg-destructive/10 text-destructive font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  {item.name}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
