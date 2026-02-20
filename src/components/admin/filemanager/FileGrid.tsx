import { File as FileIcon, Image, FileText, FileVideo, FileAudio, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileItem, FileFolder } from "@/hooks/useFileManager";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Scissors, Pencil, Trash2, Download, Eye } from "lucide-react";

interface FileGridProps {
  files: FileItem[];
  subfolders: FileFolder[];
  selectedFiles: Set<string>;
  viewMode: "grid" | "list";
  onFileClick: (fileId: string, e: React.MouseEvent) => void;
  onFileDoubleClick: (file: FileItem) => void;
  onFolderClick: (folderId: string) => void;
  onCopy: (file: FileItem) => void;
  onCut: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onPreview: (file: FileItem) => void;
  onRenameFolder: (folder: FileFolder) => void;
  onDeleteFolder: (folder: FileFolder) => void;
  onDropItem: (targetFolderId: string, dataTransfer: DataTransfer) => void;
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
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(mimeType: string | null) {
  return mimeType?.startsWith("image/") ?? false;
}

export function FileGrid({
  files,
  subfolders,
  selectedFiles,
  viewMode,
  onFileClick,
  onFileDoubleClick,
  onFolderClick,
  onCopy,
  onCut,
  onRename,
  onDelete,
  onDownload,
  onPreview,
  onRenameFolder,
  onDeleteFolder,
  onDropItem,
}: FileGridProps) {
  if (subfolders.length === 0 && files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-16">
        This folder is empty. Upload files or create subfolders.
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium w-24">Size</th>
              <th className="px-4 py-2 font-medium w-40">Modified</th>
            </tr>
          </thead>
          <tbody>
            {subfolders.map((folder) => (
              <tr
                key={folder.id}
                className="border-b hover:bg-muted/50 cursor-pointer"
                onDoubleClick={() => onFolderClick(folder.id)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); onDropItem(folder.id, e.dataTransfer); }}
              >
                <td className="px-4 py-2 flex items-center gap-2">
                  <ContextMenu>
                    <ContextMenuTrigger className="flex items-center gap-2 w-full">
                      <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => onRenameFolder(folder)}>
                        <Pencil className="h-4 w-4 mr-2" /> Rename
                      </ContextMenuItem>
                      <ContextMenuItem className="text-destructive" onClick={() => onDeleteFolder(folder)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(folder.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {files.map((file) => {
              const Icon = getFileIcon(file.mime_type);
              const selected = selectedFiles.has(file.id);
              return (
                <tr
                  key={file.id}
                  className={cn(
                    "border-b cursor-pointer transition-colors",
                    selected ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                  onClick={(e) => onFileClick(file.id, e)}
                  onDoubleClick={() => onFileDoubleClick(file)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/fm-file", file.id);
                  }}
                >
                  <td className="px-4 py-2">
                    <ContextMenu>
                      <ContextMenuTrigger className="flex items-center gap-2 w-full">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => onPreview(file)}>
                          <Eye className="h-4 w-4 mr-2" /> Preview
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onDownload(file)}>
                          <Download className="h-4 w-4 mr-2" /> Download
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => onCopy(file)}>
                          <Copy className="h-4 w-4 mr-2" /> Copy
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onCut(file)}>
                          <Scissors className="h-4 w-4 mr-2" /> Cut
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onRename(file)}>
                          <Pencil className="h-4 w-4 mr-2" /> Rename
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem className="text-destructive" onClick={() => onDelete(file)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{formatSize(file.file_size)}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(file.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Grid view
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {subfolders.map((folder) => (
          <ContextMenu key={folder.id}>
            <ContextMenuTrigger>
              <div
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border"
                onDoubleClick={() => onFolderClick(folder.id)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); onDropItem(folder.id, e.dataTransfer); }}
              >
                <Folder className="h-10 w-10 text-muted-foreground" />
                <span className="text-xs text-center truncate w-full">{folder.name}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onRenameFolder(folder)}>
                <Pencil className="h-4 w-4 mr-2" /> Rename
              </ContextMenuItem>
              <ContextMenuItem className="text-destructive" onClick={() => onDeleteFolder(folder)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
        {files.map((file) => {
          const Icon = getFileIcon(file.mime_type);
          const selected = selectedFiles.has(file.id);
          return (
            <ContextMenu key={file.id}>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg cursor-pointer transition-colors border",
                    selected
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted border-transparent hover:border-border"
                  )}
                  onClick={(e) => onFileClick(file.id, e)}
                  onDoubleClick={() => onFileDoubleClick(file)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/fm-file", file.id);
                  }}
                >
                  {isImageType(file.mime_type) ? (
                    <img
                      src={file.file_url}
                      alt={file.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <Icon className="h-10 w-10 text-muted-foreground" />
                  )}
                  <span className="text-xs text-center truncate w-full">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatSize(file.file_size)}
                  </span>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => onPreview(file)}>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onDownload(file)}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => onCopy(file)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCut(file)}>
                  <Scissors className="h-4 w-4 mr-2" /> Cut
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onRename(file)}>
                  <Pencil className="h-4 w-4 mr-2" /> Rename
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="text-destructive" onClick={() => onDelete(file)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>
    </div>
  );
}
