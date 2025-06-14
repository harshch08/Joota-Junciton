import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '../services/api';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '../components/ui/breadcrumb';
import { ChevronRight, Home, ShoppingCart, BadgeCheck, Tag, Layers, Star, Package, User, ZoomIn, ZoomOut, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import { API_URL } from '../config';

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [addToCartAnim, setAddToCartAnim] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => productsAPI.getProductById(productId || '')
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/reviews/${productId}`);
      const data = await response.json();
      return data.reviews || [];
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
      addToCart({
        id: product._id || product.id || '',
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
    select: (products) => products.filter(p => (p._id || p.id) !== (product._id || product.id)).slice(0, 4)
  });

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 1));
  };

  const handleNextImage = () => {
    setSelectedImage(prev => (prev + 1) % product.images.length);
  };

  const handlePrevImage = () => {
    setSelectedImage(prev => (prev - 1 + product.images.length) % product.images.length);
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
          <div className="relative w-full h-[300px] md:h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={product.images[selectedImage]?.startsWith('/uploads/products') ? `${API_URL}${product.images[selectedImage]}` : product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-contain"
            />
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
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight flex items-center gap-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl md:text-3xl font-bold text-black">₹{product.price}</span>
              {product.rating && (
                <span className="flex items-center gap-1 text-yellow-500 font-semibold text-lg">
                  <Star className="h-5 w-5" /> {product.rating.toFixed(1)}
                </span>
              )}
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
                <p>Free shipping on all orders over ₹2,000. Standard delivery within 3-5 business days.</p>
                <p>Easy 30-day returns. If you're not completely satisfied with your purchase, you can return it within 30 days of delivery.</p>
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
              <p>Free shipping on all orders over ₹2,000. Standard delivery within 3-5 business days.</p>
              <p>Easy 30-day returns. If you're not completely satisfied with your purchase, you can return it within 30 days of delivery.</p>
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
      <div className="mt-12 bg-white rounded-2xl shadow p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Star className="h-6 w-6 text-yellow-400" /> Product Reviews</h2>
        </div>
        {reviewsLoading ? (
          <div>Loading reviews...</div>
        ) : !reviewsData || reviewsData.length === 0 ? (
          <div className="text-gray-500">No reviews yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviewsData.map((review, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6 shadow border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-lg">
                    {review.user?.avatar ? (
                      <img src={review.user.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      (review.user?.name || 'A')[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</div>
                    <div className="flex items-center text-yellow-500">
                      {[1,2,3,4,5].map(star => (
                        <span key={star}>{review.rating >= star ? '★' : '☆'}</span>
                      ))}
                      <span className="ml-2 text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-gray-700 mb-2">{review.message}</div>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {review.images.map((img: string, i: number) => (
                      <img
                        key={i}
                        src={img.startsWith('/uploads/reviews') ? `${import.meta.env.VITE_API_URL}${img}` : img}
                        alt="review"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* RELATED PRODUCTS */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        {relatedLoading ? (
          <div className="text-center py-8">Loading related products...</div>
        ) : relatedProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No related products found.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((product) => (
              <div key={product._id || product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/product/${product._id || product.id}`}>
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