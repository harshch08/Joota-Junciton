import React, { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { API_URL } from '../config';

interface VisualSearchResult {
  product: Product;
  similarityScore: number;
}

interface VisualSearchResponse {
  results: VisualSearchResult[];
  message?: string;
}

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function postVisualSearch(file: File): Promise<VisualSearchResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/api/visual-search`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Search failed (${response.status})`);
  }

  return response.json();
}

const VisualSearchModal: React.FC<VisualSearchModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation<VisualSearchResponse, Error, File>({
    mutationFn: postVisualSearch,
  });

  const handleClear = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setDismissedError(false);
    mutation.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl, mutation]);

  const handleClose = () => {
    handleClear();
    onClose();
  };

  const validateAndSetFile = (file: File) => {
    setFileError(null);
    setDismissedError(false);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Only JPEG, PNG, and WebP images are supported.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size must be under 10MB.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    mutation.reset();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSearch = () => {
    if (selectedFile) {
      setDismissedError(false);
      mutation.mutate(selectedFile);
    }
  };

  const results = mutation.data?.results ?? [];
  const showError = mutation.isError && !dismissedError;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Visual Search</DialogTitle>
          <DialogDescription>
            Upload a photo of a shoe to find similar products in our store.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Banner */}
          {showError && (
            <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{mutation.error?.message ?? 'Something went wrong. Please try again.'}</span>
              <button
                onClick={() => setDismissedError(true)}
                className="shrink-0 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Drop Zone / Preview */}
          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
                isDragging
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 text-gray-400">
                <Camera className="h-8 w-8" />
                <Upload className="h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Drag &amp; drop an image here, or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  JPEG, PNG, WebP — max 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <img
                src={previewUrl}
                alt="Selected image preview"
                className="mx-auto max-h-64 w-auto object-contain"
              />
            </div>
          )}

          {/* File validation error */}
          {fileError && (
            <p className="text-sm text-red-600">{fileError}</p>
          )}

          {/* Action Buttons */}
          {previewUrl && (
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={mutation.isPending}
                className="flex-1"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={mutation.isPending}>
                Clear
              </Button>
            </div>
          )}

          {/* Results */}
          {mutation.isSuccess && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {results.length > 0
                  ? `Found ${results.length} similar product${results.length !== 1 ? 's' : ''}`
                  : 'No results'}
              </h3>

              {results.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {results.map(({ product }) => (
                    <div key={product._id} onClick={handleClose} className="cursor-pointer">
                      <ProductCard
                        product={product}
                        onProductClick={() => {}}
                        onAuthRequired={() => {}}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-8 text-center">
                  <p className="text-sm text-gray-600">
                    No similar products found. Try{' '}
                    <Link
                      to="/"
                      onClick={handleClose}
                      className="font-medium text-gray-900 underline underline-offset-2 hover:text-gray-700"
                    >
                      browsing by category
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisualSearchModal;
