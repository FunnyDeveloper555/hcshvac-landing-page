import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileFolder } from "@/hooks/useFileManager";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface FolderTreeProps {
  folders: FileFolder[];
  currentFolderId: string | null;
  onNavigate: (id: string | null) => void;
  onCreateFolder: () => void;
  onRenameFolder: (folder: FileFolder) => void;
  onDeleteFolder: (folder: FileFolder) => void;
  onDropItem: (targetFolderId: string | null, dataTransfer: DataTransfer) => void;
}

function FolderNode({
  folder,
  allFolders,
  currentFolderId,
  depth,
  onNavigate,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDropItem,
}: {
  folder: FileFolder;
  allFolders: FileFolder[];
  currentFolderId: string | null;
  depth: number;
  onNavigate: (id: string) => void;
  onCreateFolder: () => void;
  onRenameFolder: (folder: FileFolder) => void;
  onDeleteFolder: (folder: FileFolder) => void;
  onDropItem: (targetFolderId: string, dataTransfer: DataTransfer) => void;
}) {
  const children = allFolders.filter((f) => f.parent_id === folder.id);
  const [expanded, setExpanded] = useState(false);
  const isActive = currentFolderId === folder.id;
  const [dragOver, setDragOver] = useState(false);

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-sm rounded-md cursor-pointer select-none transition-colors",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-muted",
              dragOver && "ring-2 ring-primary bg-primary/10"
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => {
              onNavigate(folder.id);
              if (children.length > 0) setExpanded(!expanded);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
              onDropItem(folder.id, e.dataTransfer);
            }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/fm-folder", folder.id);
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
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onCreateFolder}>
            <Plus className="h-4 w-4 mr-2" /> New Subfolder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onRenameFolder(folder)}>
            <Pencil className="h-4 w-4 mr-2" /> Rename
          </ContextMenuItem>
          <ContextMenuItem
            className="text-destructive"
            onClick={() => onDeleteFolder(folder)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {expanded &&
        children.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            allFolders={allFolders}
            currentFolderId={currentFolderId}
            depth={depth + 1}
            onNavigate={onNavigate}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onDropItem={onDropItem}
          />
        ))}
    </div>
  );
}

export function FolderTree({
  folders,
  currentFolderId,
  onNavigate,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDropItem,
}: FolderTreeProps) {
  const rootFolders = folders.filter((f) => f.parent_id === null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-semibold text-muted-foreground">Folders</span>
        <button
          onClick={onCreateFolder}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          title="New Folder"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {/* Root entry */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-sm rounded-md cursor-pointer mx-1 transition-colors",
            currentFolderId === null
              ? "bg-accent text-accent-foreground font-medium"
              : "hover:bg-muted",
            dragOver && "ring-2 ring-primary bg-primary/10"
          )}
          onClick={() => onNavigate(null)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onDropItem(null as any, e.dataTransfer);
          }}
        >
          <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
          <span>Root</span>
        </div>
        {rootFolders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            allFolders={folders}
            currentFolderId={currentFolderId}
            depth={1}
            onNavigate={onNavigate}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onDropItem={onDropItem}
          />
        ))}
      </div>
    </div>
  );
}
