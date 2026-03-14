
import React, { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Send,
  LogOut,
  LogIn,
  User,
  ChevronDown,
  Map
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../Common/NotificationBell";

export const Header = ({ onNavigate, currentView }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition group"
            onClick={() => onNavigate("home")}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                Pengaduan Warga
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium hidden sm:block">
                Sistem Pelaporan Publik
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
             <button
              onClick={() => onNavigate("stats")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium text-sm ${
                currentView === "stats"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistik</span>
            </button>

            {isAuthenticated && ["admin", "petugas"].includes(user?.role) && (
              <button
                onClick={() => onNavigate("heatmap")}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium text-sm ${
                  currentView === "heatmap"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Peta Panas</span>
              </button>
            )}

            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => onNavigate("new")}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium text-sm ${
                    currentView === "new"
                      ? "bg-indigo-700 text-white shadow-sm"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Buat Pengaduan</span>
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-3 bg-white"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900 leading-none">{user.name}</span>
                      <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wide mt-1">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 animate-in duration-150">
                        <button
                          onClick={() => {
                            logout();
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 text-gray-700 hover:text-red-600 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => onNavigate("auth")}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all duration-200 flex items-center gap-2 font-medium text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
             {isAuthenticated && <NotificationBell />}
             <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
             >
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
             </button>
          </div>
        </div>

        {/* Mobile Hidden Menu */}
        {isMobileMenuOpen && (
           <div className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-3 animate-in duration-150">
              <button
                onClick={() => { onNavigate("stats"); setIsMobileMenuOpen(false); }}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 hover:bg-gray-100 flex items-center gap-3 font-medium text-sm border border-gray-200"
              >
                <BarChart3 className="w-5 h-5 text-gray-500" />
                Statistik
              </button>

              {isAuthenticated && ["admin", "petugas"].includes(user?.role) && (
                 <button
                  onClick={() => { onNavigate("heatmap"); setIsMobileMenuOpen(false); }}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 hover:bg-gray-100 flex items-center gap-3 font-medium text-sm border border-gray-200"
                >
                  <Map className="w-5 h-5 text-gray-500" />
                  Peta Panas
                </button>
              )}

              {isAuthenticated ? (
                <>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-indigo-600 font-medium capitalize mt-0.5">{user.role}</p>
                      </div>
                  </div>

                  <button
                    onClick={() => { onNavigate("new"); setIsMobileMenuOpen(false); }}
                    className="w-full p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-3 font-medium text-sm shadow-sm"
                  >
                    <Send className="w-5 h-5" />
                    Buat Pengaduan
                  </button>

                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="w-full p-3 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium text-sm transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { onNavigate("auth"); setIsMobileMenuOpen(false); }}
                  className="w-full p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-3 font-medium text-sm shadow-sm"
                >
                  <LogIn className="w-5 h-5" />
                  Login
                </button>
              )}
           </div>
        )}
      </div>
    </div>
  );
};
