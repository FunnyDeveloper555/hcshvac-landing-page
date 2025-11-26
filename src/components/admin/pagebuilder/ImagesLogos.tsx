import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImagesLogos() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Images & Logos</h2>
        <p className="text-muted-foreground">Manage site images and logos</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Images & Logos Management</CardTitle>
          <CardDescription>Upload and manage images and logos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
