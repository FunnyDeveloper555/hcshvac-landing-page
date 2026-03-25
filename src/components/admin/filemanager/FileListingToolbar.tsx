import {
  Upload, Grid3X3, List, ClipboardPaste, Trash2, Search, Undo2,
  ArrowUpDown, ArrowUp, ArrowDown, Eye, Download, Copy, Scissors, Pencil, Info,
  FolderOpen, MoreVertical, ImageIcon, Sparkles,
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
  DropdownMenuSeparator,
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
  onFoldersClick?: () => void;
  onPreviewSelected?: () => void;
  onDownloadSelected?: () => void;
  onCopySelected?: () => void;
  onCutSelected?: () => void;
  onRenameSelected?: () => void;
  onPropertiesSelected?: () => void;
  onEditImageSelected?: () => void;
  isSelectedImage?: boolean;
  onAIGenerateClick?: () => void;
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
  onFoldersClick,
  onPreviewSelected,
  onDownloadSelected,
  onCopySelected,
  onCutSelected,
  onRenameSelected,
  onPropertiesSelected,
  onEditImageSelected,
  isSelectedImage,
  onAIGenerateClick,
}: FileListingToolbarProps) {
  const SortIcon = sortDirection === "asc" ? ArrowUp : ArrowDown;
  const hasSelection = selectedCount > 0;
  const hasSingleSelection = selectedCount === 1;

  return (
    <div className="flex flex-col gap-2 px-3 sm:px-4 py-2 border-b">
      {/* Row 1: Breadcrumbs + actions */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          {/* Mobile folders button */}
          {onFoldersClick && (
            <Button variant="outline" size="sm" onClick={onFoldersClick} className="shrink-0">
              <FolderOpen className="h-4 w-4" />
            </Button>
          )}
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id ?? "root"}>
                  {idx > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem className="min-w-0">
                    {idx === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="truncate max-w-[120px] sm:max-w-none">{crumb.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        className="cursor-pointer truncate max-w-[80px] sm:max-w-none"
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
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Selection actions - collapsed into overflow menu on mobile */}
          {hasSelection && (
            <>
              {/* Desktop: show individual buttons */}
              <div className="hidden sm:flex items-center gap-1">
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
                {onCopySelected && (
                  <Button variant="outline" size="sm" onClick={onCopySelected} title="Copy">
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {onCutSelected && (
                  <Button variant="outline" size="sm" onClick={onCutSelected} title="Cut">
                    <Scissors className="h-4 w-4" />
                  </Button>
                )}
                {hasSingleSelection && onRenameSelected && (
                  <Button variant="outline" size="sm" onClick={onRenameSelected} title="Rename">
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {hasSingleSelection && onPropertiesSelected && (
                  <Button variant="outline" size="sm" onClick={onPropertiesSelected} title="Properties">
                    <Info className="h-4 w-4" />
                  </Button>
                )}
                {hasSingleSelection && isSelectedImage && onEditImageSelected && (
                  <Button variant="outline" size="sm" onClick={onEditImageSelected} title="Edit Image">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Mobile: overflow menu for selection actions */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {hasSingleSelection && onPreviewSelected && (
                      <DropdownMenuItem onClick={onPreviewSelected}>
                        <Eye className="h-4 w-4 mr-2" /> Preview
                      </DropdownMenuItem>
                    )}
                    {hasSingleSelection && onDownloadSelected && (
                      <DropdownMenuItem onClick={onDownloadSelected}>
                        <Download className="h-4 w-4 mr-2" /> Download
                      </DropdownMenuItem>
                    )}
                    {onCopySelected && (
                      <DropdownMenuItem onClick={onCopySelected}>
                        <Copy className="h-4 w-4 mr-2" /> Copy
                      </DropdownMenuItem>
                    )}
                    {onCutSelected && (
                      <DropdownMenuItem onClick={onCutSelected}>
                        <Scissors className="h-4 w-4 mr-2" /> Cut
                      </DropdownMenuItem>
                    )}
                    {hasSingleSelection && onRenameSelected && (
                      <DropdownMenuItem onClick={onRenameSelected}>
                        <Pencil className="h-4 w-4 mr-2" /> Rename
                      </DropdownMenuItem>
                    )}
                    {hasSingleSelection && onPropertiesSelected && (
                      <DropdownMenuItem onClick={onPropertiesSelected}>
                        <Info className="h-4 w-4 mr-2" /> Properties
                      </DropdownMenuItem>
                    )}
                    {hasSingleSelection && isSelectedImage && onEditImageSelected && (
                      <DropdownMenuItem onClick={onEditImageSelected}>
                        <ImageIcon className="h-4 w-4 mr-2" /> Edit Image
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
                <Trash2 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Delete ({selectedCount})</span>
              </Button>
              <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
            </>
          )}

          {hasClipboard && (
            <Button variant="outline" size="sm" onClick={onPaste}>
              <ClipboardPaste className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Paste</span>
            </Button>
          )}
          {canUndo && (
            <Button variant="outline" size="sm" onClick={onUndo} title="Undo last action">
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onUploadClick}>
            <Upload className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          {onAIGenerateClick && (
            <Button variant="outline" size="sm" onClick={onAIGenerateClick} title="Generate with AI">
              <Sparkles className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">AI Generate</span>
            </Button>
          )}

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Sort</span>
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

          <div className="hidden sm:flex border rounded-md">
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

      {/* Row 2: Search bar */}
      <div className="relative w-full sm:max-w-xs">
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
