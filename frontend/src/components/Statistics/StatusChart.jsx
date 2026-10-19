import React from "react";
import { STATUS_CONFIG } from "../../utils/constants";
import * as LucideIcons from "lucide-react";

export const StatusChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + parseInt(item.count, 10), 0);

  const statusColorMap = {
    pending: {
      bg: "bg-slate-50 border-slate-200",
      bar: "bg-slate-400",
      text: "text-slate-800",
      iconColor: "text-slate-500",
    },
    diproses: {
      bg: "bg-amber-50/60 border-amber-200",
      bar: "bg-amber-500",
      text: "text-amber-900",
      iconColor: "text-amber-600",
    },
    selesai: {
      bg: "bg-emerald-50/60 border-emerald-200",
      bar: "bg-emerald-500",
      text: "text-emerald-900",
      iconColor: "text-emerald-600",
    },
    ditolak: {
      bg: "bg-rose-50/60 border-rose-200",
      bar: "bg-rose-500",
      text: "text-rose-900",
      iconColor: "text-rose-600",
    },
  };

  return (
    <div className="civic-card p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Distribusi Status Penanganan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tahapan penanganan saat ini di seluruh instansi pelayanan
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
          Total: {total}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.map((item) => {
          const config = STATUS_CONFIG[item.status];
          const Icon = LucideIcons[config?.icon] || LucideIcons.Clock;
          const styling = statusColorMap[item.status] || statusColorMap.pending;
          const count = parseInt(item.count, 10);
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

          return (
            <div
              key={item.status}
              className={`p-3.5 rounded-lg border flex flex-col justify-between ${styling.bg}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${styling.iconColor}`} />
                  <span className="text-xs font-semibold capitalize text-slate-800">
                    {config?.label || item.status}
                  </span>
                </div>
                <span className="text-xs font-bold tabular-nums text-slate-900">
                  {count}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Porsi dari total:</span>
                  <span className="font-semibold text-slate-700">{percentage}%</span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${styling.bar} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusChart;
