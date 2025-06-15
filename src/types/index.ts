export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  orders?: Array<{
    _id: string;
    items: Array<{
      product: string;
      quantity: number;
      size: string;
    }>;
  }>;
}

export interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  sizes: Array<{
    size: number;
    stock: number;
  }>;
  featured: boolean;
  rating: number;
  reviews: Array<{
    user: User;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface Review {
  _id: string;
  product: string;
  user: User;
  order: string;
  images: string[];
  message: string;
  rating: number;
  createdAt: string;
}

export interface Order {
  _id: string;
  user: string;
  items: Array<{
    product: string;
    quantity: number;
    size: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  bgColor?: string; // Deprecated: No longer used for logo display
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
} 