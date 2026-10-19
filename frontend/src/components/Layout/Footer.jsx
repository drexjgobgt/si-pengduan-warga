import React from "react";
import { ShieldCheck, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <img
              src="/logo.png"
              alt="Logo SIPW"
              className="h-8 w-auto object-contain hidden sm:block"
              onError={(e) => (e.target.style.display = "none")}
            />
            <div>
              <p className="font-semibold text-slate-800">
                Sistem Informasi Pengaduan Warga (SIPW)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kanal Aspirasi Publik & Tata Kelola Pengaduan Perkotaan Terpadu
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Standar Layanan Publik</span>
            </div>

            <span className="text-slate-300 hidden sm:inline">•</span>

            <a
              href="mailto:pengaduan@pemerintah.go.id"
              className="hover:text-sky-700 transition-colors flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Bantuan & Dukungan</span>
            </a>

            <span className="text-slate-300 hidden sm:inline">•</span>

            <span className="text-slate-400 text-[11px]">
              v2.0 &bull; 2026
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
