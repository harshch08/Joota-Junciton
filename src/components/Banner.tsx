import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Banner: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleShopNow = () => {
    const featuredSection = document.getElementById('featured-section');
    if (featuredSection) {
      featuredSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full bg-white overflow-hidden">
      {/* Desktop Banner */}
      <div className="hidden md:block">
        <div className="relative h-[700px] w-full" style={{ background: 'radial-gradient(circle at 60% 50%, #145a84 0%, #0f4e73 100%)' }}>
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOCA5Ljk0IDAgMTgtOC4wNTkgMTgtMTgiIGZpbGw9IiMwMDAiLz48L2c+PC9zdmc+')] opacity-20 animate-pulse"></div>
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className={`w-1/2 text-white space-y-8 transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-300 tracking-wider">PREMIUM COLLECTION</h2>
                <h1 className="text-6xl font-bold leading-tight">
                  Step Into <br />
                  <span className="text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">Excellence</span>
                </h1>
              </div>
              <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
                Discover our premium collection of shoes designed for performance and style. Experience the perfect blend of comfort and innovation.
              </p>
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleShopNow}
                  className="group inline-flex items-center space-x-2 bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                
              </div>
            </div>

            {/* Shoe Images */}
            <div className={`absolute right-0 bottom-0 w-1/2 h-full transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
              <div className="relative h-full">
                {/* Removed bg-gradient-to-l from-gray-900/50 to-transparent overlay */}
                <div className={`absolute bottom-0 right-0 h-[95%] w-auto max-w-[700px] transform -rotate-6 transition-all duration-1000 ${imageLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                  <img
                    src="/banner1.png"
                    alt="Running Shoes"
                    className="h-full w-full object-contain transform hover:scale-105 transition-transform duration-700 ease-out drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    onLoad={() => setImageLoaded(true)}
                  />
                </div>
                {/* Loading Placeholder */}
                {!imageLoaded && (
                  <div className="absolute bottom-0 right-0 h-[85%] w-full flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                {/* Floating Elements */}
                <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Banner */}
      <div className="md:hidden">
        <div className="relative min-h-[700px] w-full overflow-hidden" style={{ background: 'radial-gradient(circle at 60% 50%, #145a84 0%, #0f4e73 100%)' }}>
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOCA5Ljk0IDAgMTgtOC4wNTkgMTgtMTgiIGZpbGw9IiMwMDAiLz48L2c+PC9zdmc+')] opacity-20 animate-pulse"></div>
          </div>

          {/* Content */}
          <div className="relative px-6 py-12 flex flex-col items-center">
            <div className={`w-full max-w-sm space-y-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
              <div className="space-y-4 text-center">
                <h2 className="text-lg font-medium text-gray-300 tracking-wider">PREMIUM COLLECTION</h2>
                <h1 className="text-5xl font-bold text-white leading-tight">
                  Step Into <br />
                  <span className="text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">Excellence</span>
                </h1>
              </div>
              <p className="text-lg text-gray-300 max-w-sm mx-auto leading-relaxed">
                Discover our premium collection of shoes designed for performance and style.
              </p>
              <div className="flex flex-col items-center space-y-4">
                <button
                  onClick={handleShopNow}
                  className="group inline-flex items-center space-x-2 bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full justify-center"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              
              </div>
            </div>

            {/* Shoe Image */}
            <div className={`relative w-full h-[450px] mt-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="relative h-full">
                {/* Removed bg-gradient-to-t gradient overlay */}
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 -rotate-6 h-full w-full transition-all duration-1000 ${imageLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                  <img
                    src="/banner1.png"
                    alt="Running Shoes"
                    className="h-full w-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    onLoad={() => setImageLoaded(true)}
                  />
                </div>
                {/* Loading Placeholder */}
                {!imageLoaded && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-full w-full flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                {/* Floating Elements */}
                <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-white/5 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-1/3 left-1/4 w-20 h-20 bg-white/5 rounded-full blur-xl animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner; 