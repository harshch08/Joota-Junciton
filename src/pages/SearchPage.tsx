import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '../services/api';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { ArrowLeft, Filter } from 'lucide-react';
import FilterSidebar from '../components/FilterSidebar';
import ProductModal from '../components/ProductModal';
import { useAuth } from '../contexts/AuthContext';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');

  const searchQuery = searchParams.get('q') || '';

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['search', searchQuery, selectedCategory, selectedBrand, selectedPriceRange],
    queryFn: () => {
      const params: any = { search: searchQuery };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedBrand !== 'All') params.brand = selectedBrand;
      if (selectedPriceRange !== 'All') {
        const [min, max] = selectedPriceRange.split('-').map(Number);
        params.minPrice = min;
        params.maxPrice = max;
      }
      return productsAPI.getAllProducts(params);
    },
    enabled: !!searchQuery
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Searching for "{searchQuery}"...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error searching for "{searchQuery}". Please try again.</p>
          <button
            onClick={handleBackToHome}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Results Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors p-2 rounded-lg hover:bg-gray-50 group"
              >
                <ArrowLeft className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Home</span>
              </button>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Search Results
              </h1>
              <div className="flex items-center space-x-2">
                <p className="text-gray-600">
                  Showing results for
                </p>
                <span className="text-black font-medium">
                  "{searchQuery}"
                </span>
                <span className="text-gray-400">•</span>
                <p className="text-gray-600">
                  {products.length} product{products.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onProductClick={handleProductClick}
                onAuthRequired={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any products matching "{searchQuery}". Try adjusting your search terms or browse our categories.
              </p>
              <button
                onClick={handleBackToHome}
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Back to Homepage
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        selectedCategory={selectedCategory}
        selectedBrand={selectedBrand}
        selectedPriceRange={selectedPriceRange}
        onCategoryChange={setSelectedCategory}
        onBrandChange={setSelectedBrand}
        onPriceRangeChange={setSelectedPriceRange}
      />

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAuthRequired={() => {}}
      />
    </div>
  );
};

export default SearchPage; 