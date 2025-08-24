import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAuthRequired: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAuthRequired }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const productId = product.id || product._id;
  
  if (!productId) {
    console.error('Product ID is missing:', product);
    return null;
  }

  const handleAddToCart = () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!selectedSize) {
      alert('Please select a size');
      return;
    }

    const sizeObj = product.sizes?.find(s => s.size === selectedSize);
    if (!sizeObj || sizeObj.stock < quantity) {
      alert(`Sorry, only ${sizeObj?.stock || 0} items available in size ${selectedSize}`);
      return;
    }

    addToCart({
      id: productId,
      name: product.name,
      price: product.price,
      discountedPrice: product.discountedPrice,
      image: product.images[0],
      size: selectedSize.toString(),
      brand: product.brand,
      quantity
    });

    onClose();
  };

  const getAvailableSizes = () => {
    if (!product.sizes) return [];
    return product.sizes.filter(sizeObj => sizeObj.stock > 0);
  };

  const hasAvailableStock = () => {
    return getAvailableSizes().length > 0;
  };

  const getSelectedSizeStock = () => {
    if (!selectedSize || !product.sizes) return 0;
    const sizeObj = product.sizes.find(s => s.size === selectedSize);
    return sizeObj?.stock || 0;
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-8 flex justify-between items-center z-10">
          <div className="flex flex-col space-y-2">
            <h2 className="text-3xl font-bold text-black tracking-tight uppercase">{product.brand}</h2>
            <h3 className="text-xl text-gray-600 font-medium tracking-wide">{product.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8">
            {/* Product Images */}
            <div className="space-y-6">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50 shadow-lg">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
              
              {product.images.length > 1 && (
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={`${productId}-image-${index}`}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === index 
                          ? 'border-black ring-2 ring-gray-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  {product.originalPrice && (
                    <div className="bg-black px-3 py-1.5 rounded-full">
                      <span className="text-sm font-semibold text-white">
                        Save {formatCurrency(product.originalPrice - product.price)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-baseline space-x-4">
                  <span className="text-4xl font-bold text-black">{formatCurrency(product.price)}</span>
                  {product.originalPrice && (
                    <span className="text-2xl text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Select Size</h3>
                <div className="grid grid-cols-4 gap-3">
                  {product.sizes && product.sizes.map((sizeObj) => (
                    <button
                      key={`${productId}-size-${sizeObj.size}`}
                      onClick={() => setSelectedSize(sizeObj.size)}
                      disabled={sizeObj.stock === 0}
                      className={`relative py-4 px-4 border-2 rounded-xl text-center font-medium transition-all duration-200 ${
                        selectedSize === sizeObj.size
                          ? 'border-black bg-black text-white'
                          : sizeObj.stock === 0
                          ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-black hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="text-lg">{sizeObj.size}</div>
                        {sizeObj.stock === 0 ? (
                          <div className="text-xs text-red-500 mt-1">Out of Stock</div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-1">{sizeObj.stock} left</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!selectedSize || getSelectedSizeStock() < 2}
                    className="p-3 border-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-black"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!selectedSize || quantity >= getSelectedSizeStock()}
                    className="p-3 border-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-black"
                  >
                    +
                  </button>
                </div>
                {selectedSize && (
                  <p className="text-sm text-gray-600 mt-3">
                    {getSelectedSizeStock()} items available in size {selectedSize}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!hasAvailableStock() || !selectedSize || quantity > getSelectedSizeStock()}
                  className="w-full bg-black text-white py-5 px-6 rounded-xl font-semibold hover:bg-gray-900 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span className="text-lg">
                    {!hasAvailableStock() 
                      ? 'Out of Stock' 
                      : !selectedSize 
                      ? 'Select Size' 
                      : quantity > getSelectedSizeStock()
                      ? 'Not Enough Stock'
                      : 'Add to Cart'
                    }
                  </span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-lg font-semibold text-black mb-4">Description</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{product.description}</p>
              </div>

              {product.features && product.features.length > 0 && (
                <div className="border-t border-gray-100 pt-8">
                  <h3 className="text-lg font-semibold text-black mb-4">Features</h3>
                  <ul className="space-y-3">
                    {product.features.map((feature, index) => (
                      <li key={`${productId}-feature-${index}`} className="flex items-center text-gray-600 text-lg">
                        <span className="w-2 h-2 bg-black rounded-full mr-4"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;