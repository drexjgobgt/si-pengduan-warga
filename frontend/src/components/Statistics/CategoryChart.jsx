import React from "react";
import * as LucideIcons from "lucide-react";
import { CATEGORY_ICONS } from "../../utils/constants";

export const CategoryChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxTotal = Math.max(
    ...data.map((cat) => parseInt(cat.total_complaints))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        Pengaduan per Kategori
      </h3>
      <div className="space-y-3">
        {data.map((cat) => {
          const Icon =
            LucideIcons[CATEGORY_ICONS[cat.category]] ||
            LucideIcons.AlertCircle;
          const total = parseInt(cat.total_complaints);
          const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

          return (
            <div key={cat.category} className="border-b pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium capitalize">
                    {cat.category.replace("_", " ")}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {total} pengaduan
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Pending: {cat.pending}</span>
                <span>Diproses: {cat.diproses}</span>
                <span>Selesai: {cat.selesai}</span>
                <span>Ditolak: {cat.ditolak}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
