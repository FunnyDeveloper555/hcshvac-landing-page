import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, BookOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductDocumentsProps {
  productId: string;
}

const docTypeConfig: Record<string, { label: string; icon: typeof FileText }> = {
  specification_sheet: { label: "Specification Sheet", icon: FileText },
  user_manual: { label: "User Manual", icon: BookOpen },
  warranty_document: { label: "Warranty Document", icon: Shield },
  other: { label: "Document", icon: FileText },
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ProductDocuments = ({ productId }: ProductDocumentsProps) => {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["product-documents", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_documents")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  if (isLoading || documents.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-foreground mb-4">Documents & Downloads</h2>
      <div className="space-y-2">
        {documents.map((doc) => {
          const config = docTypeConfig[doc.document_type] || docTypeConfig.other;
          const Icon = config.icon;
          return (
            <a
              key={doc.id}
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="shrink-0 w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {doc.document_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {config.label}
                  {doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ""}
                </p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default ProductDocuments;
