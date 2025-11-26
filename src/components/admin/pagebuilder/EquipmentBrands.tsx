import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EquipmentBrands() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">HVAC Equipment Brands</h2>
        <p className="text-muted-foreground">Manage HVAC equipment brands</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Equipment Brands Management</CardTitle>
          <CardDescription>Add and manage HVAC equipment brands</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
