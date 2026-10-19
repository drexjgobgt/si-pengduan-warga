import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

// Complaint APIs
export const complaintAPI = {
  getAll: (params) => api.get("/complaints", { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post("/complaints", data),
  delete: (id) => api.delete(`/complaints/${id}`),
  updateStatus: (id, data) => api.patch(`/complaints/${id}/status`, data),
  vote: (id, vote_type) => api.post(`/complaints/${id}/vote`, { vote_type }),
  addComment: (id, comment) =>
    api.post(`/complaints/${id}/comments`, { comment }),
  getComments: (id) => api.get(`/complaints/${id}/comments`),
  deleteComment: (id, commentId) => api.delete(`/complaints/${id}/comments/${commentId}`),
  getHistory: (id) => api.get(`/complaints/${id}/history`),
  
  // New: Timeline, Disposisi & SLA
  getTimeline: (id) => api.get(`/complaints/${id}/timeline`),
  assign: (id, data) => api.post(`/complaints/${id}/assign`, data),
  addProgressNote: (id, data) => api.post(`/complaints/${id}/progress`, data),
  resolve: (id, data) => api.post(`/complaints/${id}/resolve`, data),
  reopen: (id, data) => api.post(`/complaints/${id}/reopen`, data),
  getSLASummary: () => api.get("/complaints/sla/summary"),

  uploadImage: (complaintId, formData) => {
    return api.post(`/complaints/${complaintId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getImages: (complaintId) => {
    return api.get(`/complaints/${complaintId}/images`);
  },
  deleteImage: (complaintId, imageId) => {
    return api.delete(`/complaints/${complaintId}/images/${imageId}`);
  },
};

// Department & Officer APIs
export const departmentAPI = {
  getAll: () => api.get("/departments"),
  getOfficers: (params) => api.get("/departments/officers", { params }),
  create: (data) => api.post("/departments", data),
  update: (id, data) => api.put(`/departments/${id}`, data),
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
};

// Statistics APIs
export const statisticsAPI = {
  get: () => api.get("/statistics"),
  getMonthly: () => api.get("/statistics/monthly"),
  getTrends: (params) => api.get("/statistics/trends", { params }),
  getPerformance: (params) => api.get("/statistics/performance", { params }),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;
