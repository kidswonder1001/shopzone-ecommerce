const Product = require('../models/Product');

// @desc  Get products with search, filters, sorting, pagination
// @route GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      page = 1,
      limit = 12,
      admin, // 'true' when called from admin panel (shows inactive too)
    } = req.query;

    const filter = {};

    if (admin !== 'true') {
      filter.status = 'active';
    } else if (req.query.status) {
      filter.status = req.query.status;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    let sortOption = { createdAt: -1 }; // newest first (default)
    if (sort === 'price_low') sortOption = { discountPrice: 1, price: 1 };
    if (sort === 'price_high') sortOption = { discountPrice: -1, price: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).populate('category', 'name slug').sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single product by id or slug
// @route GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate('category', 'name slug');
    } else {
      product = await Product.findOne({ slug: id }).populate('category', 'name slug');
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc  Create product (admin)
// @route POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      shortDescription,
      description,
      price,
      discountPrice,
      category,
      stock,
      sku,
      status,
      images,
    } = req.body;

    if (!name || !description || !price || !category || stock === undefined || !sku) {
      return res.status(400).json({ success: false, message: 'Missing required product fields' });
    }

    const product = await Product.create({
      name,
      shortDescription,
      description,
      price,
      discountPrice: discountPrice || undefined,
      category,
      stock,
      sku,
      status: status || 'active',
      images: images && images.length ? images : [],
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc  Update product (admin)
// @route PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const fields = [
      'name',
      'shortDescription',
      'description',
      'price',
      'discountPrice',
      'category',
      'stock',
      'sku',
      'status',
      'images',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete product (admin)
// @route DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc  Upload product image(s) (admin)
// @route POST /api/products/upload
const uploadProductImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files uploaded' });
    }
    const filenames = req.files.map((f) => `/uploads/${f.filename}`);
    res.json({ success: true, images: filenames });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
};
