import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Copy, Star, Plus, Trash2, MoreHorizontal, Link } from "lucide-react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TemplatePreview from "./TemplatePreview";

interface TemplateSection {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  settings: Record<string, unknown>;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  sections: TemplateSection[];
  settings: Record<string, unknown>;
  preview_image_url: string | null;
  created_at: string;
}

export default function TemplateList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['page_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Template[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('page_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page_templates'] });
      toast.success('Template deleted');
      setDeleteTemplate(null);
    },
    onError: () => toast.error('Failed to delete template'),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: Template) => {
      const { error } = await (supabase.from('page_templates') as any).insert({
        name: `${template.name} (Copy)`,
        description: template.description,
        is_default: false,
        sections: template.sections,
        settings: template.settings,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page_templates'] });
      toast.success('Template duplicated');
    },
    onError: () => toast.error('Failed to duplicate template'),
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, unset all defaults
      await supabase.from('page_templates').update({ is_default: false }).neq('id', '');
      // Then set the new default
      const { error } = await supabase
        .from('page_templates')
        .update({ is_default: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page_templates'] });
      toast.success('Default template updated');
    },
    onError: () => toast.error('Failed to set default template'),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Page Templates</h2>
          <p className="text-muted-foreground">
            Create and manage templates for generated landing pages
          </p>
        </div>
        <Button onClick={() => navigate('/admin/page-builder/templates/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => (
          <Card key={template.id} className="overflow-hidden group">
            <div className="aspect-video bg-muted flex items-center justify-center border-b relative">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm">{template.sections?.length || 0} sections</p>
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setPreviewTemplate(template)}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
              </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {template.name}
                    {template.is_default && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" />
                        Default
                      </Badge>
                    )}
                    {!template.is_active && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {template.description || 'No description'}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                      <Eye className="mr-2 h-4 w-4" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/admin/page-builder/templates/${template.id}`)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateMutation.mutate(template)}>
                      <Copy className="mr-2 h-4 w-4" /> Duplicate
                    </DropdownMenuItem>
                    {!template.is_default && (
                      <DropdownMenuItem onClick={() => setDefaultMutation.mutate(template.id)}>
                        <Star className="mr-2 h-4 w-4" /> Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {!template.is_default && (
                      <DropdownMenuItem 
                        onClick={() => setDeleteTemplate(template)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mb-3">
                {template.sections?.filter(s => s.enabled).slice(0, 5).map((section) => (
                  <Badge key={section.id} variant="outline" className="text-xs capitalize">
                    {section.type}
                  </Badge>
                ))}
                {(template.sections?.filter(s => s.enabled).length || 0) > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{(template.sections?.filter(s => s.enabled).length || 0) - 5} more
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => navigate(`/admin/page-builder/templates/${template.id}`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/admin/page-builder/templates/${template.id}/link`)}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplate && deleteMutation.mutate(deleteTemplate.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && <TemplatePreview template={previewTemplate} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
