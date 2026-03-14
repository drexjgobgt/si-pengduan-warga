import React from "react";
import {
  MapPin,
  ThumbsUp,
  MessageSquare,
  Clock,
  Calendar,
  User,
  AlertCircle
} from "lucide-react";
import { CATEGORY_ICONS, STATUS_CONFIG } from "../../utils/constants";
import {
  formatDate,
  getConfidenceBg,
  getConfidenceColor,
} from "../../utils/helpers";
import * as LucideIcons from "lucide-react";

export const ComplaintCard = ({ complaint, onClick }) => {
  const CategoryIcon =
    LucideIcons[CATEGORY_ICONS[complaint.category_name]] ||
    AlertCircle;
  const StatusIcon =
    LucideIcons[STATUS_CONFIG[complaint.status]?.icon] || Clock;

  return (
    <div
      onClick={onClick}
      className="civic-card p-5 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all duration-200 group flex flex-col h-full"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 border border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors"
          >
            <CategoryIcon
              className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors"
            />
          </div>
          <h3 className="text-base font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors break-words">
            {complaint.title}
          </h3>
        </div>
        <span
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 flex-shrink-0 border ${
            STATUS_CONFIG[complaint.status].color.replace('bg-', 'bg-').replace('text-', 'text-').replace('border-', 'border-')
          } opacity-90`}
        >
          <StatusIcon className="w-3 h-3" />
          {STATUS_CONFIG[complaint.status].label}
        </span>
      </div>

      <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed flex-grow">
        {complaint.description}
      </p>

      {/* Tags and Location */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-[11px] font-medium">
          <User className="w-3 h-3" />
          {complaint.is_anonymous ? "Warga" : complaint.user_name}
        </span>
        
        <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-[11px] font-medium">
          <span className="capitalize text-slate-700">
            {complaint.category_name?.replace("_", " ")}
          </span>
          {complaint.confidence_score && (
            <span
              className={`ml-1 text-[10px] px-1.5 py-0.5 rounded ${getConfidenceBg(
                complaint.confidence_score
              )} ${getConfidenceColor(complaint.confidence_score)}`}
            >
              {complaint.confidence_score}% AI
            </span>
          )}
        </span>

        {complaint.location_address && (
          <span className="inline-flex items-center gap-1.5 text-slate-500 text-[11px] truncate max-w-[150px] ml-auto">
            <MapPin className="w-3 h-3" />
            {complaint.location_address}
          </span>
        )}
      </div>

      {/* Image Preview (if any) */}
      {complaint.image_url && (
        <div className="mt-auto h-36 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative group-hover:border-indigo-200 transition-colors mb-3">
          <img 
            src={complaint.image_url.startsWith('http') ? complaint.image_url : `http://localhost:5000${complaint.image_url}`} 
            alt="Lampiran" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      )}

      {/* Footer: Date and Interactions */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <Calendar className="w-3 h-3" />
          {formatDate(complaint.created_at)}
        </span>
        <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium">
          <span className="flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
            <ThumbsUp className="w-3.5 h-3.5" />
            {complaint.up_vote_count || 0}
          </span>
          <span className="flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            {complaint.comment_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
};
