import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Send,
  LogOut,
  LogIn,
  User,
  ChevronDown,
  Map,
  Activity,
  CheckSquare,
  Menu,
  X,
  FileText,
  Shield,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../Common/NotificationBell";

export const Header = ({ onNavigate, currentView }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isStaff =
    isAuthenticated && ["admin", "supervisor", "petugas"].includes(user?.role);
  const isAdminOrSupervisor =
    isAuthenticated && ["admin", "supervisor"].includes(user?.role);
  const isOfficer = isAuthenticated && user?.role === "petugas";

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="civic-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => {
              onNavigate("home");
              setIsMobileMenuOpen(false);
            }}
          >
            <img
              src="/logo.png"
              alt="Logo Sistem Informasi Pengaduan Warga"
              className="h-10 w-auto object-contain max-w-[140px] sm:max-w-[180px] transition-transform group-hover:scale-102"
              onError={(e) => {
                // Fallback if image fails to render
                e.target.style.display = "none";
              }}
            />
            <div className="hidden lg:block border-l border-slate-200 pl-3">
              <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 uppercase tracking-wider">
                Layanan Aspirasi Publik
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Navigasi Utama">
            <button
              onClick={() => onNavigate("home")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === "home"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Semua Laporan
            </button>

            {/* Officer "Tugas Saya" */}
            {isOfficer && (
              <button
                onClick={() => onNavigate("my_tasks")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentView === "my_tasks"
                    ? "bg-indigo-700 text-white shadow-xs"
                    : "text-indigo-800 hover:bg-indigo-50 border border-indigo-200"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Tugas Saya</span>
              </button>
            )}

            {/* Admin/Supervisor Operational & SLA */}
            {isAdminOrSupervisor && (
              <button
                onClick={() => onNavigate("operational")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentView === "operational"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                <span>Operasional & SLA</span>
              </button>
            )}

            <button
              onClick={() => onNavigate("stats")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === "stats"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Statistik & Tren</span>
            </button>

            {isStaff && (
              <button
                onClick={() => onNavigate("heatmap")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentView === "heatmap"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Peta Panas</span>
              </button>
            )}

            <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* Submit Complaint Button */}
            <button
              onClick={() => onNavigate(isAuthenticated ? "new" : "auth")}
              className="ml-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Buat Laporan</span>
            </button>

            {/* User Dropdown / Login */}
            {isAuthenticated ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 bg-white"
                  aria-expanded={isDropdownOpen}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() || <User className="w-3 h-3" />}
                  </div>
                  <div className="flex flex-col items-start text-left max-w-[110px]">
                    <span className="text-xs font-semibold text-slate-900 leading-none truncate w-full">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider mt-0.5">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-30 animate-civic-in">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {user.email}
                        </p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          Role: {user.role}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center gap-2 text-xs transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Keluar Akun</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate("auth")}
                className="ml-1 px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-semibold text-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </nav>

          {/* Mobile Right Controls */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              aria-label={isMobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Slide-in, Mobile-First) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-50 p-5 space-y-4 animate-civic-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <img
                src="/logo.png"
                alt="SIPW Logo"
                className="h-8 w-auto object-contain"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User profile brief in mobile menu */}
            {isAuthenticated && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {user.email}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-sky-600" />
                  <span className="text-[10px] font-bold uppercase text-sky-800">
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs font-medium">
              <button
                onClick={() => {
                  onNavigate("home");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-colors ${
                  currentView === "home"
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Semua Laporan</span>
              </button>

              {isOfficer && (
                <button
                  onClick={() => {
                    onNavigate("my_tasks");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-colors ${
                    currentView === "my_tasks"
                      ? "bg-indigo-700 text-white font-semibold"
                      : "text-indigo-800 bg-indigo-50 hover:bg-indigo-100"
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span>Tugas Saya</span>
                </button>
              )}

              {isAdminOrSupervisor && (
                <button
                  onClick={() => {
                    onNavigate("operational");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-colors ${
                    currentView === "operational"
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Activity className="w-4 h-4 text-sky-600" />
                  <span>Operasional & SLA</span>
                </button>
              )}

              <button
                onClick={() => {
                  onNavigate("stats");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-colors ${
                  currentView === "stats"
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-sky-600" />
                <span>Statistik & Tren</span>
              </button>

              {isStaff && (
                <button
                  onClick={() => {
                    onNavigate("heatmap");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-colors ${
                    currentView === "heatmap"
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Map className="w-4 h-4 text-slate-500" />
                  <span>Peta Panas Wilayah</span>
                </button>
              )}

              <div className="pt-2">
                <button
                  onClick={() => {
                    onNavigate(isAuthenticated ? "new" : "auth");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Buat Pengaduan Baru</span>
                </button>
              </div>
            </div>

            {/* Mobile Footer Logout / Login */}
            <div className="pt-3 border-t border-slate-200">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onNavigate("auth");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk / Daftar Akun</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
