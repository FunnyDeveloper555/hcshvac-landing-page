import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const RegistrationCTA = () => {
  return (
    <section id="register" className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Register with us today to access our premium HVAC services. Complete our comprehensive registration form to help us understand your specific needs and provide you with the best possible service.
          </p>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Our registration process takes just a few minutes and allows us to:
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Understand your property and equipment requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Provide accurate quotes and service estimates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Schedule services efficiently</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Deliver personalized customer support</span>
              </li>
            </ul>
          </div>
          <div className="mt-10">
            <Link to="/registration">
              <Button size="lg" className="text-lg px-8 py-6 group">
                Complete Registration
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Have questions? <a href="tel:+1234567890" className="text-primary hover:underline">Call us at (123) 456-7890</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default RegistrationCTA;
