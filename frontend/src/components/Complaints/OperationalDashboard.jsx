import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Users,
  Building2,
  ShieldAlert,
  ArrowRightLeft,
  UserCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import { complaintAPI, departmentAPI } from "../../services/api";
import { SLABadge } from "../Common/SLABadge";
import { formatDate } from "../../utils/helpers";
import { InteractiveTrendChart } from "../Statistics/InteractiveTrendChart";
import { PerformanceMetricsChart } from "../Statistics/PerformanceMetricsChart";

export const OperationalDashboard = ({ onSelectComplaint, onOpenDisposition }) => {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'unassigned', 'urgent', 'departments'
  const [slaData, setSlaData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [unassignedComplaints, setUnassignedComplaints] = useState([]);
  const [urgentComplaints, setUrgentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [officerSearch, setOfficerSearch] = useState("");

  useEffect(() => {
    loadAllOperationalData();
  }, []);

  const loadAllOperationalData = async () => {
    try {
      setLoading(true);
      const [slaRes, deptRes, offRes, unassignedRes, urgentRes] = await Promise.all([
        complaintAPI.getSLASummary().catch(() => ({ data: { data: null } })),
        departmentAPI.getAll().catch(() => ({ data: { data: [] } })),
        departmentAPI.getOfficers().catch(() => ({ data: { data: [] } })),
        complaintAPI.getAll({ unassigned: "true", status: "pending", limit: 20 }).catch(() => ({ data: { data: [] } })),
        complaintAPI.getAll({ is_escalated: "true", limit: 20 }).catch(() => ({ data: { data: [] } })),
      ]);

      setSlaData(slaRes.data?.data || null);
      setDepartments(deptRes.data?.data || []);
      setOfficers(offRes.data?.data || []);
      setUnassignedComplaints(unassignedRes.data?.data || []);
      setUrgentComplaints(urgentRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load operational data:", err);
    } finally {
      setLoading(false);
    }
  };

  const summary = slaData?.summary || {};
  const deptBreakdown = slaData?.by_department || [];

  const filteredOfficers = officers.filter((off) =>
    off.name.toLowerCase().includes(officerSearch.toLowerCase()) ||
    (off.department_name && off.department_name.toLowerCase().includes(officerSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Operasional & Pemantauan SLA
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen antrean disposisi, pengendalian tenggat waktu, dan beban kerja petugas OPD.
          </p>
        </div>

        <button
          onClick={loadAllOperationalData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* KPI Cards (Taste Skill: data as typography, quiet 1px borders) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Laporan Aktif
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {summary.active_count || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sedang ditangani</div>
        </div>

        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Antrean Disposisi
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {summary.unassigned_count || unassignedComplaints.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Belum ada petugas</div>
        </div>

        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">
            Mendekati Batas
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {summary.near_deadline_count || 0}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">&lt; 12 jam tersisa</div>
        </div>

        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">
            Melewati Batas SLA
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {summary.overdue_count || 0}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Perlu intervensi</div>
        </div>

        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-red-800 uppercase tracking-wider">
            Eskalasi Supervisor
          </div>
          <div className="text-2xl font-bold text-red-700 mt-1">
            {summary.escalated_count || urgentComplaints.length}
          </div>
          <div className="text-[11px] text-red-600/80 mt-0.5">Perhatian khusus</div>
        </div>

        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">
            Tepat Waktu
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {summary.resolved_on_time_count || 0}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">Kepatuhan selesai</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Scrollable on Mobile) */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 text-xs font-semibold overflow-x-auto whitespace-nowrap pb-px">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-1 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-sky-700 text-sky-800 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Tren & Kinerja OPD</span>
        </button>

        <button
          onClick={() => setActiveTab("unassigned")}
          className={`pb-3 px-1 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "unassigned"
              ? "border-sky-700 text-sky-800 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Antrean Disposisi ({unassignedComplaints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("urgent")}
          className={`pb-3 px-1 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "urgent"
              ? "border-sky-700 text-sky-800 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>Eskalasi & Terlambat ({urgentComplaints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("departments")}
          className={`pb-3 px-1 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "departments"
              ? "border-sky-700 text-sky-800 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Beban Petugas ({officers.length})</span>
        </button>
      </div>

      {/* Tab 1: Kinerja & Tren Per Departemen */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Interactive Curve Trend Chart */}
          <InteractiveTrendChart
            role="admin"
            scope="all"
            title="Tren Dinamika Pengaduan & Penyelesaian"
            subtitle="Kurva interaktif volume pengaduan masuk berbanding penyelesaian tepat waktu dan keterlambatan."
          />

          {/* Performance & SLA Metrics */}
          <PerformanceMetricsChart />

          {/* OPD SLA Compliance Table */}
          <div className="civic-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Matriks Kepatuhan SLA Antar-OPD
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rekapitulasi status kasus aktif, eskalasi supervisor, dan tingkat penyelesaian tepat waktu.
                </p>
              </div>
              <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium self-start sm:self-auto">
                {deptBreakdown.length || departments.length} OPD Terdaftar
              </span>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Nama Departemen / OPD</th>
                  <th className="py-2.5 px-4">Kode</th>
                  <th className="py-2.5 px-4 text-center">Aktif</th>
                  <th className="py-2.5 px-4 text-center">Lewat SLA</th>
                  <th className="py-2.5 px-4 text-center">Eskalasi</th>
                  <th className="py-2.5 px-4 text-center">Selesai</th>
                  <th className="py-2.5 px-4 text-right">Tingkat Tepat Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(deptBreakdown.length > 0 ? deptBreakdown : departments).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {d.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {d.code}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">
                      {d.active_count || d.active_complaints_count || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={Number(d.overdue_count) > 0 ? "text-rose-600 font-semibold" : "text-slate-400"}>
                        {d.overdue_count || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={Number(d.escalated_count) > 0 ? "text-red-700 font-bold" : "text-slate-400"}>
                        {d.escalated_count || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {d.resolved_total || d.total_complaints_count || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.on_time_rate_pct !== null && d.on_time_rate_pct !== undefined ? (
                        <span className="font-semibold text-emerald-700">
                          {d.on_time_rate_pct}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Tab 2: Antrean Disposisi */}
      {activeTab === "unassigned" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800">
              Laporan Warga Memerlukan Disposisi Petugas Segera
            </h3>
            <span className="text-[11px] text-slate-500">
              {unassignedComplaints.length} laporan belum ditugaskan
            </span>
          </div>

          {unassignedComplaints.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              Semua laporan telah didisposisikan ke petugas atau OPD terkait!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {unassignedComplaints.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-xs hover:text-indigo-600 cursor-pointer" onClick={() => onSelectComplaint(item)}>
                        {item.title}
                      </span>
                      <SLABadge complaint={item} showDeadline />
                    </div>
                    <p className="text-slate-600 text-xs line-clamp-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Waktu: {formatDate(item.created_at)}</span>
                      {item.location_address && <span>Lokasi: {item.location_address}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onSelectComplaint(item)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => onOpenDisposition(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Disposisikan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Laporan Eskalasi & Terlambat */}
      {activeTab === "urgent" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800">
              Laporan Dengan Status Eskalasi atau Melewati Batas Waktu
            </h3>
            <span className="text-[11px] text-rose-600 font-medium">
              {urgentComplaints.length} kasus memerlukan perhatian
            </span>
          </div>

          {urgentComplaints.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              Tidak ada laporan dalam status eskalasi supervisor saat ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {urgentComplaints.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-xs hover:text-indigo-600 cursor-pointer" onClick={() => onSelectComplaint(item)}>
                        {item.title}
                      </span>
                      <SLABadge complaint={item} showDeadline />
                    </div>
                    {item.escalation_reason && (
                      <p className="text-rose-700 font-medium text-xs">
                        ⚠️ Alasan eskalasi: {item.escalation_reason}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Departemen: {item.department_name || "Belum ada"}</span>
                      <span>Petugas: {item.assigned_officer_name || "Belum ditugaskan"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onSelectComplaint(item)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Buka Timeline
                    </button>
                    <button
                      onClick={() => onOpenDisposition(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Alihkan Tugas</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Beban Kerja Petugas */}
      {activeTab === "departments" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-semibold text-slate-800">
              Distribusi Beban Kerja Petugas Lapangan
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                placeholder="Cari petugas atau OPD..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Nama Petugas</th>
                  <th className="py-2.5 px-4">Departemen / OPD</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4 text-center">Tugas Aktif</th>
                  <th className="py-2.5 px-4 text-center">Tugas Selesai</th>
                  <th className="py-2.5 px-4 text-right">Status Beban</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOfficers.map((off) => {
                  const workload = Number(off.active_workload) || 0;
                  let loadBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  let loadLabel = "Ringan";

                  if (workload > 5) {
                    loadBadge = "bg-rose-50 text-rose-700 border-rose-200";
                    loadLabel = "Padat";
                  } else if (workload > 2) {
                    loadBadge = "bg-amber-50 text-amber-800 border-amber-200";
                    loadLabel = "Sedang";
                  }

                  return (
                    <tr key={off.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {off.name}
                        <div className="text-[11px] text-slate-400">{off.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {off.department_name || "-"}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-500">
                        {off.role}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {workload}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {off.completed_count || 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${loadBadge}`}>
                          {loadLabel} ({workload})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;
