import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LocalBusiness() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Local Business</h2>
        <p className="text-muted-foreground">Manage local business information</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Local Business Management</CardTitle>
          <CardDescription>Add and manage local business details</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
