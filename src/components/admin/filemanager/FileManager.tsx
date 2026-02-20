import { useState, useCallback } from "react";
import { useFileManager, FileItem, FileFolder } from "@/hooks/useFileManager";
import { FolderTree } from "./FolderTree";
import { FileListingToolbar } from "./FileListingToolbar";
import { FileGrid } from "./FileGrid";
import {
  NewFolderDialog,
  RenameDialog,
  DeleteConfirmDialog,
  UploadDialog,
  PreviewDialog,
  PasteConflictDialog,
} from "./FileManagerDialogs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function FileManager() {
  const fm = useFileManager();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dialog states
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    type: "file" | "folder";
    id: string;
    name: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "file" | "folder";
    items: (FileItem | FileFolder)[];
    message: string;
  } | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const handleFileClick = (fileId: string, e: React.MouseEvent) => {
    const allIds = fm.files.map((f) => f.id);
    fm.toggleFileSelection(fileId, e.ctrlKey || e.metaKey, e.shiftKey, allIds);
  };

  const handleFileDoubleClick = (file: FileItem) => {
    setPreviewFile(file);
  };

  const handleDownload = (file: FileItem) => {
    const a = document.createElement("a");
    a.href = file.file_url;
    a.download = file.name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteSelected = () => {
    const items = fm.files.filter((f) => fm.selectedFiles.has(f.id));
    if (items.length === 0) return;
    setDeleteTarget({
      type: "file",
      items,
      message: `Are you sure you want to delete ${items.length} file(s)? This cannot be undone.`,
    });
  };

  const handleDropOnFolder = useCallback(
    (targetFolderId: string | null, dataTransfer: DataTransfer) => {
      const fileId = dataTransfer.getData("application/fm-file");
      const folderId = dataTransfer.getData("application/fm-folder");
      if (fileId) {
        fm.moveFileToFolder.mutate({ fileId, targetFolderId });
      } else if (folderId && folderId !== targetFolderId) {
        fm.moveFolderToFolder.mutate({
          folderId,
          targetParentId: targetFolderId,
        });
      }
    },
    [fm.moveFileToFolder, fm.moveFolderToFolder]
  );

  const handleDropOnListing = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        fm.uploadFiles.mutate(Array.from(e.dataTransfer.files));
        return;
      }
      handleDropOnFolder(fm.currentFolderId, e.dataTransfer);
    },
    [fm.currentFolderId, fm.uploadFiles, handleDropOnFolder]
  );

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
        {/* Folder Tree Panel */}
        <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
          <div className="h-full bg-card">
            {fm.foldersLoading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <FolderTree
                folders={fm.allFolders}
                currentFolderId={fm.currentFolderId}
                onNavigate={fm.setCurrentFolderId}
                onCreateFolder={() => setNewFolderOpen(true)}
                onRenameFolder={(f) =>
                  setRenameTarget({ type: "folder", id: f.id, name: f.name })
                }
                onDeleteFolder={(f) =>
                  setDeleteTarget({
                    type: "folder",
                    items: [f],
                    message: `Delete folder "${f.name}" and all its contents? This cannot be undone.`,
                  })
                }
                onDropItem={handleDropOnFolder}
              />
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* File Listing Panel */}
        <ResizablePanel defaultSize={78}>
          <div
            className="h-full flex flex-col bg-card relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnListing}
          >
            {/* Global processing overlay */}
            {fm.isProcessing && (
              <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-card px-4 py-3 rounded-lg shadow-lg border">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Processing…</span>
                </div>
              </div>
            )}

            <FileListingToolbar
              breadcrumbs={fm.getBreadcrumbs()}
              onNavigate={fm.setCurrentFolderId}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onUploadClick={() => setUploadOpen(true)}
              hasClipboard={!!fm.clipboard}
              onPaste={() => fm.pasteFile.mutate()}
              selectedCount={fm.selectedFiles.size}
              onDeleteSelected={handleDeleteSelected}
              searchQuery={fm.searchQuery}
              onSearchChange={fm.setSearchQuery}
              sortField={fm.sortField}
              sortDirection={fm.sortDirection}
              onSortChange={(field) => {
                if (fm.sortField === field) {
                  fm.setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
                } else {
                  fm.setSortField(field);
                  fm.setSortDirection("asc");
                }
              }}
              onSortDirectionToggle={() =>
                fm.setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
              }
              canUndo={fm.undoStack.length > 0}
              onUndo={fm.performUndo}
              onPreviewSelected={() => {
                const selected = fm.files.find((f) => fm.selectedFiles.has(f.id));
                if (selected) setPreviewFile(selected);
              }}
              onDownloadSelected={() => {
                const selected = fm.files.find((f) => fm.selectedFiles.has(f.id));
                if (selected) handleDownload(selected);
              }}
              onCopySelected={() => {
                const selected = fm.files.find((f) => fm.selectedFiles.has(f.id));
                if (selected) fm.copyToClipboard(selected);
              }}
              onCutSelected={() => {
                const selected = fm.files.find((f) => fm.selectedFiles.has(f.id));
                if (selected) fm.cutToClipboard(selected);
              }}
              onRenameSelected={() => {
                const selected = fm.files.find((f) => fm.selectedFiles.has(f.id));
                if (selected) setRenameTarget({ type: "file", id: selected.id, name: selected.name });
              }}
            />
            {fm.filesLoading ? (
              <div className="p-4 grid grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <FileGrid
                files={fm.files}
                subfolders={fm.currentSubfolders}
                selectedFiles={fm.selectedFiles}
                viewMode={viewMode}
                onFileClick={handleFileClick}
                onFileDoubleClick={handleFileDoubleClick}
                onFolderClick={fm.setCurrentFolderId}
                onCopy={fm.copyToClipboard}
                onCut={fm.cutToClipboard}
                onRename={(f) =>
                  setRenameTarget({ type: "file", id: f.id, name: f.name })
                }
                onDelete={(f) =>
                  setDeleteTarget({
                    type: "file",
                    items: [f],
                    message: `Delete "${f.name}"? This cannot be undone.`,
                  })
                }
                onDownload={handleDownload}
                onPreview={setPreviewFile}
                onRenameFolder={(f) =>
                  setRenameTarget({ type: "folder", id: f.id, name: f.name })
                }
                onDeleteFolder={(f) =>
                  setDeleteTarget({
                    type: "folder",
                    items: [f],
                    message: `Delete folder "${f.name}" and all its contents?`,
                  })
                }
                onDropItem={handleDropOnFolder}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Dialogs */}
      <NewFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onSubmit={(name) => {
          fm.createFolder.mutate(name);
          setNewFolderOpen(false);
        }}
        isPending={fm.createFolder.isPending}
      />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        currentName={renameTarget?.name || ""}
        itemType={renameTarget?.type || "file"}
        onSubmit={(name) => {
          if (!renameTarget) return;
          if (renameTarget.type === "folder") {
            fm.renameFolder.mutate({ id: renameTarget.id, name });
          } else {
            fm.renameFile.mutate({ id: renameTarget.id, name });
          }
          setRenameTarget(null);
        }}
        isPending={fm.renameFolder.isPending || fm.renameFile.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        message={deleteTarget?.message || ""}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "folder") {
            fm.deleteFolder.mutate((deleteTarget.items[0] as FileFolder).id);
          } else {
            fm.deleteFiles.mutate(deleteTarget.items as FileItem[]);
          }
          setDeleteTarget(null);
        }}
        isPending={fm.deleteFolder.isPending || fm.deleteFiles.isPending}
      />

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={(files) => fm.uploadFiles.mutate(files)}
        isPending={fm.uploadFiles.isPending}
      />

      <PreviewDialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
      />

      <PasteConflictDialog
        open={!!fm.pasteConflict}
        conflict={fm.pasteConflict}
        onResolve={fm.resolvePasteConflict}
      />
    </div>
  );
}
