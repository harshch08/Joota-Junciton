import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/category/${category.name.toLowerCase()}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-200 hover:border-blue-300"
    >
      <div className="relative h-24 sm:h-28 overflow-hidden">
        <img
          src={category.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop'}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="text-white font-bold text-sm sm:text-base mb-1">{category.name}</h3>
          <p className="text-white/90 text-xs line-clamp-1">{category.description}</p>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard; 