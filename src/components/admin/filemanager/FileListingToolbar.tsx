import {
  Upload, Grid3X3, List, ClipboardPaste, Trash2, Search, Undo2,
  ArrowUpDown, ArrowUp, ArrowDown, Eye, Download, Copy, Scissors, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";
import type { SortField, SortDirection } from "@/hooks/useFileManager";

interface FileListingToolbarProps {
  breadcrumbs: { id: string | null; name: string }[];
  onNavigate: (id: string | null) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onUploadClick: () => void;
  hasClipboard: boolean;
  onPaste: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  onSortDirectionToggle: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onPreviewSelected?: () => void;
  onDownloadSelected?: () => void;
  onCopySelected?: () => void;
  onCutSelected?: () => void;
  onRenameSelected?: () => void;
}

export function FileListingToolbar({
  breadcrumbs,
  onNavigate,
  viewMode,
  onViewModeChange,
  onUploadClick,
  hasClipboard,
  onPaste,
  selectedCount,
  onDeleteSelected,
  searchQuery,
  onSearchChange,
  sortField,
  sortDirection,
  onSortChange,
  onSortDirectionToggle,
  canUndo,
  onUndo,
  onPreviewSelected,
  onDownloadSelected,
  onCopySelected,
  onCutSelected,
  onRenameSelected,
}: FileListingToolbarProps) {
  const SortIcon = sortDirection === "asc" ? ArrowUp : ArrowDown;
  const hasSelection = selectedCount > 0;
  const hasSingleSelection = selectedCount === 1;

  return (
    <div className="flex flex-col gap-2 px-4 py-2 border-b">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id ?? "root"}>
                {idx > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {idx === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => onNavigate(crumb.id)}
                    >
                      {crumb.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-1">
          {/* File actions - shown when files are selected */}
          {hasSingleSelection && onPreviewSelected && (
            <Button variant="outline" size="sm" onClick={onPreviewSelected} title="Preview">
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {hasSingleSelection && onDownloadSelected && (
            <Button variant="outline" size="sm" onClick={onDownloadSelected} title="Download">
              <Download className="h-4 w-4" />
            </Button>
          )}
          {hasSelection && onCopySelected && (
            <Button variant="outline" size="sm" onClick={onCopySelected} title="Copy">
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {hasSelection && onCutSelected && (
            <Button variant="outline" size="sm" onClick={onCutSelected} title="Cut">
              <Scissors className="h-4 w-4" />
            </Button>
          )}
          {hasSingleSelection && onRenameSelected && (
            <Button variant="outline" size="sm" onClick={onRenameSelected} title="Rename">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {hasSelection && (
            <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedCount})
            </Button>
          )}

          {/* Separator between file actions and general actions */}
          {hasSelection && <div className="w-px h-6 bg-border mx-1" />}

          {hasClipboard && (
            <Button variant="outline" size="sm" onClick={onPaste}>
              <ClipboardPaste className="h-4 w-4 mr-1" />
              Paste
            </Button>
          )}
          {canUndo && (
            <Button variant="outline" size="sm" onClick={onUndo} title="Undo last action">
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onUploadClick}>
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="h-4 w-4 mr-1" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["name", "date", "size"] as SortField[]).map((field) => (
                <DropdownMenuItem
                  key={field}
                  onClick={() => onSortChange(field)}
                  className={sortField === field ? "font-semibold" : ""}
                >
                  {field === "name" ? "Name" : field === "date" ? "Date Modified" : "Size"}
                  {sortField === field && <SortIcon className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={onSortDirectionToggle}>
                {sortDirection === "asc" ? "↓ Descending" : "↑ Ascending"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex border rounded-md">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-1.5 ${viewMode === "grid" ? "bg-muted" : ""}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-1.5 ${viewMode === "list" ? "bg-muted" : ""}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files…"
          className="pl-8 h-8 text-sm"
        />
      </div>
    </div>
  );
}
