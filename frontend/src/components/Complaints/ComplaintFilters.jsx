import React from "react";
import { Filter, Search, RotateCcw } from "lucide-react";

export const ComplaintFilters = ({ filters, onFilterChange }) => {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.category ||
      filters.priority ||
      filters.sla_status
  );

  const resetFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-700 tracking-normal">
            Filter & Pencarian Laporan
          </h3>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input - takes 4 cols on desktop */}
        <div className="relative sm:col-span-2 lg:col-span-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata kunci, judul, lokasi..."
            value={filters.search || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="w-full pl-9 pr-3 h-9.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter - takes 2 cols on desktop */}
        <div className="lg:col-span-2">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value })
            }
            className="w-full px-2.5 h-9.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>

        {/* SLA Urgency Filter - takes 2 cols on desktop */}
        <div className="lg:col-span-2">
          <select
            value={filters.sla_status || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, sla_status: e.target.value })
            }
            className="w-full px-2.5 h-9.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white text-slate-700"
          >
            <option value="">Semua SLA</option>
            <option value="aman">SLA Aman</option>
            <option value="mendekati_tenggat">Mendekati Batas (&lt; 12 jam)</option>
            <option value="terlambat">Lewat Batas SLA</option>
            <option value="selesai_tepat_waktu">Selesai Tepat Waktu</option>
            <option value="selesai_terlambat">Selesai Terlambat</option>
          </select>
        </div>

        {/* Category Filter - takes 2 cols on desktop */}
        <div className="lg:col-span-2">
          <select
            value={filters.category || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, category: e.target.value })
            }
            className="w-full px-2.5 h-9.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white text-slate-700"
          >
            <option value="">Semua Kategori</option>
            <option value="sampah">Sampah</option>
            <option value="jalan_rusak">Jalan Rusak</option>
            <option value="banjir">Banjir</option>
            <option value="listrik">Listrik</option>
            <option value="air_bersih">Air Bersih</option>
            <option value="keamanan">Keamanan</option>
            <option value="kesehatan">Kesehatan</option>
            <option value="pendidikan">Pendidikan</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>

        {/* Priority Filter - takes 2 cols on desktop */}
        <div className="lg:col-span-2">
          <select
            value={filters.priority || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, priority: e.target.value })
            }
            className="w-full px-2.5 h-9.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white text-slate-700"
          >
            <option value="">Semua Prioritas</option>
            <option value="rendah">Rendah (120j)</option>
            <option value="normal">Normal (72j)</option>
            <option value="tinggi">Tinggi (48j)</option>
            <option value="darurat">Darurat (24j)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ComplaintFilters;
