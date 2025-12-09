import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";

interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  badge_text: string;
  primary_button_text: string;
  primary_button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  stat1_value: string;
  stat1_label: string;
  stat2_value: string;
  stat2_label: string;
  stat3_value: string;
  stat3_label: string;
}

interface HeroImage {
  id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
}

const Hero = () => {
  const [content, setContent] = useState<HeroContent | null>(null);
  const [images, setImages] = useState<HeroImage[]>([]);

  useEffect(() => {
    fetchHeroContent();
    fetchHeroImages();
  }, []);

  const fetchHeroContent = async () => {
    const { data } = await supabase
      .from("hero_content")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      setContent(data);
    }
  };

  const fetchHeroImages = async () => {
    const { data } = await supabase
      .from("hero_images")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setImages(data);
    }
  };

  if (!content || images.length === 0) {
    return null;
  }

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
            {images.map((image) => (
              <CarouselItem key={image.id}>
                <img 
                  src={image.image_url} 
                  alt={image.alt_text} 
                  className="w-full h-screen object-cover"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/35 to-background/20"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-block px-4 py-2 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-full mb-6">
            <span className="text-accent font-semibold drop-shadow-lg">{content.badge_text}</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight drop-shadow-2xl">
            {content.title}
          </h1>
          
          <p className="text-base sm:text-lg md:text-2xl text-muted-foreground mb-6 md:mb-8 leading-relaxed drop-shadow-lg bg-background/30 backdrop-blur-sm p-3 md:p-4 rounded-lg">
            {content.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Button 
              variant="accent" 
              size="lg" 
              className="group md:size-xl"
              onClick={() => window.location.href = content.primary_button_link}
            >
              <Phone className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" />
              {content.primary_button_text}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="md:size-xl"
              onClick={() => window.location.href = content.secondary_button_link}
            >
              {content.secondary_button_text}
            </Button>
          </div>
          
          <div className="mt-8 md:mt-12 grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 max-w-lg bg-background/40 backdrop-blur-sm p-3 sm:p-4 md:p-6 rounded-lg">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 drop-shadow-lg">{content.stat1_value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground drop-shadow-md">{content.stat1_label}</div>
            </div>
            <div className="text-center border-x border-border/50">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 drop-shadow-lg">{content.stat2_value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground drop-shadow-md">{content.stat2_label}</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 drop-shadow-lg">{content.stat3_value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground drop-shadow-md">{content.stat3_label}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
