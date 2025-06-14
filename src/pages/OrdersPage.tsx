import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, Clock, Truck, CheckCircle, XCircle, MapPin, CreditCard, Calendar, Star } from 'lucide-react';
import Header from '../components/Header';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { API_URL } from '../config';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    brand: string;
    hasReview?: boolean;
  };
  size: number;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  totalPrice: number;
  shippingPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [reviewModal, setReviewModal] = useState<{orderId: string, productId: string} | null>(null);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [productReviews, setProductReviews] = useState<{[key: string]: boolean}>({});

  // Reset review form state when a new product is selected
  const handleReviewClick = (orderId: string, productId: string) => {
    setReviewModal({ orderId, productId });
    setReviewImages([]);
    setReviewMessage('');
    setReviewRating(0);
    setReviewError(null);
    setReviewSuccess(false);
  };

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    fetchOrders();
    fetchProductReviews();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/', { replace: true });
        return;
      }
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched orders:', data);
        
        // Validate and clean the data
        const validatedOrders = data.map((order: Order) => ({
          ...order,
          items: order.items.map((item: OrderItem) => ({
            ...item,
            product: item.product || {
              _id: 'unknown',
              name: 'Product Unavailable',
              price: item.price,
              images: [],
              brand: 'Unknown Brand'
            }
          }))
        }));
        
        setOrders(validatedOrders);
      } else if (response.status === 401) {
        // Handle unauthorized access
        navigate('/', { replace: true });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch orders:', response.status, errorData);
        setError(errorData.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/reviews/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const reviewsMap = data.reviews.reduce((acc: {[key: string]: boolean}, review: any) => {
          acc[review.product] = true;
          return acc;
        }, {});
        setProductReviews(reviewsMap);
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
    case 'processing':
        return <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />;
    case 'shipped':
        return <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />;
    case 'delivered':
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />;
    default:
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />;
  }
};

  const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Pending';
      case 'processing':
        return 'Processing Order';
      case 'shipped':
        return 'Order Shipped';
      case 'delivered':
        return 'Order Delivered';
      case 'cancelled':
        return 'Order Cancelled';
      default:
        return 'Unknown Status';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReviewSubmit = async () => {
    if (!reviewModal) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('productId', reviewModal.productId);
      formData.append('orderId', reviewModal.orderId);
      formData.append('message', reviewMessage);
      formData.append('rating', reviewRating.toString());
      reviewImages.forEach((file) => formData.append('images', file));
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit review');
      }
      setProductReviews(prev => ({
        ...prev,
        [reviewModal.productId]: true
      }));
      setReviewSuccess(true);
      setReviewModal(null);
      setReviewImages([]);
      setReviewMessage('');
      setReviewRating(0);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-sm sm:text-base text-gray-600">Track your order status and history</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {orders.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Start shopping to see your order history here</p>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="space-y-3 sm:space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 sm:space-x-4">
                        {item.product ? (
                          <>
                            <img
                              src={item.product.images && item.product.images.length > 0 ? 
                                (item.product.images[0].startsWith('/uploads/products') ? 
                                  `${API_URL}${item.product.images[0]}` : 
                                  item.product.images[0]) : 
                                '/placeholder-image.jpg'}
                              alt={item.product.name || 'Product'}
                              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.jpg';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                {item.product.name || 'Product Name Unavailable'}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {item.product.brand || 'Brand Unavailable'}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                Product Information Unavailable
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
                            </div>
                          </>
                        )}
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{formatCurrency(item.price)}</p>
                          {order.status === 'delivered' && item.product && (
                            <button
                              className={`mt-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                productReviews[item.product._id]
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed pointer-events-none'
                                  : 'bg-black text-white border-black hover:bg-gray-900 focus:ring-black'
                              }`}
                              onClick={() => !productReviews[item.product._id] && handleReviewClick(order._id, item.product._id)}
                              disabled={productReviews[item.product._id]}
                              aria-disabled={productReviews[item.product._id]}
                            >
                              {productReviews[item.product._id] ? 'Reviewed' : 'Review'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Shipping Address */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center text-sm sm:text-base">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        Shipping Address
                      </h4>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                        <p>{order.shippingAddress.country}</p>
                      </div>
                    </div>

                    {/* Payment & Total */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center text-sm sm:text-base">
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        Payment Details
                      </h4>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p>Method: {order.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                        <p>Subtotal: {formatCurrency(order.totalPrice - order.shippingPrice)}</p>
                        <p>Shipping: {formatCurrency(order.shippingPrice)}</p>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                          Total: {formatCurrency(order.totalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>Share your experience with this product. Please rate, write a message, and upload images if you wish.</DialogDescription>
          <div className="bg-white rounded-lg shadow-lg max-w-md mx-auto">
            <div className="p-4 sm:p-6">
              <label className="block mb-2 font-medium">Rating</label>
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map((star) => (
                  <button key={star} type="button" onClick={() => setReviewRating(star)}>
                    <Star className={`h-6 w-6 ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-300'}`} fill={reviewRating >= star ? '#facc15' : 'none'} />
                  </button>
                ))}
              </div>
              <label className="block mb-2 font-medium">Message</label>
              <textarea 
                className="w-full border rounded p-2 mb-4 min-h-[100px]" 
                rows={3} 
                value={reviewMessage} 
                onChange={e => setReviewMessage(e.target.value)} 
              />
              <label className="block mb-2 font-medium">Upload Images</label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={e => setReviewImages(Array.from(e.target.files || []))} 
                className="mb-4 w-full" 
              />
              {reviewError && <div className="text-red-600 mb-2">{reviewError}</div>}
              <button 
                className="bg-black text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-gray-900 transition-colors border border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 w-full" 
                onClick={handleReviewSubmit} 
                disabled={reviewLoading}
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage; 