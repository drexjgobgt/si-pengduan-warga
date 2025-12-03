import React from "react";
import {
  MapPin,
  ThumbsUp,
  MessageSquare,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  Calendar,
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
    LucideIcons.AlertCircle;
  const StatusIcon =
    LucideIcons[STATUS_CONFIG[complaint.status]?.icon] || Clock;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer p-5 border border-gray-100"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: complaint.category_color + "30" }}
        >
          <CategoryIcon
            className="w-6 h-6"
            style={{ color: complaint.category_color }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-1 flex-1">
              {complaint.title}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${
                STATUS_CONFIG[complaint.status].color
              }`}
            >
              <StatusIcon className="w-3 h-3" />
              {STATUS_CONFIG[complaint.status].label}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {complaint.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1 font-medium">
              <span className="capitalize">
                {complaint.category_name?.replace("_", " ")}
              </span>
              {complaint.confidence_score && (
                <span
                  className={`text-xs px-2 py-0.5 rounded ${getConfidenceBg(
                    complaint.confidence_score
                  )} ${getConfidenceColor(complaint.confidence_score)}`}
                >
                  {complaint.confidence_score}% AI
                </span>
              )}
            </span>

            {complaint.location_address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {complaint.location_address.substring(0, 30)}...
              </span>
            )}

            <span className="flex items-center gap-1 hover:text-blue-600 transition">
              <ThumbsUp className="w-4 h-4" />
              {complaint.vote_count || 0}
            </span>

            <span className="flex items-center gap-1 hover:text-blue-600 transition">
              <MessageSquare className="w-4 h-4" />
              {complaint.comment_count || 0}
            </span>

            <span className="ml-auto flex items-center gap-1 text-xs">
              <Calendar className="w-3 h-3" />
              {formatDate(complaint.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
