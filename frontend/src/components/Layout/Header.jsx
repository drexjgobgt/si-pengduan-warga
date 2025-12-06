import React from "react";
import {
  AlertCircle,
  BarChart3,
  Send,
  LogOut,
  LogIn,
  User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../Common/NotificationBell";

export const Header = ({ onNavigate, currentView }) => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
            onClick={() => onNavigate("home")}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Pengaduan Warga
              </h1>
              <p className="text-xs text-gray-500">
                Powered by AI Classification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("stats")}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                currentView === "stats"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
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
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    currentView === "new"
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Buat Pengaduan</span>
                </button>

                <div className="relative group">
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded capitalize">
                      {user.role}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block">
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={() => onNavigate("auth")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
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
