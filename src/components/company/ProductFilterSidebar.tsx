import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Minus } from "lucide-react";
import { useState } from "react";

interface FilterOption {
  value: string;
  count: number;
  children?: FilterOption[];
}

interface FilterSection {
  label: string;
  key: string;
  options: FilterOption[];
}

interface ProductFilterSidebarProps {
  sections: FilterSection[];
  selected: Record<string, string[]>;
  onToggle: (sectionKey: string, value: string) => void;
  onToggleGroup?: (sectionKey: string, values: string[], select: boolean) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

const MAX_VISIBLE = 5;

const ProductFilterSidebar = ({
  sections,
  selected,
  onToggle,
  onToggleGroup,
  onClearAll,
  hasActiveFilters,
}: ProductFilterSidebarProps) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleExpand = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleParent = (key: string) =>
    setExpandedParents((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderOption = (
    sectionKey: string,
    opt: FilterOption,
    depth: number = 0
  ) => {
    const isChecked = selected[sectionKey]?.includes(opt.value) ?? false;
    const hasChildren = opt.children && opt.children.length > 0;
    const parentKey = `${sectionKey}-${opt.value}`;
    const isParentExpanded = expandedParents[parentKey] ?? false;

    // For parent items, check if all children are selected
    const allChildrenSelected = hasChildren
      ? opt.children!.every((c) => selected[sectionKey]?.includes(c.value))
      : false;
    const someChildrenSelected = hasChildren
      ? opt.children!.some((c) => selected[sectionKey]?.includes(c.value))
      : false;

    return (
      <div key={opt.value}>
        <div
          className="flex items-center gap-1.5 cursor-pointer group py-0.5"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleParent(parentKey)}
              className="p-0.5 hover:bg-muted rounded transition-colors"
            >
              {isParentExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          )}
          {!hasChildren && <span className="w-[18px]" />}
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <Checkbox
              checked={hasChildren ? allChildrenSelected : isChecked}
              // Show indeterminate-like state via styling
              className={`h-3.5 w-3.5 ${
                hasChildren && someChildrenSelected && !allChildrenSelected
                  ? "opacity-60"
                  : ""
              }`}
              onCheckedChange={() => {
                if (hasChildren && onToggleGroup) {
                  const childValues = opt.children!.map((c) => c.value);
                  onToggleGroup(sectionKey, childValues, !allChildrenSelected);
                } else {
                  onToggle(sectionKey, opt.value);
                }
              }}
            />
            <span
              className={`text-sm transition-colors ${
                hasChildren
                  ? "font-semibold text-foreground"
                  : isChecked
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
        </div>
        {hasChildren && isParentExpanded && (
          <div className="mt-0.5">
            {opt.children!.map((child) =>
              renderOption(sectionKey, child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

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

        // Separate flat options from hierarchical
        const hasHierarchy = section.options.some(
          (o) => o.children && o.children.length > 0
        );

        const flatOptions = section.options.filter(
          (o) => !o.children || o.children.length === 0
        );
        const hierarchicalOptions = section.options.filter(
          (o) => o.children && o.children.length > 0
        );

        const visibleFlatOptions =
          isExpanded || flatOptions.length <= MAX_VISIBLE
            ? flatOptions
            : flatOptions.slice(0, MAX_VISIBLE);

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
              <div className="mt-1.5 space-y-0.5">
                {/* Render hierarchical (parent/child) options first */}
                {hierarchicalOptions.map((opt) =>
                  renderOption(section.key, opt)
                )}
                {/* Then flat options */}
                {visibleFlatOptions.map((opt) =>
                  renderOption(section.key, opt)
                )}
                {flatOptions.length > MAX_VISIBLE && !hasHierarchy && (
                  <button
                    onClick={() => toggleExpand(section.key)}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    {isExpanded
                      ? "Show less"
                      : `More (${flatOptions.length - MAX_VISIBLE})…`}
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
