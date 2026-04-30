const GOOGLE_MAPS_SCRIPT_ID = "fixbee-google-maps-script";

let googleMapsPromise = null;

export function isGoogleMapsConfigured() {
  return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
}

export async function loadGoogleMapsPlaces() {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.google?.maps?.places) {
    return window.google.maps;
  }

  if (!isGoogleMapsConfigured()) {
    return null;
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);

    function handleLoad() {
      if (window.google?.maps?.places) {
        resolve(window.google.maps);
        return;
      }

      googleMapsPromise = null;
      reject(new Error("Google Maps Places library did not load correctly."));
    }

    function handleError() {
      googleMapsPromise = null;
      reject(new Error("Google Maps script could not be loaded."));
    }
  });

  return googleMapsPromise;
}
