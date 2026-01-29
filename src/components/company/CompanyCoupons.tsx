import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
        <div className="max-w-5xl mx-auto px-10">
          <Carousel
            opts={{
              align: "start",
              loop: coupons.length > 3,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {coupons.map((coupon, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Card
                    className="border-2 border-dashed h-full"
                    style={{ borderColor: primaryColor }}
                  >
                    <CardContent className="p-6 text-center flex flex-col justify-center min-h-[140px]">
                      <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {coupon.title}
                      </p>
                      <p className="text-muted-foreground text-sm mt-2">{coupon.description}</p>
                      {coupon.code && (
                        <Badge variant="outline" className="mt-3 mx-auto">
                          {coupon.code}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            {coupons.length > 1 && (
              <>
                <CarouselPrevious className="-left-4" />
                <CarouselNext className="-right-4" />
              </>
            )}
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default CompanyCoupons;
