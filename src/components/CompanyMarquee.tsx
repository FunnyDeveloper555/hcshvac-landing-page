import { Building2 } from "lucide-react";

const companies = [
  "ABC Property Management",
  "Downtown Office Complex",
  "Riverside Apartments",
  "Metro Business Center",
  "Greenfield Shopping Mall",
  "Skyline Corporate Tower",
  "Harbor View Condos",
  "Tech Park Industries",
  "Lakeside Resort & Spa",
  "City Medical Center",
];

const CompanyMarquee = () => {
  return (
    <section className="py-16 bg-accent/5 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center">
          Trusted by Leading Businesses
        </h2>
      </div>
      
      <div className="relative">
        <div className="flex animate-marquee hover:[animation-play-state:paused]">
          {/* First set of companies */}
          {companies.map((company, index) => (
            <div
              key={`first-${index}`}
              className="flex items-center gap-3 mx-8 min-w-fit"
            >
              <Building2 className="text-accent" size={24} />
              <span className="text-lg font-medium whitespace-nowrap">
                {company}
              </span>
            </div>
          ))}
          
          {/* Duplicate set for seamless loop */}
          {companies.map((company, index) => (
            <div
              key={`second-${index}`}
              className="flex items-center gap-3 mx-8 min-w-fit"
            >
              <Building2 className="text-accent" size={24} />
              <span className="text-lg font-medium whitespace-nowrap">
                {company}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyMarquee;
