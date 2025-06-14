import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Settings, LogOut, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useAdmin } from '../contexts/AdminContext';
import { useQuery } from '@tanstack/react-query';
import { brandsAPI, productsAPI } from '../services/api';
import { Brand, Product } from '../types';
import AuthModal from './AuthModal';
import CartSidebar from './CartSidebar';
import AnnouncementBar from './AnnouncementBar';
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'sonner';

interface HeaderProps {
  onSearch: (query: string) => void;
  onCategorySelect: (category: string) => void;
  selectedCategory: string;
  showMobileSearch?: boolean;
  setShowMobileSearch?: (show: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  selectedCategory, 
  showMobileSearch = false,
  setShowMobileSearch,
  showAuthModal,
  setShowAuthModal
}) => {
  const { user, logout } = useAuth();
  const { adminUser, isAdmin } = useAdmin();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCart, setShowCart] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: brands = [], isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: () => brandsAPI.getAllBrands()
  });

  const { data: searchSuggestions = [], isLoading: suggestionsLoading } = useQuery<Product[]>({
    queryKey: ['searchSuggestions', debouncedSearchQuery],
    queryFn: () => {
      if (debouncedSearchQuery.length < 2) return Promise.resolve([]);
      return productsAPI.getAllProducts({ search: debouncedSearchQuery });
    },
    enabled: debouncedSearchQuery.length >= 2
  });

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSuggestions(false);
      if (setShowMobileSearch) {
        setShowMobileSearch(false);
      }
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionClick = (product: Product) => {
    setSearchQuery(product.name);
    onSearch(product.name);
    setShowSuggestions(false);
    if (setShowMobileSearch) {
      setShowMobileSearch(false);
    }
    // Navigate to search results page
    navigate(`/search?q=${encodeURIComponent(product.name)}`);
  };

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSuggestions(false);
      if (setShowMobileSearch) {
        setShowMobileSearch(false);
      }
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCartClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowCart(true);
    }
  };

  const handleBrandClick = (brandId: string) => {
    const brand = brands.find(b => b._id === brandId);
    if (brand) {
      navigate(`/brand-products/${brand.name}`);
    }
    setShowMobileMenu(false);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleAdminClick = () => {
    navigate('/admin/dashboard');
  };

  const handleMobileSearchClick = () => {
    if (setShowMobileSearch) {
      setShowMobileSearch(!showMobileSearch);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <AnnouncementBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header Row */}
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <button
                onClick={handleLogoClick}
                className="flex items-center"
              >
                <img
                  src="/logo.png"
                  alt="Joota Junction"
                  className="h-32 w-auto"
                />
              </button>
            </div>

            {/* Desktop Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center flex-1 max-w-xl mx-8">
              <div className="relative w-full flex items-center search-container">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search for shoes, brands, categories..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <button
                  type="submit"
                  onClick={handleSearchClick}
                  className="ml-3 bg-black text-white px-6 py-3.5 rounded-full hover:bg-gray-800 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                  Search
                </button>

                {/* Search Suggestions */}
                {showSuggestions && searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                    {suggestionsLoading ? (
                      <div className="p-4 text-center text-gray-500">Loading suggestions...</div>
                    ) : searchSuggestions.length > 0 ? (
                      <div className="py-2">
                        {searchSuggestions.map((product) => (
                          <button
                            key={product._id}
                            onClick={() => handleSuggestionClick(product)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                          >
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">₹{product.price.toLocaleString()}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">No results found</div>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Admin Dashboard Button */}
              {isAdmin && (
                <button
                  onClick={handleAdminClick}
                  className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 border border-gray-200"
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium text-sm">Admin</span>
                </button>
              )}

              {/* User Menu */}
              {user ? (
                <div className="relative group">
                  <div className="flex items-center" title={user.name}>
                    <User className="h-6 w-6 text-gray-700" />
                  </div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 border-b border-gray-100 text-center">
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                    <button
                      onClick={() => navigate('/orders')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors flex items-center"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      My Orders
                    </button>
                    <button
                      onClick={logout}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Sign In</span>
                </button>
              )}

              {/* Cart */}
              <button
                onClick={handleCartClick}
                className="relative flex items-center text-gray-700 hover:text-black transition-colors p-2 rounded-lg hover:bg-gray-50"
              >
                <ShoppingCart className="h-6 w-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-4">
              {/* Mobile Search Icon */}
              <button
                onClick={handleMobileSearchClick}
                className="text-gray-700 hover:text-black transition-colors"
              >
                <Search className="h-6 w-6" />
              </button>

              {/* Mobile Admin Button */}
              {isAdmin && (
                <button
                  onClick={handleAdminClick}
                  className="flex items-center text-gray-700 hover:text-black transition-colors"
                >
                  <Settings className="h-6 w-6" />
                </button>
              )}

              {/* Mobile Cart */}
              <button
                onClick={handleCartClick}
                className="relative flex items-center text-gray-700 hover:text-black transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-gray-700 hover:text-blue-600 transition-colors p-1"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {showMobileSearch && (
            <form onSubmit={handleSearchSubmit} className="lg:hidden py-4 border-t border-gray-100">
              <div className="relative w-full flex items-center search-container">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search for shoes..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <button
                  type="submit"
                  onClick={handleSearchClick}
                  className="ml-3 bg-black text-white px-5 py-3.5 rounded-full hover:bg-gray-800 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                  Search
                </button>

                {/* Mobile Search Suggestions */}
                {showSuggestions && searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                    {suggestionsLoading ? (
                      <div className="p-4 text-center text-gray-500">Loading suggestions...</div>
                    ) : searchSuggestions.length > 0 ? (
                      <div className="py-2">
                        {searchSuggestions.map((product) => (
                          <button
                            key={product._id}
                            onClick={() => handleSuggestionClick(product)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                          >
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">₹{product.price.toLocaleString()}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">No results found</div>
                    )}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            
            {/* Mobile Menu */}
            <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Mobile Menu Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Mobile User Section */}
              {user ? (
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="flex flex-col items-center justify-center text-center" title={user.name}>
                      <User className="h-6 w-6 text-gray-700" />
                      <span className="mt-1 font-medium text-gray-900">{user.name}</span>
                    </div>
                    <div className="flex flex-col mt-2">
                      <button
                        onClick={() => {
                          navigate('/orders');
                          setShowMobileMenu(false);
                        }}
                        className="w-full text-left text-sm text-black hover:text-gray-700 flex items-center px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        My Orders
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowMobileMenu(false);
                        }}
                        className="w-full text-left text-sm text-black hover:text-gray-700 flex items-center px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center space-x-3 w-full text-left py-3 px-4 rounded-lg bg-blue-50 text-blue-600 font-medium"
                >
                  <User className="h-5 w-5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Admin Section */}
              {isAdmin && (
                <div className="pb-4 border-b border-gray-100">
                  <button
                    onClick={() => {
                      handleAdminClick();
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center space-x-3 w-full text-left py-3 px-4 rounded-lg bg-purple-50 text-purple-600 font-medium"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Admin Dashboard</span>
                  </button>
                </div>
              )}

                  {/* Mobile Brands */}
              <nav className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Brands</p>
                    {brands.map((brand) => (
                  <button
                        key={brand._id}
                        onClick={() => handleBrandClick(brand._id)}
                        className="block w-full text-left py-3 px-4 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors border-b border-gray-100"
                  >
                        {brand.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
            </div>
          </>
        )}
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <CartSidebar isOpen={showCart} onClose={() => setShowCart(false)} />
    </>
  );
};

export default Header;
