import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  Clock,
  Building2,
  AlertOctagon,
  Award,
  Zap,
} from "lucide-react";
import { statisticsAPI } from "../../services/api";

export const PerformanceMetricsChart = ({ departmentId = null }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError("Gagal memuat data kinerja.");
      } finally {
        setLoading(false);
      }
    };

    fetchPerf();
  }, [departmentId]);

  if (loading) {
    return (
      <div className="civic-card p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-4 h-4 animate-spin text-sky-600" />
          <span>Memuat data kinerja operasional...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { resolutionSpeed, onTimeStats, departments = [] } = data;

  // Colors for department bars
  const deptColors = ["#0284c7", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];

  return (
    <div className="space-y-6">
      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Speed */}
        <div className="civic-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-Rata Waktu Selesai
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {resolutionSpeed.avgHours > 0 ? `${resolutionSpeed.avgHours} jam` : "-"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Berdasarkan {resolutionSpeed.sampleCount} laporan terselesaikan
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* On-Time Rate */}
        <div className="civic-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kepatuhan Target SLA
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
              {onTimeStats.onTimePct}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {onTimeStats.onTimeCount} dari {onTimeStats.totalResolved} tepat waktu
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue Count */}
        <div className="civic-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Penyelesaian Terlambat
            </div>
            <div className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">
              {onTimeStats.lateCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Laporan selesai di luar batas waktu
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Department Comparison Chart & Breakdown */}
      {departments.length > 0 && (
        <div className="civic-card p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                Perbandingan Beban & Kinerja Antar-OPD
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Jumlah laporan terkelola, tingkat penyelesaian tepat waktu, dan rata-rata durasi.
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departments.filter((d) => d.total > 0)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis
                  dataKey="code"
                  type="category"
                  stroke="#334155"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  width={60}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${value} Laporan`,
                    name === "resolved" ? "Terselesaikan" : "Total Laporan",
                  ]}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl border border-slate-700 text-xs min-w-[200px]">
                        <div className="font-bold text-slate-100 border-b border-slate-800 pb-1 mb-2">
                          {item.name} ({item.code})
                        </div>
                        <div className="space-y-1 text-slate-300">
                          <div className="flex justify-between">
                            <span>Total Laporan:</span>
                            <span className="font-bold text-white tabular-nums">{item.total}</span>
                          </div>
                          <div className="flex justify-between text-emerald-400">
                            <span>Selesai:</span>
                            <span className="font-bold tabular-nums">{item.resolved}</span>
                          </div>
                          <div className="flex justify-between text-amber-400">
                            <span>Dalam Proses:</span>
                            <span className="font-bold tabular-nums">{item.active}</span>
                          </div>
                          <div className="flex justify-between text-sky-300 pt-1 border-t border-slate-800">
                            <span>Kepatuhan SLA:</span>
                            <span className="font-bold tabular-nums">{item.onTimeRate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="total" name="Total Laporan" radius={[0, 4, 4, 0]}>
                  {departments.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={deptColors[index % deptColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Detail List */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2 text-left">Nama Instansi / OPD</th>
                  <th className="px-3 py-2 text-center">Kode</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Selesai</th>
                  <th className="px-3 py-2 text-right">Aktif</th>
                  <th className="px-3 py-2 text-right">Tepat Waktu (%)</th>
                  <th className="px-3 py-2 text-right">Rata-Rata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white tabular-nums">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {dept.name}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {dept.code}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">
                      {dept.total}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-700 font-medium">
                      {dept.resolved}
                    </td>
                    <td className="px-3 py-2 text-right text-amber-700 font-medium">
                      {dept.active}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                          dept.onTimeRate >= 80
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : dept.onTimeRate >= 50
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {dept.resolved > 0 ? `${dept.onTimeRate}%` : "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {dept.avgHours > 0 ? `${dept.avgHours} jam` : "-"}
                    </td>
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

export default PerformanceMetricsChart;
