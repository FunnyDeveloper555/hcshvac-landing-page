import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HvacParts() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">HVAC Parts</h2>
        <p className="text-muted-foreground">Manage HVAC parts catalog</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Parts Management</CardTitle>
          <CardDescription>Add and manage HVAC parts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
