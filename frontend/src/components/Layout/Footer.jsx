import React from "react";
import { Heart, Github, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-600 text-sm">
              © 2024 Sistem Pengaduan Warga. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Powered by AI Classification Technology
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="mailto:support@pengaduan.local"
              className="text-gray-600 hover:text-blue-600 transition"
              title="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition"
              title="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <div className="flex items-center gap-1 text-gray-600 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>for Community</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
