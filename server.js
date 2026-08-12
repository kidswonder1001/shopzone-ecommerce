const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// Core middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads folder (serves product images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the customer frontend and admin panel as static sites.
// This keeps the whole project runnable from one server for the starter package.
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SHOPZONE API is running' });
});

// 404 handler for unmatched API routes only (frontend routes are static files)
app.use('/api', notFound);

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SHOPZONE server running on port ${PORT}`);
});
