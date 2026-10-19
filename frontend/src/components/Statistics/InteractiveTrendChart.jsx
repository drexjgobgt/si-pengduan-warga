import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
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
} from "lucide-react";
import { statisticsAPI } from "../../services/api";

// Format helper for full Indonesian date in Tooltip
const formatFullIndonesianDate = (dateStr, isMonthly) => {
  if (!dateStr) return "";
  if (isMonthly) {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
      ];
      const monthIndex = parseInt(parts[1], 10) - 1;
      return `${monthNames[monthIndex] || parts[1]} ${parts[0]}`;
    }
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Formal Civic Tooltip (High-contrast, accurate, zero clutter)
const CivicChartTooltip = ({ active, payload, label, points, isMonthly }) => {
  if (!active || !payload || !payload.length) return null;

  const currentPoint = points?.find((p) => p.displayDate === label);
  const fullDate = currentPoint ? formatFullIndonesianDate(currentPoint.date, isMonthly) : label;

  return (
    <div className="bg-slate-900 text-white rounded-md px-3.5 py-2.5 shadow-lg border border-slate-700 text-xs min-w-[200px]">
      <div className="font-semibold text-slate-100 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between gap-3">
        <span>{fullDate}</span>
        <span className="text-[10px] text-slate-400 font-normal">
          {isMonthly ? "Bulanan" : "Harian"}
        </span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-xs inline-block"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300 text-[11px] capitalize">{entry.name}:</span>
            </div>
            <span className="font-semibold tabular-nums text-white text-xs">
              {entry.value.toLocaleString("id-ID")} Laporan
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const InteractiveTrendChart = ({
  role = "admin",
  scope = "all",
  departmentId = null,
  title = "Tren Pengaduan & Penyelesaian",
  subtitle = "Grafik linier dinamis volume pengaduan masuk berbanding penyelesaian operasional.",
}) => {
  const [period, setPeriod] = useState("30d"); // '7d', '30d', '90d', '12m'
  const [curveType, setCurveType] = useState("linear"); // 'linear' (presisi linier formal) vs 'monotone' (halus)
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
    terlambat: role !== "warga",
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
      setError("Gagal memuat data tren statistik.");
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

  // Determine smart X-axis tick interval to prevent label collision
  const tickInterval = useMemo(() => {
    if (period === "7d") return 0; // Show all 7 days
    if (period === "30d") return 4; // Show every 5th day (~6-7 ticks)
    if (period === "90d") return 14; // Show every 15th day (~6 ticks)
    if (period === "12m") return 0; // Show 12 months
    return 2;
  }, [period]);

  // Calculate resolution rate
  const resolutionRate =
    summary && summary.totalMasuk > 0
      ? Math.round((summary.totalSelesai / summary.totalMasuk) * 100)
      : summary?.totalSelesai > 0
      ? 100
      : 0;

  return (
    <div className="civic-card p-4 sm:p-6 space-y-5 animate-civic-in text-left">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            {isOfficer && (
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                Tugas Ditugaskan
              </span>
            )}
            {isCitizen && (
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                Aduan Saya
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Action Controls: Period Selector & Toggle curve */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Buttons */}
          <div
            className="inline-flex bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-medium"
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
                className={`px-2.5 py-1 rounded transition-colors text-xs ${
                  period === p.id
                    ? "bg-white text-slate-900 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
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
                prev === "linear" ? "monotone" : "linear"
              )
            }
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            title={
              curveType === "linear"
                ? "Beralih ke kurva interpolasi halus"
                : "Beralih ke garis lurus presisi diskret"
            }
          >
            <span>{curveType === "linear" ? "Garis Presisi" : "Kurva Halus"}</span>
          </button>

          {/* Accessible Table Toggle */}
          <button
            onClick={() => setShowTable((prev) => !prev)}
            className={`p-1.5 rounded-md border transition-colors ${
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
            className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Muat ulang data grafik"
            aria-label="Muat ulang data grafik"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-slate-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* KPI Metric Summary - Clean Numbers with Context & Denominators */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-md p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-slate-700" />
              <span>Laporan Masuk</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {summary.totalMasuk}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Periode {period === "12m" ? "12 Bulan" : `${period.replace("d", " Hari Terakhir")}`}
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-md p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Laporan Tuntas</span>
            </div>
            <div className="text-2xl font-bold text-emerald-800 mt-1 tabular-nums">
              {summary.totalSelesai}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Rasio Penanganan: {resolutionRate}%
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-md p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Dalam Penanganan</span>
            </div>
            <div className="text-2xl font-bold text-amber-800 mt-1 tabular-nums">
              {summary.currentProses}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Aduan aktif di lapangan
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-md p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
              <span>Melewati SLA</span>
            </div>
            <div className="text-2xl font-bold text-rose-800 mt-1 tabular-nums">
              {points.reduce((acc, p) => Math.max(acc, p.terlambat || 0), 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Perlu percepatan tindakan
            </div>
          </div>
        </div>
      )}

      {/* Series Toggle Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 px-3 py-2 rounded-md border border-slate-200/70">
        <span className="text-slate-500 text-[11px] font-medium">
          Klik label untuk sembunyikan/tampilkan seri:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => toggleSeries("masuk")}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium transition-colors ${
              visibleSeries.masuk
                ? "bg-white border-slate-300 text-slate-900 shadow-2xs"
                : "bg-slate-100 border-transparent text-slate-400 line-through"
            }`}
          >
            <span className="w-2.5 h-0.5 bg-slate-900 inline-block" />
            <span>Masuk</span>
            {visibleSeries.masuk ? (
              <Eye className="w-3 h-3 text-slate-500 ml-0.5" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => toggleSeries("selesai")}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium transition-colors ${
              visibleSeries.selesai
                ? "bg-white border-emerald-300 text-emerald-800 shadow-2xs"
                : "bg-slate-100 border-transparent text-slate-400 line-through"
            }`}
          >
            <span className="w-2.5 h-0.5 bg-emerald-700 inline-block" />
            <span>Selesai</span>
            {visibleSeries.selesai ? (
              <Eye className="w-3 h-3 text-emerald-700 ml-0.5" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => toggleSeries("proses")}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium transition-colors ${
              visibleSeries.proses
                ? "bg-white border-amber-300 text-amber-800 shadow-2xs"
                : "bg-slate-100 border-transparent text-slate-400 line-through"
            }`}
          >
            <span className="w-2.5 h-0.5 bg-amber-600 inline-block" />
            <span>Dalam Proses</span>
            {visibleSeries.proses ? (
              <Eye className="w-3 h-3 text-amber-700 ml-0.5" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>

          {role !== "warga" && (
            <button
              onClick={() => toggleSeries("terlambat")}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium transition-colors ${
                visibleSeries.terlambat
                  ? "bg-white border-rose-300 text-rose-800 shadow-2xs"
                  : "bg-slate-100 border-transparent text-slate-400 line-through"
              }`}
            >
              <span className="w-2.5 h-0.5 border-b border-dashed border-rose-700 inline-block" />
              <span>Terlambat (SLA)</span>
              {visibleSeries.terlambat ? (
                <Eye className="w-3 h-3 text-rose-700 ml-0.5" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Chart Canvas / States */}
      {loading ? (
        <div className="h-72 sm:h-80 flex flex-col items-center justify-center bg-slate-50/50 rounded-md border border-slate-200">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-600 mb-2" />
          <p className="text-xs text-slate-500">
            Mengolah kurva statistik dari server...
          </p>
        </div>
      ) : error ? (
        <div className="h-72 sm:h-80 flex flex-col items-center justify-center bg-rose-50/50 rounded-md border border-rose-200 p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-rose-600 mb-2" />
          <p className="text-xs text-rose-800 font-medium mb-3">{error}</p>
          <button
            onClick={loadTrendData}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium shadow-2xs hover:bg-rose-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : points.length === 0 ? (
        <div className="h-72 sm:h-80 flex flex-col items-center justify-center bg-slate-50/50 rounded-md border border-slate-200 p-6 text-center">
          <Calendar className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-xs font-semibold text-slate-700">
            Tidak ada aktivitas pengaduan pada rentang waktu ini
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
            Data akan otomatis tergambar begitu terdapat laporan baru yang masuk atau ditindaklanjuti.
          </p>
        </div>
      ) : (
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                interval={tickInterval}
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
                  <CivicChartTooltip
                    points={points}
                    isMonthly={period === "12m"}
                  />
                }
              />

              {visibleSeries.masuk && (
                <Line
                  type={curveType}
                  dataKey="masuk"
                  name="Masuk"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={
                    period === "7d"
                      ? { r: 2.5, strokeWidth: 1.5, fill: "#fff" }
                      : false
                  }
                  activeDot={{ r: 4.5, stroke: "#0f172a", strokeWidth: 2, fill: "#fff" }}
                />
              )}

              {visibleSeries.selesai && (
                <Line
                  type={curveType}
                  dataKey="selesai"
                  name="Selesai"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={
                    period === "7d"
                      ? { r: 2.5, strokeWidth: 1.5, fill: "#fff" }
                      : false
                  }
                  activeDot={{ r: 4.5, stroke: "#059669", strokeWidth: 2, fill: "#fff" }}
                />
              )}

              {visibleSeries.proses && (
                <Line
                  type={curveType}
                  dataKey="proses"
                  name="Dalam Proses"
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={
                    period === "7d"
                      ? { r: 2.5, strokeWidth: 1.5, fill: "#fff" }
                      : false
                  }
                  activeDot={{ r: 4.5, stroke: "#d97706", strokeWidth: 2, fill: "#fff" }}
                />
              )}

              {role !== "warga" && visibleSeries.terlambat && (
                <Line
                  type={curveType}
                  dataKey="terlambat"
                  name="Lewat SLA"
                  stroke="#e11d48"
                  strokeWidth={1.75}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4.5, stroke: "#e11d48", strokeWidth: 2, fill: "#fff" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Accessible Tabular Fallback View */}
      {showTable && points.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800">
              Data Tabel Linimasa Statistik ({period === "12m" ? "12 Bulan" : `${period.replace("d", " Hari")}`})
            </h4>
            <span className="text-[11px] text-slate-500">
              Alternatif aksesibilitas pembaca layar (WCAG 2.1 AA)
            </span>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Tanggal / Periode</th>
                  <th className="py-2 px-3 text-right">Laporan Masuk</th>
                  <th className="py-2 px-3 text-right">Laporan Selesai</th>
                  <th className="py-2 px-3 text-right">Dalam Proses</th>
                  {role !== "warga" && (
                    <th className="py-2 px-3 text-right text-rose-700">Terlambat SLA</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {points.map((pt, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-1.5 px-3 font-medium text-slate-800">
                      {formatFullIndonesianDate(pt.date, period === "12m")}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums text-slate-900 font-semibold">
                      {pt.masuk}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums text-emerald-700 font-semibold">
                      {pt.selesai}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums text-amber-700 font-semibold">
                      {pt.proses}
                    </td>
                    {role !== "warga" && (
                      <td className="py-1.5 px-3 text-right tabular-nums text-rose-700 font-semibold">
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
    </div>
  );
};

export default InteractiveTrendChart;
