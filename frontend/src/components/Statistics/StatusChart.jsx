import React from "react";
import { STATUS_CONFIG } from "../../utils/constants";
import * as LucideIcons from "lucide-react";

export const StatusChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + parseInt(item.count), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        Distribusi Status
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {data.map((item) => {
          const config = STATUS_CONFIG[item.status];
          const Icon = LucideIcons[config?.icon] || LucideIcons.Clock;
          const percentage =
            total > 0 ? ((parseInt(item.count) / total) * 100).toFixed(1) : 0;

          return (
            <div key={item.status} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="font-medium">
                  {config?.label || item.status}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{item.count}</p>
              <p className="text-sm text-gray-500">{percentage}% dari total</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

