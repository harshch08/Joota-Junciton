import React, { useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { API_URL } from '../config';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  // Prevent body scrolling when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/');
  };

  const handleProductClick = (productId: string) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const itemPrice = item.discountedPrice || item.price;
      return total + (itemPrice * (item.quantity || 1));
    }, 0);
  };

  const handleUpdateQuantity = async (itemId: string, size: string, newQuantity: number) => {
    try {
      // Check stock availability
      const response = await fetch(`${process.env.VITE_API_URL || 'https://jjunction-backend-55hr.onrender.com'}/api/products/${itemId}`);
      if (response.ok) {
        const product = await response.json();
        const sizeObj = product.sizes?.find((s: any) => s.size === parseInt(size));
        
        if (!sizeObj) {
          toast.error(`Size ${size} is not available for this product.`);
          return;
        }
        
        if (sizeObj.stock === 0) {
          toast.error(`Size ${size} is out of stock.`);
          return;
        }
        
        if (sizeObj.stock < newQuantity) {
          toast.error(`Sorry, only ${sizeObj.stock} items available in size ${size}.`);
          return;
        }

        updateQuantity(itemId, size, newQuantity);
      }
    } catch (error) {
      console.error('Error checking stock availability:', error);
      toast.error('Error updating quantity. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Cart Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-[420px] sm:w-[420px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-x-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="h-6 w-6 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Shopping Cart</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 py-12">
                {/* Empty Cart Icon */}
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-gray-50">
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center ring-4 ring-white">
                    <span className="text-sm font-medium text-gray-600">0</span>
                  </div>
                </div>
                
                {/* Empty State Text */}
                <div className="text-center max-w-sm">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">Your cart is empty</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    Looks like you haven't added any items to your cart yet. Start shopping to discover amazing shoes!
                  </p>
                  
                  {/* Continue Shopping Button */}
                  <button
                    onClick={handleContinueShopping}
                    className="inline-flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <span>Continue Shopping</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-6 space-y-4">
                {items.map((item) => (
                  <div 
                    key={`${item.id}-${item.size}`} 
                    className="flex items-center space-x-2 sm:space-x-4 bg-gray-50 p-2 sm:p-4 rounded-xl hover:bg-gray-100 transition-all duration-200 group w-full"
                  >
                    <div 
                      className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 cursor-pointer"
                      onClick={() => handleProductClick(item.id)}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-sm font-medium text-gray-900 truncate break-words max-w-full cursor-pointer hover:text-black transition-colors"
                        onClick={() => handleProductClick(item.id)}
                      >
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-1">{item.brand}</p>
                      {item.discountedPrice ? (
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.discountedPrice)}</p>
                          <p className="text-xs text-gray-500 line-through">{formatCurrency(item.price)}</p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.price)}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Size: {item.size}</p>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.size, (item.quantity || 1) - 1)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        
                        <span className="text-sm font-medium w-6 text-center">{item.quantity || 1}</span>
                        
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.size, (item.quantity || 1) + 1)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => {
                          removeFromCart(item.id, item.size);
                          toast.success('Item removed from cart');
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 p-3 sm:p-6 space-y-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-base font-medium text-gray-600">Total:</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(getTotalPrice())}</span>
              </div>
              
              <button
                onClick={handleCheckout}
                className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Proceed to Checkout</span>
              </button>

              <button
                onClick={handleContinueShopping}
                className="w-full text-gray-600 hover:text-gray-900 py-2.5 text-sm font-medium transition-colors duration-200"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
