import React from "react";
import { Clock, AlertTriangle, CheckCircle, ShieldAlert, AlertCircle } from "lucide-react";

/**
 * SLABadge component
 * Displays high-signal SLA compliance and deadline urgency according to Taste Skill:
 * - Data-dense, quiet styling
 * - Strict semantic colors: emerald (safe/on-time), amber (near deadline), rose (overdue/escalated)
 */
export const SLABadge = ({ complaint, showDeadline = false }) => {
  if (!complaint) return null;

  const {
    sla_status,
    sla_deadline_at,
    is_escalated,
    status,
  } = complaint;

  // Compute deadline text if deadline timestamp exists
  const getDeadlineText = () => {
    if (!sla_deadline_at) return null;
    const deadline = new Date(sla_deadline_at);
    const now = new Date();
    const diffHours = Math.round((deadline - now) / (1000 * 60 * 60));

    if (status === "selesai") {
      return null;
    }

    if (diffHours < 0) {
      return `Terlambat ${Math.abs(diffHours)}j`;
    } else if (diffHours < 24) {
      return `Sisa ${diffHours}j`;
    } else {
      const days = Math.round(diffHours / 24);
      return `Sisa ${days} hari`;
    }
  };

  const deadlineText = getDeadlineText();

  // Status mapping
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let Icon = Clock;
  let label = "SLA Normal";

  if (sla_status === "terlambat" || (deadlineText && deadlineText.startsWith("Terlambat"))) {
    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
    Icon = AlertTriangle;
    label = "Lewat SLA";
  } else if (sla_status === "mendekati_tenggat") {
    badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
    Icon = AlertCircle;
    label = "Mendekati Tenggat";
  } else if (sla_status === "selesai_tepat_waktu") {
    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
    Icon = CheckCircle;
    label = "Tepat Waktu";
  } else if (sla_status === "selesai_terlambat") {
    badgeStyle = "bg-slate-100 text-rose-600 border-rose-200";
    Icon = Clock;
    label = "Selesai (Terlambat)";
  } else if (sla_status === "aman") {
    badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
    Icon = Clock;
    label = "SLA Aman";
  }

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${badgeStyle}`}
      >
        <Icon className="w-3 h-3" />
        <span>{label}</span>
        {showDeadline && deadlineText && (
          <span className="font-semibold border-l border-current/20 pl-1 ml-0.5">
            {deadlineText}
          </span>
        )}
      </span>

      {is_escalated && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border bg-red-100 text-red-800 border-red-300">
          <ShieldAlert className="w-3 h-3 text-red-600" />
          <span>Eskalasi Supervisor</span>
        </span>
      )}
    </div>
  );
};

export default SLABadge;
