import React, { useState, useEffect } from "react";
import { Input } from "../Common/Input";
import { Button } from "../Common/Button";
import { Send, MapPin, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { ImageUpload } from "../Common/ImageUpload";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icon in React Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks and update location
const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
};

export const ComplaintForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location_address: "",
    location_lat: null,
    location_lng: null,
    priority: "normal",
    is_anonymous: false,
  });
  const [file, setFile] = useState(null);
  const [mapPosition, setMapPosition] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapPosition({ lat: latitude, lng: longitude });
          setFormData((prev) => ({
            ...prev,
            location_lat: latitude,
            location_lng: longitude,
          }));
        },
        () => {
          setMapPosition({ lat: -6.1751, lng: 106.865 });
        }
      );
    } else {
      setMapPosition({ lat: -6.1751, lng: 106.865 });
    }
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMapClick = (latlng) => {
    setMapPosition(latlng);
    setFormData((prev) => ({
      ...prev,
      location_lat: latlng.lat,
      location_lng: latlng.lng,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, file);
  };

  const priorities = [
    { value: "rendah", label: "Rendah", sla: "120 Jam (5 Hari)", desc: "Dampak terbatas" },
    { value: "normal", label: "Normal", sla: "72 Jam (3 Hari)", desc: "Standar operasional" },
    { value: "tinggi", label: "Tinggi", sla: "48 Jam (2 Hari)", desc: "Mengganggu aktivitas warga" },
    { value: "darurat", label: "Darurat", sla: "24 Jam (1 Hari)", desc: "Risiko bahaya & keselamatan" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <Input
          label="Judul Laporan Pengaduan"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Contoh: Lampu penerangan jalan padam di Jl. Merdeka RT 03"
          required
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>
              Deskripsi Masalah Lengkap <span className="text-rose-500">*</span>
            </span>
            <span className="text-[11px] font-normal text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Auto-kategori AI
            </span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Jelaskan kondisi permasalahan secara jelas, detail, dan sertakan dampak yang dialami lingkungan sekitar."
            rows="4"
            required
            className="w-full p-3 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white leading-relaxed"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Sistem cerdas kami akan menganalisis teks pengaduan secara otomatis untuk memetakan OPD yang bertanggung jawab.
          </p>
        </div>

        {/* Priority & SLA Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Tingkat Urgensi & Target Penyelesaian (SLA)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {priorities.map((p) => {
              const isSelected = formData.priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleChange("priority", p.value)}
                  className={`p-2.5 text-left rounded-lg border transition-all text-xs ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 capitalize">
                      {p.label}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-indigo-700 mt-0.5">
                    Target: {p.sla}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Map */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Titik Koordinat Lokasi Kejadian
          </label>
          <div className="h-60 w-full rounded-lg overflow-hidden border border-slate-200 z-0 relative">
            {mapPosition && (
              <MapContainer
                center={mapPosition}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker
                  position={mapPosition}
                  setPosition={handleMapClick}
                />
              </MapContainer>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Klik pada peta untuk menyesuaikan titik lokasi permasalahan secara presisi.
          </p>
        </div>

        <Input
          label="Detail Lokasi / Patokan Alamat"
          icon={MapPin}
          value={formData.location_address}
          onChange={(e) => handleChange("location_address", e.target.value)}
          placeholder="Contoh: Depan Kantor Pos, Jl. Pemuda No. 45"
        />

        {/* Image Attachment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Foto Bukti Kejadian
          </label>
          <ImageUpload onImageSelected={setFile} />
        </div>

        {/* Whistleblower Anonymous Toggle */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <div>
              <label htmlFor="is_anonymous" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Kirim Sebagai Laporan Anonim
              </label>
              <p className="text-[11px] text-slate-500">
                Nama, email, dan nomor telepon Anda akan dirahasiakan sepenuhnya dari publik.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            id="is_anonymous"
            checked={formData.is_anonymous || false}
            onChange={(e) => handleChange("is_anonymous", e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.title || !formData.description}
            variant="primary"
            icon={Send}
            className="w-full py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
          >
            {loading ? "Mengirim Laporan..." : "Kirimkan Laporan Pengaduan"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintForm;
