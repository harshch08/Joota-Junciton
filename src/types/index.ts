export interface Product {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  brand: string;
  description: string;
  features?: string[];
  sizes: Array<{
    size: number;
    stock: number;
  }>;
  category?: string;
  rating?: number;
  reviews?: any[];
  featured?: boolean;
  createdAt?: string;
  __v?: number;
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