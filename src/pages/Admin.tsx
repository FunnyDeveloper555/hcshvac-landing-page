import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeroAdmin from "@/components/admin/HeroAdmin";
import HeroImagesAdmin from "@/components/admin/HeroImagesAdmin";

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth");
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="hero" className="w-full">
          <TabsList>
            <TabsTrigger value="hero">Hero Content</TabsTrigger>
            <TabsTrigger value="images">Hero Images</TabsTrigger>
            <TabsTrigger value="services" disabled>Services (Coming Soon)</TabsTrigger>
            <TabsTrigger value="benefits" disabled>Why Choose Us (Coming Soon)</TabsTrigger>
            <TabsTrigger value="companies" disabled>Companies (Coming Soon)</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="mt-6">
            <HeroAdmin />
          </TabsContent>

          <TabsContent value="images" className="mt-6">
            <HeroImagesAdmin />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
