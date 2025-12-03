import React from "react";
import { ComplaintCard } from "./ComplaintCard";
import { Loading } from "../Common/Loading";
import { AlertCircle } from "lucide-react";

export const ComplaintList = ({ complaints, loading, onComplaintClick }) => {
  if (loading) {
    return <Loading text="Memuat pengaduan..." />;
  }

  if (complaints.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">Belum ada pengaduan</p>
        <p className="text-gray-400 text-sm mt-2">
          Jadilah yang pertama membuat pengaduan
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {complaints.map((complaint) => (
        <ComplaintCard
          key={complaint.id}
          complaint={complaint}
          onClick={() => onComplaintClick(complaint)}
        />
      ))}
    </div>
  );
};
