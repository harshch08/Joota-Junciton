import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import AuthModal from '../components/AuthModal';
import ProductModal from '../components/ProductModal';
import { Product } from '../types';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '../components/ui/breadcrumb';
import { ChevronRight, Home } from 'lucide-react';

const priceRanges = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $150', min: 100, max: 150 },
  { label: '$150 - $200', min: 150, max: 200 },
  { label: 'Over $200', min: 200, max: Infinity },
];

const CategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category || 'All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll to top when component mounts or category changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category]);

  // Update selectedCategory when URL parameter changes
  useEffect(() => {
    if (category) {
      setSelectedCategory(category.charAt(0).toUpperCase() + category.slice(1));
    }
  }, [category]);

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: [
      'products',
      {
        search: searchQuery,
        category: selectedCategory,
        brand: selectedBrand,
        priceRange: selectedPriceRange,
      },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, any];
      return productsAPI.getAllProducts(params);
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Filter products based on selected filters
  const filteredProducts = (products as Product[]).filter(product => {
    const matchesCategory = selectedCategory === 'All' || 
      product.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesBrand = selectedBrand === 'All' || product.brand === selectedBrand;
    const matchesPrice = selectedPriceRange === 'All' || 
      priceRanges.find(range => range.label === selectedPriceRange)?.min <= product.price &&
      priceRanges.find(range => range.label === selectedPriceRange)?.max >= product.price;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesBrand && matchesPrice && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    console.error('Error in CategoryPage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">There was a problem loading the products. Please try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
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
              <BreadcrumbPage>{selectedCategory}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedCategory === 'All' ? 'All Products' : selectedCategory}
          </h1>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Filter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onProductClick={() => setSelectedProduct(product)}
              onAuthRequired={() => setIsAuthModalOpen(true)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found matching your filters.</p>
          </div>
        )}
      </div>

      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedCategory={selectedCategory}
        selectedBrand={selectedBrand}
        selectedPriceRange={selectedPriceRange}
        onCategoryChange={(category) => {
          setSelectedCategory(category);
          if (category === 'All') {
            navigate('/');
          } else {
            navigate(`/category/${category.toLowerCase()}`);
          }
        }}
        onBrandChange={setSelectedBrand}
        onPriceRangeChange={setSelectedPriceRange}
      />

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAuthRequired={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default CategoryPage;
