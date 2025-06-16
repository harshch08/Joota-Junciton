import React, { useState } from 'react';
import { API_URL } from '../config';

interface ImageUploaderProps {
  type: 'product' | 'review';
  onUploadComplete: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  type,
  onUploadComplete,
  multiple = false,
  maxFiles = 5
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('images', file);

        const response = await fetch(`${process.env.VITE_API_URL || 'https://jjunction-backend-55hr.onrender.com'}/api/${type === 'product' ? 'admin/products' : 'reviews'}`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }

        const data = await response.json();
        return data.images[0]; // Return the first image URL since we're uploading one at a time
      });

      const urls = await Promise.all(uploadPromises);
      setPreviewUrls(urls);
      onUploadComplete(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
          <input
            type="file"
        accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            disabled={uploading}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {uploading && <p className="text-gray-500 text-sm">Uploading...</p>}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {previewUrls.map((url, index) => (
              <img
              key={index}
                src={url}
              alt={`Preview ${index + 1}`}
              className="w-full h-24 object-cover rounded"
              />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 