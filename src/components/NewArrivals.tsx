import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '../services/api';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';

interface NewArrivalsProps {
  onProductClick: (product: Product) => void;
  onAuthRequired: () => void;
}

const NewArrivals: React.FC<NewArrivalsProps> = ({ onProductClick, onAuthRequired }) => {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['newArrivals'],
    queryFn: async () => {
      const allProducts = await productsAPI.getAllProducts();
      // Sort by createdAt in descending order and take first 4
      return allProducts
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 4);
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-96"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 relative inline-block">
            New Arrivals
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Discover our latest additions to the collection, featuring the newest styles and trends.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <ProductCard
                product={product}
                onProductClick={() => onProductClick(product)}
                onAuthRequired={onAuthRequired}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default NewArrivals; 