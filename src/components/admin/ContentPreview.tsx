import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, ExternalLink, Calendar, User, Tag } from "lucide-react";
import RichContentRenderer from "@/components/RichContentRenderer";
import ContentCommentsSection from "./ContentCommentsSection";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";

interface ContentData {
  id: string;
  title: string;
  slug: string | null;
  short_description: string | null;
  html_content: string;
  publish_status: string;
  publish_start_date: string | null;
  publish_end_date: string | null;
  tags: string[];
  spot_text: string | null;
  spot_image_url: string | null;
  allow_comments: boolean;
  show_author_name: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
}

interface ContentPreviewProps {
  /** Pass content data directly (for inline preview in ContentAdd) */
  content?: ContentData | null;
  /** Whether this is rendered inline (no back button, compact layout) */
  inline?: boolean;
}

const ContentPreview = ({ content: propContent, inline = false }: ContentPreviewProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contentId = searchParams.get("id");

  const [content, setContent] = useState<ContentData | null>(propContent || null);
  const [loading, setLoading] = useState(!propContent && !!contentId);
  const [authorEmail, setAuthorEmail] = useState<string>("");
  const [metadata, setMetadata] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Load content from DB if not passed as prop
  useEffect(() => {
    if (propContent) {
      setContent(propContent);
      return;
    }
    if (!contentId) return;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .eq("id", contentId)
        .single();
      if (!error && data) {
        setContent(data as unknown as ContentData);
      }
      setLoading(false);
    };
    load();
  }, [contentId, propContent]);

  // Load related data when content is available
  useEffect(() => {
    if (!content?.id) return;

    const loadRelated = async () => {
      // Load author profile
      const { data: profile } = await supabase
        .from("profiles" as any)
        .select("email, display_name")
        .eq("user_id", content.author_id)
        .single();
      if (profile) {
        setAuthorEmail((profile as any).display_name || (profile as any).email || "");
      }

      // Load metadata
      const { data: meta } = await supabase
        .from("content_metadata")
        .select("*")
        .eq("content_id", content.id)
        .eq("is_active", true)
        .order("display_order");
      setMetadata(meta || []);

      // Load recommendations
      const { data: recs } = await supabase
        .from("content_recommendations")
        .select("*, recommended:recommended_content_id(id, title, slug, spot_image_url, short_description)")
        .eq("content_id", content.id)
        .eq("is_active", true)
        .order("display_order");
      setRecommendations(recs || []);
    };
    loadRelated();
  }, [content?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No content to preview.</p>
        {!inline && (
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/contents/list")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Content List
          </Button>
        )}
      </div>
    );
  }

  const statusColor = (s: string) => {
    if (s === "published") return "default";
    if (s === "archived") return "secondary";
    return "outline";
  };

  return (
    <div className={inline ? "space-y-6" : "space-y-6 max-w-4xl mx-auto"}>
      {/* Header */}
      {!inline && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant={statusColor(content.publish_status)} className="uppercase text-xs">
              {content.publish_status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/contents/add?id=${content.id}`)}
            >
              Edit Content
            </Button>
          </div>
        </div>
      )}

      {/* Preview notice bar */}
      <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-primary font-medium flex items-center gap-1.5">
          <ExternalLink className="h-4 w-4" />
          Content Preview — This is how the content will appear on the live site
        </span>
        <Badge variant={statusColor(content.publish_status)} className="uppercase text-xs">
          {content.publish_status}
        </Badge>
      </div>

      {/* Article Preview */}
      <Card className="overflow-hidden">
        {/* Spot Image as Hero */}
        {content.spot_image_url && (
          <div className="w-full h-64 md:h-80 overflow-hidden bg-muted">
            <img
              src={content.spot_image_url}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardContent className="py-8 px-6 md:px-12 space-y-6">
          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
              {content.title}
            </h1>

            {/* Meta info row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {content.show_author_name && authorEmail && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {authorEmail}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(content.created_at), "MMMM d, yyyy")}
              </span>
              
            </div>

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {content.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Short Description */}
          {content.short_description && (
            <p className="text-lg text-muted-foreground leading-relaxed italic border-l-4 border-primary/30 pl-4">
              {content.short_description}
            </p>
          )}

          {/* Spot Text */}
          {content.spot_text && (
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-medium text-xs uppercase text-muted-foreground mb-1">Summary</p>
              <p>{content.spot_text}</p>
            </div>
          )}

          <Separator />

          {/* Main HTML Content */}
          <RichContentRenderer
            html={content.html_content}
            className="prose prose-neutral dark:prose-invert max-w-none"
          />

          {/* Publishing Window */}
          {(content.publish_start_date || content.publish_end_date) && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
                {content.publish_start_date && (
                  <span>Published from: {format(new Date(content.publish_start_date), "MMM d, yyyy")}</span>
                )}
                {content.publish_end_date && (
                  <span>Until: {format(new Date(content.publish_end_date), "MMM d, yyyy")}</span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Metadata Section */}
      {metadata.length > 0 && (
        <Card>
          <CardContent className="py-6 px-6 md:px-12 space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <div className="grid gap-3">
              {metadata.map((m) => (
                <div key={m.id} className="flex items-start gap-3 text-sm">
                  <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{m.metadata_type.replace(/_/g, " ")}</Badge>
                  <div>
                    {m.field_key && <span className="font-medium">{m.field_key}: </span>}
                    <span className="text-muted-foreground">{m.field_value}</span>
                    {m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline text-xs">
                        View file
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Content Section */}
      {recommendations.length > 0 && (
        <Card>
          <CardContent className="py-6 px-6 md:px-12 space-y-4">
            <h3 className="text-lg font-semibold">Related Content</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recommendations.map((rec) => {
                const item = (rec as any).recommended;
                if (!item) return null;
                return (
                  <div key={rec.id} className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
                    {item.spot_image_url && (
                      <div className="h-32 overflow-hidden bg-muted">
                        <img src={item.spot_image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-3 space-y-1">
                      <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                      {item.short_description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.short_description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      {content.allow_comments && content.id && (
        <ContentCommentsSection
          contentId={content.id}
          isPublished={content.publish_status === "published"}
        />
      )}
    </div>
  );
};

export default ContentPreview;
