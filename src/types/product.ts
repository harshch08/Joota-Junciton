export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;  // Optional sale price
  images: string[];
  brand: string;
  category: string;
  sizes: {
    size: string;
    stock: number;
  }[];
  createdAt: string;
  updatedAt: string;
} 