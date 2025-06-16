import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Product } from '../types';

interface FeaturedProductsProps {
  products: Product[];
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link 
          key={product._id} 
          to={`/product/${product._id}`}
          className="group relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="relative aspect-square">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 left-2 z-10">
              <Badge 
                className="bg-black text-white hover:bg-black/90"
              >
                Featured
              </Badge>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="text-sm text-gray-500">₹{product.originalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FeaturedProducts; 