import React from "react";
import { Filter, Search, RotateCcw } from "lucide-react";

export const ComplaintFilters = ({ filters, onFilterChange }) => {
  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.category || filters.priority || filters.sla_status
  );

  const resetFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Filter & Pencarian Laporan
          </h3>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul, lokasi..."
            value={filters.search || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || ""}
          onChange={(e) =>
            onFilterChange({ ...filters, status: e.target.value })
          }
          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="diproses">Diproses</option>
          <option value="selesai">Selesai</option>
          <option value="ditolak">Ditolak</option>
        </select>

        {/* SLA Urgency Filter */}
        <select
          value={filters.sla_status || ""}
          onChange={(e) =>
            onFilterChange({ ...filters, sla_status: e.target.value })
          }
          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700"
        >
          <option value="">Semua SLA</option>
          <option value="aman">SLA Aman</option>
          <option value="mendekati_tenggat">Mendekati Batas (&lt; 12 jam)</option>
          <option value="terlambat">Lewat Batas SLA</option>
          <option value="selesai_tepat_waktu">Selesai Tepat Waktu</option>
          <option value="selesai_terlambat">Selesai Terlambat</option>
        </select>

        {/* Category Filter */}
        <select
          value={filters.category || ""}
          onChange={(e) =>
            onFilterChange({ ...filters, category: e.target.value })
          }
          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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

        {/* Priority Filter */}
        <select
          value={filters.priority || ""}
          onChange={(e) =>
            onFilterChange({ ...filters, priority: e.target.value })
          }
          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="">Semua Prioritas</option>
          <option value="rendah">Rendah (SLA 120j)</option>
          <option value="normal">Normal (SLA 72j)</option>
          <option value="tinggi">Tinggi (SLA 48j)</option>
          <option value="darurat">Darurat (SLA 24j)</option>
        </select>
      </div>
    </div>
  );
};

export default ComplaintFilters;
