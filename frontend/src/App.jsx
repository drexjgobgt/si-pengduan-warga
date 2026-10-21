import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Header } from "./components/Layout/Header";
import { Footer } from "./components/Layout/Footer";
import { ComplaintList } from "./components/Complaints/ComplaintList";
import { ComplaintFilters } from "./components/Complaints/ComplaintFilters";
import { ComplaintForm } from "./components/Complaints/ComplaintForm";
import { ComplaintInteractions } from "./components/Complaints/ComplaintInteractions";
import { StatusUpdate } from "./components/Complaints/StatusUpdate";
import { ComplaintTimeline } from "./components/Complaints/ComplaintTimeline";
import { DispositionModal } from "./components/Complaints/DispositionModal";
import { ResolveModal } from "./components/Complaints/ResolveModal";
import { OperationalDashboard } from "./components/Complaints/OperationalDashboard";
import { SLABadge } from "./components/Common/SLABadge";
import { LoginForm } from "./components/Auth/LoginForm";
import { RegisterForm } from "./components/Auth/RegisterForm";
import ForgotPasswordForm from "./components/Auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/Auth/ResetPasswordForm";
import { StatsDashboard } from "./components/Statistics/StatsDashboard";
import { CategoryChart } from "./components/Statistics/CategoryChart";
import { StatusChart } from "./components/Statistics/StatusChart";
import { InteractiveTrendChart } from "./components/Statistics/InteractiveTrendChart";
import { PerformanceMetricsChart } from "./components/Statistics/PerformanceMetricsChart";
import { Modal } from "./components/Common/Modal";
import { Button } from "./components/Common/Button";
import { CitizenChatWidget } from "./components/Chat/CitizenChatWidget";
import { useAuth } from "./hooks/useAuth";
import { complaintAPI, authAPI, statisticsAPI } from "./services/api";
import {
  ArrowLeft,
  Trash2,
  ArrowRightLeft,
  CheckCircle2,
  RotateCcw,
  Building2,
  UserCheck,
  Clock,
  MessageSquare,
  FileText,
} from "lucide-react";
import { ComplaintHeatmap } from "./components/Maps/ComplaintHeatmap";

function App() {
  const { login, isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState("home"); // 'home', 'my_tasks', 'operational', 'new', 'stats', 'heatmap', 'auth', 'forgot-password', 'reset-password'
  const [authMode, setAuthMode] = useState("login");
  const [resetToken, setResetToken] = useState(null);

  // Data states
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalTab, setModalTab] = useState("details"); // 'details', 'timeline', 'comments'

  // Disposition & Resolve modal states
  const [dispositionModalOpen, setDispositionModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [activeComplaintForAction, setActiveComplaintForAction] = useState(null);

  const isStaff = isAuthenticated && ["admin", "supervisor", "petugas"].includes(user?.role);
  const isOfficer = isAuthenticated && user?.role === "petugas";

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (currentView === "my_tasks") {
        params.my_tasks = "true";
      }
      const response = await complaintAPI.getAll(params);
      setComplaints(response.data.data || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentView]);

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

  useEffect(() => {
    if (currentView === "home" || currentView === "my_tasks") {
      fetchComplaints();
    } else if (currentView === "stats") {
      fetchStats();
    }
  }, [currentView, fetchComplaints]);

  // Refresh single complaint details
  const refreshSelectedComplaint = async (id) => {
    try {
      const res = await complaintAPI.getById(id);
      setSelectedComplaint(res.data.data);
      fetchComplaints();
    } catch (err) {
      console.error("Failed to refresh complaint:", err);
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
      alert(response.data.message || "Berhasil masuk!");
    } catch (error) {
      alert(error.response?.data?.error || "Terjadi kesalahan saat autentikasi");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async (data, file) => {
    try {
      setLoading(true);
      const response = await complaintAPI.create(data);
      const newComplaintId = response.data.data.id;

      if (file && newComplaintId) {
        const imageFormData = new FormData();
        imageFormData.append("image", file);
        await complaintAPI.uploadImage(newComplaintId, imageFormData);
      }

      const ai = response.data.classification || {};
      const reviewNotice = ai.needsHumanReview ? "\n⚠️ Catatan AI: Klasifikasi ditandai untuk verifikasi petugas" : "";
      alert(
        `✅ Pengaduan berhasil diajukan!\n\n` +
          `🤖 Klasifikasi AI: ${(ai.category || "lainnya").toUpperCase()}\n` +
          `🏢 Rekomendasi Dinas: ${ai.suggestedDepartment || "Dalam Verifikasi"}\n` +
          `⏱️ Target Operasional (SLA): ${response.data.data.sla_hours} jam` +
          reviewNotice
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
      alert("✅ Status laporan berhasil diperbarui");
      refreshSelectedComplaint(selectedComplaint.id);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.response?.data?.error || "Gagal mengupdate status");
    } finally {
      setLoading(false);
    }
  };

  const handleReopenComplaint = async () => {
    if (!selectedComplaint) return;
    const reason = window.prompt("Masukkan alasan membuka kembali laporan ini:");
    if (!reason || !reason.trim()) return;

    try {
      setLoading(true);
      await complaintAPI.reopen(selectedComplaint.id, { reason: reason.trim() });
      alert("✅ Laporan berhasil dibuka kembali dan status dikembalikan ke 'diproses'");
      refreshSelectedComplaint(selectedComplaint.id);
    } catch (error) {
      console.error("Error reopening complaint:", error);
      alert(error.response?.data?.error || "Gagal membuka kembali laporan");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan."
      )
    )
      return;

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="Logo Sistem Informasi Pengaduan Warga"
              className="h-20 w-auto mx-auto mb-3 object-contain"
            />
            <p className="text-xs text-slate-500">
              Portal Layanan Aspirasi dan Penanganan Masalah Lingkungan
            </p>
          </div>

          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-1.5 rounded-md font-medium text-xs transition-colors ${
                authMode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className={`flex-1 py-1.5 rounded-md font-medium text-xs transition-colors ${
                authMode === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daftar Akun
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
            className="w-full mt-4 text-slate-500 hover:text-slate-800 text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Beranda Publik
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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header onNavigate={setCurrentView} currentView={currentView} />
        <main className="flex-1 civic-container py-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Formulir Pengaduan Warga
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Laporan akan otomatis dianalisis AI dan dipetakan ke OPD terkait.
                  </p>
                </div>
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
        </main>
        <Footer />
      </div>
    );
  }

  // Operational & SLA Dashboard View (Admin & Supervisor)
  if (currentView === "operational") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header onNavigate={setCurrentView} currentView={currentView} />
        <main className="flex-1 civic-container py-6">
          <OperationalDashboard
            onSelectComplaint={(c) => {
              setSelectedComplaint(c);
              setModalTab("timeline");
            }}
            onOpenDisposition={(c) => {
              setActiveComplaintForAction(c);
              setDispositionModalOpen(true);
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Statistics View
  if (currentView === "stats") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header onNavigate={setCurrentView} currentView={currentView} />
        <main className="flex-1 civic-container py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Statistik & Analisis Pelayanan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ringkasan data pengaduan masuk, penyelesaian, dan sebaran kategori
              </p>
            </div>
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => setCurrentView("home")}
            >
              Kembali
            </Button>
          </div>

          <div className="space-y-6">
            <StatsDashboard stats={stats} />

            {/* Interactive Line / Curve Chart */}
            <InteractiveTrendChart
              role={user?.role || "warga"}
              scope={user?.role === "petugas" ? "my_tasks" : "all"}
              title="Tren Laporan Masuk & Penyelesaian"
              subtitle="Kurva interaktif dinamis data pengaduan masyarakat berbanding kecepatan penanganan instansi."
            />

            {/* Performance Analytics & Department Comparison */}
            <PerformanceMetricsChart />

            {/* Categorical & Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryChart data={stats?.byCategory} />
              <StatusChart data={stats?.byStatus} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Heatmap View
  if (currentView === "heatmap") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header onNavigate={setCurrentView} currentView={currentView} />
        <main className="flex-1 civic-container py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Peta Persebaran Titik Masalah
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisasi spasial kepadatan laporan warga di wilayah perkotaan
              </p>
            </div>
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => setCurrentView("home")}
            >
              Kembali
            </Button>
          </div>
          <ComplaintHeatmap />
        </main>
        <Footer />
      </div>
    );
  }

  // Home View (Public) & "Tugas Saya" View (Officer)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onNavigate={setCurrentView} currentView={currentView} />

      <main className="flex-1 civic-container py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {currentView === "my_tasks" ? "Tugas & Tanggung Jawab Saya" : "Daftar Laporan Pengaduan"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentView === "my_tasks"
                ? `Laporan yang ditugaskan khusus kepada Anda (${complaints.length} laporan)`
                : `Total ${complaints.length} pengaduan dari seluruh masyarakat`}
            </p>
          </div>

          {currentView === "my_tasks" && (
            <button
              onClick={() => setCurrentView("home")}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 self-start sm:self-auto"
            >
              ← Lihat Semua Laporan Publik
            </button>
          )}

          {isOfficer && currentView === "home" && (
            <button
              onClick={() => setCurrentView("my_tasks")}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 self-start sm:self-auto bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
            >
              Buka Tugas & Tanggung Jawab Saya →
            </button>
          )}
        </div>

        {currentView === "my_tasks" && (
          <div className="mb-6">
            <InteractiveTrendChart
              role="petugas"
              scope="my_tasks"
              title="Grafik Beban Kerja & Penyelesaian Tugas Anda"
              subtitle="Monitoring kurva penugasan laporan baru dan kecepatan penyelesaian tugas operasional Anda."
            />
          </div>
        )}

        <ComplaintFilters filters={filters} onFilterChange={setFilters} />

        <ComplaintList
          complaints={complaints}
          loading={loading}
          onComplaintClick={(c) => {
            setSelectedComplaint(c);
            setModalTab("details");
          }}
        />
      </main>

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
            {/* Meta Header */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <SLABadge complaint={selectedComplaint} showDeadline />

                {selectedComplaint.department_name && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {selectedComplaint.department_name}
                  </span>
                )}

                {selectedComplaint.assigned_officer_name && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    <UserCheck className="w-3 h-3 text-indigo-600" />
                    {selectedComplaint.assigned_officer_name}
                  </span>
                )}
              </div>

              {selectedComplaint.is_anonymous ? (
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Pelapor: Anonim (Dilindungi)
                </span>
              ) : (
                <span className="text-[11px] text-slate-600 font-medium">
                  Pelapor: <strong className="text-slate-800">{selectedComplaint.user_name || "Warga"}</strong>
                </span>
              )}
            </div>

            {/* Modal Internal Tabs: Detail vs Timeline vs Komentar */}
            <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
              <button
                onClick={() => setModalTab("details")}
                className={`pb-2 flex items-center gap-1.5 border-b-2 transition-colors ${
                  modalTab === "details"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Detail & Bukti
              </button>

              <button
                onClick={() => setModalTab("timeline")}
                className={`pb-2 flex items-center gap-1.5 border-b-2 transition-colors ${
                  modalTab === "timeline"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Timeline Kronologis
              </button>

              <button
                onClick={() => setModalTab("comments")}
                className={`pb-2 flex items-center gap-1.5 border-b-2 transition-colors ${
                  modalTab === "comments"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Diskusi ({selectedComplaint.comment_count || 0})
              </button>
            </div>

            {/* TAB 1: DETAILS */}
            {modalTab === "details" && (
              <div className="space-y-4 pt-1">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Deskripsi Masalah
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Resolution Info (if completed) */}
                {selectedComplaint.status === "selesai" && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Laporan Telah Diselesaikan
                    </div>
                    {selectedComplaint.resolution_notes && (
                      <p className="text-emerald-900 leading-relaxed">
                        {selectedComplaint.resolution_notes}
                      </p>
                    )}
                    {selectedComplaint.resolution_proof_url && (
                      <div className="pt-2 border-t border-emerald-200">
                        <a
                          href={selectedComplaint.resolution_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-emerald-700 hover:underline inline-flex items-center gap-1"
                        >
                          Lihat Foto Bukti Penyelesaian Petugas →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Image Preview */}
                {selectedComplaint.image_url && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={
                        selectedComplaint.image_url.startsWith("http")
                          ? selectedComplaint.image_url
                          : `http://localhost:5000${selectedComplaint.image_url}`
                      }
                      alt="Bukti Laporan"
                      className="w-full h-auto max-h-80 object-contain mx-auto"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                )}

                {/* Map Preview */}
                {selectedComplaint.location_lat && selectedComplaint.location_lng && (
                  <div className="h-56 rounded-lg overflow-hidden border border-slate-200 z-0 relative">
                    <MapContainer
                      center={[
                        selectedComplaint.location_lat,
                        selectedComplaint.location_lng,
                      ]}
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
                      <Marker
                        position={[
                          selectedComplaint.location_lat,
                          selectedComplaint.location_lng,
                        ]}
                      />
                    </MapContainer>
                  </div>
                )}

                {selectedComplaint.location_address && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Alamat Lokasi
                    </h4>
                    <p className="text-slate-600 text-xs">
                      {selectedComplaint.location_address}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TIMELINE */}
            {modalTab === "timeline" && (
              <div className="pt-1">
                <ComplaintTimeline
                  complaintId={selectedComplaint.id}
                  isAnonymous={selectedComplaint.is_anonymous}
                />
              </div>
            )}

            {/* TAB 3: COMMENTS & VOTES */}
            {modalTab === "comments" && (
              <div className="pt-1">
                <ComplaintInteractions
                  complaint={selectedComplaint}
                  onUpdate={() => refreshSelectedComplaint(selectedComplaint.id)}
                />
              </div>
            )}

            {/* STAFF / ADMIN ACTIONS TOOLBAR */}
            {isStaff && (
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setActiveComplaintForAction(selectedComplaint);
                    setDispositionModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg border border-slate-300 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
                  <span>Disposisi / Alihkan Petugas</span>
                </button>

                {selectedComplaint.status !== "selesai" && (
                  <button
                    onClick={() => {
                      setActiveComplaintForAction(selectedComplaint);
                      setResolveModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selesaikan Laporan</span>
                  </button>
                )}

                {selectedComplaint.status === "selesai" && (
                  <button
                    onClick={handleReopenComplaint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium rounded-lg border border-amber-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Buka Kembali Laporan</span>
                  </button>
                )}
              </div>
            )}

            {/* General Status Update Section */}
            {isStaff && (
              <StatusUpdate
                currentStatus={selectedComplaint.status}
                onUpdate={handleStatusUpdate}
                loading={loading}
              />
            )}

            {/* Citizen Re-open option if resolved and owner */}
            {!isStaff &&
              selectedComplaint.status === "selesai" &&
              user?.id === selectedComplaint.user_id && (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={handleReopenComplaint}
                    className="w-full py-2 px-3 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Masalah Belum Tuntas? Buka Kembali Laporan</span>
                  </button>
                </div>
              )}

            {/* Delete Button for Owner or Admin */}
            {isAuthenticated &&
              (user?.id === selectedComplaint.user_id ||
                ["admin", "petugas", "supervisor"].includes(user?.role)) && (
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleDeleteComplaint}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Laporan
                  </button>
                </div>
              )}
          </div>
        </Modal>
      )}

      {/* Disposition Modal */}
      {dispositionModalOpen && activeComplaintForAction && (
        <DispositionModal
          isOpen={dispositionModalOpen}
          onClose={() => {
            setDispositionModalOpen(false);
            setActiveComplaintForAction(null);
          }}
          complaint={activeComplaintForAction}
          onSuccess={() => {
            if (selectedComplaint?.id === activeComplaintForAction.id) {
              refreshSelectedComplaint(activeComplaintForAction.id);
            }
            fetchComplaints();
          }}
        />
      )}

      {/* Resolve Modal */}
      {resolveModalOpen && activeComplaintForAction && (
        <ResolveModal
          isOpen={resolveModalOpen}
          onClose={() => {
            setResolveModalOpen(false);
            setActiveComplaintForAction(null);
          }}
          complaint={activeComplaintForAction}
          onSuccess={() => {
            if (selectedComplaint?.id === activeComplaintForAction.id) {
              refreshSelectedComplaint(activeComplaintForAction.id);
            }
            fetchComplaints();
          }}
        />
      )}

      {/* Citizen AI Chatbot Widget (Kios API) */}
      <CitizenChatWidget
        isAuthenticated={isAuthenticated}
        user={user}
        onOpenLogin={() => {
          setCurrentView("auth");
          setAuthMode("login");
        }}
      />
    </div>
  );
}

export default App;
