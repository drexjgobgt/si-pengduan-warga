import React, { useState } from "react";
import { Button } from "../Common/Button";
import { Save } from "lucide-react";

export const StatusUpdate = ({ currentStatus, onUpdate, loading }) => {
  const [status, setStatus] = useState(currentStatus);
  const [response, setResponse] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ status, response_text: response });
  };

  const statusOptions = [
    { value: "pending", label: "Pending", color: "bg-amber-50 text-amber-800 border-amber-300" },
    { value: "diproses", label: "Diproses", color: "bg-sky-50 text-sky-800 border-sky-300" },
    { value: "selesai", label: "Selesai", color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
    { value: "ditolak", label: "Ditolak", color: "bg-rose-50 text-rose-800 border-rose-300" },
  ];

  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4 text-xs">
      <h3 className="font-semibold text-slate-800 mb-3 uppercase tracking-wider text-[11px]">
        Ubah Status Laporan (Petugas / Admin)
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block font-medium text-slate-700 mb-1.5">Pilih Status Baru</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`px-3 py-1.5 rounded-md font-medium text-xs border transition-all ${
                  status === option.value
                    ? `${option.color} ring-2 ring-indigo-500/30 font-semibold shadow-sm`
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">
            Catatan Perubahan Status <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Berikan alasan perubahan status untuk catatan pelapor..."
            rows="2"
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-xs"
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          icon={Save}
          disabled={loading || (status === currentStatus && !response)}
          className="w-full text-xs py-2"
        >
          {loading ? "Menyimpan..." : "Simpan Pembaruan Status"}
        </Button>
      </form>
    </div>
  );
};

export default StatusUpdate;
