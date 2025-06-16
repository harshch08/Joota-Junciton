import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { brandsAPI, productsAPI } from '../services/api';
import { Brand, Product } from '../types';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface BrandsPageProps {
  isNavigation?: boolean;
}

const BrandsPage: React.FC<BrandsPageProps> = ({ isNavigation = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  // Check if we're on the homepage
  const isHomePage = location.pathname === '/';

  const { data: brands = [], isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: () => brandsAPI.getAllBrands()
  });

  const { data: allProducts = [], isLoading: allProductsLoading } = useQuery<Product[]>({
    queryKey: ['allProducts', sortBy],
    queryFn: () => productsAPI.getAllProducts({ sortBy: sortBy || 'newest' })
  });

  const { data: brandProducts = [], isLoading: brandProductsLoading } = useQuery<Product[]>({
    queryKey: ['brandProducts', selectedBrand?.name, sortBy],
    queryFn: async () => {
      if (!selectedBrand?.name) return [];
      return productsAPI.getAllProducts({ 
        brand: selectedBrand.name, 
        sortBy: sortBy || 'newest' 
      });
    },
    enabled: !!selectedBrand?.name
  });

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product._id}`);
  };

  const handleAuthRequired = () => {
    // This will be handled by the parent component through the auth modal
  };

  const handleBrandClick = (brand: Brand) => {
    console.log('Brand clicked:', brand);
    if (isNavigation) {
      // If accessed through navigation, navigate to brand page
      if (!brand.slug) {
        const slug = brand.name.toLowerCase().replace(/\s+/g, '-');
        console.log('Generated slug:', slug);
        navigate(`/brand/${slug}`);
      } else {
        console.log('Using existing slug:', brand.slug);
        navigate(`/brand/${brand.slug}`);
      }
    } else {
      // If accessed through homepage/slider, navigate to brand products page
      console.log('Navigating to brand products:', brand.name);
      navigate(`/brand-products/${encodeURIComponent(brand.name)}`);
    }
  };

  // Map brand names to their logo files
  const getBrandLogo = (brandName: string) => {
    const logoMap: { [key: string]: string } = {
      'Nike': 'nike.png',
      'Adidas': 'adidas.png',
      'New Balance': 'new-balance.png',
      'Skechers': 'skechers.png',
      'Crocs': 'crocs.png',
      'Asics': 'asics.png',
      'Louis Vuitton': 'Louis-Vuitton.png',
      'Puma': 'puma.png',
      'Reebok': 'reebok.png'
    };
    return logoMap[brandName] || 'default.png';
  };

  const displayProducts = selectedBrand ? brandProducts : allProducts;
  const isLoading = selectedBrand ? brandProductsLoading : allProductsLoading;

  // Sort products based on sortBy value
  const sortedProducts = [...displayProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
      default:
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Brands Section */}
      <div className="mb-12">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 relative inline-block">
            Brands
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-base md:text-lg">Explore our collection by brand</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {brands.map((brand) => (
            <motion.div
              key={brand._id}
              onClick={() => handleBrandClick(brand)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative aspect-square rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer ${
                !isNavigation && selectedBrand?._id === brand._id ? 'ring-2 ring-black' : ''
              }`}
              role="button"
              tabIndex={0}
              onKeyPress={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleBrandClick(brand);
                }
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-3">
                <img
                  src={`/images/logo/${getBrandLogo(brand.name)}`}
                  alt={brand.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <h3 className="text-white font-medium text-sm truncate">{brand.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Products Section - Only show when not accessed through navigation */}
      {!isNavigation && (
        <div id="products-section" className="mt-8">
          <div className="text-center mb-8 md:mb-16 relative">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 relative inline-block">
              {selectedBrand ? `${selectedBrand.name} Products` : 'All Products'}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-base md:text-lg">
              {selectedBrand 
                ? `Explore our ${selectedBrand.name} collection`
                : 'Explore our complete collection'}
            </p>
            {selectedBrand && (
              <button
                onClick={() => setSelectedBrand(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 mt-4"
              >
                Show All Products
              </button>
            )}
          </div>

          {/* Sort Options */}
          <div className="flex justify-end mb-6">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-low' | 'price-high')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedProducts.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product}
                  onProductClick={handleProductClick}
                  onAuthRequired={handleAuthRequired}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandsPage; 