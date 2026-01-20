import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Link, Unlink, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  template_id: string | null;
  total_pages_generated: number;
}

export default function TemplateCampaignLink() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: template } = useQuery({
    queryKey: ['page_template', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['page_campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const linkMutation = useMutation({
    mutationFn: async ({ campaignId, link }: { campaignId: string; link: boolean }) => {
      const { error } = await supabase
        .from('page_campaigns')
        .update({ template_id: link ? templateId : null })
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: (_, { link }) => {
      queryClient.invalidateQueries({ queryKey: ['page_campaigns'] });
      toast.success(link ? 'Template linked to campaign' : 'Template unlinked from campaign');
    },
    onError: () => toast.error('Failed to update campaign'),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading campaigns...</div>;
  }

  const linkedCampaigns = campaigns?.filter(c => c.template_id === templateId) || [];
  const unlinkedCampaigns = campaigns?.filter(c => c.template_id !== templateId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/page-builder/templates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Link Template to Campaigns</h2>
          <p className="text-muted-foreground">
            Template: <span className="font-medium">{template?.name}</span>
          </p>
        </div>
      </div>

      {/* Linked Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Linked Campaigns ({linkedCampaigns.length})
          </CardTitle>
          <CardDescription>
            Campaigns currently using this template for page generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkedCampaigns.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No campaigns are using this template yet.
            </p>
          ) : (
            <div className="space-y-2">
              {linkedCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                >
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.total_pages_generated} pages generated
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => linkMutation.mutate({ campaignId: campaign.id, link: false })}
                    >
                      <Unlink className="h-4 w-4 mr-1" />
                      Unlink
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Available Campaigns ({unlinkedCampaigns.length})
          </CardTitle>
          <CardDescription>
            Link this template to other campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unlinkedCampaigns.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              All campaigns are using this template.
            </p>
          ) : (
            <div className="space-y-2">
              {unlinkedCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{campaign.total_pages_generated} pages generated</span>
                      {campaign.template_id && (
                        <Badge variant="outline" className="text-xs">Has template</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => linkMutation.mutate({ campaignId: campaign.id, link: true })}
                    >
                      <Link className="h-4 w-4 mr-1" />
                      Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
