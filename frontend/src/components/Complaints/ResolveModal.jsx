import React, { useState } from "react";
import { CheckCircle2, Image as ImageIcon, FileText, AlertCircle } from "lucide-react";
import { complaintAPI } from "../../services/api";

export const ResolveModal = ({ isOpen, onClose, complaint, onSuccess }) => {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !complaint) return null;

  const isLate =
    complaint.sla_deadline_at && new Date() > new Date(complaint.sla_deadline_at);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setError("Catatan tindakan penyelesaian wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await complaintAPI.resolve(complaint.id, {
        resolution_notes: resolutionNotes.trim(),
        resolution_proof_url: proofUrl.trim() || null,
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Resolve error:", err);
      setError(err.response?.data?.error || "Gagal menyelesaikan pengaduan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-semibold text-base text-slate-900">
              Selesaikan Laporan Pengaduan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* SLA Evaluation Notice */}
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              isLate
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                Status SLA: {isLate ? "Penyelesaian Terlambat" : "Penyelesaian Tepat Waktu"}
              </div>
              <p className="mt-0.5 opacity-90">
                {isLate
                  ? "Laporan ini diselesaikan melewati batas waktu target operasional (SLA)."
                  : "Laporan diselesaikan dalam batas target operasional (SLA). Kepatuhan akan dicatat dalam statistik."}
              </p>
            </div>
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Catatan Tindakan / Deskripsi Hasil Pekerjaan <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Jelaskan tindakan yang telah dilakukan (contoh: Petugas telah membersihkan tumpukan sampah dan mengangkut ke TPA pada pk. 14:00 WIB)."
              rows={4}
              required
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
              disabled={submitting}
            />
          </div>

          {/* Proof Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              URL Bukti Foto Tindakan (Disarankan)
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://... (Foto hasil perbaikan atau berita acara)"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
              disabled={submitting}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !resolutionNotes.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? "Menyelesaikan..." : "Tandai Selesai"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolveModal;
