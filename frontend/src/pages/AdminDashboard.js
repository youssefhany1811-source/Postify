import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import AdminReportsMap from "../components/AdminReportsMap";

const STATUS_OPTIONS = [
  "new",
  "under_review",
  "in_progress",
  "resolved",
  "rejected",
];

const CATEGORY_OPTIONS = [
  "all",
  "waste",
  "roads",
  "street_lights",
  "water",
  "safety",
  "noise",
  "other",
];

const DASHBOARD_TABS = [
  { id: "overview", label: "Overview" },
  { id: "map", label: "Map" },
  { id: "manage", label: "Manage Reports" },
  { id: "queues", label: "Priority Queues" },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [reportsByCategory, setReportsByCategory] = useState([]);
  const [reportsByStatus, setReportsByStatus] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [topSupportedReports, setTopSupportedReports] = useState([]);
  const [oldestOpenReports, setOldestOpenReports] = useState([]);
  const [topLocations, setTopLocations] = useState([]);
  const [mapReports, setMapReports] = useState([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("admin/dashboard");
      setStats(res.data.stats);
      setReportsByCategory(res.data.reports_by_category || []);
      setReportsByStatus(res.data.reports_by_status || []);
      setRecentReports(res.data.recent_reports || []);
      setTopSupportedReports(res.data.top_supported_reports || []);
      setOldestOpenReports(res.data.oldest_open_reports || []);
      setTopLocations(res.data.top_locations || []);
      setMapReports(res.data.map_reports || []);
    } catch (err) {
      setError(err.message || "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleStatusChange(reportId, status) {
    try {
      await api.patch(`admin/reports/${reportId}/status`, { status });
      loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to update report status.");
    }
  }

  const filteredRecentReports = useMemo(() => {
    return recentReports.filter((report) => {
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
  }, [recentReports, query, statusFilter, categoryFilter]);

  if (loading) {
    return <div className='container-c text-slate-200'>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className='container-c'>
        <div className='cool-panel'>
          <h1 className='page-title'>Admin Dashboard</h1>
          <div className='rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-100'>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto space-y-8 px-4 pb-10'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='page-title mb-2'>Admin Dashboard</h1>
          <p className='text-slate-400'>
            Review reports, monitor trends, and update issue status.
          </p>
        </div>
        <button onClick={loadDashboard} className='action-btn text-sm min-w-[140px]'>
          Refresh Data
        </button>
      </div>

      <div className='admin-tabs' role='tablist' aria-label='Admin dashboard sections'>
        {DASHBOARD_TABS.map((tab) => (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={activeTab === tab.id}
            className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            <span className='admin-tab-count'>
              {getTabCount(tab.id, stats, filteredRecentReports, mapReports)}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className='space-y-6'>
          <div className='grid gap-4 md:grid-cols-3 xl:grid-cols-6'>
            <StatCard title='Total Reports' value={stats?.total_reports ?? 0} />
            <StatCard title='Open Reports' value={stats?.open_reports ?? 0} />
            <StatCard title='Resolved' value={stats?.resolved_reports ?? 0} />
            <StatCard title='Rejected' value={stats?.rejected_reports ?? 0} />
            <StatCard title='Support Votes' value={stats?.support_votes ?? 0} />
            <StatCard title='Comments' value={stats?.total_comments ?? 0} />
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <MiniMetric
              label='Resolution Rate'
              value={`${stats?.resolution_rate ?? 0}%`}
            />
            <MiniMetric
              label='Reports With Images'
              value={stats?.reports_with_images ?? 0}
            />
            <MiniMetric
              label='Unresolved Queue'
              value={stats?.open_reports ?? 0}
            />
            <MiniMetric
              label='Review Load'
              value={(stats?.open_reports ?? 0) + (stats?.rejected_reports ?? 0)}
            />
          </div>

          <div className='grid gap-6 xl:grid-cols-3'>
            <BreakdownCard
              title='Reports by Category'
              items={reportsByCategory}
              total={stats?.total_reports ?? 0}
              keyName='category'
            />
            <BreakdownCard
              title='Reports by Status'
              items={reportsByStatus}
              total={stats?.total_reports ?? 0}
              keyName='status'
            />
            <SimpleListCard
              title='Top Locations'
              items={topLocations}
              keyField='location'
              labelField='location'
            />
          </div>
        </div>
      )}

      {activeTab === "map" && (
        <DashboardPanel
          title='Reports Map'
          description='Geographic view of reports using the current search and filters.'
        >
          <ReportFilters
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
          />
          <AdminReportsMap
            reports={mapReports}
            query={query}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
          />
        </DashboardPanel>
      )}

      {activeTab === "manage" && (
        <DashboardPanel
          title='Report Management'
          description='Search, filter, and update recent reports.'
          aside={`${filteredRecentReports.length} shown`}
        >
          <ReportFilters
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
          />
          <ReportsManagementList
            reports={filteredRecentReports}
            onStatusChange={handleStatusChange}
          />
        </DashboardPanel>
      )}

      {activeTab === "queues" && (
        <div className='grid gap-6 xl:grid-cols-2'>
          <ReportsListCard
            title='Top Supported Reports'
            reports={topSupportedReports}
            actionLabel='Supports'
            actionField='supports_count'
          />
          <ReportsListCard
            title='Oldest Open Reports'
            reports={oldestOpenReports}
            actionLabel='Status'
            actionField='status'
          />
        </div>
      )}
    </div>
  );
}

function getTabCount(tabId, stats, filteredRecentReports, mapReports) {
  if (tabId === "overview") return stats?.total_reports ?? 0;
  if (tabId === "map") return mapReports.length;
  if (tabId === "manage") return filteredRecentReports.length;
  if (tabId === "queues") return stats?.open_reports ?? 0;
  return 0;
}

function DashboardPanel({ title, description, aside, children }) {
  return (
    <div className='cool-panel'>
      <div className='mb-5 flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-semibold text-white'>{title}</h2>
          <p className='text-sm text-slate-400'>{description}</p>
        </div>
        {aside && (
          <div className='rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100'>
            {aside}
          </div>
        )}
      </div>
      <div className='space-y-5'>{children}</div>
    </div>
  );
}

function ReportFilters({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
}) {
  return (
    <div className='grid gap-3 md:grid-cols-3'>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search title, location, reporter'
        className='report-field'
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

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className='report-field report-select'
      >
        {CATEGORY_OPTIONS.map((category) => (
          <option key={category} value={category}>
            {category === "all" ? "All categories" : formatLabel(category)}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReportsManagementList({ reports, onStatusChange }) {
  if (reports.length === 0) {
    return (
      <div className='rounded-xl border border-slate-700 bg-slate-900/60 p-5 text-slate-300'>
        No reports match the current filters.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {reports.map((report) => (
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
              onChange={(e) => onStatusChange(report.id, e.target.value)}
              className='report-field report-select max-w-[220px]'
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className='text-sm text-slate-300'>
            {report.body}
          </div>

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
      ))}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className='rounded-2xl border border-slate-700 bg-slate-900/70 p-4'>
      <div className='text-sm text-slate-400'>{title}</div>
      <div className='mt-2 text-3xl font-bold text-white'>{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className='rounded-2xl border border-slate-700 bg-slate-900/50 p-4'>
      <div className='text-xs uppercase tracking-wide text-slate-500'>{label}</div>
      <div className='mt-2 text-xl font-semibold text-white'>{value}</div>
    </div>
  );
}

function BreakdownCard({ title, items, total, keyName }) {
  return (
    <div className='rounded-2xl border border-slate-700 bg-slate-900/70 p-4'>
      <div className='mb-4 text-lg font-semibold text-white'>{title}</div>
      <div className='space-y-3'>
        {items.map((item) => {
          const key = item[keyName] || "unknown";
          const percentage = total > 0 ? Math.round((item.total / total) * 100) : 0;

          return (
            <div key={key}>
              <div className='mb-1 flex items-center justify-between text-sm'>
                <span className='text-slate-300'>{formatLabel(key)}</span>
                <span className='text-white'>{item.total}</span>
              </div>
              <div className='h-2 rounded-full bg-slate-800'>
                <div
                  className='h-2 rounded-full bg-cyan-400'
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimpleListCard({ title, items, keyField, labelField }) {
  return (
    <div className='rounded-2xl border border-slate-700 bg-slate-900/70 p-4'>
      <div className='mb-4 text-lg font-semibold text-white'>{title}</div>
      <div className='space-y-3'>
        {items.map((item) => (
          <div
            key={item[keyField]}
            className='flex items-center justify-between rounded-xl bg-slate-950/40 px-3 py-2 text-sm'
          >
            <span className='text-slate-300'>{item[labelField]}</span>
            <span className='text-white'>{item.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsListCard({ title, reports, actionLabel, actionField }) {
  return (
    <div className='rounded-2xl border border-slate-700 bg-slate-900/70 p-4'>
      <div className='mb-4 text-lg font-semibold text-white'>{title}</div>
      <div className='space-y-3'>
        {reports.map((report) => (
          <div
            key={report.id}
            className='rounded-xl bg-slate-950/40 p-3'
          >
            <div className='text-sm font-semibold text-white'>{report.title}</div>
            <div className='mt-1 text-xs text-slate-400'>
              {report.location || "No location"} • {report.user?.username || "Unknown"}
            </div>
            <div className='mt-2 flex items-center justify-between text-xs'>
              <span className='text-slate-300'>{actionLabel}</span>
              <span className='text-white'>
                {actionField === "status"
                  ? formatLabel(report[actionField])
                  : report[actionField] ?? 0}
              </span>
            </div>
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
