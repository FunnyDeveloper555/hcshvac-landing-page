import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLog } from "./useAdminLog";
import { toast } from "sonner";

export interface FileFolder {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FileItem {
  id: string;
  name: string;
  folder_id: string | null;
  storage_path: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ClipboardAction = "copy" | "cut";
export interface ClipboardItem {
  type: "file";
  item: FileItem;
  action: ClipboardAction;
}

export type SortField = "name" | "date" | "size";
export type SortDirection = "asc" | "desc";

export interface UndoEntry {
  label: string;
  undo: () => Promise<void>;
}

export type ConflictResolution = "replace" | "rename" | null;
export interface PasteConflict {
  existingFile: FileItem;
  incomingName: string;
}

export function useFileManager() {
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Search & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Undo stack
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const pushUndo = useCallback((entry: UndoEntry) => {
    setUndoStack((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  // Paste conflict
  const [pasteConflict, setPasteConflict] = useState<PasteConflict | null>(null);
  const pasteConflictResolveRef = useRef<((resolution: ConflictResolution) => void) | null>(null);

  const resolvePasteConflict = useCallback((resolution: ConflictResolution) => {
    pasteConflictResolveRef.current?.(resolution);
    pasteConflictResolveRef.current = null;
    setPasteConflict(null);
  }, []);

  // Fetch all folders (for tree)
  const { data: allFolders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["file-manager-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("file_folders")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as FileFolder[];
    },
  });

  // Fetch files in current folder
  const { data: rawFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ["file-manager-files", currentFolderId],
    queryFn: async () => {
      let query = supabase.from("file_items").select("*");
      if (currentFolderId) {
        query = query.eq("folder_id", currentFolderId);
      } else {
        query = query.is("folder_id", null);
      }
      const { data, error } = await query.order("name");
      if (error) throw error;
      return data as FileItem[];
    },
  });

  // Filter & sort files
  const files = (() => {
    let result = rawFiles;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "date") cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      else if (sortField === "size") cmp = (a.file_size ?? 0) - (b.file_size ?? 0);
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return result;
  })();

  // Get subfolders of current folder
  const currentSubfolders = allFolders.filter(
    (f) => f.parent_id === currentFolderId
  );

  // Build breadcrumb path
  const getBreadcrumbs = useCallback(() => {
    const crumbs: { id: string | null; name: string }[] = [
      { id: null, name: "Root" },
    ];
    let folderId = currentFolderId;
    const path: FileFolder[] = [];
    while (folderId) {
      const folder = allFolders.find((f) => f.id === folderId);
      if (!folder) break;
      path.unshift(folder);
      folderId = folder.parent_id;
    }
    path.forEach((f) => crumbs.push({ id: f.id, name: f.name }));
    return crumbs;
  }, [currentFolderId, allFolders]);

  // Create folder
  const createFolder = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("file_folders")
        .insert({ name, parent_id: currentFolderId, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-folders"] });
      logAction("create", "settings", data.id, { folder_name: data.name });
      toast.success(`Folder "${data.name}" created`);
      pushUndo({
        label: `Create folder "${data.name}"`,
        undo: async () => {
          await supabase.from("file_folders").delete().eq("id", data.id);
          queryClient.invalidateQueries({ queryKey: ["file-manager-folders"] });
          toast.success(`Undid create folder "${data.name}"`);
        },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Rename folder
  const renameFolder = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data: old } = await supabase.from("file_folders").select("name").eq("id", id).single();
      const { error } = await supabase
        .from("file_folders")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
      return { oldName: old?.name ?? name };
    },
    onSuccess: ({ oldName }, { id, name }) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-folders"] });
      logAction("update", "settings", id, { folder_name: name, action_detail: "rename_folder" });
      toast.success(`Folder renamed to "${name}"`);
      pushUndo({
        label: `Rename folder to "${name}"`,
        undo: async () => {
          await supabase.from("file_folders").update({ name: oldName }).eq("id", id);
          queryClient.invalidateQueries({ queryKey: ["file-manager-folders"] });
          toast.success(`Undid rename, restored "${oldName}"`);
        },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Delete folder
  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const pathsToDelete: string[] = [];
      const collectPaths = async (folderId: string) => {
        const { data: files } = await supabase
          .from("file_items")
          .select("storage_path")
          .eq("folder_id", folderId);
        if (files) pathsToDelete.push(...files.map((f) => f.storage_path));
        const { data: subfolders } = await supabase
          .from("file_folders")
          .select("id")
          .eq("parent_id", folderId);
        if (subfolders) {
          for (const sub of subfolders) await collectPaths(sub.id);
        }
      };
      await collectPaths(id);
      if (pathsToDelete.length > 0) {
        await supabase.storage.from("file-manager").remove(pathsToDelete);
      }
      const { error } = await supabase
        .from("file_folders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-folders"] });
      queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
      if (currentFolderId === id) setCurrentFolderId(null);
      logAction("delete", "settings", id, { action_detail: "delete_folder" });
      toast.success("Folder deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Upload files
  const uploadFiles = useMutation({
    mutationFn: async (fileList: File[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const results: FileItem[] = [];
      for (const file of fileList) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`"${file.name}" exceeds 50MB limit`);
          continue;
        }
        const ext = file.name.split(".").pop() || "";
        const storagePath = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("file-manager")
          .upload(storagePath, file);
        if (uploadError) {
          toast.error(`Upload failed for "${file.name}": ${uploadError.message}`);
          continue;
        }
        const { data: urlData } = supabase.storage
          .from("file-manager")
          .getPublicUrl(storagePath);
        const { data, error: dbError } = await supabase
          .from("file_items")
          .insert({
            name: file.name,
            folder_id: currentFolderId,
            storage_path: storagePath,
            file_url: urlData.publicUrl,
            file_size: file.size,
            mime_type: file.type || null,
            created_by: user.id,
          })
          .select()
          .single();
        if (dbError) {
          toast.error(`DB error for "${file.name}": ${dbError.message}`);
          continue;
        }
        results.push(data as FileItem);
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
      results.forEach((f) =>
        logAction("create", "settings", f.id, { file_name: f.name, action_detail: "upload_file" })
      );
      if (results.length > 0)
        toast.success(`${results.length} file(s) uploaded`);
    },
  });

  // Rename file
  const renameFile = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data: old } = await supabase.from("file_items").select("name").eq("id", id).single();
      const { error } = await supabase
        .from("file_items")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
      return { oldName: old?.name ?? name };
    },
    onSuccess: ({ oldName }, { id, name }) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
      logAction("update", "settings", id, { file_name: name, action_detail: "rename_file" });
      toast.success(`File renamed to "${name}"`);
      pushUndo({
        label: `Rename file to "${name}"`,
        undo: async () => {
          await supabase.from("file_items").update({ name: oldName }).eq("id", id);
          queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
          toast.success(`Undid rename, restored "${oldName}"`);
        },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Delete files
  const deleteFiles = useMutation({
    mutationFn: async (items: FileItem[]) => {
      const paths = items.map((f) => f.storage_path);
      if (paths.length > 0) {
        await supabase.storage.from("file-manager").remove(paths);
      }
      const ids = items.map((f) => f.id);
      const { error } = await supabase
        .from("file_items")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, items) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
      setSelectedFiles(new Set());
      items.forEach((f) =>
        logAction("delete", "settings", f.id, { file_name: f.name, action_detail: "delete_file" })
      );
      toast.success(`${items.length} file(s) deleted`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Helper: generate unique name
  const generateUniqueName = (name: string, existingNames: string[]) => {
    const dotIdx = name.lastIndexOf(".");
    const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
    const ext = dotIdx > 0 ? name.slice(dotIdx) : "";
    let counter = 1;
    let newName = `${base} (${counter})${ext}`;
    while (existingNames.includes(newName)) {
      counter++;
      newName = `${base} (${counter})${ext}`;
    }
    return newName;
  };

  // Paste (copy or move) with conflict detection
  const pasteFile = useMutation({
    mutationFn: async (resolution?: ConflictResolution | void) => {
      if (!clipboard) throw new Error("Nothing in clipboard");
      const { item, action } = clipboard;

      // Check for name conflict in destination
      const { data: destFiles } = await supabase
        .from("file_items")
        .select("id, name")
        .eq("folder_id", currentFolderId ?? "")
        .or(currentFolderId ? `folder_id.eq.${currentFolderId}` : "folder_id.is.null");

      // Re-query properly
      let queryBuilder = supabase.from("file_items").select("id, name");
      if (currentFolderId) {
        queryBuilder = queryBuilder.eq("folder_id", currentFolderId);
      } else {
        queryBuilder = queryBuilder.is("folder_id", null);
      }
      const { data: filesInDest } = await queryBuilder;
      const existingFile = filesInDest?.find((f) => f.name === item.name && f.id !== item.id);

      if (existingFile && !resolution) {
        // Ask the user
        const userChoice = await new Promise<ConflictResolution>((resolve) => {
          pasteConflictResolveRef.current = resolve;
          setPasteConflict({ existingFile: existingFile as unknown as FileItem, incomingName: item.name });
        });
        if (!userChoice) throw new Error("Paste cancelled");
        resolution = userChoice;
      }

      let finalName = item.name;
      if (resolution === "replace" && existingFile) {
        // Delete the existing file first
        const { data: fullExisting } = await supabase.from("file_items").select("storage_path").eq("id", existingFile.id).single();
        if (fullExisting) {
          await supabase.storage.from("file-manager").remove([fullExisting.storage_path]);
        }
        await supabase.from("file_items").delete().eq("id", existingFile.id);
      } else if (resolution === "rename" || (existingFile && resolution !== "replace")) {
        const names = filesInDest?.map((f) => f.name) ?? [];
        finalName = generateUniqueName(item.name, names);
      }

      if (action === "copy") {
        const ext = item.name.split(".").pop() || "";
        const newPath = `${crypto.randomUUID()}.${ext}`;
        const { data: blob } = await supabase.storage
          .from("file-manager")
          .download(item.storage_path);
        if (!blob) throw new Error("Failed to download source file");
        const { error: upErr } = await supabase.storage
          .from("file-manager")
          .upload(newPath, blob);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage
          .from("file-manager")
          .getPublicUrl(newPath);
        const { data: { user } } = await supabase.auth.getUser();
        const { error: dbErr } = await supabase.from("file_items").insert({
          name: finalName,
          folder_id: currentFolderId,
          storage_path: newPath,
          file_url: urlData.publicUrl,
          file_size: item.file_size,
          mime_type: item.mime_type,
          created_by: user!.id,
        });
        if (dbErr) throw dbErr;
      } else {
        // Move: update folder_id and possibly name
        const updateData: Record<string, unknown> = { folder_id: currentFolderId };
        if (finalName !== item.name) updateData.name = finalName;
        const { error } = await supabase
          .from("file_items")
          .update(updateData)
          .eq("id", item.id);
        if (error) throw error;
      }
      return { action, finalName };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
      logAction("update", "settings", clipboard?.item.id, {
        file_name: clipboard?.item.name || "",
        action_detail: result?.action === "copy" ? "copy_file" : "move_file",
      });
      setClipboard(null);
      toast.success(result?.action === "copy" ? "File copied" : "File moved");
    },
    onError: (err: Error) => {
      if (err.message !== "Paste cancelled") toast.error(err.message);
    },
  });

  // Move file via drag-drop
  const moveFileToFolder = useMutation({
    mutationFn: async ({
      fileId,
      targetFolderId,
    }: {
      fileId: string;
      targetFolderId: string | null;
    }) => {
      const { data: file } = await supabase.from("file_items").select("folder_id").eq("id", fileId).single();
      const oldFolderId = file?.folder_id ?? null;
      const { error } = await supabase
        .from("file_items")
        .update({ folder_id: targetFolderId })
        .eq("id", fileId);
      if (error) throw error;
      return { oldFolderId };
    },
    onSuccess: ({ oldFolderId }, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
      toast.success("File moved");
      pushUndo({
        label: "Move file",
        undo: async () => {
          await supabase.from("file_items").update({ folder_id: oldFolderId }).eq("id", fileId);
          queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
          toast.success("Undid file move");
        },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Move folder via drag-drop
  const moveFolderToFolder = useMutation({
    mutationFn: async ({
      folderId,
      targetParentId,
    }: {
      folderId: string;
      targetParentId: string | null;
    }) => {
      if (folderId === targetParentId) throw new Error("Cannot move folder into itself");
      let check = targetParentId;
      while (check) {
        if (check === folderId) throw new Error("Cannot move folder into its own descendant");
        const parent = allFolders.find((f) => f.id === check);
        check = parent?.parent_id ?? null;
      }
      const { data: folder } = await supabase.from("file_folders").select("parent_id").eq("id", folderId).single();
      const oldParentId = folder?.parent_id ?? null;
      const { error } = await supabase
        .from("file_folders")
        .update({ parent_id: targetParentId })
        .eq("id", folderId);
      if (error) throw error;
      return { oldParentId };
    },
    onSuccess: ({ oldParentId }, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-folders"] });
      toast.success("Folder moved");
      pushUndo({
        label: "Move folder",
        undo: async () => {
          await supabase.from("file_folders").update({ parent_id: oldParentId }).eq("id", folderId);
          queryClient.invalidateQueries({ queryKey: ["file-manager-folders"] });
          toast.success("Undid folder move");
        },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Undo
  const performUndo = useCallback(async () => {
    const entry = undoStack[0];
    if (!entry) {
      toast.info("Nothing to undo");
      return;
    }
    setUndoStack((prev) => prev.slice(1));
    try {
      await entry.undo();
    } catch (err: unknown) {
      toast.error(`Undo failed: ${(err as Error).message}`);
    }
  }, [undoStack]);

  const copyToClipboard = (item: FileItem) => {
    setClipboard({ type: "file", item, action: "copy" });
    toast.info(`"${item.name}" copied to clipboard`);
  };

  const cutToClipboard = (item: FileItem) => {
    setClipboard({ type: "file", item, action: "cut" });
    toast.info(`"${item.name}" cut to clipboard`);
  };

  const toggleFileSelection = (
    fileId: string,
    ctrlKey: boolean,
    shiftKey: boolean,
    allFileIds: string[]
  ) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (ctrlKey) {
        if (next.has(fileId)) next.delete(fileId);
        else next.add(fileId);
      } else if (shiftKey && prev.size > 0) {
        const lastSelected = [...prev].pop()!;
        const lastIdx = allFileIds.indexOf(lastSelected);
        const curIdx = allFileIds.indexOf(fileId);
        const [start, end] = lastIdx < curIdx ? [lastIdx, curIdx] : [curIdx, lastIdx];
        for (let i = start; i <= end; i++) next.add(allFileIds[i]);
      } else {
        if (next.size === 1 && next.has(fileId)) {
          next.clear();
        } else {
          next.clear();
          next.add(fileId);
        }
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedFiles(new Set());

  // Check if any mutation is pending
  const isProcessing =
    createFolder.isPending ||
    renameFolder.isPending ||
    deleteFolder.isPending ||
    uploadFiles.isPending ||
    renameFile.isPending ||
    deleteFiles.isPending ||
    pasteFile.isPending ||
    moveFileToFolder.isPending ||
    moveFolderToFolder.isPending;

  return {
    currentFolderId,
    setCurrentFolderId,
    allFolders,
    currentSubfolders,
    files,
    foldersLoading,
    filesLoading,
    getBreadcrumbs,
    createFolder,
    renameFolder,
    deleteFolder,
    uploadFiles,
    renameFile,
    deleteFiles,
    clipboard,
    copyToClipboard,
    cutToClipboard,
    pasteFile,
    moveFileToFolder,
    moveFolderToFolder,
    selectedFiles,
    toggleFileSelection,
    clearSelection,
    // New
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    undoStack,
    performUndo,
    pasteConflict,
    resolvePasteConflict,
    isProcessing,
  };
}
