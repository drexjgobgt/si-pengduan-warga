
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
    <div className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition group"
            onClick={() => onNavigate("home")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Pengaduan Warga
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium hidden sm:block">
                Powered by AI Classification
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
             <button
              onClick={() => onNavigate("stats")}
              className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm ${
                currentView === "stats"
                  ? "bg-purple-600 text-white shadow-md scale-105"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 hover:scale-105"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistik</span>
            </button>

            {isAuthenticated && ["admin", "petugas"].includes(user?.role) && (
              <button
                onClick={() => onNavigate("heatmap")}
                className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm ${
                  currentView === "heatmap"
                    ? "bg-orange-600 text-white shadow-md scale-105"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100 hover:scale-105"
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
                  className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm ${
                    currentView === "new"
                      ? "bg-blue-700 text-white shadow-md transform scale-105"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Buat Pengaduan</span>
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 flex items-center gap-3 bg-white/50 backdrop-blur-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-400 flex items-center justify-center text-white">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-gray-700 leading-none">{user.name}</span>
                      <span className="text-[10px] text-blue-600 font-medium uppercase tracking-wide mt-1">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
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
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 font-medium"
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
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
             >
                <ChevronDown className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
             </button>
          </div>
        </div>

        {/* Mobile Hidden Menu */}
        {isMobileMenuOpen && (
           <div className="md:hidden mt-4 pt-4 border-t border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => { onNavigate("stats"); setIsMobileMenuOpen(false); }}
                className="w-full p-3 rounded-lg bg-purple-50 text-purple-700 flex items-center gap-3 font-medium"
              >
                <BarChart3 className="w-5 h-5" />
                Statistik
              </button>

              {isAuthenticated && ["admin", "petugas"].includes(user?.role) && (
                 <button
                  onClick={() => { onNavigate("heatmap"); setIsMobileMenuOpen(false); }}
                  className="w-full p-3 rounded-lg bg-orange-50 text-orange-700 flex items-center gap-3 font-medium"
                >
                  <Map className="w-5 h-5" />
                  Peta Panas
                </button>
              )}

              {isAuthenticated ? (
                <>
                  <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-400 flex items-center justify-center text-white">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-xs text-blue-600 capitalize">{user.role}</p>
                      </div>
                  </div>

                  <button
                    onClick={() => { onNavigate("new"); setIsMobileMenuOpen(false); }}
                    className="w-full p-3 rounded-lg bg-blue-600 text-white flex items-center gap-3 font-medium"
                  >
                    <Send className="w-5 h-5" />
                    Buat Pengaduan
                  </button>

                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="w-full p-3 rounded-lg bg-red-50 text-red-600 flex items-center gap-3 font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { onNavigate("auth"); setIsMobileMenuOpen(false); }}
                  className="w-full p-3 rounded-lg bg-blue-600 text-white flex items-center gap-3 font-medium"
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
