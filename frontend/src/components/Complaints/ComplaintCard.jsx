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
      className="group bg-white/70 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer p-5 border border-white/50 relative overflow-hidden"
    >
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl -z-10 opacity-60 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transform group-hover:rotate-6 transition-transform duration-300"
          style={{ 
            backgroundColor: complaint.category_color ? `${complaint.category_color}20` : '#f3f4f6',
            border: `1px solid ${complaint.category_color}40`
          }}
        >
          <CategoryIcon
            className="w-6 h-6"
            style={{ color: complaint.category_color }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-800 line-clamp-1 flex-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-colors">
              {complaint.title}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 border ${
                STATUS_CONFIG[complaint.status].color.replace('bg-', 'bg-opacity-10 bg-').replace('text-', 'text-').replace('border-', 'border-')
              }`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {STATUS_CONFIG[complaint.status].label}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {complaint.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 font-medium">
             <span className="flex items-center gap-1.5 text-gray-700 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
              <User className="w-3.5 h-3.5" />
              {complaint.is_anonymous ? "Warga (Anonim)" : complaint.user_name}
            </span>
            
            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
              <span className="capitalize text-gray-700">
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
              <span className="flex items-center gap-1.5 text-gray-500 truncate max-w-[150px]">
                <MapPin className="w-3.5 h-3.5" />
                {complaint.location_address}
              </span>
            )}
            
            <div className="ml-auto flex items-center gap-3">
              <span className="flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                <ThumbsUp className="w-4 h-4" />
                {complaint.up_vote_count || 0}
              </span>

              <span className="flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                <MessageSquare className="w-4 h-4" />
                {complaint.comment_count || 0}
              </span>
            </div>
          </div>
          
          {complaint.image_url && (
            <div className="mt-3 h-32 w-full rounded-lg overflow-hidden border border-gray-100 relative group-hover:border-blue-100 transition-colors">
              <img 
                src={complaint.image_url.startsWith('http') ? complaint.image_url : `http://localhost:5000${complaint.image_url}`} 
                alt="Lampiran" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => e.target.style.display = 'none'}
              />
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-end border-t border-gray-50 pt-2">
             <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <Calendar className="w-3 h-3" />
              {formatDate(complaint.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
