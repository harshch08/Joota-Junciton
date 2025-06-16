import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI, brandsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import AuthModal from '../components/AuthModal';
import ProductModal from '../components/ProductModal';
import { Product, Brand } from '../types';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '../components/ui/breadcrumb';
import { ChevronRight, Home } from 'lucide-react';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const priceRanges = [
  { label: 'Under ₹2,000', min: 0, max: 2000 },
  { label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
  { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 - ₹15,000', min: 10000, max: 15000 },
  { label: 'Over ₹15,000', min: 15000, max: Infinity },
];

const BrandPage: React.FC = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  // Add validation for brandSlug
  useEffect(() => {
    if (!brandSlug) {
      navigate('/brands');
    }
  }, [brandSlug, navigate]);

  // Scroll to top when component mounts or brandSlug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [brandSlug]);

  const { data: brand, isLoading: brandLoading, error: brandError } = useQuery<Brand>({
    queryKey: ['brand', brandSlug],
    queryFn: async () => {
      if (!brandSlug) {
        throw new Error('Brand slug is required');
      }
      console.log('Fetching brand data for slug:', brandSlug);
      try {
        const brands = await brandsAPI.getAllBrands();
        const foundBrand = brands.find(b => 
          b.slug === brandSlug || 
          b.name.toLowerCase().replace(/\s+/g, '-') === brandSlug
        );
        if (!foundBrand) {
          throw new Error(`Brand not found for slug: ${brandSlug}`);
        }
        console.log('Found brand:', foundBrand);
        return foundBrand;
      } catch (error) {
        console.error('Error fetching brand:', error);
        throw error;
      }
    },
    enabled: !!brandSlug,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false
  });

  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ['products', brand?.name, sortBy],
    queryFn: async () => {
      if (!brand?.name) {
        console.log('No brand name available, returning empty products array');
        return [];
      }
      console.log('Fetching products for brand:', brand.name);
      try {
        const products = await productsAPI.getAllProducts({ brand: brand.name });
        console.log('Products fetched successfully:', products);
        return products;
      } catch (error) {
        console.error('Error fetching products for brand:', brand.name, error);
        throw error;
      }
    },
    enabled: !!brand?.name,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false
  });

  const categories = ['All', ...new Set(products.map(product => product.category))];

  useEffect(() => {
    if (brandError) {
      console.error('Error loading brand:', brandError);
    }
    if (productsError) {
      console.error('Error loading products:', productsError);
    }
  }, [brandError, productsError]);

  useEffect(() => {
    if (brand) {
      console.log('Brand loaded:', brand);
    }
  }, [brand]);

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product._id}`);
  };

  const handleAuthRequired = () => {
    // This will be handled by the parent component through the auth modal
  };

  const getBrandLogo = (brandName: string) => {
    const logoMap: { [key: string]: string } = {
      'Nike': 'nike.png',
      'Adidas': 'adidas.png',
      'New Balance': 'new balance.png',
      'Skechers': 'skechers.png',
      'Crocs': 'crocs.png',
      'Asics': 'asics.png',
      'Louis Vuitton': 'Louis Vuitton.png'
    };
    return logoMap[brandName] || 'pngwing.com.png';
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

  if (brandError || !brand) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Brand not found</h1>
          <p className="text-gray-500 mt-2">The brand you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/brands')}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Brands
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
              <BreadcrumbLink href="/brands">Brands</BreadcrumbLink>
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
          <button
            onClick={() => setIsFilterOpen(true)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Filter
          </button>
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

      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedCategory={selectedCategory}
        selectedBrand={brand.name}
        selectedPriceRange={selectedPriceRange}
        onCategoryChange={(category) => {
          setSelectedCategory(category);
        }}
        onBrandChange={() => {}}
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

      <Footer />
    </div>
  );
};

export default BrandPage; 