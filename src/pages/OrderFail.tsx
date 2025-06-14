import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const OrderFail: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6 text-center">
          Unfortunately, your payment was not successful. No order has been placed. Please try again or use a different payment method.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OrderFail; 