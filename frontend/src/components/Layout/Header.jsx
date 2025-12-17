
import React, { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Send,
  LogOut,
  LogIn,
  User,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../Common/NotificationBell";

export const Header = ({ onNavigate, currentView }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4">
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
              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                Powered by AI Classification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("stats")}
              className={`p-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
                currentView === "stats"
                  ? "bg-purple-600 text-white shadow-md scale-105"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 hover:scale-105"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Statistik</span>
            </button>

            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => onNavigate("new")}
                  className={`p-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
                    currentView === "new"
                      ? "bg-blue-700 text-white shadow-md transform scale-105"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Buat Pengaduan</span>
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-1 sm:px-4 sm:py-2 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 flex items-center gap-1 sm:gap-3 bg-white/50 backdrop-blur-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-400 flex items-center justify-center text-white">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-semibold text-gray-700 leading-none">{user.name}</span>
                      <span className="text-[10px] text-blue-600 font-medium uppercase tracking-wide mt-1">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <>
                      {/* Backdrop to close when clicking outside */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 border-b border-gray-100 mb-2 sm:hidden">
                           <p className="font-semibold text-gray-800">{user.name}</p>
                           <p className="text-xs text-blue-600 capitalize">{user.role}</p>
                        </div>
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
                className="p-2 sm:px-6 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 font-medium"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
