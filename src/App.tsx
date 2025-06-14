import React, { useState } from 'react';
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { useScrollToTop } from './hooks/useScrollToTop';
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import BrandPage from "./pages/BrandPage";
import BrandsPage from "./pages/BrandsPage";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderFail from "./pages/OrderFail";
import NotFound from "./pages/NotFound";
import OrdersPage from './pages/OrdersPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import ProductDetails from './pages/ProductDetails';
import BrandProductsPage from './pages/BrandProductsPage';
import CartSidebar from './components/CartSidebar';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Footer from './components/Footer';
import SearchPage from './pages/SearchPage';
import TermsPage from './pages/TermsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Add scroll to top hook
  useScrollToTop();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const toggleCart = () => {
    setShowCart(!showCart);
  };

  const closeCart = () => {
    setShowCart(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {!isAdminRoute && (
        <>
          <Header 
            onSearch={handleSearch}
            onCategorySelect={handleCategorySelect}
            selectedCategory={selectedCategory}
            showMobileSearch={showSearch}
            setShowMobileSearch={setShowSearch}
            showAuthModal={showAuthModal}
            setShowAuthModal={setShowAuthModal}
          />
          <CartSidebar isOpen={showCart} onClose={closeCart} />
        </>
      )}
      
      <div className="flex flex-col flex-grow">
        <main className={`flex-grow ${!isAdminRoute ? 'pb-20 md:pb-0' : ''}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/brand/:brandSlug" element={<BrandPage />} />
            <Route path="/product/:productId" element={<ProductDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/order-fail" element={<OrderFail />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/brand-products/:brandName" element={<BrandProductsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="/admin/products" 
              element={
                <ProtectedAdminRoute>
                  <AdminProducts />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <ProtectedAdminRoute>
                  <AdminOrders />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedAdminRoute>
                  <AdminUsers />
                </ProtectedAdminRoute>
              } 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isAdminRoute && <Footer />}
      </div>
      {!isAdminRoute && (
        <BottomNav 
          onSearchClick={toggleSearch}
          showSearch={showSearch}
          onAuthClick={() => setShowAuthModal(true)}
          onCartClick={toggleCart}
          onCloseCart={closeCart}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AdminProvider>
                <TooltipProvider>
                  <div className="min-h-screen bg-background">
                    <AppContent />
                    <Toaster />
                    <Sonner />
                  </div>
                </TooltipProvider>
              </AdminProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
