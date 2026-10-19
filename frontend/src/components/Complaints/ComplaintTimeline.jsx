import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  UserCheck,
  ArrowRightLeft,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  Clock,
  Send,
  Lock,
  Globe,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { complaintAPI } from "../../services/api";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";

export const ComplaintTimeline = ({ complaintId, isAnonymous = false }) => {
  const { user, isAuthenticated } = useAuth();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for adding progress note
  const [noteText, setNoteText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isStaff = isAuthenticated && ["admin", "supervisor", "petugas"].includes(user?.role);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await complaintAPI.getTimeline(complaintId);
      setTimeline(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
      setError("Gagal memuat rekam jejak timeline.");
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    if (complaintId) {
      fetchTimeline();
    }
  }, [complaintId, fetchTimeline]);

  const handleAddProgress = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setSubmitting(true);
      await complaintAPI.addProgressNote(complaintId, {
        note: noteText.trim(),
        is_internal: isStaff ? isInternal : false,
        proof_url: proofUrl.trim() || null,
      });

      setNoteText("");
      setProofUrl("");
      setIsInternal(false);
      fetchTimeline();
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menambahkan catatan progres");
    } finally {
      setSubmitting(false);
    }
  };

  const getActionConfig = (actionType, status) => {
    switch (actionType) {
      case "created":
        return {
          label: "Laporan Diajukan",
          icon: FileText,
          iconBg: "bg-blue-50 text-blue-600 border-blue-200",
        };
      case "assigned":
        return {
          label: "Penugasan Petugas",
          icon: UserCheck,
          iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
        };
      case "transferred":
        return {
          label: "Disposisi / Pengalihan",
          icon: ArrowRightLeft,
          iconBg: "bg-purple-50 text-purple-600 border-purple-200",
        };
      case "progress_note":
        return {
          label: "Catatan Perkembangan",
          icon: MessageSquare,
          iconBg: "bg-sky-50 text-sky-600 border-sky-200",
        };
      case "resolved":
        return {
          label: "Laporan Selesai",
          icon: CheckCircle2,
          iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
        };
      case "reopened":
        return {
          label: "Laporan Dibuka Kembali",
          icon: RotateCcw,
          iconBg: "bg-amber-50 text-amber-600 border-amber-200",
        };
      default:
        return {
          label: status ? `Status: ${status}` : "Pembaruan",
          icon: Clock,
          iconBg: "bg-slate-100 text-slate-600 border-slate-200",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and counter */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-800">
            Kronologi Penanganan ({timeline.length})
          </h4>
        </div>
        {isAnonymous && (
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Pelapor Anonim Dilindungi
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-8 text-center text-slate-500 text-sm">
          Memuat riwayat penanganan...
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && timeline.length === 0 && (
        <div className="py-6 text-center text-slate-400 text-xs italic">
          Belum ada rekam jejak untuk laporan ini.
        </div>
      )}

      {/* Chronological Vertical Timeline */}
      {!loading && timeline.length > 0 && (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timeline.map((item, idx) => {
            const config = getActionConfig(item.action_type, item.status);
            const Icon = config.icon;

            return (
              <div key={item.id || idx} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 top-0 w-5 h-5 rounded-full border flex items-center justify-center bg-white ${config.iconBg} shadow-sm z-10`}
                >
                  <Icon className="w-3 h-3" />
                </div>

                {/* Timeline Content Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-sm hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-900">
                        {config.label}
                      </span>

                      {item.is_internal ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          <Lock className="w-2.5 h-2.5" /> Internal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                          <Globe className="w-2.5 h-2.5" /> Publik
                        </span>
                      )}

                      {item.actor_name && (
                        <span className="text-slate-500 font-medium">
                          oleh <span className="text-slate-700">{item.actor_name}</span>
                          {item.actor_role && item.actor_role !== "warga" && (
                            <span className="ml-1 text-[10px] text-indigo-600 capitalize">
                              ({item.actor_role})
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <time className="text-[11px] text-slate-400 font-mono">
                      {formatDate(item.created_at)}
                    </time>
                  </div>

                  {/* Note / Description */}
                  {item.note && (
                    <p className="text-slate-700 leading-relaxed mt-1 whitespace-pre-wrap">
                      {item.note}
                    </p>
                  )}

                  {/* Attached Proof Image (if any) */}
                  {item.proof_url && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <a
                        href={item.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium group/link"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Lihat Bukti Foto Tindakan</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Progress Note Form */}
      {isAuthenticated && (
        <form
          onSubmit={handleAddProgress}
          className="mt-6 pt-4 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-800">
              Tambah Catatan Progres / Perkembangan
            </label>

            {isStaff && (
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" /> Catatan Internal (Khusus Petugas)
                </span>
              </label>
            )}
          </div>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Tuliskan catatan progres atau update penanganan di lapangan..."
            rows={2}
            className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
            disabled={submitting}
          />

          <div className="flex items-center justify-between gap-2 mt-2">
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="URL Bukti Foto (Opsional: https://...)"
              className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 flex-1 max-w-sm bg-white"
              disabled={submitting}
            />

            <button
              type="submit"
              disabled={submitting || !noteText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>{submitting ? "Menyimpan..." : "Kirim Catatan"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ComplaintTimeline;
