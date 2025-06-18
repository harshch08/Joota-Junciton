import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsAPI, categoriesAPI } from '../services/api';
import { Product, Category } from '../types';

const priceRanges = [
  { label: 'Under ₹2,000', min: 0, max: 2000 },
  { label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
  { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 - ₹15,000', min: 10000, max: 15000 },
  { label: 'Over ₹15,000', min: 15000, max: Infinity },
];

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  selectedBrand: string;
  selectedPriceRange: string;
  onCategoryChange: (category: string) => void;
  onBrandChange: (brand: string) => void;
  onPriceRangeChange: (range: string) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  selectedBrand,
  selectedPriceRange,
  onCategoryChange,
  onBrandChange,
  onPriceRangeChange,
}) => {
  const [tempCategory, setTempCategory] = useState(selectedCategory);
  const [tempBrand, setTempBrand] = useState(selectedBrand);
  const [tempPriceRange, setTempPriceRange] = useState(selectedPriceRange);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAllProducts()
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAllCategories()
  });

  // Get unique brands from products
  const brands = ['All', ...new Set(products.map(product => product.brand).filter(Boolean))];

  const handleApplyFilters = () => {
    onCategoryChange(tempCategory);
    onBrandChange(tempBrand);
    onPriceRangeChange(tempPriceRange);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl">
            <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
              {/* Categories */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setTempCategory('All')}
                    className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempCategory === 'All'
                        ? 'text-white bg-black'
                        : 'text-gray-700 hover:text-black hover:bg-gray-100'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => setTempCategory(category.name)}
                      className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tempCategory === category.name
                          ? 'text-white bg-black'
                          : 'text-gray-700 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Brands</h3>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setTempBrand(brand)}
                      className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tempBrand === brand
                          ? 'text-white bg-black'
                          : 'text-gray-700 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Ranges */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Price Range</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setTempPriceRange('All')}
                    className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempPriceRange === 'All'
                        ? 'text-white bg-black'
                        : 'text-gray-700 hover:text-black hover:bg-gray-100'
                    }`}
                  >
                    All Prices
                  </button>
                  {priceRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => setTempPriceRange(range.label)}
                      className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tempPriceRange === range.label
                          ? 'text-white bg-black'
                          : 'text-gray-700 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
              <button
                onClick={handleApplyFilters}
                className="w-full bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
