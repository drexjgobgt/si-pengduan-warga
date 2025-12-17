
import React, { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Send, Trash2 } from "lucide-react";
import { complaintAPI } from "../../services/api";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";

export const ComplaintInteractions = ({ complaint, onUpdate }) => {
  const { isAuthenticated, user } = useAuth();
  const [upCount, setUpCount] = useState(parseInt(complaint.up_vote_count) || 0);
  const [downCount, setDownCount] = useState(parseInt(complaint.down_vote_count) || 0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState(null);

  useEffect(() => {
    fetchComments();
    // Update local counts if complaint prop changes
    setUpCount(parseInt(complaint.up_vote_count) || 0);
    setDownCount(parseInt(complaint.down_vote_count) || 0);
  }, [complaint.id]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await complaintAPI.getComments(complaint.id);
      setComments(response.data.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleVote = async (type) => {
    if (!isAuthenticated) return alert("Silakan login untuk memberikan suara");

    try {
      const response = await complaintAPI.vote(complaint.id, type);
      setUpCount(response.data.data.up_count);
      setDownCount(response.data.data.down_count);
      if (onUpdate) onUpdate(); // Notify parent interaction occurred
    } catch (error) {
      console.error("Vote error:", error);
      alert("Gagal memberikan suara");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return alert("Silakan login untuk berkomentar");
    if (!newComment.trim()) return;

    try {
      await complaintAPI.addComment(complaint.id, newComment);
      setNewComment("");
      fetchComments();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Comment error:", error);
      setCommentError("Gagal mengirim komentar");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus komentar ini?")) return;

    try {
      await complaintAPI.deleteComment(complaint.id, commentId);
      fetchComments();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Delete comment error:", error);
      alert("Gagal menghapus komentar");
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      {/* Voting Section */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => handleVote("up")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition"
        >
          <ThumbsUp className="w-5 h-5" />
          <span className="font-medium">{upCount}</span>
        </button>
        <button
          onClick={() => handleVote("down")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition"
        >
          <ThumbsDown className="w-5 h-5" />
          <span className="font-medium">{downCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      <div>
        <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
          <MessageSquare className="w-4 h-4" />
          Komentar ({comments.length})
        </h4>

        {/* Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleCommentSubmit} className="mb-6 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tulis komentar..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent glass-input"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="mb-6 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg text-center">
            Silakan login untuk ikut berdiskusi.
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {loadingComments ? (
            <p className="text-gray-500 text-center">Memuat komentar...</p>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-3 rounded-xl group relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-800">
                    {comment.user_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.created_at)}
                    </span>
                    {user && (user.id === comment.user_id || user.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                        title="Hapus komentar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{comment.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center">Belum ada komentar.</p>
          )}
        </div>
      </div>
    </div>
  );
};
