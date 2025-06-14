import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brand } from '../types';
import { ArrowRight } from 'lucide-react';

// Brand to shoe image mapping using local images
const brandShoeImages = {
  'Nike': '/images/shoes/nike shoes.png',
  'Puma': '/images/shoes/puma shoes.png',
  'Adidas': '/images/shoes/adidas shoes.png',
  'New Balance': '/images/shoes/new balance shos.png'
};

// Brand to logo image mapping
const brandLogos = {
  'Nike': '/images/logo/nike.png',
  'Puma': '/images/logo/puma.png',
  'Adidas': '/images/logo/adidas.png',
  'New Balance': '/images/logo/new-balance.png'
};

// Brand to background color mapping
const brandColors = {
  'Nike': '#FFE066',        // modern light yellow
  'Puma': '#FFB74D',       // modern light orange
  'Adidas': '#40C4FF',     // light blue
  'New Balance': '#69F0AE',// modern light green
  'Yeezy': '#1DE9B6',      // turquoise
  'Jordan': '#FFE066'      // modern light yellow (as example)
};

interface BrandCardProps {
  brand: Brand;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Scroll to top before navigation
    window.scrollTo(0, 0);
    navigate(`/brand-products/${encodeURIComponent(brand.name)}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex sm:flex-row flex-col items-center justify-center w-full h-full p-4 sm:p-6"
      style={{ 
        aspectRatio: '2/1',
        backgroundColor: brandColors[brand.name as keyof typeof brandColors] || '#ffffff',
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOCA5Ljk0IDAgMTgtOC4wNTkgMTgtMTgiIGZpbGw9IiMwMDAiLz48L2c+PC9zdmc+')] opacity-20"></div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Content */}
      <div className="relative h-full flex items-center p-4 sm:p-6">
        {/* Brand Logo (top on mobile, left on desktop) */}
        <div className="sm:w-1/3 w-full flex items-center justify-center" style={brand.name === 'Adidas' ? { marginRight: '1.5rem' } : {}}>
          <img
            src={brandLogos[brand.name as keyof typeof brandLogos]}
            alt={`${brand.name} logo`}
            className="object-contain"
            style={{
              height: brand.name === 'Adidas' ? '4.2rem' : '5rem',
              maxHeight: brand.name === 'Adidas' ? '4.2rem' : '5rem',
              maxWidth: brand.name === 'Adidas' ? '80%' : '90%'
            }}
          />
        </div>

        {/* Shoe Image (bottom on mobile, right on desktop) */}
        <div className="sm:w-2/3 w-full flex items-center justify-center">
          <img
            src={brandShoeImages[brand.name as keyof typeof brandShoeImages]}
            alt={`${brand.name} shoe`}
            className="h-20 sm:h-[170%] object-contain transform transition-transform duration-500 group-hover:scale-110"
            style={{ maxWidth: '95%' }}
          />
        </div>
      </div>

      {/* Border Glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
        boxShadow: '0 0 20px rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}></div>
    </div>
  );
};

export default BrandCard; 