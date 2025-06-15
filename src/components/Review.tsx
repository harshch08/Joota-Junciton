import React, { useState } from 'react';
import { Star, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { User, Review as ReviewType } from '../types';

interface ReviewProps {
  review: ReviewType;
  onDelete?: () => void;
  isOwner?: boolean;
}

const Review: React.FC<ReviewProps> = ({ review, onDelete, isOwner }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            {review.user.avatar ? (
              <img
                src={review.user.avatar}
                alt={review.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                {review.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{review.user.name}</h4>
            <div className="flex items-center space-x-1">
              {renderStars(review.rating)}
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(review.createdAt), 'MMM d, yyyy')}
        </div>
      </div>

      <p className="mt-3 text-gray-700">{review.message}</p>

      {review.images && review.images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {review.images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {isOwner && onDelete && (
        <button
          onClick={onDelete}
          className="mt-4 text-sm text-red-600 hover:text-red-700"
        >
          Delete Review
        </button>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Review image"
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default Review; 