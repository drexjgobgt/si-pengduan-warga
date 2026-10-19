import React from "react";
import {
  MapPin,
  ThumbsUp,
  MessageSquare,
  Clock,
  Calendar,
  AlertCircle,
  Building2,
} from "lucide-react";
import { CATEGORY_ICONS, STATUS_CONFIG } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";
import * as LucideIcons from "lucide-react";
import { SLABadge } from "../Common/SLABadge";

export const ComplaintCard = ({ complaint, onClick }) => {
  const CategoryIcon =
    LucideIcons[CATEGORY_ICONS[complaint.category_name]] || AlertCircle;
  const StatusIcon =
    LucideIcons[STATUS_CONFIG[complaint.status]?.icon] || Clock;

  const statusConfig = STATUS_CONFIG[complaint.status] || {
    label: complaint.status,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <article
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick && onClick();
        }
      }}
      className="civic-card p-5 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all duration-150 group flex flex-col h-full bg-white border border-slate-200/90 rounded-lg text-left"
    >
      {/* Top Meta & Status Header */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
          <span className="inline-flex items-center gap-1.5 capitalize text-slate-800 font-semibold">
            <CategoryIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-700 transition-colors flex-shrink-0" />
            {complaint.category_name?.replace("_", " ")}
          </span>
          <span className="text-slate-300">•</span>
          <span className="truncate text-slate-500">
            {complaint.is_anonymous ? "Anonim" : (complaint.user_name || "Warga")}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 border ${statusConfig.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
          <SLABadge complaint={complaint} showDeadline={false} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-900 group-hover:text-sky-800 transition-colors line-clamp-2 my-2 leading-snug break-words">
        {complaint.title}
      </h3>

      {/* Description Snippet */}
      <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed mb-3 flex-grow">
        {complaint.description}
      </p>

      {/* Attachment Image Preview (if present) */}
      {complaint.image_url && (
        <div className="mb-3 h-36 w-full rounded-md overflow-hidden border border-slate-200/70 bg-slate-50 relative">
          <img
            src={
              complaint.image_url.startsWith("http")
                ? complaint.image_url
                : `http://localhost:5000${complaint.image_url}`
            }
            alt="Lampiran aduan"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      )}

      {/* Department & Location Meta Row */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100 mt-auto gap-2">
        {complaint.department_name ? (
          <div
            className="flex items-center gap-1 truncate text-slate-600"
            title={complaint.department_name}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate max-w-[170px] font-medium">
              {complaint.department_name}
            </span>
          </div>
        ) : complaint.location_address ? (
          <div
            className="flex items-center gap-1 truncate text-slate-500"
            title={complaint.location_address}
          >
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate max-w-[170px]">
              {complaint.location_address}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">Kota Administrasi</span>
        )}

        <div className="flex items-center gap-1 text-[11px] text-slate-400 flex-shrink-0">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(complaint.created_at)}</span>
        </div>
      </div>

      {/* Bottom Footer: Officer Assignment & Interaction stats */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-slate-400 text-xs mt-1">
        <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
          {complaint.assigned_officer_name
            ? `Petugas: ${complaint.assigned_officer_name}`
            : "Belum didisposisi"}
        </span>

        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1 hover:text-slate-800 transition-colors">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="tabular-nums">{complaint.up_vote_count || 0}</span>
          </span>
          <span className="flex items-center gap-1 hover:text-slate-800 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="tabular-nums">{complaint.comment_count || 0}</span>
          </span>
        </div>
      </div>
    </article>
  );
};

export default ComplaintCard;
