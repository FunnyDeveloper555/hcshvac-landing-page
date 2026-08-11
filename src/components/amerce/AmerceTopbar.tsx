import { useEffect, useState } from "react";

interface AmerceTopbarProps {
  phone?: string | null;
  city?: string | null;
  state?: string | null;
}

/** Dark rotating announcement bar from the Amerce "home-construction" layout. */
const AmerceTopbar = ({ phone, city, state }: AmerceTopbarProps) => {
  const location = [city, state].filter(Boolean).join(", ");

  const messages = [
    "24/7 Emergency Heating & Cooling Service — Same Day Appointments Available",
    phone ? `Call us now at ${phone} for a free estimate` : "Free estimates on new system installations",
    location ? `Proudly serving ${location} and surrounding areas` : "Licensed, bonded & insured technicians",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="tf-topbar bg-dark">
      <div className="container">
        <div className="text-center py-2">
          <p className="text-white text-line-clamp-1 mb-0 text-caption-01">{messages[index]}</p>
        </div>
      </div>
    </div>
  );
};

export default AmerceTopbar;
