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
  FolderOpen,
  File as FileIcon,
  Image,
  FileText,
  FileVideo,
  FileAudio,
  Search,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";

interface FileManagerPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fileUrl: string, fileName: string) => void;
  accept?: string;
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

// --- Folder Tree Node ---
function PickerFolderNode({
  folder,
  allFolders,
  currentFolderId,
  depth,
  onNavigate,
}: {
  folder: PickerFolder;
  allFolders: PickerFolder[];
  currentFolderId: string | null;
  depth: number;
  onNavigate: (id: string) => void;
}) {
  const children = allFolders.filter((f) => f.parent_id === folder.id);
  const [expanded, setExpanded] = useState(false);
  const isActive = currentFolderId === folder.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 text-sm rounded-md cursor-pointer select-none transition-colors",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => {
          onNavigate(folder.id);
          if (children.length > 0) setExpanded(!expanded);
        }}
      >
        {children.length > 0 ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isActive ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{folder.name}</span>
      </div>
      {expanded &&
        children.map((child) => (
          <PickerFolderNode
            key={child.id}
            folder={child}
            allFolders={allFolders}
            currentFolderId={currentFolderId}
            depth={depth + 1}
            onNavigate={onNavigate}
          />
        ))}
    </div>
  );
}

// --- File Preview ---
function FilePreviewContent({ file }: { file: PickerFile }) {
  const mime = file.mime_type || "";

  if (mime.startsWith("image/")) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <img
          src={file.file_url}
          alt={file.name}
          className="max-w-full max-h-full object-contain rounded"
        />
      </div>
    );
  }

  if (mime.startsWith("video/")) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <video src={file.file_url} controls className="max-w-full max-h-full rounded" />
      </div>
    );
  }

  if (mime.startsWith("audio/")) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <FileAudio className="h-16 w-16 text-muted-foreground" />
        <audio src={file.file_url} controls className="w-full max-w-sm" />
      </div>
    );
  }

  if (mime === "application/pdf") {
    return (
      <iframe
        src={file.file_url}
        className="w-full h-full rounded border-0"
        title={file.name}
      />
    );
  }

  const Icon = getFileIcon(mime);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-muted-foreground">
      <Icon className="h-16 w-16" />
      <p className="text-sm font-medium">{file.name}</p>
      <p className="text-xs">{formatSize(file.file_size)}</p>
      <a
        href={file.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary underline"
      >
        Open in new tab
      </a>
    </div>
  );
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
  const [previewFile, setPreviewFile] = useState<PickerFile | null>(null);

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

  const filteredFiles = files.filter((f) => {
    const matchesMime = matchesMimeFilter(f.mime_type, accept);
    const matchesSearch =
      !searchQuery.trim() ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMime && matchesSearch;
  });

  const selectedFile = filteredFiles.find((f) => f.id === selectedFileId);
  const rootFolders = folders.filter((f) => f.parent_id === null);

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile.file_url, selectedFile.name);
      onOpenChange(false);
      setSelectedFileId(null);
      setCurrentFolderId(null);
      setSearchQuery("");
      setPreviewFile(null);
    }
  };

  // Preview dialog
  if (previewFile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold truncate">{previewFile.name}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPreviewFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <FilePreviewContent file={previewFile} />
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setPreviewFile(null)}>
              Back
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onSelect(previewFile.file_url, previewFile.name);
                onOpenChange(false);
                setPreviewFile(null);
                setSelectedFileId(null);
                setCurrentFolderId(null);
                setSearchQuery("");
              }}
            >
              Select This File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="px-4 pt-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files…"
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex-1 min-h-0 flex border-t mx-4 mt-2 rounded-md border overflow-hidden">
          {/* Left: Folder tree */}
          <div className="w-[200px] shrink-0 border-r bg-muted/30">
            <ScrollArea className="h-full">
              <div className="py-1">
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 text-sm rounded-md cursor-pointer mx-1 transition-colors",
                    currentFolderId === null
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    setCurrentFolderId(null);
                    setSelectedFileId(null);
                  }}
                >
                  <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                  <span>All Files</span>
                </div>
                {rootFolders.map((folder) => (
                  <PickerFolderNode
                    key={folder.id}
                    folder={folder}
                    allFolders={folders}
                    currentFolderId={currentFolderId}
                    depth={1}
                    onNavigate={(id) => {
                      setCurrentFolderId(id);
                      setSelectedFileId(null);
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: File list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.mime_type);
                const isImage = file.mime_type?.startsWith("image/");
                const isSelected = selectedFileId === file.id;
                return (
                  <button
                    key={file.id}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted border border-transparent"
                    )}
                    onClick={() => setSelectedFileId(file.id)}
                    onDoubleClick={() => setPreviewFile(file)}
                  >
                    {isImage ? (
                      <img
                        src={file.file_url}
                        alt={file.name}
                        className="h-8 w-8 object-cover rounded shrink-0"
                      />
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate flex-1 text-left">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatSize(file.file_size)}
                    </span>
                  </button>
                );
              })}
              {filteredFiles.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  {searchQuery ? "No matching files found" : "This folder is empty"}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
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
