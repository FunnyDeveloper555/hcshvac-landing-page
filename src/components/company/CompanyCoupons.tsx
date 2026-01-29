import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

interface Coupon {
  title: string;
  description: string;
  code: string;
}

interface CompanyCouponsProps {
  coupons: Coupon[];
  primaryColor?: string;
}

const CompanyCoupons = ({ coupons, primaryColor }: CompanyCouponsProps) => {
  if (!coupons || coupons.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
          <Tag className="w-6 h-6" style={{ color: primaryColor }} />
          Special Offers
        </h3>
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {coupons.map((coupon, index) => (
            <Card
              key={index}
              className="border-2 border-dashed"
              style={{ borderColor: primaryColor }}
            >
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {coupon.title}
                </p>
                <p className="text-muted-foreground text-sm mt-1">{coupon.description}</p>
                {coupon.code && (
                  <Badge variant="outline" className="mt-3">
                    {coupon.code}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyCoupons;
