import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Home, Search, Tag, User, ShoppingCart } from 'lucide-react';

interface BottomNavProps {
  onSearchClick?: () => void;
  showSearch?: boolean;
  onAuthClick?: () => void;
  onCartClick?: () => void;
  onCloseCart?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onSearchClick, showSearch, onAuthClick, onCartClick, onCloseCart }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useCart();
  const { user } = useAuth();
  const cartItemsCount = items.length;

  const handleOrdersClick = () => {
    if (user) {
      navigate('/orders');
    } else if (onAuthClick) {
      onAuthClick();
    }
    // Close cart if open
    if (onCloseCart) {
      onCloseCart();
    }
  };

  const handleCartClick = () => {
    if (user) {
      if (onCartClick) {
        onCartClick();
      }
    } else if (onAuthClick) {
      onAuthClick();
    }
  };

  const navItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: Home,
      matchPath: (path: string) => path === '/',
      onClick: () => {
        navigate('/');
        // Close cart if open
        if (onCloseCart) {
          onCloseCart();
        }
      },
      key: 'home'
    },
    { 
      path: '#', 
      label: 'Search', 
      icon: Search,
      matchPath: (path: string) => showSearch || false,
      onClick: () => {
        onSearchClick?.();
        // Close cart if open
        if (onCloseCart) {
          onCloseCart();
        }
      },
      key: 'search'
    },
    { 
      path: '/brands', 
      label: 'Brands', 
      icon: Tag,
      matchPath: (path: string) => path.startsWith('/brands'),
      onClick: () => {
        navigate('/brands');
        // Close cart if open
        if (onCloseCart) {
          onCloseCart();
        }
      },
      key: 'brands'
    },
    { 
      path: '/orders', 
      label: 'Orders', 
      icon: User,
      matchPath: (path: string) => path === '/orders',
      onClick: handleOrdersClick,
      key: 'orders'
    },
    { 
      path: '#', 
      label: 'Cart', 
      icon: ShoppingCart,
      matchPath: (path: string) => false,
      onClick: handleCartClick,
      showBadge: true,
      key: 'cart'
    },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center md:hidden z-40 px-4">
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl"
        style={{
          width: '100%',
          maxWidth: '500px',
          height: '4rem'
        }}
      >
        <div className="flex justify-around items-center h-full px-2">
          {navItems.map((item) => {
            const isActive = item.matchPath(location.pathname);
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center w-full h-full relative transition-all duration-200"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.2 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative"
                >
                  <item.icon className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-white scale-110' : 'text-gray-400'
                  }`} />
                  
                  {/* Cart Badge - Only show on cart icon */}
                  {item.showBadge && cartItemsCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                    >
                      {cartItemsCount}
                    </motion.div>
                  )}
                </motion.div>
                
                <span className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                  isActive ? 'text-white scale-110' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
};

export default BottomNav; 