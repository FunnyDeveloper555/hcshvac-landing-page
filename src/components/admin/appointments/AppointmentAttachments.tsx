import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip } from "lucide-react";

export function AppointmentAttachments({ paths }: { paths: string[] }) {
  const { data: attachments = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["appointment-attachments", paths],
    enabled: paths.length > 0,
    staleTime: 30_000,
    queryFn: async () => Promise.all(paths.map(async (path) => {
      const { data, error } = await supabase.storage.from("appointment-files").createSignedUrl(path, 300);
      if (error) throw error;
      if (!data?.signedUrl) throw new Error("Attachment unavailable");
      return { path, url: data.signedUrl, name: (path.split("/").pop() || "Attachment").replace(/^\d+-/, "") };
    })),
  });

  if (!paths.length) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="text-xs font-medium text-muted-foreground">Attachments ({paths.length})</div>
      {isLoading && <Loader2 aria-label="Loading attachments" className="h-4 w-4 animate-spin" />}
      {isError && <div className="flex items-center gap-2 text-sm text-destructive">Unable to load attachments.<Button type="button" size="sm" variant="outline" onClick={() => refetch()}>Retry</Button></div>}
      {attachments.map((attachment) => (
        <Button key={attachment.path} asChild variant="link" className="h-auto max-w-full justify-start gap-2 p-0 text-left">
          <a href={attachment.url} target="_blank" rel="noreferrer"><Paperclip className="h-4 w-4 shrink-0" /><span className="break-all whitespace-normal">{attachment.name}</span></a>
        </Button>
      ))}
    </div>
  );
}