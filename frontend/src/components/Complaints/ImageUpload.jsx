import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { complaintAPI } from '../../services/api';

export default function ImageUpload({ complaintId, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diizinkan');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const fileInput = document.getElementById(`image-upload-${complaintId}`);
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Pilih file terlebih dahulu');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      await complaintAPI.uploadImage(complaintId, formData);
      
      alert('Gambar berhasil diupload');
      setPreview(null);
      fileInput.value = '';
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <div className="flex items-center justify-center space-x-4">
        <div className="flex-1">
          <label
            htmlFor={`image-upload-${complaintId}`}
            className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <Upload className="w-5 h-5" />
            <span>Pilih Gambar</span>
          </label>
          <input
            id={`image-upload-${complaintId}`}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 object-cover rounded"
            />
            <button
              onClick={() => {
                setPreview(null);
                document.getElementById(`image-upload-${complaintId}`).value = '';
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!preview || uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

