
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
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    { value: "diproses", label: "Diproses", color: "bg-blue-100 text-blue-800" },
    { value: "selesai", label: "Selesai", color: "bg-green-100 text-green-800" },
    { value: "ditolak", label: "Ditolak", color: "bg-red-100 text-red-800" },
  ];

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
      <h3 className="font-semibold text-gray-800 mb-3">Update Status Laporan</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  status === option.value
                    ? `${option.color} ring-2 ring-offset-1 ring-blue-500`
                    : "bg-white text-gray-600 border hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggapan / Catatan
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Berikan tanggapan atau alasan perubahan status..."
            rows="3"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent glass-input"
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          icon={Save}
          disabled={loading || (status === currentStatus && !response)}
          className="w-full"
        >
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </form>
    </div>
  );
};
