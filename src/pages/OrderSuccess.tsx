import React from 'react';
import { CheckCircle, Package, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, total, customerName } = location.state || { orderId: 'N/A', total: 0, customerName: 'Customer' };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">Thank you for your purchase, {customerName}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Order ID</span>
              <span className="font-mono text-sm font-semibold">{orderId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-sm text-gray-600">
              <Package className="h-4 w-4 mr-3" />
              <span>Your order will be shipped within 2-3 business days</span>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="h-5 w-5" />
                <span>Continue Shopping</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              A confirmation email has been sent to your email address with order details and tracking information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
