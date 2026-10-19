import React, { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Calendar,
  Eye,
  EyeOff,
  Table as TableIcon,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
} from "lucide-react";
import { statisticsAPI } from "../../services/api";

// Custom Tooltip for Indonesian Civic Analytics
const CivicChartTooltip = ({ active, payload, label, isMonthly }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl border border-slate-700 text-xs min-w-[180px]">
      <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-slate-400 font-normal">
          {isMonthly ? "Bulan" : "Harian"}
        </span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          return (
            <div
              key={index}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300 capitalize">
                  {entry.name}:
                </span>
              </div>
              <span className="font-bold tabular-nums text-white">
                {entry.value.toLocaleString("id-ID")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const InteractiveTrendChart = ({
  role = "admin",
  scope = "all",
  departmentId = null,
  title = "Tren Pengaduan & Penyelesaian",
  subtitle = "Analisis volume aduan masuk berbanding penyelesaian operasional.",
}) => {
  const [period, setPeriod] = useState("30d"); // '7d', '30d', '90d', '12m'
  const [curveType, setCurveType] = useState("monotone"); // 'monotone' (halus) vs 'linear' (presisi)
  const [showTable, setShowTable] = useState(false);
  const [points, setPoints] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Series visibility toggles (controlled via clickable legend)
  const [visibleSeries, setVisibleSeries] = useState({
    masuk: true,
    selesai: true,
    proses: true,
    terlambat: role !== "warga", // Citizen does not need to see overdue by default
  });

  const isOfficer = role === "petugas";
  const isCitizen = role === "warga";

  const loadTrendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        period,
        scope,
        ...(departmentId ? { department_id: departmentId } : {}),
      };

      const res = await statisticsAPI.getTrends(params);
      if (res.data?.success) {
        setPoints(res.data.data.points || []);
        setSummary(res.data.data.summary || null);
      }
    } catch (err) {
      console.error("Failed to load trend data:", err);
      setError("Gagal memuat data tren statistik. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  }, [period, scope, departmentId]);

  useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Calculate resolution rate
  const resolutionRate =
    summary && summary.totalMasuk > 0
      ? Math.round((summary.totalSelesai / summary.totalMasuk) * 100)
      : summary?.totalSelesai > 0
      ? 100
      : 0;

  return (
    <div className="civic-card p-4 sm:p-6 space-y-5 animate-civic-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            {isOfficer && (
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Tugas Anda
              </span>
            )}
            {isCitizen && (
              <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                Laporan Saya
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Action Controls: Period Selector & Toggle curve */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Buttons */}
          <div
            className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium"
            role="group"
            aria-label="Pilih Rentang Waktu"
          >
            {[
              { id: "7d", label: "7 Hari" },
              { id: "30d", label: "30 Hari" },
              { id: "90d", label: "90 Hari" },
              { id: "12m", label: "12 Bulan" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  period === p.id
                    ? "bg-white text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
                aria-pressed={period === p.id}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Curve Smoothing Toggle */}
          <button
            onClick={() =>
              setCurveType((prev) =>
                prev === "monotone" ? "linear" : "monotone"
              )
            }
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
            title={
              curveType === "monotone"
                ? "Beralih ke garis lurus (akurasi titik)"
                : "Beralih ke kurva halus"
            }
          >
            <span>{curveType === "monotone" ? "Kurva Halus" : "Garis Lurus"}</span>
          </button>

          {/* Accessible Table Toggle */}
          <button
            onClick={() => setShowTable((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showTable
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            title="Tampilkan Alternatif Tabel Data (Aksesibilitas)"
            aria-label="Tampilkan alternatif tabel data"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadTrendData}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Muat ulang data grafik"
            aria-label="Muat ulang data grafik"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Pills */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
              <span>Laporan Masuk</span>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
              {summary.totalMasuk}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Periode {period === "12m" ? "12 Bulan" : `${period.replace("d", " Hari")}`}
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Laporan Selesai</span>
            </div>
            <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
              {summary.totalSelesai}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Rasio Selesai: {resolutionRate}%
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Dalam Penanganan</span>
            </div>
            <div className="text-xl font-bold text-amber-700 mt-1 tabular-nums">
              {summary.currentProses}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Status terbuka / aktif
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Volume Puncak</span>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
              {summary.peakMasuk}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Laporan / {period === "12m" ? "bulan" : "hari"}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Legend & Series Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
        <span className="text-slate-400 text-[11px]">
          Klik indikator untuk menyembunyikan/menampilkan seri:
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => toggleSeries("masuk")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
              visibleSeries.masuk
                ? "bg-sky-50 border-sky-300 text-sky-800"
                : "bg-slate-50 border-slate-200 text-slate-400 line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
            <span>Laporan Masuk</span>
            {visibleSeries.masuk ? (
              <Eye className="w-3 h-3 text-sky-600 ml-0.5" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => toggleSeries("selesai")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
              visibleSeries.selesai
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-400 line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Laporan Selesai</span>
            {visibleSeries.selesai ? (
              <Eye className="w-3 h-3 text-emerald-600 ml-0.5" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => toggleSeries("proses")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
              visibleSeries.proses
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-slate-50 border-slate-200 text-slate-400 line-through"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Dalam Proses</span>
            {visibleSeries.proses ? (
              <Eye className="w-3 h-3 text-amber-600 ml-0.5" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>

          {role !== "warga" && (
            <button
              onClick={() => toggleSeries("terlambat")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
                visibleSeries.terlambat
                  ? "bg-rose-50 border-rose-300 text-rose-800"
                  : "bg-slate-50 border-slate-200 text-slate-400 line-through"
              }`}
            >
              <span className="w-2.5 h-0.5 bg-rose-600" />
              <span>Terlambat (SLA)</span>
              {visibleSeries.terlambat ? (
                <Eye className="w-3 h-3 text-rose-600 ml-0.5" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Chart Canvas / States */}
      {loading ? (
        <div className="h-72 sm:h-80 flex flex-col items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mb-2" />
          <p className="text-xs text-slate-500">
            Mengolah kurva statistik dari server...
          </p>
        </div>
      ) : error ? (
        <div className="h-72 sm:h-80 flex flex-col items-center justify-center bg-rose-50/50 rounded-lg border border-rose-200 p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-rose-600 mb-2" />
          <p className="text-xs text-rose-800 font-medium mb-3">{error}</p>
          <button
            onClick={loadTrendData}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium shadow-sm hover:bg-rose-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : points.length === 0 ? (
        <div className="h-72 sm:h-80 flex flex-col items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200 p-6 text-center">
          <Calendar className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-xs font-semibold text-slate-700">
            Tidak ada aktivitas pengaduan pada rentang waktu ini
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
            Data akan otomatis tergambar begitu terdapat laporan baru yang masuk atau ditindaklanjuti.
          </p>
        </div>
      ) : (
        <div className="h-72 sm:h-84 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
              />

              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, "auto"]}
              />

              <Tooltip
                content={
                  <CivicChartTooltip isMonthly={period === "12m"} />
                }
              />

              {visibleSeries.masuk && (
                <Area
                  type={curveType}
                  dataKey="masuk"
                  name="Masuk"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMasuk)"
                  dot={{ r: points.length > 30 ? 0 : 2.5, fill: "#0284c7" }}
                  activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
                />
              )}

              {visibleSeries.selesai && (
                <Area
                  type={curveType}
                  dataKey="selesai"
                  name="Selesai"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSelesai)"
                  dot={{ r: points.length > 30 ? 0 : 2.5, fill: "#10b981" }}
                  activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
                />
              )}

              {visibleSeries.proses && (
                <Area
                  type={curveType}
                  dataKey="proses"
                  name="Dalam Proses"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProses)"
                  dot={{ r: points.length > 30 ? 0 : 2, fill: "#f59e0b" }}
                  activeDot={{ r: 4, stroke: "#ffffff", strokeWidth: 2 }}
                />
              )}

              {visibleSeries.terlambat && role !== "warga" && (
                <Line
                  type={curveType}
                  dataKey="terlambat"
                  name="Terlambat"
                  stroke="#ef4444"
                  strokeWidth={1.75}
                  strokeDasharray="4 4"
                  dot={{ r: points.length > 30 ? 0 : 2, fill: "#ef4444" }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Accessible Tabular Fallback (WCAG Accessibility Requirement) */}
      {showTable && points.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5 text-slate-500" />
              Tabel Nilai Data Tren (Alternatif Aksesibilitas)
            </h4>
            <span className="text-[11px] text-slate-500">
              {points.length} data record
            </span>
          </div>

          <div className="overflow-x-auto max-h-56 rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 sticky top-0 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2 text-left">Periode Waktu</th>
                  <th className="px-3 py-2 text-right">Laporan Masuk</th>
                  <th className="px-3 py-2 text-right">Laporan Selesai</th>
                  <th className="px-3 py-2 text-right">Sedang Diproses</th>
                  {role !== "warga" && (
                    <th className="px-3 py-2 text-right">Terlambat SLA</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white tabular-nums">
                {points.map((pt, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-1.5 font-medium text-slate-800">
                      {pt.displayDate} ({pt.date})
                    </td>
                    <td className="px-3 py-1.5 text-right text-sky-700 font-semibold">
                      {pt.masuk}
                    </td>
                    <td className="px-3 py-1.5 text-right text-emerald-700 font-semibold">
                      {pt.selesai}
                    </td>
                    <td className="px-3 py-1.5 text-right text-amber-700">
                      {pt.proses}
                    </td>
                    {role !== "warga" && (
                      <td className="px-3 py-1.5 text-right text-rose-700">
                        {pt.terlambat}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accessible summary caption */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>
          Data disajikan secara real-time dari basis data pengaduan SIPW. Kurva halus merepresentasikan volume kumulatif dan ritme operasional.
        </span>
      </div>
    </div>
  );
};

export default InteractiveTrendChart;
