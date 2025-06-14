import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Filter, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import BrandCard from '../components/BrandCard';
import SearchResults from '../components/SearchResults';
import ProductModal from '../components/ProductModal';
import FilterSidebar from '../components/FilterSidebar';
import AuthModal from '../components/AuthModal';
import { productsAPI, brandsAPI } from '../services/api';
import { Product, Brand } from '../types';
import FeaturedProductCard from '../components/FeaturedProductCard';
import AboutUs from '../components/AboutUs';
import Banner from '../components/Banner';
import BrandSlider from '../components/BrandSlider';
import ScrollSection from '../components/ScrollSection';
import NewArrivals from '../components/NewArrivals';
import { useNavigate } from 'react-router-dom';

const priceRanges = [
  { label: 'Under ₹2,000', min: 0, max: 2000 },
  { label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
  { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 - ₹15,000', min: 10000, max: 15000 },
  { label: 'Over ₹15,000', min: 15000, max: Infinity },
];

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', searchQuery, selectedCategory, selectedBrand, selectedPriceRange],
    queryFn: () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedBrand !== 'All') params.brand = selectedBrand;
      if (selectedPriceRange !== 'All') {
        const range = priceRanges.find(r => r.label === selectedPriceRange);
        if (range) {
          params.minPrice = range.min;
          params.maxPrice = range.max;
        }
      }
      return productsAPI.getAllProducts(params);
    },
    enabled: !isSearching // Only fetch products when not searching
  });

  const { data: searchResults = [], isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['search', currentSearchQuery],
    queryFn: () => {
      const params: any = {};
      if (currentSearchQuery) params.search = currentSearchQuery;
      return productsAPI.getAllProducts(params);
    },
    enabled: isSearching && !!currentSearchQuery // Only fetch search results when searching
  });

  const { data: brands = [], isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: () => brandsAPI.getAllBrands()
  });

  // Filter brands to show only specific ones
  const filteredBrands = useMemo(() => {
    if (!Array.isArray(brands)) return [];
    const targetBrands = ['Nike', 'Puma', 'Adidas', 'New Balance'];
    return brands.filter(brand => targetBrands.includes(brand.name));
  }, [brands]);

  const featuredProducts = Array.isArray(products) ? products.filter(product => product.featured) : [];

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-slide functionality for mobile
  useEffect(() => {
    if (!isMobile || featuredProducts.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % featuredProducts.length;
        
        // Scroll to the next slide
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const slideWidth = container.children[0]?.clientWidth || 320;
          const gap = 24; // 6 * 4 (gap-6 = 1.5rem = 24px)
          const scrollPosition = next * (slideWidth + gap);
          
          container.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
          });
        }
        
        return next;
      });
    }, 3000); // Changed from 5000 to 3000 (3 seconds)

    return () => clearInterval(interval);
  }, [isMobile, featuredProducts.length]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setIsSearching(true);
      setCurrentSearchQuery(query);
    } else {
      setIsSearching(false);
      setCurrentSearchQuery('');
    }
  };

  const handleBackToHome = () => {
    setIsSearching(false);
    setCurrentSearchQuery('');
    setSearchQuery('');
  };

  // If searching, show search results
  if (isSearching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SearchResults
          searchQuery={currentSearchQuery}
          products={searchResults}
          isLoading={searchLoading}
          error={searchError}
          onBackToHome={handleBackToHome}
          onAuthRequired={() => setShowAuthModal(true)}
        />
      </div>
    );
  }

  // Show homepage content
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading products. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Banner Section */}
      <Banner />

      {/* Shop by Brand Section */}
      <ScrollSection className="py-12 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 relative inline-block">
              Shop by Brand
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-base md:text-lg">Discover our curated collection of premium brands, each bringing their unique style and quality to your wardrobe.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {filteredBrands.map((brand) => (
              <BrandCard
                key={brand._id}
                brand={brand}
              />
            ))}
          </div>
          <div className="flex justify-end mt-8">
            <button
              onClick={() => navigate('/brands')}
              className="inline-flex items-center px-6 py-3 border border-black text-base font-medium rounded-md shadow-sm text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              View All Brands
            </button>
          </div>
        </div>
      </ScrollSection>

      {/* Featured Products Section */}
      <ScrollSection id="featured-section" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 relative inline-block">
              Featured Products
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-base md:text-lg">Explore our handpicked selection of trending styles and must-have pieces for your collection.</p>
          </div>
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide"
          >
            {featuredProducts.map((product) => (
              <div key={product._id} className="flex-shrink-0 w-[280px]">
                <FeaturedProductCard
                  product={product}
                  onProductClick={setSelectedProduct}
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* Brand Slider Section */}
      <ScrollSection id="brand-slider" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 relative inline-block">
              Our Brands
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
            </h2>
          </div>
          <BrandSlider />
        </div>
      </ScrollSection>

      <ScrollSection id="new-arrivals" className="py-12 bg-white">
        <NewArrivals 
          onProductClick={setSelectedProduct}
          onAuthRequired={() => setShowAuthModal(true)}
        />
      </ScrollSection>

      {/* Main Content */}
      <ScrollSection className="py-12 md:py-16 bg-gray-50" threshold={0.05}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* All Products */}
        <section id="all-products">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 relative inline-block">
              All Products
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-base md:text-lg">Browse our complete collection of premium footwear, from classic styles to the latest trends.</p>
          </div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Showing {products.length} products</span>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-600"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onProductClick={() => setSelectedProduct(product)}
                onAuthRequired={() => setShowAuthModal(true)}
              />
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found matching your search criteria.</p>
            </div>
          )}
        </section>
        </div>
      </ScrollSection>

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

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAuthRequired={() => setShowAuthModal(true)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* About Us Section */}
      <AboutUs />
    </div>
  );
};

export default Index;

