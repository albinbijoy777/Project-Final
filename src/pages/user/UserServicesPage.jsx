import { useDeferredValue, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { listServices, subscribeToTable } from "../../services/platformService.js";
import ServiceCard from "../../components/ServiceCard.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import SectionHeading from "../../components/SectionHeading.jsx";

export default function UserServicesPage() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    async function load(showLoader = false) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await listServices();
        setServices(data);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    load(true);
    return subscribeToTable({
      channelName: "user-services-page",
      table: "services",
      onChange: () => load(false),
    });
  }, []);

  const filteredServices = services.filter((service) => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      service.name.toLowerCase().includes(query) ||
      service.category.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketplace"
        title="Book from a premium service catalog"
        description="Every service card includes live availability, transparent pricing, reward codes, and detail pages with FAQs and reviews."
      />

      <div className="panel rounded-[30px] p-4">
        <div className="flex items-center gap-3 rounded-[24px] border border-white/8 bg-white/4 px-4 py-3">
          <Search className="size-4 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            placeholder="Search by service, category, or use case"
          />
        </div>
      </div>

      {loading ? (
        <LoadingPanel rows={4} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id || service.slug}
              service={service}
              detailsLink={`/user/services/${service.id || service.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
