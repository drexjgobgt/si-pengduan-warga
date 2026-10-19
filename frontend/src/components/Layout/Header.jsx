import React, { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Send,
  LogOut,
  LogIn,
  User,
  ChevronDown,
  Map,
  Activity,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../Common/NotificationBell";

export const Header = ({ onNavigate, currentView }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isStaff = isAuthenticated && ["admin", "supervisor", "petugas"].includes(user?.role);
  const isAdminOrSupervisor = isAuthenticated && ["admin", "supervisor"].includes(user?.role);
  const isOfficer = isAuthenticated && user?.role === "petugas";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition group"
            onClick={() => onNavigate("home")}
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  SIPW
                </h1>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  Pelayanan Publik
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                Sistem Informasi Pengaduan Warga
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => onNavigate("home")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium text-xs ${
                currentView === "home"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Semua Laporan
            </button>

            {/* Officer "Tugas Saya" */}
            {isOfficer && (
              <button
                onClick={() => onNavigate("my_tasks")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium text-xs ${
                  currentView === "my_tasks"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Tugas Saya</span>
              </button>
            )}

            {/* Admin/Supervisor Operational Dashboard */}
            {isAdminOrSupervisor && (
              <button
                onClick={() => onNavigate("operational")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium text-xs ${
                  currentView === "operational"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Operasional & SLA</span>
              </button>
            )}

            <button
              onClick={() => onNavigate("stats")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium text-xs ${
                currentView === "stats"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Statistik</span>
            </button>

            {isStaff && (
              <button
                onClick={() => onNavigate("heatmap")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium text-xs ${
                  currentView === "heatmap"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Peta Panas</span>
              </button>
            )}

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate("new")}
                  className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium text-xs shadow-sm ${
                    currentView === "new"
                      ? "bg-indigo-700 text-white"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Buat Laporan</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 bg-white"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-semibold">
                      {user.name?.charAt(0) || <User className="w-3 h-3" />}
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-xs font-semibold text-slate-900 leading-none">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-medium uppercase tracking-wide mt-0.5">
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
                        className="fixed inset-0 z-10"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-20 animate-in">
                        <div className="px-3 py-1.5 border-b border-slate-100">
                          <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            logout();
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center gap-2 text-xs transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => onNavigate("auth")}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1.5 font-medium text-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  isMobileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-200 space-y-2 animate-in text-xs">
            <button
              onClick={() => {
                onNavigate("home");
                setIsMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-lg bg-slate-50 text-slate-800 flex items-center gap-2 font-medium"
            >
              Semua Laporan
            </button>

            {isOfficer && (
              <button
                onClick={() => {
                  onNavigate("my_tasks");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-lg bg-indigo-50 text-indigo-700 flex items-center gap-2 font-medium"
              >
                <CheckSquare className="w-4 h-4" />
                Tugas Saya
              </button>
            )}

            {isAdminOrSupervisor && (
              <button
                onClick={() => {
                  onNavigate("operational");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-lg bg-indigo-50 text-indigo-700 flex items-center gap-2 font-medium"
              >
                <Activity className="w-4 h-4" />
                Operasional & SLA
              </button>
            )}

            <button
              onClick={() => {
                onNavigate("stats");
                setIsMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-lg bg-slate-50 text-slate-800 flex items-center gap-2 font-medium"
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Statistik
            </button>

            {isStaff && (
              <button
                onClick={() => {
                  onNavigate("heatmap");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-lg bg-slate-50 text-slate-800 flex items-center gap-2 font-medium"
              >
                <Map className="w-4 h-4 text-slate-500" />
                Peta Panas
              </button>
            )}

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    onNavigate("new");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-2.5 rounded-lg bg-indigo-600 text-white font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Buat Pengaduan
                </button>

                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-2.5 rounded-lg border border-rose-200 text-rose-600 font-medium flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onNavigate("auth");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-lg bg-indigo-600 text-white font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                Login / Register
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
