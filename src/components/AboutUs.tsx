import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Twitter, Mail } from 'lucide-react';
import { storeSettingsAPI } from '../services/api';

interface StoreSettings {
  storeName: string;
  aboutStore: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

const aboutVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const AboutUs: React.FC = () => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

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
          aboutStore: 'At JOOTA JUNCTION, we believe shoes are more than just footwear—they\'re a statement of style, comfort, and confidence. Founded with a passion for quality and a love for fashion, our mission is to bring you the best in modern, comfortable, and affordable shoes for every walk of life.',
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

  if (loading) {
    return (
      <section className="w-full bg-white py-16 px-4 sm:px-8 lg:px-0 flex flex-col items-center">
        <div className="max-w-3xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      className="w-full bg-white py-20 px-4 sm:px-8 lg:px-0 flex flex-col items-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={aboutVariants}
      id="about-us"
    >
      <div className="max-w-4xl text-center">
        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 tracking-tight">
          About {storeSettings?.storeName || 'JOOTA JUNCTION'}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
          {storeSettings?.aboutStore || 'At JOOTA JUNCTION, we believe shoes are more than just footwear—they\'re a statement of style, comfort, and confidence. Founded with a passion for quality and a love for fashion, our mission is to bring you the best in modern, comfortable, and affordable shoes for every walk of life.'}
        </p>
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <div className="bg-gray-50 shadow-xl rounded-2xl p-8 w-full sm:w-1/2 hover:scale-105 transition-all duration-300 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h3>
            <p className="text-gray-600 text-base leading-relaxed">
              Born in the heart of India, {storeSettings?.storeName || 'JOOTA JUNCTION'} started as a small family business and has grown into a trusted destination for shoe lovers nationwide. We blend tradition with innovation, offering a curated selection for men, women, and kids.
            </p>
          </div>
          <div className="bg-gray-50 shadow-xl rounded-2xl p-8 w-full sm:w-1/2 hover:scale-105 transition-all duration-300 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600 text-base leading-relaxed">
              To empower every step you take—whether it's a casual stroll, a busy workday, or a special occasion. We're committed to quality, comfort, and customer happiness, every single day.
            </p>
          </div>
        </motion.div>
        <div className="flex justify-center gap-6 mt-8">
          <a 
            href={storeSettings?.socialMedia?.instagram || "https://instagram.com/jootajunction"} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-900 hover:text-white transition-all duration-300 text-gray-600"
          >
            <Instagram size={24} />
          </a>
          <a 
            href={storeSettings?.socialMedia?.facebook || "https://facebook.com/jootajunction"} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-900 hover:text-white transition-all duration-300 text-gray-600"
          >
            <Facebook size={24} />
          </a>
          <a 
            href={storeSettings?.socialMedia?.twitter || "https://twitter.com/jootajunction"} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-900 hover:text-white transition-all duration-300 text-gray-600"
          >
            <Twitter size={24} />
          </a>
          <a 
            href="mailto:admin@jootajunction.com" 
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-900 hover:text-white transition-all duration-300 text-gray-600"
          >
            <Mail size={24} />
          </a>
        </div>
      </div>
    </motion.section>
  );
};

export default AboutUs; 