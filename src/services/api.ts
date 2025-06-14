import axios from 'axios';
import { Product, Brand } from '../types';

// Force API URL to use port 5001
const API_URL = `${import.meta.env.VITE_API_URL}/api`;

// Log the final API URL for debugging
console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Making request to:', `${API_URL}${config.url}`, 'with headers:', config.headers);
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // If we get a 401 (Unauthorized) error, clear the token
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.config?.headers,
      error: error.message,
      fullUrl: `${API_URL}${error.config?.url}`
    });
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  updateCart: async (items: Array<{ productId: string; size: string; quantity: number }>) => {
    const response = await api.post('/auth/cart', { items });
    return response.data;
  },
  clearCart: async () => {
    const response = await api.delete('/auth/cart');
    return response.data;
  }
};

// Store Settings API
export const storeSettingsAPI = {
  getStoreSettings: async () => {
    const response = await api.get('/admin/store-settings/public');
    return response.data;
  }
};

export interface ProductQueryOptions {
  brand?: string;
  brandSlug?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
}

// Products API
export const productsAPI = {
  getAllProducts: async (params?: { 
    category?: string; 
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    search?: string;
  }): Promise<Product[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.brand) queryParams.append('brand', params.brand);
      if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.search) queryParams.append('search', params.search);

      const response = await axios.get(`${API_URL}/products?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  getProductById: async (id: string) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },
  createProduct: async (data: any) => {
    const response = await api.post('/products', data);
    return response.data;
  },
  updateProduct: async (id: string, data: any) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  createOrder: async (data: any) => {
    const response = await api.post('/orders', data);
    return response.data;
  },
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id: string, status: string) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  }
};

// Categories API
export const categoriesAPI = {
  getAllCategories: async () => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  getCategoryById: async (id: string) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  }
};

// Brands API
export const brandsAPI = {
  getAllBrands: async (): Promise<Brand[]> => {
      const response = await api.get('/brands');
      return response.data;
  },
  getBrandById: async (id: string) => {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  },
  getBrandBySlug: async (slug: string): Promise<Brand> => {
    if (!slug) {
      throw new Error('Brand slug is required');
    }
    try {
    const response = await api.get(`/brands/slug/${slug}`);
    return response.data;
    } catch (error) {
      console.error(`Error fetching brand with slug ${slug}:`, error);
      throw error;
    }
  },
  createBrand: async (data: any) => {
    const response = await api.post('/brands', data);
    return response.data;
  },
  updateBrand: async (id: string, data: any) => {
    const response = await api.put(`/brands/${id}`, data);
    return response.data;
  },
  deleteBrand: async (id: string) => {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  },
  getAllBrandsAdmin: async () => {
    const response = await api.get('/brands/admin/all');
    return response.data;
  }
};

export default api; 