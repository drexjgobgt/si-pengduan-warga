import React from "react";
import { FileText, CheckCircle2, Target, Clock } from "lucide-react";

export const StatsDashboard = ({ stats }) => {
  if (!stats) return null;

  const total = stats.total || 0;
  const resolvedCount = stats.sla?.total_resolved || stats.byStatus?.find(s => s.status === 'selesai')?.count || 0;
  const activeCount = stats.sla?.active_count || stats.byStatus?.filter(s => ['pending', 'diproses'].includes(s.status)).reduce((acc, s) => acc + parseInt(s.count), 0) || 0;
  const onTimeCount = stats.sla?.on_time_count || 0;

  const cards = [
    {
      label: "Total Laporan Warga",
      value: total.toLocaleString("id-ID"),
      helper: `${stats.recentCount || 0} laporan dalam 7 hari terakhir`,
      icon: FileText,
      accent: "text-sky-600 bg-sky-50 border-sky-200",
    },
    {
      label: "Terselesaikan",
      value: parseInt(resolvedCount, 10).toLocaleString("id-ID"),
      helper: onTimeCount > 0 ? `${onTimeCount} tuntas tepat waktu` : "Laporan tuntas ditangani",
      icon: CheckCircle2,
      accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Sedang Ditangani",
      value: parseInt(activeCount, 10).toLocaleString("id-ID"),
      helper: stats.sla?.overdue_count ? `${stats.sla.overdue_count} melewati target waktu` : "Antrean proses aktif",
      icon: Clock,
      accent: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      label: "Akurasi Klasifikasi AI",
      value: `${stats.accuracy?.accuracy_percentage || stats.averageConfidence || 0}%`,
      helper: `${stats.accuracy?.correct || 0} dari ${stats.accuracy?.total || total} otomatis terpetakan`,
      icon: Target,
      accent: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="civic-card p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
                  {card.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${card.accent}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
              {card.helper}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsDashboard;
