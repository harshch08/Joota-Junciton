import React from 'react';
import { Phone, Mail, MapPin, Clock, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We'd love to hear from you! Whether you have a question about your order, need help with sizing, or just want to say hi — our team is here to help.
          </p>
        </div>

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Customer Service */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-black p-3 rounded-full">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Service</h2>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600">Phone: +91 7830964108</p>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <p>Monday – Friday, 9 AM – 6 PM (IST)</p>
              </div>
            </div>
          </motion.div>

          {/* Email */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-black p-3 rounded-full">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Email Us</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">General Inquiries</p>
                <p className="text-gray-600">info@jootajunction.com</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Returns & Exchanges</p>
                <p className="text-gray-600">info@jootajunction.com</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">We typically respond within 24 hours on business days.</p>
            </div>
          </motion.div>

          {/* Store Address */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-black p-3 rounded-full">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Store Address</h2>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600">
                Joota Junction<br />
                Near Roadways, Sitarganj<br />
                U.S.Nagar, Uttarakhand-262405
              </p>
            </div>
          </motion.div>

          {/* Business Inquiries */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-black p-3 rounded-full">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Wholesale or Business Inquiries</h2>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600">
                Interested in carrying our products or collaborating with us? Email us at:
              </p>
              <a 
                href="mailto:info@jootajunction.com"
                className="text-black font-semibold hover:text-gray-700 transition-colors"
              >
                info@jootajunction.com
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs; 