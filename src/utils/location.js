import {
  DEFAULT_SERVICE_DISTRICT,
  DEFAULT_SERVICE_STATE,
  getDistrictsForState,
  guessDistrictFromAddress,
  guessStateFromAddress,
  normalizeDistrictSelection,
} from "../data/indiaLocations.js";

export function createEmptyLocationSelection() {
  return {
    state: DEFAULT_SERVICE_STATE,
    district: DEFAULT_SERVICE_DISTRICT,
    districts: [DEFAULT_SERVICE_DISTRICT],
    locationText: "",
    placeId: "",
    latitude: "",
    longitude: "",
  };
}

export function normalizeLocationSelection(input = {}) {
  const state = input.state || guessStateFromAddress(input.locationText) || DEFAULT_SERVICE_STATE;
  const availableDistricts = getDistrictsForState(state);
  const district =
    input.district ||
    guessDistrictFromAddress(state, input.locationText) ||
    availableDistricts[0] ||
    "";
  const districts = normalizeDistrictSelection(
    state,
    input.districts?.length ? input.districts : district ? [district] : []
  );

  return {
    state,
    district: districts[0] || district,
    districts,
    locationText: input.locationText || "",
    placeId: input.placeId || "",
    latitude: normalizeCoordinate(input.latitude),
    longitude: normalizeCoordinate(input.longitude),
  };
}

export function extractGooglePlaceSelection(place) {
  if (!place) {
    return createEmptyLocationSelection();
  }

  const formattedAddress = place.formatted_address || place.name || "";
  const addressComponents = Array.isArray(place.address_components) ? place.address_components : [];
  const state = findAddressComponent(addressComponents, "administrative_area_level_1") || guessStateFromAddress(formattedAddress) || DEFAULT_SERVICE_STATE;
  const district =
    findAddressComponent(addressComponents, "administrative_area_level_2") ||
    findAddressComponent(addressComponents, "locality") ||
    guessDistrictFromAddress(state, formattedAddress) ||
    getDistrictsForState(state)[0] ||
    "";
  const geometry = place.geometry?.location;

  return normalizeLocationSelection({
    state,
    district,
    districts: district ? [district] : [],
    locationText: formattedAddress,
    placeId: place.place_id || "",
    latitude: geometry?.lat ? geometry.lat() : "",
    longitude: geometry?.lng ? geometry.lng() : "",
  });
}

export function buildLocationLabel(state, district, locationText) {
  return [district, state, locationText].filter(Boolean).join(" - ");
}

export function normalizeCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Number(nextValue.toFixed(7)) : "";
}

function findAddressComponent(components, type) {
  const match = components.find((entry) => entry.types?.includes(type));
  return match?.long_name || "";
}
