// Run with: npm run seed
// Populates the database with sample categories and products for local development/demo.
// Safe to re-run: it clears only Category and Product collections, not users/orders/admins.

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const categories = [
  { name: 'Electronics', image: 'https://picsum.photos/seed/electronics/400/300' },
  { name: 'Fashion', image: 'https://picsum.photos/seed/fashion/400/300' },
  { name: 'Home & Kitchen', image: 'https://picsum.photos/seed/homekitchen/400/300' },
  { name: 'Beauty & Personal Care', image: 'https://picsum.photos/seed/beauty/400/300' },
  { name: 'Sports & Fitness', image: 'https://picsum.photos/seed/sports/400/300' },
];

const productTemplates = [
  { name: 'Wireless Bluetooth Earbuds', cat: 'Electronics', price: 2499, discountPrice: 1499, stock: 40, desc: 'True wireless earbuds with noise isolation, 20-hour battery life and touch controls.' },
  { name: 'Smart Fitness Band', cat: 'Electronics', price: 1999, discountPrice: 1299, stock: 25, desc: 'Track steps, heart rate, and sleep with this lightweight fitness band.' },
  { name: '65W Fast Charger Adapter', cat: 'Electronics', price: 999, discountPrice: 649, stock: 60, desc: 'Compact GaN fast charger compatible with most phones and laptops.' },
  { name: 'Portable Bluetooth Speaker', cat: 'Electronics', price: 2999, discountPrice: 1999, stock: 15, desc: 'Deep bass portable speaker with 12-hour playback and IPX5 water resistance.' },
  { name: "Men's Cotton Casual Shirt", cat: 'Fashion', price: 1299, discountPrice: 799, stock: 50, desc: 'Breathable 100% cotton casual shirt, regular fit, machine washable.' },
  { name: "Women's Ethnic Kurta Set", cat: 'Fashion', price: 1799, discountPrice: 1099, stock: 30, desc: 'Elegant printed kurta with matching bottoms, perfect for daily and festive wear.' },
  { name: 'Unisex Running Shoes', cat: 'Fashion', price: 2499, discountPrice: 1699, stock: 45, desc: 'Lightweight cushioned running shoes with breathable mesh upper.' },
  { name: 'Leather Wallet for Men', cat: 'Fashion', price: 899, discountPrice: 549, stock: 70, desc: 'Genuine leather bi-fold wallet with multiple card slots.' },
  { name: 'Non-Stick Cookware Set (5 pcs)', cat: 'Home & Kitchen', price: 3499, discountPrice: 2299, stock: 20, desc: '5-piece non-stick cookware set suitable for all stovetops including induction.' },
  { name: 'Stainless Steel Water Bottle 1L', cat: 'Home & Kitchen', price: 699, discountPrice: 449, stock: 80, desc: 'Double-walled insulated bottle that keeps water cold for 24 hours.' },
  { name: 'LED Study Table Lamp', cat: 'Home & Kitchen', price: 1199, discountPrice: 799, stock: 35, desc: 'Adjustable LED lamp with 3 brightness modes and USB charging port.' },
  { name: 'Cotton Bedsheet with 2 Pillow Covers', cat: 'Home & Kitchen', price: 1499, discountPrice: 899, stock: 40, desc: 'Soft cotton double bedsheet set with elegant prints.' },
  { name: 'Herbal Face Wash 150ml', cat: 'Beauty & Personal Care', price: 349, discountPrice: 249, stock: 100, desc: 'Gentle herbal face wash suitable for all skin types, free from parabens.' },
  { name: 'Hair Dryer 1200W', cat: 'Beauty & Personal Care', price: 1299, discountPrice: 899, stock: 25, desc: 'Compact hair dryer with cool-shot button and 2 heat settings.' },
  { name: 'Yoga Mat with Carry Strap', cat: 'Sports & Fitness', price: 999, discountPrice: 649, stock: 55, desc: '6mm thick anti-slip yoga mat, lightweight and easy to carry.' },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing categories and products');

    const createdCategories = {};
    for (const cat of categories) {
      const created = await Category.create({ name: cat.name, image: cat.image, status: 'active' });
      createdCategories[cat.name] = created._id;
    }
    console.log(`Created ${categories.length} categories`);

    let skuCounter = 1001;
    const productsToInsert = productTemplates.map((p, index) => ({
      name: p.name,
      shortDescription: p.desc.slice(0, 90),
      description: p.desc,
      price: p.price,
      discountPrice: p.discountPrice,
      images: [`https://picsum.photos/seed/product${index + 1}/500/500`],
      category: createdCategories[p.cat],
      stock: p.stock,
      sku: `SZ-${skuCounter++}`,
      status: 'active',
    }));

    await Product.insertMany(productsToInsert);
    console.log(`Created ${productsToInsert.length} sample products`);

    console.log('\nSeed data created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err.message);
    process.exit(1);
  }
};

run();
