import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Clock,
  Building2,
  ArrowUpDown,
} from "lucide-react";
import { statisticsAPI } from "../../services/api";

export const PerformanceMetricsChart = ({ departmentId = null }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("total"); // 'total', 'onTimeRate', 'avgHours'

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        setLoading(true);
        const res = await statisticsAPI.getPerformance(
          departmentId ? { department_id: departmentId } : {}
        );
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load performance metrics:", err);
        setError("Gagal memuat data kinerja operasional.");
      } finally {
        setLoading(false);
      }
    };

    fetchPerf();
  }, [departmentId]);

  // Sort departments based on active selection
  const sortedDepartments = useMemo(() => {
    if (!data?.departments) return [];
    const list = [...data.departments].filter((d) => d.total > 0);

    if (sortBy === "onTimeRate") {
      return list.sort((a, b) => b.onTimeRate - a.onTimeRate);
    }
    if (sortBy === "avgHours") {
      return list.sort((a, b) => (a.avgHours || 999) - (b.avgHours || 999));
    }
    return list.sort((a, b) => b.total - a.total);
  }, [data?.departments, sortBy]);

  if (loading) {
    return (
      <div className="civic-card p-6 flex items-center justify-center min-h-[260px]">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-4 h-4 animate-spin text-slate-600" />
          <span>Memuat data kinerja operasional...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { resolutionSpeed, onTimeStats } = data;

  return (
    <div className="space-y-6 text-left">
      {/* KPI Cards: Quiet, Data-Dense, Clear Denominators (Taste Skill) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Speed Card */}
        <div className="civic-card p-4 sm:p-5 border border-slate-200/90 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Rata-Rata Durasi Penyelesaian
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Batas SLA</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tabular-nums">
            {resolutionSpeed.avgHours > 0 ? `${resolutionSpeed.avgHours} Jam` : "-"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Dihitung dari {resolutionSpeed.sampleCount} laporan terselesaikan (Min: {resolutionSpeed.minHours}j, Max: {resolutionSpeed.maxHours}j)
          </div>
        </div>

        {/* SLA On-Time Rate Card */}
        <div className="civic-card p-4 sm:p-5 border border-slate-200/90 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Kepatuhan Waktu SLA
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              Tepat Waktu
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-800 mt-2 tabular-nums">
            {onTimeStats.onTimePct}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {onTimeStats.onTimeCount} dari {onTimeStats.totalResolved} laporan selesai sebelum tenggat
          </div>
        </div>

        {/* Overdue Count Card */}
        <div className="civic-card p-4 sm:p-5 border border-slate-200/90 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Penyelesaian Terlambat
            </span>
            <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
              Evaluasi
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tabular-nums">
            {onTimeStats.lateCount} <span className="text-sm font-normal text-slate-500">laporan</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Laporan yang diselesaikan melewati batas waktu SLA
          </div>
        </div>
      </div>

      {/* Department Comparison Horizontal Bar Chart */}
      {sortedDepartments.length > 0 && (
        <div className="civic-card p-4 sm:p-6 space-y-4 border border-slate-200/90 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-600" />
                <span>Perbandingan Beban & Kinerja Antar-OPD</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi komparatif volume pengaduan dan tingkat tuntas per dinas terkait.
              </p>
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="total">Beban Laporan Terbanyak</option>
                <option value="onTimeRate">Tingkat Kepatuhan SLA (%)</option>
                <option value="avgHours">Kecepatan Durasi (Jam)</option>
              </select>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedDepartments}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  dataKey="code"
                  type="category"
                  stroke="#334155"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  width={70}
                />
                <Tooltip
                  cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white rounded-md px-3.5 py-2.5 shadow-lg border border-slate-700 text-xs min-w-[220px]">
                        <div className="font-bold text-slate-100 border-b border-slate-800 pb-1 mb-2">
                          {item.name} ({item.code})
                        </div>
                        <div className="space-y-1 text-slate-300">
                          <div className="flex justify-between">
                            <span>Total Laporan:</span>
                            <span className="font-bold text-white tabular-nums">
                              {item.total} Aduan
                            </span>
                          </div>
                          <div className="flex justify-between text-emerald-400">
                            <span>Terselesaikan:</span>
                            <span className="font-bold tabular-nums">
                              {item.resolved} Aduan
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Kepatuhan SLA:</span>
                            <span className="font-bold text-white tabular-nums">
                              {item.onTimeRate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rata-Rata Durasi:</span>
                            <span className="font-bold text-white tabular-nums">
                              {item.avgHours > 0 ? `${item.avgHours} Jam` : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                {/* Single unified civic color for professional public service dashboard */}
                <Bar
                  dataKey="total"
                  name="Total Laporan"
                  fill="#0369a1"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="resolved"
                  name="Terselesaikan"
                  fill="#059669"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-end gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#0369a1] inline-block" />
              <span>Total Beban Laporan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#059669] inline-block" />
              <span>Laporan Tuntas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetricsChart;
