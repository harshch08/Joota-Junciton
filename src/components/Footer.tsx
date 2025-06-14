import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, ArrowUp } from 'lucide-react';
import { storeSettingsAPI } from '../services/api';

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Brand & Social */}
          <div className="flex flex-col items-center md:items-start gap-6">
            <span className="text-3xl font-black tracking-tight">
              {storeSettings?.storeName || 'JOOTA JUNCTION'}
            </span>
            <p className="text-gray-400 text-sm max-w-md text-center md:text-left">
              Your premier destination for stylish and comfortable footwear. We bring you the best in modern, comfortable, and affordable shoes for every walk of life.
            </p>
            <div className="flex gap-4 mt-2">
              <a 
                href={storeSettings?.socialMedia?.instagram || "https://instagram.com/jootajunction"}
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 rounded-full bg-gray-800 hover:bg-white hover:text-gray-900 transition-all duration-300 group"
              >
                <Instagram size={20} />
              </a>
              <a 
                href={storeSettings?.socialMedia?.facebook || "https://facebook.com/jootajunction"}
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 rounded-full bg-gray-800 hover:bg-white hover:text-gray-900 transition-all duration-300 group"
              >
                <Facebook size={20} />
              </a>
              <a 
                href={storeSettings?.socialMedia?.twitter || "https://twitter.com/jootajunction"}
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 rounded-full bg-gray-800 hover:bg-white hover:text-gray-900 transition-all duration-300 group"
              >
                <Twitter size={20} />
              </a>
              <a 
                href={`mailto:${primaryEmail}`}
                className="p-3 rounded-full bg-gray-800 hover:bg-white hover:text-gray-900 transition-all duration-300 group"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="text-center md:text-right">
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                  <Mail size={18} className="text-gray-400" />
                  <span className="text-sm">{primaryEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                  <Phone size={18} className="text-gray-400" />
                  <span className="text-sm">{primaryPhone}</span>
                </div>
                {primaryAddress && (
                  <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                    <MapPin size={18} className="text-gray-400" />
                    <span className="text-sm">{primaryAddress.street}, {primaryAddress.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-gray-800 w-full mb-8"></div>
        
        {/* Copyright */}
        <div className="text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} {storeSettings?.storeName || 'JOOTA JUNCTION'}. All rights reserved.
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