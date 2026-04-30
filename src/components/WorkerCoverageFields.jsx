import { MapPinHouse } from "lucide-react";
import {
  DEFAULT_SERVICE_DISTRICT,
  DEFAULT_SERVICE_STATE,
  formatCoverageSummary,
  getDistrictsForState,
} from "../data/indiaLocations.js";
import GoogleMapsLocationInput from "./GoogleMapsLocationInput.jsx";

export default function WorkerCoverageFields({
  state,
  districts,
  locationText,
  onStateChange,
  onDistrictToggle,
  onLocationTextChange,
  onPlaceSelect,
  availability,
  onAvailabilityChange,
  title = "Worker coverage area",
  description = "Choose the state and districts where this worker can actively take jobs.",
  showAvailability = false,
}) {
  const selectedState = state || DEFAULT_SERVICE_STATE;
  const districtOptions = getDistrictsForState(selectedState);
  const selectedDistricts =
    Array.isArray(districts) && districts.length
      ? districts
      : [selectedState === DEFAULT_SERVICE_STATE ? DEFAULT_SERVICE_DISTRICT : districtOptions[0]].filter(Boolean);

  return (
    <div className="rounded-[28px] border border-white/8 bg-white/4 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <div className="rounded-full border border-amber-200/15 bg-amber-300/8 px-3 py-1.5 text-xs text-amber-100">
          {formatCoverageSummary(selectedState, selectedDistricts)}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-300">State</label>
          <select
            value={selectedState}
            onChange={(event) => onStateChange?.(event.target.value)}
            className="input-shell w-full rounded-2xl px-4 py-3.5"
          >
            <option value="Kerala">Kerala</option>
            <option value="Karnataka">Karnataka</option>
          </select>
        </div>

        {showAvailability ? (
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(availability)}
              onChange={(event) => onAvailabilityChange?.(event.target.checked)}
              className="size-4 rounded border-white/20 bg-transparent"
            />
            Open for new assignments
          </label>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="text-sm text-slate-300">Districts</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {districtOptions.map((district) => {
            const checked = selectedDistricts.includes(district);
            return (
              <label
                key={district}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                  checked
                    ? "border-amber-200/20 bg-amber-300/10 text-amber-50"
                    : "border-white/8 bg-white/4 text-slate-300 hover:bg-white/6"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onDistrictToggle?.(district)}
                  className="size-4 rounded border-white/20 bg-transparent"
                />
                {district}
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <GoogleMapsLocationInput
          label="Base location - Google Maps"
          value={locationText}
          onChange={onLocationTextChange}
          onPlaceSelect={onPlaceSelect}
          placeholder="Enter the worker's main service hub, office, or landmark"
        />
      </div>

      <div className="mt-4 rounded-[22px] border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-400">
        <div className="inline-flex items-center gap-2 text-slate-200">
          <MapPinHouse className="size-4" />
          Coverage rule
        </div>
        <p className="mt-2 leading-6">
          Admin can prioritize approved workers whose districts match the customer booking location in real time.
        </p>
      </div>
    </div>
  );
}
