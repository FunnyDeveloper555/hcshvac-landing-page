import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AreasService() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Area's We Service</h2>
        <p className="text-muted-foreground">Manage service areas</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Areas Management</CardTitle>
          <CardDescription>Add and manage service areas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
