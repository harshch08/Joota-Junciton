import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '../services/api';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '../components/ui/breadcrumb';
import { ChevronRight, Home, ShoppingCart, BadgeCheck, Tag, Layers, Star, Package, User, ZoomIn, ZoomOut, ChevronLeft, Share2, Copy, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import ProductCard from '../components/ProductCard';
import Review from '../components/Review';
import ReviewForm from '../components/ReviewForm';
import { motion } from 'framer-motion';
import { API_URL, ENDPOINTS } from '../config';

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const { user } = useAuth();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [addToCartAnim, setAddToCartAnim] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => productsAPI.getProductById(productId || '')
  });

  const { data: reviews = [], isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://jjunction-backend-55hr.onrender.com'}/api/reviews/product/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!productId
  });

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (product) {
      // Check stock availability
      const sizeObj = product.sizes.find(s => s.size.toString() === selectedSize);
      if (!sizeObj) {
        toast.error('Selected size is not available');
        return;
      }
      if (sizeObj.stock === 0) {
        toast.error('This size is out of stock');
        return;
      }

      // Check if adding one more would exceed stock
      const currentCartItem = items.find(
        item => item.id === product._id && item.size === selectedSize
      );
      const currentQuantity = currentCartItem?.quantity || 0;
      if (currentQuantity + 1 > sizeObj.stock) {
        toast.error(`Only ${sizeObj.stock} items available in size ${selectedSize}`);
        return;
      }

      addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images[selectedImage] || product.images[0],
        size: selectedSize,
        brand: product.brand
      });
      setAddToCartAnim(true);
      setTimeout(() => setAddToCartAnim(false), 500);
      toast.success('Added to cart');
    }
  };

  // Fetch related products (same category, exclude current product)
  const { data: relatedProducts = [], isLoading: relatedLoading } = useQuery<Product[]>({
    queryKey: ['relatedProducts', product?.category, product?._id],
    queryFn: () => {
      if (!product?.category) return [];
      return productsAPI.getAllProducts({ category: product.category });
    },
    enabled: !!product?.category,
    select: (products) => products.filter(p => p._id !== product._id).slice(0, 4)
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isZoomed) return;

    if (isDragging) {
      const deltaX = dragStart.x - e.clientX;
      const deltaY = dragStart.y - e.clientY;
      setMousePosition(prev => ({
        x: Math.max(0, Math.min(100, prev.x + (deltaX / imageRef.current!.offsetWidth) * 100)),
        y: Math.max(0, Math.min(100, prev.y + (deltaY / imageRef.current!.offsetHeight) * 100))
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      const { left, top, width, height } = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      setMousePosition({ x, y });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomed) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isZoomed && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isZoomed || !isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = dragStart.x - touch.clientX;
    const deltaY = dragStart.y - touch.clientY;
    
    setMousePosition(prev => ({
      x: Math.max(0, Math.min(100, prev.x + (deltaX / imageRef.current!.offsetWidth) * 100)),
      y: Math.max(0, Math.min(100, prev.y + (deltaY / imageRef.current!.offsetHeight) * 100))
    }));
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
    if (zoomLevel <= 1.5) {
      setIsZoomed(false);
    }
  };

  const handlePrevImage = () => {
    setSelectedImage(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
    setIsZoomed(false);
    setZoomLevel(1);
  };

  const handleNextImage = () => {
    setSelectedImage(prev => (prev === product.images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
    setZoomLevel(1);
  };

  const renderReviews = () => {
    if (reviewsLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No reviews yet. Be the first to review this product!
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {reviews.map((review) => (
          <Review
            key={review._id}
            review={review}
            isOwner={user?._id === review.user._id}
            onDelete={async () => {
              try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://jjunction-backend-55hr.onrender.com'}/api/reviews/${review._id}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                });
                if (!response.ok) throw new Error('Failed to delete review');
                toast.success('Review deleted successfully');
                refetchReviews();
              } catch (error) {
                console.error('Error deleting review:', error);
                toast.error('Failed to delete review');
              }
            }}
          />
        ))}
      </div>
    );
  };

  const renderReviewForm = () => {
    if (!user) {
      return null;
    }

    // Check if user has already reviewed this product
    const hasReviewed = reviews.some(review => review.user._id === user._id);
    if (hasReviewed) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">You have already reviewed this product</p>
        </div>
      );
    }

    // Check if user has purchased and received the product
    const hasPurchased = user.orders?.some(order => 
      order.status === 'delivered' && 
      order.items.some(item => item.product === productId)
    );
    if (!hasPurchased) {
      return null;
    }

    // Find the order ID for this product
    const orderId = user.orders?.find(order => 
      order.status === 'delivered' && 
      order.items.some(item => item.product === productId)
    )?._id || '';

    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
        <ReviewForm 
          productId={productId || ''} 
          orderId={orderId}
          onReviewSubmitted={() => {
            refetchReviews();
            toast.success('Review submitted successfully');
          }} 
        />
      </div>
    );
  };

  // Close share menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = `Check out this product: ${product?.name}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    setShowShareMenu(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading product details. Please try again.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center">
              <Home className="h-4 w-4 mr-1" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/brand-products/${encodeURIComponent(product.brand)}`}>
              {product.brand}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        {/* IMAGE GALLERY */}
        <div className="flex flex-col gap-4 items-center w-full">
          {/* Main Image */}
          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
            <div
              ref={imageRef}
              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={product.images[selectedImage]?.startsWith('/uploads/products') ? `${API_URL}${product.images[selectedImage]}` : product.images[selectedImage]}
                alt={product.name}
                className={`h-full w-full object-contain transition-transform duration-200 ${
                  isZoomed ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-zoom-in'
                }`}
                style={{
                  transform: isZoomed ? `scale(${zoomLevel})` : 'scale(1)',
                  transformOrigin: isZoomed ? `${mousePosition.x}% ${mousePosition.y}%` : 'center',
                }}
              />
              {product.originalPrice && (
                <div className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white">
                  Sale
                </div>
              )}
              
              {/* Share Button */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={handleShare}
                  className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                  title="Share"
                >
                  <Share2 className="h-5 w-5 text-gray-700" />
                </button>
                
                {/* Share Menu */}
                {showShareMenu && (
                  <div
                    ref={shareMenuRef}
                    className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">Share this product</p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={handleCopyLink}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={handleShareWhatsApp}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        Share on WhatsApp
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Image Navigation Buttons */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={handleZoomOut}
                className="rounded-full bg-white/80 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white"
                title="Zoom Out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={handleZoomIn}
                className="rounded-full bg-white/80 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white"
                title="Zoom In"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Image Count Indicator */}
          {product.images.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              {product.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === selectedImage ? 'bg-primary w-4' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        {/* PRODUCT INFO */}
        <div className="space-y-8 bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-gray-100">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-4">
                {product.discountedPrice ? (
                  <>
                    <span className="text-3xl font-bold text-gray-900">
                      ₹{product.discountedPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-yellow-500 font-semibold text-lg">
                <Star className="h-5 w-5" /> {product.rating ? product.rating.toFixed(1) : 'N/A'}
              </span>
            </div>
            <span className="text-gray-500 text-base">by <span className="font-semibold text-gray-700">{product.brand}</span></span>
          </div>
          {/* SIZE SELECTION */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Select Size</h2>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sizeObj) => (
                <button
                  key={sizeObj.size}
                  onClick={() => sizeObj.stock > 0 && setSelectedSize(sizeObj.size.toString())}
                  disabled={sizeObj.stock === 0}
                  className={`px-5 py-2 rounded-full border text-sm font-medium transition-all duration-150 focus:outline-none
                    ${selectedSize === sizeObj.size.toString() ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50 text-gray-800 border-gray-300 hover:border-black'}
                    ${sizeObj.stock === 0 ? 'opacity-50 cursor-not-allowed line-through' : ''}`}
                >
                  {sizeObj.size} {sizeObj.stock === 0 && <span className="text-xs">(Out of Stock)</span>}
                </button>
              ))}
            </div>
          </div>
          {/* ADD TO CART BUTTON */}
          <motion.div animate={addToCartAnim ? { scale: 1.08 } : { scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
            <Button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-3 text-lg font-semibold shadow-md"
              disabled={!selectedSize}
            >
              <ShoppingCart className="h-5 w-5" />
              {selectedSize ? 'Add to Cart' : 'Select Size'}
            </Button>
          </motion.div>
          {/* COLLAPSIBLE SHIPPING & RETURNS FOR MOBILE */}
          <div className="block md:hidden mt-4">
            <details className="bg-gray-50 rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">Shipping & Returns</summary>
              <div className="mt-2 text-gray-600 space-y-2 text-sm">
                <p>Free shipping on all orders over ₹3,000. Standard delivery within 3-5 business days.</p>
                <p>Easy 7-day returns. If you're not completely satisfied with your purchase, you can return it within 7 days of delivery.</p>
                <p>
                  <Link to="/terms" className="text-black hover:underline font-medium">
                    View our full shipping and returns policy →
                  </Link>
                </p>
              </div>
            </details>
          </div>
          {/* DESKTOP SHIPPING & RETURNS */}
          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-gray-900">Shipping & Returns</h2>
            <div className="mt-2 space-y-2 text-gray-600 text-sm">
              <p>Free shipping on all orders over ₹3,000. Standard delivery within 3-5 business days.</p>
              <p>Easy 7-day returns. If you're not completely satisfied with your purchase, you can return it within 7 days of delivery.</p>
              <p>
                <Link to="/terms" className="text-black hover:underline font-medium">
                  View our full shipping and returns policy →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* PRODUCT SPECS & DESCRIPTION */}
      <div className="mt-12 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow p-8 md:p-12 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2"><Layers className="h-6 w-6 text-gray-400" /> Product Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center gap-3 text-gray-700"><Tag className="h-5 w-5 text-gray-400" /> <span className="font-medium w-32">Category:</span> {product.category}</div>
          <div className="flex items-center gap-3 text-gray-700"><BadgeCheck className="h-5 w-5 text-gray-400" /> <span className="font-medium w-32">Brand:</span> {product.brand}</div>
          <div className="flex items-center gap-3 text-gray-700"><Star className="h-5 w-5 text-yellow-400" /> <span className="font-medium w-32">Rating:</span> {product.rating ? product.rating.toFixed(1) : 'N/A'}</div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900">Detailed Description</h3>
        <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
      </div>
      {/* REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>
        {renderReviewForm()}
        <div className="mt-8">
          {renderReviews()}
        </div>
      </section>
      {/* RELATED PRODUCTS */}
      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Related Products</h2>
          <Link
            to="/brands"
            className="text-black hover:text-gray-700 font-medium flex items-center gap-2 transition-colors"
          >
            View All Products
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {relatedLoading ? (
          <div className="text-center py-8">Loading related products...</div>
        ) : relatedProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No related products found.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/product/${product._id}`}>
                  <div className="relative aspect-square">
                    <img
                      src={product.images[0]?.startsWith('/uploads/products') ? `${API_URL}${product.images[0]}` : product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
                    />
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails; 