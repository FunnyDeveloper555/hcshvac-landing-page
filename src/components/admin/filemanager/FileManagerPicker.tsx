import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Folder,
  File as FileIcon,
  Image,
  FileText,
  FileVideo,
  FileAudio,
  Search,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

interface FileManagerPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fileUrl: string, fileName: string) => void;
  accept?: string; // mime type filter e.g. "image/*"
  title?: string;
}

interface PickerFolder {
  id: string;
  name: string;
  parent_id: string | null;
}

interface PickerFile {
  id: string;
  name: string;
  folder_id: string | null;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return FileIcon;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.includes("pdf") || mimeType.includes("text")) return FileText;
  return FileIcon;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesMimeFilter(mimeType: string | null, accept?: string) {
  if (!accept) return true;
  if (!mimeType) return false;
  return accept.split(",").some((pattern) => {
    const p = pattern.trim();
    if (p.endsWith("/*")) {
      return mimeType.startsWith(p.replace("/*", "/"));
    }
    return mimeType === p;
  });
}

export function FileManagerPicker({
  open,
  onOpenChange,
  onSelect,
  accept,
  title = "Select File from File Manager",
}: FileManagerPickerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const { data: folders = [] } = useQuery({
    queryKey: ["fm-picker-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("file_folders")
        .select("id, name, parent_id")
        .order("name");
      if (error) throw error;
      return data as PickerFolder[];
    },
    enabled: open,
  });

  const { data: files = [] } = useQuery({
    queryKey: ["fm-picker-files", currentFolderId],
    queryFn: async () => {
      let query = supabase
        .from("file_items")
        .select("id, name, folder_id, file_url, file_size, mime_type");
      if (currentFolderId) {
        query = query.eq("folder_id", currentFolderId);
      } else {
        query = query.is("folder_id", null);
      }
      const { data, error } = await query.order("name");
      if (error) throw error;
      return data as PickerFile[];
    },
    enabled: open,
  });

  const subfolders = folders.filter((f) => f.parent_id === currentFolderId);

  const filteredFiles = files.filter((f) => {
    const matchesMime = matchesMimeFilter(f.mime_type, accept);
    const matchesSearch = !searchQuery.trim() || f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMime && matchesSearch;
  });

  const selectedFile = filteredFiles.find((f) => f.id === selectedFileId);

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: "Root" }];
    let fid = currentFolderId;
    const path: PickerFolder[] = [];
    while (fid) {
      const folder = folders.find((f) => f.id === fid);
      if (!folder) break;
      path.unshift(folder);
      fid = folder.parent_id;
    }
    path.forEach((f) => crumbs.push({ id: f.id, name: f.name }));
    return crumbs;
  };

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile.file_url, selectedFile.name);
      onOpenChange(false);
      setSelectedFileId(null);
      setCurrentFolderId(null);
      setSearchQuery("");
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.id ?? "root"} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight className="h-3 w-3" />}
              <button
                className={cn(
                  "hover:text-foreground transition-colors",
                  idx === breadcrumbs.length - 1 && "text-foreground font-medium"
                )}
                onClick={() => {
                  setCurrentFolderId(crumb.id);
                  setSelectedFileId(null);
                }}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files…"
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* File listing */}
        <ScrollArea className="flex-1 min-h-[300px] border rounded-md">
          <div className="p-2 space-y-0.5">
            {currentFolderId && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-muted text-sm text-muted-foreground"
                onClick={() => {
                  const current = folders.find((f) => f.id === currentFolderId);
                  setCurrentFolderId(current?.parent_id ?? null);
                  setSelectedFileId(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            {subfolders.map((folder) => (
              <button
                key={folder.id}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-muted text-sm"
                onDoubleClick={() => {
                  setCurrentFolderId(folder.id);
                  setSelectedFileId(null);
                }}
                onClick={() => {
                  setCurrentFolderId(folder.id);
                  setSelectedFileId(null);
                }}
              >
                <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.mime_type);
              const isImage = file.mime_type?.startsWith("image/");
              const isSelected = selectedFileId === file.id;
              return (
                <button
                  key={file.id}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
                    isSelected ? "bg-primary/10 border border-primary" : "hover:bg-muted border border-transparent"
                  )}
                  onClick={() => setSelectedFileId(file.id)}
                  onDoubleClick={handleSelect}
                >
                  {isImage ? (
                    <img src={file.file_url} alt={file.name} className="h-8 w-8 object-cover rounded shrink-0" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate flex-1 text-left">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.file_size)}</span>
                </button>
              );
            })}
            {subfolders.length === 0 && filteredFiles.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                {searchQuery ? "No matching files found" : "This folder is empty"}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Preview & Select */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground truncate max-w-[60%]">
            {selectedFile ? selectedFile.name : "No file selected"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSelect} disabled={!selectedFile}>
              Select File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
