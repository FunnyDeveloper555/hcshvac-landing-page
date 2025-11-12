import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import WhyChooseUs from "@/components/WhyChooseUs";
import Employees from "@/components/Employees";
import CompanyMarquee from "@/components/CompanyMarquee";
import RegistrationCTA from "@/components/RegistrationCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Services />
        <WhyChooseUs />
        <Employees />
        <CompanyMarquee />
        <RegistrationCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
