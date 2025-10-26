import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import heroImage1 from "@/assets/hvac-hero.jpg";
import heroImage2 from "@/assets/hvac-hero-2.jpg";
import heroImage3 from "@/assets/hvac-hero-3.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const heroImages = [
  { src: heroImage1, alt: "Professional HVAC technician servicing air conditioning unit" },
  { src: heroImage2, alt: "Professional HVAC installation service" },
  { src: heroImage3, alt: "Modern HVAC equipment and professional service" },
];

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20">
      <div className="absolute inset-0 z-0">
        <Carousel
          opts={{ loop: true }}
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          className="w-full h-full"
        >
          <CarouselContent>
            {heroImages.map((image, index) => (
              <CarouselItem key={index}>
                <img 
                  src={image.src} 
                  alt={image.alt} 
                  className="w-full h-screen object-cover"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-block px-4 py-2 bg-accent/10 border border-accent/20 rounded-full mb-6">
            <span className="text-accent font-semibold">24/7 Emergency Service Available</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Your Comfort Is Our <span className="text-primary">Priority</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            Professional HVAC installation, repair, and maintenance services you can trust. 
            Serving the community with excellence for over 15 years.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="accent" size="xl" className="group">
              <Phone className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Call Now: (555) 123-4567
            </Button>
            <Button variant="outline" size="xl">
              View Our Services
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">15+</div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </div>
            <div className="text-center border-x border-border">
              <div className="text-3xl font-bold text-primary mb-1">5000+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">Emergency Service</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
