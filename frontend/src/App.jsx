
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Header } from "./components/Layout/Header";
import { Footer } from "./components/Layout/Footer";
import { ComplaintList } from "./components/Complaints/ComplaintList";
import { ComplaintFilters } from "./components/Complaints/ComplaintFilters";
import { ComplaintForm } from "./components/Complaints/ComplaintForm";
import { ComplaintInteractions } from "./components/Complaints/ComplaintInteractions";
import { StatusUpdate } from "./components/Complaints/StatusUpdate";
import { LoginForm } from "./components/Auth/LoginForm";
import { RegisterForm } from "./components/Auth/RegisterForm";
import ForgotPasswordForm from "./components/Auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/Auth/ResetPasswordForm";
import { StatsDashboard } from "./components/Statistics/StatsDashboard";
import { CategoryChart } from "./components/Statistics/CategoryChart";
import { StatusChart } from "./components/Statistics/StatusChart";
import { Modal } from "./components/Common/Modal";
import { Button } from "./components/Common/Button";
import { useAuth } from "./hooks/useAuth";
import { complaintAPI, authAPI, statisticsAPI } from "./services/api";
import { ArrowLeft, Trash2 } from "lucide-react";
import { ComplaintHeatmap } from "./components/Maps/ComplaintHeatmap";

function App() {
  const { login, isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [resetToken, setResetToken] = useState(null);

  // State
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    if (currentView === "home") {
      fetchComplaints();
    } else if (currentView === "stats") {
      fetchStats();
    }
    // eslint-disable-next-line
  }, [currentView, filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintAPI.getAll(filters);
      setComplaints(response.data.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await statisticsAPI.get();
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (formData) => {
    try {
      setLoading(true);
      const response =
        authMode === "login"
          ? await authAPI.login(formData)
          : await authAPI.register(formData);

      login(response.data.token, response.data.user);
      setCurrentView("home");
      alert(response.data.message || "Berhasil!");
    } catch (error) {
      alert(error.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };


  const handleCreateComplaint = async (data, file) => {
    try {
      setLoading(true);
      // 1. Create complaint
      const response = await complaintAPI.create(data);
      const newComplaintId = response.data.data.id; // Assuming response structure

      // 2. Upload image if exists
      if (file && newComplaintId) {
        const imageFormData = new FormData();
        imageFormData.append("image", file);
        await complaintAPI.uploadImage(newComplaintId, imageFormData);
      }

      alert(
        `✅ Pengaduan berhasil dibuat!\n\n` +
          `🤖 AI mengklasifikasikan sebagai: ${response.data.classification.category.toUpperCase()}\n` +
          `📊 Tingkat keyakinan: ${response.data.classification.confidence}%`
      );

      setCurrentView("home");
      fetchComplaints();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Gagal membuat pengaduan");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (data) => {
    if (!selectedComplaint) return;
    
    try {
      setLoading(true);
      await complaintAPI.updateStatus(selectedComplaint.id, data);
      
      alert("✅ Status pengaduan berhasil diperbarui");
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.response?.data?.error || "Gagal mengupdate status");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.")) return;

    try {
      setLoading(true);
      await complaintAPI.delete(selectedComplaint.id);
      
      alert("✅ Laporan berhasil dihapus");
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error) {
      console.error("Error deleting complaint:", error);
      alert(error.response?.data?.error || "Gagal menghapus laporan");
    } finally {
      setLoading(false);
    }
  };

  // Reset Password View
  if (currentView === "reset-password") {
    const token =
      new URLSearchParams(window.location.search).get("token") || resetToken;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <ResetPasswordForm
          token={token}
          onBack={() => {
            setCurrentView("auth");
            setResetToken(null);
          }}
          onSuccess={() => {
            setCurrentView("auth");
            setResetToken(null);
            setAuthMode("login");
          }}
        />
      </div>
    );
  }

  // Forgot Password View
  if (currentView === "forgot-password") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <ForgotPasswordForm
          onBack={() => {
            setCurrentView("auth");
            setAuthMode("login");
          }}
          onSuccess={() => {
            setCurrentView("auth");
            setAuthMode("login");
          }}
        />
      </div>
    );
  }

  // Auth View
  if (currentView === "auth") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Sistem Pengaduan Warga
            </h1>
            <p className="text-gray-600 mt-2">
              Lapor masalah di lingkungan Anda
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                authMode === "login"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                authMode === "register"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Daftar
            </button>
          </div>

          {authMode === "login" ? (
            <LoginForm
              onSubmit={handleAuth}
              loading={loading}
              onForgotPassword={() => setCurrentView("forgot-password")}
            />
          ) : (
            <RegisterForm onSubmit={handleAuth} loading={loading} />
          )}

          <button
            onClick={() => setCurrentView("home")}
            className="w-full mt-4 text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // New Complaint View
  if (currentView === "new") {
    if (!isAuthenticated) {
      setCurrentView("auth");
      return null;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header onNavigate={setCurrentView} currentView={currentView} />
        <div className="flex-1 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  📝 Buat Pengaduan Baru
                </h2>
                <Button
                  variant="secondary"
                  icon={ArrowLeft}
                  onClick={() => setCurrentView("home")}
                >
                  Batal
                </Button>
              </div>
              <ComplaintForm
                onSubmit={handleCreateComplaint}
                loading={loading}
              />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Statistics View
  if (currentView === "stats") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header onNavigate={setCurrentView} currentView={currentView} />
        <div className="flex-1 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                📊 Statistik & Analisis
              </h2>
              <Button
                variant="secondary"
                icon={ArrowLeft}
                onClick={() => setCurrentView("home")}
              >
                Kembali
              </Button>
            </div>

            {stats && (
              <>
                <StatsDashboard stats={stats} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryChart data={stats.byCategory} />
                  <StatusChart data={stats.byStatus} />
                </div>
              </>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Heatmap View
  if (currentView === "heatmap") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header onNavigate={setCurrentView} currentView={currentView} />
        <div className="flex-1 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                🗺️ Peta Persebaran Masalah
              </h2>
              <Button
                variant="secondary"
                icon={ArrowLeft}
                onClick={() => setCurrentView("home")}
              >
                Kembali
              </Button>
            </div>
            <ComplaintHeatmap />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Home View (Main)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={setCurrentView} currentView={currentView} />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Daftar Pengaduan
            </h2>
            <p className="text-gray-600">
              Total {complaints.length} pengaduan dari warga
            </p>
          </div>

          <ComplaintFilters filters={filters} onFilterChange={setFilters} />
          <ComplaintList
            complaints={complaints}
            loading={loading}
            onComplaintClick={setSelectedComplaint}
          />
        </div>
      </div>

      <Footer />

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={selectedComplaint.title}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Deskripsi</h3>
              <p className="text-gray-600">{selectedComplaint.description}</p>
            </div>

            {/* Image Preview */}
            {selectedComplaint.image_url && (
              <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <img 
                  src={selectedComplaint.image_url.startsWith('http') ? selectedComplaint.image_url : `http://localhost:5000${selectedComplaint.image_url}`} 
                  alt="Bukti Laporan" 
                  className="w-full h-auto max-h-96 object-contain bg-gray-50"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}

            {/* Map Preview */}
            {selectedComplaint.location_lat && selectedComplaint.location_lng && (
              <div className="h-64 rounded-xl overflow-hidden border border-gray-200 z-0 relative">
                 <MapContainer
                    center={[selectedComplaint.location_lat, selectedComplaint.location_lng]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    dragging={false}
                    touchZoom={false}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[selectedComplaint.location_lat, selectedComplaint.location_lng]} />
                  </MapContainer>
              </div>
            )}

            {selectedComplaint.location_address && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Alamat</h3>
                <p className="text-gray-600">
                  {selectedComplaint.location_address}
                </p>
              </div>
            )}


            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Kategori</h3>
                <p className="text-gray-600 capitalize">
                  {selectedComplaint.category_name?.replace("_", " ")}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
                <p className="text-gray-600 capitalize">
                  {selectedComplaint.status}
                </p>
              </div>
            </div>

            <ComplaintInteractions 
              complaint={selectedComplaint} 
              onUpdate={fetchComplaints} 
            />

            {/* Status Update Section for Admin/Petugas */}
            {isAuthenticated && ["admin", "petugas"].includes(user?.role) && (
              <StatusUpdate 
                currentStatus={selectedComplaint.status}
                onUpdate={handleStatusUpdate}
                loading={loading}
              />
            )}

            {/* Delete Button for Owner or Admin */}
            {isAuthenticated && (user?.id === selectedComplaint.user_id || ["admin", "petugas"].includes(user?.role)) && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleDeleteComplaint}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Laporan
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
