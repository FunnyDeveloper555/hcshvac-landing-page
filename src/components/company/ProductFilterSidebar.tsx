import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import { useState } from "react";

interface FilterSection {
  label: string;
  key: string;
  options: { value: string; count: number }[];
}

interface ProductFilterSidebarProps {
  sections: FilterSection[];
  selected: Record<string, string[]>;
  onToggle: (sectionKey: string, value: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

const MAX_VISIBLE = 5;

const ProductFilterSidebar = ({
  sections,
  selected,
  onToggle,
  onClearAll,
  hasActiveFilters,
}: ProductFilterSidebarProps) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleExpand = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside className="w-56 shrink-0 space-y-1">
      {hasActiveFilters && (
        <Button
          variant="link"
          size="sm"
          className="px-0 text-xs mb-2 text-destructive"
          onClick={onClearAll}
        >
          Clear all filters
        </Button>
      )}
      {sections.map((section) => {
        const isCollapsed = collapsed[section.key];
        const isExpanded = expanded[section.key];
        const visibleOptions =
          isExpanded || section.options.length <= MAX_VISIBLE
            ? section.options
            : section.options.slice(0, MAX_VISIBLE);

        return (
          <div key={section.key} className="border-b border-border pb-3 mb-3">
            <button
              onClick={() => toggle(section.key)}
              className="flex items-center justify-between w-full text-sm font-semibold text-foreground py-1.5 hover:text-primary transition-colors"
            >
              <span>{section.label}</span>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {!isCollapsed && (
              <div className="mt-1.5 space-y-1">
                {visibleOptions.map((opt) => {
                  const isChecked =
                    selected[section.key]?.includes(opt.value) ?? false;
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer group py-0.5"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() =>
                          onToggle(section.key, opt.value)
                        }
                        className="h-3.5 w-3.5"
                      />
                      <span
                        className={`text-sm transition-colors ${
                          isChecked
                            ? "text-primary font-medium"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {opt.value}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                        {opt.count.toLocaleString()}
                      </span>
                    </label>
                  );
                })}
                {section.options.length > MAX_VISIBLE && (
                  <button
                    onClick={() => toggleExpand(section.key)}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    {isExpanded
                      ? "Show less"
                      : `More (${section.options.length - MAX_VISIBLE})…`}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};

export default ProductFilterSidebar;
