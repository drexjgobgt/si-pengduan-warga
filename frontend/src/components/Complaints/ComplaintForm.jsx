import React, { useState } from "react";
import { Input } from "../Common/Input";
import { Button } from "../Common/Button";
import { Send, MapPin, Image as ImageIcon } from "lucide-react";

export const ComplaintForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location_address: "",
    location_lat: null,
    location_lng: null,
    image_url: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-4">
      <Input
        label="Judul Pengaduan"
        value={formData.title}
        onChange={(e) => handleChange("title", e.target.value)}
        placeholder="Contoh: Jalan berlubang di depan gang 5"
        required
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
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      />

      <Input
        label="URL Gambar (Optional)"
        icon={ImageIcon}
        value={formData.image_url}
        onChange={(e) => handleChange("image_url", e.target.value)}
        placeholder="https://example.com/image.jpg"
      />

      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.title || !formData.description}
          variant="primary"
          icon={Send}
          className="flex-1"
        >
          {loading ? "Mengirim..." : "Kirim Pengaduan"}
        </Button>
      </div>
    </div>
  );
};
