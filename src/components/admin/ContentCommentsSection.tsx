import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Reply, Loader2, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Comment {
  id: string;
  content_id: string;
  user_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string | null;
  comment_text: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  replies?: Comment[];
}

interface ContentCommentsSectionProps {
  contentId: string;
  isPublished: boolean;
}

const ContentCommentsSection = ({ contentId, isPublished }: ContentCommentsSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Pre-fill author info from auth
  useEffect(() => {
    if (user) {
      setAuthorEmail(user.email || "");
      setAuthorName(user.user_metadata?.display_name || user.email || "");
    }
  }, [user]);

  // Load comments
  useEffect(() => {
    loadComments();
  }, [contentId]);

  const loadComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("content_comments")
      .select("*")
      .eq("content_id", contentId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Build threaded structure
      const topLevel: Comment[] = [];
      const byParent: Record<string, Comment[]> = {};

      (data as Comment[]).forEach((c) => {
        if (c.parent_id) {
          if (!byParent[c.parent_id]) byParent[c.parent_id] = [];
          byParent[c.parent_id].push(c);
        } else {
          topLevel.push({ ...c, replies: [] });
        }
      });

      topLevel.forEach((c) => {
        c.replies = byParent[c.id] || [];
      });

      setComments(topLevel);
    }
    setLoading(false);
  };

  const handleSubmit = async (parentId: string | null = null) => {
    const text = parentId ? replyText : commentText;
    if (!text.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    if (!authorName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("content_comments").insert({
      content_id: contentId,
      user_id: user.id,
      parent_id: parentId,
      author_name: authorName.trim(),
      author_email: authorEmail.trim() || null,
      comment_text: text.trim(),
    });

    if (error) {
      toast.error("Failed to submit comment");
      console.error(error);
    } else {
      toast.success("Comment submitted! It will appear after approval.");
      if (parentId) {
        setReplyText("");
        setReplyingTo(null);
      } else {
        setCommentText("");
      }
      loadComments();
    }
    setSubmitting(false);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-8 border-l-2 border-muted pl-4" : ""}`}>
      <div className="flex items-start gap-3 py-3">
        <div className="rounded-full bg-muted p-2 shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
            </span>
            {!comment.is_approved && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                Pending Approval
              </Badge>
            )}
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.comment_text}</p>
          {!isReply && user && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" /> Reply
            </Button>
          )}

          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="mt-2 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" disabled={submitting} onClick={() => handleSubmit(comment.id)}>
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                  Reply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Render replies */}
      {comment.replies?.map((r) => renderComment(r, true))}
    </div>
  );

  return (
    <Card>
      <CardContent className="py-6 px-6 md:px-12 space-y-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
          {comments.length > 0 && (
            <Badge variant="secondary" className="text-xs">{comments.length}</Badge>
          )}
        </h3>

        {/* Comment form */}
        {user ? (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <Textarea
              placeholder="Write your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button disabled={submitting} onClick={() => handleSubmit(null)}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                Submit Comment
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Please log in to leave a comment.
          </div>
        )}

        {/* Comments list */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length > 0 ? (
          <div className="divide-y">
            {comments.map((c) => renderComment(c))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentCommentsSection;
