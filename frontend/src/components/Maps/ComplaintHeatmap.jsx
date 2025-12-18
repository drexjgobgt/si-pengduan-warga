import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { complaintAPI } from "../../services/api";

const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    if (!L.heatLayer) {
      console.error("Leaflet.heat plugin is not loaded");
      return;
    }

    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0, // Maximum intensity
      minOpacity: 0.5,
      gradient: {
        0.4: "blue",
        0.6: "lime",
        0.7: "yellow",
        0.8: "orange",
        1.0: "red",
      },
    }).addTo(map);

    return () => {
      if (map && heat) {
        map.removeLayer(heat);
      }
    };
  }, [points, map]);

  return null;
};

export const ComplaintHeatmap = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        // Fetch specific number of complaints, maybe increase limit
        // Ideally backend should have a specific endpoint for heatmap data to avoid fetching all details
        const response = await complaintAPI.getAll({ limit: 1000 }); 
        const complaints = response.data.data;

        // Filter valid locations and format for heatmap
        const heatPoints = complaints
          .filter((c) => c.location_lat && c.location_lng)
          .map((c) => [
            parseFloat(c.location_lat),
            parseFloat(c.location_lng),
            1, // Intensity (could be based on priority/severity)
          ]);

        setPoints(heatPoints);
      } catch (error) {
        console.error("Failed to fetch heatmap data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Default center (can be improved to center on data points)
  const defaultCenter = [-6.1751, 106.865];

  return (
    <div className="space-y-6">
      <div className="glass-card p-4 sm:p-6 rounded-2xl">
        <h3 className="text-lg sm:text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Peta Persebaran Masalah (Heatmap)
        </h3>
        
        {loading ? (
          <div className="h-64 sm:h-96 flex items-center justify-center bg-gray-100 rounded-xl">
            <p className="text-gray-500">Memuat data peta...</p>
          </div>
        ) : (
          <div className="h-[400px] sm:h-[500px] md:h-[600px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative">
            <MapContainer
              center={defaultCenter}
              zoom={11}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <HeatmapLayer points={points} />
            </MapContainer>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> Rendah
            </div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span> Sedang
            </div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Tinggi
            </div>
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> Padat/Kritis
            </div>
        </div>
      </div>
    </div>
  );
};
