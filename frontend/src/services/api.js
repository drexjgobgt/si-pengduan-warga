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
  updateStatus: (id, data) => api.patch(`/complaints/${id}/status`, data),
  vote: (id) => api.post(`/complaints/${id}/vote`),
  addComment: (id, comment) =>
    api.post(`/complaints/${id}/comments`, { comment }),
  getComments: (id) => api.get(`/complaints/${id}/comments`),
  getHistory: (id) => api.get(`/complaints/${id}/history`),
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

// Category APIs
export const categoryAPI = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
};

// Statistics APIs
export const statisticsAPI = {
  get: () => api.get("/statistics"),
  getMonthly: () => api.get("/statistics/monthly"),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;
