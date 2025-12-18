
import React, { useState, useEffect } from "react";
import { Input } from "../Common/Input";
import { Button } from "../Common/Button";
import { Send, MapPin } from "lucide-react";
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
  });
  const [file, setFile] = useState(null);
  const [mapPosition, setMapPosition] = useState(null);

  useEffect(() => {
    // Try to get user's current location
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
          // Default to Jakarta if permission denied or error
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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Lokasi Kejadian
          </label>
          <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative">
            {mapPosition && (
              <MapContainer
                center={mapPosition}
                zoom={13}
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
          <p className="text-xs text-gray-500">
            Klik pada peta untuk menandai lokasi kejadian.
          </p>
        </div>

        <Input
          label="Detail Lokasi (Patokan/Alamat)"
          icon={MapPin}
          value={formData.location_address}
          onChange={(e) => handleChange("location_address", e.target.value)}
          placeholder="Contoh: Depan Toko Maju Jaya, Jl. Sudirman No. 123"
          className="glass-input"
        />

        <ImageUpload onImageSelected={setFile} />

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="is_anonymous"
            checked={formData.is_anonymous || false}
            onChange={(e) => handleChange("is_anonymous", e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="is_anonymous" className="text-sm text-gray-700 select-none">
            Sembunyikan nama saya (Laporan Anonim)
          </label>
        </div>

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
