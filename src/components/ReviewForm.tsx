import React, { useState } from 'react';
import { Star, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { ENDPOINTS, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, MAX_IMAGES_PER_REVIEW } from '../config';

interface ReviewFormProps {
  productId: string;
  orderId: string;
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  orderId,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check file types
    const invalidFiles = files.filter(file => !ALLOWED_IMAGE_TYPES.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > MAX_IMAGE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error('Images must be less than 5MB');
      return;
    }

    if (files.length + images.length > MAX_IMAGES_PER_REVIEW) {
      toast.error(`Maximum ${MAX_IMAGES_PER_REVIEW} images allowed`);
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviewUrls = [...previewUrls];
    newImages.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!message.trim()) {
      toast.error('Please write a review message');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('orderId', orderId);
      formData.append('message', message);
      formData.append('rating', rating.toString());
      images.forEach(image => {
        formData.append('images', image);
      });

      const response = await fetch(`${process.env.VITE_API_URL || 'https://jjunction-backend-55hr.onrender.com'}/api/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      toast.success('Review submitted successfully');
      onReviewSubmitted();
      setRating(0);
      setMessage('');
      setImages([]);
      setPreviewUrls([]);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your review here..."
          className="min-h-[100px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Images (optional, max {MAX_IMAGES_PER_REVIEW})
        </label>
        <div className="flex flex-wrap gap-2">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {previewUrls.length < MAX_IMAGES_PER_REVIEW && (
            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400">
              <input
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={handleImageChange}
                className="hidden"
                multiple
              />
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </label>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
};

export default ReviewForm; 