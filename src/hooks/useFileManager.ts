import { useState, useCallback } from "react";
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

export function useFileManager() {
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

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
  const { data: files = [], isLoading: filesLoading } = useQuery({
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
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Rename folder
  const renameFolder = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("file_folders")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id, name }) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-folders"] });
      logAction("update", "settings", id, { folder_name: name, action_detail: "rename_folder" });
      toast.success(`Folder renamed to "${name}"`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Delete folder
  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      // Recursively collect all file storage paths in this folder tree
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
      // Delete storage files
      if (pathsToDelete.length > 0) {
        await supabase.storage.from("file-manager").remove(pathsToDelete);
      }
      // CASCADE will handle DB children
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
      const { error } = await supabase
        .from("file_items")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id, name }) => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
      logAction("update", "settings", id, { file_name: name, action_detail: "rename_file" });
      toast.success(`File renamed to "${name}"`);
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

  // Paste (copy or move)
  const pasteFile = useMutation({
    mutationFn: async () => {
      if (!clipboard) throw new Error("Nothing in clipboard");
      const { item, action } = clipboard;
      if (action === "copy") {
        // Duplicate storage file
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
          name: item.name,
          folder_id: currentFolderId,
          storage_path: newPath,
          file_url: urlData.publicUrl,
          file_size: item.file_size,
          mime_type: item.mime_type,
          created_by: user!.id,
        });
        if (dbErr) throw dbErr;
      } else {
        // Move: update folder_id
        const { error } = await supabase
          .from("file_items")
          .update({ folder_id: currentFolderId })
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      const action = clipboard?.action;
      queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
      logAction("update", "settings", clipboard?.item.id, {
        file_name: clipboard?.item.name || "",
        action_detail: action === "copy" ? "copy_file" : "move_file",
      });
      setClipboard(null);
      toast.success(action === "copy" ? "File copied" : "File moved");
    },
    onError: (err: Error) => toast.error(err.message),
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
      const { error } = await supabase
        .from("file_items")
        .update({ folder_id: targetFolderId })
        .eq("id", fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
      toast.success("File moved");
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
      // Check for circular reference
      let check = targetParentId;
      while (check) {
        if (check === folderId) throw new Error("Cannot move folder into its own descendant");
        const parent = allFolders.find((f) => f.id === check);
        check = parent?.parent_id ?? null;
      }
      const { error } = await supabase
        .from("file_folders")
        .update({ parent_id: targetParentId })
        .eq("id", folderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-manager-folders"] });
      toast.success("Folder moved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

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
  };
}
