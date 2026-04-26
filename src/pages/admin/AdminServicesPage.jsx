import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { listServices, peekServicesCache, removeService, saveService, subscribeToTable } from "../../services/platformService.js";
import { uploadServiceImage } from "../../services/serviceMedia.js";
import { useToast } from "../../context/ToastContext.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import { formatCurrency } from "../../utils/formatters.js";

const INITIAL_FORM = {
  id: "",
  name: "",
  category: "",
  description: "",
  price: "",
  imageUrl: "",
  active: true,
};

export default function AdminServicesPage() {
  const { pushToast } = useToast();
  const cachedServices = peekServicesCache({ includeInactive: true });
  const [services, setServices] = useState(cachedServices || []);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(cachedServices === undefined);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    async function load(showLoader = false) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await listServices({ includeInactive: true });
        setServices(data);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    load(cachedServices === undefined);
    return subscribeToTable({
      channelName: "admin-services",
      table: "services",
      onChange: () => load(false),
    });
  }, [cachedServices]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleEdit(service) {
    setForm({
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      price: service.price,
      imageUrl: service.imageUrl || service.image_url || service.coverImage || "",
      active: service.active !== false,
    });
    setImageFile(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const nextImageUrl = imageFile ? await uploadServiceImage(form.name, imageFile) : form.imageUrl;
      const saved = await saveService({
        ...form,
        imageUrl: nextImageUrl || form.imageUrl || "",
      });
      pushToast({
        title: form.id ? "Service updated" : "Service created",
        message: `${saved.name} is now available in the admin catalog.`,
        type: "success",
      });
      setForm(INITIAL_FORM);
      setImageFile(null);
      setServices((current) => {
        const exists = current.some((service) => service.id === saved.id);
        return exists
          ? current.map((service) => (service.id === saved.id ? saved : service))
          : [saved, ...current];
      });
    } catch (error) {
      pushToast({
        title: "Save failed",
        message: error.message || "Unable to save the service.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(serviceId) {
    try {
      await removeService(serviceId);
      setServices((current) => current.filter((service) => service.id !== serviceId));
      pushToast({
        title: "Service removed",
        message: "The service has been removed from the live catalog.",
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Delete failed",
        message: error.message || "Unable to remove the service.",
        type: "error",
      });
    }
  }

  if (loading) {
    return <LoadingPanel rows={5} />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form className="panel rounded-[32px] p-6" onSubmit={handleSubmit}>
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Catalog editor</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          {form.id ? "Edit service" : "Add a new service"}
        </h2>

        <div className="mt-8 grid gap-4">
          <Field label="Service name" name="name" value={form.name} onChange={handleChange} />
          <Field label="Category" name="category" value={form.category} onChange={handleChange} />
          <Field label="Starting price" name="price" type="number" value={form.price} onChange={handleChange} />
          <div>
            <label className="mb-2 block text-sm text-slate-300">Service image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              className="input-shell w-full rounded-2xl px-4 py-3.5 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-300/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-amber-100"
            />
            {form.imageUrl ? (
              <div className="mt-3 overflow-hidden rounded-[22px] border border-white/8 bg-white/4">
                <img
                  src={form.imageUrl}
                  alt={form.name || "Service preview"}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Description</label>
            <textarea
              name="description"
              rows="5"
              value={form.description}
              onChange={handleChange}
              className="input-shell w-full rounded-2xl px-4 py-3.5"
            />
          </div>
          <label className="inline-flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
            Keep this service active in the user marketplace
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-70"
        >
          <Plus className="size-4" />
          {saving ? "Saving..." : form.id ? "Update service" : "Add service"}
        </button>
      </form>

      <div className="space-y-4">
        {services.map((service) => (
          <div key={service.id} className="panel rounded-[30px] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                {service.coverImage ? (
                  <div className="mb-4 overflow-hidden rounded-[24px] border border-white/8 bg-white/4">
                    <img
                      src={service.coverImage}
                      alt={service.name}
                      className="h-48 w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
                    {service.category}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{service.description}</p>
                <p className="mt-4 text-sm font-medium text-slate-200">{formatCurrency(service.price)}</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleEdit(service)}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(service.id)}
                  className="rounded-2xl border border-rose-300/20 bg-rose-400/8 px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-400/12"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="input-shell w-full rounded-2xl px-4 py-3.5"
        required
      />
    </div>
  );
}
