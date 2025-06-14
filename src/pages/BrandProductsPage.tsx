import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI, brandsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { Product, Brand } from '../types';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '../components/ui/breadcrumb';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BrandProductsPage: React.FC = () => {
  const { brandName } = useParams<{ brandName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  // Fetch brand data
  const { data: brand, isLoading: brandLoading } = useQuery<Brand>({
    queryKey: ['brand', brandName],
    queryFn: async () => {
      if (!brandName) {
        throw new Error('Brand name is required');
      }
      const brands = await brandsAPI.getAllBrands();
      const foundBrand = brands.find(b => b.name === brandName);
      if (!foundBrand) {
        throw new Error(`Brand not found: ${brandName}`);
      }
      return foundBrand;
    },
    enabled: !!brandName
  });

  // Fetch products for the brand
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['brandProducts', brandName, sortBy],
    queryFn: async () => {
      if (!brandName) return [];
      return productsAPI.getAllProducts({ brand: brandName });
    },
    enabled: !!brandName
  });

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product._id}`);
  };

  const handleAuthRequired = () => {
    // This will be handled by the parent component through the auth modal
  };

  if (brandLoading || productsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index}>
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Brand not found</h1>
          <p className="text-gray-500 mt-2">The brand you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const sortedProducts = [...products].sort((a, b) => {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <BreadcrumbPage>{brand.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{brand.name}</h1>
            {brand.description && (
              <p className="text-gray-600">{brand.description}</p>
            )}
          </div>
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

        {products.length > 0 ? (
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
            <p className="text-gray-500">No products found for this brand.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandProductsPage; 