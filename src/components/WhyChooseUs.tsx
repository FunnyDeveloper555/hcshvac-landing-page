import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Licensed & Insured Technicians",
  "Upfront Pricing - No Hidden Fees",
  "Same-Day Service Available",
  "100% Satisfaction Guarantee",
  "Energy-Efficient Solutions",
  "Flexible Financing Options",
];

const WhyChooseUs = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
              Why Choose <span className="text-primary">HCS HVAC</span>?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
              With over 15 years of experience serving the community, we've built our reputation 
              on quality workmanship, honest pricing, and exceptional customer service. Your comfort 
              and satisfaction are our top priorities.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 md:gap-3">
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm md:text-base text-foreground font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative mt-6 lg:mt-0">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl md:rounded-2xl p-5 md:p-8 text-primary-foreground">
              <div className="mb-6 md:mb-8">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">Ready to Get Started?</h3>
                <p className="text-sm md:text-base text-primary-foreground/90">
                  Contact us today for a free estimate or to schedule your service appointment.
                </p>
              </div>
              
              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <span className="text-xl md:text-2xl">📞</span>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-primary-foreground/80">Call Us</div>
                    <div className="text-lg md:text-xl font-bold">(555) 123-4567</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <span className="text-xl md:text-2xl">✉️</span>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-primary-foreground/80">Email Us</div>
                    <div className="text-base md:text-lg font-semibold">info@hcshvac.com</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 md:pt-6 border-t border-primary-foreground/20">
                <p className="text-xs md:text-sm text-primary-foreground/80">
                  🕐 Mon-Fri: 7AM - 7PM | Sat: 8AM - 5PM | 24/7 Emergency Service
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
