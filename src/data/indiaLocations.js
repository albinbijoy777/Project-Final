export const INDIA_SERVICE_AREAS = [
  {
    state: "Kerala",
    districts: [
      "Thiruvananthapuram",
      "Kollam",
      "Pathanamthitta",
      "Alappuzha",
      "Kottayam",
      "Idukki",
      "Ernakulam",
      "Thrissur",
      "Palakkad",
      "Malappuram",
      "Kozhikode",
      "Wayanad",
      "Kannur",
      "Kasaragod",
    ],
  },
  {
    state: "Karnataka",
    districts: [
      "Bagalkot",
      "Ballari",
      "Belagavi",
      "Bengaluru Rural",
      "Bengaluru Urban",
      "Bidar",
      "Chamarajanagar",
      "Chikkaballapur",
      "Chikkamagaluru",
      "Chitradurga",
      "Dakshina Kannada",
      "Davanagere",
      "Dharwad",
      "Gadag",
      "Hassan",
      "Haveri",
      "Kalaburagi",
      "Kodagu",
      "Kolar",
      "Koppal",
      "Mandya",
      "Mysuru",
      "Raichur",
      "Ramanagara",
      "Shivamogga",
      "Tumakuru",
      "Udupi",
      "Uttara Kannada",
      "Vijayapura",
      "Vijayanagara",
      "Yadgir",
    ],
  },
];

export const DEFAULT_SERVICE_STATE = "Karnataka";
export const DEFAULT_SERVICE_DISTRICT = "Bengaluru Urban";

export function getSupportedStates() {
  return INDIA_SERVICE_AREAS.map((entry) => entry.state);
}

export function getDistrictsForState(state) {
  const match = INDIA_SERVICE_AREAS.find((entry) => entry.state === state);
  return match?.districts || [];
}

export function isSupportedState(state) {
  return getSupportedStates().includes(state);
}

export function normalizeDistrictSelection(state, districts) {
  const allowedDistricts = new Set(getDistrictsForState(state));
  return Array.from(new Set((districts || []).filter((district) => allowedDistricts.has(district))));
}

export function formatCoverageSummary(state, districts) {
  const selectedDistricts = normalizeDistrictSelection(state, districts);

  if (!state || !selectedDistricts.length) {
    return "Coverage not configured";
  }

  if (selectedDistricts.length === 1) {
    return `${selectedDistricts[0]}, ${state}`;
  }

  return `${selectedDistricts.length} districts in ${state}`;
}

export function guessStateFromAddress(value) {
  const address = String(value || "").toLowerCase();
  return getSupportedStates().find((state) => address.includes(state.toLowerCase())) || "";
}

export function guessDistrictFromAddress(state, value) {
  const address = String(value || "").toLowerCase();
  return getDistrictsForState(state).find((district) => address.includes(district.toLowerCase())) || "";
}
