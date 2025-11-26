import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HvacKeywords() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">HVAC Keywords Search Terms</h2>
        <p className="text-muted-foreground">Manage HVAC related search keywords</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Keywords Management</CardTitle>
          <CardDescription>Add and manage HVAC search terms</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
