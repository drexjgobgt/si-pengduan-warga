import React from "react";
import * as LucideIcons from "lucide-react";
import { CATEGORY_ICONS } from "../../utils/constants";

export const CategoryChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const totalAll = data.reduce(
    (sum, cat) => sum + parseInt(cat.total_complaints, 10),
    0
  );

  return (
    <div className="civic-card p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Distribusi per Kategori Masalah
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Komposisi aduan warga berdasarkan bidang pelayanan perkotaan
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
          {data.length} Kategori
        </span>
      </div>

      <div className="space-y-3.5">
        {data.map((cat) => {
          const Icon =
            LucideIcons[CATEGORY_ICONS[cat.category]] ||
            LucideIcons.AlertCircle;
          const count = parseInt(cat.total_complaints, 10);
          const pct = totalAll > 0 ? ((count / totalAll) * 100).toFixed(1) : 0;

          return (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-800 capitalize">
                    {cat.category.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] tabular-nums">
                    {pct}%
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {count} Laporan
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                <div
                  className="bg-sky-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Sub-status badges */}
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pt-0.5">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Diproses: {cat.diproses || 0}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Selesai: {cat.selesai || 0}
                </span>
                {parseInt(cat.ditolak, 10) > 0 && (
                  <span className="inline-flex items-center gap-1 text-rose-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Ditolak: {cat.ditolak}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChart;
