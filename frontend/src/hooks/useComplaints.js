import { useState, useEffect } from "react";
import { complaintAPI } from "../services/api";

export const useComplaints = (filters = {}) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line
  }, [filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintAPI.getAll(filters);
      setComplaints(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchComplaints();

  return { complaints, loading, error, refresh };
};
