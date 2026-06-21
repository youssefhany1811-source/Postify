import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import AdminReportsMap from "../components/AdminReportsMap";

const STATUS_OPTIONS = [
  "new",
  "under_review",
  "in_progress",
  "resolved",
  "rejected",
];

const GIZA_CENTER = { lat: 30.0131, lng: 31.2089 };

export default function GizaEntityDashboard() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [region, setRegion] = useState(null);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("entity/giza/reports");
      setRegion(response.data.region);
      setStats(response.data.stats);
      setReports(response.data.reports || []);
    } catch (err) {
      setError(err.message || "Failed to load Giza reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleStatusChange(reportId, status) {
    setSavingId(reportId);
    setError("");

    try {
      const response = await api.patch(`entity/giza/reports/${reportId}/status`, {
        status,
      });
      const updatedReport = response.data.report;

      setReports((currentReports) =>
        currentReports.map((report) =>
          report.id === updatedReport.id ? updatedReport : report
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update report status.");
    } finally {
      setSavingId(null);
    }
  }

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const lowerQuery = query.toLowerCase();
      const matchesQuery =
        !query ||
        report.title?.toLowerCase().includes(lowerQuery) ||
        report.location?.toLowerCase().includes(lowerQuery) ||
        report.user?.username?.toLowerCase().includes(lowerQuery);

      const matchesStatus =
        statusFilter === "all" || report.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [reports, query, statusFilter]);

  if (loading) {
    return <div className='container-c text-slate-200'>Loading Giza reports...</div>;
  }

  return (
    <div className='max-w-6xl mx-auto space-y-8 px-4 pb-10'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='page-title mb-2'>Giza Entity Workspace</h1>
          <p className='text-slate-400'>
            Review reports assigned to the Giza operating area and update progress.
          </p>
        </div>
        <button onClick={loadReports} className='action-btn text-sm min-w-[140px]'>
          Refresh
        </button>
      </div>

      {error && (
        <div className='rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-100'>
          {error}
        </div>
      )}

      <div className='grid gap-4 md:grid-cols-4'>
        <EntityStat title='Total Giza Reports' value={stats?.total_reports ?? 0} />
        <EntityStat title='Open' value={stats?.open_reports ?? 0} />
        <EntityStat title='In Progress' value={stats?.in_progress_reports ?? 0} />
        <EntityStat title='Resolved' value={stats?.resolved_reports ?? 0} />
      </div>

      <div className='cool-panel'>
        <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-semibold text-white'>Giza Problem Map</h2>
            <p className='text-sm text-slate-400'>
              Mapped view of reports assigned to the Giza entity.
            </p>
          </div>

          <div className='grid w-full gap-3 md:grid-cols-2 xl:w-auto'>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search title, location, reporter'
              className='report-field min-w-[260px]'
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='report-field report-select'
            >
              <option value='all'>All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AdminReportsMap
          reports={reports}
          query={query}
          statusFilter={statusFilter}
          categoryFilter='all'
          defaultCenter={GIZA_CENTER}
          defaultZoom={12}
          regionBounds={region?.bounds}
          emptyMessage='No mapped Giza reports match the current filters.'
          summaryLabel='Giza mapped reports'
        />
      </div>

      <div className='cool-panel'>
        <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-semibold text-white'>Assigned Reports</h2>
            <p className='text-sm text-slate-400'>
              {filteredReports.length} reports shown in the Giza queue.
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          {filteredReports.length === 0 ? (
            <div className='rounded-xl border border-slate-700 bg-slate-900/60 p-5 text-slate-300'>
              No Giza reports match the current filters.
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className='rounded-xl border border-slate-700 bg-slate-900/70 p-4'
              >
                <div className='mb-3 flex flex-wrap items-start justify-between gap-4'>
                  <div>
                    <div className='text-lg font-semibold text-white'>
                      {report.title}
                    </div>
                    <div className='mt-2 flex flex-wrap gap-2 text-xs text-slate-200'>
                      <span className='report-meta-chip bg-cyan-800/60'>
                        {formatLabel(report.category)}
                      </span>
                      <span className='report-meta-chip bg-emerald-800/60'>
                        {formatLabel(report.status)}
                      </span>
                      <span className='report-meta-chip bg-slate-700/80'>
                        {report.location || "No location"}
                      </span>
                    </div>
                  </div>

                  <select
                    value={report.status}
                    disabled={savingId === report.id}
                    onChange={(e) => handleStatusChange(report.id, e.target.value)}
                    className='report-field report-select max-w-[220px]'
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                  <Link
                    to={`/reports/${report.id}`}
                    className='admin-map-report-btn'
                  >
                    Open report
                  </Link>
                </div>

                <div className='text-sm text-slate-300'>{report.body}</div>

                <div className='mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400'>
                  <span>Reporter: {report.user?.username || "Unknown"}</span>
                  <span>Phone: {report.contact_phone || "Not provided"}</span>
                  <span>Supports: {report.supports_count ?? 0}</span>
                  <span>Comments: {report.comments_count ?? 0}</span>
                  <span>
                    Coordinates: {report.latitude || "-"}, {report.longitude || "-"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EntityStat({ title, value }) {
  return (
    <div className='rounded-2xl border border-slate-700 bg-slate-900/70 p-4'>
      <div className='text-sm text-slate-400'>{title}</div>
      <div className='mt-2 text-3xl font-bold text-white'>{value}</div>
    </div>
  );
}

function formatLabel(value) {
  if (!value) return "Unknown";

  return value.replaceAll("_", " ");
}
