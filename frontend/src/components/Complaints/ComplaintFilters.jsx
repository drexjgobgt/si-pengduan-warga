import React from "react";
import { Filter, Search } from "lucide-react";

export const ComplaintFilters = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-800">Filter Pengaduan</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pengaduan..."
            value={filters.search || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filters.status || ""}
          onChange={(e) =>
            onFilterChange({ ...filters, status: e.target.value })
          }
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="diproses">Diproses</option>
          <option value="selesai">Selesai</option>
          <option value="ditolak">Ditolak</option>
        </select>

        <select
          value={filters.category || ""}
          onChange={(e) =>
            onFilterChange({ ...filters, category: e.target.value })
          }
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <select
          value={filters.priority || ""}
          onChange={(e) =>
            onFilterChange({ ...filters, priority: e.target.value })
          }
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Semua Prioritas</option>
          <option value="rendah">Rendah</option>
          <option value="normal">Normal</option>
          <option value="tinggi">Tinggi</option>
          <option value="darurat">Darurat</option>
        </select>
      </div>
    </div>
  );
};
