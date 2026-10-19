import React from "react";
import { FileText, CheckCircle2, Target, Clock } from "lucide-react";

export const StatsDashboard = ({ stats }) => {
  if (!stats) return null;

  const total = stats.total || 0;
  const resolvedCount =
    stats.sla?.total_resolved ||
    stats.byStatus?.find((s) => s.status === "selesai")?.count ||
    0;
  const activeCount =
    stats.sla?.active_count ||
    stats.byStatus
      ?.filter((s) => ["pending", "diproses"].includes(s.status))
      .reduce((acc, s) => acc + parseInt(s.count, 10), 0) ||
    0;
  const onTimeCount = stats.sla?.on_time_count || 0;

  const cards = [
    {
      label: "Total Laporan Warga",
      value: total.toLocaleString("id-ID"),
      unit: "aduan",
      helper: `${stats.recentCount || 0} aduan masuk dalam 7 hari terakhir`,
      icon: FileText,
      valueColor: "text-slate-900",
    },
    {
      label: "Laporan Terselesaikan",
      value: parseInt(resolvedCount, 10).toLocaleString("id-ID"),
      unit: "tuntas",
      helper:
        onTimeCount > 0
          ? `${onTimeCount} dari ${resolvedCount} diselesaikan tepat waktu`
          : "Laporan tuntas ditindaklanjuti",
      icon: CheckCircle2,
      valueColor: "text-emerald-800",
    },
    {
      label: "Sedang Ditangani",
      value: parseInt(activeCount, 10).toLocaleString("id-ID"),
      unit: "antrean aktif",
      helper: stats.sla?.overdue_count
        ? `${stats.sla.overdue_count} laporan melewati target waktu`
        : "Proses investigasi & tindak lanjut",
      icon: Clock,
      valueColor: "text-amber-800",
    },
    {
      label: "Akurasi Klasifikasi AI",
      value: `${stats.accuracy?.accuracy_percentage || stats.averageConfidence || 0}%`,
      unit: "akurasi",
      helper: `${stats.accuracy?.correct || 0} dari ${
        stats.accuracy?.total || total
      } otomatis terpetakan ke OPD`,
      icon: Target,
      valueColor: "text-slate-900",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="civic-card p-4 sm:p-5 flex flex-col justify-between bg-white border border-slate-200/90 hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span>{card.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span
                  className={`text-2xl sm:text-3xl font-bold tabular-nums ${card.valueColor}`}
                >
                  {card.value}
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  {card.unit}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
              {card.helper}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsDashboard;
