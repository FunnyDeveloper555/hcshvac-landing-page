import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SiteTemplates() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Site Templates Wire Frames</h2>
        <p className="text-muted-foreground">Manage site templates and wireframes</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Templates Management</CardTitle>
          <CardDescription>Add and manage site templates</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
