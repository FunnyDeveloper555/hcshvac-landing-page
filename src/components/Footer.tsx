const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-secondary/50 border-t border-border py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="text-lg md:text-xl font-bold text-primary mb-3 md:mb-4">HCS HVAC</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Your trusted partner for all heating, ventilation, and air conditioning needs. 
              Licensed, insured, and committed to your comfort.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Quick Links</h4>
            <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
              <li><a href="#services" className="hover:text-primary transition-colors">Services</a></li>
              <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#emergency" className="hover:text-primary transition-colors">Emergency Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Contact Info</h4>
            <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
              <li>📞 (555) 123-4567</li>
              <li>✉️ info@hcshvac.com</li>
              <li>📍 123 Main Street, Your City, ST 12345</li>
              <li>🕐 24/7 Emergency Service</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-6 md:pt-8 border-t border-border text-center text-muted-foreground">
          <p className="text-xs md:text-sm">&copy; {currentYear} HCS HVAC. All rights reserved. | Licensed & Insured</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
