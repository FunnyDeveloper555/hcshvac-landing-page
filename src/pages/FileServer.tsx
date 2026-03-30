import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Download,
  Trash2,
  LogIn,
  LogOut,
  FileIcon,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  Loader2,
  RefreshCw,
  HardDrive,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface FileServerItem {
  id: string;
  name: string;
  storage_path: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface UploadProgress {
  fileName: string;
  percent: number;
  status: "uploading" | "saving" | "done" | "error";
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string | null) {
  if (!mime) return <FileIcon className="h-4 w-4 text-muted-foreground" />;
  if (mime.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-primary" />;
  if (mime.startsWith("video/")) return <VideoIcon className="h-4 w-4 text-accent-foreground" />;
  if (mime.startsWith("text/") || mime.includes("pdf")) return <FileTextIcon className="h-4 w-4 text-destructive" />;
  return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}

async function uploadFileWithProgress(
  bucketName: string,
  storagePath: string,
  file: File,
  token: string,
  onProgress: (percent: number) => void
): Promise<{ error?: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const tus = await import("tus-js-client");

  return new Promise((resolve) => {
    const upload = new tus.Upload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000],
      headers: {
        authorization: `Bearer ${token}`,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucketName,
        objectName: storagePath,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024, // 6MB chunks
      onError: (error) => {
        resolve({ error: error.message || "Upload failed" });
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: () => {
        resolve({});
      },
    });

    // Check for previous uploads to resume
    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        upload.resumeUpload(previousUploads[0] as any);
      }
      upload.start();
    });
  });
}

export default function FileServer() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [files, setFiles] = useState<FileServerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = uploads.some((u) => u.status === "uploading" || u.status === "saving");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fileserver_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load files");
    } else {
      setFiles((data as FileServerItem[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !session) return;
    const fileList = Array.from(e.target.files);

    const initialProgress: UploadProgress[] = fileList.map((f) => ({
      fileName: f.name,
      percent: 0,
      status: "uploading",
    }));
    setUploads(initialProgress);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const token = session.access_token;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const storagePath = `${crypto.randomUUID()}-${file.name}`;

      const result = await uploadFileWithProgress("fileserver", storagePath, file, token, (percent) => {
        setUploads((prev) =>
          prev.map((u, idx) => (idx === i ? { ...u, percent, status: "uploading" } : u))
        );
      });

      if (result.error) {
        setUploads((prev) =>
          prev.map((u, idx) => (idx === i ? { ...u, status: "error", percent: 0 } : u))
        );
        toast.error(`${file.name}: ${result.error}`);
        continue;
      }

      // Saving to DB
      setUploads((prev) =>
        prev.map((u, idx) => (idx === i ? { ...u, status: "saving", percent: 100 } : u))
      );

      const { data: urlData } = supabase.storage.from("fileserver").getPublicUrl(storagePath);
      const { error: dbErr } = await supabase.from("fileserver_items").insert({
        name: file.name,
        storage_path: storagePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type || null,
        uploaded_by: session.user.id,
      });

      if (dbErr) {
        setUploads((prev) =>
          prev.map((u, idx) => (idx === i ? { ...u, status: "error" } : u))
        );
        toast.error(`${file.name}: ${dbErr.message}`);
      } else {
        setUploads((prev) =>
          prev.map((u, idx) => (idx === i ? { ...u, status: "done", percent: 100 } : u))
        );
      }
    }

    fetchFiles();
    // Clear progress after a delay
    setTimeout(() => setUploads([]), 3000);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pollJob = async (jobId: string): Promise<void> => {
    const maxAttempts = 120; // 4 min max polling
    for (let i = 0; i < maxAttempts; i++) {
      const { data, error } = await supabase
        .from("fileserver_jobs")
        .select("status, progress, result, error")
        .eq("id", jobId)
        .single();

      if (error || !data) {
        throw new Error("Failed to check upload status");
      }

      if (data.status === "completed") {
        return;
      }
      if (data.status === "failed") {
        throw new Error(data.error || "Upload failed");
      }

      // Update progress toast
      const pct = data.progress || 0;
      toast.loading(`Uploading from URL… ${pct}%`, { id: `url-upload-${jobId}` });

      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("Upload timed out");
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim() || !session) return;
    setUrlLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/fileserver-url-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || `Upload failed (${response.status})`);
      }

      toast.loading("Uploading from URL… 0%", { id: `url-upload-${data.job_id}` });
      await pollJob(data.job_id);
      toast.success("File uploaded from URL", { id: `url-upload-${data.job_id}` });
      setUrlInput("");
      fetchFiles();
    } catch (err: any) {
      toast.error(err.message || "URL upload failed");
    } finally {
      setUrlLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    const toDelete = files.filter((f) => selected.has(f.id));
    try {
      const paths = toDelete.map((f) => f.storage_path);
      await supabase.storage.from("fileserver").remove(paths);
      const ids = toDelete.map((f) => f.id);
      const { error } = await supabase.from("fileserver_items").delete().in("id", ids);
      if (error) throw error;
      toast.success(`${toDelete.length} file(s) deleted`);
      setSelected(new Set());
      fetchFiles();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleDownload = async (file: FileServerItem) => {
    try {
      const res = await fetch(file.file_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(file.file_url, "_blank");
    }
  };

  const handleDownloadSelected = async () => {
    const toDownload = files.filter((f) => selected.has(f.id));
    for (const file of toDownload) {
      await handleDownload(file);
      // Small delay between downloads to prevent browser blocking
      if (toDownload.length > 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  };

  const toggleAll = () => {
    if (selected.size === files.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map((f) => f.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else {
      toast.success("Logged in");
      setShowLogin(false);
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
  };

  const isAuth = !!session;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">File Server</h1>
          </div>
          <div className="flex items-center gap-2">
            {authLoading ? null : isAuth ? (
              <>
                <span className="text-xs text-muted-foreground hidden sm:inline">{session.user.email}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowLogin(!showLogin)}>
                <LogIn className="h-4 w-4 mr-1" /> Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Login form */}
        {showLogin && !isAuth && (
          <form onSubmit={handleLogin} className="border rounded-lg p-4 bg-card max-w-sm space-y-3">
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" size="sm" disabled={loginLoading} className="w-full">
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>
        )}

        {/* Upload section — auth only */}
        {isAuth && (
          <div className="border rounded-lg p-4 bg-card space-y-3">
            <h2 className="text-sm font-medium">Upload Files</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 border border-dashed rounded-md px-3 py-2 text-sm text-muted-foreground hover:border-primary transition-colors">
                    <Upload className="h-4 w-4" />
                    {isUploading ? "Uploading…" : "Choose local files"}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleLocalUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Paste file URL…"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUrlUpload();
                    }
                  }}
                  className="text-sm"
                />
                <Button size="sm" variant="default" onClick={handleUrlUpload} disabled={urlLoading || !urlInput.trim()}>
                  {urlLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                  Upload
                </Button>
              </div>
            </div>

            {/* Upload progress bars */}
            {uploads.length > 0 && (
              <div className="space-y-2 pt-2">
                {uploads.map((u, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[70%] text-muted-foreground">{u.fileName}</span>
                      <span className={
                        u.status === "done" ? "text-primary" :
                        u.status === "error" ? "text-destructive" :
                        "text-muted-foreground"
                      }>
                        {u.status === "uploading" && `${u.percent}%`}
                        {u.status === "saving" && "Saving…"}
                        {u.status === "done" && "✓ Done"}
                        {u.status === "error" && "✗ Failed"}
                      </span>
                    </div>
                    <Progress
                      value={u.percent}
                      className={`h-1.5 ${u.status === "error" ? "[&>div]:bg-destructive" : u.status === "done" ? "[&>div]:bg-primary" : ""}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{files.length} file(s)</span>
          <div className="flex items-center gap-2">
            {isAuth && selected.size > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleDownloadSelected}>
                  <Download className="h-4 w-4 mr-1" /> Download ({selected.size})
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete ({selected.size})
                </Button>
              </>
            )}
            {!isAuth && selected.size > 0 && (
              <Button variant="outline" size="sm" onClick={handleDownloadSelected}>
                <Download className="h-4 w-4 mr-1" /> Download ({selected.size})
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={fetchFiles}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No files uploaded yet.</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === files.length && files.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell w-24">Size</TableHead>
                  <TableHead className="hidden md:table-cell w-40">Uploaded</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id} data-state={selected.has(file.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(file.id)}
                        onCheckedChange={() => toggleOne(file.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(file.mime_type)}
                        <span className="truncate text-sm">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(file.created_at).toLocaleDateString()} {new Date(file.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(file)}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        {isAuth && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelected(new Set([file.id]));
                              setTimeout(handleDelete, 0);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
