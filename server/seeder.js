const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const products = [
  {
    name: "Nike Air Max 270",
    brand: "Nike",
    category: "Running",
    price: 150,
    description: "The Nike Air Max 270 delivers visible cushioning under every step with a large window and fresh colorways.",
    images: [
      "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/skwgyqrbfzhu6uyeh0gg/air-max-270-mens-shoes-KkLcGR.png"
    ],
    sizes: [
      { size: 7, stock: 10 },
      { size: 8, stock: 15 },
      { size: 9, stock: 20 },
      { size: 10, stock: 15 },
      { size: 11, stock: 10 }
    ],
    featured: true,
    rating: 4.5
  },
  {
    name: "Adidas Ultraboost 22",
    brand: "Adidas",
    category: "Running",
    price: 180,
    description: "The Ultraboost 22 features a responsive Boost midsole and a Primeknit upper for a snug, sock-like fit.",
    images: [
      "https://assets.adidas.com/images/w_600,f_auto,q_auto/2c1a0a0a0a0a0a0a0a0a0a0a0a0a0a0a/ultraboost-22-shoes.jpg"
    ],
    sizes: [
      { size: 7, stock: 8 },
      { size: 8, stock: 12 },
      { size: 9, stock: 15 },
      { size: 10, stock: 12 },
      { size: 11, stock: 8 }
    ],
    featured: true,
    rating: 4.7
  },
  {
    name: "New Balance 574",
    brand: "New Balance",
    category: "Casual",
    price: 100,
    description: "The 574 is a classic New Balance sneaker that combines comfort and style for everyday wear.",
    images: [
      "https://nb.scene7.com/is/image/NB/m5740gr_nb_02_i"
    ],
    sizes: [
      { size: 7, stock: 10 },
      { size: 8, stock: 15 },
      { size: 9, stock: 20 },
      { size: 10, stock: 15 },
      { size: 11, stock: 10 }
    ],
    featured: false,
    rating: 4.3
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log('Products seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts(); 