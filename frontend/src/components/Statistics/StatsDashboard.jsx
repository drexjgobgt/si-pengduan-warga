import React from "react";
import { FileText, TrendingUp, Target, Activity } from "lucide-react";

export const StatsDashboard = ({ stats }) => {
  if (!stats) return null;

  const cards = [
    {
      label: "Total Pengaduan",
      value: stats.total || 0,
      icon: FileText,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      label: "Rata-rata Akurasi AI",
      value: `${stats.averageConfidence || 0}%`,
      icon: Target,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      label: "Pengaduan 7 Hari Terakhir",
      value: stats.recentCount || 0,
      icon: TrendingUp,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    },
    {
      label: "Akurasi Klasifikasi",
      value: `${stats.accuracy?.accuracy_percentage || 0}%`,
      icon: Activity,
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{card.label}</p>
                <p className={`text-3xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
              <div
                className={`${card.bgColor} ${card.textColor} w-12 h-12 rounded-lg flex items-center justify-center`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
