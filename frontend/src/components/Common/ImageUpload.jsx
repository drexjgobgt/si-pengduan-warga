
import React, { useState, useRef } from "react";
import { Upload, Camera, X } from "lucide-react";

export const ImageUpload = ({ onImageSelected, currentImage }) => {
  const [preview, setPreview] = useState(currentImage || null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large! Max 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onImageSelected(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onImageSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Foto Bukti (Opsional)</label>
      
      {!preview ? (
        <div className="flex gap-4">
          <div 
            onClick={() => fileInputRef.current.click()}
            className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 glass-input"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Upload Foto</span>
          </div>

          <div 
            onClick={() => cameraInputRef.current.click()}
            className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 glass-input"
          >
            <Camera className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Ambil Foto</span>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden glass shadow-lg group">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
    </div>
  );
};
