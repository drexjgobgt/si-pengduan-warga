
import React, { useState } from "react";
import { Input } from "../Common/Input";
import { Button } from "../Common/Button";
import { Send, MapPin } from "lucide-react";
import { ImageUpload } from "../Common/ImageUpload";

export const ComplaintForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location_address: "",
  });
  const [file, setFile] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, file);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Buat Pengaduan Baru
        </h3>
        
        <Input
          label="Judul Pengaduan"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Contoh: Jalan berlubang di depan gang 5"
          required
          className="glass-input"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi Detail <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Jelaskan masalahnya secara detail. AI akan otomatis mengklasifikasikan kategori pengaduan Anda."
            rows="5"
            required
            className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent glass-input"
          />
          <p className="text-sm text-gray-500 mt-2">
            💡 Tip: Semakin detail deskripsi, semakin akurat klasifikasi AI
          </p>
        </div>

        <Input
          label="Lokasi"
          icon={MapPin}
          value={formData.location_address}
          onChange={(e) => handleChange("location_address", e.target.value)}
          placeholder="Contoh: Jl. Sudirman No. 123, Kelurahan X"
          className="glass-input"
        />

        <ImageUpload onImageSelected={setFile} />

        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.title || !formData.description}
            variant="primary"
            icon={Send}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transform hover:-translate-y-1 transition-all duration-300"
          >
            {loading ? "Mengirim..." : "Kirim Pengaduan"}
          </Button>
        </div>
      </div>
    </div>
  );
};
