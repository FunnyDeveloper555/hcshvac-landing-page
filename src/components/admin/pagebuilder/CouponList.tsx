import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Tag, ExternalLink, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Coupon {
  title: string;
  description: string;
  code: string;
}

const CouponList = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-coupons", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, coupons")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      return {
        ...data,
        coupons: (Array.isArray(data.coupons) ? data.coupons : []) as unknown as Coupon[],
      };
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
        <p className="text-muted-foreground">Please select a valid company.</p>
      </div>
    );
  }

  const coupons = company.coupons || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            Coupons Management
          </h1>
          <p className="text-muted-foreground">
            Manage coupons for {company.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/companies/add?edit=${companyId}`)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Edit Coupons
          </Button>
          {company.slug && (
            <Button
              variant="outline"
              onClick={() => window.open(`/company/${company.slug}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Live Site
            </Button>
          )}
        </div>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Coupons Configured</h3>
            <p className="text-muted-foreground mb-4">
              Add coupons to display on the company landing page.
            </p>
            <Button onClick={() => navigate(`/admin/companies/add?edit=${companyId}`)}>
              Add Coupons
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon, index) => (
            <Card key={index} className="border-2 border-dashed border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Coupon {index + 1}</Badge>
                  {coupon.code && (
                    <Badge variant="secondary" className="font-mono">
                      {coupon.code}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-bold text-primary mb-2">{coupon.title || "No title"}</h3>
                <p className="text-muted-foreground text-sm">
                  {coupon.description || "No description"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
          <CardDescription>How coupons will appear on the landing page</CardDescription>
        </CardHeader>
        <CardContent>
          {coupons.length > 0 ? (
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Special Offers
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {coupons.map((coupon, index) => (
                  <div
                    key={index}
                    className="bg-background border-2 border-dashed border-primary rounded-lg p-4 text-center"
                  >
                    <p className="text-2xl font-bold text-primary">{coupon.title}</p>
                    <p className="text-muted-foreground text-sm">{coupon.description}</p>
                    {coupon.code && (
                      <Badge variant="outline" className="mt-2">
                        {coupon.code}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No coupons to preview
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponList;
