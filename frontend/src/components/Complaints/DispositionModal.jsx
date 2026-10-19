import React, { useState, useEffect } from "react";
import { ArrowRightLeft, Building2, User, FileText, CheckCircle2 } from "lucide-react";
import { departmentAPI, complaintAPI } from "../../services/api";

export const DispositionModal = ({ isOpen, onClose, complaint, onSuccess }) => {
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && complaint) {
      setSelectedDeptId(complaint.department_id || "");
      setSelectedOfficerId(complaint.assigned_to || "");
      setInstructions("");
      setError(null);
      fetchDepartments();
    }
  }, [isOpen, complaint]);

  // Load officers whenever selected department changes
  useEffect(() => {
    if (isOpen) {
      fetchOfficers(selectedDeptId);
    }
  }, [isOpen, selectedDeptId]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentAPI.getAll();
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setError("Gagal memuat daftar departemen");
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async (deptId) => {
    try {
      const params = deptId ? { department_id: deptId } : {};
      const res = await departmentAPI.getOfficers(params);
      setOfficers(res.data.data || []);
    } catch (err) {
      console.error("Failed to load officers:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDeptId && !selectedOfficerId) {
      setError("Pilih departemen atau petugas tujuan penugasan");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await complaintAPI.assign(complaint.id, {
        department_id: selectedDeptId || null,
        officer_id: selectedOfficerId || null,
        notes: instructions.trim() || null,
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Disposition error:", err);
      setError(err.response?.data?.error || "Gagal melakukan disposisi laporan");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !complaint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-indigo-700">
            <ArrowRightLeft className="w-5 h-5" />
            <h3 className="font-semibold text-base text-slate-900">
              Disposisi & Penugasan Laporan
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

          {/* Current Assignment Card */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="font-medium text-slate-800">
              Laporan: <span className="font-semibold">{complaint.title}</span>
            </div>
            <div className="text-slate-500 flex items-center gap-4">
              <span>
                Departemen saat ini:{" "}
                <strong className="text-slate-700">
                  {complaint.department_name || "Belum ditentukan"}
                </strong>
              </span>
              <span>
                Petugas saat ini:{" "}
                <strong className="text-slate-700">
                  {complaint.assigned_officer_name || "Belum ditugaskan"}
                </strong>
              </span>
            </div>
          </div>

          {/* Select Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Departemen / OPD Terkait
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedOfficerId(""); // reset officer on dept switch
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
              disabled={loading || submitting}
            >
              <option value="">-- Pilih Departemen / OPD --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code}) — {dept.active_complaints_count || 0} aktif
                </option>
              ))}
            </select>
          </div>

          {/* Select Officer with Workload Badge */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Petugas Pelaksana (dengan info beban kerja aktif)
            </label>
            <select
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
              disabled={submitting}
            >
              <option value="">-- Tugaskan ke Seluruh Tim / Pilih Petugas --</option>
              {officers.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} ({off.role}) — {off.active_workload || 0} tugas aktif
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Petugas diurutkan dari beban tugas teringan untuk pemerataan kerja.
            </p>
          </div>

          {/* Disposition Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Instruksi Penanganan / Alasan Disposisi
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Contoh: Tolong segera tinjau titik lokasi drainase tersumbat dan koordinasikan dengan RT setempat."
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
              disabled={submitting}
            />
          </div>

          {/* Footer Actions */}
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
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? "Memproses..." : "Konfirmasi Disposisi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispositionModal;
