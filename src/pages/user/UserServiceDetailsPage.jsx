import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CircleHelp, MapPin, ShieldCheck, Star, TicketPercent } from "lucide-react";
import { getServiceById, listServiceReviews, listServices } from "../../services/platformService.js";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import SectionHeading from "../../components/SectionHeading.jsx";
import ServiceCard from "../../components/ServiceCard.jsx";
import { formatCurrency } from "../../utils/formatters.js";

export default function UserServiceDetailsPage() {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [serviceData, servicesData] = await Promise.all([
          getServiceById(serviceId),
          listServices(),
        ]);
        const reviewsData = await listServiceReviews(serviceData.name);
        setService(serviceData);
        setReviews(reviewsData);
        setRelatedServices(
          servicesData
            .filter((entry) => entry.id !== serviceData.id && entry.slug !== serviceData.slug)
            .slice(0, 3)
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [serviceId]);

  if (loading || !service) {
    return <LoadingPanel rows={4} />;
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden rounded-[34px]">
        <div className="relative">
          {service.videoUrl ? (
            <video className="h-72 w-full object-cover opacity-45" autoPlay muted loop playsInline>
              <source src={service.videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div className="h-72 w-full bg-gradient-to-br from-cyan-400/20 via-sky-500/15 to-teal-400/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">{service.category}</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">{service.name}</h1>
                <p className="mt-4 text-sm leading-7 text-slate-300">{service.description}</p>
              </div>
              <Link
                to={`/user/book/${service.id || service.slug}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Book this service
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <InfoCard icon={Star} label="Service rating" value={`${service.rating} / 5`} hint={`${service.reviewsCount}+ verified reviews`} />
        <InfoCard icon={TicketPercent} label="Offer code" value={service.discountCode} hint={`${service.rewardCoins} reward coins available`} />
        <InfoCard icon={MapPin} label="Live coverage" value={service.locations?.slice(0, 3).join(", ")} hint="Location-based availability checks" />
        <InfoCard icon={ShieldCheck} label="Base pricing" value={formatCurrency(service.price)} hint="Transparent service estimate" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[30px] p-6">
          <SectionHeading
            eyebrow="Included"
            title="What's covered"
            description="A clear scope helps workers arrive prepared and reduces support calls."
          />
          <div className="mt-6 grid gap-3">
            {service.includes?.map((item) => (
              <div key={item} className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <SectionHeading
            eyebrow="Workflow"
            title="How it works"
            description="The booking, assignment, and tracking flow is visible to all roles in real time."
          />
          <div className="mt-6 space-y-3">
            {service.howItWorks?.map((step, index) => (
              <div key={step} className="rounded-[22px] border border-white/8 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Step {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel rounded-[30px] p-6">
            <SectionHeading
              eyebrow="FAQ"
              title="Common questions"
              description="Clear expectations before checkout."
            />
            <div className="mt-6 space-y-3">
              {service.faqs?.map((faq) => (
                <div key={faq.question} className="rounded-[22px] border border-white/8 bg-white/4 p-4">
                  <div className="flex items-start gap-3">
                    <CircleHelp className="mt-1 size-4 text-cyan-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">{faq.question}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-[30px] p-6">
            <SectionHeading
              eyebrow="Reviews"
              title="Verified customer feedback"
              description="Ratings, reviews, and service trust indicators."
            />
            <div className="mt-6 space-y-3">
              {reviews.map((review, index) => (
                <div key={`${review.author || review.author_name}-${index}`} className="rounded-[22px] border border-white/8 bg-white/4 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-white">{review.author || review.author_name}</p>
                    <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                      {review.rating} stars
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SectionHeading
        eyebrow="Related"
        title="Customers also book"
        description="Suggestions based on similar home care and repair needs."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        {relatedServices.map((relatedService) => (
          <ServiceCard
            key={relatedService.id || relatedService.slug}
            service={relatedService}
            detailsLink={`/user/services/${relatedService.id || relatedService.slug}`}
          />
        ))}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="panel rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <p className="mt-3 text-xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-400">{hint}</p>
        </div>
        <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
