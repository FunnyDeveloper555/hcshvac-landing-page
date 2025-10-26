import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">HCS HVAC</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="tel:555-123-4567" 
              className="hidden md:flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span className="font-semibold">(555) 123-4567</span>
            </a>
            <Button variant="accent" size="lg">
              Book Service
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
