import CompanyWebsiteMockup from "@/components/admin/CompanyWebsiteMockup";

const Registration = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Company Website Preview</h1>
          <p className="text-muted-foreground">
            This mockup shows how your company profile data will appear on your website.
          </p>
        </div>
        <CompanyWebsiteMockup />
      </div>
    </div>
  );
};

export default Registration;
