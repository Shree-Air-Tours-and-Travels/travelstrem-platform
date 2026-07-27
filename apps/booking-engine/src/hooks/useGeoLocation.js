import { useState, useEffect } from "react";

const GEOLOCATION_API_URL = process.env.REACT_APP_GEOLOCATION_API_URL;

export default function useGeoLocation() {
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      if (!GEOLOCATION_API_URL) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await fetch(GEOLOCATION_API_URL);
        if (!res.ok) throw new Error("Geo lookup failed");
        const data = await res.json();
        if (!cancelled && data?.country_name) {
          setCountry(data.country_name);
        }
      } catch {
        // Fallback: leave country as null, user can select manually
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    detect();
    return () => { cancelled = true; };
  }, []);

  return { country, loading };
}
