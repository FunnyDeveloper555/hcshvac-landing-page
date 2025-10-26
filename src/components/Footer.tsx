const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-secondary/50 border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">HCS HVAC</h3>
            <p className="text-muted-foreground">
              Your trusted partner for all heating, ventilation, and air conditioning needs. 
              Licensed, insured, and committed to your comfort.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#services" className="hover:text-primary transition-colors">Services</a></li>
              <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#emergency" className="hover:text-primary transition-colors">Emergency Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>📞 (555) 123-4567</li>
              <li>✉️ info@hcshvac.com</li>
              <li>📍 123 Main Street, Your City, ST 12345</li>
              <li>🕐 24/7 Emergency Service</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border text-center text-muted-foreground">
          <p>&copy; {currentYear} HCS HVAC. All rights reserved. | Licensed & Insured</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
