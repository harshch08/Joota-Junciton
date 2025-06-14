import React, { useState } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const [selectedSize, setSelectedSize] = useState('');
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!selectedSize) {
      setShowSizeSelector(true);
      return;
    }

    addToCart({
      id: product._id || product.id || '',
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: selectedSize,
      brand: product.brand,
    });

    setSelectedSize('');
    setShowSizeSelector(false);
  };

  const handleSizeSelect = (size: number) => {
    setSelectedSize(size.toString());
    setShowSizeSelector(false);
    
    if (user) {
      addToCart({
        id: product._id || product.id || '',
        name: product.name,
        price: product.price,
        image: product.images[0],
        size: size.toString(),
        brand: product.brand,
      });
    }
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
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
      onClick={() => {
        navigate(`/product/${product._id || product.id}`);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.images[0] && product.images[0].startsWith('/uploads/products') ? `http://localhost:5001${product.images[0]}` : product.images[0]}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
        />
        
        {/* Sale Badge */}
        {product.originalPrice && (
          <div className="absolute top-3 left-3 bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            Sale
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!hasAvailableStock() && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent transform transition-transform duration-300 ${
          isHovered ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <button
            onClick={handleAddToCart}
            disabled={!hasAvailableStock()}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
              hasAvailableStock()
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{hasAvailableStock() ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <p className="text-sm text-gray-500 font-medium mb-1">{product.brand}</p>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-black transition-colors truncate">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span style={{ fontWeight: 500, fontSize: '15px' }} className="text-black">{formatIndianCurrency(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">{formatIndianCurrency(product.originalPrice)}</span>
            )}
          </div>
          {product.category && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {product.category}
            </span>
          )}
        </div>
      </div>

      {/* Size Selector */}
      {showSizeSelector && (
        <div 
          className="absolute inset-0 bg-white/95 backdrop-blur-sm p-4 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="text-sm font-semibold mb-3">Select Size</h4>
          <div className="grid grid-cols-3 gap-2">
            {product.sizes && product.sizes.map((sizeObj) => (
              <button
                key={sizeObj.size}
                onClick={() => handleSizeSelect(sizeObj.size)}
                disabled={sizeObj.stock === 0}
                className={`py-2 px-3 border rounded-lg text-sm transition-all duration-200 ${
                  sizeObj.stock === 0
                    ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-black hover:bg-black hover:text-white'
                }`}
              >
                {sizeObj.size}
                {sizeObj.stock === 0 && (
                  <span className="block text-xs text-gray-400">Out</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
