import { useEffect, useMemo, useRef, useState } from "react";

const LEAFLET_CSS_ID = "leaflet-cdn-css";
const LEAFLET_SCRIPT_ID = "leaflet-cdn-script";
const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

const STATUS_COLORS = {
  new: "#f59e0b",
  under_review: "#38bdf8",
  in_progress: "#a78bfa",
  resolved: "#22c55e",
  rejected: "#ef4444",
};

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

export default function AdminReportsMap({
  reports,
  statusFilter,
  categoryFilter,
  query,
}) {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [projectedReports, setProjectedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesQuery =
        !query ||
        report.title?.toLowerCase().includes(query.toLowerCase()) ||
        report.location?.toLowerCase().includes(query.toLowerCase()) ||
        report.user?.username?.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || report.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || report.category === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [reports, query, statusFilter, categoryFilter]);

  const validMappedReports = useMemo(() => {
    return filteredReports.filter((report) => {
      const lat = Number.parseFloat(report.latitude);
      const lng = Number.parseFloat(report.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });
  }, [filteredReports]);

  useEffect(() => {
    let isMounted = true;

    loadLeafletAssets()
      .then((L) => {
        if (!isMounted || !mapElementRef.current || mapInstanceRef.current) {
          return;
        }

        const map = L.map(mapElementRef.current, {
          center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
          zoom: 11,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        layerGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        setIsReady(true);
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
        setTimeout(() => {
          map.invalidateSize();
        }, 500);
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
        layerGroupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !window.L) return;

    layerGroupRef.current.clearLayers();

    if (validMappedReports.length === 0) {
      mapInstanceRef.current.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 11);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
      return;
    }

    const bounds = [];

    validMappedReports.forEach((report) => {
      const lat = Number.parseFloat(report.latitude);
      const lng = Number.parseFloat(report.longitude);
      bounds.push([lat, lng]);
    });

    if (bounds.length === 1) {
      mapInstanceRef.current.setView(bounds[0], 15);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
      return;
    }

    if (bounds.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
    }
  }, [validMappedReports]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    function updateProjectedReports() {
      const nextProjectedReports = validMappedReports.map((report, index) => {
        const lat = Number.parseFloat(report.latitude);
        const lng = Number.parseFloat(report.longitude);
        const point = map.latLngToContainerPoint([lat, lng]);

        return {
          report,
          index,
          x: point.x,
          y: point.y,
        };
      });

      setProjectedReports(nextProjectedReports);
    }

    updateProjectedReports();
    map.on("move zoom resize moveend zoomend", updateProjectedReports);
    const timeoutId = setTimeout(updateProjectedReports, 150);

    return () => {
      clearTimeout(timeoutId);
      map.off("move zoom resize moveend zoomend", updateProjectedReports);
    };
  }, [isReady, validMappedReports]);

  if (loadError) {
    return <div className='report-map-error'>{loadError}</div>;
  }

  function focusReport(report) {
    const lat = Number.parseFloat(report.latitude);
    const lng = Number.parseFloat(report.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !mapInstanceRef.current) {
      return;
    }

    mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
    setSelectedReport(report);
  }

  return (
    <div>
      <div className='mb-4 flex flex-wrap gap-3 text-xs text-slate-300'>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className='flex items-center gap-2'>
            <span
              className='h-3 w-3 rounded-full'
              style={{ backgroundColor: color }}
            />
            <span>{formatLabel(status)}</span>
          </div>
        ))}
      </div>

      <div className='admin-report-map-shell'>
        <div ref={mapElementRef} className='admin-report-map-canvas' />

        <div className='admin-report-map-pin-layer'>
          {projectedReports.map(({ report, index, x, y }) => (
            <button
              key={report.id}
              type='button'
              className='admin-report-pin-button'
              style={{
                left: `${x}px`,
                top: `${y}px`,
                backgroundColor: STATUS_COLORS[report.status] || "#94a3b8",
              }}
              onClick={() => focusReport(report)}
              title={report.title}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {isReady && validMappedReports.length === 0 && (
          <div className='admin-report-map-overlay'>
            No mapped reports match the current filters.
          </div>
        )}
      </div>

      {!isReady && !loadError && (
        <div className='report-map-message'>Loading map...</div>
      )}

      <div className='mt-3 text-xs text-slate-400'>
        Showing {validMappedReports.length} plotted reports out of {filteredReports.length} filtered reports.
      </div>
      {selectedReport && (
        <div className='mt-3 rounded-xl border border-cyan-300/30 bg-slate-950/50 p-3 text-sm text-slate-200'>
          <div className='font-semibold text-white'>{selectedReport.title}</div>
          <div className='mt-1 text-xs text-slate-400'>
            {formatLabel(selectedReport.category)} | {formatLabel(selectedReport.status)} | {selectedReport.location || "No location"}
          </div>
          <div className='mt-1 text-xs text-slate-400'>
            Reporter: {selectedReport.user?.username || "Unknown"} | Supports: {selectedReport.supports_count ?? 0} | Comments: {selectedReport.comments_count ?? 0}
          </div>
        </div>
      )}
      <div className='mt-3'>
        <div className='mb-2 text-sm font-semibold text-slate-200'>
          Jump to mapped report
        </div>
        <div className='flex flex-wrap gap-2'>
          {validMappedReports.map((report) => (
            <button
              key={report.id}
              type='button'
              onClick={() => focusReport(report)}
              className='admin-map-report-btn'
            >
              #{report.id} {report.title}
            </button>
          ))}
        </div>
      </div>
      <div className='mt-2 rounded-xl bg-slate-950/40 p-3 text-xs text-slate-400'>
        <div className='font-semibold text-slate-300 mb-2'>Map debug</div>
        {validMappedReports.map((report) => (
          <div key={report.id}>
            #{report.id} — {report.latitude}, {report.longitude}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLabel(value) {
  if (!value) return "Unknown";
  return value.replaceAll("_", " ");
}
