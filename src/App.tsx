import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Registration from "./pages/Registration";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import ServiceDetail from "./pages/ServiceDetail";
import BookingForm from "./pages/BookingForm";
import QuoteApproval from "./pages/QuoteApproval";
import HireApplicationForm from "./pages/HireApplicationForm";
import CompanyLanding from "./pages/CompanyLanding";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import FileServer from "./pages/FileServer";
import Unsubscribe from "./pages/Unsubscribe";
import ApplicantPortal from "./pages/ApplicantPortal";
import ApplicantSetPassword from "./pages/ApplicantSetPassword";

import { getSubdomainSlug } from "./hooks/useSubdomainSlug";

const queryClient = new QueryClient();

const subdomainSlug = getSubdomainSlug();

/**
 * template.hcshvac.com serves the original Amerce HTML demo, which lives as
 * static files in /public/amerce-template. Redirect before React routing so
 * the browser loads the real theme pages (index.html, shop, product, ...).
 */
if (
  (subdomainSlug === "template" && !window.location.pathname.startsWith("/amerce-template")) ||
  window.location.pathname === "/template" ||
  window.location.pathname === "/template/"
) {
  window.location.replace("/amerce-template/index.html");
}



const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {subdomainSlug ? (
          /* Subdomain detected — render company landing as the entire site,
             but still expose public token-based flows so links work from
             any host (apex or subdomain). */
          <Routes>
            <Route path="/apply/:token" element={<HireApplicationForm />} />
            <Route path="/book/:token" element={<BookingForm />} />
            <Route path="/quote/:token" element={<QuoteApproval />} />
            <Route path="/applicant" element={<ApplicantPortal />} />
            <Route path="/applicant/set-password" element={<ApplicantSetPassword />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/fileserver" element={<FileServer />} />
            <Route path="*" element={<CompanyLanding subdomainSlug={subdomainSlug} />} />

          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/book/:token" element={<BookingForm />} />
            <Route path="/quote/:token" element={<QuoteApproval />} />
            <Route path="/apply/:token" element={<HireApplicationForm />} />
            <Route path="/company/:slug" element={<CompanyLanding />} />
            <Route path="/company/:slug/:massSlug" element={<CompanyLanding />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/fileserver" element={<FileServer />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/applicant" element={<ApplicantPortal />} />
            <Route path="/applicant/set-password" element={<ApplicantSetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
