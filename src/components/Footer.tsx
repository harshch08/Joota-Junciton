import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, ArrowUp } from 'lucide-react';
import { storeSettingsAPI } from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface StoreSettings {
  storeName: string;
  contactEmails: Array<{
    email: string;
    label: string;
    isActive: boolean;
  }>;
  phoneNumbers: Array<{
    number: string;
    label: string;
    isActive: boolean;
  }>;
  addresses: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    label: string;
    isActive: boolean;
  }>;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      // Show button when user scrolls down more than 300px
      const scrollTop = window.scrollY;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Cleanup event listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const settings = await storeSettingsAPI.getStoreSettings();
        setStoreSettings(settings);
      } catch (error) {
        console.error('Error fetching store settings:', error);
        // Use default values if API fails
        setStoreSettings({
          storeName: 'JOOTA JUNCTION',
          contactEmails: [{ email: 'admin@jootajunction.com', label: 'General', isActive: true }],
          phoneNumbers: [{ number: '+91 98765 43210', label: 'General', isActive: true }],
          addresses: [{
            street: '123 Fashion Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            country: 'India',
            label: 'Main Office',
            isActive: true
          }],
          socialMedia: {
            facebook: 'https://facebook.com/jootajunction',
            instagram: 'https://instagram.com/jootajunction',
            twitter: 'https://twitter.com/jootajunction',
            linkedin: 'https://linkedin.com/company/jootajunction'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStoreSettings();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleAboutClick = () => {
    if (location.pathname !== '/') {
      // If not on homepage, navigate to homepage first
      navigate('/');
      // Wait for navigation and page load to complete before scrolling
      setTimeout(() => {
        const scrollToAbout = () => {
          const aboutSection = document.getElementById('about-us');
          if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
          } else {
            // If section not found, try again after a short delay
            setTimeout(scrollToAbout, 100);
          }
        };
        scrollToAbout();
      }, 500); // Increased timeout to ensure page is loaded
    } else {
      // If already on homepage, just scroll
      const aboutSection = document.getElementById('about-us');
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (loading) {
    return (
      <footer className={`w-full bg-gray-900 text-white py-12 px-4 ${className}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </footer>
    );
  }

  const primaryEmail = storeSettings?.contactEmails?.[0]?.email || 'admin@jootajunction.com';
  const primaryPhone = storeSettings?.phoneNumbers?.[0]?.number || '+91 98765 43210';
  const primaryAddress = storeSettings?.addresses?.[0];

  return (
    <footer className={`w-full bg-gray-900 text-white py-16 px-4 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand & Social */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold mb-4">
              {storeSettings?.storeName || 'JOOTA JUNCTION'}
            </h3>
            <p className="text-gray-400 mb-6 text-sm sm:text-base">
              Your one-stop destination for premium footwear. Quality, comfort, and style in every step.
            </p>
            <div className="flex justify-center sm:justify-start space-x-4">
              <a 
                href={storeSettings?.socialMedia?.instagram || "https://instagram.com/jootajunction"}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href={storeSettings?.socialMedia?.facebook || "https://facebook.com/jootajunction"}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href={storeSettings?.socialMedia?.twitter || "https://twitter.com/jootajunction"}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Home</Link>
              </li>
              <li>
                <Link to="/brands" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Brands</Link>
              </li>
              <li>
                <button 
                  onClick={handleAboutClick}
                  className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                >
                  About Us
                </button>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-center sm:justify-start text-gray-400">
                <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">{primaryPhone}</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start text-gray-400">
                <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">{primaryEmail}</span>
              </li>
              {primaryAddress && (
                <li className="flex items-center justify-center sm:justify-start text-gray-400">
                  <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{primaryAddress.street}, {primaryAddress.city}</span>
                </li>
              )}
            </ul>
          </div>
          
          {/* Policies */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold mb-4">Policies</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/terms-and-conditions" 
                  className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy-policy" 
                  className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                >
                  Cancellations and Refunds
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm sm:text-base">&copy; {new Date().getFullYear()} {storeSettings?.storeName || 'JOOTA JUNCTION'}. All rights reserved.</p>
        </div>
      </div>
      
      {/* Go to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-20 md:bottom-6 right-6 p-3 rounded-full bg-white hover:bg-gray-100 text-gray-900 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group z-40 ${
          showScrollTop 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Go to top"
      >
        <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
      </button>
    </footer>
  );
};

export default Footer; 