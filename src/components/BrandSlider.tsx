import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { brandsAPI } from '../services/api';
import { Brand } from '../types';
import ScrollSection from './ScrollSection';

// Brand to logo image mapping
const brandLogos = {
  'Nike': '/images/logo/nike.png',
  'Puma': '/images/logo/puma.png',
  'Adidas': '/images/logo/adidas.png',
  'New Balance': '/images/logo/new-balance.png',
  'Louis Vuitton': '/images/logo/Louis-Vuitton.png',
  'Skechers': '/images/logo/skechers.png',
  'Crocs': '/images/logo/crocs.png',
  'Asics': '/images/logo/asics.png',
  'Reebok': '/images/logo/reebok.png'
};

const BrandSlider: React.FC = () => {
  const navigate = useNavigate();

  const { data: brands = [], isLoading } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: () => brandsAPI.getAllBrands()
  });

  const handleBrandClick = (brand: Brand) => {
    // Scroll to top before navigation
    window.scrollTo(0, 0);
    navigate(`/brand-products/${encodeURIComponent(brand.name)}`);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-slider w-full bg-white py-8 overflow-hidden" style={{border: 'none', boxShadow: 'none'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="infinite-scroll-container">
          <div className="infinite-scroll-content">
            {[...brands, ...brands].map((brand, index) => (
              <div
                key={`${brand._id}-${index}`}
                onClick={() => handleBrandClick(brand)}
                className="flex-shrink-0 w-48 h-24 mx-4 cursor-pointer transform transition-transform hover:scale-105"
              >
                <img
                  src={brandLogos[brand.name as keyof typeof brandLogos] || brand.logo}
                  alt={brand.name}
                  className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandSlider; 