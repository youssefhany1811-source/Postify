import { useEffect, useMemo, useRef, useState } from "react";

const LEAFLET_CSS_ID = "leaflet-cdn-css";
const LEAFLET_SCRIPT_ID = "leaflet-cdn-script";
const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

function loadLeafletAssets() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }

    if (!document.getElementById(LEAFLET_CSS_ID)) {
      const link = document.createElement("link");
      link.id = LEAFLET_CSS_ID;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(LEAFLET_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.L), {
        once: true,
      });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function ReportLocationPicker({
  latitude,
  longitude,
  onChange,
  disabled = false,
}) {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onChangeRef.current = onChange;
    disabledRef.current = disabled;
  }, [onChange, disabled]);

  const currentCenter = useMemo(() => {
    const lat = Number.parseFloat(latitude);
    const lng = Number.parseFloat(longitude);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }

    return DEFAULT_CENTER;
  }, [latitude, longitude]);

  useEffect(() => {
    let isMounted = true;

    loadLeafletAssets()
      .then((L) => {
        if (!isMounted || !mapElementRef.current || mapInstanceRef.current) {
          return;
        }

        const map = L.map(mapElementRef.current, {
          center: [currentCenter.lat, currentCenter.lng],
          zoom: Number.isFinite(Number.parseFloat(latitude)) ? 15 : 11,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        const marker = L.marker([currentCenter.lat, currentCenter.lng], {
          draggable: !disabled,
        }).addTo(map);

        map.on("click", (event) => {
          if (disabledRef.current) return;

          const nextLat = Number(event.latlng.lat.toFixed(6));
          const nextLng = Number(event.latlng.lng.toFixed(6));

          marker.setLatLng([nextLat, nextLng]);
          onChangeRef.current(nextLat, nextLng);
        });

        marker.on("dragend", () => {
          if (disabledRef.current) return;

          const position = marker.getLatLng();
          const nextLat = Number(position.lat.toFixed(6));
          const nextLng = Number(position.lng.toFixed(6));
          marker.setLatLng([nextLat, nextLng]);
          onChangeRef.current(nextLat, nextLng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setIsReady(true);
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("Map failed to load. Please try again.");
        }
      });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [currentCenter.lat, currentCenter.lng, latitude, disabled]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    markerRef.current.setLatLng([currentCenter.lat, currentCenter.lng]);
    if (markerRef.current.dragging) {
      if (disabled) {
        markerRef.current.dragging.disable();
      } else {
        markerRef.current.dragging.enable();
      }
    }
    mapInstanceRef.current.setView([currentCenter.lat, currentCenter.lng]);
  }, [currentCenter, disabled]);

  function useMyLocation() {
    if (disabled || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLat = Number(coords.latitude.toFixed(6));
        const nextLng = Number(coords.longitude.toFixed(6));
        onChangeRef.current(nextLat, nextLng);
      },
      () => {
        setLoadError("Could not get your current location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className='report-map-wrapper'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <div>
          <div className='text-sm font-semibold text-slate-100'>Pick location on map</div>
          <div className='text-xs text-slate-400'>Click anywhere to place the marker</div>
        </div>
        <button
          type='button'
          onClick={useMyLocation}
          disabled={disabled}
          className='report-map-btn'
        >
          Use My Location
        </button>
      </div>

      <div ref={mapElementRef} className='report-map-canvas' />

      {!isReady && !loadError && (
        <div className='report-map-message'>Loading map...</div>
      )}

      {loadError && (
        <div className='report-map-error'>{loadError}</div>
      )}

      <div className='mt-3 text-xs text-slate-300'>
        Selected coordinates: {currentCenter.lat}, {currentCenter.lng}
      </div>
    </div>
  );
}
