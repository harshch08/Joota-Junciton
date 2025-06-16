import React, { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_URL } from '../config';
import { Badge } from './ui/badge';

// Indian currency formatter
const formatIndianCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onAuthRequired: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick, onAuthRequired }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleProductClick = () => {
    navigate(`/product/${product._id}`);
  };

  const getAvailableSizes = () => {
    if (!product.sizes) return [];
    return product.sizes.filter(sizeObj => sizeObj.stock > 0);
  };

  const hasAvailableStock = () => {
    return getAvailableSizes().length > 0;
  };

  return (
    <div
      className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleProductClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.images[0]?.startsWith('/uploads/products') ? `${API_URL}${product.images[0]}` : product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
        {product.discountedPrice && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
          </div>
        )}
        <div className="absolute top-2 left-2 z-10">
          {product.featured && (
            <Badge 
              className="bg-black text-white hover:bg-black/90"
            >
              Featured
            </Badge>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2">{product.brand}</p>

        <div className="flex items-center gap-2">
          {product.discountedPrice ? (
            <>
              <span className="text-lg font-bold text-gray-900">
                ₹{product.discountedPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-gray-500 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {product.category && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full mt-2 inline-block">
            {product.category}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
