import Header from "@/components/Header";
import CustomerRegistrationForm from "@/components/CustomerRegistrationForm";
import Footer from "@/components/Footer";

const Registration = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <CustomerRegistrationForm />
      </main>
      <Footer />
    </div>
  );
};

export default Registration;
