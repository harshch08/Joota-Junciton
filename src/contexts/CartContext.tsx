import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

interface CartItem {
    id: string;
    name: string;
    price: number;
  image: string;
  size: string;
  brand: string;
  quantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string, size: string) => void;
  updateQuantity: (itemId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Load cart from MongoDB when user logs in
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        try {
          const response = await authAPI.getProfile();
          if (response.cart) {
            const cartItems = response.cart.map((item: any) => {
              const imageUrl = item.productId.images[0];
              const processedImage = imageUrl.startsWith('/uploads/products')
                ? `http://localhost:5001${imageUrl}`
                : imageUrl;

              return {
                id: item.productId._id,
                name: item.productId.name,
                price: item.productId.price,
                image: processedImage,
                size: item.size,
                brand: item.productId.brand,
                quantity: item.quantity
              };
            });
            setItems(cartItems);
          }
        } catch (error) {
          console.error('Error loading cart:', error);
        }
      } else {
        setItems([]);
      }
    };

    loadCart();
  }, [user]);

  const syncCartWithServer = async (updatedItems: CartItem[]) => {
    if (user) {
      try {
        console.log('Syncing cart with server:', updatedItems);
        const cartData = updatedItems.map(item => ({
          productId: item.id,
          size: item.size,
          quantity: item.quantity || 1
        }));
        console.log('Sending cart data:', cartData);
        const response = await authAPI.updateCart(cartData);
        console.log('Server response:', response);
      } catch (error) {
        console.error('Error syncing cart with server:', error);
        // Optionally show an error message to the user
      }
    }
  };

  const addToCart = async (item: CartItem) => {
    console.log('Adding item to cart:', item);
    
    try {
      // Check stock availability before adding to cart
      const response = await fetch(`${API_URL}/api/products/${item.id}`);
      if (response.ok) {
        const product = await response.json();
        const sizeObj = product.sizes?.find((s: any) => s.size === parseInt(item.size));
        
        if (!sizeObj) {
          alert(`Size ${item.size} is not available for this product.`);
          return;
        }
        
        if (sizeObj.stock === 0) {
          alert(`Size ${item.size} is out of stock.`);
          return;
        }
        
        const requestedQuantity = item.quantity || 1;
        if (sizeObj.stock < requestedQuantity) {
          alert(`Sorry, only ${sizeObj.stock} items available in size ${item.size}.`);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking stock availability:', error);
      // Continue with adding to cart if stock check fails
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(
        i => i.id === item.id && i.size === item.size
      );

      // Process image URL
      const processedImage = item.image.startsWith('/uploads/products') 
        ? `http://localhost:5001${item.image}`
        : item.image;

      let updatedItems;
      if (existingItem) {
        console.log('Updating existing item quantity');
        updatedItems = prevItems.map(i =>
          i.id === item.id && i.size === item.size
            ? { ...i, quantity: (i.quantity || 1) + 1 }
            : i
        );
      } else {
        console.log('Adding new item to cart');
        updatedItems = [...prevItems, { ...item, image: processedImage, quantity: 1 }];
      }

      console.log('Updated cart items:', updatedItems);
      syncCartWithServer(updatedItems);
      return updatedItems;
    });
  };

  const removeFromCart = (itemId: string, size: string) => {
    setItems(prevItems => {
      const updatedItems = prevItems.filter(item => !(item.id === itemId && item.size === size));
      syncCartWithServer(updatedItems);
      return updatedItems;
    });
  };

  const updateQuantity = async (itemId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId, size);
      return;
    }

    try {
      // Check stock availability before updating quantity
      const response = await fetch(`${API_URL}/api/products/${itemId}`);
      if (response.ok) {
        const product = await response.json();
        const sizeObj = product.sizes?.find((s: any) => s.size === parseInt(size));
        
        if (sizeObj && sizeObj.stock < quantity) {
          alert(`Sorry, only ${sizeObj.stock} items available in size ${size}.`);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking stock availability:', error);
      // Continue with updating quantity if stock check fails
    }

    setItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === itemId && item.size === size
          ? { ...item, quantity }
          : item
      );
      syncCartWithServer(updatedItems);
      return updatedItems;
    });
  };

  const clearCart = async () => {
    if (user) {
      try {
        await authAPI.clearCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };

  // Calculate total whenever items change
  const total = getTotalPrice();

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
