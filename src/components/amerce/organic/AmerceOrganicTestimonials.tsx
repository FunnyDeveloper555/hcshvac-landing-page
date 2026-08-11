interface AmerceOrganicTestimonialsProps {
  companyName: string;
}

const REVIEWS = [
  {
    name: "Emily R.",
    text: "Our furnace quit on the coldest night of the year and a tech was at the door within the hour. Honest, fast and tidy.",
    service: "Emergency Furnace Repair",
  },
  {
    name: "Marcus T.",
    text: "They replaced our AC and coil in a single day, explained every option, and the price matched the quote exactly.",
    service: "AC System Replacement",
  },
  {
    name: "Dana K.",
    text: "The maintenance plan is worth it. Two visits a year and our system has not missed a beat since we signed up.",
    service: "Seasonal Maintenance",
  },
];

/** "Loved By Our Customers" testimonial band from the Amerce home-organic page. */
const AmerceOrganicTestimonials = ({ companyName }: AmerceOrganicTestimonialsProps) => (
  <section className="flat-spacing">
    <div className="container">
      <div className="sect-heading text-center">
        <h3 className="s-title">Loved By Our Customers</h3>
        <p className="s-desc cl-text-2">
          Real stories from neighbors who trust {companyName} with their heating and cooling.
        </p>
      </div>

      <div className="row g-4 mt-2">
        {REVIEWS.map((review) => (
          <div className="col-lg-4 col-md-6" key={review.name}>
            <div className="testimonial-v01 style-def h-100 p-4 rounded-16" style={{ border: "1px solid var(--line, rgba(0,0,0,0.1))" }}>
              <div className="star-wrap d-flex align-items-center gap-1 mb-3" style={{ color: "var(--primary)" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <i className="icon-Star fs-16" key={i} />
                ))}
              </div>
              <p className="tes_text cl-text-2">“{review.text}”</p>
              <div className="tes_author d-flex align-items-center gap-2 mt-3">
                <p className="author-name lh-24 fw-medium mb-0">{review.name}</p>
                <i className="icon-CheckCircle fs-20" style={{ color: "var(--primary)" }} />
              </div>
              <p className="text-caption-01 cl-text-3 mb-0">{review.service}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default AmerceOrganicTestimonials;
