import { Upload, Grid3X3, List, ClipboardPaste, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

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
}: FileListingToolbarProps) {
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
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedCount})
            </Button>
          )}
          {hasClipboard && (
            <Button variant="outline" size="sm" onClick={onPaste}>
              <ClipboardPaste className="h-4 w-4 mr-1" />
              Paste
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onUploadClick}>
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
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
    </div>
  );
}
