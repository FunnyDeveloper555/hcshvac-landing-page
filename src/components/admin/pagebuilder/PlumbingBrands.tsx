import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlumbingBrands() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Plumbing Brands</h2>
        <p className="text-muted-foreground">Manage plumbing brands</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Plumbing Brands Management</CardTitle>
          <CardDescription>Add and manage plumbing brands</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
