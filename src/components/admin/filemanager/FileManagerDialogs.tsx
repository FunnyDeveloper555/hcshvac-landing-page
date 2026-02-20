import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload } from "lucide-react";
import type { FileItem } from "@/hooks/useFileManager";
import type { ConflictResolution, PasteConflict } from "@/hooks/useFileManager";

// --- New Folder Dialog ---
export function NewFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Folder Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter folder name"
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                onSubmit(name.trim());
                setName("");
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || isPending}
            onClick={() => {
              onSubmit(name.trim());
              setName("");
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Rename Dialog ---
export function RenameDialog({
  open,
  onOpenChange,
  currentName,
  itemType,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  itemType: "file" | "folder";
  onSubmit: (name: string) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(currentName);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename {itemType === "file" ? "File" : "Folder"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>New Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) onSubmit(name.trim());
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || isPending} onClick={() => onSubmit(name.trim())}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Delete Confirm Dialog ---
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  message,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// --- Upload Dialog ---
export function UploadDialog({
  open,
  onOpenChange,
  onUpload,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => void;
  isPending: boolean;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSubmit = () => {
    onUpload(selectedFiles);
    setSelectedFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelectedFiles([]); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop files here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">Max 50 MB per file</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {selectedFiles.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1 bg-muted rounded">
                <span className="truncate">{f.name}</span>
                <span className="text-muted-foreground text-xs shrink-0 ml-2">
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            ))}
          </div>
        )}
        {isPending && <Progress value={undefined} className="h-2" />}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={selectedFiles.length === 0 || isPending}
            onClick={handleSubmit}
          >
            Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Preview Dialog ---
export function PreviewDialog({
  open,
  onOpenChange,
  file,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
}) {
  if (!file) return null;
  const isImage = file.mime_type?.startsWith("image/");
  const isVideo = file.mime_type?.startsWith("video/");
  const isAudio = file.mime_type?.startsWith("audio/");
  const isPdf = file.mime_type === "application/pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="truncate">{file.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 overflow-auto">
          {isImage && (
            <img
              src={file.file_url}
              alt={file.name}
              className="max-w-full max-h-[60vh] object-contain rounded"
            />
          )}
          {isVideo && (
            <video src={file.file_url} controls className="max-w-full max-h-[60vh] rounded" />
          )}
          {isAudio && <audio src={file.file_url} controls className="w-full" />}
          {isPdf && (
            <iframe src={file.file_url} className="w-full h-[60vh] rounded border" />
          )}
          {!isImage && !isVideo && !isAudio && !isPdf && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">Preview not available for this file type.</p>
              <p className="text-sm text-muted-foreground">
                Type: {file.mime_type || "Unknown"} • Size:{" "}
                {file.file_size
                  ? `${(file.file_size / 1024 / 1024).toFixed(1)} MB`
                  : "Unknown"}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button asChild>
            <a href={file.file_url} download={file.name} target="_blank" rel="noopener noreferrer">
              Download
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Paste Conflict Dialog ---
export function PasteConflictDialog({
  open,
  conflict,
  onResolve,
}: {
  open: boolean;
  conflict: PasteConflict | null;
  onResolve: (resolution: ConflictResolution) => void;
}) {
  if (!conflict) return null;
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onResolve(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>File Already Exists</AlertDialogTitle>
          <AlertDialogDescription>
            A file named <strong>"{conflict.incomingName}"</strong> already exists in this folder. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onResolve(null)}>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={() => onResolve("rename")}>
            Keep Both (Rename)
          </Button>
          <Button variant="destructive" onClick={() => onResolve("replace")}>
            Replace
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
