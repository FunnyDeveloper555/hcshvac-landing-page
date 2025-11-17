import { useEffect } from "react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import HeroAdd from "@/components/admin/HeroAdd";
import HeroList from "@/components/admin/HeroList";
import HeroImagesAdd from "@/components/admin/HeroImagesAdd";
import HeroImagesList from "@/components/admin/HeroImagesList";
import ServicesAdd from "@/components/admin/ServicesAdd";
import ServicesList from "@/components/admin/ServicesList";
import CompaniesAdd from "@/components/admin/CompaniesAdd";
import ActiveCompaniesList from "@/components/admin/ActiveCompaniesList";
import DeactiveCompaniesList from "@/components/admin/DeactiveCompaniesList";
import VendorsAdd from "@/components/admin/VendorsAdd";
import VendorsList from "@/components/admin/VendorsList";
import { EmployeesAdmin } from "@/components/admin/EmployeesAdmin";

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
              <Route path="/" element={<Navigate to="/admin/hero/list" replace />} />
              <Route path="/hero/add" element={<HeroAdd />} />
              <Route path="/hero/list" element={<HeroList />} />
              <Route path="/images/add" element={<HeroImagesAdd />} />
              <Route path="/images/list" element={<HeroImagesList />} />
              <Route path="/services/add" element={<ServicesAdd />} />
              <Route path="/services/list" element={<ServicesList />} />
              <Route path="/companies/add" element={<CompaniesAdd />} />
              <Route path="/companies/active" element={<ActiveCompaniesList />} />
              <Route path="/companies/deactive" element={<DeactiveCompaniesList />} />
              <Route path="/vendors/add" element={<VendorsAdd />} />
              <Route path="/vendors/list" element={<VendorsList />} />
              <Route path="/employees/*" element={<EmployeesAdmin />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
