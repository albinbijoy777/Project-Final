import { useEffect, useId, useRef, useState } from "react";
import { MapPinned } from "lucide-react";
import { isGoogleMapsConfigured, loadGoogleMapsPlaces } from "../services/googleMaps.js";

export default function GoogleMapsLocationInput({
  label = "Location - Google Maps",
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search a place or enter an exact address",
  required = false,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState("");
  const mapsConfigured = isGoogleMapsConfigured();
  const effectiveLabel = mapsConfigured
    ? label
    : String(label || "Location").replace(/\s*-\s*google maps/i, "").trim() || "Location";

  useEffect(() => {
    let active = true;

    async function setupAutocomplete() {
      if (!inputRef.current) {
        return;
      }

      try {
        const maps = await loadGoogleMapsPlaces();

        if (!active || !maps || !inputRef.current || autocompleteRef.current) {
          if (maps) {
            setMapsReady(true);
          }
          return;
        }

        autocompleteRef.current = new maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "in" },
          fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const nextPlace = autocompleteRef.current?.getPlace?.();
          if (!nextPlace) {
            return;
          }

          onPlaceSelect?.(nextPlace);
          onChange?.(nextPlace.formatted_address || nextPlace.name || "");
        });

        setMapsReady(true);
      } catch (error) {
        if (active) {
          setMapsError(error.message || "Google Maps search is currently unavailable.");
        }
      }
    }

    setupAutocomplete();

    return () => {
      active = false;
    };
  }, [onChange, onPlaceSelect]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm text-slate-300" htmlFor={inputId}>
          {effectiveLabel}
        </label>
        {mapsConfigured ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] text-slate-400">
            <MapPinned className="size-3.5" />
            {mapsReady ? "Google Maps ready" : "Loading search"}
          </span>
        ) : null}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="input-shell w-full rounded-2xl px-4 py-3.5"
        placeholder={placeholder}
        required={required}
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {mapsError
          ? mapsError
          : mapsReady
            ? "Search for the exact place or select the suggestion from Google Maps."
            : "Enter the exact service location manually."}
      </p>
    </div>
  );
}
