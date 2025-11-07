import { useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import HeroAdmin from "@/components/admin/HeroAdmin";
import HeroImagesAdmin from "@/components/admin/HeroImagesAdmin";
import ServicesAdmin from "@/components/admin/ServicesAdmin";
import CompaniesAdmin from "@/components/admin/CompaniesAdmin";

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="bg-background border-b">
            <div className="px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold">Admin Panel</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button onClick={handleSignOut} variant="outline">
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<Navigate to="/admin/hero" replace />} />
              <Route path="/hero" element={<HeroAdmin />} />
              <Route path="/images" element={<HeroImagesAdmin />} />
              <Route path="/services" element={<ServicesAdmin />} />
              <Route path="/companies" element={<CompaniesAdmin />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
